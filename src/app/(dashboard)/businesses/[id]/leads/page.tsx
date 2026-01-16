import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ArrowLeft } from "lucide-react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import LeadsList from '@/components/LeadsList';

export const dynamic = 'force-dynamic';

export default async function BusinessLeadsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    // 1. Fetch Business
    const business = await prisma.business.findUnique({
        where: { id },
    });

    if (!business) {
        notFound();
    }

    // 2. Fetch Leads (Strictly by business_id)
    const leads = await prisma.lead.findMany({
        where: { business_id: id },
        orderBy: { created_time: 'desc' },
    });

    // Transform leads to match Lead type in LeadsList
    const formattedLeads = leads.map(lead => ({
        id: lead.id,
        created_time: lead.created_time,
        full_name: lead.full_name,
        email: lead.email,
        phone_number: lead.phone_number,
        ad_name: lead.ad_name,
        ad_set_name: null, // Not directly linked in schema currently
        campaign_name: null, // Not directly linked in schema currently
        status: lead.status
    }));

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-slate-500 mb-2 text-sm">
                    <Link href="/businesses" className="hover:text-indigo-600 transition-colors">
                        Businesses
                    </Link>
                    <span>/</span>
                    <Link href={`/businesses/${id}/analytics`} className="hover:text-indigo-600 transition-colors">
                        {business.name}
                    </Link>
                    <span>/</span>
                    <span className="text-slate-900 font-medium">Leads</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" asChild className="h-10 w-10 border-slate-200 bg-white hover:bg-slate-50 shadow-sm shrink-0 rounded-xl">
                            <Link href={`/businesses/${id}/analytics`}>
                                <ArrowLeft className="h-5 w-5 text-slate-600" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                                Leads Manager
                            </h1>
                            <p className="text-slate-500 text-sm md:text-base">
                                Manage and track your incoming leads from {business.name}.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* List Component */}
            <LeadsList initialData={formattedLeads} />
        </div>
    );
}
