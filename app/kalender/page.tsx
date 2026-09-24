import React from 'react';
import { Metadata } from 'next';
import { getMeetingsFromDb, getOfficialBiros } from '@/lib/db-service';
import { KalenderClient } from './kalender-client';

export const metadata: Metadata = {
  title: 'Kalender Agenda Sidang — SIM-RAPAT KEK RI',
  description:
    'Jadwal dan agenda rapat koordinasi lintas biro Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus Republik Indonesia.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function KalenderPage() {
  const [meetings, biros] = await Promise.all([
    getMeetingsFromDb(),
    getOfficialBiros(),
  ]);

  return <KalenderClient initialMeetings={meetings} biros={biros} />;
}
