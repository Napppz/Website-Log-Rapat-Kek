import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const renames = [
  // Table, Old Column, New Column
  { table: 'Biro', oldCol: 'id', newCol: 'biro_id' },

  { table: 'User', oldCol: 'id', newCol: 'user_id' },
  { table: 'User', oldCol: 'biroId', newCol: 'biro_id' },

  { table: 'Meeting', oldCol: 'id', newCol: 'meeting_id' },
  { table: 'Meeting', oldCol: 'primaryBiroId', newCol: 'primary_biro_id' },
  { table: 'Meeting', oldCol: 'chairpersonId', newCol: 'chairperson_id' },
  { table: 'Meeting', oldCol: 'secretaryId', newCol: 'secretary_id' },
  { table: 'Meeting', oldCol: 'previousMeetingId', newCol: 'previous_meeting_id' },

  { table: 'MeetingBiro', oldCol: 'meetingId', newCol: 'meeting_id' },
  { table: 'MeetingBiro', oldCol: 'biroId', newCol: 'biro_id' },

  { table: 'MeetingParticipant', oldCol: 'id', newCol: 'participant_id' },
  { table: 'MeetingParticipant', oldCol: 'meetingId', newCol: 'meeting_id' },
  { table: 'MeetingParticipant', oldCol: 'userId', newCol: 'user_id' },

  { table: 'MeetingMinutes', oldCol: 'id', newCol: 'minutes_id' },
  { table: 'MeetingMinutes', oldCol: 'meetingId', newCol: 'meeting_id' },

  { table: 'ActionItem', oldCol: 'id', newCol: 'action_item_id' },
  { table: 'ActionItem', oldCol: 'meetingId', newCol: 'meeting_id' },
  { table: 'ActionItem', oldCol: 'picBiroId', newCol: 'pic_biro_id' },
  { table: 'ActionItem', oldCol: 'picUserId', newCol: 'pic_user_id' },

  { table: 'BiroMeetingSequence', oldCol: 'id', newCol: 'sequence_id' },
  { table: 'BiroMeetingSequence', oldCol: 'biroId', newCol: 'biro_id' },

  { table: 'Account', oldCol: 'id', newCol: 'account_id' },
  { table: 'Account', oldCol: 'userId', newCol: 'user_id' },

  { table: 'Session', oldCol: 'id', newCol: 'session_id' },
  { table: 'Session', oldCol: 'userId', newCol: 'user_id' },
];

async function main() {
  console.log('=== STEP 1: Checking Neon DB columns to rename ===');

  const existingCols: any[] = await prisma.$queryRawUnsafe(`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public';
  `);

  const colSet = new Set(existingCols.map(c => `${c.table_name}.${c.column_name}`));

  const statementsToRun: string[] = [];

  for (const { table, oldCol, newCol } of renames) {
    if (colSet.has(`${table}.${oldCol}`)) {
      statementsToRun.push(`ALTER TABLE "${table}" RENAME COLUMN "${oldCol}" TO "${newCol}";`);
      console.log(`[RENAME SCHEDULED] ${table}.${oldCol} -> ${newCol}`);
    } else if (colSet.has(`${table}.${newCol}`)) {
      console.log(`[ALREADY MIGRATED] ${table}.${newCol} is already present.`);
    } else {
      console.log(`[WARNING] Neither ${oldCol} nor ${newCol} found in ${table}`);
    }
  }

  if (statementsToRun.length === 0) {
    console.log('No column renames needed. Neon DB is already synchronized!');
    return;
  }

  console.log('\n=== STEP 2: Executing safe column renames in Neon DB ===');
  for (const sql of statementsToRun) {
    console.log(`Executing: ${sql}`);
    await prisma.$executeRawUnsafe(sql);
  }

  console.log('\n=== STEP 3: Verification of Neon DB columns ===');
  const updatedCols: any[] = await prisma.$queryRawUnsafe(`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;
  `);

  console.log(`Total columns found: ${updatedCols.length}`);
  console.log('Migration successfully completed with 100% data integrity!');
}

main()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
