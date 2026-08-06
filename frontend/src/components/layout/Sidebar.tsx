"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
    Home,
    Send,
    History,
    Users,
    Settings,
    LogOut,
    Bell,
    ShieldCheck,
    Layers,
    UserCog,
    FileText,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/lang-context";
import { getMode, isSuperAdmin, isSuperAdminAsync, setLoggedOut } from "@/lib/data";

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { t } = useTranslation();
    const [isAdmin, setIsAdmin] = useState(() => isSuperAdmin());

    useEffect(() => {
        let mounted = true;
        isSuperAdminAsync().then((ok) => {
            if (mounted) setIsAdmin(ok);
        });
        return () => {
            mounted = false;
        };
    }, []);

    const navItems = [
        { name: t("nav_dashboard"), href: "/dashboard", icon: Home },
        { name: t("nav_notify"), href: "/notifications", icon: Send },
        { name: t("nav_groups"), href: "/groups", icon: Layers },
        { name: t("nav_history"), href: "/sms-history", icon: History },
        { name: t("nav_contacts"), href: "/records", icon: Users },
        { name: t("nav_settings"), href: "/settings", icon: Settings },
    ];

    const adminItems = [
        { name: t("nav_users"), href: "/users", icon: UserCog },
        { name: t("nav_reports"), href: "/reports", icon: FileText },
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

    const renderLink = (
        item: { name: string; href: string; icon: LucideIcon },
        isActive: boolean
    ) => {
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
    };

    const isPathActive = (href: string) =>
        href === "/dashboard" ? pathname === href : pathname.startsWith(href);

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

            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => renderLink(item, isPathActive(item.href)))}

                {isAdmin && (
                    <>
                        <p className="px-5 pt-4 pb-1 text-[9px] font-black uppercase tracking-[0.3em] text-blue-300/60">
                            {t("nav_admin")}
                        </p>
                        {adminItems.map((item) => renderLink(item, isPathActive(item.href)))}
                    </>
                )}
            </nav>

            <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-4 border border-white/10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center font-black border border-white/20">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-black tracking-tight truncate">
                            {isAdmin ? t("nav_admin") : t("login_role_user")}
                        </p>
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
