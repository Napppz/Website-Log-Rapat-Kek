'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { BIRO_LIST } from '@/lib/mock-data';
import { BiroCode } from '@/lib/types';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { getActiveUsersAction, createMeetingAction } from '@/app/actions/meeting-actions';
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
  const { data: session, status } = useSession();
  const userRole = session?.user?.role || 'VIEWER';
  const canCreate =
    userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'NOTULIS';

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
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch available users on mount
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
  }, []);

  // Loading session state
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        <p className="text-xs text-slate-500 font-medium">Memeriksa hak akses...</p>
      </div>
    );
  }

  // Unauthenticated user
  if (status === 'unauthenticated' || !session) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-amber-200 text-center shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
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
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-all shadow-sm"
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
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-amber-200 text-center shadow-sm space-y-4">
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
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-all"
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
      });

      if (res.success && res.data) {
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
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-amber-800 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Semua Rapat</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="p-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white">
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-700/60 text-amber-100 text-[11px] font-bold uppercase tracking-wider mb-1">
            Formulir Penjadwalan
          </span>
          <h1 className="text-xl font-bold">Jadwalkan Rapat Baru KEK RI</h1>
          <p className="text-amber-100 text-xs mt-1">
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
          {/* Biro Penyelenggara */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-600" />
                Biro Penyelenggara <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedBiro}
                onChange={(e) => setSelectedBiro(e.target.value as BiroCode)}
                className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                <Shield className="w-4 h-4 text-amber-600" />
                Sifat Pertemuan
              </label>
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="STRATEGIS">Prioritas Strategis Nasional</option>
                <option value="REGULER">Koordinasi Berkala (Reguler)</option>
                <option value="DARURAT">Eskalasi Mendesak</option>
              </select>
            </div>
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
              className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Tanggal & Waktu */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600" />
                Tanggal Pelaksanaan <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                Waktu Pelaksanaan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="Contoh: 09:00 - 12:00 WIB"
                className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Lokasi */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-600" />
              Lokasi / Media Pertemuan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ruang Rapat Utama Gedung Posko KEK & Zoom..."
              className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Peserta & Pemangku Kepentingan */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-slate-700 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-600" />
                Daftar Peserta &amp; Pemangku Kepentingan <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {selectedUserIds.length} pejabat dipilih
              </span>
            </div>

            {/* Quick Picker from Registered Users */}
            {availableUsers.length > 0 && (
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                    Pilih Cepat Pejabat / Staf Terdaftar:
                  </span>
                  <span className="text-[10px] text-amber-700">
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
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-amber-400 hover:text-amber-800'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                        <span>{u.name}</span>
                        {u.biro?.code && (
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                              isSelected
                                ? 'bg-amber-700 text-amber-100'
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
                className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
              />
              <p className="text-[11px] text-slate-400 mt-0.5">
                Anda juga dapat mengetikkan nama pemangku kepentingan atau instansi luar lainnya secara manual dipisahkan dengan tanda koma.
              </p>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-amber-100 flex items-center justify-end gap-3">
            <Link
              href="/semua-rapat"
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold transition-colors"
            >
              Batal
            </Link>

            <button
              type="submit"
              disabled={isSubmitted}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-all shadow-md shadow-amber-600/20 cursor-pointer disabled:opacity-50"
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
