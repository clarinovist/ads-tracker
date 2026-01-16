import { NextResponse } from 'next/server';
import { syncDailyInsights } from '@/services/dataSync';
import { prisma } from '@/lib/prisma';
import { fetchAds, fetchLeads } from '@/lib/meta';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function updateSyncStatus(status: 'idle' | 'syncing' | 'success' | 'failed') {
    await prisma.systemSettings.upsert({
        where: { key: 'sync_status' },
        update: { value: status },
        create: { key: 'sync_status', value: status }
    });

    if (status === 'success') {
        await prisma.systemSettings.upsert({
            where: { key: 'last_sync_at' },
            update: { value: new Date().toISOString() },
            create: { key: 'last_sync_at', value: new Date().toISOString() }
        });
    }
}

/**
 * Helper to extract specific field values from Meta's lead field_data array
 */
function extractFieldValue(fieldData: Array<{ name: string; values: string[] }> | undefined, keys: string[]): string | null {
    if (!fieldData || !Array.isArray(fieldData)) return null;

    for (const key of keys) {
        const found = fieldData.find(f => f.name.toLowerCase() === key.toLowerCase());
        if (found && found.values && found.values[0]) return found.values[0];
    }

    for (const key of keys) {
        const found = fieldData.find(f => f.name.toLowerCase().includes(key.toLowerCase()));
        if (found && found.values && found.values[0]) return found.values[0];
    }

    return null;
}

/**
 * Unified Smart Sync: Syncs insights (7 days) + leads in one operation
 */
export async function POST() {
    const DAYS_TO_SYNC = 7;
    const today = new Date();

    try {
        await updateSyncStatus('syncing');
        console.log(`[SmartSync] Starting unified sync...`);

        // 1. Sync Insights (last 7 days)
        console.log(`[SmartSync] Phase 1: Syncing insights for last ${DAYS_TO_SYNC} days...`);
        // We sync these sequentially or in small batches to avoid immediate rate limits
        for (let i = 0; i < DAYS_TO_SYNC; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            try {
                console.log(`  Syncing insights for: ${date.toISOString().split('T')[0]}`);
                await syncDailyInsights(date);
                // Mini sleep between dates
                await sleep(500);
            } catch (e: any) {
                console.error(`  Failed sync for ${date.toISOString().split('T')[0]}:`, e.message);
                if (e.message?.includes('User request limit reached')) {
                    console.warn('  Rate limit hit during insights. Waiting 2s...');
                    await sleep(2000);
                }
            }
        }

        // 2. Sync Leads for all active businesses
        console.log(`[SmartSync] Phase 2: Syncing leads...`);
        const businesses = await prisma.business.findMany({
            where: { is_active: true, access_token: { not: null } }
        });

        let totalLeadsSynced = 0;

        for (const business of businesses) {
            if (!business.access_token) continue;

            try {
                const ads = await fetchAds(business.ad_account_id, business.access_token);
                console.log(`  Found ${ads.length} ads for ${business.name}. Fetching leads...`);

                // To avoid rate limits, we process ads for leads with throttling
                // Batch of 5 ads at a time
                for (let i = 0; i < ads.length; i += 5) {
                    const chunk = ads.slice(i, i + 5);

                    await Promise.all(chunk.map(async (ad) => {
                        try {
                            const leads = await fetchLeads(ad.id, business.access_token!);

                            if (leads.length > 0) {
                                await prisma.$transaction(
                                    leads.map(lead => {
                                        const email = extractFieldValue(lead.field_data, ['email']);
                                        const fullName = extractFieldValue(lead.field_data, ['full_name', 'first_name', 'last_name', 'name']);
                                        const phone = extractFieldValue(lead.field_data, ['phone_number', 'phone', 'mobile']);

                                        return prisma.lead.upsert({
                                            where: { id: lead.id },
                                            create: {
                                                id: lead.id,
                                                created_time: new Date(lead.created_time),
                                                ad_id: lead.ad_id,
                                                ad_name: lead.ad_name,
                                                business_id: business.id,
                                                email,
                                                full_name: fullName,
                                                phone_number: phone,
                                                raw_data: lead.field_data as any
                                            },
                                            update: {
                                                ad_name: lead.ad_name,
                                                created_time: new Date(lead.created_time),
                                                email,
                                                full_name: fullName,
                                                phone_number: phone,
                                                raw_data: lead.field_data as any
                                            }
                                        });
                                    })
                                );
                                totalLeadsSynced += leads.length;
                            }
                        } catch (err: any) {
                            // If it's a permission error, we should probably warn specifically
                            if (err.message?.includes('leads_retrieval') || err.message?.includes('pages_manage_ads')) {
                                console.warn(`    Permission missing for ad ${ad.id} (Leads)`);
                            } else if (err.message?.includes('User request limit reached')) {
                                console.warn(`    Rate limit hit for ad ${ad.id} (Leads)`);
                            } else {
                                console.error(`    Failed to sync leads for ad ${ad.id}:`, err.message);
                            }
                        }
                    }));

                    // Throttle between batches
                    if (i + 5 < ads.length) {
                        await sleep(1000);
                    }
                }
            } catch (err: any) {
                console.error(`  Failed to sync business ${business.name}:`, err.message);
            }
        }

        await updateSyncStatus('success');
        console.log(`[SmartSync] Completed! Insights: ${DAYS_TO_SYNC} days, Leads: ${totalLeadsSynced}`);

        return NextResponse.json({
            success: true,
            message: 'Smart Sync completed',
            insights: { days: DAYS_TO_SYNC },
            leads: { count: totalLeadsSynced }
        });

    } catch (error: any) {
        console.error("[SmartSync] Critical Error:", error.message);
        await updateSyncStatus('failed');
        return NextResponse.json({ success: false, error: 'Sync failed: ' + error.message }, { status: 500 });
    } finally {
        setTimeout(async () => {
            const current = await prisma.systemSettings.findUnique({ where: { key: 'sync_status' } });
            if (current?.value !== 'syncing') {
                await prisma.systemSettings.update({
                    where: { key: 'sync_status' },
                    data: { value: 'idle' }
                });
            }
        }, 10000);
    }
}
