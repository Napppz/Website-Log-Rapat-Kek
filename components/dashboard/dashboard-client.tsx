'use client';

import React from 'react';
import { WelcomeBanner } from '@/components/dashboard/welcome-banner';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { ActivityTrendChart } from '@/components/dashboard/activity-trend-chart';
import { FollowUpStatusChart } from '@/components/dashboard/follow-up-status-chart';
import { BureauDistribution } from '@/components/dashboard/bureau-distribution';
import { MeetingTable } from '@/components/meeting/meeting-table';
import { useRouter } from 'next/navigation';
import { Meeting, DashboardMetric, BureauWorkload, FollowUpStatusMetric } from '@/lib/types';

interface DashboardClientProps {
  initialMeetings: Meeting[];
  metrics?: DashboardMetric[];
  workload?: BureauWorkload[];
  followUpMetrics?: FollowUpStatusMetric[];
  totalResolutions?: number;
}

export function DashboardClient({
  initialMeetings,
  metrics,
  workload,
  followUpMetrics,
  totalResolutions,
}: DashboardClientProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col w-full gap-6">
      {/* 1. Executive Welcome Banner */}
      <WelcomeBanner
        onScheduleMeeting={() => router.push('/buat-rapat')}
      />

      {/* 2. Top Metric Cards - Live dari Neon DB */}
      <StatsOverview metrics={metrics} />

      {/* 3. Analytics Grid (Monthly Trend + Status Donut + Bureau Workload) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <ActivityTrendChart />
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

      {/* 4. Recent Meetings Table (Terbaru ke Terlama) - Live dari Neon DB */}
      <MeetingTable
        initialMeetings={initialMeetings}
        onViewAllMeetings={() => router.push('/semua-rapat')}
      />
    </div>
  );
}
