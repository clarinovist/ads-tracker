import { describe, it, vi, beforeEach } from 'vitest';
import { syncAds } from './dataSync';
import * as metaLib from '@/lib/meta';
import { prisma } from '@/lib/prisma';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    adSet: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    ad: {
      upsert: vi.fn(),
      count: vi.fn(),
      createMany: vi.fn(),
    },
    adDailyInsight: {
      upsert: vi.fn(),
    }
  },
}));

vi.mock('@/lib/meta', () => ({
  fetchAds: vi.fn(),
  fetchInsights: vi.fn(),
  fetchBreakdownStats: vi.fn(),
}));

describe('syncAds Benchmark', () => {
  const NUM_ADS = 100; // Adjust if needed
  const MOCK_ADS = Array.from({ length: NUM_ADS }, (_, i) => ({
    id: `ad_${i}`,
    adset_id: `adset_${i % 10}`, // 10 ad sets
    name: `Ad ${i}`,
    status: 'ACTIVE',
    creative: {
      object_type: 'IMAGE',
      image_url: 'http://example.com/image.jpg',
    },
  }));

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock fetchAds
    vi.spyOn(metaLib, 'fetchAds').mockResolvedValue(MOCK_ADS as unknown as metaLib.MetaAd[]);

    // Mock fetchInsights (return empty to focus on ad upsert loop)
    vi.spyOn(metaLib, 'fetchInsights').mockResolvedValue([]);
  });

  it('measures execution time of syncAds', async () => {
    // Simulate DB latency
    const DB_LATENCY_MS = 2; // small latency per query
    const UPSERT_LATENCY_MS = 5;

    // Mock prisma.adSet.count (Unoptimized path)
    vi.mocked(prisma.adSet.count).mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, DB_LATENCY_MS));
      return 1; // Always exists
    });

    // Mock prisma.adSet.findMany (Optimized path)
    vi.mocked(prisma.adSet.findMany).mockImplementation(async (args: any) => {
        await new Promise((r) => setTimeout(r, DB_LATENCY_MS));
        // Return all adsets requested
        if (args?.where?.id?.in) {
            return args.where.id.in.map((id: string) => ({ id })) as any;
        }
        return [] as any;
    });

    // Mock prisma.ad.upsert
    vi.mocked(prisma.ad.upsert).mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, UPSERT_LATENCY_MS));
      return {} as any;
    });

    console.time('syncAds_Duration');
    const start = performance.now();

    await syncAds('biz_1', 'act_1', '2023-01-01', 'token', new Date());

    const end = performance.now();
    const duration = end - start;
    console.timeEnd('syncAds_Duration');

    console.log(`\nExecution Time: ${duration.toFixed(2)} ms`);
    console.log(`Number of Ads: ${NUM_ADS}`);
  });
});
