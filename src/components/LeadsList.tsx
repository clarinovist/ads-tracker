"use client";

import { useState } from 'react';
import { format } from 'date-fns';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Download,
    Filter,
    MoreHorizontal,
    User,
    Mail,
    Calendar,
    Megaphone,
    Inbox
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu";

// Define the Lead type based on what we get from Prisma
type Lead = {
    id: string;
    created_time: string | Date;
    full_name: string | null;
    email: string | null;
    phone_number: string | null;
    ad_name: string | null;
    ad_set_name: string | null;
    campaign_name: string | null;
    status: string;
};

const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'JUNK'];

function StatusBadge({ status }: { status: string }) {
    const variants: Record<string, string> = {
        'NEW': 'bg-blue-100 text-blue-700 border-blue-200',
        'CONTACTED': 'bg-amber-100 text-amber-700 border-amber-200',
        'QUALIFIED': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'CONVERTED': 'bg-purple-100 text-purple-700 border-purple-200',
        'JUNK': 'bg-slate-100 text-slate-500 border-slate-200',
    };

    const className = variants[status] || 'bg-slate-100 text-slate-700 border-slate-200';

    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${className}`}>
            {status}
        </span>
    );
}

function Avatar({ name }: { name: string | null }) {
    const initials = name
        ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : '??';

    // Generate a consistent color based on the name
    const colors = [
        'bg-red-100 text-red-600',
        'bg-orange-100 text-orange-600',
        'bg-amber-100 text-amber-600',
        'bg-green-100 text-green-600',
        'bg-emerald-100 text-emerald-600',
        'bg-teal-100 text-teal-600',
        'bg-cyan-100 text-cyan-600',
        'bg-sky-100 text-sky-600',
        'bg-blue-100 text-blue-600',
        'bg-indigo-100 text-indigo-600',
        'bg-violet-100 text-violet-600',
        'bg-purple-100 text-purple-600',
        'bg-fuchsia-100 text-fuchsia-600',
        'bg-pink-100 text-pink-600',
        'bg-rose-100 text-rose-600',
    ];

    const charCode = (name || '').charCodeAt(0) || 0;
    const colorClass = colors[charCode % colors.length];

    return (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${colorClass}`}>
            {initials}
        </div>
    );
}

export default function LeadsList({ initialData }: { initialData: Lead[] }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const filteredData = initialData.filter(lead => {
        const matchesSearch =
            (lead.full_name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
            (lead.email?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
            (lead.ad_name?.toLowerCase().includes(search.toLowerCase()) ?? false);

        const matchesStatus = statusFilter ? lead.status === statusFilter : true;

        return matchesSearch && matchesStatus;
    });

    const handleExport = () => {
        // Simple CSV Export
        const headers = ["Date", "Name", "Email", "Phone", "Ad Name", "Status"];
        const rows = filteredData.map(l => [
            format(new Date(l.created_time), 'yyyy-MM-dd HH:mm'),
            l.full_name || '',
            l.email || '',
            l.phone_number || '',
            l.ad_name || '',
            l.status
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `leads_export_${format(new Date(), 'yyyyMMdd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search leads by name, email..."
                        className="pl-9 h-10 border-slate-200 bg-slate-50 focus:bg-white transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-10 border-slate-200 hover:bg-slate-50 text-slate-600 gap-2 flex-1 sm:flex-none">
                                <Filter className="h-4 w-4" />
                                {statusFilter ? statusFilter : 'All Status'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                                All Statuses
                            </DropdownMenuItem>
                            {LEAD_STATUSES.map(status => (
                                <DropdownMenuItem key={status} onClick={() => setStatusFilter(status)}>
                                    {status}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant="outline"
                        className="h-10 border-slate-200 hover:bg-slate-50 text-slate-600 gap-2 flex-1 sm:flex-none"
                        onClick={handleExport}
                        disabled={filteredData.length === 0}
                    >
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Main Table Content */}
            <div className="bg-white border boundary-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-50 rounded-lg">
                            <User className="h-4 w-4 text-indigo-600" />
                        </div>
                        <h3 className="font-semibold text-slate-800">Leads List</h3>
                        <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600">
                            {filteredData.length}
                        </Badge>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead className="w-[200px] text-slate-500 font-medium">Name</TableHead>
                                <TableHead className="text-slate-500 font-medium">Status</TableHead>
                                <TableHead className="text-slate-500 font-medium hidden md:table-cell">Contact Info</TableHead>
                                <TableHead className="text-slate-500 font-medium hidden lg:table-cell">Attribution</TableHead>
                                <TableHead className="text-slate-500 font-medium text-right">Date</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                                            <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-2">
                                                <Inbox className="h-8 w-8 text-slate-300" />
                                            </div>
                                            <p className="font-medium text-lg text-slate-600">No leads found</p>
                                            <p className="text-sm">
                                                {search || statusFilter ? "Try adjusting your filters." : "We haven't received any leads yet."}
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredData.map((lead) => (
                                    <TableRow key={lead.id} className="hover:bg-indigo-50/30 group transition-colors border-slate-100">
                                        <TableCell>
                                            <Avatar name={lead.full_name} />
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-semibold text-slate-900">{lead.full_name || 'Anonymous User'}</div>
                                            <div className="text-xs text-slate-500 md:hidden">{lead.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={lead.status} />
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex flex-col gap-1">
                                                {lead.email && (
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                                        <Mail className="h-3 w-3" />
                                                        {lead.email}
                                                    </div>
                                                )}
                                                {lead.phone_number && (
                                                    <div className="text-xs text-slate-400 pl-4.5">
                                                        {lead.phone_number}
                                                    </div>
                                                )}
                                                {!lead.email && !lead.phone_number && (
                                                    <span className="text-xs text-slate-400 italic">No contact info</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100 w-fit">
                                                <Megaphone className="h-3 w-3 text-slate-400" />
                                                <span className="truncate max-w-[150px]" title={lead.ad_name || ''}>
                                                    {lead.ad_name || 'Organic / Unknown'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1.5 text-xs font-medium text-slate-500">
                                                <Calendar className="h-3 w-3" />
                                                {format(new Date(lead.created_time), 'MMM dd, HH:mm')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                                    <DropdownMenuItem>Edit Status</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-rose-600">Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer / Pagination Placeholder */}
                {filteredData.length > 0 && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/30">
                        <p className="text-xs text-slate-400 text-center">
                            Showing {filteredData.length} leads
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
