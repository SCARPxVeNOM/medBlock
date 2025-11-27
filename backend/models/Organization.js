/**
 * Organization Model
 * Represents Hospital A, Hospital B, etc.
 */

const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
    orgId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['hospital', 'clinic', 'research', 'insurance'],
        default: 'hospital'
    },
    email: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
organizationSchema.pre('save', function() {
    this.updatedAt = Date.now();
});

module.exports = mongoose.model('Organization', organizationSchema);

