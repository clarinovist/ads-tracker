import { prisma } from "@/lib/prisma";
import { fetchAdAccountInsights } from "@/lib/meta";
import { startOfDay } from "date-fns";

/**
 * Backfill historical data for a specific business
 * @param businessId - The UUID of the business
 * @param daysBack - Number of days to backfill (default: 30)
 * @returns Object with success status and stats
 */
export async function backfillBusinessData(businessId: string, daysBack: number = 30) {
    console.log(`🔄 Backfilling ${daysBack} days for business ${businessId}...`);

    const business = await prisma.business.findUnique({
        where: { id: businessId },
    });

    if (!business) {
        throw new Error(`Business with ID ${businessId} not found`);
    }

    const today = new Date();
    const dates: Date[] = [];

    // Generate array of dates to fetch
    for (let i = 1; i <= daysBack; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dates.push(date);
    }

    let totalSynced = 0;
    let totalFailed = 0;

    console.log(`🏢 Processing Business: ${business.name} (${business.ad_account_id})`);

    const CONCURRENCY = 5;
    const executing = new Set<Promise<void>>();

    for (const date of dates) {
        const worker = async () => {
            const dateStr = date.toISOString().split('T')[0];

            // Normalize to start of day (midnight) to prevent duplicates
            const normalizedDate = startOfDay(new Date(dateStr));

            if (!business.access_token) {
                console.warn(`  ⚠️ Skipping ${dateStr}: No access token found.`);
                totalFailed++;
                return;
            }

            try {
                const insights = await fetchAdAccountInsights(
                    business.ad_account_id,
                    dateStr,
                    business.access_token
                );

                if (!insights) {
                    console.warn(`  ⚠️ No insights found for ${dateStr}`);
                    totalFailed++;
                    return;
                }

                const spend = parseFloat(insights.spend || '0');
                const impressions = parseInt(insights.impressions || '0');
                const clicks = parseInt(insights.clicks || '0');
                const reach = parseInt(insights.reach || '0');
                const frequency = parseFloat(insights.frequency || '0');

                const actions = insights.actions || [];

                // Check for multiple lead action types
                const leadActionTypes = [
                    'lead',
                    'onsite_conversion.lead_grouped',
                    'onsite_conversion.messaging_conversation_started_7d',
                    'messaging_conversations'
                ];

                let leads = 0;
                leadActionTypes.forEach(actionType => {
                    const action = actions.find(a => a.action_type === actionType);
                    if (action) {
                        leads += parseInt(action.value || '0');
                    }
                });

                const videoViews = actions.find(a => a.action_type === 'video_view')?.value || '0';
                const thruPlays = actions.find(a => a.action_type === 'video_thruplay')?.value || '0';

                const hookRate = impressions > 0 ? (parseInt(videoViews) / impressions) * 100 : 0;
                const holdRate = impressions > 0 ? (parseInt(thruPlays) / impressions) * 100 : 0;

                const cpc = clicks > 0 ? spend / clicks : 0;
                const cpl = leads > 0 ? spend / leads : 0;

                await prisma.dailyInsight.upsert({
                    where: {
                        business_id_date: {
                            business_id: business.id,
                            date: normalizedDate,
                        },
                    },
                    update: {
                        spend,
                        impressions,
                        clicks,
                        reach,
                        frequency,
                        leads,
                        hook_rate: hookRate,
                        hold_rate: holdRate,
                        cpc,
                        cpl,
                    },
                    create: {
                        business_id: business.id,
                        date: normalizedDate,
                        spend,
                        impressions,
                        clicks,
                        reach,
                        frequency,
                        leads,
                        hook_rate: hookRate,
                        hold_rate: holdRate,
                        cpc,
                        cpl,
                    },
                });

                console.log(`  ✅ Synced ${dateStr} (Spend: ${spend}, Impressions: ${impressions})`);
                totalSynced++;

            } catch (err) {
                console.error(`  ❌ Failed to sync ${dateStr}:`, err);
                totalFailed++;
            }
        };

        const p = worker().then(() => { executing.delete(p); });
        executing.add(p);

        if (executing.size >= CONCURRENCY) {
            await Promise.race(executing);
        }
    }

    await Promise.all(executing);

    console.log(`✅ Completed backfill for ${business.name}: ${totalSynced} synced, ${totalFailed} failed`);

    return {
        success: true,
        businessName: business.name,
        synced: totalSynced,
        failed: totalFailed,
    };
}
