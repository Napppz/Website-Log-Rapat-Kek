'use client';

import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, PlayCircle } from 'lucide-react';
import { ActionItemStatus, ActionItemPriority } from '@/lib/types';

interface ActionItemStatusBadgeProps {
  status: ActionItemStatus | string;
  isOverdue?: boolean;
}

export function ActionItemStatusBadge({ status, isOverdue }: ActionItemStatusBadgeProps) {
  // If overdue is indicated or status is OVERDUE
  if (status === 'OVERDUE' || (isOverdue && status !== 'COMPLETED')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FEF2F2] text-[#DC2626] text-[11px] font-bold border border-red-200">
        <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
        Terlambat
      </span>
    );
  }

  switch (status) {
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ECF8E9] text-[#4D8F3D] text-[11px] font-bold border border-[#D2EFCA]">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#7CC563]" />
          Selesai
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F5F7] text-[#31889C] text-[11px] font-bold border border-[#BCE3EB]">
          <Clock className="w-3.5 h-3.5 text-[#31889C]" />
          Sedang Berjalan
        </span>
      );
    case 'PENDING':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF8CC] text-[#8A7200] text-[11px] font-bold border border-[#FFEE99]">
          <PlayCircle className="w-3.5 h-3.5 text-[#8A7200]" />
          Belum Dimulai
        </span>
      );
  }
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
