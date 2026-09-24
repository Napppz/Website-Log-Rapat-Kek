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
} from 'lucide-react';
import { Meeting, MeetingStatus } from '@/lib/types';
import { MeetingStatusBadge } from './meeting-status-badge';
import { ActionItemProgress } from '../action-items/action-item-progress';
import { MeetingMinutesSection } from './meeting-minutes/meeting-minutes-section';
import { ActionItemList } from '../action-items/action-item-list';
import { getActionItemsAction } from '@/app/actions/action-item-actions';
import { useSession } from 'next-auth/react';

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
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  useEffect(() => {
    if (activeTab === 'actionItems' && meeting?.id) {
      setIsLoadingItems(true);
      getActionItemsAction(meeting.id).then((res) => {
        if (res.success && res.data) {
          setActionItems(res.data);
        }
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
    if (!confirm(`Apakah Anda yakin ingin menghapus rapat "${meeting.code} - ${meeting.title}" dari database?`)) {
      return;
    }

    try {
      setIsDeleting(true);
      const { deleteMeetingAction } = await import('@/app/actions/meeting-actions');
      const res = await deleteMeetingAction(meeting.id);
      if (res.success) {
        alert(`Rapat ${meeting.code} berhasil dihapus dari Neon DB.`);
        onClose();
        if (onMeetingUpdated) onMeetingUpdated();
        window.location.reload();
      } else {
        alert(res.error || 'Gagal menghapus rapat');
      }
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err?.message || 'Gagal menghapus'}`);
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
        alert(`Status rapat ${meeting.code} berhasil diubah ke ${newStatus}.`);
        onClose();
        if (onMeetingUpdated) onMeetingUpdated();
        window.location.reload();
      } else {
        alert(res.error || 'Gagal memperbarui status');
      }
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err?.message || 'Gagal memperbarui status'}`);
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
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-amber-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-50 to-amber-100/60 border-b border-amber-200">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[16px] text-amber-900 bg-amber-200/80 px-2.5 py-1 rounded-md border border-amber-300">
              {meeting.code}
            </span>
            <MeetingStatusBadge status={meeting.status} isNew={meeting.isNew} />
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/semua-rapat/${meeting.id}`}
              onClick={onClose}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[12px] font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200/80 transition-colors"
              title="Buka Halaman Rapat Penuh"
            >
              <span>Halaman Penuh</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-amber-200/50 transition-colors cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation in Dialog */}
        <div className="flex items-center gap-2 px-6 border-b border-amber-200/80 bg-amber-50/30">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-1.5 py-2.5 px-3 font-bold text-[12px] border-b-2 transition-all cursor-pointer ${
              activeTab === 'info'
                ? 'border-amber-600 text-amber-900 bg-white rounded-t-md'
                : 'border-transparent text-slate-600 hover:text-amber-800'
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
                ? 'border-amber-600 text-amber-900 bg-white rounded-t-md'
                : 'border-transparent text-slate-600 hover:text-amber-800'
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
                ? 'border-amber-600 text-amber-900 bg-white rounded-t-md'
                : 'border-transparent text-slate-600 hover:text-amber-800'
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
                ? 'border-amber-600 text-amber-900 bg-white rounded-t-md'
                : 'border-transparent text-slate-600 hover:text-amber-800'
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
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                  Agenda Pembahasan
                </span>
                <h3 className="text-[20px] font-bold text-slate-900 mt-1 leading-snug">
                  {meeting.title}
                </h3>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50/80 rounded-xl border border-amber-100">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-[11px] text-slate-400 font-semibold uppercase">Tanggal Pelaksanaan</p>
                    <p className="font-bold text-slate-800">{meeting.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-[11px] text-slate-400 font-semibold uppercase">Waktu Sesi</p>
                    <p className="font-bold text-slate-800">{meeting.time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-[11px] text-slate-400 font-semibold uppercase">Biro Utama Penyelenggara</p>
                    <p className="font-bold text-slate-800">
                      {meeting.biroCode} — {meeting.biroName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-[11px] text-slate-400 font-semibold uppercase">Lokasi / Media</p>
                    <p className="font-bold text-slate-800 line-clamp-1">{meeting.location}</p>
                  </div>
                </div>
              </div>

              {/* Status Change (CRUD Update) */}
              <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                          ? 'bg-amber-700 text-white shadow-xs opacity-90 cursor-default'
                          : 'bg-white border border-amber-300 text-slate-700 hover:bg-amber-100 hover:text-amber-900'
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
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  Progres Tindak Lanjut
                </h4>
                <div className="p-3.5 bg-amber-50/40 rounded-lg border border-amber-200/70">
                  <ActionItemProgress data={meeting.actionItems} />
                </div>
              </div>
            </>
          )}

          {/* TAB 2: PESERTA */}
          {activeTab === 'participants' && (
            <div className="space-y-4">
              <h4 className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                Daftar Peserta Rapat
              </h4>

              {meeting.attendees && meeting.attendees.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {meeting.attendees.map((attendee, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-[12px] font-medium flex items-center gap-2"
                    >
                      <div className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 text-[10px] font-bold flex items-center justify-center shrink-0">
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
              <MeetingMinutesSection meetingId={meeting.id} />
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
              onClick={() => onDownloadPdf ? onDownloadPdf(meeting) : alert(`Mengunduh risalah resmi format PDF: ${meeting.code}`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white font-semibold text-[13px] hover:bg-amber-700 shadow-sm transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Unduh Notulen PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
