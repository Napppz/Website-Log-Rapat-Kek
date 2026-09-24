import { NextResponse } from 'next/server';
import { getOfficialBiros } from '@/lib/db-service';

export async function GET() {
  try {
    const biros = await getOfficialBiros();
    return NextResponse.json(biros);
  } catch (error) {
    console.error('API /api/biros error:', error);
    return NextResponse.json({ error: 'Gagal memuat master biro dari database' }, { status: 500 });
  }
}
