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
  ArrowRight,
  ShieldCheck,
  Activity,
  ChevronDown,
  ChevronUp,
  Info,
  BarChart2,
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
  initialTab?: 'trail' | 'update';
  defaultStatus?: ActionItemStatus;
  defaultProgress?: number;
}

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; bg: string; text: string; border: string }> = {
  COMPLETED:   { label: 'Selesai',       bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-200' },
  IN_PROGRESS: { label: 'Sedang Berjalan', bg: 'bg-sky-50',    text: 'text-sky-700',      border: 'border-sky-200'     },
  PENDING:     { label: 'Belum Dimulai', bg: 'bg-amber-50',   text: 'text-amber-700',    border: 'border-amber-200'   },
  OVERDUE:     { label: 'Terlambat',     bg: 'bg-rose-50',    text: 'text-rose-700',     border: 'border-rose-200'    },
};

const STATUS_BULLET: Record<string, string> = {
  COMPLETED:   'bg-emerald-500 ring-emerald-100',
  IN_PROGRESS: 'bg-[#31889C] ring-sky-100',
  PENDING:     'bg-amber-400 ring-amber-100',
  OVERDUE:     'bg-rose-500 ring-rose-100',
};

const QUICK_NOTE_TEMPLATES = [
  '🎯 Tindak lanjut telah selesai dilaksanakan sesuai arahan rapat.',
  '📄 Draf regulasi/dokumen telah disusun dan siap difinalisasi.',
  '🤝 Sedang berkoordinasi dengan kementerian/biro terkait.',
  '📊 Masih dalam proses penyusunan dan pengumpulan data.',
  '⚠️ Mengalami kendala teknis dalam kelengkapan data dukung.',
];

function StatusPill({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META['PENDING'];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${m.bg} ${m.text} ${m.border}`}
    >
      {m.label}
    </span>
  );
}

function StatusTransitionBadge({ prev, next }: { prev?: string | null; next: string }) {
  if (!prev || prev === next) {
    return <StatusPill status={next} />;
  }
  return (
    <span className="inline-flex items-center gap-1 flex-wrap">
      <StatusPill status={prev} />
      <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
      <StatusPill status={next} />
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ActionItemLogDialog({
  item,
  isOpen,
  onClose,
  onItemUpdated,
  initialTab = 'trail',
  defaultStatus,
  defaultProgress,
}: ActionItemLogDialogProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active tab: 'trail' = read-only audit trail | 'update' = add progress note
  const [activeTab, setActiveTab] = useState<'trail' | 'update'>('trail');

  // Form states
  const [notes, setNotes] = useState('');
  const [driveLink, setDriveLink] = useState('');
  const [progress, setProgress] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<ActionItemStatus>('PENDING');

  // Expand/collapse individual log cards
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && item?.id) {
      const targetSt = defaultStatus || item.status || 'PENDING';
      setSelectedStatus(targetSt);

      let targetProg = 0;
      if (defaultProgress !== undefined) {
        targetProg = defaultProgress;
      } else if (targetSt === 'COMPLETED') {
        targetProg = 100;
      } else if (item.latestProgress !== undefined && item.latestProgress !== null) {
        targetProg = item.latestProgress;
      } else if (targetSt === 'IN_PROGRESS') {
        targetProg = 50;
      } else {
        targetProg = 0;
      }
      setProgress(targetProg);

      setNotes('');
      setDriveLink('');
      setExpandedLogs(new Set());
      setActiveTab(initialTab || 'trail');
      fetchLogs(item.id);
    }
  }, [isOpen, item, initialTab, defaultStatus, defaultProgress]);

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
      if (selectedStatus === 'COMPLETED') {
        toast.warning('Ringkasan hasil penyelesaian wajib diisi saat menandai status Selesai.');
      } else {
        toast.warning('Silakan masukkan catatan progres atau kendala terlebih dahulu.');
      }
      return;
    }

    try {
      setIsSubmitting(true);
      const fullNotes = driveLink.trim()
        ? `${notes.trim()}\n\n${normalizeUrl(driveLink.trim())}`
        : notes.trim();

      const targetProgress = selectedStatus === 'COMPLETED' ? 100 : progress;

      const res = await addActionItemLogAction({
        actionItemId: item.id,
        notes: fullNotes,
        progress: targetProgress,
        newStatus: selectedStatus,
      });

      if (res.success && res.data) {
        setLogs((prev) => [res.data.log, ...prev]);
        setNotes('');
        setDriveLink('');
        setActiveTab('trail');
        toast.success(
          selectedStatus === 'COMPLETED'
            ? 'Tindak lanjut ditandai Selesai & dicatat ke audit trail.'
            : 'Catatan progres berhasil disimpan ke audit trail.'
        );
        if (onItemUpdated) {
          onItemUpdated(res.data.updatedItem);
        }
      } else {
        toast.error(res.error || 'Gagal menyimpan catatan progres.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateVal: Date | string) => {
    try {
      const d = new Date(dateVal);
      return (
        d.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }) +
        ', ' +
        d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) +
        ' WIB'
      );
    } catch {
      return String(dateVal);
    }
  };

  // ── Audit trail statistics ────────────────────────────────────────────────
  const totalLogs = logs.length;
  const uniqueUsers = new Set(logs.map((l) => l.user?.name).filter(Boolean)).size;
  const lastEntry = logs[0]; // desc-sorted
  const progressValues = logs.map((l) => l.progress).filter((p) => p !== null && p !== undefined);
  const latestProgress = progressValues.length > 0 ? progressValues[0] : null;

  // Count status transitions
  const transitions = logs.filter((l) => l.previousStatus && l.previousStatus !== l.newStatus).length;

  const toggleExpandLog = (id: string) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-[#F0F9FA] to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E8F5F7] text-[#31889C] flex items-center justify-center border border-[#BCE3EB] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-slate-900">
                Audit Trail Tindak Lanjut
              </h2>
              <p className="text-[11px] text-slate-500">
                Riwayat lengkap perubahan status, catatan progres &amp; bukti pelaksanaan
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

        {/* ── Action Item Summary Card ────────────────────────────────────── */}
        <div className="px-6 py-3.5 bg-[#F8FAFC] border-b border-slate-100 text-[12px]">
          <div className="font-bold text-[14px] text-slate-900 leading-snug">{item.title}</div>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-slate-600">
            {item.meeting && (
              <span className="flex items-center gap-1 font-mono font-semibold text-[#31889C] bg-[#E8F5F7] px-2 py-0.5 rounded text-[11px]">
                {item.meeting.meetingNumber}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              {item.picBiro?.code || 'Biro'} — {item.picBiro?.shortName}
            </span>
            {item.picUser && (
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {item.picUser.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Tenggat:{' '}
              {new Date(item.dueDate).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <div className="ml-auto">
              <ActionItemStatusBadge status={item.status} isOverdue={item.isOverdue} />
            </div>
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div className="flex border-b border-slate-200 px-6 bg-white shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('trail')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'trail'
                ? 'border-[#31889C] text-[#31889C]'
                : 'border-transparent text-slate-500 hover:text-[#31889C]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Audit Trail
            {totalLogs > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#31889C] text-white text-[10px] font-bold">
                {totalLogs}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('update')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'update'
                ? 'border-[#31889C] text-[#31889C]'
                : 'border-transparent text-slate-500 hover:text-[#31889C]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Tambah Catatan
          </button>
        </div>

        {/* ── Content Body ─────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {/* ── TAB: AUDIT TRAIL ──────────────────────────────────────────── */}
          {activeTab === 'trail' && (
            <div className="p-6 space-y-5">
              {/* Stats strip */}
              {totalLogs > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-[#F0F9FA] border border-[#BCE3EB] text-center">
                    <div className="text-[10px] font-bold uppercase text-[#31889C] mb-0.5">Total Entri</div>
                    <div className="text-[22px] font-black text-[#215865]">{totalLogs}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <div className="text-[10px] font-bold uppercase text-slate-500 mb-0.5">Kontributor</div>
                    <div className="text-[22px] font-black text-slate-700">{uniqueUsers}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                    <div className="text-[10px] font-bold uppercase text-amber-700 mb-0.5">Transisi Status</div>
                    <div className="text-[22px] font-black text-amber-700">{transitions}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                    <div className="text-[10px] font-bold uppercase text-emerald-700 mb-0.5">Capaian Terkini</div>
                    <div className="text-[22px] font-black text-emerald-700">
                      {latestProgress !== null ? `${latestProgress}%` : '—'}
                    </div>
                  </div>
                </div>
              )}

              {/* Last updated by */}
              {lastEntry && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F0F9FA] border border-[#BCE3EB] text-[12px]">
                  <Activity className="w-3.5 h-3.5 text-[#31889C] shrink-0" />
                  <span className="text-slate-600">
                    Pembaruan terakhir oleh{' '}
                    <span className="font-bold text-slate-800">
                      {lastEntry.user?.name || 'Sistem / Notulis'}
                    </span>
                    {lastEntry.user?.biro?.code && (
                      <span className="ml-1 px-1 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold text-[10px]">
                        {lastEntry.user.biro.code}
                      </span>
                    )}{' '}
                    — {formatDate(lastEntry.createdAt)}
                  </span>
                </div>
              )}

              {/* Timeline */}
              {isLoadingLogs ? (
                <div className="py-10 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#31889C]" />
                  <span className="text-[12px]">Memuat kronologi audit trail...</span>
                </div>
              ) : logs.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-[13px] font-medium text-slate-700">
                    Belum ada riwayat catatan progres
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Klik tab{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('update')}
                      className="text-[#31889C] font-semibold underline cursor-pointer"
                    >
                      Tambah Catatan
                    </button>{' '}
                    untuk mencatat perkembangan pertama kali.
                  </p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {logs.map((log, idx) => {
                    const isExpanded = expandedLogs.has(log.id);
                    const driveUrl = extractDriveLink(log.notes) || extractAnyLink(log.notes);
                    const cleanNotes = driveUrl ? cleanTextWithoutLink(log.notes) : log.notes;
                    const isStatusChange = log.previousStatus && log.previousStatus !== log.newStatus;
                    const isLatest = idx === 0;

                    return (
                      <div key={log.id} className="relative group">
                        {/* Timeline bullet */}
                        <div
                          className={`absolute -left-[27px] top-3 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ring-2 ${
                            STATUS_BULLET[log.newStatus] ?? 'bg-slate-400 ring-slate-100'
                          } ${isLatest ? 'scale-125' : ''}`}
                        />

                        {/* Log card */}
                        <div
                          className={`rounded-xl border bg-white shadow-2xs transition-all ${
                            isLatest
                              ? 'border-[#BCE3EB] ring-1 ring-[#31889C]/20'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {/* Card header (always visible) */}
                          <div
                            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 cursor-pointer select-none"
                            onClick={() => toggleExpandLog(log.id)}
                          >
                            <div className="flex flex-wrap items-center gap-2 text-[11px]">
                              {/* Entry number */}
                              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 font-bold text-[10px] flex items-center justify-center shrink-0">
                                {totalLogs - idx}
                              </span>
                              {isLatest && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#31889C] text-white uppercase tracking-wide">
                                  Terbaru
                                </span>
                              )}
                              {isStatusChange && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-wide">
                                  ⚡ Status Berubah
                                </span>
                              )}
                              <StatusTransitionBadge
                                prev={log.previousStatus}
                                next={log.newStatus}
                              />
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                              <span className="font-bold text-slate-700">
                                {log.user?.name || 'Sistem'}
                              </span>
                              {log.user?.biro?.code && (
                                <span className="px-1 py-0.5 rounded bg-slate-100 text-[10px] font-semibold text-slate-600">
                                  {log.user.biro.code}
                                </span>
                              )}
                              <span className="text-slate-400 hidden sm:inline">
                                {formatDate(log.createdAt)}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </div>
                          </div>

                          {/* Mobile timestamp */}
                          <div className="sm:hidden px-4 pb-1 text-[10px] text-slate-400">
                            {formatDate(log.createdAt)}
                          </div>

                          {/* Progress bar mini (always visible) */}
                          {log.progress !== null && log.progress !== undefined && (
                            <div className="px-4 pb-2 flex items-center gap-2">
                              <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    log.progress === 100 ? 'bg-emerald-500' : 'bg-[#31889C]'
                                  }`}
                                  style={{ width: `${log.progress}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-bold text-[#31889C] shrink-0 w-9 text-right">
                                {log.progress}%
                              </span>
                            </div>
                          )}

                          {/* Expanded detail */}
                          {isExpanded && (
                            <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3">
                              {/* Notes */}
                              {cleanNotes && (
                                <div>
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                                    <Info className="w-3 h-3" />
                                    Catatan Progres
                                  </div>
                                  <p className="text-[13px] text-slate-700 leading-relaxed bg-[#F8FAFC] p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                                    <RenderTextWithLinks text={cleanNotes} />
                                  </p>
                                </div>
                              )}

                              {/* Drive link */}
                              {driveUrl && (
                                <div>
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                                    <GoogleDriveIcon className="w-3 h-3" />
                                    Dokumen Bukti
                                  </div>
                                  <GoogleDriveLinkCard
                                    url={driveUrl}
                                    label="Dokumen Bukti / Hasil Tindak Lanjut"
                                    variant="card"
                                  />
                                </div>
                              )}

                              {/* Metadata grid */}
                              <div className="grid grid-cols-2 gap-2 text-[11px]">
                                {log.user?.role && (
                                  <div className="flex items-center gap-1.5 text-slate-500">
                                    <ShieldCheck className="w-3 h-3 text-slate-400" />
                                    <span>
                                      Role:{' '}
                                      <span className="font-semibold text-slate-700">
                                        {log.user.role}
                                      </span>
                                    </span>
                                  </div>
                                )}
                                {log.user?.biro?.name && (
                                  <div className="flex items-center gap-1.5 text-slate-500">
                                    <Building2 className="w-3 h-3 text-slate-400" />
                                    <span className="truncate">{log.user.biro.name}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5 text-slate-500 col-span-2">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>
                                    Waktu dicatat:{' '}
                                    <span className="font-semibold text-slate-700">
                                      {formatDate(log.createdAt)}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: ADD UPDATE ─────────────────────────────────────────────── */}
          {activeTab === 'update' && (
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Header */}
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#31889C]" />
                  <span className="font-bold text-slate-900 text-[14px]">
                    Tambah Catatan Progres / Bukti Pelaksanaan
                  </span>
                </div>
                <p className="text-[12px] text-slate-500 -mt-2">
                  Setiap catatan yang dikirim akan tercatat permanen ke dalam audit trail resmi.
                </p>

                {/* Completion Guidance Banner */}
                {selectedStatus === 'COMPLETED' && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12px] animate-in fade-in duration-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Menandai Tindak Lanjut Selesai:</span>
                      <p className="text-[11.5px] text-emerald-700 mt-0.5 leading-relaxed">
                        Mohon sertakan ringkasan hasil penyelesaian dan tautan bukti Google Drive agar akuntabilitas pelaksanaan tercatat dengan jelas dalam arsip resmi KEK RI.
                      </p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                    Isi Catatan Progres / Kendala:
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={
                      selectedStatus === 'COMPLETED'
                        ? 'Contoh: Telah menyelesaikan penyusunan nota dinas No. ND-12/KEK/2026 dan menyampaikan kepada pimpinan biro terkait.'
                        : 'Contoh: Telah melakukan koordinasi dengan kementerian terkait. Draf kebijakan sedang dalam proses penelaahan hukum.'
                    }
                    rows={4}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#31889C]/20 focus:border-[#31889C] text-[13px] placeholder:text-slate-400 resize-none"
                  />
                  {/* Quick Note Templates */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10.5px] text-slate-400 font-medium mr-0.5">Templat Cepat:</span>
                    {QUICK_NOTE_TEMPLATES.map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNotes((prev) => (prev ? `${prev}\n${tmpl}` : tmpl))}
                        className="px-2 py-0.5 rounded-md bg-slate-50 hover:bg-[#E8F5F7] hover:text-[#215865] hover:border-[#BCE3EB] text-slate-600 text-[11px] font-medium transition-colors cursor-pointer border border-slate-200"
                      >
                        {tmpl.split(' ')[0]} {tmpl.slice(tmpl.indexOf(' ') + 1, tmpl.indexOf(' ') + 22)}...
                      </button>
                    ))}
                  </div>
                </div>

                {/* Google Drive Link */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[12px] font-semibold text-slate-700 flex items-center gap-1.5">
                      <GoogleDriveIcon className="w-3.5 h-3.5" />
                      <span>Tautan Bukti Google Drive (Opsional):</span>
                    </label>
                    <span className="text-[10.5px] text-slate-400">Folder, Dokumen, Spreadsheet</span>
                  </div>
                  <div className="relative">
                    <input
                      type="url"
                      value={driveLink}
                      onChange={(e) => setDriveLink(e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/..."
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
                        <span>Uji / Buka</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Status + Progress */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
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
                    {/* Current → new preview */}
                    {item.status !== selectedStatus && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span>Transisi:</span>
                        <StatusTransitionBadge prev={item.status} next={selectedStatus} />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[12px] font-semibold text-slate-700">
                        Persentase Capaian:
                      </label>
                      <span className="font-black text-[#31889C] text-[14px]">{progress}%</span>
                    </div>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={progress}
                        onChange={(e) => setProgress(Number(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#31889C]"
                      />
                      <div className="flex items-center gap-1 justify-end">
                        {[0, 25, 50, 75, 100].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setProgress(preset)}
                            className={`px-1.5 py-0.5 text-[10px] rounded font-bold border transition-colors ${
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

                {/* Submit */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <p className="text-[11px] text-slate-400">
                    Catatan ini tidak dapat dihapus setelah disimpan.
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-[12px] font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 ${
                      selectedStatus === 'COMPLETED'
                        ? 'bg-[#4D8F3D] hover:bg-[#3F7532] shadow-emerald-500/20'
                        : 'bg-[#31889C] hover:bg-[#266F80] shadow-sky-500/20'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : selectedStatus === 'COMPLETED' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Simpan Capaian &amp; Tandai Selesai</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Simpan Catatan &amp; Update Progres</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Data audit trail terenkripsi &amp; tercatat permanen
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[12px] font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
