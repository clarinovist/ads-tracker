
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { from, to, prompt: userPrompt, provider = 'gemini', modelName, language = 'id' } = await req.json();

        console.log('--- Analyze Call ---');
        console.log('From:', from, 'To:', to);
        console.log('Provider:', provider, 'Model:', modelName, 'Language:', language);

        if (!from || !to) {
            return NextResponse.json({ error: 'Date range is required' }, { status: 400 });
        }

        // 1. Fetch Data
        const insights = await prisma.dailyInsight.findMany({
            where: {
                date: {
                    gte: new Date(from),
                    lte: new Date(to),
                },
            },
            orderBy: {
                date: 'asc',
            },
        });

        console.log('Insights found:', insights.length);

        // 2. Aggregate Data
        const totals = insights.reduce(
            (acc, day) => ({
                spend: acc.spend + day.spend,
                impressions: acc.impressions + day.impressions,
                clicks: acc.clicks + day.clicks,
                leads: acc.leads + day.leads,
                conversions: acc.conversions + day.conversions,
            }),
            { spend: 0, impressions: 0, clicks: 0, leads: 0, conversions: 0 }
        );

        // Revenue/ROAS removed as user does not track revenue.
        const cpa = totals.conversions > 0 ? totals.spend / totals.conversions : 0;
        const cpl = totals.leads > 0 ? totals.spend / totals.leads : 0;

        // 3. Select Provider
        let model;

        if (provider === 'gemini') {
            if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
                return NextResponse.json({ error: 'Gemini API Key is missing.' }, { status: 500 });
            }
            const google = createGoogleGenerativeAI({
                apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
            });
            model = google(modelName || 'gemini-2.0-flash-exp');
        } else if (provider === 'openrouter') {
            if (!process.env.OPENROUTER_API_KEY) {
                return NextResponse.json({ error: 'OpenRouter API Key is missing.' }, { status: 500 });
            }
            const openrouter = createOpenAI({
                apiKey: process.env.OPENROUTER_API_KEY,
                baseURL: 'https://openrouter.ai/api/v1',
            });
            model = openrouter(modelName || 'gpt-4o-mini');
        } else if (provider === 'openai') {
            // OpenAI option removed from frontend, but kept here for backward compatibility or direct API usage if needed.
            if (!process.env.OPENAI_API_KEY) {
                return NextResponse.json({ error: 'OpenAI API Key is missing.' }, { status: 500 });
            }
            const openai = createOpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
            model = openai('gpt-4o-mini');
        } else {
            return NextResponse.json({ error: 'Invalid provider selected.' }, { status: 400 });
        }

        // 4. Construct System Prompt
        const languageInstruction = language === 'id'
            ? "PENTING: Jawablah dalam Bahasa Indonesia yang profesional dan mudah dipahami."
            : "IMPORTANT: Respond in professional, easy-to-understand English.";

        const formatCurrency = (amount: number) => {
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
        };

        const systemPrompt = `
      You are an expert Data Analyst for an advertising agency.
      ${languageInstruction}
      
      Analyze the following ad performance data for the period ${from} to ${to}.
      
      Total Spend: ${formatCurrency(totals.spend)}
      Impressions: ${totals.impressions}
      Clicks: ${totals.clicks}
      Leads: ${totals.leads}
      Conversions: ${totals.conversions}
      CPA: ${formatCurrency(cpa)}
      CPL: ${formatCurrency(cpl)}

      Daily Breakdown (first 5 and last 5 days):
      ${JSON.stringify(insights.slice(0, 5).map(d => ({ date: d.date, spend: d.spend, leads: d.leads, cpl: d.cpl })))}
      ...
      ${JSON.stringify(insights.slice(-5).map(d => ({ date: d.date, spend: d.spend, leads: d.leads, cpl: d.cpl })))}

      Your goal is to provide a concise, actionable summary. 
      Highlight trends, good/bad performance, and possible next steps.
      Format your response in Markdown.
      Use bolding for key metrics.
    `;

        // 5. Stream Response
        const result = await streamText({
            model,
            system: systemPrompt,
            prompt: userPrompt || 'Analyze this data.',
            onFinish: ({ text }) => {
                console.log('Analysis completed. Length:', text.length);
                console.log('Snippet:', text.substring(0, 100));
            },
        });

        return result.toTextStreamResponse();
    } catch (error: any) {
        console.error('AI Analysis Error:', error);

        // Handle Quota/Rate Limit Errors
        if (
            error.status === 429 ||
            (error.message && error.message.toLowerCase().includes('quota')) ||
            (error.message && error.message.toLowerCase().includes('resource_exhausted'))
        ) {
            return NextResponse.json(
                { error: 'Kuota AI habis (Rate Limit). Mohon tunggu beberapa saat atau ganti provider.' },
                { status: 429 }
            );
        }

        return NextResponse.json({ error: 'Gagal menganalisis data. Coba lagi nanti.' }, { status: 500 });
    }
}
