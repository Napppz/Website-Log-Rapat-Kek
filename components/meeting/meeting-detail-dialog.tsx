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
  Play,
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
  const currentTeamCode = session?.user?.teamCode;
  const currentTeamId = session?.user?.teamId;

  // Cek kepemilikan tim rapat: periksa seluruh kode dan ID tim yang dimiliki pengguna
  const userAssignedList = (session?.user as any)?.assignedTeams || [];
  const userTeamCodes = [
    ...(session?.user?.teamCode ? [session.user.teamCode.toUpperCase()] : []),
    ...userAssignedList.map((t: any) => (t.code || '').toUpperCase()),
  ].filter(Boolean);
  const userTeamIds = [
    ...(session?.user?.teamId ? [session.user.teamId] : []),
    ...userAssignedList.map((t: any) => t.id || ''),
  ].filter(Boolean);

  const isMyTeam =
    userRole === 'SUPER_ADMIN' ||
    (userTeamCodes.length > 0 &&
      (userTeamCodes.includes((meeting?.primaryTeamCode || '').toUpperCase()) ||
        userTeamCodes.some((tc) => meeting?.code?.toUpperCase().startsWith(`${tc}-`)))) ||
    (userTeamIds.length > 0 && userTeamIds.includes(meeting?.primaryTeamId || ''));

  const isEffectiveReadOnly = !isMyTeam;

  const canDeleteMeeting = !isEffectiveReadOnly && (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN');
  const isPrivileged = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'PIMPINAN';
  const isMeetingBiro =
    isPrivileged ||
    (session?.user?.biroCode &&
      meeting?.biroCode &&
      session.user.biroCode.toUpperCase() === meeting.biroCode.toUpperCase());
  const canChangeStatus = !isEffectiveReadOnly && (isPrivileged || (userRole === 'STAFF' && isMyTeam));
  const canApprove = !isEffectiveReadOnly && isPrivileged;

  const [activeTab, setActiveTab] = useState<'info' | 'minutes' | 'actionItems'>('info');
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
        : `Catatan-Kegiatan-${meeting.code || 'KEK'}.pdf`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success(
        type === 'nota-dinas'
          ? `Nota Dinas kegiatan ${meeting.code || 'KEK'} berhasil diunduh (PDF).`
          : `Catatan kegiatan ${meeting.code || 'KEK'} berhasil diunduh (PDF).`
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
        : `Catatan-Kegiatan-${cleanCode}.docx`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success(
        type === 'nota-dinas'
          ? `Nota Dinas kegiatan ${meeting.code || 'KEK'} berhasil diunduh (Word .docx).`
          : `Catatan kegiatan ${meeting.code || 'KEK'} berhasil diunduh (Word .docx).`
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
      title: `Hapus Kegiatan ${meeting.code}?`,
      message: `Apakah Anda yakin ingin menghapus kegiatan "${meeting.title}" dari database?`,
      confirmText: 'Ya, Hapus Kegiatan',
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
        toast.success(`Kegiatan ${meeting.code} berhasil dihapus dari database.`);
        onClose();
        if (onMeetingUpdated) {
          onMeetingUpdated();
        } else {
          router.refresh();
        }
      } else {
        toast.error(res.error || 'Gagal menghapus kegiatan');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menghapus kegiatan');
    } finally {
      setIsDeleting(false);
    }
  };

  const currentProg = normalizeProgressStatus(
    meeting?.progressStatus || (meeting?.status === 'DRAFT' ? 'Belum Dimulai' : 'Dalam Proses')
  );
  const isBelumDimulai = currentProg === 'Belum Dimulai' || meeting?.status === 'DRAFT';

  const handleStartMeeting = async () => {
    if (!meeting) return;
    const confirmed = await confirmModal({
      title: 'Mulai Pelaksanaan Kegiatan?',
      message: `Apakah Anda ingin memulai pelaksanaan kegiatan "${meeting.title}" sekarang? Status kegiatan akan langsung diubah menjadi "Dalam Proses".`,
      confirmText: 'Ya, Mulai Kegiatan',
      variant: 'primary',
    });
    if (!confirmed) return;

    try {
      setIsUpdatingStatus(true);
      const { updateMeetingStatusAction } = await import('@/app/actions/meeting-actions');
      const res = await updateMeetingStatusAction(meeting.id, 'Dalam Proses');
      if (res.success) {
        toast.success(`Kegiatan ${meeting.code} resmi dimulai (Status: Dalam Proses).`);
        onClose();
        router.push(`/semua-rapat/${meeting.id}?tab=minutes`);
      } else {
        toast.error(res.error || 'Gagal memulai kegiatan');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memulai kegiatan');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleApproveMeeting = async () => {
    if (!meeting) return;
    const confirmed = await confirmModal({
      title: 'Setujui & Selesaikan Kegiatan?',
      message: `Apakah Anda ingin menyetujui hasil risalah kegiatan "${meeting.title}"? Status kegiatan akan otomatis diubah menjadi SELESAI.`,
      confirmText: 'Ya, Setujui & Selesaikan',
      variant: 'primary',
    });
    if (!confirmed) return;

    try {
      setIsUpdatingStatus(true);
      const { approveMeetingAction } = await import('@/app/actions/meeting-actions');
      const res = await approveMeetingAction(meeting.id);
      if (res.success) {
        toast.success(`Hasil kegiatan ${meeting.code} resmi disetujui (Status: Selesai).`);
        onClose();
        if (onMeetingUpdated) {
          onMeetingUpdated();
        } else {
          router.refresh();
        }
      } else {
        toast.error(res.error || 'Gagal menyetujui hasil kegiatan');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyetujui hasil kegiatan');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setIsUpdatingStatus(true);
      const { updateMeetingStatusAction } = await import('@/app/actions/meeting-actions');
      const res = await updateMeetingStatusAction(meeting.id, newStatus);
      if (res.success) {
        toast.success(`Status kegiatan ${meeting.code} berhasil diubah ke "${newStatus}".`);
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
                title="Lihat Linimasa Semua Kegiatan Terkait Agenda Ini"
              >
                <Layers className="w-3.5 h-3.5 text-[#31889C]" />
                <span>Rangkaian Agenda</span>
              </button>
            )}

            {/* Quick Action Button: Mulai Kegiatan / Setujui Hasil Kegiatan */}
            {isBelumDimulai && canChangeStatus && (
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={handleStartMeeting}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-bold text-white bg-[#31889C] hover:bg-[#266F80] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                title="Mulai Kegiatan (Otomatis ubah status ke Dalam Proses)"
              >
                {isUpdatingStatus ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>Mulai Kegiatan</span>
              </button>
            )}

            {currentProg === 'Dalam Proses' && canApprove && (
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={handleApproveMeeting}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                title="Admin Tim & Pimpinan: Setujui hasil kegiatan (Otomatis ubah status ke Selesai)"
              >
                {isUpdatingStatus ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Setujui Hasil Kegiatan</span>
              </button>
            )}

            {currentProg === 'Selesai' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Selesai</span>
              </span>
            )}

            {isEffectiveReadOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold text-sky-800 bg-sky-50 border border-sky-200">
                <span>Hanya Lihat</span>
              </span>
            )}

            <Link
              href={`/semua-rapat/${meeting.id}`}
              onClick={onClose}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[12px] font-semibold text-[#215865] bg-[#E8F5F7] hover:bg-[#BCE3EB] transition-colors"
              title="Buka Halaman Kegiatan Penuh"
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
            <span>Informasi Kegiatan</span>
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
          {/* TAB 1: INFORMASI KEGIATAN */}
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
                  <Building2 className="w-5 h-5 text-[#31889C] shrink-0" />
                  <div>
                    <p className="text-[11px] text-slate-400 font-semibold uppercase">Tim Kerja Penyelenggara</p>
                    <p className="font-bold text-slate-800">
                      {meeting.primaryTeamName
                        ? (meeting.primaryTeamName.startsWith('Tim ') || meeting.primaryTeamName.startsWith('Pokja')
                            ? meeting.primaryTeamName
                            : `Tim ${meeting.primaryTeamName}`)
                        : (meeting.primaryTeamCode || 'Tim Investasi')}
                    </p>
                  </div>
                </div>

                {meeting.primaryTeamName && (
                  <div className="flex items-center gap-3 col-span-1 md:col-span-2 p-2.5 rounded-lg bg-amber-50/80 border border-amber-200">
                    <Layers className="w-5 h-5 text-amber-700 shrink-0" />
                    <div>
                      <p className="text-[11px] text-amber-800 font-semibold uppercase">Tim Kerja Pelaksana</p>
                      <p className="font-bold text-amber-950">
                        {meeting.primaryTeamName.startsWith('Tim ') || meeting.primaryTeamName.startsWith('Pokja')
                          ? meeting.primaryTeamName
                          : `Tim ${meeting.primaryTeamName}`}
                      </p>
                    </div>
                  </div>
                )}

                {meeting.picName && (
                  <div className="flex items-center gap-3 col-span-1 md:col-span-2 p-2.5 rounded-lg bg-teal-50/80 border border-teal-200">
                    <Users className="w-5 h-5 text-[#1E6B7B] shrink-0" />
                    <div>
                      <p className="text-[11px] text-teal-800 font-semibold uppercase">PIC Terlibat</p>
                      <p className="font-bold text-teal-950">{meeting.picName}</p>
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
                    {canChangeStatus ? 'Ubah Status Pemantauan Kegiatan' : 'Status Pemantauan Kegiatan'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Status saat ini: <strong className="text-slate-800">{normalizeProgressStatus(meeting.progressStatus || mapStatusToProgress(meeting.status))}</strong>
                  </span>
                </div>
                {canChangeStatus ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {(['Belum Dimulai', 'Dalam Proses', 'Selesai'] as const).map((st) => {
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
                              ? st === 'Belum Dimulai'
                                ? "bg-sky-600 text-white border-sky-700 shadow-xs cursor-default ring-2 ring-sky-300/40"
                                : st === 'Dalam Proses'
                                ? "bg-amber-600 text-white border-amber-700 shadow-xs cursor-default ring-2 ring-amber-300/40"
                                : "bg-emerald-600 text-white border-emerald-700 shadow-xs cursor-default ring-2 ring-emerald-300/40"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-[#E8F5F7] hover:text-[#215865] hover:border-[#BCE3EB]"
                          )}
                          title={`Ubah status ke ${st}`}
                        >
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full",
                              st === 'Belum Dimulai' ? "bg-sky-400" : st === 'Dalam Proses' ? "bg-amber-400" : "bg-emerald-400",
                              isSelected && st === 'Dalam Proses' && "animate-pulse"
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

          {/* TAB 2: NOTULEN & HASIL KEGIATAN */}
          {activeTab === 'minutes' && (
            <div className="pt-1">
              <MeetingMinutesSection
                meetingId={meeting.id}
                meeting={meeting}
                canEdit={!isEffectiveReadOnly}
                readOnly={isEffectiveReadOnly}
              />
            </div>
          )}

          {/* TAB 4: TINDAK LANJUT */}
          {activeTab === 'actionItems' && (
            <div className="pt-1">
              {isLoadingItems ? (
                <div className="p-8 text-center text-slate-500">Memuat tindak lanjut kegiatan...</div>
              ) : (
                <ActionItemList
                  meetingId={meeting.id}
                  currentMeeting={meeting}
                  initialItems={actionItems}
                  availableBiros={availableBiros}
                  availableUsers={availableUsers}
                  readOnly={isEffectiveReadOnly}
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
              title="Hapus kegiatan dari database"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeleting ? 'Menghapus...' : 'Hapus Kegiatan'}</span>
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
                  title="Unduh Risalah Catatan Kegiatan Resmi Format PDF"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>{isExporting ? 'Membuat PDF...' : 'Catatan PDF'}</span>
                </button>
                <button
                  type="button"
                  disabled={isExportingDocx}
                  onClick={() => handleExportDocx('notula')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2B579A] text-white font-semibold text-[12px] hover:bg-[#1E3E6D] shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  title="Unduh Risalah Catatan Kegiatan Resmi Format Word (.docx)"
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
