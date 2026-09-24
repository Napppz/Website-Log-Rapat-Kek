'use client';

import React, { useState, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setErrorMessage('Email atau password tidak valid.');
        setIsLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage('Terjadi kesalahan sistem saat mencoba masuk.');
      setIsLoading(false);
    }
  };

  // Demo accounts helper for development review
  const handleFillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('DevOnly!2026');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/80 via-white to-amber-100/40 flex flex-col justify-center items-center p-4 sm:p-6">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700" />

      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-2xl border border-amber-200 shadow-xl overflow-hidden backdrop-blur-xs">
          {/* Card Header with Logo */}
          <div className="p-8 text-center bg-gradient-to-b from-amber-50/60 to-transparent border-b border-amber-100/80">
            <div className="inline-flex p-3 rounded-2xl bg-white shadow-xs border border-amber-200 mb-4">
              <Image
                src="/logo-kek.png"
                alt="Logo KEK RI"
                width={80}
                height={80}
                className="w-16 h-16 object-contain"
                priority
              />
            </div>
            <span className="text-[11px] font-bold tracking-widest text-amber-800 uppercase block">
              Sekretariat Jenderal Dewan Nasional KEK RI
            </span>
            <h1 className="text-[22px] font-extrabold text-slate-900 mt-1">
              SIM-RAPAT KEK RI
            </h1>
            <p className="text-[12px] text-slate-500 mt-1">
              Sistem Manajemen Rapat &amp; Matriks Tindak Lanjut Terintegrasi
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-4">
            <div className="text-center pb-2">
              <h2 className="text-[16px] font-bold text-slate-800">
                Masuk ke Sistem
              </h2>
              <p className="text-[12px] text-slate-500">
                Gunakan kredensial resmi kementerian / biro kerja KEK
              </p>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-[12px] text-red-700 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Email field */}
            <div className="space-y-1.5">
              <label className="block text-[12px] font-bold text-slate-700">
                Email Kedinasan
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="nama@simrapat.local atau nama@kek.go.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-slate-900 text-[13px] font-medium shadow-2xs"
                />
                <Mail className="w-4 h-4 text-amber-600 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label className="block text-[12px] font-bold text-slate-700">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-slate-900 text-[13px] font-medium shadow-2xs"
                />
                <Lock className="w-4 h-4 text-amber-600 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[13px] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <span>Memproses Masuk...</span>
              ) : (
                <>
                  <span>MASUK</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Help / Footer Section 9 */}
            <div className="pt-4 text-center border-t border-slate-100">
              <p className="text-[12px] text-slate-500">
                Belum memiliki akses?{' '}
                <span className="font-semibold text-amber-800">
                  Hubungi administrator.
                </span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Aplikasi internal terbatas Dewan Nasional KEK RI
              </p>
            </div>
          </form>

          {/* Quick Demo Switcher for Evaluation */}
          <div className="px-8 pb-6 bg-slate-50/80 border-t border-slate-100 pt-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2 text-center">
              Pilih Akun Demo Development:
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => handleFillDemo('superadmin@simrapat.local')}
                className="p-1.5 text-left rounded-lg bg-white border border-slate-200 hover:border-amber-400 text-slate-700 font-semibold cursor-pointer truncate"
              >
                👑 Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('admin@simrapat.local')}
                className="p-1.5 text-left rounded-lg bg-white border border-slate-200 hover:border-amber-400 text-slate-700 font-semibold cursor-pointer truncate"
              >
                ⚙️ Administrator
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('notulis@simrapat.local')}
                className="p-1.5 text-left rounded-lg bg-white border border-slate-200 hover:border-amber-400 text-slate-700 font-semibold cursor-pointer truncate"
              >
                📝 Notulis
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('staff@simrapat.local')}
                className="p-1.5 text-left rounded-lg bg-white border border-slate-200 hover:border-amber-400 text-slate-700 font-semibold cursor-pointer truncate"
              >
                💼 Staf
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('viewer@simrapat.local')}
                className="p-1.5 text-left rounded-lg bg-white border border-slate-200 hover:border-amber-400 text-slate-700 font-semibold cursor-pointer truncate col-span-2 text-center"
              >
                👁️ Viewer (Read Only)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Memuat halaman masuk...</div>}>
      <LoginForm />
    </Suspense>
  );
}
