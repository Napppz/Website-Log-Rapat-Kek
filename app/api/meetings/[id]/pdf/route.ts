import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorization';
import { generateMeetingPdf } from '@/lib/pdf/meeting-pdf-generator';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authorization: Require logged-in user
    try {
      await requireAuth();
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized: Anda harus masuk ke sistem untuk mengunduh dokumen.' },
        { status: 401 }
      );
    }

    // 2. Extract meeting ID
    const { id: meetingId } = await context.params;
    if (!meetingId) {
      return NextResponse.json({ error: 'Meeting ID tidak valid.' }, { status: 400 });
    }

    // 3. Fetch meeting data from Neon PostgreSQL
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        primaryBiro: true,
        chairperson: {
          include: { biro: true },
        },
        secretary: {
          include: { biro: true },
        },
        meetingBiros: {
          include: { biro: true },
        },
        participants: {
          include: {
            user: {
              include: { biro: true },
            },
          },
          orderBy: {
            user: { name: 'asc' },
          },
        },
        minutes: true,
        actionItems: {
          include: {
            picBiro: true,
            picUser: true,
          },
          orderBy: {
            dueDate: 'asc',
          },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Data rapat tidak ditemukan.' }, { status: 404 });
    }

    // 4. Generate PDF buffer
    const pdfBuffer = await generateMeetingPdf(meeting as any);

    // 5. Sanitize filename
    const safeMeetingNumber = (meeting.meetingNumber || 'Dokumen').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Risalah-Rapat-${safeMeetingNumber}.pdf`;

    // 6. Return PDF response as attachment
    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error generating meeting PDF:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal membuat dokumen PDF.' },
      { status: 500 }
    );
  }
}
