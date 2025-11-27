/**
 * Healthcare Record Uploader Service with MongoDB
 * Handles encryption, MinIO upload, and MongoDB storage
 */

const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs').promises;
const cors = require('cors');
const { connectDatabase } = require('./config/database');
const { encryptRecord, generateDEK } = require('./lib/crypto');
const { uploadToMinIO } = require('./lib/minioClient');
const { wrapKey } = require('./lib/vaultClient');
const Record = require('./models/Record');
const { logAudit } = require('./services/accessControl');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Enable CORS
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:3003',
        process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true
}));

app.use(express.json());

// Connect to MongoDB
connectDatabase().catch(err => {
    console.error('Failed to connect to MongoDB:', err);
});

/**
 * POST /api/upload
 * Upload and encrypt a FHIR JSON record
 */
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        const { ownerId, policyId } = req.body;
        
        if (!ownerId || !policyId || !req.file) {
            return res.status(400).json({ 
                error: 'Missing required fields: ownerId, policyId, file' 
            });
        }

        // Read FHIR JSON file
        const filePath = req.file.path;
        const fhirData = await fs.readFile(filePath, 'utf8');
        
        // Validate JSON
        let fhirJson;
        try {
            fhirJson = JSON.parse(fhirData);
        } catch (e) {
            await fs.unlink(filePath);
            return res.status(400).json({ error: 'Invalid JSON file' });
        }

        // Generate random DEK (256-bit)
        const dek = generateDEK();
        console.log(`Generated DEK for record`);

        // Encrypt FHIR JSON with AES-GCM
        const { ciphertext, iv, authTag } = await encryptRecord(fhirData, dek);
        console.log(`Encrypted record: ${ciphertext.length} bytes`);

        // Calculate ciphertext hash
        const ciphertextHash = crypto
            .createHash('sha256')
            .update(ciphertext)
            .digest('hex');

        // Upload ciphertext to MinIO
        const recordId = `record_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
        const storagePointer = await uploadToMinIO(
            recordId,
            Buffer.concat([ciphertext, authTag]),
            'application/octet-stream'
        );
        console.log(`Uploaded to MinIO: ${storagePointer}`);

        // Wrap DEK using Vault KMS
        const wrappedDEK = await wrapKey(dek, ownerId);
        console.log(`Wrapped DEK via Vault`);

        // Extract metadata from FHIR
        const metadata = {
            resourceType: fhirJson.resourceType,
            patientName: fhirJson.name ? 
                `${fhirJson.name[0]?.given?.[0] || ''} ${fhirJson.name[0]?.family || ''}`.trim() : 
                null,
            condition: fhirJson.condition?.[0]?.code?.coding?.[0]?.display,
            lastUpdated: fhirJson.meta?.lastUpdated || new Date()
        };

        // Save to MongoDB
        const record = new Record({
            recordId,
            ownerId,
            patientId: fhirJson.id,
            storagePointer,
            ciphertextHash,
            wrappedDEK: wrappedDEK.toString('base64'),
            iv: iv.toString('base64'),
            policyId,
            metadata,
            status: 'active'
        });

        await record.save();
        console.log(`Saved to MongoDB: ${recordId}`);

        // Log audit trail
        await logAudit(recordId, ownerId, 'create');

        // Cleanup uploaded file
        await fs.unlink(filePath);

        res.json({
            status: 'success',
            recordId,
            pointer: storagePointer,
            ciphertextHash,
            message: 'Record encrypted and stored successfully'
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
            error: 'Upload failed', 
            message: error.message 
        });
    }
});

/**
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'uploader-mongodb', database: 'connected' });
});

// Import access control routes
require('./routes/accessControl')(app);
require('./routes/records')(app);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Uploader service (MongoDB) running on port ${PORT}`);
});

module.exports = app;

