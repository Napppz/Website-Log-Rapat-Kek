'use client';

import React from 'react';
import { CalendarDays, Plus, Building2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface WelcomeBannerProps {
  onScheduleMeeting?: () => void;
}

const ROLE_LABELS: Record<string, { label: string; badgeClass: string }> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    badgeClass: 'bg-[#E8F5F7] text-[#215865] border-[#BCE3EB]',
  },
  ADMIN: {
    label: 'Administrator',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  PIMPINAN: {
    label: 'Pimpinan / Pengawas',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  STAFF: {
    label: 'Staf Tim',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
};

export function WelcomeBanner({
  onScheduleMeeting,
}: WelcomeBannerProps) {
  const { data: session } = useSession();

  const currentUser = session?.user;
  const rawUserName = currentUser?.name || 'Administrator';
  const userName = rawUserName.replace(/\s*\((Staff|Staf|Admin|Administrator|Super Admin|Pimpinan)[^)]*\)\s*$/i, '').trim() || rawUserName;
  const userRole = (currentUser?.role as string) || 'SUPER_ADMIN';
  const roleConfig = ROLE_LABELS[userRole] || ROLE_LABELS.SUPER_ADMIN;
  const userTeamName = currentUser?.teamName?.trim();
  const formattedTeamName = userTeamName
    ? userTeamName.replace(/^Tim\s+/i, '').trim()
    : '';
  const roleLabelText = userRole === 'STAFF' && formattedTeamName
    ? `Staf Tim ${formattedTeamName}`
    : roleConfig.label;

  const biroInfo = 'Biro Investasi, Kerja Sama & Komunikasi (Biro 3)';

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const canCreateMeeting =
    userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'STAFF';

  return (
    <div className="rounded-xl bg-white text-slate-800 shadow-2xs border border-slate-200 border-l-4 border-l-[#31889C] p-5 md:p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1.5 max-w-3xl">
          {/* Metadata Bar */}
          <div className="flex flex-wrap items-center gap-2 text-[12px]">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md border font-semibold text-[11px] ${roleConfig.badgeClass}`}
            >
              {roleLabelText}
            </span>

            <span className="text-slate-300">•</span>

            <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
              <CalendarDays className="w-3.5 h-3.5 text-[#31889C]" />
              {todayFormatted}
            </span>

            <span className="text-slate-300">•</span>

            <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              {biroInfo}
            </span>
          </div>

          {/* Dynamic Personalized Heading */}
          <h1 className="text-[20px] md:text-[22px] text-slate-900 font-bold tracking-tight">
            Selamat Datang, {userName}
          </h1>

          {/* Concise Operational Subtext */}
          <p className="text-[13px] text-slate-500 max-w-2xl leading-relaxed">
            Ringkasan pemantauan agenda kegiatan, kelengkapan dokumen log book, dan progres tindak lanjut Biro 3 Sekretariat Jenderal Dewan Nasional KEK.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex flex-wrap items-center gap-3 self-start lg:self-center shrink-0">
          {canCreateMeeting && onScheduleMeeting && (
            <button
              type="button"
              onClick={onScheduleMeeting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#31889C] text-white hover:bg-[#266F80] transition-colors shadow-2xs font-semibold text-[13px] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Kegiatan Baru</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
