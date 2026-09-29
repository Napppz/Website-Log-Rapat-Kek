import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Inspecting Neon DB Current Foreign Keys & Column Names ---');
  const cols: any[] = await prisma.$queryRawUnsafe(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    ORDER BY table_name, ordinal_position;
  `);

  const tables: Record<string, string[]> = {};
  for (const row of cols) {
    if (!tables[row.table_name]) tables[row.table_name] = [];
    tables[row.table_name].push(row.column_name);
  }

  for (const [t, columns] of Object.entries(tables)) {
    console.log(`Table: ${t}`);
    console.log(`  Columns: ${columns.join(', ')}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
