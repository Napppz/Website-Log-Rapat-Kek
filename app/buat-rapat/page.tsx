'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar,
  Building2,
  ArrowLeft,
  Users,
  CheckCircle,
  Loader2,
  AlertCircle,
  Check,
  X,
  UserCheck,
  FileText,
  Sparkles,
  RefreshCw,
  FolderOpen,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  getActiveUsersAction,
  createMeetingAction,
  getMeetingOptionsAction,
  previewNextMeetingNumberAction,
} from '@/app/actions/meeting-actions';
import { getTeamsAction } from '@/app/actions/team-actions';
import { toast } from '@/components/providers/toast-provider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MultiPicSelector, PicOptionUser } from '@/components/meeting/pic-selector';

interface AvailableUser {
  id: string;
  name: string;
  email: string;
  role: string;
  biro?: {
    id: string;
    code: string;
    shortName: string;
  } | null;
  team?: {
    id: string;
    code: string;
    name: string;
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

export const JENIS_KEGIATAN_OPTIONS = [
  'Rapat Kerja / Koordinasi',
  'Kunjungan Lapangan / Kunker',
  'Audiensi / Kemitraan',
  'Sosialisasi / Forum / Workshop',
  'Media Gathering / Publikasi',
  'Penandatanganan MoU / PKS',
  'Groundbreaking / Seremoni',
  'Pelantikan',
  'Other',
];

export const TIM_OPTIONS = [
  {
    id: '1c2512e1-1859-42ca-874a-196848ab7acf',
    code: 'INV',
    name: 'Tim Investasi',
    shortName: 'Investasi',
    description: 'Fasilitasi, promosi, dan percepatan realisasi investasi strategis KEK',
  },
  {
    id: '663d7ff9-585a-4800-8840-389a5e322779',
    code: 'KS',
    name: 'Tim Kerja Sama',
    shortName: 'Kerja Sama',
    description: 'Penguatan kemitraan strategis, koordinasi lintas K/L, dan kerja sama badan usaha',
  },
  {
    id: 'a3b2e91a-566c-46e5-a740-1aa944793290',
    code: 'KOM',
    name: 'Tim Komunikasi',
    shortName: 'Komunikasi',
    description: 'Komunikasi publik, hubungan media, dokumentasi, dan diseminasi kebijakan KEK',
  },
  {
    id: 'c82de951-5fd8-4390-8cce-e663a13bedcc',
    code: 'SI',
    name: 'Tim Sistem Informasi',
    shortName: 'Sistem Informasi',
    description: 'Pengembangan sistem informasi, tata kelola data digital, dan integrasi TI KEK',
  },
  {
    id: '1d87548c-6e7f-4ce5-bb4e-1cb5e27e42bd',
    code: 'POKJA',
    name: 'Pokja (Kelompok Kerja)',
    shortName: 'Pokja',
    description: 'Kelompok kerja lintas sektor, task force akselerasi, dan koordinasi terfokus',
  },
];

export default function BuatRapatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'STAFF';
  const isPrivileged = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'STAFF';
  const isStaff = userRole === 'STAFF';

  // State daftar tim aktif dari database
  const [teamsList, setTeamsList] = useState<any[]>(TIM_OPTIONS);

  // Deteksi seluruh tim kerja staf jika login sebagai STAFF (bisa >1 tim)
  const staffTeams = useMemo(() => {
    if (session?.user?.role !== 'STAFF') return [];
    const sessionTeams =
      (session?.user as any)?.assignedTeams ||
      (session?.user as any)?.teams;
    if (Array.isArray(sessionTeams) && sessionTeams.length > 0) {
      const mapped = sessionTeams
        .map((st: any) => {
          const found = teamsList.find((t) => t.id === st.id || t.code === st.code);
          return found || st;
        })
        .filter(Boolean);
      if (mapped.length > 0) return mapped;
    }
    const staffCode = session?.user?.teamCode?.toUpperCase();
    const staffId = session?.user?.teamId;
    const match = teamsList.find(
      (t) =>
        (staffId && t.id === staffId) ||
        (staffCode && t.code.toUpperCase() === staffCode)
    );
    if (match) return [match];
    if (staffId || staffCode) {
      return [
        {
          id: staffId || 'TIM-STAFF',
          code: staffCode || 'TIM',
          name: session?.user?.teamName || staffCode || 'Tim Staf',
        },
      ];
    }
    return [];
  }, [session, teamsList]);

  // Today string for date input
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  // 1. Tim Kerja & Nomor Registrasi
  const [selectedTeamId, setSelectedTeamId] = useState<string>('1c2512e1-1859-42ca-874a-196848ab7acf');
  const [registrationNumber, setRegistrationNumber] = useState<string>('');
  const [isManualNumber, setIsManualNumber] = useState<boolean>(false);
  const [isLoadingNumber, setIsLoadingNumber] = useState<boolean>(false);

  // 2. Judul Kegiatan
  const [title, setTitle] = useState('');

  // 3. Tanggal Pelaksanaan Kegiatan
  const [date, setDate] = useState(todayStr);

  // 4. Kategori Naskah / Dasar Kegiatan (Undangan Internal, Daftar Naskah Masuk, Disposisi Setjen/Biro, Tunda Rapat)
  const [kategoriRapat, setKategoriRapat] = useState<string>('UNDANGAN_INTERNAL');
  const [sourceOrigin, setSourceOrigin] = useState<string>('');
  const [postponeReason, setPostponeReason] = useState<string>('');

  // 5. Jenis Kegiatan (Pengganti Jenis Rapat)
  const [jenisKegiatan, setJenisKegiatan] = useState<string>('Rapat Kerja / Koordinasi');
  const [customJenisKegiatan, setCustomJenisKegiatan] = useState<string>('');

  // 6. PIC Kegiatan (Bisa lebih dari 1 orang langsung)
  const [selectedPicIds, setSelectedPicIds] = useState<string[]>([]);
  const [picName, setPicName] = useState<string>('');

  // Optional: Tautkan kegiatan sebelumnya
  const [previousMeetingId, setPreviousMeetingId] = useState<string>('');

  // Auxiliary data
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [availableMeetings, setAvailableMeetings] = useState<any[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch initial teams (active only)
  useEffect(() => {
    getTeamsAction(false)
      .then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          setTeamsList(res.data);
        }
      })
      .catch((err) => console.warn('Could not load teams:', err));
  }, []);

  // Otomatis sinkronisasi tim kerja dengan tim staf begitu sesi tersedia
  useEffect(() => {
    if (isStaff && staffTeams.length > 0) {
      const isCurrentInStaffTeams = staffTeams.some((t: any) => t.id === selectedTeamId);
      if (!isCurrentInStaffTeams) {
        setSelectedTeamId(staffTeams[0].id);
        setIsManualNumber(false);
      }
    }
  }, [isStaff, staffTeams, selectedTeamId]);

  const currentTeam = useMemo(
    () =>
      teamsList.find((t: any) => t.id === selectedTeamId) ||
      staffTeams.find((t: any) => t.id === selectedTeamId) ||
      staffTeams[0] ||
      teamsList[0] ||
      TIM_OPTIONS[0],
    [selectedTeamId, teamsList, staffTeams]
  );

  // Fetch initial data
  useEffect(() => {
    getActiveUsersAction()
      .then((res) => {
        if (res.success && res.data) {
          setAvailableUsers(res.data);
        }
      })
      .catch((err) => console.warn('Could not load users:', err));

    getMeetingOptionsAction()
      .then((res) => {
        if (res.success && res.data) {
          setAvailableMeetings(res.data);
        }
      })
      .catch((err) => console.warn('Could not load meetings:', err));
  }, []);

  // Update registration number preview when selected team changes (unless manually edited)
  useEffect(() => {
    if (!isManualNumber) {
      setIsLoadingNumber(true);
      previewNextMeetingNumberAction('IKK', selectedTeamId)
        .then((res) => {
          if (res.success && res.data) {
            setRegistrationNumber(res.data);
          }
        })
        .catch(() => { })
        .finally(() => setIsLoadingNumber(false));
    }
  }, [selectedTeamId, isManualNumber]);

  // Handle URL query parameters
  useEffect(() => {
    const prevId = searchParams.get('previousMeetingId');
    const paramTitle = searchParams.get('title');
    const paramTim = searchParams.get('tim');

    if (prevId) setPreviousMeetingId(prevId);
    if (paramTitle) setTitle(paramTitle);
    if (paramTim && session?.user?.role !== 'STAFF') {
      const match = teamsList.find(
        (t) => t.code.toUpperCase() === paramTim.toUpperCase() || t.id === paramTim
      );
      if (match) setSelectedTeamId(match.id);
    }
  }, [searchParams, session, teamsList]);

  // Reset registration number to auto
  const handleResetToAutoNumber = () => {
    setIsManualNumber(false);
    setIsLoadingNumber(true);
    previewNextMeetingNumberAction('IKK', selectedTeamId)
      .then((res) => {
        if (res.success && res.data) {
          setRegistrationNumber(res.data);
          toast.success(`Nomor registrasi diperbarui: ${res.data}`);
        }
      })
      .catch(() => { })
      .finally(() => setIsLoadingNumber(false));
  };

  // Toggle PIC user in Multi-PIC selector
  const handleTogglePic = (user: PicOptionUser) => {
    setSelectedPicIds((prev) => {
      const exists = prev.includes(user.id);
      const next = exists ? prev.filter((id) => id !== user.id) : [...prev, user.id];

      // Auto update picName text from selected users list
      const names = availableUsers
        .filter((u) => next.includes(u.id))
        .map((u) => u.name);
      setPicName(names.join(', '));
      return next;
    });
  };

  const handleClearAllPics = () => {
    setSelectedPicIds([]);
    setPicName('');
  };

  // Handle submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setErrorMessage(null);

    try {
      if (!title.trim()) {
        toast.error('Judul kegiatan wajib diisi.');
        setIsSubmitted(false);
        return;
      }

      if (date && date < todayStr) {
        toast.error('Tanggal pelaksanaan kegiatan tidak boleh sebelum hari ini.');
        setIsSubmitted(false);
        return;
      }

      if (!picName.trim() && selectedPicIds.length === 0) {
        toast.error('PIC kegiatan wajib dipilih minimal 1 orang.');
        setIsSubmitted(false);
        return;
      }

      if (kategoriRapat === 'SURAT_DITUNDA' && !postponeReason.trim()) {
        toast.error('Mohon cantumkan alasan penundaan untuk kategori Tunda Kegiatan.');
        setIsSubmitted(false);
        return;
      }

      // Determine final jenis kegiatan
      const finalJenisKegiatan =
        jenisKegiatan === 'Other'
          ? (customJenisKegiatan.trim() || 'Lainnya')
          : jenisKegiatan;

      // Submit
      const res = await createMeetingAction({
        title: title.trim(),
        biroCode: 'IKK',
        primaryTeamId: selectedTeamId,
        date,
        startTime: '09:00',
        endTime: '12:00',
        location: 'Biro 3 / Luar Kantor',
        meetingKind: finalJenisKegiatan,
        picName: picName.trim() || undefined,
        participantUserIds: selectedPicIds.length > 0 ? selectedPicIds : undefined,
        chairpersonId: selectedPicIds[0] || undefined,
        progressStatus: 'Belum Dimulai',
        meetingNumber: registrationNumber.trim() || undefined,
        documentCategory: kategoriRapat,
        documentSubCategory:
          kategoriRapat === 'DISPOSISI_Setjen'
            ? 'DISPOSISI_Setjen'
            : kategoriRapat === 'DISPOSISI_BIRO'
              ? 'DISPOSISI_BIRO'
              : undefined,
        sourceOrigin: sourceOrigin.trim() || undefined,
        postponeReason: postponeReason.trim() || undefined,
        previousMeetingId: previousMeetingId || undefined,
      });

      if (res.success && res.data) {
        toast.success(
          `Kegiatan "${title}" (${res.data.meetingNumber}) berhasil dicatat!`
        );
        router.refresh();
        router.push(`/semua-rapat/${res.data.id}`);
      } else {
        setErrorMessage(res.error || 'Gagal menyimpan pencatatan kegiatan');
        toast.error(res.error || 'Gagal menyimpan pencatatan kegiatan');
        setIsSubmitted(false);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem saat membuat pencatatan');
      setIsSubmitted(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/semua-rapat"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-[#1E6B7B] text-sm font-semibold transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Kembali ke Rekap Kegiatan</span>
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="teal" dot>
            Pencatatan Kegiatan Biro 3
          </Badge>
        </div>
      </div>

      {/* Hero Title & Description */}
      <div className="bg-gradient-to-br from-[#175360] via-[#1E6B7B] to-[#266F80] rounded-2xl p-6 sm:p-7 text-white shadow-md border border-white/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="max-w-2xl">
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-amber-300 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-3.5 h-3.5" />
              Sistem Logbook &amp; Pencatatan Kegiatan Biro 3 (IKK)
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
              Catat Kegiatan Baru — Biro 3
            </h1>
            <p className="text-white/80 text-sm mt-1.5 leading-relaxed">
              Catat agenda kerja, koordinasi, audiensi, atau penugasan resmi Biro 3. Tentukan PIC pelaksana (bisa lebih dari satu orang). Hasil capaian kerja, tautan Google Drive, dan rilis berita akan dilengkapi setelah kegiatan terlaksana.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3.5 text-red-700 text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Gagal Menyimpan Kegiatan</p>
              <p className="mt-0.5 text-red-600">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BAGIAN I: REGISTRASI TIM, AGENDA & WAKTU PELAKSANAAN                      */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden border-t-4 border-t-[#1E6B7B]">
          <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F0F8FA] border border-[#BCE3EB] flex items-center justify-center text-[#1E6B7B]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Bagian I: Registrasi Tim, Agenda &amp; Waktu Pelaksanaan
                </h2>
                <p className="text-xs text-slate-500">
                  Nomor registrasi tim kerja, judul kegiatan, dan tanggal pelaksanaan
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
              Poin 1, 2, 3
            </span>
          </div>

          <div className="p-6 sm:p-7 space-y-6">
            {/* 1. Kode Nomor Registrasi Per Tim Dibuat Beda */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#F0F8FA] via-white to-slate-50 border border-[#BCE3EB] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 rounded-full bg-[#1E6B7B] text-white text-xs flex items-center justify-center font-bold shadow-2xs">1</span>
                  <span>Kode Nomor Registrasi Per Tim</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetToAutoNumber}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-[#BCE3EB] text-[#1E6B7B] hover:bg-[#F0F8FA] text-xs font-semibold shadow-2xs cursor-pointer transition-all"
                    title="Hitung ulang nomor urut otomatis sesuai tim"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", isLoadingNumber && "animate-spin")} />
                    <span>Reset ke Otomatis</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                {/* Team Selection List */}
                <div className="md:col-span-7 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      Pilih Tim Kerja:
                    </label>
                    {isStaff && staffTeams.length > 1 && (
                      <span className="text-[11px] text-[#1E6B7B] font-semibold bg-[#E8F5F7] px-2 py-0.5 rounded-md">
                        {staffTeams.length} Tim Terdaftar
                      </span>
                    )}
                  </div>
                  {isStaff && staffTeams.length === 1 ? (
                    <div className="bg-[#E8F5F7] px-4 py-2.5 rounded-lg border border-[#BCE3EB] shadow-2xs flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-3 h-3 rounded-full flex items-center justify-center border border-[#1E6B7B] bg-[#1E6B7B]">
                          <span className="w-1 h-1 rounded-full bg-white" />
                        </span>
                        <span className="text-sm font-bold text-[#1E6B7B]">
                          {staffTeams[0].name}
                        </span>
                      </div>
                      <span className="text-xs font-mono px-2 py-0.5 rounded font-bold bg-[#1E6B7B] text-white">
                        {staffTeams[0].code}
                      </span>
                    </div>
                  ) : (
                    <div className="bg-white p-1.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-1 max-h-56 overflow-y-auto">
                      {((isStaff && staffTeams.length > 0) ? staffTeams : teamsList).map((tim: any) => {
                        const isSelected = selectedTeamId === tim.id;
                        return (
                          <button
                            key={tim.id}
                            type="button"
                            onClick={() => {
                              setSelectedTeamId(tim.id);
                              setIsManualNumber(false);
                            }}
                            className={cn(
                              'w-full px-4 py-2.5 rounded-lg text-sm font-semibold transition-all text-left flex items-center justify-between cursor-pointer',
                              isSelected
                                ? 'bg-[#E8F5F7] text-[#1E6B7B] shadow-2xs font-bold'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className={cn(
                                  'w-3 h-3 rounded-full flex items-center justify-center border',
                                  isSelected ? 'border-[#1E6B7B] bg-[#1E6B7B]' : 'border-slate-300 bg-white'
                                )}
                              >
                                {isSelected && <span className="w-1 h-1 rounded-full bg-white" />}
                              </span>
                              <span>{tim.name}</span>
                            </div>
                            <span
                              className={cn(
                                'text-xs font-mono px-2 py-0.5 rounded font-bold',
                                isSelected ? 'bg-[#1E6B7B] text-white' : 'bg-slate-100 text-slate-500'
                              )}
                            >
                              {tim.code}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500">
                    {isStaff
                      ? staffTeams.length > 1
                        ? 'Anda terdaftar pada beberapa tim kerja. Klik tim kerja untuk menyesuaikan penomoran registrasi otomatis.'
                        : `Nomor registrasi otomatis disesuaikan dengan tim kerja Anda (${staffTeams[0]?.name || currentTeam?.name || 'Tim Kerja'}).`
                      : 'Pilih salah satu tim Biro 3 untuk penomoran registrasi & pengarsipan kegiatan.'}
                  </p>
                </div>

                {/* Final Registration Code Input */}
                <div className="md:col-span-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Nomor Registrasi Kegiatan:
                    </label>
                    {isManualNumber && (
                      <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded">
                        Manual
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={registrationNumber}
                      onChange={(e) => {
                        setRegistrationNumber(e.target.value);
                        setIsManualNumber(true);
                      }}
                      placeholder={`Contoh: ${currentTeam.code}-001`}
                      className="w-full px-3.5 h-[44px] rounded-xl border border-slate-300 bg-white text-slate-900 font-mono font-bold text-sm tracking-wide focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B] shadow-2xs"
                    />
                    {isLoadingNumber && (
                      <Loader2 className="w-4 h-4 text-[#1E6B7B] animate-spin absolute right-3 top-3.5" />
                    )}
                  </div>
                  <div className="p-3 bg-white/80 rounded-xl border border-[#BCE3EB] text-[11px] text-slate-600 space-y-1">
                    <div className="flex items-center justify-between font-semibold text-slate-700">
                      <span>Tim Aktif:</span>
                      <span className="text-[#1E6B7B] font-bold">
                        {currentTeam.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 font-mono">
                      <span>Format Otomatis:</span>
                      <span className="font-semibold text-slate-700">
                        {currentTeam.code}-001
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Judul Kegiatan */}
            <div>
              <label className="font-bold text-slate-800 mb-2 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#1E6B7B] text-white text-xs flex items-center justify-center font-bold shadow-2xs">2</span>
                  <span>Judul Kegiatan</span>
                  <span className="text-red-500">*</span>
                </span>
                <span className="text-xs text-slate-400 font-normal">Wajib diisi</span>
              </label>
              <textarea
                required
                rows={3}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Kunjungan Lapangan & Peninjauan Progres Pembangunan Infrastruktur KEK Kendal..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B] shadow-2xs transition-all leading-relaxed"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Tuliskan nama atau agenda kegiatan secara jelas dan spesifik.
              </p>
            </div>

            {/* 3. Tanggal Pelaksanaan Kegiatan */}
            <div>
              <label className="font-bold text-slate-800 mb-2 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#1E6B7B] text-white text-xs flex items-center justify-center font-bold shadow-2xs">3</span>
                  <span>Tanggal Pelaksanaan</span>
                  <span className="text-red-500">*</span>
                </span>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 font-semibold">
                  Min. Hari Ini
                </span>
              </label>
              <div className="relative max-w-md">
                <input
                  type="date"
                  required
                  min={todayStr}
                  value={date}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && val < todayStr) {
                      toast.error('Tanggal pelaksanaan kegiatan tidak boleh mundur (sebelum hari ini).');
                      setDate(todayStr);
                    } else {
                      setDate(val);
                    }
                  }}
                  className="w-full px-4 h-[44px] rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B] shadow-2xs"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                Tanggal dilaksanakannya kegiatan atau agenda kerja.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BAGIAN II: KLASIFIKASI NASKAH & JENIS KEGIATAN                            */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden border-t-4 border-t-[#F99D1C]">
          <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFF0DC] border border-[#FEDEBE] flex items-center justify-center text-[#C2410C]">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Bagian II: Kategori Naskah &amp; Bentuk Kegiatan
                </h2>
                <p className="text-xs text-slate-500">
                  Klasifikasi dasar naskah administrasi dan bentuk format kegiatan Biro 3
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
              Poin 4, 5
            </span>
          </div>

          <div className="p-6 sm:p-7 space-y-6">
            {/* 4. Kategori Naskah (Undangan Internal, Daftar Naskah Masuk, Disposisi, Tunda Kegiatan) */}
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3.5">
              <div className="flex items-center justify-between">
                <label htmlFor="kategori-naskah-select" className="font-bold text-slate-800 flex items-center gap-2 text-sm cursor-pointer">
                  <span className="w-6 h-6 rounded-full bg-[#1E6B7B] text-white text-xs flex items-center justify-center font-bold shadow-2xs">4</span>
                  <span>Kategori Kegiatan</span>
                  <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-slate-400">Pilih salah satu kategori kegiatan</span>
              </div>

              {/* Field Dropdown Kategori Naskah */}
              <div className="relative">
                <select
                  id="kategori-naskah-select"
                  value={kategoriRapat}
                  onChange={(e) => setKategoriRapat(e.target.value)}
                  className="w-full px-4 pr-10 h-[46px] rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/25 focus:border-[#1E6B7B] shadow-2xs cursor-pointer appearance-none transition-all hover:border-slate-400"
                >
                  <option value="UNDANGAN_INTERNAL">Undangan Internal</option>
                  <option value="NASKAH_MASUK">Daftar Naskah Masuk</option>
                  <option value="DISPOSISI_Setjen">Disposisi Setjen</option>
                  <option value="DISPOSISI_BIRO">Disposisi Biro</option>
                  <option value="SURAT_DITUNDA">Tunda Kegiatan</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Conditional Input per kategori */}
              {kategoriRapat === 'NASKAH_MASUK' && (
                <div className="mt-3 animate-in fade-in space-y-1.5 pt-2 border-t border-slate-200/80">
                  <label className="block text-xs font-semibold text-slate-700">
                    Asal Naskah Masuk / Instansi Pengirim (Opsional):
                  </label>
                  <input
                    type="text"
                    value={sourceOrigin}
                    onChange={(e) => setSourceOrigin(e.target.value)}
                    placeholder="Contoh: Kementerian Koordinator Bidang Perekonomian / BUPP KEK Batam..."
                    className="w-full px-3.5 h-[40px] rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B]"
                  />
                </div>
              )}

              {kategoriRapat === 'DISPOSISI_Setjen' && (
                <div className="mt-3 animate-in fade-in space-y-1.5 pt-2 border-t border-indigo-200/80">
                  <label className="block text-xs font-semibold text-indigo-900">
                    Nomor Agenda / Catatan Disposisi Setjen (Opsional):
                  </label>
                  <input
                    type="text"
                    value={sourceOrigin}
                    onChange={(e) => setSourceOrigin(e.target.value)}
                    placeholder="Contoh: No. Agenda 184 / Disposisi Setjen via SRIKANDI..."
                    className="w-full px-3.5 h-[40px] rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              )}

              {kategoriRapat === 'DISPOSISI_BIRO' && (
                <div className="mt-3 animate-in fade-in space-y-1.5 pt-2 border-t border-purple-200/80">
                  <label className="block text-xs font-semibold text-purple-900">
                    Nomor / Catatan Disposisi Biro (Opsional):
                  </label>
                  <input
                    type="text"
                    value={sourceOrigin}
                    onChange={(e) => setSourceOrigin(e.target.value)}
                    placeholder="Contoh: Disposisi Kepala Biro IKK No. ND-082 / Nota Dinas Internal..."
                    className="w-full px-3.5 h-[40px] rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>
              )}

              {(kategoriRapat === 'SURAT_DITUNDA' || kategoriRapat === 'TUNDA_RAPAT') && (
                <div className="mt-3 animate-in fade-in space-y-1.5 pt-2 border-t border-rose-200/80">
                  <label className="block text-xs font-semibold text-rose-700">
                    Alasan / Keterangan Penundaan Kegiatan: <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={postponeReason}
                    onChange={(e) => setPostponeReason(e.target.value)}
                    placeholder="Contoh: Ditunda atas arahan pimpinan menyusul agenda Sidang Kabinet..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-rose-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              )}
            </div>

            {/* 5. Jenis Kegiatan (Ubah dari Jenis Rapat) */}
            <div>
              <label className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-full bg-[#1E6B7B] text-white text-xs flex items-center justify-center font-bold shadow-2xs">5</span>
                <span>Jenis Kegiatan</span>
                <span className="text-red-500">*</span>
              </label>
              <select
                value={jenisKegiatan}
                onChange={(e) => setJenisKegiatan(e.target.value)}
                className="w-full px-4 h-[44px] rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B] shadow-2xs cursor-pointer"
              >
                {JENIS_KEGIATAN_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === 'Other' ? 'Other (Kategori Kegiatan Lainnya...)' : opt}
                  </option>
                ))}
              </select>

              {jenisKegiatan === 'Other' && (
                <div className="mt-2.5 animate-in fade-in">
                  <input
                    type="text"
                    required
                    value={customJenisKegiatan}
                    onChange={(e) => setCustomJenisKegiatan(e.target.value)}
                    placeholder="Ketikkan jenis kegiatan lainnya di sini..."
                    className="w-full px-4 h-[40px] rounded-xl border border-[#1E6B7B] bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20"
                  />
                </div>
              )}
              <p className="text-xs text-slate-400 mt-1.5">
                Pilih format atau bentuk pelaksanaan kegiatan (Rapat Kerja, Kunker, Audiensi, dll.).
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BAGIAN III: PIC PELAKSANA KEGIATAN (Bisa Langsung > 1 Orang)               */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs border-t-4 border-t-[#31889C]">
          <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F0F9FA] border border-[#BCE3EB] flex items-center justify-center text-[#1E6B7B]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Bagian III: Person In Charge (PIC) Pelaksana Kegiatan
                </h2>
                <p className="text-xs text-slate-500">
                  Staf atau pejabat penanggung jawab kegiatan (dapat langsung memilih lebih dari 1 orang)
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
              Poin 6
            </span>
          </div>

          <div className="p-6 sm:p-7 space-y-4">
            <label className="font-bold text-slate-800 flex items-center gap-2 text-sm">
              <span className="w-6 h-6 rounded-full bg-[#1E6B7B] text-white text-xs flex items-center justify-center font-bold shadow-2xs">6</span>
              <span>Pilih PIC Pelaksana (Bisa Langsung Lebih Dari 1 Orang)</span>
              <span className="text-red-500">*</span>
            </label>

            <MultiPicSelector
              availableUsers={availableUsers}
              selectedUserIds={selectedPicIds}
              picName={picName}
              onToggleUser={handleTogglePic}
              onPicNameChange={setPicName}
              onClearAll={handleClearAllPics}
              required
            />
          </div>
        </div>


        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Link
            href="/semua-rapat"
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isSubmitted}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1E6B7B] hover:bg-[#164E59] text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-60"
          >
            {isSubmitted ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan Pencatatan...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Simpan Pencatatan Kegiatan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
