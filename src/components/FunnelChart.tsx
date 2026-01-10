"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { useState, useEffect } from "react";

interface FunnelData {
    name: string;
    value: number;
    fill: string;
}

interface FunnelChartProps {
    data: {
        impressions: number;
        clicks: number;
        leads: number;
    };
}

export default function FunnelChart({ data }: FunnelChartProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line
        setMounted(true);
    }, []);

    const chartData: FunnelData[] = [
        { name: 'Impressions', value: data.impressions, fill: '#64748b' },
        { name: 'Clicks', value: data.clicks, fill: '#3b82f6' },
        { name: 'Leads', value: data.leads, fill: '#22c55e' },
    ];

    if (!mounted) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Conversion Funnel</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full bg-slate-50/50 rounded-lg animate-pulse" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={chartData} margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={80} />
                            <Tooltip
                                formatter={(value: number | undefined) => new Intl.NumberFormat('id-ID').format(value || 0)}
                                cursor={{ fill: 'transparent' }}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
