import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorization';
import { actionItemExportQuerySchema } from '@/lib/validations/action-item-export';
import { generateActionItemExcel } from '@/lib/excel/action-item-excel-generator';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/action-items/export
 *
 * Exports Action Items data as an XLSX workbook.
 * Requires authentication. Export is READ ONLY — no DB mutation.
 *
 * Query params (all optional):
 *   biro        – Biro code (BPPK | PKKEK | IKK | HSDMO | UK | ALL)
 *   status      – Status filter (PENDING | IN_PROGRESS | COMPLETED | OVERDUE | ALL)
 *   priority    – Priority filter (LOW | MEDIUM | HIGH | URGENT | ALL)
 *   startDate   – Filter dueDate >= startDate (YYYY-MM-DD)
 *   endDate     – Filter dueDate <= endDate (YYYY-MM-DD)
 *   search      – Free-text search (title, description, meetingNumber, PIC)
 */
export async function GET(request: NextRequest) {
  // ── 1. Authentication ──────────────────────────────────────────────────────
  try {
    await requireAuth();
  } catch {
    return NextResponse.json(
      { error: 'Unauthorized: Anda harus masuk ke sistem terlebih dahulu.' },
      { status: 401 }
    );
  }

  // ── 2. Parse & validate query parameters ──────────────────────────────────
  const { searchParams } = new URL(request.url);

  const rawParams = {
    biro: searchParams.get('biro') ?? 'ALL',
    status: searchParams.get('status') ?? 'ALL',
    priority: searchParams.get('priority') ?? 'ALL',
    startDate: searchParams.get('startDate') ?? undefined,
    endDate: searchParams.get('endDate') ?? undefined,
    search: searchParams.get('search') ?? '',
  };

  const parseResult = actionItemExportQuerySchema.safeParse(rawParams);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues.map((i) => i.message).join('; ');
    return NextResponse.json(
      { error: `Parameter tidak valid: ${errorMsg}` },
      { status: 400 }
    );
  }

  const params = parseResult.data;

  // ── 3. Build Prisma WHERE clause ──────────────────────────────────────────
  const where: Prisma.ActionItemWhereInput = {};

  // Biro filter
  if (params.biro && params.biro !== 'ALL') {
    where.picBiro = { code: params.biro };
  }

  // Status filter
  // OVERDUE is a computed state (not stored). We fetch non-COMPLETED with past dueDate.
  if (params.status && params.status !== 'ALL') {
    if (params.status === 'OVERDUE') {
      where.status = { not: 'COMPLETED' };
      where.dueDate = { lt: new Date() };
    } else {
      where.status = params.status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    }
  }

  // Priority filter
  if (params.priority && params.priority !== 'ALL') {
    where.priority = params.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  }

  // dueDate range filter (merges with existing dueDate filter if OVERDUE was set)
  if (params.startDate || params.endDate) {
    const existingDueDateFilter =
      typeof where.dueDate === 'object' && where.dueDate !== null
        ? (where.dueDate as Prisma.DateTimeFilter)
        : {};
    const dueDateFilter: Prisma.DateTimeFilter = { ...existingDueDateFilter };
    if (params.startDate) {
      dueDateFilter.gte = new Date(`${params.startDate}T00:00:00+07:00`);
    }
    if (params.endDate) {
      dueDateFilter.lte = new Date(`${params.endDate}T23:59:59+07:00`);
    }
    where.dueDate = dueDateFilter;
  }

  // ── 4. Single Prisma query with all necessary relations ───────────────────
  let items = await prisma.actionItem.findMany({
    where,
    include: {
      meeting: {
        select: {
          meetingNumber: true,
          title: true,
          date: true,
        },
      },
      picBiro: {
        select: {
          code: true,
          name: true,
        },
      },
      picUser: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
  });

  // ── 5. Post-filter: search (title, description, meetingNumber, PIC) ───────
  if (params.search) {
    const q = params.search.toLowerCase();
    items = items.filter((item) => {
      return (
        item.title.toLowerCase().includes(q) ||
        (item.description ?? '').toLowerCase().includes(q) ||
        item.meeting.meetingNumber.toLowerCase().includes(q) ||
        (item.picUser?.name ?? '').toLowerCase().includes(q) ||
        (item.picBiro?.code ?? '').toLowerCase().includes(q)
      );
    });
  }

  // ── 6. Generate XLSX ───────────────────────────────────────────────────────
  let xlsxBuffer: Buffer;
  try {
    xlsxBuffer = await generateActionItemExcel(items, {
      biro: params.biro,
      status: params.status,
      priority: params.priority,
      startDate: params.startDate,
      endDate: params.endDate,
      search: params.search,
    });
  } catch (err) {
    console.error('[STAGE 7B] Error generating XLSX:', err);
    return NextResponse.json(
      { error: 'Gagal menghasilkan dokumen Excel. Silakan coba lagi.' },
      { status: 500 }
    );
  }

  // ── 7. Build filename ──────────────────────────────────────────────────────
  const today = new Date();
  const wib = new Date(today.getTime() + 7 * 60 * 60 * 1000);
  const dateStr = `${wib.getUTCFullYear()}-${String(wib.getUTCMonth() + 1).padStart(2, '0')}-${String(wib.getUTCDate()).padStart(2, '0')}`;
  const biroSegment =
    params.biro && params.biro !== 'ALL' ? `-${params.biro}` : '';
  const filename = `Matriks-Tindak-Lanjut${biroSegment}-${dateStr}.xlsx`;

  // ── 8. Return XLSX response ────────────────────────────────────────────────
  return new Response(new Uint8Array(xlsxBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'X-Export-Count': String(items.length),
    },
  });
}
