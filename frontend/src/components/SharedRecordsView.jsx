import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Calendar, User, Clock, Eye, Download, Lock, CheckCircle, Target } from 'lucide-react';

function SharedRecordsView() {
  const { user } = useAuth();
  const [sharedRecords, setSharedRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSharedRecords();
    const interval = setInterval(loadSharedRecords, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const loadSharedRecords = async () => {
    try {
      setLoading(true);
      console.log('[SharedRecordsView] Loading shared records for user.id:', user.id);
      const response = await fetch(`http://localhost:3001/api/shared-records?granteeId=${user.id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[SharedRecordsView] API error:', errorData);
        throw new Error(errorData.error || 'Failed to load shared records');
      }
      
      const data = await response.json();
      console.log('[SharedRecordsView] Received shared records:', data);
      setSharedRecords(data);
    } catch (error) {
      console.error('[SharedRecordsView] Error loading shared records:', error);
      setSharedRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRecord = async (record) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/access/key/${record.recordId}/${user.id}`
      );
      
      if (!response.ok) {
        throw new Error('Access denied or expired');
      }

      const keyData = await response.json();
      
      alert(`✓ Access Granted!\n\nYou can now decrypt this record.\nDecryption key obtained successfully.\nAccess count: ${record.grantInfo.accessCount + 1}`);
      
      loadSharedRecords();
    } catch (error) {
      console.error('Error accessing record:', error);
      alert('✗ Failed to access record. Your permission may have expired.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-cyan-500"></div>
          <p className="text-gray-400">Loading shared records...</p>
        </div>
      </div>
    );
  }

  if (sharedRecords.length === 0) {
    return (
      <div className="bg-slate-800/30 border-2 border-slate-700 rounded-2xl p-12 text-center">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="w-10 h-10 text-gray-600" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">No Shared Records</h3>
        <p className="text-gray-400 max-w-md mx-auto">
          Records shared with you by other organizations will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sharedRecords.map((record) => (
        <div
          key={record.recordId}
          className="bg-slate-800/40 border-2 border-slate-700 hover:border-cyan-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 group"
        >
          {/* Shared Badge */}
          <div className="flex items-center justify-between mb-5">
            <span className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-black rounded-xl shadow-lg shadow-green-500/20">
              ✓ SHARED ACCESS
            </span>
            <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
          </div>

          {/* Record ID */}
          <div className="mb-5">
            <p className="text-xs text-gray-500 mb-2">Record ID</p>
            <p className="text-white font-mono text-sm truncate">{record.recordId}</p>
          </div>

          {/* Metadata Grid */}
          <div className="space-y-3 mb-5">
            {/* Owner */}
            <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl border border-slate-700">
              <User className="w-5 h-5 text-cyan-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-400">Shared by</p>
                <p className="text-cyan-400 font-bold">{record.ownerId}</p>
              </div>
            </div>

            {/* Patient Info */}
            {record.metadata?.patientName && (
              <div className="flex items-center gap-3 p-3 bg-purple-900/10 rounded-xl border border-purple-500/20">
                <User className="w-5 h-5 text-purple-400" />
                <div className="flex-1">
                  <p className="text-xs text-purple-400">Patient</p>
                  <p className="text-white font-semibold">{record.metadata.patientName}</p>
                </div>
              </div>
            )}

            {/* Condition */}
            {record.metadata?.condition && (
              <div className="p-3 bg-blue-900/10 rounded-xl border border-blue-500/20">
                <p className="text-blue-400 text-xs mb-1">Condition</p>
                <p className="text-white text-sm font-medium">{record.metadata.condition}</p>
              </div>
            )}

            {/* Grant Info */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-700">
                <div className="flex items-center gap-1 mb-1">
                  <Calendar className="w-3 h-3 text-gray-500" />
                  <p className="text-xs text-gray-500">Granted</p>
                </div>
                <p className="text-white text-sm font-medium">
                  {new Date(record.grantInfo.grantedAt).toLocaleDateString()}
                </p>
              </div>

              <div className="p-3 bg-orange-900/10 rounded-xl border border-orange-500/20">
                <div className="flex items-center gap-1 mb-1">
                  <Clock className="w-3 h-3 text-orange-400" />
                  <p className="text-xs text-orange-400">Expires</p>
                </div>
                <p className="text-orange-400 text-sm font-bold">
                  {new Date(record.grantInfo.expiryDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Access Count */}
            <div className="flex items-center justify-between p-3 bg-green-900/10 rounded-xl border border-green-500/20">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-medium">Access Count</span>
              </div>
              <span className="text-white font-bold text-lg">{record.grantInfo.accessCount}</span>
            </div>
          </div>

          {/* Purpose */}
          <div className="mb-5 p-4 bg-gradient-to-br from-cyan-900/10 to-blue-900/10 border-2 border-cyan-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-cyan-400" />
              <p className="text-cyan-300 font-semibold text-sm">Purpose</p>
            </div>
            <p className="text-white">{record.grantInfo.purpose}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => handleViewRecord(record)}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <Eye className="w-5 h-5" />
              View & Decrypt
            </button>
            <button
              className="w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all flex items-center justify-center"
              title="Download"
            >
              <Download className="w-5 h-5 text-gray-300" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SharedRecordsView;
