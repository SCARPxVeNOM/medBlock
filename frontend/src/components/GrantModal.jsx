import React, { useState } from 'react';
import { MagicCard } from './ui/magic-card';
import { BorderBeam } from './ui/border-beam';
import { ShimmerButton } from './ui/shimmer-button';
import { AnimatedGradientText } from './ui/animated-gradient-text';
import { X, User, Target, Calendar } from 'lucide-react';

function GrantModal({ recordId, onGrant, onClose }) {
  const [granteeId, setGranteeId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expiryDays, setExpiryDays] = useState(30);

  const handleSubmit = (e) => {
    e.preventDefault();
    const expiry = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString();
    onGrant(granteeId, purpose, expiry);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <MagicCard className="p-8">
          <div className="relative z-20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">
                <AnimatedGradientText>Grant Access</AnimatedGradientText>
              </h3>
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Grantee Organization ID
                </label>
                <input
                  type="text"
                  required
                  value={granteeId}
                  onChange={(e) => setGranteeId(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all"
                  placeholder="e.g., org2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Purpose
                </label>
                <select
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all"
                >
                  <option value="" className="bg-gray-900">Select purpose</option>
                  <option value="Treatment" className="bg-gray-900">Treatment</option>
                  <option value="Research" className="bg-gray-900">Research</option>
                  <option value="Billing" className="bg-gray-900">Billing</option>
                  <option value="Public Health" className="bg-gray-900">Public Health</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Expiry (days)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all border border-white/10"
                >
                  Cancel
                </button>
                <ShimmerButton type="submit">
                  Grant Access
                </ShimmerButton>
              </div>
            </form>
          </div>
          <BorderBeam />
        </MagicCard>
      </div>
    </div>
  );
}

export default GrantModal;

