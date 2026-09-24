import React from 'react';
import {
  CalendarCheck,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Hourglass,
  ShieldCheck,
} from 'lucide-react';
import { DashboardMetric } from '@/lib/types';
import { MOCK_METRICS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

interface StatsOverviewProps {
  metrics?: DashboardMetric[];
}

export function StatsOverview({ metrics = MOCK_METRICS }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {metrics.map((metric) => {
        const isDanger = metric.variant === 'danger';
        const isSuccess = metric.variant === 'success';

        return (
          <div
            key={metric.id}
            className={cn(
              "group relative rounded-xl bg-white p-4 shadow-sm transition-all duration-200",
              isDanger
                ? "border border-red-200 hover:border-red-400 hover:shadow-md"
                : "border border-amber-200/60 hover:border-amber-400 hover:shadow-md"
            )}
          >
            {/* Header: Label & Icon */}
            <div className="flex items-center justify-between gap-1">
              <span
                className={cn(
                  "font-semibold text-[12px] uppercase tracking-wider",
                  isDanger ? "text-red-600" : "text-slate-500"
                )}
              >
                {metric.label}
              </span>
              <div
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                  isDanger
                    ? "bg-red-50 text-red-600"
                    : isSuccess
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-amber-100 text-amber-700"
                )}
              >
                {metric.id === 'total-rapat' && <CalendarCheck className="w-5 h-5" />}
                {metric.id === 'rapat-bulan-ini' && <Calendar className="w-5 h-5" />}
                {metric.id === 'tindak-lanjut-aktif' && <Clock className="w-5 h-5" />}
                {metric.id === 'perlu-atensi' && <AlertTriangle className="w-5 h-5" />}
                {metric.id === 'tindak-lanjut-selesai' && <CheckCircle2 className="w-5 h-5" />}
              </div>
            </div>

            {/* Value & Unit */}
            <div className="mt-2 flex items-baseline gap-1.5">
              <span
                className={cn(
                  "font-bold text-[30px] leading-none",
                  isDanger
                    ? "text-red-600"
                    : metric.id === 'tindak-lanjut-aktif'
                    ? "text-amber-600"
                    : "text-slate-900"
                )}
              >
                {metric.value}
              </span>
              <span
                className={cn(
                  "text-[13px] font-medium",
                  isDanger ? "text-red-600 font-semibold" : "text-slate-500"
                )}
              >
                {metric.unit}
              </span>
            </div>

            {/* Footer / Trend Info */}
            <div className="mt-2.5 flex items-center gap-1.5 text-[12px]">
              {metric.id === 'total-rapat' && (
                <>
                  <TrendingUp className="w-4 h-4 text-amber-700" />
                  <span className="font-bold text-amber-700">{metric.changeValue}</span>
                  <span className="text-slate-500">{metric.changeLabel}</span>
                </>
              )}

              {metric.id === 'rapat-bulan-ini' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="font-bold text-amber-800">{metric.badgeText}</span>
                  <span className="text-slate-500">{metric.badgeSubtext}</span>
                </>
              )}

              {metric.id === 'tindak-lanjut-aktif' && (
                <>
                  <Hourglass className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-amber-800">{metric.badgeText}</span>
                  <span className="text-slate-500">{metric.badgeSubtext}</span>
                </>
              )}

              {metric.id === 'perlu-atensi' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                  <span className="font-bold text-red-600">{metric.badgeText}</span>
                  <span className="text-slate-500">{metric.badgeSubtext}</span>
                </>
              )}

              {metric.id === 'tindak-lanjut-selesai' && (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-emerald-700">{metric.badgeText}</span>
                  <span className="text-slate-500">{metric.badgeSubtext}</span>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
