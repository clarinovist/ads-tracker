import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
    fetchInsights,
    fetchCampaigns,
    fetchAdSets,
    fetchAds,
    MetaInsight,
} from "@/lib/meta";
import { startOfDay, format } from "date-fns";
import { campaignRepo } from "@/repositories/campaign.repo";
import { adSetRepo } from "@/repositories/adSet.repo";
import { adRepo, AdUpsertData } from "@/repositories/ad.repo";
import { analyticsRepo } from "@/repositories/analytics.repo";
import { MetricCalculator } from "@/services/analytics/metricCalculator";

interface HourlyInsight {
    spend: string;
    impressions: string;
    clicks: string;
    actions?: Array<{ action_type: string; value: string }>;
    date_start: string;
    hourly_stats_aggregated_by_advertiser_time_zone: string;
}

export async function syncDailyInsights(targetDate?: Date) {
    console.log("🔄 Starting Daily Sync Service...");

    try {
        const businesses = await prisma.business.findMany({
            where: { is_active: true },
        });

        if (businesses.length === 0) {
            console.log("⚠️ No active businesses found.");
            return;
        }

        const dateToSync = targetDate || new Date();
        const dateStr = format(dateToSync, 'yyyy-MM-dd'); // YYYY-MM-DD
        const normalizedDate = startOfDay(dateToSync);

        console.log(`📅 Syncing data for: ${dateStr}`);

        for (const business of businesses) {
            try {
                await syncBusinessData(business, normalizedDate);
            } catch (err) {
                console.error(`❌ Failed to sync business ${business.name}:`, err);
            }
        }

        console.log("🎉 Daily Sync Completed.");

    } catch (error) {
        console.error("❌ Critical Error in Sync Service:", error);
        throw error;
    }
}

export async function syncBusinessData(business: { id: string; name: string; ad_account_id: string; access_token?: string | null }, date: Date) {
    console.log(`Processing Business: ${business.name} (${business.ad_account_id})`);

    if (!business.access_token) {
        console.warn(`⚠️ Skipping ${business.name}: No access token found.`);
        return;
    }

    const token = business.access_token;
    const adAccountId = business.ad_account_id;
    const normalizedDate = startOfDay(date);
    const dateStr = format(normalizedDate, 'yyyy-MM-dd');

    // 1. Sync Account Insights
    await syncAccountInsights(business.id, adAccountId, dateStr, token, normalizedDate);

    // 2. Sync Campaigns & Insights
    await syncCampaigns(business.id, adAccountId, dateStr, token, normalizedDate);

    // 3. Sync AdSets & Insights
    await syncAdSets(business.id, adAccountId, dateStr, token, normalizedDate);

    // 4. Sync Ads & Insights
    await syncAds(business.id, adAccountId, dateStr, token, normalizedDate);

    // 5. Sync Hourly Insights (Messaging)
    await syncHourlyInsights(business.id, adAccountId, dateStr, token);

    console.log(`✅ Synced ${business.name} successfully.`);
}

async function syncAccountInsights(businessId: string, adAccountId: string, dateStr: string, token: string, normalizedDate: Date) {
    const insights = await fetchInsights(adAccountId, dateStr, token, 'account');
    const breakdownStats = await fetchBreakdownStats(adAccountId, dateStr, token, 'account');
    if (insights.length > 0) {
        await upsertDailyInsight(businessId, insights[0], normalizedDate, breakdownStats['account']);
    }
}

async function syncCampaigns(businessId: string, adAccountId: string, dateStr: string, token: string, normalizedDate: Date) {
    const campaigns = await fetchCampaigns(adAccountId, token);
    console.log(`   Fetched ${campaigns.length} campaigns`);

    const CHUNK_SIZE = 20;
    for (let i = 0; i < campaigns.length; i += CHUNK_SIZE) {
        const chunk = campaigns.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map(camp => {
            console.log(`     -> Syncing Campaign: ${camp.name} (${camp.id}) status: ${camp.effective_status || camp.status}`);
            return campaignRepo.upsert({
                id: camp.id,
                name: camp.name,
                objective: camp.objective,
                status: camp.effective_status || camp.status,
                business_id: businessId
            });
        }));
    }

    const insights = await fetchInsights(adAccountId, dateStr, token, 'campaign');
    const breakdownStats = await fetchBreakdownStats(adAccountId, dateStr, token, 'campaign');
    console.log(`   Fetched ${insights.length} campaign insights`);

    // Bulk check for existing campaigns to avoid N+1 queries
    const campaignIds = insights
        .map(i => i.campaign_id)
        .filter((id): id is string => !!id);

    const existingCampaignIds = await campaignRepo.findExistingIds(campaignIds);

    for (const insight of insights) {
        if (!insight.campaign_id) {
            console.log(`   ⚠️ Insight has no campaign_id, skipping.`);
            continue;
        }

        // Verify campaign exists in DB using the pre-fetched Set
        if (!existingCampaignIds.has(insight.campaign_id)) continue;

        await upsertCampaignInsight(insight.campaign_id, insight, normalizedDate, breakdownStats[insight.campaign_id]);
    }
}

async function syncAdSets(businessId: string, adAccountId: string, dateStr: string, token: string, normalizedDate: Date) {
    const adSets = await fetchAdSets(adAccountId, token);
    console.log(`   Fetched ${adSets.length} ad sets`);

    // Bulk check campaigns
    const campaignIds = Array.from(new Set(adSets.map(a => a.campaign_id)));
    const existingCampaignIds = await campaignRepo.findExistingIds(campaignIds);

    const validAdSets = adSets.filter(adSet => existingCampaignIds.has(adSet.campaign_id));

    await Promise.all(validAdSets.map(adSet =>
        adSetRepo.upsert({
            id: adSet.id,
            name: adSet.name,
            status: adSet.effective_status || adSet.status,
            campaign_id: adSet.campaign_id
        })
    ));

    const insights = await fetchInsights(adAccountId, dateStr, token, 'adset');
    const breakdownStats = await fetchBreakdownStats(adAccountId, dateStr, token, 'adset');

    // Optimization: Batch fetch existing ad set IDs to avoid N+1 queries
    const adSetIds = insights
        .map(i => i.adset_id)
        .filter((id): id is string => !!id);

    const existingAdSetIds = await adSetRepo.findExistingIds(adSetIds);

    for (const insight of insights) {
        if (!insight.adset_id) continue;
        if (!existingAdSetIds.has(insight.adset_id)) continue;
        await upsertAdSetInsight(insight.adset_id, insight, normalizedDate, breakdownStats[insight.adset_id]);
    }
}

async function syncAds(businessId: string, adAccountId: string, dateStr: string, token: string, normalizedDate: Date) {
    const ads = await fetchAds(adAccountId, token);
    console.log(`   Fetched ${ads.length} ads`);

    for (const ad of ads) {
        const adSetExists = await adSetRepo.exists(ad.adset_id);
        if (!adSetExists) continue;

        // Extract creative data
        let creativeUrl = null;
        let thumbnailUrl = null;
        let creativeType = ad.creative?.object_type || null;

        let creativeBody = null;
        let creativeTitle = null;

        let creativeDynamicData: Prisma.InputJsonValue | undefined = undefined;

        if (ad.creative) {
            // Default to image_url or thumbnail_url for static content
            creativeUrl = ad.creative.image_url || ad.creative.thumbnail_url || null;

            if (ad.creative.video_id) {
                creativeType = 'VIDEO';
                thumbnailUrl = ad.creative.thumbnail_url || null;
                creativeUrl = `https://www.facebook.com/video.php?v=${ad.creative.video_id}`;
            }

            // Extract Body (Caption)
            creativeBody = ad.creative.body ||
                ad.creative.object_story_spec?.link_data?.message ||
                ad.creative.object_story_spec?.video_data?.message ||
                ad.creative.asset_feed_spec?.bodies?.[0]?.text || null;

            // Extract Title (Headline)
            creativeTitle = ad.creative.title ||
                ad.creative.object_story_spec?.link_data?.name ||
                ad.creative.object_story_spec?.video_data?.title ||
                ad.creative.asset_feed_spec?.titles?.[0]?.text || null;

            if (ad.creative.asset_feed_spec) {
                // Store the full dynamic data
                creativeDynamicData = ad.creative.asset_feed_spec as unknown as Prisma.InputJsonValue;
            }
        }

        const adData: AdUpsertData = {
            id: ad.id,
            name: ad.name,
            status: ad.effective_status || ad.status,
            ad_set_id: ad.adset_id,
            creative_url: creativeUrl,
            creative_title: creativeTitle,
            creative_body: creativeBody,
            creative_type: creativeType,
            thumbnail_url: thumbnailUrl,
            creative_dynamic_data: creativeDynamicData
        };

        await adRepo.upsert(adData);
    }

    const insights = await fetchInsights(adAccountId, dateStr, token, 'ad');
    const breakdownStats = await fetchBreakdownStats(adAccountId, dateStr, token, 'ad');

    const adIds = insights.map(i => i.ad_id).filter((id): id is string => !!id);
    const uniqueAdIds = Array.from(new Set(adIds));

    let existingAdIds = new Set<string>();
    if (uniqueAdIds.length > 0) {
        existingAdIds = await adRepo.findExistingIds(uniqueAdIds);
    }

    for (const insight of insights) {
        if (!insight.ad_id) continue;
        if (!existingAdIds.has(insight.ad_id)) continue;
        await upsertAdInsight(insight.ad_id, insight, normalizedDate, breakdownStats[insight.ad_id]);
    }
}

async function syncHourlyInsights(businessId: string, adAccountId: string, dateStr: string, token: string) {
    console.log(`   Syncing Hourly Insights for ${dateStr}...`);

    const range = JSON.stringify({ since: dateStr, until: dateStr });
    const url = `https://graph.facebook.com/v19.0/${adAccountId}/insights?` +
        `time_range=${range}&` +
        `level=account&` +
        `fields=spend,impressions,clicks,actions&` +
        `breakdowns=hourly_stats_aggregated_by_advertiser_time_zone&` +
        `access_token=${token}&limit=24`;

    try {
        const res = await fetch(url, { cache: 'no-store' });
        const data = await res.json();

        if (data.error) {
            console.error(`   ❌ Error syncing hourly for ${dateStr}:`, data.error.message);
            return;
        }

        const records: HourlyInsight[] = data.data || [];
        if (records.length > 0) {
            await prisma.$transaction(
                records.map(record => {
                    const hourStr = record.hourly_stats_aggregated_by_advertiser_time_zone.split(':')[0];
                    const hour = parseInt(hourStr, 10);
                    const spend = parseFloat(record.spend || '0');
                    const impressions = parseInt(record.impressions || '0', 10);
                    const clicks = parseInt(record.clicks || '0', 10);

                    const messagingAction = record.actions?.find(a =>
                        a.action_type === 'onsite_conversion.messaging_welcome_message_view'
                    );
                    const messagingConversations = parseInt(messagingAction?.value || '0', 10);

                    return analyticsRepo.upsertHourlyStat({
                        business_id: businessId,
                        date: new Date(record.date_start),
                        hour: hour,
                        spend,
                        impressions,
                        clicks,
                        messaging_conversations: messagingConversations
                    });
                })
            );
            console.log(`   ✅ Synced ${records.length} hourly records.`);
        } else {
            console.log(`   ℹ️ No hourly records found.`);
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`   ❌ Failed to sync hourly stats:`, message);
    }
}


// --- Helper Functions Upsert using Repo ---

async function upsertDailyInsight(businessId: string, i: MetaInsight, date: Date, breakdowns?: { whatsapp: number, instagram: number, messenger: number }) {
    const m = MetricCalculator.parseMetrics(i);
    const reach = parseInt(i.reach || '0');
    const frequency = parseFloat(i.frequency || '0');

    const { hook_rate, hold_rate } = MetricCalculator.parseVideoMetrics(i, m.impressions);

    // Breakdown data
    const b = breakdowns || { whatsapp: 0, instagram: 0, messenger: 0 };

    await analyticsRepo.upsertDailyInsight(businessId, date, {
        ...m,
        reach,
        frequency,
        hook_rate,
        hold_rate,
        leads_whatsapp: b.whatsapp,
        leads_instagram: b.instagram,
        leads_messenger: b.messenger
    });
}

async function upsertCampaignInsight(campaignId: string, i: MetaInsight, date: Date, breakdowns?: { whatsapp: number, instagram: number, messenger: number }) {
    const m = MetricCalculator.parseMetrics(i);
    const b = breakdowns || { whatsapp: 0, instagram: 0, messenger: 0 };
    await analyticsRepo.upsertCampaignInsight(campaignId, date, {
        ...m,
        leads_whatsapp: b.whatsapp,
        leads_instagram: b.instagram,
        leads_messenger: b.messenger
    });
}

async function upsertAdSetInsight(adSetId: string, i: MetaInsight, date: Date, breakdowns?: { whatsapp: number, instagram: number, messenger: number }) {
    const m = MetricCalculator.parseMetrics(i);
    const b = breakdowns || { whatsapp: 0, instagram: 0, messenger: 0 };
    await analyticsRepo.upsertAdSetInsight(adSetId, date, {
        ...m,
        leads_whatsapp: b.whatsapp,
        leads_instagram: b.instagram,
        leads_messenger: b.messenger
    });
}

async function upsertAdInsight(adId: string, i: MetaInsight, date: Date, breakdowns?: { whatsapp: number, instagram: number, messenger: number }) {
    const m = MetricCalculator.parseMetrics(i);
    const b = breakdowns || { whatsapp: 0, instagram: 0, messenger: 0 };
    await analyticsRepo.upsertAdInsight(adId, date, {
        ...m,
        leads_whatsapp: b.whatsapp,
        leads_instagram: b.instagram,
        leads_messenger: b.messenger
    });
}

async function fetchBreakdownStats(
    adAccountId: string,
    dateStr: string,
    token: string,
    level: 'account' | 'campaign' | 'adset' | 'ad'
) {
    // We use action_breakdowns=action_destination to see the destination of actions within the actions list
    // Pass undefined for 'breakdowns' (arg 5), and 'action_destination' for 'actionBreakdowns' (arg 6)
    const insights = await fetchInsights(adAccountId, dateStr, token, level, undefined, 'action_destination');
    const stats: Record<string, { whatsapp: number, instagram: number, messenger: number }> = {};

    for (const item of insights) {
        // Determine ID based on level
        let id: string | undefined;
        if (level === 'account') id = 'account';
        else if (level === 'campaign') id = item.campaign_id;
        else if (level === 'adset') id = item.adset_id;
        else if (level === 'ad') id = item.ad_id;

        if (!id) continue;

        if (!stats[id]) stats[id] = { whatsapp: 0, instagram: 0, messenger: 0 };

        if (item.actions) {
            // Iterate actions to find lead actions and check their destination
            const leadActionTypes = [
                'lead',
                'onsite_conversion.lead_grouped',
                'onsite_conversion.messaging_conversation_started_7d',
                'messaging_conversations',
                'onsite_conversion.total_messaging_connection'
            ];

            for (const action of item.actions) {
                if (leadActionTypes.includes(action.action_type)) {
                    // This action object should have action_destination because we requested it
                    const actionData = action as { action_destination?: string; value?: string };
                    const dest = actionData.action_destination?.toLowerCase() || '';
                    const val = parseInt(actionData.value || '0');

                    if (dest.includes('whatsapp')) {
                        stats[id].whatsapp += val;
                    } else if (dest.includes('instagram')) {
                        stats[id].instagram += val;
                    } else if (dest.includes('messenger') || dest.includes(item.campaign_id!) || dest.length > 5 && !dest.includes('other')) {
                        stats[id].messenger += val;
                    }
                }
            }
        }
    }
    return stats;
}
