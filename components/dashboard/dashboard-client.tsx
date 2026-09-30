'use client';

import React, { useState, useMemo } from 'react';
import { WelcomeBanner } from '@/components/dashboard/welcome-banner';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { ActivityTrendChart } from '@/components/dashboard/activity-trend-chart';
import { FollowUpStatusChart } from '@/components/dashboard/follow-up-status-chart';
import { BureauDistribution } from '@/components/dashboard/bureau-distribution';
import { MeetingTable } from '@/components/meeting/meeting-table';
import { useRouter } from 'next/navigation';
import { Meeting, DashboardMetric, BureauWorkload, FollowUpStatusMetric, MonthlyActivity } from '@/lib/types';

interface DashboardClientProps {
  initialMeetings: Meeting[];
  metrics?: DashboardMetric[];
  workload?: BureauWorkload[];
  followUpMetrics?: FollowUpStatusMetric[];
  monthlyActivity?: MonthlyActivity[];
  totalResolutions?: number;
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
}: DashboardClientProps) {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // Dynamically discover all years present in meetings (guaranteeing at least 2026 and 2027)
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([2026, 2027]);
    initialMeetings.forEach((m) => {
      const y = new Date(m.date).getFullYear();
      if (!isNaN(y) && y > 2000) yearsSet.add(y);
    });
    return Array.from(yearsSet).sort((a, b) => a - b);
  }, [initialMeetings]);

  // Meetings filtered by the selected year
  const yearMeetings = useMemo(() => {
    return initialMeetings.filter((m) => {
      const d = new Date(m.date);
      return d.getFullYear() === selectedYear;
    });
  }, [initialMeetings, selectedYear]);

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
    const approvedMonth = monthMeetings.filter((m) => m.status === 'APPROVED').length;
    const finalMonth = monthMeetings.filter((m) => m.status === 'FINAL').length;
    const reviewMonth = monthMeetings.filter((m) => m.status === 'REVIEW').length;
    const draftMonth = monthMeetings.filter((m) => m.status === 'DRAFT').length;

    const totalItems = monthMeetings.reduce((sum, m) => sum + (m.actionItems?.total || 0), 0);
    const completedItems = monthMeetings.reduce((sum, m) => sum + (m.actionItems?.completed || 0), 0);
    const inProgressItems = monthMeetings.reduce((sum, m) => sum + (m.actionItems?.inProgress || 0), 0);
    const pendingItems = monthMeetings.reduce((sum, m) => sum + (m.actionItems?.pending || 0), 0);
    const activeItems = inProgressItems + pendingItems;

    const overdueCount = draftMonth;
    const completionPercent = totalItems > 0
      ? Math.round((completedItems / totalItems) * 100)
      : totalMonth > 0
      ? Math.round(((approvedMonth + finalMonth) / totalMonth) * 100)
      : 0;

    if (!selectedMonth) {
      // If no month is selected, compute the overall metrics for the selected year
      const totalYearMeetings = yearMeetings.length;
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
          label: `AGENDA SIDANG (${selectedYear})`,
          value: totalYearMeetings,
          unit: 'Agenda',
          badgeText: `${approvedMonth + finalMonth} Disetujui/Sah`,
          badgeSubtext: `Tahun ${selectedYear}`,
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
          label: 'PERLU ATENSI (OVERDUE / DRAFT)',
          value: overdueCount,
          unit: 'Item',
          badgeText: draftMonth > 0 ? `${draftMonth} Draft` : '0 Terlambat',
          badgeSubtext: `Tahun ${selectedYear}`,
          variant: overdueCount > 0 ? 'danger' : 'default',
          iconName: 'warning',
        },
        {
          id: 'tindak-lanjut-selesai',
          label: 'TINDAK LANJUT SELESAI',
          value: completedItems,
          unit: 'Selesai',
          badgeText: `${completionPercent}%`,
          badgeSubtext: 'Tingkat Penyelesaian',
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
        badgeText: totalMonth > 0 ? `${approvedMonth + finalMonth} Disetujui/Sah` : '0 Agenda',
        badgeSubtext: `${fullMonthName} ${selectedYear}`,
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
        label: 'PERLU ATENSI (OVERDUE / DRAFT)',
        value: overdueCount,
        unit: 'Item',
        badgeText: draftMonth > 0 ? `${draftMonth} Draft Rapat` : reviewMonth > 0 ? `${reviewMonth} Review` : 'Nihil',
        badgeSubtext: `${fullMonthName} ${selectedYear}`,
        variant: overdueCount > 0 ? 'danger' : 'default',
        iconName: 'warning',
      },
      {
        id: 'tindak-lanjut-selesai',
        label: 'TINDAK LANJUT SELESAI',
        value: completedItems,
        unit: 'Selesai',
        badgeText: `${completionPercent}%`,
        badgeSubtext: 'Tingkat Penyelesaian',
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

      {/* 3. Analytics Grid (Monthly Trend + Status Donut + Bureau Workload) */}
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
          onBiroClick={(code) => router.push(`/biro/${code.toLowerCase()}`)}
        />
      </div>

      {/* 4. Recent Meetings Table (Terbaru ke Terlama) - Sinkron dengan Tahun & Bulan Terpilih */}
      <MeetingTable
        initialMeetings={yearMeetings}
        filterMonth={selectedMonth}
        onViewAllMeetings={() => router.push('/semua-rapat')}
      />
    </div>
  );
}

