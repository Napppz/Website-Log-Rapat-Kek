import { NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/db-service';

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('API /api/stats error:', error);
    return NextResponse.json({ error: 'Gagal memuat statistik dari database' }, { status: 500 });
  }
}
