'use client';

import React, { useState } from 'react';
import { CalendarDays, Download, PlusCircle, Loader2, Sparkles, Building2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from '@/components/providers/toast-provider';

interface WelcomeBannerProps {
  onDownloadExecutiveSummary?: () => void;
  onScheduleMeeting?: () => void;
}

const ROLE_LABELS: Record<string, { label: string; badgeClass: string }> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  ADMIN: {
    label: 'Administrator',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
  },
  NOTULIS: {
    label: 'Notulis Sidang',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  STAFF: {
    label: 'Staf Biro',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
  },
  VIEWER: {
    label: 'Tamu / Viewer',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
  },
};

export function WelcomeBanner({
  onDownloadExecutiveSummary,
  onScheduleMeeting,
}: WelcomeBannerProps) {
  const { data: session } = useSession();
  const [isDownloading, setIsDownloading] = useState(false);

  const currentUser = session?.user;
  const userName = currentUser?.name || 'Administrator';
  const userRole = (currentUser?.role as string) || 'SUPER_ADMIN';
  const roleConfig = ROLE_LABELS[userRole] || ROLE_LABELS.SUPER_ADMIN;

  const biroInfo = currentUser?.biroCode
    ? `Biro ${currentUser.biroCode}`
    : 'Sekretariat Jenderal KEK RI';

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleDownload = async () => {
    if (onDownloadExecutiveSummary) {
      onDownloadExecutiveSummary();
      return;
    }

    try {
      setIsDownloading(true);
      const res = await fetch('/api/reports/summary/pdf');
      if (!res.ok) {
        throw new Error('Gagal mengunduh ringkasan eksekutif');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Laporan-Eksekutif-Dewan-KEK-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      toast.success('Laporan Ringkasan Eksekutif PDF berhasil diunduh.');
    } catch (e: any) {
      toast.error(e?.message || 'Terjadi kesalahan saat mengunduh dokumen.');
    } finally {
      setIsDownloading(false);
    }
  };

  const canCreateMeeting =
    userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'NOTULIS';

  const [isMounted, setIsMounted] = useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div
      style={{
        transition: 'all 500ms cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: isMounted ? 1 : 0,
        transform: isMounted ? 'translateY(0)' : 'translateY(-6px)',
      }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50 via-white to-amber-100/60 text-slate-800 shadow-sm border border-amber-200/80 p-6 md:p-8"
    >
      {/* Decorative Blur Backgrounds */}
      <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
      <div className="absolute right-48 -bottom-20 w-64 h-64 rounded-full bg-amber-200/20 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border font-bold text-[11px] uppercase tracking-wider ${roleConfig.badgeClass}`}
            >
              <span className="w-2 h-2 rounded-full bg-current" />
              {roleConfig.label}
            </span>

            <span className="text-amber-400 font-semibold">•</span>

            <span className="inline-flex items-center gap-1.5 text-amber-900 font-semibold text-[12.5px]">
              <CalendarDays className="w-3.5 h-3.5 text-amber-600" />
              {todayFormatted}
            </span>

            <span className="text-amber-400 font-semibold">•</span>

            <span className="inline-flex items-center gap-1 text-slate-600 font-medium text-[12.5px]">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              {biroInfo}
            </span>
          </div>

          {/* Dynamic Personalized Heading */}
          <h1 className="text-[24px] md:text-[28px] text-slate-900 font-bold tracking-tight">
            Selamat Datang, {userName}
          </h1>

          {/* Simple, Clear Subtext */}
          <p className="text-[13.5px] text-slate-600 max-w-2xl leading-relaxed">
            Portal Komando Sidang &amp; Pengendalian Tindak Lanjut Dewan Nasional Kawasan Ekonomi Khusus Republik Indonesia. Pantau sinergi 5 biro kerja dan tindak lanjut keputusan rapat secara transparan.
          </p>
        </div>

        {/* Clear Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 self-start lg:self-center shrink-0">
          <button
            type="button"
            disabled={isDownloading}
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-amber-300 text-amber-900 hover:bg-amber-50 hover:border-amber-400 transition-all duration-150 shadow-xs font-semibold text-[12.5px] cursor-pointer disabled:opacity-50"
            title="Unduh laporan eksekutif berkala dalam format PDF resmi"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
            ) : (
              <Download className="w-4 h-4 text-amber-700" />
            )}
            <span>{isDownloading ? 'Membuat PDF...' : 'Unduh Laporan Eksekutif'}</span>
          </button>

          {canCreateMeeting && onScheduleMeeting && (
            <button
              type="button"
              onClick={onScheduleMeeting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition-all duration-150 shadow-sm shadow-amber-600/25 font-semibold text-[12.5px] cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Jadwalkan Rapat Baru</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
