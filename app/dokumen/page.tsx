import React from 'react';
import { Metadata } from 'next';
import { getMeetingsFromDb, getOfficialBiros } from '@/lib/db-service';
import { DokumenClient } from './dokumen-client';

export const metadata: Metadata = {
  title: 'Dokumen & Notulen Resmi — SIM-RAPAT KEK RI',
  description:
    'Repositori arsip dokumen risalah rapat, berita acara dewan, dan penetapan regulasi Dewan Nasional Kawasan Ekonomi Khusus Republik Indonesia.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DokumenPage() {
  const [meetings, biros] = await Promise.all([
    getMeetingsFromDb(),
    getOfficialBiros(),
  ]);

  return <DokumenClient initialMeetings={meetings} biros={biros} />;
}
