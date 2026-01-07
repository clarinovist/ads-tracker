import { ENV } from './env';

export interface MetaInsight {
    spend: string;
    impressions: string;
    clicks: string;
    reach: string;
    frequency: string;
    cpc?: string;
    cpm?: string;
    cpp?: string;
    ctr?: string;
    actions?: { action_type: string; value: string }[];
    action_values?: { action_type: string; value: string }[]; // Revenue tracking
    date_start: string;
    date_stop: string;
    // ID fields for granular levels
    campaign_id?: string;
    adset_id?: string;
    ad_id?: string;
}

export interface MetaCampaign {
    id: string;
    name: string;
    objective?: string;
    status: string;
    effective_status?: string;
}

export interface MetaAdSet {
    id: string;
    campaign_id: string;
    name: string;
    status: string;
    effective_status?: string;
}

export interface MetaAd {
    id: string;
    adset_id: string;
    name: string;
    status: string;
    effective_status?: string;
    creative?: {
        id: string;
        thumbnail_url?: string;
        image_url?: string;
        video_id?: string;
        object_type?: string;
        body?: string;
        title?: string;
        object_story_spec?: {
            link_data?: {
                name?: string;
                message?: string;
                picture?: string;
                link?: string;
            };
            video_data?: {
                title?: string;
                message?: string;
            };
        };
        asset_feed_spec?: {
            bodies?: Array<{ text: string }>;
            titles?: Array<{ text: string }>;
            descriptions?: Array<{ text: string }>;
        };
    };
}

const COMMON_FIELDS = [
    'spend',
    'impressions',
    'clicks',
    'reach',
    'frequency',
    'actions',
    'action_values',
    'cpc',
    'cpm',
    'cpp',
    'ctr',
].join(',');

export async function fetchAdAccountInsights(
    adAccountId: string,
    date: string, // YYYY-MM-DD
    accessToken: string
): Promise<MetaInsight | null> {
    // Legacy support or just wrapper around generic
    const results = await fetchInsights(adAccountId, date, accessToken, 'account');
    return results.length > 0 ? results[0] : null;
}

export async function fetchInsights(
    adAccountId: string,
    date: string,
    accessToken: string,
    level: 'account' | 'campaign' | 'adset' | 'ad',
    breakdowns?: string,
    actionBreakdowns?: string
): Promise<MetaInsight[]> {
    const timeRange = encodeURIComponent(JSON.stringify({ since: date, until: date }));
    let url = `https://graph.facebook.com/v19.0/${adAccountId}/insights?time_range=${timeRange}&fields=${COMMON_FIELDS},campaign_id,adset_id,ad_id&access_token=${accessToken}&level=${level}&limit=50`;

    if (breakdowns) {
        url += `&breakdowns=${breakdowns}`;
    }

    if (actionBreakdowns) {
        url += `&action_breakdowns=${actionBreakdowns}`;
    }

    return await fetchMetaList<MetaInsight>(url);
}

export async function fetchCampaigns(adAccountId: string, accessToken: string): Promise<MetaCampaign[]> {
    // effective_status filter to include deleted/archived
    const url = `https://graph.facebook.com/v19.0/${adAccountId}/campaigns?fields=id,name,objective,status,effective_status&effective_status=['ACTIVE','PAUSED']&access_token=${accessToken}&limit=100`;
    return await fetchMetaList<MetaCampaign>(url);
}

export async function fetchAdSets(adAccountId: string, accessToken: string): Promise<MetaAdSet[]> {
    const url = `https://graph.facebook.com/v19.0/${adAccountId}/adsets?fields=id,name,campaign_id,status,effective_status&effective_status=['ACTIVE','PAUSED']&access_token=${accessToken}&limit=100`;
    return await fetchMetaList<MetaAdSet>(url);
}

export async function fetchAds(adAccountId: string, accessToken: string): Promise<MetaAd[]> {
    const url = `https://graph.facebook.com/v19.0/${adAccountId}/ads?fields=id,name,adset_id,status,effective_status,creative{id,thumbnail_url,image_url,video_id,object_type,body,title,object_story_spec,asset_feed_spec}&effective_status=['ACTIVE','PAUSED']&access_token=${accessToken}&limit=100`;
    return await fetchMetaList<MetaAd>(url);
}

// Helper to handle pagination if needed, or simple fetch
async function fetchMetaList<T>(url: string): Promise<T[]> {
    let results: T[] = [];
    let nextUrl: string | null = url;

    while (nextUrl) {
        try {
            const response: Response = await fetch(nextUrl, { cache: 'no-store' });
            if (!response.ok) {
                const errorData = await response.json();
                console.error(`Meta API Error:`, errorData);
                throw new Error(`Meta API Error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            if (data.data) {
                results = results.concat(data.data);
            }
            nextUrl = data.paging?.next || null;
        } catch (error) {
            console.error("Failed to fetch meta list", error);
            throw error;
        }
    }
    return results;
}
