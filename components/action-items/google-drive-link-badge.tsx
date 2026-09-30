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
const DRIVE_REGEX = /(https?:\/\/(?:drive|docs)\.google\.com\/[^\s\)]+)/i;
const ANY_URL_REGEX = /(https?:\/\/[^\s\)]+)/i;

export function extractDriveLink(text?: string | null): string | null {
  if (!text) return null;
  const match = text.match(DRIVE_REGEX);
  return match ? match[0] : null;
}

export function extractAnyLink(text?: string | null): string | null {
  if (!text) return null;
  const match = text.match(ANY_URL_REGEX);
  return match ? match[0] : null;
}

export function cleanTextWithoutLink(text?: string | null): string {
  if (!text) return '';
  return text
    .replace(/(?:📎\s*)?(?:Tautan\s*(?:Google\s*Drive|Dokumen)?\s*:\s*)?https?:\/\/(?:drive|docs)\.google\.com\/[^\s\)]+/gi, '')
    .trim();
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

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Tautan Google Drive berhasil disalin ke clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  const isDrive = /drive\.google\.com|docs\.google\.com/i.test(url);

  if (variant === 'badge' || variant === 'compact') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F0F9FA] border border-[#BCE3EB] text-[#215865] text-[11px] font-semibold hover:bg-[#E2F4F7] transition-all group">
        {isDrive ? (
          <GoogleDriveIcon className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <FileText className="w-3.5 h-3.5 text-[#31889C] shrink-0" />
        )}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline flex items-center gap-1 max-w-[200px] truncate"
          title={url}
        >
          <span>{isDrive ? 'Google Drive' : 'Dokumen'}</span>
          <ExternalLink className="w-3 h-3 text-[#31889C] shrink-0" />
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="text-slate-400 hover:text-[#31889C] p-0.5 ml-0.5 cursor-pointer"
          title="Salin tautan"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2.5 p-3 rounded-xl bg-gradient-to-r from-[#F0F9FA] to-white border border-[#BCE3EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-white border border-[#BCE3EB] flex items-center justify-center shrink-0 shadow-2xs">
          {isDrive ? (
            <GoogleDriveIcon className="w-4 h-4" />
          ) : (
            <FileText className="w-4 h-4 text-[#31889C]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-bold text-slate-800 truncate">
              {label}
            </span>
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-[#E8F5F7] text-[#215865] border border-[#BCE3EB]">
              Eksternal
            </span>
          </div>
          <p className="text-[11px] text-slate-500 truncate font-mono mt-0.5 max-w-md">
            {url}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-semibold transition-colors cursor-pointer"
          title="Salin tautan Google Drive"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-600" />
              <span className="text-emerald-700">Tersalin</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-slate-400" />
              <span>Salin</span>
            </>
          )}
        </button>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#31889C] hover:bg-[#266F80] text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer"
        >
          <span>Buka Berkas</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
