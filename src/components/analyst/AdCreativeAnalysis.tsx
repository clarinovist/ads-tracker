'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Sparkles, AlertCircle, Image as ImageIcon, PlayCircle } from 'lucide-react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

interface AdData {
    id: string;
    name: string;
    creative_url?: string;
    thumbnail_url?: string;
    creative_title?: string;
    creative_body?: string;
    creative_type?: string;
    aggregate: {
        spend: number;
        impressions: number;
        clicks: number;
        leads: number;
        ctr: number;
    };
}

interface AdCreativeAnalysisProps {
    adData: AdData;
    date: { from: Date; to: Date };
}

export default function AdCreativeAnalysis({ adData, date }: AdCreativeAnalysisProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Reset messages when ad changes
    useEffect(() => {
        setMessages([]);
        setError(null);
    }, [adData.id]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const imageUrl = adData.thumbnail_url || (adData.creative_type !== 'VIDEO' ? adData.creative_url : null);

    const runStreamAnalysis = async (msgContent: string) => {
        if (!date?.from || !date?.to) return;

        setIsLoading(true);
        setError(null);

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msgContent };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);

        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages.map(({ role, content }) => ({ role, content })),
                    from: date.from.toISOString(),
                    to: date.to.toISOString(),
                    adId: adData.id, // Context: Ad ID for creative analysis
                    language: 'id',
                    modelName: 'gemini'
                }),
            });

            if (!res.ok) throw new Error(res.statusText);
            if (!res.body) throw new Error("No response body");

            const assistantMsgId = (Date.now() + 1).toString();
            let accumulatedResponse = "";

            setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '' }]);

            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                accumulatedResponse += chunk;
                setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: accumulatedResponse } : m));
            }

        } catch (err: unknown) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue?.trim()) return;
        const content = inputValue;
        setInputValue('');
        await runStreamAnalysis(content);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const cpm = adData.aggregate.impressions > 0 ? (adData.aggregate.spend / adData.aggregate.impressions) * 1000 : 0;

    return (
        <div className="flex flex-col h-full">
            {/* Creative Preview Header */}
            <div className="shrink-0 border-b bg-slate-50 p-4">
                <div className="flex gap-4">
                    {/* Image Preview */}
                    <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-slate-200 border border-slate-300 relative">
                        {imageUrl ? (
                            <Image src={imageUrl} alt={adData.name} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <ImageIcon className="h-8 w-8" />
                            </div>
                        )}
                        {adData.creative_type === 'VIDEO' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <PlayCircle className="h-8 w-8 text-white/80" />
                            </div>
                        )}
                    </div>
                    {/* Quick Stats */}
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 text-sm truncate mb-2">{adData.name}</h4>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                            <div>
                                <p className="text-slate-500">Spend</p>
                                <p className="font-bold text-slate-800">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0, notation: 'compact' }).format(adData.aggregate.spend)}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Leads</p>
                                <p className="font-bold text-slate-800">{adData.aggregate.leads}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">CTR</p>
                                <p className="font-bold text-slate-800">{adData.aggregate.ctr.toFixed(2)}%</p>
                            </div>
                            <div>
                                <p className="text-slate-500">CPM</p>
                                <p className="font-bold text-slate-800">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0, notation: 'compact' }).format(cpm)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
                        <Sparkles className="h-12 w-12 mb-4 text-indigo-500/50" />
                        <p className="font-medium text-slate-600 mb-2">Analisa AI untuk Creative ini</p>
                        <p className="text-sm mb-4">Tanyakan tentang performa, visual, atau copy improvement.</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {[
                                "Analisa performa iklan ini",
                                "Apa yang bisa diperbaiki?",
                                "Kenapa CTR rendah?",
                                "Saran untuk headline"
                            ].map(q => (
                                <Button
                                    key={q}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => runStreamAnalysis(q)}
                                >
                                    {q}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] rounded-lg p-3 text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-800'
                            }`}>
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        p: ({ ...props }) => <p className="mb-4 leading-7 last:mb-0" {...props} />,
                                        ul: ({ ...props }) => <ul className="my-4 ml-6 list-disc [&>li]:mt-2" {...props} />,
                                        ol: ({ ...props }) => <ol className="my-4 ml-6 list-decimal [&>li]:mt-2" {...props} />,
                                        li: ({ ...props }) => <li className="leading-7" {...props} />,
                                        h1: ({ ...props }) => <h1 className="mt-8 mb-4 text-xl font-bold" {...props} />,
                                        h2: ({ ...props }) => <h2 className="mt-8 mb-4 text-lg font-bold" {...props} />,
                                        h3: ({ ...props }) => <h3 className="mt-6 mb-3 text-base font-bold" {...props} />,
                                        blockquote: ({ ...props }) => <blockquote className="border-l-4 border-primary pl-4 italic my-4" {...props} />,
                                    }}
                                >
                                    {m.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-100 rounded-lg p-3 text-sm flex items-center gap-2 text-slate-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sedang menganalisa creative...
                        </div>
                    </div>
                )}
                {error && (
                    <div className="flex justify-center">
                        <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg p-3 text-sm flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Error: {error.message}
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-white">
                <form onSubmit={handleSendMessage} className="relative">
                    <Textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ketik pertanyaan tentang creative ini..."
                        className="min-h-[50px] pr-12 resize-none"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={isLoading || !inputValue.trim()}
                        className="absolute right-2 bottom-2 h-8 w-8"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
