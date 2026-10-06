'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Plus,
  Link2,
  Paperclip,
  UploadCloud,
  Loader2,
  FileCheck,
  Trash2,
} from 'lucide-react';
import { BIRO_LIST } from '@/lib/mock-data';
import { BiroCode } from '@/lib/types';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/providers/toast-provider';
import { uploadInvitationFileAction } from '@/app/actions/meeting-upload-actions';

interface CreateMeetingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateMeetingDialog({ isOpen, onClose, onSuccess }: CreateMeetingDialogProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'VIEWER';
  const canCreate = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'NOTULIS';

  // Today's date in YYYY-MM-DD format (prevents past date selection)
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const [selectedBiro, setSelectedBiro] = useState<BiroCode>('IKK');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState('09:00 - 12:00 WIB');
  const [location, setLocation] = useState('Ruang Rapat Utama Gedung Posko KEK & Hybrid Zoom');
  const [previousMeetingId, setPreviousMeetingId] = useState<string>('');
  const [availableMeetings, setAvailableMeetings] = useState<any[]>([]);

  // Invitation Document State
  const [invitationDoc, setInvitationDoc] = useState<{
    url: string;
    name: string;
    size: number;
  } | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Load meeting options when dialog opens
  useEffect(() => {
    if (isOpen) {
      import('@/app/actions/meeting-actions').then(({ getMeetingOptionsAction }) => {
        getMeetingOptionsAction().then((res) => {
          if (res.success && res.data) {
            setAvailableMeetings(res.data);
          }
        });
      });
    }
  }, [isOpen]);

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

  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !canCreate) return null;

  const handleUploadFile = async (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      toast.error('Ukuran berkas melebihi batas 25MB.');
      return;
    }
    setIsUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadInvitationFileAction(formData);
      if (res.success && res.data) {
        setInvitationDoc({
          url: res.data.url,
          name: res.data.name,
          size: res.data.size,
        });
        toast.success(`Surat undangan "${res.data.name}" terlampir.`);
      } else {
        toast.error(res.error || 'Gagal mengunggah dokumen undangan');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal mengunggah dokumen undangan');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (date && date < todayStr) {
        toast.error('Tanggal pelaksanaan rapat tidak boleh sebelum hari ini (tidak bisa mundur).');
        setSubmitting(false);
        return;
      }

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
        previousMeetingId: previousMeetingId || undefined,
        invitationDocUrl: invitationDoc?.url || undefined,
        invitationDocName: invitationDoc?.name || undefined,
        invitationDocSize: invitationDoc?.size || undefined,
      });

      if (res.success && res.data) {
        toast.success(`Rapat "${title}" (${res.data.meetingNumber}) berhasil disimpan ke database.`);
        setTitle('');
        setInvitationDoc(null);
        router.refresh();
        router.push(`/semua-rapat/${res.data.id}?calendar=true`);
      } else {
        toast.error(res.error || 'Gagal membuat rapat');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyimpan rapat');
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
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F8FAFC] border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#31889C]"></span>
            <h3 className="font-bold text-[16px] text-slate-900">
              Jadwalkan Rapat Baru KEK
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
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
              <Building2 className="w-4 h-4 text-[#31889C]" />
              Biro Penyelenggara
            </label>
            <select
              value={selectedBiro}
              onChange={(e) => setSelectedBiro(e.target.value as BiroCode)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 focus:border-[#31889C]"
            >
              {BIRO_LIST.map((biro) => (
                <option key={biro.code} value={biro.code}>
                  {biro.code} — {biro.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rapat Sebelumnya (Opsional) */}
          <div className="p-3 bg-[#F0F9FA] rounded-xl border border-[#BCE3EB] space-y-1">
            <label className="block font-semibold text-slate-800 text-[12px] flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-[#31889C]" />
              <span>Rapat Sebelumnya (Opsional — Rapat Lanjutan)</span>
            </label>
            <select
              value={previousMeetingId}
              onChange={(e) => setPreviousMeetingId(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-[12px] focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 focus:border-[#31889C]"
            >
              <option value="">-- Bukan Rapat Lanjutan (Rapat Baru) --</option>
              {availableMeetings.map((m) => (
                <option key={m.id} value={m.id}>
                  [{m.meetingNumber}] {m.title}
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
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 focus:border-[#31889C]"
            />
          </div>

          {/* Tanggal & Waktu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#31889C]" />
                  <span>Tanggal Pelaksanaan</span> <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  Min. Hari Ini
                </span>
              </div>
              <input
                type="date"
                required
                min={todayStr}
                value={date}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && val < todayStr) {
                    toast.error('Tanggal pelaksanaan rapat tidak bisa mundur (tidak boleh sebelum hari ini).');
                    setDate(todayStr);
                  } else {
                    setDate(val);
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 focus:border-[#31889C]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#31889C]" />
                Waktu Pelaksanaan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 focus:border-[#31889C]"
              />
            </div>
          </div>

          {/* Lokasi */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#31889C]" />
              Lokasi / Media Pertemuan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ruang Rapat Utama & Zoom..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 focus:border-[#31889C]"
            />
          </div>

          {/* Lampiran Dokumen Undangan Rapat */}
          <div className="p-3 bg-[#F0F9FA] rounded-xl border border-[#BCE3EB] space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-slate-800 text-[12px] flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-[#31889C]" />
                <span>Dokumen Undangan Resmi</span>
                <span className="text-slate-400 font-normal text-[11px]">(Opsional)</span>
              </label>
              <span className="text-[10px] text-slate-500">PDF, Word, JPG, PNG (Maks 25MB)</span>
            </div>

            <input
              ref={docInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.txt"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUploadFile(f);
              }}
            />

            {!invitationDoc ? (
              <button
                type="button"
                disabled={isUploadingDoc}
                onClick={() => docInputRef.current?.click()}
                className="w-full py-2 px-3 border border-dashed border-[#31889C]/50 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-[12px] font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
              >
                {isUploadingDoc ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#31889C]" />
                    <span>Mengunggah dokumen undangan...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 text-[#31889C]" />
                    <span>Lampirkan Berkas Surat Undangan</span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-teal-200 shadow-2xs">
                <div className="flex items-center gap-2 min-w-0">
                  <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-[12px] font-bold text-slate-800 truncate max-w-[240px]">
                    {invitationDoc.name}
                  </span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold shrink-0">
                    Terlampir
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setInvitationDoc(null);
                    if (docInputRef.current) docInputRef.current.value = '';
                  }}
                  className="p-1 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                  title="Hapus lampiran"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#31889C] text-white font-semibold text-[13px] hover:bg-[#266F80] shadow-sm transition-all cursor-pointer"
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
