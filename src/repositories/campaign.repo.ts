import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class CampaignRepository {
    upsert(data: {
        id: string;
        name: string;
        objective?: string;
        status: string;
        business_id: string;
    }) {
        return prisma.campaign.upsert({
            where: { id: data.id },
            update: {
                name: data.name,
                objective: data.objective,
                status: data.status,
                business_id: data.business_id
            },
            create: {
                id: data.id,
                name: data.name,
                objective: data.objective,
                status: data.status,
                business_id: data.business_id
            }
        });
    }

    async findExistingIds(ids: string[]): Promise<Set<string>> {
        const campaigns = await prisma.campaign.findMany({
            where: { id: { in: ids } },
            select: { id: true }
        });
        return new Set(campaigns.map(c => c.id));
    }
}

export const campaignRepo = new CampaignRepository();
