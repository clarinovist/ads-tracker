import cron from 'node-cron';
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

export function initCron() {
    // Run every 6 hours: 00:00, 06:00, 12:00, 18:00
    cron.schedule('0 */6 * * *', async () => {
        console.log('⏰ running auto-sync cron (6 hour interval)');

        // Check if auto sync is enabled
        const setting = await prisma.systemSettings.findUnique({
            where: { key: 'auto_sync_enabled' }
        });

        // Default to true if not set
        const isEnabled = setting ? setting.value === 'true' : true;

        if (!isEnabled) {
            console.log('⏸️ Auto sync is disabled. Skipping sync.');
            return;
        }

        try {
            await updateSyncStatus('syncing');
            await syncDailyInsights();
            await updateSyncStatus('success');
            console.log('✅ Auto-sync completed successfully');
        } catch (error) {
            console.error('❌ Auto-sync failed:', error);
            await updateSyncStatus('failed');
        } finally {
            // After 1 minute of success/failure, set back to idle so UI doesn't stay in "Syncing" forever
            // though syncing state is mostly for the active process.
            setTimeout(async () => {
                const current = await prisma.systemSettings.findUnique({ where: { key: 'sync_status' } });
                if (current?.value !== 'syncing') {
                    await prisma.systemSettings.update({
                        where: { key: 'sync_status' },
                        data: { value: 'idle' }
                    });
                }
            }, 60000);
        }
    });
    console.log('✅ Auto-sync cron scheduled (every 6 hours)');
}
