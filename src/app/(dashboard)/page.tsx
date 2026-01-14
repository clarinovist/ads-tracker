import { prisma } from '@/lib/prisma';
import { DateRangePicker } from '@/components/DateRangePicker';
import CampaignsTable, { CampaignRow } from '@/components/CampaignsTable';
import { DashboardTabs } from '@/components/DashboardTabs';
import AdsTable, { AdRow } from '@/components/AdsTable';
import { startOfDay, endOfDay, startOfMonth } from 'date-fns';
import { MetricsCard } from '@/components/MetricsCard';
import { Button } from '@/components/ui/button';
import {
    DollarSign,
    Users,
    MousePointer2,
    BarChart3,
    Target,
    Zap,
    Download,
    TrendingUp
} from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ from?: string; to?: string }>;
}) {
    const params = await searchParams;
    const now = new Date();
    const fromDate = params.from ? startOfDay(new Date(params.from)) : startOfMonth(now);
    const toDate = params.to ? endOfDay(new Date(params.to)) : endOfDay(now);

    // Fetch all businesses
    const businesses = await prisma.business.findMany({
        where: { is_active: true },
    });

    // 1. Fetch Daily Insights (Account Level)
    const insights = await prisma.dailyInsight.findMany({
        where: {
            date: { gte: fromDate, lte: toDate },
            business_id: { in: businesses.map((b) => b.id) }
        },
        orderBy: { date: 'asc' },
    });

    // 2. Fetch Campaigns with aggregated insights (Optimized)
    const campaignStats = await prisma.campaignDailyInsight.groupBy({
        by: ['campaign_id'],
        where: {
            date: { gte: fromDate, lte: toDate },
            campaign: {
                business_id: { in: businesses.map((b) => b.id) }
            }
        },
        _sum: {
            spend: true,
            impressions: true,
            clicks: true,
            leads: true
        }
    });

    const campaignIds = campaignStats.map((s) => s.campaign_id);
    const campaigns = await prisma.campaign.findMany({
        where: { id: { in: campaignIds } },
        select: { id: true, name: true, status: true }
    });

    const campaignMap = new Map(campaigns.map((c) => [c.id, c]));

    // 3. Fetch Ads with aggregated insights
    const adsData = await prisma.ad.findMany({
        where: { ad_set: { campaign: { business_id: { in: businesses.map((b) => b.id) } } } },
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    const campaignRows: CampaignRow[] = campaignStats.map((stat) => {
        const campaign = campaignMap.get(stat.campaign_id);
        return {
            id: stat.campaign_id,
            name: campaign?.name || 'Unknown',
            status: campaign?.status || 'UNKNOWN',
            spend: stat._sum.spend || 0,
            impressions: stat._sum.impressions || 0,
            clicks: stat._sum.clicks || 0,
            leads: stat._sum.leads || 0,
        };
    }).filter((c) => c.spend > 0);

    // Process Ad Rows
    const adRows: AdRow[] = adsData.map((a) => {
        const stats = a.insights.reduce((acc, curr) => ({
            spend: acc.spend + curr.spend,
            impressions: acc.impressions + curr.impressions,
            clicks: acc.clicks + curr.clicks,
            leads: acc.leads + curr.leads,
        }), { spend: 0, impressions: 0, clicks: 0, leads: 0 });

        return { id: a.id, name: a.name, status: a.status || 'UNKNOWN', ...stats };
    }).filter((a) => a.spend > 0);

    const currencyFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

    return (
        <div className="space-y-6 md:space-y-8 pb-8">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Global Dashboard</h1>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 ml-3">Omni-channel performance overview across all businesses.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="gap-2 rounded-xl">
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                    <DateRangePicker />
                </div>
            </div>

            {/* Tab Navigation */}
            {/* Tab Navigation */}
            <DashboardTabs />

            {businesses.length === 0 ? (
                <div className="p-12 text-center border border-dashed rounded-xl bg-slate-50 border-slate-300">
                    <Zap className="h-10 w-10 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">Platform Initialized</h3>
                    <p className="text-slate-500">Go to Businesses to connect your first Meta Ad Account.</p>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* Primary Stats - Hero Section with Gradient Variants */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <MetricsCard
                            title="Total Spend"
                            value={currencyFormatter.format(totalKpi.spend)}
                            icon={DollarSign}
                            iconColor="text-indigo-600"
                            variant="gradient"
                            trend={{ value: 12, isPositive: true, label: "vs last period" }}
                        />
                        <MetricsCard
                            title="Total Leads"
                            value={totalKpi.leads.toLocaleString()}
                            icon={Users}
                            iconColor="text-purple-600"
                            variant="gradient"
                            trend={{ value: 8, isPositive: true, label: "vs last period" }}
                        />
                        <MetricsCard
                            title="Total Campaigns"
                            value={campaignRows.length}
                            icon={TrendingUp}
                            iconColor="text-emerald-600"
                            variant="gradient"
                        />
                    </div>

                    {/* Secondary Metrics - Efficiency Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                            title="CTR"
                            value={`${globalCTR.toFixed(2)}%`}
                            icon={MousePointer2}
                            iconColor="text-sky-500"
                            description="Click-through rate"
                        />
                        <MetricsCard
                            title="Avg CPL"
                            value={currencyFormatter.format(globalCPL)}
                            icon={Target}
                            iconColor="text-rose-500"
                            description="Cost per lead"
                        />
                    </div>

                    {/* Detailed Tables Section */}
                    <div className="space-y-6">
                        <CampaignsTable campaigns={campaignRows} />
                    </div>

                    <div className="space-y-6">
                        <AdsTable ads={adRows} />
                    </div>
                </div>
            )}
        </div>
    );
}
