'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  Calendar,
  ListTodo,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/components/providers/notification-provider';
import {
  getNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  NotificationItem,
} from '@/app/actions/notification-actions';
import { toast } from '@/components/providers/toast-provider';

function formatRelativeTime(dateInput: Date | string): string {
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return 'Baru saja';
    if (diffMin < 60) return `${diffMin} mnt lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

export function NotificationBell() {
  const router = useRouter();
  const { unreadCount, setUnreadCount, refreshUnreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD'>('ALL');
  const [isPending, startTransition] = useTransition();
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Load latest notifications whenever popover opens
  const handleToggle = async () => {
    const nextState = !isOpen;
    setIsOpen(nextState);

    if (nextState) {
      setLoading(true);
      try {
        const res = await getNotificationsAction();
        if (res.success && res.data) {
          setNotifications(res.data.notifications || []);
          setUnreadCount(res.data.unreadCount || 0);
        }
      } catch (err) {
        console.warn('Failed to load notifications:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Mark single item read & deep link
  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));

      // Server update
      try {
        await markNotificationAsReadAction(notif.id);
        refreshUnreadCount();
      } catch (err) {
        console.warn('Error marking notification as read:', err);
      }
    }

    setIsOpen(false);
    if (notif.link) {
      startTransition(() => {
        router.push(notif.link as string);
      });
    }
  };

  // Mark all read
  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      const res = await markAllNotificationsAsReadAction();
      if (res.success) {
        toast.success('Semua notifikasi ditandai sudah dibaca.');
        refreshUnreadCount();
      } else {
        toast.error(res.error || 'Gagal memperbarui notifikasi.');
      }
    } catch {
      toast.error('Terjadi kesalahan sistem.');
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'UNREAD') return !n.isRead;
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'kegiatan':
      case 'meeting':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#E8F5F7] text-[#1E6B7B] border border-[#BCE3EB] flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
        );
      case 'tindak_lanjut':
      case 'action_item':
        return (
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
            <ListTodo className="w-4 h-4" />
          </div>
        );
      case 'success':
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        );
      case 'warning':
      case 'danger':
        return (
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "relative p-2 rounded-xl text-slate-600 hover:text-[#1E6B7B] hover:bg-[#F0F9FA] transition-all cursor-pointer focus:outline-hidden",
          isOpen && "bg-[#F0F9FA] text-[#1E6B7B] ring-2 ring-[#BCE3EB]"
        )}
        title="Notifikasi Sistem"
        aria-label="Buka Notifikasi"
      >
        <Bell className="w-5 h-5 transition-transform group-hover:scale-105" />

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center px-1 rounded-full bg-[#E53E3E] text-white text-[10px] font-extrabold shadow-xs ring-2 ring-white animate-in zoom-in-50 duration-200">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 bg-linear-to-r from-slate-50 to-[#F0F9FA]/60 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[14px] text-slate-900 tracking-tight">
                Notifikasi
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#E8F5F7] border border-[#BCE3EB] text-[#1E6B7B] text-[11px] font-bold">
                  {unreadCount} baru
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#1E6B7B] hover:text-[#154d58] transition-colors cursor-pointer"
                title="Tandai semua sudah dibaca"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Tandai dibaca</span>
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50/70 border-b border-slate-100 text-[12px]">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer",
                activeTab === 'ALL'
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              Semua ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('UNREAD')}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer",
                activeTab === 'UNREAD'
                  ? "bg-white text-[#1E6B7B] shadow-2xs font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              Belum Dibaca ({unreadCount})
            </button>
          </div>

          {/* List Content */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 focus:outline-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#1E6B7B]" />
                <p className="text-[12.5px]">Memuat notifikasi...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center mx-auto mb-2 text-slate-400">
                  <Sparkles className="w-5 h-5 text-slate-400" />
                </div>
                <p className="font-semibold text-slate-700 text-[13px]">
                  {activeTab === 'UNREAD' ? 'Tidak ada notifikasi belum dibaca' : 'Belum ada notifikasi'}
                </p>
                <p className="text-[11.5px] text-slate-500 mt-0.5">
                  Notifikasi penugasan PIC kegiatan & tindak lanjut akan muncul di sini.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const relativeTime = formatRelativeTime(notif.createdAt);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={cn(
                      "p-3 transition-colors cursor-pointer flex items-start gap-3 hover:bg-slate-50 text-left group",
                      !notif.isRead && "bg-[#F0F9FA]/40 hover:bg-[#F0F9FA]/70"
                    )}
                  >
                    {getNotificationIcon(notif.type)}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5 mb-0.5">
                        <span
                          className={cn(
                            "text-[12.5px] line-clamp-1",
                            notif.isRead ? "font-semibold text-slate-800" : "font-bold text-slate-900"
                          )}
                        >
                          {notif.title}
                        </span>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#1E6B7B] shrink-0" />
                        )}
                      </div>

                      <p className="text-[11.5px] text-slate-600 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="flex items-center gap-2 mt-1.5 text-[10.5px] text-slate-400">
                        {relativeTime && (
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3" />
                            {relativeTime}
                          </span>
                        )}
                        {notif.teamCode && (
                          <>
                            <span>•</span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold text-[10px]">
                              {notif.teamCode}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200/80 text-center">
            <Link
              href="/notifikasi"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-xl bg-white hover:bg-slate-100/80 border border-slate-200 text-slate-700 hover:text-[#1E6B7B] text-[12px] font-semibold transition-all shadow-2xs group"
            >
              <span>Buka Pusat Notifikasi Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1E6B7B] group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
