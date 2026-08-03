"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Send,
    Users,
    MessageSquareText,
    Sparkles,
    Trash2,
    UserPlus,
    Loader2,
    CheckCircle2,
    XCircle,
    FlaskConical,
    X,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/lang-context";
import {
    formatCamPhone,
    isValidCamPhone,
    parseRecipientsText,
    removeRecipientLine,
    sanitizeSmsMessage,
} from "@/lib/phone-utils";
import { getRecipients, getSettings, sendSms, takePendingSelection } from "@/lib/data";
import type { SendSummary } from "@/lib/types";

const DEFAULT_MESSAGE =
    "Bonjour {name}, votre document est disponible. Merci de vous presenter au guichet pour le retirer.";

export default function NotificationsPage() {
    const { t } = useTranslation();

    const [bulkText, setBulkText] = useState("");
    const [nameInput, setNameInput] = useState("");
    const [phoneInput, setPhoneInput] = useState("");
    const [message, setMessage] = useState(DEFAULT_MESSAGE);
    const [simulate, setSimulate] = useState(false);
    const [sending, setSending] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [result, setResult] = useState<SendSummary | null>(null);
    const [pendingContacts, setPendingContacts] = useState<
        { name: string; phone: string }[]
    >([]);

    useEffect(() => {
        // Preload recipients selected on the Contacts page (if any).
        const pending = takePendingSelection();
        if (pending.length > 0) {
            setPendingContacts(pending);
            const lines = pending.map((p) => `${p.name}; ${p.phone}`);
            setBulkText(lines.join("\n") + "\n");
        }
        setSimulate(getSettings().simulateSms);
    }, []);

    /* ── Recipients ─────────────────────────────────────────────── */

    const parsed = useMemo(() => parseRecipientsText(bulkText), [bulkText]);

    const validRecipients = useMemo(() => {
        const seen = new Set<string>();
        return parsed
            .filter((p) => p.valid)
            .filter((p) => {
                const key = formatCamPhone(p.phone);
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            })
            .map((p) => ({ name: p.name, phone: formatCamPhone(p.phone) }));
    }, [parsed]);

    const invalidLines = useMemo(() => parsed.filter((p) => !p.valid), [parsed]);

    const addManual = () => {
        const name = nameInput.trim();
        const phone = phoneInput.trim();
        if (!name || !isValidCamPhone(phone)) return;
        setBulkText((prev) => (prev ? `${prev.trimEnd()}\n` : "") + `${name}; ${phone}\n`);
        setNameInput("");
        setPhoneInput("");
    };

    const loadContacts = async () => {
        const contacts = await getRecipients();
        if (contacts.length === 0) return;
        const existing = new Set(parsed.map((p) => formatCamPhone(p.phone)));
        const lines = contacts
            .filter((c) => !existing.has(formatCamPhone(c.phone)))
            .map((c) => `${c.name}; ${c.phone}`);
        if (lines.length > 0) {
            setBulkText((prev) => (prev ? `${prev.trimEnd()}\n` : "") + lines.join("\n") + "\n");
        }
    };

    /**
     * Removes a contact from the banner AND the matching line in the
     * recipients list (matched by normalized phone, so it survives manual
     * edits of the pasted text).
     */
    const removePendingContact = (phone: string) => {
        setPendingContacts((prev) => prev.filter((c) => c.phone !== phone));
        setBulkText((prev) => removeRecipientLine(prev, phone));
    };

    /* ── Message preview ────────────────────────────────────────── */

    const preview = useMemo(() => {
        if (!message.trim()) return "";
        const sampleName = validRecipients[0]?.name ?? "Jean Dupont";
        return sanitizeSmsMessage(message.replace(/{name}/gi, sampleName));
    }, [message, validRecipients]);

    const segments = Math.max(1, Math.ceil(preview.length / 160));
    const totalSegments = validRecipients.length * segments;

    /* ── Send ───────────────────────────────────────────────────── */

    const canSend = validRecipients.length > 0 && message.trim().length > 0 && !sending;

    const handleSend = async () => {
        if (!canSend) return;
        setSending(true);
        setShowConfirm(false);
        const summary = await sendSms(validRecipients, message.trim(), simulate);
        setResult(summary);
        setSending(false);
    };

    const reset = () => {
        setBulkText("");
        setMessage(DEFAULT_MESSAGE);
        setPendingContacts([]);
        setResult(null);
    };

    const insertNameVar = () => {
        setMessage((prev) => (prev ? `${prev} ` : "") + "{name}");
    };

    /* ── Result screen ──────────────────────────────────────────── */

    if (result) {
        const failures = result.results.filter((r) => r.status === "failed");
        return (
            <DashboardLayout>
                <div className="pt-2">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-6">
                        {t("notif_result_title")}
                    </h1>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
                            <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1.5" />
                            <p className="text-3xl font-black text-green-700 leading-none">{result.sent}</p>
                            <p className="text-[11px] font-bold text-green-600/70 uppercase tracking-wide mt-1.5">
                                {t("notif_result_sent")}
                            </p>
                        </div>
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
                            <XCircle className="w-6 h-6 text-red-500 mx-auto mb-1.5" />
                            <p className="text-3xl font-black text-red-600 leading-none">{result.failed}</p>
                            <p className="text-[11px] font-bold text-red-500/70 uppercase tracking-wide mt-1.5">
                                {t("notif_result_failed")}
                            </p>
                        </div>
                    </div>

                    {failures.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
                            <p className="text-sm font-black text-gray-900 mb-3">{t("notif_result_details")}</p>
                            <div className="space-y-2">
                                {failures.map((f, i) => (
                                    <div key={i} className="flex items-center justify-between gap-3 text-sm">
                                        <span className="font-bold text-gray-700 truncate">{f.name}</span>
                                        <span className="text-xs text-red-500 font-medium truncate">
                                            {f.error}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <Button
                        onClick={reset}
                        className="w-full bg-[#1e3a8a] hover:bg-blue-900 text-white py-5 rounded-2xl font-black shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all"
                    >
                        {t("notif_new_message")}
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    /* ── Compose screen ─────────────────────────────────────────── */

    return (
        <DashboardLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">{t("notif_title")}</h1>
                <p className="text-sm text-gray-500 font-medium mt-1">{t("notif_subtitle")}</p>
            </div>

            {/* Contacts selection banner */}
            {pendingContacts.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3.5 mb-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Users className="w-4 h-4 text-[#1e3a8a]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-blue-900">
                            {pendingContacts.length} {t("notif_contacts_imported")}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1.5 max-h-32 overflow-y-auto pr-0.5">
                            {pendingContacts.map((c, i) => (
                                <span
                                    key={`${c.phone}-${i}`}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-blue-100 text-[11px] font-bold text-blue-800 max-w-[180px]"
                                >
                                    <span className="truncate min-w-0">{c.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => removePendingContact(c.phone)}
                                        className="flex-shrink-0 -m-1 p-1 text-blue-300 hover:text-red-500 active:scale-90 transition-all rounded"
                                        aria-label={t("notif_contacts_remove").replace("{name}", c.name)}
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={() => setPendingContacts([])}
                        className="w-8 h-8 flex items-center justify-center rounded-xl text-blue-400 hover:text-blue-700 hover:bg-white transition-colors flex-shrink-0"
                        aria-label={t("common_cancel")}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Simulation badge */}
            {simulate && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-xl px-3.5 py-2.5 mb-4">
                    <FlaskConical className="w-4 h-4 flex-shrink-0" />
                    {t("notif_simulate_badge")}
                </div>
            )}

            {/* ── Step 1: Recipients ── */}
            <section className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-[#1e3a8a] text-white flex items-center justify-center text-xs font-black">
                        1
                    </div>
                    <h2 className="text-base font-black text-gray-900">{t("notif_step_recipients")}</h2>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                        {t("notif_paste_label")}
                    </label>
                    <textarea
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        placeholder={t("notif_paste_placeholder")}
                        rows={5}
                        className="w-full px-4 py-3 border-2 border-gray-50 bg-gray-50/30 rounded-xl text-sm font-mono focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] focus:bg-white transition-all resize-none placeholder:text-gray-300"
                    />
                    <p className="text-[11px] text-gray-400 font-medium mt-1.5">{t("notif_paste_hint")}</p>

                    {/* Counts */}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className="px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-[11px] font-black">
                            {validRecipients.length} {t("notif_valid_count")}
                        </span>
                        {invalidLines.length > 0 && (
                            <span className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-[11px] font-black">
                                {invalidLines.length} {t("notif_invalid_count")}
                            </span>
                        )}
                        <button
                            onClick={loadContacts}
                            className="ml-auto flex items-center gap-1.5 text-[11px] font-black text-[#1e3a8a] bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5 transition-all hover:bg-blue-100 active:scale-95"
                        >
                            <Users className="w-3.5 h-3.5" /> {t("notif_load_contacts")}
                        </button>
                        {bulkText && (
                            <button
                                onClick={() => {
                                    setBulkText("");
                                    setPendingContacts([]);
                                }}
                                className="flex items-center gap-1.5 text-[11px] font-black text-gray-400 hover:text-red-500 rounded-lg px-2 py-1.5 transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> {t("notif_clear")}
                            </button>
                        )}
                    </div>

                    {/* Invalid lines detail */}
                    {invalidLines.length > 0 && (
                        <ul className="mt-3 space-y-1">
                            {invalidLines.map((p) => (
                                <li
                                    key={p.line}
                                    className="text-[11px] text-red-500 font-medium flex items-center gap-1.5"
                                >
                                    <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                    {t("notif_invalid_line").replace("{n}", String(p.line))}
                                    <span className="text-gray-400 truncate">— {p.name}</span>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Manual add */}
                    <div className="mt-4 pt-4 border-t border-gray-50 flex gap-2">
                        <input
                            type="text"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            placeholder={t("notif_add_name")}
                            className="flex-1 min-w-0 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] transition-all placeholder:text-gray-300"
                        />
                        <input
                            type="tel"
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addManual()}
                            placeholder={t("notif_add_phone")}
                            className="w-32 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] transition-all placeholder:text-gray-300"
                        />
                        <button
                            onClick={addManual}
                            className="flex items-center justify-center gap-1.5 bg-[#1e3a8a] text-white font-black text-xs px-4 rounded-xl transition-all hover:bg-blue-900 active:scale-95"
                        >
                            <UserPlus className="w-4 h-4" /> {t("notif_add_btn")}
                        </button>
                    </div>
                </div>
            </section>

            {/* ── Step 2: Message ── */}
            <section className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-[#1e3a8a] text-white flex items-center justify-center text-xs font-black">
                        2
                    </div>
                    <h2 className="text-base font-black text-gray-900">{t("notif_step_message")}</h2>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                            {t("notif_message_label")}
                        </label>
                        <button
                            onClick={insertNameVar}
                            className="flex items-center gap-1.5 text-[11px] font-black text-[#1e3a8a] bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5 transition-all hover:bg-blue-100 active:scale-95"
                        >
                            <Sparkles className="w-3 h-3" /> {t("notif_insert_name")}
                        </button>
                    </div>

                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 border-2 border-gray-50 bg-gray-50/30 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] focus:bg-white transition-all resize-none placeholder:text-gray-300"
                    />
                    <p className="text-[11px] text-gray-400 font-medium mt-1.5">
                        {t("notif_variable_hint")}
                    </p>

                    {/* Sanitized preview */}
                    {preview && (
                        <div className="mt-3 bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3 text-green-500" /> {t("notif_preview")}
                            </p>
                            <p className="text-sm text-gray-700 font-medium whitespace-pre-wrap break-words">
                                {preview}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-[10px] text-gray-400 font-bold">
                                    {preview.length} {t("notif_chars")} · {segments} {t("notif_segments")}
                                </span>
                                <span className="text-[10px] font-black text-green-600 bg-green-50 rounded px-2 py-0.5">
                                    GSM ✓
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* ── Send ── */}
            <div className="sticky bottom-[76px] md:bottom-4 z-20">
                <Button
                    onClick={() => {
                        if (canSend) setShowConfirm(true);
                    }}
                    disabled={!canSend}
                    className="w-full bg-[#1e3a8a] hover:bg-blue-900 text-white py-5 rounded-2xl font-black text-base shadow-xl shadow-blue-900/25 transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
                >
                    {sending ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin mr-2" /> {t("notif_sending")}
                        </>
                    ) : (
                        <>
                            <Send className="w-5 h-5 mr-2" />
                            {validRecipients.length > 0
                                ? t("notif_send_to").replace("{n}", String(validRecipients.length))
                                : t("notif_empty_recipients")}
                        </>
                    )}
                </Button>
            </div>

            {/* Confirmation modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                            <MessageSquareText className="w-6 h-6 text-[#1e3a8a]" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 mb-1.5">
                            {t("notif_confirm_title")}
                        </h3>
                        <p className="text-sm text-gray-500 font-medium mb-6">
                            {t("notif_confirm_body")
                                .replace("{n}", String(validRecipients.length))
                                .replace("{seg}", String(totalSegments))}
                        </p>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 py-4 rounded-xl font-black"
                            >
                                {t("notif_confirm_cancel")}
                            </Button>
                            <Button
                                onClick={handleSend}
                                disabled={sending}
                                className="flex-1 bg-[#1e3a8a] hover:bg-blue-900 text-white py-4 rounded-xl font-black"
                            >
                                {sending ? t("notif_sending") : t("notif_confirm_send")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
