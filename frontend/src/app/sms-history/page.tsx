"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Search,
    Download,
    CheckCircle2,
    XCircle,
    History,
    Loader2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useTranslation } from "@/lib/lang-context";
import { getLogs } from "@/lib/data";
import { downloadCsv, todayStamp } from "@/lib/csv";
import type { SmsLog } from "@/lib/types";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "sent" | "failed";

export default function SMSHistoryPage() {
    const { t, lang } = useTranslation();
    const [logs, setLogs] = useState<SmsLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

    useEffect(() => {
        (async () => {
            const data = await getLogs();
            setLogs(data);
            setLoading(false);
        })();
    }, []);

    const filteredLogs = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        return logs.filter((log) => {
            if (statusFilter !== "all" && log.status !== statusFilter) return false;
            if (!q) return true;
            return (
                log.name.toLowerCase().includes(q) ||
                log.phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""))
            );
        });
    }, [logs, searchTerm, statusFilter]);

    const handleExport = () => {
        const headers = ["ID", "Nom", "Téléphone", "Statut", "Date", "Message"];
        const rows = filteredLogs.map((l) => [
            l.id,
            l.name,
            l.phone,
            l.status,
            l.sentAt,
            l.message,
        ]);
        downloadCsv(`sms_logs_${todayStamp()}.csv`, headers, rows);
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return "—";
        return d.toLocaleString(lang === "fr" ? "fr-FR" : "en-GB", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    const filters: { key: StatusFilter; label: string }[] = [
        { key: "all", label: t("hist_filter_all") },
        { key: "sent", label: t("hist_filter_sent") },
        { key: "failed", label: t("hist_filter_failed") },
    ];

    return (
        <DashboardLayout>
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">{t("hist_title")}</h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">{t("hist_subtitle")}</p>
                </div>
                <button
                    onClick={handleExport}
                    disabled={filteredLogs.length === 0}
                    className="flex items-center gap-1.5 text-xs font-black text-[#1e3a8a] bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm transition-all hover:bg-blue-50 active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex-shrink-0"
                >
                    <Download className="w-4 h-4" /> {t("hist_export")}
                </button>
            </div>

            {/* Search + filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 mb-4 space-y-3">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t("hist_search")}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] transition-all placeholder:text-gray-300"
                    />
                </div>
                <div className="flex gap-2">
                    {filters.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setStatusFilter(f.key)}
                            className={cn(
                                "flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all",
                                statusFilter === f.key
                                    ? "bg-[#1e3a8a] text-white shadow-md"
                                    : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Logs */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-8 h-8 text-[#1e3a8a] animate-spin" />
                </div>
            ) : filteredLogs.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 text-center">
                    <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <History className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="font-black text-gray-900">{t("hist_empty")}</p>
                    <p className="text-sm text-gray-400 font-medium mt-1">{t("hist_empty_sub")}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredLogs.map((log) => (
                        <div
                            key={log.id}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
                        >
                            <div className="flex items-center gap-3">
                                {log.status === "sent" ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-gray-900 truncate">{log.name}</p>
                                    <p className="text-xs text-gray-400 font-mono">{log.phone}</p>
                                </div>
                                <span
                                    className={cn(
                                        "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                        log.status === "sent"
                                            ? "bg-green-50 text-green-700 border-green-100"
                                            : "bg-red-50 text-red-600 border-red-100"
                                    )}
                                >
                                    {log.status === "sent" ? t("hist_sent") : t("hist_failed")}
                                </span>
                            </div>
                            {log.message && (
                                <p className="mt-2.5 text-xs text-gray-500 font-medium leading-relaxed line-clamp-2">
                                    {log.message}
                                </p>
                            )}
                            {log.error && (
                                <p className="mt-1.5 text-[11px] text-red-500 font-medium">{log.error}</p>
                            )}
                            <p className="mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                                {formatDate(log.sentAt)}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}
