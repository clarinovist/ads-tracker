import { prisma } from "@/lib/prisma";

export class AdSetRepository {
    upsert(data: {
        id: string;
        name: string;
        status: string;
        campaign_id: string;
    }) {
        return prisma.adSet.upsert({
            where: { id: data.id },
            update: {
                name: data.name,
                status: data.status,
                campaign_id: data.campaign_id
            },
            create: {
                id: data.id,
                name: data.name,
                status: data.status,
                campaign_id: data.campaign_id
            }
        });
    }

    async findExistingIds(ids: string[]): Promise<Set<string>> {
        const adSets = await prisma.adSet.findMany({
            where: { id: { in: ids } },
            select: { id: true }
        });
        return new Set(adSets.map(a => a.id));
    }

    async exists(id: string): Promise<boolean> {
        const count = await prisma.adSet.count({ where: { id } });
        return count > 0;
    }
}

export const adSetRepo = new AdSetRepository();
