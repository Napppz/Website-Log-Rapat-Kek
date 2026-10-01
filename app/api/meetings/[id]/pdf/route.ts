import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorization';
import { generateMeetingPdf, generateNotaDinasPdf } from '@/lib/pdf/meeting-pdf-generator';

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

    // 4. Determine document type (Notula vs Nota Dinas)
    const typeParam = request.nextUrl.searchParams.get('type')?.toLowerCase();
    const storedDocType =
      (meeting.minutes?.conclusion as any)?.docType ||
      (meeting.minutes?.decisions as any)?.docType;

    const isNotaDinas =
      typeParam === 'nota-dinas' ||
      typeParam === 'notadinas' ||
      (!typeParam && storedDocType === 'NOTA_DINAS');

    // Generate PDF buffer
    const pdfBuffer = isNotaDinas
      ? await generateNotaDinasPdf(meeting as any)
      : await generateMeetingPdf(meeting as any);

    // 5. Sanitize filename
    const safeMeetingNumber = (meeting.meetingNumber || (meeting as any).code || 'Dokumen').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = isNotaDinas
      ? `Nota-Dinas-${safeMeetingNumber}.pdf`
      : `Risalah-Rapat-${safeMeetingNumber}.pdf`;

    const isInline =
      request.nextUrl.searchParams.get('inline') === 'true' ||
      request.nextUrl.searchParams.get('preview') === 'true';

    // 6. Return PDF response as attachment or inline
    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${isInline ? 'inline' : 'attachment'}; filename="${filename}"`,
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
