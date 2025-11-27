/**
 * Unit tests for cryptographic functions
 */

const { expect } = require('chai');
const { generateDEK, encryptRecord, decryptRecord, hash } = require('../lib/crypto');

describe('Crypto Module', () => {
    describe('generateDEK', () => {
        it('should generate a 256-bit (32-byte) key', () => {
            const dek = generateDEK();
            expect(dek).to.be.instanceOf(Buffer);
            expect(dek.length).to.equal(32);
        });

        it('should generate unique keys', () => {
            const dek1 = generateDEK();
            const dek2 = generateDEK();
            expect(dek1.toString('hex')).to.not.equal(dek2.toString('hex'));
        });
    });

    describe('encryptRecord / decryptRecord', () => {
        it('should encrypt and decrypt FHIR JSON correctly', async () => {
            const fhirData = JSON.stringify({
                resourceType: 'Patient',
                id: 'patient-001',
                name: [{ given: ['John'], family: 'Doe' }]
            });

            const dek = generateDEK();
            const { ciphertext, iv, authTag } = await encryptRecord(fhirData, dek);

            expect(ciphertext).to.be.instanceOf(Buffer);
            expect(iv).to.be.instanceOf(Buffer);
            expect(authTag).to.be.instanceOf(Buffer);
            expect(ciphertext.toString()).to.not.equal(fhirData);

            const decrypted = await decryptRecord(ciphertext, dek, iv, authTag);
            expect(decrypted).to.equal(fhirData);
        });

        it('should fail decryption with wrong key', async () => {
            const fhirData = 'Test data';
            const dek1 = generateDEK();
            const dek2 = generateDEK();

            const { ciphertext, iv, authTag } = await encryptRecord(fhirData, dek1);

            try {
                await decryptRecord(ciphertext, dek2, iv, authTag);
                expect.fail('Should have thrown error');
            } catch (error) {
                expect(error).to.be.instanceOf(Error);
            }
        });

        it('should fail decryption with tampered ciphertext', async () => {
            const fhirData = 'Test data';
            const dek = generateDEK();
            const { ciphertext, iv, authTag } = await encryptRecord(fhirData, dek);

            // Tamper with ciphertext
            const tampered = Buffer.from(ciphertext);
            tampered[0] = tampered[0] ^ 1;

            try {
                await decryptRecord(tampered, dek, iv, authTag);
                expect.fail('Should have thrown error');
            } catch (error) {
                expect(error).to.be.instanceOf(Error);
            }
        });
    });

    describe('hash', () => {
        it('should generate SHA-256 hash', () => {
            const data = 'test data';
            const hashValue = hash(data);
            expect(hashValue).to.be.a('string');
            expect(hashValue.length).to.equal(64); // SHA-256 hex string
        });

        it('should generate consistent hashes', () => {
            const data = 'test data';
            const hash1 = hash(data);
            const hash2 = hash(data);
            expect(hash1).to.equal(hash2);
        });
    });
});

