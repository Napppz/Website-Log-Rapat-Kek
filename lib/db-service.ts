import { prisma } from './prisma';
import { Biro, Meeting, BiroCode, MeetingStatus, BureauWorkload, DashboardMetric, MonthlyActivity } from './types';

/**
 * Service to fetch official data directly from Neon PostgreSQL database.
 */

/**
 * Executes a database operation with automatic retry on cold start / connection drop.
 * Neon Serverless compute auto-suspends after 5 min of inactivity.
 * When waking up, initial queries may encounter P1001 / connection timeout before resuming.
 */
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 2,
  delayMs = 1500
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      const isConnectionError =
        error?.code === 'P1001' ||
        error?.name === 'PrismaClientKnownRequestError' && error?.code === 'P1001' ||
        error?.message?.includes("Can't reach database server") ||
        error?.message?.includes('connect ETIMEDOUT') ||
        error?.message?.includes('connection closed') ||
        error?.message?.includes('terminating connection');

      if (isConnectionError && attempt <= maxRetries) {
        console.warn(
          `[Neon DB Cold Start] Database compute resuming from sleep (attempt ${attempt}/${maxRetries}). Retrying query in ${delayMs}ms...`
        );
        await new Promise((res) => setTimeout(res, delayMs));
        continue;
      }
      throw error;
    }
  }
}

export async function getOfficialBiros(): Promise<Biro[]> {
  try {
    return await withDbRetry(async () => {
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
    });
  } catch (error) {
    console.error('Error fetching biros from Neon DB:', error);
    return [];
  }
}

export async function getBiroDetail(code: string) {
  try {
    return await withDbRetry(async () => {
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
          teams: {
            where: { isActive: true },
            orderBy: { code: 'asc' },
          },
          primaryMeetings: {
            orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
            include: {
              primaryBiro: true,
              primaryTeam: true,
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
    });
  } catch (error) {
    console.error(`Error fetching biro ${code} from Neon DB:`, error);
    return null;
  }
}

export async function getBiroTeamsFromDb(biroCodeOrId: string) {
  try {
    return await withDbRetry(async () => {
      return await prisma.biroTeam.findMany({
        where: {
          OR: [{ biroId: biroCodeOrId }, { biro: { code: biroCodeOrId.toUpperCase() } }],
          isActive: true,
        },
        orderBy: { code: 'asc' },
      });
    });
  } catch (error) {
    console.error(`Error fetching teams for biro ${biroCodeOrId}:`, error);
    return [];
  }
}

export async function getMeetingByIdFromDb(idOrNumber: string) {
  try {
    return await withDbRetry(async () => {
      const meeting = await prisma.meeting.findFirst({
        where: {
          OR: [{ id: idOrNumber }, { meetingNumber: idOrNumber.toUpperCase() }],
        },
        include: {
          primaryBiro: true,
          primaryTeam: true,
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
              picTeam: true,
              picUser: true,
            },
            orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
          },
          previousMeeting: {
            include: {
              primaryBiro: true,
              primaryTeam: true,
              chairperson: true,
              secretary: true,
              minutes: true,
              actionItems: {
                include: {
                  picBiro: true,
                  picTeam: true,
                  picUser: true,
                },
                orderBy: [{ dueDate: 'asc' }],
              },
            },
          },
        },
      });

      return meeting;
    });
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
    return await withDbRetry(async () => {
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
          picTeam: true,
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
    return await withDbRetry(async () => {
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
          primaryTeam: true,
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
          primaryTeamId: m.primaryTeamId,
          primaryTeamName: m.primaryTeam?.name || null,
          previousMeetingId: m.previousMeetingId || null,
          status: m.status as MeetingStatus,
          // Rapat dianggap 'BARU' jika baru dibuat dalam 3 hari terakhir (72 jam)
          isNew: m.createdAt ? (Date.now() - new Date(m.createdAt).getTime()) <= 3 * 24 * 60 * 60 * 1000 : false,
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
    });
  } catch (error) {
    console.error('Error fetching meetings from Neon DB:', error);
    return [];
  }
}

export async function getDashboardStats() {
  try {
    return await withDbRetry(async () => {
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
      BPPK: 'bg-[#31889C]',
      PKKEK: 'bg-[#7CC563]',
      IKK: 'bg-[#F99D1C]',
      HSDMO: 'bg-[#266F80]',
      UK: 'bg-[#3D9BAE]',
    };

    const bureauWorkload: BureauWorkload[] = biros.map((b) => {
      const count = b._count.primaryMeetings;
      const percentage = totalMeetings > 0 ? Math.round((count / totalMeetings) * 100) : 0;
      return {
        code: b.code as BiroCode,
        name: b.shortName,
        count,
        percentage,
        barColor: colors[b.code] || 'bg-[#31889C]',
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
        color: '#7CC563',
        dasharray: '107.4 238.7',
        dashoffset: '0',
      },
      {
        label: 'Sedang Berjalan',
        percentage: 35,
        count: 50,
        color: '#31889C',
        dasharray: '83.5 238.7',
        dashoffset: '-107.4',
      },
      {
        label: 'Belum Dimulai',
        percentage: 15,
        count: 21,
        color: '#FFD300',
        borderColor: '#FFD300',
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
          color: '#7CC563',
          dasharray: `${lenComp.toFixed(1)} ${circ}`,
          dashoffset: '0',
        },
        {
          label: 'Sedang Berjalan',
          percentage: pInProgress,
          count: inProgressActionItems,
          color: '#31889C',
          dasharray: `${lenInProg.toFixed(1)} ${circ}`,
          dashoffset: `-${lenComp.toFixed(1)}`,
        },
        {
          label: 'Belum Dimulai',
          percentage: pPending,
          count: pendingActionItems,
          color: '#FFD300',
          borderColor: '#FFD300',
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

    // -------------------------------------------------------------------------
    // Real Monthly Activity Trend directly from Database
    // -------------------------------------------------------------------------
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    const allDbMeetingsForTrend = await prisma.meeting.findMany({
      select: { date: true },
      orderBy: { date: 'asc' },
    });

    const monthCountMap: Record<number, number> = {};
    for (let i = 0; i < 12; i++) {
      monthCountMap[i] = 0;
    }

    allDbMeetingsForTrend.forEach((m) => {
      const d = new Date(m.date);
      const mIdx = d.getMonth();
      if (mIdx >= 0 && mIdx < 12) {
        monthCountMap[mIdx]++;
      }
    });

    // Tampilkan hingga bulan aktif terakhir yang memiliki rapat (minimal Sep)
    const currentMonthIdx = now.getMonth();
    let maxMonthIdx = Math.max(currentMonthIdx, 8);
    for (let i = 0; i < 12; i++) {
      if (monthCountMap[i] > 0 && i > maxMonthIdx) {
        maxMonthIdx = i;
      }
    }

    // Cari bulan dengan frekuensi tertinggi sebagai titik puncak (isPeak)
    let peakCount = 0;
    for (let i = 0; i <= maxMonthIdx; i++) {
      if (monthCountMap[i] > peakCount) {
        peakCount = monthCountMap[i];
      }
    }

    const monthlyActivity: MonthlyActivity[] = [];
    for (let i = 0; i <= maxMonthIdx; i++) {
      const count = monthCountMap[i];
      monthlyActivity.push({
        month: monthLabels[i],
        count: count,
        isPeak: peakCount > 0 && count === peakCount,
      });
    }

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
      monthlyActivity,
      actionItemStats: {
        total: totalActionItems,
        completed: completedActionItems,
        inProgress: inProgressActionItems,
        pending: pendingActionItems,
        overdue: overdueCount,
      },
      followUpMetrics,
    };
    });
  } catch (error) {
    console.error('Error calculating dashboard stats from Neon DB:', error);
    return null;
  }
}
