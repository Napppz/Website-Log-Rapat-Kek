'use client';

import React, { useState, useEffect } from 'react';
import { MOCK_MONTHLY_ACTIVITY } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { RotateCcw, TrendingUp, Sparkles } from 'lucide-react';

export function ActivityTrendChart() {
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const [isAnimated, setIsAnimated] = useState(false);

  // Trigger smooth wave growth on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAnimated(false);
    setTimeout(() => {
      setIsAnimated(true);
    }, 80);
  };

  // Height percentages relative to maximum value 28
  const maxCount = 28;
  const getHeightPercent = (count: number) => {
    return Math.round((count / maxCount) * 100);
  };

  const activeItem = hoveredMonth
    ? MOCK_MONTHLY_ACTIVITY.find((m) => m.month === hoveredMonth)
    : null;

  return (
    <div className="lg:col-span-5 rounded-2xl bg-white p-6 shadow-sm border border-amber-200/80 flex flex-col justify-between transition-all">
      <div>
        {/* Header with Title and Interactive Replay Pill */}
        <div className="flex items-start justify-between">
          <div>
            <span className="font-semibold text-[11px] text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
              <span>Tren Aktivitas Sidang</span>
            </span>
            <h2 className="font-bold text-[18px] text-slate-900 mt-0.5">
              Tren Rapat per Bulan (2026)
            </h2>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Frekuensi sinkronisasi regulasi &amp; akselerasi investasi strategis
            </p>
          </div>

          <button
            type="button"
            onClick={handleReplay}
            className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
            title="Klik untuk memutar ulang animasi tren"
          >
            <span>Jan - Sep</span>
            <RotateCcw className="w-3 h-3 text-amber-700 group-hover:rotate-180 transition-transform duration-500" />
          </button>
        </div>

        {/* Bar Chart Area */}
        <div className="mt-6 relative">
          {/* Subtle Horizontal Background Guide Lines */}
          <div className="absolute inset-x-0 top-6 bottom-7 flex flex-col justify-between pointer-events-none opacity-40">
            <div className="border-b border-dashed border-slate-200 w-full" />
            <div className="border-b border-dashed border-slate-200 w-full" />
            <div className="border-b border-dashed border-slate-200 w-full" />
            <div className="border-b border-slate-200 w-full" />
          </div>

          {/* Bar Columns Container with fixed height so percentages render properly */}
          <div className="h-48 w-full flex items-end justify-between gap-1.5 sm:gap-2 pt-2 px-1 relative z-10">
            {MOCK_MONTHLY_ACTIVITY.map((item, idx) => {
              const heightPercent = getHeightPercent(item.count);
              const isPeak = item.isPeak;
              const isHovered = hoveredMonth === item.month;

              return (
                <div
                  key={item.month}
                  className="flex-1 h-full flex flex-col justify-end items-center group cursor-pointer"
                  onMouseEnter={() => setHoveredMonth(item.month)}
                  onMouseLeave={() => setHoveredMonth(null)}
                >
                  {/* Tooltip / Value on top of bar */}
                  <div
                    className={cn(
                      "text-[11px] font-extrabold mb-1.5 transition-all duration-200 transform",
                      isHovered
                        ? "text-amber-700 scale-110 -translate-y-1 opacity-100"
                        : isPeak
                        ? "text-amber-800 opacity-100"
                        : "text-slate-400 opacity-0 group-hover:opacity-100"
                    )}
                  >
                    {item.count}
                  </div>

                  {/* Fixed-height Bar Track Container */}
                  <div className="w-full h-32 flex items-end justify-center px-0.5">
                    <div
                      style={{
                        height: isAnimated ? `${heightPercent}%` : '4px',
                        transitionDelay: `${idx * 60}ms`,
                      }}
                      className={cn(
                        "w-full max-w-[26px] sm:max-w-[30px] rounded-t-md transition-all duration-700 ease-out relative group-hover:scale-y-105 origin-bottom",
                        isPeak
                          ? "bg-gradient-to-t from-amber-600 via-amber-500 to-amber-400 shadow-md shadow-amber-500/25 ring-1 ring-amber-400/50"
                          : isHovered
                          ? "bg-gradient-to-t from-amber-500 to-amber-300 shadow-xs"
                          : item.count >= 20
                          ? "bg-gradient-to-t from-amber-400 to-amber-300"
                          : item.count >= 16
                          ? "bg-gradient-to-t from-amber-300 to-amber-200"
                          : "bg-gradient-to-t from-amber-200/90 to-amber-100/90"
                      )}
                    >
                      {/* Peak indicator dot & pulse */}
                      {isPeak && (
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping absolute" />
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 relative z-10" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Month Label */}
                  <span
                    className={cn(
                      "text-[11px] font-semibold mt-2 transition-colors",
                      isHovered
                        ? "text-amber-800 font-bold"
                        : isPeak
                        ? "text-amber-700 font-bold"
                        : "text-slate-500"
                    )}
                  >
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Info Callout - Interactive according to hovered month */}
      <div className="mt-4 pt-2 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/50 border border-amber-200/70 rounded-xl p-3 flex items-center justify-between transition-all">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-600 shrink-0 animate-pulse" />
          <span className="text-[12.5px] text-slate-700 font-medium truncate">
            {activeItem
              ? `Bulan ${activeItem.month} 2026: Aktivitas Rapat Dewan`
              : 'Puncak Realisasi Investasi (September)'}
          </span>
        </div>
        <span className="text-[12.5px] text-amber-900 font-extrabold shrink-0 ml-2">
          {activeItem ? `${activeItem.count} Sesi Rapat` : '28 Sesi Rapat'}
        </span>
      </div>
    </div>
  );
}
