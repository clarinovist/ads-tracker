"use client";


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { formatCurrency } from "@/lib/utils";

interface ChartData {
    date: string;
    [key: string]: string | number; // multiple businesses
}

const CustomTooltip = ({ active, payload, label, formatter }: {
    active?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: any[];
    label?: string;
    formatter?: (value: number) => string;
}) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-sm p-4 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.2)] rounded-xl text-sm">
                <p className="font-semibold text-slate-800 mb-2">{label}</p>
                <div className="space-y-1">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-slate-500">{entry.name}:</span>
                            <span className="font-medium text-slate-900">
                                {formatter ? formatter(entry.value) : entry.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export default function OverviewCharts({
    data,
    businesses,
}: {
    data: ChartData[],
    businesses: { id: string; name: string; color_code: string }[],
}) {

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
                        <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                        Spend Trend
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px] w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    tickFormatter={(value) => formatCurrency(value)}
                                    axisLine={false}
                                    tickLine={false}
                                    dx={-10}
                                />
                                <Tooltip content={<CustomTooltip formatter={(value: number) => formatCurrency(value)} />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }} />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                {businesses.map(b => (
                                    <Line
                                        key={b.id}
                                        type="monotone"
                                        dataKey={`${b.id}_spend`}
                                        name={b.name}
                                        stroke={b.color_code}
                                        strokeWidth={3}
                                        activeDot={{ r: 6, strokeWidth: 0, fill: b.color_code }}
                                        dot={false}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
                        <div className="w-1 h-4 bg-pink-500 rounded-full" />
                        Leads Trend
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px] w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    axisLine={false}
                                    tickLine={false}
                                    dx={-10}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }} />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                {businesses.map(b => (
                                    <Line
                                        key={b.id}
                                        type="monotone"
                                        dataKey={`${b.id}_leads`}
                                        name={b.name}
                                        stroke={b.color_code}
                                        strokeWidth={3}
                                        activeDot={{ r: 6, strokeWidth: 0, fill: b.color_code }}
                                        dot={false}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
