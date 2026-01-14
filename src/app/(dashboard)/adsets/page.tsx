"use client";

import { useEffect, useState } from "react";
import { MetricsCard } from "@/components/MetricsCard";
import { DateRangePicker } from "@/components/DateRangePicker";
import {
    Users,
    DollarSign,
    ArrowRight,
    Eye,
    Filter,
    ArrowUpDown,
    Sparkles
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { startOfMonth, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import ContextualAnalysis from "@/components/analyst/ContextualAnalysis";

import { Suspense } from "react";

type SortKey = 'name' | 'spend' | 'leads' | 'cpm' | 'cpc' | 'ctr' | 'cpl';

function AdSetsContent() {
    const searchParams = useSearchParams();
    const campaignId = searchParams.get("campaignId");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [adSets, setAdSets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE'>('ALL');
    const [sortKey, setSortKey] = useState<SortKey>('spend');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const now = new Date();
    const [dateRange, setDateRange] = useState({
        from: startOfMonth(now),
        to: endOfDay(now)
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const start = dateRange.from?.toISOString();
                const end = dateRange.to?.toISOString();
                const url = `/api/adsets?startDate=${start}&endDate=${end}${campaignId ? `&campaignId=${campaignId}` : ''}`;
                const res = await fetch(url);
                const data = await res.json();
                setAdSets(data);
            } catch (error) {
                console.error("Error fetching ad sets:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [dateRange, campaignId]);

    const filteredAdSets = adSets.filter(adSet => {
        // Always filter out zero spend as per user request ("not running actually")
        if (adSet.aggregate.spend <= 0) return false;

        if (filterStatus === 'ACTIVE') return adSet.status === 'ACTIVE';
        return true;
    });

    // Sort Logic
    const sortedAdSets = [...filteredAdSets].map(adset => {
        // Pre-calculate metrics for sorting
        const cpm = adset.aggregate.impressions > 0 ? (adset.aggregate.spend / adset.aggregate.impressions) * 1000 : 0;
        const cpc = adset.aggregate.clicks > 0 ? adset.aggregate.spend / adset.aggregate.clicks : 0;
        const cpl = adset.aggregate.leads > 0 ? adset.aggregate.spend / adset.aggregate.leads : 0;
        const ctr = adset.aggregate.ctr;

        return { ...adset, derived: { cpm, cpc, cpl, ctr } };
    }).sort((a, b) => {
        let valA, valB;

        switch (sortKey) {
            case 'name':
                valA = a.name;
                valB = b.name;
                return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            case 'spend':
                valA = a.aggregate.spend;
                valB = b.aggregate.spend;
                break;
            case 'leads':
                valA = a.aggregate.leads;
                valB = b.aggregate.leads;
                break;
            case 'cpm':
                valA = a.derived.cpm;
                valB = b.derived.cpm;
                break;
            case 'cpc':
                valA = a.derived.cpc;
                valB = b.derived.cpc;
                break;
            case 'ctr':
                valA = a.derived.ctr;
                valB = b.derived.ctr;
                break;
            case 'cpl':
                valA = a.derived.cpl;
                valB = b.derived.cpl;
                break;
            default:
                valA = 0;
                valB = 0;
        }

        if (typeof valA === 'number' && typeof valB === 'number') {
            return sortOrder === 'asc' ? valA - valB : valB - valA;
        }
        return 0;
    });

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('desc'); // Default to descending for numbers usually
        }
    };

    const SortIcon = () => <ArrowUpDown className="ml-2 h-4 w-4" />;

    const totals = filteredAdSets.reduce((acc, adset) => ({
        spend: acc.spend + adset.aggregate.spend,
        leads: acc.leads + adset.aggregate.leads,
        impressions: acc.impressions + adset.aggregate.impressions,
        clicks: acc.clicks + adset.aggregate.clicks,
    }), { spend: 0, leads: 0, impressions: 0, clicks: 0 });

    const totalCpm = totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0;

    const [selectedAdSet, setSelectedAdSet] = useState<{ id: string, name: string } | null>(null);

    return (
        <Sheet open={!!selectedAdSet} onOpenChange={(open) => !open && setSelectedAdSet(null)}>
            <div className="space-y-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Ad Sets</h2>
                        </div>
                        <p className="text-slate-500 ml-3">Drill down into audience and placement performance.</p>
                    </div>
                    <div className="flex gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <Filter className="h-4 w-4" />
                                    {filterStatus === 'ACTIVE' ? 'Active Ad Sets' : 'All Ad Sets'}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setFilterStatus('ACTIVE')}>
                                    Active Ad Sets
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilterStatus('ALL')}>
                                    All Ad Sets
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <DateRangePicker date={dateRange} setDate={setDateRange as any} />
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <MetricsCard title="Total Spend" value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totals.spend)} icon={DollarSign} />
                    <MetricsCard title="Total Leads" value={totals.leads} icon={Users} iconColor="text-purple-500" />
                    <MetricsCard title="Avg. CPM" value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalCpm)} icon={Eye} iconColor="text-blue-500" />
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left table-fixed">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="w-[200px] px-3 py-3 font-semibold">
                                        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold" onClick={() => handleSort('name')}>
                                            Ad Set <SortIcon />
                                        </Button>
                                    </th>
                                    <th className="w-[150px] px-3 py-3 font-semibold">Campaign</th>
                                    <th className="w-[100px] px-3 py-3 font-semibold">Status</th>
                                    <th className="w-[120px] px-3 py-3 font-semibold text-right">
                                        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold ml-auto" onClick={() => handleSort('spend')}>
                                            Spend <SortIcon />
                                        </Button>
                                    </th>
                                    <th className="w-[80px] px-3 py-3 font-semibold text-right">
                                        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold ml-auto" onClick={() => handleSort('leads')}>
                                            Leads <SortIcon />
                                        </Button>
                                    </th>
                                    <th className="w-[100px] px-3 py-3 font-semibold text-right">
                                        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold ml-auto" onClick={() => handleSort('cpm')}>
                                            CPM <SortIcon />
                                        </Button>
                                    </th>
                                    <th className="w-[100px] px-3 py-3 font-semibold text-right">
                                        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold ml-auto" onClick={() => handleSort('cpc')}>
                                            CPC <SortIcon />
                                        </Button>
                                    </th>
                                    <th className="w-[80px] px-3 py-3 font-semibold text-right">
                                        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold ml-auto" onClick={() => handleSort('ctr')}>
                                            CTR <SortIcon />
                                        </Button>
                                    </th>
                                    <th className="w-[100px] px-3 py-3 font-semibold text-right">
                                        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold ml-auto" onClick={() => handleSort('cpl')}>
                                            CPL <SortIcon />
                                        </Button>
                                    </th>
                                    <th className="w-[80px] px-3 py-3 font-semibold text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan={10} className="px-6 py-10 text-center text-slate-400">Loading ad set data...</td></tr>
                                ) : sortedAdSets.length === 0 ? (
                                    <tr><td colSpan={10} className="px-6 py-10 text-center text-slate-400">No ad sets found.</td></tr>
                                ) : sortedAdSets.map((adset) => {
                                    const { cpm, cpc, cpl, ctr } = adset.derived;

                                    return (
                                        <tr key={adset.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-3 py-3">
                                                <div className="w-full">
                                                    <div className="truncate text-slate-900 font-semibold" title={adset.name}>
                                                        {adset.name}
                                                    </div>
                                                    {adset.campaign?.business && (
                                                        <span
                                                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium mt-0.5"
                                                            style={{
                                                                backgroundColor: adset.campaign.business.color_code ? `${adset.campaign.business.color_code}15` : 'rgb(241 245 249)',
                                                                color: adset.campaign.business.color_code || 'rgb(71 85 105)'
                                                            }}
                                                            title={`Business: ${adset.campaign.business.name}`}
                                                        >
                                                            <span
                                                                className="w-1.5 h-1.5 rounded-full"
                                                                style={{ backgroundColor: adset.campaign.business.color_code || 'rgb(148 163 184)' }}
                                                            />
                                                            {adset.campaign.business.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="truncate text-slate-600 w-full" title={adset.campaign.name}>
                                                    {adset.campaign.name}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                                    adset.status === 'ACTIVE' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                                                )}>
                                                    {adset.status}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 font-medium text-slate-700 text-right text-xs">
                                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(adset.aggregate.spend)}
                                            </td>
                                            <td className="px-3 py-3 font-medium text-slate-700 text-right">
                                                {adset.aggregate.leads}
                                            </td>
                                            <td className="px-3 py-3 text-right text-xs">
                                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(cpm)}
                                            </td>
                                            <td className="px-3 py-3 text-right text-xs">
                                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(cpc)}
                                            </td>
                                            <td className="px-3 py-3 text-right text-xs">
                                                {ctr.toFixed(2)}%
                                            </td>
                                            <td className="px-3 py-3 text-right text-xs">
                                                {cpl > 0 ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(cpl) : '-'}
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-full"
                                                        title="Analyze with AI"
                                                        onClick={() => setSelectedAdSet({ id: adset.id, name: adset.name })}
                                                    >
                                                        <Sparkles className="h-4 w-4" />
                                                    </Button>
                                                    <Link
                                                        href={`/ads?adSetId=${adset.id}`}
                                                        className="inline-flex items-center justify-center p-2 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                        title="View Ads"
                                                    >
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <SheetContent className="sm:max-w-xl w-[90vw]">
                    <SheetHeader>
                        <SheetTitle>Ad Set Analysis</SheetTitle>
                        <SheetDescription>
                            AI-powered insights for {selectedAdSet?.name}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 h-[calc(100vh-120px)]">
                        {selectedAdSet && (
                            <ContextualAnalysis
                                adSetId={selectedAdSet.id}
                                adSetName={selectedAdSet.name}
                                date={dateRange}
                                isOpen={!!selectedAdSet}
                            />
                        )}
                    </div>
                </SheetContent>
            </div>
        </Sheet>
    );
}

export default function AdSetsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading ad set reports...</div>}>
            <AdSetsContent />
        </Suspense>
    );
}
