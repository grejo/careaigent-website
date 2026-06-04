import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { buildCsvBuffer, buildExcelBuffer } from '@/lib/export';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') ?? 'csv';

  const [activity, registrations] = await Promise.all([
    prisma.activity.findUnique({ where: { id }, select: { slug: true } }),
    prisma.registration.findMany({ where: { activityId: id }, orderBy: { createdAt: 'asc' } }),
  ]);

  const filename = `inschrijvingen-${activity?.slug ?? id}`;

  if (format === 'xlsx') {
    const buffer = await buildExcelBuffer(registrations);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
      },
    });
  }

  const buffer = await buildCsvBuffer(registrations);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.csv"`,
    },
  });
}
