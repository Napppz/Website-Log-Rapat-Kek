'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MeetingTable } from '@/components/meeting/meeting-table';
import { MeetingStatus, BiroCode, Meeting } from '@/lib/types';
import { PlusCircle, Filter, Trash2, AlertTriangle, Loader2, CheckCircle2, X, UploadCloud, Sparkles, Calendar, Building2, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { deleteAllMeetingsAction } from '@/app/actions/meeting-actions';
import { UploadMeetingDialog } from '@/components/meeting/upload-meeting-dialog';
import { MeetingStatusGuideDialog } from '@/components/meeting/meeting-status-guide-dialog';
import { toast } from '@/components/providers/toast-provider';
import { parseMonthFilterIndex, getMonthDisplayName } from '@/lib/utils';
import { getMeetingStatusDetail } from '@/lib/meeting-status';

interface SemuaRapatClientProps {
  initialMeetings: Meeting[];
  lockedBiroCode?: string;
  currentUserBiroName?: string;
  currentUserRole?: string;
}

export function SemuaRapatClient({
  initialMeetings,
  lockedBiroCode,
  currentUserBiroName,
  currentUserRole,
}: SemuaRapatClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = currentUserRole || session?.user?.role || 'VIEWER';
  const canCreate = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'NOTULIS';
  const canDeleteAll = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';

  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [meetingsList, setMeetingsList] = useState<Meeting[]>(initialMeetings);

  useEffect(() => {
    setMeetingsList(initialMeetings.filter((m) => !deletedIds.has(m.id)));
  }, [initialMeetings, deletedIds]);

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStatusGuideOpen, setIsStatusGuideOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const statusParam = searchParams.get('status') as MeetingStatus | null;
  const biroParam = searchParams.get('biro') as BiroCode | null;
  const monthParam = searchParams.get('bulan') || searchParams.get('month');

  const countAll = meetingsList.length;
  const countDraft = meetingsList.filter((m) => m.status === 'DRAFT').length;
  const countReview = meetingsList.filter((m) => m.status === 'REVIEW').length;
  const countApproved = meetingsList.filter((m) => m.status === 'APPROVED').length;
  const countFinal = meetingsList.filter((m) => m.status === 'FINAL').length;

  const statusFilters: { label: string; value: MeetingStatus | 'ALL'; count: number; sublabel?: string }[] = [
    { label: 'Semua Status', value: 'ALL', count: countAll },
    { label: '1. Draf', value: 'DRAFT', count: countDraft, sublabel: 'Penyusunan' },
    { label: '2. Reviu', value: 'REVIEW', count: countReview, sublabel: 'Penelaahan' },
    { label: '3. Disetujui', value: 'APPROVED', count: countApproved, sublabel: 'Validasi Pimpinan' },
    { label: '4. Final', value: 'FINAL', count: countFinal, sublabel: 'Disahkan & Terbit' },
  ];

  const handleSelectStatus = (val: MeetingStatus | 'ALL') => {
    const params = new URLSearchParams(searchParams.toString());
    if (val === 'ALL') {
      params.delete('status');
    } else {
      params.set('status', val);
    }
    router.push(params.toString() ? `/semua-rapat?${params.toString()}` : '/semua-rapat');
  };

  const handleDeleteAll = async () => {
    if (confirmInput.trim().toUpperCase() !== 'HAPUS') {
      return;
    }

    try {
      setIsDeletingAll(true);
      const res = await deleteAllMeetingsAction();
      if (res.success) {
        setIsDeleteModalOpen(false);
        setConfirmInput('');
        setMeetingsList([]);
        toast.success(
          `Berhasil menghapus seluruh data rapat (${res.count ?? initialMeetings.length} rapat telah dibersihkan).`
        );
        router.refresh();
      } else {
        toast.error(res.error || 'Gagal menghapus seluruh data rapat');
      }
    } catch (err: any) {
      toast.error(`Terjadi kesalahan: ${err?.message || 'Gagal menghapus rapat'}`);
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Warning banner if redirected due to unauthorized cross-bureau access */}
      {searchParams.get('denied') === 'true' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-800 text-[13px] shadow-xs animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">Akses Dibatasi: </span>
            Anda tidak memiliki hak akses untuk membuka rapat dari biro lain. Anda telah diarahkan kembali ke daftar rapat biro Anda ({lockedBiroCode}).
          </div>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div>
          <span className="font-semibold text-[12px] text-[#31889C] uppercase tracking-wider flex items-center gap-1.5">
            {lockedBiroCode ? (
              <>
                <Building2 className="w-3.5 h-3.5" />
                Risalah Biro {lockedBiroCode}
              </>
            ) : (
              'Manajemen Risalah Dewan KEK'
            )}
          </span>
          <h1 className="text-[24px] font-bold text-slate-900 mt-0.5">
            {lockedBiroCode
              ? `Semua Risalah Rapat — ${currentUserBiroName || `Biro ${lockedBiroCode}`}`
              : 'Semua Risalah Rapat KEK RI'}
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            {lockedBiroCode
              ? `Arsip lengkap agenda, risalah keputusan, dan status tindak lanjut khusus penugasan ${currentUserBiroName || `Biro ${lockedBiroCode}`}.`
              : 'Arsip lengkap agenda, risalah keputusan, dan status tindak lanjut seluruh Biro KEK.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-center">
          {/* Hapus Semua Rapat Button (SUPER_ADMIN / ADMIN only) */}
          {canDeleteAll && meetingsList.length > 0 && (
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300 font-semibold text-[12.5px] transition-all cursor-pointer shadow-xs"
              title="Hapus seluruh data rapat dari database (Hanya Administrator)"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
              <span>Hapus Semua Rapat</span>
            </button>
          )}

          {canCreate && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsUploadDialogOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-[#31889C] bg-[#F0F9FA] text-[#1B5260] font-semibold text-[13px] hover:bg-[#E8F5F7] shadow-xs transition-all shrink-0 cursor-pointer"
                title="Unggah berkas Word, PDF, atau Teks untuk otomatis membuat rapat dan notula"
              >
                <UploadCloud className="w-4 h-4 text-[#31889C]" />
                <span>⚡ Unggah Dokumen Rapat</span>
              </button>

              <Link
                href="/buat-rapat"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#31889C] text-white font-semibold text-[13px] hover:bg-[#266F80] shadow-xs transition-all shrink-0 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Jadwalkan Rapat Baru</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs, Status Guide Trigger & Active Month Indicator */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#31889C]" />
              Filter Tahap:
            </span>
            {statusFilters.map((tab) => {
              const isActive = tab.value === 'ALL' ? !statusParam : statusParam === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => handleSelectStatus(tab.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#31889C] text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-[#F0F9FA] hover:text-[#31889C]'
                  }`}
                  title={tab.sublabel ? `${tab.label} (${tab.sublabel})` : tab.label}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsStatusGuideOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#BCE3EB] bg-[#F0F9FA] hover:bg-[#E8F5F7] text-[#215865] text-[12px] font-bold shadow-2xs transition-all cursor-pointer"
              title="Buka panduan alur status risalah rapat (Draf -> Reviu -> Disetujui -> Final)"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#31889C]" />
              <span>Panduan Status Risalah</span>
            </button>

            {monthParam && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#E8F5F7] border border-[#BCE3EB] text-[#215865] text-[12px] font-bold shadow-2xs animate-in fade-in">
                <Calendar className="w-3.5 h-3.5 text-[#31889C]" />
                <span>
                  Periode Bulan: {getMonthDisplayName(parseMonthFilterIndex(monthParam) ?? 8)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete('bulan');
                    params.delete('month');
                    router.push(params.toString() ? `/semua-rapat?${params.toString()}` : '/semua-rapat');
                  }}
                  className="p-1 hover:bg-[#BCE3EB] rounded text-slate-500 hover:text-slate-800 transition-colors ml-0.5 cursor-pointer"
                  title="Hapus filter bulan & tampilkan semua bulan"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Banner Penjelasan Aktif Saat Filter Status Dipilih */}
        {statusParam && (
          <div className="p-3 bg-gradient-to-r from-[#F0F9FA] via-white to-[#F0F9FA]/60 border border-[#BCE3EB] rounded-xl flex items-center justify-between text-xs text-[#215865] shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#31889C] animate-pulse shrink-0" />
              <div className="truncate">
                <strong className="text-slate-900">
                  {getMeetingStatusDetail(statusParam).fullTitle}:
                </strong>{' '}
                <span className="text-slate-600">
                  {getMeetingStatusDetail(statusParam).description}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleSelectStatus('ALL')}
              className="text-[11px] font-bold text-[#31889C] hover:text-[#215865] bg-white px-2 py-0.5 rounded border border-[#BCE3EB] hover:bg-[#F0F9FA] shrink-0 ml-2 cursor-pointer transition-colors"
              title="Reset filter dan tampilkan semua status"
            >
              ✕ Tampilkan Semua
            </button>
          </div>
        )}
      </div>

      <MeetingStatusGuideDialog
        isOpen={isStatusGuideOpen}
        onClose={() => setIsStatusGuideOpen(false)}
      />

      {/* Meeting Table */}
      <MeetingTable
        initialMeetings={meetingsList}
        filterStatus={statusParam}
        filterBiro={lockedBiroCode ? (lockedBiroCode as BiroCode) : biroParam}
        filterMonth={monthParam}
        onMeetingDeleted={(deletedId) => {
          setDeletedIds((prev) => new Set(prev).add(deletedId));
          setMeetingsList((prev) => prev.filter((m) => m.id !== deletedId));
        }}
      />

      {/* Danger Modal: Konfirmasi Hapus Semua Rapat */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-red-200 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header with warning icon */}
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-[18px] text-slate-900">
                  Konfirmasi Hapus Semua Rapat
                </h3>
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  Tindakan ini akan menghapus permanen <strong>seluruh data rapat ({initialMeetings.length} rapat)</strong>,
                  beserta notulen risalah, presensi peserta, dan butir tindak lanjut dari basis data Neon PostgreSQL.
                </p>
              </div>
            </div>

            {/* Warning Callout */}
            <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-[12.5px] text-red-800 space-y-1">
              <span className="font-bold block">⚠️ Peringatan: Tindakan ini permanen!</span>
              <p>
                Seluruh data sidang akan dikosongkan. Nomor urut rapat masing-masing biro juga akan direset kembali ke 001.
              </p>
            </div>

            {/* Verification confirmation input */}
            <div className="mt-4 space-y-2">
              <label className="text-[12.5px] font-semibold text-slate-700 block">
                Ketik <span className="font-mono font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded border border-red-300">HAPUS</span> di bawah ini untuk mengonfirmasi:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="Ketik HAPUS..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium text-[13px] focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 uppercase tracking-wider"
                disabled={isDeletingAll}
                autoFocus
              />
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeletingAll}
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setConfirmInput('');
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-[13px] transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={confirmInput.trim().toUpperCase() !== 'HAPUS' || isDeletingAll}
                onClick={handleDeleteAll}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-[13px] shadow-sm shadow-red-600/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isDeletingAll ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>{isDeletingAll ? 'Menghapus Semua...' : 'Ya, Hapus Semua Rapat'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Meeting Document Dialog */}
      <UploadMeetingDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
      />
    </div>
  );
}
