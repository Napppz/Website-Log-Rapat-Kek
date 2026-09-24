import React from 'react';
import { ActionItemProgressData } from '@/lib/types';

interface ActionItemProgressProps {
  data: ActionItemProgressData;
}

export function ActionItemProgress({ data }: ActionItemProgressProps) {
  const { total, completed, inProgress, overdue = 0, isCompletePercentage, summaryText } = data;

  const completedPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const inProgressPct = total > 0 ? Math.round((inProgress / total) * 100) : 0;
  const overduePct = total > 0 ? Math.round((overdue / total) * 100) : 0;

  // Case 1: 100% completed
  if (isCompletePercentage || completedPct === 100) {
    return (
      <div className="flex flex-col gap-1.5 min-w-[130px]">
        <div className="flex items-center justify-between text-[12px]">
          <span className="font-semibold text-slate-800">{total} Action Items</span>
          <span className="text-emerald-700 font-bold">100%</span>
        </div>
        <div className="h-2 w-32 bg-amber-100 rounded-full overflow-hidden">
          <div className="bg-emerald-600 h-full w-full" />
        </div>
        <span className="text-[11px] text-emerald-700 font-semibold">{summaryText}</span>
      </div>
    );
  }

  // Case 2: Has Overdue items (e.g. OPS-001)
  if (overdue > 0) {
    return (
      <div className="flex flex-col gap-1.5 min-w-[130px]">
        <div className="flex items-center justify-between text-[12px]">
          <span className="font-semibold text-slate-800">{total} Action Items</span>
          <span className="text-red-600 font-bold">{overdue} Terlambat</span>
        </div>
        <div className="h-2 w-32 bg-amber-100 rounded-full overflow-hidden flex">
          <div className="bg-amber-600 h-full" style={{ width: `${completedPct}%` }} />
          <div className="bg-red-500 h-full" style={{ width: `${overduePct}%` }} />
        </div>
        <span className="text-[11px] text-slate-500 font-medium">{summaryText}</span>
      </div>
    );
  }

  // Case 3: Completed + In-Progress (e.g. INV-001)
  if (completed > 0 && inProgress > 0) {
    return (
      <div className="flex flex-col gap-1.5 min-w-[130px]">
        <div className="flex items-center justify-between text-[12px]">
          <span className="font-semibold text-slate-800">{total} Action Items</span>
          <span className="text-amber-800 font-bold">{completed} Selesai</span>
        </div>
        <div className="h-2 w-32 bg-amber-100 rounded-full overflow-hidden flex">
          <div className="bg-amber-600 h-full" style={{ width: `${completedPct}%` }} />
          <div className="bg-amber-300 h-full" style={{ width: `${inProgressPct}%` }} />
        </div>
        <span className="text-[11px] text-slate-500 font-medium">{summaryText}</span>
      </div>
    );
  }

  // Case 4: In review or draft (e.g. LEG-001, IT-001)
  return (
    <div className="flex flex-col gap-1.5 min-w-[130px]">
      <div className="flex items-center justify-between text-[12px]">
        <span className="font-semibold text-slate-800">{total} Action Items</span>
        <span className="text-amber-700 font-medium">{completed > 0 ? `${completed} Selesai` : 'Dalam Proses'}</span>
      </div>
      <div className="h-2 w-32 bg-amber-100 rounded-full overflow-hidden">
        <div
          className="bg-amber-500 h-full"
          style={{ width: `${completedPct > 0 ? completedPct : 30}%` }}
        />
      </div>
      <span className="text-[11px] text-slate-500 font-medium">{summaryText}</span>
    </div>
  );
}
