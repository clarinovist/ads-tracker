
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const businessId = searchParams.get('businessId');

        if (!from || !to) {
            return NextResponse.json({ error: 'Date range required' }, { status: 400 });
        }

        const startDate = startOfDay(new Date(from));
        const endDate = endOfDay(new Date(to));

        const stats = await prisma.hourlyStat.groupBy({
            by: ['hour'],
            where: {
                date: {
                    gte: startDate,
                    lte: endDate
                },
                ...(businessId ? { business_id: businessId } : {})
            },
            _sum: {
                messaging_conversations: true
            },
            orderBy: {
                hour: 'asc'
            }
        });

        // Aggregate by hour
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hourlyDistribution = Array(24).fill(0).map((_, i) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const stat = (stats as any[]).find((s: any) => s.hour === i);
            return {
                hour: i,
                count: stat?._sum.messaging_conversations || 0,
                label: `${i.toString().padStart(2, '0')}:00`
            };
        });

        return NextResponse.json(hourlyDistribution);

    } catch (error: unknown) {
        console.error('Hourly Distribution Error:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
