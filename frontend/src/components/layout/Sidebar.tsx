"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Home,
    FileText,
    MessageSquare,
    Users,
    Settings,
    LogOut,
    ShieldCheck,
    ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const navItems = [
    { name: "Executive Summary", href: "/dashboard", icon: Home },
    { name: "Registry Vault", href: "/records", icon: FileText },
    { name: "Communication Log", href: "/sms-history", icon: MessageSquare },
    { name: "Access Management", href: "/users", icon: Users },
    { name: "System Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            localStorage.removeItem("institutionId");
            router.push("/");
        } catch (err) {
            console.error("Logout error", err);
        }
    };

    return (
        <div className="w-80 bg-[#1e3a8a] h-screen flex flex-col text-white flex-shrink-0 relative z-20 shadow-2xl border-r border-white/5 font-sans">
            <div className="p-10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-xl shadow-blue-900/50 flex items-center justify-center text-blue-900 transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer">
                    <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                    <span className="font-black text-2xl tracking-tighter leading-none block">NNLOMNE</span>
                    <span className="text-[10px] uppercase font-black tracking-[0.4em] text-blue-300">Notify System</span>
                </div>
            </div>

            <nav className="flex-1 px-6 py-4 space-y-1">
                <div className="text-[10px] font-black text-blue-300/50 uppercase tracking-[0.3em] mb-4 ml-4">Architecture</div>
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 mb-1",
                                isActive
                                    ? "bg-white text-blue-900 shadow-2xl shadow-blue-900/40 font-black scale-[1.02]"
                                    : "text-blue-100 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-blue-900" : "text-blue-300/60")} />
                                <span className="text-sm tracking-tight">{item.name}</span>
                            </div>
                            {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-8 space-y-4">
                <div className="bg-white/5 rounded-3xl p-6 border border-white/10 hover:border-white/20 transition-all cursor-default">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center font-black text-lg border-2 border-white/20 shadow-lg shadow-blue-900/40">
                            AD
                        </div>
                        <div>
                            <p className="text-base font-black tracking-tight">System Admin</p>
                            <p className="text-[10px] text-blue-300 font-extrabold uppercase tracking-widest">Master Clearance</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 bg-blue-900/50 hover:bg-red-500/10 hover:text-red-400 py-3 rounded-2xl transition-all font-black text-xs uppercase tracking-[0.2em] text-blue-200 border border-white/5"
                    >
                        <LogOut className="w-4 h-4" /> Terminate Session
                    </button>
                </div>

                <div className="text-center">
                    <p className="text-[9px] text-blue-400/50 font-black uppercase tracking-[0.5em]">Lichtenberg Kamer &copy; 2026</p>
                </div>
            </div>
        </div>
    );
}
