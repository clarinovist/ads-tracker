import { prisma } from '@/lib/prisma';
import { DateRangePicker } from '@/components/DateRangePicker';
import OverviewCharts from '@/components/OverviewCharts';
import CampaignsTable, { CampaignRow } from '@/components/CampaignsTable';
import AdsTable, { AdRow } from '@/components/AdsTable';
import { startOfDay, endOfDay, format } from 'date-fns';
import { MetricsCard } from '@/components/MetricsCard';
import {
    DollarSign,
    Users,
    MousePointer2,
    BarChart3,
    Target,
    Zap
} from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ from?: string; to?: string }>;
}) {
    const params = await searchParams;
    const today = new Date();
    const fromDate = params.from ? startOfDay(new Date(params.from)) : startOfDay(today);
    const toDate = params.to ? endOfDay(new Date(params.to)) : endOfDay(today);

    // Fetch all businesses
    const businesses = await prisma.business.findMany({
        where: { is_active: true },
    });

    // 1. Fetch Daily Insights (Account Level)
    const insights = await prisma.dailyInsight.findMany({
        where: {
            date: { gte: fromDate, lte: toDate },
            business_id: { in: businesses.map((b: any) => b.id) }
        },
        orderBy: { date: 'asc' },
    });

    // 2. Fetch Campaigns with aggregated insights
    // Prisma doesn't support complex aggregations on relations easily in one go with simple types,
    // so we fetch campaigns and their insights for the period.
    const campaignsData = await prisma.campaign.findMany({
        where: { business_id: { in: businesses.map((b: any) => b.id) } },
        include: {
            insights: {
                where: { date: { gte: fromDate, lte: toDate } }
            }
        }
    });

    // 3. Fetch Ads with aggregated insights
    const adsData = await prisma.ad.findMany({
        where: { ad_set: { campaign: { business_id: { in: businesses.map((b: any) => b.id) } } } },
        include: {
            insights: {
                where: { date: { gte: fromDate, lte: toDate } }
            }
        }
    });

    // --- Processing Data ---

    // Calculate Global Aggregates
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
    const globalCTR = totalKpi.impressions > 0 ? (totalKpi.clicks / totalKpi.impressions) * 100 : 0;
    const globalCPL = totalKpi.leads > 0 ? totalKpi.spend / totalKpi.leads : 0;
    const globalCPM = totalKpi.impressions > 0 ? (totalKpi.spend / totalKpi.impressions) * 1000 : 0;
    const globalCPC = totalKpi.clicks > 0 ? (totalKpi.spend / totalKpi.clicks) : 0;

    // Process Campaign Rows
    const campaignRows: CampaignRow[] = campaignsData.map((c) => {
        const stats = c.insights.reduce((acc, curr) => ({
            spend: acc.spend + curr.spend,
            impressions: acc.impressions + curr.impressions,
            clicks: acc.clicks + curr.clicks,
            leads: acc.leads + curr.leads,
        }), { spend: 0, impressions: 0, clicks: 0, leads: 0 });

        return { id: c.id, name: c.name, status: c.status || 'UNKNOWN', ...stats };
    }).filter((c) => c.status === 'ACTIVE' && c.spend > 0);

    // Process Ad Rows
    const adRows: AdRow[] = adsData.map((a) => {
        const stats = a.insights.reduce((acc, curr) => ({
            spend: acc.spend + curr.spend,
            impressions: acc.impressions + curr.impressions,
            clicks: acc.clicks + curr.clicks,
            leads: acc.leads + curr.leads,
        }), { spend: 0, impressions: 0, clicks: 0, leads: 0 });

        return { id: a.id, name: a.name, status: a.status || 'UNKNOWN', ...stats };
    }).filter((a) => a.status === 'ACTIVE' && a.spend > 0);


    // Chart Data
    const groupedData: Record<string, any> = {};
    insights.forEach((i: any) => {
        const dateKey = format(i.date, 'yyyy-MM-dd');
        if (!groupedData[dateKey]) groupedData[dateKey] = { date: format(i.date, 'MMM dd') };
        groupedData[dateKey][`${i.business_id}_spend`] = i.spend;
        groupedData[dateKey][`${i.business_id}_leads`] = i.leads;
    });
    const chartData = Object.values(groupedData);

    const currencyFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Global Dashboard</h1>
                    <p className="text-slate-500">Omni-channel performance overview across all businesses.</p>
                </div>
                <DateRangePicker />
            </div>

            {businesses.length === 0 ? (
                <div className="p-12 text-center border border-dashed rounded-xl bg-slate-50 border-slate-300">
                    <Zap className="h-10 w-10 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">Platform Initialized</h3>
                    <p className="text-slate-500">Go to Businesses to connect your first Meta Ad Account.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricsCard
                            title="Total Spend"
                            value={currencyFormatter.format(totalKpi.spend)}
                            icon={DollarSign}
                        />
                        <MetricsCard
                            title="CPM"
                            value={currencyFormatter.format(globalCPM)}
                            icon={BarChart3}
                            iconColor="text-orange-500"
                            description="Cost per 1,000 impressions"
                        />
                        <MetricsCard
                            title="CPC"
                            value={currencyFormatter.format(globalCPC)}
                            icon={MousePointer2}
                            iconColor="text-blue-500"
                            description="Cost per link click"
                        />
                        <MetricsCard
                            title="Leads"
                            value={totalKpi.leads}
                            icon={Users}
                            iconColor="text-purple-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <MetricsCard
                            title="CTR"
                            value={`${globalCTR.toFixed(2)}%`}
                            icon={MousePointer2}
                            iconColor="text-blue-500"
                            description="Efficiency of ad delivery"
                        />
                        <MetricsCard
                            title="Avg CPL"
                            value={currencyFormatter.format(globalCPL)}
                            icon={Target}
                            iconColor="text-rose-500"
                            description="Cost per lead acquisition"
                        />
                        <MetricsCard
                            title="Conversions"
                            value={totalKpi.conversions}
                            icon={Zap}
                            iconColor="text-amber-500"
                            description="Total high-value actions"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-3">
                            <OverviewCharts data={chartData} businesses={businesses} totalKpi={totalKpi} />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <CampaignsTable campaigns={campaignRows} />
                        <AdsTable ads={adRows} />
                    </div>
                </>
            )}
        </div>
    );
}
