'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  TrendingUp,
  Layers,
  ChevronDown,
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
import { toast } from '@/components/providers/toast-provider';
import { cn } from '@/lib/utils';

interface ActionItemMatrixViewProps {
  initialItems: any[];
  availableMeetings: {
    id: string;
    meetingNumber: string;
    title: string;
    date?: Date | string | null;
    primaryBiro?: { code: string; name?: string } | null;
  }[];
  availableBiros: { id: string; code: string; shortName: string; name: string }[];
  availableUsers: { id: string; name: string; email?: string; biroId?: string }[];
  availableTeams?: { id: string; code: string; name: string; biroId?: string }[];
  lockedBiroCode?: string;
  currentUserRole?: string;
  currentUserBiroName?: string;
}

export function ActionItemMatrixView({
  initialItems = [],
  availableMeetings = [],
  availableBiros = [],
  availableUsers = [],
  availableTeams = [],
  lockedBiroCode,
  currentUserRole,
  currentUserBiroName,
}: ActionItemMatrixViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const userRole = currentUserRole || session?.user?.role || 'STAFF';
  const currentUserId = session?.user?.id;

  const canCreateItem =
    userRole === 'SUPER_ADMIN' ||
    userRole === 'ADMIN' ||
    userRole === 'STAFF';
  const canDeleteItem = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';

  const canEditTask = (task: any) => {
    if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') return true;
    if (userRole === 'STAFF') {
      return Boolean(task.picUserId && currentUserId && task.picUserId === currentUserId);
    }
    return false;
  };
  const rawStatus = searchParams.get('status') || 'ALL';
  const statusParam = useMemo(() => {
    const s = rawStatus.toUpperCase();
    if (s === 'SEDANG-BERJALAN' || s === 'IN_PROGRESS' || s === 'ON PROGRESS' || s === 'ON PROGRES' || s === 'BERJALAN') return 'IN_PROGRESS';
    if (s === 'SELESAI' || s === 'COMPLETED' || s === 'FINISH') return 'COMPLETED';
    if (s === 'BELUM-DIMULAI' || s === 'PENDING' || s === 'START' || s === 'MENUNGGU') return 'PENDING';
    if (s === 'TERLAMBAT' || s === 'OVERDUE') return 'OVERDUE';
    return s;
  }, [rawStatus]);
  const teamParam = searchParams.get('tim') || 'ALL';
  const priorityParam = searchParams.get('prioritas') || 'ALL';

  const [items, setItems] = useState<any[]>(initialItems);
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>(teamParam);
  const [selectedPriority, setSelectedPriority] = useState<string>(priorityParam);
  const [openDropdown, setOpenDropdown] = useState<'TIM' | 'STATUS' | 'PRIORITAS' | null>(null);
  const filterToolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterToolbarRef.current && !filterToolbarRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openDropdown]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMeetingIdForCreate, setSelectedMeetingIdForCreate] = useState<string>(
    availableMeetings[0]?.id || ''
  );
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ActionItem | null>(null);
  const [loggingItem, setLoggingItem] = useState<ActionItem | null>(null);
  const [dialogInitialTab, setDialogInitialTab] = useState<'trail' | 'update'>('update');
  const [dialogDefaultStatus, setDialogDefaultStatus] = useState<ActionItemStatus | undefined>(undefined);
  const [dialogDefaultProgress, setDialogDefaultProgress] = useState<number | undefined>(undefined);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);

  const ikkTeamsList = useMemo(() => {
    return [
      { code: 'INV', name: 'Tim Investasi', shortName: 'Investasi', dotColor: 'bg-emerald-500' },
      { code: 'KS', name: 'Tim Kerja Sama', shortName: 'Kerja Sama', dotColor: 'bg-sky-500' },
      { code: 'KOM', name: 'Tim Komunikasi', shortName: 'Komunikasi', dotColor: 'bg-amber-500' },
    ];
  }, []);

  const getTaskTeamInfo = (task: any) => {
    const teamName = task.picTeam?.name?.toLowerCase() || '';
    const teamCode = task.picTeam?.code?.toUpperCase() || '';
    const meetingCode = task.meeting?.meetingNumber?.toUpperCase() || '';

    if (teamCode === 'INV' || teamName.includes('investasi') || meetingCode.startsWith('INV-')) {
      return {
        code: 'INV',
        name: 'Tim Investasi',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/90',
        dotColor: 'bg-emerald-500',
        refBadgeClass: 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100',
      };
    }
    if (teamCode === 'KS' || teamName.includes('kerja sama') || teamName.includes('kerjasama') || meetingCode.startsWith('KS-')) {
      return {
        code: 'KS',
        name: 'Tim Kerja Sama',
        badgeClass: 'bg-sky-50 text-sky-800 border-sky-200/90',
        dotColor: 'bg-sky-500',
        refBadgeClass: 'bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100',
      };
    }
    if (teamCode === 'KOM' || teamName.includes('komunikasi') || meetingCode.startsWith('KOM-')) {
      return {
        code: 'KOM',
        name: 'Tim Komunikasi',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/90',
        dotColor: 'bg-amber-500',
        refBadgeClass: 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100',
      };
    }
    return {
      code: 'INV',
      name: task.picTeam?.name ? `Tim ${task.picTeam.name}` : 'Tim Investasi',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/90',
      dotColor: 'bg-emerald-500',
      refBadgeClass: 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100',
    };
  };

  const openUpdateDialog = (task: ActionItem, targetStatus?: ActionItemStatus, targetProgress?: number) => {
    setLoggingItem(task);
    setDialogInitialTab('update');
    setDialogDefaultStatus(targetStatus || task.status);
    setDialogDefaultProgress(
      targetProgress !== undefined
        ? targetProgress
        : targetStatus === 'COMPLETED'
        ? 100
        : task.latestProgress
    );
  };

  const openAuditTrailDialog = (task: ActionItem) => {
    setLoggingItem(task);
    setDialogInitialTab('trail');
    setDialogDefaultStatus(task.status);
    setDialogDefaultProgress(task.latestProgress);
  };

  /**
   * Export Excel — uses the same active filters as the visible table.
   * Consistency: UI row count == Excel row count.
   */
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      if (statusParam && statusParam !== 'ALL') params.set('status', statusParam);
      if (selectedTeam && selectedTeam !== 'ALL') params.set('biro', selectedTeam);
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
      if (selectedTeam && selectedTeam !== 'ALL') params.set('biro', selectedTeam);
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

  const statusOptions = [
    { label: 'Semua Status', value: 'ALL', count: totalCount, dotColor: 'bg-slate-400' },
    { label: 'Start', value: 'PENDING', count: pendingCount, dotColor: 'bg-amber-500' },
    { label: 'On Progress', value: 'IN_PROGRESS', count: inProgressCount, dotColor: 'bg-sky-500' },
    { label: 'Finish', value: 'COMPLETED', count: completedCount, dotColor: 'bg-emerald-500' },
    { label: 'Terlambat', value: 'OVERDUE', count: overdueCount, dotColor: 'bg-rose-500' },
  ];

  const priorityOptions = [
    { label: 'Semua Prioritas', value: 'ALL', count: totalCount },
    { label: 'Sangat Mendesak', value: 'URGENT', count: items.filter((i) => i.priority === 'URGENT').length },
    { label: 'Tinggi', value: 'HIGH', count: items.filter((i) => i.priority === 'HIGH').length },
    { label: 'Sedang', value: 'MEDIUM', count: items.filter((i) => i.priority === 'MEDIUM').length },
    { label: 'Rendah', value: 'LOW', count: items.filter((i) => i.priority === 'LOW').length },
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

  const handleSelectTeam = (code: string) => {
    setSelectedTeam(code);
    const params = new URLSearchParams(searchParams.toString());
    if (code === 'ALL') {
      params.delete('tim');
    } else {
      params.set('tim', code);
    }
    router.push(`/tindak-lanjut?${params.toString()}`);
  };

  const handleSelectPriority = (val: string) => {
    setSelectedPriority(val);
    const params = new URLSearchParams(searchParams.toString());
    if (val === 'ALL') {
      params.delete('prioritas');
    } else {
      params.set('prioritas', val);
    }
    router.push(`/tindak-lanjut?${params.toString()}`);
  };

  const handleResetAllFilters = () => {
    setSearch('');
    setSelectedTeam('ALL');
    setSelectedPriority('ALL');
    router.push('/tindak-lanjut');
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
      toast.error(`Terjadi kesalahan: ${err?.message || 'Gagal'}`);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const filteredTasks = useMemo(() => {
    return items.filter((task) => {
      const isOverdue =
        task.status !== 'COMPLETED' && new Date(task.dueDate).getTime() < Date.now();

      // Status filter
      if (statusParam !== 'ALL') {
        if (statusParam === 'OVERDUE') {
          if (!isOverdue) return false;
        } else if (task.status !== statusParam) {
          return false;
        }
      }

      // Team filter
      if (selectedTeam !== 'ALL') {
        const teamInfo = getTaskTeamInfo(task);
        if (teamInfo.code !== selectedTeam) {
          return false;
        }
      }

      // Priority filter
      if (selectedPriority !== 'ALL') {
        if (task.priority !== selectedPriority) {
          return false;
        }
      }

      // Search filter
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const teamInfo = getTaskTeamInfo(task);
      const titleMatch = task.title?.toLowerCase().includes(q);
      const descMatch = task.description?.toLowerCase().includes(q);
      const meetingMatch = task.meeting?.meetingNumber?.toLowerCase().includes(q);
      const teamMatch =
        teamInfo.name.toLowerCase().includes(q) ||
        teamInfo.code.toLowerCase().includes(q);
      const userMatch = task.picUser?.name?.toLowerCase().includes(q);

      return titleMatch || descMatch || meetingMatch || teamMatch || userMatch;
    });
  }, [items, statusParam, selectedTeam, selectedPriority, search]);

  const selectedTeamLabel = selectedTeam === 'ALL'
    ? 'Semua Tim Kerja'
    : (ikkTeamsList.find((t) => t.code === selectedTeam)?.name || selectedTeam);

  const selectedStatusObj = statusOptions.find((s) => s.value === statusParam) || statusOptions[0];
  const selectedStatusLabel = selectedStatusObj.label;
  const selectedStatusDot = selectedStatusObj.dotColor;
  const selectedStatusCount = selectedStatusObj.count;

  const selectedPriorityObj = priorityOptions.find((p) => p.value === selectedPriority) || priorityOptions[0];
  const selectedPriorityLabel = selectedPriorityObj.label;

  const hasAnyActiveFilter = Boolean(
    search.trim() ||
    (statusParam && statusParam !== 'ALL') ||
    selectedTeam !== 'ALL' ||
    selectedPriority !== 'ALL'
  );

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
      {/* Header Card dengan Metrik Eksekutif Modern */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="max-w-2xl">
          <span className="font-bold text-[11px] text-[#31889C] uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Matriks Disposisi &amp; Pemantauan Dewan
          </span>
          <h1 className="text-[24px] font-extrabold text-slate-900 mt-1 tracking-tight">
            Monitoring &amp; Evaluasi Tindak Lanjut
          </h1>
          <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">
            Pantau realisasi komitmen keputusan rapat dewan KEK per tim kerja pelaksana dan penanggung jawab teknis.
          </p>
        </div>

        {/* Executive KPI Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0">
          {/* Total */}
          <div className="px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:border-[#31889C]/50 transition-all flex flex-col justify-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#31889C]" />
              Total
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-[20px] font-black text-slate-900 tracking-tight">{totalCount}</span>
              <span className="text-[10.5px] text-slate-400 font-medium">butir</span>
            </div>
          </div>

          {/* Start */}
          <div className="px-3.5 py-2.5 rounded-2xl border border-amber-200/90 bg-amber-50/50 shadow-2xs hover:border-amber-300 transition-all flex flex-col justify-center">
            <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Start
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-[20px] font-black text-amber-700 tracking-tight">{pendingCount}</span>
              <span className="text-[10.5px] text-amber-600/70 font-medium">butir</span>
            </div>
          </div>

          {/* On Progress */}
          <div className="px-3.5 py-2.5 rounded-2xl border border-sky-200/90 bg-sky-50/50 shadow-2xs hover:border-sky-300 transition-all flex flex-col justify-center">
            <span className="text-[10px] text-sky-700 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              On Progress
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-[20px] font-black text-sky-700 tracking-tight">{inProgressCount}</span>
              <span className="text-[10.5px] text-sky-600/70 font-medium">proses</span>
            </div>
          </div>

          {/* Finish */}
          <div className="px-3.5 py-2.5 rounded-2xl border border-emerald-200/90 bg-emerald-50/50 shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-center">
            <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Finish
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-[20px] font-black text-emerald-700 tracking-tight">{completedCount}</span>
              <span className="text-[10.5px] text-emerald-600/70 font-semibold">selesai</span>
            </div>
          </div>

          {/* Terlambat */}
          <div className="col-span-2 sm:col-span-1 px-3.5 py-2.5 rounded-2xl border border-rose-200/90 bg-rose-50/50 shadow-2xs hover:border-rose-300 transition-all flex flex-col justify-center">
            <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              Terlambat
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-[20px] font-black text-rose-700 tracking-tight">{overdueCount}</span>
              <span className="text-[10.5px] text-rose-600/70 font-medium">atensi</span>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL FILTER & KONTROL TERPADU (Single-Row Modern Dropdown Toolbar) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col relative z-20">
        <div ref={filterToolbarRef} className="p-3 sm:p-3.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
          {/* 1. Input Pencarian Prominen */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-[#31889C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari butir tindak lanjut, ref. rapat, tim kerja, atau PIC..."
              className="w-full pl-9 pr-8 py-2 text-[12.5px] bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/90 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 focus:border-[#31889C] transition-all shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 2. Kelompok Filter Dropdown & Aksi */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Dropdown: Tim Kerja */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'TIM' ? null : 'TIM')}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all cursor-pointer border select-none",
                  selectedTeam !== 'ALL'
                    ? "bg-[#F0F9FA] border-[#31889C] text-[#164E59] shadow-2xs font-bold"
                    : openDropdown === 'TIM'
                      ? "bg-slate-100 border-slate-300 text-slate-900"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                )}
                title="Filter berdasarkan Tim Kerja Pelaksana"
              >
                <Layers className={cn("w-3.5 h-3.5 shrink-0", selectedTeam !== 'ALL' ? "text-[#31889C]" : "text-slate-500")} />
                <span className="truncate max-w-[130px]">{selectedTeamLabel}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5",
                    selectedTeam !== 'ALL' ? "bg-[#31889C] text-white" : "bg-slate-100 text-slate-600"
                  )}
                >
                  {selectedTeam !== 'ALL' ? items.filter((i) => getTaskTeamInfo(i).code === selectedTeam).length : items.length}
                </span>
                <ChevronDown
                  className={cn(
                    "w-3 h-3 transition-transform text-slate-400",
                    openDropdown === 'TIM' && "rotate-180 text-[#31889C]"
                  )}
                />
              </button>

              {openDropdown === 'TIM' && (
                <div className="absolute left-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200/90 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Pilih Tim Kerja
                  </div>
                  <button
                    type="button"
                    onClick={() => { handleSelectTeam('ALL'); setOpenDropdown(null); }}
                    className={cn(
                      "flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-[12px] text-left transition-colors cursor-pointer",
                      selectedTeam === 'ALL' ? "bg-[#F0F9FA] text-[#164E59] font-bold" : "hover:bg-slate-50 text-slate-700 font-medium"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>Semua Tim Kerja</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-[10.5px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-semibold">
                        {items.length}
                      </span>
                      {selectedTeam === 'ALL' && <Check className="w-3.5 h-3.5 text-[#31889C]" />}
                    </span>
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  {ikkTeamsList.map((t) => {
                    const isSelected = selectedTeam === t.code;
                    const countForTeam = items.filter((i) => getTaskTeamInfo(i).code === t.code).length;
                    return (
                      <button
                        key={t.code}
                        type="button"
                        onClick={() => { handleSelectTeam(t.code); setOpenDropdown(null); }}
                        className={cn(
                          "flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-[12px] text-left transition-colors cursor-pointer",
                          isSelected ? "bg-[#F0F9FA] text-[#164E59] font-bold" : "hover:bg-slate-50 text-slate-700 font-medium"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span className={cn("w-1.5 h-1.5 rounded-full", t.dotColor)} />
                          <span>{t.name}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="text-[10.5px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-semibold">
                            {countForTeam}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#31889C]" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dropdown: Status */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'STATUS' ? null : 'STATUS')}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all cursor-pointer border select-none",
                  statusParam !== 'ALL'
                    ? "bg-[#F0F9FA] border-[#31889C] text-[#164E59] shadow-2xs font-bold"
                    : openDropdown === 'STATUS'
                      ? "bg-slate-100 border-slate-300 text-slate-900"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                )}
                title="Filter berdasarkan Status Penyelesaian"
              >
                <span className={cn("w-2 h-2 rounded-full shrink-0", selectedStatusDot)} />
                <span className="truncate max-w-[120px]">{selectedStatusLabel}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5",
                    statusParam !== 'ALL' ? "bg-[#31889C] text-white" : "bg-slate-100 text-slate-600"
                  )}
                >
                  {selectedStatusCount}
                </span>
                <ChevronDown
                  className={cn(
                    "w-3 h-3 transition-transform text-slate-400",
                    openDropdown === 'STATUS' && "rotate-180 text-[#31889C]"
                  )}
                />
              </button>

              {openDropdown === 'STATUS' && (
                <div className="absolute left-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200/90 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Status Tindak Lanjut
                  </div>
                  {statusOptions.map((st) => {
                    const isActive = statusParam === st.value;
                    return (
                      <button
                        key={st.value}
                        type="button"
                        onClick={() => { handleSelectStatus(st.value); setOpenDropdown(null); }}
                        className={cn(
                          "flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-[12px] text-left transition-colors cursor-pointer",
                          isActive ? "bg-[#F0F9FA] text-[#164E59] font-bold" : "hover:bg-slate-50 text-slate-700 font-medium"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className={cn("w-2 h-2 rounded-full shrink-0", st.dotColor)} />
                          <span>{st.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10.5px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-semibold">
                            {st.count}
                          </span>
                          {isActive && <Check className="w-3.5 h-3.5 text-[#31889C]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dropdown: Prioritas */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'PRIORITAS' ? null : 'PRIORITAS')}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all cursor-pointer border select-none",
                  selectedPriority !== 'ALL'
                    ? "bg-[#F0F9FA] border-[#31889C] text-[#164E59] shadow-2xs font-bold"
                    : openDropdown === 'PRIORITAS'
                      ? "bg-slate-100 border-slate-300 text-slate-900"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                )}
                title="Filter berdasarkan Skala Prioritas"
              >
                <TrendingUp className={cn("w-3.5 h-3.5 shrink-0", selectedPriority !== 'ALL' ? "text-[#31889C]" : "text-slate-500")} />
                <span className="truncate max-w-[120px]">{selectedPriorityLabel}</span>
                <ChevronDown
                  className={cn(
                    "w-3 h-3 transition-transform text-slate-400",
                    openDropdown === 'PRIORITAS' && "rotate-180 text-[#31889C]"
                  )}
                />
              </button>

              {openDropdown === 'PRIORITAS' && (
                <div className="absolute right-0 sm:left-0 sm:right-auto mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-slate-200/90 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Skala Prioritas
                  </div>
                  {priorityOptions.map((pr) => {
                    const isActive = selectedPriority === pr.value;
                    return (
                      <button
                        key={pr.value}
                        type="button"
                        onClick={() => { handleSelectPriority(pr.value); setOpenDropdown(null); }}
                        className={cn(
                          "flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-[12px] text-left transition-colors cursor-pointer",
                          isActive ? "bg-[#F0F9FA] text-[#164E59] font-bold" : "hover:bg-slate-50 text-slate-700 font-medium"
                        )}
                      >
                        <span>{pr.label}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10.5px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-semibold">
                            {pr.count}
                          </span>
                          {isActive && <Check className="w-3.5 h-3.5 text-[#31889C]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Export Buttons (Excel & Word) */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs">
              <button
                type="button"
                id="export-excel-btn"
                onClick={handleExportExcel}
                disabled={isExporting || isExportingDocx}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 font-semibold text-[11.5px] transition-colors cursor-pointer"
                title="Ekspor ke Excel"
              >
                {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
                <span className="hidden sm:inline">Excel</span>
              </button>
              <div className="w-px h-4 bg-slate-200 my-auto" />
              <button
                type="button"
                id="export-docx-btn"
                onClick={handleExportDocx}
                disabled={isExporting || isExportingDocx}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-blue-700 hover:bg-blue-50 font-semibold text-[11.5px] transition-colors cursor-pointer"
                title="Ekspor ke Microsoft Word"
              >
                {isExportingDocx ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 text-blue-600" />}
                <span className="hidden sm:inline">Word</span>
              </button>
            </div>

            {/* Tambah Tindak Lanjut Button */}
            {canCreateItem && availableMeetings.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setIsFormOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#31889C] hover:bg-[#266F80] text-white font-semibold text-[12px] shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tindak Lanjut</span>
              </button>
            )}

            {/* Reset Button (If active) */}
            {hasAnyActiveFilter && (
              <button
                type="button"
                onClick={handleResetAllFilters}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl border border-red-200 bg-red-50/70 hover:bg-red-100 text-red-600 text-[12px] font-semibold transition-all cursor-pointer shadow-2xs"
                title="Reset semua filter"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Chips Summary */}
        {hasAnyActiveFilter && (
          <div className="px-4 py-2 bg-gradient-to-r from-[#F0F9FA]/80 via-white to-[#F0F9FA]/40 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs rounded-b-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11.5px] font-bold text-slate-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#31889C] animate-pulse" />
                Filter Aktif:
              </span>

              {search && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#BCE3EB] text-[#1B5260] font-semibold text-[11px] shadow-2xs">
                  Cari: &ldquo;{search}&rdquo;
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="hover:text-red-600 ml-0.5 cursor-pointer font-bold"
                  >
                    ✕
                  </button>
                </span>
              )}

              {selectedTeam !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#BCE3EB] text-[#1B5260] font-semibold text-[11px] shadow-2xs">
                  Tim: {selectedTeamLabel}
                  <button
                    type="button"
                    onClick={() => handleSelectTeam('ALL')}
                    className="hover:text-red-600 ml-0.5 cursor-pointer font-bold"
                  >
                    ✕
                  </button>
                </span>
              )}

              {statusParam !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#BCE3EB] text-[#1B5260] font-semibold text-[11px] shadow-2xs">
                  Status: {selectedStatusLabel}
                  <button
                    type="button"
                    onClick={() => handleSelectStatus('ALL')}
                    className="hover:text-red-600 ml-0.5 cursor-pointer font-bold"
                  >
                    ✕
                  </button>
                </span>
              )}

              {selectedPriority !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#BCE3EB] text-[#1B5260] font-semibold text-[11px] shadow-2xs">
                  Prioritas: {selectedPriorityLabel}
                  <button
                    type="button"
                    onClick={() => handleSelectPriority('ALL')}
                    className="hover:text-red-600 ml-0.5 cursor-pointer font-bold"
                  >
                    ✕
                  </button>
                </span>
              )}

              <span className="text-slate-500 text-[11.5px] ml-1 font-medium">
                (Ditemukan <strong className="text-slate-800">{filteredTasks.length}</strong> butir tindak lanjut)
              </span>
            </div>

            <button
              type="button"
              onClick={handleResetAllFilters}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#31889C] hover:text-red-600 bg-white px-2.5 py-1 rounded-lg border border-[#BCE3EB] hover:border-red-200 transition-colors cursor-pointer shadow-2xs ml-auto"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Semua Filter</span>
            </button>
          </div>
        )}
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-800 text-[13px]">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Ref. Rapat</th>
                <th className="py-3.5 px-4 min-w-[280px]">Butir Tindak Lanjut</th>
                <th className="py-3.5 px-4">Tim Kerja &amp; PIC</th>
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
                        onClick={handleResetAllFilters}
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
                  const teamInfo = getTaskTeamInfo(task);

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-[#F0F9FA]/70 transition-colors group"
                    >
                      {/* Ref. Rapat */}
                      <td className="py-3.5 px-4 align-top">
                        {task.meeting ? (
                          <Link
                            href={`/semua-rapat/${task.meeting.id}`}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono font-bold text-[12px] shadow-2xs transition-all",
                              teamInfo.refBadgeClass
                            )}
                            title={task.meeting.title}
                          >
                            <span>{task.meeting.meetingNumber}</span>
                            <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
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

                      {/* Tim Kerja & PIC */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex flex-col items-start gap-1">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-lg border text-[11px] shadow-2xs",
                            teamInfo.badgeClass
                          )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", teamInfo.dotColor)} />
                            <span>{teamInfo.name}</span>
                          </span>

                          {task.picUser ? (
                            <p className="text-[11.5px] text-slate-700 font-medium truncate max-w-[170px] mt-0.5 flex items-center gap-1">
                              <span className="text-slate-400">👤</span>
                              <span>{task.picUser.name}</span>
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic">Belum ada PIC</p>
                          )}
                        </div>
                      </td>

                      {/* Tenggat Waktu */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`font-semibold text-[12px] ${
                              isItemOverdue ? 'text-red-600 font-bold' : 'text-slate-700'
                            }`}
                          >
                            {formatIndonesianDate(task.dueDate)}
                          </span>
                          {isItemOverdue && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 shadow-2xs">
                              <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />
                              Lewat Tenggat
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Prioritas */}
                      <td className="py-3.5 px-4 align-top">
                        <ActionItemPriorityBadge priority={task.priority} />
                      </td>

                      {/* Status (Start / On Progress / Finish) */}
                      <td className="py-3.5 px-4 align-top">
                        {canEditTask(task) ? (
                          <button
                            type="button"
                            onClick={() => openUpdateDialog(task)}
                            className="cursor-pointer transition-transform hover:scale-105 text-left inline-block"
                            title="Klik untuk memperbarui status tindak lanjut"
                          >
                            <ActionItemStatusBadge
                              status={task.status}
                              isOverdue={isItemOverdue}
                            />
                          </button>
                        ) : (
                          <ActionItemStatusBadge
                            status={task.status}
                            isOverdue={isItemOverdue}
                          />
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick Finish - opens evidence modal prefilled to COMPLETED */}
                          {canEditTask(task) && task.status !== 'COMPLETED' && (
                            <button
                              type="button"
                              onClick={() => openUpdateDialog(task, 'COMPLETED', 100)}
                              className="p-1 rounded text-[#4D8F3D] hover:bg-[#ECF8E9] transition-colors cursor-pointer"
                              title="Tandai Finish (Catat Hasil & Bukti Dukung)"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Update Progres button */}
                          {canEditTask(task) && (
                            <button
                              type="button"
                              onClick={() => openUpdateDialog(task)}
                              className="p-1 text-[#31889C] hover:text-[#215865] hover:bg-[#F0F9FA] rounded transition-colors cursor-pointer"
                              title="Update Progres & Bukti Tindak Lanjut"
                            >
                              <TrendingUp className="w-4 h-4" />
                            </button>
                          )}

                          {/* Audit Trail & Progress Log button */}
                          <button
                            type="button"
                            onClick={() => openAuditTrailDialog(task)}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors cursor-pointer relative"
                            title="Lihat Riwayat & Catatan Progres"
                          >
                            <History className="w-4 h-4" />
                            {Boolean(task.logsCount && task.logsCount > 0) && (
                              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#31889C] text-white text-[8px] font-bold flex items-center justify-center">
                                {task.logsCount}
                              </span>
                            )}
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
        availableMeetings={availableMeetings}
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
        initialTab={dialogInitialTab}
        defaultStatus={dialogDefaultStatus}
        defaultProgress={dialogDefaultProgress}
        canEdit={Boolean(loggingItem && canEditTask(loggingItem))}
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
