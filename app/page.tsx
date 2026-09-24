'use client';

import React from 'react';
import { WelcomeBanner } from '@/components/dashboard/welcome-banner';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { ActivityTrendChart } from '@/components/dashboard/activity-trend-chart';
import { FollowUpStatusChart } from '@/components/dashboard/follow-up-status-chart';
import { BureauDistribution } from '@/components/dashboard/bureau-distribution';
import { MeetingTable } from '@/components/meeting/meeting-table';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col w-full gap-6">
      {/* 1. Executive Welcome Banner */}
      <WelcomeBanner
        onScheduleMeeting={() => router.push('/buat-rapat')}
        onDownloadExecutiveSummary={() =>
          alert('Menghasilkan Ringkasan Eksekutif Dewan Nasional KEK RI (Format PDF Resmi)...')
        }
      />

      {/* 2. Top Metric Cards (5 Cards) */}
      <StatsOverview />

      {/* 3. Analytics Grid (Monthly Trend + Status Donut + Bureau Workload) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <ActivityTrendChart />
        <FollowUpStatusChart
          onManageMatrixClick={() => router.push('/tindak-lanjut')}
        />
        <BureauDistribution
          onBiroClick={(code) => router.push(`/biro/${code.toLowerCase()}`)}
        />
      </div>

      {/* 4. Recent Meetings Table (Newest to Oldest) */}
      <MeetingTable onViewAllMeetings={() => router.push('/semua-rapat')} />
    </div>
  );
}
