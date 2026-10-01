'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { CommandPalette } from './command-palette';
import { CreateMeetingDialog } from '../meeting/create-meeting-dialog';
import { cn } from '@/lib/utils';

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCreateMeetingOpen, setIsCreateMeetingOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Global Ctrl + K / Cmd + K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // If on login page, render full screen without dashboard chrome
  if (pathname === '/login') {
    return <main className="min-h-screen bg-slate-900">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-800 antialiased flex flex-col">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          "transition-all duration-300 min-h-screen flex flex-col flex-1",
          isSidebarCollapsed ? "pl-0 lg:pl-20" : "pl-0 lg:pl-72"
        )}
      >
        {/* Sticky Header with Quick Search */}
        <Header
          collapsed={isSidebarCollapsed}
          onOpenMobile={() => setIsMobileSidebarOpen(true)}
          searchQuery={globalSearch}
          onSearchChange={setGlobalSearch}
          onCreateMeetingClick={() => setIsCreateMeetingOpen(true)}
          onOpenSearch={() => setIsCommandPaletteOpen(true)}
        />

        {/* Dynamic Route Content */}
        <main className="w-full pt-20 pb-12 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex-1">
          {children}
        </main>
      </div>

      {/* Global Create Meeting Dialog */}
      <CreateMeetingDialog
        isOpen={isCreateMeetingOpen}
        onClose={() => setIsCreateMeetingOpen(false)}
      />

      {/* Global Command Palette (Ctrl + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onCreateMeeting={() => setIsCreateMeetingOpen(true)}
      />
    </div>
  );
}
