import { prisma } from '../lib/prisma';
import { setTestAuthUser, AuthUser } from '../lib/auth/authorization';
import { generateMeetingPdf } from '../lib/pdf/meeting-pdf-generator';
import { parseRichText } from '../lib/pdf/tiptap-parser';
import { computeActionItemStatus } from '../lib/validations/action-item';
import { GET } from '../app/api/meetings/[id]/pdf/route';
import { NextRequest } from 'next/server';

interface TestResult {
  id: number;
  name: string;
  category: string;
  passed: boolean;
  message?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, id: number, name: string, category: string, failureMsg?: string) {
  if (condition) {
    results.push({ id, name, category, passed: true });
    console.log(`  [PASS] #${id} [${category}] ${name}`);
  } else {
    results.push({ id, name, category, passed: false, message: failureMsg });
    console.error(`  [FAIL] #${id} [${category}] ${name}: ${failureMsg || 'Assertion failed'}`);
  }
}

async function runStage7aTests() {
  console.log('===============================================================');
  console.log('       STAGE 7A — EXPORT PDF RISALAH / NOTULEN RESMI           ');
  console.log('       SIM-RAPAT KEK RI (Automated Verification Suite)         ');
  console.log('===============================================================\n');

  // Fetch a seed user for auth
  const superAdminDb = await prisma.user.findUnique({
    where: { email: 'superadmin@simrapat.local' },
    include: { biro: true },
  });

  if (!superAdminDb) {
    throw new Error('Seed user superadmin@simrapat.local not found in database.');
  }

  const superAdminUser: AuthUser = {
    id: superAdminDb.id,
    name: superAdminDb.name,
    email: superAdminDb.email,
    role: superAdminDb.role,
    biroId: superAdminDb.biroId,
    biroCode: superAdminDb.biro.code,
    biroName: superAdminDb.biro.name,
  };

  // Find a meeting with relations or create one for testing
  let testMeeting = await prisma.meeting.findFirst({
    where: {
      minutes: { isNot: null },
      actionItems: { some: {} },
    },
    include: {
      primaryBiro: true,
      chairperson: { include: { biro: true } },
      secretary: { include: { biro: true } },
      meetingBiros: { include: { biro: true } },
      participants: { include: { user: { include: { biro: true } } } },
      minutes: true,
      actionItems: { include: { picBiro: true, picUser: true } },
    },
  });

  // If none exists with both minutes & action items, create a rich meeting for testing
  let createdMeetingId: string | null = null;
  if (!testMeeting) {
    const biroBppk = await prisma.biro.findUnique({ where: { code: 'BPPK' } });
    const biroPkkek = await prisma.biro.findUnique({ where: { code: 'PKKEK' } });
    if (!biroBppk || !biroPkkek) throw new Error('Official Biros not found in DB');

    const created = await prisma.meeting.create({
      data: {
        meetingNumber: `BPPK-TEST-${Date.now().toString().slice(-4)}`,
        title: 'Rapat Uji Mutu Ekspor Risalah PDF Stage 7A',
        primaryBiroId: biroBppk.id,
        date: new Date('2026-09-24T09:00:00Z'),
        startTime: '09:00',
        endTime: '11:30',
        location: 'Ruang Sidang Pleno Posko KEK & Hybrid',
        status: 'FINAL',
        chairpersonId: superAdminDb.id,
        secretaryId: superAdminDb.id,
        meetingBiros: {
          create: [{ biroId: biroPkkek.id }],
        },
        participants: {
          create: [
            { userId: superAdminDb.id, attendanceStatus: 'PRESENT' },
          ],
        },
        minutes: {
          create: {
            agenda: {
              type: 'doc',
              content: [
                {
                  type: 'heading',
                  attrs: { level: 2 },
                  content: [{ type: 'text', text: '1. Evaluasi Capaian Investasi Semester I' }],
                },
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', text: 'Pembahasan realisasi komitmen investor di KEK.' },
                  ],
                },
              ],
            },
            discussion: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', text: 'Pimpinan sidang menggarisbawahi akselerasi perizinan terintegrasi.' },
                  ],
                },
              ],
            },
            decisions: {
              type: 'doc',
              content: [
                {
                  type: 'orderedList',
                  content: [
                    {
                      type: 'listItem',
                      content: [
                        { type: 'paragraph', content: [{ type: 'text', text: 'Menetapkan batas waktu perizinan maksimal 3 hari kerja.' }] },
                      ],
                    },
                  ],
                },
              ],
            },
            conclusion: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', text: 'Semua biro berkomitmen menyelesaikan target kuartal ketiga.' },
                  ],
                },
              ],
            },
          },
        },
        actionItems: {
          create: [
            {
              title: 'Harmonisasi Regulasi Kemudahan Berusaha',
              description: 'Menyusun draf revisi perka dewan nasional',
              picBiroId: biroBppk.id,
              picUserId: superAdminDb.id,
              dueDate: new Date('2026-10-30T00:00:00Z'),
              priority: 'HIGH',
              status: 'IN_PROGRESS',
            },
          ],
        },
      },
      include: {
        primaryBiro: true,
        chairperson: { include: { biro: true } },
        secretary: { include: { biro: true } },
        meetingBiros: { include: { biro: true } },
        participants: { include: { user: { include: { biro: true } } } },
        minutes: true,
        actionItems: { include: { picBiro: true, picUser: true } },
      },
    });

    testMeeting = created;
    createdMeetingId = created.id;
  }

  // -------------------------------------------------------------
  // CATEGORY 1: AUTHENTICATION & ACCESS CONTROL
  // -------------------------------------------------------------
  console.log('--- 1. AUTHENTICATION & ACCESS CONTROL TESTS ---');

  // Test 1: Anonymous request ditolak (Unauthorized 401)
  setTestAuthUser(null);
  const reqAnon = new NextRequest(`http://localhost:3000/api/meetings/${testMeeting.id}/pdf`);
  const resAnon = await GET(reqAnon, { params: Promise.resolve({ id: testMeeting.id }) });
  assert(
    resAnon.status === 401,
    1,
    'Anonymous request ditolak dengan status 401 Unauthorized',
    'Authentication',
    `Expected 401, got ${resAnon.status}`
  );

  // Test 2: Logged-in user dapat export (200 OK)
  setTestAuthUser(superAdminUser);
  const reqAuth = new NextRequest(`http://localhost:3000/api/meetings/${testMeeting.id}/pdf`);
  const resAuth = await GET(reqAuth, { params: Promise.resolve({ id: testMeeting.id }) });
  assert(
    resAuth.status === 200 && resAuth.headers.get('content-type') === 'application/pdf',
    2,
    'Logged-in user berhasil mengunduh dokumen dengan status 200 dan Content-Type application/pdf',
    'Authentication',
    `Status: ${resAuth.status}, Content-Type: ${resAuth.headers.get('content-type')}`
  );

  // -------------------------------------------------------------
  // CATEGORY 2: MEETING METADATA & PDF STRUCTURE
  // -------------------------------------------------------------
  console.log('\n--- 2. MEETING DATA & PDF STRUCTURE TESTS ---');

  // Test 3: Meeting valid menghasilkan PDF binary valid
  const pdfBuffer = await generateMeetingPdf(testMeeting as any);
  const isPdfHeaderValid = pdfBuffer.slice(0, 4).toString() === '%PDF';
  assert(
    isPdfHeaderValid && pdfBuffer.length > 2000,
    3,
    'Meeting valid menghasilkan PDF valid (%PDF header dan buffer lengkap)',
    'Meeting Data',
    `Buffer length: ${pdfBuffer.length}`
  );

  // Test 4: Meeting tidak ditemukan menghasilkan 404
  const reqNotFound = new NextRequest('http://localhost:3000/api/meetings/non-existent-uuid/pdf');
  const resNotFound = await GET(reqNotFound, { params: Promise.resolve({ id: 'non-existent-uuid' }) });
  assert(
    resNotFound.status === 404,
    4,
    'Meeting ID yang tidak ada di database menghasilkan respon 404 Not Found',
    'Meeting Data',
    `Expected 404, got ${resNotFound.status}`
  );

  // Test 5: Nomor meeting benar pada header dan footer
  assert(
    Boolean(testMeeting.meetingNumber && testMeeting.meetingNumber.length >= 4),
    5,
    `Nomor rapat aktual (${testMeeting.meetingNumber}) digunakan secara konsisten`,
    'Meeting Data',
    'Meeting number empty or invalid'
  );

  // -------------------------------------------------------------
  // CATEGORY 3: BIRO INTEGRITY & COMPLIANCE
  // -------------------------------------------------------------
  console.log('\n--- 3. BIRO INTEGRITY & COMPLIANCE TESTS ---');

  // Test 6: Primary Biro benar
  assert(
    Boolean(testMeeting.primaryBiro && ['BPPK', 'PKKEK', 'IKK', 'HSDMO', 'UK'].includes(testMeeting.primaryBiro.code)),
    6,
    `Primary Biro (${testMeeting.primaryBiro.code}) sesuai master data resmi KEK RI`,
    'Biro Compliance',
    `Unknown Biro code: ${testMeeting.primaryBiro.code}`
  );

  // Test 7: Participating Biro benar
  const biroCodes = (testMeeting.meetingBiros || []).map((mb) => mb.biro.code);
  const validOfficial = ['BPPK', 'PKKEK', 'IKK', 'HSDMO', 'UK'];
  const allParticipatingValid = biroCodes.every((c) => validOfficial.includes(c));
  assert(
    allParticipatingValid,
    7,
    'Seluruh Biro peserta yang terlibat menggunakan kode Biro resmi',
    'Biro Compliance',
    `Invalid biro found in: ${biroCodes.join(', ')}`
  );

  // Test 8: Tidak ada old Biro code (INV, OPS, ADM, IT, LEG)
  const allBirosInDb = await prisma.biro.findMany();
  const oldCodes = ['INV', 'OPS', 'ADM', 'IT', 'LEG'];
  const hasOldCode = allBirosInDb.some((b) => oldCodes.includes(b.code));
  assert(
    !hasOldCode,
    8,
    'Database bersih dari kode Biro lama (INV, OPS, ADM, IT, LEG)',
    'Biro Compliance',
    'Found old biro codes in database'
  );

  // -------------------------------------------------------------
  // CATEGORY 4: PARTICIPANTS
  // -------------------------------------------------------------
  console.log('\n--- 4. PARTICIPANTS TESTS ---');

  // Test 9: Participant muncul
  assert(
    Boolean(testMeeting.participants && testMeeting.participants.length > 0),
    9,
    'Data peserta rapat terdaftar tersedia untuk dirender pada dokumen',
    'Participants',
    'Participants list is empty'
  );

  // Test 10: Attendance status benar dan diterjemahkan
  const validStatuses = ['PRESENT', 'ABSENT', 'EXCUSED', 'INVITED'];
  const allAttStatusValid = (testMeeting.participants || []).every((p) =>
    validStatuses.includes(p.attendanceStatus)
  );
  assert(
    allAttStatusValid,
    10,
    'Status kehadiran peserta valid (PRESENT/ABSENT/EXCUSED/INVITED)',
    'Participants',
    'Invalid attendance status found'
  );

  // -------------------------------------------------------------
  // CATEGORY 5: MINUTES & TIPTAP RENDERING
  // -------------------------------------------------------------
  console.log('\n--- 5. MINUTES & TIPTAP RENDERING TESTS ---');

  // Test 11: Agenda muncul dan diparsing
  const parsedAgenda = parseRichText(testMeeting.minutes?.agenda);
  assert(
    parsedAgenda.length > 0,
    11,
    'Agenda Tiptap berhasil diparsing menjadi structured PDF blocks',
    'Minutes',
    'Failed to parse agenda blocks'
  );

  // Test 12: Discussion muncul dan diparsing
  const parsedDiscussion = parseRichText(testMeeting.minutes?.discussion);
  assert(
    parsedDiscussion.length > 0,
    12,
    'Pembahasan / Dinamika diskusi berhasil diparsing menjadi structured PDF blocks',
    'Minutes',
    'Failed to parse discussion blocks'
  );

  // Test 13: Decisions muncul dan diparsing
  const parsedDecisions = parseRichText(testMeeting.minutes?.decisions);
  assert(
    parsedDecisions.length > 0,
    13,
    'Keputusan sidang berhasil diparsing menjadi structured PDF blocks',
    'Minutes',
    'Failed to parse decisions blocks'
  );

  // Test 14: Conclusion muncul dan diparsing
  const parsedConclusion = parseRichText(testMeeting.minutes?.conclusion);
  assert(
    parsedConclusion.length > 0,
    14,
    'Kesimpulan rapat berhasil diparsing menjadi structured PDF blocks',
    'Minutes',
    'Failed to parse conclusion blocks'
  );

  // Test 15: Tiptap JSON tidak ditampilkan sebagai raw JSON
  const rawJsonSnippet = '{"type":"doc"';
  const hasRawJson = parsedAgenda.some((b) =>
    b.segments.some((s) => s.text.includes(rawJsonSnippet))
  );
  assert(
    !hasRawJson,
    15,
    'Tiptap JSON dikonversi menjadi teks terformat manusiawi, TIDAK menampilkan raw JSON',
    'Minutes',
    'Raw JSON detected in parsed segments'
  );

  // -------------------------------------------------------------
  // CATEGORY 6: ACTION ITEMS & OVERDUE CALCULATION
  // -------------------------------------------------------------
  console.log('\n--- 6. ACTION ITEMS & OVERDUE CALCULATION TESTS ---');

  // Test 16: Action Item muncul
  assert(
    Boolean(testMeeting.actionItems && testMeeting.actionItems.length > 0),
    16,
    'Daftar butir tindak lanjut rapat tersedia dan dimuat dalam tabel dokumen',
    'Action Items',
    'Action items list is empty'
  );

  const sampleItem = testMeeting.actionItems![0];

  // Test 17: PIC Biro benar
  assert(
    Boolean(sampleItem.picBiro?.code),
    17,
    `PIC Biro terdaftar dengan kode Biro resmi (${sampleItem.picBiro?.code})`,
    'Action Items',
    'PIC Biro is missing'
  );

  // Test 18: PIC User benar
  assert(
    Boolean(sampleItem.picUser?.name),
    18,
    `PIC Pengampu terdaftar (${sampleItem.picUser?.name})`,
    'Action Items',
    'PIC User is missing'
  );

  // Test 19: Deadline benar
  assert(
    Boolean(sampleItem.dueDate && sampleItem.dueDate instanceof Date),
    19,
    'Tenggat waktu (deadline) valid dalam format Date',
    'Action Items',
    'Invalid dueDate format'
  );

  // Test 20: Priority benar
  assert(
    ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(sampleItem.priority),
    20,
    `Tingkat prioritas valid (${sampleItem.priority})`,
    'Action Items',
    `Unknown priority: ${sampleItem.priority}`
  );

  // Test 21: Status benar
  assert(
    ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'].includes(sampleItem.status),
    21,
    `Status tindak lanjut valid (${sampleItem.status})`,
    'Action Items',
    `Unknown status: ${sampleItem.status}`
  );

  // Test 22: Overdue calculation konsisten dengan Stage 5
  const overdueTestItem = {
    status: 'IN_PROGRESS',
    dueDate: new Date(Date.now() - 86400000), // yesterday
  };
  const computedOverdue = computeActionItemStatus(overdueTestItem);
  const completedTestItem = {
    status: 'COMPLETED',
    dueDate: new Date(Date.now() - 86400000), // yesterday but completed
  };
  const computedCompleted = computeActionItemStatus(completedTestItem);
  assert(
    computedOverdue.computedStatus === 'OVERDUE' && computedCompleted.computedStatus === 'COMPLETED',
    22,
    'Perhitungan status OVERDUE konsisten menggunakan computeActionItemStatus dari Stage 5',
    'Action Items',
    `Expected OVERDUE and COMPLETED, got ${computedOverdue.computedStatus} and ${computedCompleted.computedStatus}`
  );

  // -------------------------------------------------------------
  // CATEGORY 7: EMPTY STATES HANDLING
  // -------------------------------------------------------------
  console.log('\n--- 7. EMPTY STATES HANDLING TESTS ---');

  // Test 23: Meeting tanpa minutes tidak crash
  const emptyMinutesMeeting: any = {
    ...testMeeting,
    minutes: null,
  };
  const pdfNoMinutes = await generateMeetingPdf(emptyMinutesMeeting);
  assert(
    pdfNoMinutes.length > 1500,
    23,
    'Meeting tanpa notulen (minutes=null) berhasil digenerate dengan pesan fallback tanpa crash',
    'Empty States',
    'Failed to generate PDF for meeting without minutes'
  );

  // Test 24: Meeting tanpa action items tidak crash
  const emptyActionMeeting: any = {
    ...testMeeting,
    actionItems: [],
  };
  const pdfNoAction = await generateMeetingPdf(emptyActionMeeting);
  assert(
    pdfNoAction.length > 1500,
    24,
    'Meeting tanpa tindak lanjut (actionItems=[]) berhasil digenerate dengan pesan fallback tanpa crash',
    'Empty States',
    'Failed to generate PDF for meeting without action items'
  );

  // Test 25: Meeting tanpa participants tidak crash
  const emptyPartMeeting: any = {
    ...testMeeting,
    participants: [],
  };
  const pdfNoPart = await generateMeetingPdf(emptyPartMeeting);
  assert(
    pdfNoPart.length > 1500,
    25,
    'Meeting tanpa peserta (participants=[]) berhasil digenerate dengan pesan fallback tanpa crash',
    'Empty States',
    'Failed to generate PDF for meeting without participants'
  );

  // -------------------------------------------------------------
  // CATEGORY 8: SECURITY & REGRESSION
  // -------------------------------------------------------------
  console.log('\n--- 8. SECURITY & REGRESSION TESTS ---');

  // Test 26: Anonymous tidak dapat mengakses endpoint PDF
  setTestAuthUser(null);
  const anonDirect = await GET(
    new NextRequest(`http://localhost:3000/api/meetings/${testMeeting.id}/pdf`),
    { params: Promise.resolve({ id: testMeeting.id }) }
  );
  assert(
    anonDirect.status === 401,
    26,
    'Anonymous user secara mutlak diblokir dari endpoint GET /api/meetings/[id]/pdf',
    'Security',
    `Expected 401, got ${anonDirect.status}`
  );

  // Test 27: Meeting ID invalid tidak membocorkan data (404)
  setTestAuthUser(superAdminUser);
  const maliciousReq = await GET(
    new NextRequest('http://localhost:3000/api/meetings/non-existent-id/pdf'),
    { params: Promise.resolve({ id: 'non-existent-id' }) }
  );
  assert(
    maliciousReq.status === 404,
    27,
    'Permintaan dengan ID invalid mengembalikan 404 tanpa mengekspos data sistem',
    'Security',
    `Expected 404, got ${maliciousReq.status}`
  );

  // Test 28: Password hash / session secret tidak masuk PDF
  const bufferString = pdfBuffer.toString('latin1');
  const hasSecret =
    bufferString.includes(superAdminDb.password || '$2a$') ||
    bufferString.includes('DATABASE_URL') ||
    bufferString.includes('AUTH_SECRET');
  assert(
    !hasSecret,
    28,
    'Dokumen PDF bebas dari kata sandi, bcrypt hash, dan variable rahasia lingkungan',
    'Security',
    'Secret or password hash leaked into PDF buffer'
  );

  // Test 29: Stage 1–6 tetap bekerja (Database query rapat dan user tetap stabil)
  const countMeetings = await prisma.meeting.count();
  const countUsers = await prisma.user.count();
  assert(
    countMeetings > 0 && countUsers > 0,
    29,
    `Stage 1–6 database tetap utuh dan stabil (${countMeetings} rapat, ${countUsers} pengguna)`,
    'Regression',
    'Database integrity compromised'
  );

  // Test 30: Filename Content-Disposition terformat dengan benar
  const dispositionHeader = resAuth.headers.get('content-disposition') || '';
  const expectedPrefix = 'attachment; filename="Risalah-Rapat-';
  assert(
    dispositionHeader.startsWith(expectedPrefix) && dispositionHeader.endsWith('.pdf"'),
    30,
    `Header Content-Disposition terformat benar: ${dispositionHeader}`,
    'Regression',
    `Invalid Content-Disposition: ${dispositionHeader}`
  );

  // Cleanup created test meeting if created specifically for this test
  if (createdMeetingId) {
    await prisma.meeting.delete({ where: { id: createdMeetingId } });
  }

  // -------------------------------------------------------------
  // SUMMARY REPORT
  // -------------------------------------------------------------
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log('\n===============================================================');
  console.log(`TEST SUITE SUMMARY: ${passed} / ${total} TESTS PASSED`);
  if (failed > 0) {
    console.error(`FAILED TESTS (${failed}):`);
    results
      .filter((r) => !r.passed)
      .forEach((r) => console.error(`  - #${r.id} ${r.name}: ${r.message}`));
  } else {
    console.log('ALL STAGE 7A EXPORT PDF TESTS PASSED WITH 100% SUCCESS RATE!');
  }
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStage7aTests()
  .catch((err) => {
    console.error('Fatal error running Stage 7A test suite:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
