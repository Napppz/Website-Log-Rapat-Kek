'use client';

import React from 'react';
import { TiptapEditor } from './tiptap-editor';
import { FileText, Printer, Download } from 'lucide-react';
import { JSONContent } from '@tiptap/react';

interface MeetingMinutesPreviewProps {
  agenda?: JSONContent | null;
  discussion?: JSONContent | null;
  decisions?: JSONContent | null;
  conclusion?: JSONContent | null;
  updatedAt?: string | Date;
  meeting?: {
    id?: string;
    meetingNumber?: string;
    title?: string;
    date?: Date | string;
    startTime?: string;
    endTime?: string;
    chairperson?: { name: string } | null;
    secretary?: { name: string } | null;
    participants?: Array<{ user: { name: string } }>;
  } | null;
  onDownloadPdf?: () => void;
}

function formatIndonesianDate(d: Date | string | undefined): string {
  if (!d) return 'Jumat, 5 September 2026';
  try {
    const obj = typeof d === 'string' ? new Date(d) : d;
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];
    return `${days[obj.getDay()]}, ${obj.getDate()} ${months[obj.getMonth()]} ${obj.getFullYear()}`;
  } catch {
    return String(d);
  }
}

export function MeetingMinutesPreview({
  agenda,
  discussion,
  decisions,
  conclusion,
  updatedAt,
  meeting,
  onDownloadPdf,
}: MeetingMinutesPreviewProps) {
  const isAllEmpty = !agenda && !discussion && !decisions && !conclusion;

  if (isAllEmpty) {
    return (
      <div className="p-10 text-center bg-amber-50/40 rounded-xl border border-dashed border-amber-200">
        <FileText className="w-10 h-10 text-amber-500 mx-auto mb-2 opacity-60" />
        <p className="text-[15px] font-bold text-slate-800">Konten Notula Masih Kosong</p>
        <p className="text-[13px] text-slate-500 mt-1 max-w-md mx-auto">
          Belum ada catatan agenda, substansi inti pembahasan, kesimpulan, atau tindak lanjut yang dituliskan.
        </p>
      </div>
    );
  }

  const meetingNumber = meeting?.meetingNumber || (meeting as any)?.code || 'KEK/ND/2026';
  const meetingTitle = meeting?.title || 'Rapat Koordinasi Dewan Nasional KEK';
  const meetingDate = formatIndonesianDate(meeting?.date);
  const meetingTime =
    meeting?.startTime && meeting?.endTime
      ? `${meeting.startTime.replace(':', '.')} WIB – ${meeting.endTime.replace(':', '.')} WIB`
      : '08.00 WIB - selesai';
  const chairperson =
    (conclusion as any)?.chairpersonName ||
    (decisions as any)?.chairpersonName ||
    (discussion as any)?.chairpersonName ||
    (agenda as any)?.chairpersonName ||
    meeting?.chairperson?.name ||
    'Wakil Ketua II, Tim Pelaksana Dewan Nasional KEK, Budi Santoso';

  const customSignerName =
    (conclusion as any)?.signerName ||
    (decisions as any)?.signerName ||
    (discussion as any)?.signerName ||
    (agenda as any)?.signerName ||
    meeting?.secretary?.name ||
    'Sri Aurelia Rosyana Hari Habyby';

  const customSignerRole =
    (conclusion as any)?.signerRole ||
    (decisions as any)?.signerRole ||
    (discussion as any)?.signerRole ||
    (agenda as any)?.signerRole ||
    'Pranata Hubungan Masyarakat Terampil';

  const secretary = `${customSignerRole}, ${customSignerName}`;
  const participants = meeting?.participants || [];

  return (
    <div className="space-y-4">
      {/* Top Banner with Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900 text-white rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-[14px] text-white">Lembar Naskah Notula Dinas Resmi</h4>
            <p className="text-[12px] text-slate-300">
              Pratinjau tampilan format naskah dinas sesuai tata naskah Sekretariat Jenderal Dewan KEK RI.
            </p>
          </div>
        </div>

        {onDownloadPdf && (
          <button
            type="button"
            onClick={onDownloadPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[13px] transition-all shadow-sm cursor-pointer self-start sm:self-center"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Notula (PDF)</span>
          </button>
        )}
      </div>

      {/* Real A4 Paper Preview Container */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xl max-w-4xl mx-auto p-8 sm:p-14 font-['Arial',sans-serif] text-[11pt] text-slate-900 space-y-6">
        {/* 1. KOP SURAT */}
        <div className="relative pb-2">
          {/* Logo on Left: Vertically centered relative to text block, sitting right above divider line */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/lambang-kek.png"
              alt="Logo Dewan Nasional KEK"
              className="w-20 h-20 sm:w-[94px] sm:h-[94px] object-contain"
              onError={(e) => {
                // Fallback to standard logo if emblem not loaded
                (e.target as HTMLImageElement).src = '/logo-kek.png';
              }}
            />
          </div>

          {/* Centered Kop Text: Tahoma-Bold 12pt & Tahoma 8pt */}
          <div className="text-center px-16 sm:px-24 font-['Tahoma',sans-serif]">
            <h1 className="font-bold text-[12pt] sm:text-[12pt] tracking-wide text-slate-950 leading-tight">
              DEWAN NASIONAL KAWASAN EKONOMI KHUSUS
            </h1>
            <h2 className="font-bold text-[12pt] sm:text-[12pt] tracking-wide text-slate-950 leading-tight">
              SEKRETARIAT JENDERAL
            </h2>
            <p className="text-[8pt] sm:text-[8pt] text-slate-800 mt-1 leading-snug">
              Gedung MNC Tower Lantai 3, Jl. Kebon Sirih No.17 – 19, Jakarta Pusat 10340
            </p>
            <p className="text-[8pt] sm:text-[8pt] text-slate-800 leading-snug">
              Telp: (021) 3912491, email:{' '}
              <span className="text-blue-700 underline">info@kek.go.id</span>
            </p>
          </div>

          {/* Solid Divider Line */}
          <div className="w-full h-[1.8px] bg-slate-950 mt-3.5"></div>
        </div>

        {/* 2. JUDUL DOKUMEN: NOTULA */}
        <div className="text-center space-y-0.5 pt-2">
          <h3 className="font-bold text-[11pt] sm:text-[11pt] tracking-wider text-slate-950">
            NOTULA
          </h3>
          <p className="text-[11pt] sm:text-[11pt] text-slate-900">
            NOMOR: {meetingNumber}
          </p>
        </div>

        {/* 3. IDENTITAS RAPAT (TABEL TITIK DUA SEJAJAR) */}
        <div className="text-[11pt] space-y-1.5 pt-2">
          <div className="grid grid-cols-[130px_16px_1fr] sm:grid-cols-[160px_20px_1fr] items-start">
            <span className="font-normal text-slate-900">Judul Rapat</span>
            <span>:</span>
            <span className="text-slate-950 font-normal leading-relaxed">{meetingTitle}</span>
          </div>

          <div className="grid grid-cols-[130px_16px_1fr] sm:grid-cols-[160px_20px_1fr] items-start">
            <span className="font-normal text-slate-900">Hari/Tanggal</span>
            <span>:</span>
            <span className="text-slate-950 font-normal">{meetingDate}</span>
          </div>

          <div className="grid grid-cols-[130px_16px_1fr] sm:grid-cols-[160px_20px_1fr] items-start">
            <span className="font-normal text-slate-900 leading-tight">
              Nomor Surat<br />Undangan
            </span>
            <span>:</span>
            <span className="text-slate-950 font-normal">-</span>
          </div>

          <div className="grid grid-cols-[130px_16px_1fr] sm:grid-cols-[160px_20px_1fr] items-start">
            <span className="font-normal text-slate-900">Pukul</span>
            <span>:</span>
            <span className="text-slate-950 font-normal">{meetingTime}</span>
          </div>

          <div className="grid grid-cols-[130px_16px_1fr] sm:grid-cols-[160px_20px_1fr] items-start">
            <span className="font-normal text-slate-900">Agenda</span>
            <span>:</span>
            <div className="text-slate-950 font-normal">
              {agenda ? (
                <TiptapEditor content={agenda} editable={false} minHeight="auto" />
              ) : (
                <span>1. {meetingTitle}</span>
              )}
            </div>
          </div>
        </div>

        {/* 4. PELAKSANA RAPAT */}
        <div className="text-[11pt] space-y-2 pt-2">
          <p className="font-bold text-slate-900">Pelaksana Rapat:</p>

          <div className="space-y-1.5">
            <div className="grid grid-cols-[130px_16px_1fr] sm:grid-cols-[160px_20px_1fr] items-start">
              <span className="font-normal text-slate-900">Ketua/Pimpinan Rapat</span>
              <span>:</span>
              <span className="text-slate-950 font-normal">{chairperson}</span>
            </div>

            <div className="grid grid-cols-[130px_16px_1fr] sm:grid-cols-[160px_20px_1fr] items-start">
              <span className="font-normal text-slate-900">Pencatat</span>
              <span>:</span>
              <span className="text-slate-950 font-normal">{secretary}</span>
            </div>

            <div className="grid grid-cols-[130px_16px_1fr] sm:grid-cols-[160px_20px_1fr] items-start">
              <span className="font-normal text-slate-900">Peserta Rapat</span>
              <span>:</span>
              <div className="space-y-1 text-slate-950">
                {participants.length > 0 ? (
                  participants.map((p, idx) => (
                    <div key={idx} className="flex gap-2.5">
                      <span className="w-5 text-right shrink-0">{idx + 1}</span>
                      <span>{p.user.name}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 italic">1  Belum terdapat data peserta tercatat</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 5. SUBSTANSI INTI PEMBAHASAN RAPAT */}
        <div className="text-[11pt] space-y-2 pt-4">
          <div className="leading-tight">
            <p className="font-bold text-slate-900">Substansi &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Inti &nbsp;:</p>
            <p className="font-bold text-slate-900">Pembahasan Rapat</p>
          </div>

          <div className="text-slate-950 text-justify leading-relaxed pt-1">
            {discussion ? (
              <TiptapEditor content={discussion} editable={false} minHeight="auto" />
            ) : (
              <p className="text-slate-500 italic">
                Rapat membahas terkait kajian dampak KEK terhadap perekonomian, adapun hasil rapat sebagaimana berikut...
              </p>
            )}
          </div>
        </div>

        {/* 6. KESIMPULAN */}
        <div className="text-[11pt] space-y-2 pt-4">
          <p className="font-bold text-slate-950">Kesimpulan</p>
          <div className="text-slate-950 text-justify leading-relaxed">
            {conclusion ? (
              <TiptapEditor content={conclusion} editable={false} minHeight="auto" />
            ) : (
              <p className="text-slate-500 italic">
                1. Berdasarkan hasil pembahasan, kajian dampak KEK perlu diarahkan untuk mengukur manfaat nyata...
              </p>
            )}
          </div>
        </div>

        {/* 7. TINDAK LANJUT */}
        <div className="text-[11pt] space-y-2 pt-4">
          <p className="font-bold text-slate-950">Tindak Lanjut</p>
          <div className="text-slate-950 text-justify leading-relaxed">
            {decisions ? (
              <TiptapEditor content={decisions} editable={false} minHeight="auto" />
            ) : (
              <p className="text-slate-500 italic">
                1. Tim kerja akan segera melakukan pembahasan lebih lanjut untuk menajamkan desain pelaksanaan...
              </p>
            )}
          </div>
        </div>

        {/* 8. TANDA TANGAN (SIGNATURE BLOCK) */}
        <div className="pt-8 flex justify-end text-[11pt]">
          <div className="w-64 space-y-1 text-left text-slate-950">
            <p>Notulis,</p>
            <p className="leading-tight whitespace-pre-line">
              {customSignerRole}
            </p>

            <div className="py-6 text-slate-400 font-mono text-[11pt]">
              ${'{ttd_pengirim}'}
            </div>

            <p className="font-normal leading-tight">
              {customSignerName}
            </p>
          </div>
        </div>

        {/* Footer update date */}
        {updatedAt && (
          <div className="text-right text-[11px] text-slate-400 pt-4 border-t border-slate-100">
            Pembaruan terakhir: {new Date(updatedAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })} WIB
          </div>
        )}
      </div>
    </div>
  );
}
