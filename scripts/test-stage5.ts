import { prisma } from '../lib/prisma';
import {
  createActionItemAction,
  getActionItemsAction,
  updateActionItemAction,
  updateActionItemStatusAction,
  deleteActionItemAction,
} from '../app/actions/action-item-actions';
import { computeActionItemStatus } from '../lib/validations/action-item';

async function runStage5Tests() {
  console.log('====================================================');
  console.log('🚀 MEMULAI PENGUJIAN INTEGRASI STAGE 5 (ACTION ITEMS)');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, desc: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${desc}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${desc}`);
      throw new Error(`Assertion failed: ${desc}`);
    }
  }

  try {
    // 1. Audit Master Data & 5 Official Bureaus
    console.log('--- 1. AUDIT MASTER DATA BIRO ---');
    const biros = await prisma.biro.findMany({ where: { isActive: true } });
    const codes = biros.map((b) => b.code);
    console.log('Daftar Biro:', codes.join(', '));
    assert(codes.includes('BPPK'), 'Biro BPPK terdaftar');
    assert(codes.includes('PKKEK'), 'Biro PKKEK terdaftar');
    assert(codes.includes('IKK'), 'Biro IKK terdaftar');
    assert(codes.includes('HSDMO'), 'Biro HSDMO terdaftar');
    assert(codes.includes('UK'), 'Biro UK terdaftar');
    assert(!codes.some((c) => ['INV', 'OPS', 'ADM', 'IT', 'LEG'].includes(c)), 'Tidak ada kode biro lama');

    const bppkBiro = biros.find((b) => b.code === 'BPPK')!;
    const hsdmoBiro = biros.find((b) => b.code === 'HSDMO')!;

    // 2. Query Meeting BPPK-001
    console.log('\n--- 2. PERIKSA RELASI MEETING DENGAN ACTION ITEMS ---');
    const meeting = await prisma.meeting.findUnique({
      where: { meetingNumber: 'BPPK-001' },
      include: { actionItems: { include: { picBiro: true } } },
    });
    assert(Boolean(meeting), 'Rapat BPPK-001 ditemukan di database');
    assert(meeting!.actionItems.length >= 3, `Rapat BPPK-001 memiliki ${meeting!.actionItems.length} action items`);

    // 3. Test getActionItemsAction
    console.log('\n--- 3. TEST SERVER ACTION getActionItemsAction ---');
    const getRes = await getActionItemsAction(meeting!.id);
    assert(getRes.success, 'getActionItemsAction berhasil dieksekusi');
    assert(Array.isArray(getRes.data), 'Mengembalikan array action items');
    console.log(`Ditemukan ${getRes.data?.length} action items terhubung dengan BPPK-001`);

    // 4. Test createActionItemAction
    console.log('\n--- 4. TEST SERVER ACTION createActionItemAction ---');
    const createRes = await createActionItemAction({
      meetingId: meeting!.id,
      title: 'Penyusunan peta batas delineasi KEK terintegrasi GIS',
      description: 'Pengambilan citra satelit resolusi tinggi dan verifikasi batas.',
      picBiroId: bppkBiro.id,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 hari ke depan
      priority: 'HIGH',
      status: 'PENDING',
    });
    assert(createRes.success, 'createActionItemAction berhasil');
    assert(Boolean(createRes.data?.id), 'ActionItem baru memiliki ID valid');
    assert(createRes.data?.status === 'PENDING', 'Status default adalah PENDING');
    assert(createRes.data?.completedAt === null, 'completedAt adalah null saat status PENDING');
    const createdId = createRes.data!.id;

    // 5. Test Status Transition & completedAt Lifecycle
    console.log('\n--- 5. TEST TRANSISI STATUS & COMPLETED_AT ---');
    // Transition PENDING -> IN_PROGRESS
    const updateProg = await updateActionItemStatusAction({
      id: createdId,
      status: 'IN_PROGRESS',
    });
    assert(updateProg.success, 'Transisi ke IN_PROGRESS berhasil');
    assert(updateProg.data?.status === 'IN_PROGRESS', 'Status berubah menjadi IN_PROGRESS');
    assert(updateProg.data?.completedAt === null, 'completedAt tetap null saat IN_PROGRESS');

    // Transition IN_PROGRESS -> COMPLETED
    const updateComp = await updateActionItemStatusAction({
      id: createdId,
      status: 'COMPLETED',
    });
    assert(updateComp.success, 'Transisi ke COMPLETED berhasil');
    assert(updateComp.data?.status === 'COMPLETED', 'Status berubah menjadi COMPLETED');
    assert(Boolean(updateComp.data?.completedAt), 'completedAt terisi timestamp otomatis saat COMPLETED');

    // Transition COMPLETED -> IN_PROGRESS (re-open)
    const updateReopen = await updateActionItemStatusAction({
      id: createdId,
      status: 'IN_PROGRESS',
    });
    assert(updateReopen.success, 'Re-open dari COMPLETED ke IN_PROGRESS berhasil');
    assert(updateReopen.data?.status === 'IN_PROGRESS', 'Status kembali IN_PROGRESS');
    assert(updateReopen.data?.completedAt === null, 'completedAt otomatis dibersihkan menjadi null');

    // 6. Test Automatic Overdue Calculation
    console.log('\n--- 6. TEST KALKULASI OTOMATIS OVERDUE ---');
    const pastDueDate = new Date('2025-01-01T00:00:00.000Z');
    const overdueRes = await createActionItemAction({
      meetingId: meeting!.id,
      title: 'Item Uji Overdue (Tenggat Waktu Masa Lalu)',
      picBiroId: hsdmoBiro.id,
      dueDate: pastDueDate,
      priority: 'URGENT',
      status: 'PENDING',
    });
    assert(overdueRes.success, 'Item uji overdue berhasil dibuat');
    assert(overdueRes.data?.computedStatus === 'OVERDUE', 'Kalkulasi otomatis menghasilkan status OVERDUE');
    assert(overdueRes.data?.isOverdue === true, 'isOverdue bernilai true');

    // Mark as COMPLETED -> must NOT be OVERDUE even if dueDate < now
    const markCompletedOverdue = await updateActionItemStatusAction({
      id: overdueRes.data!.id,
      status: 'COMPLETED',
    });
    assert(markCompletedOverdue.success, 'Item overdue berhasil di-mark COMPLETED');
    assert(
      markCompletedOverdue.data?.computedStatus === 'COMPLETED',
      'Status COMPLETED tidak ter-override menjadi OVERDUE'
    );
    assert(markCompletedOverdue.data?.isOverdue === false, 'isOverdue bernilai false untuk item COMPLETED');

    // Clean up overdue test item
    await deleteActionItemAction(overdueRes.data!.id);

    // 7. Test updateActionItemAction (Full Update)
    console.log('\n--- 7. TEST SERVER ACTION updateActionItemAction ---');
    const updateFullRes = await updateActionItemAction({
      id: createdId,
      meetingId: meeting!.id,
      title: 'Penyusunan peta batas delineasi KEK terintegrasi GIS (Updated)',
      description: 'Revisi deskripsi dengan asistensi tenaga ahli kartografi.',
      picBiroId: hsdmoBiro.id,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      priority: 'URGENT',
      status: 'IN_PROGRESS',
    });
    assert(updateFullRes.success, 'updateActionItemAction berhasil');
    assert(Boolean(updateFullRes.data?.title.includes('(Updated)')), 'Judul terupdate');
    assert(updateFullRes.data?.priority === 'URGENT', 'Prioritas terupdate ke URGENT');

    // 8. Test deleteActionItemAction
    console.log('\n--- 8. TEST SERVER ACTION deleteActionItemAction ---');
    const deleteRes = await deleteActionItemAction(createdId);
    assert(deleteRes.success, 'deleteActionItemAction berhasil');

    const checkDeleted = await prisma.actionItem.findUnique({ where: { id: createdId } });
    assert(checkDeleted === null, 'Item benar-benar terhapus secara permanen dari database');

    // 9. Test Cascade Delete: Meeting deletion deletes all its ActionItems
    console.log('\n--- 9. TEST CASCADE DELETION ---');
    const tempMeeting = await prisma.meeting.create({
      data: {
        meetingNumber: 'TMP-TEST-001',
        title: 'Rapat Uji Cascade Delete Stage 5',
        primaryBiroId: bppkBiro.id,
        date: new Date(),
        startTime: '10:00',
        endTime: '11:00',
        location: 'Ruang Uji',
      },
    });

    const tempAction = await prisma.actionItem.create({
      data: {
        meetingId: tempMeeting.id,
        title: 'Action Item untuk Uji Cascade',
        picBiroId: bppkBiro.id,
        dueDate: new Date(),
        status: 'PENDING',
      },
    });

    // Delete meeting -> should cascade delete tempAction
    await prisma.meeting.delete({ where: { id: tempMeeting.id } });
    const verifyCascade = await prisma.actionItem.findUnique({ where: { id: tempAction.id } });
    assert(verifyCascade === null, 'ActionItem otomatis terhapus saat Meeting dihapus (onDelete: Cascade)');

    console.log('\n====================================================');
    console.log(`🎉 SELURUH PENGUJIAN STAGE 5 BERHASIL! (${passedTests}/${totalTests} PASS)`);
    console.log('====================================================');
  } catch (error) {
    console.error('Terjadi kesalahan saat pengujian:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runStage5Tests();
