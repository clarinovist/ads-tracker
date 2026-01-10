
'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


interface LeadTimeDistributionProps {
    dateFrom?: Date;
    dateTo?: Date;
    businessId?: string;
}

interface HourlyData {
    hour: number;
    count: number;
    label: string;
}

export function LeadTimeDistribution({ dateFrom, dateTo, businessId }: LeadTimeDistributionProps) {
    const [data, setData] = useState<HourlyData[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!dateFrom || !dateTo) return;

            setLoading(true);
            try {
                const params = new URLSearchParams({
                    from: dateFrom.toISOString(),
                    to: dateTo.toISOString(),
                    ...(businessId ? { businessId } : {})
                });

                const res = await fetch(`/api/analytics/leads-distribution?${params}`);
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                }
            } catch (error) {
                console.error("Failed to fetch distribution", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [dateFrom, dateTo, businessId]);

    if (!dateFrom || !dateTo) return null;

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Hourly Lead Distribution</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[300px] w-full">
                    {loading ? (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                            Loading...
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="label"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ background: '#333', border: 'none', color: '#fff' }}
                                />
                                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
