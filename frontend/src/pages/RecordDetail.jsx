import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRecord } from '../api';
import { ArrowLeft, Shield, User, Calendar, Hash, Database, Lock, Share2, Clock, CheckCircle } from 'lucide-react';

function RecordDetail() {
  const { recordId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRecord();
  }, [recordId]);

  const loadRecord = async () => {
    try {
      setLoading(true);
      const data = await getRecord(recordId);
      setRecord(data);
    } catch (err) {
      setError('Failed to load record details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          <p className="text-white text-lg">Loading record...</p>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-red-900/20 border-2 border-red-500 rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Record Not Found</h2>
          <p className="text-gray-400 mb-6">{error || 'This record does not exist or you do not have access.'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Database className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Record Details</h1>
              <p className="text-gray-400">Encrypted healthcare record</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Record Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Record ID Card */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Hash className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Record Identifier</h2>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                <p className="text-xs text-gray-400 mb-2">Record ID:</p>
                <p className="text-white font-mono text-sm break-all">{record.recordId}</p>
              </div>
            </div>

            {/* Owner & Metadata */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Record Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-400">Owner Organization</p>
                  </div>
                  <p className="text-white font-semibold text-lg">{record.ownerId}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-400">Created Date</p>
                  </div>
                  <p className="text-white font-semibold text-lg">
                    {new Date(record.timestamp).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {record.metadata && (
                <div className="mt-6 pt-6 border-t border-slate-700">
                  {record.metadata.patientName && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-400 mb-1">Patient Name</p>
                      <p className="text-white font-medium">{record.metadata.patientName}</p>
                    </div>
                  )}
                  {record.metadata.condition && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Condition</p>
                      <div className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="text-blue-300 font-medium">{record.metadata.condition}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Security Info */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                  <Lock className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Encryption Details</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Ciphertext Hash</p>
                  <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700">
                    <p className="text-white font-mono text-xs break-all">{record.ciphertextHash}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
                    <p className="text-green-400 text-sm font-medium mb-1">Algorithm</p>
                    <p className="text-white font-bold">AES-256-GCM</p>
                  </div>
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
                    <p className="text-blue-400 text-sm font-medium mb-1">Key Storage</p>
                    <p className="text-white font-bold">Vault KMS</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Access Management */}
          <div className="space-y-6">
            {/* Grant Access Card */}
            <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-6 shadow-xl shadow-blue-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Access Control</h2>
              </div>
              <p className="text-blue-100 mb-6">
                Grant access to other organizations in the network
              </p>
              <button className="w-full px-6 py-3 bg-white hover:bg-blue-50 text-blue-600 rounded-xl font-bold transition-all shadow-lg">
                Grant Access
              </button>
            </div>

            {/* Active Grants */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <h2 className="text-lg font-bold text-white">Active Access Grants</h2>
              </div>

              {record.accessGrants && record.accessGrants.length > 0 ? (
                <div className="space-y-3">
                  {record.accessGrants.map((grant) => (
                    <div key={grant.grantId} className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white font-medium">{grant.granteeId}</p>
                        <span className="px-2 py-1 bg-green-500/20 border border-green-500/30 text-green-400 text-xs rounded-lg font-medium">
                          Active
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-2">{grant.purpose}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Expires: {new Date(grant.expiryDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{grant.accessCount} access(es)</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No active grants</p>
                </div>
              )}
            </div>

            {/* Storage Info */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                  <Database className="w-5 h-5 text-orange-400" />
                </div>
                <h2 className="text-lg font-bold text-white">Storage</h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Location</span>
                  <span className="text-white font-medium">MinIO S3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Status</span>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full font-medium">Encrypted</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Pointer</span>
                  <span className="text-white font-mono text-xs">healthcare-records/...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecordDetail;
