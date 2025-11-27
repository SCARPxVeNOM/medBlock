import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRecords } from '../api';
import RecordCard from '../components/RecordCard';
import { AnimatedGradientText } from '../components/ui/animated-gradient-text';
import { BlurFade } from '../components/ui/blur-fade';
import { AnimatedGridPattern } from '../components/ui/animated-grid-pattern';
import { NumberTicker } from '../components/ui/number-ticker';
import { FileText, AlertCircle } from 'lucide-react';

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
            <h1 className="text-5xl font-bold mb-4">
              <AnimatedGradientText>Dashboard</AnimatedGradientText>
            </h1>
            <p className="text-gray-300 text-lg">Manage your healthcare records securely</p>
            <div className="mt-6 flex items-center gap-6">
              <div className="flex items-center gap-2 text-white/70">
                <FileText className="w-5 h-5" />
                <span>Total Records:</span>
                <span className="text-white font-bold text-xl">
                  <NumberTicker value={records.length} />
                </span>
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
                onClick={() => navigate(`/record/${record.recordId}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;

