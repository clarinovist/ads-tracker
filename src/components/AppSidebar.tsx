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
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SyncButton } from "./SyncButton";
import { useState } from "react";

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
                title: "AI Analyst",
                url: "/analyst",
                icon: Sparkles,
                badge: "New",
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
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors"
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
                                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all",
                                    isActive
                                        ? "bg-slate-800 text-white shadow-sm"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                )}
                            >
                                <item.icon className="h-4 w-4 shrink-0" />
                                <span>{item.title}</span>
                                {item.badge && (
                                    <span className="ml-auto text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
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
    return (
        <div className="h-screen w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800">
            {/* Header */}
            <div className="p-6 border-b border-slate-800">
                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Ad Operations
                </h1>
                <p className="text-xs text-slate-500 mt-1">Performance Platform</p>
            </div>

            {/* Navigation Groups */}
            <nav className="flex-1 p-4 overflow-y-auto">
                {navGroups.map((group) => (
                    <NavGroupSection key={group.title} group={group} />
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 flex flex-col gap-4">
                <SyncButton />
                <div className="text-center">
                    <p className="text-xs text-slate-500">v2.0.0 - Platform Edition</p>
                </div>
            </div>
        </div>
    );
}
