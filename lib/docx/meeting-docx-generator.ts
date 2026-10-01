/**
 * lib/docx/meeting-docx-generator.ts
 *
 * Generates Microsoft Word (.docx) documents for:
 * 1. Risalah / Notula Rapat Resmi (generateMeetingDocx)
 * 2. Nota Dinas Resmi (generateNotaDinasDocx)
 *
 * Conforming to Tata Naskah Dinas Sekretariat Jenderal Dewan Nasional KEK RI.
 * Uses `docx` (MIT) — fast, server-side, pure TypeScript.
 */

import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  AlignmentType,
  WidthType,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
  convertInchesToTwip,
  ImageRun,
} from 'docx';
import path from 'path';
import fs from 'fs';
import { parseRichText, ParsedBlock, TextSegment } from '../pdf/tiptap-parser';
import {
  formatIndonesianDate,
  normalizeTime,
  extractPlainText,
  resolveMeetingSignerInfo,
  resolveNotaDinasData,
  MeetingPdfData,
} from '../pdf/pdf-utils';

// ─── Borderless Table Definition ──────────────────────────────────────────────
const borderNone = {
  style: BorderStyle.NONE,
  size: 0,
  color: 'auto',
};

const tableBordersNone = {
  top: borderNone,
  bottom: borderNone,
  left: borderNone,
  right: borderNone,
  insideHorizontal: borderNone,
  insideVertical: borderNone,
};

// ─── Rich Text to Docx Paragraphs ─────────────────────────────────────────────
function parsedBlocksToDocxParagraphs(blocks: ParsedBlock[]): Paragraph[] {
  if (!blocks || blocks.length === 0) {
    return [
      new Paragraph({
        children: [new TextRun({ text: '-', font: 'Arial', size: 22 })],
        spacing: { after: 120, line: 276 },
      }),
    ];
  }

  const result: Paragraph[] = [];
  let orderedCounter = 1;

  for (const block of blocks) {
    const runs: TextRun[] = block.segments.map(
      (seg: TextSegment) =>
        new TextRun({
          text: seg.text,
          bold: seg.bold,
          italics: seg.italic,
          underline: seg.underline ? {} : undefined,
          font: 'Arial',
          size: 22, // 11pt
          color: '000000',
        })
    );

    if (block.type === 'heading') {
      result.push(
        new Paragraph({
          children: runs,
          spacing: { before: 180, after: 80, line: 276 },
        })
      );
    } else if (block.type === 'bullet') {
      result.push(
        new Paragraph({
          children: runs,
          bullet: { level: Math.max(0, (block.level || 1) - 1) },
          spacing: { after: 80, line: 276 },
          alignment: AlignmentType.JUSTIFIED,
        })
      );
    } else if (block.type === 'ordered') {
      const num = block.number || orderedCounter++;
      const firstText = block.segments[0]?.text || '';
      const hasNumber = /^\d+[\.\)]\s*/.test(firstText);
      const prefixRuns = hasNumber
        ? []
        : [new TextRun({ text: `${num}. `, bold: true, font: 'Arial', size: 22, color: '000000' })];

      result.push(
        new Paragraph({
          children: [...prefixRuns, ...runs],
          indent: { left: convertInchesToTwip(0.25) },
          spacing: { after: 80, line: 276 },
          alignment: AlignmentType.JUSTIFIED,
        })
      );
    } else {
      result.push(
        new Paragraph({
          children: runs,
          spacing: { after: 100, line: 276 },
          alignment: AlignmentType.JUSTIFIED,
        })
      );
    }
  }

  return result;
}

// ─── Helper to load image as buffer ───────────────────────────────────────────
function tryLoadImage(relativePath: string): Buffer | null {
  try {
    const fullPath = path.join(process.cwd(), relativePath);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath);
    }
  } catch {}
  return null;
}

// ─── 1. GENERATE RISALAH / NOTULA RAPAT (.DOCX) ──────────────────────────────
export async function generateMeetingDocx(meeting: MeetingPdfData): Promise<Buffer> {
  const signerInfo = resolveMeetingSignerInfo(meeting, meeting.minutes);

  // Document Number
  const customDocNumber =
    (meeting.minutes?.conclusion as any)?.documentNumber !== undefined
      ? (meeting.minutes?.conclusion as any)?.documentNumber
      : (meeting.minutes?.decisions as any)?.documentNumber;
  let nomorNaskah = '-';
  if (customDocNumber !== undefined && customDocNumber !== null) {
    const trimmed = String(customDocNumber).trim();
    nomorNaskah = trimmed !== '' ? trimmed : '-';
  } else if (meeting.meetingNumber || (meeting as any).code) {
    nomorNaskah = meeting.meetingNumber || (meeting as any).code;
  }

  // Invitation Number
  const rawInvitationNum =
    (meeting.minutes?.conclusion as any)?.invitationNumber ||
    (meeting.minutes?.decisions as any)?.invitationNumber ||
    (meeting.minutes?.conclusion as any)?.nomorSuratUndangan ||
    (meeting.minutes?.decisions as any)?.nomorSuratUndangan ||
    (meeting.meetingNumber &&
    (meeting.meetingNumber.toUpperCase().startsWith('UND') || meeting.meetingNumber.includes('/'))
      ? meeting.meetingNumber
      : '');
  const invitationNumber =
    rawInvitationNum && rawInvitationNum.trim() !== '' && rawInvitationNum.trim() !== '-'
      ? rawInvitationNum.trim()
      : '-';

  // Agenda text
  const agendaText =
    extractPlainText(meeting.minutes?.agenda) ||
    `1. ${meeting.title || 'Pembahasan Koordinasi dan Pelaksanaan Tugas'}`;

  // Rich text blocks
  const discussionBlocks = parseRichText(meeting.minutes?.discussion);
  const conclusionBlocks = parseRichText(meeting.minutes?.conclusion);
  const decisionsBlocks = parseRichText(meeting.minutes?.decisions);
  const actionItems = meeting.actionItems || [];

  // Kop Emblem / Logo
  const emblemBuffer = tryLoadImage('public/lambang-kek.png') || tryLoadImage('public/lambang-kek.jpg');

  // Metadata Table Rows
  const metaRows: Array<{ label: string; value: string | Paragraph[] }> = [
    { label: 'Judul Rapat', value: meeting.title || '-' },
    { label: 'Hari/Tanggal', value: formatIndonesianDate(meeting.date) },
    { label: 'Nomor Surat Undangan', value: invitationNumber },
    { label: 'Pukul', value: normalizeTime(meeting.startTime, meeting.endTime) },
    { label: 'Agenda', value: agendaText },
  ];

  const tableChildren: TableRow[] = metaRows.map((r) => {
    return new TableRow({
      children: [
        new TableCell({
          borders: tableBordersNone,
          width: { size: 2500, type: WidthType.DXA },
          children: [
            new Paragraph({
              children: [new TextRun({ text: r.label, font: 'Arial', size: 22 })],
              spacing: { after: 60, line: 260 },
            }),
          ],
        }),
        new TableCell({
          borders: tableBordersNone,
          width: { size: 250, type: WidthType.DXA },
          children: [
            new Paragraph({
              children: [new TextRun({ text: ':', font: 'Arial', size: 22 })],
              spacing: { after: 60, line: 260 },
            }),
          ],
        }),
        new TableCell({
          borders: tableBordersNone,
          width: { size: 6200, type: WidthType.DXA },
          children:
            typeof r.value === 'string'
              ? [
                  new Paragraph({
                    children: [new TextRun({ text: r.value, font: 'Arial', size: 22 })],
                    spacing: { after: 60, line: 260 },
                  }),
                ]
              : r.value,
        }),
      ],
    });
  });

  // Pelaksana Rapat Section in metadata
  const participants = meeting.participants || [];
  const participantParagraphs: Paragraph[] =
    participants.length === 0
      ? [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Belum terdapat data peserta yang tercatat.',
                font: 'Arial',
                size: 22,
                italics: true,
                color: '64748B',
              }),
            ],
            spacing: { after: 40, line: 260 },
          }),
        ]
      : participants.map((p, idx) => {
          const num = idx + 1;
          const pName = p.user?.name || 'Peserta';
          const biroShort = p.user?.biro?.shortName || p.user?.biro?.code || '';
          const biroTag = biroShort ? ` (${biroShort})` : '';
          return new Paragraph({
            children: [
              new TextRun({
                text: `${num}. ${pName}${biroTag}`,
                font: 'Arial',
                size: 22,
              }),
            ],
            spacing: { after: 40, line: 260 },
          });
        });

  const pelaksanaRows: Array<{ label: string; value: string | Paragraph[] }> = [
    { label: 'Ketua/Pimpinan Rapat', value: signerInfo.chairpersonName },
    { label: 'Pencatat', value: signerInfo.secretaryMetaText },
    { label: 'Peserta Rapat', value: participantParagraphs },
  ];

  pelaksanaRows.forEach((r) => {
    tableChildren.push(
      new TableRow({
        children: [
          new TableCell({
            borders: tableBordersNone,
            width: { size: 2500, type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [new TextRun({ text: r.label, font: 'Arial', size: 22 })],
                spacing: { after: 60, line: 260 },
              }),
            ],
          }),
          new TableCell({
            borders: tableBordersNone,
            width: { size: 250, type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [new TextRun({ text: ':', font: 'Arial', size: 22 })],
                spacing: { after: 60, line: 260 },
              }),
            ],
          }),
          new TableCell({
            borders: tableBordersNone,
            width: { size: 6200, type: WidthType.DXA },
            children:
              typeof r.value === 'string'
                ? [
                    new Paragraph({
                      children: [new TextRun({ text: r.value, font: 'Arial', size: 22 })],
                      spacing: { after: 60, line: 260 },
                    }),
                  ]
                : r.value,
          }),
        ],
      })
    );
  });

  // Action items rendering
  const actionItemParagraphs: Paragraph[] = [];
  if (actionItems.length > 0) {
    actionItems.forEach((ai, idx) => {
      const desc = ai.description ? ` - ${ai.description}` : '';
      const pic = ai.picBiro?.shortName || ai.picUser?.name || '';
      const picTag = pic ? ` (PIC: ${pic})` : '';
      actionItemParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${idx + 1}. ${ai.title}${desc}${picTag}`,
              font: 'Arial',
              size: 22,
            }),
          ],
          indent: { left: convertInchesToTwip(0.25) },
          spacing: { after: 80, line: 276 },
          alignment: AlignmentType.JUSTIFIED,
        })
      );
    });
  } else if (decisionsBlocks.length > 0) {
    actionItemParagraphs.push(...parsedBlocksToDocxParagraphs(decisionsBlocks));
  } else {
    actionItemParagraphs.push(
      new Paragraph({
        children: [new TextRun({ text: '-', font: 'Arial', size: 22 })],
        spacing: { after: 80, line: 276 },
      })
    );
  }

  // Signature Block
  const sigRole = signerInfo.finalSignerRole.endsWith(',')
    ? signerInfo.finalSignerRole
    : `${signerInfo.finalSignerRole},`;

  let sigImageRun: ImageRun | null = null;
  if (
    signerInfo.signatureImage &&
    typeof signerInfo.signatureImage === 'string' &&
    signerInfo.signatureImage.startsWith('data:image')
  ) {
    try {
      const base64Data = signerInfo.signatureImage.replace(/^data:image\/\w+;base64,/, '');
      const imgBuffer = Buffer.from(base64Data, 'base64');
      sigImageRun = new ImageRun({
        data: imgBuffer,
        transformation: { width: 140, height: 50 },
        type: 'png',
      });
    } catch {}
  }

  const sigCellParagraphs: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: 'Notulis,', font: 'Arial', size: 22 })],
      spacing: { after: 30 },
    }),
    new Paragraph({
      children: [new TextRun({ text: sigRole, font: 'Arial', size: 22 })],
      spacing: { after: sigImageRun ? 60 : 600 },
    }),
  ];

  if (sigImageRun) {
    sigCellParagraphs.push(
      new Paragraph({
        children: [sigImageRun],
        spacing: { after: 60 },
      })
    );
  }

  sigCellParagraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: signerInfo.finalSignerName,
          bold: true,
          underline: {},
          font: 'Arial',
          size: 22,
        }),
      ],
      spacing: { after: 40 },
    })
  );

  const signatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBordersNone,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: tableBordersNone,
            width: { size: 5500, type: WidthType.DXA },
            children: [new Paragraph({ children: [] })],
          }),
          new TableCell({
            borders: tableBordersNone,
            width: { size: 3450, type: WidthType.DXA },
            children: sigCellParagraphs,
          }),
        ],
      }),
    ],
  });

  // Assemble Complete Document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906, // A4 Portrait (210 mm)
              height: 16838, // (297 mm)
            },
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: '- ', font: 'Arial', size: 22 }),
                  new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 22 }),
                  new TextRun({ text: ' -', font: 'Arial', size: 22 }),
                ],
              }),
            ],
          }),
        },
        children: [
          // ─── KOP SURAT RESMI ───
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBordersNone,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    borders: tableBordersNone,
                    width: { size: 1400, type: WidthType.DXA },
                    children: emblemBuffer
                      ? [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new ImageRun({
                                data: emblemBuffer,
                                transformation: { width: 68, height: 68 },
                                type: 'png',
                              }),
                            ],
                          }),
                        ]
                      : [],
                  }),
                  new TableCell({
                    borders: tableBordersNone,
                    width: { size: 7550, type: WidthType.DXA },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: 'DEWAN NASIONAL KAWASAN EKONOMI KHUSUS',
                            bold: true,
                            font: 'Arial',
                            size: 24, // 12pt
                          }),
                        ],
                        spacing: { after: 20 },
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: 'SEKRETARIAT JENDERAL',
                            bold: true,
                            font: 'Arial',
                            size: 24, // 12pt
                          }),
                        ],
                        spacing: { after: 40 },
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: 'Gedung MNC Tower Lantai 3, Jl. Kebon Sirih No.17 – 19, Jakarta Pusat 10340',
                            font: 'Arial',
                            size: 17, // 8.5pt
                          }),
                        ],
                        spacing: { after: 10 },
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: 'Telp: (021) 3912491, email: info@kek.go.id',
                            font: 'Arial',
                            size: 17, // 8.5pt
                          }),
                        ],
                        spacing: { after: 40 },
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // Garis Tebal Pemisah Kop Surat
          new Paragraph({
            border: {
              bottom: {
                style: BorderStyle.SINGLE,
                size: 18,
                color: '000000',
              },
            },
            spacing: { after: 240 },
          }),

          // ─── JUDUL DOKUMEN ───
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'NOTULA',
                bold: true,
                font: 'Arial',
                size: 24, // 12pt
              }),
            ],
            spacing: { after: 40 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `NOMOR: ${nomorNaskah}`,
                font: 'Arial',
                size: 22, // 11pt
              }),
            ],
            spacing: { after: 280 },
          }),

          // ─── TABEL METADATA & PELAKSANA ───
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBordersNone,
            rows: tableChildren,
          }),

          // ─── SUBSTANSI INTI PEMBAHASAN RAPAT ───
          new Paragraph({
            children: [
              new TextRun({
                text: 'Substansi Inti Pembahasan Rapat:',
                bold: true,
                font: 'Arial',
                size: 22,
              }),
            ],
            spacing: { before: 240, after: 100 },
          }),
          ...parsedBlocksToDocxParagraphs(discussionBlocks),

          // ─── KESIMPULAN ───
          new Paragraph({
            children: [
              new TextRun({
                text: 'Kesimpulan:',
                bold: true,
                font: 'Arial',
                size: 22,
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),
          ...parsedBlocksToDocxParagraphs(conclusionBlocks),

          // ─── TINDAK LANJUT ───
          new Paragraph({
            children: [
              new TextRun({
                text: 'Tindak Lanjut:',
                bold: true,
                font: 'Arial',
                size: 22,
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),
          ...actionItemParagraphs,

          // ─── TANDA TANGAN ───
          new Paragraph({ spacing: { before: 280 } }),
          signatureTable,
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

// ─── 2. GENERATE NOTA DINAS (.DOCX) ──────────────────────────────────────────
export async function generateNotaDinasDocx(meeting: MeetingPdfData): Promise<Buffer> {
  const notaData = resolveNotaDinasData(meeting, meeting.minutes);

  const discussionBlocks = parseRichText(meeting.minutes?.discussion);
  const conclusionBlocks = parseRichText(meeting.minutes?.conclusion);
  const decisionsBlocks = parseRichText(meeting.minutes?.decisions);
  const actionItems = meeting.actionItems || [];

  // Header Table (Yth., Dari, Hal, Tanggal, Lampiran)
  const headerMetaRows = [
    { label: 'Yth.', value: notaData.recipient },
    { label: 'Dari', value: notaData.sender },
    { label: 'Hal', value: notaData.subject },
    { label: 'Tanggal', value: notaData.dateText },
    { label: 'Lampiran', value: notaData.attachments },
  ];

  const headerTableRows = headerMetaRows.map((r) => {
    return new TableRow({
      children: [
        new TableCell({
          borders: tableBordersNone,
          width: { size: 1400, type: WidthType.DXA },
          children: [
            new Paragraph({
              children: [new TextRun({ text: r.label, font: 'Arial', size: 22 })],
              spacing: { after: 50, line: 260 },
            }),
          ],
        }),
        new TableCell({
          borders: tableBordersNone,
          width: { size: 250, type: WidthType.DXA },
          children: [
            new Paragraph({
              children: [new TextRun({ text: ':', font: 'Arial', size: 22 })],
              spacing: { after: 50, line: 260 },
            }),
          ],
        }),
        new TableCell({
          borders: tableBordersNone,
          width: { size: 7300, type: WidthType.DXA },
          children: [
            new Paragraph({
              children: [new TextRun({ text: r.value, font: 'Arial', size: 22 })],
              spacing: { after: 50, line: 260 },
            }),
          ],
        }),
      ],
    });
  });

  // Action items rendering
  const actionItemParagraphs: Paragraph[] = [];
  if (decisionsBlocks.length > 0) {
    actionItemParagraphs.push(...parsedBlocksToDocxParagraphs(decisionsBlocks));
  } else if (actionItems.length > 0) {
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    actionItems.forEach((ai, idx) => {
      const letter = letters[idx % letters.length];
      const pic = ai.picBiro?.shortName || ai.picUser?.name || 'Tim Kerja';
      const desc = ai.description ? ` (${ai.description})` : '';
      actionItemParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${letter}. ${ai.title}${desc} (PIC: ${pic})`,
              font: 'Arial',
              size: 22,
            }),
          ],
          indent: { left: convertInchesToTwip(0.25) },
          spacing: { after: 80, line: 276 },
          alignment: AlignmentType.JUSTIFIED,
        })
      );
    });
  } else {
    actionItemParagraphs.push(
      new Paragraph({
        children: [new TextRun({ text: '-', font: 'Arial', size: 22 })],
        spacing: { after: 80, line: 276 },
      })
    );
  }

  // Signature Block
  const sigRole = notaData.signerRole.endsWith(',')
    ? notaData.signerRole
    : `${notaData.signerRole},`;

  let sigImageRun: ImageRun | null = null;
  if (
    notaData.signatureImage &&
    typeof notaData.signatureImage === 'string' &&
    notaData.signatureImage.startsWith('data:image')
  ) {
    try {
      const base64Data = notaData.signatureImage.replace(/^data:image\/\w+;base64,/, '');
      const imgBuffer = Buffer.from(base64Data, 'base64');
      sigImageRun = new ImageRun({
        data: imgBuffer,
        transformation: { width: 140, height: 50 },
        type: 'png',
      });
    } catch {}
  }

  const sigCellParagraphs: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: sigRole, font: 'Arial', size: 22 })],
      spacing: { after: sigImageRun ? 60 : 600 },
    }),
  ];

  if (sigImageRun) {
    sigCellParagraphs.push(
      new Paragraph({
        children: [sigImageRun],
        spacing: { after: 60 },
      })
    );
  }

  sigCellParagraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: notaData.signerName,
          bold: true,
          underline: {},
          font: 'Arial',
          size: 22,
        }),
      ],
      spacing: { after: 40 },
    })
  );

  const signatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBordersNone,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: tableBordersNone,
            width: { size: 5200, type: WidthType.DXA },
            children: [new Paragraph({ children: [] })],
          }),
          new TableCell({
            borders: tableBordersNone,
            width: { size: 3750, type: WidthType.DXA },
            children: sigCellParagraphs,
          }),
        ],
      }),
    ],
  });

  // Assemble Complete Nota Dinas Document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906,
              height: 16838,
            },
            margin: {
              top: 1440,
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: '- ', font: 'Arial', size: 22 }),
                  new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 22 }),
                  new TextRun({ text: ' -', font: 'Arial', size: 22 }),
                ],
              }),
            ],
          }),
        },
        children: [
          // ─── KOP RESMI NOTA DINAS (3 Baris Tengah) ───
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'DEWAN NASIONAL KAWASAN EKONOMI KHUSUS',
                bold: true,
                font: 'Arial',
                size: 24, // 12pt
              }),
            ],
            spacing: { after: 20 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'SEKRETARIAT JENDERAL',
                bold: true,
                font: 'Arial',
                size: 24, // 12pt
              }),
            ],
            spacing: { after: 20 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: notaData.biroName,
                bold: true,
                font: 'Arial',
                size: 24, // 12pt
              }),
            ],
            spacing: { after: 60 },
          }),

          // Garis Pemisah Tebal Hitam Standar Nota Dinas
          new Paragraph({
            border: {
              bottom: {
                style: BorderStyle.SINGLE,
                size: 24, // Tebal
                color: '000000',
              },
            },
            spacing: { after: 240 },
          }),

          // ─── JUDUL DOKUMEN: NOTA DINAS & NOMOR ───
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'NOTA DINAS',
                bold: true,
                font: 'Arial',
                size: 24, // 12pt
              }),
            ],
            spacing: { after: 40 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `NOMOR: ${notaData.documentNumber}`,
                font: 'Arial',
                size: 22, // 11pt
              }),
            ],
            spacing: { after: 240 },
          }),

          // ─── TABEL KEPALA NASKAH (Yth., Dari, Hal, Tanggal, Lampiran) ───
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBordersNone,
            rows: headerTableRows,
          }),

          // ─── KALIMAT PENGANTAR / PEMBUKA ───
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            children: [
              new TextRun({
                text: notaData.introText,
                font: 'Arial',
                size: 22,
              }),
            ],
            spacing: { before: 240, after: 140, line: 276 },
            indent: { left: convertInchesToTwip(0.2) },
          }),

          // ─── POKOK-POKOK PEMBAHASAN ───
          new Paragraph({
            children: [
              new TextRun({
                text: 'Pokok-pokok Pembahasan:',
                bold: true,
                font: 'Arial',
                size: 22,
              }),
            ],
            spacing: { before: 140, after: 100 },
          }),
          ...parsedBlocksToDocxParagraphs(discussionBlocks),

          // ─── KESIMPULAN ───
          new Paragraph({
            children: [
              new TextRun({
                text: 'Kesimpulan:',
                bold: true,
                font: 'Arial',
                size: 22,
              }),
            ],
            spacing: { before: 180, after: 100 },
          }),
          ...parsedBlocksToDocxParagraphs(conclusionBlocks),

          // ─── TINDAK LANJUT ───
          new Paragraph({
            children: [
              new TextRun({
                text: 'Tindak Lanjut:',
                bold: true,
                font: 'Arial',
                size: 22,
              }),
            ],
            spacing: { before: 180, after: 100 },
          }),
          ...actionItemParagraphs,

          // ─── TANDA TANGAN PENGIRIM ───
          new Paragraph({ spacing: { before: 280 } }),
          signatureTable,
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
