import ExcelJS from 'exceljs';
import { computeActionItemStatus } from '@/lib/validations/action-item';

// ─── Translation maps ─────────────────────────────────────────────────────────

const PRIORITY_MAP: Record<string, string> = {
  LOW: 'Rendah',
  MEDIUM: 'Sedang',
  HIGH: 'Tinggi',
  URGENT: 'Mendesak',
};

const STATUS_MAP: Record<string, string> = {
  PENDING: 'Menunggu',
  IN_PROGRESS: 'Berjalan',
  COMPLETED: 'Selesai',
  OVERDUE: 'Terlambat',
};

const OFFICIAL_BIROS = ['BPPK', 'PKKEK', 'IKK', 'HSDMO', 'UK'] as const;
type BiroCode = (typeof OFFICIAL_BIROS)[number];

const BIRO_FULL_NAMES: Record<BiroCode, string> = {
  BPPK: 'Biro Perencanaan dan Pembentukan Kawasan Ekonomi Khusus',
  PKKEK: 'Biro Pengendalian Kawasan Ekonomi Khusus',
  IKK: 'Biro Investasi, Kerja Sama, dan Komunikasi',
  HSDMO: 'Biro Hukum, Sumber Daya Manusia, dan Organisasi',
  UK: 'Biro Umum dan Keuangan',
};

// ─── Filter label helpers ──────────────────────────────────────────────────────

function biroLabel(biro: string): string {
  if (!biro || biro === 'ALL') return 'Semua Biro';
  return `${biro} – ${BIRO_FULL_NAMES[biro as BiroCode] ?? biro}`;
}

function statusLabel(status: string): string {
  if (!status || status === 'ALL') return 'Semua Status';
  return STATUS_MAP[status] ?? status;
}

function priorityLabel(priority: string): string {
  if (!priority || priority === 'ALL') return 'Semua Prioritas';
  return PRIORITY_MAP[priority] ?? priority;
}

function periodLabel(startDate?: string, endDate?: string): string {
  if (!startDate && !endDate) return 'Semua Periode';
  if (startDate && endDate) return `${startDate} s/d ${endDate}`;
  if (startDate) return `Mulai ${startDate}`;
  return `Sampai ${endDate}`;
}

// ─── Date helpers ──────────────────────────────────────────────────────────────

/**
 * Converts a JS Date to a local dd/mm/yyyy string using WIB (UTC+7).
 * We do NOT use toLocaleDateString() because the server may use a different locale.
 */
function toIndonesianDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  // Convert to WIB (UTC+7)
  const wib = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const day = String(wib.getUTCDate()).padStart(2, '0');
  const month = String(wib.getUTCMonth() + 1).padStart(2, '0');
  const year = wib.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Returns an ExcelJS Date number for a JS Date object so Excel renders it
 * as a proper date cell (not as an ISO string). Timezone: WIB (UTC+7).
 */
function toExcelDate(date: Date | string | null | undefined): Date | string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  // Shift to WIB midnight to prevent off-by-one across UTC boundary
  const wib = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  // Return a Date object that ExcelJS will format as a date cell
  return new Date(
    Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate())
  );
}

// ─── Type for raw ActionItem data from Prisma ────────────────────────────────

export interface RawActionItemForExport {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date;
  status: string;
  priority: string;
  completedAt: Date | null;
  meeting: {
    meetingNumber: string;
    title: string;
    date: Date;
  };
  picBiro: {
    code: string;
    name: string;
  } | null;
  picUser: {
    name: string;
  } | null;
}

export interface ExportQueryParams {
  biro?: string;
  status?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

// ─── Main export function ─────────────────────────────────────────────────────

export async function generateActionItemExcel(
  rawItems: RawActionItemForExport[],
  params: ExportQueryParams
): Promise<Buffer> {
  // 1. Enrich each item with computeActionItemStatus (Stage 5 helper)
  const enriched = rawItems.map((item) => {
    const computed = computeActionItemStatus(item);
    return { ...item, computedStatus: computed.computedStatus, isOverdue: computed.isOverdue };
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SIM-RAPAT KEK RI';
  workbook.lastModifiedBy = 'SIM-RAPAT KEK RI';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.properties.date1904 = false;

  // ─── Sheet 1: Matriks Tindak Lanjut ────────────────────────────────────────

  const matrixSheet = workbook.addWorksheet('Matriks Tindak Lanjut', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 3 }], // freeze rows 1-3 (title + header)
  });

  // Title rows
  const titleRow1 = matrixSheet.addRow(['LAPORAN MATRIKS TINDAK LANJUT — SIM-RAPAT KEK RI']);
  titleRow1.height = 22;
  titleRow1.getCell(1).font = { bold: true, size: 13, color: { argb: 'FF1E3A8A' } };
  titleRow1.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };

  const exportedAt = new Date();
  const titleRow2 = matrixSheet.addRow([
    `Tanggal Export: ${toIndonesianDate(exportedAt)} | Biro: ${biroLabel(params.biro ?? 'ALL')} | Status: ${statusLabel(params.status ?? 'ALL')} | Prioritas: ${priorityLabel(params.priority ?? 'ALL')} | Periode: ${periodLabel(params.startDate, params.endDate)}`,
  ]);
  titleRow2.height = 16;
  titleRow2.getCell(1).font = { size: 9, color: { argb: 'FF64748B' } };
  titleRow2.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };

  // Blank row before table header
  matrixSheet.addRow([]);

  // Column definitions
  const columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Nomor Rapat', key: 'meetingNumber', width: 16 },
    { header: 'Judul Rapat', key: 'meetingTitle', width: 30 },
    { header: 'Tanggal Rapat', key: 'meetingDate', width: 15 },
    { header: 'Tindak Lanjut', key: 'title', width: 40 },
    { header: 'Deskripsi', key: 'description', width: 45 },
    { header: 'PIC Biro', key: 'picBiro', width: 25 },
    { header: 'PIC', key: 'picUser', width: 30 },
    { header: 'Deadline', key: 'deadline', width: 15 },
    { header: 'Prioritas', key: 'priority', width: 15 },
    { header: 'Status', key: 'status', width: 18 },
    { header: 'Selesai Pada', key: 'completedAt', width: 15 },
  ];

  matrixSheet.columns = columns.map((c) => ({
    key: c.key,
    width: c.width,
  }));

  // Header row (row 4 because rows 1-3 are title)
  const headerRow = matrixSheet.addRow(columns.map((c) => c.header));
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: false };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF1E3A8A' } },
      left: { style: 'thin', color: { argb: 'FF1E3A8A' } },
      bottom: { style: 'thin', color: { argb: 'FF1E3A8A' } },
      right: { style: 'thin', color: { argb: 'FF1E3A8A' } },
    };
  });

  // Data rows
  if (enriched.length === 0) {
    const emptyRow = matrixSheet.addRow([
      '',
      '',
      'Tidak terdapat data tindak lanjut sesuai filter yang dipilih.',
    ]);
    emptyRow.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };
    emptyRow.getCell(3).font = { italic: true, color: { argb: 'FF64748B' } };
  } else {
    enriched.forEach((item, index) => {
      const rowNum = index + 1;
      const isEven = index % 2 === 0;
      const bgColor = isEven ? 'FFFFFFFF' : 'FFF8FAFC'; // white or very light blue-gray

      const meetingDateVal = toExcelDate(item.meeting.date);
      const deadlineVal = toExcelDate(item.dueDate);
      const completedAtVal = item.completedAt ? toExcelDate(item.completedAt) : null;

      const dataRow = matrixSheet.addRow([
        rowNum,
        item.meeting.meetingNumber,
        item.meeting.title,
        meetingDateVal instanceof Date ? meetingDateVal : toIndonesianDate(item.meeting.date),
        item.title,
        item.description ?? '',
        item.picBiro?.code ?? 'Biro KEK',
        item.picUser?.name ?? 'Belum ditentukan',
        deadlineVal instanceof Date ? deadlineVal : toIndonesianDate(item.dueDate),
        PRIORITY_MAP[item.priority] ?? item.priority,
        STATUS_MAP[item.computedStatus] ?? item.computedStatus,
        completedAtVal instanceof Date
          ? completedAtVal
          : completedAtVal === null
            ? '-'
            : toIndonesianDate(item.completedAt),
      ]);

      dataRow.height = 20;

      dataRow.eachCell((cell, colNumber) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.border = {
          top: { style: 'hair', color: { argb: 'FFE2E8F0' } },
          left: { style: 'hair', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } },
          right: { style: 'hair', color: { argb: 'FFE2E8F0' } },
        };
        cell.alignment = { vertical: 'top', wrapText: false };

        // Column-specific styling
        if (colNumber === 1) {
          // No
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.font = { size: 9, color: { argb: 'FF64748B' } };
        } else if (colNumber === 2) {
          // Nomor Rapat
          cell.font = { bold: true, size: 9, color: { argb: 'FFB45309' } };
        } else if (colNumber === 3 || colNumber === 5) {
          // Judul Rapat & Tindak Lanjut — wrap
          cell.alignment = { vertical: 'top', wrapText: true };
          cell.font = { size: 9 };
        } else if (colNumber === 6) {
          // Deskripsi — wrap
          cell.alignment = { vertical: 'top', wrapText: true };
          cell.font = { size: 9, color: { argb: 'FF475569' } };
        } else if (colNumber === 7) {
          // PIC Biro
          cell.font = { bold: true, size: 9, color: { argb: 'FF1E3A8A' } };
        } else if (colNumber === 10) {
          // Prioritas color coding
          const priority = item.priority;
          const priorityColor =
            priority === 'URGENT'
              ? 'FFDC2626'
              : priority === 'HIGH'
                ? 'FFD97706'
                : priority === 'MEDIUM'
                  ? 'FF2563EB'
                  : 'FF64748B';
          cell.font = { bold: true, size: 9, color: { argb: priorityColor } };
        } else if (colNumber === 11) {
          // Status color coding
          const status = item.computedStatus;
          const statusColor =
            status === 'OVERDUE'
              ? 'FFDC2626'
              : status === 'COMPLETED'
                ? 'FF059669'
                : status === 'IN_PROGRESS'
                  ? 'FFD97706'
                  : 'FF64748B';
          cell.font = { bold: true, size: 9, color: { argb: statusColor } };
        } else {
          cell.font = { size: 9 };
        }

        // Format date cells
        if ([4, 9, 12].includes(colNumber) && cell.value instanceof Date) {
          cell.numFmt = 'dd/mm/yyyy';
        }
      });

      // Overdue row highlight: faint red background for status column
      if (item.isOverdue && item.computedStatus === 'OVERDUE') {
        dataRow.getCell(11).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF1F1' },
        };
      }
    });

    // Autofilter on header row (row 4)
    const lastDataRow = 3 + 1 + enriched.length; // 3 title rows + 1 header + data
    matrixSheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: lastDataRow, column: 12 },
    };
  }

  // Merge title row across all 12 columns
  matrixSheet.mergeCells('A1:L1');
  matrixSheet.mergeCells('A2:L2');
  matrixSheet.mergeCells('A3:L3');

  // ─── Sheet 2: Ringkasan ─────────────────────────────────────────────────────

  const summarySheet = workbook.addWorksheet('Ringkasan', {
    pageSetup: { paperSize: 9, orientation: 'portrait' },
  });

  // Helper to add a styled section title
  function addSectionHeader(text: string, row: number) {
    const r = summarySheet.getRow(row);
    r.getCell(1).value = text;
    r.getCell(1).font = { bold: true, size: 11, color: { argb: 'FF1E3A8A' } };
    r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
    r.height = 20;
    summarySheet.mergeCells(row, 1, row, 4);
  }

  // Helper to add a table header row
  function addTableHeader(
    rowIndex: number,
    headers: string[],
    colCount: number
  ) {
    const r = summarySheet.getRow(rowIndex);
    headers.forEach((h, i) => {
      r.getCell(i + 1).value = h;
      r.getCell(i + 1).font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
      r.getCell(i + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
      r.getCell(i + 1).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(i + 1).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    r.height = 18;
  }

  // Helper to add a data row to a summary table
  function addTableDataRow(
    rowIndex: number,
    values: (string | number)[],
    isEven: boolean
  ) {
    const r = summarySheet.getRow(rowIndex);
    const bg = isEven ? 'FFF8FAFC' : 'FFFFFFFF';
    values.forEach((v, i) => {
      r.getCell(i + 1).value = v;
      r.getCell(i + 1).font = { size: 9 };
      r.getCell(i + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      r.getCell(i + 1).alignment = {
        horizontal: i === 0 ? 'left' : 'center',
        vertical: 'middle',
      };
      r.getCell(i + 1).border = {
        top: { style: 'hair' },
        left: { style: 'hair' },
        bottom: { style: 'hair' },
        right: { style: 'hair' },
      };
    });
    r.height = 16;
  }

  summarySheet.getColumn(1).width = 32;
  summarySheet.getColumn(2).width = 12;
  summarySheet.getColumn(3).width = 12;
  summarySheet.getColumn(4).width = 12;
  summarySheet.getColumn(5).width = 12;
  summarySheet.getColumn(6).width = 12;

  // ── Section A: Report metadata ─────────────────────────────────────────────
  let rowIdx = 1;

  const reportTitle = summarySheet.getRow(rowIdx);
  reportTitle.getCell(1).value = 'LAPORAN MATRIKS TINDAK LANJUT';
  reportTitle.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF1E3A8A' } };
  reportTitle.height = 26;
  summarySheet.mergeCells(rowIdx, 1, rowIdx, 6);
  rowIdx++;

  const subTitle = summarySheet.getRow(rowIdx);
  subTitle.getCell(1).value =
    'Sistem Informasi Manajemen Rapat & Tindak Lanjut — Dewan Nasional Kawasan Ekonomi Khusus RI';
  subTitle.getCell(1).font = { size: 10, color: { argb: 'FF475569' }, italic: true };
  subTitle.height = 18;
  summarySheet.mergeCells(rowIdx, 1, rowIdx, 6);
  rowIdx++;

  summarySheet.getRow(rowIdx).height = 8; // spacer
  rowIdx++;

  addSectionHeader('INFORMASI EXPORT', rowIdx);
  rowIdx++;

  const metaRows: [string, string][] = [
    ['Tanggal Export', toIndonesianDate(exportedAt)],
    ['Filter Biro', biroLabel(params.biro ?? 'ALL')],
    ['Filter Status', statusLabel(params.status ?? 'ALL')],
    ['Filter Prioritas', priorityLabel(params.priority ?? 'ALL')],
    ['Periode (Deadline)', periodLabel(params.startDate, params.endDate)],
    ['Kata Kunci Pencarian', params.search?.trim() || '(Tidak ada)'],
    ['Total Data', String(enriched.length)],
  ];

  metaRows.forEach(([label, value], i) => {
    const r = summarySheet.getRow(rowIdx);
    r.getCell(1).value = label;
    r.getCell(1).font = { bold: true, size: 9 };
    r.getCell(2).value = value;
    r.getCell(2).font = { size: 9 };
    r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF' } };
    summarySheet.mergeCells(rowIdx, 2, rowIdx, 6);
    r.height = 16;
    rowIdx++;
  });

  summarySheet.getRow(rowIdx).height = 10; // spacer
  rowIdx++;

  // ── Section B: Summary by Status ──────────────────────────────────────────
  addSectionHeader('REKAPITULASI PER STATUS', rowIdx);
  rowIdx++;

  addTableHeader(rowIdx, ['Status', 'Jumlah'], 2);
  rowIdx++;

  const statusGroups = [
    { label: 'Menunggu', key: 'PENDING' },
    { label: 'Berjalan', key: 'IN_PROGRESS' },
    { label: 'Selesai', key: 'COMPLETED' },
    { label: 'Terlambat', key: 'OVERDUE' },
  ];

  let statusTotal = 0;
  statusGroups.forEach(({ label, key }, i) => {
    const count = enriched.filter((item) => item.computedStatus === key).length;
    statusTotal += count;
    addTableDataRow(rowIdx, [label, count], i % 2 === 0);
    rowIdx++;
  });

  // Total row
  const statusTotalRow = summarySheet.getRow(rowIdx);
  statusTotalRow.getCell(1).value = 'TOTAL';
  statusTotalRow.getCell(1).font = { bold: true, size: 9 };
  statusTotalRow.getCell(2).value = statusTotal;
  statusTotalRow.getCell(2).font = { bold: true, size: 9 };
  [1, 2].forEach((c) => {
    statusTotalRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
    statusTotalRow.getCell(c).border = { top: { style: 'medium' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    statusTotalRow.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' };
  });
  statusTotalRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
  summarySheet.getRow(rowIdx).height = 18;
  rowIdx++;

  summarySheet.getRow(rowIdx).height = 10; // spacer
  rowIdx++;

  // ── Section C: Summary by Priority ────────────────────────────────────────
  addSectionHeader('REKAPITULASI PER PRIORITAS', rowIdx);
  rowIdx++;

  addTableHeader(rowIdx, ['Prioritas', 'Jumlah'], 2);
  rowIdx++;

  const priorityGroups = [
    { label: 'Rendah', key: 'LOW' },
    { label: 'Sedang', key: 'MEDIUM' },
    { label: 'Tinggi', key: 'HIGH' },
    { label: 'Mendesak', key: 'URGENT' },
  ];

  let priorityTotal = 0;
  priorityGroups.forEach(({ label, key }, i) => {
    const count = enriched.filter((item) => item.priority === key).length;
    priorityTotal += count;
    addTableDataRow(rowIdx, [label, count], i % 2 === 0);
    rowIdx++;
  });

  // Total row
  const priorityTotalRow = summarySheet.getRow(rowIdx);
  priorityTotalRow.getCell(1).value = 'TOTAL';
  priorityTotalRow.getCell(1).font = { bold: true, size: 9 };
  priorityTotalRow.getCell(2).value = priorityTotal;
  priorityTotalRow.getCell(2).font = { bold: true, size: 9 };
  [1, 2].forEach((c) => {
    priorityTotalRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
    priorityTotalRow.getCell(c).border = { top: { style: 'medium' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    priorityTotalRow.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' };
  });
  priorityTotalRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
  summarySheet.getRow(rowIdx).height = 18;
  rowIdx++;

  summarySheet.getRow(rowIdx).height = 10; // spacer
  rowIdx++;

  // ── Section D: Summary by Biro ─────────────────────────────────────────────
  addSectionHeader('REKAPITULASI PER BIRO', rowIdx);
  rowIdx++;

  const biroFilter = params.biro && params.biro !== 'ALL' ? params.biro : null;
  const birosToShow: string[] = biroFilter
    ? [biroFilter]
    : [...OFFICIAL_BIROS];

  addTableHeader(rowIdx, ['Kode Biro', 'Total', 'Menunggu', 'Berjalan', 'Selesai', 'Terlambat'], 6);
  rowIdx++;

  let biroGrandTotal = 0;
  birosToShow.forEach((code, i) => {
    const biroItems = enriched.filter((item) => item.picBiro?.code === code);
    const total = biroItems.length;
    const pending = biroItems.filter((item) => item.computedStatus === 'PENDING').length;
    const inProgress = biroItems.filter((item) => item.computedStatus === 'IN_PROGRESS').length;
    const completed = biroItems.filter((item) => item.computedStatus === 'COMPLETED').length;
    const overdue = biroItems.filter((item) => item.computedStatus === 'OVERDUE').length;
    biroGrandTotal += total;
    addTableDataRow(rowIdx, [code, total, pending, inProgress, completed, overdue], i % 2 === 0);
    rowIdx++;
  });

  // Biro total row
  const biroTotalRow = summarySheet.getRow(rowIdx);
  const biroHeaders = ['TOTAL', biroGrandTotal, '', '', '', ''];
  const biroTotalPending = enriched.filter((i) => i.computedStatus === 'PENDING').length;
  const biroTotalInProgress = enriched.filter((i) => i.computedStatus === 'IN_PROGRESS').length;
  const biroTotalCompleted = enriched.filter((i) => i.computedStatus === 'COMPLETED').length;
  const biroTotalOverdue = enriched.filter((i) => i.computedStatus === 'OVERDUE').length;
  [
    'TOTAL',
    biroGrandTotal,
    biroTotalPending,
    biroTotalInProgress,
    biroTotalCompleted,
    biroTotalOverdue,
  ].forEach((v, c) => {
    biroTotalRow.getCell(c + 1).value = v;
    biroTotalRow.getCell(c + 1).font = { bold: true, size: 9 };
    biroTotalRow.getCell(c + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
    biroTotalRow.getCell(c + 1).border = { top: { style: 'medium' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    biroTotalRow.getCell(c + 1).alignment = { horizontal: c === 0 ? 'left' : 'center', vertical: 'middle' };
  });
  summarySheet.getRow(rowIdx).height = 18;

  // ── Buffer out ─────────────────────────────────────────────────────────────
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
