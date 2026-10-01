'use client';

import React, { useState } from 'react';
import { ExternalLink, Copy, Check, FileText } from 'lucide-react';
import { toast } from '@/components/providers/toast-provider';

// Standard Google Drive SVG logo
export function GoogleDriveIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 87.3 78" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5l5.4 9.35z" fill="#0066DA" />
      <path d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3L1.2 52.4c-.8 1.4-1.2 2.95-1.2 4.5h27.5L43.65 25z" fill="#00AC47" />
      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.95 10.3 7.8 13.5z" fill="#EA4335" />
      <path d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.4-4.5 1.2L43.65 25z" fill="#00832D" />
      <path d="M59.8 53H87.3c0-1.55-.4-3.1-1.2-4.5L72.35 24.7c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.8 53z" fill="#FFBA00" />
      <path d="m73.55 76.8-13.75-23.8H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.4 4.5-1.2z" fill="#2684FC" />
    </svg>
  );
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
  label = 'Dokumen Pendukung Google Drive',
  variant = 'card',
}: GoogleDriveLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const targetUrl = normalizeUrl(url);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    toast.success('Tautan Google Drive berhasil disalin ke clipboard.');
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
          title={`Klik untuk langsung membuka di Google Drive (tab baru):\n${targetUrl}`}
        >
          {isDrive ? (
            <GoogleDriveIcon className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-[#31889C] shrink-0" />
          )}
          <span className="underline decoration-dotted underline-offset-2">
            {isDrive ? 'Buka Google Drive' : 'Buka Dokumen'}
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
        title={`Klik untuk langsung membuka di Google Drive (tab baru):\n${targetUrl}`}
      >
        <div className="w-9 h-9 rounded-lg bg-white border border-[#BCE3EB] group-hover:border-[#31889C] group-hover:bg-[#F0F9FA] flex items-center justify-center shrink-0 shadow-2xs transition-all">
          {isDrive ? (
            <GoogleDriveIcon className="w-4.5 h-4.5 transition-transform group-hover:scale-110" />
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
              {isDrive ? 'Google Drive' : 'Tautan Luar'}
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

        {/* Primary CTA button to open Google Drive in new tab */}
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#31889C] hover:bg-[#266F80] text-white text-[11.5px] font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer"
          title="Buka berkas di Google Drive langsung pada tab baru"
        >
          <span>Buka di Google Drive</span>
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
              <span>{isDrive ? '📎 Buka Google Drive' : part}</span>
              <ExternalLink className="w-3 h-3 inline-block shrink-0" />
            </a>
          );
        }
        return part;
      })}
    </span>
  );
}
