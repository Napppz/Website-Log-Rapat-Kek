'use client';

import React, { useState } from 'react';
import {
  X,
  History,
  Calendar,
  Building2,
  User,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  FileDown,
  Copy,
  Link2,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/components/providers/toast-provider';
import { ActionItemStatusBadge, ActionItemPriorityBadge } from '../action-items/action-item-status-badge';

interface PreviousMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  previousMeeting: any;
  onOpenLinkDialog?: () => void;
  onCopyConclusion?: (text: string) => void;
}

function formatIndonesianDate(d: Date | string | undefined): string {
  if (!d) return '-';
  try {
    const obj = typeof d === 'string' ? new Date(d) : d;
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];
    return `${days[obj.getDay()]}, ${obj.getDate()} ${months[obj.getMonth()]} ${obj.getFullYear()}`;
  } catch {
    return String(d);
  }
}

export function PreviousMeetingModal({
  isOpen,
  onClose,
  previousMeeting,
  onOpenLinkDialog,
  onCopyConclusion,
}: PreviousMeetingModalProps) {
  const [activeTab, setActiveTab] = useState<'minutes' | 'actionItems'>('minutes');
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  if (!isOpen || !previousMeeting) return null;

  const minutes = previousMeeting.minutes;
  const actionItems = previousMeeting.actionItems || [];

  // Summary counts
  const totalItems = actionItems.length;
  const completedItems = actionItems.filter((i: any) => i.status === 'COMPLETED').length;
  const inProgressItems = actionItems.filter((i: any) => i.status === 'IN_PROGRESS').length;
  const pendingItems = actionItems.filter(
    (i: any) => i.status === 'PENDING' && new Date(i.dueDate).getTime() >= Date.now()
  ).length;
  const overdueItems = actionItems.filter(
    (i: any) => i.status !== 'COMPLETED' && new Date(i.dueDate).getTime() < Date.now()
  ).length;

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      const res = await fetch(`/api/meetings/${previousMeeting.id}/pdf`);
      if (!res.ok) throw new Error('Gagal mengunduh PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Notula-Rapat-${previousMeeting.meetingNumber || 'KEK'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Notula rapat sebelumnya berhasil diunduh.');
    } catch {
      toast.error('Gagal mengunduh dokumen PDF rapat sebelumnya.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleCopyText = (content: any) => {
    if (!content) return;
    try {
      let textToCopy = '';
      if (typeof content === 'string') {
        textToCopy = content;
      } else if (Array.isArray(content?.content)) {
        textToCopy = content.content
          .map((node: any) =>
            node.content ? node.content.map((c: any) => c.text).join('') : ''
          )
          .join('\n');
      }

      if (textToCopy) {
        navigator.clipboard.writeText(textToCopy);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        toast.success('Poin kesimpulan berhasil disalin ke papan klip.');
        if (onCopyConclusion) onCopyConclusion(textToCopy);
      }
    } catch {
      toast.error('Gagal menyalin teks.');
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
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs shadow-inner">
              <History className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-100">
                Rujukan Rapat Sebelumnya
              </span>
              <h2 className="text-[17px] font-bold text-white leading-tight">
                {previousMeeting.meetingNumber} — {previousMeeting.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Meeting Metadata Banner */}
        <div className="px-6 py-3 bg-amber-50/70 border-b border-amber-200 text-[12px] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 text-slate-700">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              {formatIndonesianDate(previousMeeting.date)}
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              {previousMeeting.startTime} - {previousMeeting.endTime} WIB
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              Biro {previousMeeting.primaryBiro?.code}
            </span>
            {previousMeeting.chairperson?.name && (
              <span className="inline-flex items-center gap-1.5 font-medium">
                <User className="w-3.5 h-3.5 text-amber-600" />
                {previousMeeting.chairperson.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isDownloadingPdf}
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 text-[11px] font-semibold transition-colors shadow-2xs cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>{isDownloadingPdf ? 'Mengunduh...' : 'Unduh PDF'}</span>
            </button>
            <Link
              href={`/semua-rapat/${previousMeeting.id}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600 text-white hover:bg-amber-700 text-[11px] font-semibold transition-colors shadow-2xs cursor-pointer"
            >
              <span>Buka di Tab Baru</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="px-6 border-b border-slate-200 flex gap-6 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('minutes')}
            className={`py-3 text-[13px] font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'minutes'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Notula & Kesimpulan Rapat</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('actionItems')}
            className={`py-3 text-[13px] font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'actionItems'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Progres Tindak Lanjut ({completedItems}/{totalItems} Selesai)</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-[13px] text-slate-800 space-y-4">
          {activeTab === 'minutes' && (
            <div className="space-y-5">
              {!minutes && (
                <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                  <p className="font-semibold text-slate-700">Belum ada dokumen notula yang tersimpan untuk rapat ini.</p>
                </div>
              )}

              {minutes && (
                <>
                  {/* Agenda */}
                  {minutes.agenda && (
                    <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 space-y-1.5">
                      <h4 className="text-[12px] font-bold text-amber-800 uppercase tracking-wider">
                        Agenda Rapat
                      </h4>
                      <div className="text-slate-900 leading-relaxed font-['Arial',sans-serif]">
                        {typeof minutes.agenda === 'string'
                          ? minutes.agenda
                          : minutes.agenda.content?.map((n: any, idx: number) => (
                              <p key={idx}>{n.content?.map((c: any) => c.text).join('')}</p>
                            )) || '-'}
                      </div>
                    </div>
                  )}

                  {/* Substansi Inti Pembahasan */}
                  {minutes.discussion && (
                    <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                      <h4 className="text-[12px] font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                        <span>Substansi Inti Pembahasan</span>
                      </h4>
                      <div className="text-slate-800 leading-relaxed font-['Arial',sans-serif] space-y-2 text-justify">
                        {typeof minutes.discussion === 'string'
                          ? minutes.discussion
                          : minutes.discussion.content?.map((n: any, idx: number) => {
                              const text = n.content?.map((c: any) => c.text).join('');
                              return text ? <p key={idx}>{text}</p> : null;
                            }) || '-'}
                      </div>
                    </div>
                  )}

                  {/* Kesepakatan & Arahan Sidang */}
                  {minutes.decisions && (
                    <div className="p-4 bg-sky-50/60 rounded-xl border border-sky-200 space-y-2">
                      <h4 className="text-[12px] font-bold text-sky-800 uppercase tracking-wider">
                        Kesepakatan &amp; Arahan Sidang
                      </h4>
                      <div className="text-slate-800 leading-relaxed font-['Arial',sans-serif] space-y-2">
                        {typeof minutes.decisions === 'string'
                          ? minutes.decisions
                          : minutes.decisions.content?.map((n: any, idx: number) => {
                              const text = n.content?.map((c: any) => c.text).join('');
                              return text ? <p key={idx}>{text}</p> : null;
                            }) || '-'}
                      </div>
                    </div>
                  )}

                  {/* Kesimpulan */}
                  {minutes.conclusion && (
                    <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[12px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Poin Kesimpulan Rapat</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleCopyText(minutes.conclusion)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopied ? 'Tersalin' : 'Salin Kesimpulan'}</span>
                        </button>
                      </div>
                      <div className="text-slate-900 leading-relaxed font-['Arial',sans-serif] space-y-2">
                        {typeof minutes.conclusion === 'string'
                          ? minutes.conclusion
                          : minutes.conclusion.content?.map((n: any, idx: number) => {
                              const text = n.content?.map((c: any) => c.text).join('');
                              return text ? <p key={idx}>{text}</p> : null;
                            }) || '-'}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'actionItems' && (
            <div className="space-y-4">
              {/* Progress Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="block text-[18px] font-bold text-emerald-700">{completedItems}</span>
                  <span className="text-[11px] font-semibold text-emerald-600">Selesai</span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="block text-[18px] font-bold text-amber-700">{inProgressItems}</span>
                  <span className="text-[11px] font-semibold text-amber-600">Sedang Berjalan</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="block text-[18px] font-bold text-slate-700">{pendingItems}</span>
                  <span className="text-[11px] font-semibold text-slate-600">Menunggu</span>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <span className="block text-[18px] font-bold text-rose-700">{overdueItems}</span>
                  <span className="text-[11px] font-semibold text-rose-600">Terlambat</span>
                </div>
              </div>

              {/* Items List */}
              {actionItems.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <p className="font-semibold">Tidak ada butir tindak lanjut pada rapat sebelumnya.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {actionItems.map((item: any, idx: number) => {
                    const isDone = item.status === 'COMPLETED';
                    const isLate = !isDone && new Date(item.dueDate).getTime() < Date.now();

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isDone
                            ? 'bg-emerald-50/30 border-emerald-200'
                            : isLate
                            ? 'bg-rose-50/30 border-rose-200'
                            : 'bg-white border-slate-200 hover:border-amber-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] font-bold text-slate-400">#{idx + 1}</span>
                              <h5 className={`font-bold text-[13px] ${isDone ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                                {item.title}
                              </h5>
                            </div>
                            {item.description && (
                              <p className="text-[12px] text-slate-600 pl-6 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pl-6 pt-1">
                              <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                                <Building2 className="w-3 h-3" />
                                {item.picBiro?.code || 'Biro'}
                              </span>
                              {item.picUser?.name && (
                                <span className="inline-flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {item.picUser.name}
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Tenggat: {formatIndonesianDate(item.dueDate)}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 flex flex-col items-end gap-1.5">
                            <ActionItemStatusBadge status={item.status} />
                            <ActionItemPriorityBadge priority={item.priority} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[12px]">
          {onOpenLinkDialog ? (
            <button
              type="button"
              onClick={onOpenLinkDialog}
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-amber-700 font-semibold cursor-pointer"
            >
              <Link2 className="w-4 h-4" />
              <span>Ganti / Lepas Tautan Rapat Ini</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
