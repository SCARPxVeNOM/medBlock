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
 */
router.get('/records', async (req, res) => {
    try {
        const { ownerId } = req.query;
        if (!ownerId) {
            return res.status(400).json({ error: 'ownerId required' });
        }

        const records = await queryRecordsByOwner(ownerId);
        res.json(records);
    } catch (error) {
        console.error('Query error:', error);
        res.status(500).json({ error: 'Failed to query records', message: error.message });
    }
});

/**
 * GET /api/records/:recordId
 * Get record by ID
 */
router.get('/records/:recordId', async (req, res) => {
    try {
        const { recordId } = req.params;
        const record = await getRecord(recordId);
        res.json(record);
    } catch (error) {
        console.error('Query error:', error);
        res.status(404).json({ error: 'Record not found', message: error.message });
    }
});

/**
 * POST /api/request-access
 * Request access to a record
 */
router.post('/request-access', async (req, res) => {
    try {
        const { recordId, granteeId, purpose } = req.body;
        if (!recordId || !granteeId || !purpose) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await requestAccessTransaction(recordId, granteeId, purpose);
        res.json({ status: 'success', ...result });
    } catch (error) {
        console.error('Request access error:', error);
        res.status(500).json({ error: 'Failed to request access', message: error.message });
    }
});

/**
 * POST /api/grant-access
 * Grant access to a record
 */
router.post('/grant-access', async (req, res) => {
    try {
        const { recordId, granteeId, purpose, expiry } = req.body;
        if (!recordId || !granteeId || !purpose || !expiry) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await grantAccessTransaction(recordId, granteeId, purpose, expiry);
        res.json({ status: 'success', ...result });
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

