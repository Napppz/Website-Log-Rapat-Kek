'use client';

import React, { useState, useEffect } from 'react';
import { KpiSummary } from '@/lib/report/report-service';
import { CheckCircle2, Clock, Hourglass, AlertTriangle, Layers } from 'lucide-react';

interface StatusDonutChartProps {
  kpi: KpiSummary;
}

export function StatusDonutChart({ kpi }: StatusDonutChartProps) {
  const [animated, setAnimated] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    setAnimated(false);
    const timer = setTimeout(() => {
      setAnimated(true);
    }, 60);
    return () => clearTimeout(timer);
  }, [kpi]);

  const total = kpi.totalActionItems;

  const segments = [
    {
      id: 'completed',
      label: 'Selesai',
      count: kpi.completedActionItems,
      color: '#10B981', // emerald-500
      glowColor: 'rgba(16, 185, 129, 0.25)',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-700',
      icon: CheckCircle2,
      pct: total > 0 ? (kpi.completedActionItems / total) * 100 : 0,
    },
    {
      id: 'in_progress',
      label: 'Berjalan',
      count: kpi.inProgressActionItems,
      color: '#F59E0B', // amber-500
      glowColor: 'rgba(245, 158, 11, 0.25)',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-700',
      icon: Clock,
      pct: total > 0 ? (kpi.inProgressActionItems / total) * 100 : 0,
    },
    {
      id: 'pending',
      label: 'Menunggu',
      count: kpi.pendingActionItems,
      color: '#64748B', // slate-500
      glowColor: 'rgba(100, 116, 139, 0.25)',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      textColor: 'text-slate-700',
      icon: Hourglass,
      pct: total > 0 ? (kpi.pendingActionItems / total) * 100 : 0,
    },
    {
      id: 'overdue',
      label: 'Terlambat',
      count: kpi.overdueActionItems,
      color: '#EF4444', // red-500
      glowColor: 'rgba(239, 68, 68, 0.25)',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      icon: AlertTriangle,
      pct: total > 0 ? (kpi.overdueActionItems / total) * 100 : 0,
    },
  ];

  // SVG Geometry
  const size = 180;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate gaps between segments (if multiple segments exist)
  const validSegments = segments.filter((s) => s.pct > 0);
  const gapSize = validSegments.length > 1 ? 3 : 0; // px gap
  const totalGapLength = validSegments.length * gapSize;
  const usableCircumference = Math.max(0, circumference - totalGapLength);

  let accumulatedPercent = 0;

  // Active hover info
  const activeSegment = hoveredIdx !== null ? segments[hoveredIdx] : null;

  return (
    <div className="flex flex-col items-center sm:flex-row sm:items-center justify-between gap-6 py-2">
      {/* ── SVG DONUT DISPLAY ───────────────────────────────────────── */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 select-none overflow-visible"
        >
          {/* Subtle outer glow effect when hovering */}
          <defs>
            <filter id="donut-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.15" />
            </filter>
            <linearGradient id="emerald-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="amber-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <linearGradient id="slate-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            <linearGradient id="red-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F87171" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
          </defs>

          {/* Background Track Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
          />

          {/* Slices */}
          {total === 0 ? (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#E2E8F0"
              strokeWidth={strokeWidth}
              strokeDasharray="6 6"
            />
          ) : (
            segments.map((seg, idx) => {
              if (seg.pct <= 0) return null;

              const isHovered = hoveredIdx === idx;
              const isOtherHovered = hoveredIdx !== null && hoveredIdx !== idx;

              // Arc length proportional to usable circumference
              const segmentLength = (seg.pct / 100) * usableCircumference;
              const currentOffset = (accumulatedPercent / 100) * usableCircumference + idx * gapSize;
              accumulatedPercent += seg.pct;

              const strokeDasharray = animated
                ? `${segmentLength} ${circumference}`
                : `0 ${circumference}`;

              const strokeDashoffset = -currentOffset;

              const gradientMap: Record<string, string> = {
                Selesai: 'url(#emerald-grad)',
                Berjalan: 'url(#amber-grad)',
                Menunggu: 'url(#slate-grad)',
                Terlambat: 'url(#red-grad)',
              };

              return (
                <circle
                  key={seg.id}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={gradientMap[seg.label] || seg.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    transition:
                      'stroke-dasharray 0.9s cubic-bezier(0.16, 1, 0.3, 1), stroke-width 0.25s ease, opacity 0.25s ease',
                    opacity: isOtherHovered ? 0.45 : 1,
                    filter: isHovered ? 'url(#donut-glow)' : 'none',
                    cursor: 'pointer',
                  }}
                />
              );
            })
          )}
        </svg>

        {/* ── CENTER LABEL (Interactive Dynamic Counter) ──────────────── */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none transition-all duration-300 px-2"
        >
          {activeSegment ? (
            <div className="animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center">
              <span
                className="text-2xl font-black tracking-tight"
                style={{ color: activeSegment.color }}
              >
                {activeSegment.count}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mt-0.5">
                {activeSegment.label}
              </span>
              <span className="text-[10px] font-medium text-slate-400">
                {activeSegment.pct.toFixed(0)}% dari total
              </span>
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {kpi.completionRate}%
              </span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Selesai
              </span>
              <span className="text-[10px] font-medium text-slate-400">
                {kpi.completedActionItems} / {total} Butir
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── LEGEND & DETAILS (Clean, spacious, no-clumping design) ────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full flex-1 max-w-sm">
        {segments.map((seg, idx) => {
          const isHovered = hoveredIdx === idx;
          const Icon = seg.icon;

          return (
            <div
              key={seg.id}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                isHovered
                  ? `${seg.bgColor} ${seg.borderColor} shadow-xs -translate-y-0.5 ring-2 ring-slate-900/5`
                  : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/70 hover:border-slate-300'
              }`}
            >
              {/* Left: Icon / Indicator + Label */}
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                  style={{
                    backgroundColor: isHovered ? seg.color : `${seg.color}18`,
                    color: isHovered ? '#ffffff' : seg.color,
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-slate-800 truncate">
                  {seg.label}
                </span>
              </div>

              {/* Right: Crisp Count & Percentage Pill (Properly spaced) */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 rounded-md bg-white border border-slate-200/90 text-xs font-bold text-slate-900 shadow-2xs">
                  {seg.count}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  ({seg.pct.toFixed(0)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
