import React, { useState } from 'react';
import { X, Lock, Send, AlertCircle, CheckCircle, FileText, Target, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function AccessRequestModal({ isOpen, onClose, record }) {
  const { user } = useAuth();
  const [purpose, setPurpose] = useState('');
  const [expiryDays, setExpiryDays] = useState(30);
  const [requesting, setRequesting] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!purpose) {
      setError('Please select a purpose for access');
      return;
    }

    setRequesting(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/access/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId: record.recordId,
          requesterId: user.id,
          purpose,
          expiryDays
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit request');
      }

      setStatus('success');
      
      setTimeout(() => {
        onClose();
        setPurpose('');
        setStatus(null);
      }, 2500);

    } catch (err) {
      setError(err.message || 'Failed to request access');
      setStatus('error');
    } finally {
      setRequesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl max-w-xl w-full p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Request Access</h2>
              <p className="text-gray-400">Request permission to view this record</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center hover:bg-slate-800 rounded-xl transition-colors"
            disabled={requesting}
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Status Messages */}
        {status === 'success' && (
          <div className="mb-6 p-4 bg-green-900/20 border-2 border-green-500 rounded-2xl flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <div>
              <p className="text-green-300 font-semibold">Request sent successfully!</p>
              <p className="text-green-400/70 text-sm">The owner will review your request</p>
            </div>
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
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-5 h-5 text-blue-400" />
            <p className="text-sm text-gray-400">Requesting access to:</p>
          </div>
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
          {/* Purpose */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Purpose <span className="text-red-400">*</span>
            </label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              disabled={requesting}
              className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 transition-all"
              required
            >
              <option value="">Select purpose...</option>
              {purposes.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <p className="text-gray-500 text-xs mt-2">
              Select the reason why you need access to this record
            </p>
          </div>

          {/* Duration Selector */}
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
                  disabled={requesting}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    expiryDays === days
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30'
                      : 'bg-slate-800 text-gray-400 hover:bg-slate-700 border-2 border-slate-700'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
            <p className="text-gray-500 text-xs mt-2">
              Access will automatically expire after this period
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-orange-900/10 border-2 border-orange-500/20 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-orange-300 font-semibold mb-2">Secure Access Request</p>
                <p className="text-orange-200/70 text-sm leading-relaxed">
                  Your request will be sent to the record owner for approval. 
                  If granted, you'll receive a time-limited decryption key to access the data.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={requesting || !purpose}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-orange-500/30"
            >
              {requesting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Send Request</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={requesting}
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

export default AccessRequestModal;
