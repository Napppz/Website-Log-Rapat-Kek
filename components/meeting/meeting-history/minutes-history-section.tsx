'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  History,
  FileEdit,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Loader2,
  Clock,
  Shield,
  FileText,
  Layers,
  Sparkles,
  ArrowRight,
  Split,
  AlignLeft,
  Tag,
} from 'lucide-react';
import { getMinutesHistoryAction } from '@/app/actions/history-actions';
import { getMeetingStatusDetail } from '@/lib/meeting-status';
import { MeetingStatus } from '@/lib/types';

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
    entry.oldValue?.decisions?.notaDinas ||
    entry.newValue?.notaDinas ||
    entry.oldValue?.notaDinas
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
  STAFF: 'bg-blue-100 text-blue-700',
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  STAFF: 'Staf',
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

// ==========================================
// Word-Level Diff Algorithm (LCS Based)
// ==========================================

export type DiffType = 'unchanged' | 'added' | 'removed';

export interface DiffToken {
  type: DiffType;
  text: string;
}

function mergeAdjacentTokens(tokens: DiffToken[]): DiffToken[] {
  const merged: DiffToken[] = [];
  for (const token of tokens) {
    if (merged.length > 0 && merged[merged.length - 1].type === token.type) {
      merged[merged.length - 1].text += token.text;
    } else {
      merged.push({ ...token });
    }
  }
  return merged;
}

function computeWordDiffSimple(textA: string, textB: string): DiffToken[] {
  if (textA === textB) return [{ type: 'unchanged', text: textB }];
  if (!textA) return [{ type: 'added', text: textB }];
  if (!textB) return [{ type: 'removed', text: textA }];

  const tokensA = textA.match(/\S+\s*|\s+/g) || [];
  const tokensB = textB.match(/\S+\s*|\s+/g) || [];

  const n = tokensA.length;
  const m = tokensB.length;

  if (n * m > 250000) {
    return [
      { type: 'removed', text: textA },
      { type: 'added', text: textB },
    ];
  }

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (tokensA[i - 1] === tokensB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  let i = n;
  let j = m;
  const raw: DiffToken[] = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && tokensA[i - 1] === tokensB[j - 1]) {
      raw.unshift({ type: 'unchanged', text: tokensA[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      raw.unshift({ type: 'added', text: tokensB[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      raw.unshift({ type: 'removed', text: tokensA[i - 1] });
      i--;
    }
  }

  return mergeAdjacentTokens(raw);
}

export function computeWordDiff(oldText: string, newText: string): DiffToken[] {
  if (oldText === newText) {
    return [{ type: 'unchanged', text: newText }];
  }
  if (!oldText) {
    return [{ type: 'added', text: newText }];
  }
  if (!newText) {
    return [{ type: 'removed', text: oldText }];
  }

  if (oldText.includes('\n') || newText.includes('\n')) {
    const linesA = oldText.split('\n');
    const linesB = newText.split('\n');

    if (linesA.length === linesB.length && linesA.length > 1) {
      const allTokens: DiffToken[] = [];
      for (let i = 0; i < linesA.length; i++) {
        const lineDiff = computeWordDiffSimple(linesA[i], linesB[i]);
        allTokens.push(...lineDiff);
        if (i < linesA.length - 1) {
          allTokens.push({ type: 'unchanged', text: '\n' });
        }
      }
      return mergeAdjacentTokens(allTokens);
    }
  }

  return computeWordDiffSimple(oldText, newText);
}

// ==========================================
// Text Extraction & Section Models
// ==========================================

/**
 * Robustly extracts full plain text from ProseMirror/TipTap JSON nodes or strings,
 * without truncation, preserving list bullets, numbers, and paragraph structure.
 */
export function extractFullText(node: any): string {
  if (!node) return '';
  if (typeof node === 'string') {
    // Skip raw base64 images
    if (node.startsWith('data:image/') || node.length > 5000 && !node.includes(' ')) {
      return '';
    }
    return node.trim();
  }
  if (typeof node === 'number' || typeof node === 'boolean') return String(node);

  // Array of children
  if (Array.isArray(node)) {
    return node.map(extractFullText).filter(Boolean).join('');
  }

  if (typeof node === 'object') {
    // Single text node
    if (node.type === 'text' && typeof node.text === 'string') {
      return node.text;
    }

    // Skip image nodes
    if (node.type === 'image') {
      return '';
    }

    // Paragraph
    if (node.type === 'paragraph') {
      return extractFullText(node.content);
    }

    // List Item
    if (node.type === 'listItem') {
      return extractFullText(node.content);
    }

    // Heading
    if (node.type === 'heading') {
      return extractFullText(node.content);
    }

    // Bullet List
    if (node.type === 'bulletList' && Array.isArray(node.content)) {
      return node.content
        .map((li: any) => `• ${extractFullText(li)}`)
        .filter((t: string) => t !== '• ')
        .join('\n');
    }

    // Ordered List
    if (node.type === 'orderedList' && Array.isArray(node.content)) {
      return node.content
        .map((li: any, idx: number) => `${idx + 1}. ${extractFullText(li)}`)
        .filter(Boolean)
        .join('\n');
    }

    // Document or container with content array
    if (Array.isArray(node.content)) {
      return node.content
        .map(extractFullText)
        .filter(Boolean)
        .join('\n');
    }
  }

  return '';
}

export interface DocumentSection {
  id: string;
  label: string;
  cleanName: string;
  oldText: string;
  newText: string;
  status: 'UNCHANGED' | 'MODIFIED' | 'ADDED' | 'REMOVED';
  diff: DiffToken[];
  addedWords: number;
  removedWords: number;
}

function createSection(id: string, label: string, oldValRaw: any, newValRaw: any): DocumentSection | null {
  const oldText = (extractFullText(oldValRaw) || '').trim();
  const newText = (extractFullText(newValRaw) || '').trim();

  // If both are completely empty or placeholder "-", omit
  if ((!oldText || oldText === '-') && (!newText || newText === '-')) {
    return null;
  }

  const cleanOld = oldText === '-' ? '' : oldText;
  const cleanNew = newText === '-' ? '' : newText;

  let status: 'UNCHANGED' | 'MODIFIED' | 'ADDED' | 'REMOVED';
  let diff: DiffToken[];

  if (!cleanOld && cleanNew) {
    status = 'ADDED';
    diff = [{ type: 'added', text: cleanNew }];
  } else if (cleanOld && !cleanNew) {
    status = 'REMOVED';
    diff = [{ type: 'removed', text: cleanOld }];
  } else if (cleanOld === cleanNew) {
    status = 'UNCHANGED';
    diff = [{ type: 'unchanged', text: cleanNew }];
  } else {
    status = 'MODIFIED';
    diff = computeWordDiff(cleanOld, cleanNew);
  }

  let addedWords = 0;
  let removedWords = 0;
  for (const token of diff) {
    if (token.type === 'added') {
      const count = token.text.trim().split(/\s+/).filter(Boolean).length;
      addedWords += count;
    } else if (token.type === 'removed') {
      const count = token.text.trim().split(/\s+/).filter(Boolean).length;
      removedWords += count;
    }
  }

  const cleanName = label.replace(/^[^\w\s]+/, '').trim();

  return {
    id,
    label,
    cleanName,
    oldText: cleanOld,
    newText: cleanNew,
    status,
    diff,
    addedWords,
    removedWords,
  };
}

function extractNotaDinasObj(val: any) {
  if (!val || typeof val !== 'object') return null;
  return (
    val.notaDinas ||
    val.conclusion?.notaDinas ||
    val.decisions?.notaDinas ||
    (val.conclusion && typeof val.conclusion === 'object' && val.conclusion.documentNumber ? val.conclusion : null)
  );
}

/**
 * Extracts and aligns document sections from old and new values.
 * Directly corresponds to the sections in the Meeting Minutes Editor:
 * - Substansi Inti Pembahasan Rapat
 * - Kesimpulan Rapat
 * - Kesepakatan & Tindak Lanjut
 * - Agenda Sidang
 * - Kop & Identitas Naskah
 */
export function extractDocumentSections(
  oldVal: any,
  newVal: any,
  category: DocHistoryCategory
): DocumentSection[] {
  // 1. NOTA DINAS
  if (category === 'NOTA_DINAS') {
    const ndOld = extractNotaDinasObj(oldVal);
    const ndNew = extractNotaDinasObj(newVal);

    const rawSections = [
      createSection('doc_number', '📜 Nomor Nota Dinas', ndOld?.documentNumber, ndNew?.documentNumber),
      createSection('recipient', '👤 Yth / Penerima', ndOld?.recipient, ndNew?.recipient),
      createSection('sender', '📤 Dari / Pengirim', ndOld?.sender, ndNew?.sender),
      createSection('subject', '📌 Perihal', ndOld?.subject, ndNew?.subject),
      createSection('date', '📅 Tanggal Naskah', ndOld?.dateText, ndNew?.dateText),
      createSection('attachments', '📎 Lampiran', ndOld?.attachments, ndNew?.attachments),
      createSection('discussion', '💬 Substansi Inti Pembahasan', oldVal?.discussion, newVal?.discussion),
      createSection('conclusion', '📝 Kesimpulan Rapat', oldVal?.conclusion, newVal?.conclusion),
      createSection('decisions', '✅ Arahan & Tindak Lanjut', oldVal?.decisions, newVal?.decisions),
      createSection('agenda', '📋 Catatan Tambahan', oldVal?.agenda, newVal?.agenda),
    ];

    const valid = rawSections.filter((s): s is DocumentSection => s !== null);
    if (valid.length > 0) return valid;
  }

  // 2. NOTULA RAPAT
  if (category === 'NOTULA') {
    const oldConclusion = oldVal?.conclusion;
    const newConclusion = newVal?.conclusion;

    const rawSections = [
      createSection(
        'invitation_number',
        '📜 Nomor Surat Undangan',
        oldConclusion?.invitationNumber || (typeof oldConclusion === 'string' ? oldConclusion : null),
        newConclusion?.invitationNumber || (typeof newConclusion === 'string' ? newConclusion : null)
      ),
      createSection(
        'chairperson',
        '👤 Pimpinan Sidang',
        oldConclusion?.chairpersonName,
        newConclusion?.chairpersonName
      ),
      createSection('agenda', '📋 Agenda Sidang', oldVal?.agenda, newVal?.agenda),
      createSection('discussion', '💬 Substansi Inti Pembahasan', oldVal?.discussion, newVal?.discussion),
      createSection('conclusion', '📝 Kesimpulan Rapat', oldConclusion, newConclusion),
      createSection('decisions', '✅ Kesepakatan & Tindak Lanjut', oldVal?.decisions, newVal?.decisions),
    ];

    const valid = rawSections.filter((s): s is DocumentSection => s !== null);
    if (valid.length > 0) return valid;
  }

  // 3. STATUS CHANGE
  if (category === 'STATUS') {
    const oldStatus = oldVal?.status || (typeof oldVal === 'string' ? oldVal : '');
    const newStatus = newVal?.status || (typeof newVal === 'string' ? newVal : '');
    const sec = createSection('status', '🏷️ Status Rapat', oldStatus, newStatus);
    if (sec) return [sec];
  }

  // 4. FALLBACK FOR UNSTRUCTURED / GENERIC OBJECTS
  const keys = new Set<string>();
  if (oldVal && typeof oldVal === 'object') Object.keys(oldVal).forEach((k) => keys.add(k));
  if (newVal && typeof newVal === 'object') Object.keys(newVal).forEach((k) => keys.add(k));

  keys.delete('docType');
  keys.delete('type');

  const fallbackSections: DocumentSection[] = [];
  for (const k of Array.from(keys)) {
    const formattedLabel = k
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
    const sec = createSection(k, `📄 ${formattedLabel}`, oldVal?.[k], newVal?.[k]);
    if (sec) fallbackSections.push(sec);
  }
  if (fallbackSections.length > 0) return fallbackSections;

  const ultimate = createSection('data', '📄 Isi Naskah', JSON.stringify(oldVal || ''), JSON.stringify(newVal || ''));
  return ultimate ? [ultimate] : [];
}

// ==========================================
// Component: History Item Card
// ==========================================

interface HistoryItemProps {
  entry: any;
}

function HistoryItem({ entry }: HistoryItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'inline' | 'side_by_side'>('inline');
  const [filterOnlyChanged, setFilterOnlyChanged] = useState(true);

  const category = getHistoryDocCategory(entry);
  const catConfig = CATEGORY_CONFIG[category];
  const IconComp = catConfig.icon;

  const isCreated = entry.changeType === 'CREATED';
  const isStatusChange = category === 'STATUS' || entry.changeType === 'STATUS_CHANGED';
  const headline = isStatusChange
    ? catConfig.updatedLabel
    : isCreated
    ? catConfig.createdLabel
    : catConfig.updatedLabel;

  const userName = entry.user?.name || 'Sistem SIM-RAPAT';
  const userRole = entry.user?.role;
  const hasDetails = entry.oldValue !== null || entry.newValue !== null;

  // Extract sections & diffs
  const sections = useMemo(() => {
    return extractDocumentSections(entry.oldValue, entry.newValue, category);
  }, [entry.oldValue, entry.newValue, category]);

  // Changed parts
  const modifiedSections = useMemo(() => sections.filter((s) => s.status === 'MODIFIED'), [sections]);
  const addedSections = useMemo(() => sections.filter((s) => s.status === 'ADDED'), [sections]);
  const removedSections = useMemo(() => sections.filter((s) => s.status === 'REMOVED'), [sections]);

  const totalChangedCount = modifiedSections.length + addedSections.length + removedSections.length;
  const totalAddedWords = useMemo(() => sections.reduce((acc, s) => acc + s.addedWords, 0), [sections]);
  const totalRemovedWords = useMemo(() => sections.reduce((acc, s) => acc + s.removedWords, 0), [sections]);

  // Displayed sections based on filter
  const displayedSections = useMemo(() => {
    if (isCreated || totalChangedCount === 0 || !filterOnlyChanged) {
      return sections;
    }
    return sections.filter((s) => s.status !== 'UNCHANGED');
  }, [sections, filterOnlyChanged, isCreated, totalChangedCount]);

  // Status transitions
  const oldStatusVal = (entry.oldValue?.status || (typeof entry.oldValue === 'string' ? entry.oldValue : 'DRAFT')) as MeetingStatus;
  const newStatusVal = (entry.newValue?.status || (typeof entry.newValue === 'string' ? entry.newValue : 'REVIEW')) as MeetingStatus;
  const oldStatusDetail = getMeetingStatusDetail(oldStatusVal);
  const newStatusDetail = getMeetingStatusDetail(newStatusVal);

  return (
    <div className="flex gap-3 sm:gap-4">
      {/* Timeline dot */}
      <div className="flex flex-col items-center">
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 shadow-2xs ${catConfig.themeBg}`}>
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
              {entry.fieldName && entry.fieldName !== 'NOTA_DINAS' && entry.fieldName !== 'NOTULA' && entry.fieldName !== 'status' && (
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
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#31889C] to-[#226A7A] flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
              {getInitials(userName)}
            </div>
            <span className="text-[12px] text-slate-800 font-semibold">{userName}</span>
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
            <div className="mt-2.5 text-[12px] text-slate-700 bg-slate-50/80 rounded-lg px-3 py-2 border border-slate-100 leading-relaxed font-normal">
              {entry.summary}
            </div>
          )}

          {/* Row 4: Quick Summary Chips (Which parts changed?) */}
          {!isStatusChange && (modifiedSections.length > 0 || addedSections.length > 0 || removedSections.length > 0) && (
            <div className="flex items-center gap-1.5 flex-wrap mt-2.5 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mr-1">
                <Tag className="w-3 h-3 text-slate-400" />
                Rincian Perubahan:
              </span>

              {modifiedSections.map((s) => (
                <span
                  key={s.id}
                  className="text-[10.5px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 inline-flex items-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {s.cleanName} <span className="font-semibold text-amber-700">(Diubah)</span>
                </span>
              ))}

              {addedSections.map((s) => (
                <span
                  key={s.id}
                  className="text-[10.5px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 inline-flex items-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {s.cleanName} <span className="font-semibold text-emerald-700">(Ditambahkan)</span>
                </span>
              ))}

              {removedSections.map((s) => (
                <span
                  key={s.id}
                  className="text-[10.5px] font-medium px-2 py-0.5 rounded-md bg-rose-50 text-rose-900 border border-rose-200 inline-flex items-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  {s.cleanName} <span className="font-semibold text-rose-700">(Dihapus)</span>
                </span>
              ))}

              {(totalAddedWords > 0 || totalRemovedWords > 0) && (
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 ml-auto hidden sm:inline-flex items-center gap-1">
                  {totalAddedWords > 0 && <span className="text-emerald-700">+{totalAddedWords} kata</span>}
                  {totalAddedWords > 0 && totalRemovedWords > 0 && <span>·</span>}
                  {totalRemovedWords > 0 && <span className="text-rose-700">-{totalRemovedWords} kata</span>}
                </span>
              )}
            </div>
          )}

          {/* Row 5: Detailed Diff Inspector Toggle */}
          {hasDetails && (
            <>
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#31889C] hover:text-[#215865] mt-3 transition-colors cursor-pointer"
              >
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>
                  {expanded
                    ? 'Sembunyikan rincian komparasi naskah'
                    : isStatusChange
                    ? 'Lihat rincian pergeseran status'
                    : `Buka perbandingan detail (${totalChangedCount > 0 ? `${totalChangedCount} bagian berubah` : 'seluruh naskah'})`}
                </span>
              </button>

              {expanded && (
                <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-4">
                  {/* SPECIAL STATUS TRANSITION CARD */}
                  {isStatusChange ? (
                    <div className="bg-gradient-to-r from-violet-50/80 via-slate-50 to-indigo-50/80 border border-violet-200/80 rounded-xl p-4 space-y-3">
                      <div className="text-[11px] font-bold text-violet-800 uppercase tracking-wide flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-violet-600" />
                        <span>Alur Pergeseran Status Rapat</span>
                      </div>

                      <div className="flex items-center justify-between gap-3 flex-wrap bg-white p-3.5 rounded-lg border border-violet-100 shadow-2xs">
                        {/* Old Status */}
                        <div className="flex items-center gap-2.5">
                          <span className={`text-[12px] font-bold px-3 py-1 rounded-lg border shadow-2xs ${oldStatusDetail.colorClass.badgeStyle}`}>
                            {oldStatusDetail.badgeLabel}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            ({oldStatusDetail.sublabel})
                          </span>
                        </div>

                        {/* Transition Arrow */}
                        <div className="flex items-center gap-2 text-violet-600 font-bold text-[12px]">
                          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Dialihkan menjadi</span>
                          <ArrowRight className="w-4 h-4 text-violet-600 animate-pulse" />
                        </div>

                        {/* New Status */}
                        <div className="flex items-center gap-2.5">
                          <span className={`text-[12px] font-bold px-3 py-1 rounded-lg border shadow-2xs ${newStatusDetail.colorClass.badgeStyle}`}>
                            {newStatusDetail.badgeLabel}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            ({newStatusDetail.sublabel})
                          </span>
                        </div>
                      </div>

                      <div className="text-[12px] text-slate-600 bg-white/70 rounded-lg p-3 border border-slate-200/60 leading-relaxed space-y-1">
                        <p className="font-semibold text-slate-800">
                          📌 Definisi Tahapan &quot;{newStatusDetail.badgeLabel}&quot;:
                        </p>
                        <p className="text-[11.5px] text-slate-600">{newStatusDetail.description}</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* CONTROLS TOOLBAR */}
                      <div className="flex items-center justify-between gap-3 flex-wrap bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        {/* Filter Changed vs All */}
                        {totalChangedCount > 0 && !isCreated ? (
                          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => setFilterOnlyChanged(true)}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                                filterOnlyChanged
                                  ? 'bg-[#31889C] text-white shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Hanya Yang Berubah ({totalChangedCount})</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setFilterOnlyChanged(false)}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                                !filterOnlyChanged
                                  ? 'bg-[#31889C] text-white shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              <Layers className="w-3 h-3" />
                              <span>Semua Bagian ({sections.length})</span>
                            </button>
                          </div>
                        ) : (
                          <div className="text-[11.5px] font-semibold text-slate-600 flex items-center gap-1.5 px-2">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            <span>Menampilkan seluruh {sections.length} bagian naskah</span>
                          </div>
                        )}

                        {/* View Mode Toggle: Inline Track Changes vs Side-by-Side */}
                        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs ml-auto">
                          <button
                            type="button"
                            onClick={() => setViewMode('inline')}
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                              viewMode === 'inline'
                                ? 'bg-slate-900 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="Tampilan Track Changes: Kata yang dihapus dicoret merah, kata baru ditandai hijau"
                          >
                            <AlignLeft className="w-3 h-3" />
                            <span>Mode Diff Kata</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewMode('side_by_side')}
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                              viewMode === 'side_by_side'
                                ? 'bg-slate-900 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="Tampilan Bersebelahan: Komparasi 2 kolom Sebelum vs Sesudah"
                          >
                            <Split className="w-3 h-3" />
                            <span>Mode Bersebelahan</span>
                          </button>
                        </div>
                      </div>

                      {/* NOTICE IF FILTERED */}
                      {filterOnlyChanged && totalChangedCount > 0 && !isCreated && (
                        <p className="text-[11px] text-slate-500 px-1">
                          ℹ️ Menampilkan {displayedSections.length} dari {sections.length} bagian yang mengalami perubahan. Klik <strong>&quot;Semua Bagian&quot;</strong> di atas untuk melihat naskah lengkap.
                        </p>
                      )}

                      {/* SECTIONS LIST */}
                      <div className="space-y-3.5">
                        {displayedSections.map((sec) => (
                          <div
                            key={sec.id}
                            className={`rounded-xl border transition-all ${
                              sec.status === 'MODIFIED'
                                ? 'bg-amber-50/30 border-amber-200/90'
                                : sec.status === 'ADDED'
                                ? 'bg-emerald-50/30 border-emerald-200/90'
                                : sec.status === 'REMOVED'
                                ? 'bg-rose-50/30 border-rose-200/90'
                                : 'bg-slate-50/40 border-slate-200/70'
                            } p-3.5 space-y-2`}
                          >
                            {/* Section Header */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="text-[12.5px] font-bold text-slate-800">
                                  {sec.label}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {sec.status === 'MODIFIED' && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    Diubah
                                    {(sec.addedWords > 0 || sec.removedWords > 0) && (
                                      <span className="font-mono text-[9.5px]">
                                        (+{sec.addedWords}, -{sec.removedWords})
                                      </span>
                                    )}
                                  </span>
                                )}

                                {sec.status === 'ADDED' && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Baru Ditambahkan
                                  </span>
                                )}

                                {sec.status === 'REMOVED' && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    Dihapus
                                  </span>
                                )}

                                {sec.status === 'UNCHANGED' && (
                                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                    Tidak Berubah
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Section Content Based on View Mode */}
                            {viewMode === 'inline' ? (
                              /* INLINE DIFF MODE (TRACK CHANGES) */
                              <div className="bg-white rounded-lg p-3 border border-slate-200/80 text-[12.5px] text-slate-800 leading-relaxed whitespace-pre-wrap font-sans select-text">
                                {sec.status === 'UNCHANGED' ? (
                                  <span className="text-slate-600">{sec.newText || sec.oldText}</span>
                                ) : sec.status === 'ADDED' ? (
                                  <ins className="bg-emerald-100 text-emerald-900 font-semibold no-underline px-1 py-0.5 rounded border-b-2 border-emerald-500">
                                    {sec.newText}
                                  </ins>
                                ) : sec.status === 'REMOVED' ? (
                                  <del className="bg-rose-100 text-rose-800 line-through decoration-rose-500 font-medium px-1 py-0.5 rounded">
                                    {sec.oldText}
                                  </del>
                                ) : (
                                  sec.diff.map((token, idx) => {
                                    if (token.type === 'unchanged') {
                                      return <span key={idx}>{token.text}</span>;
                                    }
                                    if (token.type === 'removed') {
                                      return (
                                        <del
                                          key={idx}
                                          className="bg-rose-100 text-rose-800 line-through decoration-rose-500 font-medium px-1 py-0.5 rounded mx-0.5 select-text"
                                          title="Kata naskah sebelumnya (Dihapus)"
                                        >
                                          {token.text}
                                        </del>
                                      );
                                    }
                                    if (token.type === 'added') {
                                      return (
                                        <ins
                                          key={idx}
                                          className="bg-emerald-100 text-emerald-950 font-bold no-underline px-1 py-0.5 rounded mx-0.5 border-b-2 border-emerald-500 select-text"
                                          title="Kata naskah terbaru (Ditambahkan)"
                                        >
                                          {token.text}
                                        </ins>
                                      );
                                    }
                                    return null;
                                  })
                                )}
                              </div>
                            ) : (
                              /* SIDE-BY-SIDE MODE */
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                {/* SEBELUM */}
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                                    Sebelum Diubah:
                                  </span>
                                  <div className="bg-rose-50/50 border border-rose-200/70 rounded-lg p-2.5 text-[12px] text-rose-950 leading-relaxed whitespace-pre-wrap font-sans select-text">
                                    {sec.oldText ? (
                                      sec.status === 'MODIFIED' ? (
                                        sec.diff.map((token, idx) => {
                                          if (token.type === 'removed') {
                                            return (
                                              <span key={idx} className="bg-rose-200/90 text-rose-900 font-semibold px-0.5 rounded">
                                                {token.text}
                                              </span>
                                            );
                                          }
                                          if (token.type === 'unchanged') {
                                            return <span key={idx}>{token.text}</span>;
                                          }
                                          return null;
                                        })
                                      ) : (
                                        sec.oldText
                                      )
                                    ) : (
                                      <span className="text-slate-400 italic">(Kosong)</span>
                                    )}
                                  </div>
                                </div>

                                {/* SESUDAH */}
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                                    Setelah Diperbarui:
                                  </span>
                                  <div className="bg-emerald-50/50 border border-emerald-200/70 rounded-lg p-2.5 text-[12px] text-emerald-950 leading-relaxed whitespace-pre-wrap font-sans select-text">
                                    {sec.newText ? (
                                      sec.status === 'MODIFIED' ? (
                                        sec.diff.map((token, idx) => {
                                          if (token.type === 'added') {
                                            return (
                                              <span key={idx} className="bg-emerald-200/90 text-emerald-950 font-bold px-0.5 rounded">
                                                {token.text}
                                              </span>
                                            );
                                          }
                                          if (token.type === 'unchanged') {
                                            return <span key={idx}>{token.text}</span>;
                                          }
                                          return null;
                                        })
                                      ) : (
                                        sec.newText
                                      )
                                    ) : (
                                      <span className="text-slate-400 italic">(Kosong)</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Main Section Export
// ==========================================

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
              Merekam seluruh riwayat perubahan naskah <strong>Nota Dinas</strong>, <strong>Risalah Notulen</strong> (Substansi Inti Pembahasan, Kesimpulan, dan Arahan), serta pergeseran status rapat dengan penandaan kata demi kata (word diff).
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
          <strong>Keamanan Dokumen & Integritas Audit Trail:</strong> Setiap tindakan pengetikan, perubahan redaksional pada naskah Nota Dinas / Notula, maupun persetujuan pimpinan terekam secara permanen dengan identitas pegawai, cap waktu, dan rincian kata demi kata. Data audit ini tidak dapat diubah atau dihapus.
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
