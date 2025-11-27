/**
 * Hyperledger Fabric Network Client
 * Handles chaincode transactions and queries
 */

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs').promises;

const CHANNEL_NAME = 'mychannel';
const CHAINCODE_NAME = 'healthcare-chaincode';
const MSP_ID = 'Org1MSP';
const WALLET_PATH = path.join(__dirname, '../wallet');

let gateway = null;

/**
 * Get or create Fabric gateway connection
 * Returns null if Fabric network is not available (graceful degradation)
 */
async function getFabricGateway() {
    if (gateway) {
        return gateway;
    }

    gateway = new Gateway();

    try {
        // Load connection profile
        const ccpPath = path.join(__dirname, '../../fabric-network/connection-org1.json');
        
        // Check if connection profile exists
        try {
            await fs.access(ccpPath);
        } catch {
            throw new Error('Fabric connection profile not found. Running without Fabric network.');
        }

        const ccp = JSON.parse(await fs.readFile(ccpPath, 'utf8'));

        // Create wallet
        const wallet = await Wallets.newFileSystemWallet(WALLET_PATH);

        // Check if user identity exists
        const userExists = await wallet.get('appUser');
        if (!userExists) {
            console.log('Setting up admin identity in wallet...');
            
            // Load admin identity from crypto-config
            const adminCertPath = path.join(__dirname, '../../fabric-network/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts');
            const adminKeyPath = path.join(__dirname, '../../fabric-network/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore');
            
            try {
                // Find certificate file
                const certFiles = await fs.readdir(adminCertPath);
                const certFile = certFiles.find(f => f.endsWith('.pem'));
                
                // Find private key file
                const keyFiles = await fs.readdir(adminKeyPath);
                const keyFile = keyFiles.find(f => f.endsWith('_sk'));
                
                if (certFile && keyFile) {
                    const cert = await fs.readFile(path.join(adminCertPath, certFile), 'utf8');
                    const key = await fs.readFile(path.join(adminKeyPath, keyFile), 'utf8');
                    
                    // Create identity
                    const x509Identity = {
                        credentials: {
                            certificate: cert,
                            privateKey: key
                        },
                        mspId: 'Org1MSP',
                        type: 'X.509'
                    };
                    
                    await wallet.put('appUser', x509Identity);
                    console.log('Admin identity added to wallet');
                } else {
                    throw new Error('Admin certificate or key not found');
                }
            } catch (error) {
                console.warn('Could not load admin identity:', error.message);
                console.warn('Wallet setup may be needed. Run: ./scripts/setup-wallet.sh');
                throw new Error('Wallet identity not found. Please run setup-wallet.sh');
            }
        }

        // Connect to gateway
        await gateway.connect(ccp, {
            wallet,
            identity: 'appUser',
            discovery: { enabled: true, asLocalhost: true }
        });

        console.log('Connected to Fabric network');
        return gateway;

    } catch (error) {
        console.warn('Fabric network not available:', error.message);
        // Return null instead of throwing - allows graceful degradation
        return null;
    }
}

/**
 * Submit CreateRecord transaction
 * Returns null if Fabric network is not available
 */
async function createRecordTransaction(recordId, ownerId, pointer, ciphertextHash, policyId) {
    try {
        const gateway = await getFabricGateway();
        if (!gateway) {
            return null; // Fabric not available
        }

        const network = await gateway.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CHAINCODE_NAME);

        // Submit transaction
        const result = await contract.submitTransaction(
            'CreateRecord',
            recordId,
            ownerId,
            pointer,
            ciphertextHash,
            policyId
        );

        const txId = contract.getTransactionID();
        console.log(`Transaction submitted: ${txId}`);

        return {
            txId,
            result: result.toString()
        };

    } catch (error) {
        console.error('Fabric transaction error:', error);
        throw new Error(`Failed to submit transaction: ${error.message}`);
    }
}

/**
 * Query records by owner
 * Returns empty array if Fabric network is not available
 */
async function queryRecordsByOwner(ownerId) {
    try {
        const gateway = await getFabricGateway();
        if (!gateway) {
            console.warn('Fabric network not available, returning empty records');
            return []; // Return empty array if Fabric not available
        }

        const network = await gateway.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CHAINCODE_NAME);

        const result = await contract.evaluateTransaction('QueryRecordsByOwner', ownerId);
        return JSON.parse(result.toString());

    } catch (error) {
        console.error('Fabric query error:', error);
        // Return empty array instead of throwing
        return [];
    }
}

/**
 * Get record by ID
 * Returns null if Fabric network is not available
 */
async function getRecord(recordId) {
    try {
        const gateway = await getFabricGateway();
        if (!gateway) {
            return null; // Fabric not available
        }

        const network = await gateway.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CHAINCODE_NAME);

        const result = await contract.evaluateTransaction('GetRecord', recordId);
        return JSON.parse(result.toString());

    } catch (error) {
        console.error('Fabric query error:', error);
        return null; // Return null instead of throwing
    }
}

/**
 * Submit GrantAccess transaction
 * Returns null if Fabric network is not available
 */
async function grantAccessTransaction(recordId, granteeId, purpose, expiry) {
    try {
        const gateway = await getFabricGateway();
        if (!gateway) {
            return null; // Fabric not available
        }

        const network = await gateway.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CHAINCODE_NAME);

        const result = await contract.submitTransaction(
            'GrantAccess',
            recordId,
            granteeId,
            purpose,
            expiry
        );

        return {
            txId: contract.getTransactionID(),
            result: result.toString()
        };

    } catch (error) {
        console.error('Fabric transaction error:', error);
        return null; // Return null instead of throwing
    }
}

/**
 * Submit RequestAccess transaction
 * Returns null if Fabric network is not available
 */
async function requestAccessTransaction(recordId, granteeId, purpose) {
    try {
        const gateway = await getFabricGateway();
        if (!gateway) {
            return null; // Fabric not available
        }

        const network = await gateway.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CHAINCODE_NAME);

        const result = await contract.submitTransaction(
            'RequestAccess',
            recordId,
            granteeId,
            purpose
        );

        return {
            txId: contract.getTransactionID(),
            result: result.toString()
        };

    } catch (error) {
        console.error('Fabric transaction error:', error);
        return null; // Return null instead of throwing
    }
}

module.exports = {
    getFabricGateway,
    createRecordTransaction,
    queryRecordsByOwner,
    getRecord,
    grantAccessTransaction,
    requestAccessTransaction
};

