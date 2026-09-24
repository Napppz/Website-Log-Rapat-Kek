import React from 'react';
import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 mb-4 shadow-sm">
        <FileQuestion className="w-8 h-8" />
      </div>

      <span className="font-bold text-[12px] text-amber-700 uppercase tracking-wider mb-1">
        404 NOT FOUND
      </span>

      <h2 className="text-[24px] font-bold text-slate-900 mb-2">
        Halaman Tidak Ditemukan
      </h2>

      <p className="text-[14px] text-slate-600 max-w-md mb-6 leading-relaxed">
        Tautan agenda rapat atau halaman yang Anda tuju tidak tersedia atau telah dipindahkan dalam sistem SIM-RAPAT KEK RI.
      </p>

      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 text-white font-semibold text-[13px] hover:bg-amber-700 shadow-md shadow-amber-600/20 transition-all"
      >
        <Home className="w-4 h-4" />
        <span>Kembali ke Beranda Dashboard</span>
      </Link>
    </div>
  );
}
