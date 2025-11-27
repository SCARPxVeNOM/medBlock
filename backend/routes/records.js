/**
 * Records API Routes
 */

const Record = require('../models/Record');
const AccessGrant = require('../models/AccessGrant');
const { logAudit } = require('../services/accessControl');

module.exports = function(app) {
    /**
     * GET /api/records?ownerId=xxx
     * Get records owned by an organization
     */
    app.get('/api/records', async (req, res) => {
        try {
            const { ownerId } = req.query;
            
            if (!ownerId) {
                return res.status(400).json({ error: 'ownerId required' });
            }

            const records = await Record.find({ 
                ownerId, 
                status: 'active' 
            }).sort({ createdAt: -1 });

            // Get access grants count for each record
            const recordsWithGrants = await Promise.all(records.map(async (record) => {
                const grantsCount = await AccessGrant.countDocuments({
                    recordId: record.recordId,
                    status: 'active'
                });

                return {
                    recordId: record.recordId,
                    ownerId: record.ownerId,
                    timestamp: record.createdAt,
                    ciphertextHash: record.ciphertextHash,
                    accessGrantsCount: grantsCount,
                    metadata: record.metadata
                };
            }));

            res.json(recordsWithGrants);
        } catch (error) {
            console.error('Error fetching records:', error);
            res.status(500).json({ error: 'Failed to fetch records' });
        }
    });

    /**
     * GET /api/records/:recordId
     * Get specific record details
     */
    app.get('/api/records/:recordId', async (req, res) => {
        try {
            const { recordId } = req.params;
            
            const record = await Record.findOne({ recordId, status: 'active' });
            
            if (!record) {
                return res.status(404).json({ error: 'Record not found' });
            }

            // Get access grants for this record
            const grants = await AccessGrant.find({
                recordId,
                status: 'active'
            }).sort({ grantedAt: -1 });

            res.json({
                recordId: record.recordId,
                ownerId: record.ownerId,
                ciphertextHash: record.ciphertextHash,
                timestamp: record.createdAt,
                metadata: record.metadata,
                accessGrants: grants.map(g => ({
                    grantId: g.grantId,
                    granteeId: g.granteeId,
                    purpose: g.purpose,
                    grantedAt: g.grantedAt,
                    expiryDate: g.expiryDate,
                    accessCount: g.accessCount
                }))
            });
        } catch (error) {
            console.error('Error fetching record:', error);
            res.status(500).json({ error: 'Failed to fetch record' });
        }
    });

    /**
     * GET /api/shared-records?granteeId=xxx
     * Get records shared with an organization
     */
    app.get('/api/shared-records', async (req, res) => {
        try {
            const { granteeId } = req.query;
            
            if (!granteeId) {
                return res.status(400).json({ error: 'granteeId required' });
            }

            // Find all active grants for this grantee
            const grants = await AccessGrant.find({
                granteeId,
                status: 'active',
                expiryDate: { $gt: new Date() }
            }).sort({ grantedAt: -1 });

            // Get record details for each grant
            const sharedRecords = await Promise.all(grants.map(async (grant) => {
                const record = await Record.findOne({ recordId: grant.recordId });
                
                if (!record) return null;

                return {
                    recordId: record.recordId,
                    ownerId: record.ownerId,
                    timestamp: record.createdAt,
                    ciphertextHash: record.ciphertextHash,
                    metadata: record.metadata,
                    grantInfo: {
                        grantId: grant.grantId,
                        purpose: grant.purpose,
                        grantedAt: grant.grantedAt,
                        expiryDate: grant.expiryDate,
                        accessCount: grant.accessCount
                    }
                };
            }));

            // Filter out null records
            res.json(sharedRecords.filter(r => r !== null));
        } catch (error) {
            console.error('Error fetching shared records:', error);
            res.status(500).json({ error: 'Failed to fetch shared records' });
        }
    });
};

