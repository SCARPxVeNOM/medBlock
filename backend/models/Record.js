/**
 * Healthcare Record Model
 * Stores encrypted record metadata
 */

const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
    recordId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    ownerId: {
        type: String,
        required: true,
        index: true,
        ref: 'Organization'
    },
    patientId: {
        type: String,
        index: true
    },
    storagePointer: {
        type: String,
        required: true // MinIO URL or object key
    },
    ciphertextHash: {
        type: String,
        required: true
    },
    wrappedDEK: {
        type: String,
        required: true // Base64 encoded wrapped DEK
    },
    iv: {
        type: String,
        required: true // Initialization vector for AES
    },
    policyId: {
        type: String,
        required: true
    },
    metadata: {
        resourceType: String,
        patientName: String,
        condition: String,
        lastUpdated: Date
    },
    status: {
        type: String,
        enum: ['active', 'revoked', 'archived'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for efficient queries
recordSchema.index({ ownerId: 1, createdAt: -1 });
recordSchema.index({ patientId: 1, ownerId: 1 });

recordSchema.pre('save', function() {
    this.updatedAt = Date.now();
});

module.exports = mongoose.model('Record', recordSchema);

