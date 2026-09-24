'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MeetingTable } from '@/components/meeting/meeting-table';
import { MeetingStatus, BiroCode, Meeting } from '@/lib/types';
import { PlusCircle, Filter, Trash2, AlertTriangle, Loader2, CheckCircle2, X } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { deleteAllMeetingsAction } from '@/app/actions/meeting-actions';

interface SemuaRapatClientProps {
  initialMeetings: Meeting[];
}

export function SemuaRapatClient({ initialMeetings }: SemuaRapatClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'VIEWER';
  const canCreate = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'NOTULIS';
  const canDeleteAll = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
        setToast({
          message: `Berhasil menghapus seluruh data rapat (${res.count ?? initialMeetings.length} rapat dibersihkan dari database).`,
          type: 'success',
        });
        setTimeout(() => {
          setToast(null);
        }, 5000);
        router.refresh();
      } else {
        alert(res.error || 'Gagal menghapus seluruh data rapat');
      }
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err?.message || 'Gagal menghapus rapat'}`);
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-emerald-900 text-white px-4 py-3 rounded-xl shadow-xl border border-emerald-700 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-[13px] font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-emerald-300 hover:text-white ml-2 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-center">
          {/* Hapus Semua Rapat Button (SUPER_ADMIN / ADMIN) */}
          {canDeleteAll && initialMeetings.length > 0 && (
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
            <Link
              href="/buat-rapat"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600 text-white font-semibold text-[13px] hover:bg-amber-700 shadow-md shadow-amber-600/20 transition-all shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Jadwalkan Rapat Baru</span>
            </Link>
          )}
        </div>
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
    </div>
  );
}
