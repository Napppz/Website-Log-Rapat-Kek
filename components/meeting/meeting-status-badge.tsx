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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ECF8E9] border border-[#D2EFCA] text-[#4D8F3D] text-[11px] font-bold shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7CC563]"></span>
          APPROVED
        </span>
      )}

      {status === 'FINAL' && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F5F7] border border-[#BCE3EB] text-[#31889C] text-[11px] font-bold shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#31889C]"></span>
          FINAL
        </span>
      )}

      {status === 'REVIEW' && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF8CC] border border-[#FFEE99] text-[#8A7200] text-[11px] font-bold shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFD300]"></span>
          REVIEW
        </span>
      )}

      {status === 'DRAFT' && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] text-[#64748B] text-[11px] font-bold shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]"></span>
          DRAFT
        </span>
      )}

      {isNew && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#FFF0DC] border border-[#FEDEBE] text-[#B96800] text-[10px] font-bold uppercase shadow-2xs">
          BARU
        </span>
      )}
    </div>
  );
}
