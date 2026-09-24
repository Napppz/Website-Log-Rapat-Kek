'use client';

import React, { useState } from 'react';
import { Search, Plus, Bell, ChevronDown, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onOpenMobile?: () => void;
  collapsed?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onCreateMeetingClick?: () => void;
}

export function Header({
  onOpenMobile,
  collapsed = false,
  searchQuery = '',
  onSearchChange,
  onCreateMeetingClick,
}: HeaderProps) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  return (
    <header
      className={cn(
        "fixed top-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-amber-100 z-40 flex items-center justify-between px-4 sm:px-6 shadow-sm transition-all duration-300",
        collapsed ? "left-0 lg:left-20" : "left-0 lg:left-72"
      )}
    >
      {/* Left: Mobile Toggle & Search Input */}
      <div className="flex items-center gap-3 w-full max-w-md">
        <button
          type="button"
          onClick={onOpenMobile}
          className="p-2 -ml-2 rounded-lg text-slate-600 hover:text-amber-800 hover:bg-amber-50 lg:hidden"
          title="Buka Navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative flex items-center w-full">
          <Search className="w-4 h-4 absolute left-3.5 text-amber-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Cari nomor rapat, agenda, tindak lanjut, atau Biro..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 border border-amber-200/80 text-slate-800 placeholder:text-slate-400 text-[13px] shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Right: Actions, Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0 ml-3">
        {/* "+ Buat Rapat" button */}
        <button
          type="button"
          onClick={onCreateMeetingClick}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-sm shadow-amber-600/20 font-semibold text-[13px] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Buat Rapat</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
            className="p-2 text-slate-500 hover:text-amber-800 hover:bg-amber-50 rounded-lg relative transition-colors cursor-pointer"
            title="Notifikasi"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white"></span>
          </button>

          {notifDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-amber-200 p-3 z-50 text-[13px]">
              <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                <span className="font-bold text-slate-900">Notifikasi Rapat</span>
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  6 Baru
                </span>
              </div>
              <div className="divide-y divide-amber-50 mt-2">
                <div className="py-2">
                  <p className="font-semibold text-slate-800 text-[12px]">Rapat Koordinasi KEK Sei Mangkei</p>
                  <p className="text-slate-500 text-[11px]">Risalah disetujui • 10 menit lalu</p>
                </div>
                <div className="py-2">
                  <p className="font-semibold text-red-600 text-[12px]">Tindak Lanjut Butuh Eskalasi</p>
                  <p className="text-slate-500 text-[11px]">2 butir di KEK Bitung terlambat • 1 jam lalu</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-amber-200 hidden sm:block"></div>

        {/* Profile Avatar & Info */}
        <div className="relative">
          <div
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 cursor-pointer p-1.5 rounded-lg hover:bg-amber-50/80 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-[13px] ring-2 ring-amber-300 shrink-0">
              HS
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="font-bold text-[13px] text-slate-900 leading-tight">
                Dr. Hendra Suprayitno, M.Si
              </span>
              <span className="text-[11px] text-amber-700 font-medium leading-tight truncate max-w-[220px]">
                SUPER ADMIN - Biro Investasi, Kerja Sama &amp; Komunikasi
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-amber-200 p-2 z-50 text-[13px]">
              <div className="px-3 py-2 border-b border-amber-100 mb-1">
                <p className="font-bold text-slate-900">Dr. Hendra Suprayitno</p>
                <p className="text-[11px] text-slate-500">hendra.suprayitno@kek.go.id</p>
              </div>
              <button
                type="button"
                className="w-full text-left px-3 py-1.5 rounded-md hover:bg-amber-50 text-slate-700 hover:text-amber-800 transition-colors"
              >
                Profil Akun
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-1.5 rounded-md hover:bg-amber-50 text-slate-700 hover:text-amber-800 transition-colors"
              >
                Pengaturan Sistem
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-1.5 rounded-md hover:bg-red-50 text-red-600 transition-colors mt-1 border-t border-amber-100 pt-1.5"
              >
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
