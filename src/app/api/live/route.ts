import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchInsights } from '@/lib/meta';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const businesses = await prisma.business.findMany({
            where: { is_active: true },
        });

        if (businesses.length === 0) {
            return NextResponse.json({ global: null, businesses: [] });
        }

        const today = new Date();
        // Format YYYY-MM-DD
        const dateStr = today.toISOString().split('T')[0];

        const results = await Promise.all(businesses.map(async (b) => {
            if (!b.access_token) return null;

            try {
                // 1. Fetch Standard Insights
                const results = await fetchInsights(b.ad_account_id, dateStr, b.access_token, 'account');
                const insight = results.length > 0 ? results[0] : null;

                if (!insight) return null;

                // 2. Fetch Granular Breakdown
                // Use action_breakdowns=action_destination to see where leads are going
                const breakdownResults = await fetchInsights(b.ad_account_id, dateStr, b.access_token, 'account', undefined, 'action_destination');

                // Process Granular Leads
                let leadsWhatsApp = 0;
                let leadsInstagram = 0;
                let leadsMessenger = 0;

                if (breakdownResults.length > 0 && breakdownResults[0].actions) {
                    const leadActionTypes = [
                        'lead',
                        'onsite_conversion.lead_grouped',
                        'onsite_conversion.messaging_conversation_started_7d',
                        'messaging_conversations',
                        'onsite_conversion.total_messaging_connection'
                    ];

                    breakdownResults[0].actions.forEach(action => {
                        if (leadActionTypes.includes(action.action_type)) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const dest = (action as any).action_destination?.toLowerCase() || '';
                            const val = parseInt(action.value || '0');

                            if (dest.includes('whatsapp')) {
                                leadsWhatsApp += val;
                            } else if (dest.includes('instagram')) {
                                leadsInstagram += val;
                            } else if (dest.includes('messenger') || dest.length > 5 && !dest.includes('other')) {
                                leadsMessenger += val;
                            }
                        }
                    });
                }

                // Parse metrics similar to dataSync logic
                const spend = parseFloat(insight.spend || '0');
                const impressions = parseInt(insight.impressions || '0');
                const clicks = parseInt(insight.clicks || '0');

                // Parse total leads (use standard insight for total to be safe matches Meta dashboard)
                const leadActionTypes = [
                    'lead',
                    'onsite_conversion.lead_grouped',
                    'onsite_conversion.messaging_conversation_started_7d',
                    'messaging_conversations'
                ];
                let leads = 0;
                if (insight.actions) {
                    insight.actions.forEach(a => {
                        if (leadActionTypes.includes(a.action_type)) {
                            leads += parseInt(a.value || '0');
                        }
                    });
                }

                return {
                    id: b.id,
                    name: b.name,
                    spend,
                    impressions,
                    clicks,
                    leads,
                    leads_whatsapp: leadsWhatsApp,
                    leads_instagram: leadsInstagram,
                    leads_messenger: leadsMessenger,
                    cpc: clicks > 0 ? spend / clicks : 0,
                    cpl: leads > 0 ? spend / leads : 0,
                    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
                    cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
                };

            } catch (error) {
                console.error(`Failed to fetch live data for ${b.name}`, error);
                return null;
            }
        }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const validResults = results.filter(r => r !== null) as any[];

        // Global Aggregate
        const global = validResults.reduce((acc, curr) => ({
            spend: acc.spend + curr.spend,
            impressions: acc.impressions + curr.impressions,
            clicks: acc.clicks + curr.clicks,
            leads: acc.leads + curr.leads,
            leads_whatsapp: (acc.leads_whatsapp || 0) + (curr.leads_whatsapp || 0),
            leads_instagram: (acc.leads_instagram || 0) + (curr.leads_instagram || 0),
            leads_messenger: (acc.leads_messenger || 0) + (curr.leads_messenger || 0),
        }), { spend: 0, impressions: 0, clicks: 0, leads: 0, leads_whatsapp: 0, leads_instagram: 0, leads_messenger: 0 });

        const globalComputed = {
            ...global,
            cpc: global.clicks > 0 ? global.spend / global.clicks : 0,
            cpl: global.leads > 0 ? global.spend / global.leads : 0,
            ctr: global.impressions > 0 ? (global.clicks / global.impressions) * 100 : 0,
            cpm: global.impressions > 0 ? (global.spend / global.impressions) * 1000 : 0,
        };

        return NextResponse.json({
            global: globalComputed,
            businesses: validResults
        });

    } catch (error) {
        console.error("Live API Error:", error);
        return NextResponse.json({ error: "Failed to fetch live data" }, { status: 500 });
    }
}
