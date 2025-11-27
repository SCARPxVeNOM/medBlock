/**
 * MinIO S3-compatible client
 * Handles encrypted record storage
 */

const MinIO = require('minio');
const crypto = require('crypto');

const minioClient = new MinIO.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
});

const BUCKET_NAME = 'healthcare-records';

/**
 * Ensure bucket exists
 */
async function ensureBucket() {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
        await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
        console.log(`Created bucket: ${BUCKET_NAME}`);
    }
}

// Initialize bucket on module load
ensureBucket().catch(console.error);

/**
 * Upload encrypted record to MinIO
 * @param {string} recordId - Record identifier
 * @param {Buffer} data - Encrypted data buffer
 * @param {string} contentType - MIME type
 * @returns {string} Storage pointer (URL)
 */
async function uploadToMinIO(recordId, data, contentType = 'application/octet-stream') {
    try {
        await ensureBucket();

        const objectName = `records/${recordId}.enc`;
        
        await minioClient.putObject(
            BUCKET_NAME,
            objectName,
            data,
            data.length,
            {
                'Content-Type': contentType,
                'X-Record-Id': recordId
            }
        );

        // Return storage pointer
        const storagePointer = `${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || '9000'}/${BUCKET_NAME}/${objectName}`;
        
        console.log(`Uploaded to MinIO: ${objectName}`);
        return storagePointer;

    } catch (error) {
        console.error('MinIO upload error:', error);
        throw new Error(`Failed to upload to MinIO: ${error.message}`);
    }
}

/**
 * Download encrypted record from MinIO
 * @param {string} storagePointer - Storage URL or object name
 * @returns {Buffer} Encrypted data
 */
async function downloadFromMinIO(storagePointer) {
    try {
        // Extract object name from storage pointer
        const objectName = storagePointer.includes('/') 
            ? storagePointer.split('/').slice(-2).join('/') // Get bucket/object
            : storagePointer;

        const dataStream = await minioClient.getObject(BUCKET_NAME, objectName);
        const chunks = [];

        return new Promise((resolve, reject) => {
            dataStream.on('data', (chunk) => chunks.push(chunk));
            dataStream.on('end', () => resolve(Buffer.concat(chunks)));
            dataStream.on('error', reject);
        });

    } catch (error) {
        console.error('MinIO download error:', error);
        throw new Error(`Failed to download from MinIO: ${error.message}`);
    }
}

module.exports = {
    uploadToMinIO,
    downloadFromMinIO,
    ensureBucket
};

