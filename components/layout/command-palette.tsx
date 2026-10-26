'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Calendar,
  ArrowRight,
  Users,
  X,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MeetingProgressBadge } from '@/components/meeting/meeting-status-badge';
import { cn } from '@/lib/utils';
import { Meeting } from '@/lib/types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateMeeting?: () => void;
}

interface TeamItem {
  id: string;
  code: string;
  name: string;
  category: 'team';
  biroCode?: string;
  biroName?: string;
  href: string;
}

const STATIC_TEAMS: TeamItem[] = [
  { id: 'team-hukum', code: 'HUKUM', name: 'Tim HKM', category: 'team', biroCode: 'IKK', href: '/arsip-kegiatan?tim=hukum' },
  { id: 'team-inv', code: 'INV', name: 'Tim Investasi', category: 'team', biroCode: 'IKK', href: '/arsip-kegiatan?tim=inv' },
  { id: 'team-kom', code: 'KOM', name: 'Tim Komunikasi', category: 'team', biroCode: 'IKK', href: '/arsip-kegiatan?tim=kom' },
  { id: 'team-ks', code: 'KS', name: 'Tim Kerja Sama', category: 'team', biroCode: 'IKK', href: '/arsip-kegiatan?tim=ks' },
  { id: 'team-si', code: 'SI', name: 'Tim Sistem Informasi', category: 'team', biroCode: 'IKK', href: '/arsip-kegiatan?tim=si' },
  { id: 'team-sdm', code: 'SDM', name: 'Sumber Daya Manusia', category: 'team', biroCode: 'HSDMO', href: '/arsip-kegiatan?tim=sdm' },
  { id: 'team-keu', code: 'KEU', name: 'Keuangan & Akuntansi', category: 'team', biroCode: 'UK', href: '/arsip-kegiatan?tim=keu' },
  { id: 'team-tu', code: 'TU', name: 'Tata Usaha & Persuratan', category: 'team', biroCode: 'UK', href: '/arsip-kegiatan?tim=tu' },
];

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'meetings' | 'teams'>('all');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [teams, setTeams] = useState<TeamItem[]>(STATIC_TEAMS);
  const [, setIsLoadingMeetings] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open & load meetings and dynamic teams
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);

      // Fetch latest meetings for quick search
      setIsLoadingMeetings(true);
      fetch('/api/meetings')
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setMeetings(Array.isArray(data) ? data : []))
        .catch(() => setMeetings([]))
        .finally(() => setIsLoadingMeetings(false));

      // Fetch latest dynamic teams
      fetch('/api/teams')
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setTeams(
              data.map((item: any) => ({
                id: item.id,
                code: item.code,
                name: item.name,
                category: 'team' as const,
                biroCode: item.biro?.code || '',
                biroName: item.biro?.name || '',
                href: `/arsip-kegiatan?tim=${encodeURIComponent(item.code.toLowerCase())}`,
              }))
            );
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Filtered Teams
  const filteredTeams = useMemo(() => {
    if (!query.trim()) return teams;
    const q = query.toLowerCase();
    return teams.filter(
      (t) =>
        t.code.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        (t.biroCode && t.biroCode.toLowerCase().includes(q))
    );
  }, [query, teams]);

  // Filtered Meetings
  const filteredMeetings = useMemo(() => {
    if (!query.trim()) return meetings.slice(0, 5); // default show latest 5
    const q = query.toLowerCase();
    return meetings
      .filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.code.toLowerCase().includes(q) ||
          (m.location && m.location.toLowerCase().includes(q)) ||
          (m.biroName && m.biroName.toLowerCase().includes(q)) ||
          (m.biroCode && m.biroCode.toLowerCase().includes(q))
      )
      .slice(0, 15);
  }, [query, meetings]);

  // Combined active list for arrow key navigation
  const activeItems = useMemo(() => {
    const list: Array<
      | { type: 'meeting'; item: Meeting }
      | { type: 'team'; item: TeamItem }
    > = [];

    if (activeTab === 'all' || activeTab === 'meetings') {
      filteredMeetings.forEach((m) => list.push({ type: 'meeting', item: m }));
    }
    if (activeTab === 'all' || activeTab === 'teams') {
      filteredTeams.forEach((t) => list.push({ type: 'team', item: t }));
    }
    return list;
  }, [activeTab, filteredMeetings, filteredTeams]);

  // Global keydown listener when modal is open (so Escape, Arrow keys, Enter work even when a tab or list item is clicked)
  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1 < activeItems.length ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : Math.max(0, activeItems.length - 1)));
      } else if (e.key === 'Enter') {
        const current = activeItems[selectedIndex];
        if (current) {
          e.preventDefault();
          onClose();
          if (current.type === 'meeting') {
            router.push(`/arsip-kegiatan/${current.item.id}`);
          } else if (current.type === 'team') {
            router.push(current.item.href);
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, true);
  }, [isOpen, onClose, activeItems, selectedIndex, router]);

  // Ensure selected item stays scrolled into view
  useEffect(() => {
    const el = document.getElementById(`cmd-item-${selectedIndex}`);
    if (el) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[80vh] transition-all transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-200 bg-slate-50/60">
          <Search className="w-5 h-5 text-[#1E6B7B] shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Ketik nomor kegiatan (misal: 012), nama agenda, atau tim kerja..."
            className="w-full bg-transparent text-slate-800 text-[14px] placeholder:text-slate-400 focus:outline-none"
          />
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 cursor-pointer transition-colors"
                title="Hapus pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-mono font-medium text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-md shadow-2xs cursor-pointer transition-colors"
              title="Tutup (ESC)"
            >
              ESC
            </button>
          </div>
        </div>

        {/* Category Tabs: Semua, Kegiatan, Tim (Aksi Cepat dihapus) */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 bg-white text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('all');
              setSelectedIndex(0);
              inputRef.current?.focus();
            }}
            className={cn(
              'px-3 py-1 rounded-lg transition-colors cursor-pointer shrink-0',
              activeTab === 'all'
                ? 'bg-[#1E6B7B] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('meetings');
              setSelectedIndex(0);
              inputRef.current?.focus();
            }}
            className={cn(
              'px-3 py-1 rounded-lg transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1.5',
              activeTab === 'meetings'
                ? 'bg-[#1E6B7B] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Kegiatan ({filteredMeetings.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('teams');
              setSelectedIndex(0);
              inputRef.current?.focus();
            }}
            className={cn(
              'px-3 py-1 rounded-lg transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1.5',
              activeTab === 'teams'
                ? 'bg-[#1E6B7B] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Tim ({filteredTeams.length})</span>
          </button>
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-2 divide-y divide-slate-100 flex-1">
          {activeItems.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Tidak ada hasil ditemukan</p>
              <p className="text-xs text-slate-400 mt-1">
                Coba gunakan kata kunci nomor agenda, tim kerja, atau bersihkan pencarian.
              </p>
            </div>
          ) : (
            activeItems.map((entry, index) => {
              const isSelected = index === selectedIndex;

              if (entry.type === 'meeting') {
                const m = entry.item;
                return (
                  <div
                    key={`meeting-${m.id}`}
                    id={`cmd-item-${index}`}
                    onClick={() => {
                      onClose();
                      router.push(`/arsip-kegiatan/${m.id}`);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      'flex items-center justify-between gap-3 p-3 rounded-xl cursor-pointer transition-all',
                      isSelected ? 'bg-[#F0F8FA] border border-[#BCE3EB]/80' : 'hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#1E6B7B] shrink-0 mt-0.5 shadow-2xs">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-[#1E6B7B]">
                            {m.code}
                          </span>
                          <span className="text-[11px] text-slate-400">•</span>
                          <span className="text-xs text-slate-500 font-medium">{m.date}</span>
                          <MeetingProgressBadge
                            progressStatus={(m as any).progressStatus}
                            status={m.status}
                            size="sm"
                          />
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900 truncate mt-0.5">
                          {m.title}
                        </h4>
                        <p className="text-xs text-slate-500 truncate">{m.location || 'Ruang Rapat KEK'}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                );
              }

              if (entry.type === 'team') {
                const t = entry.item;
                return (
                  <div
                    key={`team-${t.id}`}
                    id={`cmd-item-${index}`}
                    onClick={() => {
                      onClose();
                      router.push(t.href);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      'flex items-center justify-between gap-3 p-3 rounded-xl cursor-pointer transition-all',
                      isSelected ? 'bg-[#F0F8FA] border border-[#BCE3EB]/80' : 'hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#E8F5F7] border border-[#BCE3EB] flex items-center justify-center text-[#1E6B7B] shrink-0 shadow-2xs font-bold text-xs">
                        {t.code}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-slate-900 truncate">{t.name}</h4>
                        <p className="text-xs text-slate-500">
                          Tim Kerja {t.biroCode ? `• Biro ${t.biroCode}` : ''}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                );
              }

              return null;
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">
                ↓
              </kbd>
              <span>Navigasi</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">
                ↵
              </kbd>
              <span>Pilih</span>
            </span>
          </div>
          <span className="text-slate-400">Pencarian Cepat Kegiatan &amp; Tim KEK</span>
        </div>
      </div>
    </div>
  );
}
