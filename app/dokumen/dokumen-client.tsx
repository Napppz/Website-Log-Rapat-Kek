'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Download,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  Eye,
  Loader2,
  FileCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Meeting, Biro } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DokumenClientProps {
  initialMeetings: Meeting[];
  biros: Biro[];
}

const STATUS_BADGES: Record<string, { label: string; class: string }> = {
  FINAL: {
    label: 'Disahkan (Final)',
    class: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  APPROVED: {
    label: 'Disetujui',
    class: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  REVIEW: {
    label: 'Menunggu Review',
    class: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  DRAFT: {
    label: 'Draf Risalah',
    class: 'bg-slate-100 text-slate-700 border-slate-300',
  },
};

export function DokumenClient({ initialMeetings, biros }: DokumenClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBiro, setSelectedBiro] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isDownloadingSummary, setIsDownloadingSummary] = useState(false);

  // Filtered meetings
  const filteredMeetings = useMemo(() => {
    return initialMeetings.filter((m) => {
      const matchSearch =
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.biroName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchBiro =
        selectedBiro === 'ALL' ||
        m.biroCode === selectedBiro ||
        m.involvedBiros?.includes(selectedBiro);

      const matchStatus = selectedStatus === 'ALL' || m.status === selectedStatus;

      return matchSearch && matchBiro && matchStatus;
    });
  }, [initialMeetings, searchTerm, selectedBiro, selectedStatus]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = initialMeetings.length;
    const approvedOrFinal = initialMeetings.filter(
      (m) => m.status === 'APPROVED' || m.status === 'FINAL'
    ).length;
    const inReview = initialMeetings.filter((m) => m.status === 'REVIEW').length;
    const draft = initialMeetings.filter((m) => m.status === 'DRAFT').length;

    return { total, approvedOrFinal, inReview, draft };
  }, [initialMeetings]);

  // Download individual meeting official PDF
  const handleDownloadPdf = async (meeting: Meeting) => {
    try {
      setDownloadingId(meeting.id);
      const res = await fetch(`/api/meetings/${meeting.id}/pdf`);
      if (!res.ok) {
        throw new Error('Gagal menghasilkan berkas risalah PDF');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Risalah-Resmi-${meeting.code}-${meeting.date.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e: any) {
      alert(e?.message || 'Terjadi kesalahan saat mengunduh berkas risalah.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Download executive periodic report
  const handleDownloadExecutiveSummary = async () => {
    try {
      setIsDownloadingSummary(true);
      const res = await fetch('/api/reports/summary/pdf');
      if (!res.ok) {
        throw new Error('Gagal mengunduh ringkasan eksekutif');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Laporan-Eksekutif-Dewan-KEK-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e: any) {
      alert(e?.message || 'Terjadi kesalahan saat mengunduh laporan eksekutif.');
    } finally {
      setIsDownloadingSummary(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50 via-white to-amber-100/60 p-6 md:p-8 border border-amber-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <span className="font-semibold text-[11px] text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Arsip Resmi Dewan Nasional KEK RI</span>
          </span>
          <h1 className="text-[24px] md:text-[28px] font-bold text-slate-900 tracking-tight">
            Repositori Risalah &amp; Dokumen Sidang
          </h1>
          <p className="text-[13px] text-slate-600 leading-relaxed">
            Pusat penyimpanan digital notulen rapat, berita acara kesepakatan 5 biro, dan berkas penetapan regulasi KEK RI yang terhubung langsung dengan basis data Neon PostgreSQL.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            disabled={isDownloadingSummary}
            onClick={handleDownloadExecutiveSummary}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white font-semibold text-[13px] hover:bg-amber-700 shadow-sm shadow-amber-600/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {isDownloadingSummary ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isDownloadingSummary ? 'Menyiapkan PDF...' : 'Unduh Laporan Eksekutif (PDF)'}</span>
          </button>
        </div>
      </div>

      {/* 2. Repository Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex flex-col">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Dokumen Risalah
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-[26px] font-extrabold text-slate-900">{stats.total}</span>
            <span className="text-[12px] font-semibold text-slate-500">Berkas</span>
          </div>
          <span className="text-[11px] text-amber-700 mt-2 font-medium">Tersimpan di Cloud Database</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs flex flex-col">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            Dokumen Telah Disahkan
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-[26px] font-extrabold text-emerald-700">{stats.approvedOrFinal}</span>
            <span className="text-[12px] font-semibold text-emerald-600">Final / Approved</span>
          </div>
          <span className="text-[11px] text-emerald-600 mt-2 font-medium">Siap dijadikan acuan hukum</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex flex-col">
          <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
            Menunggu Review
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-[26px] font-extrabold text-amber-700">{stats.inReview}</span>
            <span className="text-[12px] font-semibold text-amber-600">Dalam Verifikasi</span>
          </div>
          <span className="text-[11px] text-amber-700 mt-2 font-medium">Proses paraf pimpinan biro</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Draf Notulen Baru
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-[26px] font-extrabold text-slate-700">{stats.draft}</span>
            <span className="text-[12px] font-semibold text-slate-500">Draft</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-2 font-medium">Sedang dirampungkan notulis</span>
        </div>
      </div>

      {/* 3. Filter & Search Controls */}
      <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari risalah rapat, nomor dokumen, atau topik pembahasan..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-amber-200 text-[13px] bg-amber-50/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-slate-400"
          />
          <Search className="w-4 h-4 text-amber-600 absolute left-3 top-2.5 pointer-events-none" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Biro filter */}
          <select
            value={selectedBiro}
            onChange={(e) => setSelectedBiro(e.target.value)}
            className="px-3 py-2 rounded-xl border border-amber-200 bg-white text-[12.5px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="ALL">Semua Biro Penyelenggara</option>
            {biros.map((b) => (
              <option key={b.code} value={b.code}>
                Biro {b.code} - {b.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-amber-200 bg-white text-[12.5px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="ALL">Semua Status Dokumen</option>
            <option value="FINAL">Disahkan (Final)</option>
            <option value="APPROVED">Disetujui</option>
            <option value="REVIEW">Menunggu Review</option>
            <option value="DRAFT">Draf Risalah</option>
          </select>

          {(searchTerm || selectedBiro !== 'ALL' || selectedStatus !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedBiro('ALL');
                setSelectedStatus('ALL');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-100/60 hover:bg-amber-100 text-amber-800 text-[12px] font-semibold transition-colors cursor-pointer"
              title="Reset semua filter"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Document List Table */}
      <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[15px] text-slate-900">
              Daftar Dokumen Risalah
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
              {filteredMeetings.length} Berkas Tersedia
            </span>
          </div>
          <span className="text-[12px] text-slate-500 hidden sm:inline">
            Format resmi: Dokumen PDF Surat Keputusan &amp; Risalah Sidang
          </span>
        </div>

        {filteredMeetings.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-3">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-[16px] text-slate-800">
              Tidak Ada Dokumen Yang Cocok
            </h3>
            <p className="text-[13px] text-slate-500 max-w-sm mt-1">
              Tidak ada berkas risalah rapat yang sesuai dengan kriteria filter atau kata kunci pencarian Anda.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-amber-100/80">
            {filteredMeetings.map((m) => {
              const statusCfg = STATUS_BADGES[m.status] || STATUS_BADGES.DRAFT;
              const isDownloadingThis = downloadingId === m.id;

              return (
                <div
                  key={m.id}
                  className="p-5 hover:bg-amber-50/30 transition-all flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 group"
                >
                  {/* Left: Icon & Meta */}
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200/80 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <FileText className="w-5 h-5 text-amber-700" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-[12px] text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-300">
                          {m.code}
                        </span>
                        <span
                          className={cn(
                            'text-[11px] font-bold px-2.5 py-0.5 rounded-lg border',
                            statusCfg.class
                          )}
                        >
                          {statusCfg.label}
                        </span>
                        <span className="text-[12px] text-slate-500 font-medium flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{m.date}</span>
                        </span>
                      </div>

                      <h3 className="font-bold text-[15px] text-slate-900 group-hover:text-amber-800 transition-colors">
                        {m.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-[12px] text-slate-500">
                        <span className="flex items-center gap-1 font-semibold text-amber-900">
                          <Building2 className="w-3.5 h-3.5 text-amber-600" />
                          <span>{m.biroName}</span>
                        </span>
                        <span>•</span>
                        <span>{m.attendees?.length || 0} Pejabat Hadir</span>
                        <span>•</span>
                        <span>
                          {m.actionItems?.completed || 0} dari{' '}
                          {m.actionItems?.total || 0} Rekomendasi Selesai
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2.5 self-end lg:self-center shrink-0 pt-2 lg:pt-0">
                    <Link
                      href={`/semua-rapat/${m.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-[12.5px] transition-all hover:border-slate-400"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                      <span>Buka Risalah</span>
                    </Link>

                    <button
                      type="button"
                      disabled={isDownloadingThis}
                      onClick={() => handleDownloadPdf(m)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[12.5px] transition-all shadow-xs shadow-amber-600/20 cursor-pointer disabled:opacity-50"
                      title={`Unduh Dokumen PDF Resmi Rapat ${m.code}`}
                    >
                      {isDownloadingThis ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span>{isDownloadingThis ? 'Membuat PDF...' : 'Unduh PDF Resmi'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
