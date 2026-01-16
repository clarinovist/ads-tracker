"use client";
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BUSINESS_COLORS } from '@/lib/colors';
import { Textarea } from "@/components/ui/textarea";

type Business = {
    id: string;
    name: string;
    ad_account_id: string;
    color_code: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    masked_token?: string | null;
};

function VerifyButton({ adAccountId, accessToken }: { adAccountId: string, accessToken: string }) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [msg, setMsg] = useState('');

    const handleVerify = async () => {
        if (!adAccountId || !accessToken) {
            alert('Please enter Ad Account ID and Access Token');
            return;
        }
        if (accessToken.startsWith('••••')) {
            alert('Cannot verify masked token. Please enter the full token again to verify.');
            return;
        }

        setStatus('loading');
        setMsg('');
        try {
            const res = await fetch('/api/businesses/test-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ad_account_id: adAccountId, access_token: accessToken }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setStatus('success');
                setMsg(`Verified: ${data.data.name} (${data.data.currency})`);
            } else {
                setStatus('error');
                setMsg(data.error || 'Verification failed');
            }
        } catch (error) {
            console.error(error);
            setStatus('error');
            setMsg('Network error');
        }
    };

    return (
        <div className="flex flex-col items-end gap-1">
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleVerify}
                disabled={status === 'loading' || !accessToken || !adAccountId}
                className="h-7 text-xs"
            >
                {status === 'loading' ? 'Verifying...' : 'Test Connection'}
            </Button>
            {status === 'success' && <span className="text-xs text-green-600 font-medium">{msg}</span>}
            {status === 'error' && <span className="text-xs text-destructive font-medium">{msg}</span>}
        </div>
    );
}

export default function BusinessList({ initialData }: { initialData: Business[] }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        ad_account_id: '',
        color_code: '',
        access_token: '',
    });
    const [loading, setLoading] = useState(false);

    const handleOpenEdit = (business: Business) => {
        setEditingBusiness(business);
        setFormData({
            name: business.name,
            ad_account_id: business.ad_account_id,
            color_code: business.color_code,
            access_token: business.masked_token || '',
        });
        setOpen(true);
    };

    const handleOpenCreate = () => {
        setEditingBusiness(null);
        setFormData({
            name: '',
            ad_account_id: '',
            color_code: BUSINESS_COLORS[0].value,
            access_token: '',
        });
        setOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const payload: any = {
                name: formData.name,
                ad_account_id: formData.ad_account_id,
                color_code: formData.color_code,
            };

            // Only send access_token if it is NOT the masked version
            // If it starts with '••••', we assume it wasn't changed
            const isMasked = formData.access_token.startsWith('••••');
            if (!isMasked && formData.access_token) {
                payload.access_token = formData.access_token;
            } else if (!editingBusiness && !formData.access_token) {
                alert("Access Token is required");
                setLoading(false);
                return;
            }

            let res;
            if (editingBusiness) {
                // Update existing business
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { ad_account_id, ...updatePayload } = payload; // Can't update ad_account_id
                res = await fetch(`/api/businesses/${editingBusiness.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatePayload),
                });
            } else {
                // Create new business
                res = await fetch('/api/businesses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            }

            if (res.ok) {
                setOpen(false);
                router.refresh();
            } else {
                const d = await res.json();
                alert('Error: ' + (d.error || 'Failed'));
            }
        } catch (e) {
            console.error(e);
            alert(`Error ${editingBusiness ? 'updating' : 'creating'} business`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="flex justify-end mb-4">
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleOpenCreate}>Add Business</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>{editingBusiness ? 'Edit Business' : 'Add New Business'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Business Name</Label>
                                <Input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="My Business"
                                />
                            </div>

                            <div>
                                <Label>Ad Account ID</Label>
                                <Input
                                    value={formData.ad_account_id}
                                    onChange={e => setFormData({ ...formData, ad_account_id: e.target.value })}
                                    required
                                    placeholder="act_123456789"
                                    disabled={!!editingBusiness}
                                />
                                {editingBusiness && (
                                    <p className="text-xs text-muted-foreground mt-1">Ad Account ID cannot be changed</p>
                                )}
                            </div>

                            <div>
                                <Label>Color</Label>
                                <div className="grid grid-cols-4 gap-2 mt-2">
                                    {BUSINESS_COLORS.map(color => (
                                        <button
                                            key={color.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, color_code: color.value })}
                                            className={`h-12 rounded-md border-2 transition-all ${formData.color_code === color.value
                                                ? 'border-primary scale-110'
                                                : 'border-gray-200 hover:scale-105'
                                                }`}
                                            style={{ backgroundColor: color.value }}
                                            title={color.name}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Selected: {BUSINESS_COLORS.find(c => c.value === formData.color_code)?.name}
                                </p>
                            </div>

                            <div>
                                <Label>Meta Access Token</Label>
                                <Textarea
                                    value={formData.access_token}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, access_token: e.target.value })}
                                    placeholder="Paste your Meta access token here..."
                                    className="font-mono text-xs h-20"
                                    required={!editingBusiness} // Required only for new
                                />
                                <div className="flex justify-between items-start mt-1">
                                    <p className="text-xs text-muted-foreground">
                                        {editingBusiness
                                            ? "Leave as is to keep existing token, or paste new one to verify/update."
                                            : "Required for syncing ad data."}
                                    </p>
                                    <VerifyButton
                                        adAccountId={formData.ad_account_id}
                                        accessToken={formData.access_token}
                                    />
                                </div>
                            </div>

                            <Button type="submit" disabled={loading} className="w-full">
                                {loading ? 'Saving...' : (editingBusiness ? 'Update Business' : 'Create Business')}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-md bg-white">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Ad Account ID</TableHead>
                                <TableHead>Color</TableHead>
                                <TableHead>Token</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {initialData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">
                                        No businesses found. Add one to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                initialData.map((b) => (
                                    <TableRow key={b.id}>
                                        <TableCell className="font-medium whitespace-nowrap">
                                            <Link
                                                href={`/businesses/${b.id}/analytics`}
                                                className="hover:text-indigo-600 hover:underline decoration-indigo-600/30 underline-offset-4 transition-all"
                                            >
                                                {b.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs whitespace-nowrap">{b.ad_account_id}</TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-5 h-5 rounded-md border"
                                                    style={{ backgroundColor: b.color_code }}
                                                />
                                                <span className="text-[10px] text-muted-foreground">
                                                    {BUSINESS_COLORS.find(c => c.value === b.color_code)?.name || 'Custom'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            <span className="text-[10px] text-muted-foreground font-mono">
                                                {b.masked_token || 'Missing'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={b.is_active ? "default" : "secondary"} className="text-[10px] py-0 h-5">
                                                {b.is_active ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleOpenEdit(b)}
                                                className="h-8 w-8"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </>
    );
}
