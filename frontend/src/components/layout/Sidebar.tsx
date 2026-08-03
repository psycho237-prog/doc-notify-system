"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Home,
    Send,
    History,
    Users,
    Settings,
    LogOut,
    Bell,
    ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/lang-context";
import { getMode, setLoggedOut } from "@/lib/data";

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { t } = useTranslation();

    const navItems = [
        { name: t("nav_dashboard"), href: "/dashboard", icon: Home },
        { name: t("nav_notify"), href: "/notifications", icon: Send },
        { name: t("nav_history"), href: "/sms-history", icon: History },
        { name: t("nav_contacts"), href: "/records", icon: Users },
        { name: t("nav_settings"), href: "/settings", icon: Settings },
    ];

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

    return (
        <aside className="hidden md:flex w-64 bg-[#1e3a8a] h-screen sticky top-0 flex-col text-white flex-shrink-0 shadow-2xl border-r border-white/5">
            <div className="p-7 flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white shadow-xl shadow-blue-900/50 flex items-center justify-center text-blue-900">
                    <Bell className="w-6 h-6" />
                </div>
                <div>
                    <span className="font-black text-xl tracking-tight leading-none block">NNLOMNE</span>
                    <span className="text-[9px] uppercase font-black tracking-[0.35em] text-blue-300">
                        {t("nav_brand_sub")}
                    </span>
                </div>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
                {navItems.map((item) => {
                    const isActive =
                        item.href === "/dashboard"
                            ? pathname === item.href
                            : pathname.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300",
                                isActive
                                    ? "bg-white text-blue-900 shadow-2xl shadow-blue-900/40 font-black"
                                    : "text-blue-100 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <Icon
                                className={cn(
                                    "w-5 h-5 transition-transform group-hover:scale-110",
                                    isActive ? "text-blue-900" : "text-blue-300/70"
                                )}
                            />
                            <span className="text-sm tracking-tight">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-4 border border-white/10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center font-black border border-white/20">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-black tracking-tight truncate">{t("nav_admin")}</p>
                        <p className="text-[9px] text-blue-300 font-extrabold uppercase tracking-widest">
                            {t("nav_logout")}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 bg-blue-900/50 hover:bg-red-500/10 hover:text-red-400 py-3 rounded-2xl transition-all font-black text-xs uppercase tracking-[0.2em] text-blue-200 border border-white/5"
                >
                    <LogOut className="w-4 h-4" /> {t("nav_logout")}
                </button>
            </div>
        </aside>
    );
}
