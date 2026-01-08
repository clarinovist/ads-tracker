"use client";

import * as React from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DateRangePicker({
    className,
    date: externalDate,
    setDate: externalSetDate,
}: React.HTMLAttributes<HTMLDivElement> & {
    date?: DateRange | { from: Date; to: Date };
    setDate?: (date: DateRange) => void
}) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Parse params or default to Last 7 Days
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    const [internalDate, setInternalDate] = React.useState<DateRange | undefined>({
        from: fromParam ? new Date(fromParam) : new Date(),
        to: toParam ? new Date(toParam) : new Date(),
    });

    const date = externalDate || internalDate;
    const setDate = (d: DateRange | undefined) => {
        if (externalSetDate && d) {
            externalSetDate(d);
        } else {
            setInternalDate(d);
        }
    };

    const [preset, setPreset] = React.useState(fromParam ? "custom" : "today");

    const handleSelect = (range: DateRange | undefined) => {
        setDate(range);
        if (range?.from && range?.to) {
            const params = new URLSearchParams(searchParams);
            params.set('from', format(range.from, 'yyyy-MM-dd'));
            params.set('to', format(range.to, 'yyyy-MM-dd'));
            router.push(`${pathname}?${params.toString()}`);
        }
    };

    const handlePresetChange = (val: string) => {
        setPreset(val);
        const today = new Date();
        let newFrom = today;
        let newTo = today;

        if (val === 'today') {
            newFrom = today;
        } else if (val === 'yesterday') {
            newFrom = subDays(today, 1);
            newTo = subDays(today, 1);
        } else if (val === '7d') {
            newFrom = subDays(today, 7);
        } else if (val === '14d') {
            newFrom = subDays(today, 14);
        } else if (val === '30d') {
            newFrom = subDays(today, 30);
        } else if (val === 'this_month') {
            newFrom = new Date(today.getFullYear(), today.getMonth(), 1);
        } else if (val === 'last_month') {
            newFrom = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            newTo = new Date(today.getFullYear(), today.getMonth(), 0);
        }

        setDate({ from: newFrom, to: newTo });

        // Update URL
        const params = new URLSearchParams(searchParams);
        params.set('from', format(newFrom, 'yyyy-MM-dd'));
        params.set('to', format(newTo, 'yyyy-MM-dd'));
        router.push(`${pathname}?${params.toString()}`);
    };

    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <div className={cn("grid gap-2", className)}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Select value={preset} onValueChange={handlePresetChange}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="yesterday">Yesterday</SelectItem>
                        <SelectItem value="7d">Last 7 Days</SelectItem>
                        <SelectItem value="14d">Last 14 Days</SelectItem>
                        <SelectItem value="30d">Last 30 Days</SelectItem>
                        <SelectItem value="this_month">This Month</SelectItem>
                        <SelectItem value="last_month">Last Month</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                </Select>

                {preset === 'custom' && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-full sm:w-[300px] justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                    date.to ? (
                                        <>
                                            {format(date.from, "LLL dd, y")} -{" "}
                                            {format(date.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(date.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Pick a date</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={handleSelect}
                                numberOfMonths={isMobile ? 1 : 2}
                            />
                        </PopoverContent>
                    </Popover>
                )}
            </div>
        </div>
    );
}
