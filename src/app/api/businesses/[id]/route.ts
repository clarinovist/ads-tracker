import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateBusinessSchema = z.object({
    name: z.string().min(1).optional(),
    color_code: z.string().min(1).optional(),
    access_token: z.string().optional().nullable(), // Allow updating token
    is_active: z.boolean().optional(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const json = await req.json();
        const body = updateBusinessSchema.parse(json);

        const business = await prisma.business.update({
            where: { id },
            data: body,
            select: {
                id: true,
                name: true,
                ad_account_id: true,
                color_code: true,
                is_active: true,
                created_at: true,
                updated_at: true,
                access_token: true,
            },
        });

        const secureBusiness = {
            id: business.id,
            name: business.name,
            ad_account_id: business.ad_account_id,
            color_code: business.color_code,
            is_active: business.is_active,
            created_at: business.created_at,
            updated_at: business.updated_at,
            has_custom_token: !!business.access_token,
        };

        return NextResponse.json(secureBusiness);
    } catch {
        return NextResponse.json({ error: 'Failed to update business' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.business.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to delete business' }, { status: 500 });
    }
}
