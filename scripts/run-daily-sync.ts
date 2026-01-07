
import fs from 'fs';
import path from 'path';

// Manually load .env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach((line) => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
            if (key && !key.startsWith('#')) {
                process.env[key] = value;
            }
        }
    });
}

async function run() {
    console.log('🚀 Loading environment and starting Smart Sync (Last 30 Days)...');
    const { syncDailyInsights } = await import('../src/services/dataSync');

    // Sync last 30 days to catch late attributions and ensure data continuity
    const DAYS_TO_SYNC = 30;
    const today = new Date();

    console.log(`📅 Starting sync for the last ${DAYS_TO_SYNC} days...`);

    for (let i = 0; i < DAYS_TO_SYNC; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Add retry/delay logic if needed, but for now simple sequential is safer for rate limits
        try {
            console.log(`⏳ [${i + 1}/${DAYS_TO_SYNC}] Syncing: ${date.toISOString().split('T')[0]}`);
            await syncDailyInsights(date);
            // Small pause to be gentle on API
            await new Promise(r => setTimeout(r, 1000));
        } catch (error) {
            console.error(`❌ Failed processing ${date.toISOString()}:`, error);
        }
    }

    console.log('🎉 Smart Sync Completed!');
}

run();
