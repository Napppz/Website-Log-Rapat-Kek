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
        actionItems: {
          include: {
            picBiro: true,
            picUser: true,
          },
          orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        },
      },
    });

    return meeting;
  } catch (error) {
    console.error(`Error fetching meeting ${idOrNumber} from Neon DB:`, error);
    return null;
  }
}

export async function getActionItemsFromDb(filters?: {
  meetingId?: string;
  biroCode?: string;
  status?: string;
}) {
  try {
    const whereClause: any = {};

    if (filters?.meetingId) {
      whereClause.meetingId = filters.meetingId;
    }

    if (filters?.biroCode) {
      whereClause.picBiro = {
        code: filters.biroCode.toUpperCase(),
      };
    }

    if (filters?.status && filters.status !== 'ALL') {
      if (filters.status === 'OVERDUE') {
        whereClause.status = { not: 'COMPLETED' };
        whereClause.dueDate = { lt: new Date() };
      } else {
        whereClause.status = filters.status;
      }
    }

    const items = await prisma.actionItem.findMany({
      where: whereClause,
      include: {
        picBiro: true,
        picUser: true,
        meeting: true,
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });

    const now = Date.now();
    return items.map((item) => {
      const isOverdue = item.status !== 'COMPLETED' && new Date(item.dueDate).getTime() < now;
      const computedStatus = isOverdue ? 'OVERDUE' : item.status;
      return {
        ...item,
        computedStatus,
        isOverdue,
      };
    });
  } catch (error) {
    console.error('Error fetching action items from Neon DB:', error);
    return [];
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
        actionItems: true,
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    return meetings.map((m) => {
      const attendees = m.participants.map((p) => p.user.name);
      if (m.chairperson && !attendees.includes(m.chairperson.name)) {
        attendees.unshift(m.chairperson.name);
      }

      const involvedBiroNames = m.meetingBiros.map((mb) => mb.biro.code).join(', ');

      const totalItems = m.actionItems.length;
      const completedItems = m.actionItems.filter((a) => a.status === 'COMPLETED').length;
      const inProgressItems = m.actionItems.filter((a) => a.status === 'IN_PROGRESS').length;
      const pendingItems = m.actionItems.filter((a) => a.status === 'PENDING').length;

      // Fallback display if no action items registered yet for this meeting
      const fallbackTotal = totalItems > 0 ? totalItems : 4;
      const fallbackCompleted =
        totalItems > 0
          ? completedItems
          : m.status === 'FINAL'
          ? 4
          : m.status === 'APPROVED'
          ? 3
          : 1;
      const fallbackInProgress =
        totalItems > 0
          ? inProgressItems
          : m.status === 'APPROVED'
          ? 1
          : m.status === 'REVIEW'
          ? 2
          : 1;

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
        involvedBiros: involvedBiroNames,
        actionItems: {
          total: fallbackTotal,
          completed: fallbackCompleted,
          inProgress: fallbackInProgress,
          pending: pendingItems,
          summaryText:
            totalItems > 0
              ? `${completedItems}/${totalItems} Tindak Lanjut Selesai`
              : involvedBiroNames.length > 0
              ? `Biro Terlibat: ${involvedBiroNames}`
              : `Biro Utama: ${m.primaryBiro.code}`,
          isCompletePercentage: totalItems > 0 ? completedItems === totalItems : m.status === 'FINAL',
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

    // Action Items Real Stats
    const [
      totalActionItems,
      completedActionItems,
      inProgressActionItems,
      pendingActionItems,
      allActionItems,
    ] = await Promise.all([
      prisma.actionItem.count(),
      prisma.actionItem.count({ where: { status: 'COMPLETED' } }),
      prisma.actionItem.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.actionItem.count({ where: { status: 'PENDING' } }),
      prisma.actionItem.findMany({ select: { status: true, dueDate: true } }),
    ]);

    const overdueCount = allActionItems.filter(
      (a) => a.status !== 'COMPLETED' && new Date(a.dueDate).getTime() < Date.now()
    ).length;

    // Follow-up status metric for Donut Chart
    let followUpMetrics = [
      {
        label: 'Selesai',
        percentage: 45,
        count: 64,
        color: '#D97706',
        dasharray: '107.4 238.7',
        dashoffset: '0',
      },
      {
        label: 'Sedang Berjalan',
        percentage: 35,
        count: 50,
        color: '#F59E0B',
        dasharray: '83.5 238.7',
        dashoffset: '-107.4',
      },
      {
        label: 'Belum Dimulai',
        percentage: 15,
        count: 21,
        color: '#FDE68A',
        borderColor: '#F59E0B',
        dasharray: '35.8 238.7',
        dashoffset: '-190.9',
      },
      {
        label: 'Terlambat',
        percentage: 5,
        count: 7,
        color: '#DC2626',
        dasharray: '12 238.7',
        dashoffset: '-226.7',
      },
    ];

    if (totalActionItems > 0) {
      const circ = 238.76;
      const pCompleted = Math.round((completedActionItems / totalActionItems) * 100);
      const pInProgress = Math.round((inProgressActionItems / totalActionItems) * 100);
      const pOverdue = Math.round((overdueCount / totalActionItems) * 100);
      const pPending = Math.max(0, 100 - pCompleted - pInProgress - pOverdue);

      const lenComp = (pCompleted / 100) * circ;
      const lenInProg = (pInProgress / 100) * circ;
      const lenPend = (pPending / 100) * circ;
      const lenOver = (pOverdue / 100) * circ;

      followUpMetrics = [
        {
          label: 'Selesai',
          percentage: pCompleted,
          count: completedActionItems,
          color: '#D97706',
          dasharray: `${lenComp.toFixed(1)} ${circ}`,
          dashoffset: '0',
        },
        {
          label: 'Sedang Berjalan',
          percentage: pInProgress,
          count: inProgressActionItems,
          color: '#F59E0B',
          dasharray: `${lenInProg.toFixed(1)} ${circ}`,
          dashoffset: `-${lenComp.toFixed(1)}`,
        },
        {
          label: 'Belum Dimulai',
          percentage: pPending,
          count: pendingActionItems,
          color: '#FDE68A',
          borderColor: '#F59E0B',
          dasharray: `${lenPend.toFixed(1)} ${circ}`,
          dashoffset: `-${(lenComp + lenInProg).toFixed(1)}`,
        },
        {
          label: 'Terlambat',
          percentage: pOverdue,
          count: overdueCount,
          color: '#DC2626',
          dasharray: `${lenOver.toFixed(1)} ${circ}`,
          dashoffset: `-${(lenComp + lenInProg + lenPend).toFixed(1)}`,
        },
      ];
    }

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
        label: 'Tindak Lanjut Aktif',
        value: totalActionItems > 0 ? inProgressActionItems + pendingActionItems : reviewMeetings,
        unit: 'Item',
        badgeText: `${inProgressActionItems} Sedang Jalan`,
        badgeSubtext: `${pendingActionItems} Menunggu`,
        variant: 'default',
        iconName: 'pending_actions',
      },
      {
        id: 'perlu-atensi',
        label: 'Perlu Atensi (Overdue / Draft)',
        value: totalActionItems > 0 ? overdueCount : draftMeetings,
        unit: 'Item',
        badgeText: overdueCount > 0 ? `${overdueCount} Terlambat` : `${draftMeetings} Draft`,
        badgeSubtext: 'Biro Terkait',
        variant: overdueCount > 0 || draftMeetings > 0 ? 'danger' : 'default',
        iconName: 'warning',
      },
      {
        id: 'tindak-lanjut-selesai',
        label: 'Tindak Lanjut Selesai',
        value: totalActionItems > 0 ? completedActionItems : approvedMeetings + finalMeetings,
        unit: 'Selesai',
        badgeText: `${totalActionItems > 0 ? Math.round((completedActionItems / totalActionItems) * 100) : totalMeetings > 0 ? Math.round(((approvedMeetings + finalMeetings) / totalMeetings) * 100) : 0}%`,
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
      actionItemStats: {
        total: totalActionItems,
        completed: completedActionItems,
        inProgress: inProgressActionItems,
        pending: pendingActionItems,
        overdue: overdueCount,
      },
      followUpMetrics,
    };
  } catch (error) {
    console.error('Error calculating dashboard stats from Neon DB:', error);
    return null;
  }
}
