import { MetaInsight } from "@/lib/meta";

export interface CalculatedMetrics {
    spend: number;
    impressions: number;
    clicks: number;
    leads: number;
    conversions: number;
    revenue: number;
    ctr: number;
    cpm: number;
    cpc: number;
    cpl: number;
    cvr: number;
    roas: number;
}

const leadActionTypes = [
    'lead',
    'onsite_conversion.lead_grouped',
    'onsite_conversion.messaging_conversation_started_7d',
    'messaging_conversations'
];

const conversionActionTypes = [
    'purchase',
    'onsite_conversion.purchase',
    'offsite_conversion.fb_pixel_purchase',
    'omni_purchase',
];

const revenueActionTypes = [
    'purchase',
    'onsite_conversion.purchase',
    'offsite_conversion.fb_pixel_purchase',
    'omni_purchase',
];

export const MetricCalculator = {
    parseMetrics(i: MetaInsight): CalculatedMetrics {
        const spend = parseFloat(i.spend || '0');
        const impressions = parseInt(i.impressions || '0');
        const clicks = parseInt(i.clicks || '0');
        const leads = this.parseLeads(i.actions || []);

        // Advanced Metrics
        const conversions = this.parseConversions(i.actions || []);
        const revenue = this.parseRevenue(i.action_values || []);

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
    },

    parseLeads(actions: { action_type: string; value: string }[]) {
        let leads = 0;
        actions.forEach(a => {
            if (leadActionTypes.includes(a.action_type)) {
                leads += parseInt(a.value || '0');
            }
        });
        return leads;
    },

    parseConversions(actions: { action_type: string; value: string }[]) {
        let conversions = 0;
        actions.forEach(a => {
            if (conversionActionTypes.includes(a.action_type)) {
                conversions += parseInt(a.value || '0');
            }
        });
        return conversions;
    },

    parseRevenue(actionValues: { action_type: string; value: string }[]) {
        let revenue = 0;
        actionValues.forEach(av => {
            if (revenueActionTypes.includes(av.action_type)) {
                revenue += parseFloat(av.value || '0');
            }
        });
        return revenue;
    },

    parseVideoMetrics(i: MetaInsight, impressions: number) {
        const videoViews = i.actions?.find(a => a.action_type === 'video_view')?.value || '0';
        const thruPlays = i.actions?.find(a => a.action_type === 'video_thruplay')?.value || '0';

        const hook_rate = impressions > 0 ? (parseInt(videoViews) / impressions) * 100 : 0;
        const hold_rate = impressions > 0 ? (parseInt(thruPlays) / impressions) * 100 : 0;

        return { hook_rate, hold_rate };
    }
};
