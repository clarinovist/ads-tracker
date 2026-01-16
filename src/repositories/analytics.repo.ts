import { prisma } from "@/lib/prisma";
import { CalculatedMetrics } from "@/services/analytics/metricCalculator";

export interface DailyInsightData extends CalculatedMetrics {
    reach: number;
    frequency: number;
    hook_rate: number;
    hold_rate: number;
    leads_whatsapp: number;
    leads_instagram: number;
    leads_messenger: number;
}

export interface EntityInsightData extends CalculatedMetrics {
    leads_whatsapp: number;
    leads_instagram: number;
    leads_messenger: number;
}

export interface HourlyStatData {
    business_id: string;
    date: Date;
    hour: number;
    spend: number;
    impressions: number;
    clicks: number;
    messaging_conversations: number;
}

export class AnalyticsRepository {
    upsertDailyInsight(businessId: string, date: Date, data: DailyInsightData) {
        return prisma.dailyInsight.upsert({
            where: { business_id_date: { business_id: businessId, date } },
            update: { ...data },
            create: {
                business_id: businessId,
                date,
                ...data
            }
        });
    }

    upsertCampaignInsight(campaignId: string, date: Date, data: EntityInsightData) {
        return prisma.campaignDailyInsight.upsert({
            where: { campaign_id_date: { campaign_id: campaignId, date } },
            update: { ...data },
            create: {
                campaign_id: campaignId,
                date,
                ...data
            }
        });
    }

    upsertAdSetInsight(adSetId: string, date: Date, data: EntityInsightData) {
        return prisma.adSetDailyInsight.upsert({
            where: { ad_set_id_date: { ad_set_id: adSetId, date } },
            update: { ...data },
            create: {
                ad_set_id: adSetId,
                date,
                ...data
            }
        });
    }

    upsertAdInsight(adId: string, date: Date, data: EntityInsightData) {
        return prisma.adDailyInsight.upsert({
            where: { ad_id_date: { ad_id: adId, date } },
            update: { ...data },
            create: {
                ad_id: adId,
                date,
                ...data
            }
        });
    }

    upsertHourlyStat(data: HourlyStatData) {
        return prisma.hourlyStat.upsert({
            where: {
                business_id_date_hour: {
                    business_id: data.business_id,
                    date: data.date,
                    hour: data.hour
                }
            },
            update: {
                spend: data.spend,
                impressions: data.impressions,
                clicks: data.clicks,
                messaging_conversations: data.messaging_conversations
            },
            create: {
                ...data
            }
        });
    }
}

export const analyticsRepo = new AnalyticsRepository();
