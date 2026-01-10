"use client";

import { useState } from "react";
import { RefreshCw, ChevronDown, Calendar, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SyncButton() {
    const [isSyncing, setIsSyncing] = useState(false);
    const router = useRouter();

    const handleSync = async (mode: 'daily' | 'smart' | 'leads') => {
        if (isSyncing) return;

        setIsSyncing(true);
        try {
            const url = mode === 'smart'
                ? "/api/sync?mode=smart"
                : "/api/sync";

            const options: RequestInit = { method: "POST" };

            const res = await fetch(url, options);
            const data = await res.json();

            if (data.success) {
                // If the API doesn't update the status itself (manual sync API might not),
                // we could do it here, but usually the API should handle it.
                // Let's check sync API again.
                alert(`Sync (${mode === 'smart' ? '7 Days' : 'Today'}) completed successfully!`);
                router.refresh();
            } else {
                alert("Sync failed: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Sync error:", error);
            alert("An error occurred while syncing.");
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    disabled={isSyncing}
                    className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left",
                        "text-slate-400 hover:text-white hover:bg-slate-800",
                        isSyncing && "opacity-70 cursor-not-allowed"
                    )}
                >
                    <div className="flex items-center gap-3">
                        <RefreshCw className={cn("h-5 w-5", isSyncing && "animate-spin")} />
                        {isSyncing ? "Syncing..." : "Sync Data"}
                    </div>
                    {!isSyncing && <ChevronDown className="h-4 w-4 opacity-50" />}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => handleSync('daily')} disabled={isSyncing}>
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Sync Today (Fast)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSync('smart')} disabled={isSyncing}>
                    <History className="mr-2 h-4 w-4" />
                    <span>Smart Sync (7 Days)</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
