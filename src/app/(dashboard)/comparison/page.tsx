import { prisma } from '@/lib/prisma';
import { DateRangePicker } from '@/components/DateRangePicker';
import { DashboardTabs } from '@/components/DashboardTabs';
import OverviewCharts from '@/components/OverviewCharts';
import { MessagingTimeDistribution } from '@/components/analytics/MessagingTimeDistribution';
import {
    BarChart3,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import Link from 'next/link';
import { startOfDay, endOfDay, format } from "date-fns";
import { cn, formatCurrency } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export default async function ComparisonPage({
    searchParams,
}: {
    searchParams: Promise<{ from?: string; to?: string }>;
}) {
    const params = await searchParams;
    const today = new Date();
    const fromDate = params.from ? startOfDay(new Date(params.from)) : startOfDay(today);
    const toDate = params.to ? endOfDay(new Date(params.to)) : endOfDay(today);

    // Fetch businesses and their aggregate data for the period
    const businesses = await prisma.business.findMany({
        where: { is_active: true },
        orderBy: { name: 'asc' },
        include: {
            daily_insights: {
                where: {
                    date: { gte: fromDate, lte: toDate }
                },
                orderBy: { date: 'asc' }
            }
        }
    });

    const businessesWithStats = businesses.map(biz => {
        const stats = biz.daily_insights.reduce((acc, curr) => ({
            spend: acc.spend + curr.spend,
            impressions: acc.impressions + curr.impressions,
            leads: acc.leads + curr.leads,
        }), { spend: 0, impressions: 0, leads: 0 });

        const cpm = stats.impressions > 0 ? (stats.spend / stats.impressions) * 1000 : 0;

        return {
            ...biz,
            stats: {
                ...stats,
                cpm
            }
        };
    });

    // Chart Data - grouped by date with business-specific series
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const groupedData: Record<string, any> = {};
    businesses.forEach(biz => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        biz.daily_insights.forEach((i: any) => {
            const dateKey = format(i.date, 'yyyy-MM-dd');
            if (!groupedData[dateKey]) groupedData[dateKey] = { date: format(i.date, 'MMM dd') };
            groupedData[dateKey][`${biz.id}_spend`] = i.spend;
            groupedData[dateKey][`${biz.id}_leads`] = i.leads;
        });
    });
    const chartData = Object.values(groupedData);

    // Date range object for the picker
    const dateRange = { from: fromDate, to: toDate };

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Charts & Analytics</h2>
                    </div>
                    <p className="text-slate-500 ml-3">Visual performance trends and messaging analysis.</p>
                </div>
                <DateRangePicker />
            </div>


            {/* Tab Navigation */}
            <DashboardTabs />

            {/* Charts Section - Moved from Dashboard */}
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-900">Performance Trends</h3>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                        {businesses.length} Businesses
                    </span>
                </div>
                <OverviewCharts data={chartData} businesses={businesses} />
            </div>

            {/* Messaging Analysis */}
            <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Messaging Analysis</h3>
                <MessagingTimeDistribution dateFrom={fromDate.toISOString()} dateTo={toDate.toISOString()} />
            </div>

            {/* Business Comparison Cards */}
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-900">Business Comparison</h3>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                        {businessesWithStats.length} Active
                    </span>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {businessesWithStats.map((biz) => (
                        <div key={biz.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-inner" style={{ backgroundColor: biz.color_code || '#64748b' }}>
                                        {biz.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{biz.name}</h3>
                                        <p className="text-xs text-slate-500 uppercase tracking-tighter">{biz.ad_account_id}</p>
                                    </div>
                                </div>
                                <div className={cn(
                                    "px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1",
                                    biz.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
                                )}>
                                    {biz.is_active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                    {biz.is_active ? "ACTIVE" : "INACTIVE"}
                                </div>
                            </div>

                            <div className="p-6 space-y-4 flex-1">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                                        <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Spend</p>
                                        <p className="text-lg font-bold text-slate-900">
                                            {formatCurrency(biz.stats.spend)}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                                        <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Leads</p>
                                        <p className="text-lg font-bold text-slate-900">{biz.stats.leads}</p>
                                    </div>
                                </div>

                                <div className="bg-slate-900 p-4 rounded-xl text-white relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:rotate-12 transition-transform">
                                        <BarChart3 className="h-12 w-12" />
                                    </div>
                                    <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">CPM (Cost / 1k Impr)</p>
                                    <p className="text-3xl font-black">{formatCurrency(biz.stats.cpm)}</p>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 border-t border-slate-100">
                                <Link
                                    href={`/businesses/${biz.id}/analytics?from=${dateRange.from.toISOString().split('T')[0]}&to=${dateRange.to.toISOString().split('T')[0]}`}
                                    className="w-full py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors block text-center"
                                >
                                    View Detailed Report
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
