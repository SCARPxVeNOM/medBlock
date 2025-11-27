/**
 * API client for backend services
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const KEYSERVICE_URL = process.env.REACT_APP_KEYSERVICE_URL || 'http://localhost:3002';

/**
 * Get records for current user
 */
export async function getRecords(ownerId) {
  // TODO: Implement backend endpoint
  // For now, query Fabric via backend
  const response = await fetch(`${API_URL}/api/records?ownerId=${ownerId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch records');
  }
  return response.json();
}

/**
 * Get record by ID
 */
export async function getRecord(recordId) {
  // TODO: Implement backend endpoint
  const response = await fetch(`${API_URL}/api/records/${recordId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch record');
  }
  return response.json();
}

/**
 * Request access to a record
 */
export async function requestAccess(recordId, granteeId, purpose) {
  const response = await fetch(`${API_URL}/api/request-access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recordId, granteeId, purpose })
  });
  if (!response.ok) {
    throw new Error('Failed to request access');
  }
  return response.json();
}

/**
 * Grant access to a record
 */
export async function grantAccess(recordId, granteeId, purpose, expiry) {
  const response = await fetch(`${API_URL}/api/grant-access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recordId, granteeId, purpose, expiry })
  });
  if (!response.ok) {
    throw new Error('Failed to grant access');
  }
  return response.json();
}

/**
 * Get audit log
 */
export async function getAuditLog(ownerId) {
  const response = await fetch(`${API_URL}/api/audit?ownerId=${ownerId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch audit log');
  }
  return response.json();
}

/**
 * Get wrapped DEK for grantee
 */
export async function getWrappedKey(recordId, granteeId) {
  const response = await fetch(`${KEYSERVICE_URL}/api/keys/${recordId}/${granteeId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch wrapped key');
  }
  return response.json();
}

