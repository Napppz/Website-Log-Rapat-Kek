const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Syncing meeting progressStatus to formal Indonesian...');
  
  // 1. Update REVIEW meetings to 'Dalam Proses'
  const res1 = await prisma.meeting.updateMany({
    where: {
      OR: [
        { status: 'REVIEW' },
        { progressStatus: { in: ['On Progres', 'On Progress', 'review'] } }
      ]
    },
    data: { progressStatus: 'Dalam Proses' }
  });
  console.log('Updated to Dalam Proses:', res1.count);

  // 2. Update APPROVED and FINAL meetings to 'Selesai'
  const res2 = await prisma.meeting.updateMany({
    where: {
      OR: [
        { status: { in: ['APPROVED', 'FINAL'] } },
        { progressStatus: { in: ['Finish', 'finish', 'Selesai'] } }
      ]
    },
    data: { progressStatus: 'Selesai' }
  });
  console.log('Updated to Selesai:', res2.count);

  // 3. Update DRAFT meetings to 'Belum Dimulai'
  const res3 = await prisma.meeting.updateMany({
    where: {
      OR: [
        { status: 'DRAFT' },
        { progressStatus: { in: ['Start', 'start', 'Belum Dimulai', 'Belum Mulai'] } }
      ]
    },
    data: { progressStatus: 'Belum Dimulai' }
  });
  console.log('Updated to Belum Dimulai:', res3.count);

  // Verification
  const meetings = await prisma.meeting.findMany({
    select: { id: true, title: true, status: true, progressStatus: true }
  });

  const dist = {};
  for (const m of meetings) {
    const k = `${m.progressStatus} (${m.status})`;
    dist[k] = (dist[k] || 0) + 1;
  }
  console.log('Final Distribution in DB:', dist);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
