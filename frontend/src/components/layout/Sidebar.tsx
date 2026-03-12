"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    FileText,
    MessageSquare,
    Users,
    Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Records Management", href: "/records", icon: FileText },
    { name: "SMS History", href: "/sms-history", icon: MessageSquare },
    { name: "User Management", href: "/users", icon: Users },
    { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 sidebar-gradient h-screen flex flex-col text-white flex-shrink-0 relative z-20 shadow-xl">
            <div className="p-6 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-md bg-blue-500 flex items-center justify-center font-bold text-lg">
                    N
                </div>
                <span className="font-semibold text-xl tracking-tight">NNLOMNE Notify</span>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2 relative">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center space-x-3 px-4 py-3 rounded-md transition-all",
                                isActive ? "bg-blue-600 text-white shadow-md font-medium" : "text-gray-300 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-gray-400")} />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/10 mt-auto">
                <div className="flex items-center space-x-3 px-4 py-2 hover:bg-white/5 rounded-md cursor-pointer transition-colors">
                    <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center font-semibold text-sm border-2 border-white/20">
                        JD
                    </div>
                    <div>
                        <p className="text-sm font-medium">John Doe</p>
                        <p className="text-xs text-blue-300">Administrator</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
