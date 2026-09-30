import { prisma } from '../lib/prisma';

async function main() {
  const ikkBiro = await prisma.biro.findUnique({
    where: { code: 'IKK' },
    include: {
      teams: true,
      primaryMeetings: true,
    },
  });

  if (!ikkBiro) {
    console.error('Biro IKK tidak ditemukan.');
    return;
  }

  console.log(`Found Biro IKK with ${ikkBiro.teams.length} teams:`);
  const teamByCode: Record<string, string> = {};
  for (const t of ikkBiro.teams) {
    console.log(`- [${t.code}] ${t.name} (ID: ${t.id})`);
    teamByCode[t.code] = t.id;
  }

  console.log(`\nAssociating ${ikkBiro.primaryMeetings.length} IKK meetings with appropriate teams:`);
  for (const meeting of ikkBiro.primaryMeetings) {
    const titleLower = meeting.title.toLowerCase();
    let assignedCode = 'INV'; // Default for IKK

    if (
      titleLower.includes('sistem') ||
      titleLower.includes('informasi') ||
      titleLower.includes('portal') ||
      titleLower.includes('digital') ||
      titleLower.includes('aplikasi') ||
      titleLower.includes('teknologi') ||
      titleLower.includes('data')
    ) {
      assignedCode = 'SI';
    } else if (
      titleLower.includes('komunikasi') ||
      titleLower.includes('media') ||
      titleLower.includes('publikasi') ||
      titleLower.includes('humas') ||
      titleLower.includes('pers')
    ) {
      assignedCode = 'KOM';
    } else if (
      titleLower.includes('kerjasama') ||
      titleLower.includes('kerja sama') ||
      titleLower.includes('bilateral') ||
      titleLower.includes('multilateral') ||
      titleLower.includes('kemitraan') ||
      titleLower.includes('mou')
    ) {
      assignedCode = 'KS';
    } else {
      assignedCode = 'INV';
    }

    const teamId = teamByCode[assignedCode];
    if (teamId) {
      await prisma.meeting.update({
        where: { id: meeting.id },
        data: { primaryTeamId: teamId },
      });
      console.log(`- Meeting [${meeting.meetingNumber}] "${meeting.title.slice(0, 40)}..." -> Tim ${assignedCode}`);
    }
  }

  // Also assign picTeamId to IKK Action Items
  const ikkActionItems = await prisma.actionItem.findMany({
    where: { picBiroId: ikkBiro.id },
  });

  console.log(`\nUpdating ${ikkActionItems.length} IKK Action Items with picTeamId:`);
  for (const item of ikkActionItems) {
    const textLower = `${item.title} ${item.description || ''}`.toLowerCase();
    let assignedCode = 'INV';

    if (
      textLower.includes('sistem') ||
      textLower.includes('portal') ||
      textLower.includes('it') ||
      textLower.includes('aplikasi')
    ) {
      assignedCode = 'SI';
    } else if (
      textLower.includes('media') ||
      textLower.includes('komunikasi') ||
      textLower.includes('siaran')
    ) {
      assignedCode = 'KOM';
    } else if (
      textLower.includes('kerjasama') ||
      textLower.includes('kemitraan') ||
      textLower.includes('bilateral')
    ) {
      assignedCode = 'KS';
    } else {
      assignedCode = 'INV';
    }

    const teamId = teamByCode[assignedCode];
    if (teamId) {
      await prisma.actionItem.update({
        where: { id: item.id },
        data: { picTeamId: teamId },
      });
      console.log(`- Action Item "${item.title.slice(0, 35)}..." -> Tim ${assignedCode}`);
    }
  }

  console.log('\nSuccess! All IKK meetings and action items linked to their respective teams.');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
