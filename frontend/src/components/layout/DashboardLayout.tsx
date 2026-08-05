"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { useTranslation } from "@/lib/lang-context";
import {
    getMode,
    isCurrentUserDisabled,
    isLoggedIn,
    seedLocalData,
    setLoggedOut,
} from "@/lib/data";
import { OfflineBanner } from "./OfflineBanner";

export function DashboardLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const { t } = useTranslation();

    const handleLogout = async () => {
        if (getMode() === "firebase") {
            try {
                const { signOut } = await import("firebase/auth");
                const { auth } = await import("@/lib/firebase");
                await signOut(auth);
            } catch {
                /* ignore */
            }
        }
        setLoggedOut();
        router.push("/");
    };

    useEffect(() => {
        if (!isLoggedIn()) {
            router.replace("/");
            return;
        }
        // A freshly locked account is signed out on next navigation.
        isCurrentUserDisabled().then((locked) => {
            if (locked) {
                handleLogout();
            }
        });
        // Seed demo contacts once (no-op if already seeded / firebase mode).
        seedLocalData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]);

    return (
        <div className="min-h-screen bg-[#f8fafc] md:flex font-sans selection:bg-blue-100 selection:text-blue-900">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile top bar */}
                <header className="md:hidden sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#1e3a8a] flex items-center justify-center">
                            <Bell className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-gray-900 leading-none">NNLOMNE</p>
                            <p className="text-[8px] uppercase font-black tracking-[0.3em] text-blue-700/60 mt-0.5">
                                {t("nav_brand_sub")}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        aria-label={t("nav_logout")}
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </header>

                <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-5 md:px-10 md:py-10 pb-28 md:pb-12">
                    <OfflineBanner />
                    {children}
                </main>
            </div>

            <MobileNav />
        </div>
    );
}
