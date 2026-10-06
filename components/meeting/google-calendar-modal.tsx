'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Copy,
  Check,
  ExternalLink,
  Download,
  Share2,
  X,
  Sparkles,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';
import {
  generateGoogleCalendarUrl,
  generateWhatsAppMeetingShareText,
  CalendarEventData,
} from '@/lib/calendar';
import { toast } from '@/components/providers/toast-provider';

interface GoogleCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEventData;
}

export function GoogleCalendarModal({ isOpen, onClose, event }: GoogleCalendarModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.origin : '';
  const meetingUrl = event.meetingUrl || (event.id ? `${currentHost}/semua-rapat/${event.id}` : currentHost);

  const fullEventData: CalendarEventData = {
    ...event,
    meetingUrl,
  };

  const gcalUrl = generateGoogleCalendarUrl(fullEventData);
  const waShareText = generateWhatsAppMeetingShareText(fullEventData, gcalUrl);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(gcalUrl);
      setCopiedLink(true);
      toast.success('Tautan Google Calendar berhasil disalin ke clipboard!');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      toast.error('Gagal menyalin tautan.');
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(waShareText);
      setCopiedText(true);
      toast.success('Format naskah undangan rapat berhasil disalin!');
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      toast.error('Gagal menyalin naskah.');
    }
  };

  const d = typeof event.date === 'string' ? new Date(event.date) : event.date;
  const formattedDate = d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const attendeeCount = event.attendees?.length || 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#175360] to-[#1E6B7B] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-xs">
              <Calendar className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[16px] text-white">
                  Google Kalender &amp; Undangan Sidang
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-extrabold uppercase tracking-wide">
                  Auto-Sync
                </span>
              </div>
              <p className="text-[12px] text-white/80">
                Tautkan ke kalender dan undang seluruh peserta secara otomatis
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700">
          {/* Quick Info Preview */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2 text-xs">
            <span className="text-[11px] font-bold text-[#1E6B7B] uppercase tracking-wider block">
              {event.meetingNumber}
            </span>
            <h4 className="font-bold text-slate-900 text-sm leading-snug">
              {event.title}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-slate-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#1E6B7B] shrink-0" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#1E6B7B] shrink-0" />
                <span>{event.startTime} - {event.endTime} WIB</span>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <MapPin className="w-3.5 h-3.5 text-[#1E6B7B] shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            </div>
          </div>

          {/* Primary Action Button (Add to Google Calendar) */}
          <div className="space-y-3">
            <a
              href={gcalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-xl bg-[#1E6B7B] hover:bg-[#175360] active:bg-[#103C46] text-white font-bold text-sm shadow-md shadow-[#1E6B7B]/25 hover:shadow-lg transition-all cursor-pointer group"
            >
              <Calendar className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
              <span>Buka &amp; Tambahkan ke Google Calendar</span>
              <ExternalLink className="w-4 h-4 text-white/70" />
            </a>

            <p className="text-[11.5px] text-slate-500 text-center leading-relaxed">
              Google Calendar akan otomatis mengisi waktu WIB, lokasi sidang, ringkasan risalah, serta
              mengirimkan undangan ke <strong>{attendeeCount} peserta</strong> yang terdaftar.
            </p>
          </div>

          {/* Secondary Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Copy GCal Direct Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Tautan Disalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#1E6B7B]" />
                  <span>Salin Link Kalender</span>
                </>
              )}
            </button>

            {/* Download .ICS File */}
            {event.id && (
              <a
                href={`/api/meetings/${event.id}/ics`}
                download
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#1E6B7B]" />
                <span>Unduh Berkas (.ics)</span>
              </a>
            )}
          </div>

          {/* WhatsApp / Messaging Formatted Text */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/60 to-slate-50 border border-amber-200/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                <span>Format Pesan Undangan (WhatsApp / Email)</span>
              </span>
              <button
                type="button"
                onClick={handleCopyText}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-slate-800 text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-amber-700" />
                    <span>Salin Naskah</span>
                  </>
                )}
              </button>
            </div>
            <pre className="text-[11px] text-slate-600 bg-white p-3 rounded-lg border border-slate-200 max-h-32 overflow-y-auto whitespace-pre-wrap font-sans leading-relaxed">
              {waShareText}
            </pre>
          </div>

          {/* Invited Participants Preview */}
          {event.attendees && event.attendees.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#1E6B7B]" />
                  <span>Daftar Tamu yang Masuk ke Kalender ({attendeeCount})</span>
                </span>
                <span className="text-slate-400 text-[11px]">Surel Otomatis Diundang</span>
              </div>

              <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                {event.attendees.map((a, idx) => (
                  <div key={idx} className="px-3 py-2 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 truncate max-w-[200px] sm:max-w-xs">
                      {a.name}
                    </span>
                    <span className="text-slate-400 text-[11px] font-mono truncate max-w-[180px]">
                      {a.email}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Format waktu sesuai Waktu Indonesia Barat (WIB).</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
