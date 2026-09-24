'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Building2, Plus } from 'lucide-react';
import { BIRO_LIST } from '@/lib/mock-data';
import { BiroCode } from '@/lib/types';

interface CreateMeetingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateMeetingDialog({ isOpen, onClose, onSuccess }: CreateMeetingDialogProps) {
  const [selectedBiro, setSelectedBiro] = useState<BiroCode>('IKK');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('2026-09-25');
  const [time, setTime] = useState('09:00 - 12:00 WIB');
  const [location, setLocation] = useState('Ruang Rapat Utama Gedung Posko KEK & Hybrid Zoom');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { createMeetingAction } = await import('@/app/actions/meeting-actions');
      const parts = time.split('-').map((s) => s.trim().replace('WIB', '').trim());
      const startTime = parts[0] || '09:00';
      const endTime = parts[1] || '12:00';

      const res = await createMeetingAction({
        title,
        biroCode: selectedBiro,
        date,
        startTime,
        endTime,
        location,
      });

      if (res.success && res.data) {
        alert(`Rapat "${title}" berhasil disimpan di Neon DB dengan nomor otomatis: ${res.data.meetingNumber}`);
        setTitle('');
        if (onSuccess) onSuccess();
        onClose();
        window.location.reload();
      } else {
        alert(res.error || 'Gagal membuat rapat');
      }
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err?.message || 'Gagal menyimpan rapat'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-amber-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-50 to-amber-100/60 border-b border-amber-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
            <h3 className="font-bold text-[16px] text-slate-900">
              Jadwalkan Rapat Baru KEK
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-amber-200/50 transition-colors cursor-pointer"
            title="Tutup Dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-[13px]">
          {/* Biro Pelaksana */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-600" />
              Biro Penyelenggara
            </label>
            <select
              value={selectedBiro}
              onChange={(e) => setSelectedBiro(e.target.value as BiroCode)}
              className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {BIRO_LIST.map((biro) => (
                <option key={biro.code} value={biro.code}>
                  {biro.code} — {biro.name}
                </option>
              ))}
            </select>
          </div>

          {/* Agenda / Judul Rapat */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Agenda / Judul Rapat <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Rapat Koordinasi Fasilitasi Investasi KEK Sorong & Kendal..."
              className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Tanggal & Waktu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600" />
                Tanggal Pelaksanaan <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                Waktu Pelaksanaan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Lokasi */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-600" />
              Lokasi / Media Pertemuan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ruang Rapat Utama & Zoom..."
              className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 text-white font-semibold text-[13px] hover:bg-amber-700 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Jadwalkan Rapat</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
