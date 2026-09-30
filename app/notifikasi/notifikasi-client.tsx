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
  Filter,
  Loader2,
} from 'lucide-react';
import {
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from '@/app/actions/notification-actions';
import { toast } from '@/components/providers/toast-provider';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  isRead: boolean;
  createdAt: Date | string;
}

interface NotifikasiClientProps {
  initialNotifications: NotificationItem[];
  initialUnreadCount: number;
}

export function NotifikasiClient({
  initialNotifications = [],
  initialUnreadCount = 0,
}: NotifikasiClientProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    initialNotifications
  );
  const [unreadCount, setUnreadCount] = useState<number>(initialUnreadCount);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'DANGER' | 'INFO'>('ALL');
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const handleMarkAllRead = async () => {
    try {
      setIsMarkingAll(true);
      const res = await markAllNotificationsAsReadAction();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success('Semua notifikasi telah ditandai sebagai dibaca.');
      } else {
        toast.error(res.error || 'Gagal memperbarui notifikasi.');
      }
    } catch {
      toast.error('Gagal memperbarui notifikasi.');
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await markNotificationAsReadAction(notif.id).catch(() => {});
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
    if (activeTab === 'DANGER') return item.type === 'danger' || item.type === 'warning';
    if (activeTab === 'INFO') return item.type === 'info' || item.type === 'success';
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-semibold text-[12px] text-[#31889C] uppercase tracking-wider">
            Pusat Pemberitahuan Sistem
          </span>
          <h1 className="text-[24px] font-bold text-slate-900 mt-0.5">
            Notifikasi &amp; Peringatan Dewan
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Pemberitahuan resmi mengenai rapat terjadwal, pengesahan risalah, dan eskalasi tindak lanjut.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[12px] font-bold">
              {unreadCount} Belum Dibaca
            </span>
          )}

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
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-colors cursor-pointer ${
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
          className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-colors cursor-pointer ${
            activeTab === 'UNREAD'
              ? 'bg-[#31889C] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Belum Dibaca ({unreadCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DANGER')}
          className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-colors cursor-pointer ${
            activeTab === 'DANGER'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Peringatan &amp; Tenggat (
          {
            notifications.filter(
              (n) => n.type === 'danger' || n.type === 'warning'
            ).length
          }
          )
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('INFO')}
          className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-colors cursor-pointer ${
            activeTab === 'INFO'
              ? 'bg-[#215865] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Agenda &amp; Risalah (
          {
            notifications.filter(
              (n) => n.type === 'info' || n.type === 'success'
            ).length
          }
          )
        </button>
      </div>

      {/* Notifications List */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-200 text-slate-500">
            <BellRing className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-[15px] font-bold text-slate-700">
              Tidak ada notifikasi pada kategori ini
            </h3>
            <p className="text-[13px] text-slate-400 mt-1">
              Semua pemberitahuan dan pembaruan sistem akan muncul di sini secara real-time.
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const isDanger = item.type === 'danger';
            const isWarning = item.type === 'warning';
            const isSuccess = item.type === 'success';

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`p-4 rounded-xl border transition-all flex items-start gap-4 cursor-pointer group ${
                  item.isRead
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : 'bg-[#F8FDFF] border-[#BCE3EB] shadow-xs'
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    isDanger
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : isWarning
                      ? 'bg-amber-50 text-amber-600 border-amber-200'
                      : isSuccess
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      : 'bg-[#E8F5F7] text-[#31889C] border-[#BCE3EB]'
                  }`}
                >
                  {isDanger ? (
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
                  <div className="flex items-center justify-between gap-2">
                    <h3
                      className={`text-[14px] leading-snug ${
                        item.isRead
                          ? 'font-semibold text-slate-800'
                          : 'font-bold text-slate-900'
                      }`}
                    >
                      {item.title}
                    </h3>
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
                        <span className="inline-block w-2 h-2 rounded-full bg-[#31889C]" />
                      )}
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        {isDanger
                          ? 'Eskalasi Mendesak'
                          : isWarning
                          ? 'Perhatian Batas Waktu'
                          : isSuccess
                          ? 'Penyelesaian Risalah'
                          : 'Informasi Agenda'}
                      </span>
                    </div>

                    {item.link && (
                      <Link
                        href={item.link}
                        className="inline-flex items-center gap-1 text-[12px] font-bold text-[#31889C] hover:text-[#215865] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>Buka Rincian</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
