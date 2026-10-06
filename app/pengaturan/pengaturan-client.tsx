'use client';

import React, { useState } from 'react';
import {
  User,
  Bell,
  Save,
  Lock,
  Building2,
  ShieldCheck,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { updateCurrentUserProfileAction } from '@/app/actions/user-profile-actions';
import { toast } from '@/components/providers/toast-provider';
import { useRouter } from 'next/navigation';

interface PengaturanClientProps {
  initialUser: {
    id: string;
    name: string;
    email: string;
    role: string;
    biroId: string;
    biro?: {
      id: string;
      code: string;
      shortName: string;
      name: string;
    } | null;
  } | null;
  availableBiros: {
    id: string;
    code: string;
    shortName: string;
    name: string;
  }[];
}

export function PengaturanClient({
  initialUser,
  availableBiros = [],
}: PengaturanClientProps) {
  const router = useRouter();

  const [name, setName] = useState(initialUser?.name || '');
  const [email, setEmail] = useState(initialUser?.email || '');
  const [biroId, setBiroId] = useState(initialUser?.biroId || availableBiros[0]?.id || '');
  const role = initialUser?.role || 'STAFF';

  // Password fields
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // Preference toggles
  const [emailNotif, setEmailNotif] = useState(true);
  const [deadlineNotif, setDeadlineNotif] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning('Nama lengkap tidak boleh kosong.');
      return;
    }
    if (!email.trim()) {
      toast.warning('Email dinas tidak boleh kosong.');
      return;
    }

    if (showPasswordSection && newPassword) {
      if (!currentPassword) {
        toast.warning('Masukkan kata sandi saat ini untuk konfirmasi penggantian password.');
        return;
      }
      if (newPassword.length < 6) {
        toast.warning('Kata sandi baru minimal 6 karakter.');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.warning('Konfirmasi kata sandi baru tidak cocok.');
        return;
      }
    }

    try {
      setIsSaving(true);
      const res = await updateCurrentUserProfileAction({
        name: name.trim(),
        email: email.trim(),
        biroId,
        ...(showPasswordSection && newPassword
          ? {
              currentPassword,
              newPassword,
              confirmPassword,
            }
          : {}),
      });

      if (res.success && res.data) {
        toast.success('Pengaturan profil dan akun berhasil diperbarui di database.');
        if (showPasswordSection) {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setShowPasswordSection(false);
        }
        router.refresh();
      } else {
        toast.error(res.error || 'Gagal menyimpan pengaturan.');
      }
    } catch (err: any) {
      toast.error(`Terjadi kesalahan: ${err?.message || 'Gagal menyimpan'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      {/* Header Banner */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-semibold text-[12px] text-[#31889C] uppercase tracking-wider">
            Konfigurasi Akun &amp; Preferensi
          </span>
          <h1 className="text-[24px] font-bold text-slate-900 mt-0.5">
            Pengaturan Akun &amp; Sistem
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Kelola profil dinas, kredensial masuk, unit kerja biro, dan preferensi notifikasi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg border bg-[#E8F5F7] border-[#BCE3EB] text-[12px] font-bold text-[#31889C] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Peran: {role}</span>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6 text-[13px]"
      >
        {/* Section 1: Profil Pejabat / Staf */}
        <div>
          <h3 className="text-[15px] font-bold text-slate-900 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-[#31889C]" />
            Informasi Profil Pengguna
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Lengkap &amp; Gelar
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Dr. Ir. Budi Santoso, M.Sc"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 focus:border-[#31889C]"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Alamat Email Dinas
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@kek.go.id"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 focus:border-[#31889C]"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Peran / Hak Akses Sistem
              </label>
              <input
                type="text"
                disabled
                value={role}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 font-bold"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Hak akses diatur langsung oleh Super Administrator dewan
              </span>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Unit Kerja / Penugasan Biro
              </label>
              <select
                value={biroId}
                onChange={(e) => setBiroId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 focus:border-[#31889C] bg-white cursor-pointer"
              >
                {availableBiros.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} — {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Ganti Kata Sandi */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#31889C]" />
              Keamanan &amp; Kata Sandi
            </h3>
            <button
              type="button"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="text-[12px] font-semibold text-[#31889C] hover:underline cursor-pointer"
            >
              {showPasswordSection ? 'Batal Ganti Kata Sandi' : '+ Ubah Kata Sandi'}
            </button>
          </div>

          {showPasswordSection && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-600 font-medium">
                  Pastikan kata sandi baru memiliki minimal 6 karakter.
                </span>
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPasswords ? 'Sembunyikan' : 'Tampilkan'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Kata Sandi Saat Ini
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Kata sandi lama"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 text-[12px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Kata Sandi Baru
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 text-[12px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 text-[12px]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Preferensi Notifikasi */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-[15px] font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#31889C]" />
            Preferensi Pemberitahuan &amp; Peringatan
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#F0F9FA] border border-[#BCE3EB]">
              <div>
                <div className="font-semibold text-slate-800">
                  Pemberitahuan Email Otomatis
                </div>
                <div className="text-[12px] text-slate-500">
                  Terima email saat ada notulen rapat baru atau risalah resmi disahkan dewan.
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailNotif}
                onChange={(e) => setEmailNotif(e.target.checked)}
                className="w-4 h-4 text-[#31889C] rounded border-slate-300 focus:ring-[#31889C] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-lg bg-amber-50/60 border border-amber-200/80">
              <div>
                <div className="font-semibold text-slate-800">
                  Peringatan Jatuh Tempo Tindak Lanjut (H-3 &amp; Terlambat)
                </div>
                <div className="text-[12px] text-slate-500">
                  Tampilkan notifikasi prioritas saat komitmen biro mendekati batas waktu.
                </div>
              </div>
              <input
                type="checkbox"
                checked={deadlineNotif}
                onChange={(e) => setDeadlineNotif(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#31889C] hover:bg-[#266F80] text-white font-semibold transition-all shadow-xs shadow-[#31889C]/20 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan Pengaturan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
