"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    UserCog,
    UserPlus,
    ShieldCheck,
    Trash2,
    Loader2,
    Mail,
    KeyRound,
    X,
    CheckCircle2,
    ArrowLeft,
    Pencil,
    Lock,
    Unlock,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/lang-context";
import {
    createUserAccount,
    deleteUserAccount,
    getCurrentUserAsync,
    getUsersAsync,
    updateUserAccount,
} from "@/lib/data";
import type { UserAccount, UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function UsersPage() {
    const { t } = useTranslation();

    const [allowed, setAllowed] = useState<boolean | null>(null);
    const [me, setMe] = useState<UserAccount | null>(null);
    const [users, setUsers] = useState<UserAccount[]>([]);
    const [loading, setLoading] = useState(true);

    // Create form
    const [modalOpen, setModalOpen] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<UserRole>("user");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Edit form
    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState<UserAccount | null>(null);
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editRole, setEditRole] = useState<UserRole>("user");
    const [editDisabled, setEditDisabled] = useState(false);
    const [editPassword, setEditPassword] = useState("");
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState("");

    const load = async () => {
        const [meUser, all] = await Promise.all([getCurrentUserAsync(), getUsersAsync()]);
        setMe(meUser);
        setAllowed(meUser?.role === "superadmin");
        setUsers(all);
        setLoading(false);
    };

    useEffect(() => {
        load();
    }, []);

    const openCreate = () => {
        setName("");
        setEmail("");
        setPassword("");
        setRole("user");
        setError("");
        setModalOpen(true);
    };

    const handleCreate = async () => {
        setError("");
        if (!name.trim() || !email.trim() || password.length < 6) {
            setError(t("users_error_invalid"));
            return;
        }
        setSaving(true);
        try {
            await createUserAccount({ name, email, password, role });
            setModalOpen(false);
            await load();
        } catch (err) {
            const code = (err as Error)?.message;
            if (code === "exists") setError(t("users_error_exists"));
            else if (code === "invalid_email") setError(t("users_error_email"));
            else if (code === "offline") setError(t("users_error_offline"));
            else setError(t("users_error_create"));
        } finally {
            setSaving(false);
        }
    };

    const openEdit = (user: UserAccount) => {
        setEditing(user);
        setEditName(user.name);
        setEditEmail(user.email);
        setEditRole(user.role);
        setEditDisabled(!!user.disabled);
        setEditPassword("");
        setEditError("");
        setEditOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editing) return;
        setEditError("");
        if (!editName.trim() || !editEmail.trim()) {
            setEditError(t("users_error_invalid"));
            return;
        }
        if (editPassword && editPassword.length < 6) {
            setEditError(t("users_error_invalid"));
            return;
        }
        setEditSaving(true);
        try {
            await updateUserAccount(editing.id, {
                name: editName.trim(),
                email: editEmail.trim(),
                role: editRole,
                disabled: editDisabled,
                password: editPassword || undefined,
            });
            setEditOpen(false);
            await load();
        } catch (err) {
            const code = (err as Error)?.message;
            if (code === "exists") setEditError(t("users_error_exists"));
            else if (code === "invalid_email") setEditError(t("users_error_email"));
            else if (code === "offline") setEditError(t("users_error_offline"));
            else setEditError(t("users_error_update"));
        } finally {
            setEditSaving(false);
        }
    };

    const handleToggleLock = async (user: UserAccount) => {
        if (user.id === me?.id || user.id === "u-admin") return;
        const willLock = !user.disabled;
        const msg = willLock
            ? t("users_lock_confirm").replace("{name}", user.name)
            : t("users_unlock_confirm").replace("{name}", user.name);
        if (!confirm(msg)) return;
        try {
            await updateUserAccount(user.id, { disabled: willLock });
            await load();
        } catch (err) {
            const code = (err as Error)?.message;
            if (code === "offline") setError(t("users_error_offline"));
            else setError(t("users_error_lock"));
        }
    };

    const handleDelete = async (user: UserAccount) => {
        if (user.id === me?.id) return;
        if (!confirm(t("users_delete_confirm").replace("{name}", user.name))) return;
        try {
            await deleteUserAccount(user.id);
            await load();
        } catch {
            setError(t("users_error_delete"));
        }
    };

    /* ── Access denied ── */
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

    return (
        <DashboardLayout>
            <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">{t("users_title")}</h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">{t("users_subtitle")}</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-1.5 text-xs font-black text-white bg-[#1e3a8a] rounded-xl px-3 py-2.5 shadow-md shadow-blue-900/20 transition-all hover:bg-blue-900 active:scale-95 flex-shrink-0"
                >
                    <UserPlus className="w-4 h-4" /> {t("users_new")}
                </button>
            </div>

            {error && !modalOpen && (
                <div className="mb-4 flex items-center justify-between gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    <p className="text-xs text-red-600 font-medium">{error}</p>
                    <button
                        onClick={() => setError("")}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-100 transition-colors flex-shrink-0"
                        aria-label={t("common_close")}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-8 h-8 text-[#1e3a8a] animate-spin" />
                </div>
            ) : (
                <div className="space-y-2.5">
                    {users.map((u) => {
                        const isMe = u.id === me?.id;
                        const isSuper = u.role === "superadmin";
                        return (
                            <div
                                key={u.id}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3"
                            >
                                <div
                                    className={cn(
                                        "w-11 h-11 rounded-xl text-white flex items-center justify-center font-black text-sm flex-shrink-0",
                                        isSuper
                                            ? "bg-gradient-to-br from-amber-500 to-orange-600"
                                            : "bg-gradient-to-br from-[#1e3a8a] to-blue-600"
                                    )}
                                >
                                    {u.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .slice(0, 2)
                                        .join("")
                                        .toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-gray-900 truncate">
                                        {u.name}
                                        {isMe && (
                                            <span className="ml-2 text-[10px] font-black text-gray-400">
                                                ({t("users_you")})
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs text-gray-400 font-mono truncate">{u.email}</p>
                                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                                        {t("users_created")}{" "}
                                        {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {u.disabled && (
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-gray-100 text-gray-500 border-gray-200 inline-flex items-center gap-1">
                                            <Lock className="w-3 h-3" /> {t("users_locked")}
                                        </span>
                                    )}
                                    <span
                                        className={cn(
                                            "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border hidden sm:inline-block",
                                            isSuper
                                                ? "bg-amber-50 text-amber-700 border-amber-100"
                                                : "bg-blue-50 text-[#1e3a8a] border-blue-100"
                                        )}
                                    >
                                        {isSuper ? t("users_role_superadmin") : t("users_role_user")}
                                    </span>
                                    <button
                                        onClick={() => openEdit(u)}
                                        className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-300 hover:text-[#1e3a8a] hover:bg-blue-50 transition-colors"
                                        aria-label={t("users_edit")}
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleToggleLock(u)}
                                        disabled={isMe || u.id === "u-admin"}
                                        title={u.disabled ? t("users_unlock") : t("users_lock")}
                                        className={cn(
                                            "w-9 h-9 flex items-center justify-center rounded-xl transition-colors disabled:opacity-30 disabled:pointer-events-none",
                                            u.disabled
                                                ? "text-amber-500 hover:bg-amber-50"
                                                : "text-gray-300 hover:text-amber-500 hover:bg-amber-50"
                                        )}
                                        aria-label={u.disabled ? t("users_unlock") : t("users_lock")}
                                    >
                                        {u.disabled ? (
                                            <Unlock className="w-4 h-4" />
                                        ) : (
                                            <Lock className="w-4 h-4" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(u)}
                                        disabled={isMe || u.id === "u-admin"}
                                        className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                        aria-label={t("users_delete")}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Edit account modal ── */}
            {editOpen && editing && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 p-0 md:p-4">
                    <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                                    <Pencil className="w-4 h-4 text-[#1e3a8a]" />
                                </div>
                                <h3 className="text-base font-black text-gray-900">{t("users_edit_title")}</h3>
                            </div>
                            <button
                                onClick={() => setEditOpen(false)}
                                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                                aria-label={t("common_close")}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
                            {/* Name */}
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">
                                    {t("users_name")}
                                </label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] transition-all"
                                />
                            </div>
                            {/* Email (editable, uniqueness-checked) */}
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">
                                    {t("users_email")}
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="email"
                                        value={editEmail}
                                        onChange={(e) => setEditEmail(e.target.value)}
                                        placeholder="agent@nnlomne.gov"
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] transition-all"
                                    />
                                </div>
                            </div>
                            {/* Role (locked for the current account) */}
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">
                                    {t("users_role")}
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setEditRole("user")}
                                        disabled={editing.id === me?.id}
                                        className={cn(
                                            "py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all",
                                            editRole === "user"
                                                ? "bg-[#1e3a8a] text-white shadow-md"
                                                : "bg-gray-50 text-gray-500 hover:bg-gray-100",
                                            editing.id === me?.id && "opacity-40 pointer-events-none"
                                        )}
                                    >
                                        {t("users_role_user")}
                                    </button>
                                    <button
                                        onClick={() => setEditRole("superadmin")}
                                        disabled={editing.id === me?.id}
                                        className={cn(
                                            "py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all",
                                            editRole === "superadmin"
                                                ? "bg-amber-500 text-white shadow-md"
                                                : "bg-gray-50 text-gray-500 hover:bg-gray-100",
                                            editing.id === me?.id && "opacity-40 pointer-events-none"
                                        )}
                                    >
                                        {t("users_role_superadmin")}
                                    </button>
                                </div>
                                {editing.id === me?.id && (
                                    <p className="text-[10px] font-bold text-amber-600 mt-1.5">
                                        {t("users_self_role_lock")}
                                    </p>
                                )}
                            </div>
                            {/* Lock account (temporary disable) */}
                            <div
                                className={cn(
                                    "flex items-center justify-between gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3",
                                    editing.id === me?.id && "opacity-40 pointer-events-none"
                                )}
                            >
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className={cn(
                                            "w-9 h-9 rounded-xl flex items-center justify-center",
                                            editDisabled ? "bg-amber-100" : "bg-gray-200"
                                        )}
                                    >
                                        {editDisabled ? (
                                            <Lock className="w-4 h-4 text-amber-600" />
                                        ) : (
                                            <Unlock className="w-4 h-4 text-gray-500" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-gray-900">
                                            {editDisabled ? t("users_locked") : t("users_lock")}
                                        </p>
                                        <p className="text-[11px] text-gray-500 font-medium">
                                            {t("users_lock_desc")}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEditDisabled((v) => !v)}
                                    disabled={editing.id === me?.id}
                                    aria-checked={editDisabled}
                                    role="switch"
                                    className={cn(
                                        "relative w-11 h-6 rounded-full transition-colors flex-shrink-0",
                                        editDisabled ? "bg-amber-500" : "bg-gray-300"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all",
                                            editDisabled ? "left-[22px]" : "left-0.5"
                                        )}
                                    />
                                </button>
                            </div>
                            {/* Password reset (optional) */}
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">
                                    {t("users_pw_reset")}
                                </label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="password"
                                        value={editPassword}
                                        onChange={(e) => setEditPassword(e.target.value)}
                                        placeholder={t("users_pw_keep")}
                                        autoComplete="new-password"
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] transition-all font-mono placeholder:text-gray-300 placeholder:text-[11px]"
                                    />
                                </div>
                            </div>

                            {editError && (
                                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 font-medium">
                                    {editError}
                                </p>
                            )}
                        </div>

                        <div className="px-5 py-4 border-t border-gray-50">
                            <Button
                                onClick={handleSaveEdit}
                                disabled={editSaving}
                                className="w-full bg-[#1e3a8a] hover:bg-blue-900 text-white py-4 rounded-xl font-black shadow-lg shadow-blue-900/20 active:scale-[0.98]"
                            >
                                {editSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4" />
                                )}
                                <span className="ml-2">{t("users_save_changes")}</span>
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Create account modal ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 p-0 md:p-4">
                    <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                                    <UserCog className="w-4 h-4 text-[#1e3a8a]" />
                                </div>
                                <h3 className="text-base font-black text-gray-900">{t("users_new")}</h3>
                            </div>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                                aria-label={t("common_close")}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">
                                    {t("users_name")}
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">
                                    {t("users_email")}
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="agent@nnlomne.gov"
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">
                                    {t("users_password")}
                                </label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] transition-all font-mono"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">
                                    {t("users_role")}
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setRole("user")}
                                        className={cn(
                                            "py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all",
                                            role === "user"
                                                ? "bg-[#1e3a8a] text-white shadow-md"
                                                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                                        )}
                                    >
                                        {t("users_role_user")}
                                    </button>
                                    <button
                                        onClick={() => setRole("superadmin")}
                                        className={cn(
                                            "py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all",
                                            role === "superadmin"
                                                ? "bg-amber-500 text-white shadow-md"
                                                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                                        )}
                                    >
                                        {t("users_role_superadmin")}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 font-medium">
                                    {error}
                                </p>
                            )}
                        </div>

                        <div className="px-5 py-4 border-t border-gray-50">
                            <Button
                                onClick={handleCreate}
                                disabled={saving}
                                className="w-full bg-[#1e3a8a] hover:bg-blue-900 text-white py-4 rounded-xl font-black shadow-lg shadow-blue-900/20 active:scale-[0.98]"
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4" />
                                )}
                                <span className="ml-2">{t("users_create")}</span>
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
