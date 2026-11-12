'use client';

import React from 'react';
import { CheckCircle2, Clock, PlayCircle } from 'lucide-react';
import { ActionItemStatus, ActionItemPriority } from '@/lib/types';

interface ActionItemStatusBadgeProps {
  status: ActionItemStatus | string;
  isOverdue?: boolean;
}

export function ActionItemStatusBadge({ status }: ActionItemStatusBadgeProps) {
  const s = String(status || '').toUpperCase();

  if (s === 'COMPLETED' || s === 'FINISH' || s === 'SELESAI') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ECF8E9] text-[#2E7D32] text-[11px] font-bold border border-[#C8E6C9] shadow-2xs whitespace-nowrap select-none">
        <CheckCircle2 className="w-3.5 h-3.5 text-[#388E3C] shrink-0" />
        <span>Selesai</span>
      </span>
    );
  }

  if (s === 'IN_PROGRESS' || s === 'ON_PROGRESS' || s === 'ON PROGRESS' || s === 'ON PROGRES' || s === 'BERJALAN' || s === 'DALAM PROSES') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F5F7] text-[#164E59] text-[11px] font-bold border border-[#BCE3EB] shadow-2xs whitespace-nowrap select-none">
        <Clock className="w-3.5 h-3.5 text-[#31889C] shrink-0" />
        <span>Dalam Proses</span>
      </span>
    );
  }

  // Default is strictly 'Belum Dimulai'
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFF8CC] text-[#8A7200] text-[11px] font-bold border border-[#FFEE99] shadow-2xs whitespace-nowrap select-none">
      <PlayCircle className="w-3.5 h-3.5 text-[#B96800] shrink-0" />
      <span>Belum Dimulai</span>
    </span>
  );
}

interface ActionItemPriorityBadgeProps {
  priority: ActionItemPriority | string;
}

export function ActionItemPriorityBadge({ priority }: ActionItemPriorityBadgeProps) {
  const p = String(priority || '').toUpperCase();

  switch (p) {
    case 'URGENT':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[11px] font-semibold border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span>Sangat Mendesak</span>
        </span>
      );
    case 'HIGH':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>Tinggi</span>
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-[11px] font-semibold border border-sky-200">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          <span>Sedang</span>
        </span>
      );
    case 'LOW':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <span>Rendah</span>
        </span>
      );
  }
}
