import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const adSetId = searchParams.get("adSetId");
    const campaignId = searchParams.get("campaignId");
    const businessId = searchParams.get("businessId");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const status = searchParams.get("status");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (adSetId) where.ad_set_id = adSetId;
    if (status) where.status = status;
    if (campaignId) {
        where.ad_set = { campaign_id: campaignId };
    }
    if (businessId) {
        where.ad_set = {
            ...(where.ad_set || {}),
            campaign: { business_id: businessId }
        };
    }

    try {
        const ads = await prisma.ad.findMany({
            where,
            include: {
                ad_set: {
                    select: { name: true, campaign: { select: { name: true } } }
                },
                insights: {
                    where: {
                        date: {
                            ...(startDateStr && {
                                gte: (() => {
                                    const [y, m, d] = startDateStr.split('-').map(Number);
                                    return startOfDay(new Date(y, m - 1, d));
                                })()
                            }),
                            ...(endDateStr && {
                                lte: (() => {
                                    const [y, m, d] = endDateStr.split('-').map(Number);
                                    return endOfDay(new Date(y, m - 1, d));
                                })()
                            }),
                        }
                    },
                    orderBy: { date: 'asc' }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        const adsWithAggregate = ads.map(ad => {
            const aggregate = ad.insights.reduce((acc, curr) => ({
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
                ...ad,
                aggregate: { ...aggregate, ctr, roas }
            };
        });

        return NextResponse.json(adsWithAggregate);
    } catch (error) {
        console.error("Failed to fetch ads:", error);
        return NextResponse.json({ error: "Failed to fetch ads" }, { status: 500 });
    }
}
