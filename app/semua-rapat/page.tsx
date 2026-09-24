import { getMeetingsFromDb } from '@/lib/db-service';
import { SemuaRapatClient } from './semua-rapat-client';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SemuaRapatPage() {
  const meetings = await getMeetingsFromDb();

  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat data rapat dari Neon DB...</div>}>
      <SemuaRapatClient initialMeetings={meetings} />
    </Suspense>
  );
}
