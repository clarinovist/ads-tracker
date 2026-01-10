import { prisma } from '@/lib/prisma';
import BusinessList from '@/components/BusinessList';

export const dynamic = 'force-dynamic';

export default async function BusinessesPage() {
    const businesses = await prisma.business.findMany({
        orderBy: { created_at: 'asc' },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plainBusinesses = businesses.map((b: any) => {
        const token = b.access_token;
        let maskedToken = null;
        if (token && token.length > 4) {
            maskedToken = '••••••••' + token.slice(-4);
        } else if (token) {
            maskedToken = '••••';
        }

        return {
            id: b.id,
            name: b.name,
            ad_account_id: b.ad_account_id,
            color_code: b.color_code,
            is_active: b.is_active,
            created_at: b.created_at.toISOString(),
            updated_at: b.updated_at.toISOString(),
            masked_token: maskedToken,
        };
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Manage Businesses</h1>
                </div>
            </div>
            <BusinessList initialData={plainBusinesses} />
        </div>
    );
}
