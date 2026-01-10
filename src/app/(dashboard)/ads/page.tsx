"use client";

import { useEffect, useState } from "react";
// import { MetricsCard } from "@/components/MetricsCard";
import { DateRangePicker } from "@/components/DateRangePicker";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Image as ImageIcon,
    PlayCircle,
    Filter,
    Sparkles
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { startOfMonth, endOfDay, format, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import AdCreativeAnalysis from "@/components/analyst/AdCreativeAnalysis";

import { Suspense } from "react";

function AdsContent() {
    const searchParams = useSearchParams();
    const adSetId = searchParams.get("adSetId");

    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [ads, setAds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE'>('ALL');
    const now = new Date();
    const [dateRange, setDateRange] = useState({
        from: fromParam ? startOfDay(new Date(fromParam)) : startOfMonth(now),
        to: toParam ? endOfDay(new Date(toParam)) : endOfDay(now)
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedAd, setSelectedAd] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedAdForAnalysis, setSelectedAdForAnalysis] = useState<any>(null);

    // Moved fetchData inside useEffect to fix dependency warning

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const start = format(dateRange.from, 'yyyy-MM-dd');
                const end = format(dateRange.to, 'yyyy-MM-dd');
                const url = `/api/ads?startDate=${start}&endDate=${end}${adSetId ? `&adSetId=${adSetId}` : ''}`;
                const res = await fetch(url);
                const data = await res.json();
                setAds(data);
            } catch (error) {
                console.error("Error fetching ads:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [dateRange, adSetId]);

    const filteredAds = ads.filter(ad => {
        // Always filter out zero spend as per user request ("not running actually")
        if (ad.aggregate.spend <= 0) return false;

        if (filterStatus === 'ACTIVE') return ad.status === 'ACTIVE';
        return true;
    });

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Ads / Creatives</h2>
                    </div>
                    <p className="text-slate-500 ml-3">Visual performance of your individual ad creatives.</p>
                </div>
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Filter className="h-4 w-4" />
                                {filterStatus === 'ACTIVE' ? 'Active Ads' : 'All Ads'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setFilterStatus('ACTIVE')}>
                                Active Ads
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterStatus('ALL')}>
                                All Ads
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <DateRangePicker date={dateRange} setDate={setDateRange as any} />
                </div>
            </div>

            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-96 rounded-xl bg-slate-100 animate-pulse" />
                    ))}
                </div>
            ) : filteredAds.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-slate-300">
                    <ImageIcon className="h-10 w-10 text-slate-300 mb-2" />
                    <p className="text-slate-500">No ads found for the selected period.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredAds.map((ad) => {
                        const cpm = ad.aggregate.impressions > 0 ? (ad.aggregate.spend / ad.aggregate.impressions) * 1000 : 0;
                        return (
                            <div key={ad.id} className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
                                {/* Creative Preview */}
                                <div className="relative aspect-square bg-slate-100 overflow-hidden">
                                    {(ad.thumbnail_url || (ad.creative_type !== 'VIDEO' && ad.creative_url)) ? (
                                        <>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={ad.thumbnail_url || (ad.creative_type !== 'VIDEO' ? ad.creative_url : '')}
                                                alt={ad.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <ImageIcon className="h-12 w-12" />
                                        </div>
                                    )}

                                    {/* Meta Badge */}
                                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-md shadow-sm">
                                        <span className={cn(
                                            "w-2 h-2 rounded-full",
                                            ad.status === 'ACTIVE' ? "bg-emerald-500" : "bg-slate-400"
                                        )} />
                                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">{ad.status}</span>
                                    </div>

                                    {ad.creative_type === 'VIDEO' && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/0 transition-colors pointer-events-none">
                                            <PlayCircle className="h-12 w-12 text-white/80 filter drop-shadow-md" />
                                        </div>
                                    )}

                                    {/* Performance Overlay (Quick Stats) */}
                                    <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-[10px] text-white/70 uppercase">CTR</p>
                                                <p className="text-sm font-bold">{ad.aggregate.ctr.toFixed(2)}%</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-white/70 uppercase">CPM</p>
                                                <p className="text-sm font-bold">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(cpm)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Info & Metrics */}
                                <div className="p-4 space-y-3">
                                    <div className="space-y-1">
                                        <h4 className="font-semibold text-slate-900 text-sm leading-tight text-balance group-hover:text-blue-600 transition-colors line-clamp-2">
                                            {ad.name}
                                        </h4>
                                        {(ad.creative_title || ad.creative_body) && (
                                            <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                                                {ad.creative_title && (
                                                    <p className="font-medium text-slate-700 line-clamp-1">&quot;{ad.creative_title}&quot;</p>
                                                )}
                                                {ad.creative_body && (
                                                    <p className="line-clamp-2 italic">{ad.creative_body}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] text-slate-500 uppercase font-medium">Spend</p>
                                            <p className="text-xs font-bold text-slate-800">
                                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(ad.aggregate.spend)}
                                            </p>
                                        </div>
                                        <div className="text-right space-y-0.5 flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                                                title="Analyze with AI"
                                                onClick={() => setSelectedAdForAnalysis(ad)}
                                            >
                                                <Sparkles className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setSelectedAd(ad)}>
                                                View Details
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Dialog open={!!selectedAd} onOpenChange={(open) => !open && setSelectedAd(null)}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Ad Details</DialogTitle>
                        <DialogDescription>
                            Full creative and performance details for this ad.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedAd && (
                        <div className="space-y-6">
                            {/* Header Info */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{selectedAd.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={cn(
                                        "px-2 py-0.5 text-[10px] font-bold uppercase rounded-full",
                                        selectedAd.status === 'ACTIVE' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                                    )}>
                                        {selectedAd.status}
                                    </span>
                                    <span className="text-xs text-slate-500">ID: {selectedAd.id}</span>
                                </div>
                            </div>

                            {/* Creative Preview */}
                            <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative">
                                {(selectedAd.thumbnail_url || (selectedAd.creative_type !== 'VIDEO' && selectedAd.creative_url)) ? (
                                    <>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={selectedAd.thumbnail_url || (selectedAd.creative_type !== 'VIDEO' ? selectedAd.creative_url : '')}
                                            alt={selectedAd.name}
                                            className="w-full h-full object-contain"
                                        />
                                    </>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <ImageIcon className="h-16 w-16" />
                                    </div>
                                )}
                                {selectedAd.creative_type === 'VIDEO' && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <PlayCircle className="h-16 w-16 text-white/90 filter drop-shadow-lg" />
                                    </div>
                                )}
                            </div>

                            {/* Ad Copy */}
                            <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Headline</label>
                                    <p className="text-sm font-medium text-slate-900 mt-1">
                                        {selectedAd.creative_title || <span className="text-slate-400 italic">No headline available</span>}
                                    </p>
                                </div>
                                <div className="border-t border-slate-200 pt-3">
                                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Primary Text</label>
                                    <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap leading-relaxed">
                                        {selectedAd.creative_body || <span className="text-slate-400 italic">No primary text available</span>}
                                    </p>
                                </div>

                                {/* Dynamic Creative Variations */}
                                {selectedAd.creative_dynamic_data && (
                                    <>
                                        {/* Headline Variations */}
                                        {selectedAd.creative_dynamic_data.titles?.length > 1 && (
                                            <div className="border-t border-slate-200 pt-3">
                                                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                                    Headline Variations ({selectedAd.creative_dynamic_data.titles.length})
                                                </label>
                                                <div className="mt-2 space-y-2">
                                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                    {selectedAd.creative_dynamic_data.titles.map((title: any, idx: number) => (
                                                        <div key={idx} className="p-2 bg-white border border-slate-200 rounded text-xs text-slate-700 flex gap-2">
                                                            <span className="font-bold text-slate-400 shrink-0">#{idx + 1}</span>
                                                            <span>{title.text}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Body Variations */}
                                        {selectedAd.creative_dynamic_data.bodies?.length > 1 && (
                                            <div className="border-t border-slate-200 pt-3">
                                                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                                    Primary Text Variations ({selectedAd.creative_dynamic_data.bodies.length})
                                                </label>
                                                <div className="mt-2 space-y-2">
                                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                    {selectedAd.creative_dynamic_data.bodies.map((body: any, idx: number) => (
                                                        <div key={idx} className="p-2 bg-white border border-slate-200 rounded text-xs text-slate-700 flex gap-2">
                                                            <span className="font-bold text-slate-400 shrink-0">#{idx + 1}</span>
                                                            <span className="whitespace-pre-wrap">{body.text}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Performance Metrics */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                                    <p className="text-[10px] text-slate-500 uppercase">Total Spend</p>
                                    <p className="text-lg font-bold text-slate-900">
                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(selectedAd.aggregate.spend)}
                                    </p>
                                </div>
                                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                                    <p className="text-[10px] text-slate-500 uppercase">Leads</p>
                                    <p className="text-lg font-bold text-slate-900">{selectedAd.aggregate.leads}</p>
                                </div>
                                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                                    <p className="text-[10px] text-slate-500 uppercase">CTR</p>
                                    <p className="text-lg font-bold text-slate-900">{selectedAd.aggregate.ctr.toFixed(2)}%</p>
                                </div>
                                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                                    <p className="text-[10px] text-slate-500 uppercase">CPM</p>
                                    <p className="text-lg font-bold text-slate-900">
                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(selectedAd.aggregate.impressions > 0 ? (selectedAd.aggregate.spend / selectedAd.aggregate.impressions) * 1000 : 0)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* AI Analysis Sheet */}
            <Sheet open={!!selectedAdForAnalysis} onOpenChange={(open) => !open && setSelectedAdForAnalysis(null)}>
                <SheetContent className="sm:max-w-xl w-[90vw]">
                    <SheetHeader>
                        <SheetTitle>Creative Analysis</SheetTitle>
                        <SheetDescription>
                            AI-powered insights for this ad creative
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-4 h-[calc(100vh-120px)]">
                        {selectedAdForAnalysis && (
                            <AdCreativeAnalysis
                                adData={selectedAdForAnalysis}
                                date={dateRange}
                            />
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}

export default function AdsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading ad creatives catalog...</div>}>
            <AdsContent />
        </Suspense>
    );
}
