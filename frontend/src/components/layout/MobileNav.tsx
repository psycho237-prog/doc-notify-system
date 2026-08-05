"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Send, History, Users, Settings, Layers, UserCog, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/lang-context";
import { isSuperAdminAsync } from "@/lib/data";

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

export function MobileNav() {
    const pathname = usePathname();
    const { t } = useTranslation();
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        let mounted = true;
        isSuperAdminAsync().then((ok) => {
            if (mounted) setIsAdmin(ok);
        });
        return () => {
            mounted = false;
        };
    }, []);

    const items: { name: string; href: string; icon: keyof typeof ICONS }[] = [
        { name: t("nav_dashboard"), href: "/dashboard", icon: "Home" },
        { name: t("nav_notify"), href: "/notifications", icon: "Send" },
        { name: t("nav_groups"), href: "/groups", icon: "Layers" },
        { name: t("nav_history"), href: "/sms-history", icon: "History" },
        { name: t("nav_contacts"), href: "/records", icon: "Users" },
        ...(isAdmin
            ? [
                  { name: t("nav_users"), href: "/users", icon: "UserCog" as const },
                  { name: t("nav_reports"), href: "/reports", icon: "FileText" as const },
              ]
            : []),
        { name: t("nav_settings"), href: "/settings", icon: "Settings" },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
            <div
                className="grid"
                style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
            >
                {items.map((item) => {
                    const isActive =
                        item.href === "/dashboard"
                            ? pathname === item.href
                            : pathname.startsWith(item.href);
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
            </div>
        </nav>
    );
}
