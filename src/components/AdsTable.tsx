"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { formatCurrency, formatNumber } from "@/lib/utils"; 

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
}

export default function AdsTable({ ads }: AdsTableProps) {
    if (ads.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Ad Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-6 text-muted-foreground">
                        No ad data available for this period.
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Sort by Spend descending by default
    const sorted = [...ads].sort((a, b) => b.spend - a.spend);

    // Limit to top 50 to avoid rendering issues if thousands of ads
    const displayAds = sorted.slice(0, 50);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Top Performing Ads</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[300px]">Ad Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Spend</TableHead>
                            <TableHead className="text-right">Impr.</TableHead>
                            <TableHead className="text-right">CTR</TableHead>
                            <TableHead className="text-right">Leads</TableHead>
                            <TableHead className="text-right">CPC</TableHead>
                            <TableHead className="text-right">CPL</TableHead>
                            <TableHead className="text-right">Hook Rate</TableHead>
                            <TableHead className="text-right">Hold Rate</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {displayAds.map((row) => {
                            const ctr = row.impressions > 0 ? (row.clicks / row.impressions) * 100 : 0;
                            const cpl = row.leads > 0 ? row.spend / row.leads : 0;
                            const cpc = row.clicks > 0 ? row.spend / row.clicks : 0;

                            // For Hook/Hold, we need data. If not passed, we can't show it.
                            // I should add hook/hold to AdRow interface if available.
                            // For now, I'll calculate basic metrics.

                            return (
                                <TableRow key={row.id}>
                                    <TableCell className="font-medium truncate max-w-[300px]" title={row.name}>{row.name}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                                            }`}>
                                            {row.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(row.spend)}
                                    </TableCell>
                                    <TableCell className="text-right">{new Intl.NumberFormat('id-ID').format(row.impressions)}</TableCell>
                                    <TableCell className="text-right">{ctr.toFixed(2)}%</TableCell>
                                    <TableCell className="text-right">{new Intl.NumberFormat('id-ID').format(row.leads)}</TableCell>
                                    <TableCell className="text-right">
                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(cpc)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {cpl > 0 ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(cpl) : '-'}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">-</TableCell>
                                    <TableCell className="text-right text-muted-foreground">-</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
