import { prisma } from '../lib/prisma';
import { setTestAuthUser, AuthUser } from '../lib/auth/authorization';
import { updateMeetingStatusAction } from '../app/actions/meeting-actions';
import { createActionItemAction } from '../app/actions/action-item-actions';

async function main() {
  console.log('=== TESTING STAFF PERMISSIONS ===');

  // 1. Fetch biros
  const biros = await prisma.biro.findMany({ take: 2, orderBy: { code: 'asc' } });
  if (biros.length < 2) {
    console.error('Need at least 2 biros for test');
    process.exit(1);
  }
  const biroA = biros[0];
  const biroB = biros[1];

  // 2. Fetch or create users
  let staffUserA = await prisma.user.findFirst({
    where: { role: 'STAFF', biroId: biroA.id, isActive: true },
  });
  if (!staffUserA) {
    staffUserA = await prisma.user.create({
      data: {
        id: `test-staff-${Date.now()}`,
        name: 'Staff Biro A Test',
        email: `staff.a.${Date.now()}@kek.go.id`,
        role: 'STAFF',
        biroId: biroA.id,
        isActive: true,
      },
    });
  }

  const staffAuthUser: AuthUser = {
    id: staffUserA.id,
    name: staffUserA.name,
    email: staffUserA.email,
    role: 'STAFF',
    biroId: biroA.id,
    biroCode: biroA.code,
    biroName: biroA.shortName,
  };

  // Find a meeting belonging to biro A
  let meetingA = await prisma.meeting.findFirst({
    where: { primaryBiroId: biroA.id },
  });
  if (!meetingA) {
    meetingA = await prisma.meeting.create({
      data: {
        id: `MTG-TEST-${Date.now()}`,
        meetingNumber: `UND-TEST-${Date.now()}`,
        title: 'Rapat Test Biro A',
        date: new Date(),
        startTime: '09:00',
        endTime: '11:00',
        location: 'Ruang Rapat A',
        status: 'DRAFT',
        primaryBiroId: biroA.id,
      },
    });
  }

  // Find a meeting belonging to biro B
  let meetingB = await prisma.meeting.findFirst({
    where: { primaryBiroId: biroB.id },
  });
  if (!meetingB) {
    meetingB = await prisma.meeting.create({
      data: {
        id: `MTG-TEST-B-${Date.now()}`,
        meetingNumber: `UND-TEST-B-${Date.now()}`,
        title: 'Rapat Test Biro B',
        date: new Date(),
        startTime: '10:00',
        endTime: '12:00',
        location: 'Ruang Rapat B',
        status: 'DRAFT',
        primaryBiroId: biroB.id,
      },
    });
  }

  // Set auth to Staff A
  setTestAuthUser(staffAuthUser);

  // TEST 1: Staff A updates meeting A status (own biro) -> SHOULD SUCCEED
  console.log('\n[TEST 1] Staff A updates meeting in Biro A to REVIEW...');
  const res1 = await updateMeetingStatusAction(meetingA.id, 'REVIEW');
  console.log('Result:', res1.success ? 'SUCCESS' : `FAILED: ${res1.error}`);
  if (!res1.success) throw new Error('Test 1 failed: Staff should be able to update own biro meeting status');

  // TEST 2: Staff A updates meeting B status (other biro) -> SHOULD BE REJECTED
  console.log('\n[TEST 2] Staff A updates meeting in Biro B (other biro)...');
  const res2 = await updateMeetingStatusAction(meetingB.id, 'REVIEW');
  console.log('Result:', !res2.success ? `CORRECTLY REJECTED: ${res2.error}` : 'UNEXPECTED SUCCESS');
  if (res2.success) throw new Error('Test 2 failed: Staff should not be able to update other biro meeting status');

  // TEST 3: Staff A creates action item in Biro A -> SHOULD SUCCEED
  console.log('\n[TEST 3] Staff A creates action item for Biro A...');
  const res3 = await createActionItemAction({
    meetingId: meetingA.id,
    title: 'Tindak Lanjut Test oleh Staff Biro A',
    picBiroId: biroA.id,
    dueDate: new Date(Date.now() + 86400000 * 7),
    priority: 'HIGH',
    status: 'PENDING',
  });
  console.log('Result:', res3.success ? `SUCCESS (ID: ${res3.data?.id})` : `FAILED: ${res3.error}`);
  if (!res3.success) throw new Error('Test 3 failed: Staff should be able to create action item in own biro');

  // TEST 4: Staff A creates action item for Biro B -> SHOULD BE REJECTED (bureau scoping)
  console.log('\n[TEST 4] Staff A creates action item for Biro B...');
  const res4 = await createActionItemAction({
    meetingId: meetingA.id,
    title: 'Tindak Lanjut Ilegal untuk Biro Lain',
    picBiroId: biroB.id,
    dueDate: new Date(Date.now() + 86400000 * 7),
    priority: 'HIGH',
    status: 'PENDING',
  });
  console.log('Result:', !res4.success ? `CORRECTLY REJECTED: ${res4.error}` : 'UNEXPECTED SUCCESS');
  if (res4.success) throw new Error('Test 4 failed: Staff should not assign action item to another biro');

  // Reset test auth
  setTestAuthUser(null);

  // Clean up created test action item
  if (res3.data?.id) {
    await prisma.actionItem.delete({ where: { id: res3.data.id } }).catch(() => {});
  }

  console.log('\n=== ALL STAFF PERMISSION TESTS PASSED! ===');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
