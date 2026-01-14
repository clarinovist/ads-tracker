import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncDailyInsights } from './dataSync';
import * as meta from '@/lib/meta';

// Use vi.hoisted for variables used in vi.mock
const prismaMock = vi.hoisted(() => ({
    business: { findMany: vi.fn() },
    campaign: { upsert: vi.fn(), count: vi.fn().mockResolvedValue(1) },
    adSet: { upsert: vi.fn(), count: vi.fn().mockResolvedValue(1) },
    ad: { upsert: vi.fn(), count: vi.fn().mockResolvedValue(1) },
    hourlyStat: { upsert: vi.fn() },
    dailyInsight: { upsert: vi.fn() },
    campaignDailyInsight: { upsert: vi.fn() },
    adSetDailyInsight: { upsert: vi.fn() },
    adDailyInsight: { upsert: vi.fn() },
    $transaction: vi.fn().mockImplementation((args) => Promise.all(args)),
}));

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));

vi.mock('@/lib/meta', () => ({
    fetchInsights: vi.fn(),
    fetchCampaigns: vi.fn(),
    fetchAdSets: vi.fn(),
    fetchAds: vi.fn(),
    fetchLeads: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

describe('syncDailyInsights Performance', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        // Reset defaults
        prismaMock.campaign.count.mockResolvedValue(1);
        prismaMock.adSet.count.mockResolvedValue(1);
        prismaMock.ad.count.mockResolvedValue(1);
        prismaMock.$transaction.mockImplementation((args) => Promise.all(args));
    });

    it('benchmarks sync execution time', async () => {
        const BUSINESS_COUNT = 5;
        const DELAY_MS = 20;

        // Setup mock businesses
        const businesses = Array.from({ length: BUSINESS_COUNT }, (_, i) => ({
            id: `biz_${i}`,
            name: `Business ${i}`,
            ad_account_id: `act_${i}`,
            access_token: `token_${i}`,
            is_active: true
        }));

        // @ts-expect-error Mocking for test
        prismaMock.business.findMany.mockResolvedValue(businesses);

        // Setup delays
        const delay = () => new Promise(resolve => setTimeout(resolve, DELAY_MS));

        // @ts-expect-error Mocking for test
        meta.fetchInsights.mockImplementation(async () => { await delay(); return []; });
        // @ts-expect-error Mocking for test
        meta.fetchCampaigns.mockImplementation(async () => { await delay(); return []; });
        // @ts-expect-error Mocking for test
        meta.fetchAdSets.mockImplementation(async () => { await delay(); return []; });
        // @ts-expect-error Mocking for test
        meta.fetchAds.mockImplementation(async () => { await delay(); return []; });

        // @ts-expect-error Mocking for test
        global.fetch.mockImplementation(async () => {
            await delay();
            return {
                json: async () => ({ data: [] }),
                ok: true
            };
        });

        console.log('Starting benchmark...');
        const start = Date.now();
        await syncDailyInsights();
        const duration = Date.now() - start;
        console.log(`Benchmark Duration: ${duration}ms`);

        expect(prismaMock.business.findMany).toHaveBeenCalled();
    });
});
