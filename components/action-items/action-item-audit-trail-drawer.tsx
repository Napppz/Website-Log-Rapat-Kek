'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  Clock,
  User,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  Loader2,
  AlertCircle,
  FileCheck,
  TrendingUp,
  ShieldCheck,
  Activity,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { ActionItem } from '@/lib/types';
import {
  GoogleDriveIcon,
  GoogleDriveLinkCard,
  extractDriveLink,
  extractAnyLink,
  cleanTextWithoutLink,
  RenderTextWithLinks,
} from './google-drive-link-badge';
import { getActionItemLogsAction } from '@/app/actions/action-item-actions';

interface ActionItemAuditTrailDrawerProps {
  item: ActionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenUpdateProgress?: (item: ActionItem) => void;
  onOpenUpdate?: (item: ActionItem) => void;
  canEdit?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; bullet: string }> = {
  COMPLETED: {
    label: 'Selesai',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    bullet: 'bg-emerald-500 ring-emerald-100',
  },
  IN_PROGRESS: {
    label: 'Dalam Proses',
    bg: 'bg-[#E8F5F7]',
    text: 'text-[#1E6778]',
    border: 'border-[#BCE3EB]',
    bullet: 'bg-[#31889C] ring-[#BCE3EB]',
  },
  PENDING: {
    label: 'Belum Dimulai',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    bullet: 'bg-amber-400 ring-amber-100',
  },
  OVERDUE: {
    label: 'Terlambat',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    bullet: 'bg-rose-500 ring-rose-100',
  },
};

function StatusBadge({ status }: { status: string }) {
  const conf = STATUS_CONFIG[status] || STATUS_CONFIG['PENDING'];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${conf.bg} ${conf.text} ${conf.border}`}
    >
      {conf.label}
    </span>
  );
}

function StatusTransition({ prev, next }: { prev?: string | null; next: string }) {
  if (!prev || prev === next) {
    return <StatusBadge status={next} />;
  }
  return (
    <span className="inline-flex items-center gap-1.5 flex-wrap">
      <StatusBadge status={prev} />
      <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
      <StatusBadge status={next} />
    </span>
  );
}

export function ActionItemAuditTrailDrawer({
  item,
  isOpen,
  onClose,
  onOpenUpdateProgress,
  onOpenUpdate,
  canEdit = true,
}: ActionItemAuditTrailDrawerProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && item?.id) {
      setIsLoading(true);
      getActionItemLogsAction(item.id)
        .then((res) => {
          if (res.success && res.data) {
            setLogs(res.data);
          } else {
            setLogs([]);
          }
        })
        .catch(() => setLogs([]))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, item?.id]);

  if (!isOpen || !item) return null;

  const formatDate = (dateVal: Date | string) => {
    try {
      const d = new Date(dateVal);
      return (
        d.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }) +
        ' • ' +
        d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) +
        ' WIB'
      );
    } catch {
      return String(dateVal);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-150">
      {/* Backdrop overlay outside table */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
        {/* Slide-over panel */}
        <div
          className="w-screen max-w-md sm:max-w-lg bg-white shadow-2xl flex flex-col pointer-events-auto border-l border-slate-200 animate-in slide-in-from-right duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drawer Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-slate-50 via-white to-[#F0F8FA] border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#E8F5F7] text-[#31889C] flex items-center justify-center border border-[#BCE3EB] shrink-0 shadow-2xs">
                <History className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[16px] font-bold text-slate-900">
                    Riwayat Log Aktivitas
                  </h2>
                  {logs.length > 0 && (
                    <span className="px-2 py-0.2 rounded-full bg-[#31889C] text-white text-[10px] font-extrabold">
                      {logs.length}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Audit trail pembaruan status, catatan progres &amp; bukti tindak lanjut
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Context Card: Butir Tindak Lanjut Info */}
          <div className="px-6 py-3.5 bg-[#F8FAFC] border-b border-slate-200/80 shrink-0 text-[12px] space-y-1.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[10.5px] font-bold text-[#1E6B7B] uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#31889C]" />
                <span>Agenda Sumber</span>
              </span>
              {item.meeting && (
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-white border border-[#BCE3EB] text-[#215865] shadow-2xs">
                  {item.meeting.meetingNumber}
                </span>
              )}
            </div>

            <p className="font-bold text-slate-900 text-[13px] leading-snug line-clamp-2">
              {item.title}
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-0.5 text-[11px] text-slate-500">
              {item.picTeam && (
                <span className="font-semibold text-slate-700">
                  {item.picTeam.name}
                </span>
              )}
              {item.picUser && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  {item.picUser.name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {new Date(item.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Drawer Body: Vertical Timeline */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2.5">
                <Loader2 className="w-7 h-7 animate-spin text-[#31889C]" />
                <span className="text-xs font-medium">Memuat kronologi riwayat log...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="py-12 px-4 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 text-slate-500 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-300 flex items-center justify-center mx-auto shadow-2xs">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <p className="text-[13px] font-bold text-slate-700">
                  Belum Ada Riwayat Log
                </p>
                <p className="text-[11.5px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Belum ada catatan progres atau perubahan status yang dicatat untuk tindak lanjut ini.
                </p>
                {canEdit && onOpenUpdateProgress && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenUpdateProgress(item);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#31889C] hover:bg-[#266F80] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer mt-2"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Perbarui Progres Sekarang</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {logs.map((log, idx) => {
                  const driveUrl = extractDriveLink(log.notes) || extractAnyLink(log.notes);
                  const docMatch = log.notes?.match(/📎 Dokumen Terkait:\s*\[([^\]]+)\]\(([^)]+)\)/);
                  let cleanNotes = docMatch
                    ? log.notes.replace(/📎 Dokumen Terkait:\s*\[([^\]]+)\]\(([^)]+)\)/g, '').trim()
                    : log.notes;
                  if (driveUrl) {
                    cleanNotes = cleanTextWithoutLink(cleanNotes);
                  }
                  const conf = STATUS_CONFIG[log.newStatus] || STATUS_CONFIG['PENDING'];
                  const isLatest = idx === 0;

                  return (
                    <div key={log.id} className="relative group">
                      {/* Timeline dot */}
                      <div
                        className={`absolute -left-[27px] top-3.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-2xs ring-2 ${conf.bullet} ${
                          isLatest ? 'scale-125' : ''
                        }`}
                      />

                      {/* Log Card */}
                      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2.5 transition-all hover:border-[#31889C]/50 hover:shadow-xs">
                        {/* Header Row: Status & Timestamp */}
                        <div className="flex items-start justify-between gap-2">
                          <StatusTransition prev={log.previousStatus} next={log.newStatus} />
                          <span className="text-[11px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(log.createdAt)}
                          </span>
                        </div>

                        {/* Author info */}
                        <div className="flex items-center gap-2 pt-0.5 text-[11.5px]">
                          <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {log.user?.name ? log.user.name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-800 truncate block">
                              {log.user?.name || 'Sistem / Notulis'}
                            </span>
                            {log.user?.biro?.shortName && (
                              <span className="text-[10px] text-slate-400 block -mt-0.5">
                                {log.user.biro.shortName}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Notes content */}
                        {cleanNotes && (
                          <div className="text-[12.5px] text-slate-700 leading-relaxed bg-[#F8FAFC] p-3 rounded-xl border border-slate-100 whitespace-pre-wrap">
                            <RenderTextWithLinks text={cleanNotes} />
                          </div>
                        )}

                        {/* Attached Evidence Document */}
                        {docMatch && (
                          <div className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/70 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="font-semibold text-slate-800 truncate">
                                {docMatch[1]}
                              </span>
                            </div>
                            <a
                              href={docMatch[2]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10.5px] hover:bg-emerald-700 transition-colors shrink-0"
                            >
                              <span>Buka Dokumen</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}

                        {/* Attached external link */}
                        {driveUrl && (
                          <div className="pt-0.5">
                            <GoogleDriveLinkCard
                              url={driveUrl}
                              label="Link Hasil Kegiatan"
                              variant="card"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Tutup
            </button>

            {canEdit && (onOpenUpdateProgress || onOpenUpdate) && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (item) {
                    if (onOpenUpdateProgress) onOpenUpdateProgress(item);
                    else if (onOpenUpdate) onOpenUpdate(item);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#31889C] hover:bg-[#266F80] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+ Perbarui Progres &amp; Bukti</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
