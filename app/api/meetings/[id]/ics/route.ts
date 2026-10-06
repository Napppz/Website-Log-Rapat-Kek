import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateIcsCalendar } from '@/lib/calendar';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: meetingId } = await context.params;
    if (!meetingId) {
      return NextResponse.json({ error: 'Meeting ID tidak valid.' }, { status: 400 });
    }

    const meeting = await prisma.meeting.findFirst({
      where: {
        OR: [{ id: meetingId }, { meetingNumber: meetingId.toUpperCase() }],
      },
      include: {
        primaryBiro: true,
        chairperson: true,
        secretary: true,
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Rapat tidak ditemukan.' }, { status: 404 });
    }

    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const meetingUrl = `${protocol}://${host}/semua-rapat/${meeting.id}`;

    const attendees = meeting.participants.map((p) => ({
      name: p.user.name,
      email: p.user.email,
    }));

    if (meeting.chairperson && !attendees.some((a) => a.email === meeting.chairperson?.email)) {
      attendees.unshift({
        name: meeting.chairperson.name,
        email: meeting.chairperson.email,
      });
    }

    const icsContent = generateIcsCalendar({
      id: meeting.id,
      meetingNumber: meeting.meetingNumber,
      title: meeting.title,
      date: meeting.date,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      location: meeting.location,
      biroName: meeting.primaryBiro?.name,
      chairpersonName: meeting.chairperson?.name,
      secretaryName: meeting.secretary?.name,
      meetingUrl,
      attendees,
    });

    const safeFilename = `Rapat-${meeting.meetingNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.ics`;

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error generating .ics calendar:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal membuat berkas kalender.' },
      { status: 500 }
    );
  }
}
