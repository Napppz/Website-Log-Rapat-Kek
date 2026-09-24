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
}

const METRIC_LINKS: Record<string, { href: string; actionLabel: string }> = {
  'total-rapat': { href: '/semua-rapat', actionLabel: 'Lihat Semua' },
  'rapat-bulan-ini': { href: '/semua-rapat', actionLabel: 'Buka Jadwal' },
  'tindak-lanjut-aktif': { href: '/tindak-lanjut?status=IN_PROGRESS', actionLabel: 'Pantau Progres' },
  'perlu-atensi': { href: '/tindak-lanjut?status=OVERDUE', actionLabel: 'Atasi Masalah' },
  'tindak-lanjut-selesai': { href: '/tindak-lanjut?status=COMPLETED', actionLabel: 'Cek Arsip' },
};

export function StatsOverview({ metrics = MOCK_METRICS }: StatsOverviewProps) {
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 60);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {metrics.map((metric, idx) => {
        const isDanger = metric.variant === 'danger';
        const isSuccess = metric.variant === 'success';
        const linkInfo = METRIC_LINKS[metric.id] || { href: '/semua-rapat', actionLabel: 'Buka' };
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
                : 'border border-amber-200/70 hover:border-amber-400 hover:bg-amber-50/20'
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
                    : isSuccess
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
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
                    ? 'text-amber-600'
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
                    <TrendingUp className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span className="font-bold text-amber-700">{metric.changeValue}</span>
                    <span className="text-slate-400 truncate">{metric.changeLabel}</span>
                  </>
                )}

                {metric.id === 'rapat-bulan-ini' && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="font-bold text-amber-800">{metric.badgeText}</span>
                  </>
                )}

                {metric.id === 'tindak-lanjut-aktif' && (
                  <>
                    <Hourglass className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="font-bold text-amber-800">{metric.badgeText}</span>
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
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="font-bold text-emerald-700">{metric.badgeText}</span>
                  </>
                )}
              </div>

              {/* Action arrow cue */}
              <span
                className={cn(
                  'font-semibold text-[10.5px] flex items-center gap-0.5 shrink-0 transition-transform group-hover:translate-x-0.5',
                  isDanger ? 'text-red-600' : 'text-amber-800'
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
  );
}
