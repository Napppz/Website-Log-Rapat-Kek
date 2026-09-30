import React from 'react';
import { notFound } from 'next/navigation';
import { getBiroDetail, getMeetingsFromDb } from '@/lib/db-service';
import { BiroCode } from '@/lib/types';
import { MeetingTable } from '@/components/meeting/meeting-table';
import {
  Building2,
  Calendar,
  ArrowLeft,
  Users,
  Layers,
  Info,
  Briefcase,
  Network,
  Radio,
  Laptop,
} from 'lucide-react';
import Link from 'next/link';

interface BiroPageProps {
  params: Promise<{ code: string }>;
}

function getTeamIcon(code: string) {
  switch (code.toUpperCase()) {
    case 'INV':
      return <Briefcase className="w-4 h-4 text-[#31889C]" />;
    case 'KS':
      return <Network className="w-4 h-4 text-[#2E7D32]" />;
    case 'KOM':
      return <Radio className="w-4 h-4 text-[#D97706]" />;
    case 'SI':
      return <Laptop className="w-4 h-4 text-[#0284C7]" />;
    default:
      return <Layers className="w-4 h-4 text-[#31889C]" />;
  }
}

export default async function BiroDetailPage({ params }: BiroPageProps) {
  const { code } = await params;
  const biro = await getBiroDetail(code);

  if (!biro) {
    notFound();
  }

  const meetings = await getMeetingsFromDb({ biroCode: biro.code });
  const teams = biro.teams || [];

  return (
    <div className="flex flex-col gap-6">
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#31889C] text-[13px] font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard Utama</span>
        </Link>
      </div>

      {/* Bureau Info Card */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-[#31889C] text-white font-bold text-[12px] uppercase">
              {biro.code}
            </span>
            <span className="font-semibold text-[#215865] text-[13px]">• Unit Kerja Resmi Dewan Nasional KEK</span>
          </div>

          <h1 className="text-[26px] font-bold text-slate-900">{biro.name}</h1>
          <p className="text-[14px] text-slate-600 max-w-2xl leading-relaxed">
            {biro.description}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-[12px] text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              <Users className="w-3.5 h-3.5 text-[#31889C]" />
              {biro.users.length} Personel Terdaftar
            </span>
            <span>•</span>
            <span className="font-medium">
              Nomor Rapat Terakhir: <strong className="text-[#215865]">{biro.sequence ? `${biro.code}-${String(biro.sequence.currentNumber).padStart(3, '0')}` : `${biro.code}-000`}</strong>
            </span>
          </div>
        </div>

        {/* Workload metric */}
        <div className="flex items-center gap-4 bg-[#F0F9FA] p-4 rounded-xl border border-[#BCE3EB] shrink-0">
          <div className="w-12 h-12 rounded-lg bg-[#E8F5F7] text-[#31889C] flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[12px] font-semibold text-slate-500 uppercase">Total Sesi Rapat</div>
            <div className="text-[24px] font-bold text-[#31889C] leading-tight">
              {biro.primaryMeetings.length} <span className="text-[13px] text-slate-500 font-medium">Rapat</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tim Kerja Biro Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div>
            <h2 className="text-[18px] font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#31889C]" />
              Struktur Tim Kerja {biro.shortName}
              <span className="text-[12px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                {teams.length} Tim
              </span>
            </h2>
            <p className="text-[12.5px] text-slate-500">
              {teams.length > 0
                ? `Pembagian unit kerja dan bidang operasional di lingkungan ${biro.name}`
                : `Penetapan tim operasional untuk biro ini sedang dalam penataan dan akan menyusul`}
            </p>
          </div>
        </div>

        {teams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {teams.map((team, idx) => {
              const meetingCount = biro.primaryMeetings.filter(
                (m) => m.primaryTeamId === team.id
              ).length;
              return (
                <div
                  key={team.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-[#31889C]/50 hover:shadow-xs transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#F0F9FA] border border-[#BCE3EB] flex items-center justify-center shrink-0">
                          {getTeamIcon(team.code)}
                        </div>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {team.code}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Tim #{idx + 1}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-[15px] text-slate-900 group-hover:text-[#31889C] transition-colors">
                        Tim {team.name}
                      </h3>
                      {team.description && (
                        <p className="text-[12px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {team.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11.5px] text-slate-500">
                    <span>Pelaksana Rapat</span>
                    <span className="font-bold text-[#215865] bg-[#F0F9FA] px-2 py-0.5 rounded border border-[#BCE3EB]">
                      {meetingCount} Rapat
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-[13px] text-amber-900 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">
                Struktur Tim Kerja Biro Sedang Dalam Proses Penataan
              </p>
              <p className="text-amber-700 text-[12px] mt-0.5 leading-relaxed">
                Unit kerja {biro.name} saat ini menjalankan operasional secara terpusat di tingkat biro. Daftar tim operasional akan segera menyusul sesuai pengesahan struktur tata kelola.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Meetings for this Bureau */}
      <div className="space-y-3">
        <h2 className="text-[18px] font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#31889C]" />
          Daftar Rapat {biro.name}
        </h2>
        <MeetingTable filterBiro={biro.code as BiroCode} initialMeetings={meetings} />
      </div>
    </div>
  );
}
