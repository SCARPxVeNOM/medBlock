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
 */
async function getFabricGateway() {
    if (gateway) {
        return gateway;
    }

    gateway = new Gateway();

    try {
        // Load connection profile
        const ccpPath = path.join(__dirname, '../../fabric-network/connection-org1.json');
        const ccp = JSON.parse(await fs.readFile(ccpPath, 'utf8'));

        // Create wallet
        const wallet = await Wallets.newFileSystemWallet(WALLET_PATH);

        // Check if user identity exists
        const userExists = await wallet.get('appUser');
        if (!userExists) {
            console.log('Creating user identity...');
            // TODO: Load user certificate and key from fabric-network
            // For PoC, use admin identity
            const adminPath = path.join(__dirname, '../../fabric-network/peer0.org1.example.com/msp/admincerts');
            // This is a stub - in production, properly load admin cert
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
        console.error('Failed to connect to Fabric:', error);
        throw error;
    }
}

/**
 * Submit CreateRecord transaction
 */
async function createRecordTransaction(recordId, ownerId, pointer, ciphertextHash, policyId) {
    try {
        const gateway = await getFabricGateway();
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
 */
async function queryRecordsByOwner(ownerId) {
    try {
        const gateway = await getFabricGateway();
        const network = await gateway.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CHAINCODE_NAME);

        const result = await contract.evaluateTransaction('QueryRecordsByOwner', ownerId);
        return JSON.parse(result.toString());

    } catch (error) {
        console.error('Fabric query error:', error);
        throw error;
    }
}

/**
 * Get record by ID
 */
async function getRecord(recordId) {
    try {
        const gateway = await getFabricGateway();
        const network = await gateway.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CHAINCODE_NAME);

        const result = await contract.evaluateTransaction('GetRecord', recordId);
        return JSON.parse(result.toString());

    } catch (error) {
        console.error('Fabric query error:', error);
        throw error;
    }
}

/**
 * Submit GrantAccess transaction
 */
async function grantAccessTransaction(recordId, granteeId, purpose, expiry) {
    try {
        const gateway = await getFabricGateway();
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
        throw error;
    }
}

/**
 * Submit RequestAccess transaction
 */
async function requestAccessTransaction(recordId, granteeId, purpose) {
    try {
        const gateway = await getFabricGateway();
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
        throw error;
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

