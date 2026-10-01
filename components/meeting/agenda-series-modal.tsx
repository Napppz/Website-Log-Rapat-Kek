'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  Layers,
  Calendar,
  Clock,
  MapPin,
  Building2,
  User,
  CheckCircle2,
  FileText,
  FileDown,
  ExternalLink,
  Plus,
  Loader2,
  Link2,
  ArrowRight,
  ChevronRight,
  Info,
  CalendarRange,
} from 'lucide-react';
import { MeetingStatusBadge } from './meeting-status-badge';
import { AgendaSeriesResult, AgendaSessionItem, MeetingStatus } from '@/lib/types';
import { getAgendaSeriesAction } from '@/app/actions/meeting-actions';
import { toast } from '@/components/providers/toast-provider';

interface AgendaSeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string | null;
  onSelectMeeting?: (meetingId: string) => void;
  onDownloadPdf?: (meetingId: string, meetingCode: string) => void;
}

export function AgendaSeriesModal({
  isOpen,
  onClose,
  meetingId,
  onSelectMeeting,
  onDownloadPdf,
}: AgendaSeriesModalProps) {
  const [data, setData] = useState<AgendaSeriesResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && meetingId) {
      setIsLoading(true);
      setActiveSessionId(meetingId);
      getAgendaSeriesAction(meetingId)
        .then((res) => {
          if (res.success && res.data) {
            setData(res.data);
            setActiveSessionId(meetingId);
          } else {
            toast.error(res.error || 'Gagal memuat rangkaian rapat terkait.');
          }
        })
        .catch(() => {
          toast.error('Terjadi kesalahan saat memuat data rangkaian agenda.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setData(null);
    }
  }, [isOpen, meetingId]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownloadPdf = async (id: string, code: string) => {
    if (onDownloadPdf) {
      onDownloadPdf(id, code);
      return;
    }
    try {
      setDownloadingId(id);
      const res = await fetch(`/api/meetings/${id}/pdf`);
      if (!res.ok) {
        throw new Error('Gagal mengunduh dokumen PDF.');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Risalah-Rapat-${code || 'KEK'}.pdf`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Risalah rapat ${code} berhasil diunduh (PDF).`);
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan saat mengunduh PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleOpenDetail = (sessionId: string) => {
    if (onSelectMeeting) {
      onSelectMeeting(sessionId);
    }
  };

  // Find latest session to link for new meeting
  const lastSession = data?.sessions && data.sessions.length > 0
    ? data.sessions[data.sessions.length - 1]
    : null;

  const nextSessionNumber = (data?.sessions?.length || 0) + 1;

  // Compute total action items stats across series
  const totalSeriesActionItems = data?.sessions.reduce(
    (acc, s) => acc + s.actionItems.total,
    0
  ) || 0;
  const completedSeriesActionItems = data?.sessions.reduce(
    (acc, s) => acc + s.actionItems.completed,
    0
  ) || 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-[#F8FAFC] border-b border-slate-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#31889C] to-[#215865] text-white flex items-center justify-center shadow-md shrink-0 mt-0.5">
                <CalendarRange className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#215865] bg-[#E8F5F7] px-2.5 py-0.5 rounded-md border border-[#BCE3EB]">
                    Rangkaian Agenda Rapat
                  </span>
                  {data && (
                    <span className="text-[11.5px] font-bold text-[#31889C] bg-[#F0F9FA] px-2.5 py-0.5 rounded-md border border-[#BCE3EB]">
                      {data.totalSessions} Pertemuan Terkait (Rapat Ke-1 s/d Ke-{data.totalSessions})
                    </span>
                  )}
                </div>
                <h2 className="text-[18px] sm:text-[20px] font-bold text-slate-900 leading-snug line-clamp-2">
                  {isLoading ? 'Memuat rangkaian rapat...' : (data?.agendaTitle || 'Daftar Rapat Terkait')}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Stats Bar */}
          {data && !isLoading && (
            <div className="mt-3.5 pt-3 border-t border-slate-200/80 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-slate-600">
              <div className="flex items-center gap-1.5 font-medium">
                <Building2 className="w-3.5 h-3.5 text-[#31889C]" />
                <span>Biro Utama: <strong>{data.primaryBiroName} ({data.primaryBiroCode})</strong></span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#7CC563]" />
                <span>
                  Total Tindak Lanjut Rangkaian:{' '}
                  <strong>{completedSeriesActionItems}/{totalSeriesActionItems} Selesai</strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Body - List of Sessions */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50/50">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#31889C]" />
              <p className="text-[13px] font-semibold text-slate-500">
                Mengumpulkan seluruh sesi rapat terkait dalam agenda ini...
              </p>
            </div>
          ) : !data || data.sessions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-[13px]">
              Tidak ada data rapat terkait ditemukan.
            </div>
          ) : (
            <div className="relative pl-4 sm:pl-6 space-y-4">
              {/* Connecting vertical timeline line */}
              <div className="absolute left-[19px] sm:left-[27px] top-6 bottom-6 w-0.5 bg-linear-to-b from-[#31889C] via-[#BCE3EB] to-slate-200" />

              {data.sessions.map((session, index) => {
                const isSelected = activeSessionId === session.id;

                return (
                  <div
                    key={session.id}
                    className={`relative rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isSelected
                        ? 'bg-white border-[#31889C] shadow-md ring-2 ring-[#31889C]/15'
                        : 'bg-white border-slate-200 hover:border-[#31889C]/50 hover:shadow-xs'
                    }`}
                  >
                    {/* Session Node Indicator on Timeline */}
                    <div
                      className={`absolute -left-[27px] sm:-left-[35px] top-5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold z-10 transition-colors ${
                        isSelected
                          ? 'border-[#31889C] bg-[#31889C] text-white shadow-xs'
                          : session.isFirst
                          ? 'border-[#31889C] bg-[#E8F5F7] text-[#215865]'
                          : 'border-slate-300 bg-white text-slate-600'
                      }`}
                    >
                      {session.sessionNumber}
                    </div>

                    {/* Card Content */}
                    <div className="p-4 sm:p-5 space-y-3">
                      {/* Top Bar of Session */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[12px] font-black uppercase tracking-wider ${
                              session.isFirst
                                ? 'bg-[#E8F5F7] text-[#215865] border border-[#BCE3EB]'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {session.sessionLabel}
                            {session.isFirst && ' (Sesi Perdana)'}
                            {session.isLatest && session.sessionNumber > 1 && ' (Sesi Terkini)'}
                          </span>

                          <span className="font-bold text-[13px] text-[#31889C] bg-[#F0F9FA] px-2 py-0.5 rounded border border-[#BCE3EB]">
                            {session.code}
                          </span>

                          <MeetingStatusBadge status={session.status} />

                          {isSelected && (
                            <span className="text-[11px] font-semibold text-[#31889C] bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#31889C] animate-pulse" />
                              Sedang Dibuka
                            </span>
                          )}
                        </div>

                        {/* Date & Time */}
                        <div className="flex items-center gap-3 text-[12px] text-slate-600 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#31889C]" />
                            {new Date(session.rawDate).toLocaleDateString('id-ID', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="flex items-center gap-1 text-slate-500">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {session.time}
                          </span>
                        </div>
                      </div>

                      {/* Title & Location */}
                      <div>
                        <h3 className="font-bold text-[15px] text-slate-900">
                          {session.title}
                        </h3>
                        <div className="flex items-center gap-4 mt-1.5 text-[12px] text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#31889C] shrink-0" />
                            <span className="line-clamp-1">{session.location}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-[#31889C] shrink-0" />
                            <span>{session.biroName}</span>
                          </span>
                          {session.primaryTeamName && (
                            <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                              Tim {session.primaryTeamName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Notula / Conclusion Preview */}
                      {session.conclusionSnippet && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[12.5px] text-slate-700">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            <FileText className="w-3.5 h-3.5 text-[#31889C]" />
                            <span>Poin Keputusan / Kesimpulan Sesi</span>
                          </div>
                          <p className="line-clamp-2 italic text-slate-600">
                            &ldquo;{session.conclusionSnippet}&rdquo;
                          </p>
                        </div>
                      )}

                      {/* Action Items Progress & Card Bottom Actions */}
                      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-[12px]">
                          <CheckCircle2
                            className={`w-4 h-4 ${
                              session.actionItems.total > 0 &&
                              session.actionItems.completed === session.actionItems.total
                                ? 'text-[#7CC563]'
                                : 'text-[#31889C]'
                            }`}
                          />
                          <span className="font-semibold text-slate-700">
                            {session.actionItems.summaryText}
                          </span>
                        </div>

                        {/* Interactive Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={downloadingId === session.id}
                            onClick={() => handleDownloadPdf(session.id, session.code)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-[#F0F9FA] hover:border-[#BCE3EB] hover:text-[#215865] text-[12px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                            title="Unduh Risalah Rapat (PDF)"
                          >
                            {downloadingId === session.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <FileDown className="w-3.5 h-3.5 text-[#31889C]" />
                            )}
                            <span>Unduh PDF</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDetail(session.id)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#31889C] text-white hover:bg-[#266F80] text-[12px] font-semibold transition-colors cursor-pointer shadow-2xs"
                            title="Buka notula dan tindak lanjut lengkap rapat ini"
                          >
                            <span>Buka Notula &amp; Detail</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#F8FAFC] border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[12px] text-slate-500 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-[#31889C] shrink-0" />
            <span>
              Setiap rapat dalam rangkaian ini saling terhubung untuk pelacakan notula dan evaluasi tindak lanjut berkelanjutan.
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {lastSession && (
              <Link
                href={`/buat-rapat?previousMeetingId=${lastSession.id}&title=${encodeURIComponent(
                  data?.agendaTitle || lastSession.title
                )}&biro=${lastSession.biroCode}`}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#BCE3EB] hover:bg-[#E8F5F7] text-[#215865] font-bold text-[12.5px] transition-colors shadow-2xs cursor-pointer"
                title="Buat sesi pertemuan lanjutan untuk agenda ini"
              >
                <Plus className="w-4 h-4 text-[#31889C]" />
                <span>+ Jadwalkan Rapat Ke-{nextSessionNumber}</span>
              </Link>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[13px] font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
