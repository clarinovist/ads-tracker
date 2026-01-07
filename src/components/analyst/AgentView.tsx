'use client';

import { useState } from 'react';
import { useCompletion } from '@ai-sdk/react';
import { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { DateRangePicker } from '@/components/DateRangePicker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles } from 'lucide-react';

export default function AgentView() {
    const [date, setDate] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });
    const [provider, setProvider] = useState('gemini');
    const [customModel, setCustomModel] = useState('');
    const [language, setLanguage] = useState('id'); // Default to Indonesian as requested

    const { complete, completion, isLoading, error } = useCompletion({
        api: '/api/analyze',
        streamProtocol: 'text',
    });

    const [customPrompt, setCustomPrompt] = useState('');

    const handleAnalyze = () => {
        if (!date?.from || !date?.to) return;

        complete(customPrompt, {
            body: {
                from: date.from.toISOString(),
                to: date.to.toISOString(),
                provider,
                modelName: (provider === 'openrouter' || provider === 'gemini') ? customModel : undefined,
                language,
            },
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Data Analyst Agent</h2>
                    <p className="text-muted-foreground">
                        Get AI-powered insights on your campaign performance.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <DateRangePicker
                        date={date}
                        setDate={(d) => setDate(d)}
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Controls Column */}
                <div className="md:col-span-1 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuration</CardTitle>
                            <CardDescription>Customize your analysis</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">AI Provider</label>
                                <Select value={provider} onValueChange={setProvider}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="gemini">Google Gemini</SelectItem>
                                        <SelectItem value="openrouter">OpenRouter</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {(provider === 'openrouter' || provider === 'gemini') && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Model Name (Optional)</label>
                                    <div className="text-xs text-muted-foreground mb-1">
                                        {provider === 'gemini'
                                            ? "Defaults to `gemini-2.0-flash-exp`."
                                            : "Defaults to `gpt-4o-mini` if empty."}
                                    </div>
                                    <input
                                        type="text"
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder={provider === 'gemini' ? "e.g. gemini-pro" : "e.g. anthropic/claude-3-haiku"}
                                        value={customModel}
                                        onChange={(e) => setCustomModel(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Language</label>
                                <Select value={language} onValueChange={setLanguage}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="id">Bahasa Indonesia</SelectItem>
                                        <SelectItem value="en">English</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Quick Prompts</label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        "Analyze CPL trends",
                                        "Summarize spend vs results",
                                        "Find best performing day",
                                        "Identify high cost days"
                                    ].map((prompt) => (
                                        <Button
                                            key={prompt}
                                            variant="outline"
                                            size="sm"
                                            className="text-xs h-7"
                                            onClick={() => setCustomPrompt(prompt)}
                                        >
                                            {prompt}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Custom Instructions (Optional)</label>
                                <Textarea
                                    placeholder="e.g., Focus on ROAS and suggest budget reallocations..."
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    rows={4}
                                />
                            </div>

                            <Button
                                onClick={handleAnalyze}
                                disabled={isLoading || !date?.from}
                                className="w-full"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Generate Analysis
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Results Column */}
                <div className="md:col-span-2">
                    <Card className="h-full min-h-[500px]">
                        <CardHeader>
                            <CardTitle>Analysis Result</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {error && (
                                <div className="p-4 mb-4 text-sm text-red-500 bg-red-50 rounded-lg dark:bg-red-900/10 dark:text-red-400">
                                    Error: {error.message}
                                </div>
                            )}

                            {!completion && !isLoading && !error && (
                                <div className="flex h-[300px] items-center justify-center text-muted-foreground text-center p-8">
                                    {date?.from && date?.to ? (
                                        <div>
                                            <p className="mb-2">
                                                Ready to analyze data from <span className="font-medium text-foreground">{format(date.from, 'MMM d, yyyy')}</span> to <span className="font-medium text-foreground">{format(date.to, 'MMM d, yyyy')}</span>.
                                            </p>
                                            <p className="text-sm">Click the <strong>Generate Analysis</strong> button to start.</p>
                                        </div>
                                    ) : (
                                        "Select a date range to start."
                                    )}
                                </div>
                            )}

                            {(completion || isLoading) && (
                                <div className="prose prose-stone dark:prose-invert max-w-none whitespace-pre-wrap">
                                    {completion}
                                    {isLoading && <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
