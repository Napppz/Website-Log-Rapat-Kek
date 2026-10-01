import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getBiroDetail, getMeetingsFromDb } from '@/lib/db-service';
import { BiroCode } from '@/lib/types';
import { MeetingTable } from '@/components/meeting/meeting-table';
import { getCurrentUser } from '@/lib/auth/authorization';
import { BIRO_LIST } from '@/lib/mock-data';
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
  ShieldAlert,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

interface BiroPageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ denied?: string }>;
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

export default async function BiroDetailPage({ params, searchParams }: BiroPageProps) {
  const { code } = await params;
  const { denied } = await searchParams;

  const currentUser = await getCurrentUser();

  // Access Control:
  // If user is NOT Super Admin or Admin, they can ONLY access their own Biro!
  if (
    currentUser &&
    currentUser.role !== 'SUPER_ADMIN' &&
    currentUser.role !== 'ADMIN' &&
    currentUser.biroCode &&
    currentUser.biroCode.toLowerCase() !== code.toLowerCase()
  ) {
    // Automatically redirect back to their own bureau dashboard with denied notice
    redirect(`/biro/${currentUser.biroCode.toLowerCase()}?denied=true`);
  }

  const biro = await getBiroDetail(code);

  if (!biro) {
    notFound();
  }

  const meetings = await getMeetingsFromDb({ biroCode: biro.code });
  const teams = biro.teams || [];

  // Compute Bureau-specific Analytics
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const totalMeetings = biro.primaryMeetings.length;
  const approvedMeetings = biro.primaryMeetings.filter(
    (m) => m.status === 'APPROVED' || m.status === 'FINAL'
  ).length;

  const monthMeetings = biro.primaryMeetings.filter((m) => {
    const d = new Date(m.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const actionItems = (biro as any).actionItems || [];
  const totalActions = actionItems.length;
  const completedActions = actionItems.filter((a: any) => a.status === 'COMPLETED').length;
  const activeActions = actionItems.filter(
    (a: any) => a.status === 'PENDING' || a.status === 'IN_PROGRESS'
  ).length;
  const overdueActions = actionItems.filter(
    (a: any) =>
      a.status === 'OVERDUE' ||
      (a.status !== 'COMPLETED' && a.dueDate && new Date(a.dueDate) < now)
  ).length;
  const completionRate =
    totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 100;

  const isPrivileged =
    currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Access Denied Notice Banner */}
      {denied === 'true' && (
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

      {/* 2. Top Navigation & Admin Quick Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Back Link or Global Dashboard Link */}
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
            <span>Dashboard Resmi Unit Kerja Anda</span>
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

      {/* 3. Bureau Executive Header Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-[#31889C] text-white font-extrabold text-[12px] uppercase tracking-wider shadow-xs">
              BIRO {biro.code}
            </span>
            <span className="font-semibold text-[#215865] text-[13px]">
              • Unit Kerja Dewan Nasional Kawasan Ekonomi Khusus
            </span>
          </div>

          <h1 className="text-[26px] font-extrabold text-slate-900 tracking-tight">
            {biro.name}
          </h1>
          <p className="text-[13.5px] text-slate-600 max-w-3xl leading-relaxed">
            {biro.description}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-[12px] text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              <Users className="w-3.5 h-3.5 text-[#31889C]" />
              <strong className="text-slate-700">{biro.users.length}</strong> Personel Terdaftar
            </span>
            <span>•</span>
            <span className="font-medium">
              Nomor Registrasi Terakhir:{' '}
              <strong className="text-[#215865]">
                {biro.sequence
                  ? `${biro.code}-${String(biro.sequence.currentNumber).padStart(3, '0')}`
                  : `${biro.code}-000`}
              </strong>
            </span>
          </div>
        </div>

        {/* Bureau Status Badge */}
        <div className="flex items-center gap-4 bg-[#F0F9FA] p-4 rounded-xl border border-[#BCE3EB] shrink-0 self-start lg:self-center">
          <div className="w-12 h-12 rounded-xl bg-[#E8F5F7] text-[#31889C] flex items-center justify-center border border-[#BCE3EB]">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Rapat Diselenggarakan
            </div>
            <div className="text-[26px] font-extrabold text-[#31889C] leading-tight">
              {totalMeetings} <span className="text-[13px] text-slate-500 font-semibold">Agenda</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bureau-Specific Key Performance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Agenda Rapat */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
              Agenda Rapat Biro
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#E8F5F7] text-[#31889C] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[28px] font-extrabold text-slate-900 leading-none">
              {totalMeetings}
            </div>
            <p className="text-[12px] text-slate-500 mt-1.5 flex items-center gap-1.5">
              <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[11px]">
                {approvedMeetings} Sah
              </span>
              <span>dari total agenda</span>
            </p>
          </div>
        </div>

        {/* Metric 2: Rapat Bulan Berjalan */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
              Rapat Bulan Ini
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[28px] font-extrabold text-slate-900 leading-none">
              {monthMeetings}
            </div>
            <p className="text-[12px] text-slate-500 mt-1.5">
              Bulan berjalan ({now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })})
            </p>
          </div>
        </div>

        {/* Metric 3: Tindak Lanjut Aktif */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
              Tindak Lanjut Aktif
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[28px] font-extrabold text-slate-900 leading-none">
              {activeActions}
            </div>
            <p className="text-[12px] text-slate-500 mt-1.5 flex items-center gap-1.5">
              {overdueActions > 0 ? (
                <span className="text-red-700 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-200 text-[11px]">
                  {overdueActions} Terlambat
                </span>
              ) : (
                <span className="text-slate-500 text-[11px]">Tidak ada keterlambatan</span>
              )}
            </p>
          </div>
        </div>

        {/* Metric 4: Tingkat Penyelesaian */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
              Penyelesaian Komitmen
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[28px] font-extrabold text-emerald-700 leading-none">
              {completionRate}%
            </div>
            <p className="text-[12px] text-slate-500 mt-1.5">
              {completedActions} dari {totalActions} komitmen tuntas
            </p>
          </div>
        </div>
      </div>

      {/* 5. Struktur Tim Kerja Biro Section */}
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

      {/* 6. Daftar Rapat & Risalah Khusus Biro */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#31889C]" />
            Agenda &amp; Risalah Rapat {biro.name}
          </h2>

          <Link
            href={`/tindak-lanjut?search=${encodeURIComponent(biro.code)}`}
            className="inline-flex items-center gap-1 text-[12px] font-bold text-[#31889C] hover:underline"
          >
            <span>Lihat Matriks Tindak Lanjut Biro</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <MeetingTable filterBiro={biro.code as BiroCode} initialMeetings={meetings} />
      </div>
    </div>
  );
}
