

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    trend?: {
        value: number;
        label: string;
        isPositive: boolean;
    };
    className?: string;
    iconColor?: string;
}

export function MetricsCard({
    title,
    value,
    icon: Icon,
    description,
    trend,
    className,
    iconColor = "text-blue-500",
}: MetricsCardProps) {
    return (
        <Card className={cn("overflow-hidden border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-lg transition-all duration-300 group", className)}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs md:text-sm font-medium text-slate-500 group-hover:text-slate-600 transition-colors uppercase tracking-wider">{title}</p>
                        <h3 className="text-xl md:text-2xl font-bold mt-1 md:mt-2 text-slate-900 tracking-tight">{value}</h3>
                    </div>
                    <div className={cn("p-3 rounded-xl transition-colors", iconColor.replace("text-", "bg-").replace(/\d00$/, "50"), "group-hover:scale-105 duration-300")}>
                        <Icon className={cn("h-5 w-5", iconColor)} />
                    </div>
                </div>

                {(description || trend) && (
                    <div className="mt-4 flex items-center gap-2">
                        {trend && (
                            <div className={cn(
                                "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
                                trend.isPositive ? "text-emerald-700 bg-emerald-50 border border-emerald-100" : "text-rose-700 bg-rose-50 border border-rose-100"
                            )}>
                                <span>{trend.isPositive ? "↑" : "↓"}</span>
                                {trend.value}%
                            </div>
                        )}
                        {description && (
                            <p className="text-xs text-slate-400 truncate font-medium">{description}</p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
