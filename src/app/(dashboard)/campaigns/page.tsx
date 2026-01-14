"use client";

import { useEffect, useState } from "react";
import { MetricsCard } from "@/components/MetricsCard";
import { DateRangePicker } from "@/components/DateRangePicker";
import {
    Users,
    TrendingUp,
    DollarSign,
} from "lucide-react";
import { startOfMonth, endOfDay, format, startOfDay } from "date-fns";
import { Suspense } from "react";
import CampaignsTable, { CampaignRow } from "@/components/CampaignsTable";
import { useSearchParams } from "next/navigation";

function CampaignsContent() {
    const searchParams = useSearchParams();
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [campaigns, setCampaigns] = useState<any[]>([]);

    const now = new Date();
    const [dateRange, setDateRange] = useState({
        from: fromParam ? startOfDay(new Date(fromParam)) : startOfMonth(now),
        to: toParam ? endOfDay(new Date(toParam)) : endOfDay(now)
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const start = format(dateRange.from, 'yyyy-MM-dd');
                const end = format(dateRange.to, 'yyyy-MM-dd');
                const res = await fetch(`/api/campaigns?startDate=${start}&endDate=${end}`);
                const data = await res.json();
                setCampaigns(data);
            } catch (error) {
                console.error("Error fetching campaigns:", error);
            } finally {
            }
        };
        fetchData();
    }, [dateRange]);

    // FILTER BY SPEND (PERIOD-BASED)
    const visibleCampaigns = campaigns.filter(c => c.aggregate.spend > 0);

    const totals = visibleCampaigns.reduce((acc, camp) => ({
        spend: acc.spend + camp.aggregate.spend,
        leads: acc.leads + camp.aggregate.leads,
        clicks: acc.clicks + (camp.aggregate.clicks || 0),
        impressions: acc.impressions + camp.aggregate.impressions,
    }), { spend: 0, leads: 0, clicks: 0, impressions: 0 });



    // Transform to CampaignRow format
    const campaignRows: CampaignRow[] = visibleCampaigns.map(c => ({
        id: c.id,
        name: c.name,
        status: c.status,
        spend: c.aggregate.spend,
        impressions: c.aggregate.impressions,
        clicks: c.aggregate.clicks || 0,
        leads: c.aggregate.leads,
        businessName: c.business?.name,
        businessColor: c.business?.color_code,
    }));

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Campaigns</h2>
                    </div>
                    <p className="text-slate-500 ml-3">Analyze campaign performance for the selected period.</p>
                </div>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <DateRangePicker date={dateRange} setDate={setDateRange as any} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricsCard
                    title="Total Spend"
                    value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totals.spend)}
                    icon={DollarSign}
                />
                <MetricsCard
                    title="Total Leads"
                    value={totals.leads}
                    icon={Users}
                    iconColor="text-purple-500"
                />
                <MetricsCard
                    title="Total Clicks"
                    value={new Intl.NumberFormat('id-ID').format(totals.clicks)}
                    icon={TrendingUp}
                    iconColor="text-emerald-500"
                />
                <MetricsCard
                    title="Avg CPM"
                    value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(
                        totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0
                    )}
                    icon={TrendingUp}
                    iconColor="text-orange-500"
                    description="Cost per 1,000 impressions"
                />
            </div>

            <CampaignsTable campaigns={campaignRows} />
        </div>
    );
}

export default function CampaignsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading campaign reports...</div>}>
            <CampaignsContent />
        </Suspense>
    );
}
