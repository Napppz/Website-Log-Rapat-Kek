import { NextRequest, NextResponse } from 'next/server';
import { getMeetingsFromDb } from '@/lib/db-service';
import { MeetingStatus } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const biro = searchParams.get('biro');
    const status = searchParams.get('status') as MeetingStatus | null;

    const meetings = await getMeetingsFromDb({
      biroCode: biro,
      status: status,
    });

    return NextResponse.json(meetings);
  } catch (error) {
    console.error('API /api/meetings error:', error);
    return NextResponse.json({ error: 'Gagal memuat daftar rapat dari database' }, { status: 500 });
  }
}
