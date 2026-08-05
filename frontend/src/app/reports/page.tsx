"use client";

import { useEffect, useMemo, useState } from "react";
import {
    ShieldCheck,
    Loader2,
    Download,
    Users as UsersIcon,
    CheckCircle2,
    XCircle,
    Clock,
    ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useTranslation } from "@/lib/lang-context";
import { getCurrentUserAsync, getUsersAsync, getUserLogs } from "@/lib/data";
import { downloadSmsReportPdf, formatPdfDate } from "@/lib/pdf";
import type { SmsLog, UserAccount } from "@/lib/types";
import { cn } from "@/lib/utils";

type Period = "all" | "today" | "7" | "30";

const pad = (n: number) => String(n).padStart(2, "0");
const toDateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const daysAgoInput = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return toDateInput(d);
};
const todayInput = () => toDateInput(new Date());

/** "yyyy-mm-dd" → "dd/mm/yyyy" (for the PDF period label). */
const fmtDateInput = (value: string) => {
    if (!value) return "—";
    const [y, m, d] = value.split("-");
    return d && m && y ? `${d}/${m}/${y}` : value;
};

export default function ReportsPage() {
    const { t, lang } = useTranslation();

    const [allowed, setAllowed] = useState<boolean | null>(null);
    const [users, setUsers] = useState<UserAccount[]>([]);
    const [accountId, setAccountId] = useState("");
    const [logs, setLogs] = useState<SmsLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        (async () => {
            const me = await getCurrentUserAsync();
            setAllowed(me?.role === "superadmin");
            const all = await getUsersAsync();
            setUsers(all);
            setLoading(false);
        })();
    }, []);

    useEffect(() => {
        if (!accountId) {
            setLogs([]);
            return;
        }
        let mounted = true;
        (async () => {
            const data = await getUserLogs(accountId);
            if (mounted) setLogs(data);
        })();
        return () => {
            mounted = false;
        };
    }, [accountId]);

    const account = useMemo(
        () => users.find((u) => u.id === accountId) ?? null,
        [users, accountId]
    );

    /** Which preset the current from/to values match (or "custom"). */
    const activePeriod: Period | "custom" = useMemo(() => {
        const today = todayInput();
        if (!fromDate && !toDate) return "all";
        if (fromDate === today && toDate === today) return "today";
        if (fromDate === daysAgoInput(6) && toDate === today) return "7";
        if (fromDate === daysAgoInput(29) && toDate === today) return "30";
        return "custom";
    }, [fromDate, toDate]);

    const applyPreset = (p: Period) => {
        const today = todayInput();
        if (p === "all") {
            setFromDate("");
            setToDate("");
        } else if (p === "today") {
            setFromDate(today);
            setToDate(today);
        } else if (p === "7") {
            setFromDate(daysAgoInput(6));
            setToDate(today);
        } else {
            setFromDate(daysAgoInput(29));
            setToDate(today);
        }
    };

    const filtered = useMemo(() => {
        const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
        const to = toDate ? new Date(`${toDate}T23:59:59.999`) : null;
        return logs.filter((l) => {
            const d = new Date(l.sentAt);
            if (Number.isNaN(d.getTime())) return false;
            if (from && d < from) return false;
            if (to && d > to) return false;
            return true;
        });
    }, [logs, fromDate, toDate]);

    const periodLabel = useMemo(() => {
        if (activePeriod === "all") return t("reports_period_all");
        if (activePeriod === "today") return t("reports_period_today");
        if (activePeriod === "7") return t("reports_period_7");
        if (activePeriod === "30") return t("reports_period_30");
        return t("reports_date_range")
            .replace("{from}", fmtDateInput(fromDate))
            .replace("{to}", fmtDateInput(toDate));
    }, [activePeriod, fromDate, toDate, t]);

    const stats = useMemo(() => {
        const sent = filtered.filter((l) => l.status === "sent").length;
        const failed = filtered.filter((l) => l.status === "failed").length;
        const queued = filtered.filter((l) => l.status === "queued").length;
        return { sent, failed, queued };
    }, [filtered]);

    const handleDownload = () => {
        if (!account || filtered.length === 0) return;
        setGenerating(true);
        try {
            const institution = "NNLOMNE Administrative";
            const generatedAt = `${t("pdf_generated")} ${new Date().toLocaleString(
                lang === "fr" ? "fr-FR" : "en-GB",
                { dateStyle: "short", timeStyle: "short" }
            )}`;
            const rows = filtered.map((l) => {
                const { date, time } = formatPdfDate(l.sentAt);
                return {
                    name: l.name,
                    phone: l.phone,
                    date,
                    time,
                    message: l.message,
                    status: l.status === "queued" ? ("queued" as const) : l.status === "failed" ? ("failed" as const) : ("sent" as const),
                };
            });
            const stamp = new Date().toISOString().slice(0, 10);
            downloadSmsReportPdf(`rapport_${account.email.split("@")[0]}_${stamp}.pdf`, {
                institution,
                account: `${account.name} (${account.email})`,
                period: periodLabel,
                generatedAt,
                rows,
                labels: {
                    report: t("pdf_report"),
                    accountLabel: t("pdf_account"),
                    periodLabel: t("pdf_period"),
                    generatedLabel: t("pdf_generated"),
                    page: t("pdf_page"),
                    status: t("pdf_status"),
                    name: t("pdf_name"),
                    phone: t("pdf_phone"),
                    date: t("pdf_date"),
                    time: t("pdf_time"),
                    message: t("pdf_message"),
                    sent: t("pdf_status_sent"),
                    failed: t("pdf_status_failed"),
                    queued: t("pdf_status_queued"),
                },
            });
        } finally {
            setGenerating(false);
        }
    };

    if (!loading && allowed === false) {
        return (
            <DashboardLayout>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 text-center px-6">
                    <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <ShieldCheck className="w-7 h-7 text-red-400" />
                    </div>
                    <p className="font-black text-gray-900">{t("users_denied")}</p>
                    <p className="text-sm text-gray-400 font-medium mt-1.5 max-w-xs mx-auto">
                        {t("users_denied_sub")}
                    </p>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 mt-5 text-xs font-black text-[#1e3a8a] bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 transition-all hover:bg-blue-100"
                    >
                        <ArrowLeft className="w-4 h-4" /> {t("users_denied_btn")}
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    const periods: { key: Period; label: string }[] = [
        { key: "all", label: t("reports_period_all") },
        { key: "today", label: t("reports_period_today") },
        { key: "7", label: t("reports_period_7") },
        { key: "30", label: t("reports_period_30") },
    ];

    return (
        <DashboardLayout>
            <div className="mb-5">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">{t("reports_title")}</h1>
                <p className="text-sm text-gray-500 font-medium mt-1">{t("reports_subtitle")}</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-8 h-8 text-[#1e3a8a] animate-spin" />
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Account picker */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">
                            {t("reports_account")}
                        </label>
                        <select
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] transition-all bg-white"
                        >
                            <option value="">{t("reports_account_placeholder")}</option>
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name} — {u.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    {account ? (
                        <>
                            {/* Period: presets + from/to dates */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                                    {t("reports_period")}
                                </label>
                                <div className="flex gap-2 mb-3">
                                    {periods.map((p) => (
                                        <button
                                            key={p.key}
                                            onClick={() => applyPreset(p.key)}
                                            className={cn(
                                                "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all",
                                                activePeriod === p.key
                                                    ? "bg-[#1e3a8a] text-white shadow-md"
                                                    : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                                            )}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                                            {t("reports_from")}
                                        </label>
                                        <input
                                            type="date"
                                            value={fromDate}
                                            max={toDate || undefined}
                                            onChange={(e) => setFromDate(e.target.value)}
                                            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] transition-all bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                                            {t("reports_to")}
                                        </label>
                                        <input
                                            type="date"
                                            value={toDate}
                                            min={fromDate || undefined}
                                            onChange={(e) => setToDate(e.target.value)}
                                            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] transition-all bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-1" />
                                    <p className="text-2xl font-black text-green-700 leading-none">{stats.sent}</p>
                                    <p className="text-[10px] font-bold text-green-600/70 uppercase tracking-wide mt-1.5">
                                        {t("reports_summary_sent")}
                                    </p>
                                </div>
                                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
                                    <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
                                    <p className="text-2xl font-black text-red-600 leading-none">{stats.failed}</p>
                                    <p className="text-[10px] font-bold text-red-500/70 uppercase tracking-wide mt-1.5">
                                        {t("reports_summary_failed")}
                                    </p>
                                </div>
                                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
                                    <Clock className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                                    <p className="text-2xl font-black text-amber-700 leading-none">{stats.queued}</p>
                                    <p className="text-[10px] font-bold text-amber-600/70 uppercase tracking-wide mt-1.5">
                                        {t("reports_summary_queued")}
                                    </p>
                                </div>
                            </div>

                            {/* Download */}
                            <button
                                onClick={handleDownload}
                                disabled={generating || filtered.length === 0}
                                className="w-full flex items-center justify-center gap-2 bg-[#1e3a8a] hover:bg-blue-900 text-white py-5 rounded-2xl font-black text-base shadow-xl shadow-blue-900/25 transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
                            >
                                {generating ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Download className="w-5 h-5" />
                                )}
                                {t("reports_download")}
                            </button>

                            {/* Preview */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-sm font-black text-gray-900 px-4 pt-4 pb-2">
                                    {t("reports_recent")}
                                </p>
                                {filtered.length === 0 ? (
                                    <p className="px-4 pb-6 text-sm text-gray-400 font-medium">
                                        {t("reports_empty")}
                                    </p>
                                ) : (
                                    <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                                        {filtered.slice(0, 10).map((l) => (
                                            <div key={l.id} className="flex items-center gap-3 px-4 py-3">
                                                {l.status === "sent" ? (
                                                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                ) : l.status === "queued" ? (
                                                    <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 truncate">
                                                        {l.name}
                                                    </p>
                                                    <p className="text-xs text-gray-400 font-mono truncate">
                                                        {l.phone} · {l.message}
                                                    </p>
                                                </div>
                                                <span className="text-[10px] text-gray-400 font-bold flex-shrink-0">
                                                    {new Date(l.sentAt).toLocaleString(
                                                        lang === "fr" ? "fr-FR" : "en-GB",
                                                        { dateStyle: "short", timeStyle: "short" }
                                                    )}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-14 text-center">
                            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <UsersIcon className="w-7 h-7 text-[#1e3a8a]" />
                            </div>
                            <p className="font-black text-gray-900">{t("reports_no_account")}</p>
                        </div>
                    )}
                </div>
            )}
        </DashboardLayout>
    );
}
