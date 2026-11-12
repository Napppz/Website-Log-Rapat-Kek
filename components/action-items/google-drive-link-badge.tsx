'use client';

import React, { useState } from 'react';
import { ExternalLink, Copy, Check, FileText, Link2 } from 'lucide-react';
import { toast } from '@/components/providers/toast-provider';

// Generic link icon (replaces Google Drive logo)
export function GoogleDriveIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return <Link2 className={`${className} text-[#31889C]`} />;
}

/**
 * Regex helper to detect Google Drive / Google Docs / any HTTP links
 */
const DRIVE_REGEX = /(?:https?:\/\/)?((?:drive|docs)\.google\.com\/[^\s\)\"\'>]+)/i;
const ANY_URL_REGEX = /(https?:\/\/[^\s\)\"\'>]+)/i;

/**
 * Ensures URL always starts with https:// so browser opens external page instead of relative path,
 * and strips any accidental quotes, angle brackets, or trailing punctuation.
 */
export function normalizeUrl(url?: string | null): string {
  if (!url) return '';
  let trimmed = url.trim();
  // Strip surrounding quotes or brackets
  trimmed = trimmed.replace(/^[\<\"\'\s]+|[\>\"\'\s]+$/g, '');
  // Strip trailing punctuation often caught in sentences
  trimmed = trimmed.replace(/[\.\,\;\:\)]+$/, '');
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function extractDriveLink(text?: string | null): string | null {
  if (!text) return null;
  const match = text.match(DRIVE_REGEX);
  if (!match) return null;
  return normalizeUrl(match[0]);
}

export function extractAnyLink(text?: string | null): string | null {
  if (!text) return null;
  const match = text.match(ANY_URL_REGEX);
  if (!match) return null;
  return normalizeUrl(match[0]);
}

/**
 * Extracts ALL unique Google Drive / document links found in text (useful if 2 or 3 links are attached)
 */
export function extractAllLinks(text?: string | null): string[] {
  if (!text) return [];
  const regex = /(https?:\/\/[^\s\)\"\'>]+|(?:drive|docs)\.google\.com\/[^\s\)\"\'>]+)/gi;
  const matches = text.match(regex);
  if (!matches) return [];
  const normalized = matches
    .map((m) => normalizeUrl(m))
    .filter((m) => m && m.length > 5);
  return Array.from(new Set(normalized));
}

export function cleanTextWithoutLink(text?: string | null): string {
  if (!text) return '';
  // Only remove if it's formatted as standard attachment line:
  // e.g. "📎 Tautan Google Drive: https://..." or at the end of text
  const cleaned = text
    .replace(/(?:\r?\n)*📎\s*Tautan\s*(?:Google\s*Drive|Dokumen|Pendukung)?\s*:\s*(?:https?:\/\/)?(?:drive|docs)\.google\.com\/[^\s\)\"\'>]+/gi, '')
    .trim();

  // If the entire text was just a raw URL, return empty string so it doesn't duplicate
  if (/^(?:https?:\/\/)?(?:drive|docs)\.google\.com\/[^\s\)\"\'>]+$/i.test(cleaned)) {
    return '';
  }

  return cleaned;
}

interface GoogleDriveLinkCardProps {
  url: string;
  label?: string;
  variant?: 'card' | 'badge' | 'compact';
}

export function GoogleDriveLinkCard({
  url,
  label,
  variant = 'card',
}: GoogleDriveLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const targetUrl = normalizeUrl(url);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    toast.success('Tautan berhasil disalin ke clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  const isDrive = /drive\.google\.com|docs\.google\.com/i.test(targetUrl);

  if (variant === 'badge' || variant === 'compact') {
    return (
      <div className="inline-flex items-center gap-1.5">
        {/* Clickable pill that immediately opens the link in a new tab */}
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E8F5F7] hover:bg-[#D5EEF2] active:bg-[#BFE5EC] border border-[#A6DCE6] hover:border-[#31889C] text-[#1E5C6B] hover:text-[#133F49] text-[11.5px] font-bold transition-all shadow-2xs hover:shadow-xs group cursor-pointer"
          title={`Klik untuk langsung membuka tautan (tab baru):\n${targetUrl}`}
        >
          {isDrive ? (
            <Link2 className="w-3.5 h-3.5 text-[#31889C] shrink-0" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-[#31889C] shrink-0" />
          )}
          <span className="underline decoration-dotted underline-offset-2">
            {label ? label : 'Link Hasil Kegiatan'}
          </span>
          <ExternalLink className="w-3 h-3 text-[#31889C] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
        </a>

        {/* Dedicated copy button */}
        <button
          type="button"
          onClick={handleCopy}
          className="p-1.5 text-slate-400 hover:text-[#31889C] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Salin tautan ke clipboard"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    );
  }

  // Card Variant
  return (
    <div className="mt-2.5 p-3.5 rounded-xl bg-gradient-to-r from-[#F0F9FA] via-white to-[#F0F9FA] border border-[#BCE3EB] hover:border-[#31889C] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-all">
      {/* Clickable Header & URL Area */}
      <a
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-3 min-w-0 flex-1 group cursor-pointer"
        title={`Klik untuk langsung membuka tautan (tab baru):\n${targetUrl}`}
      >
        <div className="w-9 h-9 rounded-lg bg-white border border-[#BCE3EB] group-hover:border-[#31889C] group-hover:bg-[#F0F9FA] flex items-center justify-center shrink-0 shadow-2xs transition-all">
          {isDrive ? (
            <Link2 className="w-4.5 h-4.5 text-[#31889C]" />
          ) : (
            <FileText className="w-4.5 h-4.5 text-[#31889C]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[12.5px] font-bold text-slate-800 group-hover:text-[#31889C] group-hover:underline transition-colors truncate">
              {label}
            </span>
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-[#E8F5F7] text-[#215865] border border-[#BCE3EB]">
              Tautan Hasil
            </span>
          </div>
          <p className="text-[11px] text-slate-500 group-hover:text-slate-700 truncate font-mono mt-0.5 max-w-md">
            {targetUrl}
          </p>
        </div>
      </a>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-semibold transition-colors cursor-pointer"
          title="Salin tautan ke clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-600" />
              <span className="text-emerald-700 font-bold">Tersalin</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-slate-400" />
              <span>Salin</span>
            </>
          )}
        </button>

        {/* Primary CTA button to open link in new tab */}
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#31889C] hover:bg-[#266F80] text-white text-[11.5px] font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer"
          title="Buka tautan langsung pada tab baru"
        >
          <span>Buka Tautan</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

/**
 * Helper to auto-linkify any URL found inside plain text notes/descriptions
 */
export function RenderTextWithLinks({
  text,
  className = '',
}: {
  text?: string | null;
  className?: string;
}) {
  if (!text) return null;

  const parts = text.split(/(https?:\/\/[^\s\)\"\'>]+)/g);
  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (/^https?:\/\//i.test(part)) {
          const isDrive = /drive\.google\.com|docs\.google\.com/i.test(part);
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#31889C] hover:text-[#266F80] font-bold underline underline-offset-2 break-all hover:bg-[#F0F9FA] px-1 rounded transition-colors cursor-pointer"
              title={`Klik untuk langsung buka: ${part}`}
              onClick={(e) => e.stopPropagation()}
            >
              <span>{isDrive ? 'Buka Tautan Hasil' : part}</span>
              <ExternalLink className="w-3 h-3 inline-block shrink-0" />
            </a>
          );
        }
        return part;
      })}
    </span>
  );
}
