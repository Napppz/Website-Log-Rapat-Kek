'use client';

import React from 'react';
import { TrendPoint } from '@/lib/report/report-service';

interface TrendChartProps {
  data: TrendPoint[];
}

export function TrendChart({ data }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-400">
        Tidak ada data tren untuk periode ini
      </div>
    );
  }

  // Calculate max value for Y-axis scaling
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.totalMeetings, d.completed, d.overdue, 1)),
    5
  );

  const chartHeight = 180;
  const paddingBottom = 40;
  const paddingTop = 20;
  const plotHeight = chartHeight - paddingTop;

  return (
    <div className="flex flex-col h-full justify-between">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-600 inline-block" />
          <span>Rapat</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-600 inline-block" />
          <span>Selesai</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-500 inline-block" />
          <span>Terlambat</span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-x-auto pb-1">
        <svg
          viewBox={`0 0 ${Math.max(480, data.length * 68)} ${chartHeight + paddingBottom}`}
          className="w-full h-48 select-none"
          preserveAspectRatio="none"
        >
          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = paddingTop + plotHeight * (1 - pct);
            const val = Math.round(maxVal * pct);
            return (
              <g key={i}>
                <line
                  x1="30"
                  y1={y}
                  x2="100%"
                  y2={y}
                  stroke="#F1F5F9"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x="24"
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-sans"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((pt, idx) => {
            const totalWidth = Math.max(480, data.length * 68);
            const colWidth = (totalWidth - 40) / data.length;
            const groupX = 35 + idx * colWidth + colWidth * 0.15;
            const barW = Math.max(6, Math.min(14, colWidth * 0.22));

            const hMeetings = (pt.totalMeetings / maxVal) * plotHeight;
            const hCompleted = (pt.completed / maxVal) * plotHeight;
            const hOverdue = (pt.overdue / maxVal) * plotHeight;

            const yMeetings = paddingTop + (plotHeight - hMeetings);
            const yCompleted = paddingTop + (plotHeight - hCompleted);
            const yOverdue = paddingTop + (plotHeight - hOverdue);

            return (
              <g key={pt.key} className="group cursor-pointer">
                {/* Bar 1: Meetings */}
                <rect
                  x={groupX}
                  y={yMeetings}
                  width={barW}
                  height={Math.max(2, hMeetings)}
                  rx="2"
                  className="fill-blue-600 transition-all duration-200 group-hover:fill-blue-700"
                >
                  <title>{`${pt.label}: ${pt.totalMeetings} Rapat`}</title>
                </rect>

                {/* Bar 2: Completed */}
                <rect
                  x={groupX + barW + 2}
                  y={yCompleted}
                  width={barW}
                  height={Math.max(2, hCompleted)}
                  rx="2"
                  className="fill-emerald-500 transition-all duration-200 group-hover:fill-emerald-600"
                >
                  <title>{`${pt.label}: ${pt.completed} Tindak Lanjut Selesai`}</title>
                </rect>

                {/* Bar 3: Overdue */}
                <rect
                  x={groupX + (barW + 2) * 2}
                  y={yOverdue}
                  width={barW}
                  height={Math.max(2, hOverdue)}
                  rx="2"
                  className="fill-red-500 transition-all duration-200 group-hover:fill-red-600"
                >
                  <title>{`${pt.label}: ${pt.overdue} Tindak Lanjut Terlambat`}</title>
                </rect>

                {/* X-axis label */}
                <text
                  x={groupX + barW * 1.5 + 2}
                  y={chartHeight + 16}
                  textAnchor="middle"
                  className="text-[11px] font-semibold fill-slate-700 font-sans"
                >
                  {pt.label}
                </text>
                {pt.subLabel && (
                  <text
                    x={groupX + barW * 1.5 + 2}
                    y={chartHeight + 28}
                    textAnchor="middle"
                    className="text-[9.5px] fill-slate-400 font-sans"
                  >
                    {pt.subLabel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
