'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Video,
  Building2,
  Layers,
  Plus,
  Trash2,
  X,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  KeyRound,
  Hash,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/providers/toast-provider';

export type MeetingType = 'OFFLINE' | 'HYBRID' | 'ONLINE';

export interface LocationPickerProps {
  meetingType: MeetingType;
  onMeetingTypeChange: (type: MeetingType) => void;
  physicalLocation: string;
  onPhysicalLocationChange: (loc: string) => void;
  zoomUrl: string;
  onZoomUrlChange: (url: string) => void;
  zoomMeetingId?: string;
  onZoomMeetingIdChange?: (id: string) => void;
  zoomPasscode?: string;
  onZoomPasscodeChange?: (pwd: string) => void;
  className?: string;
  required?: boolean;
}

const DEFAULT_PRESET_LOCATIONS: string[] = [
  'Ruang Rapat Utama Gedung Posko KEK',
  'Ruang Rapat Ali Sadikin Lantai 3',
  'Ruang Rapat Sekretariat Dewan KEK',
  'Auditorium Graha Sawala KEK',
  'Hotel Grand Mercure Jakarta Harmoni',
  'Hotel Borobudur Jakarta',
];

const STORAGE_KEY = 'kek_saved_meeting_locations';

export function LocationPicker({
  meetingType,
  onMeetingTypeChange,
  physicalLocation,
  onPhysicalLocationChange,
  zoomUrl,
  onZoomUrlChange,
  zoomMeetingId = '',
  onZoomMeetingIdChange,
  zoomPasscode = '',
  onZoomPasscodeChange,
  className,
  required = true,
}: LocationPickerProps) {
  const [savedLocations, setSavedLocations] = useState<string[]>(DEFAULT_PRESET_LOCATIONS);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newLocationInput, setNewLocationInput] = useState('');
  const [showAdvancedZoom, setShowAdvancedZoom] = useState(false);
  const [copiedZoom, setCopiedZoom] = useState(false);

  // Load saved presets from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedLocations(parsed);
        }
      }
    } catch {
      // ignore JSON parse error
    }
  }, []);

  // Save presets to localStorage helper
  const persistLocations = (locations: string[]) => {
    setSavedLocations(locations);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
    } catch {
      // ignore localStorage quota errors
    }
  };

  // Quick Add new location to presets
  const handleAddLocation = (locToAdd?: string) => {
    const target = (locToAdd !== undefined ? locToAdd : newLocationInput).trim();
    if (!target) {
      toast.error('Masukkan nama ruangan atau lokasi fisik terlebih dahulu.');
      return;
    }

    if (savedLocations.some((item) => item.toLowerCase() === target.toLowerCase())) {
      toast.info(`Lokasi "${target}" sudah ada di daftar cepat.`);
      onPhysicalLocationChange(target);
      setIsAddingCustom(false);
      setNewLocationInput('');
      return;
    }

    const updated = [target, ...savedLocations];
    persistLocations(updated);
    onPhysicalLocationChange(target);
    setIsAddingCustom(false);
    setNewLocationInput('');
    toast.success(`Lokasi "${target}" berhasil ditambahkan ke daftar cepat!`);
  };

  // Quick Delete location from presets
  const handleDeleteLocation = (locToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedLocations.filter((item) => item !== locToDelete);
    persistLocations(updated);
    toast.info(`Lokasi "${locToDelete}" dihapus dari daftar cepat.`);
  };

  // Reset to default presets
  const handleResetDefaults = () => {
    persistLocations(DEFAULT_PRESET_LOCATIONS);
    toast.success('Daftar lokasi cepat dikembalikan ke pengaturan default.');
  };

  // Copy Zoom URL
  const handleCopyZoomUrl = async () => {
    if (!zoomUrl) return;
    try {
      await navigator.clipboard.writeText(zoomUrl);
      setCopiedZoom(true);
      toast.success('Tautan Zoom berhasil disalin ke clipboard!');
      setTimeout(() => setCopiedZoom(false), 2000);
    } catch {
      toast.error('Gagal menyalin tautan Zoom');
    }
  };

  const isCurrentInPresets = savedLocations.some(
    (item) => item.toLowerCase() === physicalLocation.trim().toLowerCase()
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* 1. Pilih Tipe / Format Pertemuan */}
      <div>
        <label className="font-semibold text-slate-800 mb-2 flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#1E6B7B]" />
            <span>Format Pertemuan Sidang</span>
            <span className="text-red-500 font-bold">*</span>
          </span>
          <span className="text-xs text-slate-500 font-normal">
            Pilih metode kehadiran peserta rapat
          </span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Tatap Muka (Luring) */}
          <button
            type="button"
            onClick={() => onMeetingTypeChange('OFFLINE')}
            className={cn(
              'p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5',
              meetingType === 'OFFLINE'
                ? 'border-[#1E6B7B] bg-[#F0F8FA] text-[#174853] ring-2 ring-[#1E6B7B]/20 shadow-xs'
                : 'border-slate-200 bg-white hover:bg-slate-50/80 text-slate-700'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center',
                    meetingType === 'OFFLINE'
                      ? 'bg-[#1E6B7B] text-white'
                      : 'bg-slate-100 text-slate-600'
                  )}
                >
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs">Tatap Muka</span>
              </div>
              <span
                className={cn(
                  'text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded',
                  meetingType === 'OFFLINE'
                    ? 'bg-[#1E6B7B]/15 text-[#174853]'
                    : 'bg-slate-100 text-slate-500'
                )}
              >
                Luring
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Pertemuan fisik langsung di ruang rapat gedung
            </p>
          </button>

          {/* Hybrid (Fisik & Zoom) */}
          <button
            type="button"
            onClick={() => onMeetingTypeChange('HYBRID')}
            className={cn(
              'p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5',
              meetingType === 'HYBRID'
                ? 'border-[#1E6B7B] bg-[#F0F8FA] text-[#174853] ring-2 ring-[#1E6B7B]/20 shadow-xs'
                : 'border-slate-200 bg-white hover:bg-slate-50/80 text-slate-700'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center',
                    meetingType === 'HYBRID'
                      ? 'bg-[#1E6B7B] text-white'
                      : 'bg-slate-100 text-slate-600'
                  )}
                >
                  <Layers className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs">Hybrid</span>
              </div>
              <span
                className={cn(
                  'text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded',
                  meetingType === 'HYBRID'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-500'
                )}
              >
                Fisik &amp; Zoom
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Kombinasi ruang sidang fisik dan media Zoom daring
            </p>
          </button>

          {/* Online (Daring Penuh) */}
          <button
            type="button"
            onClick={() => onMeetingTypeChange('ONLINE')}
            className={cn(
              'p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5',
              meetingType === 'ONLINE'
                ? 'border-[#1E6B7B] bg-[#F0F8FA] text-[#174853] ring-2 ring-[#1E6B7B]/20 shadow-xs'
                : 'border-slate-200 bg-white hover:bg-slate-50/80 text-slate-700'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center',
                    meetingType === 'ONLINE'
                      ? 'bg-[#0B5CFF] text-white'
                      : 'bg-slate-100 text-slate-600'
                  )}
                >
                  <Video className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs">Online</span>
              </div>
              <span
                className={cn(
                  'text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded',
                  meetingType === 'ONLINE'
                    ? 'bg-blue-100 text-[#0B5CFF]'
                    : 'bg-slate-100 text-slate-500'
                )}
              >
                Daring Zoom
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Pertemuan virtual penuh melalui ruang rapat Zoom
            </p>
          </button>
        </div>
      </div>

      {/* 2. Lokasi Fisik / Gedung (Ditampilkan untuk Tatap Muka & Hybrid, opsional/studio untuk Online) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="font-semibold text-slate-800 flex items-center gap-1.5 text-sm">
            <MapPin className="w-4 h-4 text-[#1E6B7B]" />
            <span>
              {meetingType === 'ONLINE'
                ? 'Ruang Host / Lokasi Studio (Opsional)'
                : 'Lokasi Fisik / Gedung Ruang Rapat'}
            </span>
            {meetingType !== 'ONLINE' && required && (
              <span className="text-red-500 font-bold">*</span>
            )}
          </label>

          <div className="flex items-center gap-2">
            {!isAddingCustom && (
              <button
                type="button"
                onClick={() => setIsAddingCustom(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1E6B7B] hover:text-[#174853] bg-teal-50/80 hover:bg-teal-100/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-teal-200"
                title="Tambah lokasi baru ke daftar pilihan cepat"
              >
                <Plus className="w-3 h-3" />
                <span>Tambah Lokasi Cepat</span>
              </button>
            )}
          </div>
        </div>

        {/* Form Tambah Cepat Lokasi Baru */}
        {isAddingCustom && (
          <div className="p-3 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-200/90 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 animate-in fade-in">
            <div className="relative flex-1">
              <input
                type="text"
                autoFocus
                value={newLocationInput}
                onChange={(e) => setNewLocationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLocation();
                  } else if (e.key === 'Escape') {
                    setIsAddingCustom(false);
                    setNewLocationInput('');
                  }
                }}
                placeholder="Ketik nama ruang rapat / gedung / hotel..."
                className="w-full px-3 py-1.5 rounded-lg border border-teal-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20"
              />
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleAddLocation()}
                className="px-3 py-1.5 rounded-lg bg-[#1E6B7B] hover:bg-[#174853] text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                Simpan Lokasi
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingCustom(false);
                  setNewLocationInput('');
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 text-xs font-medium cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Input Lokasi Fisik */}
        <div className="relative">
          <input
            type="text"
            required={meetingType !== 'ONLINE' && required}
            value={physicalLocation}
            onChange={(e) => onPhysicalLocationChange(e.target.value)}
            placeholder={
              meetingType === 'ONLINE'
                ? 'Online / Daring (Zoom Cloud Meeting)'
                : 'Contoh: Ruang Rapat Utama Gedung Posko KEK'
            }
            className="w-full pl-4 pr-10 h-[44px] rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B] shadow-2xs transition-all"
          />
          {physicalLocation && (
            <button
              type="button"
              onClick={() => onPhysicalLocationChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
              title="Bersihkan input lokasi"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Suggestion Chips (Pilih Cepat & Hapus) */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-semibold text-slate-600 flex items-center gap-1">
              <span>Pilihan Cepat Lokasi:</span>
              <span className="text-[10px] text-slate-400 font-normal">
                (Klik untuk isi otomatis, klik × untuk hapus)
              </span>
            </span>
            {savedLocations.length !== DEFAULT_PRESET_LOCATIONS.length && (
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-slate-400 hover:text-[#1E6B7B] flex items-center gap-1 cursor-pointer transition-colors"
                title="Kembalikan daftar lokasi ke default"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Reset Default</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-0.5">
            {savedLocations.map((loc) => {
              const isSelected = physicalLocation.trim().toLowerCase() === loc.toLowerCase();
              return (
                <div
                  key={loc}
                  onClick={() => onPhysicalLocationChange(loc)}
                  className={cn(
                    'group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer select-none',
                    isSelected
                      ? 'bg-[#1E6B7B] text-white border-[#1E6B7B] shadow-2xs font-semibold'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                  )}
                  title={`Gunakan "${loc}"`}
                >
                  <MapPin
                    className={cn(
                      'w-3 h-3 shrink-0',
                      isSelected ? 'text-amber-300' : 'text-slate-400 group-hover:text-[#1E6B7B]'
                    )}
                  />
                  <span className="truncate max-w-[240px] sm:max-w-none">{loc}</span>

                  {/* Tombol Hapus Cepat */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteLocation(loc, e)}
                    className={cn(
                      'p-0.5 rounded-full transition-colors cursor-pointer ml-0.5',
                      isSelected
                        ? 'text-white/70 hover:text-white hover:bg-white/20'
                        : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                    )}
                    title={`Hapus "${loc}" dari daftar cepat`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}

            {/* Quick button to save current typed location if not in presets */}
            {physicalLocation.trim() && !isCurrentInPresets && (
              <button
                type="button"
                onClick={() => handleAddLocation(physicalLocation)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 transition-colors cursor-pointer"
                title={`Simpan "${physicalLocation}" ke daftar cepat`}
              >
                <Plus className="w-3 h-3" />
                <span>Simpan &ldquo;{physicalLocation.slice(0, 20)}...&rdquo;</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Input Tautan Zoom & Preview Interaktif (HANYA UNTUK HYBRID & ONLINE) */}
      {/* PENTING: Untuk Tatap Muka (OFFLINE), preview dan form Zoom TIDAK ditampilkan sama sekali sesuai instruksi! */}
      {meetingType !== 'OFFLINE' && (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 via-sky-50/40 to-slate-50/80 border border-blue-200/90 shadow-2xs space-y-3.5 animate-in fade-in slide-in-from-top-1">
          {/* Header Zoom Field */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0B5CFF] text-white flex items-center justify-center shadow-xs">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <label className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <span>Tautan Rapat Virtual (Link Zoom)</span>
                  <span className="text-red-500 font-bold">*</span>
                </label>
                <p className="text-[11.5px] text-slate-500">
                  Tautan akses rapat daring untuk peserta (otomatis tersinkron ke Google Kalender)
                </p>
              </div>
            </div>

            <span className="text-[10.5px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-[#0B5CFF] self-start sm:self-auto">
              Auto-Sync Kalender
            </span>
          </div>

          {/* Zoom URL Input */}
          <div className="relative">
            <input
              type="url"
              required={meetingType === 'ONLINE' || (meetingType === 'HYBRID' && required)}
              value={zoomUrl}
              onChange={(e) => onZoomUrlChange(e.target.value)}
              placeholder="Contoh: https://us04web.zoom.us/j/8219920112?pwd=kek..."
              className="w-full pl-4 pr-10 h-[42px] rounded-xl border border-blue-200 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0B5CFF]/20 focus:border-[#0B5CFF] shadow-2xs transition-all"
            />
            {zoomUrl && (
              <button
                type="button"
                onClick={() => onZoomUrlChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
                title="Bersihkan tautan Zoom"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Toggles for Meeting ID & Passcode (Optional) */}
          <div className="flex items-center justify-between pt-0.5">
            <button
              type="button"
              onClick={() => setShowAdvancedZoom(!showAdvancedZoom)}
              className="text-xs font-semibold text-[#0B5CFF] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Hash className="w-3.5 h-3.5" />
              <span>
                {showAdvancedZoom
                  ? 'Sembunyikan Meeting ID & Passcode'
                  : '+ Tambahkan Meeting ID & Passcode Rapat (Opsional)'}
              </span>
            </button>
          </div>

          {showAdvancedZoom && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white/90 rounded-xl border border-blue-100 animate-in fade-in">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Hash className="w-3 h-3 text-blue-600" />
                  <span>Meeting ID</span>
                </label>
                <input
                  type="text"
                  value={zoomMeetingId}
                  onChange={(e) => onZoomMeetingIdChange && onZoomMeetingIdChange(e.target.value)}
                  placeholder="Contoh: 821 9920 1123"
                  className="w-full px-3 h-[36px] rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B5CFF]/20 focus:border-[#0B5CFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-blue-600" />
                  <span>Passcode / Kata Sandi</span>
                </label>
                <input
                  type="text"
                  value={zoomPasscode}
                  onChange={(e) => onZoomPasscodeChange && onZoomPasscodeChange(e.target.value)}
                  placeholder="Contoh: KEK2026"
                  className="w-full px-3 h-[36px] rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B5CFF]/20 focus:border-[#0B5CFF]"
                />
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PRATINJAU INTERAKTIF LINK ZOOM                           */}
          {/* ======================================================== */}
          {zoomUrl && (
            <div className="p-3.5 rounded-xl bg-white border border-blue-200 shadow-2xs space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-blue-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pratinjau Tautan Zoom Resmi:</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  ✓ Siap Disinkron
                </span>
              </div>

              <div className="flex items-center gap-2 bg-blue-50/70 p-2.5 rounded-lg border border-blue-100 text-xs">
                <a
                  href={zoomUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-blue-700 hover:text-blue-900 underline truncate flex-1 flex items-center gap-1.5"
                  title="Klik untuk menguji buka tautan Zoom di tab baru"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{zoomUrl}</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyZoomUrl}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 text-[11px] font-bold shadow-2xs transition-colors shrink-0 cursor-pointer"
                >
                  {copiedZoom ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Salin Link</span>
                    </>
                  )}
                </button>
              </div>

              {(zoomMeetingId || zoomPasscode) && (
                <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
                  {zoomMeetingId && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-medium border border-slate-200">
                      ID: <strong className="font-mono">{zoomMeetingId}</strong>
                    </span>
                  )}
                  {zoomPasscode && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-medium border border-slate-200">
                      Passcode: <strong className="font-mono">{zoomPasscode}</strong>
                    </span>
                  )}
                </div>
              )}

              <p className="text-[11px] text-slate-500 italic leading-relaxed pt-0.5">
                💡 Tautan Zoom ini akan otomatis ditambahkan ke deskripsi Google Calendar dan pesan undangan WhatsApp bagi seluruh peserta.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
