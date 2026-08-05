"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Layers,
    UserPlus,
    Search,
    Send,
    Pencil,
    Trash2,
    Loader2,
    X,
    CheckCircle2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/lang-context";
import {
    createGroup,
    deleteGroup,
    getGroups,
    getRecipients,
    setPendingSelection,
    updateGroup,
} from "@/lib/data";
import { formatCamPhone, isValidCamPhone } from "@/lib/phone-utils";
import type { Group, GroupMember, Recipient } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function GroupsPage() {
    const { t } = useTranslation();
    const router = useRouter();

    const [groups, setGroups] = useState<Group[]>([]);
    const [contacts, setContacts] = useState<Recipient[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Group | null>(null);
    const [name, setName] = useState("");
    const [search, setSearch] = useState("");
    const [selectedPhones, setSelectedPhones] = useState<Set<string>>(new Set());
    const [manualName, setManualName] = useState("");
    const [manualPhone, setManualPhone] = useState("");
    const [manualMembers, setManualMembers] = useState<GroupMember[]>([]);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    const load = async () => {
        const [g, c] = await Promise.all([getGroups(), getRecipients()]);
        setGroups(g);
        setContacts(c);
        setLoading(false);
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ── Open / close modal ── */
    const openCreate = () => {
        setEditing(null);
        setName("");
        setSearch("");
        setSelectedPhones(new Set());
        setManualMembers([]);
        setManualName("");
        setManualPhone("");
        setFormError("");
        setModalOpen(true);
    };

    const openEdit = (group: Group) => {
        setEditing(group);
        setName(group.name);
        setSearch("");
        const phones = new Set(group.members.map((m) => formatCamPhone(m.phone)));
        const contactIds = new Set(contacts.map((c) => c.id));
        setSelectedPhones(phones);
        setManualMembers(group.members.filter((m) => !contactIds.has(m.id)));
        setManualName("");
        setManualPhone("");
        setFormError("");
        setModalOpen(true);
    };

    const closeModal = () => {
        if (saving) return;
        setModalOpen(false);
    };

    /* ── Member helpers ── */
    const filteredContacts = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return contacts;
        return contacts.filter(
            (c) => c.name.toLowerCase().includes(q) || c.phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""))
        );
    }, [contacts, search]);

    const toggleContact = (phone: string) => {
        setSelectedPhones((prev) => {
            const next = new Set(prev);
            const key = formatCamPhone(phone);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const addManual = () => {
        const n = manualName.trim();
        const p = manualPhone.trim();
        if (!n || !isValidCamPhone(p)) return;
        const key = formatCamPhone(p);
        setManualMembers((prev) => {
            const without = prev.filter((m) => formatCamPhone(m.phone) !== key);
            return [...without, { id: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, name: n, phone: key }];
        });
        setSelectedPhones((prev) => {
            const next = new Set(prev);
            next.add(key);
            return next;
        });
        setManualName("");
        setManualPhone("");
    };

    const selectedCount = useMemo(() => {
        const contactCount = contacts.filter((c) => selectedPhones.has(formatCamPhone(c.phone))).length;
        const manualCount = manualMembers.filter((m) => !contacts.some((c) => formatCamPhone(c.phone) === formatCamPhone(m.phone))).length;
        return contactCount + manualCount;
    }, [contacts, selectedPhones, manualMembers]);

    /* ── Save ── */
    const handleSave = async () => {
        if (!name.trim()) {
            setFormError(t("groups_require_name"));
            return;
        }
        const members: GroupMember[] = [
            ...contacts
                .filter((c) => selectedPhones.has(formatCamPhone(c.phone)))
                .map((c) => ({ id: c.id, name: c.name, phone: c.phone })),
            ...manualMembers.filter(
                (m) => !contacts.some((c) => formatCamPhone(c.phone) === formatCamPhone(m.phone))
            ),
        ];
        if (members.length === 0) {
            setFormError(t("groups_require_members"));
            return;
        }
        setSaving(true);
        setFormError("");
        try {
            if (editing) {
                await updateGroup(editing.id, { name: name.trim(), members });
            } else {
                await createGroup(name.trim(), members);
            }
            setModalOpen(false);
            await load();
        } catch {
            setFormError(t("common_error"));
        } finally {
            setSaving(false);
        }
    };

    /* ── Actions ── */
    const handleNotify = (group: Group) => {
        if (group.members.length === 0) return;
        setPendingSelection(group.members.map((m) => ({ name: m.name, phone: m.phone })));
        router.push("/notifications");
    };

    const handleDelete = async (group: Group) => {
        if (!confirm(t("groups_delete_confirm").replace("{name}", group.name))) return;
        await deleteGroup(group.id);
        await load();
    };

    /* ── Render ── */
    return (
        <DashboardLayout>
            <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">{t("groups_title")}</h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">{t("groups_subtitle")}</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-1.5 text-xs font-black text-white bg-[#1e3a8a] rounded-xl px-3 py-2.5 shadow-md shadow-blue-900/20 transition-all hover:bg-blue-900 active:scale-95 flex-shrink-0"
                >
                    <UserPlus className="w-4 h-4" /> {t("groups_new")}
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-8 h-8 text-[#1e3a8a] animate-spin" />
                </div>
            ) : groups.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 text-center px-6">
                    <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Layers className="w-7 h-7 text-[#1e3a8a]" />
                    </div>
                    <p className="font-black text-gray-900">{t("groups_empty")}</p>
                    <p className="text-sm text-gray-400 font-medium mt-1.5 max-w-xs mx-auto">
                        {t("groups_empty_sub")}
                    </p>
                    <Button
                        onClick={openCreate}
                        className="mt-5 bg-[#1e3a8a] hover:bg-blue-900 text-white font-black rounded-xl"
                    >
                        <UserPlus className="w-4 h-4 mr-1.5" /> {t("groups_new")}
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {groups.map((g) => (
                        <div
                            key={g.id}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-blue-600 text-white flex items-center justify-center flex-shrink-0">
                                    <Layers className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-gray-900 truncate">{g.name}</p>
                                    <p className="text-xs text-gray-400 font-medium mt-0.5">
                                        {t("groups_members").replace("{n}", String(g.members.length))} ·{" "}
                                        {t("groups_created")}{" "}
                                        {new Date(g.createdAt).toLocaleDateString("fr-FR")}
                                    </p>
                                </div>
                            </div>
                            {g.members.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-3 max-h-20 overflow-y-auto">
                                    {g.members.slice(0, 8).map((m, i) => (
                                        <span
                                            key={`${m.phone}-${i}`}
                                            className="px-2 py-0.5 rounded-lg bg-gray-50 border border-gray-100 text-[10px] font-bold text-gray-600"
                                        >
                                            {m.name}
                                        </span>
                                    ))}
                                    {g.members.length > 8 && (
                                        <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-[10px] font-black text-[#1e3a8a]">
                                            +{g.members.length - 8}
                                        </span>
                                    )}
                                </div>
                            )}
                            <div className="flex gap-2 mt-3.5 pt-3 border-t border-gray-50">
                                <button
                                    onClick={() => handleNotify(g)}
                                    disabled={g.members.length === 0}
                                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#1e3a8a] hover:bg-blue-900 text-white font-black text-xs px-3 py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                                >
                                    <Send className="w-4 h-4" /> {t("groups_notify")}
                                </button>
                                <button
                                    onClick={() => openEdit(g)}
                                    className="flex items-center gap-1.5 text-xs font-black text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 transition-all hover:bg-gray-100 active:scale-95"
                                >
                                    <Pencil className="w-3.5 h-3.5" /> {t("groups_edit")}
                                </button>
                                <button
                                    onClick={() => handleDelete(g)}
                                    className="w-10 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                    aria-label={t("groups_delete")}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Create / edit modal ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 p-0 md:p-4">
                    <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                                    <Layers className="w-4 h-4 text-[#1e3a8a]" />
                                </div>
                                <h3 className="text-base font-black text-gray-900">
                                    {editing ? t("groups_form_edit_title") : t("groups_form_title")}
                                </h3>
                            </div>
                            <button
                                onClick={closeModal}
                                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                                aria-label={t("common_close")}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">
                                    {t("groups_name")}
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={t("groups_name_placeholder")}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] transition-all placeholder:text-gray-300"
                                />
                            </div>

                            {/* Contacts picker */}
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">
                                    {t("groups_pick")}
                                </label>
                                <div className="relative mb-2">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder={t("groups_search")}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] transition-all placeholder:text-gray-300"
                                    />
                                </div>

                                <div className="bg-gray-50 rounded-xl border border-gray-100 max-h-48 overflow-y-auto divide-y divide-gray-100">
                                    {filteredContacts.length === 0 ? (
                                        <p className="px-4 py-6 text-center text-xs text-gray-400 font-medium">
                                            {t("groups_no_contacts")}
                                        </p>
                                    ) : (
                                        filteredContacts.map((c) => {
                                            const checked = selectedPhones.has(formatCamPhone(c.phone));
                                            return (
                                                <label
                                                    key={c.id}
                                                    className={cn(
                                                        "flex items-center gap-3 px-3.5 py-2.5 cursor-pointer transition-colors",
                                                        checked ? "bg-blue-50/70" : "hover:bg-white"
                                                    )}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggleContact(c.phone)}
                                                        className="w-5 h-5 accent-[#1e3a8a] flex-shrink-0"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-gray-900 truncate">{c.name}</p>
                                                        <p className="text-[11px] text-gray-400 font-mono">{c.phone}</p>
                                                    </div>
                                                    {checked && (
                                                        <CheckCircle2 className="w-4 h-4 text-[#1e3a8a] flex-shrink-0" />
                                                    )}
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Manual add */}
                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3">
                                <p className="text-[11px] font-black text-[#1e3a8a] uppercase tracking-widest mb-2">
                                    {t("groups_manual")}
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={manualName}
                                        onChange={(e) => setManualName(e.target.value)}
                                        placeholder={t("contacts_name")}
                                        className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] transition-all placeholder:text-gray-300"
                                    />
                                    <input
                                        type="tel"
                                        value={manualPhone}
                                        onChange={(e) => setManualPhone(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && addManual()}
                                        placeholder={t("contacts_phone")}
                                        className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] transition-all placeholder:text-gray-300"
                                    />
                                    <button
                                        onClick={addManual}
                                        disabled={!manualName.trim() || !isValidCamPhone(manualPhone)}
                                        className="flex items-center gap-1 bg-[#1e3a8a] text-white font-black text-[11px] px-3 rounded-lg transition-all hover:bg-blue-900 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                                    >
                                        <UserPlus className="w-3.5 h-3.5" /> {t("groups_manual_add")}
                                    </button>
                                </div>
                                {manualMembers.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {manualMembers.map((m) => (
                                            <span
                                                key={m.id}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-blue-100 text-[10px] font-bold text-blue-800"
                                            >
                                                {m.name} · {m.phone}
                                                <button
                                                    onClick={() =>
                                                        setManualMembers((prev) =>
                                                            prev.filter((x) => x.id !== m.id)
                                                        )
                                                    }
                                                    className="text-blue-300 hover:text-red-500"
                                                    aria-label={t("common_delete")}
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {formError && (
                                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 font-medium">
                                    {formError}
                                </p>
                            )}
                        </div>

                        <div className="px-5 py-4 border-t border-gray-50">
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full bg-[#1e3a8a] hover:bg-blue-900 text-white py-4 rounded-xl font-black shadow-lg shadow-blue-900/20 active:scale-[0.98]"
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4" />
                                )}
                                <span className="ml-2">
                                    {t("groups_save")} · {selectedCount} {t("groups_members").replace("{n}", String(selectedCount))}
                                </span>
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
