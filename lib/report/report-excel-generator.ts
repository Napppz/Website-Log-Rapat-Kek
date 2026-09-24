import ExcelJS from 'exceljs';
import { ReportSummaryResult } from './report-service';

function toExcelDate(isoDateStr: string): Date | string {
  if (!isoDateStr) return '-';
  const parts = isoDateStr.split('-');
  if (parts.length < 3) return isoDateStr;
  const y = Number(parts[0]);
  const m = Number(parts[1]) - 1;
  const d = Number(parts[2]);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return isoDateStr;
  return new Date(Date.UTC(y, m, d));
}

export async function generateReportExcel(
  data: ReportSummaryResult
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SIM-RAPAT KEK RI';
  workbook.lastModifiedBy = 'SIM-RAPAT KEK RI';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Palette
  const NAVY_HEADER_FILL: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' },
  };

  const AMBER_TOTAL_FILL: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFEF3C7' },
  };

  const ZEBRA_FILL: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF8FAFC' },
  };

  const THIN_BORDER: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  };

  const DOUBLE_BOTTOM_BORDER: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'double', color: { argb: 'FF78350F' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 1: RINGKASAN
  // ═══════════════════════════════════════════════════════════════════════════
  const s1 = workbook.addWorksheet('Ringkasan', {
    views: [{ showGridLines: true }],
  });

  // Title block
  s1.mergeCells('B2:E2');
  const titleCell = s1.getCell('B2');
  titleCell.value = 'LAPORAN BERKALA AKTIVITAS RAPAT & TINDAK LANJUT';
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF0F172A' } };

  s1.mergeCells('B3:E3');
  const subCell = s1.getCell('B3');
  subCell.value = 'DEWAN NASIONAL KAWASAN EKONOMI KHUSUS REPUBLIK INDONESIA';
  subCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFD97706' } };

  // Metadata block
  s1.getCell('B5').value = 'Parameter Laporan';
  s1.getCell('B5').font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1E293B' } };

  const metaRows = [
    ['Tipe Periode', data.period.period],
    ['Rentang Tanggal', data.period.label],
    ['Filter Biro', data.biro === 'ALL' ? 'Semua Biro' : data.biro],
    ['Tanggal Cetak (WIB)', new Date().toLocaleDateString('id-ID')],
  ];

  metaRows.forEach((r, idx) => {
    const rowNum = 6 + idx;
    s1.getCell(`B${rowNum}`).value = r[0];
    s1.getCell(`B${rowNum}`).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF475569' } };
    s1.getCell(`C${rowNum}`).value = r[1];
    s1.getCell(`C${rowNum}`).font = { name: 'Calibri', size: 10, color: { argb: 'FF0F172A' } };
  });

  // KPI Block
  const kpiStartRow = 11;
  s1.getCell(`B${kpiStartRow}`).value = 'Indikator Kinerja Utama (KPI)';
  s1.getCell(`B${kpiStartRow}`).font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1E293B' } };

  s1.getCell(`B${kpiStartRow + 1}`).value = 'Indikator';
  s1.getCell(`C${kpiStartRow + 1}`).value = 'Nilai';
  s1.getCell(`D${kpiStartRow + 1}`).value = 'Satuan / Keterangan';

  ['B', 'C', 'D'].forEach((col) => {
    const c = s1.getCell(`${col}${kpiStartRow + 1}`);
    c.fill = NAVY_HEADER_FILL;
    c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    c.alignment = { vertical: 'middle', horizontal: col === 'B' ? 'left' : 'center' };
    c.border = THIN_BORDER;
  });

  const kpiData = [
    ['Total Rapat Diselenggarakan', data.kpi.totalMeetings, 'Kegiatan Rapat'],
    ['Total Butir Tindak Lanjut', data.kpi.totalActionItems, 'Butir Rekomendasi/Tugas'],
    ['Tindak Lanjut Selesai (Completed)', data.kpi.completedActionItems, 'Butir Terselesaikan'],
    ['Tindak Lanjut Berjalan (In Progress)', data.kpi.inProgressActionItems, 'Butir Dalam Pengerjaan'],
    ['Tindak Lanjut Menunggu (Pending)', data.kpi.pendingActionItems, 'Butir Belum Dimulai'],
    ['Tindak Lanjut Terlambat (Overdue)', data.kpi.overdueActionItems, 'Butir Melewati Tenggat'],
    ['Tingkat Penyelesaian (Completion Rate)', data.kpi.completionRate / 100, 'Persentase Efektivitas'],
    ['Rapat dengan Notulen Resmi', data.kpi.meetingsWithMinutes, 'Dokumen Tersedia'],
    ['Rapat Belum Ada Notulen', data.kpi.meetingsWithoutMinutes, 'Menunggu Pengisian Notulis'],
  ];

  kpiData.forEach((row, idx) => {
    const curR = kpiStartRow + 2 + idx;
    s1.getCell(`B${curR}`).value = row[0];
    s1.getCell(`C${curR}`).value = row[1];
    s1.getCell(`D${curR}`).value = row[2];

    const bg = idx % 2 === 0 ? undefined : ZEBRA_FILL;
    ['B', 'C', 'D'].forEach((col) => {
      const cell = s1.getCell(`${col}${curR}`);
      cell.border = THIN_BORDER;
      cell.font = { name: 'Calibri', size: 10 };
      if (bg) cell.fill = bg;
    });

    s1.getCell(`B${curR}`).alignment = { vertical: 'middle', horizontal: 'left' };
    s1.getCell(`C${curR}`).alignment = { vertical: 'middle', horizontal: 'center' };
    s1.getCell(`D${curR}`).alignment = { vertical: 'middle', horizontal: 'left' };

    // Format completion rate as percentage
    if (idx === 6) {
      s1.getCell(`C${curR}`).numFmt = '0.0%';
      s1.getCell(`C${curR}`).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF059669' } };
    } else if (idx === 5 && data.kpi.overdueActionItems > 0) {
      s1.getCell(`C${curR}`).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFDC2626' } };
    }
  });

  s1.getColumn('A').width = 4;
  s1.getColumn('B').width = 38;
  s1.getColumn('C').width = 20;
  s1.getColumn('D').width = 32;

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 2: REKAP BIRO
  // ═══════════════════════════════════════════════════════════════════════════
  const s2 = workbook.addWorksheet('Rekap Biro', {
    views: [{ state: 'frozen', ySplit: 3, showGridLines: true }],
  });

  s2.mergeCells('A1:H1');
  const s2Title = s2.getCell('A1');
  s2Title.value = `REKAPITULASI KINERJA PER BIRO — ${data.period.label.toUpperCase()}`;
  s2Title.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF0F172A' } };

  const s2Headers = [
    'Biro',
    'Total Rapat',
    'Total Tindak Lanjut',
    'Menunggu',
    'Berjalan',
    'Selesai',
    'Terlambat',
    'Completion Rate',
  ];

  const s2HeaderRow = s2.getRow(3);
  s2HeaderRow.values = s2Headers;
  s2HeaderRow.height = 24;

  s2Headers.forEach((_, idx) => {
    const colNum = idx + 1;
    const c = s2HeaderRow.getCell(colNum);
    c.fill = NAVY_HEADER_FILL;
    c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    c.alignment = { vertical: 'middle', horizontal: colNum === 1 ? 'left' : 'center' };
    c.border = THIN_BORDER;
  });

  // Enable auto-filter
  s2.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: 3 + data.biroSummary.length, column: 8 },
  };

  data.biroSummary.forEach((b, idx) => {
    const rowNum = 4 + idx;
    const row = s2.getRow(rowNum);
    row.height = 20;
    row.values = [
      `${b.code} - ${b.shortName}`,
      b.totalMeetings,
      b.totalActionItems,
      b.pending,
      b.inProgress,
      b.completed,
      b.overdue,
      b.completionRate / 100,
    ];

    const bg = idx % 2 === 0 ? undefined : ZEBRA_FILL;
    for (let c = 1; c <= 8; c++) {
      const cell = row.getCell(c);
      cell.border = THIN_BORDER;
      cell.font = { name: 'Calibri', size: 10 };
      cell.alignment = { vertical: 'middle', horizontal: c === 1 ? 'left' : 'center' };
      if (bg) cell.fill = bg;
    }

    row.getCell(8).numFmt = '0.0%';
    if (b.overdue > 0) {
      row.getCell(7).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFDC2626' } };
    }
  });

  // Total row
  const totalRowNum = 4 + data.biroSummary.length;
  const tRow = s2.getRow(totalRowNum);
  tRow.height = 22;
  tRow.values = [
    'TOTAL',
    data.biroTotalRow.totalMeetings,
    data.biroTotalRow.totalActionItems,
    data.biroTotalRow.pending,
    data.biroTotalRow.inProgress,
    data.biroTotalRow.completed,
    data.biroTotalRow.overdue,
    data.biroTotalRow.completionRate / 100,
  ];

  for (let c = 1; c <= 8; c++) {
    const cell = tRow.getCell(c);
    cell.fill = AMBER_TOTAL_FILL;
    cell.border = DOUBLE_BOTTOM_BORDER;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF78350F' } };
    cell.alignment = { vertical: 'middle', horizontal: c === 1 ? 'left' : 'center' };
  }
  tRow.getCell(8).numFmt = '0.0%';

  s2.getColumn(1).width = 30;
  s2.getColumn(2).width = 14;
  s2.getColumn(3).width = 20;
  s2.getColumn(4).width = 14;
  s2.getColumn(5).width = 14;
  s2.getColumn(6).width = 14;
  s2.getColumn(7).width = 14;
  s2.getColumn(8).width = 18;

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 3: TREND
  // ═══════════════════════════════════════════════════════════════════════════
  const s3 = workbook.addWorksheet('Trend', {
    views: [{ state: 'frozen', ySplit: 3, showGridLines: true }],
  });

  s3.mergeCells('A1:E1');
  const s3Title = s3.getCell('A1');
  s3Title.value = `TREN DISTRIBUSI AKTIVITAS RAPAT & TINDAK LANJUT — ${data.period.label.toUpperCase()}`;
  s3Title.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF0F172A' } };

  const s3Headers = [
    'Periode',
    'Total Rapat',
    'Tindak Lanjut',
    'Selesai',
    'Terlambat',
  ];

  const s3HeaderRow = s3.getRow(3);
  s3HeaderRow.values = s3Headers;
  s3HeaderRow.height = 24;

  s3Headers.forEach((_, idx) => {
    const colNum = idx + 1;
    const c = s3HeaderRow.getCell(colNum);
    c.fill = NAVY_HEADER_FILL;
    c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    c.alignment = { vertical: 'middle', horizontal: colNum === 1 ? 'left' : 'center' };
    c.border = THIN_BORDER;
  });

  s3.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: 3 + data.trend.length, column: 5 },
  };

  data.trend.forEach((tr, idx) => {
    const rowNum = 4 + idx;
    const row = s3.getRow(rowNum);
    row.height = 20;
    const labelFull = tr.subLabel ? `${tr.label} (${tr.subLabel})` : tr.label;
    row.values = [
      labelFull,
      tr.totalMeetings,
      tr.totalActionItems,
      tr.completed,
      tr.overdue,
    ];

    const bg = idx % 2 === 0 ? undefined : ZEBRA_FILL;
    for (let c = 1; c <= 5; c++) {
      const cell = row.getCell(c);
      cell.border = THIN_BORDER;
      cell.font = { name: 'Calibri', size: 10 };
      cell.alignment = { vertical: 'middle', horizontal: c === 1 ? 'left' : 'center' };
      if (bg) cell.fill = bg;
    }

    if (tr.overdue > 0) {
      row.getCell(5).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFDC2626' } };
    }
  });

  s3.getColumn(1).width = 28;
  s3.getColumn(2).width = 16;
  s3.getColumn(3).width = 18;
  s3.getColumn(4).width = 16;
  s3.getColumn(5).width = 16;

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 4: RAPAT
  // ═══════════════════════════════════════════════════════════════════════════
  const s4 = workbook.addWorksheet('Rapat', {
    views: [{ state: 'frozen', ySplit: 3, showGridLines: true }],
  });

  s4.mergeCells('A1:F1');
  const s4Title = s4.getCell('A1');
  s4Title.value = `DAFTAR RAPAT DAN KETERSEDIAAN NOTULEN — ${data.period.label.toUpperCase()}`;
  s4Title.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF0F172A' } };

  const s4Headers = [
    'No',
    'Nomor Rapat',
    'Judul Rapat',
    'Tanggal',
    'Biro',
    'Notulen',
  ];

  const s4HeaderRow = s4.getRow(3);
  s4HeaderRow.values = s4Headers;
  s4HeaderRow.height = 24;

  s4Headers.forEach((_, idx) => {
    const colNum = idx + 1;
    const c = s4HeaderRow.getCell(colNum);
    c.fill = NAVY_HEADER_FILL;
    c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    c.alignment = { vertical: 'middle', horizontal: colNum <= 3 ? 'left' : 'center' };
    c.border = THIN_BORDER;
  });

  s4.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: Math.max(4, 3 + data.meetings.length), column: 6 },
  };

  data.meetings.forEach((m, idx) => {
    const rowNum = 4 + idx;
    const row = s4.getRow(rowNum);
    row.height = 20;

    const excelDate = toExcelDate(m.date);

    row.values = [
      idx + 1,
      m.meetingNumber,
      m.title,
      excelDate,
      m.biroCode,
      m.statusNotulen,
    ];

    const bg = idx % 2 === 0 ? undefined : ZEBRA_FILL;
    for (let c = 1; c <= 6; c++) {
      const cell = row.getCell(c);
      cell.border = THIN_BORDER;
      cell.font = { name: 'Calibri', size: 10 };
      cell.alignment = {
        vertical: 'middle',
        horizontal: c === 1 ? 'center' : c <= 3 ? 'left' : 'center',
        wrapText: c === 3,
      };
      if (bg) cell.fill = bg;
    }

    if (excelDate instanceof Date) {
      row.getCell(4).numFmt = 'DD/MM/YYYY';
    }

    if (m.hasMinutes) {
      row.getCell(6).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF059669' } };
    } else {
      row.getCell(6).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFDC2626' } };
    }
  });

  s4.getColumn(1).width = 8;
  s4.getColumn(2).width = 22;
  s4.getColumn(3).width = 48;
  s4.getColumn(4).width = 16;
  s4.getColumn(5).width = 14;
  s4.getColumn(6).width = 18;

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
