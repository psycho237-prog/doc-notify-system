"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
    Home,
    Send,
    History,
    Users,
    Settings,
    Layers,
    UserCog,
    FileText,
    MoreHorizontal,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/lang-context";
import { isSuperAdmin, isSuperAdminAsync } from "@/lib/data";

const ICONS = {
    Home,
    Send,
    History,
    Users,
    Settings,
    Layers,
    UserCog,
    FileText,
};

const EXTRA_HREFS = ["/users", "/reports", "/settings"];

export function MobileNav() {
    const pathname = usePathname();
    const { t } = useTranslation();
    const [isAdmin, setIsAdmin] = useState(() => isSuperAdmin());
    const [moreOpen, setMoreOpen] = useState(false);

    useEffect(() => {
        let mounted = true;
        isSuperAdminAsync().then((ok) => {
            if (mounted) setIsAdmin(ok);
        });
        return () => {
            mounted = false;
        };
    }, []);

    // Close the "more" sheet when navigating away.
    useEffect(() => {
        setMoreOpen(false);
    }, [pathname]);

    // Core tabs always visible (max 5 keeps the bar clean).
    const tabs: { name: string; href: string; icon: keyof typeof ICONS }[] = [
        { name: t("nav_dashboard"), href: "/dashboard", icon: "Home" },
        { name: t("nav_notify"), href: "/notifications", icon: "Send" },
        { name: t("nav_groups"), href: "/groups", icon: "Layers" },
        { name: t("nav_history"), href: "/sms-history", icon: "History" },
        { name: t("nav_contacts"), href: "/records", icon: "Users" },
    ];

    // Secondary entries behind the "More" button.
    const extras: { name: string; href: string; icon: keyof typeof ICONS }[] = [
        ...(isAdmin
            ? [
                  { name: t("nav_users"), href: "/users", icon: "UserCog" as const },
                  { name: t("nav_reports"), href: "/reports", icon: "FileText" as const },
              ]
            : []),
        { name: t("nav_settings"), href: "/settings", icon: "Settings" },
    ];

    const isMoreActive = EXTRA_HREFS.some((h) => pathname.startsWith(h));

    const isTabActive = (href: string) =>
        href === "/dashboard" ? pathname === href : pathname.startsWith(href);

    return (
        <>
            <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
                <div
                    className="grid"
                    style={{ gridTemplateColumns: `repeat(${tabs.length + 1}, minmax(0, 1fr))` }}
                >
                    {tabs.map((item) => {
                        const isActive = isTabActive(item.href);
                        const Icon = ICONS[item.icon];
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 py-2.5 px-1 transition-colors min-w-0",
                                    isActive ? "text-[#1e3a8a]" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <Icon className="w-[20px] h-[20px]" strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[8px] font-black uppercase tracking-wide truncate w-full text-center">
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}
                    {/* More button */}
                    <button
                        onClick={() => setMoreOpen(true)}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 py-2.5 px-1 transition-colors min-w-0",
                            isMoreActive ? "text-[#1e3a8a]" : "text-gray-400 hover:text-gray-600"
                        )}
                        aria-label={t("nav_more")}
                    >
                        <MoreHorizontal
                            className="w-[20px] h-[20px]"
                            strokeWidth={isMoreActive ? 2.5 : 2}
                        />
                        <span className="text-[8px] font-black uppercase tracking-wide truncate w-full text-center">
                            {t("nav_more")}
                        </span>
                    </button>
                </div>
            </nav>

            {/* More bottom sheet */}
            {moreOpen && (
                <div className="md:hidden fixed inset-0 z-50">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setMoreOpen(false)}
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl shadow-2xl pb-[env(safe-area-inset-bottom)]">
                        <div className="flex items-center justify-between px-5 pt-4 pb-1">
                            <p className="text-sm font-black text-gray-900">{t("nav_more_title")}</p>
                            <button
                                onClick={() => setMoreOpen(false)}
                                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                                aria-label={t("common_close")}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="px-3 pb-4 pt-1 grid grid-cols-3 gap-1">
                            {extras.map((item) => {
                                const isActive = isTabActive(item.href);
                                const Icon = ICONS[item.icon];
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMoreOpen(false)}
                                        className={cn(
                                            "flex flex-col items-center gap-1.5 rounded-2xl px-2 py-4 transition-colors",
                                            isActive
                                                ? "bg-blue-50 text-[#1e3a8a]"
                                                : "text-gray-500 hover:bg-gray-50"
                                        )}
                                    >
                                        <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                                        <span className="text-[9px] font-black uppercase tracking-wide text-center">
                                            {item.name}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
