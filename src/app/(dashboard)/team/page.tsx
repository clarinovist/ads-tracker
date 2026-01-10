"use client";

import { useEffect, useState } from "react";
import { MetricsCard } from "@/components/MetricsCard";
import {
    Users,
    ShieldCheck,
    UserPlus,
    MoreVertical,
    Mail,
    Calendar,
    Shield,
    TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function TeamPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Mock for now as we transition to real endpoint
            setUsers([
                { id: '1', name: 'System Admin', email: 'admin@example.com', role: 'ADMIN', created_at: new Date().toISOString() },
                { id: '2', name: 'Media Buyer 1', email: 'buyer1@example.com', role: 'MEDIA_BUYER', created_at: new Date().toISOString() },
                { id: '3', name: 'Viewer John', email: 'john@example.com', role: 'VIEWER', created_at: new Date().toISOString() }
            ]);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Team & Access</h2>
                    </div>
                    <p className="text-slate-500 ml-3">Manage user roles and business permissions.</p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm gap-2">
                    <UserPlus className="h-4 w-4" />
                    Invite Member
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <MetricsCard title="Total Members" value={users.length} icon={Users} />
                <MetricsCard title="Admin Users" value={users.filter(u => u.role === 'ADMIN').length} icon={ShieldCheck} iconColor="text-emerald-500" />
                <MetricsCard title="Media Buyers" value={users.filter(u => u.role === 'MEDIA_BUYER').length} icon={TrendingUp} iconColor="text-blue-500" />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold">User</th>
                                <th className="px-6 py-4 font-semibold">Role</th>
                                <th className="px-6 py-4 font-semibold">Joined Date</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400">Loading user data...</td></tr>
                            ) : users.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                                                {u.name[0]}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-900">{u.name}</span>
                                                <div className="flex items-center gap-1 text-xs text-slate-400">
                                                    <Mail className="h-3 w-3" />
                                                    {u.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ring-1 ring-inset",
                                            u.role === 'ADMIN' ? "bg-purple-50 text-purple-700 ring-purple-100" :
                                                u.role === 'MEDIA_BUYER' ? "bg-blue-50 text-blue-700 ring-blue-100" :
                                                    "bg-slate-50 text-slate-600 ring-slate-100"
                                        )}>
                                            <Shield className="h-3 w-3" />
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-slate-500">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {new Date(u.created_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>Edit Permissions</DropdownMenuItem>
                                                <DropdownMenuItem>Change Role</DropdownMenuItem>
                                                <DropdownMenuItem className="text-rose-600 focus:text-rose-600">Remove User</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
