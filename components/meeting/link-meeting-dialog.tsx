'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Link2,
  Unlink,
  Calendar,
  Building2,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { linkPreviousMeetingAction, getMeetingOptionsAction } from '@/app/actions/meeting-actions';
import { toast } from '@/components/providers/toast-provider';

interface LinkMeetingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentMeetingId: string;
  currentMeetingNumber?: string;
  currentLinkedMeetingId?: string | null;
  onLinkedSuccess?: (updatedMeeting: any) => void;
}

export function LinkMeetingDialog({
  isOpen,
  onClose,
  currentMeetingId,
  currentMeetingNumber,
  currentLinkedMeetingId,
  onLinkedSuccess,
}: LinkMeetingDialogProps) {
  const [search, setSearch] = useState('');
  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(currentLinkedMeetingId || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedId(currentLinkedMeetingId || null);
      setSearch('');
      setIsLoading(true);

      getMeetingOptionsAction(currentMeetingId)
        .then((res) => {
          if (res.success && res.data) {
            setMeetings(res.data);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, currentMeetingId, currentLinkedMeetingId]);

  if (!isOpen) return null;

  const filteredMeetings = meetings.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.meetingNumber?.toLowerCase().includes(q) ||
      m.title?.toLowerCase().includes(q) ||
      m.primaryBiro?.code?.toLowerCase().includes(q)
    );
  });

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await linkPreviousMeetingAction(currentMeetingId, selectedId);
      if (res.success) {
        toast.success(
          selectedId
            ? 'Rapat sebelumnya berhasil ditautkan sebagai rujukan.'
            : 'Tautan rapat sebelumnya telah dilepaskan.'
        );
        onClose();
        if (onLinkedSuccess) onLinkedSuccess(res.data);
      } else {
        toast.error(res.error || 'Gagal menyimpan tautan rapat.');
      }
    } catch {
      toast.error('Terjadi kesalahan sistem.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-amber-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-amber-100/60 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                Alur Rapat Lanjutan
              </span>
              <h2 className="text-[17px] font-bold text-slate-900">
                Tautkan Rapat Sebelumnya
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-amber-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-[13px]">
          <p className="text-slate-600 leading-relaxed text-[12.5px]">
            Pilih rapat terdahulu yang menjadi dasar/rujukan untuk rapat <strong>{currentMeetingNumber || 'ini'}</strong>.
            Peserta dapat langsung memeriksa notula dan memantau evaluasi tindak lanjut rapat sebelumnya.
          </p>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nomor naskah, judul rapat, atau biro..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-[13px] bg-white text-slate-900"
            />
          </div>

          {/* Option to Unlink (None) */}
          <div
            onClick={() => setSelectedId(null)}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedId === null
                ? 'bg-amber-50/80 border-amber-500 shadow-xs'
                : 'bg-white border-slate-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  selectedId === null
                    ? 'border-amber-600 bg-amber-600 text-white'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {selectedId === null && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <span className="font-semibold text-slate-700">
                Tidak ada rapat rujukan (Rapat Mandiri / Rapat Perdana)
              </span>
            </div>
            <Unlink className="w-4 h-4 text-slate-400" />
          </div>

          {/* Meetings List */}
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
              <span>Memuat daftar rapat...</span>
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <p className="font-semibold">Tidak ada rapat yang sesuai pencarian.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {filteredMeetings.map((m) => {
                const isSelected = selectedId === m.id;
                const dateStr = new Date(m.date).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedId(m.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-50 border-amber-500 shadow-xs ring-1 ring-amber-500/20'
                        : 'bg-white border-slate-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                          isSelected
                            ? 'border-amber-600 bg-amber-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
                            {m.meetingNumber}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">
                            Biro {m.primaryBiro?.code}
                          </span>
                        </div>
                        <h4 className="font-bold text-[13px] text-slate-900 leading-snug">
                          {m.title}
                        </h4>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {dateStr}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-semibold text-[13px] transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[13px] shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <span>Simpan Rujukan Rapat</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
