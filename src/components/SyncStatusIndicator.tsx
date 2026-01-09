"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, AlertCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function SyncStatusIndicator() {
    const [status, setStatus] = useState<'idle' | 'syncing' | 'success' | 'failed'>('idle');
    const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/sync-status');
            const data = await res.json();
            if (data.status) setStatus(data.status);
            if (data.lastSyncAt) setLastSyncAt(new Date(data.lastSyncAt));
        } catch (error) {
            console.error("Failed to fetch sync status", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000); // Poll every 30 seconds
        return () => clearInterval(interval);
    }, []);

    if (loading && !lastSyncAt) return null;

    return (
        <div className="px-4 py-3 mb-2 mx-2 rounded-xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">System Status</span>
                {status === 'syncing' ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-medium text-indigo-400 animate-pulse">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                        </span>
                        Syncing
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                        <div className="h-1 w-1 rounded-full bg-emerald-500" />
                        Online
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2.5">
                <div className={cn(
                    "p-1.5 rounded-lg",
                    status === 'syncing' ? "bg-indigo-500/10 text-indigo-400" :
                        status === 'failed' ? "bg-rose-500/10 text-rose-400" :
                            "bg-emerald-500/10 text-emerald-400"
                )}>
                    {status === 'syncing' ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : status === 'failed' ? (
                        <AlertCircle className="h-3.5 w-3.5" />
                    ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                </div>

                <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-slate-200 truncate">
                        {status === 'syncing' ? 'Updating Data...' : 'Data Synced'}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {lastSyncAt ? formatDistanceToNow(lastSyncAt, { addSuffix: true, locale: id }) : 'Never'}
                    </span>
                </div>
            </div>

            {status === 'failed' && (
                <p className="mt-2 text-[9px] text-rose-400/80 leading-tight">
                    Last sync attempt failed. Data might be stale.
                </p>
            )}
        </div>
    );
}
