'use client';

import React, { useState } from 'react';
import {
  FileText,
  Download,
  FileEdit,
  ExternalLink,
  Eye,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { JSONContent } from '@tiptap/react';
import {
  parseRichText,
  ParsedBlock,
  TextSegment,
} from '@/lib/pdf/tiptap-parser';
import {
  formatIndonesianDate,
  normalizeTime,
  extractPlainText,
  resolveMeetingSignerInfo,
  resolveNotaDinasData,
  DEFAULT_DISCUSSION_FALLBACK,
  DEFAULT_CONCLUSION_FALLBACK,
  DEFAULT_ACTION_ITEM_FALLBACK,
} from '@/lib/pdf/pdf-utils';

interface MeetingMinutesPreviewProps {
  agenda?: JSONContent | null;
  discussion?: JSONContent | null;
  decisions?: JSONContent | null;
  conclusion?: JSONContent | null;
  updatedAt?: string | Date;
  meeting?: any;
  documentType?: 'NOTULA' | 'NOTA_DINAS';
  onDocumentTypeChange?: (type: 'NOTULA' | 'NOTA_DINAS') => void;
  onDownloadPdf?: (type?: 'notula' | 'nota-dinas') => void;
  onEditClick?: () => void;
  canEdit?: boolean;
}

/**
 * Render inline formatting segments (Bold, Italic, Underline)
 */
function renderSegments(segments: TextSegment[]) {
  return segments.map((seg, i) => {
    let node: React.ReactNode = seg.text;
    if (seg.bold) node = <strong key={`b-${i}`}>{node}</strong>;
    if (seg.italic) node = <em key={`i-${i}`}>{node}</em>;
    if (seg.underline) node = <u key={`u-${i}`}>{node}</u>;
    return <React.Fragment key={i}>{node}</React.Fragment>;
  });
}

/**
 * Render a parsed rich text block exactly matching PDF layout
 */
function renderBlock(block: ParsedBlock, idx: number, customPrefix?: string) {
  if (block.type === 'heading') {
    return (
      <div key={idx} className="font-bold text-black mt-2 mb-1">
        {renderSegments(block.segments)}
      </div>
    );
  }

  if (block.type === 'bullet') {
    return (
      <div key={idx} className="flex items-start gap-2 text-black pl-3 text-justify leading-relaxed mb-1.5">
        <span className="shrink-0 leading-relaxed">•</span>
        <div>{renderSegments(block.segments)}</div>
      </div>
    );
  }

  // Ordered or Paragraph
  const prefix = customPrefix || (block.type === 'ordered' ? `${block.number}. ` : '');

  return (
    <div key={idx} className="text-black text-justify leading-relaxed mb-1.5">
      {prefix && <span className="font-normal mr-1">{prefix}</span>}
      {renderSegments(block.segments)}
    </div>
  );
}

export function MeetingMinutesPreview({
  agenda,
  discussion,
  decisions,
  conclusion,
  updatedAt,
  meeting,
  documentType: propDocType,
  onDocumentTypeChange,
  onDownloadPdf,
  onEditClick,
  canEdit = false,
}: MeetingMinutesPreviewProps) {
  const [viewMode, setViewMode] = useState<'paper' | 'raw_pdf'>('paper');
  const [iframeKey, setIframeKey] = useState(0);

  const initialDocType: 'NOTULA' | 'NOTA_DINAS' =
    propDocType || (conclusion as any)?.docType || 'NOTULA';
  const [docType, setDocType] = useState<'NOTULA' | 'NOTA_DINAS'>(initialDocType);

  React.useEffect(() => {
    if (propDocType) {
      setDocType(propDocType);
    }
  }, [propDocType]);

  const handleDocTypeToggle = (type: 'NOTULA' | 'NOTA_DINAS') => {
    setDocType(type);
    if (onDocumentTypeChange) {
      onDocumentTypeChange(type);
    }
  };

  const meetingId = meeting?.id;
  const meetingNumber =
    (conclusion as any)?.documentNumber ||
    (decisions as any)?.documentNumber ||
    meeting?.meetingNumber ||
    meeting?.code ||
    'KEK/ND/2026';
  const meetingTitle = meeting?.title || '-';
  const meetingDate = formatIndonesianDate(meeting?.date);
  const meetingTime = normalizeTime(meeting?.startTime, meeting?.endTime);

  // Signer & Chairperson resolution (matches lib/pdf/meeting-pdf-generator.ts exactly)
  const {
    chairpersonName,
    finalSignerName,
    finalSignerRole,
    secretaryMetaText,
    signatureImage,
  } = resolveMeetingSignerInfo(meeting, { agenda, discussion, decisions, conclusion });

  // Nota Dinas data resolution
  const notaData = resolveNotaDinasData(meeting, { agenda, discussion, decisions, conclusion });

  // Agenda text resolution
  const agendaRaw = extractPlainText(agenda);
  const agendaText =
    agendaRaw.trim() ||
    `1. ${meetingTitle || 'Pembahasan Koordinasi dan Pelaksanaan Tugas'}`;
  const agendaLines = agendaText.split('\n').filter(Boolean);

  // Nomor Surat Undangan dinamis / '-' jika rapat tanpa surat undangan
  const rawInvitationNumber =
    (conclusion as any)?.invitationNumber ||
    (decisions as any)?.invitationNumber ||
    (conclusion as any)?.nomorSuratUndangan ||
    (decisions as any)?.nomorSuratUndangan ||
    (meeting?.meetingNumber && (meeting.meetingNumber.toUpperCase().startsWith('UND') || meeting.meetingNumber.includes('/'))
      ? meeting.meetingNumber
      : '');
  const invitationNumberDisplay =
    rawInvitationNumber && rawInvitationNumber.trim() !== '' && rawInvitationNumber.trim() !== '-'
      ? rawInvitationNumber.trim()
      : '-';

  // Participants resolution
  const participants = meeting?.participants || [];

  // Parse rich text blocks
  const discussionBlocks = parseRichText(discussion);
  const conclusionBlocks = parseRichText(conclusion);
  const decisionsBlocks = parseRichText(decisions);

  // Action items resolution (Exact PDF priority: actionItems > decisionsBlocks > fallback)
  const actionItems: any[] = Array.isArray(meeting?.actionItems) ? meeting.actionItems : [];

  // PDF direct stream URL
  const pdfUrl = meetingId
    ? `/api/meetings/${meetingId}/pdf?type=${docType === 'NOTA_DINAS' ? 'nota-dinas' : 'notula'}&inline=true`
    : '';

  return (
    <div className="space-y-4">
      {/* Top Controls Toolbar */}
      <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#F0F9FA] border border-[#BCE3EB] flex items-center justify-center text-[#31889C] shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-[14px] text-slate-900">
                Pratinjau {docType === 'NOTA_DINAS' ? 'Nota Dinas Resmi' : 'Lembar Notula Resmi'}
              </h4>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#ECF8E9] text-[#4D8F3D] border border-[#D2EFCA]">
                <CheckCircle2 className="w-3 h-3" />
                Sesuai Format PDF
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Format tata naskah dinas Sekretariat Jenderal Dewan KEK RI — identik dengan hasil unduhan PDF.
            </p>
          </div>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Document Type Toggle (Notula vs Nota Dinas) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[12px] font-medium">
            <button
              type="button"
              onClick={() => handleDocTypeToggle('NOTULA')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                docType === 'NOTULA'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Lihat format Notula / Risalah Rapat"
            >
              <FileText className="w-3.5 h-3.5 text-[#31889C]" />
              <span>Risalah Rapat</span>
            </button>
            <button
              type="button"
              onClick={() => handleDocTypeToggle('NOTA_DINAS')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                docType === 'NOTA_DINAS'
                  ? 'bg-[#31889C] text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Lihat format Nota Dinas resmi"
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>Nota Dinas</span>
            </button>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[12px] font-medium">
            <button
              type="button"
              onClick={() => setViewMode('paper')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'paper'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-[#31889C]" />
              <span>Lembar (A4)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('raw_pdf')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'raw_pdf'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-[#31889C]" />
              <span>PDF Langsung</span>
            </button>
          </div>

          {/* Action buttons */}
          {onDownloadPdf && (
            <button
              type="button"
              onClick={() => onDownloadPdf(docType === 'NOTA_DINAS' ? 'nota-dinas' : 'notula')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#31889C] hover:bg-[#266F80] text-white font-semibold text-[12px] transition-colors shadow-xs cursor-pointer"
              title={`Unduh dokumen ${docType === 'NOTA_DINAS' ? 'Nota Dinas' : 'Notula'} dalam format PDF`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh {docType === 'NOTA_DINAS' ? 'Nota Dinas' : 'PDF'}</span>
            </button>
          )}

          {canEdit && onEditClick && (
            <button
              type="button"
              onClick={onEditClick}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#BCE3EB] bg-[#F0F9FA] hover:bg-[#E8F5F7] text-[#215865] font-semibold text-[12px] transition-colors cursor-pointer"
              title={`Edit isi ${docType === 'NOTA_DINAS' ? 'nota dinas' : 'notula'}`}
            >
              <FileEdit className="w-3.5 h-3.5 text-[#31889C]" />
              <span>Edit {docType === 'NOTA_DINAS' ? 'Nota Dinas' : 'Notula'}</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW MODE 1: LEMBAR DOKUMEN (A4 REALISTIC REPLICA) */}
      {viewMode === 'paper' && (
        <div className="bg-slate-100/70 p-3 sm:p-6 rounded-2xl border border-slate-200">
          {docType === 'NOTA_DINAS' ? (
            /* NOTA DINAS PAPER LAYOUT (1:1 Sesuai Standar Resmi Dewan Nasional KEK RI) */
            <div
              id="notadinas-printable-paper"
              className="bg-white max-w-[850px] mx-auto p-8 sm:p-14 text-black font-['Arial',sans-serif] text-[11pt] shadow-xl ring-1 ring-slate-900/5 transition-all print:p-0 print:shadow-none print:ring-0 print:max-w-none"
              style={{
                fontFamily: 'Arial, Helvetica, sans-serif',
                fontSize: '11pt',
                lineHeight: 1.45,
              }}
            >
              {/* 1. KOP RESMI NOTA DINAS (3 Baris Tengah + Garis Tebal) */}
              <div className="pb-1 text-center">
                <div className="font-bold text-[11pt] sm:text-[12pt] text-black tracking-normal leading-tight">
                  DEWAN NASIONAL KAWASAN EKONOMI KHUSUS
                </div>
                <div className="font-bold text-[11pt] sm:text-[12pt] text-black tracking-normal leading-tight mt-0.5">
                  SEKRETARIAT JENDERAL
                </div>
                <div className="font-bold text-[11pt] sm:text-[12pt] text-black tracking-normal leading-tight mt-0.5 uppercase">
                  {notaData.biroName}
                </div>
                <div className="w-full h-[1.75px] bg-black mt-3 mb-4"></div>
              </div>

              {/* 2. JUDUL DOKUMEN: NOTA DINAS & NOMOR */}
              <div className="text-center mb-5">
                <div className="font-bold text-[11pt] text-black tracking-wider">
                  NOTA DINAS
                </div>
                <div className="text-[11pt] text-black mt-0.5">
                  NOMOR: {notaData.documentNumber}
                </div>
              </div>

              {/* 3. TABEL INFORMASI KEPALA NASKAH */}
              <div className="space-y-1 text-[11pt] mb-5">
                <div className="grid grid-cols-[85px_16px_1fr] items-start">
                  <span className="text-black">Yth.</span>
                  <span className="text-black">:</span>
                  <span className="text-black leading-relaxed">{notaData.recipient}</span>
                </div>
                <div className="grid grid-cols-[85px_16px_1fr] items-start">
                  <span className="text-black">Dari</span>
                  <span className="text-black">:</span>
                  <span className="text-black leading-relaxed">{notaData.sender}</span>
                </div>
                <div className="grid grid-cols-[85px_16px_1fr] items-start">
                  <span className="text-black">Hal</span>
                  <span className="text-black">:</span>
                  <span className="text-black leading-relaxed">{notaData.subject}</span>
                </div>
                <div className="grid grid-cols-[85px_16px_1fr] items-start">
                  <span className="text-black">Tanggal</span>
                  <span className="text-black">:</span>
                  <span className="text-black">{notaData.dateText}</span>
                </div>
                <div className="grid grid-cols-[85px_16px_1fr] items-start">
                  <span className="text-black">Lampiran</span>
                  <span className="text-black">:</span>
                  <span className="text-black">{notaData.attachments}</span>
                </div>
              </div>

              {/* 4. KALIMAT PENGANTAR / PEMBUKA */}
              {notaData.introText && (
                <div className="text-justify text-black leading-relaxed indent-8 mb-4">
                  {notaData.introText}
                </div>
              )}

              {/* 5. POKOK-POKOK PEMBAHASAN */}
              <div className="space-y-1.5 mb-4 text-justify">
                {discussionBlocks.length === 0 ? (
                  <div className="leading-relaxed text-black">
                    1. {DEFAULT_DISCUSSION_FALLBACK}
                  </div>
                ) : (
                  discussionBlocks.map((b, idx) => {
                    let prefix: string | undefined;
                    if (b.type === 'ordered') {
                      prefix = `${b.number}. `;
                    } else if (b.type === 'paragraph') {
                      const raw = b.segments.map((s) => s.text).join('').trim();
                      if (!/^\d+[\.\)]/i.test(raw) && !/^[a-z][\.\)]/i.test(raw)) {
                        prefix = `${idx + 1}. `;
                      }
                    }
                    return renderBlock(b, idx, prefix);
                  })
                )}
              </div>

              {/* 6. KESIMPULAN (SEKSI 4) */}
              <div className="mb-4">
                <div className="font-bold text-black mb-1">
                  4. Kesimpulan
                </div>
                <div className="text-justify leading-relaxed text-black">
                  {conclusionBlocks.length === 0 ? (
                    <p>{DEFAULT_CONCLUSION_FALLBACK}</p>
                  ) : (
                    conclusionBlocks.map((b, idx) => renderBlock(b, idx))
                  )}
                </div>
              </div>

              {/* 7. TINDAK LANJUT (SEKSI 5) */}
              <div className="mb-8">
                <div className="font-bold text-black mb-1">
                  5. Tindak Lanjut
                </div>
                <div className="text-justify leading-relaxed text-black">
                  {decisionsBlocks.length > 0 ? (
                    decisionsBlocks.map((b, idx) => renderBlock(b, idx))
                  ) : actionItems.length > 0 ? (
                    actionItems.map((ai: any, idx: number) => {
                      const letter = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'][idx % 8];
                      const pic = ai.picBiro?.shortName || ai.picUser?.name || 'Tim Kerja';
                      return (
                        <div key={ai.id || idx} className="pl-4 mb-1">
                          <span className="font-medium mr-1">{letter}.</span>
                          <span>{ai.title} (PIC: {pic})</span>
                        </div>
                      );
                    })
                  ) : (
                    <p>{DEFAULT_ACTION_ITEM_FALLBACK}</p>
                  )}
                </div>
              </div>

              {/* 8. TANDA TANGAN PENGIRIM (KANAN BAWAH) */}
              <div className="pt-4 flex justify-end text-[11pt]">
                <div className="w-[260px] space-y-0.5 text-left text-black">
                  <p className="leading-tight whitespace-pre-line">
                    {notaData.signerRole.endsWith(',') ? notaData.signerRole : `${notaData.signerRole},`}
                  </p>

                  {(notaData.signatureImage || signatureImage) ? (
                    <div className="py-1">
                      <img
                        src={notaData.signatureImage || signatureImage}
                        alt="Tanda Tangan Pengirim"
                        className="max-h-20 max-w-[180px] object-contain drop-shadow-2xs"
                      />
                    </div>
                  ) : (
                    <div className="h-16 flex items-center text-slate-400 text-[10pt] italic">
                      {'${ttd_pengirim}'}
                    </div>
                  )}

                  <p className="font-normal leading-tight">
                    {notaData.signerName}
                  </p>
                </div>
              </div>

              {/* Footer update stamp */}
              {updatedAt && (
                <div className="text-right text-[10px] text-slate-400 pt-6 mt-8 border-t border-slate-200 print:hidden">
                  Pembaruan terakhir: {new Date(updatedAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })} WIB
                </div>
              )}
            </div>
          ) : (
            <div
              id="notula-printable-paper"
              className="bg-white max-w-[850px] mx-auto p-8 sm:p-14 text-black font-['Arial',sans-serif] text-[11pt] shadow-xl ring-1 ring-slate-900/5 transition-all print:p-0 print:shadow-none print:ring-0 print:max-w-none"
              style={{
                fontFamily: 'Arial, Helvetica, sans-serif',
                fontSize: '11pt',
                lineHeight: 1.45,
              }}
            >
            {/* 1. KOP SURAT RESMI */}
            <div className="pb-1">
              {/* Header Row: Logo di Kiri, Teks di Tengah, Spacer di Kanan */}
              <div
                className="w-full"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '72px 1fr 72px',
                  alignItems: 'center',
                }}
              >
                {/* Logo Dewan KEK di Kiri */}
                <div className="flex items-center justify-start">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/lambang-kek.png"
                    alt="Lambang Dewan Nasional KEK"
                    className="w-[64px] h-[64px] sm:w-[68px] sm:h-[68px] object-contain drop-shadow-2xs"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/logo-kek.png';
                    }}
                  />
                </div>

                {/* Teks Kop Rata Tengah: Tahoma-Bold 12pt & Tahoma 8pt */}
                <div
                  className="text-center px-1"
                  style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}
                >
                  <div className="font-bold text-[11pt] sm:text-[12pt] text-black leading-tight tracking-normal whitespace-nowrap">
                    DEWAN NASIONAL KAWASAN EKONOMI KHUSUS
                  </div>
                  <div className="font-bold text-[11pt] sm:text-[12pt] text-black leading-tight tracking-normal mt-0.5 whitespace-nowrap">
                    SEKRETARIAT JENDERAL
                  </div>
                  <div className="text-[7.5pt] sm:text-[8pt] text-black mt-1 leading-snug">
                    Gedung MNC Tower Lantai 3, Jl. Kebon Sirih No.17 – 19, Jakarta Pusat 10340
                  </div>
                  <div className="text-[7.5pt] sm:text-[8pt] text-black leading-snug">
                    Telp: (021) 3912491, email:{' '}
                    <span className="text-blue-700 underline">info@kek.go.id</span>
                  </div>
                </div>

                {/* Penyeimbang Kolom Kanan agar Teks Pas di Tengah Kertas */}
                <div className="w-[72px]" aria-hidden="true" />
              </div>

              {/* Garis Pemisah Tunggal 1.5pt */}
              <div className="w-full h-[1.5px] bg-black mt-2.5 mb-4"></div>
            </div>

            {/* 2. JUDUL DOKUMEN: NOTULA & NOMOR */}
            <div className="text-center pt-1 mb-5">
              <div className="font-bold text-[11pt] tracking-widest text-black">
                NOTULA
              </div>
              <div className="text-[11pt] text-black mt-0.5">
                NOMOR: {meetingNumber}
              </div>
            </div>

            {/* 3. IDENTITAS & METADATA RAPAT */}
            <div className="space-y-1.5 text-[11pt] mb-5">
              {/* Judul Rapat */}
              <div className="grid grid-cols-[165px_16px_1fr] sm:grid-cols-[185px_20px_1fr] items-start">
                <span className="text-black">Judul Rapat</span>
                <span className="text-black">:</span>
                <span className="text-black leading-relaxed">{meetingTitle}</span>
              </div>

              {/* Hari/Tanggal */}
              <div className="grid grid-cols-[165px_16px_1fr] sm:grid-cols-[185px_20px_1fr] items-start">
                <span className="text-black">Hari/Tanggal</span>
                <span className="text-black">:</span>
                <span className="text-black">{meetingDate}</span>
              </div>

              {/* Nomor Surat Undangan */}
              <div className="grid grid-cols-[165px_16px_1fr] sm:grid-cols-[185px_20px_1fr] items-start">
                <span className="text-black whitespace-nowrap">Nomor Surat Undangan</span>
                <span className="text-black">:</span>
                <span className="text-black font-normal">{invitationNumberDisplay}</span>
              </div>

              {/* Pukul */}
              <div className="grid grid-cols-[165px_16px_1fr] sm:grid-cols-[185px_20px_1fr] items-start">
                <span className="text-black">Pukul</span>
                <span className="text-black">:</span>
                <span className="text-black">{meetingTime}</span>
              </div>

              {/* Agenda */}
              <div className="grid grid-cols-[165px_16px_1fr] sm:grid-cols-[185px_20px_1fr] items-start">
                <span className="text-black">Agenda</span>
                <span className="text-black">:</span>
                <div className="text-black space-y-0.5">
                  {agendaLines.map((line, idx) => (
                    <div key={idx} className="leading-relaxed">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. PELAKSANA RAPAT & PESERTA */}
            <div className="text-[11pt] mb-5">
              <div className="font-bold text-black mb-1.5">
                Pelaksana Rapat:
              </div>

              <div className="space-y-1.5">
                {/* Ketua/Pimpinan Rapat */}
                <div className="grid grid-cols-[165px_16px_1fr] sm:grid-cols-[185px_20px_1fr] items-start">
                  <span className="text-black">Ketua/Pimpinan Rapat</span>
                  <span className="text-black">:</span>
                  <span className="text-black leading-relaxed">{chairpersonName}</span>
                </div>

                {/* Pencatat */}
                <div className="grid grid-cols-[165px_16px_1fr] sm:grid-cols-[185px_20px_1fr] items-start">
                  <span className="text-black">Pencatat</span>
                  <span className="text-black">:</span>
                  <span className="text-black leading-relaxed">{secretaryMetaText}</span>
                </div>

                {/* Peserta Rapat */}
                <div className="grid grid-cols-[165px_16px_1fr] sm:grid-cols-[185px_20px_1fr] items-start">
                  <span className="text-black">Peserta Rapat</span>
                  <span className="text-black">:</span>
                  <div className="text-black space-y-1">
                    {participants.length === 0 ? (
                      <div className="text-black">
                        1 &nbsp;Belum terdapat data peserta yang tercatat.
                      </div>
                    ) : (
                      participants.map((p: any, idx: number) => {
                        const name = p.user?.name || p.name || (typeof p === 'string' ? p : 'Peserta');
                        return (
                          <div key={idx} className="flex gap-2 leading-snug">
                            <span className="w-5 text-right shrink-0">{idx + 1}</span>
                            <span>{name}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 5. SUBSTANSI INTI PEMBAHASAN RAPAT */}
            <div className="text-[11pt] mb-5">
              <div className="grid grid-cols-[165px_16px_1fr] sm:grid-cols-[185px_20px_1fr] items-start font-bold text-black mb-1">
                <div className="leading-tight">
                  <div>Substansi Inti</div>
                  <div>Pembahasan Rapat</div>
                </div>
                <div>:</div>
                <div></div>
              </div>

              <div className="pt-1">
                {discussionBlocks.length === 0 ? (
                  <p className="text-justify leading-relaxed text-black">
                    {DEFAULT_DISCUSSION_FALLBACK}
                  </p>
                ) : (
                  discussionBlocks.map((b, idx) => renderBlock(b, idx))
                )}
              </div>
            </div>

            {/* 6. KESIMPULAN */}
            <div className="text-[11pt] mb-5">
              <div className="font-bold text-black mb-1">
                Kesimpulan
              </div>

              <div>
                {conclusionBlocks.length === 0 ? (
                  <p className="text-justify leading-relaxed text-black">
                    {DEFAULT_CONCLUSION_FALLBACK}
                  </p>
                ) : (
                  conclusionBlocks.map((b, idx) => {
                    const itemNum = b.type === 'ordered' && b.number ? b.number : idx + 1;
                    const prefix = b.type === 'ordered' || b.type === 'paragraph' ? `${itemNum}. ` : undefined;
                    return renderBlock(b, idx, prefix);
                  })
                )}
              </div>
            </div>

            {/* 7. TINDAK LANJUT */}
            <div className="text-[11pt] mb-8">
              <div className="font-bold text-black mb-1">
                Tindak Lanjut
              </div>

              <div>
                {actionItems.length > 0 ? (
                  actionItems.map((ai: any, idx: number) => {
                    const desc = ai.description ? ` ${ai.description}` : '';
                    return (
                      <div key={ai.id || idx} className="text-justify leading-relaxed text-black mb-1.5">
                        <span className="mr-1">{idx + 1}.</span>
                        <span>{ai.title}{desc}</span>
                      </div>
                    );
                  })
                ) : decisionsBlocks.length > 0 ? (
                  decisionsBlocks.map((b, idx) => {
                    const itemNum = b.type === 'ordered' && b.number ? b.number : idx + 1;
                    const prefix = b.type === 'ordered' || b.type === 'paragraph' ? `${itemNum}. ` : undefined;
                    return renderBlock(b, idx, prefix);
                  })
                ) : (
                  <p className="text-justify leading-relaxed text-black">
                    {DEFAULT_ACTION_ITEM_FALLBACK}
                  </p>
                )}
              </div>
            </div>

            {/* 8. TANDA TANGAN (SIGNATURE BLOCK) */}
            <div className="pt-4 flex justify-end text-[11pt]">
              <div className="w-64 space-y-0.5 text-left text-black">
                <p>Notulis,</p>
                <p className="leading-tight whitespace-pre-line">
                  {finalSignerRole.endsWith(',') ? finalSignerRole : `${finalSignerRole},`}
                </p>

                {/* Ruang tanda tangan: gambar jika ada, atau ruang kosong jika belum ada */}
                {signatureImage ? (
                  <div className="py-1">
                    <img
                      src={signatureImage}
                      alt={`Tanda Tangan ${finalSignerName}`}
                      className="max-h-20 max-w-[180px] object-contain drop-shadow-2xs"
                    />
                  </div>
                ) : (
                  <div className="h-20" />
                )}

                <p className="font-normal leading-tight">
                  {finalSignerName}
                </p>
              </div>
            </div>

            {/* Footer update stamp */}
            {updatedAt && (
              <div className="text-right text-[10px] text-slate-400 pt-6 mt-8 border-t border-slate-200 print:hidden">
                Pembaruan terakhir: {new Date(updatedAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })} WIB
              </div>
            )}
          </div>
        )}
      </div>
    )}

      {/* VIEW MODE 2: DOKUMEN PDF LANGSUNG (LIVE STREAM) */}
      {viewMode === 'raw_pdf' && (
        <div className="bg-white rounded-2xl border border-slate-300 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[13px] font-bold text-slate-900">
                Aliran Berkas Dokumen PDF Asli (Live Engine PDFKit)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIframeKey((k) => k + 1)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-semibold cursor-pointer"
                title="Muat ulang dokumen PDF"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Muat Ulang</span>
              </button>

              {pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold cursor-pointer"
                  title="Buka PDF di tab peramban baru"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Tab Baru</span>
                </a>
              )}
            </div>
          </div>

          {pdfUrl ? (
            <div className="relative w-full h-[800px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <iframe
                key={iframeKey}
                src={`${pdfUrl}#toolbar=1&navpanes=0`}
                className="w-full h-full border-0"
                title="Pratinjau PDF Asli"
              />
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              ID Rapat tidak tersedia untuk memuat aliran PDF.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
