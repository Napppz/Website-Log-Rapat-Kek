'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Calendar,
  Layers,
  ArrowRight,
  CheckCircle2,
  Clock,
  Building2,
  FileText,
  PlusCircle,
  BarChart3,
  CalendarDays,
  Settings,
  X,
  ExternalLink,
  ChevronRight,
  Hash,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Meeting } from '@/lib/types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateMeeting?: () => void;
}

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  category: 'action';
  icon: React.ReactNode;
  action: () => void;
}

interface BiroItem {
  id: string;
  code: string;
  name: string;
  category: 'biro';
  href: string;
}

const STATIC_BIROS: BiroItem[] = [
  {
    id: 'biro-bppk',
    code: 'BPPK',
    name: 'Biro Perencanaan & Pembentukan KEK',
    category: 'biro',
    href: '/biro/bppk',
  },
  {
    id: 'biro-pkkek',
    code: 'PKKEK',
    name: 'Biro Pengendalian KEK',
    category: 'biro',
    href: '/biro/pkkek',
  },
  {
    id: 'biro-ikk',
    code: 'IKK',
    name: 'Biro Investasi, Kerja Sama & Komunikasi',
    category: 'biro',
    href: '/biro/ikk',
  },
  {
    id: 'biro-hsdmo',
    code: 'HSDMO',
    name: 'Biro Hukum, SDM & Organisasi',
    category: 'biro',
    href: '/biro/hsdmo',
  },
  {
    id: 'biro-uk',
    code: 'UK',
    name: 'Biro Umum & Keuangan',
    category: 'biro',
    href: '/biro/uk',
  },
];

export function CommandPalette({ isOpen, onClose, onCreateMeeting }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'meetings' | 'biros' | 'actions'>('all');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open & load meetings cache
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
    }
  }, [isOpen]);

  // Quick action navigation shortcuts
  const quickActions: QuickAction[] = useMemo(
    () => [
      {
        id: 'act-new-meeting',
        title: 'Buat Agenda Rapat Baru',
        subtitle: 'Buka formulir registrasi notula & jadwal sidang baru',
        category: 'action',
        icon: <PlusCircle className="w-4 h-4 text-[#1E6B7B]" />,
        action: () => {
          onClose();
          if (onCreateMeeting) onCreateMeeting();
          else router.push('/buat-rapat');
        },
      },
      {
        id: 'act-all-meetings',
        title: 'Semua Risalah Rapat',
        subtitle: 'Lihat seluruh daftar arsip dan log sidang KEK',
        category: 'action',
        icon: <FileText className="w-4 h-4 text-[#31889C]" />,
        action: () => {
          onClose();
          router.push('/semua-rapat');
        },
      },
      {
        id: 'act-followups',
        title: 'Tindak Lanjut & Matriks Keputusan',
        subtitle: 'Pantau status resolusi dan action items tiap biro',
        category: 'action',
        icon: <Clock className="w-4 h-4 text-[#F99D1C]" />,
        action: () => {
          onClose();
          router.push('/tindak-lanjut');
        },
      },
      {
        id: 'act-calendar',
        title: 'Kalender Agenda Sidang KEK',
        subtitle: 'Jadwal pertemuan fisik & daring bulan ini',
        category: 'action',
        icon: <CalendarDays className="w-4 h-4 text-[#7CC563]" />,
        action: () => {
          onClose();
          router.push('/kalender');
        },
      },
      {
        id: 'act-reports',
        title: 'Laporan & Statistik Eksekutif',
        subtitle: 'Statistik produktivitas dan kepatuhan tindak lanjut',
        category: 'action',
        icon: <BarChart3 className="w-4 h-4 text-[#0284C7]" />,
        action: () => {
          onClose();
          router.push('/laporan');
        },
      },
      {
        id: 'act-settings',
        title: 'Pengaturan Sistem',
        subtitle: 'Konfigurasi akun, preferensi dan manajemen pengguna',
        category: 'action',
        icon: <Settings className="w-4 h-4 text-slate-500" />,
        action: () => {
          onClose();
          router.push('/pengaturan');
        },
      },
    ],
    [onClose, onCreateMeeting, router]
  );

  // Filtered Results
  const filteredActions = useMemo(() => {
    if (!query.trim()) return quickActions;
    const q = query.toLowerCase();
    return quickActions.filter(
      (a) => a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q)
    );
  }, [query, quickActions]);

  const filteredBiros = useMemo(() => {
    if (!query.trim()) return STATIC_BIROS;
    const q = query.toLowerCase();
    return STATIC_BIROS.filter(
      (b) => b.code.toLowerCase().includes(q) || b.name.toLowerCase().includes(q)
    );
  }, [query]);

  const filteredMeetings = useMemo(() => {
    if (!query.trim()) return meetings.slice(0, 5); // default show latest 5
    const q = query.toLowerCase();
    return meetings.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        (m.location && m.location.toLowerCase().includes(q)) ||
        (m.biroName && m.biroName.toLowerCase().includes(q)) ||
        (m.biroCode && m.biroCode.toLowerCase().includes(q))
    ).slice(0, 15);
  }, [query, meetings]);

  // Combined active list for arrow key navigation
  const activeItems = useMemo(() => {
    const list: Array<
      | { type: 'meeting'; item: Meeting }
      | { type: 'biro'; item: BiroItem }
      | { type: 'action'; item: QuickAction }
    > = [];

    if (activeTab === 'all' || activeTab === 'meetings') {
      filteredMeetings.forEach((m) => list.push({ type: 'meeting', item: m }));
    }
    if (activeTab === 'all' || activeTab === 'biros') {
      filteredBiros.forEach((b) => list.push({ type: 'biro', item: b }));
    }
    if (activeTab === 'all' || activeTab === 'actions') {
      filteredActions.forEach((a) => list.push({ type: 'action', item: a }));
    }
    return list;
  }, [activeTab, filteredMeetings, filteredBiros, filteredActions]);

  // Handle keyboard events (ArrowUp, ArrowDown, Enter, Escape)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < activeItems.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : activeItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = activeItems[selectedIndex];
      if (current) {
        if (current.type === 'meeting') {
          onClose();
          router.push(`/semua-rapat/${current.item.id}`);
        } else if (current.type === 'biro') {
          onClose();
          router.push(current.item.href);
        } else if (current.type === 'action') {
          current.item.action();
        }
      }
    }
  };

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
            onKeyDown={handleKeyDown}
            placeholder="Ketik nomor rapat (misal: 012), nama agenda, atau biro..."
            className="w-full bg-transparent text-slate-800 text-[14px] placeholder:text-slate-400 focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-mono font-medium text-slate-500 bg-white border border-slate-200 rounded-md shadow-2xs">
              ESC
            </kbd>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 bg-white text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('all');
              setSelectedIndex(0);
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
            }}
            className={cn(
              'px-3 py-1 rounded-lg transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1.5',
              activeTab === 'meetings'
                ? 'bg-[#1E6B7B] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Rapat ({filteredMeetings.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('biros');
              setSelectedIndex(0);
            }}
            className={cn(
              'px-3 py-1 rounded-lg transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1.5',
              activeTab === 'biros'
                ? 'bg-[#1E6B7B] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Biro ({filteredBiros.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('actions');
              setSelectedIndex(0);
            }}
            className={cn(
              'px-3 py-1 rounded-lg transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1.5',
              activeTab === 'actions'
                ? 'bg-[#1E6B7B] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Aksi Cepat ({filteredActions.length})</span>
          </button>
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-2 divide-y divide-slate-100 flex-1">
          {activeItems.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Tidak ada hasil ditemukan</p>
              <p className="text-xs text-slate-400 mt-1">
                Coba gunakan kata kunci nomor agenda, biro, atau bersihkan pencarian.
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
                      router.push(`/semua-rapat/${m.id}`);
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
                          {m.status === 'FINAL' && (
                            <Badge variant="final" dot className="text-[10px] py-0 px-2">
                              FINAL
                            </Badge>
                          )}
                          {m.status === 'APPROVED' && (
                            <Badge variant="approved" dot className="text-[10px] py-0 px-2">
                              APPROVED
                            </Badge>
                          )}
                          {m.status === 'REVIEW' && (
                            <Badge variant="review" dot className="text-[10px] py-0 px-2">
                              REVIEW
                            </Badge>
                          )}
                          {m.status === 'DRAFT' && (
                            <Badge variant="draft" dot className="text-[10px] py-0 px-2">
                              DRAFT
                            </Badge>
                          )}
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

              if (entry.type === 'biro') {
                const b = entry.item;
                return (
                  <div
                    key={`biro-${b.id}`}
                    id={`cmd-item-${index}`}
                    onClick={() => {
                      onClose();
                      router.push(b.href);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      'flex items-center justify-between gap-3 p-3 rounded-xl cursor-pointer transition-all',
                      isSelected ? 'bg-[#F0F8FA] border border-[#BCE3EB]/80' : 'hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#ECF8E9] border border-[#D2EFCA] flex items-center justify-center text-[#15803D] shrink-0 shadow-2xs font-bold text-xs">
                        {b.code}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-slate-900 truncate">{b.name}</h4>
                        <p className="text-xs text-slate-500">Dashboard Khusus {b.code}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                );
              }

              if (entry.type === 'action') {
                const a = entry.item;
                return (
                  <div
                    key={`action-${a.id}`}
                    id={`cmd-item-${index}`}
                    onClick={a.action}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      'flex items-center justify-between gap-3 p-3 rounded-xl cursor-pointer transition-all',
                      isSelected ? 'bg-[#F0F8FA] border border-[#BCE3EB]/80' : 'hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                        {a.icon}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-slate-900 truncate">{a.title}</h4>
                        <p className="text-xs text-slate-500 truncate">{a.subtitle}</p>
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
          <span className="text-slate-400">Pencarian Cepat Agenda KEK</span>
        </div>
      </div>
    </div>
  );
}
