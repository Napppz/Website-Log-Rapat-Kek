'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { deleteActionItemAction } from '@/app/actions/action-item-actions';

interface ActionItemDeleteDialogProps {
  isOpen: boolean;
  actionItemId: string | null;
  actionItemTitle?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ActionItemDeleteDialog({
  isOpen,
  actionItemId,
  actionItemTitle,
  onClose,
  onSuccess,
}: ActionItemDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !actionItemId) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setErrorMessage(null);
      const res = await deleteActionItemAction(actionItemId);
      if (res.success) {
        onClose();
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(res.error || 'Gagal menghapus tindak lanjut.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-red-200 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="flex-1">
              <h3 className="text-[17px] font-bold text-slate-900">
                Hapus Tindak Lanjut?
              </h3>
              <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
                Tindak lanjut ini akan dihapus secara permanen dari basis data sistem SIM-RAPAT KEK RI.
              </p>
              {actionItemTitle && (
                <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[12px] font-medium text-slate-700 italic line-clamp-2">
                  &ldquo;{actionItemTitle}&rdquo;
                </div>
              )}

              {errorMessage && (
                <p className="mt-3 text-[12px] text-red-600 font-semibold bg-red-50 p-2 rounded border border-red-200">
                  {errorMessage}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isDeleting}
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-[13px] shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeleting ? 'Menghapus...' : 'Hapus'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
