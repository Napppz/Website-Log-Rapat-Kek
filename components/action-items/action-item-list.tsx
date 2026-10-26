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
  TrendingUp,
  Search,
  Filter,
  X,
  Layers,
  Paperclip,
  ExternalLink,
  FileCheck,
  FileText,
} from 'lucide-react';
import { ActionItem, ActionItemStatus } from '@/lib/types';
import { ActionItemStatusBadge, ActionItemPriorityBadge } from './action-item-status-badge';
import { ActionItemFormDialog } from './action-item-form-dialog';
import { ActionItemDeleteDialog } from './action-item-delete-dialog';
import { ActionItemUpdateProgressDialog } from './action-item-update-progress-dialog';
import {
  GoogleDriveLinkCard,
  GoogleDriveIcon,
  normalizeUrl,
  extractDriveLink,
  extractAnyLink,
  extractAllLinks,
  cleanTextWithoutLink,
  RenderTextWithLinks,
} from './google-drive-link-badge';
import { parsePicDeliverableDescription } from '@/lib/pic-deliverables';
import { updateActionItemStatusAction } from '@/app/actions/action-item-actions';
import { useSession } from 'next-auth/react';
import { toast } from '@/components/providers/toast-provider';

interface ActionItemListProps {
  meetingId: string;
  currentMeeting?: any;
  initialItems: ActionItem[];
  availableBiros?: { id: string; code: string; shortName: string; name: string }[];
  availableUsers?: Array<{
    id: string;
    name: string;
    email?: string | null;
    biroId?: string | null;
    teamId?: string | null;
    team?: { id?: string; code?: string; name?: string } | null;
    userTeams?: Array<{ role?: string | null; team: { id?: string; code?: string; name?: string } }>;
  }>;
  availableTeams?: Array<{ id: string; code: string; name: string; biroId?: string }>;
  readOnly?: boolean;
}

export function ActionItemList({
  meetingId,
  currentMeeting,
  initialItems = [],
  availableBiros = [],
  availableUsers = [],
  availableTeams = [],
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
  const [updateProgressItem, setUpdateProgressItem] = useState<ActionItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<ActionItemStatus | undefined>(undefined);
  const [targetProgress, setTargetProgress] = useState<number | undefined>(undefined);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const openUpdateDialog = (item: ActionItem, newStatus?: ActionItemStatus, newProgress?: number) => {
    setUpdateProgressItem(item);
    setTargetStatus(newStatus || item.status);
    setTargetProgress(
      newProgress !== undefined
        ? newProgress
        : newStatus === 'COMPLETED'
        ? 100
        : item.latestProgress
    );
  };

  const userStaffTeamCode = userRole === 'STAFF' && currentUser?.teamCode ? currentUser.teamCode.toUpperCase() : null;
  const userStaffTeamId = userRole === 'STAFF' && currentUser?.teamId ? currentUser.teamId : null;

  // Semua tim kerja dapat melihat pekerjaan/tindak lanjut tim lain
  const visibleItems = items;

  // Compute stats
  const total = visibleItems.length;
  const completed = visibleItems.filter((i) => i.status === 'COMPLETED').length;
  const inProgress = visibleItems.filter((i) => i.status === 'IN_PROGRESS').length;
  const overdue = visibleItems.filter((i) => {
    return i.status !== 'COMPLETED' && new Date(i.dueDate).getTime() < Date.now();
  }).length;
  const pending = visibleItems.filter(
    (i) => i.status === 'PENDING' && new Date(i.dueDate).getTime() >= Date.now()
  ).length;

  // Filter States
  const [filterSearch, setFilterSearch] = useState('');
  const [filterPic, setFilterPic] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterTeam, setFilterTeam] = useState(userStaffTeamCode || 'ALL');

  // Unique PICs from items
  const uniquePics = useMemo(() => {
    const map = new Map<string, string>();
    visibleItems.forEach((it) => {
      if (it.picUserId && it.picUser?.name) {
        map.set(it.picUserId, it.picUser.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [visibleItems]);

  // Available Teams for filter
  const availableTeamFilters = useMemo(() => {
    const canonical = [
      { code: 'INV', name: 'Tim Investasi' },
      { code: 'KS', name: 'Tim Kerja Sama' },
      { code: 'KOM', name: 'Tim Komunikasi' },
    ];
    if (userStaffTeamCode) {
      return canonical.filter((t) => t.code === userStaffTeamCode);
    }
    return canonical;
  }, [userStaffTeamCode]);

  // Has active filters
  const hasActiveFilters = Boolean(
    filterSearch.trim() || filterPic !== 'ALL' || filterStatus !== 'ALL' || (!userStaffTeamCode && filterTeam !== 'ALL')
  );

  const resetFilters = () => {
    setFilterSearch('');
    setFilterPic('ALL');
    setFilterStatus('ALL');
    setFilterTeam(userStaffTeamCode || 'ALL');
  };

  // Filtered items
  const displayedItems = useMemo(() => {
    return visibleItems.filter((item) => {
      // Search text
      if (filterSearch.trim()) {
        const q = filterSearch.toLowerCase();
        const titleMatch = item.title.toLowerCase().includes(q);
        const descMatch = item.description ? item.description.toLowerCase().includes(q) : false;
        const picMatch = item.picUser?.name ? item.picUser.name.toLowerCase().includes(q) : false;
        const teamMatch = item.picTeam?.name ? item.picTeam.name.toLowerCase().includes(q) : false;
        const biroMatch = item.picBiro?.code ? item.picBiro.code.toLowerCase().includes(q) : false;
        if (!titleMatch && !descMatch && !picMatch && !teamMatch && !biroMatch) return false;
      }

      // PIC filter
      if (filterPic !== 'ALL') {
        if (filterPic === 'UNASSIGNED') {
          if (item.picUserId) return false;
        } else if (item.picUserId !== filterPic) {
          return false;
        }
      }

      // Team filter
      if (filterTeam !== 'ALL') {
        const itemTeamCode = item.picTeam?.code || (item.picBiro?.code === 'IKK' ? 'INV' : '');
        if (itemTeamCode !== filterTeam) return false;
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
  }, [items, filterSearch, filterPic, filterTeam, filterStatus]);

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
            ? 'Status tindak lanjut diperbarui: Dalam Proses.'
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

  const formatIndonesianDateTime = (dateVal: Date | string, forceTime = false) => {
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      const datePart = d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const hours = d.getHours();
      const minutes = d.getMinutes();
      if (forceTime || hours !== 0 || minutes !== 0) {
        const timePart = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        return `${datePart}, ${timePart} WIB`;
      }
      return datePart;
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
            Daftar Butir Tindak Lanjut Kegiatan
          </h3>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Tindak lanjut resmi hasil arahan kegiatan dewan dan biro pelaksana KEK RI.
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

              {/* Tim Kerja Filter Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                <Layers className="w-3.5 h-3.5 text-[#31889C] shrink-0" />
                <select
                  value={filterTeam}
                  onChange={(e) => setFilterTeam(e.target.value)}
                  className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer text-xs"
                >
                  <option value="ALL">Semua Tim Kerja</option>
                  {availableTeamFilters.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer text-xs"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="PENDING">Belum Dimulai</option>
                  <option value="IN_PROGRESS">Dalam Proses</option>
                  <option value="COMPLETED">Selesai</option>
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
                ? 'Kegiatan ini belum memiliki tindak lanjut yang terdaftar. Tambahkan butir pekerjaan dan delegasikan kepada tim kerja pelaksana.'
                : 'Belum ada tindak lanjut yang didaftarkan untuk kegiatan ini oleh Notulis atau Administrator.'}
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
                <span>Buat Tindak Lanjut Pertama</span>
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
                      {/^https?:\/\//i.test(item.title.trim())
                        ? (item.meeting?.title ? `Tindak Lanjut: ${item.meeting.title}` : 'Tindak Lanjut Kegiatan')
                        : item.title}
                    </h4>
                    {(() => {
                      const parsed = parsePicDeliverableDescription(item.description);
                      const rawNotes = parsed.notes || item.description || '';
                      const refDocMatch = rawNotes.match(/📎 (?:Dokumen Acuan|Dokumen Terkait):\s*\[([^\]]+)\]\(([^)]+)\)/);
                      const refDriveMatch = rawNotes.match(/📎 (?:Drive Acuan|Google Drive Acuan|Link Terkait):\s*(\S+)/);
                      const evidenceDocMatch = rawNotes.match(/📎 Bukti Pelaksanaan:\s*\[([^\]]+)\]\(([^)]+)\)/);
                      const evidenceDriveMatch = rawNotes.match(/📎 (?:Drive Bukti|Tautan Google Drive):\s*(\S+)/);

                      const refDriveUrl = refDriveMatch ? normalizeUrl(refDriveMatch[1]) : '';
                      const evidenceDriveUrl = evidenceDriveMatch ? normalizeUrl(evidenceDriveMatch[1]) : '';

                      const allUrls = Array.from(new Set([
                        ...(parsed.links ? parsed.links.map((l) => l.url) : []),
                        ...(parsed.linkUrl ? [parsed.linkUrl] : []),
                        ...(parsed.fileUrl ? [parsed.fileUrl] : []),
                        ...extractAllLinks(rawNotes),
                      ])).filter((u) => u !== refDriveUrl && u !== evidenceDriveUrl);

                      let cleanDesc = cleanTextWithoutLink(rawNotes);
                      cleanDesc = cleanDesc
                        .replace(/📎 (?:Dokumen Acuan|Dokumen Terkait):\s*\[([^\]]+)\]\(([^)]+)\)/g, '')
                        .replace(/📎 (?:Drive Acuan|Google Drive Acuan|Link Terkait):\s*\S+/g, '')
                        .replace(/📎 Bukti Pelaksanaan:\s*\[([^\]]+)\]\(([^)]+)\)/g, '')
                        .replace(/📎 (?:Drive Bukti|Tautan Google Drive):\s*\S+/g, '')
                        .replace(/📝 (?:Catatan Capaian|Catatan Progres):\s*/g, '')
                        .trim();

                      return (
                        <div className="space-y-2 pt-0.5">
                          {cleanDesc ? (
                            <p className="text-[13px] text-slate-600 leading-relaxed font-normal">
                              <RenderTextWithLinks text={cleanDesc} />
                            </p>
                          ) : null}

                          <div className="space-y-2 pt-1">
                            {/* 1. KOTAK BAHAN & ACUAN DARI ATASAN */}
                            {(refDocMatch || refDriveUrl) && (
                              <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/90 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                    <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Bahan &amp; Acuan dari Atasan (Input)</span>
                                  </span>
                                  <span className="text-[9.5px] font-semibold text-slate-400">
                                    Dokumen Penugasan
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  {refDocMatch && (
                                    <a
                                      href={refDocMatch[2]}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 transition-colors shadow-2xs"
                                      title={`Buka Dokumen Acuan: ${refDocMatch[1]}`}
                                    >
                                      <FileText className="w-3.5 h-3.5 text-[#31889C]" />
                                      <span className="truncate max-w-[170px]">Berkas Acuan: {refDocMatch[1]}</span>
                                      <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                                    </a>
                                  )}
                                  {refDriveUrl && (
                                    <a
                                      href={refDriveUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-bold bg-white hover:bg-amber-50 text-amber-800 border border-amber-200 transition-colors shadow-2xs"
                                      title="Buka Folder Google Drive Bahan Acuan Atasan"
                                    >
                                      <GoogleDriveIcon className="w-3.5 h-3.5" />
                                      <span>Link Terkait</span>
                                      <ExternalLink className="w-2.5 h-2.5 text-amber-600" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* 2. KOTAK BUKTI HASIL PELAKSANAAN DARI PIC */}
                            {(evidenceDocMatch || evidenceDriveUrl || allUrls.length > 0) ? (
                              <div className="p-2.5 rounded-xl bg-[#ECF8E9]/80 border border-[#BDE7B5] space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#2C6E20] flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4D8F3D]" />
                                    <span>Bukti Hasil Pelaksanaan PIC (Output)</span>
                                  </span>
                                  <span className="text-[9.5px] font-bold text-[#2C6E20] bg-white px-2 py-0.5 rounded-full border border-[#BDE7B5]">
                                    Bukti Selesai
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  {evidenceDocMatch && (
                                    <a
                                      href={evidenceDocMatch[2]}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-bold bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 transition-colors shadow-2xs"
                                      title={`Buka Berkas Bukti PIC: ${evidenceDocMatch[1]}`}
                                    >
                                      <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                                      <span className="truncate max-w-[170px]">Berkas Bukti: {evidenceDocMatch[1]}</span>
                                      <ExternalLink className="w-2.5 h-2.5 text-emerald-600" />
                                    </a>
                                  )}
                                  {evidenceDriveUrl && (
                                    <a
                                      href={evidenceDriveUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-bold bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 transition-colors shadow-2xs"
                                      title="Buka Folder Google Drive Bukti Hasil PIC"
                                    >
                                      <GoogleDriveIcon className="w-3.5 h-3.5" />
                                      <span>Google Drive Bukti Hasil</span>
                                      <ExternalLink className="w-2.5 h-2.5 text-emerald-600" />
                                    </a>
                                  )}
                                  {allUrls.map((url, idx) => (
                                    <GoogleDriveLinkCard
                                      key={url + idx}
                                      url={url}
                                      label={allUrls.length > 1 ? `Link Luaran ${idx + 1}` : (parsed.linkTitle || 'Tautan Bukti Luaran')}
                                      variant="badge"
                                    />
                                  ))}
                                </div>
                              </div>
                            ) : item.status === 'COMPLETED' ? (
                              <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                <span>Pekerjaan ditandai selesai tanpa berkas bukti dukung.</span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {(canEditThisItem(item) || canDeleteItem) && (
                      <>
                        {canEditThisItem(item) && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItem(item);
                              setIsFormOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-[#31889C] hover:bg-[#F0F9FA] rounded-lg transition-colors cursor-pointer"
                            title="Ubah Rincian Tindak Lanjut"
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

                {/* Details Footer Container */}
                <div className="space-y-2.5 pt-3 border-t border-slate-100 text-[12px]">
                  {/* Top Metadata Row: Tim, PIC, Deadline, Selesai */}
                  <div className="flex flex-wrap items-center gap-4 text-slate-600">
                    {/* Tim Penanggung Jawab */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Layers className="w-3.5 h-3.5 text-[#31889C]" />
                      {item.picTeam?.code === 'INV' || (!item.picTeam && item.picBiro?.code === 'IKK') ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Tim Investasi (INV)
                        </span>
                      ) : item.picTeam?.code === 'KS' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                          Tim Kerja Sama (KS)
                        </span>
                      ) : item.picTeam?.code === 'KOM' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Tim Komunikasi (KOM)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-50 text-slate-800 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          {item.picTeam
                            ? (item.picTeam.name.startsWith('Tim ') || item.picTeam.name.startsWith('Pokja')
                                ? item.picTeam.name
                                : `Tim ${item.picTeam.name}`)
                            : item.picBiro?.shortName || 'Tim Pelaksana'}
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

                    {/* Mulai Tindak Lanjut */}
                    {item.dueDate && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#31889C]" />
                        <span className="text-slate-600">
                          Mulai Tindak Lanjut:{' '}
                          <strong
                            className={
                              item.status === 'COMPLETED'
                                ? 'text-slate-700'
                                : isItemOverdue
                                ? 'text-rose-600 font-bold'
                                : 'text-slate-800'
                            }
                          >
                            {formatIndonesianDate(item.dueDate)}
                          </strong>
                        </span>
                        {item.status !== 'COMPLETED' && isItemOverdue && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            Terlambat
                          </span>
                        )}
                      </div>
                    )}

                    {/* Tanggal & Jam Dibuat (Upload) */}
                    {item.createdAt && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          Dibuat: {formatIndonesianDateTime(item.createdAt, true)}
                        </span>
                      </div>
                    )}

                    {/* Completed At */}
                    {item.completedAt && (
                      <div className="flex items-center gap-1 text-[#4D8F3D] font-medium">
                        <Check className="w-3.5 h-3.5" />
                        <span>Selesai: {formatIndonesianDateTime(item.completedAt, true)}</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action & Latest Note Row */}
                  <div className="pt-2.5 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Catatan Terbaru Bersih */}
                    <div className="flex items-center gap-2 min-w-0">
                      {(() => {
                        let noteText = item.latestLogNote || '';
                        noteText = noteText
                          .replace(/📎\s*(?:Dokumen Acuan|Dokumen Terkait|Bukti Pelaksanaan|Drive Acuan|Google Drive Acuan|Drive Bukti|Tautan Google Drive):?[^\n]*/gi, '')
                          .replace(/📝\s*(?:Catatan Capaian|Catatan Progres):?\s*/gi, '')
                          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
                          .trim();

                        return noteText ? (
                          <div className="flex items-center gap-1.5 text-[11.5px] text-slate-500 truncate max-w-[420px]">
                            <span className="font-semibold text-slate-600 shrink-0">Catatan Terbaru:</span>
                            <span className="truncate text-slate-700 font-medium" title={noteText}>
                              {noteText}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[11.5px] text-slate-400 italic">
                            <span>Belum ada catatan pembaruan</span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Controls & Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Tombol Utama: Update Status & Bukti (Jika Selesai, tampilkan status Selesai) */}
                      {canEditThisItem(item) && (
                        item.status === 'COMPLETED' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-[#2C6E20] border border-emerald-200 text-[11px] font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#4D8F3D]" />
                              <span>Selesai</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => openUpdateDialog(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-medium transition-all cursor-pointer"
                              title="Perbarui catatan atau link bukti penyelesaian"
                            >
                              <TrendingUp className="w-3 h-3 text-slate-500" />
                              <span>Ubah Bukti</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openUpdateDialog(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#31889C] hover:bg-[#266F80] text-white text-[11.5px] font-bold transition-all cursor-pointer shadow-2xs"
                            title="Perbarui progres pekerjaan, unggah link output, atau tandai selesai"
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>Update Progres &amp; Bukti</span>
                          </button>
                        )
                      )}
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
        currentMeeting={currentMeeting}
        lockMeeting={true}
        actionItem={editingItem}
        availableBiros={availableBiros}
        availableUsers={availableUsers}
        availableTeams={availableTeams}
        lockedBiroCode={userRole === 'STAFF' ? currentUser?.biroCode : undefined}
        lockedTeamCode={userStaffTeamCode || undefined}
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

      {/* Progress & Bukti Tindak Lanjut Modal Dialog */}
      <ActionItemUpdateProgressDialog
        isOpen={Boolean(updateProgressItem)}
        item={updateProgressItem}
        defaultStatus={targetStatus}
        defaultProgress={targetProgress}
        onClose={() => setUpdateProgressItem(null)}
        onSuccess={(updated: any) => {
          setItems((prev) =>
            prev.map((it) => (it.id === updated.id ? { ...it, ...updated } : it))
          );
          setUpdateProgressItem(null);
          router.refresh();
        }}
      />
    </div>
  );
}
