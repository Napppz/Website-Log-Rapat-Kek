'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  History,
  FileEdit,
  FilePlus,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Loader2,
  Clock,
  Shield,
  FileText,
  Layers,
  Sparkles,
} from 'lucide-react';
import { getMinutesHistoryAction } from '@/app/actions/history-actions';

interface MinutesHistorySectionProps {
  meetingId: string;
  initialFilter?: 'all' | 'nota_dinas' | 'notula' | 'status';
}

export type DocHistoryCategory = 'NOTA_DINAS' | 'NOTULA' | 'STATUS';

/**
 * Helper to determine whether an audit trail entry belongs to Nota Dinas, Risalah Notulen, or Status Rapat
 */
export function getHistoryDocCategory(entry: any): DocHistoryCategory {
  if (entry.changeType === 'STATUS_CHANGED' || entry.fieldName === 'status') {
    return 'STATUS';
  }

  const fieldNameUpper = (entry.fieldName || '').toUpperCase();
  const summaryLower = (entry.summary || '').toLowerCase();

  if (
    fieldNameUpper === 'NOTA_DINAS' ||
    summaryLower.includes('nota dinas') ||
    entry.newValue?.docType === 'NOTA_DINAS' ||
    entry.oldValue?.docType === 'NOTA_DINAS' ||
    entry.newValue?.conclusion?.docType === 'NOTA_DINAS' ||
    entry.oldValue?.conclusion?.docType === 'NOTA_DINAS' ||
    entry.newValue?.decisions?.docType === 'NOTA_DINAS' ||
    entry.oldValue?.decisions?.docType === 'NOTA_DINAS' ||
    entry.newValue?.conclusion?.notaDinas ||
    entry.oldValue?.conclusion?.notaDinas ||
    entry.newValue?.decisions?.notaDinas ||
    entry.oldValue?.decisions?.notaDinas
  ) {
    return 'NOTA_DINAS';
  }

  return 'NOTULA';
}

const CATEGORY_CONFIG: Record<
  DocHistoryCategory,
  {
    badgeLabel: string;
    badgeStyle: string;
    createdLabel: string;
    updatedLabel: string;
    icon: any;
    themeBg: string;
    themeColor: string;
  }
> = {
  NOTA_DINAS: {
    badgeLabel: 'Nota Dinas',
    badgeStyle: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    createdLabel: 'Nota Dinas Dibuat',
    updatedLabel: 'Nota Dinas Diperbarui',
    icon: FileText,
    themeBg: 'bg-indigo-50 border-indigo-200',
    themeColor: 'text-indigo-700',
  },
  NOTULA: {
    badgeLabel: 'Risalah Notula',
    badgeStyle: 'bg-teal-50 text-teal-700 border-teal-200',
    createdLabel: 'Notulen Dibuat',
    updatedLabel: 'Notulen Diperbarui',
    icon: FileEdit,
    themeBg: 'bg-teal-50 border-teal-200',
    themeColor: 'text-teal-700',
  },
  STATUS: {
    badgeLabel: 'Status Rapat',
    badgeStyle: 'bg-violet-50 text-violet-700 border-violet-200',
    createdLabel: 'Status Ditetapkan',
    updatedLabel: 'Status Diubah',
    icon: FileCheck,
    themeBg: 'bg-violet-50 border-violet-200',
    themeColor: 'text-violet-700',
  },
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

function truncateText(text: string, max = 140) {
  if (!text) return '-';
  if (text.length <= max) return text;
  return text.slice(0, max) + '...';
}

/** Extract plain text from ProseMirror/TipTap rich text JSON node */
function extractNodeText(node: any): string {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'object' && node.type === 'text' && typeof node.text === 'string') {
    return node.text;
  }
  if (typeof node === 'object' && Array.isArray(node.content)) {
    return node.content.map(extractNodeText).join('');
  }
  if (typeof node === 'object' && node.type === 'doc') {
    return extractNodeText(node.content);
  }
  return '';
}

/** Extract all text paragraphs from a ProseMirror doc-level field */
function extractFieldText(field: any): string {
  if (!field) return '-';
  if (typeof field === 'string') return truncateText(field);
  if (typeof field === 'object' && field.type === 'doc' && Array.isArray(field.content)) {
    const lines = field.content
      .map((block: any) => {
        if (block.type === 'paragraph' || block.type === 'bulletList' || block.type === 'orderedList') {
          if (Array.isArray(block.content)) {
            return block.content.map(extractNodeText).join('');
          }
        }
        return extractNodeText(block);
      })
      .filter(Boolean);
    return truncateText(lines.join(' · ') || '-');
  }
  return '-';
}

/**
 * Render history value: If it's a Nota Dinas or Notulen snapshot, render labeled sections.
 */
function renderHistorySnapshot(val: any, category: DocHistoryCategory): { sections: { label: string; text: string }[] } | { plain: string } {
  if (!val) return { plain: '-' };
  if (typeof val === 'string') return { plain: truncateText(val) };

  if (typeof val === 'object') {
    const sections: { label: string; text: string }[] = [];

    // Check if Nota Dinas payload exists
    const nd =
      val.notaDinas ||
      val.decisions?.notaDinas ||
      val.conclusion?.notaDinas ||
      (category === 'NOTA_DINAS' && val.conclusion && typeof val.conclusion === 'object' ? val.conclusion : null);

    if (nd && typeof nd === 'object') {
      if (nd.documentNumber) sections.push({ label: '📜 Nomor Nota Dinas', text: nd.documentNumber });
      if (nd.recipient) sections.push({ label: '👤 Yth / Penerima', text: nd.recipient });
      if (nd.sender) sections.push({ label: '📤 Dari / Pengirim', text: nd.sender });
      if (nd.subject) sections.push({ label: '📌 Perihal', text: nd.subject });
      if (nd.dateText) sections.push({ label: '📅 Tanggal Naskah', text: nd.dateText });
      if (nd.attachments && nd.attachments !== '-') sections.push({ label: '📎 Lampiran', text: nd.attachments });
      if (val.discussion) {
        const discText = extractFieldText(val.discussion);
        if (discText && discText !== '-') sections.push({ label: '💬 Pokok Pembahasan', text: discText });
      }
      if (val.decisions) {
        const decText = extractFieldText(val.decisions);
        if (decText && decText !== '-') sections.push({ label: '✅ Arahan / Tindak Lanjut', text: decText });
      }
      if (sections.length > 0) return { sections };
    }

    // Default Notulen Sections
    if (val.agenda) {
      const t = extractFieldText(val.agenda);
      if (t && t !== '-') sections.push({ label: '📋 Agenda Sidang', text: t });
    }
    if (val.discussion) {
      const t = extractFieldText(val.discussion);
      if (t && t !== '-') sections.push({ label: '💬 Hasil Pembahasan', text: t });
    }
    if (val.decisions) {
      const t = extractFieldText(val.decisions);
      if (t && t !== '-') sections.push({ label: '✅ Poin Kesepakatan / Arahan', text: t });
    }
    if (val.conclusion) {
      const t = extractFieldText(val.conclusion);
      if (t && t !== '-') sections.push({ label: '📝 Penutup / Penandatangan', text: t });
    }

    if (sections.length > 0) return { sections };

    // Fallback simple key-value
    const entries = Object.entries(val)
      .filter(([k]) => k !== 'docType' && k !== 'type')
      .map(([k, v]) => `${k}: ${typeof v === 'string' ? truncateText(v) : JSON.stringify(v).slice(0, 50)}`)
      .join(' | ');
    return { plain: truncateText(entries || JSON.stringify(val)) };
  }

  return { plain: String(val) };
}

interface HistoryItemProps {
  entry: any;
}

function HistoryItem({ entry }: HistoryItemProps) {
  const [expanded, setExpanded] = useState(false);
  const category = getHistoryDocCategory(entry);
  const catConfig = CATEGORY_CONFIG[category];
  const IconComp = catConfig.icon;

  const isCreated = entry.changeType === 'CREATED';
  const headline = isCreated ? catConfig.createdLabel : catConfig.updatedLabel;

  const userName = entry.user?.name || 'Sistem SIM-RAPAT';
  const userRole = entry.user?.role;

  const hasDetails = entry.oldValue !== null || entry.newValue !== null;

  return (
    <div className="flex gap-3 sm:gap-4">
      {/* Timeline dot */}
      <div className="flex flex-col items-center">
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${catConfig.themeBg}`}>
          <IconComp className={`w-4 h-4 ${catConfig.themeColor}`} />
        </div>
        <div className="w-0.5 bg-slate-200 flex-1 mt-2" />
      </div>

      {/* Content Card */}
      <div className="pb-6 flex-1 min-w-0">
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs hover:border-[#31889C]/50 hover:shadow-xs transition-all">
          {/* Row 1: Badges, Title, Time */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${catConfig.badgeStyle}`}>
                {catConfig.badgeLabel}
              </span>
              <span className={`text-[13px] font-bold ${catConfig.themeColor}`}>
                {headline}
              </span>
              {entry.fieldName && entry.fieldName !== 'NOTA_DINAS' && entry.fieldName !== 'NOTULA' && (
                <span className="text-[12px] text-slate-500 font-medium">
                  ({entry.fieldName})
                </span>
              )}
            </div>
            <div
              className="flex items-center gap-1 text-[11px] text-slate-400 flex-shrink-0"
              title={formatDateTime(entry.createdAt)}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{formatRelativeTime(entry.createdAt)}</span>
            </div>
          </div>

          {/* Row 2: User Attribution */}
          <div className="flex items-center gap-2 mt-2.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#31889C] to-[#226A7A] flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
              {getInitials(userName)}
            </div>
            <span className="text-[12px] text-slate-700 font-semibold">{userName}</span>
            {userRole && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[userRole] || 'bg-slate-100 text-slate-600'}`}>
                {ROLE_LABELS[userRole] || userRole}
              </span>
            )}
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              · {formatDateTime(entry.createdAt)}
            </span>
          </div>

          {/* Row 3: Change Summary Box */}
          {entry.summary && (
            <div className="mt-2.5 text-[12px] text-slate-600 bg-slate-50/80 rounded-lg px-3 py-2 border border-slate-100 leading-relaxed">
              {entry.summary}
            </div>
          )}

          {/* Row 4: Detailed Diff Snapshot */}
          {hasDetails && (
            <>
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#31889C] hover:text-[#215865] mt-3 transition-colors cursor-pointer"
              >
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>{expanded ? 'Sembunyikan rincian naskah' : 'Lihat rincian perubahan naskah'}</span>
              </button>

              {expanded && (
                <div className="mt-3.5 space-y-3 pt-2 border-t border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* SEBELUM */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wide">
                          Kondisi Naskah Sebelum Diubah
                        </p>
                      </div>
                      {(() => {
                        const result = renderHistorySnapshot(entry.oldValue, category);
                        if ('sections' in result) {
                          return (
                            <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-3 space-y-2.5">
                              {result.sections.map((s, i) => (
                                <div key={i} className="space-y-0.5">
                                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
                                    {s.label}
                                  </span>
                                  <p className="text-[12px] text-rose-900 leading-relaxed font-sans whitespace-pre-wrap">
                                    {s.text}
                                  </p>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return (
                          <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl px-3 py-2 text-[12px] text-rose-800">
                            {result.plain}
                          </div>
                        );
                      })()}
                    </div>

                    {/* SESUDAH */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">
                          Kondisi Naskah Setelah Diperbarui
                        </p>
                      </div>
                      {(() => {
                        const result = renderHistorySnapshot(entry.newValue, category);
                        if ('sections' in result) {
                          return (
                            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 space-y-2.5">
                              {result.sections.map((s, i) => (
                                <div key={i} className="space-y-0.5">
                                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                                    {s.label}
                                  </span>
                                  <p className="text-[12px] text-emerald-900 leading-relaxed font-sans whitespace-pre-wrap">
                                    {s.text}
                                  </p>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return (
                          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl px-3 py-2 text-[12px] text-emerald-800">
                            {result.plain}
                          </div>
                        );
                      })()}
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

export function MinutesHistorySection({
  meetingId,
  initialFilter = 'all',
}: MinutesHistorySectionProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<'all' | 'nota_dinas' | 'notula' | 'status'>(initialFilter);

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

  useEffect(() => {
    load();
  }, [load]);

  // Compute category counts
  const counts = useMemo(() => {
    let notaDinasCount = 0;
    let notulaCount = 0;
    let statusCount = 0;

    for (const item of history) {
      const cat = getHistoryDocCategory(item);
      if (cat === 'NOTA_DINAS') notaDinasCount++;
      else if (cat === 'NOTULA') notulaCount++;
      else if (cat === 'STATUS') statusCount++;
    }

    return {
      all: history.length,
      nota_dinas: notaDinasCount,
      notula: notulaCount,
      status: statusCount,
    };
  }, [history]);

  // Filter items
  const filtered = useMemo(() => {
    if (filterCategory === 'all') return history;
    if (filterCategory === 'nota_dinas') {
      return history.filter((h) => getHistoryDocCategory(h) === 'NOTA_DINAS');
    }
    if (filterCategory === 'notula') {
      return history.filter((h) => getHistoryDocCategory(h) === 'NOTULA');
    }
    if (filterCategory === 'status') {
      return history.filter((h) => getHistoryDocCategory(h) === 'STATUS');
    }
    return history;
  }, [history, filterCategory]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#F0F9FA] border border-[#BCE3EB] flex items-center justify-center shrink-0">
            <History className="w-5 h-5 text-[#31889C]" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-[16px] flex items-center gap-2">
              <span>Riwayat Perubahan Dokumen Rapat</span>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                Audit Trail
              </span>
            </h3>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Merekam seluruh riwayat pembuatan dan revisi naskah <strong>Nota Dinas</strong>, <strong>Risalah Notulen</strong>, serta pergeseran status rapat.
            </p>
          </div>
        </div>

        {/* Tab Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70 overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setFilterCategory('all')}
            className={`inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              filterCategory === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Semua</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/80 font-mono">
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterCategory('nota_dinas')}
            className={`inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              filterCategory === 'nota_dinas'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-indigo-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Nota Dinas</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                filterCategory === 'nota_dinas' ? 'bg-indigo-700 text-white' : 'bg-slate-200/80 text-slate-700'
              }`}
            >
              {counts.nota_dinas}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterCategory('notula')}
            className={`inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              filterCategory === 'notula'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-teal-700'
            }`}
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>Risalah Notula</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                filterCategory === 'notula' ? 'bg-teal-700 text-white' : 'bg-slate-200/80 text-slate-700'
              }`}
            >
              {counts.notula}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterCategory('status')}
            className={`inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              filterCategory === 'status'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-violet-700'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Status Rapat</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                filterCategory === 'status' ? 'bg-violet-700 text-white' : 'bg-slate-200/80 text-slate-700'
              }`}
            >
              {counts.status}
            </span>
          </button>
        </div>
      </div>

      {/* Info note */}
      <div className="bg-[#F0F9FA] border border-[#BCE3EB] rounded-xl px-4 py-3 flex items-start gap-3">
        <Shield className="w-4 h-4 text-[#31889C] mt-0.5 flex-shrink-0" />
        <div className="text-[12px] text-[#215865] leading-relaxed">
          <strong>Keamanan Dokumen & Integritas Audit Trail:</strong> Setiap tindakan pengetikan, perubahan redaksional pada naskah Nota Dinas / Notula, maupun persetujuan pimpinan terekam secara permanen dengan identitas pegawai dan cap waktu. Data audit ini tidak dapat diubah atau dihapus.
        </div>
      </div>

      {/* Timeline List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-slate-200/80">
          <Loader2 className="w-6 h-6 animate-spin text-[#31889C]" />
          <span className="ml-2 text-[13px] text-slate-500 font-medium">Memuat riwayat perubahan...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-slate-200/80">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
            <History className="w-7 h-7 text-slate-400" />
          </div>
          <h4 className="font-bold text-slate-800 text-[15px]">
            {filterCategory === 'nota_dinas'
              ? 'Belum Ada Riwayat Perubahan Nota Dinas'
              : filterCategory === 'notula'
              ? 'Belum Ada Riwayat Perubahan Risalah Notula'
              : filterCategory === 'status'
              ? 'Belum Ada Riwayat Perubahan Status'
              : 'Belum Ada Riwayat Perubahan Dokumen'}
          </h4>
          <p className="text-slate-500 text-[12.5px] max-w-md mt-1 leading-relaxed">
            {filterCategory === 'nota_dinas'
              ? 'Riwayat akan otomatis tercatat setiap kali naskah Nota Dinas diedit atau disimpan melalui editor.'
              : filterCategory === 'notula'
              ? 'Riwayat akan otomatis tercatat setiap kali naskah Risalah Notula disimpan atau diperbarui.'
              : 'Riwayat akan otomatis muncul saat staf atau pimpinan melakukan penyimpanan dokumen atau perubahan status rapat.'}
          </p>
        </div>
      ) : (
        <div className="relative pt-2">
          {filtered.map((entry) => (
            <HistoryItem key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
