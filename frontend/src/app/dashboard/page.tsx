"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Users as UsersIcon,
    Send,
    History,
    CheckCircle2,
    XCircle,
    ChevronRight,
    Loader2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useTranslation } from "@/lib/lang-context";
import { getLogs, getStats } from "@/lib/data";
import type { SmsLog, Stats } from "@/lib/types";

export default function DashboardPage() {
    const { t, lang } = useTranslation();
    const [stats, setStats] = useState<Stats | null>(null);
    const [recent, setRecent] = useState<SmsLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const [s, logs] = await Promise.all([getStats(), getLogs()]);
            setStats(s);
            setRecent(logs.slice(0, 5));
            setLoading(false);
        })();
    }, []);

    const statCards = stats
        ? [
              {
                  label: t("dash_contacts"),
                  value: stats.totalContacts,
                  icon: <UsersIcon className="w-5 h-5" />,
                  bg: "bg-blue-50 text-blue-700",
              },
              {
                  label: t("dash_sent_today"),
                  value: stats.sentToday,
                  icon: <Send className="w-5 h-5" />,
                  bg: "bg-indigo-50 text-indigo-700",
              },
              {
                  label: t("dash_total_sent"),
                  value: stats.totalSent,
                  icon: <History className="w-5 h-5" />,
                  bg: "bg-green-50 text-green-700",
              },
              {
                  label: t("dash_success_rate"),
                  value: `${stats.successRate}%`,
                  icon: <CheckCircle2 className="w-5 h-5" />,
                  bg: "bg-orange-50 text-orange-700",
              },
          ]
        : [];

    const formatShortDate = (iso: string) => {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return "—";
        return d.toLocaleString(lang === "fr" ? "fr-FR" : "en-GB", {
            dateStyle: "short",
            timeStyle: "short",
        });
    };

    return (
        <DashboardLayout>
            {/* Greeting */}
            <div className="mb-6">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">{t("dash_title")}</h1>
                <p className="text-sm text-gray-500 font-medium mt-1">{t("dash_subtitle")}</p>
            </div>

            {/* Stats */}
            {loading || !stats ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-8 h-8 text-[#1e3a8a] animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 mb-8">
                    {statCards.map((card, i) => (
                        <div
                            key={i}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 active:scale-[0.98] transition-transform"
                        >
                            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                                {card.icon}
                            </div>
                            <p className="text-2xl font-black text-gray-900 tracking-tight leading-none">
                                {card.value}
                            </p>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mt-1.5">
                                {card.label}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Quick actions */}
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3">
                {t("dash_quick_actions")}
            </h2>
            <div className="space-y-3 mb-8">
                <Link
                    href="/notifications"
                    className="flex items-center gap-4 bg-[#1e3a8a] text-white rounded-2xl p-5 shadow-lg shadow-blue-900/20 active:scale-[0.99] transition-all hover:bg-blue-900"
                >
                    <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                        <Send className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-black text-base">{t("dash_send_notif")}</p>
                        <p className="text-xs text-blue-200 font-medium">{t("dash_send_desc")}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-blue-200" />
                </Link>
                <Link
                    href="/sms-history"
                    className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 active:scale-[0.99] transition-all hover:border-blue-200"
                >
                    <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center">
                        <History className="w-6 h-6 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-black text-gray-900 text-base">{t("dash_view_history")}</p>
                        <p className="text-xs text-gray-400 font-medium">{t("hist_subtitle")}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                </Link>
            </div>

            {/* Recent activity */}
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3">
                {t("dash_recent")}
            </h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
                {recent.length === 0 ? (
                    <p className="px-5 py-10 text-center text-sm text-gray-400 font-medium">
                        {t("dash_empty")}
                    </p>
                ) : (
                    recent.map((log) => (
                        <div key={log.id} className="flex items-center gap-3 px-5 py-3.5">
                            {log.status === "sent" ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">{log.name}</p>
                                <p className="text-xs text-gray-400 truncate">{log.phone}</p>
                            </div>
                            <span className="text-[10px] text-gray-400 font-bold flex-shrink-0">
                                {formatShortDate(log.sentAt)}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </DashboardLayout>
    );
}
