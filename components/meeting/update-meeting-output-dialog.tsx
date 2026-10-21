'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  FileCheck,
  Link2,
  ExternalLink,
  FileText,
  Tag,
  CheckCircle2,
  Clock,
  Sparkles,
  Loader2,
  Users,
} from 'lucide-react';
import { toast } from '@/components/providers/toast-provider';
import { updateMeetingOutputAction } from '@/app/actions/meeting-actions';
import { cn } from '@/lib/utils';

interface UpdateMeetingOutputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: {
    id: string;
    title: string;
    meetingNumber?: string | null;
    progressStatus?: string | null;
    driveLink?: string | null;
    notes?: string | null;
    actionPlan?: string | null;
    ndConsumptionNumber?: string | null;
    ndConsumptionStatus?: string | null;
    releaseUrl?: string | null;
    releaseTitle?: string | null;
    picName?: string | null;
  };
  onSuccess?: (updatedMeeting: any) => void;
}

export function UpdateMeetingOutputDialog({
  isOpen,
  onClose,
  meeting,
  onSuccess,
}: UpdateMeetingOutputDialogProps) {
  const router = useRouter();

  const [progressStatus, setProgressStatus] = useState<string>(
    meeting.progressStatus || 'Dalam Proses'
  );
  const [driveLink, setDriveLink] = useState<string>(meeting.driveLink || '');
  const [notes, setNotes] = useState<string>(meeting.notes || '');
  const [actionPlan, setActionPlan] = useState<string>(meeting.actionPlan || 'Rutin');
  const [ndConsumptionNumber, setNdConsumptionNumber] = useState<string>(
    meeting.ndConsumptionNumber || ''
  );
  const [ndConsumptionStatus, setNdConsumptionStatus] = useState<string>(
    meeting.ndConsumptionStatus || 'Diproses'
  );
  const [releaseUrl, setReleaseUrl] = useState<string>(meeting.releaseUrl || '');
  const [releaseTitle, setReleaseTitle] = useState<string>(meeting.releaseTitle || '');
  const [picName, setPicName] = useState<string>(meeting.picName || '');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state if meeting prop updates
  useEffect(() => {
    if (meeting) {
      setProgressStatus(meeting.progressStatus || 'Dalam Proses');
      setDriveLink(meeting.driveLink || '');
      setNotes(meeting.notes || '');
      setActionPlan(meeting.actionPlan || 'Rutin');
      setNdConsumptionNumber(meeting.ndConsumptionNumber || '');
      setNdConsumptionStatus(meeting.ndConsumptionStatus || 'Diproses');
      setReleaseUrl(meeting.releaseUrl || '');
      setReleaseTitle(meeting.releaseTitle || '');
      setPicName(meeting.picName || '');
    }
  }, [meeting]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await updateMeetingOutputAction({
        meetingId: meeting.id,
        progressStatus,
        driveLink: driveLink.trim() || null,
        notes: notes.trim() || null,
        actionPlan: actionPlan || 'Rutin',
        ndConsumptionNumber: ndConsumptionNumber.trim() || null,
        ndConsumptionStatus: ndConsumptionNumber.trim() ? ndConsumptionStatus : null,
        releaseUrl: releaseUrl.trim() || null,
        releaseTitle: releaseTitle.trim() || null,
        picName: picName.trim() || null,
      });

      if (res.success && res.data) {
        toast.success('Hasil kegiatan & output kerja berhasil diperbarui!');
        onSuccess?.(res.data);
        router.refresh();
        onClose();
      } else {
        toast.error(res.error || 'Gagal memperbarui hasil kegiatan.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan sistem saat menyimpan perubahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#175360] via-[#1E6B7B] to-[#266F80] px-6 py-4.5 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-emerald-300 border border-white/20 shadow-xs">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-white/20 text-teal-100">
                  {meeting.meetingNumber || 'LOG-BIRO3'}
                </span>
                <span className="text-xs text-white/70">
                  Update Pasca-Pelaksanaan
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5 line-clamp-1">
                Isi / Perbarui Hasil Kegiatan &amp; Output Kerja
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Target Activity Banner */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Agenda Kegiatan:
            </span>
            <p className="text-sm font-bold text-slate-800 mt-0.5">
              {meeting.title}
            </p>
          </div>

          {/* 1. Status Pekerjaan & Rencana Aksi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status Pekerjaan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#1E6B7B]" />
                <span>Status Pekerjaan Saat Ini:</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'Dalam Proses', color: 'border-blue-300 hover:border-blue-400 text-blue-800 bg-blue-50/50' },
                  { value: 'Selesai', color: 'border-emerald-300 hover:border-emerald-400 text-emerald-800 bg-emerald-50/50' },
                ].map((item) => {
                  const isSelected = progressStatus === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setProgressStatus(item.value)}
                      className={cn(
                        'py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer',
                        item.color,
                        isSelected
                          ? 'ring-2 ring-[#1E6B7B] border-[#1E6B7B] bg-[#1E6B7B] text-white shadow-xs'
                          : 'border-slate-200 bg-slate-50/60 text-slate-600'
                      )}
                    >
                      {item.value}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rencana Aksi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-[#1E6B7B]" />
                <span>Rencana Aksi:</span>
              </label>
              <select
                value={actionPlan}
                onChange={(e) => setActionPlan(e.target.value)}
                className="w-full px-3.5 h-[42px] rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B]"
              >
                <option value="Rutin">Rutin (Program Kerja Reguler)</option>
                <option value="Non Rutin">Non-Rutin (Inisiatif Khusus)</option>
                <option value="Insidental">Insidental (Tugas Mendesak / Ad-hoc)</option>
              </select>
            </div>
          </div>

          {/* 2. Google Drive Link */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-blue-600" />
                <span>Tautan Berkas Google Drive (Dokumentasi / Materi / Catatan Kegiatan):</span>
              </span>
              {driveLink && (
                <a
                  href={driveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-1 font-semibold"
                >
                  <span>Cek Tautan</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </label>
            <input
              type="url"
              value={driveLink}
              onChange={(e) => setDriveLink(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/... atau link dokumen"
              className="w-full px-3.5 h-[42px] rounded-xl border border-slate-300 bg-white text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B]"
            />
            <p className="text-[11px] text-slate-400">
              Cantumkan folder penyimpanan berkas, foto dokumentasi, catatan kegiatan, atau naskah paparan.
            </p>
          </div>

          {/* 3. Catatan Hasil Kegiatan / Capaian */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#1E6B7B]" />
              <span>Catatan Ringkasan Hasil Kegiatan &amp; Capaian Kerja:</span>
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tuliskan pokok hasil koordinasi, kesepakatan, tindak lanjut arahan pimpinan, atau poin krusial yang dicapai..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B]"
            />
          </div>

          {/* 4. Nd Konsumsi */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-700 block">
              Pengajuan Nota Dinas Konsumsi (Nd Konsum):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nomor Nd Konsumsi (Opsional):
                </label>
                <input
                  type="text"
                  value={ndConsumptionNumber}
                  onChange={(e) => setNdConsumptionNumber(e.target.value)}
                  placeholder="Contoh: ND-084/IKK/2026"
                  className="w-full px-3 h-[38px] rounded-lg border border-slate-300 bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Status Pengajuan Konsumsi:
                </label>
                <select
                  value={ndConsumptionStatus}
                  onChange={(e) => setNdConsumptionStatus(e.target.value)}
                  disabled={!ndConsumptionNumber.trim()}
                  className="w-full px-3 h-[38px] rounded-lg border border-slate-300 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 disabled:opacity-50"
                >
                  <option value="Diproses">Diproses</option>
                  <option value="Disetujui">Disetujui</option>
                  <option value="Selesai">Selesai</option>
                </select>
              </div>
            </div>
          </div>

          {/* 5. Publikasi & Rilis Berita */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-700 block">
              Publikasi &amp; Rilis Berita (Tim Komunikasi / Humas):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Judul Rilis Berita:
                </label>
                <input
                  type="text"
                  value={releaseTitle}
                  onChange={(e) => setReleaseTitle(e.target.value)}
                  placeholder="Contoh: Setjen Dewan Nasional KEK Dorong Akselerasi Investasi..."
                  className="w-full px-3 h-[38px] rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  URL / Tautan Siaran Pers:
                </label>
                <input
                  type="url"
                  value={releaseUrl}
                  onChange={(e) => setReleaseUrl(e.target.value)}
                  placeholder="https://kek.go.id/berita/... atau link portal berita"
                  className="w-full px-3 h-[38px] rounded-lg border border-slate-300 bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20"
                />
              </div>
            </div>
          </div>

          {/* 6. Penyesuaian PIC Kegiatan */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#1E6B7B]" />
              <span>PIC Pelaksana Kegiatan:</span>
            </label>
            <input
              type="text"
              value={picName}
              onChange={(e) => setPicName(e.target.value)}
              placeholder="Nama-nama PIC penanggung jawab kegiatan..."
              className="w-full px-3.5 h-[40px] rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B]"
            />
            <p className="text-[11px] text-slate-400">
              Dapat mencakup lebih dari satu staf pelaksana (dipisahkan tanda koma).
            </p>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E6B7B] hover:bg-[#164E59] text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Perubahan Hasil Kegiatan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
