/**
 * Hybrid data layer (multi-account).
 *
 * - "firebase" mode: data is served by the Next.js API routes backed by
 *   Firebase Firestore (requires FIREBASE_SERVICE_ACCOUNT_JSON server-side
 *   and a real NEXT_PUBLIC_FIREBASE_API_KEY). User accounts are real
 *   Firebase Auth users.
 * - "local" mode: everything is stored in the browser (localStorage), user
 *   accounts included, so the app works with zero configuration. SMS still
 *   goes through the real MboaSMS API via /api/send-sms.
 *
 * Each account has its own isolated data (contacts, groups, logs, settings).
 * A default super-admin account (admin@nnlomne.gov / password) is created on
 * first run and the legacy single-admin data is migrated to it.
 *
 * Offline support: contacts are readable/writable from localStorage at all
 * times (local mode) and SMS sends are queued locally when the device is
 * offline, then flushed automatically when the connection comes back.
 */
import type {
    Recipient,
    SmsLog,
    SendSummary,
    SendResultItem,
    Stats,
    Settings,
    UserAccount,
    UserRole,
    Group,
    GroupMember,
    PendingSend,
} from "./types";
import { DEFAULT_SETTINGS } from "./types";
import { formatCamPhone } from "./phone-utils";
import { SEED_RECIPIENTS } from "./seed";

export type DataMode = "firebase" | "local";

const INSTITUTION_ID = "nnlomne";

/* ── Storage keys ─────────────────────────────────────────────────── */

const LS_USERS = "nnlomne.users.v1";
const LS_AUTH_UID = "nnlomne.auth.uid.v1";
const LS_CLEANUP = "nnlomne.cleanupAfterSend.v1";
const LS_PENDING_SENDS = "nnlomne.pending.sends.v1";

// Legacy single-admin keys (migrated on first run).
const LEGACY_LS_RECIPIENTS = "nnlomne.recipients.v1";
const LEGACY_LS_LOGS = "nnlomne.logs.v1";
const LEGACY_LS_SETTINGS = "nnlomne.settings.v1";
const LEGACY_LS_AUTH = "nnlomne.auth.v1";
const LEGACY_LS_PASSWORD = "nnlomne.password.v1";

const uRecipients = (uid: string) => `nnlomne.u.${uid}.recipients.v1`;
const uLogs = (uid: string) => `nnlomne.u.${uid}.logs.v1`;
const uGroups = (uid: string) => `nnlomne.u.${uid}.groups.v1`;
const uSettings = (uid: string) => `nnlomne.u.${uid}.settings.v1`;
const pendingSelKey = (uid: string) => `nnlomne.pending.selection.${uid}.v1`;
const selectedKey = (uid: string) => `nnlomne.selected.contacts.${uid}.v1`;

export const DEFAULT_ADMIN_EMAIL = "admin@nnlomne.gov";
const DEFAULT_ADMIN_PASSWORD = "password";
const DEFAULT_ADMIN_ID = "u-admin";

function defaultAdmin(): UserAccount {
    return {
        id: DEFAULT_ADMIN_ID,
        name: "Administrateur",
        email: DEFAULT_ADMIN_EMAIL,
        password: DEFAULT_ADMIN_PASSWORD,
        role: "superadmin",
        createdAt: new Date().toISOString(),
    };
}

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

/* ── localStorage helpers (SSR-safe, test-friendly) ──────────────── */

/** Returns the Storage object when available (browser or test stub). */
function getStorage(): Storage | null {
    try {
        if (typeof globalThis === "undefined") return null;
        const storage = (globalThis as { localStorage?: Storage }).localStorage;
        return storage ?? null;
    } catch {
        return null;
    }
}

function readLS<T>(key: string, fallback: T): T {
    const storage = getStorage();
    if (!storage) return fallback;
    try {
        const raw = storage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

function writeLS(key: string, value: unknown): void {
    const storage = getStorage();
    if (!storage) return;
    try {
        storage.setItem(key, JSON.stringify(value));
    } catch {
        /* storage full / unavailable */
    }
}

function removeLS(key: string): void {
    const storage = getStorage();
    if (!storage) return;
    try {
        storage.removeItem(key);
    } catch {
        /* ignore */
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

/**
 * fetch + JSON parse that keeps the HTTP status so callers can distinguish
 * expected error codes (409 exists, 400 invalid, …) from real network failures.
 * Returns { status: 0, data: null } when the network is unreachable.
 */
async function apiWithStatus<T>(
    url: string,
    init?: RequestInit
): Promise<{ status: number; data: T | null }> {
    try {
        const res = await fetch(url, init);
        const data = (await res.json().catch(() => null)) as T | null;
        return { status: res.status, data };
    } catch (err) {
        console.warn("[data] API unavailable.", err);
        return { status: 0, data: null };
    }
}

/* ── Accounts (auth + user management) ───────────────────────────── */

/** Creates the default super admin and migrates the legacy data on first run. */
export function migrateLegacy(): void {
    if (!getStorage()) return;
    if (readLS<UserAccount[]>(LS_USERS, []).length > 0) return;

    const admin = defaultAdmin();
    const legacyRecipients = readLS<Recipient[]>(LEGACY_LS_RECIPIENTS, []);
    const legacyLogs = readLS<SmsLog[]>(LEGACY_LS_LOGS, []);
    const legacySettings = readLS<Partial<Settings>>(LEGACY_LS_SETTINGS, {});
    const legacyPassword = readLS<string>(LEGACY_LS_PASSWORD, "");

    if (legacyPassword && legacyPassword !== DEFAULT_ADMIN_PASSWORD) {
        admin.password = legacyPassword;
    }
    writeLS(LS_USERS, [admin]);
    if (legacyRecipients.length) writeLS(uRecipients(admin.id), legacyRecipients);
    if (legacyLogs.length) writeLS(uLogs(admin.id), legacyLogs);
    if (Object.keys(legacySettings).length) writeLS(uSettings(admin.id), legacySettings);
    // Keep the old session alive if the user was previously logged in.
    if (readLS<string>(LEGACY_LS_AUTH, "") === "1") writeLS(LS_AUTH_UID, admin.id);

    [LEGACY_LS_RECIPIENTS, LEGACY_LS_LOGS, LEGACY_LS_SETTINGS, LEGACY_LS_AUTH, LEGACY_LS_PASSWORD].forEach(
        (key) => removeLS(key)
    );
}

function sanitizeUser(user: UserAccount | null | undefined): UserAccount | null {
    if (!user) return null;
    // Never leak the password field (it only exists in local mode).
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        disabled: user.disabled,
    };
}

/** Current logged-in user id, or the default admin when not logged in. */
function activeUserId(): string {
    migrateLegacy();
    const uid = readLS<string>(LS_AUTH_UID, "");
    return uid || DEFAULT_ADMIN_ID;
}

/**
 * Authenticates an account (local mode). Returns the sanitized user or null.
 * Throws an Error("disabled") when the account exists but is locked by the
 * super admin (the login page shows a dedicated message).
 */
export function loginUser(email: string, password: string): UserAccount | null {
    migrateLegacy();
    const users = readLS<UserAccount[]>(LS_USERS, []);
    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || user.password !== password) return null;
    if (user.disabled) throw new Error("disabled");
    writeLS(LS_AUTH_UID, user.id);
    return sanitizeUser(user);
}

export function isLoggedIn(): boolean {
    return !!readLS<string>(LS_AUTH_UID, "");
}

/** Current logged-in user (local mode). Returns null when not logged in. */
export function getCurrentUser(): UserAccount | null {
    const uid = readLS<string>(LS_AUTH_UID, "");
    if (!uid) return null;
    return sanitizeUser(readLS<UserAccount[]>(LS_USERS, []).find((u) => u.id === uid));
}

/** Sets the current session (local mode). `uid` defaults to the admin account. */
export function setLoggedIn(uid?: string): void {
    writeLS(LS_AUTH_UID, uid ?? DEFAULT_ADMIN_ID);
}

export function setLoggedOut(): void {
    removeLS(LS_AUTH_UID);
}

/** Debug/seed helper (tests): wipe every account and their data. */
export function resetLocalAccounts(): void {
    const storage = getStorage();
    if (!storage) return;
    try {
        const keys = Object.keys(storage).filter(
            (k) => k.startsWith("nnlomne.")
        );
        keys.forEach((k) => storage.removeItem(k));
    } catch {
        /* ignore */
    }
}

/** True when the current account is a super admin (local mode, sync). */
export function isSuperAdmin(): boolean {
    return getCurrentUser()?.role === "superadmin";
}

/** All accounts (local mode, sync). Passwords are stripped. */
export function getUsers(): UserAccount[] {
    migrateLegacy();
    return readLS<UserAccount[]>(LS_USERS, [])
        .map((u) => sanitizeUser(u))
        .filter((u): u is UserAccount => u !== null);
}

/** All accounts (both modes). */
export async function getUsersAsync(): Promise<UserAccount[]> {
    if (getMode() === "firebase") {
        const data = await safeApi<{ users?: Array<Record<string, unknown>> }>("/api/users");
        if (data?.users) {
            return data.users.map((u) => ({
                id: String(u.id ?? ""),
                name: String(u.name ?? ""),
                email: String(u.email ?? ""),
                role: u.role === "superadmin" ? ("superadmin" as const) : ("user" as const),
                createdAt: String(u.createdAt ?? ""),
                disabled: u.disabled === true,
            }));
        }
    }
    return getUsers();
}

/** Current account (both modes). */
export async function getCurrentUserAsync(): Promise<UserAccount | null> {
    if (getMode() === "firebase") {
        let uid = "";
        try {
            const { auth } = await import("./firebase");
            uid = auth.currentUser?.uid ?? "";
        } catch {
            /* client firebase unavailable */
        }
        if (!uid) return null;
        const users = await getUsersAsync();
        return users.find((u) => u.id === uid) ?? null;
    }
    return getCurrentUser();
}

/** True when the current account is a super admin (both modes). */
export async function isSuperAdminAsync(): Promise<boolean> {
    return (await getCurrentUserAsync())?.role === "superadmin";
}

/** True when the current account is locked (both modes). */
export async function isCurrentUserDisabled(): Promise<boolean> {
    const me = await getCurrentUserAsync();
    if (!me) return false;
    return me.disabled === true;
}

/**
 * Firebase mode: promotes the first signed-in account to super admin and
 * reassigns the pre-multi-account data (records without userId) to it.
 * No-op when users already exist or in local mode.
 */
export async function bootstrapFirebaseAdmin(): Promise<void> {
    if (getMode() !== "firebase") return;
    let uid = "";
    let email = "";
    try {
        const { auth } = await import("./firebase");
        uid = auth.currentUser?.uid ?? "";
        email = auth.currentUser?.email ?? "";
    } catch {
        return;
    }
    if (!uid || !email) return;
    try {
        const { status } = await apiWithStatus("/api/users/me", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid, email }),
        });
        // 409 already_exists is fine — another admin already set things up.
        if (status === 0 || status === 500) {
            console.warn("[data] admin bootstrap unavailable.");
        }
    } catch {
        /* best effort */
    }
}

/** Creates a new account (both modes). */
export async function createUserAccount(input: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
}): Promise<UserAccount> {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    if (!name || !email || input.password.length < 6) throw new Error("invalid");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("invalid_email");

    if (getMode() === "firebase") {
        const { status, data } = await apiWithStatus<{ id?: string; error?: string }>("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password: input.password, role: input.role }),
        });
        if (status === 0) throw new Error("offline");
        if (status === 409) throw new Error("exists");
        if (status === 400) throw new Error(data?.error || "invalid");
        if (!data?.id) throw new Error(data?.error || "create_failed");
        return { id: data.id, name, email, role: input.role, createdAt: new Date().toISOString() };
    }

    migrateLegacy();
    const users = readLS<UserAccount[]>(LS_USERS, []);
    if (users.some((u) => u.email.toLowerCase() === email)) throw new Error("exists");
    const user: UserAccount = {
        id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name,
        email,
        password: input.password,
        role: input.role,
        createdAt: new Date().toISOString(),
    };
    writeLS(LS_USERS, [...users, user]);
    return sanitizeUser(user) as UserAccount;
}

/** Updates an account (name, email, role, lock status, optional password reset) in both modes. */
export async function updateUserAccount(
    id: string,
    patch: {
        name?: string;
        email?: string;
        role?: UserRole;
        password?: string;
        disabled?: boolean;
    }
): Promise<UserAccount> {
    const name = patch.name?.trim() ?? "";
    if (patch.name !== undefined && !name) throw new Error("invalid");
    const email = patch.email?.trim().toLowerCase() ?? "";
    if (patch.email !== undefined) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("invalid_email");
    }
    if (patch.password !== undefined && patch.password.length > 0 && patch.password.length < 6) {
        throw new Error("invalid");
    }
    // The built-in super admin can never be locked out.
    if (id === DEFAULT_ADMIN_ID && patch.disabled === true) {
        throw new Error("cannot_lock_superadmin");
    }

    if (getMode() === "firebase") {
        const { status, data } = await apiWithStatus<{ success?: boolean; error?: string }>(
            `/api/users/${encodeURIComponent(id)}`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patch),
            }
        );
        if (status === 0) throw new Error("offline");
        if (status === 409) throw new Error("exists");
        if (status === 400) throw new Error(data?.error || "invalid");
        if (!data?.success) throw new Error(data?.error || "update_failed");
        const users = await getUsersAsync();
        const updated = users.find((u) => u.id === id);
        if (!updated) throw new Error("not_found");
        return updated;
    }

    migrateLegacy();
    const users = readLS<UserAccount[]>(LS_USERS, []);
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error("not_found");
    // Uniqueness check (excluding the account being edited).
    if (
        patch.email !== undefined &&
        users.some((u) => u.id !== id && u.email.toLowerCase() === email)
    ) {
        throw new Error("exists");
    }
    const next: UserAccount = {
        ...users[idx],
        name: patch.name !== undefined ? name : users[idx].name,
        email: patch.email !== undefined ? email : users[idx].email,
        role: patch.role ?? users[idx].role,
        password: patch.password ? patch.password : users[idx].password,
        disabled: patch.disabled ?? users[idx].disabled,
    };
    users[idx] = next;
    writeLS(LS_USERS, users);
    return sanitizeUser(next) as UserAccount;
}

/** Deletes an account and its data (both modes). */
export async function deleteUserAccount(id: string): Promise<void> {
    if (id === DEFAULT_ADMIN_ID) throw new Error("cannot_delete_superadmin");
    const me = await getCurrentUserAsync();
    if (me?.id === id) throw new Error("cannot_delete_self");

    if (getMode() === "firebase") {
        const ok = await safeApi(`/api/users/${encodeURIComponent(id)}`, { method: "DELETE" });
        if (ok === null) throw new Error("offline");
        return;
    }

    migrateLegacy();
    const users = readLS<UserAccount[]>(LS_USERS, []);
    writeLS(
        LS_USERS,
        users.filter((u) => u.id !== id)
    );
    removeLS(uRecipients(id));
    removeLS(uLogs(id));
    removeLS(uGroups(id));
    removeLS(uSettings(id));
}

/* ── Local (demo) password helpers (current account) ─────────────── */

export function getLocalPassword(): string {
    migrateLegacy();
    const users = readLS<UserAccount[]>(LS_USERS, []);
    const user = users.find((u) => u.id === activeUserId());
    return user?.password ?? DEFAULT_ADMIN_PASSWORD;
}

export function checkLocalPassword(candidate: string): boolean {
    return candidate === getLocalPassword();
}

export function setLocalPassword(password: string): void {
    migrateLegacy();
    const users = readLS<UserAccount[]>(LS_USERS, []);
    const idx = users.findIndex((u) => u.id === activeUserId());
    if (idx === -1) return;
    users[idx] = { ...users[idx], password };
    writeLS(LS_USERS, users);
}

/* ── Global cleanup setting (admin-controlled) ───────────────────── */

export function getCleanupAfterSend(): boolean {
    return readLS<boolean | undefined>(LS_CLEANUP, undefined) ?? true;
}

export function setCleanupAfterSend(value: boolean): void {
    writeLS(LS_CLEANUP, value);
}

/* ── Contacts (per account) ──────────────────────────────────────── */

/** Seeds demo contacts on first run in local mode. Call once at app start. */
export function seedLocalData(): void {
    if (getMode() !== "local") return;
    migrateLegacy();
    const uid = activeUserId();
    if (readLS<Recipient[]>(uRecipients(uid), []).length === 0) {
        writeLS(uRecipients(uid), SEED_RECIPIENTS);
    }
}

function mapCitizens(citizens: Array<Record<string, unknown>>): Recipient[] {
    return citizens.map((c) => ({
        id: String(c.id ?? ""),
        name: String(c.fullName ?? ""),
        phone: String(c.phoneNumber ?? ""),
        createdAt: String(c.createdAt ?? ""),
    }));
}

export async function getRecipients(): Promise<Recipient[]> {
    const uid = activeUserId();
    if (getMode() === "firebase") {
        const data = await safeApi<{ citizens?: Array<Record<string, unknown>> }>(
            `/api/citizens?institutionId=${INSTITUTION_ID}&userId=${encodeURIComponent(uid)}`
        );
        if (data?.citizens) return mapCitizens(data.citizens);
    }
    return readLS<Recipient[]>(uRecipients(uid), []);
}

export async function addRecipient(name: string, phone: string): Promise<Recipient> {
    const uid = activeUserId();
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
                userId: uid,
            }),
        });
        if (data?.id) recipient.id = data.id;
        if (data === null) {
            // fell back to local
            const list = readLS<Recipient[]>(uRecipients(uid), []);
            writeLS(uRecipients(uid), [recipient, ...list]);
            return recipient;
        }
    } else {
        const list = readLS<Recipient[]>(uRecipients(uid), []);
        writeLS(uRecipients(uid), [recipient, ...list]);
    }
    return recipient;
}

export async function deleteRecipient(id: string): Promise<void> {
    await deleteRecipients([id]);
}

/** Deletes several recipients at once (used by the bulk selection). */
export async function deleteRecipients(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const uid = activeUserId();
    if (getMode() === "firebase") {
        const results = await Promise.all(
            ids.map((id) =>
                safeApi(`/api/citizens/${encodeURIComponent(id)}?userId=${encodeURIComponent(uid)}`, {
                    method: "DELETE",
                })
            )
        );
        if (results.some((r) => r !== null)) return; // deleted (at least partly) in Firestore
        // all calls failed and we fell back to local mode
    }
    const list = readLS<Recipient[]>(uRecipients(uid), []);
    const toDelete = new Set(ids);
    writeLS(
        uRecipients(uid),
        list.filter((r) => !toDelete.has(r.id))
    );
}

/* ── Notification groups (per account) ───────────────────────────── */

export async function getGroups(): Promise<Group[]> {
    const uid = activeUserId();
    if (getMode() === "firebase") {
        const data = await safeApi<{ groups?: Array<Record<string, unknown>> }>(
            `/api/groups?institutionId=${INSTITUTION_ID}&userId=${encodeURIComponent(uid)}`
        );
        if (data?.groups) {
            return data.groups.map((g) => ({
                id: String(g.id ?? ""),
                name: String(g.name ?? ""),
                members: Array.isArray(g.members) ? (g.members as GroupMember[]) : [],
                createdAt: String(g.createdAt ?? ""),
            }));
        }
    }
    return readLS<Group[]>(uGroups(uid), []);
}

export async function createGroup(name: string, members: GroupMember[]): Promise<Group> {
    const uid = activeUserId();
    const group: Group = {
        id: `g_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: name.trim(),
        members,
        createdAt: new Date().toISOString(),
    };

    if (getMode() === "firebase") {
        const data = await safeApi<{ id?: string }>("/api/groups", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: group.name,
                members: group.members,
                institutionId: INSTITUTION_ID,
                userId: uid,
            }),
        });
        if (data?.id) group.id = data.id;
        if (data !== null) return group;
        // fell back to local
    }
    const list = readLS<Group[]>(uGroups(uid), []);
    writeLS(uGroups(uid), [...list, group]);
    return group;
}

export async function updateGroup(
    id: string,
    patch: { name?: string; members?: GroupMember[] }
): Promise<Group | null> {
    const uid = activeUserId();
    if (getMode() === "firebase") {
        const data = await safeApi<{ success?: boolean }>(
            `/api/groups/${encodeURIComponent(id)}?userId=${encodeURIComponent(uid)}`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patch),
            }
        );
        if (data !== null) {
            const groups = await getGroups();
            return groups.find((g) => g.id === id) ?? null;
        }
    }
    const groups = readLS<Group[]>(uGroups(uid), []);
    const idx = groups.findIndex((g) => g.id === id);
    if (idx === -1) return null;
    groups[idx] = { ...groups[idx], ...patch };
    writeLS(uGroups(uid), groups);
    return groups[idx];
}

export async function deleteGroup(id: string): Promise<void> {
    const uid = activeUserId();
    if (getMode() === "firebase") {
        const ok = await safeApi(`/api/groups/${encodeURIComponent(id)}?userId=${encodeURIComponent(uid)}`, {
            method: "DELETE",
        });
        if (ok !== null) return;
    }
    const groups = readLS<Group[]>(uGroups(uid), []);
    writeLS(
        uGroups(uid),
        groups.filter((g) => g.id !== id)
    );
}

/* ── SMS logs (per account) ──────────────────────────────────────── */

function mapLogs(logs: Array<Record<string, unknown>>): SmsLog[] {
    return logs.map((l) => ({
        id: String(l.id ?? ""),
        name: String(l.citizenName ?? l.name ?? "?"),
        phone: String(l.phoneNumber ?? ""),
        message: String(l.message ?? ""),
        status: l.status === "queued" ? ("queued" as const) : l.status === "failed" ? ("failed" as const) : ("sent" as const),
        error: l.error ? String(l.error) : undefined,
        sentAt: String(l.sentAt ?? ""),
    }));
}

/** Logs of a specific account (used by the super-admin reports). */
export async function getUserLogs(uid: string): Promise<SmsLog[]> {
    if (getMode() === "firebase") {
        const data = await safeApi<{ logs?: Array<Record<string, unknown>> }>(
            `/api/sms-logs?institutionId=${INSTITUTION_ID}&userId=${encodeURIComponent(uid)}`
        );
        if (data?.logs) return mapLogs(data.logs);
    }
    return readLS<SmsLog[]>(uLogs(uid), []).sort(
        (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
    );
}

export async function getLogs(): Promise<SmsLog[]> {
    return getUserLogs(activeUserId());
}

export async function getStats(): Promise<Stats> {
    const uid = activeUserId();
    if (getMode() === "firebase") {
        const data = await safeApi<Record<string, unknown>>(
            `/api/dashboard?institutionId=${INSTITUTION_ID}&userId=${encodeURIComponent(uid)}`
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
                queued: Number(data.smsQueued ?? 0),
            };
        }
    }
    return localStats(uid);
}

function localStats(uid: string): Stats {
    const recipients = readLS<Recipient[]>(uRecipients(uid), []);
    const logs = readLS<SmsLog[]>(uLogs(uid), []);
    const today = new Date().toDateString();

    const sent = logs.filter((l) => l.status === "sent");
    const failed = logs.filter((l) => l.status === "failed");
    const queued = logs.filter((l) => l.status === "queued");
    const sentToday = sent.filter((l) => new Date(l.sentAt).toDateString() === today).length;
    const total = sent.length + failed.length;

    return {
        totalContacts: recipients.length,
        sentToday,
        totalSent: sent.length,
        failedTotal: failed.length,
        successRate: total > 0 ? Math.round((sent.length / total) * 100) : 0,
        queued: queued.length,
    };
}

/* ── SMS sending + offline queue ─────────────────────────────────── */

function isNetworkError(err: unknown): boolean {
    return err instanceof TypeError;
}

function failureSummary(
    recipients: { name: string; phone: string }[],
    error: string
): SendSummary {
    return {
        success: false,
        sent: 0,
        failed: recipients.length,
        results: recipients.map((r) => ({
            name: r.name,
            phone: r.phone,
            status: "failed",
            error,
        })),
    };
}

/** Stores a send for later (device offline). */
export function queueSend(payload: {
    recipients: { name: string; phone: string }[];
    message: string;
    simulate: boolean;
}): PendingSend {
    const uid = activeUserId();
    const pending: PendingSend = {
        id: `ps_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        userId: uid,
        recipients: payload.recipients,
        message: payload.message,
        simulate: payload.simulate,
        createdAt: new Date().toISOString(),
    };
    const list = readLS<PendingSend[]>(LS_PENDING_SENDS, []);
    writeLS(LS_PENDING_SENDS, [...list, pending]);

    // Local "queued" log entries so the user sees them in the history.
    const logs = readLS<SmsLog[]>(uLogs(uid), []);
    const now = new Date().toISOString();
    const entries: SmsLog[] = payload.recipients.map((r, i) => ({
        id: `log_${Date.now()}_${i}`,
        name: r.name,
        phone: r.phone,
        message: payload.message,
        status: "queued",
        sentAt: now,
        pendingId: pending.id,
    }));
    writeLS(uLogs(uid), [...entries, ...logs]);
    return pending;
}

export function getPendingSends(): PendingSend[] {
    return readLS<PendingSend[]>(LS_PENDING_SENDS, []);
}

export function removeQueuedSend(id: string): void {
    writeLS(
        LS_PENDING_SENDS,
        getPendingSends().filter((p) => p.id !== id)
    );
}

function updateQueuedLogs(
    pendingId: string,
    results: SendResultItem[],
    fallbackMessage: string,
    uid: string
): void {
    const logs = readLS<SmsLog[]>(uLogs(uid), []);
    const remaining = [...results];
    let changed = false;
    const next = logs.map((l) => {
        if (l.pendingId !== pendingId) return l;
        const r = remaining.shift();
        if (!r) return l;
        changed = true;
        return {
            ...l,
            status: r.status === "failed" ? ("failed" as const) : ("sent" as const),
            message: r.message ?? l.message ?? fallbackMessage,
            error: r.error,
            pendingId: undefined,
        };
    });
    if (changed) writeLS(uLogs(uid), next);
}

/**
 * Removes the given phones from the current account's directory.
 * Used after a send so the directory does not get cluttered (admin setting).
 */
export async function removeSentFromDirectory(
    phones: string[],
    uid?: string
): Promise<number> {
    const owner = uid || activeUserId();
    const set = new Set(phones.map((p) => formatCamPhone(p)));
    if (set.size === 0) return 0;

    if (getMode() === "firebase") {
        try {
            const data = await safeApi<{ citizens?: Array<Record<string, unknown>> }>(
                `/api/citizens?institutionId=${INSTITUTION_ID}&userId=${encodeURIComponent(owner)}`
            );
            if (data?.citizens) {
                const ids = data.citizens
                    .filter((c) => set.has(formatCamPhone(String(c.phoneNumber ?? ""))))
                    .map((c) => String(c.id));
                if (ids.length) await deleteRecipients(ids);
                return ids.length;
            }
        } catch {
            /* best effort */
        }
        return 0;
    }

    const list = readLS<Recipient[]>(uRecipients(owner), []);
    const remaining = list.filter((r) => !set.has(formatCamPhone(r.phone)));
    if (remaining.length !== list.length) writeLS(uRecipients(owner), remaining);
    return list.length - remaining.length;
}

interface SendPayload {
    recipients: { name: string; phone: string }[];
    message: string;
    simulate: boolean;
    institutionId: string;
    userId: string;
}

async function performSend(payload: SendPayload, allowQueue: boolean): Promise<SendSummary> {
    try {
        const res = await fetch("/api/send-sms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const data = (await res.json().catch(() => ({}))) as SendSummary & { error?: string };
        if (!res.ok) {
            return failureSummary(payload.recipients, data.error ?? "Erreur serveur");
        }
        return {
            success: data.success ?? true,
            sent: data.sent ?? 0,
            failed: data.failed ?? 0,
            results: data.results ?? [],
        };
    } catch (err) {
        if (allowQueue && isNetworkError(err)) {
            queueSend(payload);
            return {
                success: true,
                sent: 0,
                failed: 0,
                queued: payload.recipients.length,
                results: payload.recipients.map((r) => ({
                    name: r.name,
                    phone: r.phone,
                    status: "queued" as const,
                })),
            };
        }
        return failureSummary(
            payload.recipients,
            err instanceof Error ? err.message : "Erreur réseau"
        );
    }
}

/**
 * Sends a personalized SMS to each recipient.
 * The server sanitizes each message and dispatches through MboaSMS unless
 * `simulate` is true. When the device is offline the send is queued locally
 * and replayed as soon as the connection is back.
 * After a successful send, the notified phones are removed from the account
 * directory when the (admin) cleanup setting is enabled.
 */
export async function sendSms(
    recipients: { name: string; phone: string }[],
    message: string,
    simulate: boolean
): Promise<SendSummary> {
    const uid = activeUserId();
    const payload: SendPayload = {
        recipients,
        message,
        simulate,
        institutionId: INSTITUTION_ID,
        userId: uid,
    };

    let summary = await performSend(payload, true);

    // Persist log entries locally (local mode) — queued sends were already logged.
    if (getMode() === "local" && summary.queued === undefined) {
        const logs = readLS<SmsLog[]>(uLogs(uid), []);
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
        writeLS(uLogs(uid), [...entries, ...logs]);
    }

    // Directory cleanup (admin setting, skipped for queued/offline sends).
    if (summary.success && summary.queued === undefined && getCleanupAfterSend()) {
        const sentPhones = summary.results.filter((r) => r.status === "sent").map((r) => r.phone);
        const cleaned = await removeSentFromDirectory(sentPhones, uid);
        if (cleaned > 0) summary = { ...summary, cleaned };
    }

    return summary;
}

/** Replays the queued sends. Called when the device comes back online. */
export async function flushPendingSends(): Promise<{
    flushed: number;
    failed: number;
    remaining: number;
}> {
    const pending = getPendingSends();
    if (pending.length === 0) return { flushed: 0, failed: 0, remaining: 0 };

    let flushed = 0;
    let failed = 0;
    for (const p of pending) {
        const summary = await performSend(
            {
                recipients: p.recipients,
                message: p.message,
                simulate: p.simulate,
                institutionId: INSTITUTION_ID,
                userId: p.userId,
            },
            false
        );
        if (summary.success) {
            removeQueuedSend(p.id);
            updateQueuedLogs(p.id, summary.results, p.message, p.userId);
            if (getCleanupAfterSend()) {
                const sentPhones = summary.results.filter((r) => r.status === "sent").map((r) => r.phone);
                await removeSentFromDirectory(sentPhones, p.userId);
            }
            flushed++;
        } else {
            failed++;
        }
    }
    return { flushed, failed, remaining: getPendingSends().length };
}

/* ── Settings (per account, local) ───────────────────────────────── */

export function getSettings(): Settings {
    return {
        ...DEFAULT_SETTINGS,
        ...readLS<Partial<Settings>>(uSettings(activeUserId()), {}),
    };
}

export function saveSettings(settings: Settings): void {
    writeLS(uSettings(activeUserId()), settings);
}

export function clearLocalData(): void {
    const uid = activeUserId();
    removeLS(uRecipients(uid));
    removeLS(uLogs(uid));
}

/* ── Pending selection (contacts → compose) ─────────────────────── */

/** Stores the recipients selected on the Contacts page for the compose page. */
export function setPendingSelection(recipients: { name: string; phone: string }[]): void {
    writeLS(pendingSelKey(activeUserId()), recipients);
}

/** Reads and clears the pending selection (used once by the compose page). */
export function takePendingSelection(): { name: string; phone: string }[] {
    const key = pendingSelKey(activeUserId());
    const pending = readLS<{ name: string; phone: string }[]>(key, []);
    if (pending.length > 0) removeLS(key);
    return pending;
}

/* ── Selected contact ids (survive back/forward navigation) ─────── */

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

/** Restores the ids selected on the Contacts page (per tab + account session). */
export function loadSelectedIds(): string[] {
    return readSS<string[]>(selectedKey(activeUserId()), []);
}

/** Persists the ids selected on the Contacts page (per tab + account session). */
export function saveSelectedIds(ids: string[]): void {
    writeSS(selectedKey(activeUserId()), ids);
}
