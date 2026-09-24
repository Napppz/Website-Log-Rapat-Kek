'use client';

import React from 'react';
import { CalendarDays, Download, PlusCircle } from 'lucide-react';

interface WelcomeBannerProps {
  onDownloadExecutiveSummary?: () => void;
  onScheduleMeeting?: () => void;
}

export function WelcomeBanner({
  onDownloadExecutiveSummary,
  onScheduleMeeting,
}: WelcomeBannerProps) {
  const handleDownload = () => {
    if (onDownloadExecutiveSummary) {
      onDownloadExecutiveSummary();
    } else {
      alert('Menghasilkan Ringkasan Eksekutif Dewan Nasional KEK RI (Format PDF Resmi)...');
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-50 via-white to-amber-100/60 text-slate-800 shadow-sm border border-amber-200 p-6 md:p-8">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
      <div className="absolute right-48 -bottom-20 w-64 h-64 rounded-full bg-amber-200/20 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800 font-bold text-[11px] uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              SUPER ADMIN
            </span>
            <span className="text-amber-400 font-semibold">•</span>
            <span className="inline-flex items-center gap-1.5 text-amber-800 font-semibold text-[13px]">
              <CalendarDays className="w-4 h-4 text-amber-600" />
              Kamis, 24 September 2026
            </span>
            <span className="text-amber-400 font-semibold">•</span>
            <span className="text-slate-600 font-medium text-[13px]">
              Sekretariat Jenderal Dewan Nasional KEK RI
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-[26px] md:text-[28px] text-slate-900 font-bold tracking-tight">
            Selamat Datang kembali, Dr. Hendra Suprayitno
          </h1>

          {/* Subtext Description */}
          <p className="text-[14px] text-slate-600 max-w-2xl leading-relaxed">
            Pengelola Kawasan Ekonomi Khusus Republik Indonesia. Pantau sinergi 5 biro kerja, realisasi regulasi lintas kementerian, dan akselerasi investasi strategis nasional hari ini.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 self-start lg:self-center shrink-0">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-50 transition-all duration-150 shadow-sm font-semibold text-[13px] cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-700" />
            <span>Unduh Ringkasan Eksekutif</span>
          </button>

          <button
            type="button"
            onClick={onScheduleMeeting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-all duration-150 shadow-md shadow-amber-600/20 font-semibold text-[13px] cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Jadwalkan Rapat Baru</span>
          </button>
        </div>
      </div>
    </div>
  );
}
