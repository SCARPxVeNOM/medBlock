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

            console.log(`[shared-records] Querying grants for granteeId: "${granteeId}"`);

            // Try multiple matching strategies
            // 1. Exact match (case-sensitive)
            let grants = await AccessGrant.find({
                granteeId: granteeId,
                status: 'active',
                expiryDate: { $gt: new Date() }
            }).sort({ grantedAt: -1 });

            // 2. Case-insensitive match
            if (grants.length === 0) {
                console.log(`[shared-records] No exact match, trying case-insensitive search`);
                grants = await AccessGrant.find({
                    granteeId: { $regex: new RegExp(`^${granteeId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
                    status: 'active',
                    expiryDate: { $gt: new Date() }
                }).sort({ grantedAt: -1 });
            }

            // 3. Try variations (hospital2, hospital-2, hospital_2)
            if (grants.length === 0) {
                const variations = [
                    granteeId,
                    granteeId.replace(/(\d)/, '-$1'), // hospital2 -> hospital-2
                    granteeId.replace(/(\d)/, '_$1'), // hospital2 -> hospital_2
                    granteeId.replace('-', ''), // hospital-2 -> hospital2
                    granteeId.replace('_', ''), // hospital_2 -> hospital2
                ];
                
                for (const variant of variations) {
                    if (variant === granteeId) continue; // Already tried
                    console.log(`[shared-records] Trying variant: "${variant}"`);
                    const variantGrants = await AccessGrant.find({
                        granteeId: variant,
                        status: 'active',
                        expiryDate: { $gt: new Date() }
                    }).sort({ grantedAt: -1 });
                    
                    if (variantGrants.length > 0) {
                        grants = variantGrants;
                        console.log(`[shared-records] Found ${grants.length} grants with variant "${variant}"`);
                        break;
                    }
                }
            }

            // Debug: Show all grants in database for this grantee (any status)
            const allGrants = await AccessGrant.find({
                $or: [
                    { granteeId: granteeId },
                    { granteeId: { $regex: new RegExp(`^${granteeId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
                ]
            });
            console.log(`[shared-records] All grants for "${granteeId}" (any status):`, allGrants.map(g => ({
                grantId: g.grantId,
                granteeId: g.granteeId,
                status: g.status,
                expiryDate: g.expiryDate,
                isExpired: g.expiryDate < new Date(),
                recordId: g.recordId
            })));

            console.log(`[shared-records] Found ${grants.length} active, non-expired grants for "${granteeId}"`);

            // Get record details for each grant
            const sharedRecords = await Promise.all(grants.map(async (grant) => {
                const record = await Record.findOne({ recordId: grant.recordId });
                
                if (!record) {
                    console.log(`[shared-records] Record not found for grant ${grant.grantId}, recordId: ${grant.recordId}`);
                    return null;
                }

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
            const validRecords = sharedRecords.filter(r => r !== null);
            console.log(`[shared-records] Returning ${validRecords.length} valid shared records`);
            res.json(validRecords);
        } catch (error) {
            console.error('Error fetching shared records:', error);
            res.status(500).json({ error: 'Failed to fetch shared records' });
        }
    });
};

