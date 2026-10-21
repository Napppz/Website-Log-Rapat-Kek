import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const teams = await prisma.biroTeam.findMany({
      where: { isActive: true },
      include: {
        biro: {
          select: {
            id: true,
            code: true,
            name: true,
            shortName: true,
          },
        },
      },
      orderBy: [{ code: 'asc' }],
    });
    return NextResponse.json(teams);
  } catch (error) {
    console.error('API /api/teams error:', error);
    return NextResponse.json(
      { error: 'Gagal memuat tim dari database' },
      { status: 500 }
    );
  }
}
