'use client';

import React, { useEffect, useState } from 'react';
import { X, Calendar, Clock, MapPin, Building2, Users, FileText, CheckCircle2, Trash2, Check, AlertCircle } from 'lucide-react';
import { Meeting, MeetingStatus } from '@/lib/types';
import { MeetingStatusBadge } from './meeting-status-badge';
import { ActionItemProgress } from '../action-items/action-item-progress';

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-amber-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
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
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-amber-200/50 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-[13px]">
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
              <span className="text-[12px] font-bold text-slate-900 block">Ubah Status Risalah (Update CRUD)</span>
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

          {/* Attendees / Peserta */}
          {meeting.attendees && meeting.attendees.length > 0 && (
            <div>
              <h4 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                Daftar Peserta Rapat
              </h4>
              <div className="flex flex-wrap gap-2">
                {meeting.attendees.map((attendee, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[12px] font-medium"
                  >
                    {attendee}
                  </span>
                ))}
              </div>
            </div>
          )}

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
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 text-[12px] font-semibold transition-colors cursor-pointer"
            title="Hapus rapat dari database"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Menghapus...' : 'Hapus Rapat'}</span>
          </button>

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
