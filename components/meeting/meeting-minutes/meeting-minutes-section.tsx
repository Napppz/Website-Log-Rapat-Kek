'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { MeetingMinutesEditor } from './meeting-minutes-editor';
import { MeetingMinutesPreview } from './meeting-minutes-preview';
import { getMeetingMinutesAction } from '@/app/actions/minute-actions';
import { getMeetingDetailAction } from '@/app/actions/meeting-actions';
import { FileEdit, Eye, FileText, Loader2, Info } from 'lucide-react';
import { toast } from '@/components/providers/toast-provider';

interface MeetingMinutesSectionProps {
  meetingId: string;
  meeting?: any;
  initialMinutes?: any;
  defaultMode?: 'preview' | 'edit';
}

export function MeetingMinutesSection({
  meetingId,
  meeting: propMeeting,
  initialMinutes: propMinutes,
  defaultMode = 'preview',
}: MeetingMinutesSectionProps) {
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'VIEWER';
  const canEditMinutes = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'NOTULIS';

  const [currentMeeting, setCurrentMeeting] = useState<any>(propMeeting || null);
  const [minutes, setMinutes] = useState<any>(propMinutes || propMeeting?.minutes || null);
  const [isLoading, setIsLoading] = useState(!propMinutes && !propMeeting);
  const [mode, setMode] = useState<'edit' | 'preview'>(defaultMode);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const initialDocType: 'NOTULA' | 'NOTA_DINAS' =
    (minutes?.conclusion as any)?.docType ||
    (minutes?.decisions as any)?.docType ||
    'NOTULA';
  const [docType, setDocType] = useState<'NOTULA' | 'NOTA_DINAS'>(initialDocType);

  useEffect(() => {
    const concl = minutes?.conclusion as any;
    if (concl?.docType) {
      setDocType(concl.docType);
    }
  }, [minutes]);

  // Check if current meeting object contains full relational records
  const isMeetingComplete = useCallback((m: any) => {
    return (
      m &&
      Array.isArray(m.participants) &&
      Array.isArray(m.actionItems) &&
      (m.chairperson !== undefined || m.secretary !== undefined)
    );
  }, []);

  // Load complete meeting details & minutes from database
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setIsLoading(true);

        const needMeetingFetch = !isMeetingComplete(propMeeting);
        const needMinutesFetch = !propMinutes && !propMeeting?.minutes;

        if (needMeetingFetch) {
          const detailRes = await getMeetingDetailAction(meetingId);
          if (isMounted && detailRes.success && detailRes.data) {
            setCurrentMeeting(detailRes.data);
            if (detailRes.data.minutes) {
              setMinutes(detailRes.data.minutes);
              const concl = detailRes.data.minutes.conclusion as any;
              if (concl?.docType) {
                setDocType(concl.docType);
              }
            }
          }
        } else {
          setCurrentMeeting(propMeeting);
        }

        if (needMinutesFetch && (!propMeeting?.minutes || needMeetingFetch)) {
          const minRes = await getMeetingMinutesAction(meetingId);
          if (isMounted && minRes.success && minRes.data) {
            setMinutes(minRes.data);
            const concl = minRes.data.conclusion as any;
            if (concl?.docType) {
              setDocType(concl.docType);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load complete meeting data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [meetingId, propMeeting, propMinutes, isMeetingComplete]);

  // Handler Download PDF (Mendukung Notula & Nota Dinas)
  const handleDownloadPdf = async (type?: 'notula' | 'nota-dinas') => {
    const targetType = type || (docType === 'NOTA_DINAS' ? 'nota-dinas' : 'notula');
    try {
      setIsDownloadingPdf(true);
      const res = await fetch(`/api/meetings/${meetingId}/pdf?type=${targetType}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `Gagal mengunduh dokumen ${targetType === 'nota-dinas' ? 'Nota Dinas' : 'Notula'} PDF.`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const code = currentMeeting?.meetingNumber || currentMeeting?.code || meetingId;
      const cleanCode = code.replace(/[^a-zA-Z0-9_-]/g, '_');
      link.download = targetType === 'nota-dinas'
        ? `Nota-Dinas-${cleanCode}.pdf`
        : `Risalah-Rapat-${cleanCode}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(
        targetType === 'nota-dinas'
          ? 'Nota Dinas resmi berhasil diunduh (PDF).'
          : 'Risalah Rapat resmi berhasil diunduh (PDF).'
      );
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan saat mengunduh PDF.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Loading state
  if (isLoading && !currentMeeting) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#31889C] animate-spin mb-3" />
        <p className="text-[14px] font-semibold text-slate-800">Menyiapkan Lembar Naskah Rapat...</p>
        <p className="text-[12px] text-slate-500 mt-1">
          Menyusun format resmi Notula / Nota Dinas dan butir pembahasan dari basis data
        </p>
      </div>
    );
  }

  const hasCustomMinutes = Boolean(
    minutes?.agenda || minutes?.discussion || minutes?.decisions || minutes?.conclusion
  );

  // MODE 1 — EDIT STATE (EDITOR FORM)
  if (mode === 'edit' && canEditMinutes) {
    return (
      <div className="space-y-4">
        <MeetingMinutesEditor
          meetingId={meetingId}
          meeting={currentMeeting}
          initialMinutes={minutes}
          defaultDocType={docType}
          onSaved={(savedData) => {
            setMinutes(savedData);
            if (savedData.conclusion?.docType) {
              setDocType(savedData.conclusion.docType);
            }
            if (currentMeeting) {
              setCurrentMeeting({ ...currentMeeting, minutes: savedData });
            }
          }}
          onPreviewClick={() => setMode('preview')}
        />
      </div>
    );
  }

  // MODE 2 — PREVIEW STATE (EXACT OFFICIAL A4 & PDF STREAM)
  return (
    <div className="space-y-3">
      {/* Notice if minutes is standard draft vs customized */}
      {!hasCustomMinutes && (
        <div className="p-3 bg-[#E8F5F7] rounded-xl border border-[#BCE3EB] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[12px]">
          <div className="flex items-center gap-2 text-[#215865]">
            <Info className="w-4 h-4 text-[#31889C] shrink-0" />
            <span>
              <strong>Draf Standar Naskah Dinas:</strong> Belum ada catatan khusus yang disimpan. Anda dapat memilih pratinjau antara <strong>Risalah Rapat</strong> atau <strong>Nota Dinas</strong> resmi, atau klik tombol tulis untuk mengisi catatan rapat.
            </span>
          </div>
          {canEditMinutes && (
            <button
              type="button"
              onClick={() => setMode('edit')}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#31889C] hover:bg-[#266F80] text-white font-semibold text-[11px] shrink-0 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <FileEdit className="w-3 h-3" />
              <span>Tulis Notula / Nota Dinas</span>
            </button>
          )}
        </div>
      )}

      {/* 1:1 Authentic Meeting Minutes Preview Component */}
      <MeetingMinutesPreview
        agenda={minutes?.agenda}
        discussion={minutes?.discussion}
        decisions={minutes?.decisions}
        conclusion={minutes?.conclusion}
        updatedAt={minutes?.updatedAt}
        meeting={currentMeeting}
        documentType={docType}
        onDocumentTypeChange={(type) => setDocType(type)}
        onDownloadPdf={handleDownloadPdf}
        onEditClick={canEditMinutes ? () => setMode('edit') : undefined}
        canEdit={canEditMinutes}
      />
    </div>
  );
}
