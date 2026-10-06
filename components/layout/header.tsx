'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Bell, ChevronDown, Menu, LogOut, User as UserIcon } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/components/providers/notification-provider';

interface HeaderProps {
  onOpenMobile?: () => void;
  collapsed?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onCreateMeetingClick?: () => void;
  onOpenSearch?: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrator',
  STAFF: 'Staf',
};

const getInitials = (name?: string | null) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
};

export function Header({
  onOpenMobile,
  collapsed = false,
  searchQuery = '',
  onSearchChange,
  onCreateMeetingClick,
  onOpenSearch,
}: HeaderProps) {
  const { data: session } = useSession();
  const { unreadCount } = useNotifications();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const currentUser = session?.user;
  const userName = currentUser?.name || 'Pengguna Sistem';
  const userEmail = currentUser?.email || '';
  const userRole = currentUser?.role || 'STAFF';
  const roleLabel = ROLE_LABELS[userRole] || userRole;
  const biroLabel = currentUser?.biroCode
    ? `${currentUser.biroCode} - ${currentUser.biroName || 'Biro KEK'}`
    : null;

  const canCreateMeeting =
    userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';

  return (
    <header
      className={cn(
        "fixed top-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 z-40 flex items-center justify-between px-4 sm:px-6 shadow-xs transition-all duration-300",
        collapsed ? "left-0 lg:left-20" : "left-0 lg:left-72"
      )}
    >
      {/* Left: Mobile Toggle & Quick Search Trigger */}
      <div className="flex items-center gap-3 w-full max-w-md">
        <button
          type="button"
          onClick={onOpenMobile}
          className="p-2 -ml-2 rounded-lg text-slate-600 hover:text-[#1E6B7B] hover:bg-[#F0F9FA] lg:hidden cursor-pointer"
          title="Buka Navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onOpenSearch}
          className="relative flex items-center justify-between w-full pl-10 pr-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200 text-slate-500 hover:text-slate-700 text-[13px] shadow-2xs transition-all cursor-pointer group text-left"
          title="Buka Pencarian Cepat (Ctrl + K)"
        >
          <Search className="w-4 h-4 absolute left-3.5 text-[#1E6B7B] group-hover:scale-105 transition-transform" />
          <span className="truncate pr-2">Cari nomor rapat, agenda, biro...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10.5px] font-mono font-semibold text-slate-500 bg-white border border-slate-200 rounded-md shadow-2xs shrink-0 group-hover:border-[#1E6B7B]/40 group-hover:text-[#1E6B7B] transition-colors">
            <span className="text-[9px]">Ctrl</span> K
          </kbd>
        </button>
      </div>

      {/* Right: Actions, Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0 ml-3">
        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
            className="p-2 text-slate-500 hover:text-[#31889C] hover:bg-[#F0F9FA] rounded-lg relative transition-colors cursor-pointer"
            title="Notifikasi"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F99D1C] ring-2 ring-white"></span>
            )}
          </button>

          {notifDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 p-3 z-50 text-[13px]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900">Notifikasi Rapat</span>
                {unreadCount > 0 ? (
                  <span className="text-[11px] font-semibold text-[#31889C] bg-[#E8F5F7] px-2 py-0.5 rounded-full">
                    {unreadCount} Baru
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Semua Terbaca
                  </span>
                )}
              </div>
              <div className="divide-y divide-slate-100 mt-2">
                <div className="py-2">
                  <p className="font-semibold text-slate-800 text-[12px]">Pusat Notifikasi Aktif</p>
                  <p className="text-slate-500 text-[11px]">Pantau pembaruan risalah rapat dan tenggat tindak lanjut.</p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 mt-2 text-center">
                <Link
                  href="/notifikasi"
                  onClick={() => setNotifDropdownOpen(false)}
                  className="text-[12px] font-bold text-[#31889C] hover:text-[#215865] hover:underline"
                >
                  Buka Semua Notifikasi &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

        {/* Profile Avatar & Info */}
        <div className="relative">
          <div
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 cursor-pointer p-1.5 rounded-lg hover:bg-[#F0F9FA] transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-[#31889C] text-white font-bold flex items-center justify-center text-[13px] ring-2 ring-[#BCE3EB] shrink-0">
              {getInitials(userName)}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="font-bold text-[13px] text-slate-900 leading-tight">
                {userName}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-bold text-[#31889C] bg-[#E8F5F7] border border-[#BCE3EB] px-1.5 py-0.5 rounded leading-none">
                  {roleLabel}
                </span>
                {biroLabel && (
                  <span className="text-[11px] text-slate-500 font-medium leading-tight truncate max-w-[200px]">
                    • {biroLabel}
                  </span>
                )}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-50 text-[13px]">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="font-bold text-slate-900 truncate">{userName}</p>
                <p className="text-[11px] text-slate-500 truncate">{userEmail}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] font-bold text-[#31889C] bg-[#E8F5F7] border border-[#BCE3EB] px-1.5 py-0.5 rounded">
                    {roleLabel}
                  </span>
                  {biroLabel && (
                    <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-medium truncate max-w-[180px]">
                      {biroLabel}
                    </span>
                  )}
                </div>
              </div>
              <Link
                href="/pengaturan"
                className="w-full flex items-center gap-2 text-left px-3 py-1.5 rounded-md hover:bg-[#F0F9FA] text-slate-700 hover:text-[#31889C] transition-colors cursor-pointer"
                onClick={() => setProfileDropdownOpen(false)}
              >
                <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>Profil &amp; Pengaturan Akun</span>
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-2 text-left px-3 py-1.5 rounded-md hover:bg-red-50 text-red-600 transition-colors mt-1 border-t border-slate-100 pt-1.5 cursor-pointer font-medium"
              >
                <LogOut className="w-3.5 h-3.5 text-red-600" />
                <span>Keluar</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
