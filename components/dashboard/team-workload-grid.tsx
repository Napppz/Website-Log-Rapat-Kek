'use client';

import React from 'react';
import {
  Briefcase,
  Network,
  Radio,
  Layers,
  ChevronRight,
  CheckCircle2,
  Clock,
  Hourglass,
  Calendar,
  Users,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { TeamWorkloadMetric } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TeamWorkloadGridProps {
  teams: TeamWorkloadMetric[];
  onTeamClick: (team: TeamWorkloadMetric) => void;
}

export function TeamWorkloadGrid({ teams, onTeamClick }: TeamWorkloadGridProps) {
  if (!teams || teams.length === 0) {
    return null;
  }

  const getTeamIcon = (code: string) => {
    switch (code.toUpperCase()) {
      case 'INV':
        return <Briefcase className="w-5 h-5 text-[#31889C]" />;
      case 'KS':
        return <Network className="w-5 h-5 text-[#2E7D32]" />;
      case 'KOM':
        return <Radio className="w-5 h-5 text-[#D97706]" />;
      default:
        return <Layers className="w-5 h-5 text-[#31889C]" />;
    }
  };

  const getTeamColors = (code: string) => {
    switch (code.toUpperCase()) {
      case 'INV':
        return {
          gradient: 'from-teal-500/10 via-teal-500/5 to-transparent',
          borderHover: 'hover:border-[#31889C]',
          cardGlow: 'hover:shadow-[0_8px_30px_rgb(49,136,156,0.12)]',
          badgeBg: 'bg-teal-50 text-[#215865] border-teal-200',
          accentText: 'text-[#31889C]',
          barColor: 'bg-[#31889C]',
          lightBg: 'bg-[#F0F9FA]',
        };
      case 'KS':
        return {
          gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
          borderHover: 'hover:border-emerald-600',
          cardGlow: 'hover:shadow-[0_8px_30px_rgb(46,125,50,0.12)]',
          badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          accentText: 'text-emerald-700',
          barColor: 'bg-emerald-600',
          lightBg: 'bg-emerald-50/50',
        };
      case 'KOM':
        return {
          gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
          borderHover: 'hover:border-amber-500',
          cardGlow: 'hover:shadow-[0_8px_30px_rgb(217,119,6,0.12)]',
          badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
          accentText: 'text-amber-700',
          barColor: 'bg-amber-500',
          lightBg: 'bg-amber-50/50',
        };
      default:
        return {
          gradient: 'from-slate-500/10 via-slate-500/5 to-transparent',
          borderHover: 'hover:border-slate-400',
          cardGlow: 'hover:shadow-md',
          badgeBg: 'bg-slate-50 text-slate-800 border-slate-200',
          accentText: 'text-[#31889C]',
          barColor: 'bg-[#31889C]',
          lightBg: 'bg-slate-50',
        };
    }
  };

  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F5F7] text-[#215865] border border-[#BCE3EB]">
              <Sparkles className="w-3 h-3 text-[#31889C]" />
              BIRO INVESTASI, KERJA SAMA &amp; KOMUNIKASI (IKK)
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              • 3 Tim Kerja
            </span>
          </div>
          <h2 className="text-lg md:text-xl font-bold text-slate-900 mt-1">
            Status Kinerja &amp; Beban Kerja per Tim
          </h2>
          <p className="text-[13px] text-slate-500">
            Pemantauan langsung jumlah rapat dan status tiap pekerjaan tindak lanjut (Pak Bambang / Super Admin)
          </p>
        </div>

        <div className="text-[12px] text-slate-500 flex items-center gap-1 self-start sm:self-auto bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <span>💡</span>
          <span className="font-medium">Klik kartu tim untuk melihat rincian pekerjaan &amp; rapat</span>
        </div>
      </div>

      {/* 3 Interactive Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {teams.map((team) => {
          const colors = getTeamColors(team.code);
          return (
            <div
              key={team.id}
              role="button"
              tabIndex={0}
              onClick={() => onTeamClick(team)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onTeamClick(team);
                }
              }}
              className={cn(
                'group relative rounded-2xl bg-white border border-slate-200 p-5 shadow-sm transition-all duration-300 text-left cursor-pointer flex flex-col justify-between overflow-hidden',
                colors.borderHover,
                colors.cardGlow,
                'hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#31889C]/30'
              )}
            >
              {/* Subtle top ambient gradient */}
              <div
                className={cn(
                  'absolute top-0 left-0 right-0 h-24 bg-gradient-to-b opacity-60 pointer-events-none transition-opacity group-hover:opacity-100',
                  colors.gradient
                )}
              />

              <div className="relative z-10">
                {/* Header: Icon, Name, and Quick Arrow */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-11 h-11 rounded-xl flex items-center justify-center border shadow-xs transition-transform duration-300 group-hover:scale-105',
                        colors.lightBg,
                        'border-slate-200/80'
                      )}
                    >
                      {getTeamIcon(team.code)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                            colors.badgeBg
                          )}
                        >
                          TIM {team.code}
                        </span>
                        {team.memberCount > 0 && (
                          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {team.memberCount} staf
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-[16px] text-slate-900 group-hover:text-[#215865] transition-colors mt-0.5">
                        {team.fullName}
                      </h3>
                    </div>
                  </div>

                  <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-[#31889C] flex items-center justify-center transition-colors">
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                  </div>
                </div>

                {/* KPI 1: Jumlah Rapat */}
                <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-[12px] font-medium text-slate-600">
                      Jumlah Rapat
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-extrabold text-slate-900 tabular-nums">
                      {team.meetingCount}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      rapat ({team.meetingPercentage}%)
                    </span>
                  </div>
                </div>

                {/* KPI 2: Status Tiap Pekerjaan (Berjalan, Selesai, Dalam Proses) */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    <span>Status Tiap Pekerjaan</span>
                    <span className="text-slate-700 font-bold">
                      {team.totalJobs} Total Pekerjaan
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Selesai */}
                    <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 flex flex-col items-center text-center transition-all group-hover:bg-emerald-50">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 mb-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Selesai</span>
                      </div>
                      <span className="text-lg font-black text-emerald-700 tabular-nums">
                        {team.completedJobs}
                      </span>
                    </div>

                    {/* Berjalan */}
                    <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-2.5 flex flex-col items-center text-center transition-all group-hover:bg-sky-50">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-sky-800 mb-0.5">
                        <Clock className="w-3.5 h-3.5 text-sky-600" />
                        <span>Berjalan</span>
                      </div>
                      <span className="text-lg font-black text-sky-700 tabular-nums">
                        {team.inProgressJobs}
                      </span>
                    </div>

                    {/* Dalam Proses */}
                    <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 flex flex-col items-center text-center transition-all group-hover:bg-amber-50">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 mb-0.5">
                        <Hourglass className="w-3.5 h-3.5 text-amber-600" />
                        <span>Dalam Proses</span>
                      </div>
                      <span className="text-lg font-black text-amber-700 tabular-nums">
                        {team.pendingJobs}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer: Progress Bar + Action */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="text-slate-500 font-medium">Tingkat Penyelesaian</span>
                  <span className="font-bold text-slate-800 tabular-nums">
                    {team.completionRate}%
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700', colors.barColor)}
                    style={{ width: `${Math.max(team.completionRate, team.totalJobs > 0 ? 5 : 0)}%` }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-[12px] text-slate-500 group-hover:text-[#215865] font-semibold transition-colors">
                  <span>Lihat Detail Pekerjaan &amp; Rapat</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#31889C] group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
