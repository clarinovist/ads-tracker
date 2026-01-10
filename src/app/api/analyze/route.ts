
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { streamText } from 'ai';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { startOfDay, endOfDay } from 'date-fns';

export const maxDuration = 60; // Increased to 60s

export async function POST(req: Request) {
    try {
        const { messages, from, to, provider = 'openrouter', modelName, language = 'id', conversationId, adSetId, adId } = await req.json();

        console.log('--- Chat Analysis Call ---');
        console.log('From:', from, 'To:', to);
        console.log('Provider:', provider, 'Model Name Request:', modelName);
        console.log('Context:', adId ? `Ad ID: ${adId}` : adSetId ? `Ad Set ID: ${adSetId}` : 'Global');

        if (!from || !to) {
            return NextResponse.json({ error: 'Date range is required for context.' }, { status: 400 });
        }

        // 1. Fetch Data (Context)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let insights: any[] = [];
        let entityName = '';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let adCreativeData: any = null; // For Ad creative analysis

        if (adId) {
            // Fetch Ad data including creative info
            const adData = await prisma.ad.findUnique({
                where: { id: adId },
                select: {
                    name: true,
                    creative_url: true,
                    thumbnail_url: true,
                    creative_title: true,
                    creative_body: true,
                    creative_type: true,
                    creative_dynamic_data: true,
                    ad_set: {
                        select: { name: true, campaign: { select: { name: true } } }
                    }
                }
            });
            entityName = adData?.name || 'Unknown Ad';
            adCreativeData = adData;

            insights = await prisma.adDailyInsight.findMany({
                where: {
                    ad_id: adId,
                    date: {
                        gte: startOfDay(new Date(from)),
                        lte: endOfDay(new Date(to)),
                    },
                },
                orderBy: {
                    date: 'asc',
                },
            });
            console.log(`Fetched ${insights.length} insights for Ad ${adId} (${entityName})`);
        } else if (adSetId) {
            const adSetData = await prisma.adSet.findUnique({
                where: { id: adSetId },
                select: { name: true }
            });
            entityName = adSetData?.name || 'Unknown Ad Set';

            insights = await prisma.adSetDailyInsight.findMany({
                where: {
                    ad_set_id: adSetId,
                    date: {
                        gte: startOfDay(new Date(from)),
                        lte: endOfDay(new Date(to)),
                    },
                },
                orderBy: {
                    date: 'asc',
                },
            });
            console.log(`Fetched ${insights.length} insights for Ad Set ${adSetId} (${entityName})`);
            if (insights.length > 0) {
                console.log('Sample Ad Set Insight:', JSON.stringify(insights[0]));
            }
        } else {
            insights = await prisma.dailyInsight.findMany({
                where: {
                    date: {
                        gte: startOfDay(new Date(from)),
                        lte: endOfDay(new Date(to)),
                    },
                },
                orderBy: {
                    date: 'asc',
                },
            });
        }

        // 2. Aggregate Data
        const totals = insights.reduce(
            (acc, day) => ({
                spend: acc.spend + day.spend,
                impressions: acc.impressions + day.impressions,
                clicks: acc.clicks + day.clicks,
                leads: acc.leads + day.leads,
                conversions: acc.conversions + (day.conversions || 0),
            }),
            { spend: 0, impressions: 0, clicks: 0, leads: 0, conversions: 0 }
        );

        // 2.5 Fetch Campaign Objectives to provide context
        let campaignObjectives: { objective: string | null; name: string }[] = [];
        if (adId || adSetId) {
            // Get objective from specific campaign chain
            const adSetData = adSetId
                ? await prisma.adSet.findUnique({ where: { id: adSetId }, include: { campaign: { select: { objective: true, name: true } } } })
                : await prisma.ad.findUnique({ where: { id: adId }, include: { ad_set: { include: { campaign: { select: { objective: true, name: true } } } } } });

            if (adSetData) {
                const campaign = 'campaign' in adSetData ? adSetData.campaign : adSetData.ad_set?.campaign;
                if (campaign) {
                    campaignObjectives = [{ objective: campaign.objective, name: campaign.name }];
                }
            }
        } else {
            // Global context: get all active campaign objectives
            const campaigns = await prisma.campaign.findMany({
                where: { status: 'ACTIVE' },
                select: { objective: true, name: true },
                take: 10
            });
            campaignObjectives = campaigns;
        }

        // Determine primary goal based on objectives
        const objectivesList = campaignObjectives.map(c => c.objective).filter(Boolean);
        const isEngagementFocused = objectivesList.some(obj =>
            obj?.includes('ENGAGEMENT') || obj?.includes('MESSAGES') || obj?.includes('LEAD')
        );
        const isConversionFocused = objectivesList.some(obj =>
            obj?.includes('SALES') || obj?.includes('CONVERSIONS') || obj?.includes('PRODUCT_CATALOG')
        );

        const cpa = totals.conversions > 0 ? totals.spend / totals.conversions : 0;
        const cpl = totals.leads > 0 ? totals.spend / totals.leads : 0;
        const cpm = totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0;
        const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;

        // 3. Provider & Model Selection
        let model;

        // Resolve model ID from Environment Variables
        let targetModelId = process.env.AI_MODEL_GEMINI; // Default fallback
        if (modelName === 'gemini') targetModelId = process.env.AI_MODEL_GEMINI;
        else if (modelName === 'claude') targetModelId = process.env.AI_MODEL_CLAUDE;
        else if (modelName === 'gpt') targetModelId = process.env.AI_MODEL_GPT;

        // Fallback defaults
        if (!targetModelId) {
            if (modelName === 'claude') targetModelId = 'anthropic/claude-3-opus';
            else if (modelName === 'gpt') targetModelId = 'openai/gpt-4o';
            else targetModelId = 'google/gemini-2.0-flash-exp';
        }

        if (provider === 'openrouter') {
            if (!process.env.OPENROUTER_API_KEY) throw new Error('OpenRouter API Key missing');
            const openrouter = createOpenAICompatible({
                name: 'openrouter',
                apiKey: process.env.OPENROUTER_API_KEY,
                baseURL: 'https://openrouter.ai/api/v1',
            });
            model = openrouter(targetModelId || 'google/gemini-2.0-flash-exp');
        } else {
            if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) throw new Error('Gemini API Key missing');
            const google = createGoogleGenerativeAI({
                apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
            });
            model = google(targetModelId?.split('/')[1] || 'gemini-1.5-pro-latest');
        }

        // 4. System Prompt Construction
        const languageStyle = language === 'id'
            ? "Use simple, everyday Indonesian (Bahasa Indonesia sehari-hari). Avoid technical jargon where possible, or explain it simply. Always use real-world analogies (like a physical shop, fishing, or a restaurant) to explain digital marketing concepts."
            : "Use simple, everyday English. Avoid or minimize technical jargon (e.g., instead of 'CTR,' use 'Click Interest'; instead of 'CPL,' use 'Cost per Lead'). Always use real-world analogies (like a physical shop, fishing, or a restaurant) to explain digital marketing concepts.";

        const formatCurrency = (amount: number) => {
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
        };

        // Build context section based on entity type
        let contextSection = '';

        if (adId && adCreativeData) {
            const imageUrl = adCreativeData.thumbnail_url || (adCreativeData.creative_type !== 'VIDEO' ? adCreativeData.creative_url : null);

            contextSection = `
      CONTEXT DATA (Period: ${from} to ${to}):
      - Analyzing Entity: ${entityName} (Ad Creative)
      - Ad Set: ${adCreativeData.ad_set?.name || 'Unknown'}
      - Campaign: ${adCreativeData.ad_set?.campaign?.name || 'Unknown'}
      - Creative Type: ${adCreativeData.creative_type || 'Unknown'}
      
      CREATIVE COPY:
      - Headline: ${adCreativeData.creative_title || 'No headline'}
      - Primary Text: ${adCreativeData.creative_body?.substring(0, 500) || 'No primary text'}
      
      PERFORMANCE DATA:
      - Total Spend: ${formatCurrency(totals.spend)}
      - Impressions: ${totals.impressions}
      - Clicks: ${totals.clicks} (CTR: ${ctr.toFixed(2)}%)
      - Leads: ${totals.leads}
      - CPM: ${formatCurrency(cpm)}
      - CPL: ${totals.leads > 0 ? formatCurrency(cpl) : 'N/A'}
      
      ${imageUrl ? `CREATIVE IMAGE: An image of this ad creative is attached. Please analyze the visual elements.` : 'No creative image available for visual analysis.'}
      `;
        } else if (adSetId) {
            contextSection = `
      CONTEXT DATA (Period: ${from} to ${to}):
      - Analyzing Entity: ${entityName} (Ad Set)
      - Total Spend: ${formatCurrency(totals.spend)}
      - Impressions: ${totals.impressions}
      - Clicks: ${totals.clicks} (CTR: ${ctr.toFixed(2)}%)
      - Leads: ${totals.leads}
      - Conversions: ${totals.conversions}
      - CPA: ${formatCurrency(cpa)}
      - CPL: ${formatCurrency(cpl)}

      Daily Data Sample (First 5 & Last 5 days):
      ${JSON.stringify(insights.slice(0, 5).map(d => ({ date: d.date, spend: d.spend, leads: d.leads, cpl: d.cpl })))}
      ...
      ${JSON.stringify(insights.slice(-5).map(d => ({ date: d.date, spend: d.spend, leads: d.leads, cpl: d.cpl })))}
      `;
        } else {
            contextSection = `
      CONTEXT DATA (Period: ${from} to ${to}):
      - Analyzing: Global Business Account
      - Total Spend: ${formatCurrency(totals.spend)}
      - Impressions: ${totals.impressions}
      - Clicks: ${totals.clicks} (CTR: ${ctr.toFixed(2)}%)
      - Leads: ${totals.leads}
      - Conversions: ${totals.conversions}
      - CPA: ${formatCurrency(cpa)}
      - CPL: ${formatCurrency(cpl)}

      Daily Data Sample (First 5 & Last 5 days):
      ${JSON.stringify(insights.slice(0, 5).map(d => ({ date: d.date, spend: d.spend, leads: d.leads, cpl: d.cpl })))}
      ...
      ${JSON.stringify(insights.slice(-5).map(d => ({ date: d.date, spend: d.spend, leads: d.leads, cpl: d.cpl })))}
      `;
        }

        // Build specialized instructions for Ad Creative analysis
        const creativeInstructions = adId ? `
      ADDITIONAL INSTRUCTIONS FOR CREATIVE ANALYSIS:
      - If an image is provided, analyze the visual elements: composition, colors, text readability, call-to-action visibility
      - Evaluate if the headline and primary text are compelling and match the visual
      - Consider if the creative would stand out in a busy social media feed
      - Suggest specific improvements for both the visual and copy
      - Comment on whether the creative matches the ad's apparent objective (leads, awareness, etc.)
      ` : '';

        // Build campaign objective context
        const objectiveContext = campaignObjectives.length > 0 ? `
      CAMPAIGN OBJECTIVES:
      ${campaignObjectives.map(c => `- ${c.name}: ${c.objective || 'Not specified'}`).join('\n      ')}
      
      PRIMARY GOAL ASSESSMENT:
      ${isEngagementFocused ? '✓ Campaigns are ENGAGEMENT-FOCUSED (Messages, Leads, Engagement). SUCCESS is measured by Leads/Conversations, NOT by website conversions.' : ''}
      ${isConversionFocused ? '✓ Campaigns are CONVERSION-FOCUSED (Sales, Conversions). SUCCESS is measured by conversion rate and ROAS.' : ''}
      ${!isEngagementFocused && !isConversionFocused ? '○ Campaign objectives not clearly defined. Evaluate based on available metrics.' : ''}
      ` : '';

        const objectiveInstructions = `
      5. CRITICAL - Campaign Objective Awareness:
         ${isEngagementFocused ? `
         - These campaigns are designed for ENGAGEMENT (getting people to message/chat/become leads)
         - A "Conversion" value of 0 is NORMAL and EXPECTED for engagement campaigns
         - DO NOT criticize or flag 0 conversions as a problem for engagement campaigns
         - Focus your analysis on: Leads generated, Cost per Lead (CPL), messaging conversations
         - SUCCESS = More leads/conversations at lower cost, NOT website conversions
         ` : ''}
         ${isConversionFocused ? `
         - These campaigns are designed for CONVERSIONS (website purchases, checkouts)
         - Conversions and ROAS are the primary success metrics
         - If conversions are 0 or low, this IS a concern worth addressing
         ` : ''}
         ${!isEngagementFocused && !isConversionFocused ? `
         - Campaign objective is unclear, evaluate all metrics fairly
         - Ask user about their primary goal if unclear
         ` : ''}
      `;

        const systemPrompt = `
      Role: You are a \"Business Translator\" and Growth Consultant. Your job is to simplify complex marketing and data reports for a non-technical business owner.

      Instructions:
      1. Language Style: 
         - ${languageStyle}
      
      2. Structure of Responses:
         - High-Level Summary: Start with a \"Bottom Line\" (e.g., \"The ads are attracting people, but not making money yet\").
         - The Good News: Highlight what is working in plain terms.
         - The Problem: Explain where the money is being wasted or where the process is breaking down.
         - Action Plan: Give 3 clear, non-technical steps to take next.
      
      3. Tone: 
         - Be empathetic, honest, and helpful. 
         - Speak like a supportive peer or a partner sitting across a coffee table, not like a rigid data analyst.

      4. Formatting:
         - Use bold text for key takeaways.
         - Use bullet points to keep things scannable.
         - Always include a \"Simple Analogy\" section for complex data sets.
         - CRITICAL: Use double line breaks (blank lines) between every section and paragraph. Do NOT produce wall of text.
         - Ensure the final output looks visually clean and easy to read.
      ${objectiveInstructions}
      Goal: Make the user feel empowered and informed, rather than confused by numbers.
      ${creativeInstructions}
      ${objectiveContext}
      ${contextSection}
    `;

        // 5. Stream Chat
        // Sanitize messages
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sanitizedMessages = messages.map((m: any) => {
            let content = '';
            if (typeof m.content === 'string') {
                content = m.content;
            } else if (Array.isArray(m.content)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                content = m.content.map((c: any) => c.text || JSON.stringify(c)).join('');
            } else {
                content = JSON.stringify(m.content) || '';
            }
            return {
                role: m.role,
                content: content
            };
        });

        console.log('Sanitized Messages Payload:', JSON.stringify(sanitizedMessages, null, 2));

        // 5. Stream Chat
        const result = await streamText({
            model,
            system: systemPrompt,
            messages: sanitizedMessages, // Pass the full conversation history, sanitized to ensure string content
            onFinish: async ({ text }) => {
                // Save conversation to history
                try {
                    // We only save the response if it seems like an analysis (length > 50 chars)
                    if (text.length > 50) {
                        try {
                            // Find the first user message for prompt
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const firstUserMessage = sanitizedMessages.find((m: any) => m.role === 'user');
                            // Build full conversation including this response
                            const fullConversation = [
                                ...sanitizedMessages,
                                { role: 'assistant', content: text }
                            ];


                            if (conversationId) {
                                // Upsert: create if not exists, update if exists
                                await prisma.analysisHistory.upsert({
                                    where: { id: conversationId },
                                    update: {
                                        response: text,
                                        messages: fullConversation,
                                    },
                                    create: {
                                        id: conversationId,
                                        prompt: firstUserMessage?.content?.substring(0, 200) || 'No prompt',
                                        response: text,
                                        messages: fullConversation,
                                        provider,
                                        model: targetModelId || 'unknown',
                                        date_from: new Date(from),
                                        date_to: new Date(to),
                                    }
                                });
                            } else {
                                // Create new conversation without ID
                                await prisma.analysisHistory.create({
                                    data: {
                                        prompt: firstUserMessage?.content?.substring(0, 200) || 'No prompt',
                                        response: text,
                                        messages: fullConversation,
                                        provider,
                                        model: targetModelId || 'unknown',
                                        date_from: new Date(from),
                                        date_to: new Date(to),
                                    }
                                });
                            }
                        } catch (innerDbError) {
                            console.error('Failed to save analysis history record:', innerDbError);
                        }
                    }
                } catch (dbError) {
                    console.error('Failed to save history (outer):', dbError);
                }
            },
        });

        return result.toTextStreamResponse();
    } catch (error: unknown) {
        console.error('AI Analysis Error:', error);
        const msg = error instanceof Error ? error.message : 'Analysis failed.';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
