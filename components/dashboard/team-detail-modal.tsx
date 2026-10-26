'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X,
  Briefcase,
  Network,
  Radio,
  Layers,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  ExternalLink,
  PlusCircle,
  FileText,
  Search,
  Filter,
  RotateCcw,
  Link2,
  Download,
} from 'lucide-react';
import { parsePicDeliverableDescription } from '@/lib/pic-deliverables';
import { TeamWorkloadMetric } from '@/lib/types';
import { cn } from '@/lib/utils';
import { MeetingProgressBadge } from '@/components/meeting/meeting-status-badge';

interface TeamDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: TeamWorkloadMetric | null;
}

type ModalTab = 'jobs' | 'meetings' | 'members';
export type DatePeriodFilter = 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM';

interface DateBoundaries {
  todayStr: string;
  weekStart: string;
  weekEnd: string;
  monthStart: string;
  monthEnd: string;
  currentYear: number;
  currentMonth: number;
}

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDateBoundaries(): DateBoundaries {
  const now = new Date();
  const todayStr = toLocalDateStr(now);

  const dayOfWeek = now.getDay();
  // Senin = 1, Minggu = 0 -> selisih hari menuju hari Senin
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const weekStart = toLocalDateStr(monday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const weekEnd = toLocalDateStr(sunday);

  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthStart = toLocalDateStr(firstOfMonth);

  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const monthEnd = toLocalDateStr(lastOfMonth);

  return {
    todayStr,
    weekStart,
    weekEnd,
    monthStart,
    monthEnd,
    currentYear: now.getFullYear(),
    currentMonth: now.getMonth(),
  };
}

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_SHORT_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

function formatIndonesianDateLabel(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      const mIdx = parseInt(parts[1], 10) - 1;
      return `${day} ${MONTH_SHORT_ID[mIdx]} ${parts[0]}`;
    }
  } catch {
    // fallback
  }
  return dateStr;
}

function isDateInPeriod(
  dateValue: string | Date | null | undefined,
  period: DatePeriodFilter,
  boundaries: DateBoundaries,
  customStart?: string,
  customEnd?: string
): boolean {
  if (period === 'ALL') return true;
  if (!dateValue) return false;

  let clean = '';
  if (dateValue instanceof Date) {
    clean = toLocalDateStr(dateValue);
  } else if (typeof dateValue === 'string') {
    clean = dateValue.slice(0, 10);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return false;

  if (period === 'TODAY') {
    return clean === boundaries.todayStr;
  }
  if (period === 'THIS_WEEK') {
    return clean >= boundaries.weekStart && clean <= boundaries.weekEnd;
  }
  if (period === 'THIS_MONTH') {
    return clean >= boundaries.monthStart && clean <= boundaries.monthEnd;
  }
  if (period === 'CUSTOM') {
    if (customStart && customEnd) {
      const min = customStart < customEnd ? customStart : customEnd;
      const max = customStart < customEnd ? customEnd : customStart;
      return clean >= min && clean <= max;
    }
    if (customStart) {
      return clean === customStart;
    }
    if (customEnd) {
      return clean === customEnd;
    }
    return true;
  }
  return true;
}

export function TeamDetailModal({ isOpen, onClose, team }: TeamDetailModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ModalTab>('jobs');
  const [jobFilter, setJobFilter] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'PENDING'>('ALL');
  const [dateFilter, setDateFilter] = useState<DatePeriodFilter>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const boundaries = useMemo(() => getDateBoundaries(), []);

  if (!isOpen || !team) return null;

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

  const getTeamColorTheme = (code: string) => {
    switch (code.toUpperCase()) {
      case 'INV':
        return {
          bgBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          accent: 'text-[#31889C]',
          ring: 'ring-teal-500/20',
        };
      case 'KS':
        return {
          bgBadge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          accent: 'text-[#2E7D32]',
          ring: 'ring-emerald-500/20',
        };
      case 'KOM':
        return {
          bgBadge: 'bg-amber-50 text-amber-800 border-amber-200',
          accent: 'text-[#D97706]',
          ring: 'ring-amber-500/20',
        };
      default:
        return {
          bgBadge: 'bg-slate-50 text-slate-800 border-slate-200',
          accent: 'text-[#31889C]',
          ring: 'ring-slate-500/20',
        };
    }
  };

  const theme = getTeamColorTheme(team.code);

  const getJobDate = (job: NonNullable<TeamWorkloadMetric['actionItems']>[number]) => {
    return job.dueDate || team.meetings?.find((m) => m.id === job.meetingId || m.meetingNumber === job.meetingNumber)?.date || null;
  };

  // Periode Filtered Collections
  const dateFilteredJobs = (team.actionItems || []).filter((job) => {
    const jobDate = getJobDate(job);
    return isDateInPeriod(jobDate, dateFilter, boundaries, customStartDate, customEndDate);
  });

  const dateFilteredMeetings = (team.meetings || []).filter((m) => {
    return isDateInPeriod(m.date, dateFilter, boundaries, customStartDate, customEndDate);
  });

  // Hitung jumlah item tiap periode untuk badge indikator
  const countsByPeriod = {
    todayJobs: (team.actionItems || []).filter((j) => isDateInPeriod(getJobDate(j), 'TODAY', boundaries)).length,
    todayMeetings: (team.meetings || []).filter((m) => isDateInPeriod(m.date, 'TODAY', boundaries)).length,
    weekJobs: (team.actionItems || []).filter((j) => isDateInPeriod(getJobDate(j), 'THIS_WEEK', boundaries)).length,
    weekMeetings: (team.meetings || []).filter((m) => isDateInPeriod(m.date, 'THIS_WEEK', boundaries)).length,
    monthJobs: (team.actionItems || []).filter((j) => isDateInPeriod(getJobDate(j), 'THIS_MONTH', boundaries)).length,
    monthMeetings: (team.meetings || []).filter((m) => isDateInPeriod(m.date, 'THIS_MONTH', boundaries)).length,
    customJobs: (team.actionItems || []).filter((j) => isDateInPeriod(getJobDate(j), 'CUSTOM', boundaries, customStartDate, customEndDate)).length,
    customMeetings: (team.meetings || []).filter((m) => isDateInPeriod(m.date, 'CUSTOM', boundaries, customStartDate, customEndDate)).length,
  };

  // Metrik KPI reaktif berdasarkan filter periode yang aktif
  const kpiMeetingCount = dateFilteredMeetings.length;
  const kpiTotalJobs = dateFilteredJobs.length;
  const kpiCompletedJobs = dateFilteredJobs.filter((j) => j.status === 'COMPLETED').length;
  const kpiInProgressJobs = dateFilteredJobs.filter((j) => j.status === 'IN_PROGRESS').length;
  const kpiPendingJobs = dateFilteredJobs.filter((j) => j.status === 'PENDING').length;

  // Filter teks pencarian dan status pekerjaan
  const filteredJobs = dateFilteredJobs.filter((job) => {
    if (jobFilter !== 'ALL' && job.status !== jobFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        job.title.toLowerCase().includes(q) ||
        (job.picName && job.picName.toLowerCase().includes(q)) ||
        (job.meetingNumber && job.meetingNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const filteredMeetings = dateFilteredMeetings.filter((m) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        m.meetingNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Finish
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <Clock className="w-3 h-3 text-amber-600" />
            Dalam Proses
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-300">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <AlertCircle className="w-3 h-3 text-sky-600" />
            Belum Dimulai
          </span>
        );
    }
  };

  const getMeetingHref = (job: NonNullable<TeamWorkloadMetric['actionItems']>[number]) => {
    const targetId = job.meetingId || team.meetings?.find((m) => m.meetingNumber === job.meetingNumber)?.id || job.meetingNumber;
    return targetId ? `/arsip-kegiatan/${targetId}` : null;
  };

  const periodDateLabel = (() => {
    switch (dateFilter) {
      case 'TODAY':
        return `Hari Ini • ${formatIndonesianDateLabel(boundaries.todayStr)}`;
      case 'THIS_WEEK':
        return `Minggu Ini • ${formatIndonesianDateLabel(boundaries.weekStart)} – ${formatIndonesianDateLabel(boundaries.weekEnd)}`;
      case 'THIS_MONTH':
        return `Bulan Ini • ${MONTH_NAMES_ID[boundaries.currentMonth]} ${boundaries.currentYear}`;
      case 'CUSTOM':
        if (customStartDate && customEndDate) {
          const min = customStartDate < customEndDate ? customStartDate : customEndDate;
          const max = customStartDate < customEndDate ? customEndDate : customStartDate;
          return min === max
            ? `Tanggal • ${formatIndonesianDateLabel(min)}`
            : `Rentang • ${formatIndonesianDateLabel(min)} – ${formatIndonesianDateLabel(max)}`;
        }
        if (customStartDate) {
          return `Tanggal • ${formatIndonesianDateLabel(customStartDate)}`;
        }
        if (customEndDate) {
          return `Tanggal • ${formatIndonesianDateLabel(customEndDate)}`;
        }
        return 'Pilih tanggal spesifik atau rentang tanggal';
      case 'ALL':
      default:
        return 'Seluruh riwayat agenda & pekerjaan';
    }
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-200 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center shrink-0">
              {getTeamIcon(team.code)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wide border', theme.bgBadge)}>
                  {team.fullName} ({team.code})
                </span>
                <span className="text-[12px] text-slate-400">•</span>
                <span className="text-[12px] font-semibold text-slate-500">
                  Biro Investasi, Kerja Sama &amp; Komunikasi (IKK)
                </span>
              </div>
              <h2 className="text-[20px] font-extrabold text-slate-900 mt-1 leading-snug">
                Detail Monitoring Kinerja {team.fullName}
              </h2>
              {team.description && (
                <p className="text-[12.5px] text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
                  {team.description}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Tutup detail tim"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Date Filter Bar (Hari Ini, Minggu Ini, Bulan Ini, Semua Waktu) */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200/90 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-[#31889C]" />
              <span>Filter Tanggal:</span>
            </div>
            <div className="inline-flex items-center p-0.5 bg-white border border-slate-200 rounded-lg shadow-2xs gap-0.5">
              <button
                type="button"
                onClick={() => setDateFilter('ALL')}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer',
                  dateFilter === 'ALL'
                    ? 'bg-[#215865] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                )}
              >
                Semua Waktu
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('TODAY')}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5',
                  dateFilter === 'TODAY'
                    ? 'bg-[#215865] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                )}
              >
                <span>Hari Ini</span>
                {(countsByPeriod.todayJobs > 0 || countsByPeriod.todayMeetings > 0) && (
                  <span
                    className={cn(
                      'px-1.5 py-0.2 rounded-full text-[9.5px] font-black',
                      dateFilter === 'TODAY'
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-100 text-emerald-800'
                    )}
                  >
                    {activeTab === 'meetings' ? countsByPeriod.todayMeetings : countsByPeriod.todayJobs}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('THIS_WEEK')}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5',
                  dateFilter === 'THIS_WEEK'
                    ? 'bg-[#215865] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                )}
              >
                <span>Minggu Ini</span>
                {(countsByPeriod.weekJobs > 0 || countsByPeriod.weekMeetings > 0) && (
                  <span
                    className={cn(
                      'px-1.5 py-0.2 rounded-full text-[9.5px] font-black',
                      dateFilter === 'THIS_WEEK'
                        ? 'bg-white/20 text-white'
                        : 'bg-sky-100 text-sky-800'
                    )}
                  >
                    {activeTab === 'meetings' ? countsByPeriod.weekMeetings : countsByPeriod.weekJobs}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('THIS_MONTH')}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5',
                  dateFilter === 'THIS_MONTH'
                    ? 'bg-[#215865] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                )}
              >
                <span>Bulan Ini</span>
                {(countsByPeriod.monthJobs > 0 || countsByPeriod.monthMeetings > 0) && (
                  <span
                    className={cn(
                      'px-1.5 py-0.2 rounded-full text-[9.5px] font-black',
                      dateFilter === 'THIS_MONTH'
                        ? 'bg-white/20 text-white'
                        : 'bg-amber-100 text-amber-800'
                    )}
                  >
                    {activeTab === 'meetings' ? countsByPeriod.monthMeetings : countsByPeriod.monthJobs}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('CUSTOM')}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5',
                  dateFilter === 'CUSTOM'
                    ? 'bg-[#215865] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                )}
              >
                <Calendar className="w-3 h-3" />
                <span>Pilih Tanggal</span>
                {(customStartDate || customEndDate) && (
                  <span
                    className={cn(
                      'px-1.5 py-0.2 rounded-full text-[9.5px] font-black',
                      dateFilter === 'CUSTOM'
                        ? 'bg-white/20 text-white'
                        : 'bg-[#E8F5F7] text-[#215865]'
                    )}
                  >
                    {activeTab === 'meetings' ? countsByPeriod.customMeetings : countsByPeriod.customJobs}
                  </span>
                )}
              </button>
            </div>

            {/* Custom Date Pickers (Muncul saat Pilih Tanggal aktif) */}
            {dateFilter === 'CUSTOM' && (
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-[#BCE3EB] shadow-2xs text-[11.5px] animate-in fade-in duration-150">
                <span className="text-[11px] font-semibold text-slate-500">Pilih:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  onClick={(e) => {
                    try {
                      (e.currentTarget as any).showPicker?.();
                    } catch {}
                  }}
                  className="text-[11.5px] font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#31889C] cursor-pointer"
                  title="Pilih tanggal spesifik atau tanggal mulai rentang"
                />
                <span className="text-[11px] text-slate-400 font-medium">s/d</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  onClick={(e) => {
                    try {
                      (e.currentTarget as any).showPicker?.();
                    } catch {}
                  }}
                  className="text-[11.5px] font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#31889C] cursor-pointer"
                  title="Pilih tanggal akhir jika ingin rentang tanggal (opsional)"
                />
                {(customStartDate || customEndDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomStartDate('');
                      setCustomEndDate('');
                    }}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                    title="Kosongkan tanggal"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium ml-auto">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span className="font-semibold text-slate-700">{periodDateLabel}</span>
            </span>
            {dateFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => {
                  setDateFilter('ALL');
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="inline-flex items-center gap-0.5 text-[10.5px] text-[#31889C] hover:text-[#215865] hover:underline font-bold cursor-pointer"
                title="Reset periode ke semua waktu"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation & Search */}
        <div className="px-5 pt-3 pb-2.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => {
                setActiveTab('jobs');
                setSearchQuery('');
              }}
              className={cn(
                'px-3 py-1.5 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0',
                activeTab === 'jobs'
                  ? 'bg-[#31889C] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Status Pekerjaan ({kpiTotalJobs})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('meetings');
                setSearchQuery('');
              }}
              className={cn(
                'px-3 py-1.5 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0',
                activeTab === 'meetings'
                  ? 'bg-[#31889C] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Daftar Kegiatan ({kpiMeetingCount})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('members');
                setSearchQuery('');
              }}
              className={cn(
                'px-3 py-1.5 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0',
                activeTab === 'members'
                  ? 'bg-[#31889C] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Anggota Tim ({team.memberCount})</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari dalam tim..."
              className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#31889C]/20 focus:border-[#31889C]"
            />
          </div>
        </div>

        {/* Modal Body / Tab Contents */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-slate-50/40">
          {/* TAB 1: STATUS PEKERJAAN (TINDAK LANJUT) */}
          {activeTab === 'jobs' && (
            <div className="space-y-3">
              {/* Filter Pills for Status */}
              <div className="flex items-center gap-1.5 flex-wrap pb-1">
                <span className="text-[11.5px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-[#31889C]" />
                  Status:
                </span>
                <button
                  type="button"
                  onClick={() => setJobFilter('ALL')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer',
                    jobFilter === 'ALL'
                      ? 'bg-[#215865] text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  )}
                >
                  Semua ({kpiTotalJobs})
                </button>
                <button
                  type="button"
                  onClick={() => setJobFilter('PENDING')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer',
                    jobFilter === 'PENDING'
                      ? 'bg-sky-700 text-white shadow-2xs'
                      : 'bg-white border border-sky-200 text-sky-800 hover:bg-sky-50'
                  )}
                >
                  Belum Dimulai ({kpiPendingJobs})
                </button>
                <button
                  type="button"
                  onClick={() => setJobFilter('IN_PROGRESS')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer',
                    jobFilter === 'IN_PROGRESS'
                      ? 'bg-amber-700 text-white shadow-2xs'
                      : 'bg-white border border-amber-200 text-amber-800 hover:bg-amber-50'
                  )}
                >
                  Dalam Proses ({kpiInProgressJobs})
                </button>
                <button
                  type="button"
                  onClick={() => setJobFilter('COMPLETED')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer',
                    jobFilter === 'COMPLETED'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50'
                  )}
                >
                  Selesai ({kpiCompletedJobs})
                </button>
              </div>

              {filteredJobs.length > 0 ? (
                <div className="space-y-2.5">
                  {filteredJobs.map((job) => {
                    const meetingHref = getMeetingHref(job);

                    return (
                      <div
                        key={job.id}
                        className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {meetingHref ? (
                              <Link
                                href={meetingHref}
                                onClick={onClose}
                                title={`Buka rincian kegiatan ${job.meetingNumber || ''}`}
                                className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#1E6B7B] bg-[#F0F9FA] hover:bg-[#E0F3F7] hover:border-[#31889C] px-2 py-0.5 rounded border border-[#BCE3EB] transition-colors cursor-pointer group/link"
                              >
                                <span>Kegiatan {job.meetingNumber}</span>
                                <ExternalLink className="w-2.5 h-2.5 text-[#1E6B7B] group-hover/link:translate-x-0.5 transition-transform" />
                              </Link>
                            ) : job.meetingNumber ? (
                              <span className="text-[11px] font-mono font-bold text-[#1E6B7B] bg-[#F0F9FA] px-2 py-0.5 rounded border border-[#BCE3EB]">
                                Kegiatan {job.meetingNumber}
                              </span>
                            ) : null}

                            {job.priority && (
                              <span className="text-[10px] font-bold uppercase text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                Prioritas: {job.priority}
                              </span>
                            )}
                          </div>

                          <h4 className="font-bold text-[13.5px] text-slate-900 leading-snug">
                            {job.title}
                          </h4>

                          <div className="flex items-center gap-4 text-[11.5px] text-slate-500 mt-2 flex-wrap">
                            {job.picName && (
                              <span className="flex items-center gap-1 font-medium">
                                👤 PIC: <strong>{job.picName}</strong>
                              </span>
                            )}
                            {job.dueDate && (
                              <span className="flex items-center gap-1 font-medium">
                                📅 Tenggat: <strong>{job.dueDate}</strong>
                              </span>
                            )}
                          </div>

                          {/* Output / Tautan Luaran PIC yang Langsung Bisa Diklik Pimpinan */}
                          {(() => {
                            const parsed = parsePicDeliverableDescription(job.description);
                            const effectiveLinkUrl = job.linkUrl || parsed.linkUrl;
                            const effectiveFileUrl = job.fileUrl || parsed.fileUrl;
                            const effectiveLinkTitle = job.linkTitle || parsed.linkTitle || (effectiveLinkUrl ? 'Buka Tautan Luaran / Output' : '');
                            const effectiveFileName = job.fileName || parsed.fileName || (effectiveFileUrl ? 'Berkas Output PIC' : '');
                            const effectiveNotes = job.notes || parsed.notes;

                            return (
                              <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5">
                                {(effectiveLinkUrl || effectiveFileUrl) ? (
                                  <div className="flex flex-wrap items-center gap-2">
                                    {parsed.links && parsed.links.length > 0 ? (
                                      parsed.links.map((link, lIdx) => (
                                        <a
                                          key={link.url + lIdx}
                                          href={link.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11.5px] font-bold shadow-2xs transition-all group/outlink cursor-pointer hover:border-emerald-400"
                                          title={`Buka tautan luaran PIC: ${link.url}`}
                                        >
                                          <ExternalLink className="w-3.5 h-3.5 text-emerald-600 group-hover/outlink:scale-110 transition-transform shrink-0" />
                                          <span className="truncate max-w-[220px] sm:max-w-[320px]">
                                            {link.title || (parsed.links && parsed.links.length > 1 ? `Tautan #${lIdx + 1}` : 'Buka Tautan Luaran / Output')}
                                          </span>
                                          <span className="text-[9.5px] font-mono px-1 py-0.2 rounded bg-emerald-200/70 text-emerald-900 shrink-0 font-bold">
                                            Buka Link ↗
                                          </span>
                                        </a>
                                      ))
                                    ) : effectiveLinkUrl ? (
                                      <a
                                        href={effectiveLinkUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11.5px] font-bold shadow-2xs transition-all group/outlink cursor-pointer hover:border-emerald-400"
                                        title={`Buka tautan luaran PIC: ${effectiveLinkUrl}`}
                                      >
                                        <ExternalLink className="w-3.5 h-3.5 text-emerald-600 group-hover/outlink:scale-110 transition-transform shrink-0" />
                                        <span className="truncate max-w-[220px] sm:max-w-[320px]">
                                          {effectiveLinkTitle}
                                        </span>
                                        <span className="text-[9.5px] font-mono px-1 py-0.2 rounded bg-emerald-200/70 text-emerald-900 shrink-0 font-bold">
                                          Buka Link ↗
                                        </span>
                                      </a>
                                    ) : null}

                                    {effectiveFileUrl && (
                                      <a
                                        href={effectiveFileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-[11.5px] font-bold shadow-2xs transition-all group/filelink cursor-pointer"
                                        title={`Unduh berkas fisik: ${effectiveFileName}`}
                                      >
                                        <Download className="w-3.5 h-3.5 text-[#1E6B7B] group-hover/filelink:translate-y-0.5 transition-transform shrink-0" />
                                        <span className="truncate max-w-[180px] sm:max-w-[240px]">
                                          {effectiveFileName}
                                        </span>
                                      </a>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 italic">
                                    <Link2 className="w-3 h-3 text-slate-300 shrink-0" />
                                    <span>Belum ada tautan online dilampirkan PIC</span>
                                  </div>
                                )}

                                {effectiveNotes && (
                                  <p className="text-[11.5px] text-slate-600 bg-slate-50/90 px-2.5 py-1.5 rounded-lg border border-slate-200/70 line-clamp-2 leading-relaxed">
                                    <span className="font-bold text-slate-700">Catatan PIC: </span>
                                    {effectiveNotes}
                                  </p>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Status Lifecycle Indicator & Link Detail Kegiatan */}
                        <div className="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                          <div>{getStatusBadge(job.status)}</div>

                          {meetingHref && (
                            <Link
                              href={meetingHref}
                              onClick={onClose}
                              className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#215865] hover:text-[#31889C] hover:underline transition-colors cursor-pointer"
                              title={`Buka detail kegiatan ${job.meetingNumber || ''}`}
                            >
                              <span>Detail Kegiatan</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-[13px] font-bold text-slate-700">
                    Tidak ada pekerjaan pada filter ini
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {dateFilter !== 'ALL'
                      ? `Tidak ada tindak lanjut untuk ${
                          dateFilter === 'TODAY'
                            ? 'periode Hari Ini'
                            : dateFilter === 'THIS_WEEK'
                            ? 'periode Minggu Ini'
                            : dateFilter === 'THIS_MONTH'
                            ? 'periode Bulan Ini'
                            : 'tanggal yang dipilih'
                        }.`
                      : 'Silakan ubah filter status atau kata kunci pencarian.'}
                  </p>
                  {dateFilter !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setDateFilter('ALL')}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F0F9FA] hover:bg-[#E8F5F7] text-[#215865] border border-[#BCE3EB] rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Tampilkan Semua Waktu ({team.totalJobs})</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DAFTAR KEGIATAN TIM */}
          {activeTab === 'meetings' && (
            <div className="space-y-2.5">
              {filteredMeetings.length > 0 ? (
                filteredMeetings.map((m) => {
                  const meetingDetailHref = `/arsip-kegiatan/${m.id || m.meetingNumber}`;

                  return (
                    <div
                      key={m.id}
                      className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-[#31889C] transition flex items-center justify-between gap-4 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Link
                            href={meetingDetailHref}
                            onClick={onClose}
                            className="text-[11.5px] font-mono font-extrabold text-[#215865] bg-[#F0F9FA] hover:bg-[#E0F3F7] hover:border-[#31889C] px-2 py-0.5 rounded border border-[#BCE3EB] transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title={`Buka detail kegiatan ${m.meetingNumber}`}
                          >
                            <span>{m.meetingNumber}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                          <MeetingProgressBadge progressStatus={(m as any).progressStatus} status={m.status} showSubtitle />
                          <span className="text-[11.5px] text-slate-400">📅 {m.date}</span>
                        </div>

                        <Link
                          href={meetingDetailHref}
                          onClick={onClose}
                          className="font-bold text-[14px] text-slate-900 group-hover:text-[#31889C] hover:underline transition-colors leading-snug block"
                          title="Klik untuk membuka detail kegiatan"
                        >
                          {m.title}
                        </Link>
                      </div>

                      <Link
                        href={meetingDetailHref}
                        onClick={onClose}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#BCE3EB] bg-[#F0F9FA] hover:bg-[#E8F5F7] text-[#215865] text-xs font-bold transition shadow-2xs shrink-0 cursor-pointer"
                        title="Buka detail dan notula kegiatan"
                      >
                        <span>Detail Kegiatan</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-200">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-[13px] font-bold text-slate-700">
                    Tidak ada kegiatan pada periode ini
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {dateFilter !== 'ALL'
                      ? `Belum ada agenda kegiatan yang dijadwalkan pada ${
                          dateFilter === 'TODAY'
                            ? 'Hari Ini'
                            : dateFilter === 'THIS_WEEK'
                            ? 'Minggu Ini'
                            : dateFilter === 'THIS_MONTH'
                            ? 'Bulan Ini'
                            : 'tanggal yang dipilih'
                        }.`
                      : `Seluruh kegiatan yang dibuat untuk ${team.fullName} akan tampil di sini.`}
                  </p>
                  {dateFilter !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setDateFilter('ALL')}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F0F9FA] hover:bg-[#E8F5F7] text-[#215865] border border-[#BCE3EB] rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Tampilkan Semua Kegiatan ({team.meetingCount})</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ANGGOTA & STAF TIM */}
          {activeTab === 'members' && (
            <div className="space-y-2.5">
              {team.members && team.members.length > 0 ? (
                team.members.map((member) => (
                  <div
                    key={member.id}
                    className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#E8F5F7] text-[#215865] font-bold text-xs flex items-center justify-center shrink-0">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[13px] text-slate-900 truncate">
                          {member.name}
                        </p>
                        <p className="text-[11.5px] text-slate-500 truncate">{member.email}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 shrink-0">
                      {member.role === 'SUPER_ADMIN'
                        ? 'Super Admin'
                        : member.role === 'ADMIN'
                        ? 'Admin'
                        : member.role === 'PIMPINAN'
                        ? 'Pimpinan'
                        : 'Staf Pelaksana'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-200">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-[13px] font-bold text-slate-700">Belum ada anggota terdaftar</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Kelola penempatan personil melalui menu Manajemen Pengguna.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Link
              href={`/catat-kegiatan?tim=${team.code}`}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#31889C] hover:bg-[#266F80] text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Catat Kegiatan {team.fullName}</span>
            </Link>
            <Link
              href={`/arsip-kegiatan?tim=${team.code}`}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#31889C]" />
              <span>Lihat Semua Kegiatan Tim</span>
            </Link>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer ml-auto"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
