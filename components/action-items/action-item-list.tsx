'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  User,
  Edit2,
  Trash2,
  ArrowRight,
  RotateCcw,
  Check,
} from 'lucide-react';
import { ActionItem, ActionItemStatus } from '@/lib/types';
import { ActionItemStatusBadge, ActionItemPriorityBadge } from './action-item-status-badge';
import { ActionItemFormDialog } from './action-item-form-dialog';
import { ActionItemDeleteDialog } from './action-item-delete-dialog';
import { updateActionItemStatusAction } from '@/app/actions/action-item-actions';
import { useSession } from 'next-auth/react';
import { toast } from '@/components/providers/toast-provider';

interface ActionItemListProps {
  meetingId: string;
  initialItems: ActionItem[];
  availableBiros?: { id: string; code: string; shortName: string; name: string }[];
  availableUsers?: { id: string; name: string; email?: string; biroId?: string }[];
  readOnly?: boolean;
}

export function ActionItemList({
  meetingId,
  initialItems = [],
  availableBiros = [],
  availableUsers = [],
  readOnly = false,
}: ActionItemListProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const currentUser = session?.user;
  const userRole = currentUser?.role || 'VIEWER';
  const currentUserId = currentUser?.id;

  const canCreateItem = !readOnly && (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'NOTULIS');
  const canDeleteItem = !readOnly && (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'NOTULIS');

  const canEditThisItem = (item: ActionItem) => {
    if (readOnly || userRole === 'VIEWER') return false;
    if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'NOTULIS') return true;
    if (userRole === 'STAFF') {
      return Boolean(item.picUserId && currentUserId && item.picUserId === currentUserId);
    }
    return false;
  };

  const [items, setItems] = useState<ActionItem[]>(initialItems);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ActionItem | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Compute stats
  const total = items.length;
  const completed = items.filter((i) => i.status === 'COMPLETED').length;
  const inProgress = items.filter((i) => i.status === 'IN_PROGRESS').length;
  const overdue = items.filter((i) => {
    return i.status !== 'COMPLETED' && new Date(i.dueDate).getTime() < Date.now();
  }).length;
  const pending = items.filter(
    (i) => i.status === 'PENDING' && new Date(i.dueDate).getTime() >= Date.now()
  ).length;

  const handleStatusChange = async (itemId: string, newStatus: ActionItemStatus) => {
    try {
      setUpdatingStatusId(itemId);
      const res = await updateActionItemStatusAction({ id: itemId, status: newStatus });
      if (res.success && res.data) {
        setItems((prev) =>
          prev.map((it) => (it.id === itemId ? (res.data as unknown as ActionItem) : it))
        );
        toast.success(
          newStatus === 'COMPLETED'
            ? 'Status tindak lanjut diperbarui: Selesai.'
            : newStatus === 'IN_PROGRESS'
            ? 'Status tindak lanjut diperbarui: Sedang Berjalan.'
            : 'Status tindak lanjut diperbarui: Belum Dimulai.'
        );
        router.refresh();
      } else {
        toast.error(res.error || 'Gagal mengubah status tindak lanjut.');
      }
    } catch (err: any) {
      toast.error(`Terjadi kesalahan: ${err?.message || 'Gagal mengubah status'}`);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleCreatedOrUpdated = () => {
    setIsFormOpen(false);
    setEditingItem(null);
    router.refresh();
    // Also re-fetch or reload
    window.location.reload();
  };

  const handleDeleted = () => {
    if (deletingItem) {
      setItems((prev) => prev.filter((i) => i.id !== deletingItem.id));
      setDeletingItem(null);
      router.refresh();
    }
  };

  const formatIndonesianDate = (dateVal: Date | string) => {
    try {
      return new Date(dateVal).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return String(dateVal);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Summary Banner */}
      <div className="p-5 bg-white rounded-xl border border-amber-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
            Matriks &amp; Komitmen Tindak Lanjut
          </span>
          <h3 className="text-[17px] font-bold text-slate-900 mt-0.5">
            Daftar Butir Tindak Lanjut Rapat
          </h3>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Tindak lanjut resmi hasil arahan rapat pleno dewan dan biro pelaksana KEK RI.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Metrics */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg border bg-amber-50/60 border-amber-200 text-center">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Total</span>
              <span className="text-[14px] font-bold text-amber-900">{total}</span>
            </div>

            <div className="px-3 py-1.5 rounded-lg border bg-emerald-50 border-emerald-200 text-center">
              <span className="text-[10px] text-emerald-700 font-semibold uppercase block">Selesai</span>
              <span className="text-[14px] font-bold text-emerald-800">{completed}</span>
            </div>

            <div className="px-3 py-1.5 rounded-lg border bg-amber-50 border-amber-300 text-center">
              <span className="text-[10px] text-amber-800 font-semibold uppercase block">Berjalan</span>
              <span className="text-[14px] font-bold text-amber-900">{inProgress}</span>
            </div>

            {overdue > 0 && (
              <div className="px-3 py-1.5 rounded-lg border bg-red-50 border-red-200 text-center">
                <span className="text-[10px] text-red-700 font-semibold uppercase block">Terlambat</span>
                <span className="text-[14px] font-bold text-red-800">{overdue}</span>
              </div>
            )}
          </div>

          {canCreateItem && (
            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[13px] shadow-sm transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Tindak Lanjut</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Items List */}
      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-amber-200/80 p-12 text-center shadow-xs">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-[16px] font-bold text-slate-800">
              Belum Ada Butir Tindak Lanjut
            </h4>
            <p className="text-[13px] text-slate-500 leading-relaxed">
              Rapat ini belum memiliki tindak lanjut yang terdaftar. Tambahkan butir pekerjaan dan delegasikan kepada biro pelaksana.
            </p>
            {canCreateItem && (
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setIsFormOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[13px] shadow-sm transition-all cursor-pointer mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>+ Buat Tindak Lanjut Pertama</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => {
            const isItemOverdue =
              item.status !== 'COMPLETED' && new Date(item.dueDate).getTime() < Date.now();
            const isUpdatingThis = updatingStatusId === item.id;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-amber-200/80 p-5 shadow-xs hover:border-amber-300 transition-all space-y-3"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300">
                        Item #{idx + 1}
                      </span>
                      <ActionItemStatusBadge status={item.status} isOverdue={isItemOverdue} />
                      <ActionItemPriorityBadge priority={item.priority} />
                    </div>
                    <h4 className="text-[15px] font-bold text-slate-900 pt-1 leading-snug">
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-[13px] text-slate-600 leading-relaxed pt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Actions buttons */}
                  {(canEditThisItem(item) || canDeleteItem) && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {canEditThisItem(item) && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(item);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title="Ubah Tindak Lanjut"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {canDeleteItem && (
                        <button
                          type="button"
                          onClick={() => setDeletingItem(item)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Tindak Lanjut"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Details Footer Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-amber-100 text-[12px]">
                  <div className="flex flex-wrap items-center gap-4 text-slate-600">
                    {/* Biro PIC */}
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-600" />
                      <span className="font-semibold text-slate-800">
                        {item.picBiro ? `${item.picBiro.code} - ${item.picBiro.shortName}` : 'Biro KEK'}
                      </span>
                    </div>

                    {/* User PIC */}
                    {item.picUser && (
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-slate-700">{item.picUser.name}</span>
                      </div>
                    )}

                    {/* Deadline */}
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      <span>
                        Deadline: <strong className={isItemOverdue ? 'text-red-600' : 'text-slate-800'}>
                          {formatIndonesianDate(item.dueDate)}
                        </strong>
                      </span>
                    </div>

                    {/* Completed At */}
                    {item.completedAt && (
                      <div className="flex items-center gap-1 text-emerald-700 font-medium">
                        <Check className="w-3.5 h-3.5" />
                        <span>Selesai: {formatIndonesianDate(item.completedAt)}</span>
                      </div>
                    )}
                  </div>

                  {/* Status Transition controls */}
                  {canEditThisItem(item) && (
                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                      <span className="text-[11px] font-semibold text-slate-500 px-1 hidden md:inline">
                        Ubah Progres:
                      </span>
                      <button
                        type="button"
                        disabled={item.status === 'PENDING' || isUpdatingThis}
                        onClick={() => handleStatusChange(item.id, 'PENDING')}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                          item.status === 'PENDING'
                            ? 'bg-slate-700 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Pending
                      </button>
                      <button
                        type="button"
                        disabled={item.status === 'IN_PROGRESS' || isUpdatingThis}
                        onClick={() => handleStatusChange(item.id, 'IN_PROGRESS')}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                          item.status === 'IN_PROGRESS'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-amber-100'
                        }`}
                      >
                        In Progress
                      </button>
                      <button
                        type="button"
                        disabled={item.status === 'COMPLETED' || isUpdatingThis}
                        onClick={() => handleStatusChange(item.id, 'COMPLETED')}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                          item.status === 'COMPLETED'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-emerald-100'
                        }`}
                      >
                        Completed
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Dialog for Create & Edit */}
      <ActionItemFormDialog
        isOpen={isFormOpen}
        meetingId={meetingId}
        actionItem={editingItem}
        availableBiros={availableBiros}
        availableUsers={availableUsers}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        onSuccess={handleCreatedOrUpdated}
      />

      {/* Delete Confirmation Dialog */}
      <ActionItemDeleteDialog
        isOpen={Boolean(deletingItem)}
        actionItemId={deletingItem?.id || null}
        actionItemTitle={deletingItem?.title}
        onClose={() => setDeletingItem(null)}
        onSuccess={handleDeleted}
      />
    </div>
  );
}
