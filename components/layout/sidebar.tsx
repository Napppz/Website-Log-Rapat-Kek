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

  const isRapatRoute = pathname.includes('/semua-rapat') || pathname.includes('/buat-rapat');
  const isBiroRoute = pathname.includes('/biro');

  const [toggledSections, setToggledSections] = useState<Record<string, boolean>>({});

  const isRapatOpen = toggledSections.rapat !== undefined ? toggledSections.rapat : isRapatRoute;
  const isBiroOpen = toggledSections.biro !== undefined ? toggledSections.biro : isBiroRoute;

  const toggleSection = (section: string) => {
    setToggledSections((prev) => {
      const current = section === 'rapat' ? isRapatOpen : isBiroOpen;
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

  const isNonAdminWithBiro = !isSuperAdmin && !isAdmin && Boolean(session?.user?.biroCode);
  const userBiroHref = session?.user?.biroCode ? `/biro/${session.user.biroCode.toLowerCase()}` : '/';
  const dashboardHref = isNonAdminWithBiro ? userBiroHref : '/';
  const isDashboardActive = isNonAdminWithBiro
    ? pathname === userBiroHref || pathname === '/'
    : pathname === '/';
  const dashboardLabel = isNonAdminWithBiro ? `Dashboard Biro ${session?.user?.biroCode}` : 'Dashboard';

  const rapatSubItems = [
    { name: 'Daftar Rapat', href: '/semua-rapat' },
    ...(isSuperAdmin || isAdmin
      ? [{ name: '+ Buat Rapat Baru', href: '/buat-rapat' }]
      : []),
  ];

  const roleLabelMap: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Administrator',
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
                    LOG &amp; NOTULA RAPAT
                  </span>
                  <span className="text-[10px] text-teal-100 font-medium leading-[1.25] mt-0.5 line-clamp-2">
                    Sekretariat Dewan Nasional Kawasan Ekonomi Khusus
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

              {/* Rapat (Collapsible) */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleSection('rapat')}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-600 hover:bg-[#F0F9FA] hover:text-[#31889C] transition-all font-medium text-[14px] cursor-pointer",
                    pathname.startsWith('/semua-rapat') || pathname === '/buat-rapat'
                      ? "text-[#31889C] font-semibold bg-[#F0F9FA]/60"
                      : ""
                  )}
                  title="Rapat"
                >
                  <div className="flex items-center gap-3">
                    <Users className={cn(
                      "w-5 h-5 shrink-0",
                      pathname.startsWith('/semua-rapat') || pathname === '/buat-rapat' ? "text-[#31889C]" : "text-slate-400"
                    )} />
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

              {/* Tindak Lanjut */}
              <Link
                href="/tindak-lanjut"
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium text-[14px]",
                  pathname.startsWith('/tindak-lanjut')
                    ? "bg-[#F0F9FA] text-[#31889C] font-bold border-l-4 border-[#31889C] shadow-xs"
                    : "text-slate-600 hover:bg-[#F0F9FA] hover:text-[#31889C]"
                )}
                title="Tindak Lanjut"
              >
                <CheckSquare className={cn(
                  "w-5 h-5 shrink-0",
                  pathname.startsWith('/tindak-lanjut') ? "text-[#31889C]" : "text-slate-400"
                )} />
                {!collapsed && <span>Tindak Lanjut</span>}
              </Link>

              {/* Kalender (SUPER_ADMIN, ADMIN) */}
              {(isSuperAdmin || isAdmin) && (
                <Link
                  href="/kalender"
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium text-[14px]",
                    pathname === '/kalender'
                      ? "bg-[#F0F9FA] text-[#31889C] font-bold border-l-4 border-[#31889C] shadow-xs"
                      : "text-slate-600 hover:bg-[#F0F9FA] hover:text-[#31889C]"
                  )}
                  title="Kalender"
                >
                  <Calendar className={cn(
                    "w-5 h-5 shrink-0",
                    pathname === '/kalender' ? "text-[#31889C]" : "text-slate-400"
                  )} />
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
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-600 hover:bg-[#F0F9FA] hover:text-[#31889C] transition-all font-medium text-[14px] cursor-pointer",
                      pathname.startsWith('/biro') ? "text-[#31889C] font-semibold bg-[#F0F9FA]/60" : ""
                    )}
                    title="Biro"
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className={cn(
                        "w-5 h-5 shrink-0",
                        pathname.startsWith('/biro') ? "text-[#31889C]" : "text-slate-400"
                      )} />
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
                                ? "bg-[#E8F5F7] text-[#215865] font-bold"
                                : "text-slate-600 hover:bg-[#F0F9FA] hover:text-[#31889C]"
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

              {/* Laporan (SUPER_ADMIN, ADMIN) */}
              {(isSuperAdmin || isAdmin) && (
                <Link
                  href="/laporan"
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium text-[14px]",
                    pathname === '/laporan'
                      ? "bg-[#F0F9FA] text-[#31889C] font-bold border-l-4 border-[#31889C] shadow-xs"
                      : "text-slate-600 hover:bg-[#F0F9FA] hover:text-[#31889C]"
                  )}
                  title="Laporan"
                >
                  <BarChart3 className={cn(
                    "w-5 h-5 shrink-0",
                    pathname === '/laporan' ? "text-[#31889C]" : "text-slate-400"
                  )} />
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

              {/* Manajemen Pengguna (SUPER_ADMIN ONLY) */}
              {isSuperAdmin && (
                <Link
                  href="/pengguna"
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium text-[14px]",
                    pathname.startsWith('/pengguna')
                      ? "bg-[#F0F9FA] text-[#31889C] font-bold border-l-4 border-[#31889C] shadow-xs"
                      : "text-slate-600 hover:bg-[#F0F9FA] hover:text-[#31889C]"
                  )}
                  title="Manajemen Pengguna"
                >
                  <UserCog className={cn(
                    "w-5 h-5 shrink-0",
                    pathname.startsWith('/pengguna') ? "text-[#31889C]" : "text-slate-400"
                  )} />
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
