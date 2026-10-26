'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { WelcomeBanner } from '@/components/dashboard/welcome-banner';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { ActivityTrendChart } from '@/components/dashboard/activity-trend-chart';
import { BureauDistribution } from '@/components/dashboard/bureau-distribution';
import { TeamWorkloadGrid } from '@/components/dashboard/team-workload-grid';
import { TeamDetailModal } from '@/components/dashboard/team-detail-modal';
import { MeetingTable } from '@/components/meeting/meeting-table';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Meeting, DashboardMetric, BureauWorkload, FollowUpStatusMetric, MonthlyActivity, TeamWorkloadMetric } from '@/lib/types';
import { normalizeProgressStatus, mapStatusToProgress } from '@/lib/meeting-status';
import { isMeetingMatchTeam } from '@/lib/team-utils';

interface DashboardClientProps {
  initialMeetings: Meeting[];
  metrics?: DashboardMetric[];
  workload?: BureauWorkload[];
  followUpMetrics?: FollowUpStatusMetric[];
  monthlyActivity?: MonthlyActivity[];
  totalResolutions?: number;
  teamWorkload?: TeamWorkloadMetric[];
  userRole?: string;
  userTeamCode?: string | null;
  userTeamName?: string | null;
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

function isMatchTeam(m: Meeting, code: string): boolean {
  return isMeetingMatchTeam(m, code);
}

export function DashboardClient({
  initialMeetings,
  metrics,
  workload,
  followUpMetrics,
  monthlyActivity,
  totalResolutions,
  teamWorkload: initialTeamWorkload,
  userRole: initialUserRole,
  userTeamCode: initialUserTeamCode,
  userTeamName: initialUserTeamName,
}: DashboardClientProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const effectiveUserRole = session?.user?.role || initialUserRole || 'STAFF';
  const effectiveTeamCode = session?.user?.teamCode ?? initialUserTeamCode ?? null;
  const isStaff = effectiveUserRole === 'STAFF';

  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [meetingsList, setMeetingsList] = useState<Meeting[]>(initialMeetings);

  const [teamWorkload, setTeamWorkload] = useState<TeamWorkloadMetric[]>(
    initialTeamWorkload || []
  );
  const [selectedTeamForModal, setSelectedTeamForModal] = useState<TeamWorkloadMetric | null>(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  useEffect(() => {
    if (initialTeamWorkload && initialTeamWorkload.length > 0) {
      setTeamWorkload(initialTeamWorkload);
      return;
    }

    let isMounted = true;
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        if (
          isMounted &&
          data?.teamWorkload &&
          Array.isArray(data.teamWorkload) &&
          data.teamWorkload.length > 0
        ) {
          setTeamWorkload(data.teamWorkload);
        }
      })
      .catch((e) => console.warn('Could not load team workload:', e));

    return () => {
      isMounted = false;
    };
  }, [initialTeamWorkload]);

  const CANONICAL_CODES = ['INV', 'KS', 'KOM', 'SI', 'HKM', 'UMUM'];
  const sanitizedTeamWorkload = useMemo(() => {
    if (!teamWorkload || teamWorkload.length === 0) return [];
    return [...teamWorkload]
      .filter((t) => (t.code || '').toUpperCase() !== 'POKJA' && !(t.name || '').toLowerCase().includes('pokja'))
      .sort((a, b) => {
        const idxA = CANONICAL_CODES.indexOf(a.code.toUpperCase());
        const idxB = CANONICAL_CODES.indexOf(b.code.toUpperCase());
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [teamWorkload]);

  // Khusus staf: temukan data beban kerja dan pekerjaan tim yang sesuai
  const userTeamWorkload = useMemo(() => {
    if (!isStaff || !effectiveTeamCode) return null;
    return (
      sanitizedTeamWorkload.find(
        (t) => t.code.toUpperCase() === effectiveTeamCode.toUpperCase()
      ) || null
    );
  }, [isStaff, effectiveTeamCode, sanitizedTeamWorkload]);

  const handleOpenTeamModal = (team: TeamWorkloadMetric) => {
    setSelectedTeamForModal(team);
    setIsTeamModalOpen(true);
  };

  useEffect(() => {
    setMeetingsList(initialMeetings.filter((m) => !deletedIds.has(m.id)));
  }, [initialMeetings, deletedIds]);

  // Koleksi rapat yang relevan: seluruh kegiatan dapat dilihat oleh semua staf dan tim kerja
  const relevantMeetings = meetingsList;

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // Dynamically discover all years present in relevant meetings (guaranteeing at least 2026 and 2027)
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([2026, 2027]);
    relevantMeetings.forEach((m) => {
      const y = new Date(m.date).getFullYear();
      if (!isNaN(y) && y > 2000) yearsSet.add(y);
    });
    return Array.from(yearsSet).sort((a, b) => a - b);
  }, [relevantMeetings]);

  // Meetings filtered by the selected year
  const yearMeetings = useMemo(() => {
    return relevantMeetings.filter((m) => {
      const d = new Date(m.date);
      return d.getFullYear() === selectedYear;
    });
  }, [relevantMeetings, selectedYear]);

  // Compute monthly activity trend dynamically for the selected year - akumulasi jumlah kegiatan dari SEMUA tim
  const yearMonthlyActivity: MonthlyActivity[] = useMemo(() => {
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const counts = new Array(12).fill(0);
    const monthTeamsMap: Record<number, Record<string, { name: string; count: number }>> = {};

    yearMeetings.forEach((m) => {
      const d = new Date(m.date);
      const mIdx = d.getMonth();
      if (mIdx >= 0 && mIdx < 12) {
        counts[mIdx]++;

        // Catat rincian tim kerja
        const tCode = m.primaryTeamCode || (m.primaryTeamId ? 'TIM' : 'UMUM');
        const tName = m.primaryTeamName || 'Lintas / Umum';
        if (!monthTeamsMap[mIdx]) monthTeamsMap[mIdx] = {};
        if (!monthTeamsMap[mIdx][tCode]) {
          monthTeamsMap[mIdx][tCode] = { name: tName, count: 0 };
        }
        monthTeamsMap[mIdx][tCode].count++;
      }
    });

    const maxCount = Math.max(...counts, 0);

    return monthLabels.map((m, idx) => {
      const teamBreakdown = monthTeamsMap[idx]
        ? Object.entries(monthTeamsMap[idx])
            .map(([code, val]) => ({
              code,
              name: val.name,
              count: val.count,
            }))
            .sort((a, b) => b.count - a.count)
        : [];

      return {
        month: m,
        count: counts[idx],
        isPeak: maxCount > 0 && counts[idx] === maxCount,
        teamBreakdown,
      };
    });
  }, [yearMeetings]);

  const selectedMonthIdx = selectedMonth ? MONTH_INDEX_MAP[selectedMonth] : null;
  const fullMonthName = selectedMonth ? (FULL_MONTH_NAMES[selectedMonth] || selectedMonth) : '';

  // Meetings filtered by the selected month within the selected year
  const monthMeetings = useMemo(() => {
    if (selectedMonthIdx === null) return yearMeetings;
    return yearMeetings.filter((m) => {
      const d = new Date(m.date);
      return d.getMonth() === selectedMonthIdx;
    });
  }, [selectedMonthIdx, yearMeetings]);

  // Cumulative meetings up to this month (YTD) within the selected year
  const ytdMeetings = useMemo(() => {
    if (selectedMonthIdx === null) return yearMeetings;
    return yearMeetings.filter((m) => {
      const d = new Date(m.date);
      return d.getMonth() <= selectedMonthIdx;
    });
  }, [selectedMonthIdx, yearMeetings]);

  // Dynamically compute the 5 cards shown in the user's photo
  const displayMetrics: DashboardMetric[] = useMemo(() => {
    const totalMonth = monthMeetings.length;
    const startMonth = monthMeetings.filter(
      (m) => normalizeProgressStatus(m.progressStatus || mapStatusToProgress(m.status)) === 'Belum Dimulai'
    ).length;
    const onProgressMonth = monthMeetings.filter(
      (m) => normalizeProgressStatus(m.progressStatus || mapStatusToProgress(m.status)) === 'Dalam Proses'
    ).length;
    const finishMonth = monthMeetings.filter(
      (m) => normalizeProgressStatus(m.progressStatus || mapStatusToProgress(m.status)) === 'Selesai'
    ).length;

    const totalItems = monthMeetings.reduce((sum, m) => sum + (m.actionItems?.total || 0), 0);
    const completedItems = monthMeetings.reduce((sum, m) => sum + (m.actionItems?.completed || 0), 0);
    const inProgressItems = monthMeetings.reduce((sum, m) => sum + (m.actionItems?.inProgress || 0), 0);
    const pendingItems = monthMeetings.reduce((sum, m) => sum + (m.actionItems?.pending || 0), 0);
    const activeItems = inProgressItems + pendingItems;

    // Untuk staf pada mode tahunan (tanpa filter bulan), gunakan data real pekerjaan tim dari workload
    const activeItemsValue = isStaff && userTeamWorkload && !selectedMonth
      ? userTeamWorkload.inProgressJobs + userTeamWorkload.pendingJobs
      : activeItems;
    const completedItemsValue = isStaff && userTeamWorkload && !selectedMonth
      ? userTeamWorkload.completedJobs
      : completedItems;
    const inProgressItemsValue = isStaff && userTeamWorkload && !selectedMonth
      ? userTeamWorkload.inProgressJobs
      : inProgressItems;
    const pendingItemsValue = isStaff && userTeamWorkload && !selectedMonth
      ? userTeamWorkload.pendingJobs
      : pendingItems;

    const overdueCount = onProgressMonth;
    const completionPercent = totalItems > 0
      ? Math.round((completedItems / totalItems) * 100)
      : totalMonth > 0
      ? Math.round((finishMonth / totalMonth) * 100)
      : 0;

    if (!selectedMonth) {
      // If no month is selected, compute the overall metrics for the selected year
      const totalYearMeetings = yearMeetings.length;
      const yearStart = yearMeetings.filter((m) => normalizeProgressStatus(m.progressStatus || mapStatusToProgress(m.status)) === 'Belum Dimulai').length;
      const yearOnProgress = yearMeetings.filter((m) => normalizeProgressStatus(m.progressStatus || mapStatusToProgress(m.status)) === 'Dalam Proses').length;
      const yearFinish = yearMeetings.filter((m) => normalizeProgressStatus(m.progressStatus || mapStatusToProgress(m.status)) === 'Selesai').length;

      return [
        {
          id: 'total-rapat',
          label: `TOTAL KEGIATAN (YTD ${selectedYear})`,
          value: totalYearMeetings,
          unit: 'Kegiatan',
          changeValue: totalYearMeetings > 0 ? '+100%' : '0%',
          changeLabel: isStaff && userTeamWorkload ? `Tim ${userTeamWorkload.name}` : `Tahun ${selectedYear}`,
          variant: 'default',
          iconName: 'event_note',
        },
        {
          id: 'rapat-bulan-ini',
          label: `STATUS PEMANTAUAN (${selectedYear})`,
          value: totalYearMeetings,
          unit: 'Agenda',
          badgeText: `${yearFinish} Selesai • ${yearOnProgress} Dalam Proses`,
          badgeSubtext: `${yearStart} Belum Dimulai`,
          variant: 'default',
          iconName: 'calendar_month',
        },
        {
          id: 'tindak-lanjut-aktif',
          label: 'TINDAK LANJUT AKTIF',
          value: activeItemsValue,
          unit: 'Item',
          badgeText: `${inProgressItemsValue} Sedang Jalan`,
          badgeSubtext: `${pendingItemsValue} Menunggu`,
          variant: 'default',
          iconName: 'pending_actions',
        },
        {
          id: 'perlu-atensi',
          label: 'MONITORING PROSES KEGIATAN',
          value: yearOnProgress + yearStart,
          unit: 'Kegiatan',
          badgeText: `${yearOnProgress} Dalam Proses • ${yearStart} Belum Dimulai`,
          badgeSubtext: isStaff && userTeamWorkload ? `Tim ${userTeamWorkload.name}` : `Tahun ${selectedYear}`,
          variant: yearOnProgress > 0 ? 'default' : 'default',
          iconName: 'warning',
        },
        {
          id: 'tindak-lanjut-selesai',
          label: 'TINDAK LANJUT SELESAI',
          value: completedItemsValue,
          unit: 'Selesai',
          badgeText: `${completedItemsValue} Selesai`,
          badgeSubtext: `${inProgressItemsValue} Dalam Proses • ${pendingItemsValue} Belum Dimulai`,
          variant: 'success',
          iconName: 'task_alt',
        },
      ];
    }

    return [
      {
        id: 'total-rapat',
        label: `TOTAL KEGIATAN (YTD s/d ${selectedMonth})`,
        value: ytdMeetings.length,
        unit: 'Kegiatan',
        changeValue: `${ytdMeetings.length}/${yearMeetings.length || 1}`,
        changeLabel: isStaff && userTeamWorkload ? `Tim ${userTeamWorkload.name}` : `s/d ${selectedMonth} ${selectedYear}`,
        variant: 'default',
        iconName: 'event_note',
      },
      {
        id: 'rapat-bulan-ini',
        label: `KEGIATAN BULAN ${fullMonthName.toUpperCase()}`,
        value: totalMonth,
        unit: 'Agenda',
        badgeText: totalMonth > 0 ? `${finishMonth} Selesai • ${onProgressMonth} Dalam Proses` : '0 Agenda',
        badgeSubtext: `${startMonth} Belum Dimulai (${fullMonthName})`,
        variant: 'default',
        iconName: 'calendar_month',
      },
      {
        id: 'tindak-lanjut-aktif',
        label: 'TINDAK LANJUT AKTIF',
        value: activeItems,
        unit: 'Item',
        badgeText: `${inProgressItems} Sedang Jalan`,
        badgeSubtext: `${pendingItems} Menunggu`,
        variant: 'default',
        iconName: 'pending_actions',
      },
      {
        id: 'perlu-atensi',
        label: 'MONITORING PROSES KEGIATAN',
        value: onProgressMonth + startMonth,
        unit: 'Kegiatan',
        badgeText: `${onProgressMonth} Dalam Proses • ${startMonth} Belum Dimulai`,
        badgeSubtext: `${fullMonthName} ${selectedYear}`,
        variant: onProgressMonth > 0 ? 'default' : 'default',
        iconName: 'warning',
      },
      {
        id: 'tindak-lanjut-selesai',
        label: 'TINDAK LANJUT SELESAI',
        value: completedItems,
        unit: 'Selesai',
        badgeText: `${completedItems} Selesai`,
        badgeSubtext: `${inProgressItems} Dalam Proses • ${pendingItems} Belum Dimulai`,
        variant: 'success',
        iconName: 'task_alt',
      },
    ];
  }, [
    selectedMonth,
    selectedYear,
    monthMeetings,
    ytdMeetings,
    yearMeetings,
    fullMonthName,
    isStaff,
    userTeamWorkload,
  ]);

function computeDonutMetrics(
  completed: number,
  inProgress: number,
  pending: number,
  overdue = 0
): FollowUpStatusMetric[] {
  const total = completed + inProgress + pending + overdue;
  const circ = 238.76;
  if (total === 0) {
    return [
      {
        label: 'Belum Ada Pekerjaan',
        percentage: 0,
        count: 0,
        color: '#94A3B8',
        dasharray: `0 ${circ}`,
        dashoffset: '0',
      },
    ];
  }
  const pCompleted = Math.round((completed / total) * 100);
  const pInProgress = Math.round((inProgress / total) * 100);
  const pOverdue = Math.round((overdue / total) * 100);
  const pPending = Math.max(0, 100 - pCompleted - pInProgress - pOverdue);

  const lenComp = (pCompleted / 100) * circ;
  const lenInProg = (pInProgress / 100) * circ;
  const lenPend = (pPending / 100) * circ;
  const lenOver = (pOverdue / 100) * circ;

  const result: FollowUpStatusMetric[] = [
    {
      label: 'Selesai',
      percentage: pCompleted,
      count: completed,
      color: '#7CC563',
      dasharray: `${lenComp.toFixed(1)} ${circ}`,
      dashoffset: '0',
    },
    {
      label: 'Sedang Berjalan',
      percentage: pInProgress,
      count: inProgress,
      color: '#31889C',
      dasharray: `${lenInProg.toFixed(1)} ${circ}`,
      dashoffset: `-${lenComp.toFixed(1)}`,
    },
    {
      label: 'Belum Dimulai',
      percentage: pPending,
      count: pending,
      color: '#FFD300',
      borderColor: '#FFD300',
      dasharray: `${lenPend.toFixed(1)} ${circ}`,
      dashoffset: `-${(lenComp + lenInProg).toFixed(1)}`,
    },
  ];

  if (overdue > 0) {
    result.push({
      label: 'Terlambat',
      percentage: pOverdue,
      count: overdue,
      color: '#DC2626',
      dasharray: `${lenOver.toFixed(1)} ${circ}`,
      dashoffset: `-${(lenComp + lenInProg + lenPend).toFixed(1)}`,
    });
  }

  return result;
}

  // Metrik tindak lanjut reaktif per tim untuk grafik donut
  const displayFollowUpMetrics: FollowUpStatusMetric[] = useMemo(() => {
    if (isStaff && userTeamWorkload) {
      return computeDonutMetrics(
        userTeamWorkload.completedJobs,
        userTeamWorkload.inProgressJobs,
        userTeamWorkload.pendingJobs,
        userTeamWorkload.overdueJobs || 0
      );
    }
    return followUpMetrics || [];
  }, [isStaff, userTeamWorkload, followUpMetrics]);

  const displayTotalResolutions = isStaff && userTeamWorkload
    ? userTeamWorkload.totalJobs
    : totalResolutions;

  return (
    <div className="flex flex-col w-full gap-6">
      {/* 1. Executive Welcome Banner */}
      <WelcomeBanner
        onScheduleMeeting={() => router.push('/catat-kegiatan')}
      />

      {/* 3. Executive Tim Kerja KEK (Investasi, Kerja Sama, Komunikasi, dll) - Tampil untuk Semua Tim Kerja */}
      <TeamWorkloadGrid
        teams={sanitizedTeamWorkload}
        onTeamClick={handleOpenTeamModal}
      />

      {/* 4. Analytics Grid (Monthly Trend + Status Donut + Tim Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
        <BureauDistribution
          meetings={selectedMonth ? monthMeetings : yearMeetings}
          onCategoryClick={(categoryKey) => router.push(`/arsip-kegiatan?kategori=${categoryKey}`)}
          workload={workload}
          teamWorkload={sanitizedTeamWorkload}
          onTeamClick={handleOpenTeamModal}
          onBiroClick={(code) => router.push(`/arsip-kegiatan?tim=${code}`)}
        />
      </div>

      {/* 5. Recent Meetings Table (Terbaru ke Terlama) - Sinkron dengan Tahun & Bulan Terpilih */}
      <MeetingTable
        initialMeetings={yearMeetings}
        filterMonth={selectedMonth}
        onViewAllMeetings={() => router.push('/arsip-kegiatan')}
        onMeetingDeleted={(deletedId) => {
          setDeletedIds((prev) => new Set(prev).add(deletedId));
          setMeetingsList((prev) => prev.filter((m) => m.id !== deletedId));
        }}
      />

      {/* Interactive Modal Detail Tim (Status Pekerjaan: Selesai/Berjalan/Dalam Proses, Rapat & Staf) */}
      <TeamDetailModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        team={selectedTeamForModal}
      />
    </div>
  );
}

