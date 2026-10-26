'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MeetingTable } from '@/components/meeting/meeting-table';
import { MeetingStatus, BiroCode, Meeting, Biro, TeamWithMembers, TeamMember } from '@/lib/types';
import {
  PlusCircle,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Check,
  X,
  Sparkles,
  Calendar,
  Building2,
  Layers,
  CalendarDays,
  Clock,
  RotateCcw,
  Search,
  ChevronDown,
  SlidersHorizontal,
  Tag,
  Users,
  UserCheck,
  Mail,
  Shield,
  Star,
  Info,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
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
import { isMeetingMatchTeam } from '@/lib/team-utils';

interface SemuaRapatClientProps {
  initialMeetings: Meeting[];
  availableBiros?: Biro[];
  availableTeams?: TeamWithMembers[];
  lockedBiroCode?: string;
  currentUserBiroName?: string;
  currentUserRole?: string;
  allowedTeamCodes?: string[];
  lockedTeamCode?: string;
  lockedTeamName?: string;
  currentUserId?: string;
  currentUserEmail?: string;
}

const AVATAR_BG_COLORS = [
  'bg-emerald-600 text-white',
  'bg-teal-600 text-white',
  'bg-sky-600 text-white',
  'bg-blue-600 text-white',
  'bg-indigo-600 text-white',
  'bg-amber-600 text-white',
  'bg-rose-600 text-white',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_BG_COLORS[Math.abs(hash) % AVATAR_BG_COLORS.length];
}

function getInitials(name: string) {
  const parts = name.replace(/,\s*.*$/, '').split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
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
  availableTeams,
  lockedBiroCode,
  currentUserBiroName,
  currentUserRole,
  allowedTeamCodes,
  lockedTeamCode,
  lockedTeamName,
  currentUserId,
  currentUserEmail,
}: SemuaRapatClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = currentUserRole || session?.user?.role || 'STAFF';
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isAdmin = userRole === 'ADMIN';
  const isStaff = userRole === 'STAFF';
  const isPrivileged = isSuperAdmin || isAdmin;
  const canCreate = isPrivileged;

  const effectiveUserId = currentUserId || session?.user?.id;
  const effectiveUserEmail = currentUserEmail || session?.user?.email;

  // Multi-team detection for staff
  const userAssignedList = (session?.user as any)?.assignedTeams || [];
  const sessionAssignedCodes = Array.from(
    new Set([
      ...userAssignedList.map((t: any) => (t.code || '').toUpperCase()),
      ...(session?.user?.teamCode ? [session.user.teamCode.toUpperCase()] : []),
    ])
  ).filter(Boolean);

  const effectiveAllowedTeamCodes = useMemo(() => {
    if (allowedTeamCodes && allowedTeamCodes.length > 0) {
      return allowedTeamCodes.map((c) => c.toUpperCase());
    }
    if (sessionAssignedCodes.length > 0) {
      return sessionAssignedCodes;
    }
    return undefined;
  }, [allowedTeamCodes, sessionAssignedCodes]);

  const hasMultipleAssignedTeams = (effectiveAllowedTeamCodes?.length ?? 0) > 1;

  const effectiveLockedTeamCode = lockedTeamCode;
  const effectiveLockedTeamName = lockedTeamName;

  const birosList = availableBiros && availableBiros.length > 0 ? availableBiros : BIRO_LIST;

  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [meetingsList, setMeetingsList] = useState<Meeting[]>(initialMeetings);

  useEffect(() => {
    setMeetingsList(initialMeetings.filter((m) => !deletedIds.has(m.id)));
  }, [initialMeetings, deletedIds]);

  const [searchFilter, setSearchFilter] = useState('');

  // Filter params
  const statusParam = searchParams.get('status') as string | null;
  const kategoriParam = searchParams.get('kategori') as string | null;
  const jenisParam = searchParams.get('jenis') as string | null;
  const rawTimParam = searchParams.get('tim') || searchParams.get('biro');
  const timParam = effectiveLockedTeamCode
    ? effectiveLockedTeamCode.toUpperCase()
    : rawTimParam && rawTimParam !== 'ALL' && rawTimParam !== 'IKK' && rawTimParam !== 'BIRO-IKK'
      ? rawTimParam.toUpperCase()
      : null;
  const monthParam = searchParams.get('bulan') || searchParams.get('month');
  const yearParam = searchParams.get('tahun') || searchParams.get('year');
  const dayParam = searchParams.get('hari') || searchParams.get('day');
  const dateParam = searchParams.get('tanggal') || searchParams.get('date');
  const periodeParam = searchParams.get('periode');

  const monthIdx = parseMonthFilterIndex(monthParam);
  const dayIdx = parseDayFilterIndex(dayParam);
  const targetYear = yearParam ? parseInt(yearParam, 10) : null;
  const targetDate = dateParam ? dateParam.trim() : null;

  const currentWeekRange = useMemo(() => {
    const current = new Date();
    const day = current.getDay(); // 0 is Sun, 1 is Mon...
    const diffToMonday = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.getFullYear(), current.getMonth(), diffToMonday);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
    return {
      startIso: monday.toLocaleDateString('en-CA'),
      endIso: sunday.toLocaleDateString('en-CA'),
    };
  }, []);

  const isThisWeekPresetActive = periodeParam === 'mingguan' || periodeParam === 'minggu_ini';

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
    return isMeetingMatchTeam(m, code);
  };

  // Meetings filtered by the selected Tim (Investasi, Kerja Sama, Komunikasi, dll)
  const teamFilteredMeetings = useMemo(() => {
    if (effectiveLockedTeamCode) {
      return meetingsList.filter((m) => isMatchTeam(m, effectiveLockedTeamCode));
    }
    if (!timParam) {
      return meetingsList;
    }
    return meetingsList.filter((m) => isMatchTeam(m, timParam));
  }, [meetingsList, timParam, effectiveLockedTeamCode]);

  // Meetings filtered by Tim AND Date/Month/Day/Year AND Search Filter AND Category
  const fullyFilteredMeetings = useMemo(() => {
    return teamFilteredMeetings.filter((m) => {
      if (isThisWeekPresetActive) {
        const parsed = parseMeetingDate(m.date);
        if (!parsed) return false;
        if (parsed.isoDate < currentWeekRange.startIso || parsed.isoDate > currentWeekRange.endIso) {
          return false;
        }
      }
      if (monthIdx !== null || dayIdx !== null || targetYear !== null || targetDate !== null) {
        const parsed = parseMeetingDate(m.date);
        if (!parsed) return false;
        if (targetDate && parsed.isoDate !== targetDate) return false;
        if (targetYear !== null && !isNaN(targetYear) && parsed.year !== targetYear) return false;
        if (monthIdx !== null && parsed.month !== monthIdx) return false;
        if (dayIdx !== null && parsed.dayOfWeek !== dayIdx) return false;
      }
      if (kategoriParam && kategoriParam !== 'ALL') {
        const cat = ((m as any).documentCategory || 'UNDANGAN_INTERNAL').toUpperCase();
        const subCat = ((m as any).documentSubCategory || '').toUpperCase();
        if (kategoriParam === 'UNDANGAN_INTERNAL') {
          if (cat !== 'UNDANGAN_INTERNAL') return false;
        } else if (kategoriParam === 'NASKAH_MASUK') {
          if (cat !== 'NASKAH_MASUK' && cat !== 'DAFTAR_NASKAH_MASUK') return false;
          if (subCat === 'DISPOSISI_Setjen' || subCat === 'DISPOSISI_BIRO') return false;
        } else if (kategoriParam === 'DISPOSISI_Setjen') {
          if (cat !== 'DISPOSISI_Setjen' && !(cat === 'NASKAH_MASUK' && subCat === 'DISPOSISI_Setjen')) return false;
        } else if (kategoriParam === 'DISPOSISI_BIRO') {
          if (cat !== 'DISPOSISI_BIRO' && !(cat === 'NASKAH_MASUK' && subCat === 'DISPOSISI_BIRO')) return false;
        } else if (kategoriParam === 'SURAT_DITUNDA' || kategoriParam === 'TUNDA_RAPAT') {
          if (cat !== 'SURAT_DITUNDA' && cat !== 'TUNDA_RAPAT') return false;
        } else if (kategoriParam === 'LAINNYA' || kategoriParam === 'OTHER') {
          if (cat !== 'LAINNYA' && cat !== 'OTHER') return false;
        }
      }
      if (jenisParam && jenisParam !== 'ALL') {
        const target = jenisParam.toLowerCase().trim();
        const mKind = (m.meetingKind || '').toLowerCase().trim();
        if (target === 'none' || target === 'tanpa jenis') {
          if (mKind !== '') return false;
        } else {
          if (mKind !== target) return false;
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
  }, [teamFilteredMeetings, isThisWeekPresetActive, currentWeekRange, monthIdx, dayIdx, targetYear, targetDate, searchFilter, kategoriParam, jenisParam]);

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

  const countUndanganInternal = teamFilteredMeetings.filter((m) => {
    const cat = ((m as any).documentCategory || 'UNDANGAN_INTERNAL').toUpperCase();
    return cat === 'UNDANGAN_INTERNAL';
  }).length;

  const countNaskahMasuk = teamFilteredMeetings.filter((m) => {
    const cat = ((m as any).documentCategory || '').toUpperCase();
    const sub = ((m as any).documentSubCategory || '').toUpperCase();
    return (cat === 'NASKAH_MASUK' || cat === 'DAFTAR_NASKAH_MASUK') && sub !== 'DISPOSISI_Setjen' && sub !== 'DISPOSISI_BIRO';
  }).length;

  const countDisposisiSetjen = teamFilteredMeetings.filter((m) => {
    const cat = ((m as any).documentCategory || '').toUpperCase();
    const sub = ((m as any).documentSubCategory || '').toUpperCase();
    return cat === 'DISPOSISI_Setjen' || (cat === 'NASKAH_MASUK' && sub === 'DISPOSISI_Setjen');
  }).length;

  const countDisposisiBiro = teamFilteredMeetings.filter((m) => {
    const cat = ((m as any).documentCategory || '').toUpperCase();
    const sub = ((m as any).documentSubCategory || '').toUpperCase();
    return cat === 'DISPOSISI_BIRO' || (cat === 'NASKAH_MASUK' && sub === 'DISPOSISI_BIRO');
  }).length;

  const countTundaRapat = teamFilteredMeetings.filter((m) => {
    const cat = ((m as any).documentCategory || '').toUpperCase();
    return cat === 'SURAT_DITUNDA' || cat === 'TUNDA_RAPAT';
  }).length;

  const countLainnya = teamFilteredMeetings.filter((m) => {
    const cat = ((m as any).documentCategory || '').toUpperCase();
    return cat === 'LAINNYA' || cat === 'OTHER';
  }).length;

  const categoryFilters = [
    { label: 'Semua Kategori', value: 'ALL', count: teamFilteredMeetings.length, icon: '🏷️' },
    { label: 'Undangan Internal', value: 'UNDANGAN_INTERNAL', count: countUndanganInternal, icon: '🏢' },
    { label: 'Daftar Naskah Masuk', value: 'NASKAH_MASUK', count: countNaskahMasuk, icon: '📥' },
    { label: 'Disposisi Setjen', value: 'DISPOSISI_Setjen', count: countDisposisiSetjen, icon: '🏛️' },
    { label: 'Disposisi Biro', value: 'DISPOSISI_BIRO', count: countDisposisiBiro, icon: '📑' },
    { label: 'Tunda Kegiatan', value: 'SURAT_DITUNDA', count: countTundaRapat, icon: '⏳' },
    { label: 'Lainnya / Other', value: 'LAINNYA', count: countLainnya, icon: '📌' },
  ];

  const handleSelectCategory = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val === 'ALL' || !val) {
      params.delete('kategori');
    } else {
      params.set('kategori', val);
    }
    router.push(params.toString() ? `/arsip-kegiatan?${params.toString()}` : '/arsip-kegiatan');
  };

  const STANDARD_JENIS_RAPAT = [
    'Kunker',
    'Kegiatan Kerja',
    'Audiensi/Pertemuan',
    'Seminar/Forum',
    'Media Gathering',
    'Penandatanganan Mou',
    'Groundbreaking',
    'Pelantikan',
    'Seremoni',
  ];

  const availableJenisRapat = useMemo(() => {
    const set = new Set<string>();
    STANDARD_JENIS_RAPAT.forEach((j) => set.add(j));
    meetingsList.forEach((m) => {
      if (m.meetingKind && m.meetingKind.trim()) {
        set.add(m.meetingKind.trim());
      }
    });
    return Array.from(set);
  }, [meetingsList]);

  const countTanpaJenis = teamFilteredMeetings.filter((m) => !m.meetingKind || !m.meetingKind.trim()).length;

  const jenisFilters = useMemo(() => {
    const list = [
      { label: 'Semua Jenis', value: 'ALL', count: teamFilteredMeetings.length, icon: '📂' },
      ...availableJenisRapat
        .map((jenis) => {
          const count = teamFilteredMeetings.filter(
            (m) => (m.meetingKind || '').toLowerCase().trim() === jenis.toLowerCase().trim()
          ).length;
          return {
            label: jenis,
            value: jenis,
            count,
            icon: '📌',
          };
        })
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    ];

    if (countTanpaJenis > 0) {
      list.push({
        label: 'Tanpa Jenis',
        value: 'NONE',
        count: countTanpaJenis,
        icon: '⚪',
      });
    }

    return list;
  }, [availableJenisRapat, teamFilteredMeetings, countTanpaJenis]);

  const handleSelectJenis = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val === 'ALL' || !val) {
      params.delete('jenis');
    } else {
      params.set('jenis', val);
    }
    router.push(params.toString() ? `/arsip-kegiatan?${params.toString()}` : '/arsip-kegiatan');
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

  const isTodayPresetActive = dateParam === todayIso;
  const isThisMonthPresetActive =
    !dateParam &&
    !isThisWeekPresetActive &&
    yearParam === currentYear.toString() &&
    monthIdx === new Date().getMonth();
  const isThisYearPresetActive =
    !dateParam &&
    !isThisWeekPresetActive &&
    monthIdx === null &&
    dayIdx === null &&
    yearParam === currentYear.toString();

  const hasActiveTimeFilter = Boolean(monthParam || yearParam || dayParam || dateParam || isThisWeekPresetActive);

  const isCustomTimeActive = Boolean(
    (dateParam && !isTodayPresetActive) ||
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
    if (isTodayPresetActive) return 'Harian (Hari Ini)';
    if (isThisWeekPresetActive) return 'Mingguan (Minggu Ini)';
    if (isThisMonthPresetActive) return 'Bulanan (Bulan Ini)';
    if (isThisYearPresetActive) return 'Tahunan (Tahun Ini)';
    const parts = [
      targetYear ? `Tahun ${targetYear}` : null,
      monthIdx !== null ? MONTH_NAMES_INDONESIA[monthIdx] : null,
      dayIdx !== null ? `Hari ${DAY_NAMES_INDONESIA[dayIdx]}` : null,
      dateParam ? `Tgl ${dateParam}` : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(' • ') : null;
  }, [isTodayPresetActive, isThisWeekPresetActive, isThisMonthPresetActive, isThisYearPresetActive, targetYear, monthIdx, dayIdx, dateParam]);

  const hasAnyActiveFilter = Boolean(
    statusParam ||
    timParam ||
    (kategoriParam && kategoriParam !== 'ALL') ||
    (jenisParam && jenisParam !== 'ALL') ||
    hasActiveTimeFilter ||
    searchFilter.trim()
  );

  const handlePreset = (preset: 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'THIS_YEAR') => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('tanggal');
    params.delete('date');
    params.delete('hari');
    params.delete('day');
    params.delete('bulan');
    params.delete('month');
    params.delete('tahun');
    params.delete('year');
    params.delete('periode');

    if (preset === 'TODAY') {
      params.set('tanggal', todayIso);
    } else if (preset === 'THIS_WEEK') {
      params.set('periode', 'mingguan');
    } else if (preset === 'THIS_MONTH') {
      params.set('tahun', currentYear.toString());
      params.set('bulan', currentMonth.toString());
    } else if (preset === 'THIS_YEAR') {
      params.set('tahun', currentYear.toString());
    }

    router.push(params.toString() ? `/arsip-kegiatan?${params.toString()}` : '/arsip-kegiatan');
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
    router.push(params.toString() ? `/arsip-kegiatan?${params.toString()}` : '/arsip-kegiatan');
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
    params.delete('periode');
    router.push(params.toString() ? `/arsip-kegiatan?${params.toString()}` : '/arsip-kegiatan');
  };

  const handleClearAllFilters = () => {
    setSearchFilter('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('status');
    params.delete('kategori');
    params.delete('jenis');
    if (!effectiveLockedTeamCode) {
      params.delete('tim');
      params.delete('biro');
    }
    params.delete('tahun');
    params.delete('year');
    params.delete('bulan');
    params.delete('month');
    params.delete('hari');
    params.delete('day');
    params.delete('tanggal');
    params.delete('date');
    params.delete('periode');
    router.push(params.toString() ? `/arsip-kegiatan?${params.toString()}` : '/arsip-kegiatan');
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
    router.push(params.toString() ? `/arsip-kegiatan?${params.toString()}` : '/arsip-kegiatan');
  };

  const DEFAULT_TEAMS: TeamWithMembers[] = [
    {
      id: 'inv',
      code: 'INV',
      name: 'Tim Investasi',
      shortName: 'Investasi',
      members: [
        { id: '1', name: 'Maya Puspita, S.Sos (Staff Investasi)', email: 'staf.investasi@kek.go.id', role: 'STAFF', teamRole: 'PJ_UTAMA', isActive: true },
        { id: '2', name: 'Ahmad Fauzi, S.Kom', email: 'staf.si@kek.go.id', role: 'STAFF', teamRole: 'ANGGOTA', isActive: true },
        { id: '3', name: 'Staff Investasi', email: 'staff.inv@kek.go.id', role: 'STAFF', teamRole: 'ANGGOTA', isActive: true },
      ],
    },
    {
      id: 'ks',
      code: 'KS',
      name: 'Tim Kerja Sama',
      shortName: 'Kerja Sama',
      members: [
        { id: '4', name: 'Rizki Agustianto (Staff Kerja Sama)', email: 'staf.kerjasama@kek.go.id', role: 'STAFF', teamRole: 'PJ_UTAMA', isActive: true },
        { id: '5', name: 'Staff Kerja Sama', email: 'staff.ks@kek.go.id', role: 'STAFF', teamRole: 'ANGGOTA', isActive: true },
        { id: '6', name: 'Staff Biro 3', email: 'staff@kek.go.id', role: 'STAFF', teamRole: 'ANGGOTA', isActive: true },
      ],
    },
    {
      id: 'kom',
      code: 'KOM',
      name: 'Tim Komunikasi',
      shortName: 'Komunikasi',
      members: [
        { id: '7', name: 'Budi Santoso, S.I.Kom (Staff Komunikasi)', email: 'staf.komunikasi@kek.go.id', role: 'STAFF', teamRole: 'PJ_UTAMA', isActive: true },
        { id: '8', name: 'Staff Komunikasi', email: 'staff.kom@kek.go.id', role: 'STAFF', teamRole: 'ANGGOTA', isActive: true },
      ],
    },
    {
      id: 'si',
      code: 'SI',
      name: 'Tim Sistem Informasi',
      shortName: 'Sistem Informasi',
      members: [
        { id: '9', name: 'Admin Biro 3 (IKK)', email: 'admin@kek.go.id', role: 'ADMIN', teamRole: 'PJ_UTAMA', isActive: true },
        { id: '10', name: 'Super Admin Biro 3', email: 'superadmin@kek.go.id', role: 'SUPER_ADMIN', teamRole: 'PJ_UTAMA', isActive: true },
        { id: '11', name: 'Staff Sistem Informasi', email: 'staff.si@kek.go.id', role: 'STAFF', teamRole: 'ANGGOTA', isActive: true },
        { id: '12', name: 'Ahmad Fauzi, S.Kom', email: 'staf.si@kek.go.id', role: 'STAFF', teamRole: 'ANGGOTA', isActive: true },
      ],
    },
    {
      id: 'hkm',
      code: 'HKM',
      name: 'Tim Hukum',
      shortName: 'Hukum',
      members: [],
    },
  ];

  const teamsList: TeamWithMembers[] = useMemo(() => {
    if (availableTeams && availableTeams.length > 0) {
      const priorityOrder = ['INV', 'KS', 'KOM', 'SI', 'HKM'];
      const filtered = availableTeams.filter((t) => t.code.toUpperCase() !== 'AKSEL' || t.members.length > 0);
      return [...filtered].sort((a, b) => {
        const idxA = priorityOrder.indexOf(a.code.toUpperCase());
        const idxB = priorityOrder.indexOf(b.code.toUpperCase());
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.name.localeCompare(b.name);
      });
    }
    return DEFAULT_TEAMS;
  }, [availableTeams]);


  const handleSelectTeam = (val: string) => {
    if (effectiveLockedTeamCode) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete('biro');
    if (val === 'ALL' || !val) {
      params.delete('tim');
    } else {
      if (isStaff && effectiveAllowedTeamCodes && effectiveAllowedTeamCodes.length > 0) {
        if (!effectiveAllowedTeamCodes.includes(val.toUpperCase())) {
          return;
        }
      }
      params.set('tim', val);
    }
    router.push(params.toString() ? `/arsip-kegiatan?${params.toString()}` : '/arsip-kegiatan');
  };

  const handleSelectBiro = (val: string) => {
    handleSelectTeam(val);
  };

  const [openDropdown, setOpenDropdown] = useState<'TIM' | 'STATUS' | 'KATEGORI' | 'JENIS' | 'PERIODE' | null>(null);
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

  const currentTeam = teamsList.find((t) => t.code.toUpperCase() === (timParam || '').toUpperCase());
  const selectedTeamLabel = currentTeam
    ? currentTeam.name
    : effectiveLockedTeamName
      ? effectiveLockedTeamName
      : hasMultipleAssignedTeams
        ? 'Semua Tim Saya'
        : 'Semua Tim';

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

  const selectedJenisObj = jenisFilters.find(
    (j) => j.value.toLowerCase() === (jenisParam || 'ALL').toLowerCase()
  );
  const selectedJenisLabel = selectedJenisObj && selectedJenisObj.value !== 'ALL'
    ? selectedJenisObj.label
    : 'Semua Jenis';
  const selectedJenisIcon = selectedJenisObj?.icon || '📌';

  const selectedPeriodeLabel = activeTimeLabel || 'Semua Periode';

  return (
    <div className="flex flex-col gap-6">

      {/* Warning banner if redirected due to unauthorized cross-bureau access */}
      {searchParams.get('denied') === 'true' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-800 text-[13px] shadow-xs animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">Akses Dibatasi: </span>
            Anda tidak memiliki hak akses untuk membuka kegiatan dari biro lain. Anda telah diarahkan kembali ke daftar kegiatan biro Anda ({lockedBiroCode}).
          </div>
        </div>
      )}

      {/* Header section: Judul Halaman & Tombol Aksi Cepat */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-[#F0F9FA] text-[#215865] border border-[#BCE3EB]">
              {effectiveLockedTeamCode ? (
                <>
                  <Layers className="w-3.5 h-3.5 text-[#31889C]" />
                  {effectiveLockedTeamName?.startsWith('Tim ') ? effectiveLockedTeamName : `Tim ${effectiveLockedTeamName || effectiveLockedTeamCode}`}
                </>
              ) : lockedBiroCode ? (
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
              Total <strong>{teamFilteredMeetings.length}</strong> Kegiatan Terdaftar
            </span>
          </div>

          <h1 className="text-[22px] sm:text-[24px] font-extrabold text-slate-900 mt-1.5 tracking-tight">
            {effectiveLockedTeamCode
              ? `Arsip Kegiatan — ${effectiveLockedTeamName?.startsWith('Tim ') ? effectiveLockedTeamName : `Tim ${effectiveLockedTeamName || effectiveLockedTeamCode}`}`
              : lockedBiroCode
                ? `Arsip Kegiatan — ${currentUserBiroName || `Biro ${lockedBiroCode}`}`
                : 'Arsip Kegiatan & Aktivitas — Biro 3 (IKK)'}
          </h1>
          <p className="text-[13px] text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {effectiveLockedTeamCode
              ? `Arsip lengkap kegiatan, agenda, hasil kerja, dan status pekerjaan khusus ${effectiveLockedTeamName?.startsWith('Tim ') ? effectiveLockedTeamName : `Tim ${effectiveLockedTeamName || effectiveLockedTeamCode}`}.`
              : lockedBiroCode
                ? `Arsip lengkap kegiatan, agenda, hasil kerja, dan status pekerjaan ${currentUserBiroName || `Biro ${lockedBiroCode}`}.`
                : 'Sistem monitoring terpadu seluruh kegiatan, hasil kerja, dan status pekerjaan 5 tim kerja Biro 3 (Investasi, Kerja Sama, Komunikasi, Sistem Informasi, Hukum).'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-center">
          {canCreate && (
            <div className="flex items-center gap-2">
              <Link
                href="/catat-kegiatan"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#31889C] text-white font-semibold text-[12.5px] hover:bg-[#266F80] shadow-2xs hover:shadow-xs transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Catat Kegiatan Baru</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* PANEL FILTER & KONTROL TERPADU (Single-Row Modern Dropdown Toolbar) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col relative z-20">
        {/* Baris Utama: Dropdown Tim + Dropdown Status + Dropdown Kategori + Dropdown Periode + Aksi */}
        <div ref={filterToolbarRef} className="p-3 sm:p-3.5">
          {/* Kelompok Filter Dropdown & Aksi */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Dropdown Tim Kerja & Anggota (Dapat Diakses Seluruh Peran: Staf, PIC, Admin, Pimpinan, Super Admin) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setOpenDropdown(openDropdown === 'TIM' ? null : 'TIM');
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all cursor-pointer border select-none",
                  timParam
                    ? "bg-[#F0F9FA] border-[#31889C] text-[#164E59] shadow-2xs font-bold"
                    : openDropdown === 'TIM'
                      ? "bg-slate-100 border-slate-300 text-slate-900"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                )}
                title="Filter Tim Kerja"
              >
                <Layers className={cn("w-3.5 h-3.5 shrink-0", timParam ? "text-[#31889C]" : "text-slate-500")} />
                <span className="truncate max-w-[130px]">{selectedTeamLabel}</span>
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
                <div className="absolute left-0 mt-1.5 w-[300px] sm:w-[340px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-0 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                  {/* Dropdown Header */}
                  <div className="px-4 py-3 bg-gradient-to-r from-slate-50 via-teal-50/40 to-white border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#31889C]/10 border border-[#31889C]/20 text-[#31889C] flex items-center justify-center shrink-0">
                        <Layers className="w-4 h-4 text-[#31889C]" />
                      </div>
                      <div>
                        <div className="text-[12.5px] font-bold text-slate-900">
                          Filter Tim Kerja
                        </div>
                        <div className="text-[10.5px] text-slate-500">
                          Pilih tim kerja untuk memfilter daftar kegiatan
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Daftar Tim Kerja */}
                  <div className="p-2 max-h-[340px] overflow-y-auto divide-y divide-slate-100">
                    {/* Opsi: Semua Tim */}
                    <div className="pb-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectTeam('ALL');
                          setOpenDropdown(null);
                        }}
                        className={cn(
                          "flex items-center justify-between w-full px-3 py-2 rounded-xl text-[12px] text-left transition-colors cursor-pointer",
                          !timParam ? "bg-[#F0F9FA] text-[#164E59] font-bold" : "hover:bg-slate-50 text-slate-700 font-medium"
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          <span>Semua Tim Kerja Biro 3</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                            {meetingsList.length} Kegiatan
                          </span>
                          {!timParam && <Check className="w-4 h-4 text-[#31889C]" />}
                        </div>
                      </button>
                    </div>

                    {/* Daftar Tim */}
                    <div className="pt-1.5 space-y-1">
                      {teamsList.map((t) => {
                        const isSelected = timParam === t.code.toUpperCase();
                        const isMyAssignedTeam = effectiveAllowedTeamCodes?.includes(t.code.toUpperCase());
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
                              "flex items-center justify-between w-full px-3 py-2 rounded-xl transition-all text-left cursor-pointer",
                              isSelected ? "bg-[#F0F9FA] border border-[#31889C]/30 text-[#164E59] font-bold" : "hover:bg-slate-50 text-slate-700 font-medium"
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className={cn("w-2 h-2 rounded-full shrink-0", isSelected ? "bg-[#31889C]" : "bg-slate-300")} />
                              <div>
                                <div className={cn("text-[12px] flex items-center gap-1.5", isSelected ? "font-bold text-[#164E59]" : "font-medium text-slate-700")}>
                                  <span>{t.name}</span>
                                  {isMyAssignedTeam && (
                                    <span className="text-[9.5px] font-semibold px-1.5 py-0.2 rounded-md bg-teal-100 text-[#164E59]">
                                      Tim Anda
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {countForTeam} kegiatan terdaftar
                                </div>
                              </div>
                            </div>

                            {isSelected && <Check className="w-4 h-4 text-[#31889C] ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dropdown: Status Kegiatan */}
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
                title="Filter berdasarkan Status Kegiatan"
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
                    Status Kegiatan
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

            {/* Dropdown: Jenis Kegiatan */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'JENIS' ? null : 'JENIS')}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all cursor-pointer border select-none",
                  jenisParam
                    ? "bg-[#F0F9FA] border-[#31889C] text-[#164E59] shadow-2xs font-bold"
                    : openDropdown === 'JENIS'
                      ? "bg-slate-100 border-slate-300 text-slate-900"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                )}
                title="Filter berdasarkan Jenis Kegiatan"
              >
                <span>{selectedJenisIcon}</span>
                <span className="truncate max-w-[130px]">{selectedJenisLabel}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5",
                    jenisParam ? "bg-[#31889C] text-white" : "bg-slate-100 text-slate-600"
                  )}
                >
                  {selectedJenisObj?.count ?? teamFilteredMeetings.length}
                </span>
                <ChevronDown
                  className={cn(
                    "w-3 h-3 transition-transform text-slate-400",
                    openDropdown === 'JENIS' && "rotate-180 text-[#31889C]"
                  )}
                />
              </button>

              {openDropdown === 'JENIS' && (
                <div className="absolute right-0 sm:left-0 sm:right-auto mt-1.5 w-64 max-h-72 overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200/90 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase sticky top-0 bg-white border-b border-slate-100 mb-1">
                    Jenis Kegiatan
                  </div>
                  {jenisFilters.map((jf) => {
                    const isActive = jf.value === 'ALL'
                      ? !jenisParam
                      : (jenisParam || '').toLowerCase() === jf.value.toLowerCase();
                    return (
                      <button
                        key={jf.value}
                        type="button"
                        onClick={() => {
                          handleSelectJenis(jf.value);
                          setOpenDropdown(null);
                        }}
                        className={cn(
                          "flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-[12px] text-left transition-colors cursor-pointer",
                          isActive ? "bg-[#F0F9FA] text-[#164E59] font-bold" : "hover:bg-slate-50 text-slate-700 font-medium"
                        )}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span>{jf.icon}</span>
                          <span className="truncate">{jf.label}</span>
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className="text-[10.5px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-semibold">
                            {jf.count}
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
                    <span>Harian (Hari Ini)</span>
                    {isTodayPresetActive && <Check className="w-3.5 h-3.5 text-[#31889C]" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handlePreset('THIS_WEEK');
                      setOpenDropdown(null);
                    }}
                    className={cn(
                      "flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-[12px] text-left transition-colors cursor-pointer",
                      isThisWeekPresetActive ? "bg-[#F0F9FA] text-[#164E59] font-bold" : "hover:bg-slate-50 text-slate-700 font-medium"
                    )}
                  >
                    <span>Mingguan (Minggu Ini)</span>
                    {isThisWeekPresetActive && <Check className="w-3.5 h-3.5 text-[#31889C]" />}
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
                    <span>Bulanan (Bulan Ini)</span>
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
                    <span>Tahunan (Tahun Ini)</span>
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
                  Bulan Kegiatan
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

      </div>
      {/* Meeting Table */}
      <MeetingTable
        initialMeetings={meetingsList}
        filterStatus={statusParam}
        filterBiro={effectiveLockedTeamCode || timParam || (lockedBiroCode ? (lockedBiroCode as BiroCode) : null)}
        filterMonth={monthParam}
        filterYear={yearParam}
        filterDayOfWeek={dayParam}
        filterDate={dateParam}
        filterCategory={kategoriParam}
        filterJenis={jenisParam}
        searchQuery={searchFilter}
        onSearchChange={setSearchFilter}
        hideHeader={true}
        onClearFilters={handleClearAllFilters}
        onMeetingDeleted={(deletedId) => {
          setDeletedIds((prev) => new Set(prev).add(deletedId));
          setMeetingsList((prev) => prev.filter((m) => m.id !== deletedId));
        }}
      />
    </div>
  );
}
