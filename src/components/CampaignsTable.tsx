"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpDown } from "lucide-react";
import { Button } from "./ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface CampaignRow {
    id: string;
    name: string;
    status: string;
    spend: number;
    impressions: number;
    clicks: number;
    leads: number;
}

interface CampaignsTableProps {
    campaigns: CampaignRow[];
}

type SortKey = 'name' | 'spend' | 'impressions' | 'cpm' | 'clicks' | 'ctr' | 'leads' | 'cpc' | 'cpl';

export default function CampaignsTable({ campaigns }: CampaignsTableProps) {
    // 1. Filter Active Only (Safeguard) + Spend > 0 (Actually Running)
    const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE' && c.spend > 0);

    const [sortKey, setSortKey] = useState<SortKey>('spend');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
        spend: true,
        impressions: true,
        cpm: true,
        clicks: true,
        ctr: true,
        leads: true,
        cpc: true,
        cpl: true,
    });

    const toggleColumn = (key: string) => {
        setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
    };

    if (activeCampaigns.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Campaign Performance (Active)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-6 text-muted-foreground">
                        No active campaigns found.
                    </div>
                </CardContent>
            </Card>
        );
    }

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('desc'); // Default to descending for numbers usually
        }
    };

    // Calculate derived metrics for sorting
    const processed = activeCampaigns.map(row => {
        const cpm = row.impressions > 0 ? (row.spend / row.impressions) * 1000 : 0;
        const ctr = row.impressions > 0 ? (row.clicks / row.impressions) * 100 : 0;
        const cpl = row.leads > 0 ? row.spend / row.leads : 0;
        const cpc = row.clicks > 0 ? row.spend / row.clicks : 0;
        return { ...row, cpm, ctr, cpl, cpc };
    });

    const sorted = [...processed].sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];

        if (typeof valA === 'string' && typeof valB === 'string') {
            return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        // numeric sort
        return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    const SortIcon = () => <ArrowUpDown className="ml-2 h-4 w-4" />;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Campaign Performance (Active)</CardTitle>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="ml-auto hidden h-8 lg:flex">
                            View
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[150px]">
                        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem
                            checked={visibleColumns.spend}
                            onCheckedChange={() => toggleColumn("spend")}
                        >
                            Spend
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={visibleColumns.impressions}
                            onCheckedChange={() => toggleColumn("impressions")}
                        >
                            Impressions
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={visibleColumns.cpm}
                            onCheckedChange={() => toggleColumn("cpm")}
                        >
                            CPM
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={visibleColumns.clicks}
                            onCheckedChange={() => toggleColumn("clicks")}
                        >
                            Clicks
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={visibleColumns.ctr}
                            onCheckedChange={() => toggleColumn("ctr")}
                        >
                            CTR
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={visibleColumns.leads}
                            onCheckedChange={() => toggleColumn("leads")}
                        >
                            Leads
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={visibleColumns.cpc}
                            onCheckedChange={() => toggleColumn("cpc")}
                        >
                            CPC
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={visibleColumns.cpl}
                            onCheckedChange={() => toggleColumn("cpl")}
                        >
                            CPL
                        </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>
                                <Button variant="ghost" onClick={() => handleSort('name')}>
                                    Campaign Name <SortIcon />
                                </Button>
                            </TableHead>
                            {/* Status column removed as per request */}
                            {visibleColumns.spend && <TableHead className="text-right">
                                <Button variant="ghost" onClick={() => handleSort('spend')}>
                                    Spend <SortIcon />
                                </Button>
                            </TableHead>}
                            {visibleColumns.impressions && <TableHead className="text-right">
                                <Button variant="ghost" onClick={() => handleSort('impressions')}>
                                    Impr. <SortIcon />
                                </Button>
                            </TableHead>}
                            {visibleColumns.cpm && <TableHead className="text-right">
                                <Button variant="ghost" onClick={() => handleSort('cpm')}>
                                    CPM <SortIcon />
                                </Button>
                            </TableHead>}
                            {visibleColumns.clicks && <TableHead className="text-right">
                                <Button variant="ghost" onClick={() => handleSort('clicks')}>
                                    Clicks <SortIcon />
                                </Button>
                            </TableHead>}
                            {visibleColumns.ctr && <TableHead className="text-right">
                                <Button variant="ghost" onClick={() => handleSort('ctr')}>
                                    CTR <SortIcon />
                                </Button>
                            </TableHead>}
                            {visibleColumns.leads && <TableHead className="text-right">
                                <Button variant="ghost" onClick={() => handleSort('leads')}>
                                    Leads <SortIcon />
                                </Button>
                            </TableHead>}
                            {visibleColumns.cpc && <TableHead className="text-right">
                                <Button variant="ghost" onClick={() => handleSort('cpc')}>
                                    CPC <SortIcon />
                                </Button>
                            </TableHead>}
                            {visibleColumns.cpl && <TableHead className="text-right">
                                <Button variant="ghost" onClick={() => handleSort('cpl')}>
                                    CPL <SortIcon />
                                </Button>
                            </TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sorted.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell className="font-medium">
                                    <div className="max-w-[300px] truncate" title={row.name}>
                                        {row.name}
                                    </div>
                                </TableCell>
                                {/* Status cell removed */}
                                {visibleColumns.spend && <TableCell className="text-right">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(row.spend)}
                                </TableCell>}
                                {visibleColumns.impressions && <TableCell className="text-right">{new Intl.NumberFormat('id-ID').format(row.impressions)}</TableCell>}
                                {visibleColumns.cpm && <TableCell className="text-right">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(row.cpm)}
                                </TableCell>}
                                {visibleColumns.clicks && <TableCell className="text-right">{new Intl.NumberFormat('id-ID').format(row.clicks)}</TableCell>}
                                {visibleColumns.ctr && <TableCell className="text-right">{row.ctr.toFixed(2)}%</TableCell>}
                                {visibleColumns.leads && <TableCell className="text-right">{new Intl.NumberFormat('id-ID').format(row.leads)}</TableCell>}
                                {visibleColumns.cpc && <TableCell className="text-right">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(row.cpc)}
                                </TableCell>}
                                {visibleColumns.cpl && <TableCell className="text-right">
                                    {row.cpl > 0 ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(row.cpl) : '-'}
                                </TableCell>}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
