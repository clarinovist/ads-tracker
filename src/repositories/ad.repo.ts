import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface AdUpsertData {
    id: string;
    name: string;
    status: string;
    ad_set_id: string;
    creative_url?: string | null;
    thumbnail_url?: string | null;
    creative_type?: string | null;
    creative_body?: string | null;
    creative_title?: string | null;
    creative_dynamic_data?: Prisma.InputJsonValue;
}

export class AdRepository {
    upsert(data: AdUpsertData) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...updateData } = data;

        return prisma.ad.upsert({
            where: { id: data.id },
            update: updateData,
            create: {
                id: data.id,
                ...updateData
            }
        });
    }

    async findExistingIds(ids: string[]): Promise<Set<string>> {
        const ads = await prisma.ad.findMany({
            where: { id: { in: ids } },
            select: { id: true }
        });
        return new Set(ads.map(a => a.id));
    }
}

export const adRepo = new AdRepository();
