import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { computeActionItemStatus } from '@/lib/validations/action-item';
import {
  ReportQueryInput,
  OFFICIAL_REPORT_BIROS,
  OfficialBiroCode,
} from '@/lib/validations/report';

export interface PeriodResolution {
  period: 'WEEK' | 'MONTH' | 'QUARTER' | 'CUSTOM';
  startDate: Date;
  endDate: Date;
  startDateIso: string; // YYYY-MM-DD in WIB
  endDateIso: string; // YYYY-MM-DD in WIB
  label: string;
}

export interface KpiSummary {
  totalMeetings: number;
  totalActionItems: number;
  completedActionItems: number;
  inProgressActionItems: number;
  pendingActionItems: number;
  overdueActionItems: number;
  completionRate: number; // 0 - 100
  meetingsWithMinutes: number;
  meetingsWithoutMinutes: number;
  minutesCompletionRate: number; // 0 - 100
  deadlineInPeriodCount: number;
  deadlineOverdueCount: number;
}

export interface BiroStatItem {
  code: OfficialBiroCode;
  name: string;
  shortName: string;
  totalMeetings: number;
  totalActionItems: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
  completionRate: number;
}

export interface TrendPoint {
  key: string;
  label: string;
  subLabel?: string;
  totalMeetings: number;
  totalActionItems: number;
  completed: number;
  overdue: number;
}

export interface MeetingReportItem {
  id: string;
  meetingNumber: string;
  title: string;
  date: string;
  formattedDate: string;
  biroCode: string;
  biroName: string;
  hasMinutes: boolean;
  statusNotulen: 'Tersedia' | 'Belum tersedia';
  totalActionItems: number;
  completedActionItems: number;
}

export interface ReportSummaryResult {
  period: PeriodResolution;
  biro: string; // ALL or specific
  kpi: KpiSummary;
  biroSummary: BiroStatItem[];
  biroTotalRow: BiroStatItem;
  trend: TrendPoint[];
  meetings: MeetingReportItem[];
}

const INDO_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const INDO_MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

const INDO_DAYS = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

/**
 * Format a Date to WIB YYYY-MM-DD
 */
export function formatWibDateIso(date: Date): string {
  const wibTime = date.getTime() + 7 * 60 * 60 * 1000;
  const wibDate = new Date(wibTime);
  const y = wibDate.getUTCFullYear();
  const m = String(wibDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(wibDate.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format a Date to Indonesian full text (e.g., "24 September 2026")
 */
export function formatWibDateIndo(date: Date, withDay = false): string {
  const wibTime = date.getTime() + 7 * 60 * 60 * 1000;
  const wibDate = new Date(wibTime);
  const d = wibDate.getUTCDate();
  const m = INDO_MONTHS[wibDate.getUTCMonth()];
  const y = wibDate.getUTCFullYear();
  const dayName = INDO_DAYS[wibDate.getUTCDay()];
  return withDay ? `${dayName}, ${d} ${m} ${y}` : `${d} ${m} ${y}`;
}

/**
 * Resolves period boundaries according to Asia/Jakarta (WIB = UTC+7)
 */
export function resolvePeriodDates(
  params: {
    period: 'WEEK' | 'MONTH' | 'QUARTER' | 'CUSTOM';
    startDate?: string;
    endDate?: string;
  },
  referenceDate: Date = new Date()
): PeriodResolution {
  const { period, startDate, endDate } = params;

  // Work in WIB components
  const refWib = new Date(referenceDate.getTime() + 7 * 60 * 60 * 1000);
  const refYear = refWib.getUTCFullYear();
  const refMonth = refWib.getUTCMonth(); // 0-11
  const refDate = refWib.getUTCDate();
  const refDay = refWib.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

  if (period === 'WEEK') {
    // Senin = 1, Minggu = 7. If Sunday (0), it is day 7
    const diffToMonday = refDay === 0 ? -6 : 1 - refDay;
    const mondayWibUtc = Date.UTC(refYear, refMonth, refDate + diffToMonday, 0, 0, 0, 0);
    const sundayWibUtc = Date.UTC(refYear, refMonth, refDate + diffToMonday + 6, 23, 59, 59, 999);

    const startUtc = new Date(mondayWibUtc - 7 * 60 * 60 * 1000);
    const endUtc = new Date(sundayWibUtc - 7 * 60 * 60 * 1000);

    const startIso = formatWibDateIso(startUtc);
    const endIso = formatWibDateIso(endUtc);
    const label = `${formatWibDateIndo(startUtc)} – ${formatWibDateIndo(endUtc)}`;

    return {
      period: 'WEEK',
      startDate: startUtc,
      endDate: endUtc,
      startDateIso: startIso,
      endDateIso: endIso,
      label,
    };
  }

  if (period === 'MONTH') {
    const startWibUtc = Date.UTC(refYear, refMonth, 1, 0, 0, 0, 0);
    // Day 0 of next month is the last day of this month
    const endWibUtc = Date.UTC(refYear, refMonth + 1, 0, 23, 59, 59, 999);

    const startUtc = new Date(startWibUtc - 7 * 60 * 60 * 1000);
    const endUtc = new Date(endWibUtc - 7 * 60 * 60 * 1000);

    const startIso = formatWibDateIso(startUtc);
    const endIso = formatWibDateIso(endUtc);
    const label = `${INDO_MONTHS[refMonth]} ${refYear}`;

    return {
      period: 'MONTH',
      startDate: startUtc,
      endDate: endUtc,
      startDateIso: startIso,
      endDateIso: endIso,
      label,
    };
  }

  if (period === 'QUARTER') {
    const quarterIndex = Math.floor(refMonth / 3); // 0, 1, 2, 3
    const qRoman = ['I', 'II', 'III', 'IV'][quarterIndex];
    const startMonth = quarterIndex * 3;
    const endMonth = quarterIndex * 3 + 2;

    const startWibUtc = Date.UTC(refYear, startMonth, 1, 0, 0, 0, 0);
    const endWibUtc = Date.UTC(refYear, endMonth + 1, 0, 23, 59, 59, 999);

    const startUtc = new Date(startWibUtc - 7 * 60 * 60 * 1000);
    const endUtc = new Date(endWibUtc - 7 * 60 * 60 * 1000);

    const startIso = formatWibDateIso(startUtc);
    const endIso = formatWibDateIso(endUtc);
    const label = `Kuartal ${qRoman} ${refYear} (${INDO_MONTHS[startMonth]} – ${INDO_MONTHS[endMonth]} ${refYear})`;

    return {
      period: 'QUARTER',
      startDate: startUtc,
      endDate: endUtc,
      startDateIso: startIso,
      endDateIso: endIso,
      label,
    };
  }

  // CUSTOM
  if (!startDate || !endDate) {
    throw new Error('startDate dan endDate wajib diisi untuk periode CUSTOM');
  }

  const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
  const [eYear, eMonth, eDay] = endDate.split('-').map(Number);

  const startWibUtc = Date.UTC(sYear, sMonth - 1, sDay, 0, 0, 0, 0);
  const endWibUtc = Date.UTC(eYear, eMonth - 1, eDay, 23, 59, 59, 999);

  const startUtc = new Date(startWibUtc - 7 * 60 * 60 * 1000);
  const endUtc = new Date(endWibUtc - 7 * 60 * 60 * 1000);

  const label = `${formatWibDateIndo(startUtc)} – ${formatWibDateIndo(endUtc)}`;

  return {
    period: 'CUSTOM',
    startDate: startUtc,
    endDate: endUtc,
    startDateIso: startDate,
    endDateIso: endDate,
    label,
  };
}

/**
 * Builds trend grouping based on period and range
 */
export function buildTrendPoints(
  periodRes: PeriodResolution,
  meetings: Array<{
    date: Date;
    actionItems: Array<{ computedStatus: string }>;
  }>
): TrendPoint[] {
  const { period, startDate, endDate } = periodRes;

  // Convert meeting dates to WIB Date objects
  const meetingsWithWib = meetings.map((m) => {
    const wib = new Date(m.date.getTime() + 7 * 60 * 60 * 1000);
    return {
      meetingDateWib: wib,
      actionItems: m.actionItems,
    };
  });

  if (period === 'WEEK') {
    // 7 days from Monday to Sunday
    const points: TrendPoint[] = [];
    const startWib = new Date(startDate.getTime() + 7 * 60 * 60 * 1000);

    for (let i = 0; i < 7; i++) {
      const cur = new Date(
        Date.UTC(
          startWib.getUTCFullYear(),
          startWib.getUTCMonth(),
          startWib.getUTCDate() + i
        )
      );
      const dayName = INDO_DAYS[cur.getUTCDay()];
      const d = cur.getUTCDate();
      const m = INDO_MONTHS_SHORT[cur.getUTCMonth()];
      const key = `${cur.getUTCFullYear()}-${String(cur.getUTCMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      const matched = meetingsWithWib.filter(
        (m) =>
          m.meetingDateWib.getUTCFullYear() === cur.getUTCFullYear() &&
          m.meetingDateWib.getUTCMonth() === cur.getUTCMonth() &&
          m.meetingDateWib.getUTCDate() === cur.getUTCDate()
      );

      const items = matched.flatMap((m) => m.actionItems);
      const completed = items.filter((a) => a.computedStatus === 'COMPLETED').length;
      const overdue = items.filter((a) => a.computedStatus === 'OVERDUE').length;

      points.push({
        key,
        label: dayName,
        subLabel: `${d} ${m}`,
        totalMeetings: matched.length,
        totalActionItems: items.length,
        completed,
        overdue,
      });
    }

    return points;
  }

  if (period === 'MONTH') {
    // Weekly grouping for the month (Minggu 1: 1-7, Minggu 2: 8-14, etc.)
    const startWib = new Date(startDate.getTime() + 7 * 60 * 60 * 1000);
    const endWib = new Date(endDate.getTime() + 7 * 60 * 60 * 1000);
    const lastDayOfMonth = endWib.getUTCDate();
    const monthShort = INDO_MONTHS_SHORT[startWib.getUTCMonth()];

    const points: TrendPoint[] = [];
    const ranges = [
      { start: 1, end: 7, label: 'Minggu 1' },
      { start: 8, end: 14, label: 'Minggu 2' },
      { start: 15, end: 21, label: 'Minggu 3' },
      { start: 22, end: 28, label: 'Minggu 4' },
      ...(lastDayOfMonth > 28
        ? [{ start: 29, end: lastDayOfMonth, label: 'Minggu 5' }]
        : []),
    ];

    for (const r of ranges) {
      const matched = meetingsWithWib.filter((m) => {
        const d = m.meetingDateWib.getUTCDate();
        return (
          m.meetingDateWib.getUTCMonth() === startWib.getUTCMonth() &&
          d >= r.start &&
          d <= r.end
        );
      });

      const items = matched.flatMap((m) => m.actionItems);
      const completed = items.filter((a) => a.computedStatus === 'COMPLETED').length;
      const overdue = items.filter((a) => a.computedStatus === 'OVERDUE').length;

      points.push({
        key: `M${r.start}`,
        label: r.label,
        subLabel: `${String(r.start).padStart(2, '0')}-${String(r.end).padStart(2, '0')} ${monthShort}`,
        totalMeetings: matched.length,
        totalActionItems: items.length,
        completed,
        overdue,
      });
    }

    return points;
  }

  if (period === 'QUARTER') {
    // 3 months in the quarter
    const startWib = new Date(startDate.getTime() + 7 * 60 * 60 * 1000);
    const year = startWib.getUTCFullYear();
    const startMonth = startWib.getUTCMonth();

    const points: TrendPoint[] = [];
    for (let offset = 0; offset < 3; offset++) {
      const mIdx = startMonth + offset;
      const mName = INDO_MONTHS[mIdx];

      const matched = meetingsWithWib.filter(
        (m) =>
          m.meetingDateWib.getUTCFullYear() === year &&
          m.meetingDateWib.getUTCMonth() === mIdx
      );

      const items = matched.flatMap((m) => m.actionItems);
      const completed = items.filter((a) => a.computedStatus === 'COMPLETED').length;
      const overdue = items.filter((a) => a.computedStatus === 'OVERDUE').length;

      points.push({
        key: `Q-M${mIdx + 1}`,
        label: mName,
        subLabel: `${year}`,
        totalMeetings: matched.length,
        totalActionItems: items.length,
        completed,
        overdue,
      });
    }

    return points;
  }

  // CUSTOM grouping based on length
  const diffDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays <= 14) {
    // Group daily
    const points: TrendPoint[] = [];
    const startWib = new Date(startDate.getTime() + 7 * 60 * 60 * 1000);

    for (let i = 0; i < diffDays; i++) {
      const cur = new Date(
        Date.UTC(
          startWib.getUTCFullYear(),
          startWib.getUTCMonth(),
          startWib.getUTCDate() + i
        )
      );
      const d = cur.getUTCDate();
      const m = INDO_MONTHS_SHORT[cur.getUTCMonth()];
      const dayName = INDO_DAYS[cur.getUTCDay()];
      const key = `${cur.getUTCFullYear()}-${String(cur.getUTCMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      const matched = meetingsWithWib.filter(
        (m) =>
          m.meetingDateWib.getUTCFullYear() === cur.getUTCFullYear() &&
          m.meetingDateWib.getUTCMonth() === cur.getUTCMonth() &&
          m.meetingDateWib.getUTCDate() === cur.getUTCDate()
      );

      const items = matched.flatMap((m) => m.actionItems);
      const completed = items.filter((a) => a.computedStatus === 'COMPLETED').length;
      const overdue = items.filter((a) => a.computedStatus === 'OVERDUE').length;

      points.push({
        key,
        label: `${d} ${m}`,
        subLabel: dayName,
        totalMeetings: matched.length,
        totalActionItems: items.length,
        completed,
        overdue,
      });
    }

    return points;
  }

  if (diffDays <= 90) {
    // Group weekly
    const points: TrendPoint[] = [];
    const startWib = new Date(startDate.getTime() + 7 * 60 * 60 * 1000);
    const numWeeks = Math.ceil(diffDays / 7);

    for (let w = 0; w < numWeeks; w++) {
      const wStart = new Date(
        Date.UTC(
          startWib.getUTCFullYear(),
          startWib.getUTCMonth(),
          startWib.getUTCDate() + w * 7,
          0,
          0,
          0,
          0
        )
      );
      const wEnd = new Date(
        Date.UTC(
          startWib.getUTCFullYear(),
          startWib.getUTCMonth(),
          startWib.getUTCDate() + w * 7 + 6,
          23,
          59,
          59,
          999
        )
      );

      const matched = meetingsWithWib.filter((m) => {
        const time = m.meetingDateWib.getTime();
        return time >= wStart.getTime() && time <= wEnd.getTime();
      });

      const items = matched.flatMap((m) => m.actionItems);
      const completed = items.filter((a) => a.computedStatus === 'COMPLETED').length;
      const overdue = items.filter((a) => a.computedStatus === 'OVERDUE').length;

      points.push({
        key: `W${w + 1}`,
        label: `Mgg ${w + 1}`,
        subLabel: `${wStart.getUTCDate()}/${wStart.getUTCMonth() + 1}`,
        totalMeetings: matched.length,
        totalActionItems: items.length,
        completed,
        overdue,
      });
    }

    return points;
  }

  // Monthly grouping (> 90 days)
  const points: TrendPoint[] = [];
  const startWib = new Date(startDate.getTime() + 7 * 60 * 60 * 1000);
  const endWib = new Date(endDate.getTime() + 7 * 60 * 60 * 1000);

  let curYear = startWib.getUTCFullYear();
  let curMonth = startWib.getUTCMonth();
  const endYear = endWib.getUTCFullYear();
  const endMonth = endWib.getUTCMonth();

  while (
    curYear < endYear ||
    (curYear === endYear && curMonth <= endMonth)
  ) {
    const y = curYear;
    const m = curMonth;

    const matched = meetingsWithWib.filter(
      (item) =>
        item.meetingDateWib.getUTCFullYear() === y &&
        item.meetingDateWib.getUTCMonth() === m
    );

    const items = matched.flatMap((item) => item.actionItems);
    const completed = items.filter((a) => a.computedStatus === 'COMPLETED').length;
    const overdue = items.filter((a) => a.computedStatus === 'OVERDUE').length;

    points.push({
      key: `${y}-${m + 1}`,
      label: INDO_MONTHS_SHORT[m],
      subLabel: `${y}`,
      totalMeetings: matched.length,
      totalActionItems: items.length,
      completed,
      overdue,
    });

    curMonth++;
    if (curMonth > 11) {
      curMonth = 0;
      curYear++;
    }
  }

  return points;
}

/**
 * Main service to fetch periodic report data from Neon PostgreSQL.
 * Optimized with single query and zero N+1.
 */
export async function getReportSummary(
  params: ReportQueryInput,
  referenceDate: Date = new Date()
): Promise<ReportSummaryResult> {
  const period = resolvePeriodDates(params, referenceDate);
  const biroFilter = params.biro;

  // Build Prisma WHERE clause for meetings
  const meetingWhere: Prisma.MeetingWhereInput = {
    date: {
      gte: period.startDate,
      lte: period.endDate,
    },
  };

  if (biroFilter && biroFilter !== 'ALL') {
    meetingWhere.primaryBiro = { code: biroFilter };
  }

  // 1 single query for meetings with relations
  const rawMeetings = await prisma.meeting.findMany({
    where: meetingWhere,
    include: {
      primaryBiro: true,
      minutes: true,
      actionItems: {
        include: {
          picBiro: true,
          picUser: true,
        },
      },
    },
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
  });

  // Augment action items with computeActionItemStatus
  const augmentedMeetings = rawMeetings.map((m) => {
    const augmentedActionItems = m.actionItems.map((a) => {
      const computed = computeActionItemStatus(a);
      return {
        ...a,
        computedStatus: computed.computedStatus,
        isOverdue: computed.isOverdue,
      };
    });

    return {
      ...m,
      actionItems: augmentedActionItems,
    };
  });

  // Flatten all action items in the period
  const allActionItems = augmentedMeetings.flatMap((m) => m.actionItems);

  // ── Calculate 9 KPIs ────────────────────────────────────────────────────────
  const totalMeetings = augmentedMeetings.length;
  const totalActionItems = allActionItems.length;
  const completedActionItems = allActionItems.filter(
    (a) => a.computedStatus === 'COMPLETED'
  ).length;
  const inProgressActionItems = allActionItems.filter(
    (a) => a.computedStatus === 'IN_PROGRESS'
  ).length;
  const pendingActionItems = allActionItems.filter(
    (a) => a.computedStatus === 'PENDING'
  ).length;
  const overdueActionItems = allActionItems.filter(
    (a) => a.computedStatus === 'OVERDUE'
  ).length;

  const completionRate =
    totalActionItems > 0
      ? Number(((completedActionItems / totalActionItems) * 100).toFixed(1))
      : 0;

  const meetingsWithMinutes = augmentedMeetings.filter(
    (m) => m.minutes !== null
  ).length;
  const meetingsWithoutMinutes = augmentedMeetings.filter(
    (m) => m.minutes === null
  ).length;

  const minutesCompletionRate =
    totalMeetings > 0
      ? Number(((meetingsWithMinutes / totalMeetings) * 100).toFixed(1))
      : 0;

  // Deadline in period stats (Section 8)
  const deadlineInPeriodItems = allActionItems.filter((a) => {
    const dueTime = new Date(a.dueDate).getTime();
    return (
      dueTime >= period.startDate.getTime() &&
      dueTime <= period.endDate.getTime()
    );
  });
  const deadlineInPeriodCount = deadlineInPeriodItems.length;
  const deadlineOverdueCount = deadlineInPeriodItems.filter(
    (a) => a.computedStatus === 'OVERDUE'
  ).length;

  const kpi: KpiSummary = {
    totalMeetings,
    totalActionItems,
    completedActionItems,
    inProgressActionItems,
    pendingActionItems,
    overdueActionItems,
    completionRate,
    meetingsWithMinutes,
    meetingsWithoutMinutes,
    minutesCompletionRate,
    deadlineInPeriodCount,
    deadlineOverdueCount,
  };

  // ── Per-Biro Summary (5 Official Biros) ──────────────────────────────────────
  const biroSummary: BiroStatItem[] = OFFICIAL_REPORT_BIROS.map((biro) => {
    const biroMeetings = augmentedMeetings.filter(
      (m) => m.primaryBiro.code === biro.code
    );
    const biroItems = biroMeetings.flatMap((m) => m.actionItems);

    const bCompleted = biroItems.filter(
      (a) => a.computedStatus === 'COMPLETED'
    ).length;
    const bInProgress = biroItems.filter(
      (a) => a.computedStatus === 'IN_PROGRESS'
    ).length;
    const bPending = biroItems.filter(
      (a) => a.computedStatus === 'PENDING'
    ).length;
    const bOverdue = biroItems.filter(
      (a) => a.computedStatus === 'OVERDUE'
    ).length;

    const bRate =
      biroItems.length > 0
        ? Number(((bCompleted / biroItems.length) * 100).toFixed(1))
        : 0;

    return {
      code: biro.code,
      name: biro.name,
      shortName: biro.shortName,
      totalMeetings: biroMeetings.length,
      totalActionItems: biroItems.length,
      completed: bCompleted,
      inProgress: bInProgress,
      pending: bPending,
      overdue: bOverdue,
      completionRate: bRate,
    };
  });

  const biroTotalRow: BiroStatItem = {
    code: 'BPPK', // placeholder code
    name: 'Total Seluruh Biro',
    shortName: 'Total',
    totalMeetings,
    totalActionItems,
    completed: completedActionItems,
    inProgress: inProgressActionItems,
    pending: pendingActionItems,
    overdue: overdueActionItems,
    completionRate,
  };

  // ── Trend Grouping ──────────────────────────────────────────────────────────
  const trend = buildTrendPoints(period, augmentedMeetings);

  // ── Meeting Table Items ─────────────────────────────────────────────────────
  const meetingItems: MeetingReportItem[] = augmentedMeetings.map((m) => {
    const completedCount = m.actionItems.filter(
      (a) => a.computedStatus === 'COMPLETED'
    ).length;

    return {
      id: m.id,
      meetingNumber: m.meetingNumber,
      title: m.title,
      date: formatWibDateIso(m.date),
      formattedDate: formatWibDateIndo(m.date),
      biroCode: m.primaryBiro.code,
      biroName: m.primaryBiro.shortName,
      hasMinutes: m.minutes !== null,
      statusNotulen: m.minutes !== null ? 'Tersedia' : 'Belum tersedia',
      totalActionItems: m.actionItems.length,
      completedActionItems: completedCount,
    };
  });

  return {
    period,
    biro: biroFilter,
    kpi,
    biroSummary,
    biroTotalRow,
    trend,
    meetings: meetingItems,
  };
}
