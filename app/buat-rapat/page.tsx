'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { BIRO_LIST } from '@/lib/mock-data';
import { BiroCode } from '@/lib/types';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  getActiveUsersAction,
  createMeetingAction,
  getMeetingOptionsAction,
} from '@/app/actions/meeting-actions';
import { saveMinutesAndActionsToMeetingAction } from '@/app/actions/meeting-upload-actions';
import { UploadMeetingDialog } from '@/components/meeting/upload-meeting-dialog';
import { ExtractedMeetingData } from '@/lib/meeting-extractor';
import { toast } from '@/components/providers/toast-provider';

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
  const userRole = session?.user?.role || 'VIEWER';
  const canCreate =
    userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'NOTULIS';

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [pendingMinutes, setPendingMinutes] = useState<ExtractedMeetingData | null>(null);

  const [selectedBiro, setSelectedBiro] = useState<BiroCode>('IKK');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('2026-09-25');
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
  const [previousMeetingId, setPreviousMeetingId] = useState<string>('');
  const [chairpersonId, setChairpersonId] = useState<string>('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check query params to auto-open upload dialog if ?upload=true
  useEffect(() => {
    if (searchParams.get('upload') === 'true') {
      setIsUploadDialogOpen(true);
    }
  }, [searchParams]);

  // Handle data applied from uploaded meeting document
  const handleApplyExtractedData = (
    extractedData: ExtractedMeetingData,
    matchedUserIds: string[]
  ) => {
    setTitle(extractedData.title);
    if (extractedData.biroCode) {
      setSelectedBiro(extractedData.biroCode as BiroCode);
    }
    setDate(extractedData.date);
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
          // Automatically select matching users based on initial attendees text
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

  // Loading session state
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#31889C]" />
        <p className="text-xs text-slate-500 font-medium">Memeriksa hak akses...</p>
      </div>
    );
  }

  // Unauthenticated user
  if (status === 'unauthenticated' || !session) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#E8F5F7] text-[#31889C] flex items-center justify-center mx-auto">
          <LogIn className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">
          Autentikasi Diperlukan
        </h2>
        <p className="text-xs text-slate-500">
          Anda harus masuk ke sistem terlebih dahulu untuk menjadwalkan rapat baru.
        </p>
        <Link
          href="/login?callbackUrl=/buat-rapat"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#31889C] hover:bg-[#266F80] text-white font-semibold text-xs transition-all shadow-xs shadow-[#31889C]/20"
        >
          <LogIn className="w-4 h-4" />
          <span>Masuk ke Akun Anda</span>
        </Link>
      </div>
    );
  }

  // Unauthorized role (STAFF or VIEWER)
  if (!canCreate) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">
          Izin Tidak Mencukupi
        </h2>
        <p className="text-xs text-slate-500">
          Peran akun Anda saat ini (<strong>{userRole}</strong>) hanya memiliki hak baca.
          Hanya peran <strong>SUPER_ADMIN</strong>, <strong>ADMIN</strong>, atau{' '}
          <strong>NOTULIS</strong> yang dapat menjadwalkan rapat baru.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#31889C] hover:bg-[#266F80] text-white font-semibold text-xs transition-all shadow-xs"
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setErrorMessage(null);

    try {
      const parts = time.split('-').map((s) => s.trim().replace('WIB', '').trim());
      const startTime = parts[0] || '09:00';
      const endTime = parts[1] || '12:00';

      const res = await createMeetingAction({
        title,
        biroCode: selectedBiro,
        date,
        startTime,
        endTime,
        location,
        attendees,
        participantUserIds: selectedUserIds,
        previousMeetingId: previousMeetingId || undefined,
        chairpersonId: chairpersonId || undefined,
        meetingNumber: customMeetingNumber.trim() || undefined,
      });

      if (res.success && res.data) {
        // If there are pending minutes and action items from uploaded document, save them automatically
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
        router.push(`/semua-rapat/${res.data.id}`);
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
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      {/* Header & Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/semua-rapat"
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#31889C] text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Semua Rapat</span>
        </Link>
      </div>

      {/* Quick Upload Action Card */}
      <div className="bg-gradient-to-r from-[#1B5260] via-[#266F80] to-[#31889C] rounded-2xl p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-extrabold uppercase tracking-wider">
                ⚡ Fitur Cepat Ekstraksi Otomatis
              </span>
              {pendingMinutes && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/80 text-white text-[10px] font-bold">
                  ✓ Dokumen Terpasang
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-white leading-snug">
              Punya Berkas Hasil Rapat Offline / Dokumen Eksternal?
            </h3>
            <p className="text-white/80 text-xs mt-0.5 max-w-xl">
              Unggah berkas Word (.docx), PDF (.pdf), atau Teks (.txt). Sistem secara cerdas mengisi formulir rapat dan menyusun naskah notula resmi (agenda, pembahasan, keputusan, serta butir tindak lanjut).
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsUploadDialogOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#1B5260] hover:bg-[#E8F5F7] font-bold text-xs transition-all shadow-md shrink-0 cursor-pointer hover:scale-105 active:scale-95"
        >
          <UploadCloud className="w-4 h-4 text-[#31889C]" />
          <span>Unggah Berkas Rapat</span>
        </button>
      </div>

      <UploadMeetingDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onApplyToForm={handleApplyExtractedData}
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Banner */}
        <div className="p-6 bg-gradient-to-r from-[#31889C] to-[#266F80] text-white">
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider mb-1">
            Formulir Penjadwalan
          </span>
          <h1 className="text-xl font-bold">Jadwalkan Rapat Baru KEK RI</h1>
          <p className="text-white/80 text-xs mt-1">
            Inputkan rincian agenda, biro pelaksana, dan daftar pejabat peserta rapat koordinasi resmi.
          </p>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Gagal Menyimpan Rapat</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {/* Biro Penyelenggara, Sifat Pertemuan & Pimpinan Rapat */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#31889C]" />
                Biro Penyelenggara <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedBiro}
                onChange={(e) => setSelectedBiro(e.target.value as BiroCode)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 focus:border-[#31889C]"
              >
                {BIRO_LIST.map((biro) => (
                  <option key={biro.code} value={biro.code}>
                    {biro.code} — {biro.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#31889C]" />
                Sifat Pertemuan
              </label>
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 focus:border-[#31889C]"
              >
                <option value="STRATEGIS">Prioritas Strategis Nasional</option>
                <option value="REGULER">Koordinasi Berkala (Reguler)</option>
                <option value="DARURAT">Eskalasi Mendesak</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#31889C]" />
                Ketua / Pimpinan Sidang
              </label>
              <select
                value={chairpersonId}
                onChange={(e) => setChairpersonId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 focus:border-[#31889C]"
              >
                <option value="">-- Bebas / Diatur di Notula --</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.biro?.code ? `[${u.biro.code}]` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nomor Undangan Surat (Opsional) */}
          <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#31889C]" />
                <span>Nomor Surat Undangan Rapat</span>
                <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <span className="text-[11px] text-[#31889C]">
                Kosongkan jika rapat internal tanpa surat undangan (akan bertanda &apos;-&apos;)
              </span>
            </div>
            <input
              type="text"
              value={customMeetingNumber}
              onChange={(e) => setCustomMeetingNumber(e.target.value)}
              placeholder="Contoh: UND-014/SET.KEK/IX/2026 atau biarkan kosong (tanda '-')"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 focus:border-[#31889C]"
            />
            <p className="text-[11px] text-slate-500">
              Jika diisi, nomor ini akan dicantumkan pada baris <strong>Nomor Surat Undangan</strong> di notula &amp; PDF resmi. Jika dikosongkan, sistem otomatis memberikan tanda <strong>&apos;-&apos;</strong> sesuai kaidah tata naskah dinas jika rapat tidak memakai surat undangan tersendiri.
            </p>
          </div>

          {/* Rapat Rujukan / Lanjutan (Opsional) */}
          <div className="p-4 bg-[#F0F9FA] rounded-xl border border-[#BCE3EB] space-y-1.5">
            <label className="block font-semibold text-slate-800 flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-[#31889C]" />
              <span>Tautkan ke Rapat Sebelumnya (Opsional — Jika Rapat Lanjutan)</span>
            </label>
            <p className="text-[11px] text-slate-500">
              Jika rapat ini merupakan tindak lanjut dari rapat terdahulu, pilih rapat rujukan agar peserta dapat langsung meninjau notula dan memantau status butir tindak lanjut rapat ke-1.
            </p>
            <select
              value={previousMeetingId}
              onChange={(e) => setPreviousMeetingId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 focus:border-[#31889C]"
            >
              <option value="">-- Tidak Ada (Rapat Baru Mandiri / Bukan Rapat Lanjutan) --</option>
              {availableMeetings.map((m) => (
                <option key={m.id} value={m.id}>
                  [{m.meetingNumber}] {m.title} ({new Date(m.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })})
                </option>
              ))}
            </select>
          </div>

          {/* Agenda / Judul */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Agenda &amp; Topik Pembahasan <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Rapat Koordinasi Fasilitasi Investasi Lintas Sektor Kawasan Industri KEK Sei Mangkei..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 focus:border-[#31889C]"
            />
          </div>

          {/* Tanggal & Waktu */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#31889C]" />
                Tanggal Pelaksanaan <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 focus:border-[#31889C]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#31889C]" />
                Waktu Pelaksanaan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="Contoh: 09:00 - 12:00 WIB"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 focus:border-[#31889C]"
              />
            </div>
          </div>

          {/* Lokasi */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#31889C]" />
              Lokasi / Media Pertemuan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ruang Rapat Utama Gedung Posko KEK & Zoom..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 focus:border-[#31889C]"
            />
          </div>

          {/* Peserta & Pemangku Kepentingan */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-slate-700 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#31889C]" />
                Daftar Peserta &amp; Pemangku Kepentingan <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {selectedUserIds.length} pejabat dipilih
              </span>
            </div>

            {/* Quick Picker from Registered Users */}
            {availableUsers.length > 0 && (
              <div className="p-3 bg-[#F0F9FA] rounded-xl border border-[#BCE3EB] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#215865] flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-[#31889C]" />
                    Pilih Cepat Pejabat / Staf Terdaftar:
                  </span>
                  <span className="text-[10px] text-[#31889C]">
                    Klik nama untuk menambahkan atau menghapus
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {availableUsers.map((u) => {
                    const isSelected = selectedUserIds.includes(u.id);
                    return (
                      <button
                        type="button"
                        key={u.id}
                        onClick={() => handleToggleUser(u)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                          isSelected
                            ? 'bg-[#31889C] text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-[#31889C] hover:text-[#31889C]'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                        <span>{u.name}</span>
                        {u.biro?.code && (
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                              isSelected
                                ? 'bg-[#266F80] text-teal-100'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {u.biro.code}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Manual text input for additional guests / attendees */}
            <div>
              <textarea
                rows={2}
                required
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                placeholder="Pisahkan nama peserta dengan tanda koma..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 focus:border-[#31889C] text-xs"
              />
              <p className="text-[11px] text-slate-400 mt-0.5">
                Anda juga dapat mengetikkan nama pemangku kepentingan atau instansi luar lainnya secara manual dipisahkan dengan tanda koma.
              </p>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              href="/semua-rapat"
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold transition-colors"
            >
              Batal
            </Link>

            <button
              type="submit"
              disabled={isSubmitted}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#31889C] hover:bg-[#266F80] text-white font-semibold transition-all shadow-xs shadow-[#31889C]/20 cursor-pointer disabled:opacity-50"
            >
              {isSubmitted ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Rapat &amp; Peserta...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Simpan &amp; Jadwalkan Rapat</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
