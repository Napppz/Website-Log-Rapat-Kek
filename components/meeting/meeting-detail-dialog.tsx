'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import { Meeting, MeetingStatus } from '@/lib/types';
import { MeetingStatusBadge } from './meeting-status-badge';
import { ActionItemProgress } from '../action-items/action-item-progress';
import { MeetingMinutesSection } from './meeting-minutes/meeting-minutes-section';
import { ActionItemList } from '../action-items/action-item-list';
import { getActionItemsAction, getActionItemFormOptionsAction } from '@/app/actions/action-item-actions';
import { useSession } from 'next-auth/react';
import { toast, confirmModal } from '@/components/providers/toast-provider';

interface MeetingDetailDialogProps {
  meeting: Meeting | null;
  onClose: () => void;
  onDownloadPdf?: (meeting: Meeting) => void;
  onMeetingUpdated?: () => void;
}

export function MeetingDetailDialog({
  meeting,
  onClose,
  onDownloadPdf,
  onMeetingUpdated,
}: MeetingDetailDialogProps) {
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'VIEWER';
  const canDeleteMeeting = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';

  const [activeTab, setActiveTab] = useState<'info' | 'participants' | 'minutes' | 'actionItems'>('info');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [availableBiros, setAvailableBiros] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  const handleExportPdf = async () => {
    if (!meeting?.id) return;
    try {
      setIsExporting(true);
      const res = await fetch(`/api/meetings/${meeting.id}/pdf`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || 'Gagal mengunduh dokumen PDF.');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Risalah-Rapat-${meeting.code || 'KEK'}.pdf`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Risalah rapat ${meeting.code || 'KEK'} berhasil diunduh (PDF).`);
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan saat mengunduh PDF.');
    } finally {
      setIsExporting(false);
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
        if (onMeetingUpdated) onMeetingUpdated();
        window.location.reload();
      } else {
        toast.error(res.error || 'Gagal menghapus rapat');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menghapus rapat');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (newStatus: MeetingStatus) => {
    try {
      setIsUpdatingStatus(true);
      const { updateMeetingStatusAction } = await import('@/app/actions/meeting-actions');
      const res = await updateMeetingStatusAction(meeting.id, newStatus);
      if (res.success) {
        toast.success(`Status rapat ${meeting.code} berhasil diubah ke ${newStatus}.`);
        onClose();
        if (onMeetingUpdated) onMeetingUpdated();
        window.location.reload();
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
            <MeetingStatusBadge status={meeting.status} isNew={meeting.isNew} />
          </div>

          <div className="flex items-center gap-2">
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
            <span>Notulen &amp; Hasil Rapat</span>
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

                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-[#31889C] shrink-0" />
                  <div>
                    <p className="text-[11px] text-slate-400 font-semibold uppercase">Lokasi / Media</p>
                    <p className="font-bold text-slate-800 line-clamp-1">{meeting.location}</p>
                  </div>
                </div>
              </div>

              {/* Status Change (CRUD Update) */}
              <div className="p-3.5 bg-[#F0F9FA] rounded-xl border border-[#BCE3EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[12px] font-bold text-slate-900 block">Ubah Status Risalah</span>
                  <span className="text-[11px] text-slate-500">Status saat ini: <strong>{meeting.status}</strong></span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(['DRAFT', 'REVIEW', 'APPROVED', 'FINAL'] as MeetingStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={meeting.status === st || isUpdatingStatus}
                      onClick={() => handleStatusChange(st)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                        meeting.status === st
                          ? 'bg-[#31889C] text-white shadow-xs opacity-90 cursor-default'
                          : 'bg-white border border-[#BCE3EB] text-[#215865] hover:bg-[#E8F5F7]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
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

            <button
              type="button"
              disabled={isExporting}
              onClick={() => onDownloadPdf ? onDownloadPdf(meeting) : handleExportPdf()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#31889C] text-white font-semibold text-[13px] hover:bg-[#266F80] shadow-sm transition-all cursor-pointer disabled:opacity-50"
              title="Unduh Risalah Rapat Resmi Format PDF"
            >
              <FileDown className="w-4 h-4" />
              <span>{isExporting ? 'Membuat PDF...' : 'Unduh Notulen PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
