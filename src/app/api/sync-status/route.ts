import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const [lastSync, status] = await Promise.all([
            prisma.systemSettings.findUnique({ where: { key: 'last_sync_at' } }),
            prisma.systemSettings.findUnique({ where: { key: 'sync_status' } })
        ]);

        return NextResponse.json({
            lastSyncAt: lastSync?.value || null,
            status: status?.value || 'idle'
        });
    } catch {
        return NextResponse.json({ error: 'Failed to fetch sync status' }, { status: 500 });
    }
}
