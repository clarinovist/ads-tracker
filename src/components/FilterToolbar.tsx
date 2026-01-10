"use client";


import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X, Plus, Download } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption {
    value: string;
    label: string;
}

interface FilterToolbarProps {
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    filters?: {
        name: string;
        value: string;
        options: FilterOption[];
        onChange: (value: string) => void;
    }[];
    onClearAll?: () => void;
    showClearAll?: boolean;
    actions?: {
        label: string;
        icon?: React.ReactNode;
        onClick: () => void;
        variant?: "default" | "outline" | "primary";
    }[];
    totalCount?: number;
    className?: string;
}

export function FilterToolbar({
    searchPlaceholder = "Search...",
    searchValue = "",
    onSearchChange,
    filters = [],
    onClearAll,
    showClearAll = false,
    actions = [],
    totalCount,
    className,
}: FilterToolbarProps) {
    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                {/* Search Input */}
                {onSearchChange && (
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-10 h-10 bg-white border-slate-200 rounded-xl focus:border-indigo-500 focus-visible:ring-indigo-500/20"
                        />
                    </div>
                )}

                {/* Filter Dropdowns */}
                <div className="flex flex-wrap items-center gap-2">
                    {filters.map((filter, idx) => (
                        <Select
                            key={idx}
                            value={filter.value}
                            onValueChange={filter.onChange}
                        >
                            <SelectTrigger className="w-[140px] h-10 bg-white border-slate-200 rounded-xl">
                                <SelectValue placeholder={filter.name} />
                            </SelectTrigger>
                            <SelectContent>
                                {filter.options.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ))}

                    {/* Filter Button */}
                    {filters.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-10 px-4 rounded-xl border-slate-200 gap-2"
                        >
                            <Filter className="h-4 w-4" />
                            Filter
                        </Button>
                    )}

                    {/* Clear All */}
                    {showClearAll && onClearAll && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClearAll}
                            className="h-10 px-3 text-slate-500 hover:text-slate-700 gap-1"
                        >
                            Clear All
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    {actions.map((action, idx) => (
                        <Button
                            key={idx}
                            variant={action.variant === "primary" ? "default" : "outline"}
                            size="sm"
                            onClick={action.onClick}
                            className={cn(
                                "h-10 px-4 rounded-xl gap-2",
                                action.variant === "primary" && "bg-indigo-600 hover:bg-indigo-700 text-white"
                            )}
                        >
                            {action.icon}
                            {action.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Results count */}
            {totalCount !== undefined && (
                <p className="text-sm text-slate-500">
                    Showing <span className="font-semibold text-slate-700">{totalCount}</span> results
                </p>
            )}
        </div>
    );
}

// Export preset actions for convenience
export const ExportAction = (onClick: () => void) => ({
    label: "Export",
    icon: <Download className="h-4 w-4" />,
    onClick,
    variant: "outline" as const,
});

export const AddAction = (label: string, onClick: () => void) => ({
    label,
    icon: <Plus className="h-4 w-4" />,
    onClick,
    variant: "primary" as const,
});
