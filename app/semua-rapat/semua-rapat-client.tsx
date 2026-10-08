'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MeetingTable } from '@/components/meeting/meeting-table';
import { MeetingStatus, BiroCode, Meeting, Biro } from '@/lib/types';
import {
  PlusCircle,
  Filter,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Check,
  X,
  UploadCloud,
  Sparkles,
  Calendar,
  Building2,
  Layers,
  HelpCircle,
  CalendarDays,
  Clock,
  RotateCcw,
  Search,
  ChevronDown,
  SlidersHorizontal,
  Tag,
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { deleteAllMeetingsAction } from '@/app/actions/meeting-actions';
import { UploadMeetingDialog } from '@/components/meeting/upload-meeting-dialog';
import { MeetingStatusGuideDialog } from '@/components/meeting/meeting-status-guide-dialog';
import { toast } from '@/components/providers/toast-provider';
import {
  parseMonthFilterIndex,
  parseDayFilterIndex,
  parseMeetingDate,
  getMonthDisplayName,
  MONTH_NAMES_INDONESIA,
  DAY_OPTIONS,
  DAY_NAMES_INDONESIA,
  cn,
} from '@/lib/utils';
import { getMeetingStatusDetail, normalizeProgressStatus, mapStatusToProgress } from '@/lib/meeting-status';
import { BIRO_LIST } from '@/lib/mock-data';

interface SemuaRapatClientProps {
  initialMeetings: Meeting[];
  availableBiros?: Biro[];
  lockedBiroCode?: string;
  currentUserBiroName?: string;
  currentUserRole?: string;
}

function normalizeBiroCode(c?: string | null): string {
  if (!c) return '';
  const upper = c.toUpperCase().trim();
  if (upper === 'PPK' || upper === 'REN' || upper === 'IT') return 'BPPK';
  if (upper === 'DAL' || upper === 'OPS') return 'PKKEK';
  if (upper === 'INV') return 'IKK';
  if (upper === 'HUK' || upper === 'LEG') return 'HSDMO';
  if (upper === 'BUK' || upper === 'ADM') return 'UK';
  return upper;
}

export function SemuaRapatClient({
  initialMeetings,
  availableBiros,
  lockedBiroCode,
  currentUserBiroName,
  currentUserRole,
}: SemuaRapatClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = currentUserRole || session?.user?.role || 'STAFF';
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isAdmin = userRole === 'ADMIN';
  const isPrivileged = isSuperAdmin || isAdmin;
  const canCreate = isPrivileged;
  const canDeleteAll = isPrivileged;

  const birosList = availableBiros && availableBiros.length > 0 ? availableBiros : BIRO_LIST;

  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [meetingsList, setMeetingsList] = useState<Meeting[]>(initialMeetings);

  useEffect(() => {
    setMeetingsList(initialMeetings.filter((m) => !deletedIds.has(m.id)));
  }, [initialMeetings, deletedIds]);

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStatusGuideOpen, setIsStatusGuideOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Filter params
  const statusParam = searchParams.get('status') as string | null;
  const kategoriParam = searchParams.get('kategori') as string | null;
  const rawTimParam = searchParams.get('tim') || searchParams.get('biro');
  const timParam = rawTimParam && rawTimParam !== 'ALL' && rawTimParam !== 'IKK' && rawTimParam !== 'BIRO-IKK' ? rawTimParam.toUpperCase() : null;
  const monthParam = searchParams.get('bulan') || searchParams.get('month');
  const yearParam = searchParams.get('tahun') || searchParams.get('year');
  const dayParam = searchParams.get('hari') || searchParams.get('day');
  const dateParam = searchParams.get('tanggal') || searchParams.get('date');

  const monthIdx = parseMonthFilterIndex(monthParam);
  const dayIdx = parseDayFilterIndex(dayParam);
  const targetYear = yearParam ? parseInt(yearParam, 10) : null;
  const targetDate = dateParam ? dateParam.trim() : null;

  // Available unique years in dataset
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(new Date().getFullYear());
    meetingsList.forEach((m) => {
      const parsed = parseMeetingDate(m.date);
      if (parsed) {
        yearsSet.add(parsed.year);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [meetingsList]);

  const isMatchTeam = (m: Meeting, code: string) => {
    const c = code.toUpperCase();
    if (c === 'ALL' || c === 'IKK' || c === 'BIRO-IKK') return true;
    if (m.primaryTeamCode?.toUpperCase() === c) return true;
    if (m.primaryTeamId?.toUpperCase().includes(c)) return true;
    if (c === 'INV' && (m.primaryTeamName?.toLowerCase().includes('investasi') || m.primaryTeamCode === 'TIM-001' || m.primaryTeamId === 'TIM-001')) return true;
    if (c === 'KS' && (m.primaryTeamName?.toLowerCase().includes('kerja sama') || m.primaryTeamCode === 'TIM-003' || m.primaryTeamId === 'TIM-003')) return true;
    if (c === 'KOM' && (m.primaryTeamName?.toLowerCase().includes('komunikasi') || m.primaryTeamCode === 'TIM-002' || m.primaryTeamId === 'TIM-002')) return true;
    return false;
  };

  // Meetings filtered by the selected Tim (Investasi, Kerja Sama, Komunikasi)
  const teamFilteredMeetings = useMemo(() => {
    if (!timParam) {
      return meetingsList;
    }
    return meetingsList.filter((m) => isMatchTeam(m, timParam));
  }, [meetingsList, timParam]);

  // Meetings filtered by Tim AND Date/Month/Day/Year AND Search Filter AND Category
  const fullyFilteredMeetings = useMemo(() => {
    return teamFilteredMeetings.filter((m) => {
      if (monthIdx !== null || dayIdx !== null || targetYear !== null || targetDate !== null) {
        const parsed = parseMeetingDate(m.date);
        if (!parsed) return false;
        if (targetDate && parsed.isoDate !== targetDate) return false;
        if (targetYear !== null && !isNaN(targetYear) && parsed.year !== targetYear) return false;
        if (monthIdx !== null && parsed.month !== monthIdx) return false;
        if (dayIdx !== null && parsed.dayOfWeek !== dayIdx) return false;
      }
      if (kategoriParam && kategoriParam !== 'ALL') {
        const cat = (m as any).documentCategory || 'UNDANGAN_INTERNAL';
        const subCat = (m as any).documentSubCategory;
        if (kategoriParam === 'UNDANGAN_INTERNAL' && cat !== 'UNDANGAN_INTERNAL') {
          return false;
        } else if (kategoriParam === 'NASKAH_MASUK' && cat !== 'NASKAH_MASUK') {
          return false;
        } else if (kategoriParam === 'DISPOSISI_SEKJEN' && (cat !== 'NASKAH_MASUK' || subCat !== 'DISPOSISI_SEKJEN')) {
          return false;
        } else if (kategoriParam === 'SURAT_EKSTERNAL' && (cat !== 'NASKAH_MASUK' || subCat !== 'SURAT_EKSTERNAL')) {
          return false;
        } else if (kategoriParam === 'SURAT_DITUNDA' && cat !== 'SURAT_DITUNDA') {
          return false;
        }
      }
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const matches =
          m.code.toLowerCase().includes(q) ||
          m.title.toLowerCase().includes(q) ||
          m.biroName.toLowerCase().includes(q) ||
          m.location.toLowerCase().includes(q) ||
          (m.primaryTeamName && m.primaryTeamName.toLowerCase().includes(q)) ||
          (m.agendaSummary && m.agendaSummary.toLowerCase().includes(q)) ||
          ((m as any).incomingLetterOrigin && (m as any).incomingLetterOrigin.toLowerCase().includes(q)) ||
          ((m as any).postponeReason && (m as any).postponeReason.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [teamFilteredMeetings, monthIdx, dayIdx, targetYear, targetDate, searchFilter, kategoriParam]);

  const countAll = fullyFilteredMeetings.length;
  const countBelumDimulai = fullyFilteredMeetings.filter(
    (m) => normalizeProgressStatus(m.progressStatus || mapStatusToProgress(m.status)) === 'Belum Dimulai'
  ).length;
  const countDalamProses = fullyFilteredMeetings.filter(
    (m) => normalizeProgressStatus(m.progressStatus || mapStatusToProgress(m.status)) === 'Dalam Proses'
  ).length;
  const countSelesai = fullyFilteredMeetings.filter(
    (m) => normalizeProgressStatus(m.progressStatus || mapStatusToProgress(m.status)) === 'Selesai'
  ).length;

  const countUndanganInternal = teamFilteredMeetings.filter(
    (m) => ((m as any).documentCategory || 'UNDANGAN_INTERNAL') === 'UNDANGAN_INTERNAL'
  ).length;
  const countNaskahMasuk = teamFilteredMeetings.filter(
    (m) => (m as any).documentCategory === 'NASKAH_MASUK'
  ).length;
  const countSuratDitunda = teamFilteredMeetings.filter(
    (m) => (m as any).documentCategory === 'SURAT_DITUNDA'
  ).length;

  const categoryFilters = [
    { label: 'Semua Kategori', value: 'ALL', count: teamFilteredMeetings.length, icon: '🏷️' },
    { label: 'Undangan Internal', value: 'UNDANGAN_INTERNAL', count: countUndanganInternal, icon: '🏢' },
    { label: 'Daftar Naskah Masuk', value: 'NASKAH_MASUK', count: countNaskahMasuk, icon: '📥' },
    { label: 'Surat Ditunda', value: 'SURAT_DITUNDA', count: countSuratDitunda, icon: '⏳' },
  ];

  const handleSelectCategory = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val === 'ALL' || !val) {
      params.delete('kategori');
    } else {
      params.set('kategori', val);
    }
    router.push(params.toString() ? `/semua-rapat?${params.toString()}` : '/semua-rapat');
  };

  const statusFilters: {
    label: string;
    value: string;
    count: number;
    sublabel?: string;
    dotColor: string;
  }[] = [
    { label: 'Semua Status', value: 'ALL', count: countAll, dotColor: 'bg-slate-400' },
    { label: 'Belum Dimulai', value: 'Belum Dimulai', count: countBelumDimulai, sublabel: 'Persiapan / Terjadwal', dotColor: 'bg-sky-500' },
    { label: 'Dalam Proses', value: 'Dalam Proses', count: countDalamProses, sublabel: 'Sedang Berjalan / Telaah', dotColor: 'bg-amber-500' },
    { label: 'Selesai', value: 'Selesai', count: countSelesai, sublabel: 'Selesai & Disahkan', dotColor: 'bg-emerald-500' },
  ];

  // Presets and date helpers
  const todayIso = new Date().toLocaleDateString('en-CA');
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12

  const hasActiveTimeFilter = Boolean(monthParam || yearParam || dayParam || dateParam);
  const isTodayPresetActive = dateParam === todayIso;
  const isThisMonthPresetActive =
    !dateParam &&
    yearParam === currentYear.toString() &&
    monthIdx === new Date().getMonth();
  const isThisYearPresetActive =
    !dateParam &&
    monthIdx === null &&
    dayIdx === null &&
    yearParam === currentYear.toString();

  const isCustomTimeActive = Boolean(
    dateParam ||
    dayParam ||
    (yearParam && !isThisYearPresetActive && !isThisMonthPresetActive) ||
    (monthParam && !isThisMonthPresetActive)
  );

  const [isCustomShelfOpen, setIsCustomShelfOpen] = useState(isCustomTimeActive);

  // Auto-open custom drawer if custom parameters exist in URL
  useEffect(() => {
    if (isCustomTimeActive) {
      setIsCustomShelfOpen(true);
    }
  }, [isCustomTimeActive]);

  const activeTimeLabel = useMemo(() => {
    if (isTodayPresetActive) return 'Hari Ini';
    if (isThisMonthPresetActive) return 'Bulan Ini';
    if (isThisYearPresetActive) return 'Tahun Ini';
    const parts = [
      targetYear ? `Tahun ${targetYear}` : null,
      monthIdx !== null ? MONTH_NAMES_INDONESIA[monthIdx] : null,
      dayIdx !== null ? `Hari ${DAY_NAMES_INDONESIA[dayIdx]}` : null,
      dateParam ? `Tgl ${dateParam}` : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(' • ') : null;
  }, [isTodayPresetActive, isThisMonthPresetActive, isThisYearPresetActive, targetYear, monthIdx, dayIdx, dateParam]);

  const hasAnyActiveFilter = Boolean(
    statusParam ||
    timParam ||
    (kategoriParam && kategoriParam !== 'ALL') ||
    hasActiveTimeFilter ||
    searchFilter.trim()
  );

  const handlePreset = (preset: 'ALL' | 'TODAY' | 'THIS_MONTH' | 'THIS_YEAR') => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('tanggal');
    params.delete('date');
    params.delete('hari');
    params.delete('day');
    params.delete('bulan');
    params.delete('month');
    params.delete('tahun');
    params.delete('year');

    if (preset === 'TODAY') {
      params.set('tanggal', todayIso);
    } else if (preset === 'THIS_MONTH') {
      params.set('tahun', currentYear.toString());
      params.set('bulan', currentMonth.toString());
    } else if (preset === 'THIS_YEAR') {
      params.set('tahun', currentYear.toString());
    }

    router.push(params.toString() ? `/semua-rapat?${params.toString()}` : '/semua-rapat');
  };

  const handleUpdateFilter = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (!val || val === 'ALL') {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });
    router.push(params.toString() ? `/semua-rapat?${params.toString()}` : '/semua-rapat');
  };

  const handleClearTimeFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('tahun');
    params.delete('year');
    params.delete('bulan');
    params.delete('month');
    params.delete('hari');
    params.delete('day');
    params.delete('tanggal');
    params.delete('date');
    router.push(params.toString() ? `/semua-rapat?${params.toString()}` : '/semua-rapat');
  };

  const handleClearAllFilters = () => {
    setSearchFilter('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('status');
    params.delete('kategori');
    params.delete('tim');
    params.delete('biro');
    params.delete('tahun');
    params.delete('year');
    params.delete('bulan');
    params.delete('month');
    params.delete('hari');
    params.delete('day');
    params.delete('tanggal');
    params.delete('date');
    router.push(params.toString() ? `/semua-rapat?${params.toString()}` : '/semua-rapat');
  };

  const getYearCount = (yr: number) => {
    return teamFilteredMeetings.filter((m) => {
      const parsed = parseMeetingDate(m.date);
      return parsed?.year === yr;
    }).length;
  };

  const getMonthCount = (mIndex: number) => {
    return teamFilteredMeetings.filter((m) => {
      const parsed = parseMeetingDate(m.date);
      if (!parsed) return false;
      if (targetYear !== null && !isNaN(targetYear) && parsed.year !== targetYear) return false;
      return parsed.month === mIndex;
    }).length;
  };

  const getDayCount = (dIndex: number) => {
    return teamFilteredMeetings.filter((m) => {
      const parsed = parseMeetingDate(m.date);
      if (!parsed) return false;
      if (targetYear !== null && !isNaN(targetYear) && parsed.year !== targetYear) return false;
      if (monthIdx !== null && parsed.month !== monthIdx) return false;
      return parsed.dayOfWeek === dIndex;
    }).length;
  };

  const handleSelectStatus = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val === 'ALL') {
      params.delete('status');
    } else {
      params.set('status', val);
    }
    router.push(params.toString() ? `/semua-rapat?${params.toString()}` : '/semua-rapat');
  };

  const ikkTeamsList = [
    { code: 'INV', name: 'Tim Investasi', shortName: 'Investasi' },
    { code: 'KS', name: 'Tim Kerja Sama', shortName: 'Kerja Sama' },
    { code: 'KOM', name: 'Tim Komunikasi', shortName: 'Komunikasi' },
  ];

  const handleSelectTeam = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('biro');
    if (val === 'ALL' || !val) {
      params.delete('tim');
    } else {
      params.set('tim', val);
    }
    router.push(params.toString() ? `/semua-rapat?${params.toString()}` : '/semua-rapat');
  };

  const handleSelectBiro = (val: string) => {
    handleSelectTeam(val);
  };

  const [openDropdown, setOpenDropdown] = useState<'TIM' | 'STATUS' | 'KATEGORI' | 'PERIODE' | null>(null);
  const filterToolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterToolbarRef.current && !filterToolbarRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openDropdown]);

  const currentTeam = ikkTeamsList.find((t) => t.code === timParam);
  const selectedTeamLabel = currentTeam ? currentTeam.name : 'Semua Tim';

  const selectedStatusObj = statusParam && statusParam !== 'ALL'
    ? statusFilters.find((s) => s.value === statusParam || normalizeProgressStatus(statusParam) === s.value)
    : statusFilters.find((s) => s.value === 'ALL');
  const selectedStatusLabel = selectedStatusObj && selectedStatusObj.value !== 'ALL'
    ? selectedStatusObj.label
    : 'Semua Status';
  const selectedStatusDot = selectedStatusObj && selectedStatusObj.value !== 'ALL'
    ? selectedStatusObj.dotColor
    : 'bg-slate-400';

  const selectedCatObj = categoryFilters.find((c) => c.value === (kategoriParam || 'ALL'));
  const selectedCatLabel = selectedCatObj && selectedCatObj.value !== 'ALL'
    ? selectedCatObj.label
    : 'Semua Kategori';
  const selectedCatIcon = selectedCatObj?.icon || '🏷️';

  const selectedPeriodeLabel = activeTimeLabel || 'Semua Periode';


  const handleDeleteAll = async () => {
    if (confirmInput.trim().toUpperCase() !== 'HAPUS') {
      return;
    }

    try {
      setIsDeletingAll(true);
      const res = await deleteAllMeetingsAction();
      if (res.success) {
        setIsDeleteModalOpen(false);
        setConfirmInput('');
        setMeetingsList([]);
        toast.success(
          `Berhasil menghapus seluruh data rapat (${res.count ?? initialMeetings.length} rapat telah dibersihkan).`
        );
        router.refresh();
      } else {
        toast.error(res.error || 'Gagal menghapus seluruh data rapat');
      }
    } catch (err: any) {
      toast.error(`Terjadi kesalahan: ${err?.message || 'Gagal menghapus rapat'}`);
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Warning banner if redirected due to unauthorized cross-bureau access */}
      {searchParams.get('denied') === 'true' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-800 text-[13px] shadow-xs animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">Akses Dibatasi: </span>
            Anda tidak memiliki hak akses untuk membuka rapat dari biro lain. Anda telah diarahkan kembali ke daftar rapat biro Anda ({lockedBiroCode}).
          </div>
        </div>
      )}

      {/* Header section: Judul Halaman & Tombol Aksi Cepat */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-[#F0F9FA] text-[#215865] border border-[#BCE3EB]">
              {lockedBiroCode ? (
                <>
                  <Building2 className="w-3.5 h-3.5 text-[#31889C]" />
                  Biro {lockedBiroCode}
                </>
              ) : (
                <>
                  <Building2 className="w-3.5 h-3.5 text-[#31889C]" />
                  Sekretariat Jenderal Dewan Nasional KEK
                </>
              )}
            </span>
            <span className="text-[12px] text-slate-300 hidden sm:inline">•</span>
            <span className="text-[12px] font-medium text-slate-500">
              Total <strong>{meetingsList.length}</strong> Risalah Terdaftar
            </span>
          </div>

          <h1 className="text-[22px] sm:text-[24px] font-extrabold text-slate-900 mt-1.5 tracking-tight">
            {lockedBiroCode
              ? `Risalah Rapat — ${currentUserBiroName || `Biro ${lockedBiroCode}`}`
              : 'Daftar Risalah Rapat KEK RI'}
          </h1>
          <p className="text-[13px] text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {lockedBiroCode
              ? `Arsip lengkap agenda, risalah keputusan, dan status tindak lanjut khusus penugasan ${currentUserBiroName || `Biro ${lockedBiroCode}`}.`
              : 'Pusat kendali agenda sidang, perumusan notula keputusan, dan pemantauan tindak lanjut seluruh Biro KEK.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-center">
          {/* Hapus Semua Rapat Button (SUPER_ADMIN / ADMIN only) */}
          {canDeleteAll && meetingsList.length > 0 && (
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 font-semibold text-[12px] transition-all cursor-pointer shadow-2xs"
              title="Hapus seluruh data rapat dari database (Hanya Administrator)"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Hapus Semua</span>
            </button>
          )}

          {canCreate && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsUploadDialogOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#31889C]/30 bg-[#F0F9FA] text-[#1B5260] font-semibold text-[12.5px] hover:bg-[#E8F5F7] shadow-2xs transition-all cursor-pointer"
                title="Unggah berkas Word, PDF, atau Teks untuk otomatis membuat rapat dan notula"
              >
                <UploadCloud className="w-4 h-4 text-[#31889C]" />
                <span>⚡ Unggah Dokumen</span>
              </button>

              <Link
                href="/buat-rapat"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#31889C] text-white font-semibold text-[12.5px] hover:bg-[#266F80] shadow-2xs hover:shadow-xs transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Jadwalkan Rapat</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* PANEL FILTER & KONTROL TERPADU (Single-Row Modern Dropdown Toolbar) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col relative z-20">
        {/* Baris Utama: Search + Dropdown Tim + Dropdown Status + Dropdown Kategori + Dropdown Periode + Aksi */}
        <div ref={filterToolbarRef} className="p-3 sm:p-3.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
          {/* 1. Input Pencarian Prominen */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-[#31889C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Cari agenda, nomor risalah, topik, atau tim..."
              className="w-full pl-9 pr-8 py-2 text-[12.5px] bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/90 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 focus:border-[#31889C] transition-all shadow-2xs"
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 2. Kelompok Filter Dropdown & Aksi */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Dropdown: Tim Kerja */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'TIM' ? null : 'TIM')}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all cursor-pointer border select-none",
                  timParam
                    ? "bg-[#F0F9FA] border-[#31889C] text-[#164E59] shadow-2xs font-bold"
                    : openDropdown === 'TIM'
                      ? "bg-slate-100 border-slate-300 text-slate-900"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                )}
                title="Filter berdasarkan Tim Kerja"
              >
                <Layers className={cn("w-3.5 h-3.5 shrink-0", timParam ? "text-[#31889C]" : "text-slate-500")} />
                <span className="truncate max-w-[120px]">{selectedTeamLabel}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5",
                    timParam ? "bg-[#31889C] text-white" : "bg-slate-100 text-slate-600"
                  )}
                >
                  {timParam ? meetingsList.filter((m) => isMatchTeam(m, timParam)).length : meetingsList.length}
                </span>
                <ChevronDown
                  className={cn(
                    "w-3 h-3 transition-transform text-slate-400",
                    openDropdown === 'TIM' && "rotate-180 text-[#31889C]"
                  )}
                />
              </button>

              {openDropdown === 'TIM' && (
                <div className="absolute left-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200/90 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Pilih Tim Kerja
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectTeam('ALL');
                      setOpenDropdown(null);
                    }}
                    className={cn(
                      "flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-[12px] text-left transition-colors cursor-pointer",
                      !timParam ? "bg-[#F0F9FA] text-[#164E59] font-bold" : "hover:bg-slate-50 text-slate-700 font-medium"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>Semua Tim</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-[10.5px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-semibold">
                        {meetingsList.length}
                      </span>
                      {!timParam && <Check className="w-3.5 h-3.5 text-[#31889C]" />}
                    </span>
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  {ikkTeamsList.map((t) => {
                    const isSelected = timParam === t.code;
                    const countForTeam = meetingsList.filter((m) => isMatchTeam(m, t.code)).length;
                    return (
                      <button
                        key={t.code}
                        type="button"
                        onClick={() => {
                          handleSelectTeam(t.code);
                          setOpenDropdown(null);
                        }}
                        className={cn(
                          "flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-[12px] text-left transition-colors cursor-pointer",
                          isSelected ? "bg-[#F0F9FA] text-[#164E59] font-bold" : "hover:bg-slate-50 text-slate-700 font-medium"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-[#31889C]" : "bg-slate-300")} />
                          <span>{t.name}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="text-[10.5px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-semibold">
                            {countForTeam}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#31889C]" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dropdown: Status Rapat */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'STATUS' ? null : 'STATUS')}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all cursor-pointer border select-none",
                  statusParam
                    ? "bg-[#F0F9FA] border-[#31889C] text-[#164E59] shadow-2xs font-bold"
                    : openDropdown === 'STATUS'
                      ? "bg-slate-100 border-slate-300 text-slate-900"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                )}
                title="Filter berdasarkan Status Rapat"
              >
                <span className={cn("w-2 h-2 rounded-full shrink-0", selectedStatusDot)} />
                <span className="truncate max-w-[120px]">{selectedStatusLabel}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5",
                    statusParam ? "bg-[#31889C] text-white" : "bg-slate-100 text-slate-600"
                  )}
                >
                  {selectedStatusObj?.count ?? countAll}
                </span>
                <ChevronDown
                  className={cn(
                    "w-3 h-3 transition-transform text-slate-400",
                    openDropdown === 'STATUS' && "rotate-180 text-[#31889C]"
                  )}
                />
              </button>

              {openDropdown === 'STATUS' && (
                <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200/90 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Status Rapat
                  </div>
                  {statusFilters.map((tab) => {
                    const isActive =
                      tab.value === 'ALL'
                        ? !statusParam
                        : statusParam === tab.value || normalizeProgressStatus(statusParam) === tab.value;
                    return (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => {
                          handleSelectStatus(tab.value);
                          setOpenDropdown(null);
                        }}
                        className={cn(
                          "flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-[12px] text-left transition-colors cursor-pointer",
                          isActive ? "bg-[#F0F9FA] text-[#164E59] font-bold" : "hover:bg-slate-50 text-slate-700 font-medium"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className={cn("w-2 h-2 rounded-full shrink-0", tab.dotColor)} />
                          <div>
                            <div>{tab.label}</div>
                            {tab.sublabel && (
                              <div className="text-[10px] text-slate-400 font-normal">{tab.sublabel}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10.5px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-semibold">
                            {tab.count}
                          </span>
                          {isActive && <Check className="w-3.5 h-3.5 text-[#31889C]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dropdown: Kategori */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'KATEGORI' ? null : 'KATEGORI')}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all cursor-pointer border select-none",
                  kategoriParam
                    ? "bg-[#F0F9FA] border-[#31889C] text-[#164E59] shadow-2xs font-bold"
                    : openDropdown === 'KATEGORI'
                      ? "bg-slate-100 border-slate-300 text-slate-900"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                )}
                title="Filter berdasarkan Kategori Naskah"
              >
                <span>{selectedCatIcon}</span>
                <span className="truncate max-w-[130px]">{selectedCatLabel}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5",
                    kategoriParam ? "bg-[#31889C] text-white" : "bg-slate-100 text-slate-600"
                  )}
                >
                  {selectedCatObj?.count ?? teamFilteredMeetings.length}
                </span>
                <ChevronDown
                  className={cn(
                    "w-3 h-3 transition-transform text-slate-400",
                    openDropdown === 'KATEGORI' && "rotate-180 text-[#31889C]"
                  )}
                />
              </button>

              {openDropdown === 'KATEGORI' && (
                <div className="absolute right-0 sm:left-0 sm:right-auto mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200/90 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Kategori Dokumen
                  </div>
                  {categoryFilters.map((cf) => {
                    const isActive = cf.value === 'ALL' ? !kategoriParam : kategoriParam === cf.value;
                    return (
                      <button
                        key={cf.value}
                        type="button"
                        onClick={() => {
                          handleSelectCategory(cf.value);
                          setOpenDropdown(null);
                        }}
                        className={cn(
                          "flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-[12px] text-left transition-colors cursor-pointer",
                          isActive ? "bg-[#F0F9FA] text-[#164E59] font-bold" : "hover:bg-slate-50 text-slate-700 font-medium"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span>{cf.icon}</span>
                          <span>{cf.label}</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10.5px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-semibold">
                            {cf.count}
                          </span>
                          {isActive && <Check className="w-3.5 h-3.5 text-[#31889C]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dropdown: Periode Waktu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'PERIODE' ? null : 'PERIODE')}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all cursor-pointer border select-none",
                  hasActiveTimeFilter
                    ? "bg-[#F0F9FA] border-[#31889C] text-[#164E59] shadow-2xs font-bold"
                    : openDropdown === 'PERIODE'
                      ? "bg-slate-100 border-slate-300 text-slate-900"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                )}
                title="Filter berdasarkan Periode Waktu"
              >
                <CalendarDays className={cn("w-3.5 h-3.5 shrink-0", hasActiveTimeFilter ? "text-[#31889C]" : "text-slate-500")} />
                <span className="truncate max-w-[130px]">{selectedPeriodeLabel}</span>
                <ChevronDown
                  className={cn(
                    "w-3 h-3 transition-transform text-slate-400",
                    openDropdown === 'PERIODE' && "rotate-180 text-[#31889C]"
                  )}
                />
              </button>

              {openDropdown === 'PERIODE' && (
                <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-slate-200/90 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Periode Waktu
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handlePreset('ALL');
                      setOpenDropdown(null);
                    }}
                    className={cn(
                      "flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-[12px] text-left transition-colors cursor-pointer",
                      !hasActiveTimeFilter ? "bg-[#F0F9FA] text-[#164E59] font-bold" : "hover:bg-slate-50 text-slate-700 font-medium"
                    )}
                  >
                    <span>Semua Waktu</span>
                    {!hasActiveTimeFilter && <Check className="w-3.5 h-3.5 text-[#31889C]" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handlePreset('TODAY');
                      setOpenDropdown(null);
                    }}
                    className={cn(
                      "flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-[12px] text-left transition-colors cursor-pointer",
                      isTodayPresetActive ? "bg-[#F0F9FA] text-[#164E59] font-bold" : "hover:bg-slate-50 text-slate-700 font-medium"
                    )}
                  >
                    <span>Hari Ini</span>
                    {isTodayPresetActive && <Check className="w-3.5 h-3.5 text-[#31889C]" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handlePreset('THIS_MONTH');
                      setOpenDropdown(null);
                    }}
                    className={cn(
                      "flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-[12px] text-left transition-colors cursor-pointer",
                      isThisMonthPresetActive ? "bg-[#F0F9FA] text-[#164E59] font-bold" : "hover:bg-slate-50 text-slate-700 font-medium"
                    )}
                  >
                    <span>Bulan Ini</span>
                    {isThisMonthPresetActive && <Check className="w-3.5 h-3.5 text-[#31889C]" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handlePreset('THIS_YEAR');
                      setOpenDropdown(null);
                    }}
                    className={cn(
                      "flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-[12px] text-left transition-colors cursor-pointer",
                      isThisYearPresetActive ? "bg-[#F0F9FA] text-[#164E59] font-bold" : "hover:bg-slate-50 text-slate-700 font-medium"
                    )}
                  >
                    <span>Tahun Ini</span>
                    {isThisYearPresetActive && <Check className="w-3.5 h-3.5 text-[#31889C]" />}
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomShelfOpen((prev) => !prev);
                      setOpenDropdown(null);
                    }}
                    className={cn(
                      "flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-[12px] text-left transition-colors cursor-pointer",
                      isCustomShelfOpen || isCustomTimeActive ? "bg-[#E8F5F7] text-[#1B5260] font-bold" : "hover:bg-slate-50 text-slate-700 font-medium"
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#31889C]" />
                      <span>Kustom Tanggal...</span>
                    </span>
                    {(isCustomShelfOpen || isCustomTimeActive) && <Check className="w-3.5 h-3.5 text-[#31889C]" />}
                  </button>
                </div>
              )}
            </div>

            {/* Tombol Panduan Status */}
            <button
              type="button"
              onClick={() => setIsStatusGuideOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-[12px] font-medium transition-all cursor-pointer shadow-2xs"
              title="Panduan alur status risalah"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#31889C]" />
              <span className="hidden sm:inline">Panduan</span>
            </button>

            {/* Tombol Reset Cepat (Jika ada filter aktif) */}
            {hasAnyActiveFilter && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl border border-red-200 bg-red-50/70 hover:bg-red-100 text-red-600 text-[12px] font-semibold transition-all cursor-pointer shadow-2xs"
                title="Reset semua filter ke pengaturan awal"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. Panel Lanjutan: Filter Kustom Tanggal/Bulan/Tahun (Collapsible) */}
        {isCustomShelfOpen && (
          <div className="p-4 bg-[#F8FAFC] border-t border-slate-200/80 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200/60">
              <span className="text-[12px] font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#31889C]" />
                Pengaturan Periode &amp; Tanggal Spesifik
              </span>
              <div className="flex items-center gap-2">
                {hasActiveTimeFilter && (
                  <button
                    type="button"
                    onClick={handleClearTimeFilters}
                    className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Waktu
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsCustomShelfOpen(false)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold cursor-pointer ml-2"
                >
                  Tutup ✕
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Tahun */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Tahun Penyelenggaraan
                </label>
                <select
                  value={targetYear ? targetYear.toString() : 'ALL'}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleUpdateFilter({ tahun: val === 'ALL' ? null : val, year: null });
                  }}
                  className="w-full text-[12px] font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 focus:border-[#31889C] cursor-pointer"
                >
                  <option value="ALL">Semua Tahun</option>
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr.toString()}>
                      Tahun {yr} ({getYearCount(yr)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Bulan */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Bulan Rapat
                </label>
                <select
                  value={monthIdx !== null ? (monthIdx + 1).toString() : 'ALL'}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleUpdateFilter({ bulan: val === 'ALL' ? null : val, month: null });
                  }}
                  className="w-full text-[12px] font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 focus:border-[#31889C] cursor-pointer"
                >
                  <option value="ALL">Semua Bulan (Jan - Des)</option>
                  {MONTH_NAMES_INDONESIA.map((mName, idx) => (
                    <option key={idx} value={(idx + 1).toString()}>
                      {mName} ({getMonthCount(idx)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal Spesifik */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-600">
                    Tanggal Spesifik (Hari H)
                  </label>
                  {dateParam && (
                    <button
                      type="button"
                      onClick={() => handleUpdateFilter({ tanggal: null, date: null })}
                      className="text-[10px] text-[#31889C] hover:underline font-semibold cursor-pointer"
                    >
                      Hapus
                    </button>
                  )}
                </div>
                <input
                  type="date"
                  value={dateParam || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleUpdateFilter({ tanggal: val || null, date: null });
                  }}
                  className="w-full text-[12px] font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 focus:border-[#31889C] cursor-pointer"
                />
              </div>

              {/* Hari */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Hari Penyelenggaraan
                </label>
                <select
                  value={dayIdx !== null ? dayIdx.toString() : 'ALL'}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleUpdateFilter({ hari: val === 'ALL' ? null : val, day: null });
                  }}
                  className="w-full text-[12px] font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 focus:border-[#31889C] cursor-pointer"
                >
                  <option value="ALL">Semua Hari (Senin - Minggu)</option>
                  {DAY_OPTIONS.map((d) => (
                    <option key={d.value} value={d.index.toString()}>
                      {d.label} ({getDayCount(d.index)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 4. Rangkuman Filter Aktif & Reset Cepat */}
        {hasAnyActiveFilter && (
          <div className="px-4 py-2.5 bg-gradient-to-r from-[#F0F9FA]/80 via-white to-[#F0F9FA]/40 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11.5px] font-bold text-slate-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#31889C] animate-pulse" />
                Filter Aktif:
              </span>

              {/* Search query chip */}
              {searchFilter && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#BCE3EB] text-[#1B5260] font-semibold text-[11px] shadow-2xs">
                  Cari: &ldquo;{searchFilter}&rdquo;
                  <button
                    type="button"
                    onClick={() => setSearchFilter('')}
                    className="hover:text-red-600 ml-0.5 cursor-pointer font-bold"
                    title="Hapus kata kunci pencarian"
                  >
                    ✕
                  </button>
                </span>
              )}

              {/* Tim chip */}
              {timParam && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#BCE3EB] text-[#1B5260] font-semibold text-[11px] shadow-2xs">
                  Tim: {ikkTeamsList.find((t) => t.code === timParam)?.name || timParam}
                  <button
                    type="button"
                    onClick={() => handleSelectTeam('ALL')}
                    className="hover:text-red-600 ml-0.5 cursor-pointer font-bold"
                    title="Hapus filter tim"
                  >
                    ✕
                  </button>
                </span>
              )}

              {/* Status chip */}
              {statusParam && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#BCE3EB] text-[#1B5260] font-semibold text-[11px] shadow-2xs">
                  Status: {normalizeProgressStatus(statusParam)}
                  <button
                    type="button"
                    onClick={() => handleSelectStatus('ALL')}
                    className="hover:text-red-600 ml-0.5 cursor-pointer font-bold"
                    title="Hapus filter status"
                  >
                    ✕
                  </button>
                </span>
              )}

              {/* Category chip */}
              {kategoriParam && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#BCE3EB] text-[#1B5260] font-semibold text-[11px] shadow-2xs">
                  Kategori: {
                    kategoriParam === 'UNDANGAN_INTERNAL'
                      ? 'Undangan Internal'
                      : kategoriParam === 'NASKAH_MASUK'
                        ? 'Daftar Naskah Masuk'
                        : kategoriParam === 'DISPOSISI_SEKJEN'
                          ? 'Disposisi Sekjen'
                          : kategoriParam === 'SURAT_EKSTERNAL'
                            ? 'Surat Eksternal'
                            : 'Surat Ditunda'
                  }
                  <button
                    type="button"
                    onClick={() => handleSelectCategory('ALL')}
                    className="hover:text-red-600 ml-0.5 cursor-pointer font-bold"
                    title="Hapus filter kategori"
                  >
                    ✕
                  </button>
                </span>
              )}

              {/* Time chip */}
              {hasActiveTimeFilter && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#BCE3EB] text-[#1B5260] font-semibold text-[11px] shadow-2xs">
                  Waktu: {activeTimeLabel}
                  <button
                    type="button"
                    onClick={handleClearTimeFilters}
                    className="hover:text-red-600 ml-0.5 cursor-pointer font-bold"
                    title="Hapus filter waktu"
                  >
                    ✕
                  </button>
                </span>
              )}

              <span className="text-slate-500 text-[11.5px] ml-1 font-medium">
                (Ditemukan <strong className="text-slate-800">{statusParam ? fullyFilteredMeetings.filter((m) => normalizeProgressStatus(m.progressStatus || mapStatusToProgress(m.status)) === normalizeProgressStatus(statusParam)).length : countAll}</strong> risalah)
              </span>
            </div>

            <button
              type="button"
              onClick={handleClearAllFilters}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#31889C] hover:text-red-600 bg-white px-2.5 py-1 rounded-lg border border-[#BCE3EB] hover:border-red-200 transition-colors cursor-pointer shadow-2xs ml-auto"
              title="Reset seluruh filter dan kembalikan ke daftar awal"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Semua Filter</span>
            </button>
          </div>
        )}
      </div>

      <MeetingStatusGuideDialog
        isOpen={isStatusGuideOpen}
        onClose={() => setIsStatusGuideOpen(false)}
      />

      {/* Meeting Table */}
      <MeetingTable
        initialMeetings={meetingsList}
        filterStatus={statusParam}
        filterBiro={timParam || (lockedBiroCode ? (lockedBiroCode as BiroCode) : null)}
        filterMonth={monthParam}
        filterYear={yearParam}
        filterDayOfWeek={dayParam}
        filterDate={dateParam}
        filterCategory={kategoriParam}
        searchQuery={searchFilter}
        onSearchChange={setSearchFilter}
        hideHeader={true}
        onClearFilters={handleClearAllFilters}
        onMeetingDeleted={(deletedId) => {
          setDeletedIds((prev) => new Set(prev).add(deletedId));
          setMeetingsList((prev) => prev.filter((m) => m.id !== deletedId));
        }}
      />

      {/* Danger Modal: Konfirmasi Hapus Semua Rapat */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-red-200 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header with warning icon */}
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-[18px] text-slate-900">
                  Konfirmasi Hapus Semua Rapat
                </h3>
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  Tindakan ini akan menghapus permanen <strong>seluruh data rapat ({initialMeetings.length} rapat)</strong>,
                  beserta notulen risalah, presensi peserta, dan butir tindak lanjut dari basis data Neon PostgreSQL.
                </p>
              </div>
            </div>

            {/* Warning Callout */}
            <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-[12.5px] text-red-800 space-y-1">
              <span className="font-bold block">⚠️ Peringatan: Tindakan ini permanen!</span>
              <p>
                Seluruh data sidang akan dikosongkan. Nomor urut rapat masing-masing biro juga akan direset kembali ke 001.
              </p>
            </div>

            {/* Verification confirmation input */}
            <div className="mt-4 space-y-2">
              <label className="text-[12.5px] font-semibold text-slate-700 block">
                Ketik <span className="font-mono font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded border border-red-300">HAPUS</span> di bawah ini untuk mengonfirmasi:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="Ketik HAPUS..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium text-[13px] focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 uppercase tracking-wider"
                disabled={isDeletingAll}
                autoFocus
              />
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeletingAll}
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setConfirmInput('');
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-[13px] transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={confirmInput.trim().toUpperCase() !== 'HAPUS' || isDeletingAll}
                onClick={handleDeleteAll}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-[13px] shadow-sm shadow-red-600/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isDeletingAll ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>{isDeletingAll ? 'Menghapus Semua...' : 'Ya, Hapus Semua Rapat'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Meeting Document Dialog */}
      <UploadMeetingDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
      />
    </div>
  );
}
