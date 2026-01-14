
'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MessagingTimeDistributionProps {
    dateFrom?: string | Date;
    dateTo?: string | Date;
    businessId?: string;
}

// Helper to ensure Date
const toDate = (d?: string | Date) => {
    if (!d) return undefined;
    return typeof d === 'string' ? new Date(d) : d;
};

interface HourlyData {
    hour: number;
    count: number;
    label: string;
}

export function MessagingTimeDistribution({ dateFrom: rawFrom, dateTo: rawTo, businessId }: MessagingTimeDistributionProps) {
    const [data, setData] = useState<HourlyData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const dateFrom = toDate(rawFrom);
    const dateTo = toDate(rawTo);

    useEffect(() => {
        const fetchData = async () => {
            if (!dateFrom || !dateTo) return;

            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams({
                    from: dateFrom.toISOString(),
                    to: dateTo.toISOString(),
                    ...(businessId ? { businessId } : {})
                });

                const res = await fetch(`/api/analytics/hourly-distribution?${params}`);
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                } else {
                    const err = await res.json();
                    setError(err.error || 'Failed to fetch data');
                }
            } catch (error) {
                console.error("Failed to fetch distribution", error);
                setError('Network error. Check console.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [rawFrom, rawTo, businessId]);

    if (!dateFrom || !dateTo) return null;

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Messaging Hourly Distribution (Conversations Started)</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[300px] w-full">
                    {loading ? (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                            Loading...
                        </div>
                    ) : error ? (
                        <div className="flex h-full items-center justify-center text-sm text-red-500">
                            {error} <br /> (Try refreshing the page)
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
                                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Conversations" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
