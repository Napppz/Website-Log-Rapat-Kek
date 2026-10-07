'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Users,
  FileText,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Layers,
  CheckSquare,
  FileDown,
  Loader2,
  Paperclip,
  Video,
} from 'lucide-react';
import { Meeting, MeetingStatus } from '@/lib/types';
import { MeetingStatusBadge, MeetingProgressBadge } from './meeting-status-badge';
import { normalizeProgressStatus, mapStatusToProgress } from '@/lib/meeting-status';
import { ActionItemProgress } from '../action-items/action-item-progress';
import { MeetingMinutesSection } from './meeting-minutes/meeting-minutes-section';
import { ActionItemList } from '../action-items/action-item-list';
import { getActionItemsAction, getActionItemFormOptionsAction } from '@/app/actions/action-item-actions';
import { useSession } from 'next-auth/react';
import { toast, confirmModal } from '@/components/providers/toast-provider';
import { GoogleCalendarModal } from './google-calendar-modal';
import { extractVirtualMeetingDetails } from '@/lib/calendar';
import { cn } from '@/lib/utils';

interface MeetingDetailDialogProps {
  meeting: Meeting | null;
  onClose: () => void;
  onDownloadPdf?: (meeting: Meeting) => void;
  onMeetingUpdated?: () => void;
  onOpenSeriesModal?: (meetingId: string) => void;
}

export function MeetingDetailDialog({
  meeting,
  onClose,
  onDownloadPdf,
  onMeetingUpdated,
  onOpenSeriesModal,
}: MeetingDetailDialogProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'STAFF';
  const canDeleteMeeting = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
  const isPrivileged = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
  const isMeetingBiro =
    isPrivileged ||
    (session?.user?.biroCode &&
      meeting?.biroCode &&
      session.user.biroCode.toUpperCase() === meeting.biroCode.toUpperCase());
  const canChangeStatus = isPrivileged || (userRole === 'STAFF' && Boolean(isMeetingBiro));

  const [activeTab, setActiveTab] = useState<'info' | 'participants' | 'minutes' | 'actionItems'>('info');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [availableBiros, setAvailableBiros] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const handleExportPdf = async (type: 'notula' | 'nota-dinas' = 'notula') => {
    if (!meeting?.id) return;
    try {
      setIsExporting(true);
      const res = await fetch(`/api/meetings/${meeting.id}/pdf?type=${type}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || 'Gagal mengunduh dokumen PDF.');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = type === 'nota-dinas'
        ? `Nota-Dinas-${meeting.code || 'KEK'}.pdf`
        : `Risalah-Rapat-${meeting.code || 'KEK'}.pdf`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success(
        type === 'nota-dinas'
          ? `Nota Dinas rapat ${meeting.code || 'KEK'} berhasil diunduh (PDF).`
          : `Risalah rapat ${meeting.code || 'KEK'} berhasil diunduh (PDF).`
      );
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan saat mengunduh PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDocx = async (type: 'notula' | 'nota-dinas' = 'notula') => {
    if (!meeting?.id) return;
    try {
      setIsExportingDocx(true);
      const res = await fetch(`/api/meetings/${meeting.id}/docx?type=${type}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || 'Gagal mengunduh dokumen Word (.docx).');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanCode = (meeting.code || 'KEK').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.download = type === 'nota-dinas'
        ? `Nota-Dinas-${cleanCode}.docx`
        : `Risalah-Rapat-${cleanCode}.docx`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success(
        type === 'nota-dinas'
          ? `Nota Dinas rapat ${meeting.code || 'KEK'} berhasil diunduh (Word .docx).`
          : `Risalah rapat ${meeting.code || 'KEK'} berhasil diunduh (Word .docx).`
      );
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan saat mengunduh Word.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'actionItems' && meeting?.id) {
      setIsLoadingItems(true);
      Promise.all([
        getActionItemsAction(meeting.id),
        getActionItemFormOptionsAction(),
      ])
        .then(([itemsRes, optRes]) => {
          if (itemsRes.success && itemsRes.data) {
            setActionItems(itemsRes.data);
          }
          if (optRes.success) {
            if (optRes.biros) setAvailableBiros(optRes.biros);
            if (optRes.users) setAvailableUsers(optRes.users);
          }
        })
        .finally(() => {
          setIsLoadingItems(false);
        });
    }
  }, [activeTab, meeting?.id]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (meeting) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [meeting, onClose]);

  // Reset tab when new meeting is selected
  useEffect(() => {
    if (meeting) {
      setActiveTab('info');
    }
  }, [meeting?.id]);

  if (!meeting) return null;

  const handleDelete = async () => {
    const confirmed = await confirmModal({
      title: `Hapus Rapat ${meeting.code}?`,
      message: `Apakah Anda yakin ingin menghapus rapat "${meeting.title}" dari database?`,
      confirmText: 'Ya, Hapus Rapat',
      variant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);
      const { deleteMeetingAction } = await import('@/app/actions/meeting-actions');
      const res = await deleteMeetingAction(meeting.id);
      if (res.success) {
        toast.success(`Rapat ${meeting.code} berhasil dihapus dari database.`);
        onClose();
        if (onMeetingUpdated) {
          onMeetingUpdated();
        } else {
          router.refresh();
        }
      } else {
        toast.error(res.error || 'Gagal menghapus rapat');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menghapus rapat');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setIsUpdatingStatus(true);
      const { updateMeetingStatusAction } = await import('@/app/actions/meeting-actions');
      const res = await updateMeetingStatusAction(meeting.id, newStatus);
      if (res.success) {
        toast.success(`Status rapat ${meeting.code} berhasil diubah ke "${newStatus}".`);
        onClose();
        if (onMeetingUpdated) {
          onMeetingUpdated();
        } else {
          router.refresh();
        }
      } else {
        toast.error(res.error || 'Gagal memperbarui status');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memperbarui status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl lg:max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F8FAFC] border-b border-slate-200">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[16px] text-[#215865] bg-[#E8F5F7] px-2.5 py-1 rounded-md border border-[#BCE3EB]">
              {meeting.code}
            </span>
            <MeetingProgressBadge
              progressStatus={meeting.progressStatus}
              status={meeting.status}
              isNew={meeting.isNew}
              showSubtitle
            />
          </div>

          <div className="flex items-center gap-2">
            {onOpenSeriesModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSeriesModal(meeting.id);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-semibold text-[#215865] bg-[#E8F5F7] hover:bg-[#BCE3EB] transition-colors cursor-pointer"
                title="Lihat Linimasa Semua Rapat Terkait Agenda Ini"
              >
                <Layers className="w-3.5 h-3.5 text-[#31889C]" />
                <span>Rangkaian Agenda</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowCalendarModal(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer shadow-2xs"
              title="Tambah ke Google Calendar & Bagikan ke Peserta"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Google Kalender</span>
            </button>

            <Link
              href={`/semua-rapat/${meeting.id}`}
              onClick={onClose}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[12px] font-semibold text-[#215865] bg-[#E8F5F7] hover:bg-[#BCE3EB] transition-colors"
              title="Buka Halaman Rapat Penuh"
            >
              <span>Halaman Penuh</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation in Dialog */}
        <div className="flex items-center gap-2 px-6 border-b border-slate-200 bg-[#F8FAFC]">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-1.5 py-2.5 px-3 font-bold text-[12px] border-b-2 transition-all cursor-pointer ${
              activeTab === 'info'
                ? 'border-[#31889C] text-[#31889C] bg-white rounded-t-md'
                : 'border-transparent text-slate-600 hover:text-[#31889C]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Informasi Rapat</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('participants')}
            className={`flex items-center gap-1.5 py-2.5 px-3 font-bold text-[12px] border-b-2 transition-all cursor-pointer ${
              activeTab === 'participants'
                ? 'border-[#31889C] text-[#31889C] bg-white rounded-t-md'
                : 'border-transparent text-slate-600 hover:text-[#31889C]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Peserta ({meeting.attendees?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('minutes')}
            className={`flex items-center gap-1.5 py-2.5 px-3 font-bold text-[12px] border-b-2 transition-all cursor-pointer ${
              activeTab === 'minutes'
                ? 'border-[#31889C] text-[#31889C] bg-white rounded-t-md'
                : 'border-transparent text-slate-600 hover:text-[#31889C]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Notulen / Nota Dinas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('actionItems')}
            className={`flex items-center gap-1.5 py-2.5 px-3 font-bold text-[12px] border-b-2 transition-all cursor-pointer ${
              activeTab === 'actionItems'
                ? 'border-[#31889C] text-[#31889C] bg-white rounded-t-md'
                : 'border-transparent text-slate-600 hover:text-[#31889C]'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Tindak Lanjut</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-[13px]">
          {/* TAB 1: INFORMASI RAPAT */}
          {activeTab === 'info' && (
            <>
              {/* Title */}
              <div>
                <span className="text-[11px] font-bold text-[#31889C] uppercase tracking-wider">
                  Agenda Pembahasan
                </span>
                <h3 className="text-[20px] font-bold text-slate-900 mt-1 leading-snug">
                  {meeting.title}
                </h3>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50/80 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#31889C] shrink-0" />
                  <div>
                    <p className="text-[11px] text-slate-400 font-semibold uppercase">Tanggal Pelaksanaan</p>
                    <p className="font-bold text-slate-800">{meeting.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-[#31889C] shrink-0" />
                  <div>
                    <p className="text-[11px] text-slate-400 font-semibold uppercase">Waktu Sesi</p>
                    <p className="font-bold text-slate-800">{meeting.time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-[#31889C] shrink-0" />
                  <div>
                    <p className="text-[11px] text-slate-400 font-semibold uppercase">Biro Utama Penyelenggara</p>
                    <p className="font-bold text-slate-800">
                      {meeting.biroCode} — {meeting.biroName}
                    </p>
                  </div>
                </div>

                {(() => {
                  const virtual = extractVirtualMeetingDetails(meeting.location);
                  return (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-[#31889C] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-400 font-semibold uppercase">Lokasi / Media</p>
                        <p className="font-bold text-slate-800 line-clamp-1">
                          {virtual.cleanPhysicalLocation || meeting.location}
                        </p>
                        {virtual.zoomUrl && (
                          <div className="mt-1 flex items-center gap-1.5">
                            <a
                              href={virtual.zoomUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#0B5CFF] hover:bg-blue-100 text-[10.5px] font-bold border border-blue-200 transition-colors"
                              title="Buka Ruang Rapat Zoom"
                            >
                              <Video className="w-3 h-3 text-[#0B5CFF]" />
                              <span>Buka Zoom</span>
                              <ExternalLink className="w-2.5 h-2.5 text-blue-400" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {meeting.primaryTeamName && (
                  <div className="flex items-center gap-3 col-span-1 md:col-span-2 p-2.5 rounded-lg bg-amber-50/80 border border-amber-200">
                    <Layers className="w-5 h-5 text-amber-700 shrink-0" />
                    <div>
                      <p className="text-[11px] text-amber-800 font-semibold uppercase">Tim Kerja Pelaksana</p>
                      <p className="font-bold text-amber-950">Tim {meeting.primaryTeamName}</p>
                    </div>
                  </div>
                )}

                {meeting.invitationDocUrl && (
                  <div className="flex items-center justify-between col-span-1 md:col-span-2 p-3 rounded-xl bg-teal-50/90 border border-teal-200 shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#1E6B7B] shadow-2xs shrink-0">
                        <Paperclip className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-teal-800 font-bold uppercase tracking-wider">
                          Dokumen Undangan Resmi Terlampir
                        </p>
                        <p className="font-bold text-slate-800 text-[12px] truncate max-w-[240px] sm:max-w-xs">
                          {meeting.invitationDocName || 'Surat Undangan'}
                        </p>
                      </div>
                    </div>
                    <a
                      href={meeting.invitationDocUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E6B7B] text-white text-[11px] font-bold hover:bg-[#175360] shadow-2xs shrink-0 cursor-pointer transition-colors"
                      title="Buka dokumen undangan di tab baru"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Buka Berkas</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Status Change (CRUD Update) */}
              <div className="p-3.5 bg-[#F0F9FA] rounded-xl border border-[#BCE3EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[12px] font-bold text-slate-900 block">
                    {canChangeStatus ? 'Ubah Status Pemantauan Rapat' : 'Status Pemantauan Rapat'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Status saat ini: <strong className="text-slate-800">{normalizeProgressStatus(meeting.progressStatus || mapStatusToProgress(meeting.status))}</strong>
                  </span>
                </div>
                {canChangeStatus ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {(['Start', 'On Progres', 'Finish'] as const).map((st) => {
                      const curProg = normalizeProgressStatus(meeting.progressStatus || mapStatusToProgress(meeting.status));
                      const isSelected = curProg === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          disabled={isSelected || isUpdatingStatus}
                          onClick={() => handleStatusChange(st)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all cursor-pointer border flex items-center gap-1.5 select-none",
                            isSelected
                              ? st === 'Start'
                                ? "bg-sky-600 text-white border-sky-700 shadow-xs cursor-default ring-2 ring-sky-300/40"
                                : st === 'On Progres'
                                ? "bg-amber-600 text-white border-amber-700 shadow-xs cursor-default ring-2 ring-amber-300/40"
                                : "bg-emerald-600 text-white border-emerald-700 shadow-xs cursor-default ring-2 ring-emerald-300/40"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-[#E8F5F7] hover:text-[#215865] hover:border-[#BCE3EB]"
                          )}
                          title={`Ubah status ke ${st}`}
                        >
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full",
                              st === 'Start' ? "bg-sky-400" : st === 'On Progres' ? "bg-amber-400" : "bg-emerald-400",
                              isSelected && st === 'On Progres' && "animate-pulse"
                            )}
                          />
                          <span>{st}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <MeetingProgressBadge
                    progressStatus={meeting.progressStatus}
                    status={meeting.status}
                    showSubtitle
                  />
                )}
              </div>

              {/* Action Items / Follow-up */}
              <div>
                <h4 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#31889C]" />
                  Progres Tindak Lanjut
                </h4>
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <ActionItemProgress data={meeting.actionItems} />
                </div>
              </div>
            </>
          )}

          {/* TAB 2: PESERTA */}
          {activeTab === 'participants' && (
            <div className="space-y-4">
              <h4 className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#31889C]" />
                Daftar Peserta Rapat
              </h4>

              {meeting.attendees && meeting.attendees.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {meeting.attendees.map((attendee, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-[12px] font-medium flex items-center gap-2"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#E8F5F7] text-[#215865] text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <span className="truncate">{attendee}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-slate-400 italic">Belum ada daftar peserta yang tercatat.</p>
              )}
            </div>
          )}

          {/* TAB 3: NOTULEN & HASIL RAPAT */}
          {activeTab === 'minutes' && (
            <div className="pt-1">
              <MeetingMinutesSection meetingId={meeting.id} meeting={meeting} />
            </div>
          )}

          {/* TAB 4: TINDAK LANJUT */}
          {activeTab === 'actionItems' && (
            <div className="pt-1">
              {isLoadingItems ? (
                <div className="p-8 text-center text-slate-500">Memuat tindak lanjut rapat...</div>
              ) : (
                <ActionItemList
                  meetingId={meeting.id}
                  initialItems={actionItems}
                  availableBiros={availableBiros}
                  availableUsers={availableUsers}
                />
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          {canDeleteMeeting ? (
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 text-[12px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
              title="Hapus rapat dari database"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeleting ? 'Menghapus...' : 'Hapus Rapat'}</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Tutup
            </button>

            {(((meeting as any)?.minutes?.conclusion as any)?.docType === 'NOTA_DINAS') ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => handleExportPdf('nota-dinas')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#31889C] text-white font-semibold text-[12px] hover:bg-[#266F80] shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  title="Unduh Nota Dinas Resmi Format PDF"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>{isExporting ? 'Membuat PDF...' : 'Nota Dinas PDF'}</span>
                </button>
                <button
                  type="button"
                  disabled={isExportingDocx}
                  onClick={() => handleExportDocx('nota-dinas')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2B579A] text-white font-semibold text-[12px] hover:bg-[#1E3E6D] shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  title="Unduh Nota Dinas Resmi Format Word (.docx)"
                >
                  {isExportingDocx ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  <span>Word (.docx)</span>
                </button>
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => handleExportPdf('notula')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold text-[11.5px] hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
                  title="Unduh Risalah Notula Format PDF"
                >
                  <FileDown className="w-3 h-3 text-slate-500" />
                  <span>Notula PDF</span>
                </button>
                <button
                  type="button"
                  disabled={isExportingDocx}
                  onClick={() => handleExportDocx('notula')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#2B579A]/30 bg-blue-50/50 text-[#2B579A] font-semibold text-[11.5px] hover:bg-blue-100/50 transition-all cursor-pointer disabled:opacity-50"
                  title="Unduh Risalah Notula Format Word (.docx)"
                >
                  <FileText className="w-3 h-3 text-[#2B579A]" />
                  <span>Notula Word</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => onDownloadPdf ? onDownloadPdf(meeting) : handleExportPdf('notula')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#31889C] text-white font-semibold text-[12px] hover:bg-[#266F80] shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  title="Unduh Risalah Rapat Resmi Format PDF"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>{isExporting ? 'Membuat PDF...' : 'Notulen PDF'}</span>
                </button>
                <button
                  type="button"
                  disabled={isExportingDocx}
                  onClick={() => handleExportDocx('notula')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2B579A] text-white font-semibold text-[12px] hover:bg-[#1E3E6D] shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  title="Unduh Risalah Rapat Resmi Format Word (.docx)"
                >
                  {isExportingDocx ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  <span>Word (.docx)</span>
                </button>
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => handleExportPdf('nota-dinas')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold text-[11.5px] hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
                  title="Unduh Nota Dinas Resmi Format PDF"
                >
                  <FileDown className="w-3 h-3 text-slate-500" />
                  <span>Nota Dinas PDF</span>
                </button>
                <button
                  type="button"
                  disabled={isExportingDocx}
                  onClick={() => handleExportDocx('nota-dinas')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#2B579A]/30 bg-blue-50/50 text-[#2B579A] font-semibold text-[11.5px] hover:bg-blue-100/50 transition-all cursor-pointer disabled:opacity-50"
                  title="Unduh Nota Dinas Resmi Format Word (.docx)"
                >
                  <FileText className="w-3 h-3 text-[#2B579A]" />
                  <span>Nota Dinas Word</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCalendarModal && meeting && (
        <GoogleCalendarModal
          isOpen={showCalendarModal}
          onClose={() => setShowCalendarModal(false)}
          event={{
            id: meeting.id,
            meetingNumber: meeting.code,
            title: meeting.title,
            date: meeting.date,
            startTime: (meeting.time || '').split('-')[0]?.trim() || '09:00',
            endTime: (meeting.time || '').split('-')[1]?.trim() || '11:00',
            location: meeting.location,
            biroName: meeting.biroName,
            attendees: (meeting as any).participants?.length
              ? (meeting as any).participants.map((p: any) => ({
                  name: p.user?.name || p.customName || 'Peserta',
                  email: p.user?.email || p.customEmail || '',
                }))
              : (meeting.attendees || []).map((att: string) => {
                  const emailMatch = att.match(/<([^>]+)>|\(([^)]+)\)/);
                  const email = emailMatch ? (emailMatch[1] || emailMatch[2]) : (att.includes('@') ? att : '');
                  return {
                    name: att.replace(/\s*[\(<].*?[\)>]/, '').trim() || att,
                    email: email.trim(),
                  };
                }),
          }}
        />
      )}
    </div>
  );
}
