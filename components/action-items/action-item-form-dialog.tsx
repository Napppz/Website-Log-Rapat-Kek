'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Save } from 'lucide-react';
import {
  actionItemSchema,
  ActionItemInput,
} from '@/lib/validations/action-item';
import { createActionItemAction, updateActionItemAction } from '@/app/actions/action-item-actions';
import { ActionItem, ActionItemPriority, ActionItemStatus } from '@/lib/types';

interface ActionItemFormDialogProps {
  isOpen: boolean;
  meetingId: string;
  actionItem?: ActionItem | null;
  availableBiros?: { id: string; code: string; shortName: string; name: string }[];
  availableUsers?: { id: string; name: string; email?: string; biroId?: string }[];
  onClose: () => void;
  onSuccess?: (item: any) => void;
}

export function ActionItemFormDialog({
  isOpen,
  meetingId,
  actionItem,
  availableBiros = [],
  availableUsers = [],
  onClose,
  onSuccess,
}: ActionItemFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const isEditing = Boolean(actionItem);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [picBiroId, setPicBiroId] = useState('');
  const [picUserId, setPicUserId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<ActionItemPriority>('MEDIUM');
  const [status, setStatus] = useState<ActionItemStatus>('PENDING');

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setFieldErrors({});

      if (actionItem) {
        const due = new Date(actionItem.dueDate);
        const yyyy = due.getFullYear();
        const mm = String(due.getMonth() + 1).padStart(2, '0');
        const dd = String(due.getDate()).padStart(2, '0');

        setTitle(actionItem.title || '');
        setDescription(actionItem.description || '');
        setPicBiroId(actionItem.picBiroId || (availableBiros[0]?.id ?? ''));
        setPicUserId(actionItem.picUserId || '');
        setDueDate(`${yyyy}-${mm}-${dd}`);
        setPriority(actionItem.priority || 'MEDIUM');
        setStatus(actionItem.status || 'PENDING');
      } else {
        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const yyyy = nextWeek.getFullYear();
        const mm = String(nextWeek.getMonth() + 1).padStart(2, '0');
        const dd = String(nextWeek.getDate()).padStart(2, '0');

        setTitle('');
        setDescription('');
        setPicBiroId(availableBiros[0]?.id || '');
        setPicUserId('');
        setDueDate(`${yyyy}-${mm}-${dd}`);
        setPriority('MEDIUM');
        setStatus('PENDING');
      }
    }
  }, [isOpen, actionItem, availableBiros]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    // Zod client validation
    const rawData = {
      meetingId,
      title,
      description: description || null,
      picBiroId,
      picUserId: picUserId && picUserId.trim() !== '' ? picUserId : null,
      dueDate,
      priority,
      status,
    };

    const parsed = actionItemSchema.safeParse(rawData);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const fieldName = String(issue.path[0]);
        errs[fieldName] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: ActionItemInput = parsed.data;

      let res;
      if (isEditing && actionItem) {
        res = await updateActionItemAction({
          ...payload,
          id: actionItem.id,
        });
      } else {
        res = await createActionItemAction(payload);
      }

      if (res.success) {
        onClose();
        if (onSuccess) onSuccess(res.data);
      } else {
        setErrorMessage(res.error || 'Gagal menyimpan tindak lanjut.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-amber-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-50 to-amber-100/60 border-b border-amber-200">
          <div>
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
              {isEditing ? 'Perbarui Matriks' : 'Matriks Tindak Lanjut'}
            </span>
            <h2 className="text-[18px] font-bold text-slate-900">
              {isEditing ? 'Ubah Butir Tindak Lanjut' : 'Tambah Tindak Lanjut Rapat'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-amber-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-4 text-[13px]">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2 text-[12px]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Judul Tindak Lanjut (Required) */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Judul Tindak Lanjut <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Menyusun laporan progres pembangunan infrastruktur KEK"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-900 text-[13px]"
              />
              {fieldErrors.title && (
                <p className="mt-1 text-[11px] text-red-600 font-semibold">{fieldErrors.title}</p>
              )}
            </div>

            {/* Deskripsi (Optional) */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Deskripsi / Catatan Tambahan <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Rincian ruang lingkup arahan, output dokumen yang diharapkan, atau koordinasi lintas instansi..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 text-[13px]"
              />
            </div>

            {/* Biro PIC & User PIC Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Biro Penanggung Jawab (Required, 5 Official Bureaus) */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Biro Penanggung Jawab <span className="text-red-500">*</span>
                </label>
                <select
                  value={picBiroId}
                  onChange={(e) => setPicBiroId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-medium text-slate-800 text-[13px] cursor-pointer"
                >
                  <option value="">-- Pilih Biro Resmi KEK --</option>
                  {availableBiros.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} — {b.shortName}
                    </option>
                  ))}
                </select>
                {fieldErrors.picBiroId && (
                  <p className="mt-1 text-[11px] text-red-600 font-semibold">{fieldErrors.picBiroId}</p>
                )}
              </div>

              {/* PIC Pengguna (Optional) */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Pejabat / PIC Pengguna <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <select
                  value={picUserId}
                  onChange={(e) => setPicUserId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-slate-800 text-[13px] cursor-pointer"
                >
                  <option value="">-- Belum Ditentukan (Semua Tim) --</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Deadline, Prioritas, Status Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Deadline (Required) */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Tenggat Waktu / Deadline <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-slate-800 text-[13px]"
                />
                {fieldErrors.dueDate && (
                  <p className="mt-1 text-[11px] text-red-600 font-semibold">{fieldErrors.dueDate}</p>
                )}
              </div>

              {/* Prioritas */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Tingkat Prioritas
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as ActionItemPriority)}
                  className="w-full px-3 py-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-medium text-slate-800 text-[13px] cursor-pointer"
                >
                  <option value="LOW">Rendah (LOW)</option>
                  <option value="MEDIUM">Sedang (MEDIUM)</option>
                  <option value="HIGH">Tinggi (HIGH)</option>
                  <option value="URGENT">Sangat Mendesak (URGENT)</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Status Pengerjaan
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ActionItemStatus)}
                  className="w-full px-3 py-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-medium text-slate-800 text-[13px] cursor-pointer"
                >
                  <option value="PENDING">Belum Dimulai (PENDING)</option>
                  <option value="IN_PROGRESS">Sedang Berjalan (IN_PROGRESS)</option>
                  <option value="COMPLETED">Selesai (COMPLETED)</option>
                  <option value="OVERDUE">Terlambat (OVERDUE)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[13px] shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Buat Tindak Lanjut'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
