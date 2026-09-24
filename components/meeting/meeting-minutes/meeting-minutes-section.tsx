'use client';

import React, { useState, useEffect } from 'react';
import { MeetingMinutesEditor } from './meeting-minutes-editor';
import { MeetingMinutesPreview } from './meeting-minutes-preview';
import { getMeetingMinutesAction } from '@/app/actions/minute-actions';
import { FileEdit, Plus, Eye, FileText, Loader2, Sparkles } from 'lucide-react';

interface MeetingMinutesSectionProps {
  meetingId: string;
  initialMinutes?: any;
  defaultMode?: 'preview' | 'edit';
}

export function MeetingMinutesSection({
  meetingId,
  initialMinutes: propMinutes,
  defaultMode,
}: MeetingMinutesSectionProps) {
  const [minutes, setMinutes] = useState<any>(propMinutes || null);
  const [isLoading, setIsLoading] = useState(!propMinutes);
  const [mode, setMode] = useState<'empty' | 'edit' | 'preview'>('empty');

  // Load minutes on mount if not provided as prop
  useEffect(() => {
    let isMounted = true;

    if (propMinutes) {
      setMinutes(propMinutes);
      const hasContent =
        propMinutes.agenda || propMinutes.discussion || propMinutes.decisions || propMinutes.conclusion;
      setMode(hasContent ? (defaultMode || 'preview') : (defaultMode || 'edit'));
      setIsLoading(false);
      return;
    }

    const fetchMinutes = async () => {
      try {
        setIsLoading(true);
        const res = await getMeetingMinutesAction(meetingId);
        if (isMounted) {
          if (res.success && res.data) {
            setMinutes(res.data);
            const hasContent =
              res.data.agenda || res.data.discussion || res.data.decisions || res.data.conclusion;
            setMode(hasContent ? (defaultMode || 'preview') : 'empty');
          } else {
            setMode('empty');
          }
        }
      } catch (err) {
        console.error('Failed to load meeting minutes:', err);
        if (isMounted) setMode('empty');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchMinutes();
    return () => {
      isMounted = false;
    };
  }, [meetingId, propMinutes, defaultMode]);

  // Loading state
  if (isLoading) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-amber-200 shadow-xs flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin mb-3" />
        <p className="text-[14px] font-semibold text-slate-800">Memuat Notulen Resmi Rapat...</p>
        <p className="text-[12px] text-slate-500 mt-1">Mengambil arsip agenda dan keputusan dari Neon DB</p>
      </div>
    );
  }

  // MODE 1 — EMPTY STATE
  if (mode === 'empty') {
    return (
      <div className="p-10 text-center bg-white rounded-xl border border-amber-200/90 shadow-xs flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
          <FileText className="w-8 h-8" />
        </div>

        <div className="max-w-md">
          <h3 className="text-[18px] font-bold text-slate-900">Belum ada notulen untuk rapat ini.</h3>
          <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
            Catatan agenda, risalah pembahasan, keputusan sidang, dan langkah lanjutan belum diinputkan untuk sesi pertemuan ini.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMode('edit')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[13px] transition-all shadow-md shadow-amber-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Buat Notulen</span>
        </button>
      </div>
    );
  }

  // MODE 2 — EDIT STATE
  if (mode === 'edit') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[18px] font-bold text-slate-900 flex items-center gap-2">
              <FileEdit className="w-5 h-5 text-amber-600" />
              <span>Editor Notulen &amp; Hasil Rapat</span>
            </h3>
            <p className="text-[12px] text-slate-500">
              Gunakan rich text editor untuk menyusun agenda, ringkasan diskusi, keputusan resmi, dan kesimpulan.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setMode('preview')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-50 text-amber-800 font-semibold text-[12px] transition-colors cursor-pointer shadow-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Lihat Preview</span>
          </button>
        </div>

        <MeetingMinutesEditor
          meetingId={meetingId}
          initialMinutes={minutes}
          onSaved={(savedData) => {
            setMinutes(savedData);
          }}
          onPreviewClick={() => setMode('preview')}
        />
      </div>
    );
  }

  // MODE 3 — PREVIEW STATE (READ-ONLY)
  return (
    <div className="space-y-4">
      {/* Header Preview Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white rounded-xl border border-amber-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h3 className="font-bold text-[16px] text-slate-900">
              Dokumen Notulen Resmi (Mode Preview)
            </h3>
          </div>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Tampilan risalah rapat resmi dalam format baca, bebas dari kontrol pengeditan.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMode('edit')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[12px] transition-all shadow-sm cursor-pointer shrink-0"
        >
          <FileEdit className="w-3.5 h-3.5" />
          <span>Edit Notulen</span>
        </button>
      </div>

      <MeetingMinutesPreview
        agenda={minutes?.agenda}
        discussion={minutes?.discussion}
        decisions={minutes?.decisions}
        conclusion={minutes?.conclusion}
        updatedAt={minutes?.updatedAt}
      />
    </div>
  );
}
