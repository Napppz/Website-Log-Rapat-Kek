'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MOCK_MONTHLY_ACTIVITY } from '@/lib/mock-data';
import { MonthlyActivity } from '@/lib/types';
import { cn } from '@/lib/utils';
import { RotateCcw, TrendingUp, ArrowRight, ArrowUpRight } from 'lucide-react';

interface ActivityTrendChartProps {
  data?: MonthlyActivity[];
  onMonthClick?: (month: string) => void;
}

export function ActivityTrendChart({ data, onMonthClick }: ActivityTrendChartProps) {
  const router = useRouter();
  const chartData = data && data.length > 0 ? data : MOCK_MONTHLY_ACTIVITY;
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const [isAnimated, setIsAnimated] = useState(false);

  const handleMonthClick = (month: string) => {
    if (onMonthClick) {
      onMonthClick(month);
    } else {
      router.push(`/semua-rapat?bulan=${encodeURIComponent(month)}`);
    }
  };

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

  // Dynamic maximum value from real database counts
  const maxCount = Math.max(...chartData.map((m) => m.count), 1);
  const getHeightPercent = (count: number) => {
    if (count === 0) return 0;
    return Math.max(Math.round((count / maxCount) * 100), 6);
  };

  const activeItem = hoveredMonth
    ? chartData.find((m) => m.month === hoveredMonth)
    : null;

  const peakItem =
    chartData.find((m) => m.isPeak) ||
    chartData.reduce((prev, curr) => (curr.count > prev.count ? curr : prev), chartData[0]);

  const dateRangeLabel =
    chartData.length > 0
      ? `${chartData[0].month} - ${chartData[chartData.length - 1].month}`
      : 'Jan - Sep';

  return (
    <div className="lg:col-span-5 rounded-2xl bg-white p-6 shadow-sm border border-slate-200 flex flex-col justify-between transition-all">
      <div>
        {/* Header with Title and Interactive Replay Pill */}
        <div className="flex items-start justify-between">
          <div>
            <span className="font-semibold text-[11px] text-[#31889C] uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#31889C]" />
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
            className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F0F9FA] hover:bg-[#E8F5F7] border border-[#BCE3EB] text-[#215865] text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
            title="Klik untuk memutar ulang animasi tren"
          >
            <span>{dateRangeLabel}</span>
            <RotateCcw className="w-3 h-3 text-[#31889C] group-hover:rotate-180 transition-transform duration-500" />
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
            {chartData.map((item, idx) => {
              const heightPercent = getHeightPercent(item.count);
              const isPeak = item.isPeak && item.count > 0;
              const isHovered = hoveredMonth === item.month;
              const ratio = maxCount > 0 ? item.count / maxCount : 0;

              return (
                <div
                  key={item.month}
                  onClick={() => handleMonthClick(item.month)}
                  className="flex-1 h-full flex flex-col justify-end items-center group cursor-pointer"
                  onMouseEnter={() => setHoveredMonth(item.month)}
                  onMouseLeave={() => setHoveredMonth(null)}
                  title={`Klik untuk melihat seluruh rapat bulan ${item.month} (${item.count} rapat)`}
                >
                  {/* Tooltip / Value on top of bar */}
                  <div
                    className={cn(
                      "text-[11px] font-extrabold mb-1.5 transition-all duration-200 transform flex items-center gap-0.5",
                      isHovered
                        ? "text-[#31889C] scale-110 -translate-y-1 opacity-100"
                        : isPeak
                        ? "text-[#215865] opacity-100"
                        : item.count > 0
                        ? "text-slate-400 opacity-0 group-hover:opacity-100"
                        : "text-slate-300 opacity-0 group-hover:opacity-100"
                    )}
                  >
                    <span>{item.count}</span>
                    {isHovered && <ArrowUpRight className="w-2.5 h-2.5" />}
                  </div>

                  {/* Fixed-height Bar Track Container */}
                  <div className="w-full h-32 flex items-end justify-center px-0.5">
                    <div
                      style={{
                        height: isAnimated ? `${heightPercent}%` : item.count > 0 ? '4px' : '2px',
                        transitionDelay: `${idx * 50}ms`,
                      }}
                      className={cn(
                        "w-full max-w-[26px] sm:max-w-[30px] rounded-t-md transition-all duration-700 ease-out relative group-hover:scale-y-105 group-hover:brightness-105 origin-bottom",
                        item.count === 0
                          ? "bg-slate-100 hover:bg-slate-200"
                          : isPeak
                          ? "bg-gradient-to-t from-[#215865] via-[#31889C] to-[#51ADC2] shadow-md shadow-[#31889C]/25 ring-1 ring-[#31889C]/50"
                          : isHovered
                          ? "bg-gradient-to-t from-[#266F80] to-[#51ADC2] shadow-xs"
                          : ratio >= 0.7
                          ? "bg-gradient-to-t from-[#31889C] to-[#80C3D1]"
                          : ratio >= 0.4
                          ? "bg-gradient-to-t from-[#51ADC2] to-[#BCE3EB]"
                          : "bg-gradient-to-t from-[#BCE3EB] to-[#E8F5F7]"
                      )}
                    >
                      {/* Peak indicator dot & pulse */}
                      {isPeak && (
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-[#31889C] animate-ping absolute" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#215865] relative z-10" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Month Label */}
                  <span
                    className={cn(
                      "text-[11px] font-semibold mt-2 transition-colors",
                      isHovered
                        ? "text-[#31889C] font-bold"
                        : isPeak
                        ? "text-[#215865] font-bold"
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
      <div
        onClick={() => {
          const target = activeItem?.month || peakItem?.month;
          if (target) handleMonthClick(target);
        }}
        className="mt-4 pt-2 bg-gradient-to-r from-[#F0F9FA] via-white to-[#F0F9FA]/50 border border-[#BCE3EB] hover:border-[#31889C] rounded-xl p-3 flex items-center justify-between transition-all cursor-pointer group shadow-2xs"
        title="Klik untuk membuka semua rapat pada bulan ini"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[#31889C] shrink-0 animate-pulse" />
          <span className="text-[12.5px] text-slate-700 font-medium truncate group-hover:text-[#215865]">
            {activeItem
              ? `Bulan ${activeItem.month} 2026: Klik untuk melihat rapat`
              : `Puncak Aktivitas Sidang (${peakItem?.month || 'Bulan Terpadat'})`}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2 text-[#215865] group-hover:text-[#31889C]">
          <span className="text-[12.5px] font-extrabold">
            {activeItem ? `${activeItem.count} Sesi Rapat` : `${peakItem?.count || 0} Sesi Rapat`}
          </span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </div>
  );
}
