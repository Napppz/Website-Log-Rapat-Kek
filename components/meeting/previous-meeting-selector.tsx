'use client';

import React, { useState, useMemo } from 'react';
import {
  Link2,
  Search,
  Filter,
  X,
  Check,
  Calendar,
  Layers,
  RotateCcw,
  Building2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { MeetingStatus } from '@/lib/types';
import { MeetingStatusBadge } from './meeting-status-badge';
import { cn, parseMeetingDate, MONTH_SHORT_INDONESIA } from '@/lib/utils';

export interface MeetingOptionItem {
  id: string;
  meetingNumber: string;
  title: string;
  date: string | Date;
  status: string;
  primaryBiro?: {
    code: string;
    name?: string;
    shortName?: string;
  } | null;
}

interface PreviousMeetingSelectorProps {
  value: string; // previousMeetingId
  onChange: (id: string) => void;
  availableMeetings: MeetingOptionItem[];
  disabled?: boolean;
}

const BIRO_OPTIONS = [
  { code: 'ALL', label: 'Semua Biro' },
  { code: 'BPPK', label: 'BPPK' },
  { code: 'PKKEK', label: 'PKKEK' },
  { code: 'IKK', label: 'IKK' },
  { code: 'HSDMO', label: 'HSDMO' },
  { code: 'UK', label: 'UK' },
];

const BIRO_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  BPPK: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  PKKEK: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  IKK: { bg: 'bg-teal-50', text: 'text-[#1E6B7B]', border: 'border-teal-200' },
  HSDMO: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  UK: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

function formatMeetingDateDisplay(dateVal?: string | Date | null): string {
  if (!dateVal) return '-';
  const isoStr = typeof dateVal === 'string' ? dateVal : new Date(dateVal).toISOString();
  const parsed = parseMeetingDate(isoStr);
  if (parsed) {
    return `${parsed.dayName ? parsed.dayName + ', ' : ''}${parsed.day} ${MONTH_SHORT_INDONESIA[parsed.month]} ${parsed.year}`;
  }
  return String(dateVal).slice(0, 10);
}

export function PreviousMeetingSelector({
  value,
  onChange,
  availableMeetings = [],
  disabled = false,
}: PreviousMeetingSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBiro, setSelectedBiro] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Currently selected meeting object
  const currentSelectedMeeting = useMemo(() => {
    if (!value) return null;
    return availableMeetings.find((m) => m.id === value) || null;
  }, [value, availableMeetings]);

  // Counts by Biro
  const biroCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: availableMeetings.length };
    BIRO_OPTIONS.forEach((b) => {
      if (b.code !== 'ALL') counts[b.code] = 0;
    });
    availableMeetings.forEach((m) => {
      const code = m.primaryBiro?.code?.toUpperCase();
      if (code && counts[code] !== undefined) {
        counts[code] = (counts[code] || 0) + 1;
      }
    });
    return counts;
  }, [availableMeetings]);

  // Filtered and sorted meetings
  const filteredMeetings = useMemo(() => {
    let result = availableMeetings.filter((m) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.meetingNumber.toLowerCase().includes(q) ||
        (m.primaryBiro?.code && m.primaryBiro.code.toLowerCase().includes(q));

      const matchesBiro =
        selectedBiro === 'ALL' ||
        m.primaryBiro?.code?.toUpperCase() === selectedBiro;

      const matchesStatus =
        selectedStatus === 'ALL' ||
        m.status.toUpperCase() === selectedStatus.toUpperCase();

      return matchesSearch && matchesBiro && matchesStatus;
    });

    // Sort by date
    result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [availableMeetings, searchQuery, selectedBiro, selectedStatus, sortOrder]);

  const hasActiveFilters =
    searchQuery.trim() !== '' || selectedBiro !== 'ALL' || selectedStatus !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedBiro('ALL');
    setSelectedStatus('ALL');
  };

  const handleSelectMeeting = (id: string) => {
    onChange(id);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      {/* Selected Card or Trigger Button */}
      {currentSelectedMeeting ? (
        <div className="p-3.5 rounded-xl border border-teal-200/90 bg-white shadow-2xs space-y-2.5 transition-all">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                <Link2 className="w-3 h-3 text-[#1E6B7B]" />
                Rapat Lanjutan Tertaut
              </span>
              <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                {currentSelectedMeeting.meetingNumber}
              </span>
              {currentSelectedMeeting.primaryBiro && (
                <span
                  className={cn(
                    'text-[11px] font-bold px-2 py-0.5 rounded-md border',
                    BIRO_COLORS[currentSelectedMeeting.primaryBiro.code]?.bg || 'bg-slate-100',
                    BIRO_COLORS[currentSelectedMeeting.primaryBiro.code]?.text || 'text-slate-700',
                    BIRO_COLORS[currentSelectedMeeting.primaryBiro.code]?.border || 'border-slate-200'
                  )}
                >
                  Biro {currentSelectedMeeting.primaryBiro.code}
                </span>
              )}
              {currentSelectedMeeting.date && (
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {formatMeetingDateDisplay(currentSelectedMeeting.date)}
                </span>
              )}
            </div>
            {currentSelectedMeeting.status && (
              <MeetingStatusBadge
                status={currentSelectedMeeting.status as MeetingStatus}
                className="shrink-0"
              />
            )}
          </div>

          {/* Full meeting title */}
          <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-relaxed">
            {currentSelectedMeeting.title}
          </p>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-xs">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-teal-500" />
              Notulensi &amp; tindak lanjut sesi ini akan saling terhubung
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(true)}
                className="font-semibold text-[#1E6B7B] hover:text-[#175360] flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-[#1E6B7B]/10 transition-colors cursor-pointer"
              >
                <Filter className="w-3 h-3" />
                <span>Ganti Rapat</span>
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange('')}
                className="font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                title="Batalkan tautan dan jadikan rapat mandiri"
              >
                <X className="w-3 h-3" />
                <span>Lepas Tautan</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(true)}
          className="w-full text-left px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white hover:border-[#1E6B7B] hover:bg-slate-50/80 transition-all flex items-center justify-between group shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B]"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#1E6B7B]/10 flex items-center justify-center text-[#1E6B7B] group-hover:bg-[#1E6B7B] group-hover:text-white transition-colors shrink-0">
              <Search className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 truncate">
                -- Bukan Rapat Lanjutan (Rapat Mandiri) --
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                Klik untuk mencari &amp; memfilter rapat terdahulu
              </p>
            </div>
          </div>
          <span className="shrink-0 text-[11px] font-semibold text-[#1E6B7B] bg-[#1E6B7B]/10 group-hover:bg-[#1E6B7B] group-hover:text-white px-2.5 py-1 rounded-md transition-colors flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>Cari &amp; Filter ({availableMeetings.length})</span>
          </span>
        </button>
      )}

      {/* FILTER & SELECT MODAL DIALOG */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#F0F8FA] to-white border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1E6B7B]/10 border border-[#1E6B7B]/20 flex items-center justify-center text-[#1E6B7B]">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span>Filter &amp; Tautkan Rapat Lanjutan</span>
                    <span className="text-[11px] font-semibold text-[#1E6B7B] bg-[#1E6B7B]/10 px-2 py-0.5 rounded-full">
                      {availableMeetings.length} Rapat
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cari berdasarkan judul, nomor rapat, atau filter biro untuk menghubungkan tindak lanjut
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Bar Controls */}
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 space-y-3">
              {/* Search Bar Input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#1E6B7B]" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari berdasarkan judul agenda, nomor rapat, atau biro..."
                  className="w-full pl-10 pr-9 h-[40px] rounded-xl bg-white border border-slate-300 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B] shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Biro Tabs Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-slate-400 font-semibold text-[11px] shrink-0 mr-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  Biro:
                </span>
                {BIRO_OPTIONS.map((biro) => {
                  const isActive = selectedBiro === biro.code;
                  const count = biroCounts[biro.code] ?? 0;
                  return (
                    <button
                      key={biro.code}
                      type="button"
                      onClick={() => setSelectedBiro(biro.code)}
                      className={cn(
                        'px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 border text-xs',
                        isActive
                          ? 'bg-[#1E6B7B] text-white border-[#175360] shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800'
                      )}
                    >
                      <span>{biro.label}</span>
                      <span
                        className={cn(
                          'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Secondary Filters: Status & Urutan */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-semibold text-[11px]">Status:</span>
                  <div className="flex items-center gap-1">
                    {['ALL', 'FINAL', 'APPROVED', 'REVIEW', 'DRAFT'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setSelectedStatus(st)}
                        className={cn(
                          'px-2 py-0.5 rounded-md font-medium text-[11px] transition-colors border cursor-pointer',
                          selectedStatus === st
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        )}
                      >
                        {st === 'ALL' ? 'Semua Status' : st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-semibold text-[11px]">Urutan:</span>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
                    className="px-2 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 cursor-pointer focus:outline-none"
                  >
                    <option value="desc">Tanggal Terbaru</option>
                    <option value="asc">Tanggal Terlama</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Body / Results List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {/* Option to clear / Independent meeting */}
              <button
                type="button"
                onClick={() => handleSelectMeeting('')}
                className={cn(
                  'w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer group shadow-2xs',
                  !value
                    ? 'bg-teal-50/70 border-[#1E6B7B] ring-1 ring-[#1E6B7B]/30'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors',
                      !value
                        ? 'bg-[#1E6B7B] text-white'
                        : 'border border-slate-300 text-slate-400 group-hover:border-slate-400'
                    )}
                  >
                    {!value ? <Check className="w-4 h-4" /> : '—'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Bukan Rapat Lanjutan (Rapat Mandiri)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Rapat berdiri sendiri tanpa keterikatan pada butir tindak lanjut sesi terdahulu
                    </p>
                  </div>
                </div>
                {!value && (
                  <span className="text-[11px] font-semibold text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded-full shrink-0">
                    Pilihan Saat Ini
                  </span>
                )}
              </button>

              <div className="flex items-center justify-between pt-2 pb-1 px-1">
                <span className="text-[11px] font-semibold text-slate-500">
                  Menampilkan {filteredMeetings.length} dari {availableMeetings.length} rapat
                </span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-[11px] font-semibold text-[#1E6B7B] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Filter</span>
                  </button>
                )}
              </div>

              {/* Meeting List Items */}
              {filteredMeetings.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <Search className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    Tidak ada rapat yang sesuai dengan filter
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Coba sesuaikan kata kunci pencarian atau ubah filter biro &amp; status di atas.
                  </p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Tampilkan Semua Rapat</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredMeetings.map((m) => {
                    const isSelected = m.id === value;
                    const biroCode = m.primaryBiro?.code?.toUpperCase() || '';
                    const biroStyle = BIRO_COLORS[biroCode];

                    return (
                      <div
                        key={m.id}
                        onClick={() => handleSelectMeeting(m.id)}
                        className={cn(
                          'p-3 rounded-xl border text-left transition-all cursor-pointer group shadow-2xs flex flex-col gap-2',
                          isSelected
                            ? 'bg-teal-50/60 border-[#1E6B7B] ring-1 ring-[#1E6B7B]/30'
                            : 'bg-white border-slate-200 hover:border-[#1E6B7B]/50 hover:bg-slate-50/70 hover:shadow-xs'
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              {m.meetingNumber}
                            </span>
                            {m.primaryBiro && (
                              <span
                                className={cn(
                                  'text-[10.5px] font-bold px-2 py-0.5 rounded-md border',
                                  biroStyle?.bg || 'bg-slate-100',
                                  biroStyle?.text || 'text-slate-700',
                                  biroStyle?.border || 'border-slate-200'
                                )}
                              >
                                Biro {m.primaryBiro.code}
                              </span>
                            )}
                            {m.date && (
                              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                {formatMeetingDateDisplay(m.date)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {m.status && (
                              <MeetingStatusBadge
                                status={m.status as MeetingStatus}
                                className="scale-90 origin-right"
                              />
                            )}
                            {isSelected ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-[#1E6B7B] text-white">
                                <Check className="w-3 h-3" />
                                Dipilih
                              </span>
                            ) : (
                              <span className="text-[11px] font-semibold text-slate-400 group-hover:text-[#1E6B7B] transition-colors flex items-center gap-0.5">
                                <span>Pilih</span>
                                <ChevronRight className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Judul Rapat */}
                        <p className="text-xs font-semibold text-slate-800 group-hover:text-slate-900 leading-snug">
                          {m.title}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11.5px]">
                {value
                  ? 'Rapat terpilih akan ditautkan sebagai sesi pendahulu.'
                  : 'Rapat ini akan dibuat sebagai rapat mandiri.'}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
