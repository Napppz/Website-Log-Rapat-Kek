import { NextRequest, NextResponse } from 'next/server';
import { getMeetingsFromDb } from '@/lib/db-service';
import { getCurrentUser } from '@/lib/auth/authorization';
import { MeetingStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const biro = searchParams.get('biro');
    const status = searchParams.get('status') as MeetingStatus | null;

    let currentUser = null;
    try {
      currentUser = await getCurrentUser();
    } catch {}

    const isPrivileged =
      currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

    // Bureau Scoping: Non-admin accounts can only fetch meetings of their own bureau
    const effectiveBiro = (!isPrivileged && currentUser?.biroCode)
      ? currentUser.biroCode
      : biro;

    const meetings = await getMeetingsFromDb({
      biroCode: effectiveBiro,
      status: status,
    });

    return NextResponse.json(meetings, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error) {
    console.error('API /api/meetings error:', error);
    return NextResponse.json({ error: 'Gagal memuat daftar rapat dari database' }, { status: 500 });
  }
}
