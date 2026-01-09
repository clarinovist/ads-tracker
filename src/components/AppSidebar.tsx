"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    BarChart3,
    Target,
    Layers,
    Image,
    Building2,
    Users,
    Settings,
    ChevronDown,
    LogOut,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SyncButton } from "./SyncButton";
import { SyncStatusIndicator } from "./SyncStatusIndicator";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface NavItem {
    title: string;
    url: string;
    icon: React.ElementType;
    badge?: string;
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

const navGroups: NavGroup[] = [
    {
        title: "Overview",
        items: [
            {
                title: "Global Dashboard",
                url: "/",
                icon: LayoutDashboard,
            },
            {
                title: "Performance Comparison",
                url: "/comparison",
                icon: BarChart3,
            },
            {
                title: "AI Command Center",
                url: "/analyst",
                icon: Sparkles,
            },
        ],
    },
    {
        title: "Ad Level Data",
        items: [
            {
                title: "Campaigns",
                url: "/campaigns",
                icon: Target,
            },
            {
                title: "Ad Sets",
                url: "/adsets",
                icon: Layers,
            },
            {
                title: "Ads / Creatives",
                url: "/ads",
                icon: Image,
            },
        ],
    },
    {
        title: "Management",
        items: [
            {
                title: "Businesses",
                url: "/businesses",
                icon: Building2,
            },
            {
                title: "Team & Access",
                url: "/team",
                icon: Users,
            },
            {
                title: "Settings",
                url: "/settings",
                icon: Settings,
            },
        ],
    },
];

function NavGroupSection({ group }: { group: NavGroup }) {
    const pathname = usePathname();
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="mb-4">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-indigo-300/70 uppercase tracking-wider hover:text-indigo-200 transition-colors"
            >
                <span>{group.title}</span>
                <ChevronDown
                    className={cn(
                        "h-4 w-4 transition-transform",
                        isExpanded ? "rotate-0" : "-rotate-90"
                    )}
                />
            </button>

            {isExpanded && (
                <div className="space-y-1 mt-1">
                    {group.items.map((item) => {
                        const isActive = pathname === item.url;
                        return (
                            <Link
                                key={item.url}
                                href={item.url}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                                    isActive
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                                        : "text-slate-300 hover:text-white hover:bg-indigo-500/20"
                                )}
                            >
                                <item.icon className="h-4 w-4 shrink-0" />
                                <span>{item.title}</span>
                                {item.badge && (
                                    <span className="ml-auto text-xs bg-indigo-400 text-white px-2 py-0.5 rounded-full">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export function AppSidebar() {
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await fetch("/api/auth/logout", {
                method: "POST",
            });
            router.push("/login");
            router.refresh();
        } catch (error) {
            console.error("Logout failed", error);
            setIsLoggingOut(false);
        }
    };

    return (
        <div className="h-full w-64 bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-900 text-white flex flex-col border-r border-indigo-900/50">
            {/* Header */}
            <div className="p-6 border-b border-indigo-800/30">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30">
                        <BarChart3 className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-white">
                            Ads Tracker
                        </h1>
                        <p className="text-xs text-indigo-300/60">Performance Platform</p>
                    </div>
                </div>
            </div>

            {/* Navigation Groups */}
            <nav className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-800/50 scrollbar-track-transparent hover:scrollbar-thumb-indigo-700/50">
                {navGroups.map((group) => (
                    <NavGroupSection key={group.title} group={group} />
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-indigo-800/30 flex flex-col gap-3">
                <SyncStatusIndicator />
                <SyncButton />
                <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-indigo-500/20 rounded-xl transition-all w-full"
                >
                    <LogOut className="h-4 w-4" />
                    <span>{isLoggingOut ? "Logging out..." : "Log Out"}</span>
                </button>
                <div className="text-center pt-2 border-t border-indigo-800/20">
                    <p className="text-xs text-indigo-300/50">v2.0.0 - Platform Edition</p>
                </div>
            </div>
        </div>
    );
}
