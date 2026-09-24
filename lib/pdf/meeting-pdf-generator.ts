import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { parseRichText, ParsedBlock } from './tiptap-parser';
import { computeActionItemStatus } from '../validations/action-item';

export interface MeetingPdfData {
  id: string;
  meetingNumber: string;
  title: string;
  date: Date | string;
  startTime: string;
  endTime: string;
  location: string;
  status: string;
  primaryBiro: {
    code: string;
    name: string;
    shortName: string;
  };
  chairperson?: {
    name: string;
    biro?: {
      code: string;
      shortName: string;
    } | null;
  } | null;
  secretary?: {
    name: string;
    biro?: {
      code: string;
      shortName: string;
    } | null;
  } | null;
  meetingBiros?: Array<{
    biro: {
      code: string;
      name: string;
      shortName: string;
    };
  }>;
  participants?: Array<{
    id: string;
    attendanceStatus: string;
    user: {
      name: string;
      email?: string | null;
      biro?: {
        code: string;
        shortName: string;
      } | null;
    };
  }>;
  minutes?: {
    agenda?: any;
    discussion?: any;
    decisions?: any;
    conclusion?: any;
  } | null;
  actionItems?: Array<{
    id: string;
    title: string;
    description?: string | null;
    dueDate: Date | string;
    status: string;
    priority: string;
    completedAt?: Date | string | null;
    picBiro?: {
      code: string;
      shortName: string;
    } | null;
    picUser?: {
      name: string;
    } | null;
  }>;
}

const ATTENDANCE_MAP: Record<string, string> = {
  PRESENT: 'Hadir',
  ABSENT: 'Tidak Hadir',
  EXCUSED: 'Izin',
  INVITED: 'Diundang',
};

const STATUS_MAP: Record<string, string> = {
  PENDING: 'Menunggu',
  IN_PROGRESS: 'Berjalan',
  COMPLETED: 'Selesai',
  OVERDUE: 'Terlambat',
};

const PRIORITY_MAP: Record<string, string> = {
  LOW: 'Rendah',
  MEDIUM: 'Sedang',
  HIGH: 'Tinggi',
  URGENT: 'Mendesak',
};

const MEETING_STATUS_MAP: Record<string, string> = {
  DRAFT: 'Draft / Konsep',
  REVIEW: 'Menunggu Review',
  APPROVED: 'Disetujui',
  FINAL: 'Final / Selesai',
};

function formatIndonesianDate(d: Date | string): string {
  try {
    const obj = typeof d === 'string' ? new Date(d) : d;
    return obj.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return String(d);
  }
}

function formatShortDate(d: Date | string): string {
  try {
    const obj = typeof d === 'string' ? new Date(d) : d;
    return obj.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(d);
  }
}

function normalizeTime(start: string, end: string): string {
  const s = (start || '').replace('WIB', '').replace(':', '.').trim();
  const e = (end || '').replace('WIB', '').replace(':', '.').trim();
  if (!s && !e) return '-';
  if (s && !e) return `${s} WIB`;
  return `${s} – ${e} WIB`;
}

export async function generateMeetingPdf(meeting: MeetingPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 42,
        bufferPages: true,
        info: {
          Title: `Risalah Rapat - ${meeting.meetingNumber}`,
          Author: 'SIM-RAPAT KEK RI',
          Subject: `Risalah Rapat ${meeting.meetingNumber}`,
          Creator: 'SIM-RAPAT KEK RI',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const leftMargin = 42;
      const rightMargin = 42;
      const printableWidth = pageWidth - leftMargin - rightMargin; // 511.28
      const maxContentY = 750;

      const ensureSpace = (neededHeight: number) => {
        if (doc.y + neededHeight > maxContentY) {
          doc.addPage();
        }
      };

      // -------------------------------------------------------------
      // 1. KOP SURAT / HEADER RESMI
      // -------------------------------------------------------------
      const logoPath = path.join(process.cwd(), 'public', 'logo-kek.png');
      const hasLogo = fs.existsSync(logoPath);

      if (hasLogo) {
        try {
          doc.image(logoPath, leftMargin, 38, { width: 75, height: 32 });
        } catch (e) {
          console.warn('Could not load logo in PDF, skipping image:', e);
        }
      }

      const headerTextX = hasLogo ? leftMargin + 85 : leftMargin;
      const headerTextWidth = hasLogo ? printableWidth - 85 : printableWidth;

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#0f172a')
        .text('DEWAN NASIONAL KAWASAN EKONOMI KHUSUS', headerTextX, 36, {
          width: headerTextWidth,
          align: 'left',
        })
        .fontSize(9.5)
        .fillColor('#1e293b')
        .text('REPUBLIK INDONESIA', {
          width: headerTextWidth,
          align: 'left',
        })
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor('#64748b')
        .text('Sistem Informasi Manajemen Rapat & Tindak Lanjut (SIM-RAPAT KEK RI)', {
          width: headerTextWidth,
          align: 'left',
        });

      // Decorative double lines
      const lineY = 78;
      doc
        .strokeColor('#d97706')
        .lineWidth(1.8)
        .moveTo(leftMargin, lineY)
        .lineTo(leftMargin + printableWidth, lineY)
        .stroke();

      doc
        .strokeColor('#fde68a')
        .lineWidth(0.8)
        .moveTo(leftMargin, lineY + 2.5)
        .lineTo(leftMargin + printableWidth, lineY + 2.5)
        .stroke();

      // Document Title Box
      doc.y = lineY + 12;
      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor('#92400e')
        .text('RISALAH RAPAT', leftMargin, doc.y, {
          width: printableWidth,
          align: 'center',
        });

      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#1e293b')
        .text(`NOMOR: ${meeting.meetingNumber}`, {
          width: printableWidth,
          align: 'center',
        });

      doc.moveDown(0.8);

      // Section Header Helper
      const renderSectionHeader = (title: string) => {
        ensureSpace(40);
        doc.moveDown(0.4);
        const y = doc.y;

        // Background accent box
        doc
          .rect(leftMargin, y, printableWidth, 18)
          .fillAndStroke('#fef3c7', '#fde68a');

        doc
          .font('Helvetica-Bold')
          .fontSize(9.5)
          .fillColor('#92400e')
          .text(title, leftMargin + 8, y + 4.5, {
            width: printableWidth - 16,
          });

        doc.y = y + 24;
      };

      // -------------------------------------------------------------
      // 2. SECTION A: IDENTITAS RAPAT
      // -------------------------------------------------------------
      renderSectionHeader('A. IDENTITAS RAPAT');

      const participatingBiros = (meeting.meetingBiros || [])
        .map((mb) => `${mb.biro.code} (${mb.biro.shortName})`)
        .join(', ');

      const identityRows: Array<[string, string]> = [
        ['Nomor Rapat', meeting.meetingNumber],
        ['Judul / Agenda Utama', meeting.title],
        ['Hari / Tanggal', formatIndonesianDate(meeting.date)],
        ['Waktu Pelaksanaan', normalizeTime(meeting.startTime, meeting.endTime)],
        ['Tempat / Media', meeting.location || '-'],
        ['Biro Penyelenggara', `${meeting.primaryBiro.code} – ${meeting.primaryBiro.name}`],
        ['Biro Peserta Terlibat', participatingBiros || 'Tidak ada biro lain terdaftar'],
        ['Pimpinan Rapat', meeting.chairperson?.name ? `${meeting.chairperson.name}${meeting.chairperson.biro ? ` (${meeting.chairperson.biro.shortName})` : ''}` : 'Belum Ditugaskan'],
        ['Notulis Sidang', meeting.secretary?.name ? `${meeting.secretary.name}${meeting.secretary.biro ? ` (${meeting.secretary.biro.shortName})` : ''}` : 'Tim Notulensi Dewan KEK'],
        ['Status Dokumen', MEETING_STATUS_MAP[meeting.status] || meeting.status],
      ];

      const colLabelW = 125;
      const colSepW = 12;
      const colValW = printableWidth - colLabelW - colSepW;

      for (const [lbl, val] of identityRows) {
        doc.font('Helvetica').fontSize(8.5);
        const valHeight = doc.heightOfString(val, { width: colValW });
        const rowH = Math.max(14, valHeight + 3);
        ensureSpace(rowH);

        const currentY = doc.y;

        doc
          .font('Helvetica-Bold')
          .fontSize(8.5)
          .fillColor('#334155')
          .text(lbl, leftMargin + 4, currentY, { width: colLabelW });

        doc
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor('#64748b')
          .text(':', leftMargin + colLabelW, currentY, { width: colSepW });

        doc
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor('#0f172a')
          .text(val, leftMargin + colLabelW + colSepW, currentY, { width: colValW });

        doc.y = currentY + rowH;
      }

      // -------------------------------------------------------------
      // 3. SECTION B: PESERTA RAPAT
      // -------------------------------------------------------------
      renderSectionHeader('B. PESERTA RAPAT');

      const participants = meeting.participants || [];

      if (participants.length === 0) {
        doc
          .font('Helvetica-Oblique')
          .fontSize(8.5)
          .fillColor('#64748b')
          .text('Belum terdapat data peserta yang tercatat.', leftMargin + 8, doc.y);
        doc.moveDown(0.5);
      } else {
        const pCols = [
          { label: 'No', width: 28, align: 'center' as const },
          { label: 'Nama Pejabat / Perwakilan', width: 200, align: 'left' as const },
          { label: 'Instansi / Biro KEK', width: 170, align: 'left' as const },
          { label: 'Status Kehadiran', width: 113.28, align: 'center' as const },
        ];

        // Draw Table Header
        const renderParticipantHeader = () => {
          ensureSpace(24);
          const y = doc.y;
          doc.rect(leftMargin, y, printableWidth, 18).fill('#f1f5f9');
          let curX = leftMargin;
          pCols.forEach((col) => {
            doc
              .font('Helvetica-Bold')
              .fontSize(8)
              .fillColor('#1e293b')
              .text(col.label, curX + 2, y + 5, { width: col.width - 4, align: col.align });
            curX += col.width;
          });
          doc.y = y + 18;
        };

        renderParticipantHeader();

        participants.forEach((p, idx) => {
          const biroName = p.user.biro ? `${p.user.biro.code} - ${p.user.biro.shortName}` : 'Biro KEK';
          const statusText = ATTENDANCE_MAP[p.attendanceStatus] || p.attendanceStatus;

          doc.font('Helvetica').fontSize(8);
          const h1 = doc.heightOfString(p.user.name, { width: pCols[1].width - 8 });
          const h2 = doc.heightOfString(biroName, { width: pCols[2].width - 8 });
          const rowHeight = Math.max(16, h1 + 6, h2 + 6);

          if (doc.y + rowHeight > maxContentY) {
            doc.addPage();
            renderParticipantHeader();
          }

          const rowY = doc.y;
          // Row zebra background
          if (idx % 2 === 1) {
            doc.rect(leftMargin, rowY, printableWidth, rowHeight).fill('#f8fafc');
          }

          // Border bottom
          doc
            .strokeColor('#e2e8f0')
            .lineWidth(0.5)
            .moveTo(leftMargin, rowY + rowHeight)
            .lineTo(leftMargin + printableWidth, rowY + rowHeight)
            .stroke();

          let cellX = leftMargin;

          // Col 0: No
          doc
            .font('Helvetica')
            .fontSize(8)
            .fillColor('#334155')
            .text(String(idx + 1), cellX, rowY + 4, { width: pCols[0].width, align: 'center' });
          cellX += pCols[0].width;

          // Col 1: Nama
          doc
            .font('Helvetica-Bold')
            .fontSize(8)
            .fillColor('#0f172a')
            .text(p.user.name, cellX + 4, rowY + 4, { width: pCols[1].width - 8 });
          cellX += pCols[1].width;

          // Col 2: Biro
          doc
            .font('Helvetica')
            .fontSize(8)
            .fillColor('#334155')
            .text(biroName, cellX + 4, rowY + 4, { width: pCols[2].width - 8 });
          cellX += pCols[2].width;

          // Col 3: Status
          doc
            .font('Helvetica-Bold')
            .fontSize(8)
            .fillColor(statusText === 'Hadir' ? '#15803d' : '#64748b')
            .text(statusText, cellX, rowY + 4, { width: pCols[3].width, align: 'center' });

          doc.y = rowY + rowHeight;
        });

        doc.moveDown(0.5);
      }

      // Helper to render Rich Text Blocks
      const renderRichTextBlocks = (blocks: ParsedBlock[], emptyFallback: string) => {
        if (!blocks || blocks.length === 0) {
          doc
            .font('Helvetica-Oblique')
            .fontSize(8.5)
            .fillColor('#64748b')
            .text(emptyFallback, leftMargin + 8, doc.y);
          doc.moveDown(0.5);
          return;
        }

        for (const b of blocks) {
          ensureSpace(20);

          if (b.type === 'heading') {
            doc.moveDown(0.3);
            doc.font('Helvetica-Bold').fontSize(b.level === 1 ? 10.5 : 9.5).fillColor('#0f172a');
            const headingText = b.segments.map((s) => s.text).join(' ');
            doc.text(headingText, leftMargin + 6, doc.y, { width: printableWidth - 12 });
            doc.moveDown(0.2);
          } else if (b.type === 'paragraph') {
            doc.font('Helvetica').fontSize(8.5).fillColor('#1e293b');
            const pText = b.segments.map((s) => s.text).join('');
            doc.text(pText, leftMargin + 6, doc.y, {
              width: printableWidth - 12,
              lineGap: 2,
              align: 'justify',
            });
            doc.moveDown(0.3);
          } else if (b.type === 'bullet') {
            doc.font('Helvetica').fontSize(8.5).fillColor('#1e293b');
            const itemText = b.segments.map((s) => s.text).join('');
            doc.text(`•  ${itemText}`, leftMargin + 14, doc.y, {
              width: printableWidth - 20,
              lineGap: 1.5,
            });
            doc.moveDown(0.2);
          } else if (b.type === 'ordered') {
            doc.font('Helvetica').fontSize(8.5).fillColor('#1e293b');
            const itemText = b.segments.map((s) => s.text).join('');
            doc.text(`${b.number}.  ${itemText}`, leftMargin + 14, doc.y, {
              width: printableWidth - 20,
              lineGap: 1.5,
            });
            doc.moveDown(0.2);
          } else if (b.type === 'blockquote') {
            const quoteY = doc.y;
            const quoteText = b.segments.map((s) => s.text).join('');
            doc.font('Helvetica-Oblique').fontSize(8.5);
            const qH = doc.heightOfString(quoteText, { width: printableWidth - 28 });

            doc.rect(leftMargin + 10, quoteY, printableWidth - 20, qH + 6).fill('#f8fafc');
            doc.strokeColor('#cbd5e1').lineWidth(2).moveTo(leftMargin + 10, quoteY).lineTo(leftMargin + 10, quoteY + qH + 6).stroke();

            doc
              .font('Helvetica-Oblique')
              .fontSize(8.5)
              .fillColor('#475569')
              .text(quoteText, leftMargin + 18, quoteY + 3, { width: printableWidth - 36 });

            doc.y = quoteY + qH + 8;
          }
        }

        doc.moveDown(0.4);
      };

      // -------------------------------------------------------------
      // 4. SECTION C: AGENDA & TOPIK
      // -------------------------------------------------------------
      renderSectionHeader('C. AGENDA & TOPIK');
      const agendaBlocks = parseRichText(meeting.minutes?.agenda);
      renderRichTextBlocks(agendaBlocks, 'Belum terdapat agenda yang dicatat.');

      // -------------------------------------------------------------
      // 5. SECTION D: PEMBAHASAN & DINAMIKA DISKUSI
      // -------------------------------------------------------------
      renderSectionHeader('D. PEMBAHASAN & DINAMIKA DISKUSI');
      const discussionBlocks = parseRichText(meeting.minutes?.discussion);
      renderRichTextBlocks(discussionBlocks, 'Belum terdapat catatan dinamika pembahasan yang dicatat.');

      // -------------------------------------------------------------
      // 6. SECTION E: KEPUTUSAN & ARAHAN SIDANG
      // -------------------------------------------------------------
      renderSectionHeader('E. KEPUTUSAN & ARAHAN SIDANG');
      const decisionsBlocks = parseRichText(meeting.minutes?.decisions);
      renderRichTextBlocks(decisionsBlocks, 'Belum terdapat keputusan yang dicatat.');

      // -------------------------------------------------------------
      // 7. SECTION F: KESIMPULAN
      // -------------------------------------------------------------
      renderSectionHeader('F. KESIMPULAN');
      const conclusionBlocks = parseRichText(meeting.minutes?.conclusion);
      renderRichTextBlocks(conclusionBlocks, 'Belum terdapat kesimpulan yang dicatat.');

      // -------------------------------------------------------------
      // 8. SECTION G: TINDAK LANJUT
      // -------------------------------------------------------------
      renderSectionHeader('G. TINDAK LANJUT');

      const rawActionItems = meeting.actionItems || [];

      if (rawActionItems.length === 0) {
        doc
          .font('Helvetica-Oblique')
          .fontSize(8.5)
          .fillColor('#64748b')
          .text('Tidak terdapat tindak lanjut yang tercatat.', leftMargin + 8, doc.y);
        doc.moveDown(0.5);
      } else {
        const actionCols = [
          { label: 'No', width: 24, align: 'center' as const },
          { label: 'Butir Tindak Lanjut & Deskripsi', width: 175, align: 'left' as const },
          { label: 'PIC Biro', width: 55, align: 'left' as const },
          { label: 'PIC Pengampu', width: 75, align: 'left' as const },
          { label: 'Tenggat', width: 68, align: 'center' as const },
          { label: 'Prioritas', width: 52, align: 'center' as const },
          { label: 'Status', width: 62.28, align: 'center' as const },
        ];

        const renderActionHeader = () => {
          ensureSpace(24);
          const y = doc.y;
          doc.rect(leftMargin, y, printableWidth, 18).fill('#f1f5f9');
          let curX = leftMargin;
          actionCols.forEach((col) => {
            doc
              .font('Helvetica-Bold')
              .fontSize(7.5)
              .fillColor('#1e293b')
              .text(col.label, curX + 2, y + 5, { width: col.width - 4, align: col.align });
            curX += col.width;
          });
          doc.y = y + 18;
        };

        renderActionHeader();

        rawActionItems.forEach((ai, idx) => {
          // Compute status using centralized helper
          const computed = computeActionItemStatus(ai);
          const statusText = STATUS_MAP[computed.computedStatus] || computed.computedStatus;
          const priorityText = PRIORITY_MAP[ai.priority] || ai.priority;
          const biroCode = ai.picBiro?.code || 'Biro KEK';
          const picName = ai.picUser?.name || '-';

          const titleDesc = ai.description ? `${ai.title}\n(${ai.description})` : ai.title;
          doc.font('Helvetica').fontSize(7.5);
          const hTitle = doc.heightOfString(titleDesc, { width: actionCols[1].width - 8 });
          const rowHeight = Math.max(16, hTitle + 6);

          if (doc.y + rowHeight > maxContentY) {
            doc.addPage();
            renderActionHeader();
          }

          const rowY = doc.y;
          if (idx % 2 === 1) {
            doc.rect(leftMargin, rowY, printableWidth, rowHeight).fill('#f8fafc');
          }

          doc
            .strokeColor('#e2e8f0')
            .lineWidth(0.5)
            .moveTo(leftMargin, rowY + rowHeight)
            .lineTo(leftMargin + printableWidth, rowY + rowHeight)
            .stroke();

          let cX = leftMargin;

          // No
          doc
            .font('Helvetica')
            .fontSize(7.5)
            .fillColor('#334155')
            .text(String(idx + 1), cX, rowY + 3.5, { width: actionCols[0].width, align: 'center' });
          cX += actionCols[0].width;

          // Title & desc
          doc
            .font('Helvetica-Bold')
            .fontSize(7.5)
            .fillColor('#0f172a')
            .text(ai.title, cX + 4, rowY + 3.5, { width: actionCols[1].width - 8 });

          if (ai.description) {
            doc.font('Helvetica-Bold').fontSize(7.5);
            const titleH = doc.heightOfString(ai.title, { width: actionCols[1].width - 8 });
            doc
              .font('Helvetica-Oblique')
              .fontSize(7)
              .fillColor('#64748b')
              .text(ai.description, cX + 4, rowY + 3.5 + titleH, { width: actionCols[1].width - 8 });
          }
          cX += actionCols[1].width;

          // PIC Biro
          doc
            .font('Helvetica')
            .fontSize(7.5)
            .fillColor('#1e293b')
            .text(biroCode, cX + 3, rowY + 3.5, { width: actionCols[2].width - 6 });
          cX += actionCols[2].width;

          // PIC User
          doc
            .font('Helvetica')
            .fontSize(7.5)
            .fillColor('#334155')
            .text(picName, cX + 3, rowY + 3.5, { width: actionCols[3].width - 6 });
          cX += actionCols[3].width;

          // Deadline
          doc
            .font('Helvetica')
            .fontSize(7)
            .fillColor(computed.isOverdue ? '#dc2626' : '#334155')
            .text(formatShortDate(ai.dueDate), cX, rowY + 3.5, { width: actionCols[4].width, align: 'center' });
          cX += actionCols[4].width;

          // Priority
          doc
            .font('Helvetica')
            .fontSize(7)
            .fillColor('#334155')
            .text(priorityText, cX, rowY + 3.5, { width: actionCols[5].width, align: 'center' });
          cX += actionCols[5].width;

          // Status
          let statusColor = '#475569';
          if (computed.computedStatus === 'COMPLETED') statusColor = '#15803d';
          else if (computed.computedStatus === 'IN_PROGRESS') statusColor = '#b45309';
          else if (computed.computedStatus === 'OVERDUE') statusColor = '#dc2626';

          doc
            .font('Helvetica-Bold')
            .fontSize(7)
            .fillColor(statusColor)
            .text(statusText, cX, rowY + 3.5, { width: actionCols[6].width, align: 'center' });

          doc.y = rowY + rowHeight;
        });

        doc.moveDown(0.5);
      }

      // -------------------------------------------------------------
      // 9. SECTION H: PENUTUP
      // -------------------------------------------------------------
      renderSectionHeader('H. PENUTUP');
      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor('#1e293b')
        .text(
          'Demikian risalah rapat ini dibuat berdasarkan hasil pelaksanaan rapat dan catatan yang tersimpan dalam Sistem Manajemen Rapat & Tindak Lanjut Dewan Nasional KEK RI.',
          leftMargin + 6,
          doc.y,
          { width: printableWidth - 12, lineGap: 2, align: 'justify' }
        );

      doc.moveDown(1.5);

      // -------------------------------------------------------------
      // 10. AREA TANDA TANGAN (SIGNATURE AREA)
      // -------------------------------------------------------------
      // Need ~115 pt for signatures
      if (doc.y + 115 > maxContentY) {
        doc.addPage();
      }

      const sigY = doc.y;
      const colSigW = (printableWidth - 40) / 2;

      const chairpersonName = meeting.chairperson?.name || '____________________';
      const chairpersonBiro = meeting.chairperson?.biro?.shortName || meeting.primaryBiro.shortName;
      const secretaryName = meeting.secretary?.name || '____________________';
      const secretaryBiro = meeting.secretary?.biro?.shortName || 'Tim Notulensi Dewan KEK';

      // Left Column: Pimpinan Rapat
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor('#1e293b')
        .text('Pimpinan Rapat / Ketua Sidang,', leftMargin + 10, sigY, { width: colSigW, align: 'center' });

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#64748b')
        .text(chairpersonBiro, leftMargin + 10, sigY + 12, { width: colSigW, align: 'center' });

      // Space for physical signature
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor('#0f172a')
        .text(`( ${chairpersonName} )`, leftMargin + 10, sigY + 68, { width: colSigW, align: 'center' });

      // Right Column: Notulis
      const rightSigX = leftMargin + colSigW + 40;
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor('#1e293b')
        .text('Notulis Sidang,', rightSigX, sigY, { width: colSigW, align: 'center' });

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#64748b')
        .text(secretaryBiro, rightSigX, sigY + 12, { width: colSigW, align: 'center' });

      // Space for physical signature
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor('#0f172a')
        .text(`( ${secretaryName} )`, rightSigX, sigY + 68, { width: colSigW, align: 'center' });

      // -------------------------------------------------------------
      // 11. FOOTER PADA SELURUH HALAMAN (Page X of Y)
      // -------------------------------------------------------------
      const range = doc.bufferedPageRange();
      const totalPages = range.count;

      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);

        const footerY = 804;

        // Thin separator line
        doc
          .strokeColor('#e2e8f0')
          .lineWidth(0.5)
          .moveTo(leftMargin, footerY - 4)
          .lineTo(leftMargin + printableWidth, footerY - 4)
          .stroke();

        // Footer left: System & Meeting Number
        doc
          .font('Helvetica')
          .fontSize(7)
          .fillColor('#64748b')
          .text(
            `SIM-RAPAT KEK RI | Dokumen Risalah Resmi Nomor: ${meeting.meetingNumber}`,
            leftMargin,
            footerY,
            { width: printableWidth - 100, align: 'left' }
          );

        // Footer right: Page number
        doc
          .font('Helvetica')
          .fontSize(7)
          .fillColor('#64748b')
          .text(`Halaman ${i + 1} dari ${totalPages}`, leftMargin + printableWidth - 100, footerY, {
            width: 100,
            align: 'right',
          });
      }

      // Finalize the PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
