/**
 * HashiCorp Vault KMS Client (Mock)
 * Handles DEK wrapping/unwrapping
 * 
 * TODO: Replace with real Vault client or HSM integration
 */

const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const VAULT_URL = process.env.VAULT_URL || 'http://localhost:8200';
const KEYSTORE_PATH = path.join(__dirname, '../keystore');

// In-memory keystore for PoC (replace with Vault API in production)
const keystore = new Map();

/**
 * Initialize keystore directory
 */
async function initKeystore() {
    try {
        await fs.mkdir(KEYSTORE_PATH, { recursive: true });
    } catch (error) {
        // Directory exists, ignore
    }
}

/**
 * Get or create user's wrapping key
 * In production, this would be stored in Vault
 */
async function getUserWrappingKey(userId) {
    if (keystore.has(userId)) {
        return keystore.get(userId);
    }

    // Generate RSA keypair for wrapping (PoC)
    // In production, use Vault's transit engine or HSM
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    const keyPair = { publicKey, privateKey };
    keystore.set(userId, keyPair);

    // Persist to disk for PoC (remove in production)
    await initKeystore();
    await fs.writeFile(
        path.join(KEYSTORE_PATH, `${userId}.json`),
        JSON.stringify(keyPair),
        'utf8'
    );

    return keyPair;
}

/**
 * Wrap (encrypt) a DEK using user's public key
 * @param {Buffer} dek - Data Encryption Key
 * @param {string} userId - User/org identifier
 * @returns {Buffer} Wrapped (encrypted) DEK
 */
async function wrapKey(dek, userId) {
    try {
        // Try Vault API first (if available)
        try {
            const response = await axios.post(
                `${VAULT_URL}/v1/transit/encrypt/${userId}`,
                { plaintext: dek.toString('base64') },
                { timeout: 5000 }
            );
            return Buffer.from(response.data.data.ciphertext, 'base64');
        } catch (vaultError) {
            // Fallback to local keystore (PoC)
            console.log(`Vault unavailable, using local keystore for ${userId}`);
        }

        // Local wrapping using RSA-OAEP
        const keyPair = await getUserWrappingKey(userId);
        const wrapped = crypto.publicEncrypt(
            {
                key: keyPair.publicKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256'
            },
            dek
        );

        return wrapped;

    } catch (error) {
        console.error(`Error wrapping key for ${userId}:`, error);
        throw new Error(`Failed to wrap key: ${error.message}`);
    }
}

/**
 * Unwrap (decrypt) a DEK using user's private key
 * @param {Buffer} wrappedDEK - Wrapped DEK
 * @param {string} userId - User/org identifier
 * @returns {Buffer} Unwrapped DEK
 */
async function unwrapKey(wrappedDEK, userId) {
    try {
        // Try Vault API first
        try {
            const response = await axios.post(
                `${VAULT_URL}/v1/transit/decrypt/${userId}`,
                { ciphertext: wrappedDEK.toString('base64') },
                { timeout: 5000 }
            );
            return Buffer.from(response.data.data.plaintext, 'base64');
        } catch (vaultError) {
            // Fallback to local keystore
            console.log(`Vault unavailable, using local keystore for ${userId}`);
        }

        // Local unwrapping
        const keyPair = await getUserWrappingKey(userId);
        const dek = crypto.privateDecrypt(
            {
                key: keyPair.privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256'
            },
            wrappedDEK
        );

        return dek;

    } catch (error) {
        console.error(`Error unwrapping key for ${userId}:`, error);
        throw new Error(`Failed to unwrap key: ${error.message}`);
    }
}

/**
 * Rewrap DEK for grantee (simulates PRE)
 * In production, use proper PRE library (e.g., NuCypher)
 * 
 * @param {Buffer} dek - Unwrapped DEK
 * @param {string} granteeId - Grantee user/org identifier
 * @returns {Buffer} Rewrapped DEK for grantee
 */
async function rewrapKey(dek, granteeId) {
    // TODO: Implement true Proxy Re-Encryption
    // For PoC, simply wrap with grantee's key
    // In production, use PRE to avoid exposing DEK to key-service
    return await wrapKey(dek, granteeId);
}

// Initialize on module load
initKeystore();

module.exports = {
    wrapKey,
    unwrapKey,
    rewrapKey
};

