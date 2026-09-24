import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { LaporanClient } from './laporan-client';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Laporan Berkala Mingguan & Bulanan — SIM-RAPAT KEK RI',
  description:
    'Pusat laporan berkala aktivitas rapat, ketersediaan notulen, dan performa tindak lanjut seluruh Biro Sekretariat Dewan Nasional KEK RI.',
};

export default function LaporanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        </div>
      }
    >
      <LaporanClient />
    </Suspense>
  );
}
