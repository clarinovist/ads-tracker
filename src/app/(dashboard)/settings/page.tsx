"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Lock,
    Database,
    UserCircle,
    Loader2,
    CheckCircle2,
    XCircle
} from "lucide-react";
import { useEffect, useState } from "react";

export default function SettingsPage() {
    // System Settings State
    const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
    const [isSyncLoading, setIsSyncLoading] = useState(true);
    const [isSyncSaving, setIsSyncSaving] = useState(false);

    // Profile State
    const [profile, setProfile] = useState({ name: "", email: "" });
    const [isProfileLoading, setIsProfileLoading] = useState(true);
    const [isProfileSaving, setIsProfileSaving] = useState(false);
    const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Password State
    const [passwords, setPasswords] = useState({ current: "", new: "" });
    const [isPasswordSaving, setIsPasswordSaving] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        // Fetch System Settings
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                setAutoSyncEnabled(data.auto_sync_enabled);
                setIsSyncLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch settings:', err);
                setIsSyncLoading(false);
            });

        // Fetch Profile
        fetch('/api/user/profile')
            .then(res => res.json())
            .then(data => {
                if (data.id) {
                    setProfile({ name: data.name, email: data.email });
                }
                setIsProfileLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch profile:', err);
                setIsProfileLoading(false);
            });
    }, []);

    const handleToggleAutoSync = async () => {
        setIsSyncSaving(true);
        const newValue = !autoSyncEnabled;

        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ auto_sync_enabled: newValue })
            });

            if (response.ok) {
                setAutoSyncEnabled(newValue);
            } else {
                console.error('Failed to update setting');
            }
        } catch (error) {
            console.error('Error updating setting:', error);
        } finally {
            setIsSyncSaving(false);
        }
    };

    const handleSaveProfile = async () => {
        setIsProfileSaving(true);
        setProfileMessage(null);

        try {
            const response = await fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: profile.name })
            });

            const data = await response.json();

            if (response.ok) {
                setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
                setProfile(prev => ({ ...prev, name: data.name }));
            } else {
                setProfileMessage({ type: 'error', text: data.error || 'Failed to update profile' });
            }
        } catch {
            setProfileMessage({ type: 'error', text: 'An unexpected error occurred' });
        } finally {
            setIsProfileSaving(false);
            setTimeout(() => setProfileMessage(null), 3000);
        }
    };

    const handleUpdatePassword = async () => {
        if (!passwords.current || !passwords.new) {
            setPasswordMessage({ type: 'error', text: 'Please fill in both fields' });
            return;
        }

        setIsPasswordSaving(true);
        setPasswordMessage(null);

        try {
            const response = await fetch('/api/user/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwords.current,
                    newPassword: passwords.new
                })
            });

            const data = await response.json();

            if (response.ok) {
                setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
                setPasswords({ current: "", new: "" });
            } else {
                setPasswordMessage({ type: 'error', text: data.error || 'Failed to update password' });
            }
        } catch {
            setPasswordMessage({ type: 'error', text: 'An unexpected error occurred' });
        } finally {
            setIsPasswordSaving(false);
            setTimeout(() => setPasswordMessage(null), 3000);
        }
    };

    return (
        <div className="space-y-6 md:space-y-8">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Settings</h2>
                </div>
                <p className="text-sm text-slate-500 ml-3">Manage your platform preferences and system configuration.</p>
            </div>

            <div className="grid gap-6">
                {/* Profile Settings */}
                <Card className="border-slate-200">
                    <CardHeader className="border-b bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <UserCircle className="h-5 w-5 text-blue-500" />
                            <div>
                                <CardTitle className="text-lg">Profile Information</CardTitle>
                                <CardDescription>Update your personal details and public profile.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    value={profile.name}
                                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                                    disabled={isProfileLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" value={profile.email} disabled />
                            </div>
                        </div>

                        {profileMessage && (
                            <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${profileMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                }`}>
                                {profileMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                {profileMessage.text}
                            </div>
                        )}

                        <Button
                            className="bg-slate-900"
                            onClick={handleSaveProfile}
                            disabled={isProfileSaving || isProfileLoading}
                        >
                            {isProfileSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </CardContent>
                </Card>

                {/* Security Settings */}
                <Card className="border-slate-200">
                    <CardHeader className="border-b bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <Lock className="h-5 w-5 text-rose-500" />
                            <div>
                                <CardTitle className="text-lg">Security & Password</CardTitle>
                                <CardDescription>Secure your account with a strong password.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="max-w-md space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current">Current Password</Label>
                                <Input
                                    id="current"
                                    type="password"
                                    value={passwords.current}
                                    onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new">New Password</Label>
                                <Input
                                    id="new"
                                    type="password"
                                    value={passwords.new}
                                    onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                                />
                            </div>
                        </div>

                        {passwordMessage && (
                            <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${passwordMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                }`}>
                                {passwordMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                {passwordMessage.text}
                            </div>
                        )}

                        <Button
                            variant="outline"
                            onClick={handleUpdatePassword}
                            disabled={isPasswordSaving}
                        >
                            {isPasswordSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Password
                        </Button>
                    </CardContent>
                </Card>

                {/* System Settings */}
                <Card className="border-slate-200">
                    <CardHeader className="border-b bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <Database className="h-5 w-5 text-purple-500" />
                            <div>
                                <CardTitle className="text-lg">Data Sync Configuration</CardTitle>
                                <CardDescription>Control how and when your data is synchronized.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div>
                                <p className="font-semibold text-slate-900">Automated Daily Sync</p>
                                <p className="text-sm text-slate-500">Sync data every night at 00:00 UTC.</p>
                            </div>
                            <button
                                onClick={handleToggleAutoSync}
                                disabled={isSyncLoading || isSyncSaving}
                                className={`relative h-6 w-11 rounded-full transition-colors ${autoSyncEnabled ? 'bg-blue-600' : 'bg-slate-300'
                                    } ${isSyncSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <span
                                    className={`absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full transition-transform ${autoSyncEnabled ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 opacity-50">
                            <div>
                                <p className="font-semibold text-slate-900">Historical Backfill (30 days)</p>
                                <p className="text-sm text-slate-500">Automatically backfill data for new businesses.</p>
                            </div>
                            <div className="h-6 w-11 bg-slate-300 rounded-full cursor-not-allowed" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
