'use client';

import React, { useState, useEffect } from 'react';
import { TrendPoint } from '@/lib/report/report-service';
import { Calendar, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface TrendChartProps {
  data: TrendPoint[];
}

export function TrendChart({ data }: TrendChartProps) {
  const [animated, setAnimated] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [activeSeries, setActiveSeries] = useState<'ALL' | 'MEETINGS' | 'COMPLETED' | 'OVERDUE'>('ALL');

  useEffect(() => {
    setAnimated(false);
    const timer = setTimeout(() => {
      setAnimated(true);
    }, 60);
    return () => clearTimeout(timer);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        Tidak ada data tren untuk periode ini
      </div>
    );
  }

  // Aggregate totals for legend badges
  const totalMeetings = data.reduce((acc, d) => acc + d.totalMeetings, 0);
  const totalCompleted = data.reduce((acc, d) => acc + d.completed, 0);
  const totalOverdue = data.reduce((acc, d) => acc + d.overdue, 0);

  // Calculate max value for Y-axis scaling (with comfortable padding)
  const maxDataVal = Math.max(
    ...data.map((d) => Math.max(d.totalMeetings, d.completed, d.overdue, 0)),
    1
  );
  // Round up to nice number
  const maxVal = Math.max(Math.ceil(maxDataVal * 1.15), 5);

  const chartHeight = 175;
  const paddingBottom = 42;
  const paddingTop = 24;
  const plotHeight = chartHeight - paddingTop;

  const totalWidth = Math.max(480, data.length * 76);
  const colWidth = (totalWidth - 50) / data.length;

  const hoveredPoint = hoveredIdx !== null ? data[hoveredIdx] : null;

  return (
    <div className="flex flex-col h-full justify-between select-none">
      {/* ── HEADER / INTERACTIVE LEGEND ────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-100">
        {/* Interactive Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Rapat */}
          <button
            type="button"
            onClick={() => setActiveSeries(activeSeries === 'MEETINGS' ? 'ALL' : 'MEETINGS')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSeries === 'MEETINGS' || activeSeries === 'ALL'
                ? 'bg-[#F0F9FA] text-[#215865] border border-[#BCE3EB] shadow-2xs'
                : 'text-slate-400 bg-slate-50 border border-slate-100 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#31889C]" />
            <span>Rapat</span>
            <span className="font-bold ml-0.5 px-1 py-0.2 bg-white rounded text-[10px] text-[#215865] border border-[#BCE3EB]">
              {totalMeetings}
            </span>
          </button>

          {/* Selesai */}
          <button
            type="button"
            onClick={() => setActiveSeries(activeSeries === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSeries === 'COMPLETED' || activeSeries === 'ALL'
                ? 'bg-[#ECF8E9] text-[#4D8F3D] border border-[#D2EFCA] shadow-2xs'
                : 'text-slate-400 bg-slate-50 border border-slate-100 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#7CC563]" />
            <span>Selesai</span>
            <span className="font-bold ml-0.5 px-1 py-0.2 bg-white rounded text-[10px] text-[#4D8F3D] border border-[#D2EFCA]">
              {totalCompleted}
            </span>
          </button>

          {/* Terlambat */}
          <button
            type="button"
            onClick={() => setActiveSeries(activeSeries === 'OVERDUE' ? 'ALL' : 'OVERDUE')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSeries === 'OVERDUE' || activeSeries === 'ALL'
                ? 'bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs'
                : 'text-slate-400 bg-slate-50 border border-slate-100 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Terlambat</span>
            <span className="font-bold ml-0.5 px-1 py-0.2 bg-white rounded text-[10px] text-rose-800 border border-rose-100">
              {totalOverdue}
            </span>
          </button>
        </div>

        {/* Hovered Details Callout */}
        {hoveredPoint ? (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 animate-in fade-in duration-200 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="text-[#31889C] font-bold">{hoveredPoint.label}:</span>
            <span className="text-[#215865]">{hoveredPoint.totalMeetings} Rapat</span>
            <span className="text-slate-300">•</span>
            <span className="text-[#4D8F3D]">{hoveredPoint.completed} Selesai</span>
            <span className="text-slate-300">•</span>
            <span className="text-rose-700">{hoveredPoint.overdue} Terlambat</span>
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 italic hidden sm:block">
            Arahkan kursor pada batang untuk detail
          </div>
        )}
      </div>

      {/* ── SVG CHART CANVAS ───────────────────────────────────────── */}
      <div className="relative w-full overflow-x-auto pb-1">
        <svg
          viewBox={`0 0 ${totalWidth} ${chartHeight + paddingBottom}`}
          className="w-full h-52 select-none overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Gradients */}
          <defs>
            <linearGradient id="trend-rapat-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#31889C" />
              <stop offset="100%" stopColor="#266F80" />
            </linearGradient>
            <linearGradient id="trend-selesai-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7CC563" />
              <stop offset="100%" stopColor="#5aa542" />
            </linearGradient>
            <linearGradient id="trend-terlambat-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F43F5E" />
              <stop offset="100%" stopColor="#BE123C" />
            </linearGradient>
            <filter id="bar-shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = paddingTop + plotHeight * (1 - pct);
            const val = Math.round(maxVal * pct);
            return (
              <g key={i}>
                <line
                  x1="38"
                  y1={y}
                  x2={totalWidth - 10}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  strokeOpacity={pct === 0 ? 0.9 : 0.6}
                />
                <text
                  x="30"
                  y={y + 3.5}
                  textAnchor="end"
                  className="text-[10px] font-medium fill-slate-400 font-sans"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Bar Groups */}
          {data.map((pt, idx) => {
            const isHovered = hoveredIdx === idx;
            const groupX = 42 + idx * colWidth;
            const barW = Math.max(8, Math.min(14, colWidth * 0.22));
            const barGap = 3;

            // Height calculations
            const hMeetings = (pt.totalMeetings / maxVal) * plotHeight;
            const hCompleted = (pt.completed / maxVal) * plotHeight;
            const hOverdue = (pt.overdue / maxVal) * plotHeight;

            // Animated heights
            const animHMeetings = animated ? Math.max(hMeetings > 0 ? 3 : 0, hMeetings) : 0;
            const animHCompleted = animated ? Math.max(hCompleted > 0 ? 3 : 0, hCompleted) : 0;
            const animHOverdue = animated ? Math.max(hOverdue > 0 ? 3 : 0, hOverdue) : 0;

            const yMeetings = paddingTop + (plotHeight - animHMeetings);
            const yCompleted = paddingTop + (plotHeight - animHCompleted);
            const yOverdue = paddingTop + (plotHeight - animHOverdue);

            const xMeetings = groupX + (colWidth - (barW * 3 + barGap * 2)) / 2;
            const xCompleted = xMeetings + barW + barGap;
            const xOverdue = xCompleted + barW + barGap;

            // Opacity by active series
            const opMeetings = activeSeries === 'ALL' || activeSeries === 'MEETINGS' ? 1 : 0.2;
            const opCompleted = activeSeries === 'ALL' || activeSeries === 'COMPLETED' ? 1 : 0.2;
            const opOverdue = activeSeries === 'ALL' || activeSeries === 'OVERDUE' ? 1 : 0.2;

            return (
              <g
                key={pt.key || idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer transition-all duration-200"
              >
                {/* Background column highlight on hover */}
                {isHovered && (
                  <rect
                    x={groupX + 2}
                    y={paddingTop - 6}
                    width={colWidth - 4}
                    height={plotHeight + 36}
                    rx="8"
                    fill="#F8FAFC"
                    stroke="#E2E8F0"
                    strokeWidth="1"
                    className="animate-in fade-in duration-150"
                  />
                )}

                {/* 1. Bar: Total Meetings */}
                <rect
                  x={xMeetings}
                  y={yMeetings}
                  width={barW}
                  height={animHMeetings}
                  rx="3.5"
                  fill="url(#trend-rapat-grad)"
                  opacity={opMeetings}
                  filter={isHovered ? 'url(#bar-shadow)' : 'none'}
                  style={{
                    transition:
                      'height 0.75s cubic-bezier(0.16, 1, 0.3, 1), y 0.75s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
                  }}
                />

                {/* 2. Bar: Completed Action Items */}
                <rect
                  x={xCompleted}
                  y={yCompleted}
                  width={barW}
                  height={animHCompleted}
                  rx="3.5"
                  fill="url(#trend-selesai-grad)"
                  opacity={opCompleted}
                  filter={isHovered ? 'url(#bar-shadow)' : 'none'}
                  style={{
                    transition:
                      'height 0.75s cubic-bezier(0.16, 1, 0.3, 1), y 0.75s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
                    transitionDelay: '80ms',
                  }}
                />

                {/* 3. Bar: Overdue Action Items */}
                <rect
                  x={xOverdue}
                  y={yOverdue}
                  width={barW}
                  height={animHOverdue}
                  rx="3.5"
                  fill="url(#trend-terlambat-grad)"
                  opacity={opOverdue}
                  filter={isHovered ? 'url(#bar-shadow)' : 'none'}
                  style={{
                    transition:
                      'height 0.75s cubic-bezier(0.16, 1, 0.3, 1), y 0.75s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
                    transitionDelay: '140ms',
                  }}
                />

                {/* Value number label above bar when hovered */}
                {isHovered && (
                  <g className="animate-in fade-in duration-150">
                    {pt.totalMeetings > 0 && (
                      <text
                        x={xMeetings + barW / 2}
                        y={Math.max(14, yMeetings - 4)}
                        textAnchor="middle"
                        className="text-[9.5px] font-bold fill-[#31889C]"
                      >
                        {pt.totalMeetings}
                      </text>
                    )}
                    {pt.completed > 0 && (
                      <text
                        x={xCompleted + barW / 2}
                        y={Math.max(14, yCompleted - 4)}
                        textAnchor="middle"
                        className="text-[9.5px] font-bold fill-[#4D8F3D]"
                      >
                        {pt.completed}
                      </text>
                    )}
                    {pt.overdue > 0 && (
                      <text
                        x={xOverdue + barW / 2}
                        y={Math.max(14, yOverdue - 4)}
                        textAnchor="middle"
                        className="text-[9.5px] font-bold fill-rose-700"
                      >
                        {pt.overdue}
                      </text>
                    )}
                  </g>
                )}

                {/* X-axis main label */}
                <text
                  x={groupX + colWidth / 2}
                  y={chartHeight + 16}
                  textAnchor="middle"
                  className={`text-[11px] font-semibold transition-colors font-sans ${
                    isHovered ? 'fill-[#31889C] font-bold' : 'fill-slate-700'
                  }`}
                >
                  {pt.label}
                </text>

                {/* X-axis subLabel (dates) */}
                {pt.subLabel && (
                  <text
                    x={groupX + colWidth / 2}
                    y={chartHeight + 28}
                    textAnchor="middle"
                    className={`text-[9.5px] transition-colors font-sans ${
                      isHovered ? 'fill-slate-600 font-medium' : 'fill-slate-400'
                    }`}
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
