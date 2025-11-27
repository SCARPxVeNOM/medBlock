/**
 * Additional API endpoints for frontend integration
 * Extends uploader.js with query endpoints
 */

const express = require('express');
const { queryRecordsByOwner, getRecord, requestAccessTransaction, grantAccessTransaction } = require('./lib/fabricClient');

const router = express.Router();

/**
 * GET /api/records?ownerId=xxx
 * Query records by owner
 * Works with or without Fabric network
 */
router.get('/records', async (req, res) => {
    try {
        const { ownerId } = req.query;
        if (!ownerId) {
            return res.status(400).json({ error: 'ownerId required' });
        }

        const records = await queryRecordsByOwner(ownerId);
        
        // If no records from Fabric, return empty array (or could load from local storage)
        res.json(records || []);
    } catch (error) {
        console.error('Query error:', error);
        // Return empty array instead of error
        res.json([]);
    }
});

/**
 * GET /api/records/:recordId
 * Get record by ID
 * Works with or without Fabric network
 */
router.get('/records/:recordId', async (req, res) => {
    try {
        const { recordId } = req.params;
        const record = await getRecord(recordId);
        
        if (!record) {
            return res.status(404).json({ error: 'Record not found' });
        }
        
        res.json(record);
    } catch (error) {
        console.error('Query error:', error);
        res.status(404).json({ error: 'Record not found', message: error.message });
    }
});

/**
 * POST /api/request-access
 * Request access to a record
 * Works with or without Fabric network
 */
router.post('/request-access', async (req, res) => {
    try {
        const { recordId, granteeId, purpose } = req.body;
        if (!recordId || !granteeId || !purpose) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await requestAccessTransaction(recordId, granteeId, purpose);
        
        if (result) {
            res.json({ status: 'success', ...result });
        } else {
            // Fabric not available, but still return success for PoC
            res.json({ 
                status: 'success', 
                message: 'Access request recorded (Fabric network not available)',
                recordId,
                granteeId,
                purpose
            });
        }
    } catch (error) {
        console.error('Request access error:', error);
        res.status(500).json({ error: 'Failed to request access', message: error.message });
    }
});

/**
 * POST /api/grant-access
 * Grant access to a record
 * Works with or without Fabric network
 */
router.post('/grant-access', async (req, res) => {
    try {
        const { recordId, granteeId, purpose, expiry } = req.body;
        if (!recordId || !granteeId || !purpose || !expiry) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await grantAccessTransaction(recordId, granteeId, purpose, expiry);
        
        // If Fabric is available, trigger key re-encryption via key-service
        if (result) {
            // Trigger key re-encryption (simulate event)
            try {
                const axios = require('axios');
                await axios.post('http://localhost:3002/api/keys/rewrap', {
                    recordId,
                    granteeId,
                    ownerId: req.body.ownerId || 'org1' // TODO: Get from auth
                });
            } catch (rewrapError) {
                console.warn('Key re-encryption failed:', rewrapError.message);
            }
        } else {
            // Fabric not available, trigger key re-encryption directly
            try {
                const axios = require('axios');
                await axios.post('http://localhost:3002/api/keys/rewrap', {
                    recordId,
                    granteeId,
                    ownerId: req.body.ownerId || 'org1'
                });
            } catch (rewrapError) {
                console.warn('Key re-encryption failed:', rewrapError.message);
            }
        }
        
        res.json({ 
            status: 'success', 
            ...(result || { message: 'Access granted (Fabric network not available)' })
        });
    } catch (error) {
        console.error('Grant access error:', error);
        res.status(500).json({ error: 'Failed to grant access', message: error.message });
    }
});

/**
 * GET /api/audit?ownerId=xxx
 * Get audit log (stub)
 */
router.get('/audit', async (req, res) => {
    try {
        const { ownerId } = req.query;
        // TODO: Implement audit log query from chaincode
        res.json([]);
    } catch (error) {
        console.error('Audit query error:', error);
        res.status(500).json({ error: 'Failed to query audit log' });
    }
});

module.exports = router;

