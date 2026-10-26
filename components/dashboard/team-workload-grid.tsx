'use client';

import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Network,
  Radio,
  Layers,
  ChevronRight,
  Calendar,
  Users,
  Sparkles,
  ArrowUpRight,
  Search,
  Cpu,
  ShieldAlert,
  Scale,
} from 'lucide-react';
import { TeamWorkloadMetric } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TeamWorkloadGridProps {
  teams: TeamWorkloadMetric[];
  onTeamClick: (team: TeamWorkloadMetric) => void;
}

// Urutan tim kanonikal Biro 3, namun tetap menampilkan tim dinamis lainnya jika ada
const CANONICAL_CODES = ['INV', 'KS', 'KOM', 'SI', 'HKM', 'UMUM'];

export function TeamWorkloadGrid({ teams, onTeamClick }: TeamWorkloadGridProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const allTeams = useMemo(() => {
    if (!teams || teams.length === 0) return [];
    return [...teams]
      .filter((t) => (t.code || '').toUpperCase() !== 'POKJA' && !(t.name || '').toLowerCase().includes('pokja'))
      .sort((a, b) => {
        const idxA = CANONICAL_CODES.indexOf((a.code || '').toUpperCase());
        const idxB = CANONICAL_CODES.indexOf((b.code || '').toUpperCase());
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [teams]);

  // Filter & Search untuk Pimpinan jika jumlah tim banyak
  const filteredTeams = useMemo(() => {
    return allTeams.filter((team) => {
      // Text Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName =
          team.fullName?.toLowerCase().includes(query) ||
          team.name?.toLowerCase().includes(query);
        const matchCode = team.code?.toLowerCase().includes(query);
        if (!matchName && !matchCode) return false;
      }

      return true;
    });
  }, [allTeams, searchQuery]);

  if (!allTeams || allTeams.length === 0) {
    return null;
  }

  const getTeamIcon = (code: string) => {
    switch ((code || '').toUpperCase()) {
      case 'INV':
        return <Briefcase className="w-5 h-5 text-[#1E6B7B]" />;
      case 'KS':
        return <Network className="w-5 h-5 text-[#2E7D32]" />;
      case 'KOM':
        return <Radio className="w-5 h-5 text-[#D97706]" />;
      case 'SI':
        return <Cpu className="w-5 h-5 text-[#6366F1]" />;
      case 'HKM':
        return <Scale className="w-5 h-5 text-[#8B5CF6]" />;
      default:
        return <Layers className="w-5 h-5 text-[#1E6B7B]" />;
    }
  };

  const getTeamColors = (code: string) => {
    switch ((code || '').toUpperCase()) {
      case 'INV':
        return {
          gradient: 'from-teal-500/10 via-teal-500/5 to-transparent',
          borderHover: 'hover:border-[#1E6B7B]',
          cardGlow: 'hover:shadow-[0_8px_25px_rgb(30,107,123,0.12)]',
          badgeBg: 'bg-teal-50 text-[#1E6B7B] border-teal-200',
          accentText: 'text-[#1E6B7B]',
          lightBg: 'bg-[#F0F8FA]',
        };
      case 'KS':
        return {
          gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
          borderHover: 'hover:border-emerald-600',
          cardGlow: 'hover:shadow-[0_8px_25px_rgb(46,125,50,0.12)]',
          badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          accentText: 'text-emerald-700',
          lightBg: 'bg-emerald-50/60',
        };
      case 'KOM':
        return {
          gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
          borderHover: 'hover:border-amber-500',
          cardGlow: 'hover:shadow-[0_8px_25px_rgb(217,119,6,0.12)]',
          badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
          accentText: 'text-amber-700',
          lightBg: 'bg-amber-50/60',
        };
      case 'SI':
        return {
          gradient: 'from-indigo-500/10 via-indigo-500/5 to-transparent',
          borderHover: 'hover:border-indigo-500',
          cardGlow: 'hover:shadow-[0_8px_25px_rgb(99,102,241,0.12)]',
          badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          accentText: 'text-indigo-700',
          lightBg: 'bg-indigo-50/60',
        };
      case 'HKM':
        return {
          gradient: 'from-purple-500/10 via-purple-500/5 to-transparent',
          borderHover: 'hover:border-purple-500',
          cardGlow: 'hover:shadow-[0_8px_25px_rgb(139,92,246,0.12)]',
          badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
          accentText: 'text-purple-700',
          lightBg: 'bg-purple-50/60',
        };
      default:
        return {
          gradient: 'from-slate-500/10 via-slate-500/5 to-transparent',
          borderHover: 'hover:border-slate-400',
          cardGlow: 'hover:shadow-md',
          badgeBg: 'bg-slate-50 text-slate-800 border-slate-200',
          accentText: 'text-[#1E6B7B]',
          lightBg: 'bg-slate-50',
        };
    }
  };

  return (
    <section aria-label="Monitoring Beban Kerja Tim" className="w-full space-y-4">
      {/* 1. Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F5F7] text-[#1E6B7B] border border-[#BCE3EB]">
              <Sparkles className="w-3 h-3 text-[#1E6B7B]" />
              MONITORING TIM KERJA SEKRETARIAT KEK
            </span>
            <span className="text-[12px] font-semibold text-slate-500">
              • {allTeams.length} Tim Terpantau
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Monitoring Aktivitas &amp; Status Pekerjaan per Tim
          </h2>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Pemantauan langsung jumlah kegiatan dan status tiap pekerjaan seluruh Tim Kerja Biro 3.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64 self-start sm:self-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau kode tim..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/30 focus:border-[#1E6B7B] transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Grid Kartu Tim */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTeams.map((team) => {
          const colors = getTeamColors(team.code);
          const total = team.totalJobs || 0;
          const completed = team.completedJobs || 0;
          const inProgress = team.inProgressJobs || 0;
          const pending = team.pendingJobs || 0;
          const pCompleted = total > 0 ? Math.round((completed / total) * 100) : 0;
          const pInProgress = total > 0 ? Math.round((inProgress / total) * 100) : 0;
          const pPending = total > 0 ? Math.max(0, 100 - pCompleted - pInProgress) : 0;

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
                'group relative rounded-2xl bg-white border border-slate-200 p-4 shadow-2xs transition-all duration-200 text-left cursor-pointer flex flex-col justify-between overflow-hidden',
                colors.borderHover,
                colors.cardGlow,
                'hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/30'
              )}
            >
              {/* Ambient Top Gradient */}
              <div
                className={cn(
                  'absolute top-0 left-0 right-0 h-16 bg-gradient-to-b opacity-50 pointer-events-none transition-opacity group-hover:opacity-100',
                  colors.gradient
                )}
              />

              <div className="relative z-10">
                {/* Card Header: Icon, Badge, Team Name, Arrow */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center border shadow-2xs transition-transform duration-200 group-hover:scale-105 shrink-0',
                        colors.lightBg,
                        'border-slate-200/80'
                      )}
                    >
                      {getTeamIcon(team.code)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={cn(
                            'text-[10px] font-bold px-1.5 py-0.2 rounded-md border',
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
                      <h3 className="font-bold text-[15px] text-slate-900 group-hover:text-[#1E6B7B] transition-colors truncate mt-0.5" title={team.fullName}>
                        {team.fullName}
                      </h3>
                    </div>
                  </div>

                  <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-[#1E6B7B] flex items-center justify-center shrink-0 transition-colors">
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                  </div>
                </div>

                {/* Metric: Jumlah Kegiatan */}
                <div className="bg-slate-50/90 rounded-xl px-3 py-2 border border-slate-100 mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-600 text-xs font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Jumlah Kegiatan</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-extrabold text-slate-900 tabular-nums">
                      {team.meetingCount}
                    </span>
                    <span className="text-[10.5px] font-medium text-slate-400">kegiatan</span>
                  </div>
                </div>

                {/* Status 3 Kotak (Menunggu, Proses, Selesai) - Label Ringkas & Anti-Truncate */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center justify-between text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
                    <span>Status Tiap Pekerjaan</span>
                    <span className="text-slate-700 font-bold">{team.totalJobs} Total</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {/* Belum Dimulai */}
                    <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-2 text-center group-hover:bg-sky-50 transition-colors">
                      <span className="text-[10px] font-bold text-sky-800 block truncate" title="Belum Dimulai">
                        Menunggu
                      </span>
                      <span className="text-base font-black text-sky-700 tabular-nums">
                        {pending}
                      </span>
                    </div>

                    {/* Dalam Proses */}
                    <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-2 text-center group-hover:bg-amber-50 transition-colors">
                      <span className="text-[10px] font-bold text-amber-800 block truncate" title="Dalam Proses">
                        Proses
                      </span>
                      <span className="text-base font-black text-amber-700 tabular-nums">
                        {inProgress}
                      </span>
                    </div>

                    {/* Selesai */}
                    <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-2 text-center group-hover:bg-emerald-50 transition-colors">
                      <span className="text-[10px] font-bold text-emerald-800 block truncate" title="Selesai">
                        Selesai
                      </span>
                      <span className="text-base font-black text-emerald-700 tabular-nums">
                        {completed}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stacked Progress Bar & Completion Rate */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600 text-[11px]">Tingkat Penyelesaian</span>
                    <span className="font-bold text-slate-900 tabular-nums text-xs">
                      {team.completionRate}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-2xs">
                    <div style={{ width: `${pCompleted}%` }} className="bg-emerald-500 transition-all duration-300" title={`Selesai: ${completed}`} />
                    <div style={{ width: `${pInProgress}%` }} className="bg-amber-400 transition-all duration-300" title={`Dalam Proses: ${inProgress}`} />
                    <div style={{ width: `${pPending}%` }} className="bg-slate-300 transition-all duration-300" title={`Belum Dimulai: ${pending}`} />
                  </div>
                </div>
              </div>

              {/* Card Footer: Detail Link with Chevron */}
              <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500 group-hover:text-[#1E6B7B] transition-colors">
                <span>Lihat Detail Tim &amp; Hasil</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#1E6B7B] group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTeams.length === 0 && (
        <div className="text-center py-10 bg-white border border-slate-200 rounded-2xl p-6">
          <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">Tidak ada tim yang cocok</h3>
          <p className="text-xs text-slate-400 mt-1">Coba ubah kata kunci pencarian.</p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="mt-3 text-xs font-bold text-[#1E6B7B] hover:underline cursor-pointer"
          >
            Hapus Pencarian
          </button>
        </div>
      )}
    </section>
  );
}
