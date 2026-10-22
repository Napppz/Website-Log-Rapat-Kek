'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Info,
  CheckCheck,
  ExternalLink,
  BellRing,
  Loader2,
  RefreshCw,
  AlertOctagon,
  Trash2,
  X,
  Sparkles,
  Calendar,
  Users,
  Filter,
  ListTodo,
} from 'lucide-react';
import {
  getNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  deleteNotificationAction,
  clearAllReadNotificationsAction,
  NotificationItem,
  TeamInfo,
} from '@/app/actions/notification-actions';
import { toast } from '@/components/providers/toast-provider';
import { useNotifications } from '@/components/providers/notification-provider';

export type { NotificationItem, TeamInfo };

interface NotifikasiClientProps {
  initialNotifications: NotificationItem[];
  initialUnreadCount: number;
  initialCurrentTeam?: TeamInfo | null;
  availableTeams?: TeamInfo[];
  isSuperAdmin?: boolean;
  initialError?: string | null;
}

export function NotifikasiClient({
  initialNotifications = [],
  initialUnreadCount = 0,
  initialCurrentTeam = null,
  availableTeams = [],
  isSuperAdmin = false,
  initialError = null,
}: NotifikasiClientProps) {
  const { setUnreadCount: setGlobalUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState<number>(initialUnreadCount);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'ASSIGNMENT'>('ALL');
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError || null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [isClearingRead, setIsClearingRead] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Sync initial unread count on mount
  React.useEffect(() => {
    setGlobalUnreadCount(initialUnreadCount);
  }, [initialUnreadCount, setGlobalUnreadCount]);

  // Switch team filter (for Super Admin / Admin)
  const handleTeamChange = async (teamId: string) => {
    try {
      setSelectedTeamId(teamId);
      setIsRetrying(true);
      const res = await getNotificationsAction(teamId);
      if (res.success && res.data) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
        setGlobalUnreadCount(res.data.unreadCount);
        setErrorMessage(null);
      } else {
        toast.error(res.error || 'Gagal memuat notifikasi tim.');
      }
    } catch {
      toast.error('Gagal beralih filter tim notifikasi.');
    } finally {
      setIsRetrying(false);
    }
  };

  // Manual refresh / retry handler with robust error catching
  const handleRetry = async () => {
    try {
      setIsRetrying(true);
      const res = await getNotificationsAction(selectedTeamId);
      if (res.success && res.data) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
        setGlobalUnreadCount(res.data.unreadCount);
        setErrorMessage(null);
        toast.success('Daftar notifikasi berhasil diperbarui.');
      } else {
        const errText = res.error || 'Gagal memuat daftar notifikasi sistem.';
        setErrorMessage(errText);
        toast.error(errText);
      }
    } catch (err: any) {
      const errText = err?.message || 'Terjadi kesalahan saat memuat notifikasi.';
      setErrorMessage(errText);
      toast.error(errText);
    } finally {
      setIsRetrying(false);
    }
  };

  // Mark all read with optimistic rollback on error
  const handleMarkAllRead = async () => {
    const previousNotifications = [...notifications];
    const previousUnread = unreadCount;

    try {
      setIsMarkingAll(true);
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      setGlobalUnreadCount(0);

      const res = await markAllNotificationsAsReadAction(selectedTeamId);
      if (res.success) {
        toast.success('Semua notifikasi telah ditandai sebagai dibaca.');
      } else {
        // Rollback
        setNotifications(previousNotifications);
        setUnreadCount(previousUnread);
        setGlobalUnreadCount(previousUnread);
        toast.error(res.error || 'Gagal memperbarui notifikasi.');
      }
    } catch {
      // Rollback
      setNotifications(previousNotifications);
      setUnreadCount(previousUnread);
      setGlobalUnreadCount(previousUnread);
      toast.error('Terjadi kendala saat menandai semua dibaca.');
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Click on single notification with error rollback
  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      // Optimistic
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setGlobalUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        const res = await markNotificationAsReadAction(notif.id);
        if (!res.success) {
          // Rollback if server refused
          setNotifications((prev) =>
            prev.map((n) => (n.id === notif.id ? { ...n, isRead: false } : n))
          );
          setUnreadCount((prev) => prev + 1);
          setGlobalUnreadCount((prev) => prev + 1);
          toast.error(res.error || 'Gagal memperbarui status notifikasi.');
        }
      } catch {
        // Rollback
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: false } : n))
        );
        setUnreadCount((prev) => prev + 1);
        setGlobalUnreadCount((prev) => prev + 1);
        toast.error('Gagal memperbarui notifikasi.');
      }
    }
  };

  // Delete a single notification
  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const itemToDelete = notifications.find((n) => n.id === id);
    if (!itemToDelete) return;

    const previousNotifications = [...notifications];
    const previousUnread = unreadCount;

    // Optimistic remove
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (!itemToDelete.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setGlobalUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setActionLoadingId(id);

    try {
      const res = await deleteNotificationAction(id);
      if (res.success) {
        toast.success('Notifikasi berhasil dihapus.');
      } else {
        // Rollback
        setNotifications(previousNotifications);
        setUnreadCount(previousUnread);
        if (!itemToDelete.isRead) {
          setGlobalUnreadCount(previousUnread);
        }
        toast.error(res.error || 'Gagal menghapus notifikasi.');
      }
    } catch {
      // Rollback
      setNotifications(previousNotifications);
      setUnreadCount(previousUnread);
      if (!itemToDelete.isRead) {
        setGlobalUnreadCount(previousUnread);
      }
      toast.error('Gagal menghapus notifikasi.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Clear all read notifications
  const handleClearRead = async () => {
    const readItems = notifications.filter((n) => n.isRead);
    if (readItems.length === 0) {
      toast.info('Tidak ada notifikasi yang telah dibaca untuk dibersihkan.');
      return;
    }

    const previousNotifications = [...notifications];

    try {
      setIsClearingRead(true);
      // Optimistic
      setNotifications((prev) => prev.filter((n) => !n.isRead));

      const res = await clearAllReadNotificationsAction(selectedTeamId);
      if (res.success) {
        toast.success(`${readItems.length} notifikasi yang telah dibaca berhasil dibersihkan.`);
      } else {
        // Rollback
        setNotifications(previousNotifications);
        toast.error(res.error || 'Gagal membersihkan notifikasi yang dibaca.');
      }
    } catch {
      // Rollback
      setNotifications(previousNotifications);
      toast.error('Terjadi kesalahan saat membersihkan notifikasi.');
    } finally {
      setIsClearingRead(false);
    }
  };

  const formatRelativeTime = (dateVal: Date | string) => {
    try {
      const now = Date.now();
      const past = new Date(dateVal).getTime();
      const diffMs = now - past;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Baru saja';
      if (diffMins < 60) return `${diffMins} menit yang lalu`;
      if (diffHours < 24) return `${diffHours} jam yang lalu`;
      if (diffDays === 1) return 'Kemarin';
      if (diffDays < 7) return `${diffDays} hari yang lalu`;
      return new Date(dateVal).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(dateVal);
    }
  };

  const filtered = notifications.filter((item) => {
    if (activeTab === 'UNREAD') return !item.isRead;
    if (activeTab === 'ASSIGNMENT') {
      return (
        item.type === 'kegiatan' ||
        item.type === 'tindak_lanjut' ||
        item.type === 'meeting' ||
        item.type === 'action_item'
      );
    }
    return true;
  });

  const readCount = notifications.filter((n) => n.isRead).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-semibold text-[12px] text-[#31889C] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Pusat Pemberitahuan Sistem
          </span>
          <h1 className="text-[24px] font-bold text-slate-900 mt-0.5">
            Notifikasi &amp; Peringatan Tim
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Pemberitahuan resmi mengenai kegiatan, risalah catatan kegiatan, dan eskalasi per tim kerja.
          </p>
          {initialCurrentTeam && (
            <div className="mt-2.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5F7] border border-[#BCE3EB] text-[#215865] text-[12px] font-bold">
                <Users className="w-3.5 h-3.5 text-[#31889C]" />
                <span>Tim Kerja: {initialCurrentTeam.name} ({initialCurrentTeam.code})</span>
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 && (
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[12px] font-bold">
              {unreadCount} Belum Dibaca
            </span>
          )}

          {/* Refresh button */}
          <button
            type="button"
            disabled={isRetrying}
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-[#F0F9FA] text-slate-700 hover:text-[#31889C] text-[12px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
            title="Muat ulang notifikasi dari server"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#31889C] ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Memuat...' : 'Muat Ulang'}</span>
          </button>

          {/* Mark all as read */}
          <button
            type="button"
            disabled={isMarkingAll || unreadCount === 0}
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-[#F0F9FA] text-slate-700 hover:text-[#31889C] text-[12px] font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isMarkingAll ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4 text-[#31889C]" />
            )}
            <span>Tandai Semua Dibaca</span>
          </button>

          {/* Clear read notifications */}
          {readCount > 0 && (
            <button
              type="button"
              disabled={isClearingRead}
              onClick={handleClearRead}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 text-[12px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
              title="Hapus semua notifikasi yang sudah dibaca"
            >
              {isClearingRead ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Bersihkan Yang Dibaca</span>
            </button>
          )}
        </div>
      </div>

      {/* Super Admin Team Filter Bar */}
      {isSuperAdmin && availableTeams.length > 0 && (
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col gap-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-[12.5px] font-bold text-slate-700 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-[#31889C]" />
              Filter Notifikasi Per Tim Kerja:
            </span>
            <span className="text-[11.5px] text-slate-500">
              Menampilkan notifikasi khusus tim kerja yang dipilih
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
            <button
              type="button"
              onClick={() => handleTeamChange('ALL')}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedTeamId === 'ALL'
                  ? 'bg-[#31889C] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              Semua Tim ({notifications.length})
            </button>
            {availableTeams.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTeamChange(t.id)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedTeamId === t.id
                    ? 'bg-[#31889C] text-white shadow-xs ring-2 ring-[#31889C]/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/10">{t.code}</span>
                <span>{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Alert Banner if an error occurred */}
      {errorMessage && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50/90 text-red-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-100 border border-red-300 text-red-700 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-[13px] font-bold text-red-900">
                Terjadi Kendala Memuat Notifikasi
              </h4>
              <p className="text-[12px] text-red-700 mt-0.5 leading-relaxed">
                {errorMessage}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              disabled={isRetrying}
              onClick={handleRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[12px] font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Menghubungkan...' : 'Coba Lagi'}</span>
            </button>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 transition-colors"
              title="Tutup Pesan Error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'ALL'
              ? 'bg-[#31889C] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Semua ({notifications.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('UNREAD')}
          className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'UNREAD'
              ? 'bg-[#31889C] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Belum Dibaca ({unreadCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ASSIGNMENT')}
          className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'ASSIGNMENT'
              ? 'bg-[#31889C] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Penugasan PIC (
          {
            notifications.filter(
              (n) =>
                n.type === 'kegiatan' ||
                n.type === 'tindak_lanjut' ||
                n.type === 'meeting' ||
                n.type === 'action_item'
            ).length
          }
          )
        </button>
      </div>

      {/* Notifications List */}
      <div className="flex flex-col gap-3">
        {/* If error occurred and no notifications loaded */}
        {notifications.length === 0 && errorMessage ? (
          <div className="p-12 text-center bg-white rounded-xl border border-red-200 shadow-xs text-slate-600">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-[16px] font-bold text-slate-800">
              Gagal Mengambil Data Notifikasi
            </h3>
            <p className="text-[13px] text-slate-500 mt-1 max-w-md mx-auto">
              {errorMessage || 'Sistem tidak dapat terhubung ke basis data notifikasi saat ini.'}
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={isRetrying}
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#31889C] hover:bg-[#215865] text-white text-[13px] font-semibold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                <span>{isRetrying ? 'Menghubungkan...' : 'Coba Muat Ulang'}</span>
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-200 text-slate-500">
            <BellRing className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-[15px] font-bold text-slate-700">
              Tidak ada notifikasi pada kategori ini
            </h3>
            <p className="text-[13px] text-slate-400 mt-1">
              Semua pemberitahuan dan pembaruan sistem akan muncul di sini secara real-time.
            </p>
            <button
              type="button"
              disabled={isRetrying}
              onClick={handleRetry}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-[#31889C] hover:bg-[#F0F9FA] text-[12px] font-medium transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>Periksa Pembaruan</span>
            </button>
          </div>
        ) : (
          filtered.map((item) => {
            const isKegiatan = item.type === 'meeting' || item.type === 'kegiatan';
            const isTindakLanjut = item.type === 'action_item' || item.type === 'tindak_lanjut';
            const isDanger = item.type === 'danger';
            const isWarning = item.type === 'warning';
            const isSuccess = item.type === 'success';
            const isDeleting = actionLoadingId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`p-4 rounded-xl border transition-all flex items-start gap-4 cursor-pointer group relative ${
                  item.isRead
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : isKegiatan
                    ? 'bg-[#E8F5F7]/30 border-[#BCE3EB] shadow-xs'
                    : isTindakLanjut
                    ? 'bg-blue-50/30 border-blue-200 shadow-xs'
                    : 'bg-[#F8FDFF] border-[#BCE3EB] shadow-xs'
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    isKegiatan
                      ? 'bg-[#E8F5F7] text-[#1E6B7B] border-[#BCE3EB]'
                      : isTindakLanjut
                      ? 'bg-blue-50 text-blue-600 border-blue-200'
                      : isDanger
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : isWarning
                      ? 'bg-amber-50 text-amber-600 border-amber-200'
                      : isSuccess
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      : 'bg-[#E8F5F7] text-[#31889C] border-[#BCE3EB]'
                  }`}
                >
                  {isKegiatan ? (
                    <Calendar className="w-5 h-5 text-[#1E6B7B]" />
                  ) : isTindakLanjut ? (
                    <ListTodo className="w-5 h-5 text-blue-600" />
                  ) : isDanger ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : isWarning ? (
                    <Clock className="w-5 h-5" />
                  ) : isSuccess ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Info className="w-5 h-5" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 pr-6">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className={`text-[14px] leading-snug ${
                          item.isRead
                            ? 'font-semibold text-slate-800'
                            : 'font-bold text-slate-900'
                        }`}
                      >
                        {item.title}
                      </h3>
                      {item.teamName && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E8F5F7] border border-[#BCE3EB] text-[#215865] text-[10.5px] font-bold">
                          <Users className="w-3 h-3 text-[#31889C]" />
                          <span>{item.teamName}</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>

                  <p className="text-[13px] text-slate-600 mt-1 leading-relaxed">
                    {item.message}
                  </p>

                  <div className="flex items-center justify-between gap-4 mt-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      {!item.isRead && (
                        <span className={`inline-block w-2 h-2 rounded-full ${isKegiatan ? 'bg-[#1E6B7B]' : isTindakLanjut ? 'bg-blue-600' : 'bg-[#31889C]'}`} />
                      )}
                      <span className={`text-[11px] font-semibold uppercase tracking-wider ${isKegiatan ? 'text-[#1E6B7B]' : isTindakLanjut ? 'text-blue-700' : 'text-slate-400'}`}>
                        {isKegiatan
                          ? 'Penugasan PIC Kegiatan'
                          : isTindakLanjut
                          ? 'Tugas Tindak Lanjut'
                          : isDanger
                          ? 'Eskalasi Mendesak'
                          : isWarning
                          ? 'Perhatian'
                          : isSuccess
                          ? 'Penyelesaian Catatan'
                          : 'Informasi'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {item.link && (
                        <Link
                          href={item.link}
                          className={`inline-flex items-center gap-1 text-[12px] font-bold ${
                            isKegiatan
                              ? 'text-[#1E6B7B] hover:text-[#154d58] bg-[#E8F5F7] hover:bg-[#d6f0f4] border border-[#BCE3EB] px-2.5 py-1 rounded-lg transition-colors'
                              : isTindakLanjut
                              ? 'text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition-colors'
                              : 'text-[#31889C] hover:text-[#215865] hover:underline'
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>{isKegiatan ? 'Buka Detail Kegiatan' : isTindakLanjut ? 'Buka Tindak Lanjut' : 'Buka Rincian'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Delete / Dismiss Button */}
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={(e) => handleDeleteNotification(e, item.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 absolute top-3.5 right-3.5 cursor-pointer disabled:opacity-50"
                  title="Hapus notifikasi ini"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
