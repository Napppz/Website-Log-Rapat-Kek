'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  Clock,
  CheckCircle2,
  FileCheck,
  UploadCloud,
  Loader2,
  ExternalLink,
  Save,
  Building2,
  User,
  Calendar,
  Layers,
  Sparkles,
  Paperclip,
  Check,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { ActionItem, ActionItemStatus } from '@/lib/types';
import {
  GoogleDriveIcon,
  extractDriveLink,
  cleanTextWithoutLink,
  normalizeUrl,
} from './google-drive-link-badge';
import { uploadGenericMeetingFileAction } from '@/app/actions/meeting-upload-actions';
import { addActionItemLogAction } from '@/app/actions/action-item-actions';
import { toast } from '@/components/providers/toast-provider';

interface ActionItemUpdateProgressDialogProps {
  item: ActionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onItemUpdated?: (updatedItem: any) => void;
  onSuccess?: (updatedItem: any) => void;
  defaultStatus?: ActionItemStatus;
  defaultProgress?: number;
}

export function ActionItemUpdateProgressDialog({
  item,
  isOpen,
  onClose,
  onItemUpdated,
  onSuccess,
  defaultStatus,
  defaultProgress,
}: ActionItemUpdateProgressDialogProps) {
  const [status, setStatus] = useState<ActionItemStatus>('PENDING');
  const [notes, setNotes] = useState('');
  const [driveLink, setDriveLink] = useState('');
  const [initialReferenceDoc, setInitialReferenceDoc] = useState<{
    name: string;
    url: string;
  } | null>(null);
  const [initialDriveAcuan, setInitialDriveAcuan] = useState<string | null>(null);
  const [initialInstructions, setInitialInstructions] = useState<string>('');
  const [uploadedDoc, setUploadedDoc] = useState<{
    url: string;
    name: string;
    size?: number;
  } | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && item) {
      setValidationError(null);
      setStatus(defaultStatus || item.status || 'PENDING');
      setNotes('');

      const rawDesc = item.description || '';

      // 1. Dokumen Acuan Penugasan Awal (Tidak akan ditimpa)
      const refMatch = rawDesc.match(/📎 (?:Dokumen Acuan|Dokumen Terkait):\s*\[([^\]]+)\]\(([^)]+)\)/);
      if (refMatch) {
        setInitialReferenceDoc({ name: refMatch[1], url: refMatch[2] });
      } else {
        setInitialReferenceDoc(null);
      }

      // 2. Link Google Drive Acuan Awal dari Atasan (Tampil di bahan acuan, bukan di input bukti PIC)
      const refDriveMatch = rawDesc.match(/📎 (?:Drive Acuan|Google Drive Acuan|Link Terkait):\s*(\S+)/);
      let foundDriveAcuan: string | null = null;
      if (refDriveMatch) {
        foundDriveAcuan = normalizeUrl(refDriveMatch[1]);
        setInitialDriveAcuan(foundDriveAcuan);
      } else {
        setInitialDriveAcuan(null);
      }

      // 3. Bukti Kegiatan (jika sebelumnya sudah pernah upload bukti)
      const evidenceMatch = rawDesc.match(/📎 Bukti Pelaksanaan:\s*\[([^\]]+)\]\(([^)]+)\)/);
      if (evidenceMatch) {
        setUploadedDoc({ name: evidenceMatch[1], url: evidenceMatch[2] });
      } else {
        setUploadedDoc(null);
      }

      // 4. Catatan Arahan Awal Bersih
      let cleanDesc = cleanTextWithoutLink(rawDesc);
      cleanDesc = cleanDesc
        .replace(/📎 (?:Dokumen Acuan|Dokumen Terkait):\s*\[([^\]]+)\]\(([^)]+)\)/g, '')
        .replace(/📎 (?:Drive Acuan|Google Drive Acuan|Link Terkait):\s*\S+/g, '')
        .replace(/📎 Bukti Pelaksanaan:\s*\[([^\]]+)\]\(([^)]+)\)/g, '')
        .replace(/📎 (?:Drive Bukti|Tautan Google Drive):\s*\S+/g, '')
        .replace(/📝 (?:Catatan Capaian|Catatan Progres):\s*[^\n]+/g, '')
        .trim();
      setInitialInstructions(cleanDesc);

      // 5. Link Drive Bukti PIC (Hanya jika berlabel bukti atau bukan link acuan atasan)
      const driveBuktiMatch = rawDesc.match(/📎 (?:Drive Bukti|Tautan Google Drive):\s*(\S+)/);
      if (driveBuktiMatch && (!foundDriveAcuan || normalizeUrl(driveBuktiMatch[1]) !== foundDriveAcuan)) {
        setDriveLink(normalizeUrl(driveBuktiMatch[1]));
      } else {
        setDriveLink('');
      }
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  // Handle document upload for evidence
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingDoc(true);
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'bukti-tindak-lanjut');
      const res = await uploadGenericMeetingFileAction(fd);
      if (res.success && res.data) {
        setUploadedDoc({
          url: res.data.url,
          name: res.data.name,
          size: res.data.size,
        });
        toast.success(`Berkas "${res.data.name}" berhasil diunggah.`);
      } else {
        toast.error(res.error || 'Gagal mengunggah berkas bukti.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan saat mengunggah berkas.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const cleanNotes = notes.trim();
    const effectiveNotes = cleanNotes || (status === 'COMPLETED' ? 'Pekerjaan telah diselesaikan oleh PIC.' : 'Pembaruan progres pelaksanaan tugas.');

    try {
      setIsSubmitting(true);

      // Build consolidated log notes & evidence links
      let fullNotes = effectiveNotes;
      if (uploadedDoc) {
        fullNotes = `${fullNotes}\n\n📎 Bukti Pelaksanaan: [${uploadedDoc.name}](${uploadedDoc.url})`;
      }
      if (driveLink.trim()) {
        const normalized = normalizeUrl(driveLink.trim());
        fullNotes = `${fullNotes}\n\n📎 Drive Bukti: ${normalized}`;
      }

      const res = await addActionItemLogAction({
        actionItemId: item.id,
        notes: fullNotes || 'Pembaruan status tindak lanjut kegiatan.',
        progress: status === 'COMPLETED' ? 100 : status === 'IN_PROGRESS' ? 50 : 0,
        newStatus: status,
      });

      if (res.success && res.data) {
        toast.success(
          status === 'COMPLETED'
            ? 'Tindak lanjut berhasil ditandai Selesai!'
            : 'Progres & bukti tindak lanjut berhasil diperbarui.'
        );
        onClose();
        if (onItemUpdated) {
          onItemUpdated(res.data.updatedItem);
        }
        if (onSuccess) {
          onSuccess(res.data.updatedItem);
        }
      } else {
        setValidationError(res.error || 'Gagal memperbarui progres tindak lanjut.');
      }
    } catch (err: any) {
      setValidationError(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCompleted = status === 'COMPLETED';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-50 via-white to-[#F0F8FA] border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#31889C] to-[#215865] text-white flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#31889C] uppercase tracking-wider block">
                Pembaruan Status &amp; Bukti
              </span>
              <h2 className="text-[17px] font-bold text-slate-900 leading-tight">
                Update Progres Tindak Lanjut
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-5 text-[13px]">
            {/* Validation alert */}
            {validationError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-2.5 text-[12px] animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span className="font-medium leading-relaxed">{validationError}</span>
              </div>
            )}

            {/* Context Card: Butir Tindak Lanjut Info */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-50 to-[#F0F8FA] border border-[#BCE3EB]/90 space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[10.5px] font-bold text-[#1E6B7B] uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#31889C]" />
                  <span>Butir Tindak Lanjut</span>
                </span>
                {item.meeting && (
                  <span className="font-mono text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-white border border-[#BCE3EB] text-[#215865] shadow-2xs">
                    {item.meeting.meetingNumber}
                  </span>
                )}
              </div>
              <p className="font-bold text-slate-900 text-[13.5px] leading-snug">
                {item.title}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11.5px] text-slate-500">
                {item.picTeam && (
                  <span className="font-semibold text-slate-700">
                    Tim: {item.picTeam.name}
                  </span>
                )}
                {item.picUser && (
                  <span className="flex items-center gap-1 text-slate-600">
                    <User className="w-3 h-3 text-slate-400" />
                    {item.picUser.name}
                  </span>
                )}
                <span className="flex items-center gap-1 text-slate-600">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  Tenggat: {new Date(item.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              {/* Arahan & Dokumen Acuan Penugasan Awal (Bahan Tugas PIC dari Atasan) */}
              {(initialReferenceDoc || initialInstructions || initialDriveAcuan) && (
                <div className="mt-2.5 pt-2.5 border-t border-[#BCE3EB]/80 bg-white/90 p-3 rounded-xl space-y-2 text-xs border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#215865] flex items-center gap-1.5 uppercase tracking-wider">
                      <FileText className="w-3.5 h-3.5 text-[#31889C]" />
                      <span>Arahan &amp; Dokumen Acuan dari Atasan:</span>
                    </span>
                    <span className="text-[10px] font-bold text-[#1E6B7B] bg-[#E8F5F7] px-2 py-0.5 rounded-full border border-[#BCE3EB]">
                      Bahan Tugas PIC
                    </span>
                  </div>
                  {initialInstructions && (
                    <p className="text-slate-700 text-[12px] bg-slate-50 p-2.5 rounded-lg border border-slate-200/70 leading-relaxed font-normal">
                      "{initialInstructions}"
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {initialReferenceDoc && (
                      <a
                        href={initialReferenceDoc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F0F9FA] hover:bg-[#E0F2F5] text-[#215865] border border-[#BCE3EB] text-[11.5px] font-bold transition-colors shadow-2xs"
                        title="Buka berkas acuan penugasan dari atasan"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-[#31889C]" />
                        <span>Dokumen Acuan: {initialReferenceDoc.name}</span>
                        <ExternalLink className="w-3 h-3 text-[#31889C]" />
                      </a>
                    )}
                    {initialDriveAcuan && (
                      <a
                        href={initialDriveAcuan}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11.5px] font-bold transition-colors shadow-2xs"
                        title="Buka folder/tautan Google Drive bahan acuan atasan"
                      >
                        <GoogleDriveIcon className="w-3.5 h-3.5" />
                        <span>Google Drive Acuan Atasan</span>
                        <ExternalLink className="w-3 h-3 text-amber-600" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 1. Status Tindak Lanjut: 3 Elegant Interactive Cards */}
            <div>
              <label className="block font-bold text-slate-800 mb-2 text-[13px] flex items-center justify-between">
                <span>1. Status Tindak Lanjut</span>
                <span className="text-[11px] font-normal text-slate-400">Pilih progres capaian</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Belum Dimulai (PENDING) */}
                <button
                  type="button"
                  onClick={() => setStatus('PENDING')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${status === 'PENDING'
                    ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/30 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/30'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                      <Clock className="w-4 h-4" />
                    </span>
                    {status === 'PENDING' && (
                      <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div className="mt-2.5">
                    <span className="font-bold text-[13px] text-amber-900 block">Belum Dimulai</span>
                    <span className="text-[10.5px] text-amber-700/80 leading-tight block mt-0.5">
                      Dalam tahap persiapan awal
                    </span>
                  </div>
                </button>

                {/* Dalam Proses (IN_PROGRESS) */}
                <button
                  type="button"
                  onClick={() => setStatus('IN_PROGRESS')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${status === 'IN_PROGRESS'
                    ? 'bg-[#E8F5F7] border-[#31889C] ring-2 ring-[#31889C]/30 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-[#31889C]/50 hover:bg-[#F0F8FA]/40'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-lg bg-[#D2EDF2] text-[#215865] flex items-center justify-center font-bold text-xs">
                      <TrendingUp className="w-4 h-4" />
                    </span>
                    {status === 'IN_PROGRESS' && (
                      <span className="w-4 h-4 rounded-full bg-[#31889C] text-white flex items-center justify-center text-[10px] font-bold">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div className="mt-2.5">
                    <span className="font-bold text-[13px] text-[#1E6778] block">Dalam Proses</span>
                    <span className="text-[10.5px] text-[#215865]/80 leading-tight block mt-0.5">
                      Sedang aktif dikerjakan
                    </span>
                  </div>
                </button>

                {/* Selesai (COMPLETED) */}
                <button
                  type="button"
                  onClick={() => setStatus('COMPLETED')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${status === 'COMPLETED'
                    ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/30 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </span>
                    {status === 'COMPLETED' && (
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div className="mt-2.5">
                    <span className="font-bold text-[13px] text-emerald-900 block">Selesai</span>
                    <span className="text-[10.5px] text-emerald-700/80 leading-tight block mt-0.5">
                      Pekerjaan telah rampung
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Completion Banner */}
            {isCompleted && (
              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 flex items-start gap-2 text-[12px] animate-in fade-in">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong>Pekerjaan Selesai:</strong> Sertakan ringkasan hasil penyelesaian dan lampirkan bukti dukung (dokumen atau link Google Drive) agar akuntabilitas tercatat jelas.
                </span>
              </div>
            )}

            {/* 2. Catatan Hasil / Perkembangan */}
            <div>
              <label className="block font-bold text-slate-800 mb-1.5 text-[13px]">
                2. Catatan Hasil / Perkembangan
                {isCompleted && <span className="text-red-500 ml-1">*</span>}
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  isCompleted
                    ? 'Contoh: Telah menyelesaikan draf revisi nota dinas dan menyampaikan kepada Pimpinan Dewan KEK...'
                    : 'Catatan progres pekerjaan, perkembangan koordinasi, atau kendala yang dihadapi...'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#31889C]/30 focus:border-[#31889C] text-slate-800 text-[13px] placeholder:text-slate-400 shadow-2xs leading-relaxed"
              />
            </div>

            {/* 3. Bukti Tindak Lanjut: Berkas Dokumen & Link Drive */}
            <div className="space-y-3.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 text-[13px] flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-[#31889C]" />
                  <span>3. Bukti Kegiatan</span>
                  <span className="text-slate-400 font-normal text-xs">(Opsional)</span>
                </label>
                <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                  Tidak Menimpa Berkas Acuan
                </span>
              </div>
              <p className="text-[11.5px] text-slate-500">
                Unggah file hasil kerja PIC atau masukkan tautan Google Drive sebagai bukti pengerjaan (dokumen acuan penugasan awal tetap aman tersimpan).
              </p>

              {/* Unggah Dokumen Bukti */}
              <div>
                {uploadedDoc ? (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <FileCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{uploadedDoc.name}</p>
                        {uploadedDoc.size && (
                          <span className="text-[10.5px] text-slate-400">
                            {(uploadedDoc.size / (1024 * 1024)).toFixed(2)} MB • Berkas Terlampir
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedDoc(null)}
                      className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <div className="relative border border-dashed border-slate-300 hover:border-[#31889C] rounded-xl p-3.5 text-center transition-all bg-slate-50/60 hover:bg-[#F0F8FA]/30 group cursor-pointer">
                    <input
                      type="file"
                      id="update-progress-doc"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg"
                      onChange={handleDocUpload}
                      disabled={isUploadingDoc}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="flex items-center justify-center gap-2.5 text-xs text-slate-600 pointer-events-none">
                      {isUploadingDoc ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#31889C]" />
                      ) : (
                        <UploadCloud className="w-4 h-4 text-[#31889C] group-hover:scale-110 transition-transform" />
                      )}
                      <span className="font-medium">
                        {isUploadingDoc
                          ? 'Mengunggah Berkas...'
                          : 'Klik untuk unggah dokumen bukti (PDF, Word, Excel, Paparan)'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Tautan Google Drive */}
              <div>
                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://drive.google.com/... atau https://docs.google.com/..."
                    value={driveLink}
                    onChange={(e) => setDriveLink(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#31889C]/30 focus:border-[#31889C] text-slate-800 text-[12.5px] font-mono shadow-2xs"
                  />
                  <div className="absolute left-3 top-3 pointer-events-none">
                    <GoogleDriveIcon className="w-4 h-4" />
                  </div>
                </div>

                {driveLink.trim() && (
                  <div className="mt-2 flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#E8F5F7] border border-[#BCE3EB]">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <GoogleDriveIcon className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[11.5px] text-[#215865] truncate font-mono">
                        {normalizeUrl(driveLink)}
                      </span>
                    </div>
                    <a
                      href={normalizeUrl(driveLink)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#31889C] hover:bg-[#266F80] text-white text-[11px] font-bold shrink-0 transition-colors shadow-2xs cursor-pointer"
                    >
                      <span>Buka Tautan</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#31889C] hover:bg-[#266F80] text-white font-semibold text-[13px] shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Progres &amp; Bukti</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
