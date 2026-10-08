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
  const [isHighlighted, setIsHighlighted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 60);
    return () => clearTimeout(timer);
  }, []);

  // Visual pulse whenever selectedMonth changes so user/supervisor immediately notices real-time update
  useEffect(() => {
    if (selectedMonth) {
      setIsHighlighted(true);
      const timer = setTimeout(() => {
        setIsHighlighted(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [selectedMonth]);

  const fullMonthName = selectedMonth ? (FULL_MONTH_NAMES[selectedMonth] || selectedMonth) : '';

  return (
    <div id="stats-overview" className="flex flex-col gap-3 scroll-mt-24">

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
              'group relative rounded-2xl bg-white p-4 shadow-2xs hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer block overflow-hidden border',
              isHighlighted ? 'border-[#31889C]/70 shadow-sm shadow-[#31889C]/15 ring-1 ring-[#31889C]/20' : 'border-slate-200/90',
              // KEK 4-Quadrant Accent Top Stripes
              metric.id === 'total-rapat' && 'border-t-[3px] border-t-[#1E6B7B] hover:border-[#1E6B7B]/40 hover:bg-[#F0F8FA]/30',
              metric.id === 'rapat-bulan-ini' && 'border-t-[3px] border-t-[#7CC563] hover:border-[#7CC563]/40 hover:bg-[#ECF8E9]/30',
              metric.id === 'tindak-lanjut-aktif' && 'border-t-[3px] border-t-[#F99D1C] hover:border-[#F99D1C]/40 hover:bg-[#FFF0DC]/30',
              metric.id === 'perlu-atensi' && 'border-t-[3px] border-t-[#DC2626] hover:border-red-400 hover:bg-red-50/20',
              metric.id === 'tindak-lanjut-selesai' && 'border-t-[3px] border-t-[#16A34A] hover:border-[#16A34A]/40 hover:bg-[#DCFCE7]/30'
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
                  'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-2xs',
                  isDanger
                    ? 'bg-red-100 text-red-600 border border-red-200'
                    : metric.id === 'total-rapat'
                    ? 'bg-[#F0F8FA] text-[#1E6B7B] border border-[#BCE3EB]'
                    : metric.id === 'rapat-bulan-ini'
                    ? 'bg-[#ECF8E9] text-[#15803D] border border-[#D2EFCA]'
                    : metric.id === 'tindak-lanjut-aktif'
                    ? 'bg-[#FFF0DC] text-[#C2410C] border border-[#FEDEBE]'
                    : metric.id === 'tindak-lanjut-selesai' || isSuccess
                    ? 'bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]'
                    : 'bg-[#F0F8FA] text-[#1E6B7B] border border-[#BCE3EB]'
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
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span
                className={cn(
                  'font-black text-[30px] leading-none font-mono tracking-tight',
                  isDanger
                    ? 'text-red-600'
                    : metric.id === 'tindak-lanjut-aktif'
                    ? 'text-[#C2410C]'
                    : metric.id === 'total-rapat'
                    ? 'text-[#1E6B7B]'
                    : metric.id === 'tindak-lanjut-selesai'
                    ? 'text-[#15803D]'
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

