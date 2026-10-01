import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { parseRichText, ParsedBlock, TextSegment } from './tiptap-parser';
import {
  formatIndonesianDate,
  normalizeTime,
  extractPlainText,
  resolveMeetingSignerInfo,
  resolveNotaDinasData,
  DEFAULT_DISCUSSION_FALLBACK,
  DEFAULT_CONCLUSION_FALLBACK,
  DEFAULT_ACTION_ITEM_FALLBACK,
  type MeetingPdfData,
} from './pdf-utils';

export type { MeetingPdfData };

interface AppFonts {
  tahomaBold: string;
  tahoma: string;
  arial: string;
  arialBold: string;
  arialItalic: string;
}

/**
 * Registrasi font resmi (Tahoma & Arial) persis naskah dinas Setjen Dewan Nasional KEK RI
 */
function registerAppFonts(doc: PDFKit.PDFDocument): AppFonts {
  const fontDir = path.join(process.cwd(), 'public', 'fonts');
  const winFontDir = 'C:\\Windows\\Fonts';

  const tryRegister = (fontName: string, filenames: string[], fallbackFont: string): string => {
    for (const f of filenames) {
      const localPath = path.join(fontDir, f);
      if (fs.existsSync(localPath)) {
        try {
          doc.registerFont(fontName, localPath);
          return fontName;
        } catch {}
      }
      const winPath = path.join(winFontDir, f);
      if (fs.existsSync(winPath)) {
        try {
          doc.registerFont(fontName, winPath);
          return fontName;
        } catch {}
      }
    }
    return fallbackFont;
  };

  return {
    tahomaBold: tryRegister('Tahoma-Bold', ['Tahoma-Bold.ttf', 'tahomabd.ttf'], 'Helvetica-Bold'),
    tahoma: tryRegister('Tahoma', ['Tahoma.ttf', 'tahoma.ttf'], 'Helvetica'),
    arial: tryRegister('Arial', ['Arial.ttf', 'arial.ttf'], 'Helvetica'),
    arialBold: tryRegister('Arial-Bold', ['Arial-Bold.ttf', 'arialbd.ttf'], 'Helvetica-Bold'),
    arialItalic: tryRegister('Arial-Italic', ['Arial-Italic.ttf', 'ariali.ttf'], 'Helvetica-Oblique'),
  };
}

/**
 * Render satu blok rich text dengan mempertahankan formatting inline (Bold, Italic, Underline)
 */
function renderFormattedBlock(
  doc: PDFKit.PDFDocument,
  block: ParsedBlock,
  leftMargin: number,
  printableWidth: number,
  fonts: AppFonts,
  numberPrefix?: string
) {
  const lineGap = 3.5;
  const fontSize = 11;

  if (block.type === 'heading') {
    const raw = block.segments.map((s) => s.text).join('').trim();
    if (!raw) return;
    doc.font(fonts.arialBold).fontSize(fontSize).fillColor('#000000');
    doc.text(raw, leftMargin, doc.y, {
      width: printableWidth,
      lineGap,
    });
    doc.moveDown(0.3);
    return;
  }

  const rawSegments = [...block.segments];
  if (rawSegments.length === 0) return;

  if (numberPrefix) {
    // Bersihkan penomoran lama jika sudah diawali angka (misal "1. ...")
    const cleanedFirstText = rawSegments[0].text.replace(/^\d+\.\s*/, '');
    rawSegments[0] = { ...rawSegments[0], text: `${numberPrefix}${cleanedFirstText}` };
  }

  const startX = block.type === 'bullet' ? leftMargin + 10 : leftMargin;
  const targetW = block.type === 'bullet' ? printableWidth - 10 : printableWidth;
  const startY = doc.y;

  rawSegments.forEach((seg, idx) => {
    const isLast = idx === rawSegments.length - 1;
    let chosenFont = fonts.arial;
    if (seg.bold) {
      chosenFont = fonts.arialBold;
    } else if (seg.italic) {
      chosenFont = fonts.arialItalic;
    }

    doc.font(chosenFont).fontSize(fontSize).fillColor('#000000');

    if (idx === 0) {
      doc.text(seg.text, startX, startY, {
        width: targetW,
        align: 'justify',
        lineGap,
        continued: !isLast,
        underline: !!seg.underline,
      });
    } else {
      doc.text(seg.text, {
        continued: !isLast,
        underline: !!seg.underline,
      });
    }
  });

  doc.moveDown(0.4);
}

/**
 * Generator PDF Format Notula Resmi Naskah Dinas
 * Sesuai Standar Tata Naskah Dinas Sekretariat Jenderal Dewan Nasional KEK RI
 */
export async function generateMeetingPdf(meeting: MeetingPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const leftMargin = 72; // 1 inch standar naskah dinas
      const rightMargin = 72; // 1 inch
      const topMargin = 65; // Margin atas pada halaman berikutnya (di bawah header - X - di Y=36)
      const bottomMargin = 55;
      const pageWidth = 595.28; // Ukuran standar kertas A4 (210 mm)
      const printableWidth = pageWidth - leftMargin - rightMargin; // 451.28 pt

      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: topMargin,
          bottom: bottomMargin,
          left: leftMargin,
          right: rightMargin,
        },
        bufferPages: true,
        info: {
          Title: `Notula - ${meeting.meetingNumber || (meeting as any).code || 'KEK/ND/2026'}`,
          Author: 'Sekretariat Jenderal Dewan Nasional KEK RI',
          Subject: `Notula Rapat ${meeting.title}`,
          Creator: 'SIM-RAPAT KEK RI',
        },
      });

      const fonts = registerAppFonts(doc);

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // -------------------------------------------------------------
      // 1. KOP SURAT RESMI SEKRETARIAT JENDERAL DEWAN KEK (HALAMAN 1)
      // -------------------------------------------------------------
      const emblemPng = path.join(process.cwd(), 'public', 'lambang-kek.png');
      const emblemJpg = path.join(process.cwd(), 'public', 'lambang-kek.jpg');
      const logoPath = path.join(process.cwd(), 'public', 'logo-kek.png');

      const emblemPath = fs.existsSync(emblemPng)
        ? emblemPng
        : fs.existsSync(emblemJpg)
        ? emblemJpg
        : null;

      if (emblemPath) {
        try {
          doc.image(emblemPath, leftMargin, 28, { width: 68, height: 68 });
        } catch (e) {
          console.warn('Could not load circular emblem, fallback to standard logo:', e);
        }
      } else if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, leftMargin, 42, { width: 68, height: 30 });
        } catch (e) {
          console.warn('Could not load logo in PDF:', e);
        }
      }

      // Teks Kop Surat Rata Tengah: Tahoma-Bold 12pt & Tahoma 8pt
      doc
        .font(fonts.tahomaBold)
        .fontSize(12)
        .fillColor('#000000')
        .text('DEWAN NASIONAL KAWASAN EKONOMI KHUSUS', leftMargin, 36, {
          width: printableWidth,
          align: 'center',
        })
        .fontSize(12)
        .fillColor('#000000')
        .text('SEKRETARIAT JENDERAL', {
          width: printableWidth,
          align: 'center',
        })
        .font(fonts.tahoma)
        .fontSize(8)
        .fillColor('#000000')
        .text('Gedung MNC Tower Lantai 3, Jl. Kebon Sirih No.17 – 19, Jakarta Pusat 10340', {
          width: printableWidth,
          align: 'center',
          lineGap: 1.5,
        })
        .text('Telp: (021) 3912491, email: info@kek.go.id', {
          width: printableWidth,
          align: 'center',
        });

      // Garis Pemisah Tunggal Standar Naskah Dinas
      const lineY = 104;
      doc
        .strokeColor('#000000')
        .lineWidth(1.5)
        .moveTo(leftMargin, lineY)
        .lineTo(leftMargin + printableWidth, lineY)
        .stroke();

      // -------------------------------------------------------------
      // 2. JUDUL DOKUMEN: NOTULA & NOMOR
      // -------------------------------------------------------------
      doc.y = lineY + 20;

      doc
        .font(fonts.arialBold)
        .fontSize(11)
        .fillColor('#000000')
        .text('NOTULA', leftMargin, doc.y, {
          width: printableWidth,
          align: 'center',
        });

      const customDocNumber =
        (meeting.minutes?.conclusion as any)?.documentNumber ||
        (meeting.minutes?.decisions as any)?.documentNumber;
      const nomorNaskah = customDocNumber || meeting.meetingNumber || (meeting as any).code || 'KEK/ND/2026';
      doc
        .font(fonts.arial)
        .fontSize(11)
        .fillColor('#000000')
        .text(`NOMOR: ${nomorNaskah}`, leftMargin, doc.y + 3, {
          width: printableWidth,
          align: 'center',
        });

      doc.moveDown(1.4);

      // -------------------------------------------------------------
      // 3. IDENTITAS & METADATA RAPAT
      // -------------------------------------------------------------
      const colLabelW = 150;
      const colSepW = 15;
      const colValW = printableWidth - colLabelW - colSepW;

      const renderMetaRow = (label: string, value: string) => {
        doc.font(fonts.arial).fontSize(11);
        const labelH = doc.heightOfString(label, { width: colLabelW });
        const valH = doc.heightOfString(value, { width: colValW });
        const rowH = Math.max(labelH, valH) + 3;

        const curY = doc.y;
        doc.font(fonts.arial).fontSize(11).fillColor('#000000');
        doc.text(label, leftMargin, curY, { width: colLabelW, lineGap: 1.5 });
        doc.text(':', leftMargin + colLabelW, curY, { width: colSepW });
        doc.text(value, leftMargin + colLabelW + colSepW, curY, { width: colValW, lineGap: 1.5 });

        doc.y = curY + rowH;
      };

      // 1. Judul Rapat
      renderMetaRow('Judul Rapat', meeting.title || '-');

      // 2. Hari/Tanggal
      renderMetaRow('Hari/Tanggal', formatIndonesianDate(meeting.date));

      // 3. Nomor Surat Undangan (Dinamis / '-' jika rapat tanpa surat undangan)
      const rawInvitationNum =
        (meeting.minutes?.conclusion as any)?.invitationNumber ||
        (meeting.minutes?.decisions as any)?.invitationNumber ||
        (meeting.minutes?.conclusion as any)?.nomorSuratUndangan ||
        (meeting.minutes?.decisions as any)?.nomorSuratUndangan ||
        (meeting.meetingNumber && (meeting.meetingNumber.toUpperCase().startsWith('UND') || meeting.meetingNumber.includes('/'))
          ? meeting.meetingNumber
          : '');
      const invitationNumberDisplay =
        rawInvitationNum && rawInvitationNum.trim() !== '' && rawInvitationNum.trim() !== '-'
          ? rawInvitationNum.trim()
          : '-';

      renderMetaRow('Nomor Surat Undangan', invitationNumberDisplay);

      // 4. Pukul
      renderMetaRow('Pukul', normalizeTime(meeting.startTime, meeting.endTime));

      // 5. Agenda
      const agendaText =
        extractPlainText(meeting.minutes?.agenda) ||
        `1. ${meeting.title || 'Pembahasan Koordinasi dan Pelaksanaan Tugas'}`;
      renderMetaRow('Agenda', agendaText);

      // -------------------------------------------------------------
      // 4. PELAKSANA RAPAT & PESERTA
      // -------------------------------------------------------------
      doc.moveDown(0.7);
      doc.font(fonts.arialBold).fontSize(11).fillColor('#000000');
      doc.text('Pelaksana Rapat:', leftMargin, doc.y);
      doc.moveDown(0.3);

      // Ketua / Pimpinan Rapat (kustom dari notula dinas atau data rapat)
      const customChairpersonName =
        (meeting.minutes?.conclusion as any)?.chairpersonName ||
        (meeting.minutes?.decisions as any)?.chairpersonName ||
        (meeting.minutes?.discussion as any)?.chairpersonName ||
        (meeting.minutes?.agenda as any)?.chairpersonName ||
        meeting.chairperson?.name ||
        '';

      const chairpersonName =
        customChairpersonName.trim() ||
        'Wakil Ketua II, Tim Pelaksana Dewan Nasional KEK, Budi Santoso';

      renderMetaRow('Ketua/Pimpinan Rapat', chairpersonName);

      // Ekstraksi nama dan jabatan notulis kustom jika diinput di notulen, fallback ke data rapat
      const customSignerName =
        (meeting.minutes?.conclusion as any)?.signerName ||
        (meeting.minutes?.decisions as any)?.signerName ||
        (meeting.minutes?.discussion as any)?.signerName ||
        (meeting.minutes?.agenda as any)?.signerName ||
        meeting.secretary?.name ||
        '';

      const customSignerRole =
        (meeting.minutes?.conclusion as any)?.signerRole ||
        (meeting.minutes?.decisions as any)?.signerRole ||
        (meeting.minutes?.discussion as any)?.signerRole ||
        (meeting.minutes?.agenda as any)?.signerRole ||
        '';

      const finalSignerName =
        customSignerName.trim() ||
        meeting.secretary?.name ||
        'Sri Aurelia Rosyana Hari Habyby';

      const finalSignerRole =
        customSignerRole.trim() ||
        'Pranata Hubungan Masyarakat Terampil';

      const signatureImage: string | null =
        (meeting.minutes?.conclusion as any)?.signatureImage ||
        (meeting.minutes?.decisions as any)?.signatureImage ||
        (meeting.minutes?.discussion as any)?.signatureImage ||
        (meeting.minutes?.agenda as any)?.signatureImage ||
        null;

      // Pencatat
      const roleClean = finalSignerRole.replace(/[\r\n]+/g, ' ').replace(/,\s*$/, '').trim();
      const secretaryMetaText = `${roleClean}, ${finalSignerName}`;
      renderMetaRow('Pencatat', secretaryMetaText);

      // Peserta Rapat
      const participants = meeting.participants || [];
      const pCurY = doc.y;
      doc.font(fonts.arial).fontSize(11).fillColor('#000000');
      doc.text('Peserta Rapat', leftMargin, pCurY, { width: colLabelW });
      doc.text(':', leftMargin + colLabelW, pCurY, { width: colSepW });

      if (participants.length === 0) {
        doc.text('1  Belum terdapat data peserta yang tercatat.', leftMargin + colLabelW + colSepW, pCurY, {
          width: colValW,
        });
        doc.y = pCurY + 18;
      } else {
        let curListY = pCurY;
        participants.forEach((p, idx) => {
          const num = idx + 1;
          const pText = `${num < 10 ? ' ' : ''}${num}  ${p.user.name}`;
          doc.font(fonts.arial).fontSize(11);
          const itemH = doc.heightOfString(pText, { width: colValW });

          const actualY = idx === 0 ? pCurY : curListY;
          doc.text(pText, leftMargin + colLabelW + colSepW, actualY, { width: colValW });
          curListY = actualY + itemH + 2;
          doc.y = curListY;
        });
      }

      // -------------------------------------------------------------
      // 5. SUBSTANSI INTI PEMBAHASAN RAPAT
      // -------------------------------------------------------------
      doc.moveDown(0.8);
      const subCurY = doc.y;
      doc.font(fonts.arial).fontSize(11).fillColor('#000000');
      doc.text('Substansi Inti', leftMargin, subCurY, { width: colLabelW });
      doc.text('Pembahasan Rapat', leftMargin, subCurY + 13, { width: colLabelW });
      doc.text(':', leftMargin + colLabelW, subCurY, { width: colSepW });
      doc.y = subCurY + 30;

      const discussionBlocks = parseRichText(meeting.minutes?.discussion);

      if (discussionBlocks.length === 0) {
        doc.font(fonts.arial).fontSize(11).fillColor('#000000');
        doc.text(
          'Rapat membahas terkait kajian dampak KEK terhadap perekonomian, adapun hasil rapat sebagaimana berikut:',
          leftMargin,
          doc.y,
          { width: printableWidth, align: 'justify', lineGap: 3.5 }
        );
        doc.moveDown(0.5);
      } else {
        let orderedCounter = 1;

        for (const b of discussionBlocks) {
          if (b.type === 'ordered') {
            const num = b.number || orderedCounter++;
            renderFormattedBlock(doc, b, leftMargin, printableWidth, fonts, `${num}. `);
          } else {
            renderFormattedBlock(doc, b, leftMargin, printableWidth, fonts);
          }
        }
      }

      // -------------------------------------------------------------
      // 6. KESIMPULAN
      // -------------------------------------------------------------
      doc.moveDown(0.8);
      doc.font(fonts.arialBold).fontSize(11).fillColor('#000000');
      doc.text('Kesimpulan', leftMargin, doc.y);
      doc.moveDown(0.4);

      const conclusionBlocks = parseRichText(meeting.minutes?.conclusion);

      if (conclusionBlocks.length === 0) {
        doc.font(fonts.arial).fontSize(11).fillColor('#000000');
        doc.text(
          '1. Berdasarkan hasil pembahasan, kajian dampak KEK perlu diarahkan untuk mengukur manfaat nyata keberadaan KEK terhadap perekonomian dan pengembangan wilayah, sekaligus mengidentifikasi faktor keberhasilan serta praktik yang dapat direplikasi di luar kawasan.',
          leftMargin,
          doc.y,
          { width: printableWidth, align: 'justify', lineGap: 3.5 }
        );
        doc.moveDown(0.4);
      } else {
        let cIndex = 1;
        for (const b of conclusionBlocks) {
          const itemNum = b.type === 'ordered' && b.number ? b.number : cIndex++;
          const prefix = b.type === 'ordered' || b.type === 'paragraph' ? `${itemNum}. ` : undefined;
          renderFormattedBlock(doc, b, leftMargin, printableWidth, fonts, prefix);
        }
      }

      // -------------------------------------------------------------
      // 7. TINDAK LANJUT
      // -------------------------------------------------------------
      doc.moveDown(0.8);
      doc.font(fonts.arialBold).fontSize(11).fillColor('#000000');
      doc.text('Tindak Lanjut', leftMargin, doc.y);
      doc.moveDown(0.4);

      const actionItems = meeting.actionItems || [];
      const decisionsBlocks = parseRichText(meeting.minutes?.decisions);

      if (actionItems.length > 0) {
        actionItems.forEach((ai, idx) => {
          const desc = ai.description ? ` ${ai.description}` : '';
          const itemText = `${idx + 1}. ${ai.title}${desc}`;
          doc.font(fonts.arial).fontSize(11).fillColor('#000000');
          doc.text(itemText, leftMargin, doc.y, {
            width: printableWidth,
            align: 'justify',
            lineGap: 3.5,
          });
          doc.moveDown(0.4);
        });
      } else if (decisionsBlocks.length > 0) {
        let dIndex = 1;
        for (const b of decisionsBlocks) {
          const itemNum = b.type === 'ordered' && b.number ? b.number : dIndex++;
          const prefix = b.type === 'ordered' || b.type === 'paragraph' ? `${itemNum}. ` : undefined;
          renderFormattedBlock(doc, b, leftMargin, printableWidth, fonts, prefix);
        }
      } else {
        doc.font(fonts.arial).fontSize(11).fillColor('#000000');
        doc.text(
          '1. Tim kerja akan segera melakukan pembahasan lebih lanjut untuk menajamkan desain pelaksanaan serta kebutuhan data terkait.',
          leftMargin,
          doc.y,
          { width: printableWidth, align: 'justify', lineGap: 3.5 }
        );
        doc.moveDown(0.4);
      }

      // -------------------------------------------------------------
      // 8. TANDA TANGAN (SIGNATURE BLOCK)
      // -------------------------------------------------------------
      // Jika sisa ruang di halaman saat ini kurang dari 120 pt, tambah halaman baru
      if (doc.y + 120 > 790) {
        doc.addPage();
      }

      doc.moveDown(1.5);

      const sigColW = 220;
      const sigX = leftMargin + printableWidth - sigColW;

      doc.font(fonts.arial).fontSize(11).fillColor('#000000');
      doc.text('Notulis,', sigX, doc.y, { width: sigColW, align: 'left' });

      // Jabatan Notulis
      const roleBlock = finalSignerRole.endsWith(',') ? finalSignerRole : `${finalSignerRole},`;
      doc.text(roleBlock, sigX, doc.y, {
        width: sigColW,
        align: 'left',
        lineGap: 2,
      });

      // Ruang tanda tangan: sematkan gambar jika ada, atau ruang kosong jika belum ada
      let hasRenderedSignature = false;
      if (
        signatureImage &&
        typeof signatureImage === 'string' &&
        signatureImage.startsWith('data:image')
      ) {
        try {
          const base64Data = signatureImage.replace(/^data:image\/\w+;base64,/, '');
          const imageBuffer = Buffer.from(base64Data, 'base64');
          const maxW = 140;
          const maxH = 50;
          doc.moveDown(0.4);
          const sigY = doc.y;
          doc.image(imageBuffer, sigX, sigY, { fit: [maxW, maxH] });
          doc.y = sigY + maxH + 4;
          hasRenderedSignature = true;
        } catch (err) {
          console.warn('Gagal memuat gambar tanda tangan ke dalam PDF:', err);
        }
      }

      if (!hasRenderedSignature) {
        doc.moveDown(4.5);
      }

      doc.font(fonts.arial).fontSize(11).fillColor('#000000');
      doc.text(finalSignerName, sigX, doc.y, {
        width: sigColW,
        align: 'left',
        lineGap: 2,
      });

      // -------------------------------------------------------------
      // 9. HEADER PENOMORAN HALAMAN RESMI (- 2 -, - 3 -, - 4 -, ...)
      // -------------------------------------------------------------
      const range = doc.bufferedPageRange();
      const totalPages = range.count;

      for (let i = 1; i < totalPages; i++) {
        doc.switchToPage(i);
        doc
          .font(fonts.arial)
          .fontSize(12)
          .fillColor('#000000')
          .text(`- ${i + 1} -`, leftMargin, 36, {
            width: printableWidth,
            align: 'center',
          });
      }

      // Selesai membuat dokumen PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generator PDF Format Nota Dinas Resmi Naskah Dinas
 * Sesuai Standar Tata Naskah Dinas Nota Dinas Dewan Nasional Kawasan Ekonomi Khusus
 */
export async function generateNotaDinasPdf(meeting: MeetingPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const leftMargin = 70.87; // Standar ~2.5 cm naskah dinas
      const rightMargin = 56.7; // ~2.0 cm
      const topMargin = 56.7; // ~2.0 cm
      const bottomMargin = 56.7;
      const pageWidth = 595.28; // Kertas A4
      const printableWidth = pageWidth - leftMargin - rightMargin;

      const notaData = resolveNotaDinasData(meeting, meeting.minutes);

      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: topMargin,
          bottom: bottomMargin,
          left: leftMargin,
          right: rightMargin,
        },
        bufferPages: true,
        info: {
          Title: `Nota Dinas - ${notaData.documentNumber}`,
          Author: 'Sekretariat Jenderal Dewan Nasional KEK RI',
          Subject: `Nota Dinas ${notaData.subject}`,
          Creator: 'SIM-RAPAT KEK RI',
        },
      });

      const fonts = registerAppFonts(doc);

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // -------------------------------------------------------------
      // 1. KOP RESMI NOTA DINAS (3 BARIS RATA TENGAH + GARIS PEMISAH)
      // -------------------------------------------------------------
      doc
        .font(fonts.arialBold)
        .fontSize(12)
        .fillColor('#000000')
        .text('DEWAN NASIONAL KAWASAN EKONOMI KHUSUS', leftMargin, topMargin, {
          width: printableWidth,
          align: 'center',
        })
        .moveDown(0.25)
        .text('SEKRETARIAT JENDERAL', {
          width: printableWidth,
          align: 'center',
        })
        .moveDown(0.25)
        .text(notaData.biroName, {
          width: printableWidth,
          align: 'center',
        });

      // Garis Pemisah Tebal Hitam Standar Nota Dinas
      const lineY = doc.y + 8;
      doc
        .strokeColor('#000000')
        .lineWidth(1.75)
        .moveTo(leftMargin, lineY)
        .lineTo(leftMargin + printableWidth, lineY)
        .stroke();

      // -------------------------------------------------------------
      // 2. JUDUL DOKUMEN: NOTA DINAS & NOMOR
      // -------------------------------------------------------------
      doc.y = lineY + 16;

      doc
        .font(fonts.arialBold)
        .fontSize(11)
        .fillColor('#000000')
        .text('NOTA DINAS', leftMargin, doc.y, {
          width: printableWidth,
          align: 'center',
        });

      doc
        .font(fonts.arial)
        .fontSize(11)
        .fillColor('#000000')
        .text(`NOMOR: ${notaData.documentNumber}`, leftMargin, doc.y + 3, {
          width: printableWidth,
          align: 'center',
        });

      doc.y = doc.y + 16;

      // -------------------------------------------------------------
      // 3. TABEL INFORMASI KEPALA NASKAH (Yth., Dari, Hal, Tanggal, Lampiran)
      // -------------------------------------------------------------
      const colLabelW = 75;
      const colColonW = 15;
      const colValW = printableWidth - colLabelW - colColonW;

      const renderHeaderRow = (label: string, value: string) => {
        const startY = doc.y;
        doc.font(fonts.arial).fontSize(11).fillColor('#000000');
        doc.text(label, leftMargin, startY, { width: colLabelW });
        doc.text(':', leftMargin + colLabelW, startY, { width: colColonW });
        doc.text(value, leftMargin + colLabelW + colColonW, startY, {
          width: colValW,
          lineGap: 2,
        });

        const valH = doc.heightOfString(value, { width: colValW, lineGap: 2 });
        doc.y = Math.max(doc.y, startY + valH + 3.5);
      };

      renderHeaderRow('Yth.', notaData.recipient);
      renderHeaderRow('Dari', notaData.sender);
      renderHeaderRow('Hal', notaData.subject);
      renderHeaderRow('Tanggal', notaData.dateText);
      renderHeaderRow('Lampiran', notaData.attachments);

      doc.moveDown(0.9);

      // -------------------------------------------------------------
      // 4. KALIMAT PENGANTAR / PEMBUKA
      // -------------------------------------------------------------
      if (notaData.introText) {
        doc
          .font(fonts.arial)
          .fontSize(11)
          .fillColor('#000000')
          .text(notaData.introText, leftMargin + 25, doc.y, {
            width: printableWidth - 25,
            align: 'justify',
            lineGap: 3.5,
          });

        doc.moveDown(0.7);
      }

      // -------------------------------------------------------------
      // 5. POKOK-POKOK PEMBAHASAN
      // -------------------------------------------------------------
      const discussionBlocks = parseRichText(meeting.minutes?.discussion);

      if (discussionBlocks.length > 0) {
        let blockIndex = 1;
        discussionBlocks.forEach((block) => {
          let numberPrefix: string | undefined;
          if (block.type === 'ordered') {
            numberPrefix = `${block.number}. `;
          } else if (block.type === 'paragraph') {
            const raw = block.segments.map((s) => s.text).join('').trim();
            // Cek apakah paragraf belum dimulai angka penomoran
            if (!/^\d+[\.\)]/i.test(raw) && !/^[a-z][\.\)]/i.test(raw)) {
              numberPrefix = `${blockIndex}. `;
              blockIndex++;
            }
          }
          renderFormattedBlock(doc, block, leftMargin, printableWidth, fonts, numberPrefix);
        });
      } else {
        // Fallback pokok pembahasan jika belum diisi khusus
        const fallbackText =
          extractPlainText(meeting.minutes?.agenda) ||
          meeting.title ||
          DEFAULT_DISCUSSION_FALLBACK;

        doc.font(fonts.arial).fontSize(11).fillColor('#000000').text(
          `1. ${fallbackText}`,
          leftMargin,
          doc.y,
          { width: printableWidth, align: 'justify', lineGap: 3.5 }
        );
        doc.moveDown(0.4);
      }

      // -------------------------------------------------------------
      // 6. KESIMPULAN (SEKSI 4)
      // -------------------------------------------------------------
      doc.moveDown(0.6);
      doc
        .font(fonts.arialBold)
        .fontSize(11)
        .fillColor('#000000')
        .text('4. Kesimpulan', leftMargin, doc.y, { width: printableWidth });

      doc.moveDown(0.3);

      const conclusionBlocks = parseRichText(meeting.minutes?.conclusion);
      if (conclusionBlocks.length > 0) {
        conclusionBlocks.forEach((block) => {
          renderFormattedBlock(doc, block, leftMargin, printableWidth, fonts);
        });
      } else {
        doc.font(fonts.arial).fontSize(11).fillColor('#000000').text(
          DEFAULT_CONCLUSION_FALLBACK,
          leftMargin,
          doc.y,
          { width: printableWidth, align: 'justify', lineGap: 3.5 }
        );
        doc.moveDown(0.4);
      }

      // -------------------------------------------------------------
      // 7. TINDAK LANJUT (SEKSI 5)
      // -------------------------------------------------------------
      doc.moveDown(0.6);
      doc
        .font(fonts.arialBold)
        .fontSize(11)
        .fillColor('#000000')
        .text('5. Tindak Lanjut', leftMargin, doc.y, { width: printableWidth });

      doc.moveDown(0.3);

      const decisionsBlocks = parseRichText(meeting.minutes?.decisions);
      const actionItems = meeting.actionItems || [];

      if (decisionsBlocks.length > 0) {
        decisionsBlocks.forEach((block) => {
          renderFormattedBlock(doc, block, leftMargin, printableWidth, fonts);
        });
      } else if (actionItems.length > 0) {
        const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        actionItems.forEach((item, idx) => {
          const letter = letters[idx % letters.length];
          const pic = item.picBiro?.shortName || item.picUser?.name || 'Tim Kerja';
          const tText = `${letter}. ${item.title} (PIC: ${pic})`;
          doc.font(fonts.arial).fontSize(11).fillColor('#000000').text(
            tText,
            leftMargin + 10,
            doc.y,
            { width: printableWidth - 10, align: 'justify', lineGap: 3.5 }
          );
          doc.moveDown(0.3);
        });
      } else {
        doc.font(fonts.arial).fontSize(11).fillColor('#000000').text(
          DEFAULT_ACTION_ITEM_FALLBACK,
          leftMargin,
          doc.y,
          { width: printableWidth, align: 'justify', lineGap: 3.5 }
        );
        doc.moveDown(0.4);
      }

      // -------------------------------------------------------------
      // 8. TANDA TANGAN PENGIRIM NOTA DINAS (SEBELAH KANAN BAWAH)
      // -------------------------------------------------------------
      if (doc.y + 130 > 790) {
        doc.addPage();
      }

      doc.moveDown(1.5);

      const sigColW = 240;
      const sigX = leftMargin + printableWidth - sigColW;

      doc.font(fonts.arial).fontSize(11).fillColor('#000000');
      const roleWithComma = notaData.signerRole.endsWith(',')
        ? notaData.signerRole
        : `${notaData.signerRole},`;
      doc.text(roleWithComma, sigX, doc.y, {
        width: sigColW,
        align: 'left',
        lineGap: 2,
      });

      let hasRenderedSignature = false;
      if (
        notaData.signatureImage &&
        typeof notaData.signatureImage === 'string' &&
        notaData.signatureImage.startsWith('data:image')
      ) {
        try {
          const base64Data = notaData.signatureImage.replace(/^data:image\/\w+;base64,/, '');
          const imageBuffer = Buffer.from(base64Data, 'base64');
          const maxW = 140;
          const maxH = 50;
          doc.moveDown(0.4);
          const sigY = doc.y;
          doc.image(imageBuffer, sigX, sigY, { fit: [maxW, maxH] });
          doc.y = sigY + maxH + 4;
          hasRenderedSignature = true;
        } catch (err) {
          console.warn('Gagal memuat tanda tangan pada Nota Dinas:', err);
        }
      }

      if (!hasRenderedSignature) {
        doc.moveDown(4.5);
      }

      doc.font(fonts.arial).fontSize(11).fillColor('#000000');
      doc.text(notaData.signerName, sigX, doc.y, {
        width: sigColW,
        align: 'left',
        lineGap: 2,
      });

      // -------------------------------------------------------------
      // 9. PENOMORAN HALAMAN NASKAH DINAS (- 2 -, - 3 -, ...)
      // -------------------------------------------------------------
      const range = doc.bufferedPageRange();
      const totalPages = range.count;

      for (let i = 1; i < totalPages; i++) {
        doc.switchToPage(i);
        doc
          .font(fonts.arial)
          .fontSize(11)
          .fillColor('#000000')
          .text(`- ${i + 1} -`, leftMargin, 36, {
            width: printableWidth,
            align: 'center',
          });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
