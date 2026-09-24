'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  X,
  Trash2,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm?: () => Promise<void> | void;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType | null>(null);

// Global listeners for imperative invocation outside React tree
type ToastListener = (type: ToastType, message: string, title?: string, duration?: number) => void;
type ConfirmListener = (options: ConfirmOptions) => Promise<boolean>;

let globalToastListener: ToastListener | null = null;
let globalConfirmListener: ConfirmListener | null = null;

export const toast = {
  success: (message: string, title?: string, duration = 4000) => {
    if (globalToastListener) {
      globalToastListener('success', message, title || 'Berhasil', duration);
    } else {
      console.log('[Toast:success]', message);
    }
  },
  error: (message: string, title?: string, duration = 5000) => {
    if (globalToastListener) {
      globalToastListener('error', message, title || 'Terjadi Kesalahan', duration);
    } else {
      console.error('[Toast:error]', message);
    }
  },
  warning: (message: string, title?: string, duration = 4500) => {
    if (globalToastListener) {
      globalToastListener('warning', message, title || 'Peringatan', duration);
    } else {
      console.warn('[Toast:warning]', message);
    }
  },
  info: (message: string, title?: string, duration = 4000) => {
    if (globalToastListener) {
      globalToastListener('info', message, title || 'Informasi', duration);
    } else {
      console.info('[Toast:info]', message);
    }
  },
};

export const confirmModal = (options: ConfirmOptions): Promise<boolean> => {
  if (globalConfirmListener) {
    return globalConfirmListener(options);
  }
  // Fallback to native window.confirm if mounted before provider
  return Promise.resolve(window.confirm(`${options.title}\n\n${options.message}`));
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (val: boolean) => void;
  } | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, title?: string, duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev.slice(-4), newToast]); // Limit to max 5 stacked toasts
    },
    []
  );

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({
        isOpen: true,
        options,
        resolve,
      });
    });
  }, []);

  useEffect(() => {
    globalToastListener = showToast;
    globalConfirmListener = confirm;

    return () => {
      globalToastListener = null;
      globalConfirmListener = null;
    };
  }, [showToast, confirm]);

  const handleConfirmAction = async () => {
    if (!confirmState) return;
    try {
      if (confirmState.options.onConfirm) {
        setIsConfirmLoading(true);
        await confirmState.options.onConfirm();
      }
      confirmState.resolve(true);
    } catch {
      confirmState.resolve(false);
    } finally {
      setIsConfirmLoading(false);
      setConfirmState(null);
    }
  };

  const handleCancelAction = () => {
    if (!confirmState) return;
    confirmState.resolve(false);
    setConfirmState(null);
  };

  return (
    <ToastContext.Provider value={{ showToast, confirm }}>
      {children}

      {/* 1. Animated Toast Notification Container (Top-Right) */}
      <div
        aria-live="polite"
        className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none max-w-md w-full px-4 sm:px-0"
      >
        {toasts.map((item) => (
          <ToastCard key={item.id} toast={item} onClose={() => removeToast(item.id)} />
        ))}
      </div>

      {/* 2. Animated Custom Confirmation Modal */}
      {confirmState?.isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-amber-200/80 shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200 relative overflow-hidden">
            {/* Top accent line */}
            <div
              className={cn(
                'absolute top-0 left-0 right-0 h-1.5',
                confirmState.options.variant === 'danger'
                  ? 'bg-red-600'
                  : confirmState.options.variant === 'warning'
                  ? 'bg-amber-500'
                  : 'bg-blue-600'
              )}
            />

            <div className="flex items-start gap-3.5 mt-1">
              <div
                className={cn(
                  'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border',
                  confirmState.options.variant === 'danger'
                    ? 'bg-red-50 border-red-200 text-red-600'
                    : confirmState.options.variant === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-blue-50 border-blue-200 text-blue-700'
                )}
              >
                {confirmState.options.variant === 'danger' ? (
                  <Trash2 className="w-5 h-5" />
                ) : confirmState.options.variant === 'warning' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <HelpCircle className="w-5 h-5" />
                )}
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-[17px] text-slate-900 leading-snug">
                  {confirmState.options.title}
                </h3>
                <p className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-line">
                  {confirmState.options.message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isConfirmLoading}
                onClick={handleCancelAction}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-[13px] transition-colors cursor-pointer disabled:opacity-50"
              >
                {confirmState.options.cancelText || 'Batal'}
              </button>

              <button
                type="button"
                disabled={isConfirmLoading}
                onClick={handleConfirmAction}
                className={cn(
                  'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-semibold text-[13px] transition-all shadow-xs cursor-pointer disabled:opacity-50',
                  confirmState.options.variant === 'danger'
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                    : confirmState.options.variant === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                )}
              >
                {isConfirmLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>
                  {confirmState.options.confirmText ||
                    (confirmState.options.variant === 'danger' ? 'Ya, Hapus' : 'Konfirmasi')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

// Individual Toast Card with Entrance Animation & Progress Bar
function ToastCard({ toast: item, onClose }: { toast: ToastItem; onClose: () => void }) {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);

  const duration = item.duration || 4000;

  useEffect(() => {
    if (isPaused) return;

    const intervalTime = 40;
    const step = (intervalTime / duration) * 100;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isPaused, duration, onClose]);

  const config = {
    success: {
      border: 'border-emerald-500/40 bg-slate-900/95 text-white',
      iconContainer: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      progressBar: 'bg-emerald-500',
      badge: 'text-emerald-400',
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    error: {
      border: 'border-red-500/40 bg-slate-900/95 text-white',
      iconContainer: 'bg-red-500/20 text-red-400 border border-red-500/30',
      progressBar: 'bg-red-500',
      badge: 'text-red-400',
      icon: <XCircle className="w-5 h-5" />,
    },
    warning: {
      border: 'border-amber-500/40 bg-slate-900/95 text-white',
      iconContainer: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      progressBar: 'bg-amber-500',
      badge: 'text-amber-400',
      icon: <AlertTriangle className="w-5 h-5" />,
    },
    info: {
      border: 'border-blue-500/40 bg-slate-900/95 text-white',
      iconContainer: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      progressBar: 'bg-blue-500',
      badge: 'text-blue-400',
      icon: <Info className="w-5 h-5" />,
    },
  }[item.type];

  return (
    <div
      role="alert"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={cn(
        'pointer-events-auto relative overflow-hidden rounded-2xl p-4 shadow-2xl backdrop-blur-md transition-all duration-300',
        'animate-in slide-in-from-top-3 fade-in zoom-in-95 ease-out',
        config.border
      )}
    >
      <div className="flex items-start gap-3.5 pr-6">
        {/* Animated Glow Icon */}
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm', config.iconContainer)}>
          {config.icon}
        </div>

        {/* Text Content */}
        <div className="space-y-0.5 min-w-0 flex-1">
          {item.title && (
            <h4 className={cn('text-[12px] font-bold uppercase tracking-wider', config.badge)}>
              {item.title}
            </h4>
          )}
          <p className="text-[13px] text-slate-100 font-medium leading-snug break-words">
            {item.message}
          </p>
        </div>
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-3.5 right-3 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
        aria-label="Tutup notifikasi"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Shrinking Animated Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
        <div
          className={cn('h-full transition-all ease-linear', config.progressBar)}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
