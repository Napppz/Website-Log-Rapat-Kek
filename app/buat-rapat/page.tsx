'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  Plus,
  ArrowLeft,
  Shield,
  Users,
  CheckCircle,
  ShieldAlert,
  Loader2,
  AlertCircle,
  LogIn,
  Check,
  UserCheck,
  Link2,
  FileText,
  UploadCloud,
  Sparkles,
  Layers,
  Search,
  User,
  Filter,
  Paperclip,
  ExternalLink,
  Trash2,
  FileCheck,
  FileSpreadsheet,
  Upload,
} from 'lucide-react';
import { BIRO_LIST } from '@/lib/mock-data';
import { BiroCode } from '@/lib/types';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  getActiveUsersAction,
  createMeetingAction,
  getMeetingOptionsAction,
  getBiroTeamsAction,
} from '@/app/actions/meeting-actions';
import {
  saveMinutesAndActionsToMeetingAction,
  uploadInvitationFileAction,
} from '@/app/actions/meeting-upload-actions';
import { UploadMeetingDialog } from '@/components/meeting/upload-meeting-dialog';
import { ExtractedMeetingData } from '@/lib/meeting-extractor';
import { toast } from '@/components/providers/toast-provider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
}

export default function BuatRapatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const userRole = session?.user?.role || 'STAFF';
  const isPrivileged = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
  const userBiroCode = !isPrivileged && session?.user?.biroCode ? (session.user.biroCode as BiroCode) : undefined;
  const canCreate =
    userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [pendingMinutes, setPendingMinutes] = useState<ExtractedMeetingData | null>(null);

  // Invitation Document Upload States
  const [invitationDoc, setInvitationDoc] = useState<{
    url: string;
    name: string;
    size: number;
    extracted?: ExtractedMeetingData;
    matchedUserIds?: string[];
  } | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isDraggingDoc, setIsDraggingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Today's date in YYYY-MM-DD format (prevents past date selection)
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const [selectedBiro, setSelectedBiro] = useState<BiroCode>(userBiroCode || 'IKK');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState('09:00 - 12:00 WIB');
  const [location, setLocation] = useState(
    'Ruang Rapat Utama Gedung Posko KEK & Hybrid Zoom'
  );
  const [classification, setClassification] = useState('STRATEGIS');
  const [attendees, setAttendees] = useState(
    'Dr. Hendra Suprayitno, Maya Puspita, S.Sos, Tim Sekretariat Jenderal'
  );
  const [customMeetingNumber, setCustomMeetingNumber] = useState('');
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [availableMeetings, setAvailableMeetings] = useState<any[]>([]);
  const [availableTeams, setAvailableTeams] = useState<Array<{ id: string; code: string; name: string; description?: string | null }>>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [previousMeetingId, setPreviousMeetingId] = useState<string>('');
  const [chairpersonId, setChairpersonId] = useState<string>('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [participantSearch, setParticipantSearch] = useState('');
  const [participantBiroFilter, setParticipantBiroFilter] = useState<string>('ALL');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check query params to auto-open upload dialog if ?upload=true
  useEffect(() => {
    if (searchParams.get('upload') === 'true') {
      setIsUploadDialogOpen(true);
    }
    const prevId = searchParams.get('previousMeetingId');
    const paramTitle = searchParams.get('title');
    const paramBiro = searchParams.get('biro');

    if (prevId) {
      setPreviousMeetingId(prevId);
    }
    if (paramTitle) {
      setTitle(paramTitle);
    }
    if (userBiroCode) {
      setSelectedBiro(userBiroCode);
    } else if (paramBiro && ['BPPK', 'PKKEK', 'IKK', 'HSDMO', 'UK'].includes(paramBiro.toUpperCase())) {
      setSelectedBiro(paramBiro.toUpperCase() as BiroCode);
    }
  }, [searchParams, userBiroCode]);

  // Handle data applied from uploaded meeting document
  const handleApplyExtractedData = (
    extractedData: ExtractedMeetingData,
    matchedUserIds: string[]
  ) => {
    setTitle(extractedData.title);
    if (extractedData.biroCode && !userBiroCode) {
      setSelectedBiro(extractedData.biroCode as BiroCode);
    }
    if (extractedData.date) {
      if (extractedData.date < todayStr) {
        toast.warning(
          `Tanggal pada berkas undangan (${extractedData.date}) sudah lewat. Tanggal pelaksanaan disesuaikan ke hari ini.`
        );
        setDate(todayStr);
      } else {
        setDate(extractedData.date);
      }
    }
    setTime(`${extractedData.startTime} - ${extractedData.endTime} WIB`);
    setLocation(extractedData.location);
    if (extractedData.classification) {
      setClassification(extractedData.classification);
    }
    setAttendees(extractedData.attendees);
    if (extractedData.meetingNumber) {
      setCustomMeetingNumber(extractedData.meetingNumber);
    }
    if (matchedUserIds && matchedUserIds.length > 0) {
      setSelectedUserIds(matchedUserIds);
    }

    setPendingMinutes(extractedData);
  };

  // Fetch available users and existing meetings on mount
  useEffect(() => {
    getActiveUsersAction()
      .then((res) => {
        if (res.success && res.data) {
          setAvailableUsers(res.data);
          const initialLower = 'dr. hendra suprayitno, maya puspita, s.sos'.toLowerCase();
          const matchedIds = res.data
            .filter((u) => initialLower.includes(u.name.toLowerCase()))
            .map((u) => u.id);
          setSelectedUserIds(matchedIds);
        }
      })
      .catch((err) => console.warn('Could not load users for meeting:', err));

    getMeetingOptionsAction()
      .then((res) => {
        if (res.success && res.data) {
          setAvailableMeetings(res.data);
        }
      })
      .catch((err) => console.warn('Could not load meetings:', err));
  }, []);

  // Fetch teams whenever selected biro changes
  useEffect(() => {
    getBiroTeamsAction(selectedBiro)
      .then((res) => {
        if (res.success && res.data) {
          setAvailableTeams(res.data);
          setSelectedTeamId('');
        } else {
          setAvailableTeams([]);
          setSelectedTeamId('');
        }
      })
      .catch(() => {
        setAvailableTeams([]);
        setSelectedTeamId('');
      });
  }, [selectedBiro]);

  // Filtered available users for participant selector
  const filteredUsers = useMemo(() => {
    return availableUsers.filter((user) => {
      const matchesSearch =
        !participantSearch.trim() ||
        user.name.toLowerCase().includes(participantSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(participantSearch.toLowerCase()) ||
        (user.biro?.code && user.biro.code.toLowerCase().includes(participantSearch.toLowerCase()));

      const matchesBiro =
        participantBiroFilter === 'ALL' || user.biro?.code === participantBiroFilter;

      return matchesSearch && matchesBiro;
    });
  }, [availableUsers, participantSearch, participantBiroFilter]);

  // Loading session state
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#1E6B7B]" />
        <p className="text-sm text-slate-500 font-medium">Memeriksa hak akses...</p>
      </div>
    );
  }

  // Unauthenticated user
  if (status === 'unauthenticated' || !session) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#F0F8FA] text-[#1E6B7B] flex items-center justify-center mx-auto">
          <LogIn className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Autentikasi Diperlukan</h2>
        <p className="text-sm text-slate-500">
          Anda harus masuk ke sistem terlebih dahulu untuk menjadwalkan rapat baru.
        </p>
        <Link
          href="/login?callbackUrl=/buat-rapat"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E6B7B] hover:bg-[#175360] text-white font-semibold text-sm transition-all shadow-xs"
        >
          <LogIn className="w-4 h-4" />
          <span>Masuk ke Akun Anda</span>
        </Link>
      </div>
    );
  }

  // Unauthorized role (STAFF)
  if (!canCreate) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Izin Tidak Mencukupi</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Peran akun Anda saat ini (<strong>{userRole}</strong>) tidak memiliki akses untuk membuat rapat baru.
          Hanya peran <strong>SUPER_ADMIN</strong> atau <strong>ADMIN</strong> yang dapat menjadwalkan rapat baru.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#1E6B7B] hover:bg-[#175360] text-white font-semibold text-sm transition-all shadow-xs"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  // Toggle user participant
  const handleToggleUser = (user: AvailableUser) => {
    const isSelected = selectedUserIds.includes(user.id);
    let nextIds: string[];
    let currentNames = attendees
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (isSelected) {
      nextIds = selectedUserIds.filter((id) => id !== user.id);
      currentNames = currentNames.filter(
        (n) => n.toLowerCase() !== user.name.toLowerCase()
      );
    } else {
      nextIds = [...selectedUserIds, user.id];
      if (!currentNames.some((n) => n.toLowerCase() === user.name.toLowerCase())) {
        currentNames.push(user.name);
      }
    }

    setSelectedUserIds(nextIds);
    setAttendees(currentNames.join(', '));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileUpload = async (file: File) => {
    const validExtensions = ['pdf', 'docx', 'doc', 'png', 'jpg', 'jpeg', 'txt'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!validExtensions.includes(ext)) {
      toast.error('Format berkas tidak didukung. Mohon unggah PDF, Word (.docx), Teks (.txt), atau Gambar (.png/.jpg).');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error('Ukuran berkas melebihi batas maksimum 25MB.');
      return;
    }

    setIsUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadInvitationFileAction(formData);

      if (res.success && res.data) {
        setInvitationDoc(res.data);
        toast.success(`Dokumen undangan "${res.data.name}" berhasil diunggah.`);

        // Auto-fill customMeetingNumber if empty and extracted
        if (res.data.extracted?.meetingNumber && !customMeetingNumber) {
          setCustomMeetingNumber(res.data.extracted.meetingNumber);
        }
      } else {
        toast.error(res.error || 'Gagal mengunggah dokumen undangan');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan sistem saat mengunggah dokumen');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleApplyFromInvitation = () => {
    if (!invitationDoc?.extracted) return;
    const ext = invitationDoc.extracted;
    if (ext.title) setTitle(ext.title);
    if (ext.meetingNumber) setCustomMeetingNumber(ext.meetingNumber);
    if (ext.date) setDate(ext.date);
    if (ext.startTime && ext.endTime) setTime(`${ext.startTime} - ${ext.endTime} WIB`);
    if (ext.location) setLocation(ext.location);
    if (ext.classification) setClassification(ext.classification);
    if (ext.attendees) setAttendees(ext.attendees);
    if (invitationDoc.matchedUserIds && invitationDoc.matchedUserIds.length > 0) {
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...invitationDoc.matchedUserIds!])));
    }
    toast.success('Agenda, nomor surat, tanggal, lokasi & peserta berhasil disesuaikan dari surat undangan!');
  };

  const handleRemoveInvitationDoc = () => {
    setInvitationDoc(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.info('Lampiran dokumen undangan dibatalkan.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setErrorMessage(null);

    try {
      if (date && date < todayStr) {
        toast.error('Tanggal pelaksanaan rapat tidak boleh sebelum hari ini (tidak bisa mundur).');
        setIsSubmitted(false);
        return;
      }

      const parts = time.split('-').map((s) => s.trim().replace('WIB', '').trim());
      const startTime = parts[0] || '09:00';
      const endTime = parts[1] || '12:00';

      const trimmedCustomNumber = customMeetingNumber.trim();
      const validMeetingNumber =
        trimmedCustomNumber && trimmedCustomNumber !== '-' && trimmedCustomNumber !== '—'
          ? trimmedCustomNumber
          : undefined;

      const res = await createMeetingAction({
        title,
        biroCode: selectedBiro,
        primaryTeamId: selectedTeamId || undefined,
        date,
        startTime,
        endTime,
        location,
        attendees,
        participantUserIds: selectedUserIds,
        previousMeetingId: previousMeetingId || undefined,
        chairpersonId: chairpersonId || undefined,
        meetingNumber: validMeetingNumber,
        invitationDocUrl: invitationDoc?.url || undefined,
        invitationDocName: invitationDoc?.name || undefined,
        invitationDocSize: invitationDoc?.size || undefined,
      });

      if (res.success && res.data) {
        if (pendingMinutes) {
          try {
            await saveMinutesAndActionsToMeetingAction(res.data.id, pendingMinutes);
          } catch (mErr) {
            console.warn('Could not auto-save minutes to meeting:', mErr);
          }
        }

        toast.success(
          `Rapat "${title}" (${res.data.meetingNumber}) berhasil dijadwalkan dengan ${res.data.participantCount || 0} peserta terdaftar!`
        );
        router.refresh();
        router.push(`/semua-rapat/${res.data.id}?calendar=true`);
      } else {
        setErrorMessage(res.error || 'Gagal membuat rapat');
        toast.error(res.error || 'Gagal membuat rapat');
        setIsSubmitted(false);
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Terjadi kesalahan sistem saat membuat rapat'
      );
      setIsSubmitted(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 pb-12">
      {/* Top Navigation */}
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
            Birokrasi Resmi KEK RI
          </Badge>
        </div>
      </div>

      {/* Quick Upload Action Card */}
      <div className="bg-gradient-to-r from-[#175360] via-[#1E6B7B] to-[#266F80] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5 border border-white/10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[11px] font-extrabold uppercase tracking-wider shadow-2xs">
                ⚡ Ekstraksi Otomatis AI
              </span>
              {pendingMinutes && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[11px] font-bold shadow-2xs">
                  ✓ Berkas Dokumen Terpasang
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
              Punya Berkas Hasil Rapat Offline atau Format Undangan?
            </h3>
            <p className="text-white/80 text-sm mt-1 max-w-2xl leading-relaxed">
              Unggah berkas Word (.docx), PDF (.pdf), atau Teks (.txt). Sistem akan otomatis mengekstrak judul, tanggal, lokasi, serta butir naskah notula ke formulir ini.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsUploadDialogOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-[#175360] hover:bg-[#F0F8FA] font-bold text-sm transition-all shadow-md shrink-0 cursor-pointer hover:scale-105 active:scale-95"
        >
          <UploadCloud className="w-4 h-4 text-[#1E6B7B]" />
          <span>Unggah Berkas Rapat</span>
        </button>
      </div>

      <UploadMeetingDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onApplyToForm={handleApplyExtractedData}
      />

      {/* Main Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3.5 text-red-700 text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Gagal Menyimpan Rapat</p>
              <p className="mt-0.5 text-red-600">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 1: Identitas & Informasi Pokok Rapat              */}
        {/* ======================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden border-t-[4px] border-t-[#1E6B7B]">
          {/* Section Header */}
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F0F8FA] border border-[#BCE3EB] flex items-center justify-center text-[#1E6B7B]">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  1. Identitas &amp; Pengorganisasian Rapat
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tentukan biro penyelenggara, tim kerja, dan sifat prioritas pertemuan
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-400">Bagian 1 dari 3</span>
          </div>

          <div className="p-6 sm:p-7 space-y-6">
            {/* Grid 2 Kolom Lega untuk Dropdowns Pokok */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {/* Biro Penyelenggara */}
              <div>
                <label className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5 text-sm">
                  <span>Biro Penyelenggara Utama</span>
                  <span className="text-red-500 font-bold">*</span>
                </label>
                {userBiroCode ? (
                  <div className="w-full px-4 h-[44px] rounded-xl border border-[#BCE3EB] bg-[#F0F8FA] text-[#174853] font-semibold text-sm flex items-center justify-between shadow-2xs">
                    <span>Biro {userBiroCode}</span>
                    <span className="text-xs text-slate-500 font-normal">(Terkunci sesuai akun)</span>
                  </div>
                ) : (
                  <select
                    value={selectedBiro}
                    onChange={(e) => setSelectedBiro(e.target.value as BiroCode)}
                    className="w-full px-4 h-[44px] rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B] shadow-2xs transition-all cursor-pointer"
                  >
                    {BIRO_LIST.map((biro) => (
                      <option key={biro.code} value={biro.code}>
                        {biro.code} — {biro.name}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-slate-400 mt-1.5">
                  Biro yang bertanggung jawab atas penyelenggaraan dan penyusunan risalah notula.
                </p>
              </div>

              {/* Tim Kerja Biro */}
              <div>
                <label className="font-semibold text-slate-800 mb-2 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5">
                    <span>Sub-Tim Kerja</span>
                    <span className="text-slate-400 font-normal text-xs">(Opsional)</span>
                  </span>
                  {availableTeams.length > 0 && (
                    <span className="text-xs font-bold text-[#174853] bg-[#F0F8FA] px-2 py-0.5 rounded-md border border-[#BCE3EB]">
                      {availableTeams.length} Tim Tersedia
                    </span>
                  )}
                </label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full px-4 h-[44px] rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B] shadow-2xs transition-all cursor-pointer"
                >
                  <option value="">
                    {availableTeams.length > 0
                      ? '-- Bebas / Tingkat Biro Utama --'
                      : '-- Belum ada sub-tim terdaftar --'}
                  </option>
                  {availableTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.code}] Tim {t.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1.5">
                  Pilih sub-tim kerja jika rapat merupakan lingkup kerja spesifik di dalam biro.
                </p>
              </div>

              {/* Sifat Pertemuan */}
              <div>
                <label className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5 text-sm">
                  <Shield className="w-4 h-4 text-[#1E6B7B]" />
                  <span>Sifat / Klasifikasi Rapat</span>
                  <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  value={classification}
                  onChange={(e) => setClassification(e.target.value)}
                  className="w-full px-4 h-[44px] rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B] shadow-2xs transition-all cursor-pointer"
                >
                  <option value="STRATEGIS">Prioritas Strategis Nasional</option>
                  <option value="REGULER">Koordinasi Berkala (Reguler)</option>
                  <option value="DARURAT">Eskalasi Mendesak / Khusus</option>
                </select>
                <p className="text-xs text-slate-400 mt-1.5">
                  Menentukan tingkat urgensi penanganan butir tindak lanjut keputusan.
                </p>
              </div>

              {/* Ketua / Pimpinan Sidang */}
              <div>
                <label className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5 text-sm">
                  <UserCheck className="w-4 h-4 text-[#1E6B7B]" />
                  <span>Ketua / Pimpinan Sidang</span>
                </label>
                <select
                  value={chairpersonId}
                  onChange={(e) => setChairpersonId(e.target.value)}
                  className="w-full px-4 h-[44px] rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B] shadow-2xs transition-all cursor-pointer"
                >
                  <option value="">-- Bebas / Ditetapkan dalam Notula --</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} {u.biro?.code ? `[${u.biro.code}]` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1.5">
                  Pejabat yang memimpin jalannya rapat koordinasi.
                </p>
              </div>
            </div>

            {/* Agenda & Topik Pembahasan (Full Width) */}
            <div>
              <label className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5 text-sm">
                <span>Agenda &amp; Topik Pembahasan Rapat</span>
                <span className="text-red-500 font-bold">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Rapat Koordinasi Fasilitasi Investasi Lintas Sektor dan Percepatan Pembangunan Infrastruktur Kawasan Industri KEK..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B] shadow-2xs transition-all leading-relaxed"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Tuliskan judul atau agenda rapat secara jelas dan lengkap sebagaimana tercantum pada surat undangan.
              </p>
            </div>

            {/* Panel Rujukan & Surat Undangan (Grid 2 Kolom) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              {/* Nomor Surat Undangan */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                <label className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-[#1E6B7B]" />
                  <span>Nomor Surat Undangan</span>
                  <span className="text-slate-400 font-normal text-xs">(Opsional)</span>
                </label>
                <input
                  type="text"
                  value={customMeetingNumber}
                  onChange={(e) => setCustomMeetingNumber(e.target.value)}
                  placeholder="Contoh: UND-014/SET.KEK/IX/2026 atau '-'"
                  className="w-full px-3.5 h-[40px] rounded-lg border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B]"
                />
                <p className="text-[11.5px] text-slate-500 leading-normal">
                  Kosongkan jika rapat internal tanpa nomor surat undangan resmi.
                </p>
              </div>

              {/* Tautkan Rapat Sebelumnya */}
              <div className="p-4 bg-[#F0F8FA]/70 rounded-xl border border-[#BCE3EB]/80 space-y-2">
                <label className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                  <Link2 className="w-4 h-4 text-[#1E6B7B]" />
                  <span>Tautkan Rapat Lanjutan</span>
                  <span className="text-slate-400 font-normal text-xs">(Opsional)</span>
                </label>
                <select
                  value={previousMeetingId}
                  onChange={(e) => setPreviousMeetingId(e.target.value)}
                  className="w-full px-3.5 h-[40px] rounded-lg border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B] cursor-pointer"
                >
                  <option value="">-- Bukan Rapat Lanjutan (Rapat Mandiri) --</option>
                  {availableMeetings.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.meetingNumber}] {m.title.slice(0, 50)}...
                    </option>
                  ))}
                </select>
                <p className="text-[11.5px] text-slate-500 leading-normal">
                  Hubungkan jika rapat ini melanjutkan butir tindak lanjut sesi terdahulu.
                </p>
              </div>
            </div>

            {/* Dokumen Surat Undangan Resmi Upload Section */}
            <div className="p-5 rounded-2xl border border-teal-100 bg-gradient-to-br from-[#F0F8FA]/80 via-white to-slate-50/70 shadow-2xs space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#1E6B7B]/10 flex items-center justify-center text-[#1E6B7B]">
                    <Paperclip className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span>Dokumen Undangan Rapat Resmi</span>
                      <span className="text-slate-400 font-normal text-xs">(Opsional)</span>
                    </h3>
                    <p className="text-[11.5px] text-slate-500">
                      Lampirkan berkas fisik/digital surat undangan untuk diakses oleh peserta &amp; pimpinan
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full self-start sm:self-auto">
                  PDF, DOCX, JPG, PNG (Maks 25MB)
                </span>
              </div>

              {/* Upload Dropzone / State */}
              {!invitationDoc ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingDoc(true);
                  }}
                  onDragLeave={() => setIsDraggingDoc(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingDoc(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  onClick={() => !isUploadingDoc && fileInputRef.current?.click()}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5',
                    isDraggingDoc
                      ? 'border-[#1E6B7B] bg-[#F0F8FA] scale-[1.01]'
                      : 'border-slate-300 hover:border-[#1E6B7B] hover:bg-slate-50/80 bg-white'
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />

                  {isUploadingDoc ? (
                    <div className="py-2 flex flex-col items-center gap-2">
                      <Loader2 className="w-7 h-7 text-[#1E6B7B] animate-spin" />
                      <p className="text-xs font-bold text-slate-700">
                        Mengunggah &amp; menganalisis isi dokumen undangan...
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Sistem sedang membaca format dan memeriksa identitas rapat
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="w-11 h-11 rounded-full bg-[#F0F8FA] flex items-center justify-center text-[#1E6B7B] shadow-2xs">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          Klik untuk memilih berkas atau seret berkas ke area ini
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Format berkas didukung: Surat format PDF (.pdf), Word (.docx), atau Pindaian Foto (.jpg/.png)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3 animate-in fade-in">
                  {/* File Attached Card */}
                  <div className="p-4 rounded-xl bg-white border border-teal-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-slate-900 truncate max-w-[280px] sm:max-w-md">
                            {invitationDoc.name}
                          </p>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            ✓ Terlampir
                          </span>
                        </div>
                        <p className="text-[11.5px] text-slate-500 mt-0.5">
                          Ukuran: {formatFileSize(invitationDoc.size)} • Siap disimpan bersama data rapat
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      <a
                        href={invitationDoc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                        title="Buka dokumen di tab baru"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#1E6B7B]" />
                        <span>Pratinjau</span>
                      </a>
                      <button
                        type="button"
                        onClick={handleRemoveInvitationDoc}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                        title="Hapus lampiran dokumen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>

                  {/* AI Extraction Banner if content parsed */}
                  {invitationDoc.extracted && (
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-bold text-slate-900">
                            Informasi Rapat Terdeteksi dari Dokumen Undangan
                          </p>
                          <p className="text-[11.5px] text-slate-600 mt-0.5 leading-relaxed">
                            {invitationDoc.extracted.title ? `Agenda: "${invitationDoc.extracted.title.slice(0, 60)}..." • ` : ''}
                            {invitationDoc.extracted.date ? `Tanggal: ${invitationDoc.extracted.date} • ` : ''}
                            {invitationDoc.matchedUserIds && invitationDoc.matchedUserIds.length > 0
                              ? `${invitationDoc.matchedUserIds.length} Pejabat KEK Terdeteksi`
                              : 'Siap diterapkan ke form'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyFromInvitation}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1E6B7B] hover:bg-[#175360] text-white font-bold text-xs shadow-xs transition-all shrink-0 cursor-pointer self-start sm:self-center"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Terapkan ke Form</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 2: Jadwal & Lokasi Sidang                         */}
        {/* ======================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden border-t-[4px] border-t-[#7CC563]">
          {/* Section Header */}
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ECF8E9] border border-[#D2EFCA] flex items-center justify-center text-[#15803D]">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  2. Jadwal &amp; Lokasi Pelaksanaan Sidang
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Waktu pelaksanaan, durasi pertemuan, dan media ruang sidang
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-400">Bagian 2 dari 3</span>
          </div>

          <div className="p-6 sm:p-7 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {/* Tanggal Pelaksanaan */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-slate-800 flex items-center gap-1.5 text-sm">
                    <Calendar className="w-4 h-4 text-[#1E6B7B]" />
                    <span>Tanggal Pelaksanaan</span>
                    <span className="text-red-500 font-bold">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Min. Hari Ini
                  </span>
                </div>
                <input
                  type="date"
                  required
                  min={todayStr}
                  value={date}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && val < todayStr) {
                      toast.error('Tanggal pelaksanaan rapat tidak bisa mundur (tidak boleh sebelum hari ini).');
                      setDate(todayStr);
                    } else {
                      setDate(val);
                    }
                  }}
                  className="w-full px-4 h-[44px] rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B] shadow-2xs"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Tanggal pelaksanaan rapat hanya dapat dijadwalkan mulai hari ini ke depan.
                </p>
              </div>

              {/* Waktu Pelaksanaan */}
              <div>
                <label className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5 text-sm">
                  <Clock className="w-4 h-4 text-[#1E6B7B]" />
                  <span>Waktu / Jam Sidang</span>
                  <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="Contoh: 09:00 - 12:00 WIB"
                  className="w-full px-4 h-[44px] rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B] shadow-2xs"
                />
              </div>
            </div>

            {/* Lokasi / Media Pertemuan */}
            <div>
              <label className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5 text-sm">
                <MapPin className="w-4 h-4 text-[#1E6B7B]" />
                <span>Lokasi Fisik / Tautan Media Pertemuan (Hybrid/Zoom)</span>
                <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Contoh: Ruang Rapat Utama Gedung Posko KEK & Zoom Meeting ID: 821 9920 112..."
                className="w-full px-4 h-[44px] rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B] shadow-2xs"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Sertakan nama gedung/ruangan atau informasi tautan rapat virtual jika dilaksanakan secara daring/hybrid.
              </p>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 3: Daftar Peserta & Notulis                      */}
        {/* ======================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden border-t-[4px] border-t-[#F99D1C]">
          {/* Section Header */}
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF0DC] border border-[#FEDEBE] flex items-center justify-center text-[#C2410C]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  3. Daftar Peserta &amp; Pemangku Kepentingan
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pilih pejabat/staf terdaftar dari database KEK atau input nama manual
                </p>
              </div>
            </div>
            <Badge variant="teal" dot className="text-xs">
              {selectedUserIds.length} Pejabat Dipilih
            </Badge>
          </div>

          <div className="p-6 sm:p-7 space-y-6">
            {/* Quick Picker Container */}
            {availableUsers.length > 0 && (
              <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-4">
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Participant Search */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#1E6B7B]" />
                    <input
                      type="text"
                      value={participantSearch}
                      onChange={(e) => setParticipantSearch(e.target.value)}
                      placeholder="Cari nama pejabat, staf, atau biro..."
                      className="w-full pl-10 pr-4 h-[40px] rounded-xl bg-white border border-slate-300 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B] shadow-2xs"
                    />
                  </div>

                  {/* Biro Filter Buttons */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
                    {['ALL', 'BPPK', 'PKKEK', 'IKK', 'HSDMO', 'UK'].map((code) => {
                      const isActive = participantBiroFilter === code;
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => setParticipantBiroFilter(code)}
                          className={cn(
                            'px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0',
                            isActive
                              ? 'bg-[#1E6B7B] text-white shadow-2xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          )}
                        >
                          {code === 'ALL' ? 'Semua Biro' : code}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Participant Chips Grid */}
                <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-1 p-1">
                  {filteredUsers.length === 0 ? (
                    <div className="py-6 text-center w-full text-slate-400 text-xs">
                      Tidak ada pejabat yang cocok dengan pencarian &quot;{participantSearch}&quot;
                    </div>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelected = selectedUserIds.includes(u.id);
                      return (
                        <button
                          type="button"
                          key={u.id}
                          onClick={() => handleToggleUser(u)}
                          className={cn(
                            'inline-flex items-center gap-2 h-9 px-3.5 rounded-xl text-[13px] font-medium transition-all cursor-pointer shadow-2xs select-none',
                            isSelected
                              ? 'bg-[#1E6B7B] text-white border border-[#175360] shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:border-[#1E6B7B] hover:text-[#1E6B7B]'
                          )}
                        >
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 text-emerald-300 stroke-[3]" />
                          ) : (
                            <User className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span className="truncate max-w-[200px]">{u.name}</span>
                          {u.biro?.code && (
                            <span
                              className={cn(
                                'text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wider',
                                isSelected
                                  ? 'bg-[#175360] text-teal-100'
                                  : 'bg-slate-100 text-slate-500'
                              )}
                            >
                              {u.biro.code}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Manual Attendees Textarea */}
            <div>
              <label className="font-semibold text-slate-800 mb-2 flex items-center justify-between text-sm">
                <span>Rangkuman Daftar Peserta / Tamu Eksternal</span>
                <span className="text-slate-400 font-normal text-xs">
                  (Dapat disunting manual)
                </span>
              </label>
              <textarea
                rows={3}
                required
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                placeholder="Pisahkan nama peserta dengan tanda koma..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B] shadow-2xs leading-relaxed"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Ketikkan nama peserta tamu luar atau instansi lintas kementerian/lembaga yang belum terdaftar di sistem. Pisahkan tiap nama dengan tanda koma.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Submission Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 text-center sm:text-left">
            Pastikan seluruh data jadwal dan agenda telah diverifikasi sebelum disimpan.
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href="/semua-rapat"
              className="flex-1 sm:flex-none px-6 h-[46px] rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition-colors inline-flex items-center justify-center cursor-pointer"
            >
              Batal
            </Link>

            <button
              type="submit"
              disabled={isSubmitted}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-7 h-[46px] rounded-xl bg-[#1E6B7B] hover:bg-[#175360] active:bg-[#103C46] text-white font-bold text-sm transition-all shadow-md shadow-[#1E6B7B]/20 cursor-pointer disabled:opacity-50"
            >
              {isSubmitted ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Rapat...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Simpan &amp; Jadwalkan Rapat</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
