'use client';

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MeetingTable } from '@/components/meeting/meeting-table';
import { MeetingStatus, BiroCode, Meeting } from '@/lib/types';
import { PlusCircle, Filter } from 'lucide-react';
import Link from 'next/link';

interface SemuaRapatClientProps {
  initialMeetings: Meeting[];
}

export function SemuaRapatClient({ initialMeetings }: SemuaRapatClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const statusParam = searchParams.get('status') as MeetingStatus | null;
  const biroParam = searchParams.get('biro') as BiroCode | null;

  const statusFilters: { label: string; value: MeetingStatus | 'ALL' }[] = [
    { label: 'Semua Status', value: 'ALL' },
    { label: 'Disetujui (Approved)', value: 'APPROVED' },
    { label: 'Final', value: 'FINAL' },
    { label: 'Menunggu Review', value: 'REVIEW' },
    { label: 'Draft', value: 'DRAFT' },
  ];

  const handleSelectStatus = (val: MeetingStatus | 'ALL') => {
    if (val === 'ALL') {
      router.push('/semua-rapat');
    } else {
      router.push(`/semua-rapat?status=${val}`);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-white rounded-xl border border-amber-200/70 shadow-sm">
        <div>
          <span className="font-semibold text-[12px] text-amber-700 uppercase tracking-wider">
            Manajemen Risalah
          </span>
          <h1 className="text-[24px] font-bold text-slate-900 mt-0.5">
            Semua Risalah Rapat KEK RI
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Arsip lengkap agenda, risalah keputusan, dan status tindak lanjut seluruh Biro KEK.
          </p>
        </div>

        <Link
          href="/buat-rapat"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600 text-white font-semibold text-[13px] hover:bg-amber-700 shadow-md shadow-amber-600/20 transition-all shrink-0 self-start sm:self-center"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Jadwalkan Rapat Baru</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <span className="text-[12px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-amber-600" />
          Filter:
        </span>
        {statusFilters.map((tab) => {
          const isActive = tab.value === 'ALL' ? !statusParam : statusParam === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleSelectStatus(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white border border-amber-200 text-slate-700 hover:bg-amber-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Meeting Table */}
      <MeetingTable
        initialMeetings={initialMeetings}
        filterStatus={statusParam}
        filterBiro={biroParam}
      />
    </div>
  );
}
