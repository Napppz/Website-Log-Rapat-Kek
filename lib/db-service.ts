import { prisma } from './prisma';
import { Biro, Meeting, BiroCode, MeetingStatus, BureauWorkload, DashboardMetric } from './types';

/**
 * Service to fetch official data directly from Neon PostgreSQL database.
 */

export async function getOfficialBiros(): Promise<Biro[]> {
  try {
    const biros = await prisma.biro.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });

    return biros.map((b) => ({
      code: b.code as BiroCode,
      name: b.name,
      shortName: b.shortName,
      description: b.description || '',
    }));
  } catch (error) {
    console.error('Error fetching biros from Neon DB:', error);
    return [];
  }
}

export async function getBiroDetail(code: string) {
  try {
    let upperCode = code.toUpperCase();
    if (upperCode === 'PPK' || upperCode === 'REN' || upperCode === 'IT') upperCode = 'BPPK';
    if (upperCode === 'DAL' || upperCode === 'OPS') upperCode = 'PKKEK';
    if (upperCode === 'INV') upperCode = 'IKK';
    if (upperCode === 'HUK' || upperCode === 'LEG') upperCode = 'HSDMO';
    if (upperCode === 'BUK' || upperCode === 'ADM') upperCode = 'UK';

    const biro = await prisma.biro.findUnique({
      where: { code: upperCode },
      include: {
        users: {
          orderBy: { name: 'asc' },
        },
        primaryMeetings: {
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
          include: {
            primaryBiro: true,
            meetingBiros: {
              include: { biro: true },
            },
            participants: {
              include: { user: true },
            },
            chairperson: true,
            secretary: true,
          },
        },
        sequence: true,
      },
    });

    return biro;
  } catch (error) {
    console.error(`Error fetching biro ${code} from Neon DB:`, error);
    return null;
  }
}

export async function getMeetingByIdFromDb(idOrNumber: string) {
  try {
    const meeting = await prisma.meeting.findFirst({
      where: {
        OR: [{ id: idOrNumber }, { meetingNumber: idOrNumber.toUpperCase() }],
      },
      include: {
        primaryBiro: true,
        meetingBiros: {
          include: { biro: true },
        },
        participants: {
          include: { user: { include: { biro: true } } },
        },
        chairperson: {
          include: { biro: true },
        },
        secretary: {
          include: { biro: true },
        },
        minutes: true,
      },
    });

    return meeting;
  } catch (error) {
    console.error(`Error fetching meeting ${idOrNumber} from Neon DB:`, error);
    return null;
  }
}

export async function getMeetingsFromDb(filters?: {
  biroCode?: string | null;
  status?: MeetingStatus | null;
}): Promise<Meeting[]> {
  try {
    const whereClause: any = {};

    if (filters?.biroCode) {
      whereClause.primaryBiro = {
        code: filters.biroCode.toUpperCase(),
      };
    }

    if (filters?.status) {
      whereClause.status = filters.status;
    }

    const meetings = await prisma.meeting.findMany({
      where: whereClause,
      include: {
        primaryBiro: true,
        meetingBiros: {
          include: { biro: true },
        },
        participants: {
          include: { user: true },
        },
        chairperson: true,
        secretary: true,
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    return meetings.map((m) => {
      const attendees = m.participants.map((p) => p.user.name);
      if (m.chairperson && !attendees.includes(m.chairperson.name)) {
        attendees.unshift(m.chairperson.name);
      }

      const involvedBiroNames = m.meetingBiros.map((mb) => mb.biro.code).join(', ');

      return {
        id: m.id,
        code: m.meetingNumber,
        title: m.title,
        date: m.date.toISOString().slice(0, 10),
        time: `${m.startTime} - ${m.endTime} WIB`,
        location: m.location,
        biroCode: m.primaryBiro.code as BiroCode,
        biroName: m.primaryBiro.shortName,
        status: m.status as MeetingStatus,
        isNew: m.date.toISOString().slice(0, 10) >= '2026-09-24',
        actionItems: {
          total: 4,
          completed: m.status === 'FINAL' ? 4 : m.status === 'APPROVED' ? 3 : 1,
          inProgress: m.status === 'APPROVED' ? 1 : m.status === 'REVIEW' ? 2 : 1,
          summaryText:
            involvedBiroNames.length > 0
              ? `Biro Terlibat: ${involvedBiroNames}`
              : `Biro Utama: ${m.primaryBiro.code}`,
          isCompletePercentage: m.status === 'FINAL',
        },
        attendees,
        agendaSummary: `Diselenggarakan oleh ${m.primaryBiro.name}. ${
          involvedBiroNames ? `Biro terlibat: ${involvedBiroNames}.` : ''
        }`,
      };
    });
  } catch (error) {
    console.error('Error fetching meetings from Neon DB:', error);
    return [];
  }
}

export async function getDashboardStats() {
  try {
    const [totalMeetings, totalUsers, totalBiros, approvedMeetings, reviewMeetings, draftMeetings] =
      await Promise.all([
        prisma.meeting.count(),
        prisma.user.count(),
        prisma.biro.count(),
        prisma.meeting.count({ where: { status: 'APPROVED' } }),
        prisma.meeting.count({ where: { status: 'REVIEW' } }),
        prisma.meeting.count({ where: { status: 'DRAFT' } }),
      ]);

    // Workload per Biro
    const biros = await prisma.biro.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { primaryMeetings: true },
        },
      },
      orderBy: { code: 'asc' },
    });

    const colors: Record<string, string> = {
      BPPK: 'bg-amber-600',
      PKKEK: 'bg-amber-700',
      IKK: 'bg-amber-500',
      HSDMO: 'bg-amber-800',
      UK: 'bg-amber-900',
    };

    const bureauWorkload: BureauWorkload[] = biros.map((b) => {
      const count = b._count.primaryMeetings;
      const percentage = totalMeetings > 0 ? Math.round((count / totalMeetings) * 100) : 0;
      return {
        code: b.code as BiroCode,
        name: b.shortName,
        count,
        percentage,
        barColor: colors[b.code] || 'bg-amber-600',
      };
    });

    const finalMeetings = await prisma.meeting.count({ where: { status: 'FINAL' } });
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthMeetings = await prisma.meeting.count({
      where: {
        date: {
          gte: startOfMonth,
        },
      },
    });

    const metrics: DashboardMetric[] = [
      {
        id: 'total-rapat',
        label: 'Total Rapat (YTD)',
        value: totalMeetings,
        unit: 'Rapat',
        changeValue: '+100%',
        changeLabel: 'Tersinkronisasi Neon DB',
        variant: 'default',
        iconName: 'event_note',
      },
      {
        id: 'rapat-bulan-ini',
        label: 'Rapat Bulan Ini',
        value: thisMonthMeetings,
        unit: 'Agenda',
        badgeText: `${approvedMeetings} Disetujui`,
        badgeSubtext: 'Bulan Ini',
        variant: 'default',
        iconName: 'calendar_month',
      },
      {
        id: 'tindak-lanjut-aktif',
        label: 'Menunggu Review',
        value: reviewMeetings,
        unit: 'Review',
        badgeText: 'Menunggu Persetujuan',
        badgeSubtext: '(Review)',
        variant: 'default',
        iconName: 'pending_actions',
      },
      {
        id: 'perlu-atensi',
        label: 'Rapat Draft',
        value: draftMeetings,
        unit: 'Draft',
        badgeText: 'Perlu Difinalisasi',
        badgeSubtext: 'Biro Terkait',
        variant: draftMeetings > 0 ? 'danger' : 'default',
        iconName: 'warning',
      },
      {
        id: 'tindak-lanjut-selesai',
        label: 'Rapat Disetujui & Final',
        value: approvedMeetings + finalMeetings,
        unit: 'Selesai',
        badgeText: `${totalMeetings > 0 ? Math.round(((approvedMeetings + finalMeetings) / totalMeetings) * 100) : 0}%`,
        badgeSubtext: 'Tingkat Penyelesaian',
        variant: 'success',
        iconName: 'task_alt',
      },
    ];

    return {
      totalMeetings,
      totalUsers,
      totalBiros,
      approvedMeetings,
      reviewMeetings,
      draftMeetings,
      finalMeetings,
      bureauWorkload,
      metrics,
    };
  } catch (error) {
    console.error('Error calculating dashboard stats from Neon DB:', error);
    return null;
  }
}
