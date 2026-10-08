/**
 * lib/docx/action-item-docx-generator.ts
 *
 * Generates a Microsoft Word (.docx) document for the Matriks Tindak Lanjut
 * Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus RI.
 *
 * Uses the `docx` package (MIT) — no external API or browser required.
 */
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  VerticalAlign,
  convertInchesToTwip,
  ImageRun,
} from 'docx';

// ─── Colour tokens (matching website palette) ─────────────────────────────────
const TEAL = '31889C';
const TEAL_DARK = '215865';
const TEAL_BG = 'E8F5F7';
const LIGHT_GREY = 'F8FAFC';
const BORDER_GREY = 'E2E8F0';
const RED = 'DC2626';
const AMBER = 'D97706';
const GREEN = '16A34A';
const BLUE_DIM = '4B6CB7';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDateId(d: Date | string | null | undefined): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return String(d);
  }
}

function statusLabel(status: string, isOverdue: boolean): string {
  if (isOverdue) return 'Terlambat';
  switch (status) {
    case 'COMPLETED':   return 'Finish';
    case 'IN_PROGRESS': return 'On Progress';
    case 'PENDING':     return 'Start';
    default:            return status;
  }
}

function statusColor(status: string, isOverdue: boolean): string {
  if (isOverdue) return RED;
  switch (status) {
    case 'COMPLETED':   return GREEN;
    case 'IN_PROGRESS': return TEAL;
    case 'PENDING':     return AMBER;
    default:            return TEAL_DARK;
  }
}

function priorityLabel(p: string): string {
  switch (p) {
    case 'URGENT': return 'Mendesak';
    case 'HIGH':   return 'Tinggi';
    case 'MEDIUM': return 'Sedang';
    case 'LOW':    return 'Rendah';
    default:       return p;
  }
}

/** Thin border definition shared by all table cells */
const THIN_BORDER = {
  top:    { style: BorderStyle.SINGLE, size: 4, color: BORDER_GREY },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_GREY },
  left:   { style: BorderStyle.SINGLE, size: 4, color: BORDER_GREY },
  right:  { style: BorderStyle.SINGLE, size: 4, color: BORDER_GREY },
};

/** Header cell with teal background */
function headerCell(text: string, widthPct: number): TableCell {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: TEAL },
    verticalAlign: VerticalAlign.CENTER,
    borders: THIN_BORDER,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text,
            bold: true,
            size: 18,         // 9 pt
            color: 'FFFFFF',
            font: 'Calibri',
          }),
        ],
      }),
    ],
  });
}

/** Regular data cell */
function dataCell(
  children: Paragraph[],
  widthPct: number,
  shading?: string,
): TableCell {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: shading
      ? { type: ShadingType.CLEAR, fill: shading }
      : undefined,
    verticalAlign: VerticalAlign.TOP,
    borders: THIN_BORDER,
    children,
  });
}

/** Simple paragraph helper */
function para(
  text: string,
  opts?: {
    bold?: boolean;
    italic?: boolean;
    color?: string;
    size?: number;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    spacing?: number;
  },
): Paragraph {
  return new Paragraph({
    alignment: opts?.align ?? AlignmentType.LEFT,
    spacing: opts?.spacing ? { after: opts.spacing } : undefined,
    children: [
      new TextRun({
        text,
        bold: opts?.bold,
        italics: opts?.italic,
        color: opts?.color,
        size: opts?.size ?? 20, // 10 pt default
        font: 'Calibri',
      }),
    ],
  });
}

// ─── Main generator ───────────────────────────────────────────────────────────
export interface ActionItemExportFilters {
  biro?: string;
  status?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export async function generateActionItemDocx(
  items: any[],
  filters: ActionItemExportFilters = {},
): Promise<Buffer> {
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const generatedAt = wib.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }) + ` pukul ${wib.toISOString().slice(11, 16)} WIB`;

  // ── Compute summary counts ────────────────────────────────────────────────
  const total       = items.length;
  const completed   = items.filter((i) => i.status === 'COMPLETED').length;
  const inProgress  = items.filter((i) => i.status === 'IN_PROGRESS').length;
  const overdue     = items.filter(
    (i) => i.status !== 'COMPLETED' && new Date(i.dueDate) < now,
  ).length;
  const pending     = items.filter(
    (i) => i.status === 'PENDING' && new Date(i.dueDate) >= now,
  ).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // ── Active filter description ─────────────────────────────────────────────
  const filterParts: string[] = [];
  if (filters.biro && filters.biro !== 'ALL') filterParts.push(`Biro: ${filters.biro}`);
  if (filters.status && filters.status !== 'ALL') filterParts.push(`Status: ${filters.status}`);
  if (filters.priority && filters.priority !== 'ALL') filterParts.push(`Prioritas: ${filters.priority}`);
  if (filters.startDate) filterParts.push(`Dari: ${filters.startDate}`);
  if (filters.endDate) filterParts.push(`Sampai: ${filters.endDate}`);
  if (filters.search) filterParts.push(`Pencarian: "${filters.search}"`);
  const filterDesc = filterParts.length > 0 ? filterParts.join('  |  ') : 'Seluruh Data (tanpa filter)';

  // ── Build table header row ────────────────────────────────────────────────
  const tableHeaderRow = new TableRow({
    tableHeader: true,
    height: { value: convertInchesToTwip(0.35), rule: 'atLeast' },
    children: [
      headerCell('No.', 4),
      headerCell('Ref. Rapat', 10),
      headerCell('Butir Tindak Lanjut', 26),
      headerCell('Biro & PIC', 14),
      headerCell('Tenggat', 10),
      headerCell('Prioritas', 9),
      headerCell('Status', 11),
      headerCell('Catatan Terakhir', 16),
    ],
  });

  // ── Build data rows ───────────────────────────────────────────────────────
  const dataRows: TableRow[] = items.map((item, idx) => {
    const isOverdue =
      item.status !== 'COMPLETED' && new Date(item.dueDate) < now;
    const rowBg = idx % 2 === 0 ? 'FFFFFF' : LIGHT_GREY;
    const sColor = statusColor(item.status, isOverdue);

    // Last log note (if any)
    const lastLog = item.logs?.[0]; // assumes desc-sorted
    const lastNote = lastLog?.notes
      ? lastLog.notes.length > 120
        ? lastLog.notes.slice(0, 120) + '…'
        : lastLog.notes
      : '—';

    return new TableRow({
      height: { value: convertInchesToTwip(0.3), rule: 'atLeast' },
      children: [
        // No.
        dataCell(
          [para(`${idx + 1}`, { bold: true, size: 18, align: AlignmentType.CENTER, color: TEAL_DARK })],
          4, rowBg,
        ),
        // Ref. Rapat
        dataCell(
          [
            para(item.meeting?.meetingNumber ?? '—', { bold: true, size: 18, color: TEAL }),
            ...(item.meeting?.date
              ? [para(formatDateId(item.meeting.date), { size: 16, color: '64748B', italic: true })]
              : []),
          ],
          10, rowBg,
        ),
        // Butir Tindak Lanjut
        dataCell(
          [
            para(item.title, { bold: true, size: 18 }),
            ...(item.description
              ? [para(item.description, { size: 16, color: '64748B', italic: true })]
              : []),
          ],
          26, rowBg,
        ),
        // Biro & PIC
        dataCell(
          [
            para(item.picBiro?.code ?? '—', { bold: true, size: 18, color: TEAL }),
            para(item.picBiro?.shortName ?? '', { size: 16, color: '64748B' }),
            ...(item.picUser?.name
              ? [para(item.picUser.name, { size: 16, italic: true })]
              : []),
          ],
          14, rowBg,
        ),
        // Tenggat
        dataCell(
          [
            para(formatDateId(item.dueDate), {
              bold: isOverdue,
              size: 18,
              color: isOverdue ? RED : '334155',
            }),
            ...(item.completedAt
              ? [para(`✓ Selesai ${formatDateId(item.completedAt)}`, { size: 16, color: GREEN })]
              : []),
          ],
          10, rowBg,
        ),
        // Prioritas
        dataCell(
          [para(priorityLabel(item.priority), { size: 18, bold: item.priority === 'URGENT' })],
          9, rowBg,
        ),
        // Status
        dataCell(
          [
            para(statusLabel(item.status, isOverdue), {
              bold: true,
              size: 18,
              color: sColor,
            }),
            ...(typeof item.progress === 'number'
              ? [para(`Capaian: ${item.progress}%`, { size: 16, color: '64748B' })]
              : []),
          ],
          11, rowBg,
        ),
        // Catatan Terakhir
        dataCell(
          [
            para(lastNote, { size: 16, italic: true, color: '64748B' }),
            ...(lastLog?.user?.name
              ? [para(`— ${lastLog.user.name}`, { size: 14, color: TEAL })]
              : []),
          ],
          16, rowBg,
        ),
      ],
    });
  });

  // ── Empty state row ───────────────────────────────────────────────────────
  const emptyRow = items.length === 0
    ? [
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 8,
              borders: THIN_BORDER,
              shading: { type: ShadingType.CLEAR, fill: 'FAFAFA' },
              children: [
                para('Tidak ada data tindak lanjut yang sesuai filter.', {
                  italic: true,
                  color: '94A3B8',
                  align: AlignmentType.CENTER,
                }),
              ],
            }),
          ],
        }),
      ]
    : [];

  // ── Summary stats table ────────────────────────────────────────────────────
  const summaryTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: TEAL_BG },
            borders: THIN_BORDER,
            width: { size: 20, type: WidthType.PERCENTAGE },
            children: [
              para('Total Butir', { bold: true, size: 18, color: TEAL_DARK, align: AlignmentType.CENTER }),
              para(`${total}`, { bold: true, size: 32, color: TEAL_DARK, align: AlignmentType.CENTER }),
            ],
          }),
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: 'ECFDF5' },
            borders: THIN_BORDER,
            width: { size: 20, type: WidthType.PERCENTAGE },
            children: [
              para('Selesai', { bold: true, size: 18, color: GREEN, align: AlignmentType.CENTER }),
              para(`${completed}`, { bold: true, size: 32, color: GREEN, align: AlignmentType.CENTER }),
            ],
          }),
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: 'EFF6FF' },
            borders: THIN_BORDER,
            width: { size: 20, type: WidthType.PERCENTAGE },
            children: [
              para('Sedang Berjalan', { bold: true, size: 18, color: BLUE_DIM, align: AlignmentType.CENTER }),
              para(`${inProgress}`, { bold: true, size: 32, color: BLUE_DIM, align: AlignmentType.CENTER }),
            ],
          }),
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: 'FFFBEB' },
            borders: THIN_BORDER,
            width: { size: 20, type: WidthType.PERCENTAGE },
            children: [
              para('Belum Dimulai', { bold: true, size: 18, color: AMBER, align: AlignmentType.CENTER }),
              para(`${pending}`, { bold: true, size: 32, color: AMBER, align: AlignmentType.CENTER }),
            ],
          }),
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: 'FEF2F2' },
            borders: THIN_BORDER,
            width: { size: 20, type: WidthType.PERCENTAGE },
            children: [
              para('Terlambat', { bold: true, size: 18, color: RED, align: AlignmentType.CENTER }),
              para(`${overdue}`, { bold: true, size: 32, color: RED, align: AlignmentType.CENTER }),
            ],
          }),
        ],
      }),
    ],
  });

  // ── Main data table ────────────────────────────────────────────────────────
  const mainTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [tableHeaderRow, ...dataRows, ...emptyRow],
  });

  // ── Assemble document ─────────────────────────────────────────────────────
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.8),
              bottom: convertInchesToTwip(0.8),
              left: convertInchesToTwip(0.9),
              right: convertInchesToTwip(0.75),
            },
            size: {
              // A4 landscape
              width: convertInchesToTwip(11.69),
              height: convertInchesToTwip(8.27),
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus RI',
                    size: 16,
                    color: '64748B',
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Halaman ',
                    size: 16,
                    color: '94A3B8',
                    font: 'Calibri',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: '94A3B8',
                    font: 'Calibri',
                  }),
                  new TextRun({
                    text: ' dari ',
                    size: 16,
                    color: '94A3B8',
                    font: 'Calibri',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: '94A3B8',
                    font: 'Calibri',
                  }),
                  new TextRun({
                    text: `    |    Digenerate: ${generatedAt}`,
                    size: 16,
                    color: '94A3B8',
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // ── Title block ──────────────────────────────────────────────────
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: 'MATRIKS TINDAK LANJUT',
                bold: true,
                size: 40,
                color: TEAL_DARK,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: 'Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus Republik Indonesia',
                size: 22,
                color: '475569',
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: `Digenerate: ${generatedAt}    |    Filter: ${filterDesc}`,
                size: 18,
                color: '94A3B8',
                italics: true,
                font: 'Calibri',
              }),
            ],
          }),

          // ── Summary stats ────────────────────────────────────────────────
          para('REKAPITULASI STATUS TINDAK LANJUT', {
            bold: true,
            size: 20,
            color: TEAL_DARK,
            spacing: 120,
          }),
          summaryTable,

          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: `Tingkat Penyelesaian: ${completionRate}% dari total ${total} butir tindak lanjut.`,
                size: 18,
                bold: true,
                color: completionRate >= 80 ? GREEN : completionRate >= 50 ? AMBER : RED,
                font: 'Calibri',
              }),
            ],
          }),

          new Paragraph({ spacing: { after: 200 }, children: [] }),

          // ── Main table ───────────────────────────────────────────────────
          para(`DAFTAR BUTIR TINDAK LANJUT (${total} Butir)`, {
            bold: true,
            size: 20,
            color: TEAL_DARK,
            spacing: 120,
          }),
          mainTable,

          new Paragraph({ spacing: { after: 400 }, children: [] }),

          // ── Signature block ───────────────────────────────────────────────
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: `Jakarta, ${formatDateId(now)}`,
                size: 20,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: 'Mengetahui,',
                size: 20,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: 'Sekretaris Jenderal',
                bold: true,
                size: 20,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: 'Dewan Nasional Kawasan Ekonomi Khusus RI',
                size: 20,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({ spacing: { after: 800 }, children: [] }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: '(________________________________)',
                size: 20,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: 'NIP. ................................',
                size: 20,
                font: 'Calibri',
              }),
            ],
          }),

          // ── Note ─────────────────────────────────────────────────────────
          new Paragraph({ spacing: { before: 400 }, children: [] }),
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({
                text: 'Dokumen ini digenerate secara otomatis oleh sistem Log & Notulen Rapat Sekretariat Jenderal Dewan Nasional KEK. Keabsahan data mengacu pada database resmi sistem.',
                size: 16,
                italics: true,
                color: '94A3B8',
                font: 'Calibri',
              }),
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
