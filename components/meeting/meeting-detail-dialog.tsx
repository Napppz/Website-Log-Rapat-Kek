'use client';

import React, { useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Building2, Users, FileText, CheckCircle2 } from 'lucide-react';
import { Meeting } from '@/lib/types';
import { MeetingStatusBadge } from './meeting-status-badge';
import { ActionItemProgress } from '../action-items/action-item-progress';

interface MeetingDetailDialogProps {
  meeting: Meeting | null;
  onClose: () => void;
  onDownloadPdf?: (meeting: Meeting) => void;
}

export function MeetingDetailDialog({
  meeting,
  onClose,
  onDownloadPdf,
}: MeetingDetailDialogProps) {
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
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Title */}
          <div>
            <h3 className="font-bold text-[18px] text-slate-900 leading-snug">
              {meeting.title}
            </h3>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-amber-50/50 rounded-xl border border-amber-100 text-[13px]">
            <div className="flex items-center gap-2.5 text-slate-700">
              <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{meeting.date}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{meeting.time}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700 sm:col-span-2">
              <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{meeting.location}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700 sm:col-span-2">
              <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-semibold text-amber-800">{meeting.biroName}</span>
            </div>
          </div>

          {/* Agenda Summary */}
          {meeting.agendaSummary && (
            <div>
              <h4 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                Pokok Pembahasan &amp; Keputusan
              </h4>
              <p className="text-[14px] text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                {meeting.agendaSummary}
              </p>
            </div>
          )}

          {/* Attendees */}
          {meeting.attendees && meeting.attendees.length > 0 && (
            <div>
              <h4 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                Peserta &amp; Pemangku Kepentingan
              </h4>
              <ul className="space-y-1.5 text-[13px] text-slate-600 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                {meeting.attendees.map((person, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span>{person}</span>
                  </li>
                ))}
              </ul>
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
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
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
  );
}
