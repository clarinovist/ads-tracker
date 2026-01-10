"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LiveData {
    global: {
        spend: number;
        impressions: number;
        clicks: number;
        leads: number;
        cpc: number;
        cpl: number;
        ctr: number;
        cpm: number;
    } | null;
    businesses: {
        id: string;
        name: string;
        spend: number;
        impressions: number;
        clicks: number;
        leads: number;
        leads_whatsapp: number;
        leads_instagram: number;
        leads_messenger: number;
        cpc: number;
        cpl: number;
        ctr: number;
        cpm: number;
    }[];
}

export default function LiveDashboard() {
    const [data, setData] = useState<LiveData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/live');
            if (!res.ok) throw new Error("Failed to fetch");
            const json = await res.json();

            if (json.error) throw new Error(json.error);

            setData(json);
            setLastUpdated(new Date());
        } catch (err) {
            console.error(err);
            setError("Failed to load live data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Auto-refresh every 5 minutes
        const interval = setInterval(fetchData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    const formatNumber = (val: number) => new Intl.NumberFormat('id-ID').format(val);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Live Monitor</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Displaying real-time data for Today ({new Date().toLocaleDateString()}).
                        {lastUpdated && ` Updated at ${lastUpdated.toLocaleTimeString()}.`}
                    </p>
                </div>
                <Button onClick={fetchData} disabled={loading} variant="outline" size="sm">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Refresh Now
                </Button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-500 rounded-md border border-red-200">
                    {error}
                </div>
            )}

            {loading && !data && (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
            )}

            {data && data.global && (
                <>
                    {/* Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-500">Today&apos;s Spend</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(data.global.spend)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-500">Today&apos;s Leads</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatNumber(data.global.leads)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-500">Today&apos;s CPL</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(data.global.cpl)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-500">Today&apos;s ROAS</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-400">-</div>
                                <p className="text-xs text-muted-foreground">Not tracked</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detailed Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Real-Time Performance by Account</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Account Name</TableHead>
                                        <TableHead className="text-right">Spend</TableHead>
                                        <TableHead className="text-right">Impr.</TableHead>
                                        <TableHead className="text-right">CPM</TableHead>
                                        <TableHead className="text-right">Ctr</TableHead>
                                        <TableHead className="text-right">Leads</TableHead>
                                        <TableHead className="text-right">WA</TableHead>
                                        <TableHead className="text-right">IG</TableHead>
                                        <TableHead className="text-right">Msg</TableHead>
                                        <TableHead className="text-right">CPL</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.businesses.map(b => (
                                        <TableRow key={b.id}>
                                            <TableCell className="font-medium">{b.name}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(b.spend)}</TableCell>
                                            <TableCell className="text-right">{formatNumber(b.impressions)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(b.cpm)}</TableCell>
                                            <TableCell className="text-right">{b.ctr.toFixed(2)}%</TableCell>
                                            <TableCell className="text-right">{formatNumber(b.leads)}</TableCell>
                                            <TableCell className="text-right text-green-600">{formatNumber(b.leads_whatsapp || 0)}</TableCell>
                                            <TableCell className="text-right text-pink-600">{formatNumber(b.leads_instagram || 0)}</TableCell>
                                            <TableCell className="text-right text-blue-600">{formatNumber(b.leads_messenger || 0)}</TableCell>
                                            <TableCell className="text-right">{b.cpl > 0 ? formatCurrency(b.cpl) : '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
            )
            }
        </div >
    );
}
