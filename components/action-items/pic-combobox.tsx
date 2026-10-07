'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, User, X, Building2, UserX } from 'lucide-react';

export interface PicUserOption {
  id: string;
  name: string;
  email?: string | null;
  biroId?: string | null;
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
  disabled?: boolean;
  placeholder?: string;
}

export function PicCombobox({
  value,
  onChange,
  users = [],
  biros = [],
  selectedBiroId,
  disabled = false,
  placeholder = 'Pilih Pejabat / PIC...',
}: PicComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterByBiroOnly, setFilterByBiroOnly] = useState<boolean>(false);
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

  // Information about currently selected Biro in the form
  const currentBiro = useMemo(() => {
    return selectedBiroId ? biroMap.get(selectedBiroId) : null;
  }, [selectedBiroId, biroMap]);

  // Count how many users match the currently selected biro
  const biroUsersCount = useMemo(() => {
    if (!selectedBiroId) return 0;
    return users.filter((u) => u.biroId === selectedBiroId).length;
  }, [users, selectedBiroId]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

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
      // Biro filter toggle
      if (filterByBiroOnly && selectedBiroId && u.biroId !== selectedBiroId) {
        return false;
      }

      // Search query filter
      if (!query) return true;

      const nameMatch = u.name.toLowerCase().includes(query);
      const emailMatch = u.email ? u.email.toLowerCase().includes(query) : false;
      const userBiro = u.biroId ? biroMap.get(u.biroId) : null;
      const biroMatch = userBiro
        ? userBiro.code.toLowerCase().includes(query) ||
          userBiro.name.toLowerCase().includes(query) ||
          userBiro.shortName.toLowerCase().includes(query)
        : false;

      return nameMatch || emailMatch || biroMatch;
    });
  }, [users, searchQuery, filterByBiroOnly, selectedBiroId, biroMap]);

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
              <div className="w-5 h-5 rounded-full bg-[#E8F5F7] text-[#1E6B7B] font-bold text-[9px] flex items-center justify-center shrink-0 border border-[#BCE3EB]">
                {getUserInitials(selectedUser.name)}
              </div>
              <div className="min-w-0 flex-1 flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-slate-800 truncate text-[13px]">
                  {selectedUser.name}
                </span>
                {selectedUser.biroId && biroMap.has(selectedUser.biroId) && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                    {biroMap.get(selectedUser.biroId)?.code}
                  </span>
                )}
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
        <div className="absolute z-50 right-0 mt-1.5 w-[380px] sm:w-[420px] max-w-[calc(100vw-2.5rem)] bg-white rounded-xl border border-slate-200 shadow-2xl ring-1 ring-black/5 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Header */}
          <div className="p-2.5 bg-slate-50/80 border-b border-slate-200/80 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, email, atau biro..."
                className="w-full pl-8 pr-7 py-1.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#31889C] focus:ring-1 focus:ring-[#31889C] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Segmented Filter Pills */}
            {currentBiro && biroUsersCount > 0 && (
              <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setFilterByBiroOnly(false)}
                  className={`flex-1 py-1 px-2 rounded-md font-semibold text-center transition-all cursor-pointer ${
                    !filterByBiroOnly
                      ? 'bg-white text-slate-800 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({users.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterByBiroOnly(true)}
                  className={`flex-1 py-1 px-2 rounded-md font-semibold text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    filterByBiroOnly
                      ? 'bg-white text-[#1E6B7B] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3 h-3 text-[#31889C]" />
                  <span>Biro {currentBiro.code} ({biroUsersCount})</span>
                </button>
              </div>
            )}
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
                <span>Belum Ditentukan (Kosongkan PIC)</span>
              </div>
              {!value && <Check className="w-3.5 h-3.5 text-[#1E6B7B]" />}
            </button>
          </div>

          {/* Options List */}
          <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 text-xs [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => {
                const isSelected = u.id === value;
                const isBiroMember = Boolean(selectedBiroId && u.biroId === selectedBiroId);
                const userBiro = u.biroId ? biroMap.get(u.biroId) : null;

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
                      {/* Avatar initials badge */}
                      <div
                        className={`w-7 h-7 rounded-full font-bold text-[10px] flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? 'bg-[#1E6B7B] text-white border-[#1E6B7B]'
                            : isBiroMember
                            ? 'bg-[#E8F5F7] text-[#1E6B7B] border-[#BCE3EB]'
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
                          {userBiro && (
                            <span
                              className={`px-1 py-0.2 rounded text-[9px] font-bold shrink-0 border ${
                                isBiroMember
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {userBiro.code}
                            </span>
                          )}
                          {isBiroMember && (
                            <span className="text-[9.5px] font-medium text-emerald-600 shrink-0">
                              • Anggota Biro
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
                <p className="text-xs font-semibold text-slate-700">Pejabat tidak ditemukan</p>
                <p className="text-[11px] text-slate-400">
                  {searchQuery
                    ? `Tidak ada PIC yang cocok dengan kata kunci "${searchQuery}".`
                    : 'Tidak ada daftar pegawai yang tersedia.'}
                </p>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="px-3 py-1 bg-slate-50 border-t border-slate-100 text-[10.5px] text-slate-400 flex items-center justify-between">
            <span>{filteredUsers.length} dari {users.length} pejabat</span>
            <span>ESC untuk menutup</span>
          </div>
        </div>
      )}
    </div>
  );
}
