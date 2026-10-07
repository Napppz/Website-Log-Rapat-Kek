'use client';

import React, { useState, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import {
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  KeyRound,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedDemoRole, setSelectedDemoRole] = useState<string | null>(null);
  const [showDemoSection, setShowDemoSection] = useState(true);

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
        setErrorMessage('Email atau kata sandi tidak cocok. Silakan periksa kembali kredensial Anda.');
        setIsLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setErrorMessage('Terjadi kendala jaringan atau kesalahan sistem saat mencoba masuk.');
      setIsLoading(false);
    }
  };

  // Demo accounts helper for quick evaluation (Super Admin, Admin, Staf)
  const demoAccounts = [
    { label: 'Super Admin', email: 'superadmin@simrapat.local', icon: '👑', desc: 'Akses Penuh Semua Biro' },
    { label: 'Admin', email: 'admin@simrapat.local', icon: '⚙️', desc: 'Pengelola Sistem' },
    { label: 'Staf', email: 'staff@simrapat.local', icon: '💼', desc: 'PIC Tindak Lanjut' },
  ];

  const handleFillDemo = (demoEmail: string, roleName: string) => {
    setEmail(demoEmail);
    setPassword('DevOnly!2026');
    setSelectedDemoRole(roleName);
    setErrorMessage(null);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#EEF7F9] via-[#F8FAFC] to-[#E5F3F6] flex flex-col justify-center items-center p-4 sm:p-6 overflow-hidden">
      {/* Decorative Ambient Glow Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#31889C]/15 rounded-full blur-3xl pointer-events-none animate-pulse duration-1000" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#7CC563]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-[#31889C]/5 to-transparent rounded-full blur-2xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Main Card Container */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xl shadow-slate-300/40 overflow-hidden transition-all duration-300">

          {/* Card Top Accent Bar */}
          <div className="w-full h-1.5 bg-gradient-to-r from-[#31889C] via-[#7CC563] to-[#266F80]" />

          {/* Card Header with Official Emblem & Title */}
          <div className="pt-7 pb-6 px-8 text-center bg-gradient-to-b from-[#F2F9FA] via-[#FAFCFD] to-white border-b border-slate-100">
            <div className="relative inline-flex p-2.5 rounded-full bg-white shadow-md border border-slate-200/90 mb-3.5 ring-4 ring-[#E8F5F7] transition-transform hover:scale-105 duration-200">
              <Image
                src="/logo-denas-kek.png"
                alt="Logo Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus"
                width={84}
                height={84}
                className="w-16 h-16 object-contain"
                priority
              />
            </div>

            <div className="inline-block px-3 py-0.5 rounded-full bg-[#EBF6F8] border border-[#31889C]/20 mb-2">
              <span className="text-[10.5px] font-bold tracking-wider text-[#266F80] uppercase">
                Sekretariat Dewan Nasional KEK RI
              </span>
            </div>

            <h1 className="text-[21px] font-black text-slate-900 tracking-tight">
              LOG &amp; NOTULA RAPAT
            </h1>
            <p className="text-[12px] text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
              Sistem Pengelolaan Agenda Sidang, Notula Resmi &amp; Tindak Lanjut Keputusan Rapat
            </p>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-7 space-y-4">
            <div className="text-center pb-1">
              <h2 className="text-[15px] font-bold text-slate-800">
                Masuk ke Akun Anda
              </h2>
              <p className="text-[11.5px] text-slate-500">
                Masukkan email kedinasan dan kata sandi terdaftar
              </p>
            </div>

            {/* Error Message Banner */}
            {errorMessage && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-red-50/90 border border-red-200 flex items-start gap-2.5 text-[12px] text-red-700 animate-in fade-in slide-in-from-top-1 duration-200"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span className="font-medium leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-[12px] font-bold text-slate-700"
              >
                Email Kedinasan
              </label>
              <div className="relative">
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  spellCheck={false}
                  disabled={isLoading}
                  placeholder="nama@simrapat.local atau nama@kek.go.id"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (selectedDemoRole) setSelectedDemoRole(null);
                  }}
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-[13px] font-medium transition-all shadow-xs outline-none ${errorMessage
                      ? 'border-red-300 bg-red-50/15 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-slate-900'
                      : 'border-slate-200 bg-white hover:border-slate-300 focus:border-[#31889C] focus:ring-2 focus:ring-[#31889C]/25 text-slate-900'
                    }`}
                />
                <Mail className="w-4 h-4 text-[#31889C] absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Password Field with Show/Hide Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-[12px] font-bold text-slate-700"
                >
                  Kata Sandi
                </label>
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] font-semibold text-[#31889C] hover:text-[#266F80] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Sembunyikan</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat Sandi</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (selectedDemoRole) setSelectedDemoRole(null);
                  }}
                  className={`w-full pl-9 pr-10 py-2.5 rounded-xl border text-[13px] font-medium transition-all shadow-xs outline-none ${errorMessage
                      ? 'border-red-300 bg-red-50/15 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-slate-900'
                      : 'border-slate-200 bg-white hover:border-slate-300 focus:border-[#31889C] focus:ring-2 focus:ring-[#31889C]/25 text-slate-900'
                    }`}
                />
                <Lock className="w-4 h-4 text-[#31889C] absolute left-3 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer rounded transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#31889C] to-[#266F80] hover:from-[#266F80] hover:to-[#1b5260] active:scale-[0.99] text-white font-bold text-[13px] shadow-md shadow-[#31889C]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Memverifikasi Masuk...</span>
                </>
              ) : (
                <>
                  <span>MASUK KE SISTEM</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            {/* Help / Security Footer */}
            <div className="pt-3 text-center border-t border-slate-100">
              <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-[#31889C]" />
                <span>Koneksi Terenkripsi &amp; Terlindungi</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Aplikasi internal terbatas Dewan Nasional KEK RI
              </p>
            </div>
          </form>

          {/* Quick Demo Switcher Accordion (Interactive Dev Helper) */}
          <div className="border-t border-slate-200/80 bg-slate-50/90 transition-all">
            <button
              type="button"
              onClick={() => setShowDemoSection(!showDemoSection)}
              className="w-full px-7 py-2.5 flex items-center justify-between text-left hover:bg-slate-100/70 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#31889C]" />
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Uji Coba Akun Demo
                </span>
                {selectedDemoRole && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EBF6F8] text-[#266F80] border border-[#31889C]/20">
                    {selectedDemoRole} terpilih
                  </span>
                )}
              </div>
              {showDemoSection ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showDemoSection && (
              <div className="px-7 pb-5 pt-1 space-y-2 animate-in fade-in duration-150">
                <p className="text-[11px] text-slate-500 leading-tight">
                  Pilih salah satu peran di bawah untuk mengisi kredensial uji coba secara instan:
                </p>

                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                  {demoAccounts.map((acc) => {
                    const isSelected = selectedDemoRole === acc.label;

                    return (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => handleFillDemo(acc.email, acc.label)}
                        className={`p-2 text-left rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#EBF6F8] border-[#31889C] text-[#266F80] font-bold shadow-xs ring-1 ring-[#31889C]'
                            : 'bg-white border-slate-200/90 hover:border-[#31889C]/60 hover:bg-[#F6FBFC] text-slate-700 font-semibold'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-[13px]">{acc.icon}</span>
                          <span className="truncate">{acc.label}</span>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#31889C] shrink-0 ml-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Outer Brand Copyright Subtext */}
        <p className="text-center text-[11px] text-slate-500 mt-4 font-medium">
          &copy; {new Date().getFullYear()} Sekretariat Dewan Nasional KEK RI. Hak Cipta Dilindungi.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-[#31889C]" />
            <span className="text-[12px] font-semibold">Memuat halaman masuk...</span>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

