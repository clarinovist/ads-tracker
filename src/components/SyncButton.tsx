"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function SyncButton() {
    const [isSyncing, setIsSyncing] = useState(false);
    const router = useRouter();

    const handleSync = async () => {
        if (isSyncing) return;

        setIsSyncing(true);
        try {
            const res = await fetch("/api/sync", { method: "POST" });
            const data = await res.json();

            if (data.success) {
                alert(`Sync completed! Insights: ${data.insights?.days || 0} days, Leads: ${data.leads?.count || 0}`);
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
        <button
            onClick={handleSync}
            disabled={isSyncing}
            className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left",
                "text-slate-400 hover:text-white hover:bg-slate-800",
                isSyncing && "opacity-70 cursor-not-allowed"
            )}
        >
            <RefreshCw className={cn("h-5 w-5", isSyncing && "animate-spin")} />
            {isSyncing ? "Syncing..." : "Sync All"}
        </button>
    );
}
