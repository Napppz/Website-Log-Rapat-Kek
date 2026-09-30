'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarCheck,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Hourglass,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { DashboardMetric } from '@/lib/types';
import { MOCK_METRICS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { AnimatedCounter } from '@/components/ui/animated-counter';

interface StatsOverviewProps {
  metrics?: DashboardMetric[];
  selectedMonth?: string | null;
  selectedYear?: number;
  onResetMonth?: () => void;
}

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

const METRIC_LINKS: Record<string, { href: string; actionLabel: string }> = {
  'total-rapat': { href: '/semua-rapat', actionLabel: 'Lihat Semua' },
  'rapat-bulan-ini': { href: '/semua-rapat', actionLabel: 'Buka Jadwal' },
  'tindak-lanjut-aktif': { href: '/tindak-lanjut?status=IN_PROGRESS', actionLabel: 'Pantau Progres' },
  'perlu-atensi': { href: '/tindak-lanjut?status=OVERDUE', actionLabel: 'Atasi Masalah' },
  'tindak-lanjut-selesai': { href: '/tindak-lanjut?status=COMPLETED', actionLabel: 'Cek Arsip' },
};

export function StatsOverview({
  metrics = MOCK_METRICS,
  selectedMonth = null,
  selectedYear = 2026,
  onResetMonth,
}: StatsOverviewProps) {
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 60);
    return () => clearTimeout(timer);
  }, []);

  const fullMonthName = selectedMonth ? (FULL_MONTH_NAMES[selectedMonth] || selectedMonth) : '';

  return (
    <div className="flex flex-col gap-3">
      {/* Active Month Filter Pill Indicator */}
      {selectedMonth && (
        <div className="flex items-center justify-between px-3.5 py-2 bg-gradient-to-r from-[#F0F9FA] via-white to-[#F0F9FA]/60 border border-[#BCE3EB] rounded-xl text-xs shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-[#215865] font-semibold min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#31889C] animate-pulse shrink-0" />
            <span className="truncate">
              Menampilkan data statistik untuk: <strong className="text-[#215865]">Bulan {fullMonthName} {selectedYear}</strong>
            </span>
          </div>
          {onResetMonth && (
            <button
              type="button"
              onClick={onResetMonth}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#31889C] hover:text-[#215865] bg-white px-2.5 py-1 rounded-lg border border-[#BCE3EB] hover:bg-[#F0F9FA] transition-all cursor-pointer shadow-2xs shrink-0 ml-2"
              title={`Kembali ke tampilan statistik tahunan (YTD ${selectedYear})`}
            >
              <span>✕</span>
              <span>Tampilkan Semua (YTD {selectedYear})</span>
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {metrics.map((metric, idx) => {
        const isDanger = metric.variant === 'danger';
        const isSuccess = metric.variant === 'success';
        const baseLinkInfo = METRIC_LINKS[metric.id] || { href: '/semua-rapat', actionLabel: 'Buka' };
        const linkHref = selectedMonth && (metric.id === 'total-rapat' || metric.id === 'rapat-bulan-ini')
          ? `${baseLinkInfo.href}?bulan=${encodeURIComponent(selectedMonth)}`
          : baseLinkInfo.href;
        const linkInfo = { ...baseLinkInfo, href: linkHref };
        const numValue =
          typeof metric.value === 'number'
            ? metric.value
            : parseInt(String(metric.value).replace(/[^0-9]/g, ''), 10) || 0;

        return (
          <Link
            key={metric.id}
            href={linkInfo.href}
            style={{
              transition: 'all 500ms cubic-bezier(0.16, 1, 0.3, 1)',
              transitionDelay: isAnimated ? `${idx * 60}ms` : '0ms',
              transform: isAnimated ? 'translateY(0)' : 'translateY(10px)',
              opacity: isAnimated ? 1 : 0,
            }}
            className={cn(
              'group relative rounded-2xl bg-white p-4 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer block',
              isDanger
                ? 'border border-red-200 hover:border-red-400 hover:bg-red-50/20'
                : 'border border-slate-200 hover:border-slate-300 hover:bg-slate-50/30'
            )}
            title={`Klik untuk membuka data: ${metric.label}`}
          >
            {/* Header: Label & Icon */}
            <div className="flex items-center justify-between gap-1">
              <span
                className={cn(
                  'font-semibold text-[11px] uppercase tracking-wider',
                  isDanger ? 'text-red-600 font-bold' : 'text-slate-500'
                )}
              >
                {metric.label}
              </span>
              <div
                className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110',
                  isDanger
                    ? 'bg-red-100 text-red-600'
                    : metric.id === 'total-rapat'
                    ? 'bg-[#E8F5F7] text-[#31889C]'
                    : metric.id === 'rapat-bulan-ini' || isSuccess
                    ? 'bg-[#ECF8E9] text-[#4D8F3D]'
                    : metric.id === 'tindak-lanjut-aktif'
                    ? 'bg-[#FFF0DC] text-[#B96800]'
                    : 'bg-[#E8F5F7] text-[#31889C]'
                )}
              >
                {metric.id === 'total-rapat' && <CalendarCheck className="w-4 h-4" />}
                {metric.id === 'rapat-bulan-ini' && <Calendar className="w-4 h-4" />}
                {metric.id === 'tindak-lanjut-aktif' && <Clock className="w-4 h-4" />}
                {metric.id === 'perlu-atensi' && <AlertTriangle className="w-4 h-4" />}
                {metric.id === 'tindak-lanjut-selesai' && <CheckCircle2 className="w-4 h-4" />}
              </div>
            </div>

            {/* Value & Unit */}
            <div className="mt-2 flex items-baseline gap-1.5">
              <span
                className={cn(
                  'font-extrabold text-[28px] leading-none tabular-nums',
                  isDanger
                    ? 'text-red-600'
                    : metric.id === 'tindak-lanjut-aktif'
                    ? 'text-[#B96800]'
                    : metric.id === 'total-rapat'
                    ? 'text-[#31889C]'
                    : 'text-slate-900'
                )}
              >
                {isAnimated ? (
                  <AnimatedCounter value={numValue} duration={750 + idx * 80} />
                ) : (
                  0
                )}
              </span>
              <span
                className={cn(
                  'text-[12px] font-semibold',
                  isDanger ? 'text-red-600' : 'text-slate-500'
                )}
              >
                {metric.unit}
              </span>
            </div>

            {/* Footer / Trend Info with Click prompt */}
            <div className="mt-2.5 flex items-center justify-between gap-1 text-[11.5px] border-t border-slate-100 pt-2">
              <div className="flex items-center gap-1.5 min-w-0">
                {metric.id === 'total-rapat' && (
                  <>
                    <TrendingUp className="w-3.5 h-3.5 text-[#31889C] shrink-0" />
                    <span className="font-bold text-[#31889C]">{metric.changeValue}</span>
                    <span className="text-slate-400 truncate">{metric.changeLabel}</span>
                  </>
                )}

                {metric.id === 'rapat-bulan-ini' && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7CC563] shrink-0" />
                    <span className="font-bold text-[#4D8F3D]">{metric.badgeText}</span>
                  </>
                )}

                {metric.id === 'tindak-lanjut-aktif' && (
                  <>
                    <Hourglass className="w-3.5 h-3.5 text-[#F99D1C] shrink-0" />
                    <span className="font-bold text-[#B96800]">{metric.badgeText}</span>
                  </>
                )}

                {metric.id === 'perlu-atensi' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse shrink-0" />
                    <span className="font-bold text-red-600">{metric.badgeText}</span>
                  </>
                )}

                {metric.id === 'tindak-lanjut-selesai' && (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#4D8F3D] shrink-0" />
                    <span className="font-bold text-[#4D8F3D]">{metric.badgeText}</span>
                  </>
                )}
              </div>

              {/* Action arrow cue */}
              <span
                className={cn(
                  'font-semibold text-[10.5px] flex items-center gap-0.5 shrink-0 transition-transform group-hover:translate-x-0.5',
                  isDanger ? 'text-red-600' : 'text-[#31889C]'
                )}
              >
                <span>{linkInfo.actionLabel}</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>
        );
      })}
      </div>
    </div>
  );
}

