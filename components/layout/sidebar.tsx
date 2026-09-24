'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Calendar,
  Building2,
  FileText,
  BarChart3,
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
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'VIEWER';

  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isAdmin = userRole === 'ADMIN';
  const isNotulis = userRole === 'NOTULIS';

  const isRapatRoute = pathname.includes('/semua-rapat') || pathname.includes('/buat-rapat');
  const isTindakLanjutRoute = pathname.includes('/tindak-lanjut');
  const isBiroRoute = pathname.includes('/biro');

  const [toggledSections, setToggledSections] = useState<Record<string, boolean>>({});

  const isRapatOpen = toggledSections.rapat !== undefined ? toggledSections.rapat : isRapatRoute || true;
  const isTindakLanjutOpen = toggledSections.tindakLanjut !== undefined ? toggledSections.tindakLanjut : isTindakLanjutRoute;
  const isBiroOpen = toggledSections.biro !== undefined ? toggledSections.biro : isBiroRoute;

  const toggleSection = (section: string) => {
    setToggledSections((prev) => {
      const current = section === 'rapat' ? isRapatOpen : section === 'tindakLanjut' ? isTindakLanjutOpen : isBiroOpen;
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

  const isDashboardActive = pathname === '/';

  const rapatSubItems = [
    { name: 'Semua Rapat', href: '/semua-rapat' },
    ...(isSuperAdmin || isAdmin || isNotulis
      ? [{ name: 'Buat Rapat', href: '/buat-rapat' }]
      : []),
    { name: 'Draft', href: '/semua-rapat?status=DRAFT' },
    { name: 'Menunggu Review', href: '/semua-rapat?status=REVIEW' },
    { name: 'Disetujui', href: '/semua-rapat?status=APPROVED' },
    { name: 'Selesai', href: '/semua-rapat?status=FINAL' },
  ];

  const roleLabelMap: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Administrator',
    NOTULIS: 'Notulis',
    STAFF: 'Staf',
    VIEWER: 'Viewer',
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
          "fixed left-0 top-0 h-full bg-white border-r border-amber-200/80 z-50 flex flex-col justify-between shadow-[2px_0_12px_rgba(217,119,6,0.05)] transition-all duration-300",
          collapsed ? "w-20" : "w-72",
          isOpenMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Header Branding */}
          <div className="h-16 px-4 flex items-center justify-between bg-gradient-to-r from-amber-500 to-amber-600 border-b border-amber-600 shadow-sm shrink-0">
            <Link
              href="/"
              onClick={handleLinkClick}
              className="flex items-center gap-2.5 min-w-0"
            >
              <div className="bg-white rounded-lg px-2 py-1 shadow-xs flex items-center justify-center shrink-0">
                <Image
                  src="/logo-kek.png"
                  alt="Logo Kawasan Ekonomi Khusus"
                  width={64}
                  height={24}
                  className="h-6 w-auto object-contain"
                  priority
                />
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0 text-left">
                  <span className="font-bold text-[13px] text-white truncate uppercase tracking-wider">
                    SIM-RAPAT KEK
                  </span>
                  <span className="text-[11px] text-amber-100 truncate font-medium">
                    Republik Indonesia
                  </span>
                </div>
              )}
            </Link>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-amber-100 hover:text-white hover:bg-amber-600/50 lg:hidden"
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
                href="/"
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left text-[14px]",
                  isDashboardActive
                    ? "bg-amber-50 text-amber-800 font-bold border-l-4 border-amber-600 shadow-sm"
                    : "text-slate-700 hover:bg-amber-50/70 hover:text-amber-800 font-medium"
                )}
                title="Dashboard"
              >
                <LayoutDashboard
                  className={cn(
                    "w-5 h-5 shrink-0",
                    isDashboardActive ? "text-amber-600" : "text-slate-500"
                  )}
                />
                {!collapsed && <span>Dashboard</span>}
              </Link>

              {/* Rapat (Collapsible) */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleSection('rapat')}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-700 hover:bg-amber-50/70 hover:text-amber-800 transition-all font-medium text-[14px] cursor-pointer",
                    pathname.startsWith('/semua-rapat') || pathname === '/buat-rapat'
                      ? "text-amber-800 font-semibold"
                      : ""
                  )}
                  title="Rapat"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-slate-500 shrink-0" />
                    {!collapsed && <span>Rapat</span>}
                  </div>
                  {!collapsed && (
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-slate-400 transition-transform duration-200",
                        isRapatOpen ? "rotate-180" : ""
                      )}
                    />
                  )}
                </button>

                {!collapsed && isRapatOpen && (
                  <div className="pl-7 pr-2 py-1 space-y-1">
                    {rapatSubItems.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={handleLinkClick}
                          className={cn(
                            "block px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all",
                            isActive
                              ? "bg-amber-100 text-amber-900 font-bold"
                              : "text-slate-600 hover:bg-amber-50 hover:text-amber-800"
                          )}
                        >
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tindak Lanjut (Collapsible) */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleSection('tindakLanjut')}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-700 hover:bg-amber-50/70 hover:text-amber-800 transition-all font-medium text-[14px] cursor-pointer",
                    pathname.startsWith('/tindak-lanjut') ? "text-amber-800 font-semibold" : ""
                  )}
                  title="Tindak Lanjut"
                >
                  <div className="flex items-center gap-3">
                    <CheckSquare className="w-5 h-5 text-slate-500 shrink-0" />
                    {!collapsed && <span>Tindak Lanjut</span>}
                  </div>
                  {!collapsed && (
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-slate-400 transition-transform duration-200",
                        isTindakLanjutOpen ? "rotate-180" : ""
                      )}
                    />
                  )}
                </button>

                {!collapsed && isTindakLanjutOpen && (
                  <div className="pl-7 pr-2 py-1 space-y-1">
                    {[
                      { name: 'Semua Tindak Lanjut', href: '/tindak-lanjut' },
                      { name: 'Belum Dimulai', href: '/tindak-lanjut?status=belum-dimulai' },
                      { name: 'Sedang Berjalan', href: '/tindak-lanjut?status=sedang-berjalan' },
                      { name: 'Selesai', href: '/tindak-lanjut?status=selesai' },
                      { name: 'Terlambat', href: '/tindak-lanjut?status=terlambat' },
                    ].map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={handleLinkClick}
                          className={cn(
                            "block px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all",
                            isActive
                              ? "bg-amber-100 text-amber-900 font-bold"
                              : "text-slate-600 hover:bg-amber-50 hover:text-amber-800"
                          )}
                        >
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Kalender (SUPER_ADMIN, ADMIN) */}
              {(isSuperAdmin || isAdmin) && (
                <Link
                  href="/kalender"
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium text-[14px]",
                    pathname === '/kalender'
                      ? "bg-amber-50 text-amber-800 font-bold border-l-4 border-amber-600 shadow-sm"
                      : "text-slate-700 hover:bg-amber-50/70 hover:text-amber-800"
                  )}
                  title="Kalender"
                >
                  <Calendar className="w-5 h-5 text-slate-500 shrink-0" />
                  {!collapsed && <span>Kalender</span>}
                </Link>
              )}

              {/* Biro (SUPER_ADMIN, ADMIN) */}
              {(isSuperAdmin || isAdmin) && (
                <div>
                  <button
                    type="button"
                    onClick={() => toggleSection('biro')}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-700 hover:bg-amber-50/70 hover:text-amber-800 transition-all font-medium text-[14px] cursor-pointer",
                      pathname.startsWith('/biro') ? "text-amber-800 font-semibold" : ""
                    )}
                    title="Biro"
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-slate-500 shrink-0" />
                      {!collapsed && <span>Biro</span>}
                    </div>
                    {!collapsed && (
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-slate-400 transition-transform duration-200",
                          isBiroOpen ? "rotate-180" : ""
                        )}
                      />
                    )}
                  </button>

                  {!collapsed && isBiroOpen && (
                    <div className="pl-7 pr-2 py-1 space-y-1">
                      {BIRO_LIST.map((biro) => {
                        const biroHref = `/biro/${biro.code.toLowerCase()}`;
                        const isActive = pathname === biroHref;
                        return (
                          <Link
                            key={biro.code}
                            href={biroHref}
                            onClick={handleLinkClick}
                            title={biro.name}
                            className={cn(
                              "block px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all leading-snug",
                              isActive
                                ? "bg-amber-100 text-amber-900 font-bold"
                                : "text-slate-600 hover:bg-amber-50 hover:text-amber-800"
                            )}
                          >
                            {biro.shortName}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Dokumen (SUPER_ADMIN, ADMIN) */}
              {(isSuperAdmin || isAdmin) && (
                <Link
                  href="/dokumen"
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium text-[14px]",
                    pathname === '/dokumen'
                      ? "bg-amber-50 text-amber-800 font-bold border-l-4 border-amber-600 shadow-sm"
                      : "text-slate-700 hover:bg-amber-50/70 hover:text-amber-800"
                  )}
                  title="Dokumen"
                >
                  <FileText className="w-5 h-5 text-slate-500 shrink-0" />
                  {!collapsed && <span>Dokumen</span>}
                </Link>
              )}

              {/* Laporan (SUPER_ADMIN, ADMIN) */}
              {(isSuperAdmin || isAdmin) && (
                <Link
                  href="/laporan"
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium text-[14px]",
                    pathname === '/laporan'
                      ? "bg-amber-50 text-amber-800 font-bold border-l-4 border-amber-600 shadow-sm"
                      : "text-slate-700 hover:bg-amber-50/70 hover:text-amber-800"
                  )}
                  title="Laporan"
                >
                  <BarChart3 className="w-5 h-5 text-slate-500 shrink-0" />
                  {!collapsed && <span>Laporan</span>}
                </Link>
              )}

              {/* Notifikasi (All roles) */}
              <Link
                href="/notifikasi"
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg transition-all font-medium text-[14px]",
                  pathname === '/notifikasi'
                    ? "bg-amber-50 text-amber-800 font-bold border-l-4 border-amber-600 shadow-sm"
                    : "text-slate-700 hover:bg-amber-50/70 hover:text-amber-800"
                )}
                title="Notifikasi"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-slate-500 shrink-0" />
                  {!collapsed && <span>Notifikasi</span>}
                </div>
                {!collapsed && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold text-[11px] shadow-sm">
                    6
                  </span>
                )}
              </Link>

              {/* Manajemen Pengguna (SUPER_ADMIN ONLY) */}
              {isSuperAdmin && (
                <Link
                  href="/pengguna"
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium text-[14px]",
                    pathname.startsWith('/pengguna')
                      ? "bg-amber-50 text-amber-800 font-bold border-l-4 border-amber-600 shadow-sm"
                      : "text-slate-700 hover:bg-amber-50/70 hover:text-amber-800"
                  )}
                  title="Manajemen Pengguna"
                >
                  <UserCog className="w-5 h-5 text-amber-600 shrink-0" />
                  {!collapsed && <span>Pengguna</span>}
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
                      ? "bg-amber-50 text-amber-800 font-bold border-l-4 border-amber-600 shadow-sm"
                      : "text-slate-700 hover:bg-amber-50/70 hover:text-amber-800"
                  )}
                  title="Pengaturan"
                >
                  <Settings className="w-5 h-5 text-slate-500 shrink-0" />
                  {!collapsed && <span>Pengaturan</span>}
                </Link>
              )}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 bg-amber-50/60 border-t border-amber-200/70 flex items-center justify-between shrink-0">
          {!collapsed ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2.5 py-1 rounded-md bg-amber-100 border border-amber-300 text-amber-900 font-bold text-[11px] tracking-wider uppercase truncate">
                {roleLabelMap[userRole] || userRole}
              </span>
            </div>
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-500 mx-auto" />
          )}

          <button
            type="button"
            onClick={onToggleCollapse}
            className="text-slate-400 hover:text-amber-700 p-1.5 rounded-lg hover:bg-amber-100/60 transition-colors hidden lg:flex cursor-pointer"
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
