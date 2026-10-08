'use client';

import React, { useState, useMemo } from 'react';
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
  History,
  TrendingUp,
  Search,
  Filter,
  X,
} from 'lucide-react';
import { ActionItem, ActionItemStatus } from '@/lib/types';
import { ActionItemStatusBadge, ActionItemPriorityBadge } from './action-item-status-badge';
import { ActionItemFormDialog } from './action-item-form-dialog';
import { ActionItemDeleteDialog } from './action-item-delete-dialog';
import { ActionItemLogDialog } from './action-item-log-dialog';
import {
  GoogleDriveLinkCard,
  extractDriveLink,
  extractAnyLink,
  extractAllLinks,
  cleanTextWithoutLink,
  RenderTextWithLinks,
} from './google-drive-link-badge';
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
  const userRole = currentUser?.role || 'STAFF';
  const currentUserId = currentUser?.id;

  const canCreateItem =
    !readOnly &&
    (userRole === 'SUPER_ADMIN' ||
      userRole === 'ADMIN' ||
      userRole === 'STAFF');
  const canDeleteItem = !readOnly && (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN');

  const canEditThisItem = (item: ActionItem) => {
    if (readOnly) return false;
    if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') return true;
    if (userRole === 'STAFF') {
      return Boolean(item.picUserId && currentUserId && item.picUserId === currentUserId);
    }
    return false;
  };

  const [items, setItems] = useState<ActionItem[]>(initialItems);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ActionItem | null>(null);
  const [loggingItem, setLoggingItem] = useState<ActionItem | null>(null);
  const [dialogInitialTab, setDialogInitialTab] = useState<'trail' | 'update'>('update');
  const [dialogDefaultStatus, setDialogDefaultStatus] = useState<ActionItemStatus | undefined>(undefined);
  const [dialogDefaultProgress, setDialogDefaultProgress] = useState<number | undefined>(undefined);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const openUpdateDialog = (item: ActionItem, targetStatus?: ActionItemStatus, targetProgress?: number) => {
    setLoggingItem(item);
    setDialogInitialTab('update');
    setDialogDefaultStatus(targetStatus || item.status);
    setDialogDefaultProgress(
      targetProgress !== undefined
        ? targetProgress
        : targetStatus === 'COMPLETED'
        ? 100
        : item.latestProgress
    );
  };

  const openAuditTrailDialog = (item: ActionItem) => {
    setLoggingItem(item);
    setDialogInitialTab('trail');
    setDialogDefaultStatus(item.status);
    setDialogDefaultProgress(item.latestProgress);
  };

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

  // Filter States
  const [filterSearch, setFilterSearch] = useState('');
  const [filterPic, setFilterPic] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterBiro, setFilterBiro] = useState('ALL');

  // Unique PICs from items
  const uniquePics = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((it) => {
      if (it.picUserId && it.picUser?.name) {
        map.set(it.picUserId, it.picUser.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [items]);

  // Unique Biros from items
  const uniqueBiros = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => {
      if (it.picBiro?.code) set.add(it.picBiro.code);
    });
    return Array.from(set);
  }, [items]);

  // Has active filters
  const hasActiveFilters = Boolean(
    filterSearch.trim() || filterPic !== 'ALL' || filterStatus !== 'ALL' || filterBiro !== 'ALL'
  );

  const resetFilters = () => {
    setFilterSearch('');
    setFilterPic('ALL');
    setFilterStatus('ALL');
    setFilterBiro('ALL');
  };

  // Filtered items
  const displayedItems = useMemo(() => {
    return items.filter((item) => {
      // Search text
      if (filterSearch.trim()) {
        const q = filterSearch.toLowerCase();
        const titleMatch = item.title.toLowerCase().includes(q);
        const descMatch = item.description ? item.description.toLowerCase().includes(q) : false;
        const picMatch = item.picUser?.name ? item.picUser.name.toLowerCase().includes(q) : false;
        const biroMatch = item.picBiro?.code ? item.picBiro.code.toLowerCase().includes(q) : false;
        if (!titleMatch && !descMatch && !picMatch && !biroMatch) return false;
      }

      // PIC filter
      if (filterPic !== 'ALL') {
        if (filterPic === 'UNASSIGNED') {
          if (item.picUserId) return false;
        } else if (item.picUserId !== filterPic) {
          return false;
        }
      }

      // Biro filter
      if (filterBiro !== 'ALL') {
        if (item.picBiro?.code !== filterBiro) return false;
      }

      // Status filter
      if (filterStatus !== 'ALL') {
        if (filterStatus === 'OVERDUE') {
          const isOverdue =
            item.status !== 'COMPLETED' && new Date(item.dueDate).getTime() < Date.now();
          if (!isOverdue) return false;
        } else if (item.status !== filterStatus) {
          return false;
        }
      }

      return true;
    });
  }, [items, filterSearch, filterPic, filterBiro, filterStatus]);

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
            ? 'Status tindak lanjut diperbarui: Finish.'
            : newStatus === 'IN_PROGRESS'
            ? 'Status tindak lanjut diperbarui: On Progress.'
            : 'Status tindak lanjut diperbarui: Start.'
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
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-[#31889C] uppercase tracking-wider block">
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
            <div className="px-3 py-1.5 rounded-lg border bg-slate-50 border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Total</span>
              <span className="text-[14px] font-bold text-slate-900">{total}</span>
            </div>

            <div className="px-3 py-1.5 rounded-lg border bg-[#ECF8E9] border-[#D2EFCA] text-center">
              <span className="text-[10px] text-[#4D8F3D] font-semibold uppercase block">Selesai</span>
              <span className="text-[14px] font-bold text-[#4D8F3D]">{completed}</span>
            </div>

            <div className="px-3 py-1.5 rounded-lg border bg-[#E8F5F7] border-[#BCE3EB] text-center">
              <span className="text-[10px] text-[#31889C] font-semibold uppercase block">Berjalan</span>
              <span className="text-[14px] font-bold text-[#31889C]">{inProgress}</span>
            </div>

            {overdue > 0 && (
              <div className="px-3 py-1.5 rounded-lg border bg-[#FEF2F2] border-red-200 text-center">
                <span className="text-[10px] text-[#DC2626] font-semibold uppercase block">Terlambat</span>
                <span className="text-[14px] font-bold text-[#DC2626]">{overdue}</span>
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#31889C] hover:bg-[#266F80] text-white font-semibold text-[13px] shadow-sm transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Tindak Lanjut</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Toolbar (when items exist) */}
      {items.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Cari butir tugas, nama PIC, biro, atau kata kunci..."
                className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#31889C] focus:ring-1 focus:ring-[#31889C]"
              />
              {filterSearch && (
                <button
                  type="button"
                  onClick={() => setFilterSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* PIC Filter Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                <User className="w-3.5 h-3.5 text-[#31889C] shrink-0" />
                <select
                  value={filterPic}
                  onChange={(e) => setFilterPic(e.target.value)}
                  className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer text-xs"
                >
                  <option value="ALL">Semua PIC ({items.length})</option>
                  <option value="UNASSIGNED">Belum Ditentukan</option>
                  {uniquePics.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Biro Filter Dropdown */}
              {uniqueBiros.length > 1 && (
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <select
                    value={filterBiro}
                    onChange={(e) => setFilterBiro(e.target.value)}
                    className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="ALL">Semua Biro</option>
                    {uniqueBiros.map((b) => (
                      <option key={b} value={b}>
                        Biro {b}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status Filter Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer text-xs"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="PENDING">Start</option>
                  <option value="IN_PROGRESS">On Progress</option>
                  <option value="COMPLETED">Finish</option>
                  {overdue > 0 && <option value="OVERDUE">Terlambat ({overdue})</option>}
                </select>
              </div>

              {/* Reset button if active */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold transition-colors cursor-pointer text-xs"
                  title="Reset seluruh filter"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Results Summary */}
          {hasActiveFilters && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11.5px] text-slate-500">
              <span>
                Menampilkan <strong>{displayedItems.length}</strong> dari <strong>{items.length}</strong> butir tindak lanjut
              </span>
              <button
                type="button"
                onClick={resetFilters}
                className="text-[#1E6B7B] hover:underline cursor-pointer"
              >
                Hapus filter
              </button>
            </div>
          )}
        </div>
      )}

      {/* Action Items List */}
      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#F0F9FA] border border-[#BCE3EB] text-[#31889C] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-[16px] font-bold text-slate-800">
              Belum Ada Butir Tindak Lanjut
            </h4>
            <p className="text-[13px] text-slate-500 leading-relaxed">
              {canCreateItem
                ? 'Rapat ini belum memiliki tindak lanjut yang terdaftar. Tambahkan butir pekerjaan dan delegasikan kepada biro pelaksana.'
                : 'Belum ada tindak lanjut yang didaftarkan untuk rapat ini oleh Notulis atau Administrator.'}
            </p>
            {canCreateItem && (
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setIsFormOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#31889C] hover:bg-[#266F80] text-white font-semibold text-[13px] shadow-sm transition-all cursor-pointer mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>+ Buat Tindak Lanjut Pertama</span>
              </button>
            )}
          </div>
        </div>
      ) : displayedItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-xs space-y-2">
          <p className="font-bold text-slate-800 text-sm">Tidak ada butir tindak lanjut yang cocok</p>
          <p className="text-xs text-slate-500">
            Coba ubah kata kunci pencarian atau reset filter untuk melihat semua tindak lanjut.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedItems.map((item, idx) => {
            const isItemOverdue =
              item.status !== 'COMPLETED' && new Date(item.dueDate).getTime() < Date.now();
            const isUpdatingThis = updatingStatusId === item.id;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-[#BCE3EB] transition-all space-y-3"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-[#215865] bg-[#E8F5F7] px-2 py-0.5 rounded border border-[#BCE3EB]">
                        Item #{idx + 1}
                      </span>
                      {canEditThisItem(item) ? (
                        <button
                          type="button"
                          onClick={() => openUpdateDialog(item)}
                          className="cursor-pointer transition-opacity hover:opacity-80 text-left"
                          title="Klik untuk memperbarui progres status"
                        >
                          <ActionItemStatusBadge status={item.status} isOverdue={isItemOverdue} />
                        </button>
                      ) : (
                        <ActionItemStatusBadge status={item.status} isOverdue={isItemOverdue} />
                      )}
                      <ActionItemPriorityBadge priority={item.priority} />
                    </div>
                    <h4 className="text-[15px] font-bold text-slate-900 pt-1 leading-snug">
                      {item.title}
                    </h4>
                    {(() => {
                      const allUrls = extractAllLinks(item.description);
                      const cleanDesc = allUrls.length > 0 ? cleanTextWithoutLink(item.description) : item.description;

                      return (
                        <div className="space-y-1.5 pt-0.5">
                          {cleanDesc ? (
                            <p className="text-[13px] text-slate-600 leading-relaxed">
                              <RenderTextWithLinks text={cleanDesc} />
                            </p>
                          ) : null}
                          {allUrls.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              {allUrls.map((url, idx) => (
                                <GoogleDriveLinkCard
                                  key={url + idx}
                                  url={url}
                                  label={allUrls.length > 1 ? `Buka Google Drive ${idx + 1}` : undefined}
                                  variant="badge"
                                />
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Log & Progress History Button (All members can view & PIC can add) */}
                    <button
                      type="button"
                      onClick={() => setLoggingItem(item)}
                      className="p-1.5 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                      title="Lihat Riwayat & Kirim Progres / Google Drive"
                    >
                      <History className="w-4 h-4" />
                    </button>

                    {(canEditThisItem(item) || canDeleteItem) && (
                      <>
                        {canEditThisItem(item) && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItem(item);
                              setIsFormOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-[#31889C] hover:bg-[#F0F9FA] rounded-lg transition-colors cursor-pointer"
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
                      </>
                    )}
                  </div>
                </div>

                {/* Details Footer Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-[12px]">
                  <div className="flex flex-wrap items-center gap-4 text-slate-600">
                    {/* Biro PIC */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Building2 className="w-3.5 h-3.5 text-[#31889C]" />
                      <span className="font-semibold text-slate-800">
                        {item.picBiro ? `${item.picBiro.code} - ${item.picBiro.shortName}` : 'Biro KEK'}
                      </span>
                      {item.picTeam && (
                        <span className="px-1.5 py-0.5 rounded text-[10.5px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                          Tim {item.picTeam.name}
                        </span>
                      )}
                    </div>

                    {/* User PIC */}
                    {item.picUser && (
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#31889C]" />
                        <span className="text-slate-700">{item.picUser.name}</span>
                      </div>
                    )}

                    {/* Deadline */}
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#31889C]" />
                      <span>
                        Deadline: <strong className={isItemOverdue ? 'text-red-600' : 'text-slate-800'}>
                          {formatIndonesianDate(item.dueDate)}
                        </strong>
                      </span>
                    </div>

                    {/* Completed At */}
                    {item.completedAt && (
                      <div className="flex items-center gap-1 text-[#4D8F3D] font-medium">
                        <Check className="w-3.5 h-3.5" />
                        <span>Selesai: {formatIndonesianDate(item.completedAt)}</span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar & Akuntabilitas (Opsi A) */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Visual Progress Bar */}
                    <div className="flex items-center gap-2.5 min-w-[220px]">
                      <div className="w-24 sm:w-28 bg-slate-100 h-2 rounded-full overflow-hidden shrink-0">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            item.status === 'COMPLETED'
                              ? 'bg-[#7CC563]'
                              : isItemOverdue
                              ? 'bg-rose-500'
                              : 'bg-[#31889C]'
                          }`}
                          style={{
                            width: `${
                              item.latestProgress !== undefined && item.latestProgress !== null
                                ? item.latestProgress
                                : item.status === 'COMPLETED'
                                ? 100
                                : item.status === 'IN_PROGRESS'
                                ? 50
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-[12px] font-black text-slate-700 shrink-0">
                        {item.latestProgress !== undefined && item.latestProgress !== null
                          ? item.latestProgress
                          : item.status === 'COMPLETED'
                          ? 100
                          : item.status === 'IN_PROGRESS'
                          ? 50
                          : 0}
                        %
                      </span>
                      {item.latestLogNote && (
                        <span
                          className="text-[11px] text-slate-500 truncate max-w-[260px] hidden sm:inline"
                          title={item.latestLogNote}
                        >
                          &bull; {cleanTextWithoutLink(item.latestLogNote)}
                        </span>
                      )}
                    </div>

                    {/* Controls & Actions */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Tandai Selesai Quick Button (Opens Evidence Modal pre-filled to Completed) */}
                      {canEditThisItem(item) && item.status !== 'COMPLETED' && (
                        <button
                          type="button"
                          onClick={() => openUpdateDialog(item, 'COMPLETED', 100)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#4D8F3D] border border-emerald-200 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                          title="Tandai Selesai beserta Catatan & Bukti Google Drive"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Tandai Selesai</span>
                        </button>
                      )}

                      {/* Update Progres button */}
                      {canEditThisItem(item) && (
                        <button
                          type="button"
                          onClick={() => openUpdateDialog(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E8F5F7] hover:bg-[#D5EEF2] text-[#215865] border border-[#BCE3EB] text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                          title="Perbarui status, persentase progres, atau tautan bukti"
                        >
                          <TrendingUp className="w-3.5 h-3.5 text-[#31889C]" />
                          <span>Update Progres</span>
                        </button>
                      )}

                      {/* History / Audit Trail button */}
                      <button
                        type="button"
                        onClick={() => openAuditTrailDialog(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold transition-all cursor-pointer"
                        title="Lihat riwayat catatan progres dan bukti pelaksanaan"
                      >
                        <History className="w-3.5 h-3.5 text-slate-400" />
                        <span>Riwayat Log</span>
                        {Boolean(item.logsCount && item.logsCount > 0) && (
                          <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[9px] font-black">
                            {item.logsCount}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
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
        lockedBiroCode={userRole === 'STAFF' ? currentUser?.biroCode : undefined}
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

      {/* Progress Log & Google Drive Dialog */}
      <ActionItemLogDialog
        isOpen={Boolean(loggingItem)}
        item={loggingItem}
        initialTab={dialogInitialTab}
        defaultStatus={dialogDefaultStatus}
        defaultProgress={dialogDefaultProgress}
        canEdit={Boolean(loggingItem && canEditThisItem(loggingItem))}
        onClose={() => setLoggingItem(null)}
        onItemUpdated={(updated) => {
          setItems((prev) =>
            prev.map((it) => (it.id === updated.id ? { ...it, ...updated } : it))
          );
          router.refresh();
        }}
      />
    </div>
  );
}
