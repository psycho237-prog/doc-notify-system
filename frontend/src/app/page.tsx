"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Lock, Languages, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useTranslation } from "@/lib/lang-context";
import {
    bootstrapFirebaseAdmin,
    getMode,
    getUsersAsync,
    isLoggedIn,
    loginUser,
    setLoggedIn,
} from "@/lib/data";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isOffline, setIsOffline] = useState(false);
    const router = useRouter();
    const { t, lang, setLang } = useTranslation();

    const isFirebaseMode = getMode() === "firebase";

    useEffect(() => {
        // If already authenticated (cached session in localStorage), go straight to dashboard.
        if (isLoggedIn()) {
            router.replace("/dashboard");
            return;
        }

        const checkOffline = () => {
            const offline = typeof navigator !== "undefined" && !navigator.onLine;
            setIsOffline(offline);
            // Only auto-redirect offline if a session already exists for a specific user.
            // isLoggedIn() was already checked above; at this point there is no session,
            // so we just show the offline notice without granting any access.
        };

        checkOffline();

        window.addEventListener("online", checkOffline);
        window.addEventListener("offline", checkOffline);
        return () => {
            window.removeEventListener("online", checkOffline);
            window.removeEventListener("offline", checkOffline);
        };
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (typeof navigator !== "undefined" && !navigator.onLine) {
                // Offline: always try credential match first so the correct user/role is used.
                if (email && password) {
                    try {
                        const user = loginUser(email, password);
                        if (user) {
                            router.push("/dashboard");
                            return;
                        }
                    } catch (err) {
                        if ((err as Error)?.message === "disabled") throw err;
                    }
                }
                // No matching local account — refuse access; don't silently grant admin.
                throw new Error("invalid");
            }

            if (isFirebaseMode) {
                try {
                    const cred = await signInWithEmailAndPassword(auth, email, password);
                    // First sign-in promotes the default admin and migrates legacy data.
                    await bootstrapFirebaseAdmin();
                    // Locked accounts cannot sign in even with valid credentials.
                    const users = await getUsersAsync();
                    const account = users.find((u) => u.id === cred.user.uid);
                    if (account?.disabled) {
                        await signOut(auth).catch(() => {});
                        throw new Error("disabled");
                    }
                    setLoggedIn(cred.user.uid);
                } catch (firebaseErr: unknown) {
                    const msg = (firebaseErr as Error)?.message || "";
                    if (msg === "disabled") throw firebaseErr;

                    // Network/offline error → try local credentials with correct role.
                    if (
                        (typeof navigator !== "undefined" && !navigator.onLine) ||
                        msg.includes("network") ||
                        msg.includes("offline")
                    ) {
                        if (email && password) {
                            try {
                                const user = loginUser(email, password);
                                if (user) {
                                    router.push("/dashboard");
                                    return;
                                }
                            } catch (err) {
                                if ((err as Error)?.message === "disabled") throw err;
                            }
                        }
                        // Still no match → refuse access.
                        throw new Error("invalid");
                    }
                    throw firebaseErr;
                }
            } else {
                // Local mode: account logs in with its exact role (user or superadmin).
                const user = loginUser(email, password);
                if (!user) throw new Error("invalid");
            }
            router.push("/dashboard");
        } catch (err) {
            if ((err as Error)?.message === "disabled") setError(t("login_error_disabled"));
            else setError(isFirebaseMode ? t("login_error_firebase") : t("login_error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center flex-col relative py-12 px-4 font-sans">
            {/* Language toggle */}
            <div className="absolute top-6 right-6 flex items-center gap-1 bg-white rounded-2xl p-1 shadow-md border border-gray-100">
                {(["fr", "en"] as const).map((l) => (
                    <button
                        key={l}
                        onClick={() => setLang(l)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            lang === l
                                ? "bg-[#1e3a8a] text-white shadow-md"
                                : "text-gray-500 hover:text-gray-900"
                        }`}
                    >
                        <Languages className="w-3 h-3" /> {l}
                    </button>
                ))}
            </div>

            <div className="w-full max-w-sm space-y-8 flex flex-col items-center">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-[#1e3a8a] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20 mb-5">
                        <Bell className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight text-center">
                        {t("login_title")}
                    </h1>
                    <p className="mt-1.5 text-sm text-gray-500 text-center font-medium">
                        {t("login_subtitle")}
                    </p>
                </div>

                {isOffline && (
                    <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-2.5">
                        <WifiOff className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <p className="text-xs font-bold text-amber-800 leading-tight">
                            {t("login_offline_notice")}
                        </p>
                    </div>
                )}

                <div className="w-full bg-white shadow-xl rounded-3xl p-6 border border-gray-100">
                    <form className="space-y-4" onSubmit={handleLogin}>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                {t("login_email")}
                            </label>
                            <input
                                type="email"
                                required
                                autoComplete="email"
                                value={email}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setEmail(e.target.value)
                                }
                                placeholder="admin@nnlomne.gov"
                                className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] transition-all text-sm font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                {t("login_password")}
                            </label>
                            <input
                                type="password"
                                required
                                autoComplete="current-password"
                                value={password}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setPassword(e.target.value)
                                }
                                placeholder="••••••••"
                                className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] transition-all font-mono"
                            />
                        </div>

                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#1e3a8a] hover:bg-blue-900 text-white py-4 rounded-xl font-black shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98]"
                        >
                            {loading ? t("login_loading") : t("login_btn")}
                        </Button>

                        {!isFirebaseMode && (
                            <p className="text-center text-[11px] text-gray-400 font-medium pt-1">
                                {t("login_default_hint")}
                            </p>
                        )}

                        <div className="pt-2 flex items-center justify-center gap-2 text-gray-400 text-xs border-t border-gray-100">
                            <Lock className="w-3.5 h-3.5" />
                            <span>{t("login_secure")}</span>
                        </div>
                    </form>
                </div>

                <p className="text-center text-xs text-gray-400">{t("login_rights")}</p>
            </div>
        </div>
    );
}
