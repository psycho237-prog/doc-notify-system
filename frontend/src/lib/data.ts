/**
 * Hybrid data layer.
 *
 * - "firebase" mode: data is served by the Next.js API routes backed by
 *   Firebase Firestore (requires FIREBASE_SERVICE_ACCOUNT_JSON server-side
 *   and a real NEXT_PUBLIC_FIREBASE_API_KEY).
 * - "local" mode: everything is stored in the browser (localStorage) so the
 *   app works with zero configuration. SMS still goes through the real
 *   MboaSMS API via /api/send-sms.
 *
 * If a Firebase-backed call fails (e.g. the service account is missing), the
 * layer automatically falls back to local mode.
 */
import type {
    Recipient,
    SmsLog,
    SendSummary,
    Stats,
    Settings,
} from "./types";
import { DEFAULT_SETTINGS } from "./types";
import { formatCamPhone } from "./phone-utils";
import { SEED_RECIPIENTS } from "./seed";

const LS_RECIPIENTS = "nnlomne.recipients.v1";
const LS_LOGS = "nnlomne.logs.v1";
const LS_SETTINGS = "nnlomne.settings.v1";
const INSTITUTION_ID = "nnlomne";

export type DataMode = "firebase" | "local";

let cachedMode: DataMode | null = null;

/** The client can only know Firebase mode through NEXT_PUBLIC variables. */
function envMode(): DataMode {
    const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    return key && !key.includes("DUMMY") ? "firebase" : "local";
}

export function getMode(): DataMode {
    if (!cachedMode) cachedMode = envMode();
    return cachedMode;
}

/* ── localStorage helpers (SSR-safe) ─────────────────────────────── */

function readLS<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
        const raw = window.localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

function writeLS(key: string, value: unknown): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        /* storage full / unavailable */
    }
}

/* ── API helpers (firebase mode) ─────────────────────────────────── */

async function safeApi<T>(url: string, init?: RequestInit): Promise<T | null> {
    try {
        const res = await fetch(url, init);
        if (!res.ok) throw new Error(`API error ${res.status}`);
        return (await res.json()) as T;
    } catch (err) {
        console.warn("[data] API unavailable, switching to local mode.", err);
        cachedMode = "local";
        return null;
    }
}

/* ── Public API ──────────────────────────────────────────────────── */

/** Seeds demo contacts on first run in local mode. Call once at app start. */
export function seedLocalData(): void {
    if (getMode() !== "local") return;
    if (readLS<Recipient[]>(LS_RECIPIENTS, []).length === 0) {
        writeLS(LS_RECIPIENTS, SEED_RECIPIENTS);
    }
}

export async function getRecipients(): Promise<Recipient[]> {
    if (getMode() === "firebase") {
        const data = await safeApi<{ citizens?: Array<Record<string, unknown>> }>(
            `/api/citizens?institutionId=${INSTITUTION_ID}`
        );
        if (data?.citizens) {
            return data.citizens.map((c) => ({
                id: String(c.id ?? ""),
                name: String(c.fullName ?? ""),
                phone: String(c.phoneNumber ?? ""),
                createdAt: String(c.createdAt ?? ""),
            }));
        }
    }
    return readLS<Recipient[]>(LS_RECIPIENTS, []);
}

export async function addRecipient(name: string, phone: string): Promise<Recipient> {
    const recipient: Recipient = {
        id: `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name,
        phone: formatCamPhone(phone),
        createdAt: new Date().toISOString(),
    };

    if (getMode() === "firebase") {
        const data = await safeApi<{ id?: string }>("/api/citizens", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fullName: recipient.name,
                phoneNumber: recipient.phone,
                institutionId: INSTITUTION_ID,
            }),
        });
        if (data?.id) recipient.id = data.id;
        if (data === null) {
            // fell back to local
            const list = readLS<Recipient[]>(LS_RECIPIENTS, []);
            writeLS(LS_RECIPIENTS, [recipient, ...list]);
            return recipient;
        }
    } else {
        const list = readLS<Recipient[]>(LS_RECIPIENTS, []);
        writeLS(LS_RECIPIENTS, [recipient, ...list]);
    }
    return recipient;
}

export async function deleteRecipient(id: string): Promise<void> {
    await deleteRecipients([id]);
}

/** Deletes several recipients at once (used by the bulk selection). */
export async function deleteRecipients(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    if (getMode() === "firebase") {
        const results = await Promise.all(
            ids.map((id) =>
                safeApi(`/api/citizens/${encodeURIComponent(id)}`, {
                    method: "DELETE",
                })
            )
        );
        if (results.some((r) => r !== null)) return; // deleted (at least partly) in Firestore
        // all calls failed and we fell back to local mode
    }
    const list = readLS<Recipient[]>(LS_RECIPIENTS, []);
    const toDelete = new Set(ids);
    writeLS(
        LS_RECIPIENTS,
        list.filter((r) => !toDelete.has(r.id))
    );
}

export async function getLogs(): Promise<SmsLog[]> {
    if (getMode() === "firebase") {
        const data = await safeApi<{ logs?: Array<Record<string, unknown>> }>(
            `/api/sms-logs?institutionId=${INSTITUTION_ID}`
        );
        if (data?.logs) {
            return data.logs.map((l) => ({
                id: String(l.id ?? ""),
                name: String(l.citizenName ?? l.name ?? "?"),
                phone: String(l.phoneNumber ?? ""),
                message: String(l.message ?? ""),
                status: l.status === "failed" ? "failed" : "sent",
                error: l.error ? String(l.error) : undefined,
                sentAt: String(l.sentAt ?? ""),
            }));
        }
    }
    return readLS<SmsLog[]>(LS_LOGS, []).sort(
        (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
    );
}

export async function getStats(): Promise<Stats> {
    if (getMode() === "firebase") {
        const data = await safeApi<Record<string, unknown>>(
            `/api/dashboard?institutionId=${INSTITUTION_ID}`
        );
        if (data) {
            const totalSent = Number(data.smsTotal ?? 0);
            const failedTotal = Number(data.smsFailed ?? 0);
            const total = totalSent + failedTotal;
            return {
                totalContacts: Number(data.totalRegistered ?? 0),
                sentToday: Number(data.smsSentToday ?? 0),
                totalSent,
                failedTotal,
                successRate: total > 0 ? Math.round((totalSent / total) * 100) : 0,
            };
        }
    }
    return localStats();
}

function localStats(): Stats {
    const recipients = readLS<Recipient[]>(LS_RECIPIENTS, []);
    const logs = readLS<SmsLog[]>(LS_LOGS, []);
    const today = new Date().toDateString();

    const sent = logs.filter((l) => l.status === "sent");
    const sentToday = sent.filter(
        (l) => new Date(l.sentAt).toDateString() === today
    ).length;

    return {
        totalContacts: recipients.length,
        sentToday,
        totalSent: sent.length,
        failedTotal: logs.length - sent.length,
        successRate: logs.length > 0 ? Math.round((sent.length / logs.length) * 100) : 0,
    };
}

/**
 * Sends a personalized SMS to each recipient.
 * The server sanitizes each message (no special characters) and dispatches
 * through MboaSMS unless `simulate` is true.
 */
export async function sendSms(
    recipients: { name: string; phone: string }[],
    message: string,
    simulate: boolean
): Promise<SendSummary> {
    const payload = {
        recipients,
        message,
        simulate,
        institutionId: INSTITUTION_ID,
    };

    let summary: SendSummary = {
        success: false,
        sent: 0,
        failed: 0,
        results: [],
    };

    try {
        const res = await fetch("/api/send-sms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const data = (await res.json()) as SendSummary & { error?: string };
        if (!res.ok) {
            summary = {
                success: false,
                sent: 0,
                failed: recipients.length,
                results: recipients.map((r) => ({
                    name: r.name,
                    phone: r.phone,
                    status: "failed",
                    error: data.error ?? "Erreur serveur",
                })),
            };
        } else {
            summary = {
                success: data.success ?? true,
                sent: data.sent ?? 0,
                failed: data.failed ?? 0,
                results: data.results ?? [],
            };
        }
    } catch (err) {
        summary = {
            success: false,
            sent: 0,
            failed: recipients.length,
            results: recipients.map((r) => ({
                name: r.name,
                phone: r.phone,
                status: "failed",
                error: err instanceof Error ? err.message : "Erreur réseau",
            })),
        };
    }

    // In local mode, persist the log entries in the browser.
    if (getMode() === "local") {
        const logs = readLS<SmsLog[]>(LS_LOGS, []);
        const now = new Date().toISOString();
        const entries: SmsLog[] = summary.results.map((r, i) => ({
            id: `log_${Date.now()}_${i}`,
            name: r.name,
            phone: r.phone,
            message: r.message ?? message,
            status: r.status,
            error: r.error,
            sentAt: now,
        }));
        writeLS(LS_LOGS, [...entries, ...logs]);
    }

    return summary;
}

/* ── Settings (always local) ─────────────────────────────────────── */

export function getSettings(): Settings {
    return { ...DEFAULT_SETTINGS, ...readLS<Partial<Settings>>(LS_SETTINGS, {}) };
}

export function saveSettings(settings: Settings): void {
    writeLS(LS_SETTINGS, settings);
}

export function clearLocalData(): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.removeItem(LS_RECIPIENTS);
        window.localStorage.removeItem(LS_LOGS);
    } catch {
        /* ignore */
    }
}

/* ── Pending selection (contacts → compose) ─────────────────────── */

const LS_PENDING = "nnlomne.pending.selection.v1";

/** Stores the recipients selected on the Contacts page for the compose page. */
export function setPendingSelection(recipients: { name: string; phone: string }[]): void {
    writeLS(LS_PENDING, recipients);
}

/** Reads and clears the pending selection (used once by the compose page). */
export function takePendingSelection(): { name: string; phone: string }[] {
    const pending = readLS<{ name: string; phone: string }[]>(LS_PENDING, []);
    if (pending.length > 0) {
        try {
            window.localStorage.removeItem(LS_PENDING);
        } catch {
            /* ignore */
        }
    }
    return pending;
}

/* ── Selected contact ids (survive back/forward navigation) ─────── */

const SS_SELECTED = "nnlomne.selected.contacts.v1";

function readSS<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
        const raw = window.sessionStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

function writeSS(key: string, value: unknown): void {
    if (typeof window === "undefined") return;
    try {
        window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
        /* unavailable */
    }
}

/** Restores the ids selected on the Contacts page (per tab session). */
export function loadSelectedIds(): string[] {
    return readSS<string[]>(SS_SELECTED, []);
}

/** Persists the ids selected on the Contacts page (per tab session). */
export function saveSelectedIds(ids: string[]): void {
    writeSS(SS_SELECTED, ids);
}

/* ── Auth (local mode demo login) ────────────────────────────────── */

const LS_AUTH = "nnlomne.auth.v1";
const LS_PASSWORD = "nnlomne.password.v1";
const DEFAULT_PASSWORD = "password";

export function isLoggedIn(): boolean {
    return readLS<string>(LS_AUTH, "") === "1";
}

export function setLoggedIn(): void {
    writeLS(LS_AUTH, "1");
}

export function setLoggedOut(): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.removeItem(LS_AUTH);
    } catch {
        /* ignore */
    }
}

/* ── Demo password (local mode, changeable from Settings) ───────── */

/** Returns the current local (demo) password, defaulting to "password". */
export function getLocalPassword(): string {
    return readLS<string>(LS_PASSWORD, "") || DEFAULT_PASSWORD;
}

/** Verifies a candidate against the stored local (demo) password. */
export function checkLocalPassword(candidate: string): boolean {
    return candidate === getLocalPassword();
}

/** Stores a new local (demo) password. */
export function setLocalPassword(password: string): void {
    writeLS(LS_PASSWORD, password);
}
