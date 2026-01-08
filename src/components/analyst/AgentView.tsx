'use client';

import { useState, useEffect, useRef } from 'react';
// Removing useChat to avoid version/type conflicts
// import { useChat } from '@ai-sdk/react';
import { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { DateRangePicker } from '@/components/DateRangePicker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, AlertCircle, Send, Copy, RotateCcw, History, MessageSquarePlus, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface HistoryItem {
    id: string;
    prompt: string;
    response: string;
    messages?: { role: string; content: string }[]; // Full conversation
    created_at: string;
    date_from: string;
    date_to: string;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export default function AgentView() {
    const [date, setDate] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });
    const [provider] = useState('openrouter');
    const [modelName, setModelName] = useState('gemini');
    const [language, setLanguage] = useState('id');

    // History State
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);

    // Chat State
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [conversationId, setConversationId] = useState<string | null>(null); // Track current conversation

    // Auto-scroll to bottom of chat
    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Fetch History
    const fetchHistory = async () => {
        setIsHistoryLoading(true);
        try {
            const res = await fetch('/api/analyze/history');
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsHistoryLoading(false);
        }
    };

    // Clear All History
    const clearHistory = async () => {
        if (!confirm('Are you sure you want to clear all history?')) return;
        try {
            const res = await fetch('/api/analyze/history', { method: 'DELETE' });
            if (res.ok) {
                setHistory([]);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Load History Item into View
    const loadHistoryItem = (item: HistoryItem) => {
        setDate({
            from: new Date(item.date_from),
            to: new Date(item.date_to)
        });
        setConversationId(item.id); // Set conversation ID from history

        // If messages array exists, use it; otherwise fallback to prompt/response
        if (item.messages && item.messages.length > 0) {
            setMessages(item.messages.map((m, idx) => ({
                id: `history-${idx}`,
                role: m.role as 'user' | 'assistant',
                content: m.content
            })));
        } else {
            setMessages([
                {
                    id: 'history-user',
                    role: 'user',
                    content: item.prompt || `Analyze data from ${format(new Date(item.date_from), 'yyyy-MM-dd')} to ${format(new Date(item.date_to), 'yyyy-MM-dd')}`
                },
                {
                    id: 'history-assistant',
                    role: 'assistant',
                    content: item.response
                }
            ]);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const runStreamAnalysis = async (msgContent: string) => {
        if (!date?.from || !date?.to) return;

        setIsLoading(true);
        setError(null);

        // Generate new conversation ID if this is the first message
        let currentConversationId = conversationId;
        if (!currentConversationId && messages.length === 0) {
            currentConversationId = crypto.randomUUID();
            setConversationId(currentConversationId);
        }

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
                    provider,
                    modelName,
                    language,
                    conversationId: currentConversationId // Pass current conversation ID
                }),
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(res.statusText || errText || 'Failed to fetch analysis');
            }

            if (!res.body) throw new Error("No response body");

            // Optimistic assistant message
            const assistantMsgId = (Date.now() + 1).toString();
            let accumulatedResponse = "";

            setMessages(prev => [
                ...prev,
                { id: assistantMsgId, role: 'assistant', content: '' }
            ]);

            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                accumulatedResponse += chunk;

                setMessages(prev => prev.map(m =>
                    m.id === assistantMsgId ? { ...m, content: accumulatedResponse } : m
                ));
            }

        } catch (err: any) {
            console.error("Analysis Error:", err);
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue?.trim() || !date?.from) return;

        const content = inputValue;
        setInputValue(''); // Clear immediately

        await runStreamAnalysis(content);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleSuggestionClick = async (suggestion: string) => {
        setInputValue('');
        await runStreamAnalysis(suggestion);
    };

    const startNewAnalysis = () => {
        setMessages([]);
        setError(null);
        setConversationId(null); // Reset conversation ID for new conversation
        fetchHistory();
    };

    const reload = () => {
        // Simple reload: remove last assistant message (if error) and retry last user message
        const lastMsg = messages[messages.length - 1];
        if (lastMsg?.role === 'user') {
            const content = lastMsg.content;
            setMessages(prev => prev.slice(0, -1)); // Remove last user msg to re-add it in runStream
            runStreamAnalysis(content);
        } else if (lastMsg?.role === 'assistant' && error) {
            // If last was failed assistant, retry previous user message
            const userMsg = messages[messages.length - 2];
            if (userMsg?.role === 'user') {
                setMessages(prev => prev.slice(0, -2)); // Remove bad assistant and user msg
                runStreamAnalysis(userMsg.content);
            }
        }
    };

    return (
        <div className="space-y-4 md:space-y-6 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shrink-0">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">AI Command Center</h2>
                    <p className="text-sm text-muted-foreground">
                        Tanya pertanyaan strategis tentang seluruh bisnis Anda.
                    </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="flex-1 sm:flex-none">
                        <DateRangePicker
                            date={date}
                            setDate={(d) => setDate(d)}
                        />
                    </div>

                    <Sheet onOpenChange={(open) => open && fetchHistory()}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon">
                                <History className="h-4 w-4" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>Analysis History</SheetTitle>
                                <SheetDescription>
                                    Previous generated insights.
                                </SheetDescription>
                            </SheetHeader>
                            {history.length > 0 && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="mt-4 w-full"
                                    onClick={clearHistory}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Clear All History
                                </Button>
                            )}
                            <div className="mt-4 space-y-4 max-h-[80vh] overflow-y-auto">
                                {isHistoryLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                {!isHistoryLoading && history.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No analysis history yet.
                                    </p>
                                )}
                                {history.map((item) => (
                                    <div key={item.id} className="p-3 border rounded-lg cursor-pointer hover:bg-muted" onClick={() => loadHistoryItem(item)}>
                                        <p className="text-xs text-muted-foreground mb-1">
                                            {format(new Date(item.created_at), 'PPP p')}
                                        </p>
                                        <p className="text-sm font-medium">
                                            {format(new Date(item.date_from), 'MMM d')} - {format(new Date(item.date_to), 'MMM d, yyyy')}
                                        </p>
                                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                            {item.response.substring(0, 100)}...
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden min-h-0">
                {/* Controls Column */}
                <div className="lg:col-span-1 space-y-4 overflow-y-auto max-h-[300px] lg:max-h-full pr-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuration</CardTitle>
                            <CardDescription>Setup your analysis parameters</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">

                            <div className="space-y-2">
                                <label className="text-sm font-medium">AI Model</label>
                                <Select value={modelName} onValueChange={setModelName}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="gemini">Gemini 3.0 Pro</SelectItem>
                                        <SelectItem value="claude">Claude Opus 4.5</SelectItem>
                                        <SelectItem value="gpt">GPT 5.2</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

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

                            <Button
                                onClick={startNewAnalysis}
                                variant="outline"
                                className="w-full"
                            >
                                <MessageSquarePlus className="mr-2 h-4 w-4" />
                                New Conversation
                            </Button>

                            <div className="text-xs text-muted-foreground mt-4 space-y-2">
                                <p><strong>💡 Gunakan halaman ini untuk:</strong></p>
                                <ul className="list-disc ml-4 space-y-1">
                                    <li>Bandingkan performa antar campaign/adset</li>
                                    <li>Analisa tren global bisnis</li>
                                    <li>Tanya keputusan strategis</li>
                                </ul>
                                <p className="text-muted-foreground/70 italic">Untuk analisa per-iklan atau per-adset, gunakan tombol ✨ di halaman Ads atau Ad Sets.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Chat Column */}
                <div className="lg:col-span-2 flex flex-col h-full gap-4 min-h-0">
                    <Card className="flex-1 flex flex-col overflow-hidden shadow-sm border-muted min-h-0">
                        <CardContent className="flex-1 p-0 flex flex-col overflow-hidden relative min-h-0">
                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
                                {messages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                        <Sparkles className="h-12 w-12 mb-4" />
                                        <p className="font-medium">Command Center siap menerima perintah.</p>
                                        <p className="text-sm mt-1">Tanyakan hal-hal strategis tentang seluruh bisnis Anda.</p>
                                    </div>
                                )}

                                {messages.map((m) => (
                                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-lg p-4 ${m.role === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted/50 border'
                                            }`}>
                                            {m.role === 'assistant' && (
                                                <div className="flex justify-between items-start mb-2 border-b pb-2">
                                                    <span className="text-xs font-semibold uppercase tracking-wider opacity-70">AI Command</span>
                                                    <Button variant="ghost" size="icon" className="h-4 w-4 text-muted-foreground hover:text-foreground" onClick={() => handleCopy(m.content)}>
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            )}

                                            <div className={`prose prose-sm max-w-none dark:prose-invert ${m.role === 'user' ? 'prose-headings:text-primary-foreground prose-p:text-primary-foreground prose-strong:text-primary-foreground' : ''
                                                }`}>
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        p: ({ node, ...props }) => <p className="mb-4 leading-7 last:mb-0" {...props} />,
                                                        ul: ({ node, ...props }) => <ul className="my-4 ml-6 list-disc [&>li]:mt-2" {...props} />,
                                                        ol: ({ node, ...props }) => <ol className="my-4 ml-6 list-decimal [&>li]:mt-2" {...props} />,
                                                        li: ({ node, ...props }) => <li className="leading-7" {...props} />,
                                                        h1: ({ node, ...props }) => <h1 className="mt-8 mb-4 text-xl font-bold" {...props} />,
                                                        h2: ({ node, ...props }) => <h2 className="mt-8 mb-4 text-lg font-bold" {...props} />,
                                                        h3: ({ node, ...props }) => <h3 className="mt-6 mb-3 text-base font-bold" {...props} />,
                                                        blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-primary pl-4 italic my-4" {...props} />,
                                                    }}
                                                >
                                                    {m.content}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {isLoading && !messages[messages.length - 1]?.role.includes('assistant') && (
                                    <div className="flex justify-start">
                                        <div className="bg-muted/50 border rounded-lg p-4 flex items-center gap-2 text-sm text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Analyzing data...
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="flex justify-center">
                                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-lg p-3 text-sm flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" />
                                            {error.message}
                                            <Button variant="link" size="sm" className="h-auto p-0 text-red-600 underline ml-2" onClick={() => reload()}>Retry</Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-background border-t">
                                <form onSubmit={handleSendMessage} className="relative">
                                    <Textarea
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ask for an analysis or specific insights (Enter to send, Shift+Enter for new line)..."
                                        className="min-h-[60px] pr-12 resize-none"
                                        rows={2}
                                    />
                                    <Button
                                        type="submit"
                                        size="icon"
                                        disabled={isLoading || !inputValue?.trim() || !date?.from}
                                        className="absolute right-2 bottom-2 h-8 w-8"
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                                <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                                    {[
                                        "Ringkas performa minggu ini",
                                        "Campaign mana paling efisien?",
                                        "Adset mana yang harus dimatikan?",
                                        "Bandingkan semua campaign"
                                    ].map(suggestion => (
                                        <Button
                                            key={suggestion}
                                            variant="outline"
                                            size="sm"
                                            className="text-xs h-7 whitespace-nowrap"
                                            onClick={() => handleSuggestionClick(suggestion)}
                                        >
                                            {suggestion}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
