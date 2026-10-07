const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Syncing meeting progressStatus...');
  
  // 1. Update REVIEW meetings to 'On Progres'
  const res1 = await prisma.meeting.updateMany({
    where: { status: 'REVIEW' },
    data: { progressStatus: 'On Progres' }
  });
  console.log('Updated REVIEW -> On Progres:', res1.count);

  // 2. Update APPROVED and FINAL meetings to 'Finish'
  const res2 = await prisma.meeting.updateMany({
    where: { status: { in: ['APPROVED', 'FINAL'] } },
    data: { progressStatus: 'Finish' }
  });
  console.log('Updated APPROVED/FINAL -> Finish:', res2.count);

  // 3. Update DRAFT meetings to 'Start'
  const res3 = await prisma.meeting.updateMany({
    where: { status: 'DRAFT' },
    data: { progressStatus: 'Start' }
  });
  console.log('Updated DRAFT -> Start:', res3.count);

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
