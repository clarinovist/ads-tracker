import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const campaignId = searchParams.get("campaignId");
    const businessId = searchParams.get("businessId");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const status = searchParams.get("status");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (campaignId) where.campaign_id = campaignId;
    if (status) where.status = status;
    if (businessId) {
        where.campaign = {
            business_id: businessId
        };
    }

    try {
        const adSets = await prisma.adSet.findMany({
            where,
            include: {
                campaign: {
                    select: { name: true, business: { select: { name: true, color_code: true } } }
                },
                insights: {
                    where: {
                        date: {
                            ...(startDateStr && { gte: startOfDay(new Date(startDateStr)) }),
                            ...(endDateStr && { lte: endOfDay(new Date(endDateStr)) }),
                        }
                    },
                    orderBy: { date: 'asc' }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        const adSetsWithAggregate = adSets.map(adSet => {
            const aggregate = adSet.insights.reduce((acc, curr) => ({
                spend: acc.spend + curr.spend,
                impressions: acc.impressions + curr.impressions,
                clicks: acc.clicks + curr.clicks,
                leads: acc.leads + curr.leads,
                conversions: acc.conversions + curr.conversions,
                revenue: acc.revenue + curr.revenue,
            }), { spend: 0, impressions: 0, clicks: 0, leads: 0, conversions: 0, revenue: 0 });

            const ctr = aggregate.impressions > 0 ? (aggregate.clicks / aggregate.impressions) * 100 : 0;
            const roas = aggregate.spend > 0 ? aggregate.revenue / aggregate.spend : 0;

            return {
                ...adSet,
                aggregate: { ...aggregate, ctr, roas }
            };
        });

        return NextResponse.json(adSetsWithAggregate);
    } catch (error) {
        console.error("Failed to fetch ad sets:", error);
        return NextResponse.json({ error: "Failed to fetch ad sets" }, { status: 500 });
    }
}
