'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, User, X, Layers, UserX, Filter } from 'lucide-react';

export interface PicUserOption {
  id: string;
  name: string;
  email?: string | null;
  biroId?: string | null;
  teamId?: string | null;
  team?: {
    id?: string;
    code?: string;
    name?: string;
  } | null;
  userTeams?: Array<{
    role?: string | null;
    team: {
      id?: string;
      code?: string;
      name?: string;
    };
  }>;
}

export interface PicBiroOption {
  id: string;
  code: string;
  shortName: string;
  name: string;
}

export interface PicTeamOption {
  id: string;
  code: string;
  name: string;
  shortName?: string;
  biroId?: string;
}

interface PicComboboxProps {
  value: string;
  onChange: (userId: string) => void;
  users: PicUserOption[];
  teams?: PicTeamOption[];
  biros?: PicBiroOption[];
  selectedBiroId?: string;
  selectedTeamId?: string;
  disabled?: boolean;
  placeholder?: string;
}

export const KNOWN_TEAMS_META: Record<
  string,
  {
    code: string;
    name: string;
    shortName: string;
    badgeClass: string;
    avatarClass: string;
    dotClass: string;
  }
> = {
  INV: {
    code: 'INV',
    name: 'Tim Investasi',
    shortName: 'Investasi',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    avatarClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  KS: {
    code: 'KS',
    name: 'Tim Kerja Sama',
    shortName: 'Kerja Sama',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
    avatarClass: 'bg-sky-50 text-sky-700 border-sky-200',
    dotClass: 'bg-sky-500',
  },
  KOM: {
    code: 'KOM',
    name: 'Tim Komunikasi',
    shortName: 'Komunikasi',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    avatarClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  SI: {
    code: 'SI',
    name: 'Tim Sistem Informasi',
    shortName: 'Sistem Informasi',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
    avatarClass: 'bg-purple-50 text-purple-700 border-purple-200',
    dotClass: 'bg-purple-500',
  },
  HKM: {
    code: 'HKM',
    name: 'Tim Hukum',
    shortName: 'Hukum',
    badgeClass: 'bg-violet-50 text-violet-800 border-violet-200',
    avatarClass: 'bg-violet-50 text-violet-700 border-violet-200',
    dotClass: 'bg-violet-500',
  },
};

export type PicUserOrTeam =
  | PicUserOption
  | { id?: string; code?: string; name?: string; teamId?: string | null; team?: any; userTeams?: any }
  | string
  | null
  | undefined;

/**
 * Resolves standard team code ('INV' | 'KS' | 'KOM' | 'SI' | 'HKM') from a user object or teamId string.
 */
export function resolveTeamCode(
  userOrId?: PicUserOrTeam,
  teamsList: PicTeamOption[] = []
): string | null {
  if (!userOrId) return null;

  if (typeof userOrId === 'object') {
    const u = userOrId as any;
    if (u.code) {
      const c = String(u.code).toUpperCase();
      if (['INV', 'KS', 'KOM', 'SI', 'HKM'].includes(c)) return c;
    }
    if (u.team?.code) {
      const c = String(u.team.code).toUpperCase();
      if (['INV', 'KS', 'KOM', 'SI', 'HKM'].includes(c)) return c;
    }
    if (u.team?.name) {
      const nm = String(u.team.name).toLowerCase();
      if (nm.includes('investasi')) return 'INV';
      if (nm.includes('kerja sama') || nm.includes('kerjasama')) return 'KS';
      if (nm.includes('komunikasi')) return 'KOM';
      if (nm.includes('sistem informasi') || nm.includes('si')) return 'SI';
      if (nm.includes('hukum')) return 'HKM';
    }
    if (u.teamId) {
      const byId = resolveTeamCode(u.teamId, teamsList);
      if (byId) return byId;
    }
    if (Array.isArray(u.userTeams) && u.userTeams.length > 0) {
      for (const ut of u.userTeams) {
        const c = ut.team?.code ? String(ut.team.code).toUpperCase() : '';
        if (c && ['INV', 'KS', 'KOM', 'SI', 'HKM'].includes(c)) return c;
        const nm = ut.team?.name ? String(ut.team.name).toLowerCase() : '';
        if (nm.includes('investasi')) return 'INV';
        if (nm.includes('kerja sama') || nm.includes('kerjasama')) return 'KS';
        if (nm.includes('komunikasi')) return 'KOM';
        if (nm.includes('sistem informasi')) return 'SI';
        if (nm.includes('hukum')) return 'HKM';
      }
    }
    // Heuristic from user name or email
    const nameLower = (u.name || '').toLowerCase();
    const emailLower = (u.email || '').toLowerCase();
    if (nameLower.includes('investasi')) return 'INV';
    if (nameLower.includes('kerja sama') || nameLower.includes('kerjasama')) return 'KS';
    if (nameLower.includes('komunikasi')) return 'KOM';
    if (nameLower.includes('sistem informasi') || emailLower.startsWith('staf.si')) return 'SI';
    if (nameLower.includes('hukum')) return 'HKM';

    if (u.id) {
      const byId = resolveTeamCode(u.id, teamsList);
      if (byId) return byId;
    }
    return null;
  }

  const id = userOrId.trim();
  const idUpper = id.toUpperCase();
  if (['INV', 'KS', 'KOM', 'SI', 'HKM'].includes(idUpper)) return idUpper;
  if (id === 'TIM-001' || id === '1c2512e1-1859-42ca-874a-196848ab7acf') return 'INV';
  if (id === 'TIM-003' || id === '663d7ff9-585a-4800-8840-389a5e322779') return 'KS';
  if (id === 'TIM-002' || id === 'a3b2e91a-566c-46e5-a740-1aa944793290') return 'KOM';
  if (id === 'TIM-004' || id === 'c82de951-5fd8-4390-8cce-e663a13bedcc') return 'SI';
  if (id === 'f49c43a1-7256-436c-a1bf-68e7f3201732') return 'HKM';

  // Check in teamsList
  const found = teamsList.find((t) => t.id === id || t.code?.toUpperCase() === idUpper);
  if (found) {
    const c = found.code?.toUpperCase();
    if (c && ['INV', 'KS', 'KOM', 'SI', 'HKM'].includes(c)) return c;
    const nm = (found.name || '').toLowerCase();
    if (nm.includes('investasi')) return 'INV';
    if (nm.includes('kerja sama') || nm.includes('kerjasama')) return 'KS';
    if (nm.includes('komunikasi')) return 'KOM';
    if (nm.includes('sistem informasi')) return 'SI';
    if (nm.includes('hukum')) return 'HKM';
    return c || null;
  }

  return null;
}

/**
 * Gets styled team details for display
 */
export function getPicTeamDetails(
  userOrId?: PicUserOrTeam,
  teamsList: PicTeamOption[] = []
): {
  id: string;
  code: string;
  name: string;
  shortName: string;
  badgeClass: string;
  avatarClass: string;
  dotClass: string;
} | null {
  if (!userOrId) return null;

  const code = resolveTeamCode(userOrId, teamsList);
  if (code && KNOWN_TEAMS_META[code]) {
    const meta = KNOWN_TEAMS_META[code];
    const matchedTeam = teamsList.find(
      (t) => t.code?.toUpperCase() === code || resolveTeamCode(t.id, teamsList) === code
    );
    return {
      id: matchedTeam?.id || code,
      ...meta,
    };
  }

  // Dynamic / Custom team
  if (typeof userOrId === 'object' && userOrId.team) {
    return {
      id: userOrId.team.id || 'TIM',
      code: userOrId.team.code || 'TIM',
      name: userOrId.team.name || 'Tim Kerja',
      shortName: userOrId.team.name || 'Tim Kerja',
      badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
      avatarClass: 'bg-teal-50 text-teal-700 border-teal-200',
      dotClass: 'bg-teal-500',
    };
  }

  if (typeof userOrId === 'string') {
    const t = teamsList.find((x) => x.id === userOrId);
    if (t) {
      return {
        id: t.id,
        code: t.code || 'TIM',
        name: t.name || 'Tim Kerja',
        shortName: t.shortName || t.name || 'Tim Kerja',
        badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
        avatarClass: 'bg-teal-50 text-teal-700 border-teal-200',
        dotClass: 'bg-teal-500',
      };
    }
  }

  return null;
}

export function PicCombobox({
  value,
  onChange,
  users = [],
  teams = [],
  biros = [],
  selectedBiroId,
  selectedTeamId,
  disabled = false,
  placeholder = 'Pilih Pejabat / PIC Pelaksana...',
}: PicComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTeamFilter, setActiveTeamFilter] = useState<string>('ALL');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Selected user object
  const selectedUser = useMemo(() => {
    return users.find((u) => u.id === value) || null;
  }, [users, value]);

  // Selected user team details
  const selectedUserTeam = useMemo(() => {
    return selectedUser ? getPicTeamDetails(selectedUser, teams) : null;
  }, [selectedUser, teams]);

  // Map of userId -> array of team codes it belongs to
  const userTeamCodesMap = useMemo(() => {
    const map = new Map<string, string[]>();
    users.forEach((u) => {
      const codes: string[] = [];
      const primaryCode = resolveTeamCode(u, teams);
      if (primaryCode) codes.push(primaryCode);
      if (Array.isArray(u.userTeams)) {
        u.userTeams.forEach((ut) => {
          const c = resolveTeamCode(ut.team, teams);
          if (c && !codes.includes(c)) codes.push(c);
        });
      }
      map.set(u.id, codes);
    });
    return map;
  }, [users, teams]);

  // Count users per team
  const teamCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: users.length,
      INV: 0,
      KS: 0,
      KOM: 0,
      SI: 0,
      HKM: 0,
    };
    users.forEach((u) => {
      const codes = userTeamCodesMap.get(u.id) || [];
      codes.forEach((c) => {
        if (counts[c] !== undefined) {
          counts[c]++;
        } else {
          counts[c] = (counts[c] || 0) + 1;
        }
      });
    });
    return counts;
  }, [users, userTeamCodesMap]);

  // Filter tabs definition
  const filterTabs = useMemo(() => {
    const defaultTabs = [
      { key: 'ALL', label: 'Semua Tim', dotClass: '' },
      { key: 'INV', label: 'Tim Investasi', dotClass: 'bg-emerald-500' },
      { key: 'KS', label: 'Tim Kerja Sama', dotClass: 'bg-sky-500' },
      { key: 'KOM', label: 'Tim Komunikasi', dotClass: 'bg-amber-500' },
    ];
    if ((teamCounts.SI || 0) > 0) {
      defaultTabs.push({ key: 'SI', label: 'Tim Sistem Informasi', dotClass: 'bg-purple-500' });
    }
    if ((teamCounts.HKM || 0) > 0) {
      defaultTabs.push({ key: 'HKM', label: 'Tim Hukum', dotClass: 'bg-violet-500' });
    }
    if (teams && teams.length > 0) {
      teams.forEach((t) => {
        const code = t.code?.toUpperCase();
        if (code && !defaultTabs.some((tab) => tab.key === code)) {
          const count = teamCounts[code] ?? 0;
          if (count > 0) {
            defaultTabs.push({
              key: code,
              label: t.name || `Tim ${code}`,
              dotClass: 'bg-teal-500',
            });
          }
        }
      });
    }
    return defaultTabs;
  }, [teamCounts, teams]);

  // Auto-focus search input when opened & sync initial filter tab
  useEffect(() => {
    if (isOpen) {
      const initialCode = selectedTeamId ? resolveTeamCode(selectedTeamId, teams) : null;
      if (initialCode && ['INV', 'KS', 'KOM', 'SI', 'HKM'].includes(initialCode)) {
        setActiveTeamFilter(initialCode);
      } else {
        setActiveTeamFilter('ALL');
      }
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen, selectedTeamId, teams]);

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
      if (activeTeamFilter !== 'ALL') {
        const codes = userTeamCodesMap.get(u.id) || [];
        const filterCode = resolveTeamCode(activeTeamFilter, teams) || activeTeamFilter;
        if (!codes.includes(filterCode)) {
          return false;
        }
      }

      // Search query filter
      if (!query) return true;

      const nameMatch = u.name.toLowerCase().includes(query);
      const emailMatch = u.email ? u.email.toLowerCase().includes(query) : false;
      const team = getPicTeamDetails(u, teams);
      const teamMatch = team
        ? team.name.toLowerCase().includes(query) ||
          team.shortName.toLowerCase().includes(query) ||
          team.code.toLowerCase().includes(query)
        : false;

      return nameMatch || emailMatch || teamMatch;
    });
  }, [users, searchQuery, activeTeamFilter, userTeamCodesMap, teams]);

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

            {/* Filter Tim: Dropdown Selector Anti Geser Horizontal */}
            <div className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold shrink-0">
                <Filter className="w-3.5 h-3.5 text-[#31889C]" />
                <span>Filter Tim:</span>
              </div>

              <div className="relative flex-1 min-w-0">
                <select
                  value={activeTeamFilter}
                  onChange={(e) => setActiveTeamFilter(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-800 text-[11.5px] font-medium py-1 pl-2.5 pr-7 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#31889C] focus:border-[#31889C] cursor-pointer appearance-none truncate transition-colors"
                >
                  <option value="ALL">Semua Tim ({teamCounts.ALL} personil)</option>
                  {filterTabs
                    .filter((t) => t.key !== 'ALL')
                    .map((tab) => (
                      <option key={tab.key} value={tab.key}>
                        {tab.label} ({teamCounts[tab.key] ?? 0} personil)
                      </option>
                    ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {activeTeamFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setActiveTeamFilter('ALL')}
                  className="text-[11px] text-[#31889C] hover:text-[#215865] font-semibold hover:underline shrink-0 cursor-pointer flex items-center gap-0.5"
                  title="Tampilkan semua personil"
                >
                  <X className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
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
                const userTeam = getPicTeamDetails(u, teams);

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
