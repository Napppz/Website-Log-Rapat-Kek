'use client';

import React from 'react';
import { KpiSummary } from '@/lib/report/report-service';

interface StatusDonutChartProps {
  kpi: KpiSummary;
}

export function StatusDonutChart({ kpi }: StatusDonutChartProps) {
  const total = kpi.totalActionItems;

  const segments = [
    {
      label: 'Selesai',
      count: kpi.completedActionItems,
      color: '#10B981', // emerald-500
      pct: total > 0 ? (kpi.completedActionItems / total) * 100 : 0,
    },
    {
      label: 'Berjalan',
      count: kpi.inProgressActionItems,
      color: '#F59E0B', // amber-500
      pct: total > 0 ? (kpi.inProgressActionItems / total) * 100 : 0,
    },
    {
      label: 'Menunggu',
      count: kpi.pendingActionItems,
      color: '#94A3B8', // slate-400
      pct: total > 0 ? (kpi.pendingActionItems / total) * 100 : 0,
    },
    {
      label: 'Terlambat',
      count: kpi.overdueActionItems,
      color: '#EF4444', // red-500
      pct: total > 0 ? (kpi.overdueActionItems / total) * 100 : 0,
    },
  ];

  // SVG Donut calculation
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-6 py-2">
      {/* SVG Donut */}
      <div className="relative flex items-center justify-center">
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 select-none"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
          />

          {total === 0 ? (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#E2E8F0"
              strokeWidth={strokeWidth}
            />
          ) : (
            segments.map((seg, idx) => {
              if (seg.pct <= 0) return null;
              const strokeDasharray = `${(seg.pct / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += seg.pct;

              return (
                <circle
                  key={idx}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              );
            })
          )}
        </svg>

        {/* Center label */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-xl font-extrabold text-slate-900 tracking-tight">
            {kpi.completionRate}%
          </span>
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Selesai
          </span>
        </div>
      </div>

      {/* Legend & Details */}
      <div className="grid grid-cols-2 gap-3 w-full sm:w-auto flex-1 max-w-xs">
        {segments.map((seg, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-xs font-medium text-slate-700">
                {seg.label}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-900">
                {seg.count}
              </span>
              <span className="text-[10px] text-slate-500 ml-1">
                ({seg.pct.toFixed(0)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
