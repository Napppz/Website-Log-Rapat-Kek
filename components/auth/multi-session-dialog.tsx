'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import {
  Users,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  X,
  Sparkles,
  Laptop,
  Globe,
  Loader2,
  ArrowRight,
  Info,
  Layers,
} from 'lucide-react';
import { toast } from '@/components/providers/toast-provider';

interface MultiSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEMO_ACCOUNTS = [
  {
    role: 'SUPER_ADMIN',
    roleLabel: 'Super Admin Dewan',
    name: 'Super Admin Dewan KEK',
    email: 'superadmin@simrapat.local',
    biroCode: 'UK',
    biroName: 'Biro Umum & Keuangan',
    badgeClass: 'bg-[#E8F5F7] text-[#31889C] border-[#BCE3EB]',
    icon: '👑',
    desc: 'Akses penuh lintas seluruh biro, verifikasi & persetujuan risalah',
  },
  {
    role: 'ADMIN',
    roleLabel: 'Administrator Biro',
    name: 'Administrator Operasional Rapat',
    email: 'admin@simrapat.local',
    biroCode: 'BPPK',
    biroName: 'Biro Perencanaan & Pembentukan',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    icon: '⚙️',
    desc: 'Pengelola rapat & master data di lingkungan biro',
  },
  {
    role: 'NOTULIS',
    roleLabel: 'Notulis Sidang',
    name: 'Notulis Sidang Pleno KEK',
    email: 'notulis@simrapat.local',
    biroCode: 'PKKEK',
    biroName: 'Biro Pengendalian',
    badgeClass: 'bg-[#ECF8E9] text-[#4D8F3D] border-[#D2EFCA]',
    icon: '📝',
    desc: 'Pencatat agenda, notula resmi, dan butir tindak lanjut',
  },
  {
    role: 'STAFF',
    roleLabel: 'Staf Pelaksana Teknis',
    name: 'Staf Pelaksana Teknis KEK',
    email: 'staff@simrapat.local',
    biroCode: 'IKK',
    biroName: 'Biro Investasi, Kerja Sama & Komunikasi',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
    icon: '💼',
    desc: 'PIC pelaksana realisasi tindak lanjut komitmen biro',
  },
  {
    role: 'VIEWER',
    roleLabel: 'Tamu / Viewer',
    name: 'Viewer Publikasi Dewan KEK',
    email: 'viewer@simrapat.local',
    biroCode: 'HSDMO',
    biroName: 'Biro Hukum, SDM & Organisasi',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    icon: '👁️',
    desc: 'Hak akses baca agenda & notula rapat umum',
  },
];

export function MultiSessionDialog({ isOpen, onClose }: MultiSessionDialogProps) {
  const { data: session } = useSession();
  const [switchingEmail, setSwitchingEmail] = useState<string | null>(null);
  const [currentOrigin, setCurrentOrigin] = useState<string>('http://localhost:3000');
  const [secondaryUrl, setSecondaryUrl] = useState<string>('http://127.0.0.1:3000');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      setCurrentOrigin(origin);

      if (window.location.hostname === 'localhost') {
        const port = window.location.port ? `:${window.location.port}` : '';
        setSecondaryUrl(`http://127.0.0.1${port}`);
      } else {
        const port = window.location.port ? `:${window.location.port}` : '';
        setSecondaryUrl(`http://localhost${port}`);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentEmail = session?.user?.email;

  const handleQuickSwitch = async (email: string, roleTitle: string) => {
    if (email === currentEmail) {
      toast.info(`Anda sudah login sebagai ${roleTitle}.`);
      return;
    }

    try {
      setSwitchingEmail(email);
      const res = await signIn('credentials', {
        email,
        password: 'DevOnly!2026',
        redirect: false,
      });

      if (res?.error) {
        toast.error('Gagal beralih akun. Silakan coba lagi.');
      } else {
        toast.success(`Berhasil beralih akun ke ${roleTitle}!`);
        onClose();
        window.location.reload();
      }
    } catch {
      toast.error('Terjadi kesalahan saat memproses pergantian sesi.');
    } finally {
      setSwitchingEmail(null);
    }
  };

  const handleOpenSecondarySession = () => {
    window.open(`${secondaryUrl}/login`, '_blank');
    toast.success(`Membuka sesi kedua di ${secondaryUrl} pada tab baru!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-50 via-white to-slate-50 border-b border-slate-200 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#E8F5F7] text-[#31889C] border border-[#BCE3EB]">
                <Users className="w-5 h-5" />
              </span>
              <h3 className="font-extrabold text-[17px] text-slate-900">
                Sesi Multi-Akun &amp; Pengujian Dual-Role
              </h3>
            </div>
            <p className="text-[12.5px] text-slate-600">
              Gunakan 2 peran akun berbeda secara bersamaan dalam 1 komputer tanpa saling tumpang tindih (*isolated session cookies*).
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-[13px]">
          {/* 1. Dual Simultaneous Session Box */}
          <div className="p-4 rounded-xl bg-[#F0F9FA] border border-[#BCE3EB] space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[#215865] font-bold text-[13.5px]">
                  <Globe className="w-4 h-4 text-[#31889C]" />
                  <span>Metode Sesi Simultan (2 Akun Aktif Bersamaan)</span>
                </div>
                <p className="text-[12px] text-slate-600 mt-1 leading-relaxed">
                  Browser mengisolasi penyimpanan cookie antara <strong>localhost</strong> dan <strong>127.0.0.1</strong>. Anda dapat membuka kedua alamat ini berdampingan (split screen) tanpa saling logout!
                </p>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] shrink-0 border border-emerald-300">
                Tersedia
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Sesi 1 Box */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Sesi 1 (Tab Aktif Saat Ini)
                </div>
                <div className="font-bold text-[#31889C] text-[13px] mt-0.5 truncate">
                  {currentOrigin}
                </div>
                <div className="text-[11.5px] text-slate-600 mt-1 truncate">
                  Login: <strong>{session?.user?.name || 'Tamu'}</strong>
                </div>
              </div>

              {/* Sesi 2 Box */}
              <div className="p-3 bg-white rounded-lg border border-[#BCE3EB] shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-bold text-[#215865] uppercase tracking-wider">
                    Sesi 2 (Tab Akun Pendamping)
                  </div>
                  <div className="font-bold text-slate-800 text-[13px] mt-0.5 truncate">
                    {secondaryUrl}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenSecondarySession}
                  className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#31889C] text-white hover:bg-[#266F80] font-semibold text-[11.5px] transition-all shadow-xs cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Sesi Ke-2 di Tab Baru</span>
                </button>
              </div>
            </div>

            {/* Alternatif Incognito */}
            <div className="flex items-center gap-2 text-[11.5px] text-slate-500 pt-1 border-t border-[#BCE3EB]/60">
              <Info className="w-3.5 h-3.5 text-[#31889C] shrink-0" />
              <span>
                Alternatif lain: Tekan <strong>Ctrl + Shift + N</strong> (Jendela Penyamaran / Incognito) untuk membuka sesi tambahan ke-3.
              </span>
            </div>
          </div>

          {/* 2. Fast Role Switcher in Current Tab */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-[13.5px] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#F99D1C]" />
                  <span>Beralih Peran Cepat di Tab Ini (1-Click Switch)</span>
                </h4>
                <p className="text-[11.5px] text-slate-500">
                  Ganti role akun aktif saat ini secara instan tanpa perlu repot mengetik email dan kata sandi.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const isCurrent = acc.email === currentEmail;
                const isSwitching = switchingEmail === acc.email;

                return (
                  <div
                    key={acc.role}
                    className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-[#E8F5F7]/40 border-[#31889C]/40 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-[16px] shrink-0 border border-slate-200">
                        {acc.icon}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-[13px]">
                            {acc.name}
                          </span>
                          <span className={`px-2 py-0.2 rounded-full font-bold text-[10px] uppercase border ${acc.badgeClass}`}>
                            {acc.roleLabel}
                          </span>
                          <span className="text-[10.5px] font-bold text-[#215865] bg-[#E8F5F7] px-1.5 py-0.2 rounded">
                            Biro {acc.biroCode}
                          </span>
                        </div>

                        <p className="text-[11.5px] text-slate-500 mt-0.5 line-clamp-1">
                          {acc.desc}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 self-end sm:self-center">
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Sedang Aktif</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={Boolean(switchingEmail)}
                          onClick={() => handleQuickSwitch(acc.email, acc.roleLabel)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-[#F0F9FA] hover:text-[#31889C] hover:border-[#31889C]/50 font-semibold text-[11.5px] transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                        >
                          {isSwitching ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#31889C]" />
                              <span>Beralih...</span>
                            </>
                          ) : (
                            <>
                              <span>Ganti Akun</span>
                              <ArrowRight className="w-3 h-3 text-[#31889C]" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[12px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Kredensial Pengujian Terverifikasi</span>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 font-semibold text-[12px] transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
