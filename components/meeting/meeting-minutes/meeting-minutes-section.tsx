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
            }
          }
        } else {
          setCurrentMeeting(propMeeting);
        }

        if (needMinutesFetch && (!propMeeting?.minutes || needMeetingFetch)) {
          const minRes = await getMeetingMinutesAction(meetingId);
          if (isMounted && minRes.success && minRes.data) {
            setMinutes(minRes.data);
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

  // Handler Download PDF Notula
  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      const res = await fetch(`/api/meetings/${meetingId}/pdf`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || 'Gagal mengunduh dokumen Notula PDF.');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const code = currentMeeting?.meetingNumber || currentMeeting?.code || meetingId;
      link.download = `Risalah-Rapat-${code.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Notula Rapat resmi berhasil diunduh (PDF).');
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan saat mengunduh Notula PDF.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Loading state
  if (isLoading && !currentMeeting) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#31889C] animate-spin mb-3" />
        <p className="text-[14px] font-semibold text-slate-800">Menyiapkan Lembar Notula Rapat...</p>
        <p className="text-[12px] text-slate-500 mt-1">
          Menyusun naskah dinas resmi, daftar peserta, dan butir pembahasan dari basis data
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 bg-[#F0F9FA] rounded-xl border border-[#BCE3EB]">
          <div>
            <h3 className="text-[16px] font-bold text-slate-900 flex items-center gap-2">
              <FileEdit className="w-4 h-4 text-[#31889C]" />
              <span>Penyusunan Notula Rapat (Format Tata Naskah Dinas)</span>
            </h3>
            <p className="text-[12px] text-slate-600 mt-0.5">
              Tuliskan substansi inti pembahasan, kesimpulan, dan tindak lanjut. Hasil ketikan akan langsung tercermin pada lembar naskah dinas dan PDF.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setMode('preview')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#BCE3EB] bg-white hover:bg-[#F0F9FA] text-[#215865] font-semibold text-[12px] transition-colors cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
          >
            <Eye className="w-3.5 h-3.5 text-[#31889C]" />
            <span>Lihat Pratinjau Naskah</span>
          </button>
        </div>

        <MeetingMinutesEditor
          meetingId={meetingId}
          meeting={currentMeeting}
          initialMinutes={minutes}
          onSaved={(savedData) => {
            setMinutes(savedData);
            // Optionally update currentMeeting.minutes as well
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
              <strong>Draf Standar Naskah Dinas:</strong> Belum ada catatan khusus yang disimpan. Lembar pratinjau di bawah menampilkan format lengkap naskah dinas dan peserta persis seperti hasil unduh PDF.
            </span>
          </div>
          {canEditMinutes && (
            <button
              type="button"
              onClick={() => setMode('edit')}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#31889C] hover:bg-[#266F80] text-white font-semibold text-[11px] shrink-0 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <FileEdit className="w-3 h-3" />
              <span>Tulis Notula Khusus</span>
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
        onDownloadPdf={handleDownloadPdf}
        onEditClick={canEditMinutes ? () => setMode('edit') : undefined}
        canEdit={canEditMinutes}
      />
    </div>
  );
}
