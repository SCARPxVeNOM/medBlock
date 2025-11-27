/**
 * Healthcare Record Uploader Service
 * Handles encryption, MinIO upload, and Fabric chaincode submission
 */

const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const { encryptRecord, generateDEK } = require('./lib/crypto');
const { uploadToMinIO } = require('./lib/minioClient');
const { wrapKey } = require('./lib/vaultClient');
const { createRecordTransaction } = require('./lib/fabricClient');
const apiRouter = require('./api');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Enable CORS for frontend
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());
app.use('/api', apiRouter);

/**
 * POST /api/upload
 * Upload and encrypt a FHIR JSON record
 * Body: { ownerId, policyId, file (multipart) }
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
        console.log(`Generated DEK for record: ${dek.toString('hex').substring(0, 16)}...`);

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

        // Store wrapped DEK metadata locally (in production, use secure storage)
        const dekMetadataPath = path.join('keys', `${recordId}.json`);
        await fs.mkdir('keys', { recursive: true });
        await fs.writeFile(dekMetadataPath, JSON.stringify({
            recordId,
            ownerId,
            wrappedDEK: wrappedDEK.toString('base64'),
            iv: iv.toString('base64'),
            timestamp: new Date().toISOString()
        }));

        // Submit transaction to Fabric chaincode (if available)
        let txResult = null;
        try {
            txResult = await createRecordTransaction(
                recordId,
                ownerId,
                storagePointer,
                ciphertextHash,
                policyId
            );
            console.log(`Fabric transaction submitted: ${txResult.txId}`);
        } catch (fabricError) {
            console.warn('Fabric network not available, record stored without blockchain:', fabricError.message);
            // Continue without Fabric - record is still encrypted and stored
        }

        // Cleanup uploaded file
        await fs.unlink(filePath);

        res.json({
            status: 'success',
            recordId,
            storagePointer,
            ciphertextHash,
            txId: txResult?.txId || 'no-fabric',
            message: 'Record encrypted and stored successfully',
            note: txResult ? 'Stored on blockchain' : 'Stored locally (Fabric network not available)'
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
    res.json({ status: 'ok', service: 'uploader' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Uploader service running on port ${PORT}`);
});

module.exports = app;

