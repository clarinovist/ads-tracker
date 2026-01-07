import { NextResponse } from 'next/server';
import { syncDailyInsights } from '@/services/dataSync';

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date'); // YYYY-MM-DD
    const mode = searchParams.get('mode'); // 'smart' for 30-day lookback

    try {
        if (mode === 'smart') {
            const DAYS_TO_SYNC = 30;
            const today = new Date();
            console.log(`Triggering Smart Sync (Last ${DAYS_TO_SYNC} days)...`);

            // We can't await this loop if we want to return a quick response (timeout issues).
            // But for a cronjob, waiting is fine. Vercel has timeout limits, but VPS doesn't usually.
            // Let's await it to be safe.
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
            return NextResponse.json({ success: true, message: `Smart Sync completed (${DAYS_TO_SYNC} days)` });

        } else {
            console.log(`Triggering manual sync for ${dateParam || 'today'}...`);
            let targetDate: Date | undefined = undefined;
            if (dateParam) {
                const [y, m, d] = dateParam.split('-').map(Number);
                targetDate = new Date(y, m - 1, d);
            }
            await syncDailyInsights(targetDate);
            return NextResponse.json({ success: true, message: `Sync completed for ${dateParam || 'today'}` });
        }

    } catch (error) {
        console.error("Sync API Error:", error);
        return NextResponse.json({ success: false, error: 'Sync failed' }, { status: 500 });
    }
}
