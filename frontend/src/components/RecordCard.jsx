import React from 'react';
import { BlurFade } from './ui/blur-fade';
import { Calendar, User } from 'lucide-react';

function RecordCard({ record, onClick, index = 0 }) {
  return (
    <BlurFade delay={index * 0.1}>
      <div 
        className="relative group cursor-pointer rounded-2xl p-6 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-purple-500/25 h-full"
        onClick={onClick}
      >
        <div className="relative z-10">
          {/* Record ID */}
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-white truncate">
              {record.recordId}
            </h3>
          </div>
          
          {/* Owner */}
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-white/90" />
            <span className="text-sm text-white/90">Owner:</span>
            <span className="text-sm text-white font-semibold">{record.ownerId}</span>
          </div>

          {/* Creation Date */}
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-white/90" />
            <span className="text-sm text-white/90">Created:</span>
            <span className="text-sm text-white font-semibold">
              {new Date(record.timestamp).toLocaleDateString()}
            </span>
          </div>

          {/* Hash/Identifier */}
          <div className="pt-3 border-t border-white/20">
            <span className="text-xs font-mono text-white/70 break-all">
              {record.ciphertextHash?.substring(0, 32)}...
            </span>
          </div>
        </div>
      </div>
    </BlurFade>
  );
}

export default RecordCard;

