'use client';

import React, { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { CreateMeetingDialog } from '../meeting/create-meeting-dialog';
import { cn } from '@/lib/utils';

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCreateMeetingOpen, setIsCreateMeetingOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

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
        {/* Sticky Header */}
        <Header
          collapsed={isSidebarCollapsed}
          onOpenMobile={() => setIsMobileSidebarOpen(true)}
          searchQuery={globalSearch}
          onSearchChange={setGlobalSearch}
          onCreateMeetingClick={() => setIsCreateMeetingOpen(true)}
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
    </div>
  );
}
