import { prisma } from './prisma';
import { Biro, Meeting, BiroCode, MeetingStatus, BureauWorkload, DashboardMetric, MonthlyActivity, TeamWorkloadMetric, TeamWithMembers, TeamMember } from './types';
import { parsePicDeliverableDescription } from './pic-deliverables';

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
          actionItems: {
            select: {
              id: true,
              title: true,
              status: true,
              dueDate: true,
              priority: true,
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
              logs: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      role: true,
                    },
                  },
                },
                orderBy: { createdAt: 'desc' },
              },
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

      if (meeting) {
        try {
          const rawAttachments: any[] = await prisma.$queryRawUnsafe(
            `SELECT id_lampiran AS "id", id_kegiatan AS "meetingId", nama_berkas AS "fileName", url_berkas AS "fileUrl", ukuran_berkas AS "fileSize", tipe_berkas AS "fileType", nama_pengunggah AS "uploadedBy", kategori AS "category", dibuat_pada AS "createdAt" FROM lampiran_kegiatan WHERE id_kegiatan = $1 ORDER BY dibuat_pada ASC`,
            meeting.id
          );
          (meeting as any).attachments = rawAttachments || [];
        } catch (attErr) {
          console.error('Error fetching meeting attachments:', attErr);
          (meeting as any).attachments = [];
        }

        // Auto-start check: Jika tanggal kegiatan telah tiba dan masih 'Belum Dimulai'
        const todayWibStr = getWibTodayDateString();
        const meetingDateStr = meeting.date.toISOString().slice(0, 10);
        const isDateArrived = meetingDateStr <= todayWibStr;
        const rawProg = (meeting as any).progressStatus || 'Start';
        const isBelumDimulai =
          rawProg === 'Belum Dimulai' ||
          rawProg === 'Start' ||
          rawProg === 'draft' ||
          (meeting.status === 'DRAFT' && rawProg !== 'Selesai' && rawProg !== 'Dalam Proses');

        // Auto-complete check: Jika salah satu PIC sudah menyelesaikan tindak lanjut
        const hasCompletedActionItem =
          Array.isArray(meeting.actionItems) &&
          meeting.actionItems.some((ai: any) => ai.status === 'COMPLETED');

        if (hasCompletedActionItem) {
          (meeting as any).progressStatus = 'Selesai';
          meeting.status = 'FINAL';
          if (meeting.status !== 'FINAL' || (meeting as any).progressStatus !== 'Selesai') {
            prisma.meeting.update({
              where: { id: meeting.id },
              data: { progressStatus: 'Selesai', status: 'FINAL' },
            }).catch(() => {});
          }
        } else if (isDateArrived && isBelumDimulai) {
          (meeting as any).progressStatus = 'Dalam Proses';
          meeting.status = 'REVIEW';
          prisma.meeting.update({
            where: { id: meeting.id },
            data: { progressStatus: 'Dalam Proses', status: 'REVIEW' },
          }).catch(() => {});
        }
      }

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
  teamCode?: string | null;
  teamCodes?: string[] | null;
  teamId?: string | null;
  userId?: string | null;
}) {
  try {
    return await withDbRetry(async () => {
      const andConditions: any[] = [];

      if (filters?.meetingId) {
        andConditions.push({ meetingId: filters.meetingId });
      }

      if (filters?.biroCode) {
        andConditions.push({
          picBiro: {
            code: filters.biroCode.toUpperCase(),
          },
        });
      }

      if ((filters?.teamCodes && filters.teamCodes.length > 0) || filters?.teamCode || filters?.teamId || filters?.userId) {
        const teamOrs: any[] = [];
        if (filters?.teamCodes && filters.teamCodes.length > 0) {
          const uCodes = filters.teamCodes.map((c) => c.toUpperCase());
          teamOrs.push({ picTeam: { code: { in: uCodes } } });
          uCodes.forEach((code) => {
            teamOrs.push({ meeting: { meetingNumber: { startsWith: `${code}-` } } });
          });
        } else if (filters?.teamCode) {
          const tCode = filters.teamCode.toUpperCase();
          teamOrs.push({ picTeam: { code: tCode } });
          teamOrs.push({ meeting: { meetingNumber: { startsWith: `${tCode}-` } } });
        }
        if (filters?.teamId) {
          teamOrs.push({ picTeamId: filters.teamId });
        }
        if (filters?.userId) {
          teamOrs.push({ picUserId: filters.userId });
        }
        if (teamOrs.length > 0) {
          andConditions.push({ OR: teamOrs });
        }
      }

      if (filters?.status && filters.status !== 'ALL') {
        if (filters.status === 'OVERDUE') {
          andConditions.push({
            status: { not: 'COMPLETED' },
            dueDate: { lt: new Date() },
          });
        } else {
          andConditions.push({ status: filters.status });
        }
      }

      const whereClause: any = andConditions.length > 0 ? { AND: andConditions } : {};

      const items = await prisma.actionItem.findMany({
        where: whereClause,
        include: {
          picBiro: true,
          picTeam: true,
          picUser: true,
          meeting: true,
          logs: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              progress: true,
              notes: true,
              createdAt: true,
              user: {
                select: { name: true },
              },
            },
          },
          _count: {
            select: { logs: true },
          },
        },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      });

      const now = Date.now();
      return items.map((item) => {
        const isOverdue = item.status !== 'COMPLETED' && new Date(item.dueDate).getTime() < now;
        const computedStatus = isOverdue ? 'OVERDUE' : item.status;
        const latestLog = item.logs?.[0];
        const latestProgress =
          latestLog?.progress !== undefined && latestLog?.progress !== null
            ? Number(latestLog.progress)
            : item.status === 'COMPLETED'
              ? 100
              : item.status === 'IN_PROGRESS'
                ? 50
                : 0;

        return {
          ...item,
          computedStatus,
          isOverdue,
          latestProgress,
          latestLogNote: latestLog?.notes ?? null,
          latestLogCreatedAt: latestLog?.createdAt ?? null,
          latestLogUser: latestLog?.user?.name ?? null,
          logsCount: item._count?.logs ?? 0,
        };
      });
    });
  } catch (error) {
    console.error('Error fetching action items from Neon DB:', error);
    return [];
  }
}

/**
 * Helper mendapatkan tanggal hari ini dalam format YYYY-MM-DD zona waktu Indonesia Barat (WIB / Asia/Jakarta).
 */
export function getWibTodayDateString(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Otomatis memulai kegiatan sesuai tanggal pelaksanaan:
 * Setiap kegiatan yang tanggal pelaksanaannya telah tiba (date <= hari ini WIB)
 * dan masih berstatus 'Belum Dimulai' / 'DRAFT', otomatis disinkronkan dan diubah ke 'Dalam Proses' (REVIEW).
 * Menghilangkan keharusan pengguna untuk menekan tombol "Mulai Kegiatan" secara manual.
 */
export async function syncAutoStartedMeetings(): Promise<number> {
  try {
    const todayWib = getWibTodayDateString();
    const endOfTodayWib = new Date(`${todayWib}T23:59:59.999+07:00`);

    const result = await prisma.meeting.updateMany({
      where: {
        date: { lte: endOfTodayWib },
        OR: [
          { progressStatus: 'Belum Dimulai' },
          { progressStatus: 'Start' },
          { progressStatus: 'draft' },
          { progressStatus: null },
          { status: 'DRAFT', progressStatus: { notIn: ['Selesai', 'Dalam Proses'] } },
        ],
      },
      data: {
        progressStatus: 'Dalam Proses',
        status: 'REVIEW',
      },
    });

    return result.count;
  } catch (error) {
    console.error('Error auto-starting meetings on date:', error);
    return 0;
  }
}

/**
 * Sinkronisasi otomatis status kegiatan menjadi 'Selesai' (FINAL)
 * ketika setidaknya salah satu PIC sudah menyelesaikan hasil tindak lanjut (status === 'COMPLETED').
 */
export async function syncAutoCompletedMeetings(): Promise<number> {
  try {
    const meetingsToComplete = await prisma.meeting.findMany({
      where: {
        actionItems: {
          some: { status: 'COMPLETED' },
        },
        OR: [
          { status: { not: 'FINAL' } },
          { progressStatus: { not: 'Selesai' } },
          { progressStatus: null },
        ],
      },
      select: { id: true },
    });

    if (meetingsToComplete.length === 0) return 0;

    const ids = meetingsToComplete.map((m) => m.id);
    const result = await prisma.meeting.updateMany({
      where: { id: { in: ids } },
      data: {
        progressStatus: 'Selesai',
        status: 'FINAL',
      },
    });

    return result.count;
  } catch (error) {
    console.error('Error auto-completing meetings with completed action items:', error);
    return 0;
  }
}

export async function getMeetingsFromDb(filters?: {
  biroCode?: string | null;
  status?: MeetingStatus | null;
  teamCode?: string | null;
  teamCodes?: string[] | null;
  teamId?: string | null;
}): Promise<Meeting[]> {
  try {
    return await withDbRetry(async () => {
      // Sinkronkan status kegiatan otomatis sesuai tanggal pelaksanaan yang telah tiba
      await syncAutoStartedMeetings().catch(() => {});
      // Sinkronkan otomatis kegiatan menjadi Selesai jika salah satu PIC telah menyelesaikan tindak lanjut
      await syncAutoCompletedMeetings().catch(() => {});

      const andConditions: any[] = [];

      if (filters?.biroCode) {
        andConditions.push({
          OR: [
            { primaryBiro: { code: filters.biroCode.toUpperCase() } },
            { meetingBiros: { some: { biro: { code: filters.biroCode.toUpperCase() } } } },
          ],
        });
      }

      if (filters?.teamCodes && filters.teamCodes.length > 0) {
        const uppercaseCodes = filters.teamCodes.map((c) => c.toUpperCase());
        const teamOrs: any[] = [
          { primaryTeam: { code: { in: uppercaseCodes } } },
          ...uppercaseCodes.map((code) => ({ meetingNumber: { startsWith: `${code}-` } })),
        ];
        if (filters.teamId) {
          teamOrs.push({ primaryTeamId: filters.teamId });
        }
        andConditions.push({ OR: teamOrs });
      } else if (filters?.teamCode) {
        const tCode = filters.teamCode.toUpperCase();
        const teamOrs: any[] = [
          { primaryTeam: { code: tCode } },
          { meetingNumber: { startsWith: `${tCode}-` } },
        ];
        if (filters.teamId) {
          teamOrs.push({ primaryTeamId: filters.teamId });
        }
        andConditions.push({ OR: teamOrs });
      } else if (filters?.teamId) {
        andConditions.push({ primaryTeamId: filters.teamId });
      }

      if (filters?.status) {
        andConditions.push({ status: filters.status });
      }

      const whereClause: any = andConditions.length > 0 ? { AND: andConditions } : {};

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
        orderBy: [{ date: 'desc' }, { meetingNumber: 'desc' }, { createdAt: 'desc' }],
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

        const todayWibStr = getWibTodayDateString();
        const meetingDateStr = m.date.toISOString().slice(0, 10);
        const isDateArrived = meetingDateStr <= todayWibStr;
        const rawProg = (m as any).progressStatus || 'Start';
        const isBelumDimulai =
          rawProg === 'Belum Dimulai' ||
          rawProg === 'Start' ||
          rawProg === 'draft' ||
          (m.status === 'DRAFT' && rawProg !== 'Selesai' && rawProg !== 'Dalam Proses');

        // Otomatis Selesai jika salah satu PIC sudah menyelesaikan tindak lanjut
        const hasCompletedActionItem = completedItems > 0;
        const isSelesai = hasCompletedActionItem || m.status === 'FINAL' || rawProg === 'Selesai';

        const effectiveStatus = isSelesai
          ? ('FINAL' as MeetingStatus)
          : (isDateArrived && isBelumDimulai)
            ? ('REVIEW' as MeetingStatus)
            : (m.status as MeetingStatus);

        const effectiveProgress = isSelesai
          ? 'Selesai'
          : (isDateArrived && isBelumDimulai)
            ? 'Dalam Proses'
            : rawProg;

        return {
          id: m.id,
          code: m.meetingNumber,
          title: m.title,
          date: meetingDateStr,
          time: `${m.startTime} - ${m.endTime} WIB`,
          location: m.location,
          biroCode: m.primaryBiro.code as BiroCode,
          biroName: m.primaryBiro.shortName,
          primaryTeamId: m.primaryTeamId,
          primaryTeamCode: m.primaryTeam?.code || null,
          primaryTeamName: m.primaryTeam?.name || null,
          previousMeetingId: m.previousMeetingId || null,
          status: effectiveStatus,
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
                : `${fallbackCompleted}/${fallbackTotal} Tindak Lanjut Selesai`,
            isCompletePercentage: totalItems > 0 ? completedItems === totalItems : effectiveStatus === 'FINAL',
          },
          attendees,
          agendaSummary: `Diselenggarakan oleh ${m.primaryTeam?.name ? `Tim ${m.primaryTeam.name}` : 'Tim Kerja KEK'}.`,
          invitationDocUrl: m.invitationDocUrl || null,
          invitationDocName: m.invitationDocName || null,
          invitationDocSize: m.invitationDocSize || null,
          documentCategory: (m as any).documentCategory || 'UNDANGAN_INTERNAL',
          documentSubCategory: (m as any).documentSubCategory || null,
          sourceOrigin: (m as any).sourceOrigin || null,
          postponeReason: (m as any).postponeReason || null,
          meetingKind: (m as any).meetingKind || null,
          picName: (m as any).picName || null,
          progressStatus: effectiveProgress,
          categoryDocUrl: (m as any).categoryDocUrl || null,
          categoryDocName: (m as any).categoryDocName || null,
          categoryDocSize: (m as any).categoryDocSize || null,
          materialDocUrl: (m as any).materialDocUrl || null,
          materialDocName: (m as any).materialDocName || null,
          materialDocSize: (m as any).materialDocSize || null,
          driveLink: (m as any).driveLink || null,
          notes: (m as any).notes || null,
          actionPlan: (m as any).actionPlan || 'Rutin',
          ndConsumptionNumber: (m as any).ndConsumptionNumber || null,
          ndConsumptionStatus: (m as any).ndConsumptionStatus || null,
          releaseUrl: (m as any).releaseUrl || null,
          releaseTitle: (m as any).releaseTitle || null,
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
      await syncAutoStartedMeetings().catch(() => {});
      await syncAutoCompletedMeetings().catch(() => {});

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
          label: 'Total Kegiatan (YTD)',
          value: totalMeetings,
          unit: 'Kegiatan',
          changeValue: '+100%',
          changeLabel: 'Tersinkronisasi Neon DB',
          variant: 'default',
          iconName: 'event_note',
        },
        {
          id: 'rapat-bulan-ini',
          label: 'Kegiatan Bulan Ini',
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
          badgeText: `${totalActionItems > 0 ? completedActionItems : approvedMeetings + finalMeetings} Finish`,
          badgeSubtext: 'Status Selesai',
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

      // Cari bulan dengan frekuensi tertinggi sebagai titik puncak (isPeak)
      let peakCount = 0;
      for (let i = 0; i < 12; i++) {
        if (monthCountMap[i] > peakCount) {
          peakCount = monthCountMap[i];
        }
      }

      // Seluruh 12 bulan dari Januari hingga Desember (akumulasi seluruh kegiatan dan tim)
      const monthlyActivity: MonthlyActivity[] = [];
      for (let i = 0; i < 12; i++) {
        const count = monthCountMap[i];
        monthlyActivity.push({
          month: monthLabels[i],
          count: count,
          isPeak: peakCount > 0 && count === peakCount,
        });
      }

      // 5 Tim Kerja Biro 3 (Investasi, Kerja Sama, Komunikasi, Sistem Informasi, Hukum) & Dynamic Teams
      const rawTeamUsers = await prisma.$queryRaw<
        Array<{ id: string; nama: string; email: string; peran: string; id_tim: string | null }>
      >`SELECT id_pengguna as id, nama_lengkap as nama, email, peran, id_tim FROM pengguna WHERE status_aktif = true`;

      let rawUserTeams: Array<{ id_pengguna: string; id_tim: string }> = [];
      try {
        rawUserTeams = await prisma.$queryRaw<
          Array<{ id_pengguna: string; id_tim: string }>
        >`SELECT id_pengguna, id_tim FROM pengguna_tim`;
      } catch (e) {
        // Fallback if table not queried
      }

      const CANONICAL_TEAM_CODES = ['INV', 'KS', 'KOM', 'SI', 'HKM'];

      const fetchedTeams = await prisma.biroTeam.findMany({
        where: {
          isActive: true,
        },
        include: {
          primaryMeetings: {
            select: {
              id: true,
              meetingNumber: true,
              title: true,
              date: true,
              status: true,
            },
            orderBy: { date: 'desc' },
          },
          actionItems: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              dueDate: true,
              priority: true,
              meetingId: true,
              picUser: { select: { name: true } },
              meeting: { select: { id: true, meetingNumber: true, title: true } },
            },
            orderBy: [{ dueDate: 'asc' }],
          },
        },
      });

      // Sort with canonical order first, then any additional dynamic teams
      const rawTeams = fetchedTeams.sort((a, b) => {
        const idxA = CANONICAL_TEAM_CODES.indexOf(a.code.toUpperCase());
        const idxB = CANONICAL_TEAM_CODES.indexOf(b.code.toUpperCase());
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.name.localeCompare(b.name);
      });

      const teamWorkload: TeamWorkloadMetric[] = rawTeams.map((t) => {
        const meetingCount = t.primaryMeetings.length;
        const meetingPercentage = totalMeetings > 0 ? Math.round((meetingCount / totalMeetings) * 100) : 0;
        const totalJobs = t.actionItems.length;
        const completedJobs = t.actionItems.filter((a) => a.status === 'COMPLETED').length;
        const inProgressJobs = t.actionItems.filter((a) => a.status === 'IN_PROGRESS').length;
        const pendingJobs = t.actionItems.filter((a) => a.status === 'PENDING').length;
        const overdueJobs = t.actionItems.filter(
          (a) => a.status !== 'COMPLETED' && a.dueDate && new Date(a.dueDate).getTime() < Date.now()
        ).length;
        const completionRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;

        const memberIdsForThisTeam = new Set<string>();
        rawTeamUsers.filter((u) => u.id_tim === t.id).forEach((u) => memberIdsForThisTeam.add(u.id));
        rawUserTeams.filter((ut) => ut.id_tim === t.id).forEach((ut) => memberIdsForThisTeam.add(ut.id_pengguna));

        const teamMembers = rawTeamUsers
          .filter((u) => memberIdsForThisTeam.has(u.id))
          .map((u) => ({
            id: u.id,
            name: u.nama,
            email: u.email,
            role: u.peran,
          }));

        return {
          id: t.id,
          code: t.code,
          name: t.name,
          fullName: t.name.startsWith('Tim ') ? t.name : `Tim ${t.name}`,
          description: t.description,
          meetingCount,
          meetingPercentage,
          totalJobs,
          completedJobs,
          inProgressJobs,
          pendingJobs,
          overdueJobs,
          completionRate,
          memberCount: teamMembers.length,
          members: teamMembers,
          actionItems: t.actionItems.map((a) => {
            const parsed = parsePicDeliverableDescription(a.description);
            return {
              id: a.id,
              title: a.title,
              description: a.description,
              linkUrl: parsed.linkUrl || null,
              linkTitle: parsed.linkTitle || null,
              fileUrl: parsed.fileUrl || null,
              fileName: parsed.fileName || null,
              notes: parsed.notes || null,
              status: a.status,
              dueDate: a.dueDate ? a.dueDate.toISOString().slice(0, 10) : null,
              priority: a.priority,
              picName: a.picUser?.name || null,
              progress: a.status === 'COMPLETED' ? 100 : a.status === 'IN_PROGRESS' ? 50 : 0,
              meetingId: a.meetingId || a.meeting?.id || null,
              meetingNumber: a.meeting?.meetingNumber || null,
              meetingTitle: a.meeting?.title || null,
            };
          }),
          meetings: t.primaryMeetings.map((m) => ({
            id: m.id,
            meetingNumber: m.meetingNumber,
            title: m.title,
            date: m.date.toISOString().slice(0, 10),
            status: m.status as any,
            progressStatus: (m as any).progressStatus || 'Start',
          })),
        };
      });

      // Category Distribution
      const allMeetingsCategory = await prisma.meeting.findMany({
        select: { documentCategory: true, documentSubCategory: true },
      });

      const countUndanganInternal = allMeetingsCategory.filter(
        (m) => (m.documentCategory || 'UNDANGAN_INTERNAL').toUpperCase() === 'UNDANGAN_INTERNAL'
      ).length;
      const countDisposisiSetjen = allMeetingsCategory.filter((m) => {
        const cat = (m.documentCategory || '').toUpperCase();
        const sub = (m.documentSubCategory || '').toUpperCase();
        return cat === 'DISPOSISI_Setjen' || (cat === 'NASKAH_MASUK' && sub === 'DISPOSISI_Setjen');
      }).length;
      const countNaskahMasuk = allMeetingsCategory.filter((m) => {
        const cat = (m.documentCategory || '').toUpperCase();
        const sub = (m.documentSubCategory || '').toUpperCase();
        return (
          (cat === 'NASKAH_MASUK' || cat === 'DAFTAR_NASKAH_MASUK') &&
          sub !== 'DISPOSISI_Setjen' &&
          sub !== 'DISPOSISI_BIRO'
        );
      }).length;
      const countDisposisiBiro = allMeetingsCategory.filter((m) => {
        const cat = (m.documentCategory || '').toUpperCase();
        const sub = (m.documentSubCategory || '').toUpperCase();
        return cat === 'DISPOSISI_BIRO' || (cat === 'NASKAH_MASUK' && sub === 'DISPOSISI_BIRO');
      }).length;
      const countTundaRapat = allMeetingsCategory.filter((m) => {
        const cat = (m.documentCategory || '').toUpperCase();
        return cat === 'SURAT_DITUNDA' || cat === 'TUNDA_RAPAT';
      }).length;

      const categoryDistribution = [
        {
          key: 'UNDANGAN_INTERNAL',
          label: 'Undangan Internal',
          count: countUndanganInternal,
          percentage: totalMeetings > 0 ? Math.round((countUndanganInternal / totalMeetings) * 100) : 0,
        },
        {
          key: 'DISPOSISI_Setjen',
          label: 'Disposisi Setjen',
          count: countDisposisiSetjen,
          percentage: totalMeetings > 0 ? Math.round((countDisposisiSetjen / totalMeetings) * 100) : 0,
        },
        {
          key: 'NASKAH_MASUK',
          label: 'Daftar Naskah Masuk',
          count: countNaskahMasuk,
          percentage: totalMeetings > 0 ? Math.round((countNaskahMasuk / totalMeetings) * 100) : 0,
        },
        {
          key: 'DISPOSISI_BIRO',
          label: 'Disposisi Biro',
          count: countDisposisiBiro,
          percentage: totalMeetings > 0 ? Math.round((countDisposisiBiro / totalMeetings) * 100) : 0,
        },
        {
          key: 'SURAT_DITUNDA',
          label: 'Tunda Kegiatan',
          count: countTundaRapat,
          percentage: totalMeetings > 0 ? Math.round((countTundaRapat / totalMeetings) * 100) : 0,
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
        teamWorkload,
        categoryDistribution,
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

export async function getTeamsWithMembers(biroCode?: string): Promise<TeamWithMembers[]> {
  try {
    return await withDbRetry(async () => {
      const where: any = { isActive: true };
      if (biroCode) {
        let upper = biroCode.toUpperCase().trim();
        if (upper === 'INV') upper = 'IKK';
        where.biro = { code: upper };
      }

      const dbTeams = await prisma.biroTeam.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              isActive: true,
            },
            orderBy: [{ role: 'asc' }, { name: 'asc' }],
          },
          userTeams: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  isActive: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: [{ code: 'asc' }],
      });

      return dbTeams.map((t) => {
        const memberMap = new Map<string, TeamMember>();

        // 1. Direct assigned users
        for (const u of t.users) {
          memberMap.set(u.id, {
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            teamRole: u.role === 'ADMIN' ? 'PJ_UTAMA' : 'ANGGOTA',
            isActive: u.isActive,
          });
        }

        // 2. Multi-team users from userTeams
        for (const ut of t.userTeams) {
          if (ut.user) {
            const existing = memberMap.get(ut.user.id);
            memberMap.set(ut.user.id, {
              id: ut.user.id,
              name: ut.user.name,
              email: ut.user.email,
              role: ut.user.role,
              teamRole: ut.role || existing?.teamRole || 'ANGGOTA',
              isActive: ut.user.isActive,
            });
          }
        }

        const members = Array.from(memberMap.values()).sort((a, b) => {
          const getPriority = (m: TeamMember) => {
            if (m.teamRole === 'PJ_UTAMA' || m.teamRole === 'PIC') return 1;
            if (m.role === 'ADMIN') return 2;
            if (m.role === 'STAFF') return 3;
            return 4;
          };
          return getPriority(a) - getPriority(b) || a.name.localeCompare(b.name);
        });

        return {
          id: t.id,
          code: t.code,
          name: t.name,
          shortName: t.code,
          description: t.description,
          members,
        };
      });
    });
  } catch (error) {
    console.error('Error fetching teams with members from Neon DB:', error);
    return [];
  }
}

