import React, { useState, useEffect } from 'react';
import { X, Shield, Send, CheckCircle, AlertCircle } from 'lucide-react';

function GrantModal({ isOpen, onClose, record, onGrant }) {
  const [organizations, setOrganizations] = useState([]);
  const [granteeId, setGranteeId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expiryDays, setExpiryDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const purposes = [
    'Patient Transfer',
    'Medical Consultation',
    'Second Opinion',
    'Research Study',
    'Emergency Care',
    'Specialist Referral',
    'Care Coordination',
    'Other'
  ];

  useEffect(() => {
    if (isOpen) {
      loadOrganizations();
    }
  }, [isOpen]);

  const loadOrganizations = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/organizations');
      const data = await response.json();
      // Filter out current owner
      const filtered = data.filter(org => org.orgId !== record?.ownerId);
      setOrganizations(filtered);
    } catch (error) {
      console.error('Error loading organizations:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!granteeId || !purpose) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/access/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId: record.recordId,
          ownerId: record.ownerId,
          granteeId,
          purpose,
          expiryDays
        })
      });

      if (!response.ok) {
        throw new Error('Failed to grant access');
      }

      setSuccess(true);
      
      setTimeout(() => {
        if (onGrant) onGrant();
        handleClose();
      }, 2000);

    } catch (err) {
      setError(err.message || 'Failed to grant access');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setGranteeId('');
    setPurpose('');
    setExpiryDays(30);
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Grant Access</h2>
              <p className="text-gray-400">Share this record with another organization</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center hover:bg-slate-800 rounded-xl transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Status Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-900/20 border-2 border-green-500 rounded-2xl flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <span className="text-green-300 font-medium">Access granted successfully!</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border-2 border-red-500 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <span className="text-red-300 font-medium">{error}</span>
          </div>
        )}

        {/* Record Info */}
        <div className="mb-8 p-6 bg-slate-800/50 border border-slate-700 rounded-2xl">
          <p className="text-sm text-gray-400 mb-2">Granting access to record:</p>
          <p className="text-white font-mono text-sm mb-3 break-all">{record?.recordId}</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Owner:</span>
            <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm rounded-lg font-medium">
              {record?.ownerId}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Grantee Organization */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Grantee Organization <span className="text-red-400">*</span>
            </label>
            <select
              value={granteeId}
              onChange={(e) => setGranteeId(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              required
            >
              <option value="">Select organization...</option>
              {organizations.map(org => (
                <option key={org.orgId} value={org.orgId}>
                  {org.name} ({org.orgId})
                </option>
              ))}
            </select>
            <p className="text-gray-500 text-xs mt-2">
              Select which organization will receive access
            </p>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Purpose <span className="text-red-400">*</span>
            </label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 transition-all"
              required
            >
              <option value="">Select purpose...</option>
              {purposes.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <p className="text-gray-500 text-xs mt-2">
              Specify the reason for granting access
            </p>
          </div>

          {/* Expiry Duration */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Access Duration
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[7, 14, 30, 90].map(days => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setExpiryDays(days)}
                  disabled={loading}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    expiryDays === days
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-slate-800 text-gray-400 hover:bg-slate-700 border-2 border-slate-700'
                  }`}
                >
                  {days} days
                </button>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-900/20 border-2 border-blue-500/30 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-blue-300 font-semibold mb-2">Secure Key Exchange</p>
                <p className="text-blue-200/70 text-sm leading-relaxed">
                  The decryption key will be securely re-wrapped for the grantee organization. 
                  Access can be revoked at any time and will automatically expire after the specified duration.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={loading || !granteeId || !purpose}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-blue-500/30"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  <span>Granting Access...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Grant Access</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 border-2 border-slate-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GrantModal;
