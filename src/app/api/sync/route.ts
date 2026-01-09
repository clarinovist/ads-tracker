import { NextResponse } from 'next/server';
import { syncDailyInsights } from '@/services/dataSync';
import { prisma } from '@/lib/prisma';

async function updateSyncStatus(status: 'idle' | 'syncing' | 'success' | 'failed') {
    await prisma.systemSettings.upsert({
        where: { key: 'sync_status' },
        update: { value: status },
        create: { key: 'sync_status', value: status }
    });

    if (status === 'success') {
        await prisma.systemSettings.upsert({
            where: { key: 'last_sync_at' },
            update: { value: new Date().toISOString() },
            create: { key: 'last_sync_at', value: new Date().toISOString() }
        });
    }
}

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date'); // YYYY-MM-DD
    const mode = searchParams.get('mode'); // 'smart' for 30-day lookback

    try {
        await updateSyncStatus('syncing');

        if (mode === 'smart') {
            const DAYS_TO_SYNC = 7;
            const today = new Date();
            console.log(`Triggering Smart Sync (Last ${DAYS_TO_SYNC} days)...`);

            for (let i = 0; i < DAYS_TO_SYNC; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                try {
                    console.log(`  Syncing: ${date.toISOString().split('T')[0]}`);
                    await syncDailyInsights(date);
                } catch (e) {
                    console.error(`  Failed sync for ${date.toISOString()}`, e);
                }
            }
            await updateSyncStatus('success');
            return NextResponse.json({ success: true, message: `Smart Sync completed (${DAYS_TO_SYNC} days)` });

        } else {
            console.log(`Triggering manual sync for ${dateParam || 'today'}...`);
            let targetDate: Date | undefined = undefined;
            if (dateParam) {
                const [y, m, d] = dateParam.split('-').map(Number);
                targetDate = new Date(y, m - 1, d);
            }
            await syncDailyInsights(targetDate);
            await updateSyncStatus('success');
            return NextResponse.json({ success: true, message: `Sync completed for ${dateParam || 'today'}` });
        }

    } catch (error) {
        console.error("Sync API Error:", error);
        await updateSyncStatus('failed');
        return NextResponse.json({ success: false, error: 'Sync failed' }, { status: 500 });
    } finally {
        // Set back to idle after a short delay
        setTimeout(async () => {
            const current = await prisma.systemSettings.findUnique({ where: { key: 'sync_status' } });
            if (current?.value !== 'syncing') {
                await prisma.systemSettings.update({
                    where: { key: 'sync_status' },
                    data: { value: 'idle' }
                });
            }
        }, 10000); // 10s is enough for manual sync feedback
    }
}
