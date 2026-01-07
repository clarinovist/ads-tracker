import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const businessId = searchParams.get("businessId");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const status = searchParams.get("status");

    const where: any = {};
    if (businessId) where.business_id = businessId;
    if (status) where.status = status;

    try {
        const campaigns = await prisma.campaign.findMany({
            where,
            include: {
                business: {
                    select: { name: true, color_code: true }
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

        // Aggregate insights for total performance
        const campaignsWithAggregate = campaigns.map(camp => {
            const aggregate = camp.insights.reduce((acc, curr) => ({
                spend: acc.spend + curr.spend,
                impressions: acc.impressions + curr.impressions,
                clicks: acc.clicks + curr.clicks,
                leads: acc.leads + curr.leads,
                conversions: acc.conversions + curr.conversions,
                revenue: acc.revenue + curr.revenue,
            }), { spend: 0, impressions: 0, clicks: 0, leads: 0, conversions: 0, revenue: 0 });

            // Derived aggregate metrics
            const ctr = aggregate.impressions > 0 ? (aggregate.clicks / aggregate.impressions) * 100 : 0;
            const cpc = aggregate.clicks > 0 ? aggregate.spend / aggregate.clicks : 0;
            const cpl = aggregate.leads > 0 ? aggregate.spend / aggregate.leads : 0;
            const roas = aggregate.spend > 0 ? aggregate.revenue / aggregate.spend : 0;

            return {
                ...camp,
                aggregate: {
                    ...aggregate,
                    ctr,
                    cpc,
                    cpl,
                    roas
                }
            };
        });

        return NextResponse.json(campaignsWithAggregate);
    } catch (error) {
        console.error("Failed to fetch campaigns:", error);
        return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
    }
}
