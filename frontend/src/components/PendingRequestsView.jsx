import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, User, CheckCircle, XCircle, FileText, Calendar, Target } from 'lucide-react';

function PendingRequestsView() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const loadRequests = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/access/requests?ownerId=${user.id}`);
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGrant = async (request) => {
    setProcessing(request.requestId);
    try {
      const response = await fetch('http://localhost:3001/api/access/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId: request.recordId,
          ownerId: user.id,
          granteeId: request.requesterId,
          purpose: request.purpose,
          expiryDays: request.expiryDays || 30
        })
      });

      if (response.ok) {
        alert('✓ Access granted successfully!');
        loadRequests();
      } else {
        throw new Error('Failed to grant access');
      }
    } catch (error) {
      console.error('Error granting access:', error);
      alert('✗ Failed to grant access. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleDeny = async (request) => {
    setProcessing(request.requestId);
    try {
      await fetch(`http://localhost:3001/api/access/requests/${request.requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'denied' })
      });

      alert('Access request denied');
      loadRequests();
    } catch (error) {
      console.error('Error denying request:', error);
      alert('Failed to process request');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-yellow-500"></div>
          <p className="text-gray-400">Loading requests...</p>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-slate-800/30 border-2 border-slate-700 rounded-2xl p-12 text-center">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-gray-600" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">No Pending Requests</h3>
        <p className="text-gray-400 max-w-md mx-auto">
          Access requests from other organizations will appear here for your review
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {requests.map((request, index) => (
        <div
          key={request.requestId}
          className="bg-slate-800/40 border-2 border-slate-700 hover:border-yellow-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10"
        >
          <div className="flex items-start justify-between gap-6">
            {/* Request Details */}
            <div className="flex-1">
              {/* Header with Time */}
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">Access Request</h3>
                  <p className="text-gray-400 text-sm">
                    {new Date(request.requestedAt).toLocaleString()}
                  </p>
                </div>
                <span className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-sm rounded-xl font-bold">
                  PENDING
                </span>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-cyan-400" />
                    <p className="text-gray-400 text-xs">Requester</p>
                  </div>
                  <p className="text-cyan-400 font-bold text-lg">{request.requesterId}</p>
                </div>

                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <p className="text-gray-400 text-xs">Duration</p>
                  </div>
                  <p className="text-purple-400 font-bold text-lg">{request.expiryDays || 30} days</p>
                </div>
              </div>

              {/* Record ID */}
              <div className="mb-5 p-4 bg-slate-900/50 border border-slate-700 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-400 text-xs">Record ID</p>
                </div>
                <p className="text-white font-mono text-xs break-all">{request.recordId}</p>
              </div>

              {/* Purpose */}
              <div className="p-5 bg-gradient-to-br from-orange-900/10 to-red-900/10 border-2 border-orange-500/20 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-orange-400" />
                  <p className="text-orange-300 font-semibold">Purpose</p>
                </div>
                <p className="text-white text-lg">{request.purpose}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleGrant(request)}
                disabled={processing === request.requestId}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-green-500/20"
              >
                <CheckCircle className="w-5 h-5" />
                Grant
              </button>
              <button
                onClick={() => handleDeny(request)}
                disabled={processing === request.requestId}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-red-500/20"
              >
                <XCircle className="w-5 h-5" />
                Deny
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default PendingRequestsView;
