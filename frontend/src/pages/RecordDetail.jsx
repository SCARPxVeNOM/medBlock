import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRecord, requestAccess, grantAccess } from '../api';
import GrantModal from '../components/GrantModal';
import { AnimatedGradientText } from '../components/ui/animated-gradient-text';
import { BlurFade } from '../components/ui/blur-fade';
import { AnimatedGridPattern } from '../components/ui/animated-grid-pattern';
import { MagicCard } from '../components/ui/magic-card';
import { BorderBeam } from '../components/ui/border-beam';
import { ShimmerButton } from '../components/ui/shimmer-button';
import { ArrowLeft, User, Calendar, Hash, Database, Shield, Clock, CheckCircle } from 'lucide-react';

function RecordDetail() {
  const { recordId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRecord();
  }, [recordId]);

  const loadRecord = async () => {
    try {
      setLoading(true);
      const data = await getRecord(recordId);
      setRecord(data);
      setError(null);
    } catch (err) {
      setError('Failed to load record');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async (granteeId, purpose) => {
    try {
      await requestAccess(recordId, granteeId, purpose);
      alert('Access request submitted');
      loadRecord();
    } catch (err) {
      setError('Failed to request access');
      console.error(err);
    }
  };

  const handleGrantAccess = async (granteeId, purpose, expiry) => {
    try {
      await grantAccess(recordId, granteeId, purpose, expiry);
      alert('Access granted');
      loadRecord();
      setShowGrantModal(false);
    } catch (err) {
      setError('Failed to grant access');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <AnimatedGridPattern />
        <BlurFade>
          <div className="text-center z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading record...</p>
          </div>
        </BlurFade>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <AnimatedGridPattern />
        <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
          <BlurFade>
            <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-6 py-4 rounded-lg">
              Record not found
            </div>
          </BlurFade>
        </div>
      </div>
    );
  }

  const isOwner = record.ownerId === user.id;
  const activeGrants = record.accessGrants?.filter(g => g.status === 'active') || [];
  const pendingRequests = record.accessRequests?.filter(r => r.status === 'pending') || [];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <AnimatedGridPattern />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <BlurFade delay={0.1}>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-white/80 hover:text-white mb-6 flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </BlurFade>

        <BlurFade delay={0.2}>
          <MagicCard className="p-8 mb-6">
            <div className="relative z-20">
              <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">
                  <AnimatedGradientText>Record Details</AnimatedGradientText>
                </h1>
                <p className="text-white/60 text-sm font-mono">Record ID: {record.recordId}</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-white/60" />
                    <h3 className="text-sm font-medium text-white/60">Owner</h3>
                  </div>
                  <p className="text-white font-medium">{record.ownerId}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-white/60" />
                    <h3 className="text-sm font-medium text-white/60">Created</h3>
                  </div>
                  <p className="text-white font-medium">{new Date(record.timestamp).toLocaleString()}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="w-4 h-4 text-white/60" />
                    <h3 className="text-sm font-medium text-white/60">Ciphertext Hash</h3>
                  </div>
                  <p className="text-xs font-mono text-white/80 break-all">{record.ciphertextHash}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4 text-white/60" />
                    <h3 className="text-sm font-medium text-white/60">Storage Pointer</h3>
                  </div>
                  <p className="text-xs text-white/80 break-all">{record.pointer}</p>
                </div>
              </div>

              <div className="flex gap-4 mb-6">
                {isOwner && (
                  <ShimmerButton onClick={() => setShowGrantModal(true)}>
                    <Shield className="w-4 h-4 mr-2" />
                    Grant Access
                  </ShimmerButton>
                )}

                {!isOwner && (
                  <ShimmerButton onClick={() => handleRequestAccess(user.id, 'Treatment')}>
                    Request Access
                  </ShimmerButton>
                )}
              </div>
            </div>
            <BorderBeam />
          </MagicCard>
        </BlurFade>

        <BlurFade delay={0.3}>
          <MagicCard className="p-6 mb-6">
            <div className="relative z-20">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Active Access Grants
              </h2>
              {activeGrants.length === 0 ? (
                <p className="text-white/60">No active grants</p>
              ) : (
                <div className="space-y-3">
                  {activeGrants.map((grant) => (
                    <div key={grant.grantId} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <p className="font-medium text-white mb-2">{grant.granteeId}</p>
                      <p className="text-sm text-white/70 mb-1">Purpose: {grant.purpose}</p>
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <Clock className="w-4 h-4" />
                        <span>Expires: {new Date(grant.expiry).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <BorderBeam />
          </MagicCard>
        </BlurFade>

        {pendingRequests.length > 0 && isOwner && (
          <BlurFade delay={0.4}>
            <MagicCard className="p-6">
              <div className="relative z-20">
                <h2 className="text-xl font-semibold text-white mb-4">Pending Requests</h2>
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div key={request.requestId} className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
                      <p className="font-medium text-white mb-2">{request.granteeId}</p>
                      <p className="text-sm text-white/70 mb-3">Purpose: {request.purpose}</p>
                      <ShimmerButton
                        onClick={() => handleGrantAccess(request.granteeId, request.purpose, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())}
                        className="text-sm"
                      >
                        Approve
                      </ShimmerButton>
                    </div>
                  ))}
                </div>
              </div>
              <BorderBeam />
            </MagicCard>
          </BlurFade>
        )}

        {showGrantModal && (
          <GrantModal
            recordId={recordId}
            onGrant={handleGrantAccess}
            onClose={() => setShowGrantModal(false)}
          />
        )}
      </div>
    </div>
  );
}

export default RecordDetail;

