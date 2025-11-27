import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAuditLog } from '../api';
import { AnimatedGradientText } from '../components/ui/animated-gradient-text';
import { BlurFade } from '../components/ui/blur-fade';
import { AnimatedGridPattern } from '../components/ui/animated-grid-pattern';
import { MagicCard } from '../components/ui/magic-card';
import { BorderBeam } from '../components/ui/border-beam';
import { FileText, Clock, User, Hash } from 'lucide-react';

function AuditView() {
  const { user } = useAuth();
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLog();
  }, [user]);

  const loadAuditLog = async () => {
    try {
      setLoading(true);
      // TODO: Implement audit log API endpoint
      // For now, show mock data
      setAuditLog([
        {
          recordId: 'record_001',
          action: 'grant',
          granteeId: 'org2',
          timestamp: new Date().toISOString(),
          txId: 'tx_123'
        }
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <AnimatedGridPattern />
        <BlurFade>
          <div className="text-center z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading audit log...</p>
          </div>
        </BlurFade>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <AnimatedGridPattern />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <BlurFade delay={0.1}>
          <h1 className="text-4xl font-bold mb-8">
            <AnimatedGradientText>Audit Log</AnimatedGradientText>
          </h1>
        </BlurFade>

        <BlurFade delay={0.2}>
          <MagicCard className="p-6">
            <div className="relative z-20 overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Record ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Grantee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Transaction ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {auditLog.map((entry, index) => (
                    <tr key={index} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-white/40" />
                        {entry.recordId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-500/20 text-blue-200 border border-blue-500/50">
                          {entry.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white flex items-center gap-2">
                        <User className="w-4 h-4 text-white/40" />
                        {entry.granteeId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-white/40" />
                        {new Date(entry.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-white/60 flex items-center gap-2">
                        <Hash className="w-4 h-4 text-white/40" />
                        {entry.txId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {auditLog.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <p className="text-white/60">No audit entries found</p>
                </div>
              )}
            </div>
            <BorderBeam />
          </MagicCard>
        </BlurFade>
      </div>
    </div>
  );
}

export default AuditView;

