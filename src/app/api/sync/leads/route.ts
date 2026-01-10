
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchAds, fetchLeads } from '@/lib/meta';

// Force dynamic since we might use current time etc.
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes timeout for heavy sync

export async function POST(req: Request) {
    try {
        const { businessId } = await req.json().catch(() => ({}));

        // 1. Get Businesses to sync
        const businesses = await prisma.business.findMany({
            where: {
                is_active: true,
                ...(businessId ? { id: businessId } : {}),
                access_token: { not: null } // Must have token
            }
        });

        if (businesses.length === 0) {
            return NextResponse.json({ message: 'No active businesses with tokens found.' });
        }

        let totalLeadsSynced = 0;
        const results = [];

        // 2. Iterate Businesses
        for (const business of businesses) {
            if (!business.access_token) continue;

            try {
                // Fetch active ads for this business
                // Note: fetchAds gets ads from ad account. We assume business.ad_account_id exists.
                const ads = await fetchAds(business.ad_account_id, business.access_token);

                let businessLeadsCount = 0;

                // 3. Iterate Ads to get Leads
                // Parallelize ad fetching with limit
                const adsChunks = chunkArray(ads, 5); // Process 5 ads at a time to avoid rate limits

                for (const chunk of adsChunks) {
                    await Promise.all(chunk.map(async (ad) => {
                        try {
                            const leads = await fetchLeads(ad.id, business.access_token!);

                            if (leads.length > 0) {
                                // 4. Upsert Leads to DB
                                // We use transaction or Promise.all for speed
                                await prisma.$transaction(
                                    leads.map(lead =>
                                        prisma.lead.upsert({
                                            where: { id: lead.id },
                                            create: {
                                                id: lead.id,
                                                created_time: new Date(lead.created_time),
                                                ad_id: lead.ad_id,
                                                ad_name: lead.ad_name,
                                                business_id: business.id
                                            },
                                            update: {
                                                // Update fields if they might change (usually they don't, maybe ad name)
                                                ad_name: lead.ad_name,
                                                created_time: new Date(lead.created_time)
                                            }
                                        })
                                    )
                                );
                                businessLeadsCount += leads.length;
                            }
                        } catch (err) {
                            console.error(`Failed to sync leads for ad ${ad.id}:`, err);
                        }
                    }));
                }

                results.push({ business: business.name, leads: businessLeadsCount });
                totalLeadsSynced += businessLeadsCount;

            } catch (err) {
                console.error(`Failed to sync business ${business.name}:`, err);
                results.push({ business: business.name, error: String(err) });
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Sync complete',
            totalLeads: totalLeadsSynced,
            details: results
        });

    } catch (error: unknown) {
        console.error('Sync Leads Error:', error);
        const msg = error instanceof Error ? error.message : 'Sync failed';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

// Helper utility
function chunkArray<T>(array: T[], size: number): T[][] {
    const chunked = [];
    for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size));
    }
    return chunked;
}
