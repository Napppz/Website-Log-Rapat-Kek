import React from 'react';
import { notFound } from 'next/navigation';
import { BIRO_LIST, MOCK_BUREAU_WORKLOAD } from '@/lib/mock-data';
import { BiroCode } from '@/lib/types';
import { MeetingTable } from '@/components/meeting/meeting-table';
import { Building2, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface BiroPageProps {
  params: Promise<{ code: string }>;
}

export default async function BiroDetailPage({ params }: BiroPageProps) {
  const { code } = await params;
  let upperCode = code.toUpperCase() as BiroCode;

  // Aliases mapping for seamless compatibility
  if (upperCode === 'PPK' || upperCode === 'REN' || upperCode === 'IT') upperCode = 'BPPK';
  if (upperCode === 'DAL' || upperCode === 'OPS') upperCode = 'PKKEK';
  if (upperCode === 'INV') upperCode = 'IKK';
  if (upperCode === 'HUK' || upperCode === 'LEG') upperCode = 'HSDMO';
  if (upperCode === 'BUK' || upperCode === 'ADM') upperCode = 'UK';

  const biro = BIRO_LIST.find((b) => b.code === upperCode);
  if (!biro) {
    notFound();
  }

  const workload = MOCK_BUREAU_WORKLOAD.find((w) => w.code === upperCode);

  return (
    <div className="flex flex-col gap-6">
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-amber-800 text-[13px] font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard Utama</span>
        </Link>
      </div>

      {/* Bureau Info Card */}
      <div className="p-6 bg-white rounded-xl border border-amber-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-amber-600 text-white font-bold text-[12px] uppercase">
              {biro.code}
            </span>
            <span className="font-semibold text-amber-700 text-[13px]">• Unit Kerja Resmi</span>
          </div>

          <h1 className="text-[26px] font-bold text-slate-900">{biro.name}</h1>
          <p className="text-[14px] text-slate-600 max-w-2xl leading-relaxed">
            {biro.description}
          </p>
        </div>

        {/* Workload metric */}
        <div className="flex items-center gap-4 bg-amber-50/60 p-4 rounded-xl border border-amber-200 shrink-0">
          <div className="w-12 h-12 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[12px] font-semibold text-slate-500 uppercase">Total Sesi Rapat</div>
            <div className="text-[24px] font-bold text-amber-900 leading-tight">
              {workload?.count || 0} <span className="text-[13px] text-slate-500 font-medium">Rapat</span>
            </div>
          </div>
        </div>
      </div>

      {/* Meetings for this Bureau */}
      <div className="space-y-3">
        <h2 className="text-[18px] font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-600" />
          Daftar Rapat {biro.name}
        </h2>
        <MeetingTable filterBiro={upperCode} />
      </div>
    </div>
  );
}
