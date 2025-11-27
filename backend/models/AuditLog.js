/**
 * Audit Log Model
 * Track all access and actions
 */

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    logId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    recordId: {
        type: String,
        required: true,
        index: true
    },
    actorId: {
        type: String,
        required: true,
        index: true,
        ref: 'Organization'
    },
    action: {
        type: String,
        required: true,
        enum: [
            'create',
            'view',
            'download',
            'request_access',
            'grant_access',
            'revoke_access',
            'deny_access',
            'update',
            'delete'
        ],
        index: true
    },
    targetId: {
        type: String, // granteeId for grants, etc.
        ref: 'Organization'
    },
    details: {
        type: mongoose.Schema.Types.Mixed
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Indexes for audit queries
auditLogSchema.index({ recordId: 1, timestamp: -1 });
auditLogSchema.index({ actorId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

