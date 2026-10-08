'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, User, X, Layers, UserX } from 'lucide-react';

export interface PicUserOption {
  id: string;
  name: string;
  email?: string | null;
  biroId?: string | null;
  teamId?: string | null;
}

export interface PicBiroOption {
  id: string;
  code: string;
  shortName: string;
  name: string;
}

interface PicComboboxProps {
  value: string;
  onChange: (userId: string) => void;
  users: PicUserOption[];
  biros?: PicBiroOption[];
  selectedBiroId?: string;
  selectedTeamId?: string;
  disabled?: boolean;
  placeholder?: string;
}

export const getPicTeamDetails = (teamId?: string | null) => {
  if (teamId === 'TIM-001') {
    return {
      id: 'TIM-001',
      code: 'INV',
      name: 'Tim Investasi',
      shortName: 'Investasi',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      avatarClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotClass: 'bg-emerald-500',
    };
  }
  if (teamId === 'TIM-003') {
    return {
      id: 'TIM-003',
      code: 'KS',
      name: 'Tim Kerja Sama',
      shortName: 'Kerja Sama',
      badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
      avatarClass: 'bg-sky-50 text-sky-700 border-sky-200',
      dotClass: 'bg-sky-500',
    };
  }
  if (teamId === 'TIM-002') {
    return {
      id: 'TIM-002',
      code: 'KOM',
      name: 'Tim Komunikasi',
      shortName: 'Komunikasi',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      avatarClass: 'bg-amber-50 text-amber-700 border-amber-200',
      dotClass: 'bg-amber-500',
    };
  }
  return null;
};

export function PicCombobox({
  value,
  onChange,
  users = [],
  biros = [],
  selectedBiroId,
  selectedTeamId,
  disabled = false,
  placeholder = 'Pilih Pejabat / PIC...',
}: PicComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTeamFilter, setActiveTeamFilter] = useState<string>('ALL');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Map of biroId -> biro code/name
  const biroMap = useMemo(() => {
    const map = new Map<string, PicBiroOption>();
    biros.forEach((b) => map.set(b.id, b));
    return map;
  }, [biros]);

  // Selected user object
  const selectedUser = useMemo(() => {
    return users.find((u) => u.id === value) || null;
  }, [users, value]);

  // Selected user team details
  const selectedUserTeam = useMemo(() => {
    return selectedUser ? getPicTeamDetails(selectedUser.teamId) : null;
  }, [selectedUser]);

  // Count users per team
  const teamCounts = useMemo(() => {
    return {
      ALL: users.length,
      'TIM-001': users.filter((u) => u.teamId === 'TIM-001').length,
      'TIM-003': users.filter((u) => u.teamId === 'TIM-003').length,
      'TIM-002': users.filter((u) => u.teamId === 'TIM-002').length,
    };
  }, [users]);

  // Auto-focus search input when opened & sync initial filter tab
  useEffect(() => {
    if (isOpen) {
      if (selectedTeamId && ['TIM-001', 'TIM-002', 'TIM-003'].includes(selectedTeamId)) {
        setActiveTeamFilter(selectedTeamId);
      } else {
        setActiveTeamFilter('ALL');
      }
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen, selectedTeamId]);

  // Click outside listener & Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return users.filter((u) => {
      // Team filter
      if (activeTeamFilter !== 'ALL' && u.teamId !== activeTeamFilter) {
        return false;
      }

      // Search query filter
      if (!query) return true;

      const nameMatch = u.name.toLowerCase().includes(query);
      const emailMatch = u.email ? u.email.toLowerCase().includes(query) : false;
      const team = getPicTeamDetails(u.teamId);
      const teamMatch = team
        ? team.name.toLowerCase().includes(query) ||
          team.shortName.toLowerCase().includes(query) ||
          team.code.toLowerCase().includes(query)
        : false;

      return nameMatch || emailMatch || teamMatch;
    });
  }, [users, searchQuery, activeTeamFilter]);

  const handleSelect = (userId: string) => {
    onChange(userId);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full px-3 py-2 rounded-lg border text-left text-[13px] min-h-[38px] transition-all flex items-center justify-between gap-2 cursor-pointer ${
          isOpen
            ? 'border-[#31889C] ring-2 ring-[#31889C]/20 bg-white'
            : 'border-slate-200 hover:border-slate-300 bg-white'
        } ${disabled ? 'bg-slate-50 cursor-not-allowed opacity-60' : ''}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedUser ? (
            <>
              <div
                className={`w-5 h-5 rounded-full font-bold text-[9px] flex items-center justify-center shrink-0 border ${
                  selectedUserTeam ? selectedUserTeam.avatarClass : 'bg-[#E8F5F7] text-[#1E6B7B] border-[#BCE3EB]'
                }`}
              >
                {getUserInitials(selectedUser.name)}
              </div>
              <div className="min-w-0 flex-1 flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-slate-800 truncate text-[13px]">
                  {selectedUser.name}
                </span>
                {selectedUserTeam ? (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border shrink-0 ${selectedUserTeam.badgeClass}`}>
                    {selectedUserTeam.name}
                  </span>
                ) : null}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-slate-400">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{placeholder}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {selectedUser && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClear(e as any);
                }
              }}
              className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
              title="Kosongkan PIC"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#31889C]' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute z-50 right-0 mt-1.5 w-[390px] sm:w-[450px] max-w-[calc(100vw-2.5rem)] bg-white rounded-xl border border-slate-200 shadow-2xl ring-1 ring-black/5 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Header & Filter Section */}
          <div className="p-2.5 bg-slate-50/90 border-b border-slate-200/90 space-y-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau email personil..."
                className="w-full pl-8 pr-7 py-1.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#31889C] focus:ring-1 focus:ring-[#31889C] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Segmented Team Filter Tabs (3 Tim Kerja) */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/70 rounded-xl text-[11px]">
              <button
                type="button"
                onClick={() => setActiveTeamFilter('ALL')}
                className={`py-1 px-1 rounded-lg text-center font-medium transition-all cursor-pointer truncate ${
                  activeTeamFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({teamCounts.ALL})
              </button>

              <button
                type="button"
                onClick={() => setActiveTeamFilter('TIM-001')}
                className={`py-1 px-1 rounded-lg text-center font-medium transition-all cursor-pointer flex items-center justify-center gap-1 truncate ${
                  activeTeamFilter === 'TIM-001'
                    ? 'bg-white text-emerald-800 shadow-2xs font-bold border border-emerald-300'
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
                title="Filter PIC Tim Investasi"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">Investasi ({teamCounts['TIM-001']})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTeamFilter('TIM-003')}
                className={`py-1 px-1 rounded-lg text-center font-medium transition-all cursor-pointer flex items-center justify-center gap-1 truncate ${
                  activeTeamFilter === 'TIM-003'
                    ? 'bg-white text-sky-800 shadow-2xs font-bold border border-sky-300'
                    : 'text-slate-600 hover:text-sky-700'
                }`}
                title="Filter PIC Tim Kerja Sama"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                <span className="truncate">Kerja Sama ({teamCounts['TIM-003']})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTeamFilter('TIM-002')}
                className={`py-1 px-1 rounded-lg text-center font-medium transition-all cursor-pointer flex items-center justify-center gap-1 truncate ${
                  activeTeamFilter === 'TIM-002'
                    ? 'bg-white text-amber-800 shadow-2xs font-bold border border-amber-300'
                    : 'text-slate-600 hover:text-amber-700'
                }`}
                title="Filter PIC Tim Komunikasi"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span className="truncate">Komunikasi ({teamCounts['TIM-002']})</span>
              </button>
            </div>
          </div>

          {/* Unassign / Kosongkan PIC Option */}
          <div className="p-1 border-b border-slate-100 bg-white">
            <button
              type="button"
              onClick={() => handleSelect('')}
              className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                !value
                  ? 'bg-[#F0F9FA] text-[#1E6B7B] font-semibold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <UserX className="w-3.5 h-3.5 text-slate-400" />
                <span>Belum Ditentukan (Kosongkan PIC / Kolektif Tim)</span>
              </div>
              {!value && <Check className="w-3.5 h-3.5 text-[#1E6B7B]" />}
            </button>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => {
                const isSelected = u.id === value;
                const userTeam = getPicTeamDetails(u.teamId);

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelect(u.id)}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer group ${
                      isSelected
                        ? 'bg-[#F0F9FA] text-[#1E6B7B]'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Avatar initials badge with team color */}
                      <div
                        className={`w-7 h-7 rounded-full font-bold text-[10px] flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? 'bg-[#1E6B7B] text-white border-[#1E6B7B]'
                            : userTeam
                            ? userTeam.avatarClass
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {getUserInitials(u.name)}
                      </div>

                      {/* User Info */}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p
                            className={`font-semibold text-xs truncate ${
                              isSelected ? 'text-[#1E6B7B]' : 'text-slate-900 group-hover:text-[#31889C]'
                            }`}
                          >
                            {u.name}
                          </p>
                          {userTeam && (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold shrink-0 border ${userTeam.badgeClass}`}
                            >
                              {userTeam.name}
                            </span>
                          )}
                        </div>

                        {u.email && (
                          <p className="text-[11px] text-slate-400 truncate">
                            {u.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#1E6B7B] shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-slate-400 space-y-1">
                <p className="text-xs font-semibold text-slate-700">Personil tidak ditemukan</p>
                <p className="text-[11px] text-slate-400">
                  {searchQuery
                    ? `Tidak ada PIC yang cocok dengan kata kunci "${searchQuery}".`
                    : activeTeamFilter !== 'ALL'
                    ? 'Tidak ada personil yang terdaftar pada tim ini.'
                    : 'Tidak ada daftar personil yang tersedia.'}
                </p>
              </div>
            )}
          </div>

          {/* Footer status */}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[10.5px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-[#31889C]" />
              <span>
                Menampilkan <strong>{filteredUsers.length}</strong> dari {users.length} personil
              </span>
            </span>
            <span>Tekan ESC untuk menutup</span>
          </div>
        </div>
      )}
    </div>
  );
}
