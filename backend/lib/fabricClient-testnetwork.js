/**
 * Hyperledger Fabric Network Client
 * Configured for official test-network
 */

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs').promises;
const yaml = require('js-yaml');

const CHANNEL_NAME = 'mychannel';
const CHAINCODE_NAME = 'healthcare-chaincode';
const MSP_ID = 'Org1MSP';

// Test network paths
const TEST_NETWORK_PATH = path.join(__dirname, '../../fabric-samples/test-network');
const CONNECTION_PROFILE_PATH = path.join(TEST_NETWORK_PATH, 'organizations/peerOrganizations/org1.example.com/connection-org1.yaml');
const ADMIN_CERT_PATH = path.join(TEST_NETWORK_PATH, 'organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp');

let gateway = null;

/**
 * Get or create Fabric gateway connection (test-network)
 */
async function getFabricGateway() {
    if (gateway) {
        return gateway;
    }

    gateway = new Gateway();

    try {
        // Load connection profile (YAML)
        const ccpYaml = await fs.readFile(CONNECTION_PROFILE_PATH, 'utf8');
        const ccp = yaml.load(ccpYaml);

        // Create in-memory wallet
        const wallet = await Wallets.newInMemoryWallet();

        // Load admin identity
        const certPath = path.join(ADMIN_CERT_PATH, 'signcerts', 'cert.pem');
        const keyDir = path.join(ADMIN_CERT_PATH, 'keystore');
        const keyFiles = await fs.readdir(keyDir);
        const keyPath = path.join(keyDir, keyFiles[0]);

        const cert = await fs.readFile(certPath, 'utf8');
        const key = await fs.readFile(keyPath, 'utf8');

        const x509Identity = {
            credentials: {
                certificate: cert,
                privateKey: key
            },
            mspId: MSP_ID,
            type: 'X.509'
        };

        await wallet.put('admin', x509Identity);
        console.log('Admin identity loaded from test-network');

        // Connect to gateway
        await gateway.connect(ccp, {
            wallet,
            identity: 'admin',
            discovery: { enabled: true, asLocalhost: true }
        });

        console.log('Connected to Fabric test-network');
        return gateway;

    } catch (error) {
        console.warn('Fabric test-network not available:', error.message);
        return null;
    }
}

/**
 * Submit CreateRecord transaction
 */
async function createRecordTransaction(recordId, ownerId, pointer, ciphertextHash, policyId) {
    try {
        const gw = await getFabricGateway();
        if (!gw) return null;

        const network = await gw.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CHAINCODE_NAME);

        const result = await contract.submitTransaction(
            'CreateRecord',
            recordId,
            ownerId,
            pointer,
            ciphertextHash,
            policyId
        );

        return {
            txId: result.toString(),
            result: 'Record created on blockchain'
        };

    } catch (error) {
        console.error('Fabric transaction error:', error);
        return null;
    }
}

/**
 * Query records by owner
 */
async function queryRecordsByOwner(ownerId) {
    try {
        const gw = await getFabricGateway();
        if (!gw) return [];

        const network = await gw.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CHAINCODE_NAME);

        const result = await contract.evaluateTransaction('QueryRecordsByOwner', ownerId);
        return JSON.parse(result.toString());

    } catch (error) {
        console.error('Fabric query error:', error);
        return [];
    }
}

/**
 * Get record by ID
 */
async function getRecord(recordId) {
    try {
        const gw = await getFabricGateway();
        if (!gw) return null;

        const network = await gw.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CHAINCODE_NAME);

        const result = await contract.evaluateTransaction('GetRecord', recordId);
        return JSON.parse(result.toString());

    } catch (error) {
        console.error('Fabric query error:', error);
        return null;
    }
}

/**
 * Submit GrantAccess transaction
 */
async function grantAccessTransaction(recordId, granteeId, purpose, expiry) {
    try {
        const gw = await getFabricGateway();
        if (!gw) return null;

        const network = await gw.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CHAINCODE_NAME);

        const result = await contract.submitTransaction(
            'GrantAccess',
            recordId,
            granteeId,
            purpose,
            expiry
        );

        return {
            txId: result.toString(),
            result: 'Access granted on blockchain'
        };

    } catch (error) {
        console.error('Fabric transaction error:', error);
        return null;
    }
}

/**
 * Submit RequestAccess transaction
 */
async function requestAccessTransaction(recordId, granteeId, purpose) {
    try {
        const gw = await getFabricGateway();
        if (!gw) return null;

        const network = await gw.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CHAINCODE_NAME);

        const result = await contract.submitTransaction(
            'RequestAccess',
            recordId,
            granteeId,
            purpose
        );

        return {
            txId: result.toString(),
            result: 'Access requested on blockchain'
        };

    } catch (error) {
        console.error('Fabric transaction error:', error);
        return null;
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

