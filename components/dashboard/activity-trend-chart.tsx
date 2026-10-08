'use client';

import React, { useState, useEffect } from 'react';
import { MOCK_MONTHLY_ACTIVITY } from '@/lib/mock-data';
import { MonthlyActivity } from '@/lib/types';
import { cn } from '@/lib/utils';
import { RotateCcw, TrendingUp, Calendar, ArrowUp } from 'lucide-react';

const FULL_MONTH_NAMES: Record<string, string> = {
  Jan: 'Januari',
  Feb: 'Februari',
  Mar: 'Maret',
  Apr: 'April',
  Mei: 'Mei',
  Jun: 'Juni',
  Jul: 'Juli',
  Agu: 'Agustus',
  Sep: 'September',
  Okt: 'Oktober',
  Nov: 'November',
  Des: 'Desember',
};

/**
 * Smoothly scrolls the window back up to the top or to the statistics overview
 * so that users and executives immediately see real-time metric cards.
 */
export function scrollToStatsTop() {
  if (typeof window === 'undefined') return;

  requestAnimationFrame(() => {
    const statsElement = document.getElementById('stats-overview');
    if (statsElement) {
      const rect = statsElement.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const absoluteTop = rect.top + scrollTop;

      // In superadmin dashboard, stats is ~200px from top: scrolling to top: 0 gives full view of banner + stats cards
      if (absoluteTop < 320) {
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      } else {
        // In biro dashboard or deeper pages, offset for the sticky header (64px + 16px buffer)
        window.scrollTo({
          top: Math.max(0, absoluteTop - 80),
          behavior: 'smooth',
        });
      }
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  });
}

interface ActivityTrendChartProps {
  data?: MonthlyActivity[];
  selectedMonth?: string | null;
  onMonthSelect?: (month: string | null) => void;
  onMonthClick?: (month: string) => void;
  selectedYear?: number;
  availableYears?: number[];
  onYearChange?: (year: number) => void;
  autoScrollToTop?: boolean;
}

export function ActivityTrendChart({
  data,
  selectedMonth: selectedMonthProp,
  onMonthSelect,
  onMonthClick,
  selectedYear = 2026,
  availableYears = [2026, 2027],
  onYearChange,
  autoScrollToTop = true,
}: ActivityTrendChartProps) {
  const chartData = data && data.length > 0 ? data : MOCK_MONTHLY_ACTIVITY;

  const peakItem =
    chartData.find((m) => m.isPeak) ||
    chartData.reduce((prev, curr) => (curr.count > prev.count ? curr : prev), chartData[0]);

  const [localSelectedMonth, setLocalSelectedMonth] = useState<string | null>(null);
  const effectiveSelectedMonth =
    selectedMonthProp !== undefined ? selectedMonthProp : localSelectedMonth;

  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const [isAnimated, setIsAnimated] = useState(false);

  // Trigger smooth wave growth on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleMonthClick = (month: string) => {
    const nextMonth = effectiveSelectedMonth === month ? null : month;
    if (selectedMonthProp === undefined) {
      setLocalSelectedMonth(nextMonth);
    }
    if (onMonthSelect) {
      onMonthSelect(nextMonth);
    }
    if (onMonthClick) {
      onMonthClick(month);
    }

    // Smoothly scroll back to top so supervisor immediately sees real-time stats
    scrollToStatsTop();
  };

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAnimated(false);
    setTimeout(() => {
      setIsAnimated(true);
    }, 80);
  };

  // Dynamic maximum value from real database counts
  const maxCount = Math.max(...chartData.map((m) => m.count), 1);
  const totalYearCount = chartData.reduce((sum, item) => sum + item.count, 0);

  const getHeightPercent = (count: number) => {
    if (count === 0) return 0;
    return Math.max(Math.round((count / maxCount) * 100), 8);
  };

  const activeMonth = hoveredMonth || effectiveSelectedMonth;
  const activeItem = chartData.find((m) => m.month === activeMonth) || peakItem;
  const fullMonthName = FULL_MONTH_NAMES[activeItem?.month || ''] || activeItem?.month || '';
  const monthPercentage =
    totalYearCount > 0 && activeItem
      ? Math.round((activeItem.count / totalYearCount) * 100)
      : 0;

  const dateRangeLabel =
    chartData.length > 0
      ? `${chartData[0].month} - ${chartData[chartData.length - 1].month}`
      : 'Jan - Sep';

  return (
    <div className="lg:col-span-5 rounded-2xl bg-white p-6 shadow-sm border border-slate-200 flex flex-col justify-between transition-all">
      <div>
        {/* Header with Title, Year Selector & Interactive Replay Pill */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <span className="font-semibold text-[11px] text-[#31889C] uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#31889C]" />
              <span>Tren Aktivitas Sidang</span>
            </span>
            <h2 className="font-bold text-[18px] text-slate-900 mt-0.5">
              Tren Rapat per Bulan ({selectedYear})
            </h2>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Klik grafik batang setiap bulan untuk melihat rincian jumlah rapat
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {/* Year Switcher Pills */}
            {availableYears && availableYears.length > 1 && (
              <div className="inline-flex items-center bg-[#F0F9FA] p-0.5 rounded-full border border-[#BCE3EB]">
                {availableYears.map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => onYearChange?.(yr)}
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-[11px] font-extrabold transition-all cursor-pointer",
                      selectedYear === yr
                        ? "bg-[#215865] text-white shadow-2xs"
                        : "text-[#215865]/70 hover:text-[#215865] hover:bg-white/60"
                    )}
                    title={`Pilih data rapat tahun ${yr}`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            )}

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
        </div>

        {/* Bar Chart Area */}
        <div className="mt-6 relative">
          {/* Subtle Horizontal Background Guide Lines */}
          <div className="absolute inset-x-0 top-7 bottom-7 flex flex-col justify-between pointer-events-none opacity-40">
            <div className="border-b border-dashed border-slate-200 w-full" />
            <div className="border-b border-dashed border-slate-200 w-full" />
            <div className="border-b border-dashed border-slate-200 w-full" />
            <div className="border-b border-slate-200 w-full" />
          </div>

          {/* Bar Columns Container with fixed height so percentages render properly */}
          <div className="h-52 w-full flex items-end justify-between gap-1 sm:gap-2 pt-2 px-1 relative z-10">
            {chartData.map((item, idx) => {
              const heightPercent = getHeightPercent(item.count);
              const isPeak = item.isPeak && item.count > 0;
              const isSelected = effectiveSelectedMonth === item.month;
              const isHovered = hoveredMonth === item.month;
              const isActive = isSelected || isHovered;
              const ratio = maxCount > 0 ? item.count / maxCount : 0;

              return (
                <div
                  key={item.month}
                  onClick={() => handleMonthClick(item.month)}
                  className="flex-1 h-full flex flex-col justify-end items-center group cursor-pointer focus:outline-none"
                  onMouseEnter={() => setHoveredMonth(item.month)}
                  onMouseLeave={() => setHoveredMonth(null)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleMonthClick(item.month);
                    }
                  }}
                  title={`Klik untuk memfilter & kembali ke atas melihat statistik bulan ${FULL_MONTH_NAMES[item.month] || item.month} (${item.count} rapat)`}
                >
                  {/* Tooltip / Value on top of bar */}
                  <div className="h-8 w-full flex items-end justify-center mb-1.5 relative">
                    {isActive ? (
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center animate-in fade-in zoom-in-75 duration-150">
                        <div className="bg-[#215865] text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap flex items-center gap-1 border border-[#31889C]/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#7CC563] animate-pulse" />
                          <span>{item.count} Rapat</span>
                        </div>
                        <div className="w-1.5 h-1.5 bg-[#215865] rotate-45 -mt-0.5 border-r border-b border-[#31889C]/50" />
                      </div>
                    ) : (
                      <span
                        className={cn(
                          "text-[11px] font-bold transition-all",
                          isPeak
                            ? "text-[#215865] font-extrabold"
                            : item.count > 0
                            ? "text-slate-600"
                            : "text-slate-300"
                        )}
                      >
                        {item.count}
                      </span>
                    )}
                  </div>

                  {/* Fixed-height Bar Track Container */}
                  <div className="w-full h-32 flex items-end justify-center px-0.5">
                    <div
                      style={{
                        height: isAnimated ? `${heightPercent}%` : item.count > 0 ? '6px' : '2px',
                        transitionDelay: `${idx * 40}ms`,
                      }}
                      className={cn(
                        "w-full max-w-[26px] sm:max-w-[32px] rounded-t-lg transition-all duration-500 ease-out relative origin-bottom",
                        isSelected
                          ? "ring-2 ring-[#215865] ring-offset-2 scale-y-[1.03] shadow-md shadow-[#215865]/25 brightness-110"
                          : isHovered
                          ? "scale-y-105 brightness-105 shadow-xs"
                          : "",
                        item.count === 0
                          ? "bg-slate-100 hover:bg-slate-200"
                          : isPeak
                          ? "bg-gradient-to-t from-[#215865] via-[#31889C] to-[#51ADC2]"
                          : isSelected
                          ? "bg-gradient-to-t from-[#215865] to-[#31889C]"
                          : ratio >= 0.7
                          ? "bg-gradient-to-t from-[#31889C] to-[#80C3D1]"
                          : ratio >= 0.4
                          ? "bg-gradient-to-t from-[#51ADC2] to-[#BCE3EB]"
                          : "bg-gradient-to-t from-[#BCE3EB] to-[#E8F5F7]"
                      )}
                    >
                      {/* Peak indicator dot & pulse */}
                      {isPeak && (
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
                          <span className="w-2 h-2 rounded-full bg-[#31889C] animate-ping absolute" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#215865] relative z-10" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Month Label */}
                  <span
                    className={cn(
                      "text-[11px] mt-2 transition-all px-2 py-0.5 rounded-full select-none",
                      isSelected
                        ? "bg-[#215865] text-white font-extrabold shadow-2xs"
                        : isHovered
                        ? "bg-[#F0F9FA] text-[#31889C] font-bold"
                        : isPeak
                        ? "text-[#215865] font-bold"
                        : "text-slate-500 font-medium"
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

      {/* Footer Info Callout - Displays detailed count for selected / active month */}
      <div className="mt-4 pt-2 bg-gradient-to-r from-[#F0F9FA] via-white to-[#F0F9FA]/50 border border-[#BCE3EB] rounded-xl p-3 flex items-center justify-between transition-all shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#31889C]/10 border border-[#BCE3EB] flex items-center justify-center shrink-0 text-[#215865]">
            <Calendar className="w-4 h-4 text-[#31889C]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-bold text-slate-800">
                {effectiveSelectedMonth
                  ? `Bulan ${fullMonthName} ${selectedYear}`
                  : `Seluruh Rapat ${selectedYear} (YTD)`}
              </span>
              {effectiveSelectedMonth && activeItem?.isPeak && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#FEF3C7] text-[#92400E] rounded-md border border-[#FDE68A]">
                  Puncak
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-slate-500 truncate">
              {effectiveSelectedMonth
                ? `${activeItem?.count || 0} rapat (${monthPercentage}% dari total)`
                : 'Klik grafik batang setiap bulan untuk melihat rincian'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-3">
          {effectiveSelectedMonth && (
            <button
              type="button"
              onClick={() => handleMonthClick(effectiveSelectedMonth)}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 underline cursor-pointer mr-0.5"
              title="Reset pilihan bulan"
            >
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={scrollToStatsTop}
            className={cn(
              "bg-[#215865] hover:bg-[#1b4853] text-white px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer",
              effectiveSelectedMonth ? "hover:scale-[1.02] active:scale-95 group" : ""
            )}
            title={effectiveSelectedMonth ? "Kembali ke ringkasan statistik di atas" : "Total rapat"}
          >
            <span className="text-[15px] font-extrabold tracking-tight">
              {effectiveSelectedMonth ? activeItem?.count ?? 0 : totalYearCount}
            </span>
            <span className="text-[11px] font-medium text-[#BCE3EB]">
              Rapat
            </span>
            {effectiveSelectedMonth && (
              <ArrowUp className="w-3.5 h-3.5 text-[#7CC563] group-hover:-translate-y-0.5 transition-transform" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

