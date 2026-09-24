import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorization';
import { reportQuerySchema } from '@/lib/validations/report';
import { getReportSummary } from '@/lib/report/report-service';

export const dynamic = 'force-dynamic';

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

    // 2. Parse & Validate query parameters
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

    // 3. Fetch summary data from server-side service
    const summary = await getReportSummary(parsed.data);

    // 4. Return clean JSON response
    return NextResponse.json(summary, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error generating report summary:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal menghasilkan laporan berkala.' },
      { status: 500 }
    );
  }
}
