/**
 * Access Request Model
 * Hospital B requests access from Hospital A
 */

const mongoose = require('mongoose');

const accessRequestSchema = new mongoose.Schema({
    requestId: {
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
    requesterId: {
        type: String,
        required: true,
        index: true,
        ref: 'Organization'
    },
    purpose: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'denied', 'cancelled'],
        default: 'pending',
        index: true
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    respondedAt: {
        type: Date
    },
    responseMessage: {
        type: String
    },
    expiryDays: {
        type: Number,
        default: 30 // Requested access duration in days
    }
});

// Compound indexes
accessRequestSchema.index({ recordId: 1, requesterId: 1 });
accessRequestSchema.index({ ownerId: 1, status: 1 });
accessRequestSchema.index({ requesterId: 1, status: 1 });

module.exports = mongoose.model('AccessRequest', accessRequestSchema);

