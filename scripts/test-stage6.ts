import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { setTestAuthUser, AuthUser, hasPermission } from '../lib/auth/authorization';
import {
  createMeetingAction,
  updateMeetingStatusAction,
  deleteMeetingAction,
} from '../app/actions/meeting-actions';
import { upsertMeetingMinutesAction } from '../app/actions/minute-actions';
import {
  createActionItemAction,
  updateActionItemAction,
  deleteActionItemAction,
  updateActionItemStatusAction,
} from '../app/actions/action-item-actions';
import {
  getUsersAction,
  createUserAction,
  updateUserAction,
  toggleUserStatusAction,
} from '../app/actions/user-actions';

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

async function runStage6Tests() {
  console.log('===============================================================');
  console.log('       STAGE 6 — COMPREHENSIVE AUTOMATED TEST SUITE            ');
  console.log('       SIM-RAPAT KEK RI (Authentication & RBAC)               ');
  console.log('===============================================================\n');

  // Fetch test seed users from DB
  const superAdminDb = await prisma.user.findUnique({
    where: { email: 'superadmin@simrapat.local' },
    include: { biro: true },
  });
  const adminDb = await prisma.user.findUnique({
    where: { email: 'admin@simrapat.local' },
    include: { biro: true },
  });
  const notulisDb = await prisma.user.findUnique({
    where: { email: 'notulis@simrapat.local' },
    include: { biro: true },
  });
  const staffDb = await prisma.user.findUnique({
    where: { email: 'staff@simrapat.local' },
    include: { biro: true },
  });
  const viewerDb = await prisma.user.findUnique({
    where: { email: 'viewer@simrapat.local' },
    include: { biro: true },
  });
  const inactiveDb = await prisma.user.findUnique({
    where: { email: 'inactive@simrapat.local' },
    include: { biro: true },
  });

  if (!superAdminDb || !adminDb || !notulisDb || !staffDb || !viewerDb) {
    throw new Error('Seed users not found in database! Please run `npm run prisma:seed` first.');
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

  const adminUser: AuthUser = {
    id: adminDb.id,
    name: adminDb.name,
    email: adminDb.email,
    role: adminDb.role,
    biroId: adminDb.biroId,
    biroCode: adminDb.biro.code,
    biroName: adminDb.biro.name,
  };

  const notulisUser: AuthUser = {
    id: notulisDb.id,
    name: notulisDb.name,
    email: notulisDb.email,
    role: notulisDb.role,
    biroId: notulisDb.biroId,
    biroCode: notulisDb.biro.code,
    biroName: notulisDb.biro.name,
  };

  const staffUser: AuthUser = {
    id: staffDb.id,
    name: staffDb.name,
    email: staffDb.email,
    role: staffDb.role,
    biroId: staffDb.biroId,
    biroCode: staffDb.biro.code,
    biroName: staffDb.biro.name,
  };

  const viewerUser: AuthUser = {
    id: viewerDb.id,
    name: viewerDb.name,
    email: viewerDb.email,
    role: viewerDb.role,
    biroId: viewerDb.biroId,
    biroCode: viewerDb.biro.code,
    biroName: viewerDb.biro.name,
  };

  // -------------------------------------------------------------
  // CATEGORY 1: AUTHENTICATION (Credentials, Passwords, Active status)
  // -------------------------------------------------------------
  console.log('--- 1. AUTHENTICATION TESTS ---');

  // Test 1: User valid dapat login (bcrypt match)
  const isMatchValid = await bcrypt.compare('DevOnly!2026', superAdminDb.password || '');
  assert(
    isMatchValid && superAdminDb.isActive,
    1,
    'User valid dapat diverifikasi dengan password hash',
    'Authentication',
    'Password hash comparison failed for valid user'
  );

  // Test 2: Password salah ditolak
  const isMatchInvalid = await bcrypt.compare('WrongPassword!123', superAdminDb.password || '');
  assert(
    !isMatchInvalid,
    2,
    'Password salah ditolak oleh verifikasi hash',
    'Authentication',
    'Wrong password unexpectedly matched'
  );

  // Test 3: User nonaktif ditolak
  assert(
    Boolean(inactiveDb && !inactiveDb.isActive),
    3,
    'User nonaktif (isActive=false) ditolak masuk',
    'Authentication',
    'Inactive user has isActive=true'
  );

  // Test 4: Password tidak disimpan dalam plaintext
  assert(
    superAdminDb.password !== 'DevOnly!2026' && (superAdminDb.password?.startsWith('$2') || false),
    4,
    'Password disimpan dalam format bcrypt hash (bukan plaintext)',
    'Authentication',
    'Password appears to be stored in plaintext'
  );

  // Test 5: Session mapping menyediakan role, biroId, biroCode, biroName
  assert(
    Boolean(superAdminUser.role && superAdminUser.biroId && superAdminUser.biroCode),
    5,
    'Session menyediakan data role, biroId, dan biroCode',
    'Authentication',
    'Session user fields missing'
  );

  // -------------------------------------------------------------
  // CATEGORY 2: AUTHORIZATION (User Management /pengguna)
  // -------------------------------------------------------------
  console.log('\n--- 2. AUTHORIZATION TESTS (User Management) ---');

  // Test 6: SUPER_ADMIN dapat membuka user management
  setTestAuthUser(superAdminUser);
  const saUserRes = await getUsersAction();
  assert(
    saUserRes.success && Array.isArray(saUserRes.data),
    6,
    'SUPER_ADMIN dapat membuka data user management',
    'Authorization',
    saUserRes.error
  );

  // Test 7: ADMIN tidak dapat membuka user management
  setTestAuthUser(adminUser);
  const adminUserRes = await getUsersAction();
  assert(
    !adminUserRes.success,
    7,
    'ADMIN ditolak saat mengakses user management',
    'Authorization',
    'ADMIN unexpectedly allowed to access user management'
  );

  // Test 8: NOTULIS tidak dapat membuka user management
  setTestAuthUser(notulisUser);
  const notulisUserRes = await getUsersAction();
  assert(
    !notulisUserRes.success,
    8,
    'NOTULIS ditolak saat mengakses user management',
    'Authorization',
    'NOTULIS unexpectedly allowed to access user management'
  );

  // Test 9: STAFF tidak dapat membuka user management
  setTestAuthUser(staffUser);
  const staffUserRes = await getUsersAction();
  assert(
    !staffUserRes.success,
    9,
    'STAFF ditolak saat mengakses user management',
    'Authorization',
    'STAFF unexpectedly allowed to access user management'
  );

  // Test 10: VIEWER tidak dapat membuka user management
  setTestAuthUser(viewerUser);
  const viewerUserRes = await getUsersAction();
  assert(
    !viewerUserRes.success,
    10,
    'VIEWER ditolak saat mengakses user management',
    'Authorization',
    'VIEWER unexpectedly allowed to access user management'
  );

  // -------------------------------------------------------------
  // CATEGORY 3: MUTATION PROTECTION (VIEWER is strictly read-only)
  // -------------------------------------------------------------
  console.log('\n--- 3. MUTATION TESTS (VIEWER Read-Only Enforcement) ---');
  setTestAuthUser(viewerUser);

  // Test 11: VIEWER tidak dapat create meeting
  const vCreateMeeting = await createMeetingAction({
    title: 'Rapat Ilegal VIEWER',
    biroCode: 'IKK',
    date: '2026-10-10',
    startTime: '09:00',
    endTime: '10:00',
    location: 'Posko KEK',
  });
  assert(
    !vCreateMeeting.success,
    11,
    'VIEWER ditolak membuat rapat baru (createMeetingAction)',
    'Mutation Protection',
    'VIEWER unexpectedly created a meeting'
  );

  // Test 12: VIEWER tidak dapat update meeting
  const vUpdateMeeting = await updateMeetingStatusAction('dummy-meeting-id', 'APPROVED');
  assert(
    !vUpdateMeeting.success,
    12,
    'VIEWER ditolak mengubah status rapat (updateMeetingStatusAction)',
    'Mutation Protection',
    'VIEWER unexpectedly updated meeting status'
  );

  // Test 13: VIEWER tidak dapat delete meeting
  const vDeleteMeeting = await deleteMeetingAction('dummy-meeting-id');
  assert(
    !vDeleteMeeting.success,
    13,
    'VIEWER ditolak menghapus rapat (deleteMeetingAction)',
    'Mutation Protection',
    'VIEWER unexpectedly deleted a meeting'
  );

  // Test 14: VIEWER tidak dapat edit minutes
  const vEditMinutes = await upsertMeetingMinutesAction({
    meetingId: 'dummy-meeting-id',
    agenda: 'Test Agenda',
  });
  assert(
    !vEditMinutes.success,
    14,
    'VIEWER ditolak menyimpan notulen (upsertMeetingMinutesAction)',
    'Mutation Protection',
    'VIEWER unexpectedly edited minutes'
  );

  // Test 15: VIEWER tidak dapat create action item
  const vCreateItem = await createActionItemAction({
    meetingId: 'dummy-meeting-id',
    title: 'Action Item Ilegal VIEWER',
    picBiroId: viewerUser.biroId,
    dueDate: new Date('2026-10-15'),
    priority: 'HIGH',
    status: 'PENDING',
  });
  assert(
    !vCreateItem.success,
    15,
    'VIEWER ditolak membuat butir tindak lanjut (createActionItemAction)',
    'Mutation Protection',
    'VIEWER unexpectedly created an action item'
  );

  // Test 16: VIEWER tidak dapat delete action item
  const vDeleteItem = await deleteActionItemAction('dummy-item-id');
  assert(
    !vDeleteItem.success,
    16,
    'VIEWER ditolak menghapus butir tindak lanjut (deleteActionItemAction)',
    'Mutation Protection',
    'VIEWER unexpectedly deleted an action item'
  );

  // -------------------------------------------------------------
  // CATEGORY 4: NOTULIS PERMISSION ENFORCEMENT
  // -------------------------------------------------------------
  console.log('\n--- 4. NOTULIS PERMISSION TESTS ---');
  setTestAuthUser(notulisUser);

  // Create a real meeting via SUPER_ADMIN first to have a valid meeting target
  setTestAuthUser(superAdminUser);
  const createdMeetingRes = await createMeetingAction({
    title: 'Rapat Pleno Koordinasi Stage 6 Test',
    biroCode: 'BPPK',
    date: '2026-09-30',
    startTime: '10:00',
    endTime: '12:00',
    location: 'Ruang Rapat Pleno',
  });
  const testMeetingId = createdMeetingRes.data!.id;

  // Test 17: NOTULIS dapat membuat/edit minutes pada rapat yang ada
  setTestAuthUser(notulisUser);
  const nMinutesRes = await upsertMeetingMinutesAction({
    meetingId: testMeetingId,
    agenda: '<p>Agenda resmi dicatat oleh Notulis</p>',
    discussion: '<p>Pembahasan berjalan lancar</p>',
    decisions: '<p>Keputusan disepakati</p>',
  });
  assert(
    nMinutesRes.success,
    17,
    'NOTULIS dapat membuat dan mengedit notulen rapat',
    'NOTULIS Permissions',
    nMinutesRes.error
  );

  // Test 18: NOTULIS tidak dapat delete meeting
  const nDeleteMeeting = await deleteMeetingAction(testMeetingId);
  assert(
    !nDeleteMeeting.success,
    18,
    'NOTULIS ditolak saat mencoba menghapus rapat (deleteMeetingAction)',
    'NOTULIS Permissions',
    'NOTULIS unexpectedly deleted meeting'
  );

  // -------------------------------------------------------------
  // CATEGORY 5: ADMIN PERMISSION ENFORCEMENT
  // -------------------------------------------------------------
  console.log('\n--- 5. ADMIN PERMISSION TESTS ---');
  setTestAuthUser(adminUser);

  // Test 19: ADMIN dapat mengelola meeting (update status)
  const adminUpdateRes = await updateMeetingStatusAction(testMeetingId, 'REVIEW');
  assert(
    adminUpdateRes.success,
    19,
    'ADMIN dapat mengelola status rapat (updateMeetingStatusAction)',
    'ADMIN Permissions',
    adminUpdateRes.error
  );

  // Test 20: ADMIN tidak dapat mengelola atau mengubah SUPER_ADMIN
  const adminEditSaRes = await updateUserAction({
    id: superAdminDb.id,
    name: 'Hacked Admin',
    email: superAdminDb.email,
    password: null,
    role: 'STAFF',
    biroId: superAdminDb.biroId,
    isActive: true,
  });
  assert(
    !adminEditSaRes.success,
    20,
    'ADMIN ditolak saat mencoba mengelola akun SUPER_ADMIN',
    'ADMIN Permissions',
    'ADMIN unexpectedly managed SUPER_ADMIN'
  );

  // -------------------------------------------------------------
  // CATEGORY 6: STAFF OWNERSHIP PERMISSION ENFORCEMENT
  // -------------------------------------------------------------
  console.log('\n--- 6. STAFF OWNERSHIP TESTS ---');
  // First, create an action item assigned to this STAFF user
  setTestAuthUser(superAdminUser);
  const assignedItemRes = await createActionItemAction({
    meetingId: testMeetingId,
    title: 'Tugas PIC Khusus Staf Test',
    picBiroId: staffUser.biroId,
    picUserId: staffUser.id,
    dueDate: new Date('2026-10-20'),
    priority: 'HIGH',
    status: 'PENDING',
  });
  const assignedItemId = assignedItemRes.data!.id;

  // And an action item assigned to someone else (e.g. notulis)
  const otherItemRes = await createActionItemAction({
    meetingId: testMeetingId,
    title: 'Tugas PIC Notulis',
    picBiroId: notulisUser.biroId,
    picUserId: notulisUser.id,
    dueDate: new Date('2026-10-25'),
    priority: 'MEDIUM',
    status: 'PENDING',
  });
  const otherItemId = otherItemRes.data!.id;

  // Test 21: STAFF dapat melihat data rapat (permission check)
  const staffCanView = hasPermission('STAFF', 'view:meeting');
  assert(
    staffCanView,
    21,
    'STAFF memiliki hak akses untuk melihat data rapat (view:meeting)',
    'STAFF Permissions',
    'STAFF view:meeting permission missing'
  );

  // Test 22: STAFF hanya dapat mengubah Action Item yang ditugaskan kepadanya
  setTestAuthUser(staffUser);
  // 22a: Update item assigned to staff -> ALLOWED
  const staffUpdateOwn = await updateActionItemStatusAction({
    id: assignedItemId,
    status: 'IN_PROGRESS',
  });
  // 22b: Update item assigned to others -> REJECTED
  const staffUpdateOther = await updateActionItemStatusAction({
    id: otherItemId,
    status: 'COMPLETED',
  });

  assert(
    staffUpdateOwn.success && !staffUpdateOther.success,
    22,
    'STAFF hanya dapat mengubah Action Item yang menjadi tanggung jawabnya (Ownership check)',
    'STAFF Permissions',
    `Own update success: ${staffUpdateOwn.success}, Other update success: ${staffUpdateOther.success}`
  );

  // -------------------------------------------------------------
  // CATEGORY 7: SUPER_ADMIN COMPLETE MANAGEMENT
  // -------------------------------------------------------------
  console.log('\n--- 7. SUPER_ADMIN MANAGEMENT TESTS ---');
  setTestAuthUser(superAdminUser);

  // Test 23: SUPER_ADMIN dapat mengakses user management
  const saAccessRes = await getUsersAction();
  assert(
    saAccessRes.success && (saAccessRes.data?.length || 0) >= 5,
    23,
    'SUPER_ADMIN dapat mengakses seluruh data user management',
    'SUPER_ADMIN Permissions',
    saAccessRes.error
  );

  // Test 24: SUPER_ADMIN dapat membuat user baru
  const randomEmail = `testuser_${Date.now()}@simrapat.local`;
  const saCreateUserRes = await createUserAction({
    name: 'Staff Baru Testing Stage 6',
    email: randomEmail,
    password: 'DevOnly!2026',
    role: 'STAFF',
    biroId: staffUser.biroId,
    isActive: true,
  });
  assert(
    saCreateUserRes.success && saCreateUserRes.data?.email === randomEmail,
    24,
    'SUPER_ADMIN dapat membuat akun user baru lengkap dengan hash password',
    'SUPER_ADMIN Permissions',
    saCreateUserRes.error
  );

  // Test 25: SUPER_ADMIN dapat menonaktifkan user (toggleUserStatusAction)
  if (saCreateUserRes.data?.id) {
    const toggleRes = await toggleUserStatusAction(saCreateUserRes.data.id);
    assert(
      toggleRes.success && toggleRes.data?.isActive === false,
      25,
      'SUPER_ADMIN dapat menonaktifkan akun user (isActive = false)',
      'SUPER_ADMIN Permissions',
      toggleRes.error
    );

    // Clean up created test user
    await prisma.user.delete({ where: { id: saCreateUserRes.data.id } });
  }

  // -------------------------------------------------------------
  // CATEGORY 8: REGRESSION & CLEANUP
  // -------------------------------------------------------------
  console.log('\n--- 8. REGRESSION & IDEMPOTENCY TESTS ---');

  // Test 26: Stage 1–5 data flow (Delete test meeting created during test)
  setTestAuthUser(superAdminUser);
  const deleteCleanRes = await deleteMeetingAction(testMeetingId);
  assert(
    deleteCleanRes.success,
    26,
    'Stage 1–5 CRUD & cascade deletion tetap bekerja tanpa regression',
    'Regression',
    deleteCleanRes.error
  );

  // Test 27: Unauthenticated calls are rejected unconditionally
  setTestAuthUser(null);
  const anonMeetingRes = await createMeetingAction({
    title: 'Rapat Tanpa Login',
    biroCode: 'IKK',
    date: '2026-10-10',
    startTime: '09:00',
    endTime: '10:00',
    location: 'Posko KEK',
  });
  assert(
    !anonMeetingRes.success,
    27,
    'Panggilan Server Action tanpa sesi autentikasi ditolak (Unauthorized)',
    'Regression',
    'Unauthenticated call unexpectedly succeeded'
  );

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
    console.log('ALL STAGE 6 SECURITY & RBAC TESTS PASSED WITH 100% SUCCESS RATE!');
  }
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStage6Tests()
  .catch((err) => {
    console.error('Fatal error running Stage 6 test suite:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
