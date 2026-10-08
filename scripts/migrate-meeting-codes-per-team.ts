import { prisma } from '../lib/prisma';

async function migrateMeetingCodes() {
  console.log('🚀 Starting migration of meeting codes per Tim Kerja (INV, KS, KOM)...');

  const meetings = await prisma.meeting.findMany({
    select: {
      id: true,
      meetingNumber: true,
      title: true,
      date: true,
      primaryTeamId: true,
      primaryTeam: {
        select: {
          code: true,
          name: true,
        },
      },
    },
    orderBy: {
      date: 'asc',
    },
  });

  console.log(`Found total ${meetings.length} meetings in database.`);

  const teamPrefixMap: Record<string, string> = {
    'TIM-001': 'INV',
    'TIM-003': 'KS',
    'TIM-002': 'KOM',
  };

  // Group by team
  const categorized: Record<string, typeof meetings> = {
    INV: [],
    KS: [],
    KOM: [],
  };

  for (const m of meetings) {
    let teamPrefix = 'INV';
    if (m.primaryTeamId && teamPrefixMap[m.primaryTeamId]) {
      teamPrefix = teamPrefixMap[m.primaryTeamId];
    } else if (m.primaryTeam?.code) {
      const code = m.primaryTeam.code.toUpperCase();
      if (code === 'KS') teamPrefix = 'KS';
      else if (code === 'KOM') teamPrefix = 'KOM';
      else teamPrefix = 'INV';
    }
    categorized[teamPrefix].push(m);
  }

  // Phase 1: Set temporary random numbers to prevent unique constraint collisions
  console.log('\n--- Phase 1: Assigning temporary codes to prevent collisions ---');
  for (const prefix of ['INV', 'KS', 'KOM']) {
    for (let i = 0; i < categorized[prefix].length; i++) {
      const m = categorized[prefix][i];
      const tempCode = `TEMP-${prefix}-${Date.now()}-${i}`;
      await prisma.meeting.update({
        where: { id: m.id },
        data: { meetingNumber: tempCode },
      });
    }
  }

  // Phase 2: Assign final team-specific sequential codes
  console.log('\n--- Phase 2: Assigning standardized meeting codes ---');
  for (const prefix of ['INV', 'KS', 'KOM']) {
    const list = categorized[prefix];
    console.log(`\nTeam ${prefix} (${list.length} meetings):`);
    for (let i = 0; i < list.length; i++) {
      const m = list[i];
      const newCode = `${prefix}-${String(i + 1).padStart(3, '0')}`;
      await prisma.meeting.update({
        where: { id: m.id },
        data: { meetingNumber: newCode },
      });
      console.log(`  ✓ ${m.id} [${m.date.toISOString().slice(0, 10)}] ${m.meetingNumber} -> ${newCode} | "${m.title.slice(0, 45)}"`);
    }
  }

  console.log('\n✅ Migration completed successfully!');
}

migrateMeetingCodes()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
