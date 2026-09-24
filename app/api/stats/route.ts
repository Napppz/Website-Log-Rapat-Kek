import { NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/db-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error) {
    console.error('API /api/stats error:', error);
    return NextResponse.json({ error: 'Gagal memuat statistik dari database' }, { status: 500 });
  }
}
