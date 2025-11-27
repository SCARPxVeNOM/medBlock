/**
 * Access Control Service
 * Manages permissions between hospitals
 */

const crypto = require('crypto');
const Record = require('../models/Record');
const AccessGrant = require('../models/AccessGrant');
const AccessRequest = require('../models/AccessRequest');
const AuditLog = require('../models/AuditLog');
const { wrapKey, unwrapKey } = require('../lib/vaultClient');

/**
 * Request access to a record (Hospital B → Hospital A)
 */
async function requestAccess(recordId, requesterId, purpose, expiryDays = 30) {
    try {
        // Check if record exists
        const record = await Record.findOne({ recordId });
        if (!record) {
            throw new Error('Record not found');
        }

        // Check if requester is not the owner
        if (record.ownerId === requesterId) {
            throw new Error('Cannot request access to own record');
        }

        // Check if request already exists
        const existingRequest = await AccessRequest.findOne({
            recordId,
            requesterId,
            status: 'pending'
        });

        if (existingRequest) {
            throw new Error('Access request already pending');
        }

        // Create access request
        const requestId = `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const accessRequest = new AccessRequest({
            requestId,
            recordId,
            ownerId: record.ownerId,
            requesterId,
            purpose,
            expiryDays
        });

        await accessRequest.save();

        // Log the request
        await logAudit(recordId, requesterId, 'request_access', record.ownerId, {
            purpose,
            expiryDays
        });

        return accessRequest;
    } catch (error) {
        console.error('Error requesting access:', error);
        throw error;
    }
}

/**
 * Grant access to a record (Hospital A approves Hospital B's request)
 */
async function grantAccess(recordId, ownerId, granteeId, purpose, expiryDays = 30) {
    try {
        // Verify record ownership
        const record = await Record.findOne({ recordId, ownerId });
        if (!record) {
            throw new Error('Record not found or you do not own this record');
        }

        // Check if grant already exists
        const existingGrant = await AccessGrant.findOne({
            recordId,
            granteeId,
            status: 'active'
        });

        if (existingGrant) {
            throw new Error('Active grant already exists for this grantee');
        }

        // Unwrap DEK with owner's key
        const ownerWrappedDEK = Buffer.from(record.wrappedDEK, 'base64');
        const dek = await unwrapKey(ownerWrappedDEK, ownerId);

        // Re-wrap DEK for grantee
        const granteeWrappedDEK = await wrapKey(dek, granteeId);

        // Create access grant
        const grantId = `grant_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + expiryDays);

        const accessGrant = new AccessGrant({
            grantId,
            recordId,
            ownerId,
            granteeId,
            purpose,
            wrappedDEKForGrantee: granteeWrappedDEK.toString('base64'),
            expiryDate
        });

        await accessGrant.save();

        // Update access request if it exists
        await AccessRequest.updateOne(
            { recordId, requesterId: granteeId, status: 'pending' },
            { 
                status: 'approved',
                respondedAt: new Date()
            }
        );

        // Log the grant
        await logAudit(recordId, ownerId, 'grant_access', granteeId, {
            purpose,
            expiryDays
        });

        return accessGrant;
    } catch (error) {
        console.error('Error granting access:', error);
        throw error;
    }
}

/**
 * Revoke access to a record
 */
async function revokeAccess(recordId, ownerId, granteeId) {
    try {
        const grant = await AccessGrant.findOne({
            recordId,
            ownerId,
            granteeId,
            status: 'active'
        });

        if (!grant) {
            throw new Error('Active grant not found');
        }

        grant.status = 'revoked';
        grant.revokedAt = new Date();
        await grant.save();

        // Log the revocation
        await logAudit(recordId, ownerId, 'revoke_access', granteeId);

        return grant;
    } catch (error) {
        console.error('Error revoking access:', error);
        throw error;
    }
}

/**
 * Check if grantee has access to a record
 */
async function hasAccess(recordId, granteeId) {
    try {
        const grant = await AccessGrant.findOne({
            recordId,
            granteeId,
            status: 'active',
            expiryDate: { $gt: new Date() }
        });

        return !!grant;
    } catch (error) {
        console.error('Error checking access:', error);
        return false;
    }
}

/**
 * Get wrapped DEK for grantee
 */
async function getWrappedDEKForGrantee(recordId, granteeId) {
    try {
        const grant = await AccessGrant.findOne({
            recordId,
            granteeId,
            status: 'active',
            expiryDate: { $gt: new Date() }
        });

        if (!grant) {
            throw new Error('No active access grant found');
        }

        // Update access count
        grant.accessCount += 1;
        grant.lastAccessedAt = new Date();
        await grant.save();

        // Log the access
        await logAudit(recordId, granteeId, 'view', null, {
            grantId: grant.grantId
        });

        return {
            wrappedDEK: grant.wrappedDEKForGrantee,
            iv: (await Record.findOne({ recordId })).iv
        };
    } catch (error) {
        console.error('Error getting wrapped DEK:', error);
        throw error;
    }
}

/**
 * Log audit entry
 */
async function logAudit(recordId, actorId, action, targetId = null, details = {}) {
    try {
        const logId = `log_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const auditLog = new AuditLog({
            logId,
            recordId,
            actorId,
            action,
            targetId,
            details
        });

        await auditLog.save();
    } catch (error) {
        console.error('Error logging audit:', error);
        // Don't throw - audit logging shouldn't break the flow
    }
}

module.exports = {
    requestAccess,
    grantAccess,
    revokeAccess,
    hasAccess,
    getWrappedDEKForGrantee,
    logAudit
};

