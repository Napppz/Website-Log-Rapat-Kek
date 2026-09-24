import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorization';
import { reportQuerySchema } from '@/lib/validations/report';
import { getReportSummary, formatWibDateIso } from '@/lib/report/report-service';
import { generateReportExcel } from '@/lib/report/report-excel-generator';

export const dynamic = 'force-dynamic';

const PERIOD_SLUG_MAP: Record<string, string> = {
  WEEK: 'Mingguan',
  MONTH: 'Bulanan',
  QUARTER: 'Kuartal',
  CUSTOM: 'Kustom',
};

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    try {
      await requireAuth();
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized: Anda harus masuk ke sistem terlebih dahulu.' },
        { status: 401 }
      );
    }

    // 2. Parse & validate query parameters
    const { searchParams } = new URL(request.url);
    const rawParams = {
      period: searchParams.get('period') || 'MONTH',
      biro: searchParams.get('biro') || 'ALL',
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    };

    const parsed = reportQuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join('; ');
      return NextResponse.json(
        { error: `Parameter tidak valid: ${errorMsg}` },
        { status: 400 }
      );
    }

    // 3. Fetch summary data
    const summary = await getReportSummary(parsed.data);

    // 4. Generate XLSX buffer
    const xlsxBuffer = await generateReportExcel(summary);

    // 5. Construct sanitized filename
    const todayWibIso = formatWibDateIso(new Date());
    const periodSlug = PERIOD_SLUG_MAP[summary.period.period] || 'Laporan';
    const biroSlug = summary.biro !== 'ALL' ? `-${summary.biro}` : '';
    const rawFilename = `Laporan-Berkala${biroSlug}-${periodSlug}-${todayWibIso}.xlsx`;
    const filename = rawFilename.replace(/[^a-zA-Z0-9_.-]/g, '_');

    // 6. Return XLSX response
    return new Response(new Uint8Array(xlsxBuffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(xlsxBuffer.length),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error generating report Excel:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal menghasilkan dokumen Excel laporan berkala.' },
      { status: 500 }
    );
  }
}
