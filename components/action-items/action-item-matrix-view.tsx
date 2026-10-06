'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  Search,
  RotateCcw,
  Plus,
  Building2,
  Calendar,
  ExternalLink,
  Edit2,
  Trash2,
  Check,
  PlayCircle,
  FileSpreadsheet,
  FileText,
  Loader2,
  History,
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
import { toast } from '@/components/providers/toast-provider';

interface ActionItemMatrixViewProps {
  initialItems: any[];
  availableMeetings: { id: string; meetingNumber: string; title: string }[];
  availableBiros: { id: string; code: string; shortName: string; name: string }[];
  availableUsers: { id: string; name: string; email?: string; biroId?: string }[];
  lockedBiroCode?: string;
  currentUserRole?: string;
  currentUserBiroName?: string;
}

export function ActionItemMatrixView({
  initialItems = [],
  availableMeetings = [],
  availableBiros = [],
  availableUsers = [],
  lockedBiroCode,
  currentUserRole,
  currentUserBiroName,
}: ActionItemMatrixViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const userRole = currentUserRole || session?.user?.role || 'VIEWER';
  const currentUserId = session?.user?.id;

  const canCreateItem =
    userRole === 'SUPER_ADMIN' ||
    userRole === 'ADMIN' ||
    userRole === 'NOTULIS' ||
    userRole === 'STAFF';
  const canDeleteItem = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'NOTULIS';

  const canEditTask = (task: any) => {
    if (userRole === 'VIEWER') return false;
    if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'NOTULIS') return true;
    if (userRole === 'STAFF') {
      return Boolean(task.picUserId && currentUserId && task.picUserId === currentUserId);
    }
    return false;
  };
  const rawStatus = searchParams.get('status') || 'ALL';
  const statusParam = useMemo(() => {
    const s = rawStatus.toUpperCase();
    if (s === 'SEDANG-BERJALAN' || s === 'IN_PROGRESS') return 'IN_PROGRESS';
    if (s === 'SELESAI' || s === 'COMPLETED') return 'COMPLETED';
    if (s === 'BELUM-DIMULAI' || s === 'PENDING') return 'PENDING';
    if (s === 'TERLAMBAT' || s === 'OVERDUE') return 'OVERDUE';
    return s;
  }, [rawStatus]);
  const biroParam = searchParams.get('biro') || 'ALL';

  const [items, setItems] = useState<any[]>(initialItems);
  const [search, setSearch] = useState('');
  const [selectedBiro, setSelectedBiro] = useState(lockedBiroCode || biroParam);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMeetingIdForCreate, setSelectedMeetingIdForCreate] = useState<string>(
    availableMeetings[0]?.id || ''
  );
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ActionItem | null>(null);
  const [loggingItem, setLoggingItem] = useState<ActionItem | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);

  /**
   * Export Excel — uses the same active filters as the visible table.
   * Consistency: UI row count == Excel row count.
   */
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      if (statusParam && statusParam !== 'ALL') params.set('status', statusParam);
      const effectiveBiro = lockedBiroCode || selectedBiro;
      if (effectiveBiro && effectiveBiro !== 'ALL') params.set('biro', effectiveBiro);
      if (search.trim()) params.set('search', search.trim());

      const url = `/api/action-items/export?${params.toString()}`;
      const res = await fetch(url);

      if (res.status === 401) {
        toast.warning('Sesi Anda telah berakhir. Silakan masuk kembali ke sistem.');
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(`Gagal mengekspor: ${body?.error ?? 'Terjadi kesalahan server.'}`);
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? 'Matriks-Tindak-Lanjut.xlsx';

      const anchor = document.createElement('a');
      anchor.href = URL.createObjectURL(blob);
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(anchor.href);
      toast.success(`Matriks Tindak Lanjut "${filename}" berhasil diekspor.`);
    } catch (err: any) {
      toast.error(`Terjadi kesalahan saat mengekspor: ${err?.message ?? 'Error tidak diketahui'}`);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Export Word (.docx) — same active filters as the visible table.
   */
  const handleExportDocx = async () => {
    try {
      setIsExportingDocx(true);
      const params = new URLSearchParams();
      if (statusParam && statusParam !== 'ALL') params.set('status', statusParam);
      const effectiveBiro = lockedBiroCode || selectedBiro;
      if (effectiveBiro && effectiveBiro !== 'ALL') params.set('biro', effectiveBiro);
      if (search.trim()) params.set('search', search.trim());

      const url = `/api/action-items/export-docx?${params.toString()}`;
      const res = await fetch(url);

      if (res.status === 401) {
        toast.warning('Sesi Anda telah berakhir. Silakan masuk kembali ke sistem.');
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(`Gagal mengekspor Word: ${body?.error ?? 'Terjadi kesalahan server.'}`);
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? 'Matriks-Tindak-Lanjut.docx';

      const anchor = document.createElement('a');
      anchor.href = URL.createObjectURL(blob);
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(anchor.href);
      toast.success(`Dokumen Word "${filename}" berhasil diekspor.`);
    } catch (err: any) {
      toast.error(`Terjadi kesalahan saat mengekspor Word: ${err?.message ?? 'Error tidak diketahui'}`);
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Compute live metrics across all items
  const totalCount = items.length;
  const completedCount = items.filter((i) => i.status === 'COMPLETED').length;
  const inProgressCount = items.filter((i) => i.status === 'IN_PROGRESS').length;
  const overdueCount = items.filter((i) => {
    return i.status !== 'COMPLETED' && new Date(i.dueDate).getTime() < Date.now();
  }).length;
  const pendingCount = items.filter(
    (i) => i.status === 'PENDING' && new Date(i.dueDate).getTime() >= Date.now()
  ).length;

  const filterTabs = [
    { label: `Semua Status (${totalCount})`, value: 'ALL' },
    { label: `Selesai (${completedCount})`, value: 'COMPLETED' },
    { label: `Sedang Berjalan (${inProgressCount})`, value: 'IN_PROGRESS' },
    { label: `Belum Dimulai (${pendingCount})`, value: 'PENDING' },
    { label: `Terlambat (${overdueCount})`, value: 'OVERDUE' },
  ];

  const handleSelectStatus = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val === 'ALL') {
      params.delete('status');
    } else {
      params.set('status', val);
    }
    router.push(`/tindak-lanjut?${params.toString()}`);
  };

  const handleBiroFilter = (code: string) => {
    if (lockedBiroCode) return; // Locked to user's own bureau
    setSelectedBiro(code);
    const params = new URLSearchParams(searchParams.toString());
    if (code === 'ALL') {
      params.delete('biro');
    } else {
      params.set('biro', code);
    }
    router.push(`/tindak-lanjut?${params.toString()}`);
  };

  const handleStatusChange = async (itemId: string, newStatus: ActionItemStatus) => {
    try {
      setUpdatingStatusId(itemId);
      const res = await updateActionItemStatusAction({ id: itemId, status: newStatus });
      if (res.success && res.data) {
        setItems((prev) =>
          prev.map((it) => (it.id === itemId ? { ...it, ...res.data } : it))
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
      toast.error(`Terjadi kesalahan: ${err?.message || 'Gagal'}`);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const filteredTasks = useMemo(() => {
    return items.filter((task) => {
      const isOverdue =
        task.status !== 'COMPLETED' && new Date(task.dueDate).getTime() < Date.now();
      const effectiveStatus = isOverdue ? 'OVERDUE' : task.status;

      // Status filter
      if (statusParam !== 'ALL') {
        if (statusParam === 'OVERDUE') {
          if (!isOverdue) return false;
        } else if (task.status !== statusParam) {
          return false;
        }
      }

      // Biro filter
      if (selectedBiro !== 'ALL') {
        const itemBiroCode = task.picBiro?.code || '';
        if (itemBiroCode.toUpperCase() !== selectedBiro.toUpperCase()) {
          return false;
        }
      }

      // Search filter
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const titleMatch = task.title?.toLowerCase().includes(q);
      const descMatch = task.description?.toLowerCase().includes(q);
      const meetingMatch = task.meeting?.meetingNumber?.toLowerCase().includes(q);
      const biroMatch =
        task.picBiro?.code?.toLowerCase().includes(q) ||
        task.picBiro?.name?.toLowerCase().includes(q);
      const userMatch = task.picUser?.name?.toLowerCase().includes(q);

      return titleMatch || descMatch || meetingMatch || biroMatch || userMatch;
    });
  }, [items, statusParam, selectedBiro, search]);

  const formatIndonesianDate = (dateVal: Date | string) => {
    try {
      return new Date(dateVal).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(dateVal);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Card */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="font-semibold text-[12px] text-[#31889C] uppercase tracking-wider flex items-center gap-1.5">
            {lockedBiroCode ? (
              <>
                <Building2 className="w-3.5 h-3.5" />
                Matriks Disposisi Biro {lockedBiroCode}
              </>
            ) : (
              'Matriks Disposisi & Pemantauan Dewan'
            )}
          </span>
          <h1 className="text-[24px] font-bold text-slate-900 mt-0.5">
            {lockedBiroCode
              ? `Tindak Lanjut — ${currentUserBiroName || `Biro ${lockedBiroCode}`}`
              : 'Monitoring & Evaluasi Tindak Lanjut'}
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            {lockedBiroCode
              ? `Pantau dan laporkan realisasi komitmen keputusan rapat khusus untuk penugasan ${currentUserBiroName || `Biro ${lockedBiroCode}`}.`
              : 'Pantau realisasi komitmen keputusan rapat dewan KEK lintas biro resmi dan kementerian.'}
          </p>
        </div>

        {/* Live summary chips */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg border bg-[#F0F9FA] border-[#BCE3EB] text-center min-w-[70px]">
            <div className="text-[10px] text-slate-500 font-semibold uppercase">Total</div>
            <div className="text-[14px] font-bold text-[#31889C]">{totalCount}</div>
          </div>

          <div className="px-3 py-1.5 rounded-lg border bg-[#ECF8E9] border-[#D2EFCA] text-center min-w-[70px]">
            <div className="text-[10px] text-[#4D8F3D] font-semibold uppercase">Selesai</div>
            <div className="text-[14px] font-bold text-[#2E6B20]">{completedCount}</div>
          </div>

          <div className="px-3 py-1.5 rounded-lg border bg-[#E8F5F7] border-[#BCE3EB] text-center min-w-[70px]">
            <div className="text-[10px] text-[#31889C] font-semibold uppercase">Berjalan</div>
            <div className="text-[14px] font-bold text-[#215865]">{inProgressCount}</div>
          </div>

          <div className="px-3 py-1.5 rounded-lg border bg-[#FFF8CC] border-[#FFEE99] text-center min-w-[70px]">
            <div className="text-[10px] text-[#8A7200] font-semibold uppercase">Menunggu</div>
            <div className="text-[14px] font-bold text-[#6B5800]">{pendingCount}</div>
          </div>

          <div className="px-3 py-1.5 rounded-lg border bg-[#FEF2F2] border-[#FCA5A5] text-center min-w-[70px]">
            <div className="text-[10px] text-red-700 font-semibold uppercase">Terlambat</div>
            <div className="text-[14px] font-bold text-red-800">{overdueCount}</div>
          </div>
        </div>
      </div>

      {/* Action Bar: Create button + Filters & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#31889C]" />
            Status:
          </span>
          {filterTabs.map((tab) => {
            const isActive =
              tab.value === 'ALL'
                ? statusParam === 'ALL' || !statusParam
                : statusParam === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleSelectStatus(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#31889C] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-[#F0F9FA] hover:text-[#31889C]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Biro Filter & Search & Add Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Biro Select / Locked Badge */}
          {lockedBiroCode ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E8F5F7] border border-[#BCE3EB] text-[#215865] text-[12px] font-bold shadow-2xs">
              <Building2 className="w-3.5 h-3.5 text-[#31889C]" />
              <span>Unit: Biro {lockedBiroCode}</span>
            </div>
          ) : (
            <select
              value={selectedBiro}
              onChange={(e) => handleBiroFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-[12px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#31889C]/30 focus:border-[#31889C] shadow-xs cursor-pointer"
            >
              <option value="ALL">Semua 5 Biro KEK</option>
              {availableBiros.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.code} — {b.shortName}
                </option>
              ))}
            </select>
          )}

          {/* Search Input */}
          <div className="relative w-full sm:w-60">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari butir tugas, biro, PIC..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-[12px] focus:outline-none focus:ring-2 focus:ring-[#31889C]/30 focus:border-[#31889C] shadow-xs"
            />
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#31889C] pointer-events-none" />
          </div>

          {/* Export buttons group */}
          <div className="flex items-center gap-1.5">
            {/* Export Excel */}
            <button
              type="button"
              id="export-excel-btn"
              onClick={handleExportExcel}
              disabled={isExporting || isExportingDocx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-l-lg bg-[#7CC563] hover:bg-[#68ab50] disabled:opacity-50 text-white font-semibold text-[12px] shadow-xs transition-all cursor-pointer shrink-0"
              title="Export data tindak lanjut sesuai filter aktif ke Excel (.xlsx)"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{isExporting ? 'Excel...' : 'Excel'}</span>
            </button>
            {/* Export Word */}
            <button
              type="button"
              id="export-docx-btn"
              onClick={handleExportDocx}
              disabled={isExporting || isExportingDocx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-r-lg bg-[#2B5ED8] hover:bg-[#1e4ab8] disabled:opacity-50 text-white font-semibold text-[12px] shadow-xs transition-all cursor-pointer shrink-0"
              title="Export data tindak lanjut sesuai filter aktif ke Microsoft Word (.docx)"
            >
              {isExportingDocx ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{isExportingDocx ? 'Word...' : 'Word'}</span>
            </button>
          </div>

          {/* New Action Item Trigger (Only privileged roles) */}
          {canCreateItem && availableMeetings.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#31889C] hover:bg-[#266F80] text-white font-semibold text-[12px] shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Tindak Lanjut</span>
            </button>
          )}
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-800 text-[13px]">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Ref. Rapat</th>
                <th className="py-3.5 px-4 min-w-[280px]">Butir Tindak Lanjut</th>
                <th className="py-3.5 px-4">Biro &amp; PIC</th>
                <th className="py-3.5 px-4">Tenggat Waktu</th>
                <th className="py-3.5 px-4">Prioritas</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <p className="font-semibold text-slate-700">
                        Tidak ada butir tindak lanjut yang cocok dengan filter.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearch('');
                          setSelectedBiro('ALL');
                          router.push('/tindak-lanjut');
                        }}
                        className="inline-flex items-center gap-1 text-[12px] text-[#31889C] font-semibold hover:underline cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Semua Filter</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const isItemOverdue =
                    task.status !== 'COMPLETED' &&
                    new Date(task.dueDate).getTime() < Date.now();
                  const isUpdatingThis = updatingStatusId === task.id;

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-[#F0F9FA] transition-colors group"
                    >
                      {/* Ref. Rapat */}
                      <td className="py-3.5 px-4 align-top">
                        {task.meeting ? (
                          <Link
                            href={`/semua-rapat/${task.meeting.id}`}
                            className="inline-flex items-center gap-1 font-bold text-[#31889C] hover:text-[#215865] hover:underline"
                            title={task.meeting.title}
                          >
                            <span>{task.meeting.meetingNumber}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        ) : (
                          <span className="font-bold text-slate-400">-</span>
                        )}
                      </td>

                      {/* Butir Tindak Lanjut */}
                      <td className="py-3.5 px-4 align-top">
                        <p className="font-bold text-slate-900 leading-snug">{task.title}</p>
                        {(() => {
                          const allUrls = extractAllLinks(task.description);
                          const cleanDesc = allUrls.length > 0 ? cleanTextWithoutLink(task.description) : task.description;

                          return (
                            <div className="space-y-1 mt-0.5">
                              {cleanDesc ? (
                                <p className="text-[12px] text-slate-500 line-clamp-2">
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
                        {task.completedAt && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#4D8F3D] font-medium mt-1">
                            <Check className="w-3 h-3" />
                            Diselesaikan: {formatIndonesianDate(task.completedAt)}
                          </span>
                        )}
                      </td>

                      {/* Biro & PIC */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex flex-col items-start gap-1">
                          <span className="inline-block font-semibold text-[#215865] bg-[#F0F9FA] px-2 py-0.5 rounded border border-[#BCE3EB] text-[11px]">
                            {task.picBiro?.code || 'Biro KEK'}
                          </span>
                          {task.picTeam && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                              Tim {task.picTeam.name}
                            </span>
                          )}
                          {task.picUser && (
                            <p className="text-[11px] text-slate-600 truncate max-w-[150px]">
                              {task.picUser.name}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Tenggat Waktu */}
                      <td className="py-3.5 px-4 align-top">
                        <span
                          className={`font-semibold text-[12px] ${
                            isItemOverdue ? 'text-red-600 font-bold' : 'text-slate-700'
                          }`}
                        >
                          {formatIndonesianDate(task.dueDate)}
                        </span>
                      </td>

                      {/* Prioritas */}
                      <td className="py-3.5 px-4 align-top">
                        <ActionItemPriorityBadge priority={task.priority} />
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 align-top">
                        <ActionItemStatusBadge
                          status={task.status}
                          isOverdue={isItemOverdue}
                        />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick Toggle Status - only if user can edit this task */}
                          {canEditTask(task) && (
                            task.status !== 'COMPLETED' ? (
                              <button
                                type="button"
                                disabled={isUpdatingThis}
                                onClick={() => handleStatusChange(task.id, 'COMPLETED')}
                                className="p-1 rounded text-[#4D8F3D] hover:bg-[#ECF8E9] transition-colors cursor-pointer"
                                title="Tandai Selesai"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isUpdatingThis}
                                onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')}
                                className="p-1 rounded text-[#31889C] hover:bg-[#F0F9FA] transition-colors cursor-pointer"
                                title="Kembalikan ke Dalam Proses"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )
                          )}

                          {/* Audit Trail & Progress Log button */}
                          <button
                            type="button"
                            onClick={() => setLoggingItem(task)}
                            className="p-1 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded transition-colors cursor-pointer"
                            title="Lihat Riwayat & Catatan Progres"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {/* Edit button - only if user can edit this task */}
                          {canEditTask(task) && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingItem(task);
                                setSelectedMeetingIdForCreate(task.meetingId);
                                setIsFormOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-[#31889C] hover:bg-[#F0F9FA] rounded transition-colors cursor-pointer"
                              title="Ubah Tindak Lanjut"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete button - only if user can delete */}
                          {canDeleteItem && (
                            <button
                              type="button"
                              onClick={() => setDeletingItem(task)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              title="Hapus Tindak Lanjut"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Dialog */}
      <ActionItemFormDialog
        isOpen={isFormOpen}
        meetingId={editingItem ? editingItem.meetingId : selectedMeetingIdForCreate}
        actionItem={editingItem}
        availableBiros={availableBiros}
        availableUsers={availableUsers}
        lockedBiroCode={lockedBiroCode}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        onSuccess={() => {
          setIsFormOpen(false);
          setEditingItem(null);
          window.location.reload();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ActionItemDeleteDialog
        isOpen={Boolean(deletingItem)}
        actionItemId={deletingItem?.id || null}
        actionItemTitle={deletingItem?.title}
        onClose={() => setDeletingItem(null)}
        onSuccess={() => {
          if (deletingItem) {
            setItems((prev) => prev.filter((i) => i.id !== deletingItem.id));
            setDeletingItem(null);
            router.refresh();
          }
        }}
      />

      {/* Audit Trail & Progress Log Dialog */}
      <ActionItemLogDialog
        item={loggingItem}
        isOpen={Boolean(loggingItem)}
        onClose={() => setLoggingItem(null)}
        onItemUpdated={(updated) => {
          setItems((prev) =>
            prev.map((it) => (it.id === updated.id ? { ...it, ...updated } : it))
          );
          setLoggingItem(updated);
          router.refresh();
        }}
      />
    </div>
  );
}
