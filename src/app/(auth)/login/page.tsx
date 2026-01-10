"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, BarChart3, TrendingUp, Users, DollarSign, Zap, Target, MousePointer2 } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });

            if (res.ok) {
                router.push("/");
                router.refresh();
            } else {
                const data = await res.json();
                setError(data.error || "Login failed");
            }
        } catch {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-background">
            {/* Left Side - Login Form */}
            <div className="flex-1 flex flex-col justify-between px-8 lg:px-16 py-8">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-indigo-50 group-hover:scale-105 duration-300">
                        <BarChart3 className="w-6 h-6 text-indigo-600" />
                    </div>
                    <span className="text-xl font-bold text-slate-900 tracking-tight">Ads Tracker</span>
                </div>

                {/* Login Form */}
                <div className="max-w-md w-full mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome Back</h1>
                        <p className="text-sm text-slate-500 mt-2">Enter your email and password to access your account.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-3 text-sm font-medium text-rose-700 bg-rose-50 border border-rose-100 rounded-xl animate-in fade-in zoom-in duration-200">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-medium text-slate-500 uppercase tracking-wider">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@company.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-11 bg-white border-slate-100 focus:border-indigo-500 focus-visible:ring-indigo-500/20 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-xs font-medium text-slate-500 uppercase tracking-wider">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-11 bg-white border-slate-100 focus:border-indigo-500 focus-visible:ring-indigo-500/20 pr-10 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="remember"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                                />
                                <Label htmlFor="remember" className="text-sm text-slate-500 cursor-pointer hover:text-slate-600 transition-colors">
                                    Remember Me
                                </Label>
                            </div>
                            <a href="#" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline transition-colors">
                                Forgot Your Password?
                            </a>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.3)] hover:shadow-lg transition-all duration-300 active:scale-[0.98]"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                "Log In"
                            )}
                        </Button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="px-4 bg-background text-slate-400 uppercase tracking-wider font-medium">Or Login With</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-11 border-slate-100 hover:bg-slate-50 font-medium rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-lg transition-all duration-300"
                            >
                                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Google
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-11 border-slate-100 hover:bg-slate-50 font-medium rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-lg transition-all duration-300"
                            >
                                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                                </svg>
                                Apple
                            </Button>
                        </div>

                        <p className="text-center text-sm text-slate-500 mt-6">
                            Don&apos;t Have An Account?{" "}
                            <a href="#" className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline transition-colors">
                                Register Now.
                            </a>
                        </p>
                    </form>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                    <p>Copyright © 2025 Ads Tracker.</p>
                    <a href="#" className="hover:text-slate-600 hover:underline transition-colors">Privacy Policy</a>
                </div>
            </div>

            {/* Right Side - Illustration */}
            <div className="hidden lg:flex flex-1 bg-gradient-to-br from-indigo-600 via-indigo-600 to-purple-700 p-12 items-center justify-center relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-purple-400 blur-3xl"></div>
                </div>

                <div className="relative z-10 max-w-lg text-center">
                    {/* Header Text */}
                    <h2 className="text-4xl font-bold text-white mb-4 leading-tight tracking-tight">
                        Effortlessly manage your team and operations.
                    </h2>
                    <p className="text-indigo-100 mb-10 text-sm">
                        Log in to access your advertising dashboard and manage your campaigns.
                    </p>

                    {/* Dashboard Preview Card - Matching MetricsCard style */}
                    <Card className="overflow-hidden border-slate-100 shadow-2xl">
                        <CardContent className="p-6">
                            {/* Mini Stats Row */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="bg-gradient-to-br from-white to-slate-50/50 rounded-xl p-4 text-left border border-slate-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="p-1.5 rounded-lg bg-indigo-50">
                                            <DollarSign className="w-3 h-3 text-indigo-600" />
                                        </div>
                                    </div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Spend</p>
                                    <p className="text-lg font-bold text-slate-900 tracking-tight mt-1">$189,374</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                                        <span className="text-xs text-emerald-600 font-semibold">+12.5%</span>
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-white to-slate-50/50 rounded-xl p-4 text-left border border-slate-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="p-1.5 rounded-lg bg-purple-50">
                                            <Users className="w-3 h-3 text-purple-600" />
                                        </div>
                                    </div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Leads</p>
                                    <p className="text-lg font-bold text-slate-900 tracking-tight mt-1">6,248</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                                        <span className="text-xs text-emerald-600 font-semibold">+8.3%</span>
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-white to-slate-50/50 rounded-xl p-4 text-left border border-slate-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="p-1.5 rounded-lg bg-amber-50">
                                            <Zap className="w-3 h-3 text-amber-500" />
                                        </div>
                                    </div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Conv.</p>
                                    <p className="text-lg font-bold text-slate-900 tracking-tight mt-1">842</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                                        <span className="text-xs text-emerald-600 font-semibold">Active</span>
                                    </div>
                                </div>
                            </div>

                            {/* Chart Placeholder - Matching existing chart styles */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Performance Overview</span>
                                    </div>
                                    <span className="text-xs text-slate-400 font-medium">Last 7 days</span>
                                </div>
                                <div className="flex items-end gap-2 h-16">
                                    {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                                        <div
                                            key={i}
                                            className="flex-1 bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-md transition-all hover:from-indigo-600 hover:to-indigo-500"
                                            style={{ height: `${height}%` }}
                                        ></div>
                                    ))}
                                </div>
                                <div className="flex justify-between mt-2 text-xs text-slate-400 font-medium">
                                    <span>Mon</span>
                                    <span>Tue</span>
                                    <span>Wed</span>
                                    <span>Thu</span>
                                    <span>Fri</span>
                                    <span>Sat</span>
                                    <span>Sun</span>
                                </div>
                            </div>

                            {/* Bottom Stats Row */}
                            <div className="grid grid-cols-3 gap-3 mt-4">
                                <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="flex justify-center mb-1">
                                        <div className="p-1.5 rounded-lg bg-orange-50">
                                            <BarChart3 className="w-3 h-3 text-orange-500" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">CPM</p>
                                    <p className="text-sm font-bold text-slate-900">$4.82</p>
                                </div>
                                <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="flex justify-center mb-1">
                                        <div className="p-1.5 rounded-lg bg-blue-50">
                                            <MousePointer2 className="w-3 h-3 text-blue-500" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">CTR</p>
                                    <p className="text-sm font-bold text-slate-900">3.24%</p>
                                </div>
                                <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="flex justify-center mb-1">
                                        <div className="p-1.5 rounded-lg bg-rose-50">
                                            <Target className="w-3 h-3 text-rose-500" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">CPL</p>
                                    <p className="text-sm font-bold text-slate-900">$12.45</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
