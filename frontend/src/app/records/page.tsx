"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Search,
    UserPlus,
    Trash2,
    Users,
    Loader2,
    Smartphone,
    Send,
    Download,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/lang-context";
import {
    addRecipient,
    deleteRecipients,
    getRecipients,
    loadSelectedIds,
    saveSelectedIds,
    setPendingSelection,
} from "@/lib/data";
import { downloadCsv, todayStamp } from "@/lib/csv";
import { detectCamNetwork, isValidCamPhone } from "@/lib/phone-utils";
import type { Recipient } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function RecordsPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const [contacts, setContacts] = useState<Recipient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [busy, setBusy] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(() => new Set(loadSelectedIds()));

    /** Updates the selection and persists it (survives back navigation). */
    const updateSelection = (updater: (prev: Set<string>) => Set<string>) => {
        setSelected((prev) => {
            const next = updater(prev);
            saveSelectedIds([...next]);
            return next;
        });
    };

    const refresh = async () => {
        setContacts(await getRecipients());
        setLoading(false);
    };

    useEffect(() => {
        (async () => {
            const loaded = await getRecipients();
            setContacts(loaded);
            setLoading(false);
            // Drop ids that no longer exist (e.g. deleted elsewhere).
            const valid = new Set(loaded.map((c) => c.id));
            setSelected((prev) => {
                const next = new Set([...prev].filter((id) => valid.has(id)));
                if (next.size !== prev.size) saveSelectedIds([...next]);
                return next;
            });
        })();
    }, []);

    const filtered = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return contacts;
        return contacts.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                c.phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""))
        );
    }, [contacts, searchTerm]);

    /* ── Selection helpers ─────────────────────────────────────── */

    const visibleIds = useMemo(() => filtered.map((c) => c.id), [filtered]);
    const allVisibleSelected =
        visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
    const someVisibleSelected = visibleIds.some((id) => selected.has(id));

    // Native indeterminate state (dash) when only part of the list is checked.
    const selectAllRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (selectAllRef.current) {
            selectAllRef.current.indeterminate =
                !allVisibleSelected && someVisibleSelected;
        }
    }, [allVisibleSelected, someVisibleSelected]);

    const toggle = (id: string) => {
        updateSelection((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        updateSelection((prev) => {
            const next = new Set(prev);
            if (allVisibleSelected) {
                visibleIds.forEach((id) => next.delete(id));
            } else {
                visibleIds.forEach((id) => next.add(id));
            }
            return next;
        });
    };

    const clearSelection = () => updateSelection(() => new Set());

    const notifySelected = () => {
        const chosen = contacts.filter((c) => selected.has(c.id));
        if (chosen.length === 0) return;
        setPendingSelection(chosen.map((c) => ({ name: c.name, phone: c.phone })));
        router.push("/notifications");
    };

    const handleExport = () => {
        const headers = ["Nom", "Téléphone", "Réseau", "Ajouté le"];
        const rows = filtered.map((c) => {
            const added = new Date(c.createdAt);
            return [
                c.name,
                c.phone,
                detectCamNetwork(c.phone),
                Number.isNaN(added.getTime()) ? "" : added.toISOString().split("T")[0],
            ];
        });
        downloadCsv(`contacts_${todayStamp()}.csv`, headers, rows);
    };

    const handleAdd = async () => {
        const n = name.trim();
        const p = phone.trim();
        if (!n || !isValidCamPhone(p)) return;
        setBusy(true);
        await addRecipient(n, p);
        setName("");
        setPhone("");
        await refresh();
        setBusy(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t("contacts_delete_confirm"))) return;
        await deleteRecipients([id]);
        updateSelection((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
        await refresh();
    };

    const handleDeleteSelected = async () => {
        const ids = [...selected];
        if (ids.length === 0) return;
        if (!confirm(t("contacts_delete_many_confirm").replace("{n}", String(ids.length)))) return;
        await deleteRecipients(ids);
        updateSelection(() => new Set());
        await refresh();
    };

    return (
        <DashboardLayout>
            <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">{t("contacts_title")}</h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">{t("contacts_subtitle")}</p>
                </div>
                <button
                    onClick={handleExport}
                    disabled={filtered.length === 0}
                    className="flex items-center gap-1.5 text-xs font-black text-[#1e3a8a] bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm transition-all hover:bg-blue-50 active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex-shrink-0"
                >
                    <Download className="w-4 h-4" /> {t("contacts_export")}
                </button>
            </div>

            {/* Add form */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" /> {t("contacts_add_title")}
                </p>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t("contacts_name")}
                        className="flex-1 min-w-0 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] transition-all placeholder:text-gray-300"
                    />
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                        placeholder={t("contacts_phone")}
                        className="w-36 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] transition-all placeholder:text-gray-300"
                    />
                    <Button
                        onClick={handleAdd}
                        disabled={busy || !name.trim() || !isValidCamPhone(phone)}
                        className="bg-[#1e3a8a] hover:bg-blue-900 text-white font-black text-xs px-4 rounded-xl"
                    >
                        {t("contacts_add_btn")}
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 mb-3">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t("contacts_search")}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] transition-all placeholder:text-gray-300"
                    />
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-8 h-8 text-[#1e3a8a] animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 text-center">
                    <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Users className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="font-black text-gray-900">{t("contacts_empty")}</p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {/* Select all row */}
                    {contacts.length > 0 && (
                        <div className="flex items-center justify-between px-1">
                            <label className="flex items-center gap-2 text-xs font-black text-[#1e3a8a] cursor-pointer transition-colors hover:text-blue-900">
                                <input
                                    type="checkbox"
                                    ref={selectAllRef}
                                    checked={allVisibleSelected}
                                    onChange={toggleSelectAll}
                                    className="w-5 h-5 accent-[#1e3a8a] cursor-pointer"
                                />
                                {allVisibleSelected
                                    ? t("contacts_select_none")
                                    : t("contacts_select_all")}
                            </label>
                            {selected.size > 0 && (
                                <span className="text-xs font-black text-gray-400">
                                    {selected.size} {t("contacts_selected")}
                                </span>
                            )}
                        </div>
                    )}

                    {filtered.map((c) => {
                        const isSelected = selected.has(c.id);
                        return (
                            <label
                                key={c.id}
                                className={cn(
                                    "bg-white rounded-2xl shadow-sm border p-4 flex items-center gap-3 cursor-pointer transition-all active:scale-[0.99]",
                                    isSelected
                                        ? "border-[#1e3a8a] ring-2 ring-blue-100"
                                        : "border-gray-100"
                                )}
                            >
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggle(c.id)}
                                    className="w-5 h-5 accent-[#1e3a8a] flex-shrink-0"
                                />
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-blue-600 text-white flex items-center justify-center font-black text-sm flex-shrink-0">
                                    {c.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .slice(0, 2)
                                        .join("")
                                        .toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-gray-900 truncate">{c.name}</p>
                                    <p className="text-xs text-gray-400 font-mono truncate">{c.phone}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-wider">
                                        <Smartphone className="w-3 h-3" />
                                        {detectCamNetwork(c.phone)}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleDelete(c.id);
                                        }}
                                        className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                        aria-label={t("common_delete")}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </label>
                        );
                    })}
                </div>
            )}

            {/* Sticky action bar: notify / delete the selection */}
            {selected.size > 0 && (
                <div className="sticky bottom-[76px] md:bottom-4 z-20 mt-3">
                    <div className="bg-white rounded-2xl shadow-xl shadow-gray-900/10 border border-gray-100 p-2.5">
                        <div className="flex items-center justify-between px-2 pb-2 gap-3">
                            <p className="text-sm font-black text-gray-900 leading-tight">
                                {selected.size} {t("contacts_selected")}
                            </p>
                            <p className="text-[10px] text-gray-400 font-medium truncate">
                                {t("contacts_notify_hint")}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleDeleteSelected}
                                className="flex items-center gap-1.5 text-xs font-black text-red-600 bg-white border border-red-200 rounded-xl px-3 py-2.5 transition-all hover:bg-red-50 active:scale-95 flex-shrink-0 whitespace-nowrap"
                            >
                                <Trash2 className="w-4 h-4" />
                                {t("contacts_delete_selected")} ({selected.size})
                            </button>
                            <button
                                onClick={clearSelection}
                                className="text-xs font-black text-gray-400 hover:text-gray-700 px-2 py-2.5 rounded-xl transition-colors flex-shrink-0"
                            >
                                {t("common_cancel")}
                            </button>
                            <button
                                onClick={notifySelected}
                                className="flex-1 flex items-center justify-center gap-2 bg-[#1e3a8a] hover:bg-blue-900 text-white font-black text-sm px-4 py-3 rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                            >
                                <Send className="w-4 h-4" />
                                {t("contacts_notify")} ({selected.size})
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
