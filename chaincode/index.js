/**
 * Healthcare Data Collaboration Chaincode
 * Stores only metadata - NO PHI on-chain
 * Implements consent management and audit logging
 */

const { Contract } = require('fabric-contract-api');

class HealthcareContract extends Contract {
    /**
     * Initialize the chaincode
     */
    async Init(ctx) {
        console.info('Healthcare Chaincode initialized');
        return { status: 'OK' };
    }

    /**
     * CreateRecord - Store metadata for a healthcare record
     * @param {string} recordId - Unique record identifier
     * @param {string} ownerId - Owner organization/user ID
     * @param {string} pointer - Storage pointer (MinIO URL)
     * @param {string} ciphertextHash - SHA-256 hash of encrypted data
     * @param {string} policyId - Access policy identifier
     */
    async CreateRecord(ctx, recordId, ownerId, pointer, ciphertextHash, policyId) {
        // Validate inputs
        if (!recordId || !ownerId || !pointer || !ciphertextHash || !policyId) {
            throw new Error('Missing required parameters');
        }

        // Get client identity for authorization
        const clientId = ctx.clientIdentity.getMSPID();
        const clientCert = ctx.clientIdentity.getX509Certificate();
        
        // Check if record already exists
        const recordKey = ctx.stub.createCompositeKey('record', [recordId]);
        const existingRecord = await ctx.stub.getState(recordKey);
        if (existingRecord && existingRecord.length > 0) {
            throw new Error(`Record ${recordId} already exists`);
        }

        // Create record object (metadata only - NO PHI)
        const record = {
            recordId,
            ownerId,
            pointer,
            ciphertextHash,
            policyId,
            timestamp: new Date().toISOString(),
            createdBy: clientId,
            accessGrants: [],
            accessRequests: [],
            auditLog: []
        };

        // Store record
        await ctx.stub.putState(recordKey, Buffer.from(JSON.stringify(record)));

        // Emit event
        ctx.stub.setEvent('RecordCreated', Buffer.from(JSON.stringify({
            recordId,
            ownerId,
            timestamp: record.timestamp
        })));

        return { status: 'OK', recordId };
    }

    /**
     * RequestAccess - Request access to a record
     * @param {string} recordId - Record identifier
     * @param {string} granteeId - Requesting organization/user ID
     * @param {string} purpose - Purpose of access request
     */
    async RequestAccess(ctx, recordId, granteeId, purpose) {
        if (!recordId || !granteeId || !purpose) {
            throw new Error('Missing required parameters');
        }

        const recordKey = ctx.stub.createCompositeKey('record', [recordId]);
        const recordBytes = await ctx.stub.getState(recordKey);
        
        if (!recordBytes || recordBytes.length === 0) {
            throw new Error(`Record ${recordId} not found`);
        }

        const record = JSON.parse(recordBytes.toString());
        const requesterId = ctx.clientIdentity.getMSPID();

        // Create access request
        const request = {
            granteeId,
            requesterId,
            purpose,
            status: 'pending',
            timestamp: new Date().toISOString(),
            requestId: `${recordId}_${granteeId}_${Date.now()}`
        };

        record.accessRequests.push(request);

        await ctx.stub.putState(recordKey, Buffer.from(JSON.stringify(record)));

        // Emit event for key-service to process
        ctx.stub.setEvent('AccessRequested', Buffer.from(JSON.stringify({
            recordId,
            granteeId,
            purpose,
            requestId: request.requestId,
            timestamp: request.timestamp
        })));

        return { status: 'OK', requestId: request.requestId };
    }

    /**
     * GrantAccess - Grant access to a record
     * @param {string} recordId - Record identifier
     * @param {string} granteeId - Grantee organization/user ID
     * @param {string} purpose - Purpose of access
     * @param {string} expiry - Expiry timestamp (ISO string)
     */
    async GrantAccess(ctx, recordId, granteeId, purpose, expiry) {
        if (!recordId || !granteeId || !purpose || !expiry) {
            throw new Error('Missing required parameters');
        }

        const recordKey = ctx.stub.createCompositeKey('record', [recordId]);
        const recordBytes = await ctx.stub.getState(recordKey);
        
        if (!recordBytes || recordBytes.length === 0) {
            throw new Error(`Record ${recordId} not found`);
        }

        const record = JSON.parse(recordBytes.toString());
        const granterId = ctx.clientIdentity.getMSPID();

        // Authorization check: only owner can grant access
        if (record.ownerId !== granterId) {
            throw new Error('Only record owner can grant access');
        }

        // Check if grant already exists
        const existingGrant = record.accessGrants.find(g => g.granteeId === granteeId && g.status === 'active');
        if (existingGrant) {
            throw new Error(`Active grant already exists for ${granteeId}`);
        }

        // Create access grant
        const grant = {
            granteeId,
            granterId: record.ownerId,
            purpose,
            expiry,
            status: 'active',
            timestamp: new Date().toISOString(),
            grantId: `${recordId}_${granteeId}_${Date.now()}`
        };

        record.accessGrants.push(grant);

        // Update pending requests
        const pendingRequest = record.accessRequests.find(r => 
            r.granteeId === granteeId && r.status === 'pending'
        );
        if (pendingRequest) {
            pendingRequest.status = 'approved';
            pendingRequest.approvedAt = grant.timestamp;
        }

        await ctx.stub.putState(recordKey, Buffer.from(JSON.stringify(record)));

        // Emit event for key-service to issue rewrap
        ctx.stub.setEvent('AccessGranted', Buffer.from(JSON.stringify({
            recordId,
            granteeId,
            purpose,
            grantId: grant.grantId,
            expiry,
            timestamp: grant.timestamp
        })));

        // Log access grant
        await this.LogAccess(ctx, recordId, granteeId, 'grant', grant.grantId);

        return { status: 'OK', grantId: grant.grantId };
    }

    /**
     * RevokeAccess - Revoke access to a record
     * @param {string} recordId - Record identifier
     * @param {string} granteeId - Grantee to revoke access from
     */
    async RevokeAccess(ctx, recordId, granteeId) {
        if (!recordId || !granteeId) {
            throw new Error('Missing required parameters');
        }

        const recordKey = ctx.stub.createCompositeKey('record', [recordId]);
        const recordBytes = await ctx.stub.getState(recordKey);
        
        if (!recordBytes || recordBytes.length === 0) {
            throw new Error(`Record ${recordId} not found`);
        }

        const record = JSON.parse(recordBytes.toString());
        const revokerId = ctx.clientIdentity.getMSPID();

        // Authorization check: only owner can revoke
        if (record.ownerId !== revokerId) {
            throw new Error('Only record owner can revoke access');
        }

        // Find and revoke grant
        const grant = record.accessGrants.find(g => 
            g.granteeId === granteeId && g.status === 'active'
        );

        if (!grant) {
            throw new Error(`No active grant found for ${granteeId}`);
        }

        grant.status = 'revoked';
        grant.revokedAt = new Date().toISOString();

        await ctx.stub.putState(recordKey, Buffer.from(JSON.stringify(record)));

        // Emit event
        ctx.stub.setEvent('AccessRevoked', Buffer.from(JSON.stringify({
            recordId,
            granteeId,
            timestamp: grant.revokedAt
        })));

        // Log revocation
        await this.LogAccess(ctx, recordId, granteeId, 'revoke', grant.grantId);

        return { status: 'OK', grantId: grant.grantId };
    }

    /**
     * LogAccess - Append-only audit log entry
     * @param {string} recordId - Record identifier
     * @param {string} granteeId - User/org accessing
     * @param {string} action - Action performed (access, grant, revoke, etc.)
     * @param {string} metadataHash - Hash of access metadata (optional)
     */
    async LogAccess(ctx, recordId, granteeId, action, metadataHash) {
        if (!recordId || !granteeId || !action) {
            throw new Error('Missing required parameters');
        }

        const recordKey = ctx.stub.createCompositeKey('record', [recordId]);
        const recordBytes = await ctx.stub.getState(recordKey);
        
        if (!recordBytes || recordBytes.length === 0) {
            throw new Error(`Record ${recordId} not found`);
        }

        const record = JSON.parse(recordBytes.toString());
        const actorId = ctx.clientIdentity.getMSPID();

        // Create audit entry (append-only)
        const auditEntry = {
            recordId,
            granteeId,
            actorId,
            action,
            metadataHash: metadataHash || '',
            timestamp: new Date().toISOString(),
            txId: ctx.stub.getTxID()
        };

        record.auditLog.push(auditEntry);

        // Store updated record
        await ctx.stub.putState(recordKey, Buffer.from(JSON.stringify(record)));

        // Emit audit event
        ctx.stub.setEvent('AccessLogged', Buffer.from(JSON.stringify(auditEntry)));

        return { status: 'OK', auditEntry };
    }

    /**
     * QueryRecordsByOwner - Get all records for an owner
     * @param {string} ownerId - Owner identifier
     */
    async QueryRecordsByOwner(ctx, ownerId) {
        if (!ownerId) {
            throw new Error('Owner ID required');
        }

        const queryString = {
            selector: {
                ownerId: ownerId
            }
        };

        // Use CouchDB query if available, otherwise iterate
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const results = [];

        while (true) {
            const res = await iterator.next();
            if (res.value) {
                const record = JSON.parse(res.value.value.toString());
                // Return only metadata, not full record details
                results.push({
                    recordId: record.recordId,
                    ownerId: record.ownerId,
                    ciphertextHash: record.ciphertextHash,
                    timestamp: record.timestamp,
                    accessGrantsCount: record.accessGrants.length
                });
            }
            if (res.done) {
                await iterator.close();
                break;
            }
        }

        return JSON.stringify(results);
    }

    /**
     * GetRecord - Get record metadata by ID
     * @param {string} recordId - Record identifier
     */
    async GetRecord(ctx, recordId) {
        if (!recordId) {
            throw new Error('Record ID required');
        }

        const recordKey = ctx.stub.createCompositeKey('record', [recordId]);
        const recordBytes = await ctx.stub.getState(recordKey);
        
        if (!recordBytes || recordBytes.length === 0) {
            throw new Error(`Record ${recordId} not found`);
        }

        const record = JSON.parse(recordBytes.toString());
        
        // Return metadata only (no PHI)
        return JSON.stringify({
            recordId: record.recordId,
            ownerId: record.ownerId,
            pointer: record.pointer,
            ciphertextHash: record.ciphertextHash,
            policyId: record.policyId,
            timestamp: record.timestamp,
            accessGrants: record.accessGrants,
            accessRequests: record.accessRequests,
            auditLog: record.auditLog
        });
    }
}

module.exports = HealthcareContract;

