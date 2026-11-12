'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  Link2,
  Unlink,
  Calendar,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { linkPreviousMeetingAction, getMeetingOptionsAction } from '@/app/actions/meeting-actions';
import { toast } from '@/components/providers/toast-provider';

interface LinkMeetingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentMeetingId: string;
  currentMeetingNumber?: string;
  currentMeetingTitle?: string;
  currentTeamCode?: string | null;
  currentLinkedMeetingId?: string | null;
  onLinkedSuccess?: (updatedMeeting: any) => void;
}

const TEAM_NAME_MAP: Record<string, string> = {
  INV: 'Tim Investasi',
  KS: 'Tim Kerja Sama',
  KOM: 'Tim Komunikasi',
  SI: 'Tim Sistem Informasi',
  HKM: 'Tim Hukum',
};

function resolveMeetingTeamCode(m: any): string {
  if (m?.primaryTeam?.code) return String(m.primaryTeam.code).toUpperCase();
  const num = String(m?.meetingNumber || '').toUpperCase();
  const prefix = num.split('-')[0];
  if (TEAM_NAME_MAP[prefix]) return prefix;
  return '';
}

function resolveMeetingTeamLabel(m: any): string {
  if (m?.primaryTeam?.name) {
    return m.primaryTeam.name.startsWith('Tim ')
      ? m.primaryTeam.name
      : `Tim ${m.primaryTeam.name}`;
  }
  const code = resolveMeetingTeamCode(m);
  return TEAM_NAME_MAP[code] || 'Biro 3';
}

export function LinkMeetingDialog({
  isOpen,
  onClose,
  currentMeetingId,
  currentMeetingNumber,
  currentMeetingTitle,
  currentTeamCode,
  currentLinkedMeetingId,
  onLinkedSuccess,
}: LinkMeetingDialogProps) {
  const [search, setSearch] = useState('');
  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(currentLinkedMeetingId || null);
  const [showAllTeams, setShowAllTeams] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const detectedTeamCode = useMemo(() => {
    if (currentTeamCode) return currentTeamCode.toUpperCase();
    const prefix = String(currentMeetingNumber || '').toUpperCase().split('-')[0];
    return TEAM_NAME_MAP[prefix] ? prefix : '';
  }, [currentTeamCode, currentMeetingNumber]);

  const detectedTeamLabel = TEAM_NAME_MAP[detectedTeamCode] || 'Tim Ini';

  useEffect(() => {
    if (isOpen) {
      setSelectedId(currentLinkedMeetingId || null);
      setSearch('');
      setShowAllTeams(false);
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

  const sameTeamCount = detectedTeamCode
    ? meetings.filter((m) => resolveMeetingTeamCode(m) === detectedTeamCode).length
    : meetings.length;

  const filteredMeetings = meetings.filter((m) => {
    // Filter berdasarkan tim yang sama kecuali user memilih "Semua Tim" atau item tersebut sedang terpilih
    if (detectedTeamCode && !showAllTeams && m.id !== selectedId) {
      if (resolveMeetingTeamCode(m) !== detectedTeamCode) return false;
    }

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const teamLabel = resolveMeetingTeamLabel(m).toLowerCase();
    return (
      m.meetingNumber?.toLowerCase().includes(q) ||
      m.title?.toLowerCase().includes(q) ||
      teamLabel.includes(q)
    );
  });

  const selectedMeetingObj = meetings.find((m) => m.id === selectedId) || null;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await linkPreviousMeetingAction(currentMeetingId, selectedId);
      if (res.success) {
        toast.success(
          selectedId
            ? 'Kegiatan sebelumnya berhasil ditautkan.'
            : 'Tautan kegiatan sebelumnya telah dilepaskan.'
        );
        onClose();
        if (onLinkedSuccess) onLinkedSuccess(res.data);
      } else {
        toast.error(res.error || 'Gagal menyimpan tautan kegiatan.');
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
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#31889C] text-white flex items-center justify-center shadow-2xs">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-slate-900">
                Tautkan Kegiatan Sebelumnya
              </h2>
              <p className="text-[12px] text-slate-500">
                Pilih kegiatan yang dilanjutkan oleh <strong>{currentMeetingNumber || 'kegiatan ini'}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3.5 overflow-y-auto flex-1 text-[13px]">
          {/* Search & Team Filter Row */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nomor atau judul kegiatan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#31889C]/20 focus:border-[#31889C] text-[12.5px] bg-white text-slate-900"
              />
            </div>

            {detectedTeamCode && (
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 shrink-0 self-start sm:self-stretch">
                <button
                  type="button"
                  onClick={() => setShowAllTeams(false)}
                  className={`px-2.5 py-1.5 rounded-md text-[11.5px] font-semibold transition-colors cursor-pointer ${
                    !showAllTeams
                      ? 'bg-white text-[#215865] shadow-2xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {detectedTeamLabel} ({sameTeamCount})
                </button>
                <button
                  type="button"
                  onClick={() => setShowAllTeams(true)}
                  className={`px-2.5 py-1.5 rounded-md text-[11.5px] font-semibold transition-colors cursor-pointer ${
                    showAllTeams
                      ? 'bg-white text-[#215865] shadow-2xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Semua Tim ({meetings.length})
                </button>
              </div>
            )}
          </div>

          {/* Option to Unlink (None) */}
          <div
            onClick={() => setSelectedId(null)}
            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedId === null
                ? 'bg-[#F0F9FA] border-[#31889C] shadow-2xs'
                : 'bg-white border-slate-200 hover:border-[#BCE3EB]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  selectedId === null
                    ? 'border-[#31889C] bg-[#31889C] text-white'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {selectedId === null && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <span className="font-semibold text-slate-700 text-[12.5px]">
                Tidak ada (Bukan lanjutan dari kegiatan lain)
              </span>
            </div>
            <Unlink className="w-4 h-4 text-slate-400" />
          </div>

          {/* Meetings List */}
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#31889C]" />
              <span>Memuat daftar kegiatan...</span>
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2">
              <p className="font-semibold text-xs">
                {detectedTeamCode && !showAllTeams
                  ? `Belum ada kegiatan lain di ${detectedTeamLabel}.`
                  : 'Tidak ada kegiatan yang sesuai pencarian.'}
              </p>
              {detectedTeamCode && !showAllTeams && meetings.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllTeams(true)}
                  className="text-xs font-semibold text-[#31889C] hover:underline cursor-pointer"
                >
                  Lihat kegiatan dari semua tim ({meetings.length})
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {filteredMeetings.map((m) => {
                const isSelected = selectedId === m.id;
                const dateStr = new Date(m.date).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                const teamLabel = resolveMeetingTeamLabel(m);
                const isSelesai = m.status === 'FINAL' || m.progressStatus === 'Selesai';

                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedId(m.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#F0F9FA] border-[#31889C] shadow-2xs ring-1 ring-[#31889C]/20'
                        : 'bg-white border-slate-200 hover:border-[#BCE3EB]'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                          isSelected
                            ? 'border-[#31889C] bg-[#31889C] text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[11px] font-bold text-[#215865] bg-[#E8F5F7] px-2 py-0.5 rounded">
                            {m.meetingNumber}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-600">
                            {teamLabel}
                          </span>
                          <span
                            className={`text-[10.5px] font-semibold px-1.5 py-0.5 rounded border ${
                              isSelesai
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-sky-50 text-sky-700 border-sky-200'
                            }`}
                          >
                            {isSelesai ? 'Selesai' : 'Dalam Proses'}
                          </span>
                        </div>
                        <h4 className="font-bold text-[13px] text-slate-900 leading-snug truncate">
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
                      <CheckCircle2 className="w-5 h-5 text-[#31889C] shrink-0 mt-0.5" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Visual Flow Preview when a meeting is selected */}
          {selectedMeetingObj && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="font-semibold text-slate-500">Urutan Rangkaian:</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-bold text-slate-800">
                  [{selectedMeetingObj.meetingNumber}] {selectedMeetingObj.title}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#31889C] shrink-0" />
                <span className="px-2 py-0.5 rounded bg-[#E8F5F7] border border-[#BCE3EB] font-bold text-[#215865]">
                  [{currentMeetingNumber || 'Saat Ini'}] {currentMeetingTitle || 'Kegiatan Ini'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Selama kegiatan <strong>{currentMeetingNumber}</strong> masih berjalan, kegiatan <strong>{selectedMeetingObj.meetingNumber}</strong> akan tetap berstatus <strong>Dalam Proses</strong> hingga kegiatan terakhir pada rangkaian ini selesai.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-200 font-semibold text-[13px] transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#31889C] hover:bg-[#266F80] text-white font-semibold text-[13px] shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <span>Simpan Tautan</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
