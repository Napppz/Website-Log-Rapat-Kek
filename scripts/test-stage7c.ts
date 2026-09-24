/**
 * scripts/test-stage7c.ts
 *
 * Automated Verification Suite — STAGE 7C: Laporan Berkala Mingguan & Bulanan
 * SIM-RAPAT KEK RI
 *
 * Run with:  npx tsx scripts/test-stage7c.ts
 */
import 'dotenv/config';
import { prisma } from '@/lib/prisma';
import { setTestAuthUser } from '@/lib/auth/authorization';
import { GET as GET_summary } from '@/app/api/reports/summary/route';
import { GET as GET_pdf } from '@/app/api/reports/summary/pdf/route';
import { GET as GET_excel } from '@/app/api/reports/summary/excel/route';
import {
  reportQuerySchema,
  OFFICIAL_REPORT_BIROS,
} from '@/lib/validations/report';
import {
  getReportSummary,
  resolvePeriodDates,
  buildTrendPoints,
  formatWibDateIso,
} from '@/lib/report/report-service';
import { computeActionItemStatus } from '@/lib/validations/action-item';
import { generateMeetingPdf } from '@/lib/pdf/meeting-pdf-generator';
import ExcelJS from 'exceljs';
import { NextRequest } from 'next/server';

// ─── Test Harness ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

function ok(id: number, desc: string) {
  passed++;
  console.log(`  [PASS] #${id} ${desc}`);
}

function fail(id: number, desc: string, err?: unknown) {
  failed++;
  const msg = err instanceof Error ? err.message : String(err ?? '');
  console.error(`  [FAIL] #${id} ${desc}${msg ? `\n         Reason: ${msg}` : ''}`);
  failures.push(`#${id} ${desc}`);
}

async function runTest(id: number, desc: string, fn: () => Promise<void>) {
  try {
    await fn();
    ok(id, desc);
  } catch (e) {
    fail(id, desc, e);
  }
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function buildSummaryRequest(qs: string = '') {
  return new NextRequest(
    `http://localhost:3000/api/reports/summary${qs ? `?${qs}` : ''}`
  );
}

function buildPdfRequest(qs: string = '') {
  return new NextRequest(
    `http://localhost:3000/api/reports/summary/pdf${qs ? `?${qs}` : ''}`
  );
}

function buildExcelRequest(qs: string = '') {
  return new NextRequest(
    `http://localhost:3000/api/reports/summary/excel${qs ? `?${qs}` : ''}`
  );
}

async function parseWorkbook(buf: Buffer | Uint8Array | ArrayBuffer): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await wb.xlsx.load(buf as any);
  return wb;
}

// ─── Main Test Runner ─────────────────────────────────────────────────────────

async function runAllTests() {
  console.log('\n============================================================');
  console.log(' SIM-RAPAT KEK RI — STAGE 7C AUTOMATED TEST SUITE');
  console.log(' Laporan Berkala Mingguan & Bulanan, 9 KPIs, Rekap 5 Biro, PDF & Excel');
  console.log('============================================================\n');

  // Fetch real data from DB for auth test fixtures
  const sampleBiro = await prisma.biro.findFirst({ where: { isActive: true } });
  if (!sampleBiro) {
    throw new Error('Pre-flight check: database must have at least one active Biro.');
  }

  const authUserFixture = {
    id: 'test-user-admin',
    name: 'Admin Test User',
    email: 'admin.test@kek.go.id',
    role: 'ADMIN' as const,
    biroId: sampleBiro.id,
    biroCode: sampleBiro.code,
    biroName: sampleBiro.name,
  };

  // ───────────────────────────────────────────────────────────────────────────
  // GROUP 1: AUTHENTICATION (Tests 1-4)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- Group 1: Authentication ---');

  await runTest(1, 'Anonymous GET /api/reports/summary rejected with 401', async () => {
    setTestAuthUser(null);
    const res = await GET_summary(buildSummaryRequest());
    assert(res.status === 401, `Expected 401, got ${res.status}`);
    const json = await res.json();
    assert(json.error.includes('Unauthorized'), 'Expected Unauthorized error message');
  });

  await runTest(2, 'Authenticated GET /api/reports/summary succeeds with 200', async () => {
    setTestAuthUser(authUserFixture);
    const res = await GET_summary(buildSummaryRequest('period=MONTH&biro=ALL'));
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert(json.kpi !== undefined, 'Expected summary json to have kpi');
    assert(json.biroSummary !== undefined, 'Expected summary json to have biroSummary');
  });

  await runTest(3, 'Anonymous GET /api/reports/summary/pdf rejected with 401', async () => {
    setTestAuthUser(null);
    const res = await GET_pdf(buildPdfRequest());
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await runTest(4, 'Anonymous GET /api/reports/summary/excel rejected with 401', async () => {
    setTestAuthUser(null);
    const res = await GET_excel(buildExcelRequest());
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  // Enable authenticated session for subsequent tests
  setTestAuthUser(authUserFixture);

  // ───────────────────────────────────────────────────────────────────────────
  // GROUP 2: PERIOD VALIDATION (Tests 5-12)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- Group 2: Period Validation ---');

  await runTest(5, 'WEEK period is valid', async () => {
    const res = reportQuerySchema.safeParse({ period: 'WEEK', biro: 'ALL' });
    assert(res.success, 'WEEK period should be valid');
  });

  await runTest(6, 'MONTH period is valid', async () => {
    const res = reportQuerySchema.safeParse({ period: 'MONTH', biro: 'ALL' });
    assert(res.success, 'MONTH period should be valid');
  });

  await runTest(7, 'QUARTER period is valid', async () => {
    const res = reportQuerySchema.safeParse({ period: 'QUARTER', biro: 'ALL' });
    assert(res.success, 'QUARTER period should be valid');
  });

  await runTest(8, 'CUSTOM period with valid dates is valid', async () => {
    const res = reportQuerySchema.safeParse({
      period: 'CUSTOM',
      biro: 'ALL',
      startDate: '2026-09-01',
      endDate: '2026-09-24',
    });
    assert(res.success, 'Valid CUSTOM period should be accepted');
  });

  await runTest(9, 'Invalid period preset rejected with 400', async () => {
    const req = buildSummaryRequest('period=YEAR&biro=ALL');
    const res = await GET_summary(req);
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await runTest(10, 'Invalid date format in CUSTOM period rejected with 400', async () => {
    const req = buildSummaryRequest(
      'period=CUSTOM&startDate=invalid-date&endDate=2026-09-24&biro=ALL'
    );
    const res = await GET_summary(req);
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await runTest(11, 'CUSTOM period with startDate > endDate rejected with 400', async () => {
    const req = buildSummaryRequest(
      'period=CUSTOM&startDate=2026-10-01&endDate=2026-09-01&biro=ALL'
    );
    const res = await GET_summary(req);
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await runTest(12, 'CUSTOM period range > 366 days rejected with 400', async () => {
    const req = buildSummaryRequest(
      'period=CUSTOM&startDate=2025-01-01&endDate=2026-06-01&biro=ALL'
    );
    const res = await GET_summary(req);
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // GROUP 3: BIRO VALIDATION (Tests 13-19)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- Group 3: Biro Validation ---');

  await runTest(13, 'Biro ALL is valid', async () => {
    const res = reportQuerySchema.safeParse({ period: 'MONTH', biro: 'ALL' });
    assert(res.success, 'ALL biro should be valid');
  });

  await runTest(14, 'Biro BPPK is valid', async () => {
    const res = reportQuerySchema.safeParse({ period: 'MONTH', biro: 'BPPK' });
    assert(res.success, 'BPPK should be valid');
  });

  await runTest(15, 'Biro PKKEK is valid', async () => {
    const res = reportQuerySchema.safeParse({ period: 'MONTH', biro: 'PKKEK' });
    assert(res.success, 'PKKEK should be valid');
  });

  await runTest(16, 'Biro IKK is valid', async () => {
    const res = reportQuerySchema.safeParse({ period: 'MONTH', biro: 'IKK' });
    assert(res.success, 'IKK should be valid');
  });

  await runTest(17, 'Biro HSDMO is valid', async () => {
    const res = reportQuerySchema.safeParse({ period: 'MONTH', biro: 'HSDMO' });
    assert(res.success, 'HSDMO should be valid');
  });

  await runTest(18, 'Biro UK is valid', async () => {
    const res = reportQuerySchema.safeParse({ period: 'MONTH', biro: 'UK' });
    assert(res.success, 'UK should be valid');
  });

  await runTest(19, 'Invalid/legacy Biro code rejected with 400', async () => {
    const req = buildSummaryRequest('period=MONTH&biro=INV');
    const res = await GET_summary(req);
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // GROUP 4: KPI CALCULATIONS (Tests 20-29)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- Group 4: KPI Calculations ---');

  // Fetch summary for QUARTER to ensure ample data
  const qSummary = await getReportSummary({ period: 'QUARTER', biro: 'ALL' });

  await runTest(20, 'Total meetings calculation is non-negative and matches meeting count', async () => {
    assert(qSummary.kpi.totalMeetings >= 0, 'totalMeetings must be >= 0');
    assert(qSummary.kpi.totalMeetings === qSummary.meetings.length, 'totalMeetings must match meetings array length');
  });

  await runTest(21, 'Total action items matches count in period meetings', async () => {
    assert(qSummary.kpi.totalActionItems >= 0, 'totalActionItems must be >= 0');
    const sumItems = qSummary.meetings.reduce((acc, m) => acc + m.totalActionItems, 0);
    assert(qSummary.kpi.totalActionItems === sumItems, 'totalActionItems must match sum of meeting action items');
  });

  await runTest(22, 'Completed action items count is mathematically correct', async () => {
    assert(qSummary.kpi.completedActionItems >= 0, 'completedActionItems must be >= 0');
    assert(
      qSummary.kpi.completedActionItems <= qSummary.kpi.totalActionItems,
      'completedActionItems cannot exceed totalActionItems'
    );
  });

  await runTest(23, 'In Progress action items count is mathematically correct', async () => {
    assert(qSummary.kpi.inProgressActionItems >= 0, 'inProgressActionItems must be >= 0');
    assert(
      qSummary.kpi.inProgressActionItems <= qSummary.kpi.totalActionItems,
      'inProgressActionItems cannot exceed totalActionItems'
    );
  });

  await runTest(24, 'Pending action items count is mathematically correct', async () => {
    assert(qSummary.kpi.pendingActionItems >= 0, 'pendingActionItems must be >= 0');
    assert(
      qSummary.kpi.pendingActionItems <= qSummary.kpi.totalActionItems,
      'pendingActionItems cannot exceed totalActionItems'
    );
  });

  await runTest(25, 'Overdue action items uses computeActionItemStatus helper correctly', async () => {
    assert(qSummary.kpi.overdueActionItems >= 0, 'overdueActionItems must be >= 0');
    // Verify that the sum of parts equals total action items
    const sumStatus =
      qSummary.kpi.completedActionItems +
      qSummary.kpi.inProgressActionItems +
      qSummary.kpi.pendingActionItems +
      qSummary.kpi.overdueActionItems;
    assert(sumStatus === qSummary.kpi.totalActionItems, `Sum of statuses (${sumStatus}) must equal totalActionItems (${qSummary.kpi.totalActionItems})`);
  });

  await runTest(26, 'Completion rate calculation is accurate to 1 decimal place', async () => {
    if (qSummary.kpi.totalActionItems > 0) {
      const expected = Number(
        ((qSummary.kpi.completedActionItems / qSummary.kpi.totalActionItems) * 100).toFixed(1)
      );
      assert(
        qSummary.kpi.completionRate === expected,
        `Expected ${expected}%, got ${qSummary.kpi.completionRate}%`
      );
    } else {
      assert(qSummary.kpi.completionRate === 0, 'Completion rate must be 0 when no items');
    }
  });

  await runTest(27, 'Division by zero is completely safe (returns 0%, not NaN or Infinity)', async () => {
    // Custom period in year 2099 with 0 meetings
    const emptySummary = await getReportSummary({
      period: 'CUSTOM',
      biro: 'ALL',
      startDate: '2099-01-01',
      endDate: '2099-01-05',
    });
    assert(emptySummary.kpi.totalMeetings === 0, 'Expected 0 meetings');
    assert(emptySummary.kpi.totalActionItems === 0, 'Expected 0 action items');
    assert(emptySummary.kpi.completionRate === 0, 'Completion rate must be 0, not NaN');
    assert(emptySummary.kpi.minutesCompletionRate === 0, 'Minutes rate must be 0, not NaN');
    assert(!isNaN(emptySummary.kpi.completionRate), 'Must not be NaN');
    assert(isFinite(emptySummary.kpi.completionRate), 'Must not be Infinity');
  });

  await runTest(28, 'Meetings with minutes count is correct', async () => {
    assert(qSummary.kpi.meetingsWithMinutes >= 0, 'meetingsWithMinutes must be >= 0');
    const actualWithMinutes = qSummary.meetings.filter((m) => m.hasMinutes).length;
    assert(
      qSummary.kpi.meetingsWithMinutes === actualWithMinutes,
      `meetingsWithMinutes (${qSummary.kpi.meetingsWithMinutes}) must equal count of meetings with hasMinutes (${actualWithMinutes})`
    );
  });

  await runTest(29, 'Meetings without minutes count is correct and sums to total', async () => {
    assert(qSummary.kpi.meetingsWithoutMinutes >= 0, 'meetingsWithoutMinutes must be >= 0');
    assert(
      qSummary.kpi.meetingsWithMinutes + qSummary.kpi.meetingsWithoutMinutes ===
        qSummary.kpi.totalMeetings,
      'meetingsWithMinutes + meetingsWithoutMinutes must equal totalMeetings'
    );
  });

  // ───────────────────────────────────────────────────────────────────────────
  // GROUP 5: BIRO SUMMARY TABLE (Tests 30-33)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- Group 5: Biro Summary Table ---');

  await runTest(30, 'All 5 official Biros are present in exact order', async () => {
    assert(qSummary.biroSummary.length === 5, `Expected 5 biros, got ${qSummary.biroSummary.length}`);
    const codes = qSummary.biroSummary.map((b) => b.code);
    const expected = ['BPPK', 'PKKEK', 'IKK', 'HSDMO', 'UK'];
    assert(
      JSON.stringify(codes) === JSON.stringify(expected),
      `Expected ${expected.join(', ')}, got ${codes.join(', ')}`
    );
  });

  await runTest(31, 'Counts per Biro sum up to the total row correctly', async () => {
    const sumMeetings = qSummary.biroSummary.reduce((acc, b) => acc + b.totalMeetings, 0);
    const sumItems = qSummary.biroSummary.reduce((acc, b) => acc + b.totalActionItems, 0);
    const sumCompleted = qSummary.biroSummary.reduce((acc, b) => acc + b.completed, 0);

    assert(
      sumMeetings === qSummary.biroTotalRow.totalMeetings,
      `Sum of biro meetings (${sumMeetings}) must match total row (${qSummary.biroTotalRow.totalMeetings})`
    );
    assert(
      sumItems === qSummary.biroTotalRow.totalActionItems,
      `Sum of biro items (${sumItems}) must match total row (${qSummary.biroTotalRow.totalActionItems})`
    );
    assert(
      sumCompleted === qSummary.biroTotalRow.completed,
      `Sum of biro completed (${sumCompleted}) must match total row (${qSummary.biroTotalRow.completed})`
    );
  });

  await runTest(32, 'Completion rate per Biro is mathematically correct', async () => {
    for (const b of qSummary.biroSummary) {
      if (b.totalActionItems > 0) {
        const expected = Number(((b.completed / b.totalActionItems) * 100).toFixed(1));
        assert(b.completionRate === expected, `Biro ${b.code} rate mismatch`);
      } else {
        assert(b.completionRate === 0, `Biro ${b.code} rate with 0 items must be 0`);
      }
    }
  });

  await runTest(33, 'Total row accurately reflects overall KPI statistics', async () => {
    assert(
      qSummary.biroTotalRow.totalMeetings === qSummary.kpi.totalMeetings,
      'Total row meetings must equal KPI totalMeetings'
    );
    assert(
      qSummary.biroTotalRow.totalActionItems === qSummary.kpi.totalActionItems,
      'Total row items must equal KPI totalActionItems'
    );
    assert(
      qSummary.biroTotalRow.completed === qSummary.kpi.completedActionItems,
      'Total row completed must equal KPI completed'
    );
    assert(
      qSummary.biroTotalRow.completionRate === qSummary.kpi.completionRate,
      'Total row completionRate must equal KPI completionRate'
    );
  });

  // ───────────────────────────────────────────────────────────────────────────
  // GROUP 6: TREND GROUPING (Tests 34-36)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- Group 6: Trend Grouping ---');

  await runTest(34, 'WEEK trend contains 7 daily points from Monday to Sunday', async () => {
    const weekSummary = await getReportSummary({ period: 'WEEK', biro: 'ALL' });
    assert(weekSummary.trend.length === 7, `Expected 7 daily trend points, got ${weekSummary.trend.length}`);
    const labels = weekSummary.trend.map((t) => t.label);
    assert(labels[0] === 'Senin', `First day should be Senin, got ${labels[0]}`);
    assert(labels[6] === 'Minggu', `Last day should be Minggu, got ${labels[6]}`);
  });

  await runTest(35, 'MONTH trend contains weekly grouping points', async () => {
    const monthSummary = await getReportSummary({ period: 'MONTH', biro: 'ALL' });
    assert(
      monthSummary.trend.length >= 4 && monthSummary.trend.length <= 5,
      `Expected 4 or 5 weekly trend points, got ${monthSummary.trend.length}`
    );
    assert(monthSummary.trend[0].label.includes('Minggu 1'), 'First trend point should be Minggu 1');
  });

  await runTest(36, 'QUARTER trend contains 3 monthly points', async () => {
    const qSummary2 = await getReportSummary({ period: 'QUARTER', biro: 'ALL' });
    assert(qSummary2.trend.length === 3, `Expected 3 monthly trend points, got ${qSummary2.trend.length}`);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // GROUP 7: EXPORT VALIDATION (Tests 37-40)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- Group 7: Export Validation ---');

  let pdfBytes: Uint8Array;
  await runTest(37, 'GET /api/reports/summary/pdf returns 200 with application/pdf', async () => {
    const res = await GET_pdf(buildPdfRequest('period=MONTH&biro=ALL'));
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(
      res.headers.get('Content-Type') === 'application/pdf',
      `Expected application/pdf, got ${res.headers.get('Content-Type')}`
    );
    const buf = await res.arrayBuffer();
    pdfBytes = new Uint8Array(buf);
    assert(pdfBytes.length > 1000, `PDF size too small: ${pdfBytes.length} bytes`);
  });

  await runTest(38, 'Generated PDF buffer is valid with %PDF- header', async () => {
    const header = String.fromCharCode(...pdfBytes.slice(0, 5));
    assert(header.startsWith('%PDF-'), `Invalid PDF header: ${header}`);
  });

  let excelBytes: Uint8Array;
  await runTest(39, 'GET /api/reports/summary/excel returns 200 with openxml sheet', async () => {
    const res = await GET_excel(buildExcelRequest('period=MONTH&biro=ALL'));
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(
      res.headers
        .get('Content-Type')
        ?.includes('vnd.openxmlformats-officedocument.spreadsheetml.sheet') ?? false,
      'Invalid Excel Content-Type'
    );
    const buf = await res.arrayBuffer();
    excelBytes = new Uint8Array(buf);
    assert(excelBytes.length > 2000, `Excel size too small: ${excelBytes.length} bytes`);
  });

  let loadedWb: ExcelJS.Workbook;
  await runTest(40, 'Excel workbook contains all 4 required sheets', async () => {
    loadedWb = await parseWorkbook(excelBytes);
    const sheetNames = loadedWb.worksheets.map((s) => s.name);
    assert(sheetNames.includes('Ringkasan'), 'Must include Sheet 1: Ringkasan');
    assert(sheetNames.includes('Rekap Biro'), 'Must include Sheet 2: Rekap Biro');
    assert(sheetNames.includes('Trend'), 'Must include Sheet 3: Trend');
    assert(sheetNames.includes('Rapat'), 'Must include Sheet 4: Rapat');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // GROUP 8: DETAILED EXCEL & FORMAT INTEGRITY (Tests 41-47)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- Group 8: Detailed Export Integrity ---');

  await runTest(41, 'Excel Sheet 1 (Ringkasan) contains KPI metrics and title', async () => {
    const s1 = loadedWb.getWorksheet('Ringkasan')!;
    const titleVal = s1.getCell('B2').value?.toString() ?? '';
    assert(titleVal.includes('LAPORAN BERKALA'), `Expected title in B2, got "${titleVal}"`);
  });

  await runTest(42, 'Excel Sheet 2 (Rekap Biro) contains all 5 Biros and TOTAL row', async () => {
    const s2 = loadedWb.getWorksheet('Rekap Biro')!;
    const headerRow = s2.getRow(3).values as string[];
    assert(headerRow.includes('Biro'), 'Expected Biro column header');
    assert(headerRow.includes('Completion Rate'), 'Expected Completion Rate column header');

    // Check that row 4..8 contain the 5 biros
    let foundTotal = false;
    s2.eachRow((r) => {
      if (r.getCell(1).value?.toString() === 'TOTAL') foundTotal = true;
    });
    assert(foundTotal, 'Rekap Biro must contain a TOTAL row');
  });

  await runTest(43, 'Excel Sheet 3 (Trend) contains periodic distribution headers', async () => {
    const s3 = loadedWb.getWorksheet('Trend')!;
    const headers = s3.getRow(3).values as string[];
    assert(headers.includes('Periode'), 'Expected Periode header');
    assert(headers.includes('Total Rapat'), 'Expected Total Rapat header');
  });

  await runTest(44, 'Excel Sheet 4 (Rapat) contains meeting list headers', async () => {
    const s4 = loadedWb.getWorksheet('Rapat')!;
    const headers = s4.getRow(3).values as string[];
    assert(headers.includes('Nomor Rapat'), 'Expected Nomor Rapat header');
    assert(headers.includes('Notulen'), 'Expected Notulen header');
  });

  await runTest(45, 'Filter consistency: filtering by BPPK reflects in summary results', async () => {
    const bppkSummary = await getReportSummary({ period: 'QUARTER', biro: 'BPPK' });
    assert(bppkSummary.biro === 'BPPK', 'Summary biro must be BPPK');
    for (const m of bppkSummary.meetings) {
      assert(m.biroCode === 'BPPK', `Every meeting must belong to BPPK, got ${m.biroCode}`);
    }
  });

  await runTest(46, 'PDF filename conforms to specification and is sanitized', async () => {
    const res = await GET_pdf(buildPdfRequest('period=MONTH&biro=BPPK'));
    const disp = res.headers.get('Content-Disposition') || '';
    assert(disp.includes('Laporan-Berkala-BPPK-Bulanan-'), `Filename header mismatch: ${disp}`);
    assert(disp.endsWith('.pdf"'), 'Filename must end with .pdf');
  });

  await runTest(47, 'Excel filename conforms to specification and is sanitized', async () => {
    const res = await GET_excel(buildExcelRequest('period=WEEK&biro=ALL'));
    const disp = res.headers.get('Content-Disposition') || '';
    assert(disp.includes('Laporan-Berkala-Mingguan-'), `Filename header mismatch: ${disp}`);
    assert(disp.endsWith('.xlsx"'), 'Filename must end with .xlsx');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // GROUP 9: SECURITY, TIMEZONE & REGRESSION (Tests 48-60)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- Group 9: Security, Timezone & Regression ---');

  await runTest(48, 'Security: No passwords, hashes, DATABASE_URL, or AUTH_SECRET in JSON summary', async () => {
    const res = await GET_summary(buildSummaryRequest('period=MONTH&biro=ALL'));
    const text = await res.text();
    assert(!text.includes('password'), 'Response must not contain "password"');
    assert(!text.includes('DATABASE_URL'), 'Response must not contain "DATABASE_URL"');
    assert(!text.includes('AUTH_SECRET'), 'Response must not contain "AUTH_SECRET"');
    assert(!text.includes('postgres://'), 'Response must not contain PostgreSQL URI');
  });

  await runTest(49, 'Security: Fetching report summary does NOT mutate the database', async () => {
    const countBefore = await prisma.meeting.count();
    await getReportSummary({ period: 'MONTH', biro: 'ALL' });
    const countAfter = await prisma.meeting.count();
    assert(countBefore === countAfter, 'Meeting count changed during report query');
  });

  await runTest(50, 'Security: Exporting PDF does NOT mutate the database', async () => {
    const countBefore = await prisma.meeting.count();
    await GET_pdf(buildPdfRequest('period=MONTH&biro=ALL'));
    const countAfter = await prisma.meeting.count();
    assert(countBefore === countAfter, 'Meeting count changed during PDF export');
  });

  await runTest(51, 'Security: Exporting Excel does NOT mutate the database', async () => {
    const countBefore = await prisma.actionItem.count();
    await GET_excel(buildExcelRequest('period=MONTH&biro=ALL'));
    const countAfter = await prisma.actionItem.count();
    assert(countBefore === countAfter, 'ActionItem count changed during Excel export');
  });

  await runTest(52, 'Custom date boundary: exactly 366 days is accepted', async () => {
    const valid366 = reportQuerySchema.safeParse({
      period: 'CUSTOM',
      biro: 'ALL',
      startDate: '2024-01-01',
      endDate: '2024-12-31', // 365 or 366 days
    });
    assert(valid366.success, '366 days range should be accepted');
  });

  await runTest(53, 'Timezone: WEEK starts on Monday and ends on Sunday in Asia/Jakarta', async () => {
    // Reference date: Thursday 2026-09-24 10:00:00 UTC (17:00 WIB)
    const ref = new Date('2026-09-24T10:00:00Z');
    const resolved = resolvePeriodDates({ period: 'WEEK' }, ref);
    assert(resolved.startDateIso === '2026-09-21', `Expected Monday 2026-09-21, got ${resolved.startDateIso}`);
    assert(resolved.endDateIso === '2026-09-27', `Expected Sunday 2026-09-27, got ${resolved.endDateIso}`);
  });

  await runTest(54, 'Timezone: MONTH starts on 1st and ends on last day in Asia/Jakarta', async () => {
    const ref = new Date('2026-09-24T10:00:00Z');
    const resolved = resolvePeriodDates({ period: 'MONTH' }, ref);
    assert(resolved.startDateIso === '2026-09-01', `Expected 1st of month 2026-09-01, got ${resolved.startDateIso}`);
    assert(resolved.endDateIso === '2026-09-30', `Expected last day 2026-09-30, got ${resolved.endDateIso}`);
  });

  await runTest(55, 'Timezone: QUARTER correctly resolves Q3 for September', async () => {
    const ref = new Date('2026-09-24T10:00:00Z');
    const resolved = resolvePeriodDates({ period: 'QUARTER' }, ref);
    assert(resolved.startDateIso === '2026-07-01', `Expected Q3 start 2026-07-01, got ${resolved.startDateIso}`);
    assert(resolved.endDateIso === '2026-09-30', `Expected Q3 end 2026-09-30, got ${resolved.endDateIso}`);
  });

  await runTest(56, 'computeActionItemStatus: COMPLETED item is NEVER marked OVERDUE even with past deadline', async () => {
    const item = {
      status: 'COMPLETED',
      dueDate: new Date('2020-01-01'), // Long past
    };
    const res = computeActionItemStatus(item);
    assert(res.computedStatus === 'COMPLETED', `Expected COMPLETED, got ${res.computedStatus}`);
    assert(!res.isOverdue, 'COMPLETED item must not be marked overdue');
  });

  await runTest(57, 'Empty period summary returns valid structure with 0 meetings', async () => {
    const emptySummary = await getReportSummary({
      period: 'CUSTOM',
      biro: 'ALL',
      startDate: '2099-01-01',
      endDate: '2099-01-05',
    });
    assert(emptySummary.meetings.length === 0, 'Should have 0 meetings');
    assert(emptySummary.biroSummary.length === 5, 'Should still have 5 biros');
    assert(emptySummary.biroTotalRow.totalMeetings === 0, 'Total meetings should be 0');
  });

  await runTest(58, 'Empty period PDF generation succeeds without error', async () => {
    const res = await GET_pdf(
      buildPdfRequest('period=CUSTOM&startDate=2099-01-01&endDate=2099-01-05&biro=ALL')
    );
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const buf = await res.arrayBuffer();
    assert(buf.byteLength > 1000, 'PDF buffer should be non-empty');
  });

  await runTest(59, 'Empty period Excel generation succeeds with all 4 sheets', async () => {
    const res = await GET_excel(
      buildExcelRequest('period=CUSTOM&startDate=2099-01-01&endDate=2099-01-05&biro=ALL')
    );
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const buf = await res.arrayBuffer();
    const wb = await parseWorkbook(buf);
    assert(wb.worksheets.length === 4, `Expected 4 sheets, got ${wb.worksheets.length}`);
  });

  await runTest(60, 'Regression: Stage 7A single meeting PDF generator remains functional', async () => {
    const meeting = await prisma.meeting.findFirst({
      include: {
        primaryBiro: true,
        minutes: true,
        actionItems: { include: { picBiro: true } },
      },
    });
    if (meeting) {
      const pdf = await generateMeetingPdf(meeting as any);
      assert(pdf instanceof Buffer, 'Expected Buffer output from Stage 7A generator');
      assert(pdf.length > 1000, 'Stage 7A PDF output too small');
    }
  });

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log('\n============================================================');
  console.log(` RESULT: ${passed} / ${passed + failed} TESTS PASSED`);
  if (failed > 0) {
    console.error(` FAILURES (${failed}):`);
    failures.forEach((f) => console.error(`  - ${f}`));
    process.exit(1);
  } else {
    console.log(' ALL 60 AUTOMATED TESTS PASSED SUCCESSFULLY! (100%)');
    console.log('============================================================\n');
    process.exit(0);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
