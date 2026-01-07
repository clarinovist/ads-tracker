import { prisma } from '@/lib/prisma';
import { DateRangePicker } from '@/components/DateRangePicker';
import OverviewCharts from '@/components/OverviewCharts';
import CampaignsTable, { CampaignRow } from '@/components/CampaignsTable';
import AdsTable, { AdRow } from '@/components/AdsTable';
import { startOfMonth, startOfDay, endOfDay, format } from 'date-fns';
import { MetricsCard } from '@/components/MetricsCard';
import {
    DollarSign,
    Users,
    MousePointer2,
    BarChart3,
    Target,
    Zap,
    ArrowLeft
} from "lucide-react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function BusinessAnalyticsPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ from?: string; to?: string }>;
}) {
    const { id } = await params;
    const query = await searchParams;

    const today = new Date();
    const fromDate = query.from ? startOfDay(new Date(query.from)) : startOfDay(today);
    const toDate = query.to ? endOfDay(new Date(query.to)) : endOfDay(today);

    // 1. Fetch Business
    const business = await prisma.business.findUnique({
        where: { id },
    });

    if (!business) {
        notFound();
    }

    // 2. Fetch Insights (Business Level)
    const insights = await prisma.dailyInsight.findMany({
        where: {
            business_id: id,
            date: { gte: fromDate, lte: toDate },
        },
        orderBy: { date: 'asc' },
    });

    // 3. Fetch Campaigns (related to this business)
    const campaignsData = await prisma.campaign.findMany({
        where: { business_id: id },
        include: {
            insights: {
                where: { date: { gte: fromDate, lte: toDate } }
            }
        }
    });

    // 4. Fetch Ads (related to this business)
    // Note: Assuming we can filter ads by business via ad_set -> campaign -> business_id
    const adsData = await prisma.ad.findMany({
        where: { ad_set: { campaign: { business_id: id } } },
        include: {
            insights: {
                where: { date: { gte: fromDate, lte: toDate } }
            }
        }
    });

    // --- Processing Data ---

    // Calculate Aggregates
    const totalKpi = {
        spend: 0, impressions: 0, clicks: 0, leads: 0, conversions: 0, revenue: 0
    };

    insights.forEach((i: any) => {
        totalKpi.spend += i.spend;
        totalKpi.impressions += i.impressions;
        totalKpi.clicks += i.clicks;
        totalKpi.leads += i.leads;
        totalKpi.conversions += (i.conversions || 0);
        totalKpi.revenue += (i.revenue || 0);
    });

    // Derived Metrics
    const ctr = totalKpi.impressions > 0 ? (totalKpi.clicks / totalKpi.impressions) * 100 : 0;
    const cpl = totalKpi.leads > 0 ? totalKpi.spend / totalKpi.leads : 0;
    const cpm = totalKpi.impressions > 0 ? (totalKpi.spend / totalKpi.impressions) * 1000 : 0;
    const cpc = totalKpi.clicks > 0 ? (totalKpi.spend / totalKpi.clicks) : 0;

    // Chart Data (reformat for OverviewCharts)
    // OverviewCharts expects data keys like `${business_id}_spend`.
    const chartData = insights.map((i: any) => ({
        date: format(i.date, 'yyyy-MM-dd'),
        [`${id}_spend`]: i.spend,
        [`${id}_leads`]: i.leads,
    }));

    // Process Campaign Rows
    const campaignRows: CampaignRow[] = campaignsData.map((c) => {
        const stats = c.insights.reduce((acc, curr) => ({
            spend: acc.spend + curr.spend,
            impressions: acc.impressions + curr.impressions,
            clicks: acc.clicks + curr.clicks,
            leads: acc.leads + curr.leads,
        }), { spend: 0, impressions: 0, clicks: 0, leads: 0 });

        return { id: c.id, name: c.name, status: c.status || 'UNKNOWN', ...stats };
    }).filter((c) => c.spend > 0).sort((a, b) => b.spend - a.spend); // Show top spenders

    // Process Ad Rows
    const adRows: AdRow[] = adsData.map((a) => {
        const stats = a.insights.reduce((acc, curr) => ({
            spend: acc.spend + curr.spend,
            impressions: acc.impressions + curr.impressions,
            clicks: acc.clicks + curr.clicks,
            leads: acc.leads + curr.leads,
        }), { spend: 0, impressions: 0, clicks: 0, leads: 0 });

        return { id: a.id, name: a.name, status: a.status || 'UNKNOWN', ...stats };
    }).filter((a) => a.spend > 0).sort((a, b) => b.leads - a.leads); // Show top lead generators

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8 -ml-2">
                            <Link href="/comparison">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{business.name}</h1>
                    </div>
                    <p className="text-slate-500 pl-8">Detailed performance analysis and platform breakdown.</p>
                </div>
                <DateRangePicker />
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricsCard title="Total Spend" value={formatCurrency(totalKpi.spend)} icon={DollarSign} />
                <MetricsCard title="Leads" value={totalKpi.leads} icon={Users} iconColor="text-purple-500" />
                <MetricsCard title="CPM" value={formatCurrency(cpm)} icon={BarChart3} iconColor="text-orange-500" description="Cost per 1,000 impr" />
                <MetricsCard title="CTR" value={`${ctr.toFixed(2)}%`} icon={MousePointer2} iconColor="text-blue-500" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6">
                <OverviewCharts
                    data={chartData}
                    businesses={[business]} // Pass pure business object, minimal fields
                    totalKpi={totalKpi}
                />
            </div>

            {/* Detailed Tables */}
            <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900">Top Campaigns</h3>
                <CampaignsTable campaigns={campaignRows} />

                <h3 className="text-lg font-bold text-slate-900">Top Ads</h3>
                <AdsTable ads={adRows} />
            </div>
        </div>
    );
}
