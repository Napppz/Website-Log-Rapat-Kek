'use client';

import React from 'react';
import { Download } from 'lucide-react';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { ActivityTrendChart } from '@/components/dashboard/activity-trend-chart';
import { FollowUpStatusChart } from '@/components/dashboard/follow-up-status-chart';
import { BureauDistribution } from '@/components/dashboard/bureau-distribution';

export default function LaporanPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="p-6 bg-white rounded-xl border border-amber-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="font-semibold text-[12px] text-amber-700 uppercase tracking-wider">
            Analitik &amp; Pelaporan
          </span>
          <h1 className="text-[24px] font-bold text-slate-900 mt-0.5">
            Laporan Kinerja Rapat &amp; Tindak Lanjut KEK RI
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Rekapitulasi performa kepatuhan resolusi rapat dan beban koordinasi seluruh Biro.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert('Menghasilkan Laporan Komprehensif Tahunan 2026 (Format PDF Resmi)...')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white font-semibold text-[13px] hover:bg-amber-700 shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Export Laporan Lengkap</span>
        </button>
      </div>

      {/* Metrics */}
      <StatsOverview />

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <ActivityTrendChart />
        <FollowUpStatusChart />
        <BureauDistribution />
      </div>
    </div>
  );
}
