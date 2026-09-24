'use client';

import React, { useState } from 'react';
import { MOCK_MONTHLY_ACTIVITY } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export function ActivityTrendChart() {
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  // Height percentages relative to maximum value 28
  const getHeightPercent = (count: number) => {
    return Math.round((count / 28) * 100);
  };

  return (
    <div className="lg:col-span-5 rounded-xl bg-white p-6 shadow-sm border border-amber-200/60 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <span className="font-semibold text-[12px] text-amber-700 uppercase tracking-wider">
              Tren Aktivitas
            </span>
            <h2 className="font-bold text-[18px] text-slate-900">
              Tren Rapat per Bulan (2026)
            </h2>
            <p className="text-[13px] text-slate-500 mt-1">
              Puncak frekuensi sinkronisasi investasi &amp; infrastruktur Q2-Q3
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
            Jan - Sep
          </span>
        </div>

        {/* Bar Chart Area */}
        <div className="mt-6">
          <div className="h-44 w-full flex items-end justify-between gap-2 pt-6">
            {MOCK_MONTHLY_ACTIVITY.map((item) => {
              const heightPercent = getHeightPercent(item.count);
              const isPeak = item.isPeak;
              const isHovered = hoveredMonth === item.month;

              return (
                <div
                  key={item.month}
                  className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
                  onMouseEnter={() => setHoveredMonth(item.month)}
                  onMouseLeave={() => setHoveredMonth(null)}
                >
                  {/* Tooltip / value */}
                  <span
                    className={cn(
                      "text-[11px] font-bold transition-opacity duration-150",
                      isPeak
                        ? "text-amber-700 opacity-100"
                        : isHovered
                        ? "text-amber-700 opacity-100"
                        : "text-slate-500 opacity-0 group-hover:opacity-100"
                    )}
                  >
                    {item.count}
                  </span>

                  {/* Bar */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={cn(
                      "w-full rounded-t-sm transition-all duration-200",
                      isPeak
                        ? "bg-amber-500 shadow-sm"
                        : item.count >= 20
                        ? "bg-amber-300 group-hover:bg-amber-500"
                        : item.count >= 16
                        ? "bg-amber-200 group-hover:bg-amber-400"
                        : "bg-amber-100 group-hover:bg-amber-300"
                    )}
                  />

                  {/* Month Label */}
                  <span
                    className={cn(
                      "text-[11px] font-medium transition-colors",
                      isPeak ? "text-amber-700 font-bold" : "text-slate-500"
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

      {/* Footer Info Callout */}
      <div className="mt-4 pt-2 bg-amber-50/70 border border-amber-200/60 rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
          <span className="text-[13px] text-slate-700 font-medium">
            Puncak Realisasi Investasi (September)
          </span>
        </div>
        <span className="text-[12px] text-amber-800 font-bold">28 Sesi Rapat</span>
      </div>
    </div>
  );
}
