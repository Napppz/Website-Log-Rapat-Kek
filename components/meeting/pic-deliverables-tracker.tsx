'use client';

import React, { useState } from 'react';
import {
  FileCheck,
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertCircle,
  Link2,
  ExternalLink,
  Download,
  FileText,
  Plus,
  Edit3,
  History,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Users,
  Paperclip,
  Check,
  Calendar,
  Trash2,
  Share2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { toast } from '@/components/providers/toast-provider';
import { deletePicDeliverableAction } from '@/app/actions/pic-deliverable-actions';
import {
  parsePicDeliverableDescription,
  PicDeliverableParsedData,
} from '@/lib/pic-deliverables';
import { UpdatePicDeliverableDialog } from './update-pic-deliverable-dialog';
import { AddPicDeliverableDialog } from './add-pic-deliverable-dialog';

interface PicDeliverablesTrackerProps {
  meetingId: string;
  meetingTitle: string;
  meetingDate?: string | Date;
  actionItems: any[];
  participants?: any[];
  availableUsers?: any[];
  canEdit?: boolean;
  onRefresh?: () => void;
}

export function PicDeliverablesTracker({
  meetingId,
  meetingTitle,
  meetingDate,
  actionItems = [],
  participants = [],
  availableUsers = [],
  canEdit = true,
  onRefresh,
}: PicDeliverablesTrackerProps) {
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
  const currentUserRole = (session?.user as any)?.role;

  const [selectedForUpdate, setSelectedForUpdate] = useState<any | null>(null);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter or prioritize items that are PIC deliverables
  const deliverables = actionItems;

  // Calculate metrics
  const totalCount = deliverables.length;
  const completedCount = deliverables.filter((d) => d.status === 'COMPLETED').length;
  const inProgressCount = deliverables.filter((d) => d.status !== 'COMPLETED').length;

  const toggleLogs = (id: string) => {
    setExpandedLogs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenUpdate = (item: any) => {
    setSelectedForUpdate(item);
    setIsUpdateOpen(true);
  };

  const handleDeleteDeliverable = async (id: string, title: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus penugasan "${title}"?`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await deletePicDeliverableAction(id);
      if (res.success) {
        toast.success(`Penugasan "${title}" berhasil dihapus.`);
        onRefresh?.();
      } else {
        toast.error(res.error || 'Gagal menghapus penugasan.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
      {/* Executive Header Banner */}
      <div className="bg-gradient-to-r from-[#175360] via-[#1E6B7B] to-[#2B7F91] p-5 sm:p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-teal-100 tracking-wide uppercase">
              Pelaksanaan &amp; Output
            </span>
            <span className="text-xs text-teal-100/70">
              Pelaporan Kegiatan PIC
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-300" />
            <span>Detail Kegiatan</span>
          </h3>
          <p className="text-xs sm:text-[13px] text-teal-100/90 max-w-2xl leading-relaxed">
            Rincian penugasan PIC, berkas lampiran pendukung, serta catatan tindak lanjut hasil kegiatan.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0 flex-wrap">
          {canEdit && (
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Pilih &amp; Tambah Tugas PIC</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-bold">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10.5px] uppercase font-bold text-slate-400">Total Output PIC</div>
            <div className="text-sm font-bold text-slate-800">{totalCount} Penugasan</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10.5px] uppercase font-bold text-slate-400">Dalam Proses</div>
            <div className="text-sm font-bold text-amber-700">{inProgressCount} Dikerjakan</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10.5px] uppercase font-bold text-slate-400">Selesai</div>
            <div className="text-sm font-bold text-emerald-700">{completedCount} Tuntas</div>
          </div>
        </div>
      </div>

      {/* List of PIC Deliverable Cards */}
      <div className="p-5 sm:p-6 space-y-4">
        {deliverables.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1E6B7B]/10 text-[#1E6B7B] flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h4 className="font-bold text-slate-800 text-sm">
                Belum Ada Penugasan Tugas PIC yang Ditentukan
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Catatan kegiatan telah disimpan. Tugas belum dibebankan secara otomatis kepada PIC. Silakan pilih PIC dan tentukan tugas yang sesuai untuk mereka.
              </p>
            </div>
            {canEdit && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E6B7B] hover:bg-[#175360] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Pilih &amp; Tentukan Tugas PIC</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {deliverables.map((item) => {
              const parsed: PicDeliverableParsedData = parsePicDeliverableDescription(
                item.description
              );
              const latestLog = item.logs?.[0];
              const isCompleted = item.status === 'COMPLETED';
              const isPending = item.status === 'PENDING';
              const isInProgress = !isCompleted && !isPending;

              const isPicOwner =
                currentUserId && item.picUserId && currentUserId === item.picUserId;
              const isPrivileged =
                currentUserRole === 'SUPER_ADMIN' ||
                currentUserRole === 'ADMIN' ||
                currentUserRole === 'PIMPINAN';
              const canUserUpdate = (isPicOwner || isPrivileged) && canEdit;

              const isLogExpanded = !!expandedLogs[item.id];

              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-2xl border transition-all duration-200 bg-white overflow-hidden shadow-xs hover:shadow-md",
                    isCompleted
                      ? "border-emerald-200 border-l-4 border-l-emerald-600"
                      : isPending
                      ? "border-slate-200 border-l-4 border-l-slate-400"
                      : "border-amber-200 border-l-4 border-l-amber-500"
                  )}
                >
                  <div className="p-5 sm:p-5.5 space-y-4">
                    {/* Top Row: PIC Identity & Status Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* PIC Avatar */}
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border",
                            isCompleted
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : isPending
                              ? "bg-slate-100 text-slate-700 border-slate-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          )}
                        >
                          {item.picUser?.name ? (
                            item.picUser.name
                              .split(' ')
                              .map((n: string) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()
                          ) : (
                            <Users className="w-5 h-5" />
                          )}
                        </div>

                        {/* PIC Info */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-slate-900 text-[14.5px] truncate">
                              {item.picUser?.name || 'PIC Belum Ditentukan'}
                            </h4>
                            {item.picTeam && (
                              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                {item.picTeam.name || item.picTeam.code}
                              </span>
                            )}
                            {item.priority && (
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-bold",
                                  item.priority === 'URGENT'
                                    ? "bg-rose-100 text-rose-800"
                                    : item.priority === 'HIGH'
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-slate-100 text-slate-600"
                                )}
                              >
                                Prioritas {item.priority}
                              </span>
                            )}
                          </div>
                          <p className="text-[11.5px] text-slate-500 mt-0.5 truncate">
                            {item.picUser?.email || 'Staf Pelaksana Teknis'}
                          </p>
                        </div>
                      </div>

                      {/* Status & Update Action Button */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border",
                            isCompleted
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : isPending
                              ? "bg-slate-100 text-slate-700 border-slate-300"
                              : "bg-amber-50 text-amber-800 border-amber-300"
                          )}
                        >
                          {isCompleted ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Selesai</span>
                            </>
                          ) : isPending ? (
                            <>
                              <PlayCircle className="w-3.5 h-3.5 text-slate-600" />
                              <span>Belum Dimulai</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Dalam Proses</span>
                            </>
                          )}
                        </span>

                        {canUserUpdate && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenUpdate(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E6B7B] hover:bg-[#164E59] text-white text-xs font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Perbarui Status &amp; Output</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDeliverable(item.id, item.title)}
                              disabled={deletingId === item.id}
                              className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Hapus penugasan tugas ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Deliverable Title & Due Date */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h5 className="font-bold text-slate-800 text-[14px]">
                        {item.title}
                      </h5>
                      {item.dueDate && (
                        <span className="text-[11.5px] text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            Tenggat:{' '}
                            {new Date(item.dueDate).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Hasil Kegiatan: Catatan atau Tautan */}
                    {(parsed.notes || latestLog?.notes) && (
                      <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-1 text-xs">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                          <span className="flex items-center gap-1 text-slate-700 uppercase tracking-wider">
                            <FileText className="w-3.5 h-3.5 text-[#1E6B7B]" />
                            <span>Catatan Hasil Kegiatan PIC:</span>
                          </span>
                          {parsed.updatedAt && (
                            <span className="text-slate-400 font-normal">
                              {new Date(parsed.updatedAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-800 text-[12.5px] leading-relaxed whitespace-pre-wrap font-medium">
                          {parsed.notes || latestLog?.notes}
                        </p>
                      </div>
                    )}

                    {/* Action Links & Files Ribbon */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      {/* CLICKABLE LINK BUTTON(S) */}
                      {parsed.links && parsed.links.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2">
                          {parsed.links.map((link, lIdx) => (
                            <a
                              key={link.url + lIdx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 hover:from-emerald-700 hover:to-teal-900 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all group cursor-pointer"
                              title={`Buka Tautan: ${link.url}`}
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-emerald-200 group-hover:scale-110 transition-transform shrink-0" />
                              <span className="truncate max-w-[240px] sm:max-w-[320px]">
                                {link.title || (parsed.links && parsed.links.length > 1 ? `Tautan #${lIdx + 1}` : 'Buka Tautan Hasil Kegiatan')}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white font-mono uppercase tracking-wider shrink-0">
                                Buka ↗
                              </span>
                            </a>
                          ))}
                        </div>
                      ) : parsed.linkUrl ? (
                        <a
                          href={parsed.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 hover:from-emerald-700 hover:to-teal-900 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all group cursor-pointer"
                          title={`Buka Tautan: ${parsed.linkUrl}`}
                        >
                          <ExternalLink className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform shrink-0" />
                          <span className="truncate max-w-[280px] sm:max-w-[360px]">
                            {parsed.linkTitle || 'Buka Tautan Hasil Kegiatan'}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-mono uppercase tracking-wider shrink-0">
                            Buka URL ↗
                          </span>
                        </a>
                      ) : !parsed.notes && !latestLog?.notes && !parsed.fileUrl ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 text-xs italic">
                          <Link2 className="w-3.5 h-3.5" />
                          <span>Belum ada catatan atau tautan hasil yang diisi</span>
                        </div>
                      ) : null}

                      {/* PHYSICAL ATTACHED FILE (IF ANY PREVIOUS FILE) */}
                      {parsed.fileUrl && (
                        <a
                          href={parsed.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition-colors shadow-2xs group cursor-pointer"
                          title="Unduh / Lihat Berkas Fisik"
                        >
                          <Download className="w-3.5 h-3.5 text-[#1E6B7B] group-hover:translate-y-0.5 transition-transform shrink-0" />
                          <span className="truncate max-w-[220px]">
                            {parsed.fileName || 'Berkas Output'}
                          </span>
                          {parsed.fileSize && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              ({(parsed.fileSize / (1024 * 1024)).toFixed(1)} MB)
                            </span>
                          )}
                        </a>
                      )}

                      {/* AUDIT LOG TOGGLE BUTTON */}
                      {Array.isArray(item.logs) && item.logs.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleLogs(item.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-colors ml-auto cursor-pointer"
                        >
                          <History className="w-3.5 h-3.5 text-slate-500" />
                          <span>Riwayat Pembaruan ({item.logs.length})</span>
                          {isLogExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Expandable Audit Log Timeline */}
                    {isLogExpanded && Array.isArray(item.logs) && item.logs.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 space-y-2.5 animate-in fade-in-50 duration-200">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Catatan Riwayat Pembaruan:
                        </span>
                        <div className="space-y-2">
                          {item.logs.map((log: any, idx: number) => (
                            <div
                              key={log.id || idx}
                              className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-700">
                                  {log.user?.name || 'PIC / Staf'}
                                </span>
                                <span className="text-slate-400">
                                  {new Date(log.createdAt).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })} WIB
                                </span>
                              </div>
                              <p className="text-slate-600 text-[12px]">{log.notes}</p>
                              <div className="flex items-center gap-2 pt-0.5">
                                <span
                                  className={cn(
                                    "text-[10.5px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border",
                                    log.newStatus === 'COMPLETED' || log.newStatus === 'Selesai'
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                      : "bg-amber-50 text-amber-800 border-amber-200"
                                  )}
                                >
                                  {log.newStatus === 'COMPLETED' || log.newStatus === 'Selesai' ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>Selesai</span>
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3 h-3 text-amber-600" />
                                      <span>Dalam Proses</span>
                                    </>
                                  )}
                                </span>
                              </div>
                            </div>
                          ))}
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

      {/* Dialog Modals */}
      {isUpdateOpen && selectedForUpdate && (
        <UpdatePicDeliverableDialog
          isOpen={isUpdateOpen}
          onClose={() => {
            setIsUpdateOpen(false);
            setSelectedForUpdate(null);
          }}
          deliverable={selectedForUpdate}
          meetingTitle={meetingTitle}
          onSuccess={onRefresh}
        />
      )}

      {isAddOpen && (
        <AddPicDeliverableDialog
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          meetingId={meetingId}
          meetingTitle={meetingTitle}
          meetingDate={meetingDate}
          participants={participants}
          availableUsers={availableUsers}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
}
