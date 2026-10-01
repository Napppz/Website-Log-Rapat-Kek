'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Save, ExternalLink } from 'lucide-react';
import {
  actionItemSchema,
  ActionItemInput,
} from '@/lib/validations/action-item';
import {
  createActionItemAction,
  updateActionItemAction,
  getActionItemFormOptionsAction,
} from '@/app/actions/action-item-actions';
import { ActionItem, ActionItemPriority, ActionItemStatus } from '@/lib/types';
import {
  GoogleDriveIcon,
  extractDriveLink,
  cleanTextWithoutLink,
  normalizeUrl,
} from './google-drive-link-badge';

interface ActionItemFormDialogProps {
  isOpen: boolean;
  meetingId: string;
  actionItem?: ActionItem | null;
  availableBiros?: { id: string; code: string; shortName: string; name: string }[];
  availableUsers?: { id: string; name: string; email?: string; biroId?: string }[];
  lockedBiroCode?: string;
  onClose: () => void;
  onSuccess?: (item: any) => void;
}

export function ActionItemFormDialog({
  isOpen,
  meetingId,
  actionItem,
  availableBiros = [],
  availableUsers = [],
  lockedBiroCode,
  onClose,
  onSuccess,
}: ActionItemFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const isEditing = Boolean(actionItem);

  // Resilient biros, users, and teams state with auto-fetch
  const [birosList, setBirosList] = useState(availableBiros);
  const [usersList, setUsersList] = useState(availableUsers);
  const [teamsList, setTeamsList] = useState<Array<{ id: string; biroId: string; code: string; name: string; description?: string | null }>>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  // Sync state if props change
  useEffect(() => {
    if (availableBiros.length > 0) {
      setBirosList(availableBiros);
    }
  }, [availableBiros]);

  useEffect(() => {
    if (availableUsers.length > 0) {
      setUsersList(availableUsers);
    }
  }, [availableUsers]);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [driveLink, setDriveLink] = useState('');
  const [picBiroId, setPicBiroId] = useState('');
  const [picTeamId, setPicTeamId] = useState('');
  const [picUserId, setPicUserId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<ActionItemPriority>('MEDIUM');
  const [status, setStatus] = useState<ActionItemStatus>('PENDING');

  // Auto-fetch biros, users & teams if not passed via props or currently empty
  useEffect(() => {
    if (isOpen && (birosList.length === 0 || teamsList.length === 0)) {
      setIsLoadingOptions(true);
      getActionItemFormOptionsAction()
        .then((res) => {
          if (res.success) {
            if (res.biros && res.biros.length > 0) {
              setBirosList(res.biros);
              setPicBiroId((prev) => (prev ? prev : res.biros[0]?.id || ''));
            }
            if (res.users && res.users.length > 0) {
              setUsersList(res.users);
            }
            if (res.teams && res.teams.length > 0) {
              setTeamsList(res.teams);
            }
          }
        })
        .finally(() => {
          setIsLoadingOptions(false);
        });
    }
  }, [isOpen, birosList.length, teamsList.length]);

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
        const foundDrive = extractDriveLink(actionItem.description);
        if (foundDrive) {
          setDriveLink(foundDrive);
          setDescription(cleanTextWithoutLink(actionItem.description));
        } else {
          setDriveLink('');
          setDescription(actionItem.description || '');
        }
        setPicBiroId(actionItem.picBiroId || (birosList[0]?.id ?? ''));
        setPicTeamId(actionItem.picTeamId || '');
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
        setDriveLink('');
        const matchingBiro = lockedBiroCode
          ? birosList.find((b) => b.code.toUpperCase() === lockedBiroCode.toUpperCase())
          : null;
        setPicBiroId(matchingBiro?.id || birosList[0]?.id || '');
        setPicTeamId('');
        setPicUserId('');
        setDueDate(`${yyyy}-${mm}-${dd}`);
        setPriority('MEDIUM');
        setStatus('PENDING');
      }
    }
  }, [isOpen, actionItem, birosList, lockedBiroCode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    let finalDescription = description.trim();
    if (driveLink.trim()) {
      const formattedLink = normalizeUrl(driveLink);
      finalDescription = finalDescription
        ? `${finalDescription}\n\n📎 Tautan Google Drive: ${formattedLink}`
        : `📎 Tautan Google Drive: ${formattedLink}`;
    }

    // Zod client validation
    const rawData = {
      meetingId,
      title,
      description: finalDescription || null,
      picBiroId,
      picTeamId: picTeamId && picTeamId.trim() !== '' ? picTeamId : null,
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
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F8FAFC] border-b border-slate-200">
          <div>
            <span className="text-[11px] font-bold text-[#31889C] uppercase tracking-wider">
              {isEditing ? 'Perbarui Matriks' : 'Matriks Tindak Lanjut'}
            </span>
            <h2 className="text-[18px] font-bold text-slate-900">
              {isEditing ? 'Ubah Butir Tindak Lanjut' : 'Tambah Tindak Lanjut Rapat'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
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
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#31889C]/30 focus:border-[#31889C] font-medium text-slate-900 text-[13px]"
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
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#31889C]/30 focus:border-[#31889C] text-slate-800 text-[13px]"
              />
            </div>

            {/* Tautan Google Drive / Dokumen Rujukan (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[12px] font-bold text-slate-800 flex items-center gap-1.5">
                  <GoogleDriveIcon className="w-3.5 h-3.5" />
                  <span>Tautan Google Drive / Dokumen Rujukan <span className="text-slate-400 font-normal">(Opsional)</span></span>
                </label>
                <span className="text-[10.5px] text-slate-400">
                  Folder Drive, Kerangka Acuan, atau Dokumen Terkait
                </span>
              </div>
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/... atau https://docs.google.com/..."
                  value={driveLink}
                  onChange={(e) => setDriveLink(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#31889C]/30 focus:border-[#31889C] text-slate-800 text-[13px] font-mono"
                />
                <div className="absolute left-3 top-2.5 pointer-events-none">
                  <GoogleDriveIcon className="w-4 h-4" />
                </div>
              </div>
              {driveLink.trim() && (
                <div className="mt-2 flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#E8F5F7] border border-[#BCE3EB]">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <GoogleDriveIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[11.5px] text-[#215865] truncate font-mono">
                      {normalizeUrl(driveLink)}
                    </span>
                  </div>
                  <a
                    href={normalizeUrl(driveLink)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#31889C] hover:bg-[#266F80] text-white text-[11px] font-bold shrink-0 transition-colors shadow-2xs cursor-pointer"
                    title="Klik untuk langsung membuka dan menguji tautan di Google Drive"
                  >
                    <span>Uji / Buka Langsung</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              <p className="mt-1 text-[11px] text-slate-400">
                Tautkan Google Drive bahan rujukan agar PIC biro dapat langsung mengakses dokumen pendukung tugas ini.
              </p>
            </div>

            {/* Biro PIC, Tim Kerja & User PIC Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Biro Penanggung Jawab (Required, 5 Official Bureaus) */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Biro Penanggung Jawab <span className="text-red-500">*</span>
                </label>
                {lockedBiroCode ? (
                  <div className="w-full px-3 py-2 rounded-lg border border-[#BCE3EB] bg-[#F0F9FA] text-[#215865] font-semibold text-[13px] flex items-center justify-between">
                    <span>Biro {lockedBiroCode}</span>
                    <span className="text-[11px] text-slate-500 font-normal">(Terkunci sesuai akun)</span>
                  </div>
                ) : (
                  <select
                    value={picBiroId}
                    onChange={(e) => {
                      setPicBiroId(e.target.value);
                      setPicTeamId('');
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#31889C]/30 focus:border-[#31889C] bg-white font-medium text-slate-800 text-[13px] cursor-pointer"
                  >
                    <option value="">
                      {isLoadingOptions ? '-- Memuat Biro... --' : '-- Pilih Biro --'}
                    </option>
                    {birosList.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code} — {b.shortName || b.name}
                      </option>
                    ))}
                  </select>
                )}
                {fieldErrors.picBiroId && (
                  <p className="mt-1 text-[11px] text-red-600 font-semibold">{fieldErrors.picBiroId}</p>
                )}
              </div>

              {/* Tim Kerja PIC (Optional) */}
              <div>
                {(() => {
                  const filteredTeams = teamsList.filter((t) => t.biroId === picBiroId);
                  return (
                    <>
                      <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                        <span>Tim Kerja <span className="text-slate-400 font-normal">(Opsional)</span></span>
                        {filteredTeams.length > 0 && (
                          <span className="text-[10px] font-bold text-[#215865] bg-[#F0F9FA] px-1.5 py-0.2 rounded border border-[#BCE3EB]">
                            {filteredTeams.length} Tim
                          </span>
                        )}
                      </label>
                      <select
                        value={picTeamId}
                        onChange={(e) => setPicTeamId(e.target.value)}
                        disabled={filteredTeams.length === 0}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#31889C]/30 focus:border-[#31889C] bg-white text-slate-800 text-[13px] cursor-pointer disabled:bg-slate-50 disabled:text-slate-400"
                      >
                        <option value="">
                          {filteredTeams.length > 0 ? '-- Semua / Bebas --' : '-- Menyusul --'}
                        </option>
                        {filteredTeams.map((t) => (
                          <option key={t.id} value={t.id}>
                            [{t.code}] Tim {t.name}
                          </option>
                        ))}
                      </select>
                    </>
                  );
                })()}
              </div>

              {/* PIC Pengguna (Optional) */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Pejabat / PIC <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <select
                  value={picUserId}
                  onChange={(e) => setPicUserId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#31889C]/30 focus:border-[#31889C] bg-white text-slate-800 text-[13px] cursor-pointer"
                >
                  <option value="">-- Belum Ditentukan --</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} {u.email ? `(${u.email})` : ''}
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
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#31889C]/30 focus:border-[#31889C] bg-white text-slate-800 text-[13px]"
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
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#31889C]/30 focus:border-[#31889C] bg-white font-medium text-slate-800 text-[13px] cursor-pointer"
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
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#31889C]/30 focus:border-[#31889C] bg-white font-medium text-slate-800 text-[13px] cursor-pointer"
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#31889C] hover:bg-[#266F80] text-white font-semibold text-[13px] shadow-sm transition-all cursor-pointer disabled:opacity-50"
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
