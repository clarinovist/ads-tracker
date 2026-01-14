import { performance } from 'perf_hooks';

// Mock Data
const NUM_INSIGHTS = 1000;
const EXISTENCE_RATE = 0.9; // 90% of campaigns exist
const DB_LATENCY_MS = 2; // Simulated DB roundtrip time

interface Insight {
    campaign_id: string;
    data: string;
}

// Generate mock insights
const insights: Insight[] = Array.from({ length: NUM_INSIGHTS }).map((_, i) => ({
    campaign_id: `campaign_${i}`,
    data: `some_data_${i}`
}));

// Mock DB (Set of existing IDs)
const existingCampaignIds = new Set<string>();
for (let i = 0; i < NUM_INSIGHTS; i++) {
    if (Math.random() < EXISTENCE_RATE) {
        existingCampaignIds.add(`campaign_${i}`);
    }
}

// Helper to simulate delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Prisma
const prisma = {
    campaign: {
        count: async ({ where }: { where: { id: string } }) => {
            await delay(DB_LATENCY_MS);
            return existingCampaignIds.has(where.id) ? 1 : 0;
        },
        findMany: async ({ where }: { where: { id: { in: string[] } } }) => {
            await delay(DB_LATENCY_MS); // One query
            const ids = where.id.in;
            const found = ids.filter(id => existingCampaignIds.has(id));
            return found.map(id => ({ id }));
        }
    }
};

async function baseline() {
    const start = performance.now();
    let processed = 0;

    for (const insight of insights) {
        if (!insight.campaign_id) continue;

        // Verify campaign exists in DB (N+1 Query)
        const exists = await prisma.campaign.count({ where: { id: insight.campaign_id } });
        if (!exists) continue;

        // Simulate upsert (not part of the N+1 read bottleneck, but let's add a tiny cost or just ignore)
        // In the real code: await upsertCampaignInsight(...)
        processed++;
    }

    const end = performance.now();
    return { time: end - start, processed };
}

async function optimized() {
    const start = performance.now();
    let processed = 0;

    // Optimized: Bulk fetch
    const campaignIds = insights
        .map(i => i.campaign_id)
        .filter((id): id is string => !!id);

    // In real code, we might want to chunk this if there are too many IDs, but for 1000 it's fine.
    // fetch existing IDs
    const existingCampaigns = await prisma.campaign.findMany({
        where: { id: { in: campaignIds } }
    });

    const existingSet = new Set(existingCampaigns.map(c => c.id));

    for (const insight of insights) {
        if (!insight.campaign_id) continue;

        if (!existingSet.has(insight.campaign_id)) continue;

        // Simulate upsert
        processed++;
    }

    const end = performance.now();
    return { time: end - start, processed };
}

async function runBenchmark() {
    console.log(`⚡ Benchmarking Sync Optimization`);
    console.log(`   Items: ${NUM_INSIGHTS}`);
    console.log(`   Simulated DB Latency: ${DB_LATENCY_MS}ms`);
    console.log(`   Existence Rate: ${EXISTENCE_RATE * 100}%`);
    console.log('------------------------------------------------');

    console.log('Running Baseline (N+1 queries)...');
    const resBaseline = await baseline();
    console.log(`   Time: ${resBaseline.time.toFixed(2)}ms`);
    console.log(`   Processed: ${resBaseline.processed}`);

    console.log('\nRunning Optimized (1 query)...');
    const resOptimized = await optimized();
    console.log(`   Time: ${resOptimized.time.toFixed(2)}ms`);
    console.log(`   Processed: ${resOptimized.processed}`);

    const improvement = resBaseline.time / resOptimized.time;
    console.log('------------------------------------------------');
    console.log(`🚀 Improvement: ${improvement.toFixed(2)}x faster`);
}

runBenchmark();
