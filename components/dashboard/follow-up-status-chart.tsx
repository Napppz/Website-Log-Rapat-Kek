'use client';

import React, { useState, useEffect } from 'react';
import { Info, ArrowRight, RotateCcw, CheckCircle2 } from 'lucide-react';
import { MOCK_FOLLOW_UP_STATUS } from '@/lib/mock-data';
import { FollowUpStatusMetric } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from '@/components/providers/toast-provider';

interface FollowUpStatusChartProps {
  onManageMatrixClick?: () => void;
  followUpData?: FollowUpStatusMetric[];
  totalResolutions?: number;
}

export function FollowUpStatusChart({
  onManageMatrixClick,
  followUpData = MOCK_FOLLOW_UP_STATUS,
  totalResolutions,
}: FollowUpStatusChartProps) {
  const data = followUpData && followUpData.length > 0 ? followUpData : MOCK_FOLLOW_UP_STATUS;
  const total = totalResolutions !== undefined ? totalResolutions : data.reduce((acc, curr) => acc + curr.count, 0);

  const [isAnimated, setIsAnimated] = useState(false);
  const [displayCount, setDisplayCount] = useState(0);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  // Trigger stroke draw animation and count-up on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 120);

    // Count-up animation
    let start = 0;
    const end = total;
    if (end === 0) {
      setDisplayCount(0);
    } else {
      const duration = 800; // ms
      const stepTime = Math.max(25, Math.floor(duration / end));
      const counterTimer = setInterval(() => {
        start += 1;
        setDisplayCount(start);
        if (start >= end) clearInterval(counterTimer);
      }, stepTime);
      return () => {
        clearTimeout(timer);
        clearInterval(counterTimer);
      };
    }

    return () => clearTimeout(timer);
  }, [total]);

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAnimated(false);
    setDisplayCount(0);
    setTimeout(() => {
      setIsAnimated(true);
      let start = 0;
      const end = total;
      const stepTime = Math.max(25, Math.floor(800 / (end || 1)));
      const counterTimer = setInterval(() => {
        start += 1;
        setDisplayCount(start);
        if (start >= end) clearInterval(counterTimer);
      }, stepTime);
    }, 80);
  };

  const activeSegment = hoveredLabel ? data.find((d) => d.label === hoveredLabel) : null;

  return (
    <div className="lg:col-span-4 rounded-2xl bg-white p-6 shadow-sm border border-amber-200/80 flex flex-col justify-between transition-all">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="font-semibold text-[11px] text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Matriks Monitoring</span>
            </span>
            <h2 className="font-bold text-[18px] text-slate-900 mt-0.5">
              Status Tindak Lanjut
            </h2>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Total {total} butir kesepakatan dewan
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleReplay}
              className="text-slate-400 hover:text-amber-800 p-1.5 rounded-lg hover:bg-amber-50 cursor-pointer transition-colors"
              title="Putar ulang animasi donat"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="text-slate-400 hover:text-amber-700 p-1.5 rounded-lg hover:bg-amber-50 cursor-pointer transition-colors"
              title="Metrik dihitung otomatis berdasarkan laporan pemantauan PIC biro pelaksana."
              onClick={() => toast.info('Metrik dihitung otomatis berdasarkan laporan pemantauan PIC biro pelaksana.', 'Info Metrik')}
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Donut Chart & Legend Area */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-6">
          {/* Animated Donut Gauge SVG */}
          <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
            <svg
              className="w-full h-full transform -rotate-90 filter drop-shadow-xs"
              viewBox="0 0 100 100"
            >
              {/* Background circle track */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#FEF3C7"
                strokeWidth="11"
              />

              {/* Dynamic Animated Segments */}
              {data.map((item, idx) => {
                const isHovered = hoveredLabel === item.label;
                const isOtherHovered = hoveredLabel !== null && !isHovered;

                return (
                  <circle
                    key={item.label || idx}
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth={isHovered ? 14 : 11}
                    strokeDasharray={isAnimated ? item.dasharray : '0 238.76'}
                    strokeDashoffset={isAnimated ? item.dashoffset : '0'}
                    onMouseEnter={() => setHoveredLabel(item.label)}
                    onMouseLeave={() => setHoveredLabel(null)}
                    style={{
                      transition:
                        'stroke-dasharray 900ms cubic-bezier(0.16, 1, 0.3, 1), stroke-dashoffset 900ms cubic-bezier(0.16, 1, 0.3, 1), stroke-width 200ms ease, opacity 200ms ease',
                      transitionDelay: isAnimated ? `${idx * 80}ms` : '0ms',
                    }}
                    className={cn(
                      'cursor-pointer origin-center transition-all',
                      isOtherHovered ? 'opacity-40' : 'opacity-100'
                    )}
                  />
                );
              })}
            </svg>

            {/* Center Dynamic Label with Count-up Animation */}
            <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none transition-all duration-200">
              {activeSegment ? (
                <>
                  <span
                    className="font-extrabold text-[22px] leading-none transition-transform scale-110"
                    style={{ color: activeSegment.color }}
                  >
                    {activeSegment.count}
                  </span>
                  <span className="text-[10px] font-bold text-slate-700 uppercase mt-0.5 tracking-tight">
                    {activeSegment.label}
                  </span>
                  <span className="text-[9.5px] font-semibold text-slate-500">
                    {activeSegment.percentage}%
                  </span>
                </>
              ) : (
                <>
                  <span className="font-extrabold text-[24px] text-slate-900 leading-none">
                    {displayCount}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase mt-0.5 tracking-wider">
                    RESOLUSI
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Interactive Legend with Hover Highlighting */}
          <div className="space-y-1.5 w-full sm:w-auto flex-1">
            {data.map((item) => {
              const isHovered = hoveredLabel === item.label;
              const isOtherHovered = hoveredLabel !== null && !isHovered;

              return (
                <div
                  key={item.label}
                  onMouseEnter={() => setHoveredLabel(item.label)}
                  onMouseLeave={() => setHoveredLabel(null)}
                  className={cn(
                    'flex items-center justify-between gap-3 text-[12px] px-2.5 py-1.5 rounded-lg transition-all cursor-pointer',
                    isHovered
                      ? 'bg-amber-50 scale-102 shadow-2xs font-bold'
                      : isOtherHovered
                      ? 'opacity-50'
                      : 'hover:bg-slate-50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'w-2.5 h-2.5 rounded-full transition-transform',
                        isHovered && 'scale-125'
                      )}
                      style={{
                        backgroundColor: item.color,
                        border: item.borderColor ? `1px solid ${item.borderColor}` : undefined,
                      }}
                    />
                    <span
                      className={cn(
                        'transition-colors',
                        isHovered ? 'text-slate-900 font-bold' : 'text-slate-700 font-medium'
                      )}
                    >
                      {item.label}
                    </span>
                  </div>

                  <span
                    className="font-bold text-[12px]"
                    style={{ color: item.color === '#DC2626' ? '#DC2626' : '#92400E' }}
                  >
                    {item.percentage}% ({item.count})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action link */}
      <div className="mt-4 pt-2">
        <button
          type="button"
          onClick={onManageMatrixClick}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-900 font-semibold text-[12.5px] transition-all cursor-pointer shadow-2xs group"
        >
          <span>Kelola Matriks &amp; Disposisi</span>
          <ArrowRight className="w-4 h-4 text-amber-700 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
