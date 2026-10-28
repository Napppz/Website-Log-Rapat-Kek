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
  UploadCloud,
  Paperclip,
  FileCheck,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  getActiveUsersAction,
  createMeetingAction,
  getMeetingOptionsAction,
  previewNextMeetingNumberAction,
} from '@/app/actions/meeting-actions';
import { uploadGenericMeetingFileAction } from '@/app/actions/meeting-upload-actions';
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

export const KATEGORI_KEGIATAN_OPTIONS = [
  { value: 'NASKAH_MASUK', label: 'Naskah Masuk' },
  { value: 'DISPOSISI_SEKJEN', label: 'Disposisi Sekjen' },
  { value: 'DISPOSISI_KARO', label: 'Disposisi Karo' },
  { value: 'KEGIATAN_INTERNAL', label: 'Kegiatan Internal' },
  { value: 'LAPORAN_RUTIN', label: 'Laporan Rutin' },
  { value: 'LAINNYA', label: 'Lainnya / Other' },
];

export const KATEGORI_LABEL_MAP: Record<string, string> = {
  NASKAH_MASUK: 'Naskah Masuk',
  DISPOSISI_SEKJEN: 'Disposisi Sekjen',
  DISPOSISI_KARO: 'Disposisi Karo',
  KEGIATAN_INTERNAL: 'Kegiatan Internal',
  LAPORAN_RUTIN: 'Laporan Rutin',
  LAINNYA: 'Lainnya / Other',
};

export const JENIS_KEGIATAN_OPTIONS: string[] = KATEGORI_KEGIATAN_OPTIONS.map((k) => k.label);

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
    id: 'f49c43a1-7256-436c-a1bf-68e7f3201732',
    code: 'HKM',
    name: 'Tim Hukum',
    shortName: 'Hukum',
    description: 'Bantuan hukum, telaah regulasi, advokasi, dan perumusan peraturan perundang-undangan Kawasan Ekonomi Khusus',
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

  // 4. Kategori Kegiatan
  const [kategoriRapat, setKategoriRapat] = useState<string>('KEGIATAN_INTERNAL');
  const [customKategori, setCustomKategori] = useState<string>('');
  const [kategoriKomentar, setKategoriKomentar] = useState<string>('');
  const [sourceOrigin, setSourceOrigin] = useState<string>('');

  // Dokumen Lampiran File Upload (Bisa lebih dari 1 file)
  const [uploadedDocs, setUploadedDocs] = useState<Array<{
    url: string;
    name: string;
    size: number;
    fileType?: string;
  }>>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState<boolean>(false);

  // 5. PIC Kegiatan (Bisa lebih dari 1 orang langsung)
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

  // Handle document file upload (Bisa lebih dari 1 file)
  const handleDocChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    try {
      setIsUploadingDoc(true);
      const newlyUploaded: Array<{ url: string; name: string; size: number; fileType?: string }> = [];

      for (const file of files) {
        if (file.size > 100 * 1024 * 1024) {
          toast.error(`Berkas "${file.name}" melebihi batas 100MB.`);
          continue;
        }
        const fd = new FormData();
        fd.append('file', file);
        fd.append('type', 'dokumen');
        const res = await uploadGenericMeetingFileAction(fd);
        if (res.success && res.data) {
          newlyUploaded.push({
            url: res.data.url,
            name: res.data.name,
            size: res.data.size,
            fileType: res.data.fileType,
          });
        } else {
          toast.error(res.error || `Gagal mengunggah berkas ${file.name}.`);
        }
      }

      if (newlyUploaded.length > 0) {
        setUploadedDocs((prev) => [...prev, ...newlyUploaded]);
        toast.success(`${newlyUploaded.length} berkas berhasil diunggah.`);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan sistem saat unggah dokumen.');
    } finally {
      setIsUploadingDoc(false);
      e.target.value = '';
    }
  };

  const handleRemoveDoc = (indexToRemove: number) => {
    setUploadedDocs((prev) => prev.filter((_, idx) => idx !== indexToRemove));
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

      const finalJenisKegiatan =
        kategoriRapat === 'LAINNYA'
          ? (customKategori.trim() || 'Lainnya')
          : (KATEGORI_LABEL_MAP[kategoriRapat] || kategoriRapat);

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
        progressStatus: date <= todayStr ? 'Dalam Proses' : 'Belum Dimulai',
        meetingNumber: registrationNumber.trim() || undefined,
        documentCategory: kategoriRapat,
        documentSubCategory:
          kategoriRapat === 'DISPOSISI_SEKJEN'
            ? 'DISPOSISI_SEKJEN'
            : kategoriRapat === 'DISPOSISI_KARO'
              ? 'DISPOSISI_KARO'
              : kategoriRapat === 'LAINNYA'
                ? (customKategori.trim() || undefined)
                : undefined,
        sourceOrigin: (kategoriKomentar.trim() || sourceOrigin.trim()) || undefined,
        invitationDocUrl: uploadedDocs[0]?.url || undefined,
        invitationDocName: uploadedDocs[0]?.name || undefined,
        invitationDocSize: uploadedDocs[0]?.size || undefined,
        categoryDocUrl: uploadedDocs[0]?.url || undefined,
        categoryDocName: uploadedDocs[0]?.name || undefined,
        categoryDocSize: uploadedDocs[0]?.size || undefined,
        attachments: uploadedDocs.map((d) => ({
          fileName: d.name,
          fileUrl: d.url,
          fileSize: d.size,
          fileType: d.fileType,
        })),
        previousMeetingId: previousMeetingId || undefined,
      });

      if (res.success && res.data) {
        toast.success(
          `Kegiatan "${title}" (${res.data.meetingNumber}) berhasil dicatat!`
        );
        router.refresh();
        router.push(`/arsip-kegiatan/${res.data.id}`);
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
          href="/arsip-kegiatan"
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
                      : 'Pilih salah satu tim Biro 3 untuk penomoran registrasi & pencatatan log book kegiatan.'}
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
              <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
                <span className="text-[#1E6B7B] font-bold">💡</span>
                <span>Kegiatan otomatis dimulai (status Dalam Proses) sesuai tanggal pelaksanaan yang ditentukan tanpa perlu aktivasi manual.</span>
              </p>
            </div>
          </div>
        </div>
        {/* ========================================================================= */}
        {/* BAGIAN II: KATEGORI & DOKUMEN KEGIATAN                                    */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden border-t-4 border-t-[#F99D1C]">
          <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFF0DC] border border-[#FEDEBE] flex items-center justify-center text-[#C2410C]">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Bagian II: Kategori, PIC &amp; Dokumen
                </h2>
                <p className="text-xs text-slate-500">
                  Klasifikasi kegiatan, penanggung jawab, dan dokumen pendukung
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
              Poin 4–6
            </span>
          </div>

          <div className="p-6 sm:p-7 space-y-6">
            {/* 4. Kategori Kegiatan (Ringkas 5 Opsi Sesuai Usulan Mentor) */}
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3.5">
              <div className="flex items-center justify-between">
                <label htmlFor="kategori-naskah-select" className="font-bold text-slate-800 flex items-center gap-2 text-sm cursor-pointer">
                  <span className="w-6 h-6 rounded-full bg-[#1E6B7B] text-white text-xs flex items-center justify-center font-bold shadow-2xs">4</span>
                  <span>Kategori Kegiatan</span>
                  <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-slate-400">Pilih salah satu dari 5 kategori ringkas</span>
              </div>

              {/* Field Dropdown Kategori Ringkas */}
              <div className="relative">
                <select
                  id="kategori-naskah-select"
                  value={kategoriRapat}
                  onChange={(e) => setKategoriRapat(e.target.value)}
                  className="w-full px-4 pr-10 h-[46px] rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/25 focus:border-[#1E6B7B] shadow-2xs cursor-pointer appearance-none transition-all hover:border-slate-400"
                >
                  {KATEGORI_KEGIATAN_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {kategoriRapat === 'LAINNYA' && (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <label htmlFor="kategori-custom-input" className="block text-xs font-semibold text-slate-700">
                    Sebutkan Kategori Lainnya (Opsional)
                  </label>
                  <input
                    type="text"
                    id="kategori-custom-input"
                    value={customKategori}
                    onChange={(e) => setCustomKategori(e.target.value)}
                    placeholder="Contoh: Sosialisasi Eksternal, Bimtek, Workshop, Kunjungan Kerja..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B]"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <label htmlFor="kategori-komentar" className="block text-xs font-semibold text-slate-700">
                  Keterangan / Detail (Opsional)
                </label>
                <textarea
                  id="kategori-komentar"
                  rows={2}
                  value={kategoriKomentar}
                  onChange={(e) => setKategoriKomentar(e.target.value)}
                  placeholder="Contoh: No. agenda, nomor surat, keterangan singkat kegiatan..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B] resize-none"
                />
              </div>
            </div>

            {/* 5. PIC Pelaksana */}
            <div className="space-y-2">
              <label className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-full bg-[#1E6B7B] text-white text-xs flex items-center justify-center font-bold shadow-2xs">5</span>
                <span>PIC Pelaksana</span>
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

            {/* 6. Dokumen Lampiran Kegiatan */}
            <div className="space-y-3">
              <label className="font-bold text-slate-800 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#1E6B7B] text-white text-xs flex items-center justify-center font-bold shadow-2xs">6</span>
                  <span>Dokumen (Surat Undangan / Bahan Paparan / Berkas Acuan)</span>
                </span>
                <span className="text-xs text-slate-400 font-normal">Opsional (Bisa lebih dari 1 berkas)</span>
              </label>

              {/* Drag and Drop Zone */}
              <div className="relative border-2 border-dashed border-slate-300 hover:border-[#1E6B7B] rounded-2xl p-5 text-center transition-all bg-slate-50/50 hover:bg-[#F0F8FA]/30">
                <input
                  type="file"
                  id="doc-upload"
                  multiple
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
                  onChange={handleDocChange}
                  disabled={isUploadingDoc}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#1E6B7B] shadow-2xs">
                    {isUploadingDoc ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <UploadCloud className="w-5 h-5" />
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    {isUploadingDoc ? 'Sedang Mengunggah Berkas...' : 'Klik atau seret berkas dokumen ke sini'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Format: PDF, Word (DOCX), Bahan Paparan (PPTX), Excel, atau Gambar (Maks. 100MB per berkas • Bisa pilih lebih dari 1 file)
                  </p>
                </div>
              </div>

              {/* Uploaded Files List */}
              {uploadedDocs.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-semibold px-1">
                    <span className="flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span>{uploadedDocs.length} Berkas Berhasil Dilampirkan:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setUploadedDocs([])}
                      className="text-xs text-red-600 hover:text-red-800 font-medium hover:underline cursor-pointer"
                    >
                      Hapus Semua Berkas
                    </button>
                  </div>

                  <div className="space-y-2">
                    {uploadedDocs.map((doc, idx) => (
                      <div
                        key={`${doc.url}-${idx}`}
                        className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 shadow-2xs transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs">
                            {idx + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate" title={doc.name}>
                              {doc.name}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {doc.size ? `${(doc.size / (1024 * 1024)).toFixed(2)} MB` : 'Berkas siap dicatat dalam log book'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(idx)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg font-semibold cursor-pointer shrink-0 transition-colors"
                          title={`Hapus berkas "${doc.name}"`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>


        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Link
            href="/arsip-kegiatan"
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
