'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TiptapEditor } from './tiptap-editor';
import { JSONContent } from '@tiptap/react';
import { upsertMeetingMinutesAction } from '@/app/actions/minute-actions';
import {
  Save,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  ListChecks,
  MessageSquare,
  Award,
  CheckCircle,
  FileCheck,
} from 'lucide-react';

interface MeetingMinutesEditorProps {
  meetingId: string;
  initialMinutes?: {
    agenda?: JSONContent | null;
    discussion?: JSONContent | null;
    decisions?: JSONContent | null;
    conclusion?: JSONContent | null;
  } | null;
  onSaved?: (savedData: any) => void;
  onPreviewClick?: () => void;
}

export function MeetingMinutesEditor({
  meetingId,
  initialMinutes,
  onSaved,
  onPreviewClick,
}: MeetingMinutesEditorProps) {
  const [agenda, setAgenda] = useState<JSONContent | null>(initialMinutes?.agenda || null);
  const [discussion, setDiscussion] = useState<JSONContent | null>(initialMinutes?.discussion || null);
  const [decisions, setDecisions] = useState<JSONContent | null>(initialMinutes?.decisions || null);
  const [conclusion, setConclusion] = useState<JSONContent | null>(initialMinutes?.conclusion || null);

  const [activeTab, setActiveTab] = useState<'all' | 'agenda' | 'discussion' | 'decisions' | 'conclusion'>('all');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'idle'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isManualSaving, setIsManualSaving] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasChangesRef = useRef(false);

  // Core save function
  const executeSave = useCallback(
    async (isDraft = false) => {
      setSaveStatus('saving');
      setStatusMessage('Menyimpan...');

      try {
        const payload = {
          meetingId,
          agenda: agenda ?? undefined,
          discussion: discussion ?? undefined,
          decisions: decisions ?? undefined,
          conclusion: conclusion ?? undefined,
        };

        const res = await upsertMeetingMinutesAction(payload);

        if (res.success && res.data) {
          setSaveStatus('saved');
          setStatusMessage(isDraft ? 'Draft tersimpan' : 'Tersimpan');
          hasChangesRef.current = false;
          if (onSaved) onSaved(res.data);
        } else {
          setSaveStatus('error');
          setStatusMessage(res.error || 'Gagal menyimpan');
        }
      } catch (err: any) {
        console.error('Save error:', err);
        setSaveStatus('error');
        setStatusMessage('Gagal menyimpan');
      }
    },
    [meetingId, agenda, discussion, decisions, conclusion, onSaved]
  );

  // Autosave trigger with 2.5s debounce
  useEffect(() => {
    if (!hasChangesRef.current) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setSaveStatus('saving');
    setStatusMessage('Menyimpan perubahan...');

    debounceTimerRef.current = setTimeout(() => {
      executeSave(true);
    }, 2500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [agenda, discussion, decisions, conclusion, executeSave]);

  const handleFieldChange = (setter: React.Dispatch<React.SetStateAction<JSONContent | null>>) => {
    return (json: JSONContent) => {
      setter(json);
      hasChangesRef.current = true;
    };
  };

  const handleManualSave = async (isDraft: boolean) => {
    setIsManualSaving(true);
    await executeSave(isDraft);
    setIsManualSaving(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Action Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white rounded-xl border border-amber-200/80 shadow-xs">
        {/* Left: Section Navigator / View Options */}
        <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
          <span className="font-bold text-slate-700 mr-1 hidden sm:inline">Navigasi Bagian:</span>
          {[
            { id: 'all', label: 'Semua Bagian' },
            { id: 'agenda', label: 'A. Agenda' },
            { id: 'discussion', label: 'B. Pembahasan' },
            { id: 'decisions', label: 'C. Keputusan' },
            { id: 'conclusion', label: 'D. Kesimpulan' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50/70 hover:bg-amber-100 text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right: Autosave Status & Manual Actions */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          {/* Status Indicator */}
          <div className="flex items-center gap-1.5 text-[12px] font-medium">
            {saveStatus === 'saving' && (
              <>
                <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                <span className="text-amber-700">{statusMessage}</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">{statusMessage}</span>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                <span className="text-red-700 font-semibold">{statusMessage}</span>
              </>
            )}
          </div>

          {/* Mode Preview Toggle */}
          {onPreviewClick && (
            <button
              type="button"
              onClick={onPreviewClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50/50 hover:bg-amber-100 text-amber-900 font-semibold text-[12px] transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Lihat Preview</span>
            </button>
          )}

          {/* Simpan Draft */}
          <button
            type="button"
            disabled={isManualSaving}
            onClick={() => handleManualSave(true)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[12px] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            Simpan Draft
          </button>

          {/* Simpan Final */}
          <button
            type="button"
            disabled={isManualSaving}
            onClick={() => handleManualSave(false)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[12px] transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan</span>
          </button>
        </div>
      </div>

      {/* Editor Sections */}
      <div className="space-y-6">
        {/* SECTION A: AGENDA */}
        {(activeTab === 'all' || activeTab === 'agenda') && (
          <div className="bg-white rounded-xl border border-amber-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <ListChecks className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-[14px] text-slate-900 uppercase tracking-wide">
                    A. Agenda &amp; Topik Pembahasan
                  </h4>
                  <p className="text-[11px] text-slate-500">Materi pokok atau urutan pembahasan persidangan</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Wajib Diisi
              </span>
            </div>

            <TiptapEditor
              content={agenda}
              onChange={handleFieldChange(setAgenda)}
              placeholder="Contoh: 1. Pembahasan kesiapan relokasi tenant KEK... 2. Penyesuaian zonasi..."
              minHeight="140px"
            />
          </div>
        )}

        {/* SECTION B: PEMBAHASAN */}
        {(activeTab === 'all' || activeTab === 'discussion') && (
          <div className="bg-white rounded-xl border border-amber-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-[14px] text-slate-900 uppercase tracking-wide">
                    B. Pembahasan &amp; Dinamika Diskusi
                  </h4>
                  <p className="text-[11px] text-slate-500">Uraian substansi dialog, sanggahan, tanggapan teknis biro, dan arahan pengarah</p>
                </div>
              </div>
            </div>

            <TiptapEditor
              content={discussion}
              onChange={handleFieldChange(setDiscussion)}
              placeholder="Tuliskan catatan dinamika pembahasan rapat di sini..."
              minHeight="180px"
            />
          </div>
        )}

        {/* SECTION C: KEPUTUSAN */}
        {(activeTab === 'all' || activeTab === 'decisions') && (
          <div className="bg-white rounded-xl border border-amber-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-[14px] text-slate-900 uppercase tracking-wide">
                    C. Keputusan &amp; Arahan Sidang
                  </h4>
                  <p className="text-[11px] text-slate-500">Poin ketetapan bersama yang disepakati untuk ditindaklanjuti</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Poin Keputusan
              </span>
            </div>

            <TiptapEditor
              content={decisions}
              onChange={handleFieldChange(setDecisions)}
              placeholder="Contoh: 1. Menyetujui usulan penetapan perluasan kawasan... 2. Menugaskan Biro Pengendalian..."
              minHeight="150px"
            />
          </div>
        )}

        {/* SECTION D: KESIMPULAN */}
        {(activeTab === 'all' || activeTab === 'conclusion') && (
          <div className="bg-white rounded-xl border border-amber-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-[14px] text-slate-900 uppercase tracking-wide">
                    D. Kesimpulan &amp; Langkah Lanjutan
                  </h4>
                  <p className="text-[11px] text-slate-500">Rangkuman akhir dan tindak lanjut utama</p>
                </div>
              </div>
            </div>

            <TiptapEditor
              content={conclusion}
              onChange={handleFieldChange(setConclusion)}
              placeholder="Contoh: Rapat koordinasi berjalan lancar dan seluruh pihak sepakat menyelesaikan draf regulasi..."
              minHeight="140px"
            />
          </div>
        )}
      </div>

      {/* Bottom Save Bar */}
      <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 flex items-center justify-between">
        <span className="text-[12px] text-slate-500">
          Setiap perubahan teks otomatis disimpan (Autosave aktif). Klik tombol Simpan untuk kepastian pembaruan data.
        </span>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={isManualSaving}
            onClick={() => handleManualSave(true)}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[13px] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            Simpan Draft
          </button>
          <button
            type="button"
            disabled={isManualSaving}
            onClick={() => handleManualSave(false)}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[13px] transition-all shadow-md shadow-amber-600/20 cursor-pointer disabled:opacity-50"
          >
            <FileCheck className="w-4 h-4" />
            <span>Simpan Notulen</span>
          </button>
        </div>
      </div>
    </div>
  );
}
