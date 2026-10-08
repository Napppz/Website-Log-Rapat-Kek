'use client';

import React from 'react';
import {
  FileText,
  AlertCircle,
  ChevronDown,
  Building2,
  Inbox,
  FileCheck,
  Building,
  Clock,
} from 'lucide-react';
import {
  MeetingDocumentCategory,
  MeetingDocumentSubCategory,
  MEETING_CATEGORY_OPTIONS,
  getMeetingCategoryInfo,
} from '@/lib/types';
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
  // Normalize legacy combination to the 5 standardized keys
  let normalizedKey: MeetingDocumentCategory = 'UNDANGAN_INTERNAL';
  const rawCat = (value.category || 'UNDANGAN_INTERNAL').toUpperCase();
  const rawSub = value.subCategory ? value.subCategory.toUpperCase() : null;

  if (rawCat === 'SURAT_DITUNDA' || rawCat === 'TUNDA_RAPAT') {
    normalizedKey = 'SURAT_DITUNDA';
  } else if (rawCat === 'DISPOSISI_SEKJEN' || (rawCat === 'NASKAH_MASUK' && rawSub === 'DISPOSISI_SEKJEN')) {
    normalizedKey = 'DISPOSISI_SEKJEN';
  } else if (rawCat === 'DISPOSISI_BIRO' || (rawCat === 'NASKAH_MASUK' && rawSub === 'DISPOSISI_BIRO')) {
    normalizedKey = 'DISPOSISI_BIRO';
  } else if (rawCat === 'NASKAH_MASUK') {
    normalizedKey = 'NASKAH_MASUK';
  } else {
    normalizedKey = 'UNDANGAN_INTERNAL';
  }

  const currentSourceOrigin = value.sourceOrigin || '';
  const currentPostponeReason = value.postponeReason || '';

  const handleSelectChange = (newKey: string) => {
    if (disabled) return;
    const cat = newKey as MeetingDocumentCategory;

    if (cat === 'SURAT_DITUNDA' || cat === 'TUNDA_RAPAT') {
      onChange({
        category: 'SURAT_DITUNDA',
        subCategory: null,
        sourceOrigin: '',
        postponeReason: currentPostponeReason,
      });
    } else if (cat === 'DISPOSISI_SEKJEN') {
      onChange({
        category: 'DISPOSISI_SEKJEN',
        subCategory: 'DISPOSISI_SEKJEN',
        sourceOrigin: currentSourceOrigin,
        postponeReason: '',
      });
    } else if (cat === 'DISPOSISI_BIRO') {
      onChange({
        category: 'DISPOSISI_BIRO',
        subCategory: 'DISPOSISI_BIRO',
        sourceOrigin: currentSourceOrigin,
        postponeReason: '',
      });
    } else if (cat === 'NASKAH_MASUK') {
      onChange({
        category: 'NASKAH_MASUK',
        subCategory: null,
        sourceOrigin: currentSourceOrigin,
        postponeReason: '',
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

  const selectedInfo = getMeetingCategoryInfo(normalizedKey);

  return (
    <div className="space-y-4">
      {/* Header Label */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <label htmlFor="category-select-dropdown" className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-[#1E6B7B]" />
            <span>Kategori Rapat</span>
            <span className="text-red-500 font-bold">*</span>
          </label>
          <p className="text-xs text-slate-500 mt-0.5">
            Pilih kategori dokumen naskah dinas dasar pelaksanaan rapat koordinasi.
          </p>
        </div>
      </div>

      {/* Main Dropdown Select */}
      <div className="space-y-3">
        <div className="relative">
          <select
            id="category-select-dropdown"
            disabled={disabled}
            value={normalizedKey}
            onChange={(e) => handleSelectChange(e.target.value)}
            className="w-full px-4 pr-10 h-[46px] rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/25 focus:border-[#1E6B7B] shadow-2xs cursor-pointer appearance-none transition-all hover:border-slate-400 disabled:bg-slate-100 disabled:cursor-not-allowed"
          >
            <option value="UNDANGAN_INTERNAL">Undangan Internal</option>
            <option value="NASKAH_MASUK">Daftar Naskah Masuk</option>
            <option value="DISPOSISI_SEKJEN">Disposisi Sekjen</option>
            <option value="DISPOSISI_BIRO">Disposisi Biro</option>
            <option value="SURAT_DITUNDA">Tunda Rapat</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Selected Category Info Preview Badge */}
        <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/70 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-2xs', selectedInfo.badgeClass)}>
              <span>{selectedInfo.badgeIcon}</span>
              <span>{selectedInfo.label}</span>
            </span>
            <span className="text-slate-600 truncate">{selectedInfo.description}</span>
          </div>
        </div>
      </div>

      {/* Conditional Details based on Selected Category */}
      {/* 1. Undangan Internal */}
      {normalizedKey === 'UNDANGAN_INTERNAL' && (
        <div className="p-3.5 rounded-xl bg-[#F0F9FA] border border-[#BCE3EB] text-xs text-[#1E5F6E] flex items-center gap-2.5 animate-in fade-in duration-150">
          <Building2 className="w-4 h-4 shrink-0 text-[#1E6B7B]" />
          <span>Rapat koordinasi antar unit kerja internal Sekretariat Dewan Nasional KEK.</span>
        </div>
      )}

      {/* 2. Daftar Naskah Masuk */}
      {normalizedKey === 'NASKAH_MASUK' && (
        <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2.5 animate-in fade-in duration-150">
          <label className="text-[12.5px] font-semibold text-slate-800 block">
            Asal Instansi / Pengirim Naskah Masuk (Opsional)
          </label>
          <input
            type="text"
            disabled={disabled}
            value={currentSourceOrigin}
            onChange={(e) =>
              onChange({
                category: 'NASKAH_MASUK',
                subCategory: null,
                sourceOrigin: e.target.value,
                postponeReason: '',
              })
            }
            placeholder="Contoh: Kementerian Koordinator Bidang Perekonomian / BUPP KEK Batam"
            className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 text-[13px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
          />
        </div>
      )}

      {/* 3. Disposisi Sekjen */}
      {normalizedKey === 'DISPOSISI_SEKJEN' && (
        <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-2.5 animate-in fade-in duration-150">
          <label className="text-[12.5px] font-semibold text-slate-800 block">
            Nomor Agenda / Catatan Disposisi Sekjen (Opsional)
          </label>
          <input
            type="text"
            disabled={disabled}
            value={currentSourceOrigin}
            onChange={(e) =>
              onChange({
                category: 'DISPOSISI_SEKJEN',
                subCategory: 'DISPOSISI_SEKJEN',
                sourceOrigin: e.target.value,
                postponeReason: '',
              })
            }
            placeholder="Contoh: No. Agenda 184 / Disposisi Sekjen perihal Percepatan Fasilitasi KEK"
            className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 text-[13px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600"
          />
        </div>
      )}

      {/* 4. Disposisi Biro */}
      {normalizedKey === 'DISPOSISI_BIRO' && (
        <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 space-y-2.5 animate-in fade-in duration-150">
          <label className="text-[12.5px] font-semibold text-slate-800 block">
            Nomor / Catatan Disposisi Biro (Opsional)
          </label>
          <input
            type="text"
            disabled={disabled}
            value={currentSourceOrigin}
            onChange={(e) =>
              onChange({
                category: 'DISPOSISI_BIRO',
                subCategory: 'DISPOSISI_BIRO',
                sourceOrigin: e.target.value,
                postponeReason: '',
              })
            }
            placeholder="Contoh: Disposisi Kepala Biro IKK No. ND-082 / Nota Dinas Internal"
            className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 text-[13px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600"
          />
        </div>
      )}

      {/* 5. Tunda Rapat */}
      {normalizedKey === 'SURAT_DITUNDA' && (
        <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-start gap-2.5 text-rose-800 text-[12.5px] leading-relaxed">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong>Informasi Penundaan Rapat:</strong> Rapat ini akan dicatat dalam kategori{' '}
              <strong>Tunda Rapat</strong>. Seluruh agenda dan tindak lanjut akan ditangguhkan hingga disahkan kembali.
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
              placeholder="Contoh: Rapat ditunda menunggu arahan lanjutan dari pimpinan / penyesuaian jadwal dinas..."
              className="w-full px-3.5 py-2 rounded-lg bg-white border border-rose-300 text-slate-800 text-[13px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-600 leading-relaxed"
            />
          </div>
        </div>
      )}
    </div>
  );
}
