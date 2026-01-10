import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { backfillBusinessData } from '@/services/backfillBusiness';

const createBusinessSchema = z.object({
    name: z.string().min(1),
    ad_account_id: z.string().min(1),
    color_code: z.string().min(1),
    access_token: z.string().min(1, "Meta Access Token is required"), // Mandatory
});

export async function GET() {
    try {
        const businesses = await prisma.business.findMany({
            orderBy: { created_at: 'asc' },
            select: {
                id: true,
                name: true,
                ad_account_id: true,
                color_code: true,
                is_active: true,
                created_at: true,
                updated_at: true,
                access_token: true, // Fetch to mask
            },
        });

        // Map to secure response with masked token
        const secureBusinesses = businesses.map((b) => {
            const token = b.access_token;
            let maskedToken = null;
            if (token && token.length > 4) {
                maskedToken = '••••••••' + token.slice(-4);
            } else if (token) {
                maskedToken = '••••';
            }

            return {
                id: b.id,
                name: b.name,
                ad_account_id: b.ad_account_id,
                color_code: b.color_code,
                is_active: b.is_active,
                created_at: b.created_at,
                updated_at: b.updated_at,
                masked_token: maskedToken,
            };
        });

        return NextResponse.json(secureBusinesses);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch businesses' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const body = createBusinessSchema.parse(json);

        // Check duplication
        const existing = await prisma.business.findUnique({
            where: { ad_account_id: body.ad_account_id },
        });

        if (existing) {
            return NextResponse.json({ error: 'Ad Account ID already exists' }, { status: 400 });
        }

        const business = await prisma.business.create({
            data: {
                name: body.name,
                ad_account_id: body.ad_account_id,
                color_code: body.color_code,
                access_token: body.access_token,
                is_active: true,
            },
        });

        // Automatically backfill last 30 days of data for the new business
        // Run in background to avoid blocking the response
        backfillBusinessData(business.id, 30).catch(err => {
            console.error(`Failed to backfill data for ${business.name}:`, err);
        });

        // Return secure response
        const secureBusiness = {
            ...business,
            access_token: undefined, // Do not return raw token
            masked_token: '••••••••' + body.access_token.slice(-4),
        };

        return NextResponse.json(secureBusiness);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: err.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create business' }, { status: 500 });
    }
}
