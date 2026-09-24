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
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[11px] font-bold border border-red-300">
        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
        Terlambat
      </span>
    );
  }

  switch (status) {
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Selesai
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-300">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Sedang Berjalan
        </span>
      );
    case 'PENDING':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-300">
          <PlayCircle className="w-3.5 h-3.5 text-slate-500" />
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
        <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-100 text-red-900 text-[11px] font-bold border border-red-200">
          Sangat Mendesak
        </span>
      );
    case 'HIGH':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded bg-orange-100 text-orange-900 text-[11px] font-bold border border-orange-200">
          Tinggi
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-200">
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
