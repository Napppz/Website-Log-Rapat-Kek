'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  PlusCircle,
  Users,
  FileText,
  Calendar,
  Sparkles,
  Loader2,
  CheckCircle2,
  Link2,
} from 'lucide-react';
import { toast } from '@/components/providers/toast-provider';
import { createPicDeliverableAction } from '@/app/actions/pic-deliverable-actions';
import { ActionItemPriority } from '@prisma/client';
import { cn } from '@/lib/utils';

interface AddPicDeliverableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  meetingTitle: string;
  meetingDate?: string | Date;
  participants?: Array<{
    user: {
      id: string;
      name: string;
      email?: string | null;
      role?: string | null;
      team?: { name?: string | null } | null;
    };
  }>;
  availableUsers?: Array<{
    id: string;
    name: string;
    email?: string | null;
    role?: string | null;
  }>;
  onSuccess?: () => void;
}

const DELIVERABLE_PRESETS = [
  'Drafting & Distribusi Press Release Media',
  'Bahan Tayang Paparan & Notula Risalah',
  'Dokumentasi Foto & Video Kegiatan',
  'Penyusunan Nota Dinas & Administrasi',
  'Koordinasi Teknis & Narasumber',
  'Pelaporan Output Kegiatan',
];

export function AddPicDeliverableDialog({
  isOpen,
  onClose,
  meetingId,
  meetingTitle,
  meetingDate,
  participants = [],
  availableUsers = [],
  onSuccess,
}: AddPicDeliverableDialogProps) {
  const router = useRouter();

  // Combine participants and available users uniquely
  const participantUsers = participants
    .map((p) => p.user)
    .filter(Boolean);

  const userList = participantUsers.length > 0 ? participantUsers : availableUsers;

  const [title, setTitle] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>(
    userList[0]?.id || ''
  );
  const [priority, setPriority] = useState<ActionItemPriority>(
    ActionItemPriority.HIGH
  );
  const [dueDate, setDueDate] = useState<string>(() => {
    if (meetingDate) {
      const d = new Date(meetingDate);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Judul penugasan / output PIC wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createPicDeliverableAction({
        meetingId,
        title: title.trim(),
        picUserId: selectedUserId || null,
        dueDate,
        priority,
        notes: notes.trim() || null,
        linkUrl: null,
        linkTitle: null,
      });

      if (res.success) {
        toast.success(`Penugasan "${title}" berhasil ditambahkan!`);
        onSuccess?.();
        router.refresh();
        onClose();
        setTitle('');
        setNotes('');
      } else {
        toast.error(res.error || 'Gagal menambahkan penugasan PIC.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#175360] to-[#1E6B7B] px-6 py-4 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-teal-200 border border-white/20 shadow-xs">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-teal-100/80">Penugasan Kerja PIC</span>
              <h2 className="text-[17px] font-bold text-white mt-0.5">
                Pilih &amp; Berikan Tugas PIC
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* PIC Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>1. Pilih PIC Penanggung Jawab</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                {userList.length} Staf / PIC Tersedia
              </span>
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full text-xs sm:text-[13px] rounded-xl border border-slate-300 p-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B]"
            >
              {userList.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} {u.role ? `(${u.role})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Title & Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                2. Pilih atau Ketik Judul Tugas PIC
              </label>
              <span className="text-[10.5px] text-slate-500">Klik salah satu opsi tugas di bawah:</span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5">
              {DELIVERABLE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTitle(preset)}
                  className={cn(
                    "text-[11.5px] px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-medium text-left",
                    title === preset
                      ? "bg-[#1E6B7B] text-white border-[#1E6B7B] shadow-2xs font-bold"
                      : "bg-slate-50 hover:bg-[#F0F9FA] hover:text-[#1E6B7B] border-slate-200 text-slate-700"
                  )}
                >
                  {title === preset ? '✓ ' : '+ '}
                  {preset}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Atau ketik judul tugas kustom..."
              className="w-full text-xs sm:text-[13px] rounded-xl border border-slate-300 p-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B]"
              required
            />
          </div>

          {/* Due Date & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Tenggat Waktu</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Skala Prioritas
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ActionItemPriority)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B]"
              >
                <option value={ActionItemPriority.LOW}>Rendah (Low)</option>
                <option value={ActionItemPriority.MEDIUM}>Sedang (Medium)</option>
                <option value={ActionItemPriority.HIGH}>Tinggi (High)</option>
                <option value={ActionItemPriority.URGENT}>Mendesak (Urgent)</option>
              </select>
            </div>
          </div>

          {/* Instruksi / Catatan Penugasan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Instruksi / Catatan Penugasan
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instruksi singkat atau catatan khusus untuk PIC yang ditugaskan..."
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B] resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-white transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#175360] to-[#1E6B7B] hover:from-[#13424d] hover:to-[#175360] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan &amp; Berikan Tugas ke PIC</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
