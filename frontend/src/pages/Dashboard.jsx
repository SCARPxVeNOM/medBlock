import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRecords } from '../api';
import RecordCard from '../components/RecordCard';
import UploadModal from '../components/UploadModal';
import SharedRecordsView from '../components/SharedRecordsView';
import PendingRequestsView from '../components/PendingRequestsView';
import AccessRequestModal from '../components/AccessRequestModal';
import { AnimatedGradientText } from '../components/ui/animated-gradient-text';
import { BlurFade } from '../components/ui/blur-fade';
import { AnimatedGridPattern } from '../components/ui/animated-grid-pattern';
import { NumberTicker } from '../components/ui/number-ticker';
import { FileText, AlertCircle, Upload, RefreshCw, Share2, Clock, Lock } from 'lucide-react';

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeTab, setActiveTab] = useState('my-records'); // 'my-records', 'shared', 'requests'
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    loadRecords();
  }, [user]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await getRecords(user.id);
      setRecords(data);
      setError(null);
    } catch (err) {
      setError('Failed to load records');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (result) => {
    console.log('Upload successful:', result);
    loadRecords(); // Reload records after successful upload
  };

  const handleRequestAccess = (record) => {
    setSelectedRecord(record);
    setShowRequestModal(true);
  };

  const handleRecordClick = (record) => {
    // If it's user's own record, navigate to details
    if (record.ownerId === user.id) {
      navigate(`/record/${record.recordId}`);
    } else {
      // If it's someone else's record, show request access
      handleRequestAccess(record);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen relative overflow-hidden">
        <AnimatedGridPattern />
        <BlurFade>
          <div className="text-center z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading records...</p>
          </div>
        </BlurFade>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <AnimatedGridPattern />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BlurFade delay={0.1}>
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-5xl font-bold mb-4">
                  <AnimatedGradientText>Dashboard</AnimatedGradientText>
                </h1>
                <p className="text-gray-300 text-lg">
                  {user.id === 'hospital-a' && '🏥 Hospital A - Medical Center'}
                  {user.id === 'hospital-b' && '🏥 Hospital B - Regional Clinic'}
                  {user.id !== 'hospital-a' && user.id !== 'hospital-b' && `${user.name || user.id}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={loadRecords}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-medium transition-all flex items-center gap-2 shadow-lg shadow-purple-500/25"
                >
                  <Upload className="w-5 h-5" />
                  <span>Upload Record</span>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-4 mb-8 border-b border-white/10">
              <button
                onClick={() => setActiveTab('my-records')}
                className={`px-6 py-3 font-medium transition-all relative ${
                  activeTab === 'my-records'
                    ? 'text-white border-b-2 border-purple-500'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  <span>My Records</span>
                  {records.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                      {records.length}
                    </span>
                  )}
                </div>
              </button>

              <button
                onClick={() => setActiveTab('shared')}
                className={`px-6 py-3 font-medium transition-all relative ${
                  activeTab === 'shared'
                    ? 'text-white border-b-2 border-cyan-500'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  <span>Shared with Me</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('requests')}
                className={`px-6 py-3 font-medium transition-all relative ${
                  activeTab === 'requests'
                    ? 'text-white border-b-2 border-yellow-500'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>Pending Requests</span>
                </div>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-white/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-purple-400" />
                  <div>
                    <p className="text-white/60 text-sm">My Records</p>
                    <p className="text-white font-bold text-2xl">
                      <NumberTicker value={records.length} />
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-white/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <Share2 className="w-8 h-8 text-cyan-400" />
                  <div>
                    <p className="text-white/60 text-sm">Shared Access</p>
                    <p className="text-cyan-400 font-bold text-2xl">Real-time</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-white/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <Lock className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="text-white/60 text-sm">Encryption</p>
                    <p className="text-green-400 font-bold text-sm">AES-256-GCM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </BlurFade>

        {error && (
          <BlurFade delay={0.2}>
            <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-6 py-4 rounded-lg mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </BlurFade>
        )}

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'my-records' && (
            <>
              {records.length === 0 ? (
                <BlurFade delay={0.3}>
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl shadow-2xl p-12 text-center">
                    <FileText className="w-16 h-16 text-white/40 mx-auto mb-4" />
                    <p className="text-white/60 text-lg">No records found. Upload a record to get started.</p>
                  </div>
                </BlurFade>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {records.map((record, index) => (
                    <RecordCard
                      key={record.recordId}
                      record={record}
                      index={index}
                      onClick={() => handleRecordClick(record)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'shared' && <SharedRecordsView />}

          {activeTab === 'requests' && <PendingRequestsView />}
        </div>
      </div>
      
      <UploadModal 
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {selectedRecord && (
        <AccessRequestModal
          isOpen={showRequestModal}
          onClose={() => {
            setShowRequestModal(false);
            setSelectedRecord(null);
          }}
          record={selectedRecord}
        />
      )}
    </div>
  );
}

export default Dashboard;
