import React from 'react';
import { MagicCard } from './ui/magic-card';
import { BorderBeam } from './ui/border-beam';
import { BlurFade } from './ui/blur-fade';
import { NumberTicker } from './ui/number-ticker';
import { Shield, Calendar, User } from 'lucide-react';

function RecordCard({ record, onClick, index = 0 }) {
  return (
    <BlurFade delay={index * 0.1}>
      <div className="relative group cursor-pointer" onClick={onClick}>
        <MagicCard className="p-6 h-full">
          <div className="relative z-20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white truncate">
                {record.recordId}
              </h3>
              <span className="text-xs text-white/70 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <NumberTicker value={record.accessGrantsCount || 0} />
              </span>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-white/60" />
                <span className="text-white/60">Owner:</span>
                <span className="text-white font-medium">{record.ownerId}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-white/60" />
                <span className="text-white/60">Created:</span>
                <span className="text-white font-medium">
                  {new Date(record.timestamp).toLocaleDateString()}
                </span>
              </div>
              <div className="pt-2 border-t border-white/10">
                <span className="text-xs font-mono text-white/40 break-all">
                  {record.ciphertextHash?.substring(0, 32)}...
                </span>
              </div>
            </div>
          </div>
          <BorderBeam />
        </MagicCard>
      </div>
    </BlurFade>
  );
}

export default RecordCard;

