import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorization';
import { actionItemExportQuerySchema } from '@/lib/validations/action-item-export';
import { generateActionItemDocx } from '@/lib/docx/action-item-docx-generator';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/action-items/export-docx
 *
 * Exports Action Items data as a Microsoft Word (.docx) document.
 * Requires authentication. READ ONLY — no DB mutation.
 *
 * Query params (all optional, same as /export):
 *   biro, status, priority, startDate, endDate, search
 */
export async function GET(request: NextRequest) {
  // ── 1. Authentication ──────────────────────────────────────────────────────
  let authUser;
  try {
    authUser = await requireAuth();
  } catch {
    return NextResponse.json(
      { error: 'Unauthorized: Anda harus masuk ke sistem terlebih dahulu.' },
      { status: 401 },
    );
  }

  const isPrivileged =
    authUser.role === 'SUPER_ADMIN' || authUser.role === 'ADMIN';

  // ── 2. Parse & validate query params ──────────────────────────────────────
  const { searchParams } = new URL(request.url);

  const rawParams = {
    biro: !isPrivileged && authUser.biroCode
      ? authUser.biroCode
      : (searchParams.get('biro') ?? 'ALL'),
    status:   searchParams.get('status')   ?? 'ALL',
    priority: searchParams.get('priority') ?? 'ALL',
    startDate: searchParams.get('startDate') ?? undefined,
    endDate:   searchParams.get('endDate')   ?? undefined,
    search:    searchParams.get('search')    ?? '',
  };

  const parseResult = actionItemExportQuerySchema.safeParse(rawParams);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues.map((i) => i.message).join('; ');
    return NextResponse.json(
      { error: `Parameter tidak valid: ${errorMsg}` },
      { status: 400 },
    );
  }

  const params = parseResult.data;

  // ── 3. Build Prisma WHERE clause ───────────────────────────────────────────
  const where: Prisma.ActionItemWhereInput = {};

  if (params.biro && params.biro !== 'ALL') {
    where.picBiro = { code: params.biro };
  }
  if (params.status && params.status !== 'ALL') {
    if (params.status === 'OVERDUE') {
      where.status = { not: 'COMPLETED' };
      where.dueDate = { lt: new Date() };
    } else {
      where.status = params.status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    }
  }
  if (params.priority && params.priority !== 'ALL') {
    where.priority = params.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  }
  if (params.startDate || params.endDate) {
    const existing =
      typeof where.dueDate === 'object' && where.dueDate !== null
        ? (where.dueDate as Prisma.DateTimeFilter)
        : {};
    const dueDateFilter: Prisma.DateTimeFilter = { ...existing };
    if (params.startDate) dueDateFilter.gte = new Date(`${params.startDate}T00:00:00+07:00`);
    if (params.endDate)   dueDateFilter.lte = new Date(`${params.endDate}T23:59:59+07:00`);
    where.dueDate = dueDateFilter;
  }

  // ── 4. Fetch data ──────────────────────────────────────────────────────────
  let items = await prisma.actionItem.findMany({
    where,
    include: {
      meeting: {
        select: { meetingNumber: true, title: true, date: true },
      },
      picBiro: {
        select: { code: true, name: true, shortName: true },
      },
      picUser: {
        select: { name: true },
      },
      // Include last audit log entry for the "Catatan Terakhir" column
      logs: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          user: {
            select: { name: true, biro: { select: { code: true } } },
          },
        },
      },
    },
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
  });

  // ── 5. Post-filter: free-text search ──────────────────────────────────────
  if (params.search) {
    const q = params.search.toLowerCase();
    items = items.filter((item) =>
      item.title.toLowerCase().includes(q) ||
      (item.description ?? '').toLowerCase().includes(q) ||
      item.meeting.meetingNumber.toLowerCase().includes(q) ||
      (item.picUser?.name ?? '').toLowerCase().includes(q) ||
      (item.picBiro?.code ?? '').toLowerCase().includes(q),
    );
  }

  // ── 6. Generate .docx ──────────────────────────────────────────────────────
  let docxBuffer: Buffer;
  try {
    docxBuffer = await generateActionItemDocx(items, {
      biro:      params.biro,
      status:    params.status,
      priority:  params.priority,
      startDate: params.startDate,
      endDate:   params.endDate,
      search:    params.search,
    });
  } catch (err) {
    console.error('[export-docx] Error generating .docx:', err);
    return NextResponse.json(
      { error: 'Gagal menghasilkan dokumen Word. Silakan coba lagi.' },
      { status: 500 },
    );
  }

  // ── 7. Build filename ──────────────────────────────────────────────────────
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const dateStr = `${wib.getUTCFullYear()}-${String(wib.getUTCMonth() + 1).padStart(2, '0')}-${String(wib.getUTCDate()).padStart(2, '0')}`;
  const biroSegment = params.biro && params.biro !== 'ALL' ? `-${params.biro}` : '';
  const filename = `Matriks-Tindak-Lanjut${biroSegment}-${dateStr}.docx`;

  // ── 8. Return .docx response ───────────────────────────────────────────────
  return new Response(new Uint8Array(docxBuffer), {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'X-Export-Count': String(items.length),
    },
  });
}
