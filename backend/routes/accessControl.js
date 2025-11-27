/**
 * Access Control API Routes
 */

const AccessRequest = require('../models/AccessRequest');
const AccessGrant = require('../models/AccessGrant');
const Organization = require('../models/Organization');
const {
    requestAccess,
    grantAccess,
    revokeAccess,
    getWrappedDEKForGrantee
} = require('../services/accessControl');

module.exports = function(app) {
    /**
     * POST /api/access/request
     * Hospital B requests access to a record
     */
    app.post('/api/access/request', async (req, res) => {
        try {
            const { recordId, requesterId, purpose, expiryDays } = req.body;

            if (!recordId || !requesterId || !purpose) {
                return res.status(400).json({ 
                    error: 'Missing required fields: recordId, requesterId, purpose' 
                });
            }

            const accessRequest = await requestAccess(
                recordId,
                requesterId,
                purpose,
                expiryDays || 30
            );

            res.json({
                status: 'success',
                requestId: accessRequest.requestId,
                message: 'Access request submitted successfully'
            });
        } catch (error) {
            console.error('Error requesting access:', error);
            res.status(500).json({ 
                error: 'Failed to request access',
                message: error.message 
            });
        }
    });

    /**
     * POST /api/access/grant
     * Hospital A grants access to Hospital B
     */
    app.post('/api/access/grant', async (req, res) => {
        try {
            const { recordId, ownerId, granteeId, purpose, expiryDays } = req.body;

            if (!recordId || !ownerId || !granteeId || !purpose) {
                return res.status(400).json({ 
                    error: 'Missing required fields' 
                });
            }

            const accessGrant = await grantAccess(
                recordId,
                ownerId,
                granteeId,
                purpose,
                expiryDays || 30
            );

            res.json({
                status: 'success',
                grantId: accessGrant.grantId,
                message: 'Access granted successfully'
            });
        } catch (error) {
            console.error('Error granting access:', error);
            res.status(500).json({ 
                error: 'Failed to grant access',
                message: error.message 
            });
        }
    });

    /**
     * POST /api/access/revoke
     * Revoke access from a grantee
     */
    app.post('/api/access/revoke', async (req, res) => {
        try {
            const { recordId, ownerId, granteeId } = req.body;

            if (!recordId || !ownerId || !granteeId) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const grant = await revokeAccess(recordId, ownerId, granteeId);

            res.json({
                status: 'success',
                message: 'Access revoked successfully'
            });
        } catch (error) {
            console.error('Error revoking access:', error);
            res.status(500).json({ 
                error: 'Failed to revoke access',
                message: error.message 
            });
        }
    });

    /**
     * GET /api/access/requests?ownerId=xxx
     * Get pending access requests for an owner
     */
    app.get('/api/access/requests', async (req, res) => {
        try {
            const { ownerId, requesterId } = req.query;

            let query = { status: 'pending' };
            if (ownerId) query.ownerId = ownerId;
            if (requesterId) query.requesterId = requesterId;

            const requests = await AccessRequest.find(query)
                .sort({ requestedAt: -1 });

            res.json(requests);
        } catch (error) {
            console.error('Error fetching access requests:', error);
            res.status(500).json({ error: 'Failed to fetch access requests' });
        }
    });

    /**
     * GET /api/access/grants?recordId=xxx
     * Get access grants for a record
     */
    app.get('/api/access/grants', async (req, res) => {
        try {
            const { recordId, ownerId, granteeId } = req.query;

            let query = { status: 'active' };
            if (recordId) query.recordId = recordId;
            if (ownerId) query.ownerId = ownerId;
            if (granteeId) query.granteeId = granteeId;

            const grants = await AccessGrant.find(query)
                .sort({ grantedAt: -1 });

            res.json(grants);
        } catch (error) {
            console.error('Error fetching access grants:', error);
            res.status(500).json({ error: 'Failed to fetch access grants' });
        }
    });

    /**
     * GET /api/access/key/:recordId/:granteeId
     * Get wrapped DEK for grantee to decrypt record
     */
    app.get('/api/access/key/:recordId/:granteeId', async (req, res) => {
        try {
            const { recordId, granteeId } = req.params;

            const keyData = await getWrappedDEKForGrantee(recordId, granteeId);

            res.json({
                status: 'success',
                wrappedDEK: keyData.wrappedDEK,
                iv: keyData.iv
            });
        } catch (error) {
            console.error('Error getting key:', error);
            res.status(403).json({ 
                error: 'Access denied',
                message: error.message 
            });
        }
    });

    /**
     * GET /api/organizations
     * Get list of organizations
     */
    app.get('/api/organizations', async (req, res) => {
        try {
            const orgs = await Organization.find({ status: 'active' })
                .select('orgId name type email')
                .sort({ name: 1 });

            res.json(orgs);
        } catch (error) {
            console.error('Error fetching organizations:', error);
            res.status(500).json({ error: 'Failed to fetch organizations' });
        }
    });
};

