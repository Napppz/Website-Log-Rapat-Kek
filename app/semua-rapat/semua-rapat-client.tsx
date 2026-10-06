'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  X,
  UploadCloud,
  Sparkles,
  Calendar,
  Building2,
  HelpCircle,
  CalendarDays,
  Clock,
  RotateCcw,
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
import { getMeetingStatusDetail } from '@/lib/meeting-status';
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

  // Filter params
  const statusParam = searchParams.get('status') as MeetingStatus | null;
  const rawBiroParam = searchParams.get('biro');
  const biroParam = rawBiroParam && rawBiroParam !== 'ALL' ? (rawBiroParam as BiroCode) : null;
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

  // Meetings filtered by the selected Biro (or all if no biro filter)
  const biroFilteredMeetings = useMemo(() => {
    if (!biroParam || lockedBiroCode) {
      return meetingsList;
    }
    const target = normalizeBiroCode(biroParam);
    return meetingsList.filter((m) => {
      const matchPrimary = normalizeBiroCode(m.biroCode) === target;
      const matchInvolved = m.involvedBiros && normalizeBiroCode(m.involvedBiros).includes(target);
      return matchPrimary || matchInvolved;
    });
  }, [meetingsList, biroParam, lockedBiroCode]);

  // Meetings filtered by Biro AND Date/Month/Day/Year
  const fullyFilteredMeetings = useMemo(() => {
    return biroFilteredMeetings.filter((m) => {
      if (monthIdx !== null || dayIdx !== null || targetYear !== null || targetDate !== null) {
        const parsed = parseMeetingDate(m.date);
        if (!parsed) return false;
        if (targetDate && parsed.isoDate !== targetDate) return false;
        if (targetYear !== null && !isNaN(targetYear) && parsed.year !== targetYear) return false;
        if (monthIdx !== null && parsed.month !== monthIdx) return false;
        if (dayIdx !== null && parsed.dayOfWeek !== dayIdx) return false;
      }
      return true;
    });
  }, [biroFilteredMeetings, monthIdx, dayIdx, targetYear, targetDate]);

  const countAll = fullyFilteredMeetings.length;
  const countDraft = fullyFilteredMeetings.filter((m) => m.status === 'DRAFT').length;
  const countReview = fullyFilteredMeetings.filter((m) => m.status === 'REVIEW').length;
  const countApproved = fullyFilteredMeetings.filter((m) => m.status === 'APPROVED').length;
  const countFinal = fullyFilteredMeetings.filter((m) => m.status === 'FINAL').length;

  const statusFilters: { label: string; value: MeetingStatus | 'ALL'; count: number; sublabel?: string }[] = [
    { label: 'Semua Status', value: 'ALL', count: countAll },
    { label: '1. Draf', value: 'DRAFT', count: countDraft, sublabel: 'Penyusunan' },
    { label: '2. Reviu', value: 'REVIEW', count: countReview, sublabel: 'Penelaahan' },
    { label: '3. Disetujui', value: 'APPROVED', count: countApproved, sublabel: 'Validasi Pimpinan' },
    { label: '4. Final', value: 'FINAL', count: countFinal, sublabel: 'Disahkan & Terbit' },
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
    const params = new URLSearchParams(searchParams.toString());
    params.delete('status');
    if (!lockedBiroCode) params.delete('biro');
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
    return biroFilteredMeetings.filter((m) => {
      const parsed = parseMeetingDate(m.date);
      return parsed?.year === yr;
    }).length;
  };

  const getMonthCount = (mIndex: number) => {
    return biroFilteredMeetings.filter((m) => {
      const parsed = parseMeetingDate(m.date);
      if (!parsed) return false;
      if (targetYear !== null && !isNaN(targetYear) && parsed.year !== targetYear) return false;
      return parsed.month === mIndex;
    }).length;
  };

  const getDayCount = (dIndex: number) => {
    return biroFilteredMeetings.filter((m) => {
      const parsed = parseMeetingDate(m.date);
      if (!parsed) return false;
      if (targetYear !== null && !isNaN(targetYear) && parsed.year !== targetYear) return false;
      if (monthIdx !== null && parsed.month !== monthIdx) return false;
      return parsed.dayOfWeek === dIndex;
    }).length;
  };

  const handleSelectStatus = (val: MeetingStatus | 'ALL') => {
    const params = new URLSearchParams(searchParams.toString());
    if (val === 'ALL') {
      params.delete('status');
    } else {
      params.set('status', val);
    }
    router.push(params.toString() ? `/semua-rapat?${params.toString()}` : '/semua-rapat');
  };

  const handleSelectBiro = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val === 'ALL' || !val) {
      params.delete('biro');
    } else {
      params.set('biro', val);
    }
    router.push(params.toString() ? `/semua-rapat?${params.toString()}` : '/semua-rapat');
  };

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

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div>
          <span className="font-semibold text-[12px] text-[#31889C] uppercase tracking-wider flex items-center gap-1.5">
            {lockedBiroCode ? (
              <>
                <Building2 className="w-3.5 h-3.5" />
                Risalah Biro {lockedBiroCode}
              </>
            ) : (
              'Manajemen Risalah Dewan KEK'
            )}
          </span>
          <h1 className="text-[24px] font-bold text-slate-900 mt-0.5">
            {lockedBiroCode
              ? `Semua Risalah Rapat — ${currentUserBiroName || `Biro ${lockedBiroCode}`}`
              : 'Semua Risalah Rapat KEK RI'}
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            {lockedBiroCode
              ? `Arsip lengkap agenda, risalah keputusan, dan status tindak lanjut khusus penugasan ${currentUserBiroName || `Biro ${lockedBiroCode}`}.`
              : 'Arsip lengkap agenda, risalah keputusan, dan status tindak lanjut seluruh Biro KEK.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-center">
          {/* Hapus Semua Rapat Button (SUPER_ADMIN / ADMIN only) */}
          {canDeleteAll && meetingsList.length > 0 && (
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300 font-semibold text-[12.5px] transition-all cursor-pointer shadow-xs"
              title="Hapus seluruh data rapat dari database (Hanya Administrator)"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
              <span>Hapus Semua Rapat</span>
            </button>
          )}

          {canCreate && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsUploadDialogOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-[#31889C] bg-[#F0F9FA] text-[#1B5260] font-semibold text-[13px] hover:bg-[#E8F5F7] shadow-xs transition-all shrink-0 cursor-pointer"
                title="Unggah berkas Word, PDF, atau Teks untuk otomatis membuat rapat dan notula"
              >
                <UploadCloud className="w-4 h-4 text-[#31889C]" />
                <span>⚡ Unggah Dokumen Rapat</span>
              </button>

              <Link
                href="/buat-rapat"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#31889C] text-white font-semibold text-[13px] hover:bg-[#266F80] shadow-xs transition-all shrink-0 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Jadwalkan Rapat Baru</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Super Admin & Admin: Filter Biro Pelaksana Dewan KEK */}
      {!lockedBiroCode && isPrivileged && (
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[12px] font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
              <Building2 className="w-4 h-4 text-[#31889C]" />
              Filter Biro:
            </span>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleSelectBiro('ALL')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer",
                  !biroParam
                    ? "bg-[#31889C] text-white shadow-xs font-bold"
                    : "bg-[#F8FAFC] border border-slate-200 text-slate-700 hover:bg-[#F0F9FA] hover:text-[#31889C]"
                )}
              >
                Semua Biro ({meetingsList.length})
              </button>

              {birosList.map((b) => {
                const isSelected = biroParam === b.code;
                const countForBiro = meetingsList.filter((m) => {
                  const target = normalizeBiroCode(b.code);
                  return (
                    normalizeBiroCode(m.biroCode) === target ||
                    (m.involvedBiros && normalizeBiroCode(m.involvedBiros).includes(target))
                  );
                }).length;

                return (
                  <button
                    key={b.code}
                    type="button"
                    onClick={() => handleSelectBiro(b.code)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                      isSelected
                        ? "bg-[#31889C] text-white shadow-xs font-bold"
                        : "bg-[#F8FAFC] border border-slate-200 text-slate-700 hover:bg-[#F0F9FA] hover:text-[#31889C]"
                    )}
                    title={`${b.name} (${b.shortName})`}
                  >
                    <span>{b.code}</span>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                        isSelected
                          ? "bg-white/25 text-white"
                          : "bg-slate-200/70 text-slate-600"
                      )}
                    >
                      {countForBiro}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Biro Indicator & Quick Reset */}
          {biroParam && (
            <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
              <span className="text-[11.5px] text-[#215865] bg-[#E8F5F7] px-2.5 py-1 rounded-md border border-[#BCE3EB] font-medium hidden sm:inline">
                {birosList.find((b) => b.code === biroParam)?.shortName || `Biro ${biroParam}`}
              </span>
              <button
                type="button"
                onClick={() => handleSelectBiro('ALL')}
                className="text-[11.5px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-2 py-1 rounded transition-colors cursor-pointer"
                title="Hapus filter biro"
              >
                ✕ Reset Biro
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filter Waktu & Tanggal Rapat — Berlaku untuk Semua Role (Super Admin, Admin, & Staff) */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-3.5 animate-in fade-in">
        {/* Baris Atas: Judul & Preset Cepat */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#F0F9FA] border border-[#BCE3EB] flex items-center justify-center text-[#31889C] shrink-0">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[13px] font-bold text-slate-800">
                Filter Waktu &amp; Tanggal Rapat
              </span>
              <span className="text-[11.5px] text-slate-400 ml-2 hidden sm:inline">
                (Saring menurut Tahun, Bulan, Hari, atau Tanggal Spesifik)
              </span>
            </div>
          </div>

          {/* Preset Tombol Cepat */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden md:inline">
              Pilihan Cepat:
            </span>
            <button
              type="button"
              onClick={() => handlePreset('ALL')}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11.5px] font-semibold transition-all cursor-pointer",
                !hasActiveTimeFilter
                  ? "bg-[#31889C] text-white shadow-2xs font-bold"
                  : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              Semua Waktu
            </button>
            <button
              type="button"
              onClick={() => handlePreset('TODAY')}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11.5px] font-semibold transition-all cursor-pointer",
                isTodayPresetActive
                  ? "bg-[#31889C] text-white shadow-2xs font-bold"
                  : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => handlePreset('THIS_MONTH')}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11.5px] font-semibold transition-all cursor-pointer",
                isThisMonthPresetActive
                  ? "bg-[#31889C] text-white shadow-2xs font-bold"
                  : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              Bulan Ini
            </button>
            <button
              type="button"
              onClick={() => handlePreset('THIS_YEAR')}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11.5px] font-semibold transition-all cursor-pointer",
                isThisYearPresetActive
                  ? "bg-[#31889C] text-white shadow-2xs font-bold"
                  : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              Tahun Ini
            </button>
            {hasActiveTimeFilter && (
              <button
                type="button"
                onClick={handleClearTimeFilters}
                className="px-2 py-1 rounded-md text-[11.5px] font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors ml-1 cursor-pointer flex items-center gap-1"
                title="Bersihkan seluruh filter waktu"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Waktu</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Kolom Kontrol: Tahun, Bulan, Hari, Tanggal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Tahun */}
          <div>
            <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
              Tahun Penyelenggaraan
            </label>
            <select
              value={targetYear ? targetYear.toString() : 'ALL'}
              onChange={(e) => {
                const val = e.target.value;
                handleUpdateFilter({ tahun: val === 'ALL' ? null : val, year: null });
              }}
              className="w-full text-[12.5px] font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 focus:border-[#31889C] cursor-pointer"
            >
              <option value="ALL">Semua Tahun</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr.toString()}>
                  Tahun {yr} ({getYearCount(yr)})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Bulan */}
          <div>
            <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
              Bulan Rapat
            </label>
            <select
              value={monthIdx !== null ? (monthIdx + 1).toString() : 'ALL'}
              onChange={(e) => {
                const val = e.target.value;
                handleUpdateFilter({ bulan: val === 'ALL' ? null : val, month: null });
              }}
              className="w-full text-[12.5px] font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 focus:border-[#31889C] cursor-pointer"
            >
              <option value="ALL">Semua Bulan (Jan - Des)</option>
              {MONTH_NAMES_INDONESIA.map((mName, idx) => (
                <option key={idx} value={(idx + 1).toString()}>
                  {mName} ({getMonthCount(idx)})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Hari */}
          <div>
            <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
              Hari Penyelenggaraan
            </label>
            <select
              value={dayIdx !== null ? dayIdx.toString() : 'ALL'}
              onChange={(e) => {
                const val = e.target.value;
                handleUpdateFilter({ hari: val === 'ALL' ? null : val, day: null });
              }}
              className="w-full text-[12.5px] font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 focus:border-[#31889C] cursor-pointer"
            >
              <option value="ALL">Semua Hari (Senin - Minggu)</option>
              {DAY_OPTIONS.map((d) => (
                <option key={d.value} value={d.index.toString()}>
                  {d.label} ({getDayCount(d.index)})
                </option>
              ))}
            </select>
          </div>

          {/* 4. Tanggal Spesifik (Date Picker) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11.5px] font-bold text-slate-600">
                Tanggal Spesifik (Hari H)
              </label>
              {dateParam && (
                <button
                  type="button"
                  onClick={() => handleUpdateFilter({ tanggal: null, date: null })}
                  className="text-[10.5px] text-[#31889C] hover:underline font-semibold cursor-pointer"
                >
                  Hapus Tanggal
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
              className="w-full text-[12.5px] font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 focus:border-[#31889C] cursor-pointer"
            />
          </div>
        </div>

        {/* Indikator Filter Waktu Aktif */}
        {hasActiveTimeFilter && (
          <div className="flex items-center gap-2 flex-wrap pt-2.5 border-t border-slate-100 text-[11.5px]">
            <span className="font-semibold text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#31889C]" />
              Filter Waktu Aktif:
            </span>
            {targetYear !== null && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8F5F7] text-[#1B5260] border border-[#BCE3EB] font-medium">
                Tahun: {targetYear}
                <button
                  type="button"
                  onClick={() => handleUpdateFilter({ tahun: null, year: null })}
                  className="hover:text-red-600 ml-0.5 cursor-pointer font-bold"
                  title="Hapus filter tahun"
                >
                  ✕
                </button>
              </span>
            )}
            {monthIdx !== null && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8F5F7] text-[#1B5260] border border-[#BCE3EB] font-medium">
                Bulan: {MONTH_NAMES_INDONESIA[monthIdx]}
                <button
                  type="button"
                  onClick={() => handleUpdateFilter({ bulan: null, month: null })}
                  className="hover:text-red-600 ml-0.5 cursor-pointer font-bold"
                  title="Hapus filter bulan"
                >
                  ✕
                </button>
              </span>
            )}
            {dayIdx !== null && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8F5F7] text-[#1B5260] border border-[#BCE3EB] font-medium">
                Hari: {DAY_NAMES_INDONESIA[dayIdx]}
                <button
                  type="button"
                  onClick={() => handleUpdateFilter({ hari: null, day: null })}
                  className="hover:text-red-600 ml-0.5 cursor-pointer font-bold"
                  title="Hapus filter hari"
                >
                  ✕
                </button>
              </span>
            )}
            {dateParam && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8F5F7] text-[#1B5260] border border-[#BCE3EB] font-medium">
                Tanggal: {dateParam}
                <button
                  type="button"
                  onClick={() => handleUpdateFilter({ tanggal: null, date: null })}
                  className="hover:text-red-600 ml-0.5 cursor-pointer font-bold"
                  title="Hapus filter tanggal spesifik"
                >
                  ✕
                </button>
              </span>
            )}
            <span className="text-slate-500 ml-auto font-medium">
              Ditemukan <strong>{fullyFilteredMeetings.length}</strong> risalah rapat
            </span>
          </div>
        )}
      </div>

      {/* Filter Tabs, Status Guide Trigger & Active Month Indicator */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#31889C]" />
              Filter Tahap:
            </span>
            {statusFilters.map((tab) => {
              const isActive = tab.value === 'ALL' ? !statusParam : statusParam === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => handleSelectStatus(tab.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#31889C] text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-[#F0F9FA] hover:text-[#31889C]'
                  }`}
                  title={tab.sublabel ? `${tab.label} (${tab.sublabel})` : tab.label}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsStatusGuideOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#BCE3EB] bg-[#F0F9FA] hover:bg-[#E8F5F7] text-[#215865] text-[12px] font-bold shadow-2xs transition-all cursor-pointer"
              title="Buka panduan alur status risalah rapat (Draf -> Reviu -> Disetujui -> Final)"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#31889C]" />
              <span>Panduan Status Risalah</span>
            </button>
          </div>
        </div>

        {/* Banner Penjelasan Aktif Saat Filter Biro / Status / Waktu Dipilih */}
        {(statusParam || (biroParam && !lockedBiroCode) || hasActiveTimeFilter) && (
          <div className="p-3 bg-gradient-to-r from-[#F0F9FA] via-white to-[#F0F9FA]/60 border border-[#BCE3EB] rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs text-[#215865] shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-[#31889C] animate-pulse shrink-0" />
              <div className="flex items-center gap-2 flex-wrap">
                {biroParam && !lockedBiroCode && (
                  <span>
                    Biro:{' '}
                    <strong className="text-slate-900 bg-white px-2 py-0.5 rounded border border-[#BCE3EB]">
                      {birosList.find((b) => b.code === biroParam)?.shortName || `Biro ${biroParam}`}
                    </strong>
                  </span>
                )}
                {statusParam && (
                  <span>
                    Tahap:{' '}
                    <strong className="text-slate-900 bg-white px-2 py-0.5 rounded border border-[#BCE3EB]">
                      {getMeetingStatusDetail(statusParam).fullTitle}
                    </strong>
                  </span>
                )}
                {hasActiveTimeFilter && (
                  <span>
                    Waktu:{' '}
                    <strong className="text-slate-900 bg-white px-2 py-0.5 rounded border border-[#BCE3EB]">
                      {[
                        targetYear ? `Tahun ${targetYear}` : null,
                        monthIdx !== null ? MONTH_NAMES_INDONESIA[monthIdx] : null,
                        dayIdx !== null ? `Hari ${DAY_NAMES_INDONESIA[dayIdx]}` : null,
                        dateParam ? `Tgl ${dateParam}` : null,
                      ]
                        .filter(Boolean)
                        .join(' • ')}
                    </strong>
                  </span>
                )}
                <span className="text-slate-600">
                  (Ditemukan <strong>{fullyFilteredMeetings.length}</strong> risalah rapat)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="text-[11px] font-bold text-[#31889C] hover:text-[#215865] bg-white px-2 py-0.5 rounded border border-[#BCE3EB] hover:bg-[#F0F9FA] cursor-pointer transition-colors"
                title="Bersihkan semua filter"
              >
                ✕ Reset Semua Filter
              </button>
            </div>
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
        filterBiro={lockedBiroCode ? (lockedBiroCode as BiroCode) : biroParam}
        filterMonth={monthParam}
        filterYear={yearParam}
        filterDayOfWeek={dayParam}
        filterDate={dateParam}
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
