import { Suspense } from 'react';
import AgentView from '@/components/analyst/AgentView';

export const metadata = {
    title: 'Data Analyst Agent | Ads Tracker',
    description: 'AI-powered campaign analysis',
};

export default function AnalystPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <Suspense fallback={<div className="p-4">Loading analyst...</div>}>
                <AgentView />
            </Suspense>
        </div>
    );
}
