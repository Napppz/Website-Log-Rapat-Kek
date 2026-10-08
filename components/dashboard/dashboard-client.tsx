'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { WelcomeBanner } from '@/components/dashboard/welcome-banner';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { ActivityTrendChart } from '@/components/dashboard/activity-trend-chart';
import { FollowUpStatusChart } from '@/components/dashboard/follow-up-status-chart';
import { BureauDistribution } from '@/components/dashboard/bureau-distribution';
import { TeamWorkloadGrid } from '@/components/dashboard/team-workload-grid';
import { TeamDetailModal } from '@/components/dashboard/team-detail-modal';
import { MeetingTable } from '@/components/meeting/meeting-table';
import { useRouter } from 'next/navigation';
import { Meeting, DashboardMetric, BureauWorkload, FollowUpStatusMetric, MonthlyActivity, TeamWorkloadMetric } from '@/lib/types';
import { normalizeProgressStatus, mapStatusToProgress } from '@/lib/meeting-status';

interface DashboardClientProps {
  initialMeetings: Meeting[];
  metrics?: DashboardMetric[];
  workload?: BureauWorkload[];
  followUpMetrics?: FollowUpStatusMetric[];
  monthlyActivity?: MonthlyActivity[];
  totalResolutions?: number;
  teamWorkload?: TeamWorkloadMetric[];
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

export function DashboardClient({
  initialMeetings,
  metrics,
  workload,
  followUpMetrics,
  monthlyActivity,
  totalResolutions,
  teamWorkload: initialTeamWorkload,
}: DashboardClientProps) {
  const router = useRouter();
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

  const CANONICAL_CODES = ['INV', 'KS', 'KOM'];
  const sanitizedTeamWorkload = useMemo(() => {
    return (teamWorkload || [])
      .filter((t) => CANONICAL_CODES.includes(t.code.toUpperCase()))
      .sort(
        (a, b) =>
          CANONICAL_CODES.indexOf(a.code.toUpperCase()) -
          CANONICAL_CODES.indexOf(b.code.toUpperCase())
      );
  }, [teamWorkload]);

  const handleOpenTeamModal = (team: TeamWorkloadMetric) => {
    setSelectedTeamForModal(team);
    setIsTeamModalOpen(true);
  };

  useEffect(() => {
    setMeetingsList(initialMeetings.filter((m) => !deletedIds.has(m.id)));
  }, [initialMeetings, deletedIds]);

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // Dynamically discover all years present in meetings (guaranteeing at least 2026 and 2027)
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([2026, 2027]);
    meetingsList.forEach((m) => {
      const y = new Date(m.date).getFullYear();
      if (!isNaN(y) && y > 2000) yearsSet.add(y);
    });
    return Array.from(yearsSet).sort((a, b) => a - b);
  }, [meetingsList]);

  // Meetings filtered by the selected year
  const yearMeetings = useMemo(() => {
    return meetingsList.filter((m) => {
      const d = new Date(m.date);
      return d.getFullYear() === selectedYear;
    });
  }, [meetingsList, selectedYear]);

  // Compute monthly activity trend dynamically for the selected year
  const yearMonthlyActivity: MonthlyActivity[] = useMemo(() => {
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const counts = new Array(12).fill(0);

    yearMeetings.forEach((m) => {
      const d = new Date(m.date);
      const mIdx = d.getMonth();
      if (mIdx >= 0 && mIdx < 12) counts[mIdx]++;
    });

    const maxCount = Math.max(...counts, 0);
    // Display up to current month (min Sep) for current year, or up to the last month with data / full year
    const lastActiveIdx = counts.reduce((acc, c, idx) => (c > 0 ? idx : acc), -1);
    const maxMonthIdx = selectedYear === 2026 ? 8 : (lastActiveIdx >= 0 ? Math.max(lastActiveIdx, 8) : 8);

    return monthLabels.slice(0, maxMonthIdx + 1).map((m, idx) => ({
      month: m,
      count: counts[idx],
      isPeak: maxCount > 0 && counts[idx] === maxCount,
    }));
  }, [yearMeetings, selectedYear]);

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
      (m) => normalizeProgressStatus(m.progressStatus || mapStatusToProgress(m.status)) === 'Start'
    ).length;
    const onProgressMonth = monthMeetings.filter(
      (m) => normalizeProgressStatus(m.progressStatus || mapStatusToProgress(m.status)) === 'On Progres'
    ).length;
    const finishMonth = monthMeetings.filter(
      (m) => normalizeProgressStatus(m.progressStatus || mapStatusToProgress(m.status)) === 'Finish'
    ).length;

    const totalItems = monthMeetings.reduce((sum, m) => sum + (m.actionItems?.total || 0), 0);
    const completedItems = monthMeetings.reduce((sum, m) => sum + (m.actionItems?.completed || 0), 0);
    const inProgressItems = monthMeetings.reduce((sum, m) => sum + (m.actionItems?.inProgress || 0), 0);
    const pendingItems = monthMeetings.reduce((sum, m) => sum + (m.actionItems?.pending || 0), 0);
    const activeItems = inProgressItems + pendingItems;

    const overdueCount = onProgressMonth;
    const completionPercent = totalItems > 0
      ? Math.round((completedItems / totalItems) * 100)
      : totalMonth > 0
      ? Math.round((finishMonth / totalMonth) * 100)
      : 0;

    if (!selectedMonth) {
      // If no month is selected, compute the overall metrics for the selected year
      const totalYearMeetings = yearMeetings.length;
      const yearStart = yearMeetings.filter((m) => normalizeProgressStatus(m.progressStatus || mapStatusToProgress(m.status)) === 'Start').length;
      const yearOnProgress = yearMeetings.filter((m) => normalizeProgressStatus(m.progressStatus || mapStatusToProgress(m.status)) === 'On Progres').length;
      const yearFinish = yearMeetings.filter((m) => normalizeProgressStatus(m.progressStatus || mapStatusToProgress(m.status)) === 'Finish').length;

      return [
        {
          id: 'total-rapat',
          label: `TOTAL RAPAT (YTD ${selectedYear})`,
          value: totalYearMeetings,
          unit: 'Rapat',
          changeValue: totalYearMeetings > 0 ? '+100%' : '0%',
          changeLabel: `Tahun ${selectedYear}`,
          variant: 'default',
          iconName: 'event_note',
        },
        {
          id: 'rapat-bulan-ini',
          label: `STATUS PEMANTAUAN (${selectedYear})`,
          value: totalYearMeetings,
          unit: 'Agenda',
          badgeText: `${yearFinish} Finish • ${yearOnProgress} On Progres`,
          badgeSubtext: `${yearStart} Start (Persiapan)`,
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
          label: 'MONITORING PROSES RAPAT',
          value: yearOnProgress + yearStart,
          unit: 'Rapat',
          badgeText: `${yearOnProgress} Dalam Proses • ${yearStart} Belum Dimulai`,
          badgeSubtext: `Tahun ${selectedYear}`,
          variant: yearOnProgress > 0 ? 'default' : 'default',
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
    }

    return [
      {
        id: 'total-rapat',
        label: `TOTAL RAPAT (YTD s/d ${selectedMonth})`,
        value: ytdMeetings.length,
        unit: 'Rapat',
        changeValue: `${ytdMeetings.length}/${yearMeetings.length || 1}`,
        changeLabel: `s/d ${selectedMonth} ${selectedYear}`,
        variant: 'default',
        iconName: 'event_note',
      },
      {
        id: 'rapat-bulan-ini',
        label: `RAPAT BULAN ${fullMonthName.toUpperCase()}`,
        value: totalMonth,
        unit: 'Agenda',
        badgeText: totalMonth > 0 ? `${finishMonth} Finish • ${onProgressMonth} On Progres` : '0 Agenda',
        badgeSubtext: `${startMonth} Start (${fullMonthName})`,
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
        label: 'MONITORING PROSES RAPAT',
        value: onProgressMonth + startMonth,
        unit: 'Rapat',
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
  ]);

  return (
    <div className="flex flex-col w-full gap-6">
      {/* 1. Executive Welcome Banner */}
      <WelcomeBanner
        onScheduleMeeting={() => router.push('/buat-rapat')}
      />

      {/* 2. Top Metric Cards - Dinamis terhubung dengan Filter Bulan & Tahun */}
      <StatsOverview
        metrics={displayMetrics}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onResetMonth={() => setSelectedMonth(null)}
      />

      {/* 3. Executive 3 Tim Kerja KEK (Investasi, Kerja Sama, Komunikasi) - Super Admin */}
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
        <FollowUpStatusChart
          followUpData={followUpMetrics}
          totalResolutions={totalResolutions}
          onManageMatrixClick={() => router.push('/tindak-lanjut')}
        />
        <BureauDistribution
          workload={workload}
          teamWorkload={sanitizedTeamWorkload}
          onTeamClick={handleOpenTeamModal}
          onBiroClick={(code) => router.push(`/semua-rapat?tim=${code}`)}
        />
      </div>

      {/* 5. Recent Meetings Table (Terbaru ke Terlama) - Sinkron dengan Tahun & Bulan Terpilih */}
      <MeetingTable
        initialMeetings={yearMeetings}
        filterMonth={selectedMonth}
        onViewAllMeetings={() => router.push('/semua-rapat')}
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

