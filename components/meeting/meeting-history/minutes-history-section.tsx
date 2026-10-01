'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  FileEdit,
  FilePlus,
  FileCheck,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  User2,
  Clock,
  Shield,
  Tag,
} from 'lucide-react';
import { getMinutesHistoryAction } from '@/app/actions/history-actions';

interface MinutesHistorySectionProps {
  meetingId: string;
}

const CHANGE_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  CREATED: {
    label: 'Notulen Dibuat',
    icon: FilePlus,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200',
  },
  UPDATED: {
    label: 'Notulen Diperbarui',
    icon: FileEdit,
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
  },
  STATUS_CHANGED: {
    label: 'Status Diubah',
    icon: FileCheck,
    color: 'text-violet-700',
    bg: 'bg-violet-50 border-violet-200',
  },
  FIELD_UPDATED: {
    label: 'Kolom Diperbarui',
    icon: FileEdit,
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
  },
};

const FIELD_LABELS: Record<string, string> = {
  agenda: 'Agenda Rapat',
  discussion: 'Hasil Pembahasan',
  decisions: 'Poin Keputusan',
  conclusion: 'Kesimpulan',
  chairperson: 'Ketua Rapat',
  secretary: 'Notulis',
  status: 'Status Rapat',
  title: 'Judul Rapat',
  notaNumber: 'Nomor Nota Dinas',
  notulNumber: 'Nomor Registrasi Notula',
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-rose-100 text-rose-700',
  ADMIN: 'bg-violet-100 text-violet-700',
  NOTULIS: 'bg-teal-100 text-teal-700',
  STAFF: 'bg-blue-100 text-blue-700',
  VIEWER: 'bg-slate-100 text-slate-600',
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  NOTULIS: 'Notulis',
  STAFF: 'Staf',
  VIEWER: 'Pengamat',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeTime(date: string) {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 7) return `${days} hari lalu`;
  return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function truncateText(text: string, max = 120) {
  if (!text) return '-';
  if (text.length <= max) return text;
  return text.slice(0, max) + '...';
}

function renderJsonValue(val: any): string {
  if (!val) return '-';
  if (typeof val === 'string') return truncateText(val);
  if (typeof val === 'object') {
    const str = JSON.stringify(val);
    return truncateText(str);
  }
  return String(val);
}

interface HistoryItemProps {
  entry: any;
}

function HistoryItem({ entry }: HistoryItemProps) {
  const [expanded, setExpanded] = useState(false);
  const config = CHANGE_TYPE_CONFIG[entry.changeType] || CHANGE_TYPE_CONFIG['UPDATED'];
  const IconComp = config.icon;

  const userName = entry.user?.name || 'Sistem';
  const userRole = entry.user?.role;

  const hasDetails =
    entry.fieldName ||
    entry.summary ||
    entry.oldValue !== null ||
    entry.newValue !== null;

  return (
    <div className="flex gap-4">
      {/* Timeline dot */}
      <div className="flex flex-col items-center">
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${config.bg}`}>
          <IconComp className={`w-4 h-4 ${config.color}`} />
        </div>
        <div className="w-0.5 bg-slate-200 flex-1 mt-2" />
      </div>

      {/* Content */}
      <div className="pb-6 flex-1 min-w-0">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all">
          {/* Row 1: change type + time */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <span className={`text-[13px] font-bold ${config.color}`}>
                {config.label}
              </span>
              {entry.fieldName && (
                <span className="ml-2 text-[12px] text-slate-500">
                  — {FIELD_LABELS[entry.fieldName] || entry.fieldName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 flex-shrink-0" title={formatDateTime(entry.createdAt)}>
              <Clock className="w-3 h-3" />
              {formatRelativeTime(entry.createdAt)}
            </div>
          </div>

          {/* Row 2: user info */}
          <div className="flex items-center gap-2 mt-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#31889C] to-[#226A7A] flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
              {getInitials(userName)}
            </div>
            <span className="text-[12px] text-slate-600 font-medium">{userName}</span>
            {userRole && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[userRole] || 'bg-slate-100 text-slate-600'}`}>
                {ROLE_LABELS[userRole] || userRole}
              </span>
            )}
          </div>

          {/* Summary */}
          {entry.summary && (
            <p className="mt-2 text-[12px] text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
              {entry.summary}
            </p>
          )}

          {/* Toggle detail */}
          {hasDetails && (entry.oldValue || entry.newValue) && (
            <>
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-[12px] text-slate-400 hover:text-[#31889C] mt-3 transition-colors"
              >
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {expanded ? 'Sembunyikan detail' : 'Lihat detail perubahan'}
              </button>

              {expanded && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Sebelum</p>
                    <div className="bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 text-[12px] text-rose-700 font-mono whitespace-pre-wrap break-words">
                      {renderJsonValue(entry.oldValue)}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Sesudah</p>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-[12px] text-emerald-700 font-mono whitespace-pre-wrap break-words">
                      {renderJsonValue(entry.newValue)}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function MinutesHistorySection({ meetingId }: MinutesHistorySectionProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getMinutesHistoryAction(meetingId);
      if (res.success && res.history) {
        setHistory(res.history);
      }
    } finally {
      setIsLoading(false);
    }
  }, [meetingId]);

  useEffect(() => { load(); }, [load]);

  const changeTypes = ['all', ...Array.from(new Set(history.map((h) => h.changeType)))];

  const filtered = filterType === 'all'
    ? history
    : history.filter((h) => h.changeType === filterType);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center">
            <History className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-[15px]">Riwayat Perubahan Notulen</h3>
            <p className="text-[12px] text-slate-500">{history.length} entri perubahan tercatat secara otomatis</p>
          </div>
        </div>

        {/* Filter */}
        {changeTypes.length > 1 && (
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {changeTypes.map((t) => {
              const cfg = CHANGE_TYPE_CONFIG[t];
              return (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`text-[12px] font-medium px-3 py-1.5 rounded-lg transition-all ${
                    filterType === t ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t === 'all' ? 'Semua' : cfg?.label || t}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Info note */}
      <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 flex items-start gap-3">
        <Shield className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
        <p className="text-[12px] text-violet-700 leading-relaxed">
          <strong>Audit Trail</strong> merekam setiap perubahan notulen secara otomatis — termasuk siapa yang mengubah, apa yang diubah, dan kapan perubahan terjadi. Data ini tidak dapat dihapus.
        </p>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <History className="w-7 h-7 text-slate-400" />
          </div>
          <h4 className="font-semibold text-slate-700 text-[14px]">Belum ada riwayat perubahan</h4>
          <p className="text-slate-400 text-[13px] mt-1">
            Riwayat akan muncul secara otomatis setiap kali notulen disimpan atau diubah.
          </p>
        </div>
      ) : (
        <div className="relative">
          {filtered.map((entry) => (
            <HistoryItem key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
