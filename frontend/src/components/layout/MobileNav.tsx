"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Send, History, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/lang-context";

const ICONS = {
    Home,
    Send,
    History,
    Users,
    Settings,
};

export function MobileNav() {
    const pathname = usePathname();
    const { t } = useTranslation();

    const items = [
        { name: t("nav_dashboard"), href: "/dashboard", icon: "Home" as const },
        { name: t("nav_notify"), href: "/notifications", icon: "Send" as const },
        { name: t("nav_history"), href: "/sms-history", icon: "History" as const },
        { name: t("nav_contacts"), href: "/records", icon: "Users" as const },
        { name: t("nav_settings"), href: "/settings", icon: "Settings" as const },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
            <div className="grid grid-cols-5">
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
                                "flex flex-col items-center gap-1 py-2.5 transition-colors",
                                isActive ? "text-[#1e3a8a]" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[9px] font-black uppercase tracking-wide">
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
