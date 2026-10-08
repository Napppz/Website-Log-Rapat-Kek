'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  UserCheck,
  Link2,
  FileText,
  UploadCloud,
  Sparkles,
  Search,
  Paperclip,
  ExternalLink,
  Trash2,
  FileCheck,
  RefreshCw,
  FolderOpen,
  MapPin,
  Tag,
  Clock,
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
import {
  saveMinutesAndActionsToMeetingAction,
  uploadInvitationFileAction,
  uploadGenericMeetingFileAction,
} from '@/app/actions/meeting-upload-actions';
import { UploadMeetingDialog } from '@/components/meeting/upload-meeting-dialog';
import { ExtractedMeetingData } from '@/lib/meeting-extractor';
import { toast } from '@/components/providers/toast-provider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PreviousMeetingSelector } from '@/components/meeting/previous-meeting-selector';

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
}

interface UploadedFileState {
  url: string;
  name: string;
  size: number;
}

const JENIS_RAPAT_OPTIONS = [
  'Media Gathering',
  'Kunker',
  'Penandatanganan Mou',
  'Groundbreaking',
  'Rapat Kerja',
  'Seminar/Forum',
  'Rapat/Audiensi',
  'Pelantikan',
  'Seremoni',
  'Other',
];

const LOKASI_OPTIONS = [
  'Graha Satwika',
  'Loka Jagatsaksana',
  'Lokasandhi',
  'Antawacana',
  'Administrator',
  'Other',
];

const STATUS_OPTIONS = [
  { value: 'Start', label: 'Start', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'On Progres', label: 'On Progres', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'Finish', label: 'Finish', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
];

export const TIM_OPTIONS = [
  {
    id: 'TIM-001',
    code: 'INV',
    name: 'Tim Investasi',
    shortName: 'Investasi',
    description: 'Fasilitasi, promosi, dan percepatan realisasi investasi strategis KEK',
  },
  {
    id: 'TIM-003',
    code: 'KS',
    name: 'Tim Kerja Sama',
    shortName: 'Kerja Sama',
    description: 'Penguatan kemitraan strategis, koordinasi lintas K/L, dan kerja sama badan usaha',
  },
  {
    id: 'TIM-002',
    code: 'KOM',
    name: 'Tim Komunikasi',
    shortName: 'Komunikasi',
    description: 'Komunikasi publik, hubungan media, dokumentasi, dan diseminasi kebijakan KEK',
  },
];

function formatFileSize(bytes: number) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function BuatRapatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'STAFF';
  const isPrivileged = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';

  // AI Extraction dialog state
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [pendingMinutes, setPendingMinutes] = useState<ExtractedMeetingData | null>(null);

  // Today string for date input
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  // 1. Judul Rapat
  const [title, setTitle] = useState('');

  // 2. Tanggal Rapat
  const [date, setDate] = useState(todayStr);

  // 3. Kategori Rapat (Undangan Internal, Daftar Naskah Masuk, Tunda Rapat)
  const [kategoriRapat, setKategoriRapat] = useState<string>('UNDANGAN_INTERNAL');
  const [sourceOrigin, setSourceOrigin] = useState<string>('');
  const [postponeReason, setPostponeReason] = useState<string>('');
  const [categoryDoc, setCategoryDoc] = useState<UploadedFileState | null>(null);
  const [isUploadingCategoryDoc, setIsUploadingCategoryDoc] = useState(false);
  const categoryFileInputRef = useRef<HTMLInputElement>(null);

  // 4. Surat Undangan (Upload File)
  const [invitationDoc, setInvitationDoc] = useState<UploadedFileState | null>(null);
  const [isUploadingInvitationDoc, setIsUploadingInvitationDoc] = useState(false);
  const invitationFileInputRef = useRef<HTMLInputElement>(null);

  // 5. Dokumen Terkait / Paparan Rapat (Upload File)
  const [materialDoc, setMaterialDoc] = useState<UploadedFileState | null>(null);
  const [isUploadingMaterialDoc, setIsUploadingMaterialDoc] = useState(false);
  const materialFileInputRef = useRef<HTMLInputElement>(null);

  // 6. Jenis Rapat (Dropdown + Other)
  const [jenisRapat, setJenisRapat] = useState<string>('Rapat Kerja');
  const [customJenisRapat, setCustomJenisRapat] = useState<string>('');

  // 7. PIC Rapat (Dropdown staf + nama PIC)
  const [picUserId, setPicUserId] = useState<string>('');
  const [picName, setPicName] = useState<string>('');

  // 8. Undangan Rapat (Peserta Rapat yang Diundang)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [attendees, setAttendees] = useState<string>('');
  const [participantSearch, setParticipantSearch] = useState('');
  const [participantTeamFilter, setParticipantTeamFilter] = useState<string>('ALL');

  // 9. Lokasi Kegiatan (Dropdown + Other)
  const [lokasiOption, setLokasiOption] = useState<string>('Graha Satwika');
  const [customLocation, setCustomLocation] = useState<string>('');

  // 10. Kode Nomor Registrasi Per Tim (Tim Investasi, Tim Kerja Sama, Tim Komunikasi)
  const [selectedTeamId, setSelectedTeamId] = useState<string>('TIM-001');
  const [registrationNumber, setRegistrationNumber] = useState<string>('');
  const [isManualNumber, setIsManualNumber] = useState<boolean>(false);
  const [isLoadingNumber, setIsLoadingNumber] = useState<boolean>(false);

  // 11. Status (Start, On Progres, Finish)
  const [statusRapat, setStatusRapat] = useState<string>('Start');

  // Optional: Tautkan rapat sebelumnya
  const [previousMeetingId, setPreviousMeetingId] = useState<string>('');

  // Auxiliary data
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [availableMeetings, setAvailableMeetings] = useState<any[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        .catch(() => {})
        .finally(() => setIsLoadingNumber(false));
    }
  }, [selectedTeamId, isManualNumber]);

  // Handle URL query parameters
  useEffect(() => {
    if (searchParams.get('upload') === 'true') {
      setIsUploadDialogOpen(true);
    }
    const prevId = searchParams.get('previousMeetingId');
    const paramTitle = searchParams.get('title');
    const paramTim = searchParams.get('tim');

    if (prevId) setPreviousMeetingId(prevId);
    if (paramTitle) setTitle(paramTitle);
    if (paramTim) {
      const match = TIM_OPTIONS.find(
        (t) => t.code.toUpperCase() === paramTim.toUpperCase() || t.id === paramTim
      );
      if (match) setSelectedTeamId(match.id);
    }
  }, [searchParams]);

  // Handle PIC selection from users list
  const handleSelectPicUser = (userId: string) => {
    setPicUserId(userId);
    const found = availableUsers.find((u) => u.id === userId);
    if (found) {
      setPicName(found.name);
    }
  };

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
      .catch(() => {})
      .finally(() => setIsLoadingNumber(false));
  };

  // Generic file upload helper
  const handleUploadFile = async (
    file: File,
    type: 'kategori' | 'undangan' | 'paparan'
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    if (type === 'kategori') setIsUploadingCategoryDoc(true);
    if (type === 'undangan') setIsUploadingInvitationDoc(true);
    if (type === 'paparan') setIsUploadingMaterialDoc(true);

    try {
      if (type === 'undangan') {
        const res = await uploadInvitationFileAction(formData);
        if (res.success && res.data) {
          setInvitationDoc({
            url: res.data.url,
            name: res.data.name,
            size: res.data.size,
          });
          toast.success(`Surat undangan "${res.data.name}" berhasil diunggah!`);

          // If AI extraction detected details
          if (res.data.extracted) {
            if (!title && res.data.extracted.title) setTitle(res.data.extracted.title);
            if (res.data.extracted.date && res.data.extracted.date >= todayStr) {
              setDate(res.data.extracted.date);
            }
            if (res.data.matchedUserIds && res.data.matchedUserIds.length > 0) {
              setSelectedUserIds((prev) => Array.from(new Set([...prev, ...res.data!.matchedUserIds!])));
            }
          }
        } else {
          toast.error(res.error || 'Gagal mengunggah surat undangan');
        }
      } else {
        const res = await uploadGenericMeetingFileAction(formData);
        if (res.success && res.data) {
          const fileData = {
            url: res.data.url,
            name: res.data.name,
            size: res.data.size,
          };
          if (type === 'kategori') {
            setCategoryDoc(fileData);
            toast.success(`Berkas kategori "${res.data.name}" berhasil diunggah!`);
          } else {
            setMaterialDoc(fileData);
            toast.success(`Dokumen paparan "${res.data.name}" berhasil diunggah!`);
          }
        } else {
          toast.error(res.error || 'Gagal mengunggah berkas');
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan saat mengunggah berkas');
    } finally {
      if (type === 'kategori') setIsUploadingCategoryDoc(false);
      if (type === 'undangan') setIsUploadingInvitationDoc(false);
      if (type === 'paparan') setIsUploadingMaterialDoc(false);
    }
  };

  // Filtered users for multi-select
  const filteredUsers = useMemo(() => {
    return availableUsers.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(participantSearch.toLowerCase()) ||
        (u.team?.name && u.team.name.toLowerCase().includes(participantSearch.toLowerCase())) ||
        (u.team?.code && u.team.code.toLowerCase().includes(participantSearch.toLowerCase()));
      const matchTeam =
        participantTeamFilter === 'ALL' ||
        (u.team?.code && u.team.code.toUpperCase() === participantTeamFilter.toUpperCase()) ||
        (participantTeamFilter === 'INV' && (u.team?.id === 'TIM-001' || u.team?.code === 'INV')) ||
        (participantTeamFilter === 'KS' && (u.team?.id === 'TIM-003' || u.team?.code === 'KS')) ||
        (participantTeamFilter === 'KOM' && (u.team?.id === 'TIM-002' || u.team?.code === 'KOM'));
      return matchSearch && matchTeam;
    });
  }, [availableUsers, participantSearch, participantTeamFilter]);

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Handle submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setErrorMessage(null);

    try {
      if (!title.trim()) {
        toast.error('Judul rapat wajib diisi.');
        setIsSubmitted(false);
        return;
      }

      if (date && date < todayStr) {
        toast.error('Tanggal pelaksanaan rapat tidak boleh sebelum hari ini.');
        setIsSubmitted(false);
        return;
      }

      if (kategoriRapat === 'SURAT_DITUNDA' && !postponeReason.trim()) {
        toast.error('Mohon cantumkan alasan penundaan untuk kategori Tunda Rapat.');
        setIsSubmitted(false);
        return;
      }

      // Determine final jenis rapat
      const finalJenisRapat =
        jenisRapat === 'Other' ? (customJenisRapat.trim() || 'Lainnya') : jenisRapat;

      // Determine final location
      const finalLocation =
        lokasiOption === 'Other'
          ? (customLocation.trim() || 'Lokasi Eksternal Lainnya')
          : lokasiOption;

      // Submit
      const res = await createMeetingAction({
        title: title.trim(),
        biroCode: 'IKK',
        primaryTeamId: selectedTeamId,
        date,
        startTime: '09:00',
        endTime: '12:00',
        location: finalLocation,
        meetingKind: finalJenisRapat,
        picName: picName.trim() || undefined,
        chairpersonId: picUserId || undefined,
        progressStatus: statusRapat,
        meetingNumber: registrationNumber.trim() || undefined,
        documentCategory: kategoriRapat,
        sourceOrigin: sourceOrigin.trim() || undefined,
        postponeReason: postponeReason.trim() || undefined,
        invitationDocUrl: invitationDoc?.url || undefined,
        invitationDocName: invitationDoc?.name || undefined,
        invitationDocSize: invitationDoc?.size || undefined,
        categoryDocUrl: categoryDoc?.url || undefined,
        categoryDocName: categoryDoc?.name || undefined,
        categoryDocSize: categoryDoc?.size || undefined,
        materialDocUrl: materialDoc?.url || undefined,
        materialDocName: materialDoc?.name || undefined,
        materialDocSize: materialDoc?.size || undefined,
        attendees: attendees.trim() || undefined,
        participantUserIds: selectedUserIds,
        previousMeetingId: previousMeetingId || undefined,
      });

      if (res.success && res.data) {
        if (pendingMinutes) {
          try {
            await saveMinutesAndActionsToMeetingAction(res.data.id, pendingMinutes);
          } catch (mErr) {
            console.warn('Auto-save minutes skipped:', mErr);
          }
        }

        toast.success(
          `Rapat "${title}" (${res.data.meetingNumber}) berhasil dijadwalkan dengan status ${statusRapat}!`
        );
        router.refresh();
        router.push(`/semua-rapat/${res.data.id}`);
      } else {
        setErrorMessage(res.error || 'Gagal menyimpan rapat');
        toast.error(res.error || 'Gagal menyimpan rapat');
        setIsSubmitted(false);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem saat membuat rapat');
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
          <span>Kembali ke Semua Rapat</span>
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="teal" dot>
            Formulir Standar Rapat KEK
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
              11 Poin Masukan Mentor Terintegrasi
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
              Formulir Penjadwalan &amp; Log Rapat KEK
            </h1>
            <p className="text-white/80 text-sm mt-1.5 leading-relaxed">
              Lengkapi data rapat koordinasi dengan penomoran registrasi per tim, pilihan kategori, multi-upload berkas, status progres, dan pemetaan peserta.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsUploadDialogOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-[#175360] hover:bg-[#F0F8FA] font-bold text-sm transition-all shadow-md shrink-0 cursor-pointer hover:scale-105 active:scale-95"
          >
            <UploadCloud className="w-4 h-4 text-[#1E6B7B]" />
            <span>Ekstrak Otomatis AI</span>
          </button>
        </div>
      </div>

      <UploadMeetingDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onApplyToForm={(extractedData, matchedIds) => {
          if (extractedData.title) setTitle(extractedData.title);
          if (extractedData.date && extractedData.date >= todayStr) setDate(extractedData.date);
          if (matchedIds && matchedIds.length > 0) setSelectedUserIds(matchedIds);
          if (extractedData.attendees) setAttendees(extractedData.attendees);
          setPendingMinutes(extractedData);
          toast.success('Informasi dari dokumen berhasil diterapkan ke formulir!');
        }}
      />

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3.5 text-red-700 text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Gagal Menyimpan Rapat</p>
              <p className="mt-0.5 text-red-600">{errorMessage}</p>
            </div>
          </div>
        )}


        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* BAGIAN I: REGISTRASI TIM, AGENDA & WAKTU PELAKSANAAN (Poin 1, 2, 3)       */}
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
                  Nomor registrasi tim kerja, judul agenda rapat koordinasi, dan tanggal pelaksanaan kegiatan
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
                  <span>Kode Nomor Registrasi Per Tim Dibuat Beda</span>
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
                {/* 3 Teams Selection List (matching the user's design) */}
                <div className="md:col-span-7 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Pilih Tim Kerja:
                  </label>
                  <div className="bg-white p-1.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
                    {TIM_OPTIONS.map((tim) => {
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
                  <p className="text-[11px] text-slate-500">
                    Pilih salah satu dari 3 tim untuk penomoran registrasi &amp; pengarsipan rapat.
                  </p>
                </div>

                {/* Final Registration Code Input (Auto + Editable) */}
                <div className="md:col-span-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Nomor Registrasi Rapat:
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
                      placeholder="Contoh: INV-001"
                      className="w-full px-3.5 h-[44px] rounded-xl border border-slate-300 bg-white text-slate-900 font-mono font-bold text-sm tracking-wide focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B] shadow-2xs"
                    />
                  </div>
                  <div className="p-3 bg-white/80 rounded-xl border border-[#BCE3EB] text-[11px] text-slate-600 space-y-1">
                    <div className="flex items-center justify-between font-semibold text-slate-700">
                      <span>Tim Aktif:</span>
                      <span className="text-[#1E6B7B] font-bold">
                        {TIM_OPTIONS.find((t) => t.id === selectedTeamId)?.name || 'Tim Investasi'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 font-mono">
                      <span>Format Otomatis:</span>
                      <span className="font-semibold text-slate-700">
                        {TIM_OPTIONS.find((t) => t.id === selectedTeamId)?.code || 'INV'}-001
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[11.5px] text-slate-500">
                💡 Kode nomor registrasi dibuat berbeda per tim (misal: <span className="font-mono font-semibold text-[#1E6B7B]">INV-001</span>, <span className="font-mono font-semibold text-[#1E6B7B]">KS-001</span>, atau <span className="font-mono font-semibold text-[#1E6B7B]">KOM-001</span>). Anda dapat mengedit teks ini langsung bila memiliki penomoran resmi khusus.
              </p>
            </div>

            {/* 2. Judul Rapat */}
            <div>
              <label className="font-bold text-slate-800 mb-2 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#1E6B7B] text-white text-xs flex items-center justify-center font-bold shadow-2xs">2</span>
                  <span>Judul Rapat</span>
                  <span className="text-red-500">*</span>
                </span>
                <span className="text-xs text-slate-400 font-normal">Wajib diisi</span>
              </label>
              <textarea
                required
                rows={3}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Rapat Koordinasi Fasilitasi Investasi Kawasan Ekonomi Khusus dan Percepatan Infrastruktur..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B] shadow-2xs transition-all leading-relaxed"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Tuliskan topik atau agenda rapat secara jelas sebagaimana tertera pada naskah undangan.
              </p>
            </div>

            {/* 3. Tanggal Rapat */}
            <div>
              <label className="font-bold text-slate-800 mb-2 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#1E6B7B] text-white text-xs flex items-center justify-center font-bold shadow-2xs">3</span>
                  <span>Tanggal Rapat</span>
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
                      toast.error('Tanggal pelaksanaan rapat tidak boleh mundur (sebelum hari ini).');
                      setDate(todayStr);
                    } else {
                      setDate(val);
                    }
                  }}
                  className="w-full px-4 h-[44px] rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B] shadow-2xs"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                Tanggal pelaksanaan pertemuan koordinasi (tidak dapat memilih tanggal sebelum hari ini).
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* BAGIAN II: KATEGORI & BERKAS DOKUMEN PENDUKUNG (Poin 4, 5, 6)             */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden border-t-4 border-t-[#F99D1C]">
          <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFF0DC] border border-[#FEDEBE] flex items-center justify-center text-[#C2410C]">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Bagian II: Kategori Naskah &amp; Berkas Lampiran
                </h2>
                <p className="text-xs text-slate-500">
                  Kategori dasar naskah, unggahan surat undangan resmi, dan berkas materi paparan
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
              Poin 4, 5, 6
            </span>
          </div>

          <div className="p-6 sm:p-7 space-y-6">
            {/* 4. Kategori Rapat (Dropdown Field yang Di-klik) */}
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3.5">
              <div className="flex items-center justify-between">
                <label htmlFor="kategori-rapat-select" className="font-bold text-slate-800 flex items-center gap-2 text-sm cursor-pointer">
                  <span className="w-6 h-6 rounded-full bg-[#1E6B7B] text-white text-xs flex items-center justify-center font-bold shadow-2xs">4</span>
                  <span>Kategori Rapat</span>
                  <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-slate-400">Pilih salah satu dasar naskah</span>
              </div>

              {/* Field Dropdown Kategori Rapat */}
              <div className="relative">
                <select
                  id="kategori-rapat-select"
                  value={kategoriRapat}
                  onChange={(e) => setKategoriRapat(e.target.value)}
                  className="w-full px-4 pr-10 h-[46px] rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/25 focus:border-[#1E6B7B] shadow-2xs cursor-pointer appearance-none transition-all hover:border-slate-400"
                >
                  <option value="UNDANGAN_INTERNAL">Undangan Internal — Rapat koordinasi internal KEK</option>
                  <option value="NASKAH_MASUK">Daftar Naskah Masuk — Disposisi Sekjen / Surat kementerian</option>
                  <option value="SURAT_DITUNDA">Tunda Rapat — Penjadwalan ulang / penundaan agenda</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Conditional Input per kategori */}
              {kategoriRapat === 'NASKAH_MASUK' && (
                <div className="mt-3 animate-in fade-in space-y-1.5 pt-2 border-t border-slate-200/80">
                  <label className="block text-xs font-semibold text-slate-700">
                    Asal Naskah Masuk / Instansi Pengirim:
                  </label>
                  <input
                    type="text"
                    value={sourceOrigin}
                    onChange={(e) => setSourceOrigin(e.target.value)}
                    placeholder="Contoh: Surat Menko Perekonomian No. S-114/EKON/2026..."
                    className="w-full px-3.5 h-[40px] rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B]"
                  />
                </div>
              )}

              {kategoriRapat === 'SURAT_DITUNDA' && (
                <div className="mt-3 animate-in fade-in space-y-1.5 pt-2 border-t border-rose-200/80">
                  <label className="block text-xs font-semibold text-rose-700">
                    Alasan / Keterangan Penundaan Rapat: <span className="text-red-500">*</span>
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

            {/* Grid 2 Kolom untuk Poin 5 (Surat Undangan) dan Poin 6 (Dokumen Terkait / Paparan) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 5. Surat Undangan (Bisa Upload File) */}
              <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                    <span className="w-6 h-6 rounded-full bg-[#1E6B7B] text-white text-xs flex items-center justify-center font-bold shadow-2xs">5</span>
                    <span>Surat Undangan</span>
                  </label>
                  <span className="text-[11px] text-slate-400">(Bisa Upload File)</span>
                </div>
                <p className="text-xs text-slate-500">
                  Lampiran naskah resmi surat undangan rapat (dapat dikosongkan).
                </p>

                {!invitationDoc ? (
                  <div
                    onClick={() => !isUploadingInvitationDoc && invitationFileInputRef.current?.click()}
                    className="border border-dashed border-slate-300 hover:border-[#1E6B7B] bg-white hover:bg-slate-50/50 rounded-xl p-4 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-1.5"
                  >
                    <input
                      ref={invitationFileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadFile(file, 'undangan');
                      }}
                    />
                    {isUploadingInvitationDoc ? (
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#1E6B7B]">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mengunggah berkas surat undangan...</span>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-5 h-5 text-[#1E6B7B]" />
                        <span className="text-xs font-semibold text-slate-700">
                          Klik untuk upload Surat Undangan
                        </span>
                        <span className="text-[11px] text-slate-400">PDF, Word (.docx), Gambar</span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-teal-200 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{invitationDoc.name}</p>
                        <p className="text-[10px] text-slate-400">{formatFileSize(invitationDoc.size)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={invitationDoc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 text-xs rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                      >
                        Lihat
                      </a>
                      <button
                        type="button"
                        onClick={() => setInvitationDoc(null)}
                        className="p-1 rounded text-rose-600 hover:bg-rose-50"
                        title="Hapus berkas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 6. Dokumen Terkait / Paparan Rapat (Bisa Upload File) */}
              <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                    <span className="w-6 h-6 rounded-full bg-[#1E6B7B] text-white text-xs flex items-center justify-center font-bold shadow-2xs">6</span>
                    <span>Dokumen Terkait / Paparan Rapat</span>
                  </label>
                  <span className="text-[11px] text-slate-400">(Bisa Upload File)</span>
                </div>
                <p className="text-xs text-slate-500">
                  Materi presentasi, paparan rapat, atau data lampiran teknis (dapat dikosongkan).
                </p>

                {!materialDoc ? (
                  <div
                    onClick={() => !isUploadingMaterialDoc && materialFileInputRef.current?.click()}
                    className="border border-dashed border-slate-300 hover:border-[#1E6B7B] bg-white hover:bg-slate-50/50 rounded-xl p-4 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-1.5"
                  >
                    <input
                      ref={materialFileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.pptx,.ppt,.docx,.xlsx,.txt,.png,.jpg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadFile(file, 'paparan');
                      }}
                    />
                    {isUploadingMaterialDoc ? (
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#1E6B7B]">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mengunggah dokumen paparan...</span>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-5 h-5 text-[#1E6B7B]" />
                        <span className="text-xs font-semibold text-slate-700">
                          Klik untuk upload Paparan / Bahan Rapat
                        </span>
                        <span className="text-[11px] text-slate-400">PDF, PPTX, Word, Excel, Gambar</span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-teal-200 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{materialDoc.name}</p>
                        <p className="text-[10px] text-slate-400">{formatFileSize(materialDoc.size)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={materialDoc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 text-xs rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                      >
                        Lihat
                      </a>
                      <button
                        type="button"
                        onClick={() => setMaterialDoc(null)}
                        className="p-1 rounded text-rose-600 hover:bg-rose-50"
                        title="Hapus berkas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* BAGIAN III: PARAMETER PELAKSANAAN & PESERTA (Poin 7, 8, 9, 10)            */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden border-t-4 border-t-[#31889C]">
          <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F0F9FA] border border-[#BCE3EB] flex items-center justify-center text-[#1E6B7B]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Bagian III: Klasifikasi Rapat, PIC, Undangan &amp; Ruangan
                </h2>
                <p className="text-xs text-slate-500">
                  Jenis bentuk rapat, PIC teknis, daftar peserta yang diundang, dan lokasi ruangan
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
              Poin 7, 8, 9, 10
            </span>
          </div>

          <div className="p-6 sm:p-7 space-y-6">
            {/* 7. Jenis Rapat (Dropdown + Other) */}
            <div>
              <label className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-full bg-[#1E6B7B] text-white text-xs flex items-center justify-center font-bold shadow-2xs">7</span>
                <span>Jenis Rapat</span>
                <span className="text-red-500">*</span>
              </label>
              <select
                value={jenisRapat}
                onChange={(e) => setJenisRapat(e.target.value)}
                className="w-full px-4 h-[44px] rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B] shadow-2xs cursor-pointer"
              >
                {JENIS_RAPAT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === 'Other' ? 'Other (Kategori Lainnya...)' : opt}
                  </option>
                ))}
              </select>

              {jenisRapat === 'Other' && (
                <div className="mt-2.5 animate-in fade-in">
                  <input
                    type="text"
                    required
                    value={customJenisRapat}
                    onChange={(e) => setCustomJenisRapat(e.target.value)}
                    placeholder="Ketikkan jenis rapat lainnya di sini..."
                    className="w-full px-4 h-[40px] rounded-xl border border-[#1E6B7B] bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20"
                  />
                </div>
              )}
              <p className="text-xs text-slate-400 mt-1.5">
                Pilih bentuk atau format penyelenggaraan kegiatan.
              </p>
            </div>

            {/* 8. PIC Rapat */}
            <div className="pt-2 border-t border-slate-100">
              <label className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-full bg-[#1E6B7B] text-white text-xs flex items-center justify-center font-bold shadow-2xs">8</span>
                <span>PIC Rapat</span>
                <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dropdown Staf/Pengguna Terdaftar */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pilih dari Staf / Pengguna Terdaftar:
                  </label>
                  <select
                    value={picUserId}
                    onChange={(e) => handleSelectPicUser(e.target.value)}
                    className="w-full px-4 h-[44px] rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B] shadow-2xs cursor-pointer"
                  >
                    <option value="">-- Pilih Staf Penanggung Jawab --</option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} {u.team?.name ? `[Tim ${u.team.name}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Input Teks Nama / Kontak PIC */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama / Keterangan PIC:
                  </label>
                  <input
                    type="text"
                    required
                    value={picName}
                    onChange={(e) => setPicName(e.target.value)}
                    placeholder="Contoh: Maya Puspita, S.Sos / PIC Tim Investasi..."
                    className="w-full px-4 h-[44px] rounded-xl border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 shadow-2xs"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                Staf atau pejabat penanggung jawab teknis jalannya rapat koordinasi.
              </p>
            </div>

            {/* 9. Undangan Rapat (Peserta Rapat Yang Di Undang) */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 rounded-full bg-[#1E6B7B] text-white text-xs flex items-center justify-center font-bold shadow-2xs">9</span>
                  <span>Undangan Rapat (Peserta Rapat yang Diundang)</span>
                </label>
                <Badge variant="teal" dot className="text-xs">
                  {selectedUserIds.length} Staf Internal Dipilih
                </Badge>
              </div>

              {/* Sub A: Multi-Select Staf Internal */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-3">
                <p className="text-xs font-bold text-slate-700">
                  A. Staf &amp; Pejabat Internal KEK yang Diundang:
                </p>

                {/* Search & Filter Tim */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={participantSearch}
                      onChange={(e) => setParticipantSearch(e.target.value)}
                      placeholder="Cari nama staf atau tim..."
                      className="w-full pl-9 pr-3 h-[36px] rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20"
                    />
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto text-xs font-semibold">
                    {[
                      { key: 'ALL', label: 'Semua' },
                      { key: 'INV', label: 'Tim Investasi' },
                      { key: 'KS', label: 'Tim Kerja Sama' },
                      { key: 'KOM', label: 'Tim Komunikasi' },
                    ].map((tab) => {
                      const isActive = participantTeamFilter === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setParticipantTeamFilter(tab.key)}
                          className={cn(
                            'px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 text-xs',
                            isActive
                              ? 'bg-[#1E6B7B] text-white shadow-2xs font-bold'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          )}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Chips Grid */}
                <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto p-1">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-4 w-full text-xs text-slate-400">
                      Tidak ada staf yang cocok dengan pencarian / tim yang dipilih
                    </div>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelected = selectedUserIds.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => toggleUserSelection(u.id)}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 cursor-pointer border',
                            isSelected
                              ? 'bg-[#1E6B7B] text-white border-[#1E6B7B] shadow-2xs font-semibold'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          )}
                        >
                          <span
                            className={cn(
                              'w-3 h-3 rounded flex items-center justify-center border',
                              isSelected ? 'border-white bg-white/20' : 'border-slate-300'
                            )}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                          </span>
                          <span>{u.name}</span>
                          {u.team?.name && (
                            <span
                              className={cn(
                                'text-[10px] px-1.5 py-0.5 rounded font-bold',
                                isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                              )}
                            >
                              Tim {u.team.name}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Sub B: Peserta Eksternal / Instansi Terkait */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  B. Peserta Rapat Eksternal &amp; Lembaga Terkait yang Diundang:
                </label>
                <textarea
                  rows={2}
                  value={attendees}
                  onChange={(e) => setAttendees(e.target.value)}
                  placeholder="Contoh: Kementerian Koordinator Bidang Perekonomian, Direksi PT KEK Kendal, Pemprov Jawa Tengah, Dinas Penanaman Modal..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B] shadow-2xs leading-relaxed"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Tuliskan nama instansi, kementerian, atau tamu eksternal yang diundang.
                </p>
              </div>
            </div>

            {/* 10. Lokasi Kegiatan (Dropdown + Other) */}
            <div className="pt-2 border-t border-slate-100">
              <label className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-full bg-[#1E6B7B] text-white text-xs flex items-center justify-center font-bold shadow-2xs">10</span>
                <span>Lokasi Kegiatan</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <select
                    value={lokasiOption}
                    onChange={(e) => setLokasiOption(e.target.value)}
                    className="w-full px-4 h-[44px] rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B] shadow-2xs cursor-pointer"
                  >
                    {LOKASI_OPTIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc === 'Other'
                          ? 'Other (Berada di tempat lain)'
                          : loc === 'Administrator'
                          ? 'Administrator'
                          : `Ruang ${loc}`}
                      </option>
                    ))}
                  </select>
                </div>

                {lokasiOption === 'Other' ? (
                  <div>
                    <input
                      type="text"
                      required
                      value={customLocation}
                      onChange={(e) => setCustomLocation(e.target.value)}
                      placeholder="Masukkan nama ruangan / lokasi di luar gedung..."
                      className="w-full px-4 h-[44px] rounded-xl border border-[#1E6B7B] bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 shadow-2xs"
                    />
                  </div>
                ) : (
                  <div className="px-4 h-[44px] rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#1E6B7B]" />
                    <span>Ruang / Lokasi KEK: <strong>{lokasiOption === 'Administrator' ? 'Administrator' : `Ruang ${lokasiOption}`}</strong></span>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                Pilih salah satu dari 5 ruangan/lokasi resmi (Graha Satwika, Loka Jagatsaksana, Lokasandhi, Antawacana, Administrator) atau pilih Other untuk lokasi luar.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BAGIAN IV: STATUS PELAKSANAAN RAPAT (Poin 11)                             */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden border-t-4 border-t-[#2E7D32]">
          <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#ECF8E9] border border-[#D2EFCA] flex items-center justify-center text-[#15803D]">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Bagian IV: Status Pelaksanaan Rapat
                </h2>
                <p className="text-xs text-slate-500">
                  Penetapan status pelaksanaan rapat koordinasi (Start, On Progres, Finish)
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
              Poin 11
            </span>
          </div>

          <div className="p-6 sm:p-7 space-y-6">
            {/* 11. Status (Start, On Progres, Finish) */}
            <div>
              <label className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-full bg-[#1E6B7B] text-white text-xs flex items-center justify-center font-bold shadow-2xs">11</span>
                <span>Status Rapat</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {STATUS_OPTIONS.map((st) => {
                  const isSelected = statusRapat === st.value;
                  return (
                    <button
                      key={st.value}
                      type="button"
                      onClick={() => setStatusRapat(st.value)}
                      className={cn(
                        'p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between',
                        isSelected
                          ? 'border-[#1E6B7B] bg-[#F0F8FA] ring-2 ring-[#1E6B7B]/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            'w-3.5 h-3.5 rounded-full flex items-center justify-center border',
                            isSelected ? 'border-[#1E6B7B] bg-[#1E6B7B]' : 'border-slate-300 bg-white'
                          )}
                        >
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                        <div>
                          <span className="font-bold text-sm text-slate-800 block">
                            {st.label}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {st.value === 'Start' && 'Rapat baru dijadwalkan'}
                            {st.value === 'On Progres' && 'Dalam pelaksanaan / review'}
                            {st.value === 'Finish' && 'Selesai & disahkan'}
                          </span>
                        </div>
                      </div>
                      <span className={cn('px-2 py-0.5 rounded text-[11px] font-bold border', st.color)}>
                        {st.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional: Tautkan Rapat Sebelumnya */}
            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2">
              <label className="font-semibold text-slate-800 flex items-center gap-2 text-xs">
                <Link2 className="w-4 h-4 text-[#1E6B7B]" />
                <span>Tautkan Rapat Lanjutan / Rangkaian Terdahulu (Opsional):</span>
              </label>
              <PreviousMeetingSelector
                value={previousMeetingId}
                onChange={setPreviousMeetingId}
                availableMeetings={availableMeetings}
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SUBMIT BUTTON BAR                                                         */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky bottom-4 z-20 backdrop-blur-md bg-white/95">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-slate-800">
                Semua 11 Poin Data Siap Disimpan
              </p>
              <p className="text-[11px] text-slate-500">
                Nomor: <span className="font-mono font-semibold text-[#1E6B7B]">{registrationNumber || 'Otomatis'}</span> • Status: <span className="font-semibold text-slate-700">{statusRapat}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <Link
              href="/semua-rapat"
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-sm transition-colors cursor-pointer"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={isSubmitted}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#175360] to-[#1E6B7B] hover:from-[#13424d] hover:to-[#175360] text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitted ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Rapat...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Jadwalkan &amp; Simpan Rapat</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
