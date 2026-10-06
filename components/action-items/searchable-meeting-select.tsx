'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  X,
  Calendar,
  Layers,
  Check,
  ChevronDown,
  ChevronUp,
  Filter,
  Building2,
  AlertCircle,
} from 'lucide-react';

export interface MeetingOption {
  id: string;
  meetingNumber: string;
  title: string;
  date?: Date | string | null;
  primaryBiro?: {
    code: string;
    name?: string;
  } | null;
}

interface SearchableMeetingSelectProps {
  meetings: MeetingOption[];
  selectedMeetingId: string;
  onSelectMeeting: (meetingId: string) => void;
  userBiroCode?: string;
  disabled?: boolean;
  isLoading?: boolean;
  error?: string;
}

/**
 * Extracts or infers Biro Code from meeting.
 * Supports primaryBiro.code or parses prefix from meetingNumber like "IKK-023" -> "IKK".
 */
function getMeetingBiroCode(m: MeetingOption): string {
  if (m.primaryBiro?.code) return m.primaryBiro.code.toUpperCase();
  const match = m.meetingNumber.match(/^([A-Za-z]+)-/);
  if (match && match[1]) return match[1].toUpperCase();
  return '';
}

/**
 * Formats date into readable Indonesian string.
 */
function formatIndonesianDate(dateValue?: Date | string | null): string {
  if (!dateValue) return '';
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function SearchableMeetingSelect({
  meetings = [],
  selectedMeetingId,
  onSelectMeeting,
  userBiroCode,
  disabled = false,
  isLoading = false,
  error,
}: SearchableMeetingSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBiroFilter, setSelectedBiroFilter] = useState<string>('ALL');
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Currently selected meeting object
  const currentMeeting = useMemo(() => {
    return meetings.find((m) => m.id === selectedMeetingId) || null;
  }, [meetings, selectedMeetingId]);

  // Extract distinct biro codes present in the available meetings
  const availableBiroCodes = useMemo(() => {
    const codes = new Set<string>();
    meetings.forEach((m) => {
      const code = getMeetingBiroCode(m);
      if (code) codes.add(code);
    });
    return Array.from(codes).sort();
  }, [meetings]);

  // Filtered meetings according to search query and selected biro filter
  const filteredMeetings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    
    return meetings.filter((m) => {
      // 1. Biro Filter
      if (selectedBiroFilter !== 'ALL') {
        const biroCode = getMeetingBiroCode(m);
        if (biroCode !== selectedBiroFilter) {
          return false;
        }
      }

      // 2. Search Query filter (matches code, title, date string, or biro)
      if (!query) return true;

      const codeMatch = m.meetingNumber.toLowerCase().includes(query);
      const titleMatch = m.title.toLowerCase().includes(query);
      const biroMatch = getMeetingBiroCode(m).toLowerCase().includes(query);
      
      const formattedDate = formatIndonesianDate(m.date).toLowerCase();
      const dateMatch = formattedDate.includes(query);

      return codeMatch || titleMatch || biroMatch || dateMatch;
    });
  }, [meetings, searchQuery, selectedBiroFilter]);

  const handleSelect = (meetingId: string) => {
    onSelectMeeting(meetingId);
    setIsOpen(false);
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    setSelectedBiroFilter('ALL');
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Selected Meeting Card / Trigger Button */}
      {currentMeeting ? (
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
            isOpen
              ? 'border-[#31889C] ring-2 ring-[#31889C]/20 bg-[#F0F9FA]'
              : 'border-slate-200 bg-white hover:border-[#31889C]/60 hover:bg-[#F8FCFC]'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-start gap-3 min-w-0 pr-2">
            <div className="w-9 h-9 rounded-lg bg-[#E8F5F7] border border-[#BCE3EB] flex items-center justify-center shrink-0 mt-0.5 text-[#215865] group-hover:scale-105 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#1E6B7B] text-white tracking-wide">
                  {currentMeeting.meetingNumber}
                </span>
                {(() => {
                  const bCode = getMeetingBiroCode(currentMeeting);
                  return bCode ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      <Building2 className="w-2.5 h-2.5 text-slate-500" />
                      {bCode}
                    </span>
                  ) : null;
                })()}
                {currentMeeting.date && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {formatIndonesianDate(currentMeeting.date)}
                  </span>
                )}
              </div>
              <p className="text-[13px] font-semibold text-slate-900 truncate max-w-[420px]" title={currentMeeting.title}>
                {currentMeeting.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-[#31889C] bg-[#E8F5F7] px-2.5 py-1 rounded-md border border-[#BCE3EB] group-hover:bg-[#31889C] group-hover:text-white transition-colors flex items-center gap-1">
              {isOpen ? 'Tutup' : 'Ganti Rapat'}
              {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || isLoading}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-white hover:border-[#31889C] text-slate-600 transition-all cursor-pointer ${
            isOpen ? 'border-[#31889C] ring-2 ring-[#31889C]/20 bg-white' : ''
          }`}
        >
          <div className="flex items-center gap-2 text-[13px]">
            <Search className="w-4 h-4 text-[#31889C]" />
            <span className="font-medium">
              {isLoading ? 'Memuat daftar rapat...' : 'Klik untuk mencari dan memilih rapat...'}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>
      )}

      {/* Dropdown Search & Filter Popover */}
      {isOpen && (
        <div className="mt-2 w-full bg-white rounded-xl border border-slate-300 shadow-xl overflow-hidden z-20 transition-all animate-in fade-in-50 zoom-in-95 duration-150">
          {/* 1. Live Search Input Bar */}
          <div className="p-3 bg-[#F8FAFC] border-b border-slate-200">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#31889C]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kode (IKK-023), agenda rapat, atau tanggal..."
                className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 bg-white text-[13px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#31889C]/30 focus:border-[#31889C]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 2. Quick Filter Chips (Biro / Kategori) */}
            <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
              <span className="text-slate-500 font-semibold flex items-center gap-1 mr-1 shrink-0">
                <Filter className="w-3 h-3 text-[#31889C]" />
                Filter:
              </span>

              {/* Semua */}
              <button
                type="button"
                onClick={() => setSelectedBiroFilter('ALL')}
                className={`px-2.5 py-1 rounded-full font-semibold transition-colors shrink-0 cursor-pointer ${
                  selectedBiroFilter === 'ALL'
                    ? 'bg-[#1E6B7B] text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Semua ({meetings.length})
              </button>

              {/* Biro Saya (If applicable) */}
              {userBiroCode && availableBiroCodes.includes(userBiroCode.toUpperCase()) && (
                <button
                  type="button"
                  onClick={() => setSelectedBiroFilter(userBiroCode.toUpperCase())}
                  className={`px-2.5 py-1 rounded-full font-semibold transition-colors shrink-0 cursor-pointer ${
                    selectedBiroFilter === userBiroCode.toUpperCase()
                      ? 'bg-[#31889C] text-white shadow-xs'
                      : 'bg-[#E8F5F7] text-[#215865] border border-[#BCE3EB] hover:bg-[#d5eef2]'
                  }`}
                >
                  ⭐ Biro Saya ({userBiroCode.toUpperCase()})
                </button>
              )}

              {/* Individual Biro Chips */}
              {availableBiroCodes.map((code) => {
                if (userBiroCode && code === userBiroCode.toUpperCase()) return null;
                const count = meetings.filter((m) => getMeetingBiroCode(m) === code).length;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setSelectedBiroFilter(code)}
                    className={`px-2.5 py-1 rounded-full font-semibold transition-colors shrink-0 cursor-pointer ${
                      selectedBiroFilter === code
                        ? 'bg-[#1E6B7B] text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {code} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Result Count & Quick Reset */}
          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Menampilkan <strong className="text-slate-800">{filteredMeetings.length}</strong> dari {meetings.length} rapat
            </span>
            {(searchQuery || selectedBiroFilter !== 'ALL') && (
              <button
                type="button"
                onClick={handleResetSearch}
                className="text-[#31889C] hover:underline font-semibold cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* 4. Scrollable Meeting List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
            {filteredMeetings.length > 0 ? (
              filteredMeetings.map((m) => {
                const isSelected = m.id === selectedMeetingId;
                const biroCode = getMeetingBiroCode(m);
                const dateStr = formatIndonesianDate(m.date);

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelect(m.id)}
                    className={`w-full text-left p-3 flex items-start justify-between gap-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#E8F5F7]/80 hover:bg-[#E8F5F7]'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isSelected
                            ? 'bg-[#1E6B7B] text-white'
                            : 'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}>
                          {m.meetingNumber}
                        </span>
                        {biroCode && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white text-slate-600 border border-slate-200">
                            {biroCode}
                          </span>
                        )}
                        {dateStr && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {dateStr}
                          </span>
                        )}
                      </div>
                      <p className={`text-[13px] leading-snug line-clamp-2 ${
                        isSelected ? 'font-bold text-[#1E6B7B]' : 'font-semibold text-slate-800'
                      }`}>
                        {m.title}
                      </p>
                    </div>

                    <div className="shrink-0 pt-0.5">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#215865] text-white text-[11px] font-bold">
                          <Check className="w-3 h-3 stroke-[3]" />
                          Terpilih
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium text-slate-500 hover:text-[#31889C] hover:bg-white border border-transparent hover:border-slate-200">
                          Pilih
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-500">
                <AlertCircle className="w-7 h-7 mx-auto mb-2 text-slate-400" />
                <p className="font-semibold text-[13px] text-slate-700">Tidak ada rapat ditemukan</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                  {searchQuery
                    ? `Tidak ditemukan rapat dengan kata kunci "${searchQuery}". Coba kata kunci lain atau reset filter.`
                    : 'Tidak ada rapat untuk filter biro ini.'}
                </p>
                <button
                  type="button"
                  onClick={handleResetSearch}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Tampilkan Semua Rapat
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1 text-[11px] text-red-600 font-semibold">{error}</p>
      )}
    </div>
  );
}
