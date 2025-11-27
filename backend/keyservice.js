/**
 * Key Service - Event Listener
 * Listens to Fabric events and handles key re-encryption for access grants
 */

const express = require('express');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs').promises;
const { unwrapKey, rewrapKey } = require('./lib/vaultClient');
const { getFabricGateway } = require('./lib/fabricClient');

const app = express();
app.use(express.json());

let eventListener = null;

/**
 * Initialize Fabric event listener
 */
async function initializeEventListener() {
    try {
        const gateway = await getFabricGateway();
        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('healthcare-chaincode');

        console.log('Setting up event listeners...');

        // Listen for AccessGranted events
        contract.addContractListener('AccessGranted', async (event) => {
            try {
                const eventData = JSON.parse(event.payload.toString());
                console.log('AccessGranted event received:', eventData);

                await handleAccessGrant(eventData);
            } catch (error) {
                console.error('Error processing AccessGranted event:', error);
            }
        });

        // Listen for AccessRequested events (for logging)
        contract.addContractListener('AccessRequested', async (event) => {
            try {
                const eventData = JSON.parse(event.payload.toString());
                console.log('AccessRequested event received:', eventData);
                // TODO: Notify owner via notification service
            } catch (error) {
                console.error('Error processing AccessRequested event:', error);
            }
        });

        console.log('Event listeners initialized');
        eventListener = { gateway, network, contract };

    } catch (error) {
        console.error('Failed to initialize event listener:', error);
        throw error;
    }
}

/**
 * Handle access grant - rewrap DEK for grantee
 */
async function handleAccessGrant(eventData) {
    const { recordId, granteeId, grantId } = eventData;

    try {
        // Load wrapped DEK metadata
        const dekMetadataPath = path.join('keys', `${recordId}.json`);
        let dekMetadata;
        
        try {
            const metadataContent = await fs.readFile(dekMetadataPath, 'utf8');
            dekMetadata = JSON.parse(metadataContent);
        } catch (error) {
            console.error(`DEK metadata not found for record ${recordId}`);
            return;
        }

        // Unwrap DEK using owner's key (via Vault)
        const ownerId = dekMetadata.ownerId;
        const wrappedDEK = Buffer.from(dekMetadata.wrappedDEK, 'base64');
        
        // TODO: In production, use proper PRE library (e.g., NuCypher)
        // For PoC, simulate rewrap by unwrapping and rewrapping
        const dek = await unwrapKey(wrappedDEK, ownerId);
        console.log(`Unwrapped DEK for record ${recordId}`);

        // Rewrap DEK for grantee
        const granteeWrappedDEK = await rewrapKey(dek, granteeId);
        console.log(`Rewrapped DEK for grantee ${granteeId}`);

        // Store grantee's wrapped DEK
        const granteeDekPath = path.join('keys', `${recordId}_${granteeId}.json`);
        await fs.writeFile(granteeDekPath, JSON.stringify({
            recordId,
            granteeId,
            ownerId,
            wrappedDEK: granteeWrappedDEK.toString('base64'),
            grantId,
            timestamp: new Date().toISOString()
        }));

        console.log(`Key re-encryption completed for grant ${grantId}`);

        // TODO: Notify grantee via secure channel
        // TODO: In production, use proper PRE to avoid exposing DEK to key-service

    } catch (error) {
        console.error(`Error handling access grant for ${recordId}:`, error);
        throw error;
    }
}

/**
 * GET /api/keys/:recordId/:granteeId
 * Retrieve wrapped DEK for a grantee
 */
app.get('/api/keys/:recordId/:granteeId', async (req, res) => {
    try {
        const { recordId, granteeId } = req.params;

        const granteeDekPath = path.join('keys', `${recordId}_${granteeId}.json`);
        
        try {
            const metadataContent = await fs.readFile(granteeDekPath, 'utf8');
            const metadata = JSON.parse(metadataContent);

            res.json({
                recordId: metadata.recordId,
                wrappedDEK: metadata.wrappedDEK,
                iv: metadata.iv || null
            });
        } catch (error) {
            res.status(404).json({ 
                error: 'Wrapped key not found',
                message: 'Access grant may not have been processed yet'
            });
        }

    } catch (error) {
        console.error('Error retrieving key:', error);
        res.status(500).json({ error: 'Failed to retrieve key' });
    }
});

/**
 * POST /api/keys/unwrap
 * Unwrap a DEK (for grantee to decrypt data)
 * Body: { wrappedDEK, granteeId }
 */
app.post('/api/keys/unwrap', async (req, res) => {
    try {
        const { wrappedDEK, granteeId } = req.body;

        if (!wrappedDEK || !granteeId) {
            return res.status(400).json({ 
                error: 'Missing wrappedDEK or granteeId' 
            });
        }

        // Unwrap DEK via Vault
        const dek = await unwrapKey(Buffer.from(wrappedDEK, 'base64'), granteeId);

        res.json({
            dek: dek.toString('base64'),
            message: 'DEK unwrapped successfully'
        });

    } catch (error) {
        console.error('Error unwrapping key:', error);
        res.status(500).json({ 
            error: 'Failed to unwrap key',
            message: error.message 
        });
    }
});

/**
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'keyservice',
        listenerActive: eventListener !== null
    });
});

const PORT = process.env.PORT || 3002;

// Initialize and start server
initializeEventListener()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Key service running on port ${PORT}`);
            console.log('Event listener active');
        });
    })
    .catch((error) => {
        console.error('Failed to start key service:', error);
        process.exit(1);
    });

module.exports = app;

