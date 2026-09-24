import React from 'react';
import { MeetingStatus } from '@/lib/types';

interface MeetingStatusBadgeProps {
  status: MeetingStatus;
  isNew?: boolean;
}

export function MeetingStatusBadge({ status, isNew = false }: MeetingStatusBadgeProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {status === 'APPROVED' && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-bold shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          APPROVED
        </span>
      )}

      {status === 'FINAL' && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-600 text-white text-[11px] font-bold shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-200"></span>
          FINAL
        </span>
      )}

      {status === 'REVIEW' && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-[11px] font-bold shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          REVIEW
        </span>
      )}

      {status === 'DRAFT' && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-slate-600 text-[11px] font-bold shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          DRAFT
        </span>
      )}

      {isNew && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-bold uppercase shadow-xs">
          BARU
        </span>
      )}
    </div>
  );
}
