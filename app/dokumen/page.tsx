'use client';

import React from 'react';
import { FileText, Download, Search } from 'lucide-react';
import { MOCK_MEETINGS } from '@/lib/mock-data';

export default function DokumenPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="p-6 bg-white rounded-xl border border-amber-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="font-semibold text-[12px] text-amber-700 uppercase tracking-wider">
            Arsip Digital
          </span>
          <h1 className="text-[24px] font-bold text-slate-900 mt-0.5">Dokumen &amp; Notulen KEK RI</h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Unduh risalah rapat resmi, berita acara kesepakatan, dan dokumen lampiran regulasi.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert('Menyiapkan arsip ZIP seluruh notulen rapat tahun 2026...')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white font-semibold text-[13px] hover:bg-amber-700 shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Unduh Semua Arsip (ZIP)</span>
        </button>
      </div>

      {/* Document List */}
      <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-amber-100 flex items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              placeholder="Cari nama berkas notulen..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-amber-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <Search className="w-4 h-4 text-amber-600 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        <div className="divide-y divide-amber-100/80">
          {MOCK_MEETINGS.map((m) => (
            <div
              key={m.id}
              className="p-4 hover:bg-amber-50/30 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-[14px] text-slate-900">
                    Notulen_Resmi_{m.code}_{m.date.replace(/\s+/g, '_')}.pdf
                  </h4>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    {m.title} • {m.biroName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <span className="text-[12px] text-slate-400 font-medium">1.4 MB</span>
                <button
                  type="button"
                  onClick={() => alert(`Mengunduh berkas: Notulen_${m.code}.pdf`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[12px] font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
