/**
 * Cryptographic utilities
 * AES-GCM encryption for healthcare records
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Generate a random 256-bit Data Encryption Key (DEK)
 */
function generateDEK() {
    return crypto.randomBytes(32); // 256 bits
}

/**
 * Encrypt a record using AES-GCM
 * @param {string} plaintext - FHIR JSON string
 * @param {Buffer} dek - Data Encryption Key
 * @returns {Object} { ciphertext, iv, authTag }
 */
async function encryptRecord(plaintext, dek) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, dek, iv);

    let ciphertext = cipher.update(plaintext, 'utf8');
    ciphertext = Buffer.concat([ciphertext, cipher.final()]);

    const authTag = cipher.getAuthTag();

    return {
        ciphertext,
        iv,
        authTag
    };
}

/**
 * Decrypt a record using AES-GCM
 * @param {Buffer} ciphertext - Encrypted data
 * @param {Buffer} dek - Data Encryption Key
 * @param {Buffer} iv - Initialization vector
 * @param {Buffer} authTag - Authentication tag
 * @returns {string} Decrypted plaintext
 */
async function decryptRecord(ciphertext, dek, iv, authTag) {
    const decipher = crypto.createDecipheriv(ALGORITHM, dek, iv);
    decipher.setAuthTag(authTag);

    let plaintext = decipher.update(ciphertext);
    plaintext = Buffer.concat([plaintext, decipher.final()]);

    return plaintext.toString('utf8');
}

/**
 * Generate SHA-256 hash
 */
function hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

module.exports = {
    generateDEK,
    encryptRecord,
    decryptRecord,
    hash
};

