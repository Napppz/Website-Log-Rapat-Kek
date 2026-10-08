'use client';

import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, PlayCircle } from 'lucide-react';
import { ActionItemStatus, ActionItemPriority } from '@/lib/types';

interface ActionItemStatusBadgeProps {
  status: ActionItemStatus | string;
  isOverdue?: boolean;
}

export function ActionItemStatusBadge({ status, isOverdue }: ActionItemStatusBadgeProps) {
  const s = String(status || '').toUpperCase();

  if (s === 'COMPLETED' || s === 'FINISH' || s === 'SELESAI') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ECF8E9] text-[#2E7D32] text-[11px] font-bold border border-[#C8E6C9] shadow-2xs">
        <CheckCircle2 className="w-3.5 h-3.5 text-[#388E3C]" />
        Finish
      </span>
    );
  }

  if (s === 'IN_PROGRESS' || s === 'ON_PROGRESS' || s === 'ON PROGRESS' || s === 'ON PROGRES' || s === 'BERJALAN') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F5F7] text-[#164E59] text-[11px] font-bold border border-[#BCE3EB] shadow-2xs">
        <Clock className="w-3.5 h-3.5 text-[#31889C]" />
        On Progress
      </span>
    );
  }

  if (s === 'PENDING' || s === 'START' || s === 'BELUM DIMULAI') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFF8CC] text-[#8A7200] text-[11px] font-bold border border-[#FFEE99] shadow-2xs">
        <PlayCircle className="w-3.5 h-3.5 text-[#B96800]" />
        Start
      </span>
    );
  }

  if (s === 'OVERDUE' || (isOverdue && s !== 'COMPLETED')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FEF2F2] text-[#DC2626] text-[11px] font-bold border border-red-200 shadow-2xs">
        <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
        Terlambat
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200 shadow-2xs">
      {status}
    </span>
  );
}

interface ActionItemPriorityBadgeProps {
  priority: ActionItemPriority | string;
}

export function ActionItemPriorityBadge({ priority }: ActionItemPriorityBadgeProps) {
  switch (priority) {
    case 'URGENT':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#FEF2F2] text-[#DC2626] text-[11px] font-bold border border-red-200">
          Sangat Mendesak
        </span>
      );
    case 'HIGH':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#FFF0DC] text-[#B96800] text-[11px] font-bold border border-[#FEDEBE]">
          Tinggi
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#FFF8CC] text-[#8A7200] text-[11px] font-bold border border-[#FFEE99]">
          Sedang
        </span>
      );
    case 'LOW':
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
          Rendah
        </span>
      );
  }
}
