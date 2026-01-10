import { prisma } from "@/lib/prisma";
import {
    fetchInsights,
    fetchCampaigns,
    fetchAdSets,
    fetchAds,
    MetaInsight,
    MetaCampaign,
    MetaAdSet,
    MetaAd
} from "@/lib/meta";
import { startOfDay, format } from "date-fns";

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
        throw error; // Re-throw to let the caller know it failed
    }
}

export async function syncBusinessData(business: any, date: Date) {
    console.log(`Processing Business: ${business.name} (${business.ad_account_id})`);

    if (!business.access_token) {
        console.warn(`⚠️ Skipping ${business.name}: No access token found.`);
        return;
    }

    const token = business.access_token;
    const adAccountId = business.ad_account_id;

    // Ensure strict normalization to midnight (Local -> UTC conversion handled by date-fns startOfDay relative to local execution context? 
    // Actually, safest is to trust the passed date logic, but usually we want to strip time.
    // startOfDay returns a Date with time 00:00:00 in LOCAL time.
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

    for (const camp of campaigns) {
        console.log(`     -> Syncing Campaign: ${camp.name} (${camp.id}) status: ${camp.effective_status || camp.status}`);
        await prisma.campaign.upsert({
            where: { id: camp.id },
            update: { name: camp.name, objective: camp.objective, status: camp.effective_status || camp.status, business_id: businessId },
            create: { id: camp.id, name: camp.name, objective: camp.objective, status: camp.effective_status || camp.status, business_id: businessId }
        });
    }

    const insights = await fetchInsights(adAccountId, dateStr, token, 'campaign');
    const breakdownStats = await fetchBreakdownStats(adAccountId, dateStr, token, 'campaign');
    console.log(`   Fetched ${insights.length} campaign insights`);

    for (const insight of insights) {
        if (!insight.campaign_id) {
            console.log(`   ⚠️ Insight has no campaign_id, skipping.`);
            continue;
        }

        // Verify campaign exists in DB
        const exists = await prisma.campaign.count({ where: { id: insight.campaign_id } });
        if (!exists) continue; // Skip insights for campaigns we couldn't fetch info for (e.g. archived long ago but showing metrics?)

        await upsertCampaignInsight(insight.campaign_id, insight, normalizedDate, breakdownStats[insight.campaign_id]);
    }
}

async function syncAdSets(businessId: string, adAccountId: string, dateStr: string, token: string, normalizedDate: Date) {
    const adSets = await fetchAdSets(adAccountId, token);
    console.log(`   Fetched ${adSets.length} ad sets`);

    for (const adSet of adSets) {
        // Ensure campaign exists. If not, we might fail FK constraints. 
        // We should have synced campaigns already.
        const campaignExists = await prisma.campaign.count({ where: { id: adSet.campaign_id } });
        if (!campaignExists) continue;

        await prisma.adSet.upsert({
            where: { id: adSet.id },
            update: { name: adSet.name, status: adSet.effective_status || adSet.status, campaign_id: adSet.campaign_id },
            create: { id: adSet.id, name: adSet.name, status: adSet.effective_status || adSet.status, campaign_id: adSet.campaign_id }
        });
    }

    const insights = await fetchInsights(adAccountId, dateStr, token, 'adset');
    const breakdownStats = await fetchBreakdownStats(adAccountId, dateStr, token, 'adset');
    for (const insight of insights) {
        if (!insight.adset_id) continue;
        const exists = await prisma.adSet.count({ where: { id: insight.adset_id } });
        if (!exists) continue;
        await upsertAdSetInsight(insight.adset_id, insight, normalizedDate, breakdownStats[insight.adset_id]);
    }
}

async function syncAds(businessId: string, adAccountId: string, dateStr: string, token: string, normalizedDate: Date) {
    const ads = await fetchAds(adAccountId, token);
    console.log(`   Fetched ${ads.length} ads`);

    for (const ad of ads) {
        const adSetExists = await prisma.adSet.count({ where: { id: ad.adset_id } });
        if (!adSetExists) continue;

        // Extract creative data
        let creativeUrl = null;
        let thumbnailUrl = null;
        let creativeType = ad.creative?.object_type || null;

        let creativeBody = null;
        let creativeTitle = null;

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
                // We cast to any because Prisma expects a simpler Json type but this is a complex object
                (ad as any).creative_dynamic_data = ad.creative.asset_feed_spec;
            }
        }

        await prisma.ad.upsert({
            where: { id: ad.id },
            update: {
                name: ad.name,
                status: ad.effective_status || ad.status,
                ad_set_id: ad.adset_id,
                creative_url: creativeUrl,
                thumbnail_url: thumbnailUrl,
                creative_type: creativeType,
                creative_body: creativeBody,
                creative_title: creativeTitle,
                creative_dynamic_data: (ad as any).creative_dynamic_data || null
            },
            create: {
                id: ad.id,
                name: ad.name,
                status: ad.effective_status || ad.status,
                ad_set_id: ad.adset_id,
                creative_url: creativeUrl,
                thumbnail_url: thumbnailUrl,
                creative_type: creativeType,
                creative_body: creativeBody,
                creative_title: creativeTitle,
                creative_dynamic_data: (ad as any).creative_dynamic_data || null
            }
        });
    }

    const insights = await fetchInsights(adAccountId, dateStr, token, 'ad');
    const breakdownStats = await fetchBreakdownStats(adAccountId, dateStr, token, 'ad');
    for (const insight of insights) {
        if (!insight.ad_id) continue;
        const exists = await prisma.ad.count({ where: { id: insight.ad_id } });
        if (!exists) continue;
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

                    return prisma.hourlyStat.upsert({
                        where: {
                            business_id_date_hour: {
                                business_id: businessId,
                                date: new Date(record.date_start),
                                hour: hour
                            }
                        },
                        create: {
                            business_id: businessId,
                            date: new Date(record.date_start),
                            hour: hour,
                            spend, impressions, clicks, messaging_conversations: messagingConversations
                        },
                        update: {
                            spend, impressions, clicks, messaging_conversations: messagingConversations
                        }
                    });
                })
            );
            console.log(`   ✅ Synced ${records.length} hourly records.`);
        } else {
            console.log(`   ℹ️ No hourly records found.`);
        }
    } catch (err: any) {
        console.error(`   ❌ Failed to sync hourly stats:`, err.message);
    }
}


// --- Helper Functions for Metrics Calculation & Upsert ---

function parseMetrics(i: MetaInsight) {
    const spend = parseFloat(i.spend || '0');
    const impressions = parseInt(i.impressions || '0');
    const clicks = parseInt(i.clicks || '0');
    const leads = parseLeads(i.actions || []);

    // Advanced Metrics
    const conversions = parseConversions(i.actions || []);
    const revenue = parseRevenue(i.action_values || []);

    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;
    const cpl = leads > 0 ? spend / leads : 0;
    const cvr = clicks > 0 ? (conversions / clicks) * 100 : 0;
    const roas = spend > 0 ? revenue / spend : 0;

    return {
        spend,
        impressions,
        clicks,
        leads,
        conversions,
        revenue,
        ctr,
        cpm,
        cpc,
        cpl,
        cvr,
        roas
    };
}

function parseLeads(actions: { action_type: string; value: string }[]) {
    const leadActionTypes = [
        'lead',
        'onsite_conversion.lead_grouped',
        'onsite_conversion.messaging_conversation_started_7d',
        'messaging_conversations'
    ];
    let leads = 0;
    actions.forEach(a => {
        if (leadActionTypes.includes(a.action_type)) {
            leads += parseInt(a.value || '0');
        }
    });
    return leads;
}

function parseConversions(actions: { action_type: string; value: string }[]) {
    const conversionActionTypes = [
        'purchase',
        'onsite_conversion.purchase',
        'offsite_conversion.fb_pixel_purchase',
        'omni_purchase',
    ];
    let conversions = 0;
    actions.forEach(a => {
        if (conversionActionTypes.includes(a.action_type)) {
            conversions += parseInt(a.value || '0');
        }
    });
    return conversions;
}

function parseRevenue(actionValues: { action_type: string; value: string }[]) {
    const revenueActionTypes = [
        'purchase',
        'onsite_conversion.purchase',
        'offsite_conversion.fb_pixel_purchase',
        'omni_purchase',
    ];
    let revenue = 0;
    actionValues.forEach(av => {
        if (revenueActionTypes.includes(av.action_type)) {
            revenue += parseFloat(av.value || '0');
        }
    });
    return revenue;
}

async function upsertDailyInsight(businessId: string, i: MetaInsight, date: Date, breakdowns?: { whatsapp: number, instagram: number, messenger: number }) {
    const m = parseMetrics(i);
    const reach = parseInt(i.reach || '0');
    const frequency = parseFloat(i.frequency || '0');

    // Video Metrics logic
    const videoViews = i.actions?.find(a => a.action_type === 'video_view')?.value || '0';
    const thruPlays = i.actions?.find(a => a.action_type === 'video_thruplay')?.value || '0';
    const hook_rate = m.impressions > 0 ? (parseInt(videoViews) / m.impressions) * 100 : 0;
    const hold_rate = m.impressions > 0 ? (parseInt(thruPlays) / m.impressions) * 100 : 0;

    // Breakdown data
    const b = breakdowns || { whatsapp: 0, instagram: 0, messenger: 0 };

    await prisma.dailyInsight.upsert({
        where: { business_id_date: { business_id: businessId, date } },
        update: {
            ...m, reach, frequency, hook_rate, hold_rate,
            leads_whatsapp: b.whatsapp,
            leads_instagram: b.instagram,
            leads_messenger: b.messenger
        },
        create: {
            ...m, business_id: businessId, date, reach, frequency, hook_rate, hold_rate,
            leads_whatsapp: b.whatsapp,
            leads_instagram: b.instagram,
            leads_messenger: b.messenger
        }
    });
}

async function upsertCampaignInsight(campaignId: string, i: MetaInsight, date: Date, breakdowns?: { whatsapp: number, instagram: number, messenger: number }) {
    const m = parseMetrics(i);
    const b = breakdowns || { whatsapp: 0, instagram: 0, messenger: 0 };
    await prisma.campaignDailyInsight.upsert({
        where: { campaign_id_date: { campaign_id: campaignId, date } },
        update: {
            ...m,
            leads_whatsapp: b.whatsapp,
            leads_instagram: b.instagram,
            leads_messenger: b.messenger
        },
        create: {
            ...m, campaign_id: campaignId, date,
            leads_whatsapp: b.whatsapp,
            leads_instagram: b.instagram,
            leads_messenger: b.messenger
        }
    });
}

async function upsertAdSetInsight(adSetId: string, i: MetaInsight, date: Date, breakdowns?: { whatsapp: number, instagram: number, messenger: number }) {
    const m = parseMetrics(i);
    const b = breakdowns || { whatsapp: 0, instagram: 0, messenger: 0 };
    await prisma.adSetDailyInsight.upsert({
        where: { ad_set_id_date: { ad_set_id: adSetId, date } },
        update: {
            ...m,
            leads_whatsapp: b.whatsapp,
            leads_instagram: b.instagram,
            leads_messenger: b.messenger
        },
        create: {
            ...m, ad_set_id: adSetId, date,
            leads_whatsapp: b.whatsapp,
            leads_instagram: b.instagram,
            leads_messenger: b.messenger
        }
    });
}

async function upsertAdInsight(adId: string, i: MetaInsight, date: Date, breakdowns?: { whatsapp: number, instagram: number, messenger: number }) {
    const m = parseMetrics(i);
    const b = breakdowns || { whatsapp: 0, instagram: 0, messenger: 0 };
    await prisma.adDailyInsight.upsert({
        where: { ad_id_date: { ad_id: adId, date } },
        update: {
            ...m,
            leads_whatsapp: b.whatsapp,
            leads_instagram: b.instagram,
            leads_messenger: b.messenger
        },
        create: {
            ...m, ad_id: adId, date,
            leads_whatsapp: b.whatsapp,
            leads_instagram: b.instagram,
            leads_messenger: b.messenger
        }
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
                    const dest = (action as any).action_destination?.toLowerCase() || '';
                    const val = parseInt(action.value || '0');

                    if (dest.includes('whatsapp')) {
                        stats[id].whatsapp += val;
                    } else if (dest.includes('instagram')) {
                        stats[id].instagram += val;
                    } else if (dest.includes('messenger') || dest.includes(item.campaign_id!) || dest.length > 5 && !dest.includes('other')) {
                        // Fallback: If destination matches page name or looks like an ID/Name and not explicit other channel, assume Messenger?
                        // Actually, explicit 'facebook' or 'messenger' is better. 
                        // But commonly Page Name appears for Messenger.
                        // Let's assume non-WA non-IG is Messenger for now if it's a messaging metric.
                        stats[id].messenger += val;
                    }
                }
            }
        }
    }
    return stats;
}
