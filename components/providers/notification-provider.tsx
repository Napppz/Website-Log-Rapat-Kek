'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUnreadNotificationCountAction } from '@/app/actions/notification-actions';
import { usePathname } from 'next/navigation';

interface NotificationContextType {
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  setUnreadCount: () => {},
  refreshUnreadCount: async () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const pathname = usePathname();

  const refreshUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadNotificationCountAction();
      if (res.success && typeof res.count === 'number') {
        setUnreadCount(res.count);
      }
    } catch {
      // Fail silently
    }
  }, []);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount, pathname]);

  return (
    <NotificationContext.Provider value={{ unreadCount, setUnreadCount, refreshUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
