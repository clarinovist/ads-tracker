import { describe, it, expect } from 'vitest';
import { MetricCalculator } from './metricCalculator';
import { MetaInsight } from '@/lib/meta';

describe('MetricCalculator', () => {
    it('should calculate basic metrics correctly', () => {
        const input: MetaInsight = {
            spend: '100',
            impressions: '1000',
            clicks: '50',
            actions: [{ action_type: 'lead', value: '10' }],
            action_values: [{ action_type: 'purchase', value: '500' }],
            date_start: '2023-01-01',
            date_stop: '2023-01-01',
            id: '1'
        };

        const result = MetricCalculator.parseMetrics(input);

        expect(result.spend).toBe(100);
        expect(result.impressions).toBe(1000);
        expect(result.clicks).toBe(50);
        expect(result.leads).toBe(10);

        // CTR = (50/1000)*100 = 5%
        expect(result.ctr).toBe(5);
        // CPC = 100/50 = 2
        expect(result.cpc).toBe(2);
        // CPM = (100/1000)*1000 = 100
        expect(result.cpm).toBe(100);
        // CPL = 100/10 = 10
        expect(result.cpl).toBe(10);
        // ROAS = 500/100 = 5
        expect(result.roas).toBe(5);
    });

    it('should handle zero impressions/clicks', () => {
        const input: MetaInsight = {
            spend: '0',
            impressions: '0',
            clicks: '0',
            date_start: '2023-01-01',
            date_stop: '2023-01-01',
            id: '1'
        };

        const result = MetricCalculator.parseMetrics(input);
        expect(result.ctr).toBe(0);
        expect(result.cpc).toBe(0);
    });
});
