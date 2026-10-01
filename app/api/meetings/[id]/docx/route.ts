import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorization';
import {
  generateMeetingDocx,
  generateNotaDinasDocx,
} from '@/lib/docx/meeting-docx-generator';

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
        { error: 'Unauthorized: Anda harus masuk ke sistem untuk mengunduh dokumen Word.' },
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

    // 4. Determine document type (Notula vs Nota Dinas)
    const typeParam = request.nextUrl.searchParams.get('type')?.toLowerCase();
    const storedDocType =
      (meeting.minutes?.conclusion as any)?.docType ||
      (meeting.minutes?.decisions as any)?.docType;

    const isNotaDinas =
      typeParam === 'nota-dinas' ||
      typeParam === 'notadinas' ||
      (!typeParam && storedDocType === 'NOTA_DINAS');

    // 5. Generate DOCX buffer
    const docxBuffer = isNotaDinas
      ? await generateNotaDinasDocx(meeting as any)
      : await generateMeetingDocx(meeting as any);

    // 6. Sanitize filename
    const safeMeetingNumber = (
      meeting.meetingNumber ||
      (meeting as any).code ||
      'Dokumen'
    ).replace(/[^a-zA-Z0-9_-]/g, '_');

    const filename = isNotaDinas
      ? `Nota-Dinas-${safeMeetingNumber}.docx`
      : `Risalah-Rapat-${safeMeetingNumber}.docx`;

    // 7. Return DOCX response as attachment
    return new Response(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(docxBuffer.length),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error generating meeting Word (.docx):', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal membuat dokumen Word (.docx).' },
      { status: 500 }
    );
  }
}
