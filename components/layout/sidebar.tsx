'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Building2,
  Layers,
  FileText,
  Bell,
  Settings,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  X,
  UserCog,
} from 'lucide-react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { BIRO_LIST } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/components/providers/notification-provider';

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  isOpenMobile = false,
  onCloseMobile,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'STAFF';

  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isAdmin = userRole === 'ADMIN';
  const isPimpinan = userRole === 'PIMPINAN';

  const isKegiatanRoute =
    pathname.includes('/arsip-kegiatan') ||
    pathname.includes('/catat-kegiatan') ||
    pathname.includes('/semua-rapat') ||
    pathname.includes('/buat-rapat');
  const isTimRoute = pathname.includes('/biro');

  const [toggledSections, setToggledSections] = useState<Record<string, boolean>>({ tim: true });
  const [dbTeams, setDbTeams] = useState<Array<{ code: string; name: string }>>([]);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/teams')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setDbTeams(
            data
              .filter((t: any) => String(t.code || '').toUpperCase() !== 'POKJA')
              .map((t: any) => ({
                code: String(t.code || '').toUpperCase(),
                name:
                  t.name?.startsWith('Tim ')
                    ? t.name
                    : `Tim ${t.name}`,
              }))
          );
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const isKegiatanOpen = toggledSections.kegiatan !== undefined ? toggledSections.kegiatan : isKegiatanRoute;
  const isTimOpen = toggledSections.tim !== undefined ? toggledSections.tim : isTimRoute;

  const toggleSection = (section: string) => {
    setToggledSections((prev) => {
      const current = section === 'kegiatan' ? isKegiatanOpen : isTimOpen;
      return {
        ...prev,
        [section]: !current,
      };
    });
  };

  const handleLinkClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const dashboardHref = '/';
  const isDashboardActive = pathname === '/';
  const dashboardLabel = 'Dashboard';

  const kegiatanSubItems = [
    { name: 'Log Book Kegiatan', href: '/arsip-kegiatan' },
    ...(isSuperAdmin || isAdmin || userRole === 'STAFF'
      ? [{ name: '+ Catat Kegiatan Baru', href: '/catat-kegiatan' }]
      : []),
  ];

  const roleLabelMap: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Administrator',
    PIMPINAN: 'Pimpinan',
    STAFF: 'Staf',
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-white border-r border-slate-200 z-50 flex flex-col justify-between shadow-[2px_0_12px_rgba(49,136,156,0.06)] transition-all duration-300",
          collapsed ? "w-20" : "w-72",
          isOpenMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Header Branding */}
          <div className="min-h-[72px] py-2 px-3.5 flex items-center justify-between bg-gradient-to-r from-[#31889C] to-[#266F80] border-b border-[#215865] shadow-xs shrink-0">
            <Link
              href="/"
              onClick={handleLinkClick}
              className="flex items-center gap-2.5 min-w-0 flex-1"
            >
              <div className="bg-white rounded-full p-0.5 shadow-sm flex items-center justify-center shrink-0 w-12 h-12 overflow-hidden ring-2 ring-white/50">
                <Image
                  src="/logo-denas-kek.png"
                  alt="Logo Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0 text-left">
                  <span className="font-extrabold text-[12.5px] text-white tracking-wide leading-tight">
                    Aktivitas Kegiatan Biro 3
                  </span>
                  <span className="text-[10px] text-teal-100 font-medium leading-[1.25] mt-0.5 line-clamp-2">
                    Biro Investasi, Kerja Sama &amp; Komunikasi
                  </span>
                </div>
              )}
            </Link>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-teal-100 hover:text-white hover:bg-white/15 lg:hidden"
              title="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
            <nav className="space-y-1">
              {/* Dashboard */}
              <Link
                href={dashboardHref}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left text-[14px]",
                  isDashboardActive
                    ? "bg-[#F0F9FA] text-[#31889C] font-bold border-l-4 border-[#31889C] shadow-xs"
                    : "text-slate-600 hover:bg-[#F0F9FA] hover:text-[#31889C] font-medium"
                )}
                title={dashboardLabel}
              >
                <LayoutDashboard
                  className={cn(
                    "w-5 h-5 shrink-0",
                    isDashboardActive ? "text-[#31889C]" : "text-slate-400"
                  )}
                />
                {!collapsed && <span className="truncate">{dashboardLabel}</span>}
              </Link>

              {/* Log Book Kegiatan (Collapsible) */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleSection('kegiatan')}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-600 hover:bg-[#F0F9FA] hover:text-[#31889C] transition-all font-medium text-[14px] cursor-pointer",
                    pathname.startsWith('/arsip-kegiatan') ||
                    pathname === '/catat-kegiatan' ||
                    pathname.startsWith('/semua-rapat') ||
                    pathname === '/buat-rapat'
                      ? "text-[#31889C] font-semibold bg-[#F0F9FA]/60"
                      : ""
                  )}
                  title="Log Book Kegiatan"
                >
                  <div className="flex items-center gap-3">
                    <Users className={cn(
                      "w-5 h-5 shrink-0",
                      pathname.startsWith('/arsip-kegiatan') ||
                      pathname === '/catat-kegiatan' ||
                      pathname.startsWith('/semua-rapat') ||
                      pathname === '/buat-rapat'
                        ? "text-[#31889C]"
                        : "text-slate-400"
                    )} />
                    {!collapsed && <span>Log Book Kegiatan</span>}
                  </div>
                  {!collapsed && (
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-slate-400 transition-transform duration-200",
                        isKegiatanOpen ? "rotate-180" : ""
                      )}
                    />
                  )}
                </button>

                {!collapsed && isKegiatanOpen && (
                  <div className="pl-7 pr-2 py-1 space-y-1">
                    {kegiatanSubItems.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={handleLinkClick}
                          className={cn(
                            "block px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all",
                            isActive
                              ? "bg-[#E8F5F7] text-[#215865] font-bold"
                              : "text-slate-600 hover:bg-[#F0F9FA] hover:text-[#31889C]"
                          )}
                        >
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>


              {/* Tim Kerja Biro IKK (Semua Peran: SUPER_ADMIN, ADMIN, PIMPINAN, STAFF) */}
              {(isSuperAdmin || isAdmin || isPimpinan || Boolean(session?.user?.biroCode)) && (
                <div>
                  <button
                    type="button"
                    onClick={() => toggleSection('tim')}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-600 hover:bg-[#F0F9FA] hover:text-[#31889C] transition-all font-medium text-[14px] cursor-pointer",
                      pathname.startsWith('/biro') ? "text-[#31889C] font-semibold bg-[#F0F9FA]/60" : ""
                    )}
                    title="Tim Kerja Biro 3"
                  >
                    <div className="flex items-center gap-3">
                      <Layers className={cn(
                        "w-5 h-5 shrink-0",
                        pathname.startsWith('/biro') ? "text-[#31889C]" : "text-slate-400"
                      )} />
                      {!collapsed && <span>Tim Kerja</span>}
                    </div>
                    {!collapsed && (
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-slate-400 transition-transform duration-200",
                          isTimOpen ? "rotate-180" : ""
                        )}
                      />
                    )}
                  </button>

                  {!collapsed && isTimOpen && (
                    <div className="pl-7 pr-2 py-1 space-y-1">
                      {(() => {
                        const defaultTeams = [
                          { code: 'INV', name: 'Tim Investasi', href: '/arsip-kegiatan?tim=INV' },
                          { code: 'KS', name: 'Tim Kerja Sama', href: '/arsip-kegiatan?tim=KS' },
                          { code: 'KOM', name: 'Tim Komunikasi', href: '/arsip-kegiatan?tim=KOM' },
                          { code: 'SI', name: 'Tim Sistem Informasi', href: '/arsip-kegiatan?tim=SI' },
                          { code: 'HKM', name: 'Tim Hukum', href: '/arsip-kegiatan?tim=HKM' },
                        ];

                        const userAssigned = (session?.user as any)?.assignedTeams || [];
                        const allTeams = [...defaultTeams];

                        // 1. Masukkan tim yang diambil dari database secara dinamis
                        for (const dt of dbTeams) {
                          if (dt.code && !allTeams.some((t) => t.code.toUpperCase() === dt.code.toUpperCase())) {
                            allTeams.push({
                              code: dt.code,
                              name: dt.name,
                              href: `/arsip-kegiatan?tim=${dt.code}`,
                            });
                          }
                        }

                        // 2. Masukkan tim yang ditugaskan ke pengguna jika belum ada
                        for (const u of userAssigned) {
                          if (u.code && !allTeams.some((t) => t.code.toUpperCase() === u.code.toUpperCase())) {
                            allTeams.push({
                              code: u.code,
                              name: u.name?.startsWith('Tim ') ? u.name : `Tim ${u.name}`,
                              href: `/arsip-kegiatan?tim=${u.code}`,
                            });
                          }
                        }

                        // Seluruh tim kerja dapat dilihat oleh semua pengguna (mengecualikan Pokja)
                        return allTeams.filter(
                          (t) =>
                            t.code.toUpperCase() !== 'POKJA' &&
                            !t.name.toLowerCase().includes('pokja')
                        );
                      })().map((tim) => (
                        <Link
                          key={tim.code}
                          href={tim.href}
                          onClick={handleLinkClick}
                          title={tim.name}
                          className={cn(
                            "block px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all leading-snug",
                            "text-slate-600 hover:bg-[#F0F9FA] hover:text-[#31889C]"
                          )}
                        >
                          {tim.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}


              {/* Notifikasi (All roles) */}
              <Link
                href="/notifikasi"
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg transition-all font-medium text-[14px]",
                  pathname === '/notifikasi'
                    ? "bg-[#F0F9FA] text-[#31889C] font-bold border-l-4 border-[#31889C] shadow-xs"
                    : "text-slate-600 hover:bg-[#F0F9FA] hover:text-[#31889C]"
                )}
                title="Notifikasi"
              >
                <div className="flex items-center gap-3">
                  <Bell className={cn(
                    "w-5 h-5 shrink-0",
                    pathname === '/notifikasi' ? "text-[#31889C]" : "text-slate-400"
                  )} />
                  {!collapsed && <span>Notifikasi</span>}
                </div>
                {!collapsed && unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#F99D1C] text-white font-bold text-[11px] shadow-xs">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Manajemen Pengguna (SUPER_ADMIN & ADMIN) */}
              {(isSuperAdmin || isAdmin) && (
                <Link
                  href="/pengguna"
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium text-[14px]",
                    pathname.startsWith('/pengguna')
                      ? "bg-[#F0F9FA] text-[#31889C] font-bold border-l-4 border-[#31889C] shadow-xs"
                      : "text-slate-600 hover:bg-[#F0F9FA] hover:text-[#31889C]"
                  )}
                  title={isAdmin ? "Manajemen Anggota Tim" : "Manajemen Pengguna"}
                >
                  <UserCog className={cn(
                    "w-5 h-5 shrink-0",
                    pathname.startsWith('/pengguna') ? "text-[#31889C]" : "text-slate-400"
                  )} />
                  {!collapsed && <span>{isAdmin ? "Anggota Tim" : "Pengguna"}</span>}
                </Link>
              )}

              {/* Pengaturan (SUPER_ADMIN) */}
              {isSuperAdmin && (
                <Link
                  href="/pengaturan"
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium text-[14px]",
                    pathname === '/pengaturan'
                      ? "bg-[#F0F9FA] text-[#31889C] font-bold border-l-4 border-[#31889C] shadow-xs"
                      : "text-slate-600 hover:bg-[#F0F9FA] hover:text-[#31889C]"
                  )}
                  title="Pengaturan"
                >
                  <Settings className={cn(
                    "w-5 h-5 shrink-0",
                    pathname === '/pengaturan' ? "text-[#31889C]" : "text-slate-400"
                  )} />
                  {!collapsed && <span>Pengaturan</span>}
                </Link>
              )}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          {!collapsed ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2.5 py-1 rounded-md bg-[#E8F5F7] border border-[#BCE3EB] text-[#31889C] font-bold text-[11px] tracking-wider uppercase truncate">
                {roleLabelMap[userRole] || userRole}
              </span>
            </div>
          ) : (
            <span className="w-2 h-2 rounded-full bg-[#31889C] mx-auto" />
          )}

          <button
            type="button"
            onClick={onToggleCollapse}
            className="text-slate-400 hover:text-[#31889C] p-1.5 rounded-lg hover:bg-[#F0F9FA] transition-colors hidden lg:flex cursor-pointer"
            title={collapsed ? "Perluas Sidebar" : "Perkecil Sidebar"}
          >
            {collapsed ? (
              <ChevronsRight className="w-5 h-5" />
            ) : (
              <ChevronsLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
