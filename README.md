# MedBlock - Healthcare Data Collaboration Platform

A production-minded PoC for a privacy-preserving, permissioned healthcare data collaboration platform built on Hyperledger Fabric.

## Architecture

- **Blockchain**: Hyperledger Fabric (dev network) - stores metadata only, NO PHI on-chain
- **Storage**: MinIO (S3-compatible) - stores encrypted FHIR records
- **KMS**: Vault Mock - simulates key management service for DEK wrapping/unwrapping
- **Backend**: Node.js (Express) - uploader service and key-service event listener
- **Frontend**: React + Tailwind CSS - consent management UI
- **Encryption**: Client-side AES-GCM with per-record DEKs

## Security Principles

- ✅ **No plaintext PHI on-chain** - Only metadata stored in chaincode
- ✅ **Client-side encryption** - Records encrypted before upload
- ✅ **Per-record DEKs** - Each record has unique encryption key
- ✅ **Key wrapping** - DEKs wrapped via Vault KMS
- ✅ **Event-driven re-encryption** - Key service processes access grants
- ⚠️ **PoC Limitations**: Vault mock uses local keystore (not HSM), PRE simulation (not true PRE)

## Prerequisites

- Docker & Docker Compose
- Node.js 18+
- npm or yarn

## Quick Start

### Prerequisites

**IMPORTANT**: Make sure Docker Desktop is installed and running before proceeding!

1. **Docker Desktop** - Must be running
   - Download: https://www.docker.com/products/docker-desktop
   - Verify: `docker ps` should work without errors

2. **Node.js 18+** - For backend and frontend

### 1. Clone and Setup

```bash
git clone <repo-url>
cd medblock
```

### 2. Start Essential Services (Simplified Setup)

For initial development, start only essential services:

```bash
# Start MinIO and Vault-mock
docker-compose -f docker-compose.simple.yml up -d

# Verify services are running
docker ps
```

**OR** for full setup with Fabric network:

```bash
# Generate crypto materials (if not exists)
./scripts/init-fabric.sh

# Start all services (requires Docker Desktop running)
docker-compose up -d
```

**Note**: Full Fabric setup requires additional configuration. See SETUP.md for details.

### 3. Install Chaincode

```bash
# Package chaincode
cd chaincode
npm install
cd ..

# Install and instantiate (run from scripts/)
./scripts/install-chaincode.sh
```

### 4. Start Backend Services

```bash
cd backend
npm install
npm run start:uploader  # Terminal 1
npm run start:keyservice # Terminal 2
```

### 5. Start Frontend

```bash
cd frontend
npm install
npm start
```

### 6. Access Services

- Frontend: http://localhost:3000
- Uploader API: http://localhost:3001
- Key Service: http://localhost:3002
- MinIO Console: http://localhost:9001 (minioadmin/minioadmin)
- Vault Mock: http://localhost:8200

## Usage

### Upload a FHIR Record

```bash
# Using curl
curl -X POST http://localhost:3001/api/upload \
  -F "file=@sample-fhir.json" \
  -F "ownerId=org1" \
  -F "policyId=policy-001"
```

### Request Access (via UI)

1. Login to frontend (mock OAuth)
2. Navigate to Dashboard
3. Click on a record
4. Click "Request Access"
5. Fill in grantee ID and purpose
6. Submit request

### Grant Access (via Chaincode)

```bash
# Using Fabric CLI or backend API
# This triggers AccessGranted event, which key-service processes
```

### Retrieve and Decrypt Record (Grantee)

1. Fetch wrapped DEK from key-service: `GET /api/keys/:recordId/:granteeId`
2. Unwrap DEK: `POST /api/keys/unwrap`
3. Download ciphertext from MinIO
4. Decrypt using unwrapped DEK

## Project Structure

```
medblock/
├── chaincode/              # Fabric chaincode (JavaScript)
│   ├── index.js           # Main chaincode contract
│   └── package.json
├── backend/                # Node.js services
│   ├── uploader.js        # Upload & encryption service
│   ├── keyservice.js      # Event listener & key management
│   ├── lib/
│   │   ├── crypto.js      # AES-GCM encryption
│   │   ├── minioClient.js # MinIO S3 client
│   │   ├── vaultClient.js # Vault KMS client (mock)
│   │   └── fabricClient.js # Fabric network client
│   └── tests/             # Unit tests
├── frontend/              # React application
│   ├── src/
│   │   ├── App.jsx        # Main app component
│   │   ├── pages/         # Dashboard, Login, etc.
│   │   ├── components/    # RecordCard, GrantModal, etc.
│   │   └── context/       # Auth context
│   └── package.json
├── scripts/               # Setup and utility scripts
│   ├── init-fabric.sh
│   └── install-chaincode.sh
├── fabric-network/        # Fabric crypto materials (generated)
├── minio-data/           # MinIO storage (local)
├── vault-mock/           # Vault mock server files
└── docker-compose.yml    # All services orchestration
```

## Chaincode Functions

- `CreateRecord(recordId, ownerId, pointer, ciphertextHash, policyId)` - Store record metadata
- `RequestAccess(recordId, granteeId, purpose)` - Request access (emits event)
- `GrantAccess(recordId, granteeId, purpose, expiry)` - Grant access (emits event)
- `RevokeAccess(recordId, granteeId)` - Revoke access
- `LogAccess(recordId, granteeId, action, metadataHash)` - Audit log entry
- `QueryRecordsByOwner(ownerId)` - Query records by owner
- `GetRecord(recordId)` - Get record metadata

## API Endpoints

### Uploader Service (Port 3001)

- `POST /api/upload` - Upload and encrypt FHIR record
- `GET /api/health` - Health check

### Key Service (Port 3002)

- `GET /api/keys/:recordId/:granteeId` - Get wrapped DEK for grantee
- `POST /api/keys/unwrap` - Unwrap DEK
- `GET /api/health` - Health check

## Testing

```bash
# Run chaincode tests
cd chaincode
npm test

# Run backend tests
cd backend
npm test
```

## Development Notes

### TODOs for Production

1. **HSM Integration**: Replace Vault mock with real HashiCorp Vault or HSM
2. **True PRE**: Implement proper Proxy Re-Encryption (e.g., NuCypher, NuCypher Python)
3. **Authentication**: Replace mock OAuth with SMART on FHIR OAuth2
4. **Key Storage**: Use secure key storage (not local filesystem)
5. **Network Security**: Enable TLS for all Fabric components
6. **Monitoring**: Add logging and monitoring (ELK, Prometheus)
7. **Backup**: Implement key backup and recovery procedures

### Encryption Flow

1. **Upload**: Client generates DEK → Encrypts FHIR JSON → Uploads to MinIO → Wraps DEK via Vault → Submits metadata to Fabric
2. **Access Grant**: Owner grants access → Chaincode emits event → Key service unwraps DEK → Rewraps for grantee → Stores grantee-wrapped DEK
3. **Access**: Grantee fetches wrapped DEK → Unwraps via Vault → Downloads ciphertext → Decrypts with DEK

## License

MIT

## Contributing

This is a PoC. For production use, address all TODOs and security considerations.

