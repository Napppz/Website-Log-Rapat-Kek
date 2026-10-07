'use client';

import React from 'react';
import {
  Mail,
  Inbox,
  Clock,
  Building2,
  FileText,
  AlertCircle,
  FileCheck,
  Check,
  Building,
} from 'lucide-react';
import { MeetingDocumentCategory, MeetingDocumentSubCategory } from '@/lib/types';
import { cn } from '@/lib/utils';

export interface CategorySelectionData {
  category: MeetingDocumentCategory;
  subCategory?: MeetingDocumentSubCategory | null;
  sourceOrigin?: string;
  postponeReason?: string;
}

interface MeetingCategorySelectorProps {
  value: CategorySelectionData;
  onChange: (data: CategorySelectionData) => void;
  disabled?: boolean;
}

export function MeetingCategorySelector({
  value,
  onChange,
  disabled = false,
}: MeetingCategorySelectorProps) {
  const currentCategory = value.category || 'UNDANGAN_INTERNAL';
  const currentSubCategory = value.subCategory || 'DISPOSISI_SEKJEN';
  const currentSourceOrigin = value.sourceOrigin || '';
  const currentPostponeReason = value.postponeReason || '';

  const handleSelectCategory = (cat: MeetingDocumentCategory) => {
    if (disabled) return;
    if (cat === 'NASKAH_MASUK') {
      onChange({
        category: cat,
        subCategory: value.subCategory || 'DISPOSISI_SEKJEN',
        sourceOrigin: currentSourceOrigin,
        postponeReason: '',
      });
    } else if (cat === 'SURAT_DITUNDA') {
      onChange({
        category: cat,
        subCategory: null,
        sourceOrigin: '',
        postponeReason: currentPostponeReason,
      });
    } else {
      onChange({
        category: 'UNDANGAN_INTERNAL',
        subCategory: null,
        sourceOrigin: '',
        postponeReason: '',
      });
    }
  };

  const handleSelectSubCategory = (sub: MeetingDocumentSubCategory) => {
    if (disabled) return;
    onChange({
      category: 'NASKAH_MASUK',
      subCategory: sub,
      sourceOrigin: currentSourceOrigin,
      postponeReason: '',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <label className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-[#1E6B7B]" />
            <span>Kategori Naskah &amp; Agenda Rapat</span>
            <span className="text-red-500 font-bold">*</span>
          </label>
          <p className="text-xs text-slate-500 mt-0.5">
            Pilih asal dokumen naskah dinas dasar pelaksanaan rapat koordinasi.
          </p>
        </div>
      </div>

      {/* 3 Main Category Option Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 1. Undangan Internal */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleSelectCategory('UNDANGAN_INTERNAL')}
          className={cn(
            'p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer group',
            currentCategory === 'UNDANGAN_INTERNAL'
              ? 'border-[#31889C] bg-[#F0F9FA] shadow-xs ring-1 ring-[#31889C]'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 text-slate-700'
          )}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div
                className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                  currentCategory === 'UNDANGAN_INTERNAL'
                    ? 'bg-[#31889C] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 group-hover:bg-[#E8F5F7] group-hover:text-[#31889C]'
                )}
              >
                <Mail className="w-5 h-5" />
              </div>
              {currentCategory === 'UNDANGAN_INTERNAL' && (
                <span className="w-5 h-5 rounded-full bg-[#31889C] text-white flex items-center justify-center text-[10px] font-bold">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              )}
            </div>
            <h4 className="text-[14px] font-bold text-slate-900 leading-snug">
              1. Undangan Internal
            </h4>
            <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
              Rapat koordinasi antar unit kerja dan biro internal Sekretariat Dewan Nasional KEK.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] font-semibold text-[#215865]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#31889C]" />
            <span>Persuratan Internal KEK</span>
          </div>
        </button>

        {/* 2. Daftar Naskah Masuk */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleSelectCategory('NASKAH_MASUK')}
          className={cn(
            'p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer group',
            currentCategory === 'NASKAH_MASUK'
              ? 'border-indigo-600 bg-indigo-50/60 shadow-xs ring-1 ring-indigo-600'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 text-slate-700'
          )}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div
                className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                  currentCategory === 'NASKAH_MASUK'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700'
                )}
              >
                <Inbox className="w-5 h-5" />
              </div>
              {currentCategory === 'NASKAH_MASUK' && (
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              )}
            </div>
            <h4 className="text-[14px] font-bold text-slate-900 leading-snug">
              2. Daftar Naskah Masuk
            </h4>
            <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
              Rapat tindak lanjut atas surat eksternal atau disposisi resmi pimpinan yang masuk.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
            <span>Disposisi Sekjen / Surat Eksternal</span>
          </div>
        </button>

        {/* 3. Surat Ditunda */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleSelectCategory('SURAT_DITUNDA')}
          className={cn(
            'p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer group',
            currentCategory === 'SURAT_DITUNDA'
              ? 'border-rose-600 bg-rose-50/60 shadow-xs ring-1 ring-rose-600'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 text-slate-700'
          )}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div
                className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                  currentCategory === 'SURAT_DITUNDA'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 group-hover:bg-rose-100 group-hover:text-rose-700'
                )}
              >
                <Clock className="w-5 h-5" />
              </div>
              {currentCategory === 'SURAT_DITUNDA' && (
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              )}
            </div>
            <h4 className="text-[14px] font-bold text-slate-900 leading-snug">
              3. Surat Ditunda
            </h4>
            <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
              Status khusus untuk rapat atau surat yang mengalami penundaan jadwal / reschedule.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] font-semibold text-rose-700">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            <span>Penundaan Rapat (Postponed)</span>
          </div>
        </button>
      </div>

      {/* Sub-Panel: If Daftar Naskah Masuk Selected */}
      {currentCategory === 'NASKAH_MASUK' && (
        <div className="p-4 rounded-xl bg-slate-50 border border-indigo-200/80 space-y-4 animate-in fade-in duration-200">
          <div>
            <label className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5">
              <span>Jenis Naskah Masuk:</span>
              <span className="text-red-500 font-bold">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
              {/* Option A: Disposisi Sekjen */}
              <button
                type="button"
                disabled={disabled}
                onClick={() => handleSelectSubCategory('DISPOSISI_SEKJEN')}
                className={cn(
                  'p-3 rounded-lg border text-left flex items-start gap-3 transition-all cursor-pointer',
                  currentSubCategory === 'DISPOSISI_SEKJEN'
                    ? 'bg-white border-indigo-600 shadow-xs ring-1 ring-indigo-500'
                    : 'bg-white/70 border-slate-200 hover:bg-white text-slate-700'
                )}
              >
                <div
                  className={cn(
                    'w-7 h-7 rounded-md flex items-center justify-center text-xs shrink-0 font-bold',
                    currentSubCategory === 'DISPOSISI_SEKJEN'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  )}
                >
                  <FileCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h5 className="text-[13px] font-bold text-slate-900 leading-tight">
                    • Disposisi Sekjen
                  </h5>
                  <p className="text-[11.5px] text-slate-500 mt-0.5 leading-snug">
                    Instruksi/disposisi arahan resmi dari Sekretaris Jenderal Dewan Nasional KEK.
                  </p>
                </div>
              </button>

              {/* Option B: Surat Eksternal */}
              <button
                type="button"
                disabled={disabled}
                onClick={() => handleSelectSubCategory('SURAT_EKSTERNAL')}
                className={cn(
                  'p-3 rounded-lg border text-left flex items-start gap-3 transition-all cursor-pointer',
                  currentSubCategory === 'SURAT_EKSTERNAL'
                    ? 'bg-white border-amber-600 shadow-xs ring-1 ring-amber-500'
                    : 'bg-white/70 border-slate-200 hover:bg-white text-slate-700'
                )}
              >
                <div
                  className={cn(
                    'w-7 h-7 rounded-md flex items-center justify-center text-xs shrink-0 font-bold',
                    currentSubCategory === 'SURAT_EKSTERNAL'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  )}
                >
                  <Building className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h5 className="text-[13px] font-bold text-slate-900 leading-tight">
                    • Surat Eksternal (Surat Masuk dari Luar)
                  </h5>
                  <p className="text-[11.5px] text-slate-500 mt-0.5 leading-snug">
                    Surat dari Kementerian/Lembaga, Pemda, Pengelola Kawasan KEK, atau pihak luar.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional Detail Input based on SubCategory */}
          {currentSubCategory === 'DISPOSISI_SEKJEN' ? (
            <div>
              <label className="text-[12.5px] font-semibold text-slate-800 block mb-1">
                Nomor / Catatan Disposisi Sekjen (Opsional)
              </label>
              <input
                type="text"
                disabled={disabled}
                value={currentSourceOrigin}
                onChange={(e) =>
                  onChange({
                    category: 'NASKAH_MASUK',
                    subCategory: 'DISPOSISI_SEKJEN',
                    sourceOrigin: e.target.value,
                    postponeReason: '',
                  })
                }
                placeholder="Contoh: No. Agenda 184 / Disposisi Sekjen perihal Pembahasan KEK Batam"
                className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 text-[13px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600"
              />
            </div>
          ) : (
            <div>
              <label className="text-[12.5px] font-semibold text-slate-800 block mb-1">
                Asal Instansi / Pengirim Surat Eksternal
              </label>
              <input
                type="text"
                disabled={disabled}
                value={currentSourceOrigin}
                onChange={(e) =>
                  onChange({
                    category: 'NASKAH_MASUK',
                    subCategory: 'SURAT_EKSTERNAL',
                    sourceOrigin: e.target.value,
                    postponeReason: '',
                  })
                }
                placeholder="Contoh: Kementerian Koordinator Bidang Perekonomian / BUPP KEK Galang Batang"
                className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 text-[13px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
              />
            </div>
          )}
        </div>
      )}

      {/* Sub-Panel: If Surat Ditunda Selected */}
      {currentCategory === 'SURAT_DITUNDA' && (
        <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-2.5 text-rose-800 text-[12.5px] leading-relaxed">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong>Informasi Penundaan Rapat:</strong> Rapat ini akan dicatat dalam kategori{' '}
              <strong>Surat Ditunda</strong>. Peserta dan pimpinan akan menerima catatan bahwa agenda rapat ditunda sampai jadwal baru disahkan.
            </div>
          </div>

          <div>
            <label className="text-[12.5px] font-bold text-slate-800 block mb-1">
              Alasan / Keterangan Penundaan Rapat <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              disabled={disabled}
              value={currentPostponeReason}
              onChange={(e) =>
                onChange({
                  category: 'SURAT_DITUNDA',
                  subCategory: null,
                  sourceOrigin: '',
                  postponeReason: e.target.value,
                })
              }
              placeholder="Contoh: Rapat ditunda menunggu arahan lanjutan dari pimpinan / penyesuaian jadwal dinas luar kota Bapak Sekjen..."
              className="w-full px-3.5 py-2 rounded-lg bg-white border border-rose-300 text-slate-800 text-[13px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-600 leading-relaxed"
            />
          </div>
        </div>
      )}
    </div>
  );
}
