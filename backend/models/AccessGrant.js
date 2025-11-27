/**
 * Access Grant Model
 * Manages permissions between organizations
 */

const mongoose = require('mongoose');

const accessGrantSchema = new mongoose.Schema({
    grantId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    recordId: {
        type: String,
        required: true,
        index: true,
        ref: 'Record'
    },
    ownerId: {
        type: String,
        required: true,
        index: true,
        ref: 'Organization'
    },
    granteeId: {
        type: String,
        required: true,
        index: true,
        ref: 'Organization'
    },
    purpose: {
        type: String,
        required: true
    },
    wrappedDEKForGrantee: {
        type: String,
        required: true // DEK re-wrapped for grantee
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'revoked', 'expired'],
        default: 'active',
        index: true
    },
    expiryDate: {
        type: Date,
        required: true,
        index: true
    },
    grantedAt: {
        type: Date,
        default: Date.now
    },
    revokedAt: {
        type: Date
    },
    accessCount: {
        type: Number,
        default: 0
    },
    lastAccessedAt: {
        type: Date
    }
});

// Compound indexes for efficient queries
accessGrantSchema.index({ recordId: 1, granteeId: 1, status: 1 });
accessGrantSchema.index({ ownerId: 1, status: 1 });
accessGrantSchema.index({ granteeId: 1, status: 1 });

// Check if grant is expired
accessGrantSchema.methods.isExpired = function() {
    return this.expiryDate < new Date();
};

// Auto-expire grants
accessGrantSchema.pre('save', function() {
    if (this.isExpired() && this.status === 'active') {
        this.status = 'expired';
    }
});

module.exports = mongoose.model('AccessGrant', accessGrantSchema);

