"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, MoreVertical, Image as ImageIcon } from "lucide-react";
import { Button } from "./ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useState } from "react";
const SortIcon = () => <ArrowUpDown className="ml-1 h-3 w-3" />;

export interface AdRow {
    id: string;
    name: string;
    status: string;
    spend: number;
    impressions: number;
    clicks: number;
    leads: number;
}

interface AdsTableProps {
    ads: AdRow[];
    maxSpend?: number;
}

// Progress Bar Component
function ProgressBar({ value, max, color = "pink" }: { value: number; max: number; color?: string }) {
    const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    const colorClasses: Record<string, string> = {
        indigo: "bg-indigo-500",
        pink: "bg-pink-500",
        emerald: "bg-emerald-500",
        amber: "bg-amber-500",
    };

    return (
        <div className="flex items-center gap-3 min-w-[120px]">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={cn("h-full rounded-full transition-all duration-500", colorClasses[color] || colorClasses.pink)}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <span className="text-xs font-medium text-slate-600 w-10 text-right">{percentage.toFixed(0)}%</span>
        </div>
    );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
        ACTIVE: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Active" },
        PAUSED: { bg: "bg-amber-50", text: "text-amber-700", label: "Paused" },
        DELETED: { bg: "bg-rose-50", text: "text-rose-700", label: "Deleted" },
        ARCHIVED: { bg: "bg-slate-50", text: "text-slate-600", label: "Archived" },
    };

    const config = statusConfig[status] || statusConfig.PAUSED;

    return (
        <span className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
            config.bg, config.text
        )}>
            {config.label}
        </span>
    );
}

type SortKey = 'name' | 'spend' | 'leads' | 'ctr' | 'cpl';

export default function AdsTable({ ads, maxSpend }: AdsTableProps) {
    const [sortKey, setSortKey] = useState<SortKey>('spend');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    if (ads.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-8">
                <div className="text-center py-6">
                    <ImageIcon className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No ad data available for this period.</p>
                </div>
            </div>
        );
    }

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('desc');
        }
    };

    // Process ads with derived metrics
    const processed = ads.map(row => {
        const ctr = row.impressions > 0 ? (row.clicks / row.impressions) * 100 : 0;
        const cpl = row.leads > 0 ? row.spend / row.leads : 0;
        return { ...row, ctr, cpl };
    });

    // Calculate max spend for progress bars
    const calculatedMaxSpend = maxSpend || Math.max(...processed.map(p => p.spend));

    const sorted = [...processed].sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];

        if (typeof valA === 'string' && typeof valB === 'string') {
            return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    // Limit to top 50
    const displayAds = sorted.slice(0, 50);



    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-pink-500 rounded-full" />
                    <h3 className="font-semibold text-slate-900">Top Performing Ads</h3>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{ads.length} Ads</span>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/30">
                            <TableHead className="w-[250px]">
                                <Button variant="ghost" size="sm" className="h-8 p-0 font-semibold text-xs" onClick={() => handleSort('name')}>
                                    Ad <SortIcon />
                                </Button>
                            </TableHead>
                            <TableHead className="w-[180px]">
                                <Button variant="ghost" size="sm" className="h-8 p-0 font-semibold text-xs" onClick={() => handleSort('spend')}>
                                    Spend <SortIcon />
                                </Button>
                            </TableHead>
                            <TableHead className="text-right">
                                <Button variant="ghost" size="sm" className="h-8 p-0 font-semibold text-xs" onClick={() => handleSort('leads')}>
                                    Leads <SortIcon />
                                </Button>
                            </TableHead>
                            <TableHead className="text-right">
                                <Button variant="ghost" size="sm" className="h-8 p-0 font-semibold text-xs" onClick={() => handleSort('ctr')}>
                                    CTR <SortIcon />
                                </Button>
                            </TableHead>
                            <TableHead className="text-right">
                                <Button variant="ghost" size="sm" className="h-8 p-0 font-semibold text-xs" onClick={() => handleSort('cpl')}>
                                    CPL <SortIcon />
                                </Button>
                            </TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {displayAds.map((row) => (
                            <TableRow key={row.id} className="group hover:bg-slate-50/50">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                                            <ImageIcon className="h-4 w-4 text-pink-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-slate-900 truncate max-w-[180px]" title={row.name}>
                                                {row.name}
                                            </p>
                                            <StatusBadge status={row.status} />
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-slate-900">
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(row.spend)}
                                        </p>
                                        <ProgressBar value={row.spend} max={calculatedMaxSpend} color="pink" />
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className="font-semibold text-slate-900">{row.leads}</span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className={cn(
                                        "font-medium",
                                        row.ctr >= 2 ? "text-emerald-600" : row.ctr >= 1 ? "text-amber-600" : "text-slate-600"
                                    )}>
                                        {row.ctr.toFixed(2)}%
                                    </span>
                                </TableCell>
                                <TableCell className="text-right text-sm text-slate-600">
                                    {row.cpl > 0 ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(row.cpl) : '-'}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>View Details</DropdownMenuItem>
                                            <DropdownMenuItem>View Creative</DropdownMenuItem>
                                            <DropdownMenuItem>Export Data</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
