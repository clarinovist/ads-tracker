
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

        const stats = await prisma.hourlyStat.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate
                },
                ...(businessId ? { business_id: businessId } : {})
            },
            select: {
                hour: true,
                messaging_conversations: true
            }
        });

        // Aggregate by hour
        const hourlyDistribution = Array(24).fill(0).map((_, i) => ({
            hour: i,
            count: 0,
            label: `${i.toString().padStart(2, '0')}:00`
        }));

        stats.forEach(stat => {
            if (hourlyDistribution[stat.hour]) {
                hourlyDistribution[stat.hour].count += stat.messaging_conversations;
            }
        });

        return NextResponse.json(hourlyDistribution);

        return NextResponse.json(hourlyDistribution);

    } catch (error: unknown) {
        console.error('Hourly Distribution Error:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
