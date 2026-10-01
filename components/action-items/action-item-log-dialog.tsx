'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  Send,
  Loader2,
  Calendar,
  Building2,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ExternalLink,
} from 'lucide-react';
import { ActionItem, ActionItemStatus } from '@/lib/types';
import { ActionItemStatusBadge } from './action-item-status-badge';
import {
  GoogleDriveIcon,
  GoogleDriveLinkCard,
  extractDriveLink,
  extractAnyLink,
  cleanTextWithoutLink,
  normalizeUrl,
  RenderTextWithLinks,
} from './google-drive-link-badge';
import {
  getActionItemLogsAction,
  addActionItemLogAction,
} from '@/app/actions/action-item-actions';
import { toast } from '@/components/providers/toast-provider';

interface ActionItemLogDialogProps {
  item: ActionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onItemUpdated?: (updatedItem: any) => void;
}

export function ActionItemLogDialog({
  item,
  isOpen,
  onClose,
  onItemUpdated,
}: ActionItemLogDialogProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [notes, setNotes] = useState('');
  const [driveLink, setDriveLink] = useState('');
  const [progress, setProgress] = useState(
    item?.status === 'COMPLETED' ? 100 : item?.status === 'IN_PROGRESS' ? 50 : 0
  );
  const [selectedStatus, setSelectedStatus] = useState<ActionItemStatus>(
    item?.status || 'PENDING'
  );

  useEffect(() => {
    if (isOpen && item?.id) {
      setSelectedStatus(item.status);
      setProgress(
        item.status === 'COMPLETED' ? 100 : item.status === 'IN_PROGRESS' ? 50 : 0
      );
      setNotes('');
      setDriveLink('');
      fetchLogs(item.id);
    }
  }, [isOpen, item]);

  const fetchLogs = async (itemId: string) => {
    try {
      setIsLoadingLogs(true);
      const res = await getActionItemLogsAction(itemId);
      if (res.success && res.data) {
        setLogs(res.data);
      } else {
        setLogs([]);
      }
    } catch {
      setLogs([]);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      toast.warning('Silakan masukkan catatan progres atau kendala terlebih dahulu.');
      return;
    }

    try {
      setIsSubmitting(true);
      let finalNotes = notes.trim();
      if (driveLink.trim()) {
        const formattedLink = normalizeUrl(driveLink);
        finalNotes = `${finalNotes}\n\n📎 Tautan Google Drive: ${formattedLink}`;
      }

      const res = await addActionItemLogAction({
        actionItemId: item.id,
        notes: finalNotes,
        progress: Number(progress),
        newStatus: selectedStatus,
      });

      if (res.success && res.data) {
        toast.success('Catatan progres & tautan bukti berhasil disimpan.');
        setNotes('');
        setDriveLink('');
        setLogs((prev) => [res.data.log, ...prev]);
        if (onItemUpdated && res.data.updatedItem) {
          onItemUpdated(res.data.updatedItem);
        }
      } else {
        toast.error(res.error || 'Gagal menyimpan catatan progres.');
      }
    } catch (err: any) {
      toast.error(`Terjadi kesalahan: ${err?.message || 'Gagal'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateVal: Date | string) => {
    try {
      const d = new Date(dateVal);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' WIB';
    } catch {
      return String(dateVal);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E8F5F7] text-[#31889C] flex items-center justify-center border border-[#BCE3EB]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-slate-900">
                Riwayat &amp; Catatan Progres Tindak Lanjut
              </h2>
              <p className="text-[12px] text-slate-500">
                Audit trail pelaporan komitmen keputusan dewan KEK
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Item Info Card */}
        <div className="px-6 py-3.5 bg-[#F8FAFC] border-b border-slate-100 text-[12px]">
          <div className="font-bold text-[14px] text-slate-900 leading-snug">
            {item.title}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-slate-600">
            {item.meeting && (
              <span className="flex items-center gap-1 font-mono font-semibold text-[#31889C] bg-[#E8F5F7] px-2 py-0.5 rounded text-[11px]">
                {item.meeting.meetingNumber}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              {item.picBiro?.code || 'Biro'} - {item.picBiro?.shortName}
            </span>
            {item.picUser && (
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {item.picUser.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Tenggat: {new Date(item.dueDate).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <div className="ml-auto">
              <ActionItemStatusBadge
                status={item.status}
                isOverdue={item.isOverdue}
              />
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Form Input Progres Baru */}
          <form
            onSubmit={handleSubmit}
            className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4 text-[13px]"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#31889C]" />
                Tambah Catatan Perkembangan / Kendala
              </span>
              <span className="text-[11px] text-slate-400">
                Pembaruan akan dicatat ke dalam log resmi
              </span>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                Isi Catatan Progres / Hasil Koordinasi Lapangan:
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Telah melakukan koordinasi dengan Kementerian Keuangan mengenai insentif fiskal. Draf aturan pelaksana sedang dalam proses harmonisasi hukum."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#31889C]/20 focus:border-[#31889C] text-[13px] placeholder:text-slate-400"
              />
            </div>

            {/* Google Drive Link Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[12px] font-semibold text-slate-700 flex items-center gap-1.5">
                  <GoogleDriveIcon className="w-3.5 h-3.5" />
                  <span>Tautan Google Drive / Berkas Bukti (Opsional):</span>
                </label>
                <span className="text-[10.5px] text-slate-400">
                  Folder, Dokumen, Spreadsheet, atau Berkas Cloud
                </span>
              </div>
              <div className="relative">
                <input
                  type="url"
                  value={driveLink}
                  onChange={(e) => setDriveLink(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/... atau https://docs.google.com/..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#31889C]/20 focus:border-[#31889C] text-[13px] placeholder:text-slate-400 font-mono"
                />
                <div className="absolute left-3 top-2.5 pointer-events-none">
                  <GoogleDriveIcon className="w-4 h-4" />
                </div>
              </div>
              {driveLink.trim() && (
                <div className="mt-2 flex items-center justify-between gap-2 p-2 rounded-lg bg-[#E8F5F7] border border-[#BCE3EB]">
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
                    title="Buka langsung tautan Google Drive di tab baru"
                  >
                    <span>Uji / Buka Langsung</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              <p className="text-[11px] text-slate-400 mt-1">
                Lampirkan tautan Google Drive untuk membagikan berkas bukti, foto kegiatan, atau dokumen hasil tindak lanjut.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                  Ubah Status Tindak Lanjut:
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    const st = e.target.value as ActionItemStatus;
                    setSelectedStatus(st);
                    if (st === 'COMPLETED') setProgress(100);
                    else if (st === 'PENDING') setProgress(0);
                    else if (progress === 0 || progress === 100) setProgress(50);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#31889C]/20 focus:border-[#31889C] bg-white cursor-pointer text-[13px]"
                >
                  <option value="PENDING">Belum Dimulai (PENDING)</option>
                  <option value="IN_PROGRESS">Sedang Berjalan (IN PROGRESS)</option>
                  <option value="COMPLETED">Selesai (COMPLETED)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[12px] font-semibold text-slate-700">
                    Persentase Capaian:
                  </label>
                  <span className="font-bold text-[#31889C] text-[13px]">
                    {progress}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#31889C]"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    {[25, 50, 75, 100].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setProgress(preset)}
                        className={`px-1.5 py-0.5 text-[10px] rounded font-medium border transition-colors ${
                          progress === preset
                            ? 'bg-[#31889C] text-white border-[#31889C]'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {preset}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#31889C] hover:bg-[#266F80] text-white text-[12px] font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan Log...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Catatan Progres</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Timeline Riwayat Progres */}
          <div>
            <h3 className="text-[14px] font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Kronologi Log Aktivitas &amp; Audit Trail ({logs.length})
            </h3>

            {isLoadingLogs ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#31889C]" />
                <span className="text-[12px]">Memuat kronologi progres...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-[13px] font-medium text-slate-700">
                  Belum ada riwayat catatan progres
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Gunakan formulir di atas untuk mencatat perkembangan tindak lanjut pertama kali.
                </p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {logs.map((log) => (
                  <div key={log.id} className="relative group">
                    {/* Bullet */}
                    <div
                      className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                        log.newStatus === 'COMPLETED'
                          ? 'bg-emerald-500 ring-2 ring-emerald-100'
                          : log.newStatus === 'IN_PROGRESS'
                          ? 'bg-[#31889C] ring-2 ring-sky-100'
                          : 'bg-amber-500 ring-2 ring-amber-100'
                      }`}
                    />

                    {/* Card */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-slate-300 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 text-[12px]">
                            {log.user?.name || 'Sistem / Notulis'}
                          </span>
                          {log.user?.biro?.code && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold text-[10px]">
                              {log.user.biro.code}
                            </span>
                          )}
                        </div>
                        <span className="text-slate-400">
                          {formatDate(log.createdAt)}
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between gap-3 text-[12px]">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-500">
                            Status:
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.newStatus === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : log.newStatus === 'IN_PROGRESS'
                                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {log.newStatus}
                          </span>
                        </div>

                        {log.progress !== null && log.progress !== undefined && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-slate-500">
                              Capaian:
                            </span>
                            <span className="font-bold text-[#31889C] text-[12px]">
                              {log.progress}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar Mini */}
                      {log.progress !== null && log.progress !== undefined && (
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              log.progress === 100
                                ? 'bg-emerald-500'
                                : 'bg-[#31889C]'
                            }`}
                            style={{ width: `${log.progress}%` }}
                          />
                        </div>
                      )}

                      {/* Note & Google Drive Card */}
                      {(() => {
                        const driveUrl = extractDriveLink(log.notes) || extractAnyLink(log.notes);
                        const cleanNotes = driveUrl ? cleanTextWithoutLink(log.notes) : log.notes;

                        return (
                          <div className="mt-3 space-y-2">
                            {cleanNotes ? (
                              <p className="text-[13px] text-slate-700 leading-relaxed bg-[#F8FAFC] p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                                <RenderTextWithLinks text={cleanNotes} />
                              </p>
                            ) : null}

                            {driveUrl ? (
                              <GoogleDriveLinkCard
                                url={driveUrl}
                                label="Dokumen Bukti / Hasil Tindak Lanjut"
                                variant="card"
                              />
                            ) : null}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[12px] font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
