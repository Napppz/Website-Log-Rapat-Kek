'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error caught by error boundary:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="w-16 h-16 rounded-full bg-red-100 border border-red-200 flex items-center justify-center text-red-600 mb-4 shadow-sm">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <h2 className="text-[22px] font-bold text-slate-900 mb-2">
        Terjadi Kendala Memuat Data
      </h2>

      <p className="text-[14px] text-slate-600 max-w-md mb-6 leading-relaxed">
        Sistem mengalami gangguan teknis sementara saat memproses halaman ini. Silakan coba muat ulang atau kembali ke beranda.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600 text-white font-semibold text-[13px] hover:bg-amber-700 shadow-sm transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Coba Muat Ulang</span>
        </button>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-amber-300 text-amber-900 font-semibold text-[13px] hover:bg-amber-50 shadow-sm transition-all"
        >
          <Home className="w-4 h-4 text-amber-700" />
          <span>Kembali ke Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
