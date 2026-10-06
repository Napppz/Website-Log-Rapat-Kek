'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Calendar,
  CalendarDays,
  ArrowLeft,
  Users,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  PlusCircle,
  CheckSquare,
  Download,
  Loader2,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from '@/components/providers/toast-provider';
import { BiroCode, Meeting, DashboardMetric, FollowUpStatusMetric, MonthlyActivity } from '@/lib/types';
import { BIRO_LIST } from '@/lib/mock-data';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { ActivityTrendChart } from '@/components/dashboard/activity-trend-chart';
import { FollowUpStatusChart } from '@/components/dashboard/follow-up-status-chart';
import { TeamWorkloadDistribution } from './team-workload-distribution';
import { MeetingTable } from '@/components/meeting/meeting-table';

interface TeamItem {
  id: string;
  code: string;
  name: string;
  description?: string | null;
}

interface ActionItemMini {
  id: string;
  title: string;
  status: string;
  dueDate?: Date | string | null;
  priority?: string | null;
}

interface BiroData {
  id: string;
  code: string;
  name: string;
  shortName: string;
  description?: string | null;
  users: Array<{ id: string; name: string; role: string }>;
  teams: TeamItem[];
  sequence?: { currentNumber: number } | null;
}

interface BiroDashboardClientProps {
  biro: BiroData;
  initialMeetings: Meeting[];
  actionItems: ActionItemMini[];
  isPrivileged: boolean;
  deniedNotice?: boolean;
}

const MONTH_INDEX_MAP: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, Mei: 4, Jun: 5,
  Jul: 6, Agu: 7, Sep: 8, Okt: 9, Nov: 10, Des: 11,
};

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

export function BiroDashboardClient({
  biro,
  initialMeetings,
  actionItems = [],
  isPrivileged,
  deniedNotice = false,
}: BiroDashboardClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [meetingsList, setMeetingsList] = useState<Meeting[]>(initialMeetings);

  useEffect(() => {
    setMeetingsList(initialMeetings.filter((m) => !deletedIds.has(m.id)));
  }, [initialMeetings, deletedIds]);

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);

  const currentUser = session?.user;
  const userName = currentUser?.name || 'Pejabat Biro';
  const userRole = (currentUser?.role as string) || (isPrivileged ? 'ADMIN' : 'STAFF');

  const roleLabelMap: Record<string, { label: string; badgeClass: string }> = {
    SUPER_ADMIN: {
      label: 'Super Admin Dewan',
      badgeClass: 'bg-[#E8F5F7] text-[#31889C] border-[#BCE3EB]',
    },
    ADMIN: {
      label: 'Administrator Biro',
      badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    },
    STAFF: {
      label: 'Staf Pelaksana Teknis',
      badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
    },
  };

  const roleConfig = roleLabelMap[userRole] || roleLabelMap.STAFF;
  const canCreate = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleDownloadReport = async () => {
    try {
      setIsDownloadingReport(true);
      const res = await fetch(`/api/reports/summary/pdf?period=YEAR&biro=${biro.code}`);
      if (!res.ok) {
        throw new Error('Gagal mengunduh ringkasan eksekutif');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Laporan-Eksekutif-Biro-${biro.code}-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      toast.success(`Ringkasan Eksekutif Biro ${biro.code} berhasil diunduh.`);
    } catch (e: any) {
      toast.error(e?.message || 'Terjadi kesalahan saat mengunduh dokumen.');
    } finally {
      setIsDownloadingReport(false);
    }
  };

  // Discover available years from meetings
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([2026, 2027]);
    meetingsList.forEach((m) => {
      const y = new Date(m.date).getFullYear();
      if (!isNaN(y) && y > 2000) yearsSet.add(y);
    });
    return Array.from(yearsSet).sort((a, b) => a - b);
  }, [meetingsList]);

  // Meetings filtered by selected year
  const yearMeetings = useMemo(() => {
    return meetingsList.filter((m) => {
      const d = new Date(m.date);
      return d.getFullYear() === selectedYear;
    });
  }, [meetingsList, selectedYear]);

  // Monthly trend activity for this biro
  const yearMonthlyActivity: MonthlyActivity[] = useMemo(() => {
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const counts = new Array(12).fill(0);

    yearMeetings.forEach((m) => {
      const d = new Date(m.date);
      const mIdx = d.getMonth();
      if (mIdx >= 0 && mIdx < 12) counts[mIdx]++;
    });

    const maxCount = Math.max(...counts, 0);
    const lastActiveIdx = counts.reduce((acc, c, idx) => (c > 0 ? idx : acc), -1);
    const maxMonthIdx = selectedYear === 2026 ? 9 : (lastActiveIdx >= 0 ? Math.max(lastActiveIdx, 8) : 8);

    return monthLabels.slice(0, maxMonthIdx + 1).map((m, idx) => ({
      month: m,
      count: counts[idx],
      isPeak: maxCount > 0 && counts[idx] === maxCount,
    }));
  }, [yearMeetings, selectedYear]);

  const selectedMonthIdx = selectedMonth ? MONTH_INDEX_MAP[selectedMonth] : null;
  const fullMonthName = selectedMonth ? (FULL_MONTH_NAMES[selectedMonth] || selectedMonth) : '';

  // Meetings filtered by selected month
  const monthMeetings = useMemo(() => {
    if (selectedMonthIdx === null) return yearMeetings;
    return yearMeetings.filter((m) => {
      const d = new Date(m.date);
      return d.getMonth() === selectedMonthIdx;
    });
  }, [selectedMonthIdx, yearMeetings]);

  const ytdMeetings = useMemo(() => {
    if (selectedMonthIdx === null) return yearMeetings;
    return yearMeetings.filter((m) => {
      const d = new Date(m.date);
      return d.getMonth() <= selectedMonthIdx;
    });
  }, [selectedMonthIdx, yearMeetings]);

  // Compute 5 interactive metric cards for this biro
  const displayMetrics: DashboardMetric[] = useMemo(() => {
    const now = new Date();
    const totalMonth = monthMeetings.length;
    const approvedMonth = monthMeetings.filter((m) => m.status === 'APPROVED' || m.status === 'FINAL').length;
    const draftMonth = monthMeetings.filter((m) => m.status === 'DRAFT').length;
    const reviewMonth = monthMeetings.filter((m) => m.status === 'REVIEW').length;

    const totalActions = actionItems.length;
    const completedItems = actionItems.filter((a) => a.status === 'COMPLETED').length;
    const inProgressItems = actionItems.filter((a) => a.status === 'IN_PROGRESS').length;
    const pendingItems = actionItems.filter((a) => a.status === 'PENDING').length;
    const activeItems = inProgressItems + pendingItems;

    const overdueCount = actionItems.filter((a) => {
      if (a.status === 'OVERDUE') return true;
      if (a.status !== 'COMPLETED' && a.dueDate) {
        return new Date(a.dueDate).getTime() < now.getTime();
      }
      return false;
    }).length;

    const completionPercent = totalActions > 0 ? Math.round((completedItems / totalActions) * 100) : 100;

    return [
      {
        id: 'total-rapat',
        label: `AGENDA RAPAT ${biro.code}`,
        value: yearMeetings.length,
        unit: 'Rapat',
        changeValue: `${ytdMeetings.length}/${yearMeetings.length || 1}`,
        changeLabel: `s/d ${selectedMonth || 'Tahun'} ${selectedYear}`,
        variant: 'default',
        iconName: 'event_note',
      },
      {
        id: 'rapat-bulan-ini',
        label: `RAPAT BULAN ${fullMonthName ? fullMonthName.toUpperCase() : 'BERJALAN'}`,
        value: totalMonth,
        unit: 'Agenda',
        badgeText: totalMonth > 0 ? `${approvedMonth} Sah` : '0 Agenda',
        badgeSubtext: `${fullMonthName || 'Biro'} ${selectedYear}`,
        variant: 'default',
        iconName: 'calendar_month',
      },
      {
        id: 'tindak-lanjut-aktif',
        label: 'TINDAK LANJUT BIRO',
        value: activeItems,
        unit: 'Komitmen',
        badgeText: `${inProgressItems} Sedang Jalan`,
        badgeSubtext: `${pendingItems} Menunggu`,
        variant: 'default',
        iconName: 'pending_actions',
      },
      {
        id: 'perlu-atensi',
        label: 'PERLU ATENSI (OVERDUE/DRAFT)',
        value: overdueCount + draftMonth,
        unit: 'Item',
        badgeText: overdueCount > 0 ? `${overdueCount} Terlambat` : draftMonth > 0 ? `${draftMonth} Draft` : 'Nihil',
        badgeSubtext: `${biro.code} ${selectedYear}`,
        variant: overdueCount > 0 ? 'danger' : 'default',
        iconName: 'warning',
      },
      {
        id: 'tindak-lanjut-selesai',
        label: 'PENYELESAIAN KOMITMEN',
        value: completedItems,
        unit: 'Tuntas',
        badgeText: `${completionPercent}%`,
        badgeSubtext: 'Tingkat Penyelesaian',
        variant: 'success',
        iconName: 'task_alt',
      },
    ];
  }, [
    biro.code,
    selectedMonth,
    selectedYear,
    monthMeetings,
    ytdMeetings,
    yearMeetings,
    actionItems,
    fullMonthName,
  ]);

  // Compute follow-up status donut data with mutually exclusive categorization
  const followUpData: FollowUpStatusMetric[] = useMemo(() => {
    const now = new Date();
    const total = actionItems.length;

    let completed = 0;
    let overdue = 0;
    let inProgress = 0;
    let pending = 0;

    actionItems.forEach((a) => {
      const isPastDue = a.dueDate && new Date(a.dueDate).getTime() < now.getTime();
      if (a.status === 'COMPLETED') {
        completed++;
      } else if (a.status === 'OVERDUE' || isPastDue) {
        overdue++;
      } else if (a.status === 'IN_PROGRESS') {
        inProgress++;
      } else {
        pending++;
      }
    });

    const rawMetrics = [
      { label: 'Selesai', count: completed, color: '#10B981' },
      { label: 'Sedang Berjalan', count: inProgress, color: '#31889C' },
      { label: 'Belum Dimulai', count: pending, color: '#FFD300' },
      { label: 'Terlambat', count: overdue, color: '#DC2626' },
    ];

    const circumference = 238.7;
    let cumulativeOffset = 0;

    return rawMetrics.map((m) => {
      const percentage = total > 0 ? Math.round((m.count / total) * 100) : 0;
      const dashLength = (percentage / 100) * circumference;
      const dasharray = `${dashLength.toFixed(1)} ${circumference.toFixed(1)}`;
      const dashoffset = `-${cumulativeOffset.toFixed(1)}`;
      cumulativeOffset += dashLength;

      return {
        label: m.label,
        percentage,
        count: m.count,
        color: m.color,
        dasharray,
        dashoffset,
      };
    });
  }, [actionItems]);

  // Team workload items
  const teamItems = useMemo(() => {
    return (biro.teams || []).map((t) => {
      const count = initialMeetings.filter((m) => m.primaryTeamId === t.id).length;
      return {
        id: t.id,
        code: t.code,
        name: t.name,
        meetingCount: count,
      };
    });
  }, [biro.teams, initialMeetings]);

  const meetingStatusBreakdown = useMemo(() => {
    return {
      approved: initialMeetings.filter((m) => m.status === 'APPROVED' || m.status === 'FINAL').length,
      review: initialMeetings.filter((m) => m.status === 'REVIEW').length,
      draft: initialMeetings.filter((m) => m.status === 'DRAFT').length,
    };
  }, [initialMeetings]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. Access Denied Notice Banner */}
      {deniedNotice && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 shadow-xs flex items-start gap-3.5 animate-in fade-in duration-300">
          <div className="w-9 h-9 rounded-lg bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-[14px] font-bold text-amber-900">
              Akses Dibatasi Khusus Unit Kerja Anda
            </h4>
            <p className="text-[12.5px] text-amber-700 mt-0.5 leading-relaxed">
              Anda secara otomatis dialihkan kembali ke <strong>Dashboard {biro.name}</strong>. Akses ke unit kerja biro lain dibatasi khusus untuk Administrator dan Pimpinan Dewan Nasional KEK.
            </p>
          </div>
        </div>
      )}

      {/* 2. Top Navigation & Quick Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {isPrivileged ? (
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#31889C] text-[13px] font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard Utama (Seluruh Biro)</span>
          </Link>
        ) : (
          <div className="inline-flex items-center gap-2 text-[13px] font-bold text-[#31889C]">
            <Sparkles className="w-4 h-4 text-[#F99D1C]" />
            <span>Dashboard Eksekutif Unit Kerja Biro {biro.code}</span>
          </div>
        )}

        {/* Quick Bureau Switcher for Admins */}
        {isPrivileged && (
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs overflow-x-auto">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 shrink-0">
              Pilih Biro:
            </span>
            {BIRO_LIST.map((b) => {
              const isActive = b.code.toUpperCase() === biro.code.toUpperCase();
              return (
                <Link
                  key={b.code}
                  href={`/biro/${b.code.toLowerCase()}`}
                  className={`px-2.5 py-1 rounded-lg text-[12px] font-bold transition-all shrink-0 ${
                    isActive
                      ? 'bg-[#31889C] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-[#F0F9FA] hover:text-[#31889C]'
                  }`}
                >
                  {b.code}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Bureau Welcome & Executive Profile Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-50/70 via-white to-slate-50 text-slate-800 shadow-xs border border-slate-200 p-6 md:p-8">
        {/* Decorative blur backgrounds */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-[#31889C]/5 blur-3xl pointer-events-none" />
        <div className="absolute right-48 -bottom-20 w-64 h-64 rounded-full bg-[#7CC563]/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            {/* Metadata Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border font-bold text-[11px] uppercase tracking-wider ${roleConfig.badgeClass}`}>
                <span className="w-2 h-2 rounded-full bg-current" />
                {roleConfig.label}
              </span>

              <span className="text-slate-300 font-semibold">•</span>

              <span className="inline-flex items-center gap-1.5 text-[#31889C] font-semibold text-[12.5px]">
                <CalendarDays className="w-3.5 h-3.5 text-[#31889C]" />
                {todayFormatted}
              </span>

              <span className="text-slate-300 font-semibold">•</span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F5F7] border border-[#BCE3EB] text-[#215865] font-bold text-[11px] uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-[#31889C]" />
                Unit: Biro {biro.code}
              </span>
            </div>

            {/* Personalized Welcome Heading */}
            <h1 className="text-[24px] md:text-[28px] text-slate-900 font-bold tracking-tight">
              Selamat Datang di Dashboard {biro.name}, {userName}!
            </h1>

            {/* Subtitle / Description */}
            <p className="text-[13.5px] text-slate-600 max-w-3xl leading-relaxed">
              {biro.description || 'Pusat pemantauan agenda rapat koordinasi resmi, risalah keputusan sidang, serta realisasi tindak lanjut komitmen penugasan unit kerja Sekretariat Dewan Nasional Kawasan Ekonomi Khusus.'}
            </p>

            {/* Quick stats strip */}
            <div className="pt-2 flex flex-wrap items-center gap-4 text-[12px] text-slate-500">
              <span className="flex items-center gap-1 font-medium">
                <Users className="w-3.5 h-3.5 text-[#31889C]" />
                <strong className="text-slate-700">{biro.users.length}</strong> Personel Terdaftar
              </span>
              <span>•</span>
              <span className="font-medium">
                Registrasi Surat Terakhir:{' '}
                <strong className="text-[#215865]">
                  {biro.sequence
                    ? `${biro.code}-${String(biro.sequence.currentNumber).padStart(3, '0')}`
                    : `${biro.code}-000`}
                </strong>
              </span>
              <span>•</span>
              <span className="font-medium">
                Total Rapat Diselenggarakan:{' '}
                <strong className="text-[#31889C]">{initialMeetings.length} Agenda</strong>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 self-start lg:self-center min-w-[200px]">
            {canCreate && (
              <Link
                href={`/buat-rapat?biro=${biro.code}`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#31889C] text-white hover:bg-[#266F80] transition-all shadow-xs font-semibold text-[12.5px] cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Jadwalkan Rapat</span>
              </Link>
            )}

            <Link
              href={`/tindak-lanjut?biro=${biro.code}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all shadow-xs font-semibold text-[12.5px] cursor-pointer"
            >
              <CheckSquare className="w-4 h-4 text-[#31889C]" />
              <span>Matriks Tindak Lanjut</span>
            </Link>

            <button
              type="button"
              onClick={handleDownloadReport}
              disabled={isDownloadingReport}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#F0F9FA] border border-[#BCE3EB] text-[#215865] hover:bg-[#E8F5F7] transition-all shadow-xs font-semibold text-[12px] cursor-pointer disabled:opacity-50"
            >
              {isDownloadingReport ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-[#31889C]" />
              )}
              <span>{isDownloadingReport ? 'Membuat PDF...' : 'Unduh Laporan Eksekutif'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Top Metric Cards (Sinkron dengan Filter Bulan & Tahun) */}
      <StatsOverview
        metrics={displayMetrics}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onResetMonth={() => setSelectedMonth(null)}
      />

      {/* 5. Analytics Charts Grid (Grafik Rapat Bulanan + Donut Status + Beban Tim) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <ActivityTrendChart
          data={yearMonthlyActivity}
          selectedMonth={selectedMonth}
          onMonthSelect={setSelectedMonth}
          selectedYear={selectedYear}
          availableYears={availableYears}
          onYearChange={(newYear) => {
            setSelectedYear(newYear);
            setSelectedMonth(null);
          }}
        />

        <FollowUpStatusChart
          followUpData={followUpData}
          totalResolutions={actionItems.length}
          onManageMatrixClick={() => router.push(`/tindak-lanjut?biro=${encodeURIComponent(biro.code)}`)}
        />

        <TeamWorkloadDistribution
          biroShortName={biro.shortName}
          teams={teamItems}
          totalMeetings={initialMeetings.length}
          meetingStatusBreakdown={meetingStatusBreakdown}
        />
      </div>

      {/* 6. Daftar Rapat & Risalah Khusus Biro */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-[18px] font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#31889C]" />
              Agenda &amp; Risalah Rapat {biro.name}
            </h2>
            <p className="text-[12.5px] text-slate-500">
              Daftar seluruh agenda persidangan yang diselenggarakan di bawah koordinasi {biro.shortName}
            </p>
          </div>

          <Link
            href={`/tindak-lanjut?biro=${encodeURIComponent(biro.code)}`}
            className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#31889C] hover:text-[#215865] hover:underline shrink-0"
          >
            <span>Matriks Tindak Lanjut {biro.code}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <MeetingTable
          filterBiro={biro.code as BiroCode}
          initialMeetings={yearMeetings}
          filterMonth={selectedMonth}
          onViewAllMeetings={() => router.push(`/semua-rapat?biro=${biro.code.toLowerCase()}`)}
          onMeetingDeleted={(deletedId) => {
            setDeletedIds((prev) => new Set(prev).add(deletedId));
            setMeetingsList((prev) => prev.filter((m) => m.id !== deletedId));
          }}
        />
      </div>
    </div>
  );
}
