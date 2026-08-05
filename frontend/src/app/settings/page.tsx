"use client";

import { useEffect, useState } from "react";
import {
    Building2,
    Database,
    DatabaseBackup,
    FlaskConical,
    Languages,
    KeyRound,
    Trash2,
    Save,
    Loader2,
    CheckCircle2,
    Smartphone,
    Download,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/lang-context";
import { usePwaInstall } from "@/lib/pwa";
import {
    checkLocalPassword,
    clearLocalData,
    getCleanupAfterSend,
    getMode,
    getSettings,
    isSuperAdminAsync,
    migrateLegacyData,
    saveSettings,
    setCleanupAfterSend,
    setLocalPassword,
} from "@/lib/data";
import type { Settings as AppSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const { t, lang, setLang } = useTranslation();
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [pwBusy, setPwBusy] = useState(false);
    const [pwError, setPwError] = useState("");
    const [pwSuccess, setPwSuccess] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [cleanup, setCleanup] = useState(true);
    const [installed, setInstalled] = useState(false);
    const { canInstall, install } = usePwaInstall();
    const [migrating, setMigrating] = useState(false);
    const [migrateResult, setMigrateResult] = useState("");
    const [migrateError, setMigrateError] = useState("");

    useEffect(() => {
        setSettings(getSettings());
        setCleanup(getCleanupAfterSend());
        isSuperAdminAsync().then(setIsAdmin);
    }, []);

    if (!settings) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-8 h-8 text-[#1e3a8a] animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    const isLocalMode = getMode() === "local";

    const handleMigrate = async () => {
        if (!confirm(t("settings_migrate_confirm"))) return;
        setMigrating(true);
        setMigrateError("");
        setMigrateResult("");
        try {
            const { migrated, errors } = await migrateLegacyData();
            const total = Object.values(migrated).reduce((a, b) => a + b, 0);
            setMigrateResult(t("settings_migrate_done").replace("{n}", String(total)));
            if (errors.length > 0) setMigrateError(t("settings_migrate_partial"));
        } catch (err) {
            const code = (err as Error)?.message;
            setMigrateError(
                code === "offline" ? t("settings_migrate_offline") : t("settings_migrate_error")
            );
        } finally {
            setMigrating(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        saveSettings(settings);
        await new Promise((r) => setTimeout(r, 600));
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const handleClear = () => {
        if (!confirm(t("settings_clear_confirm"))) return;
        clearLocalData();
        window.location.reload();
    };

    const handleChangePassword = async () => {
        setPwError("");
        if (newPw.length < 6) {
            setPwError(t("settings_pw_short"));
            return;
        }
        if (newPw !== confirmPw) {
            setPwError(t("settings_pw_mismatch"));
            return;
        }
        setPwBusy(true);
        try {
            if (isLocalMode) {
                if (!checkLocalPassword(currentPw)) throw new Error("wrong_current");
                setLocalPassword(newPw);
            } else {
                // Firebase mode: re-authenticate then update the Auth user.
                const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } =
                    await import("firebase/auth");
                const { auth } = await import("@/lib/firebase");
                const user = auth.currentUser;
                if (!user?.email) throw new Error("not_signed_in");
                await reauthenticateWithCredential(
                    user,
                    EmailAuthProvider.credential(user.email, currentPw)
                );
                await updatePassword(user, newPw);
            }
            setCurrentPw("");
            setNewPw("");
            setConfirmPw("");
            setPwSuccess(true);
            setTimeout(() => setPwSuccess(false), 3000);
        } catch (err) {
            const code = (err as { code?: string })?.code;
            if (
                code === "auth/wrong-password" ||
                code === "auth/invalid-credential" ||
                (err as Error).message === "wrong_current"
            ) {
                setPwError(t("settings_pw_wrong"));
            } else if (code === "auth/weak-password") {
                setPwError(t("settings_pw_short"));
            } else {
                setPwError(t("settings_pw_error"));
            }
        } finally {
            setPwBusy(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">{t("settings_title")}</h1>
                <p className="text-sm text-gray-500 font-medium mt-1">{t("settings_subtitle")}</p>
            </div>

            <div className="space-y-4">
                {/* Institution */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <p className="flex items-center gap-2 text-sm font-black text-gray-900 mb-3">
                        <Building2 className="w-4 h-4 text-[#1e3a8a]" /> {t("settings_institution")}
                    </p>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">
                        {t("settings_institution_name")}
                    </label>
                    <input
                        type="text"
                        value={settings.institutionName}
                        onChange={(e) =>
                            setSettings({ ...settings, institutionName: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] transition-all"
                    />
                </div>

                {/* Data mode */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <p className="flex items-center gap-2 text-sm font-black text-gray-900 mb-3">
                        <Database className="w-4 h-4 text-[#1e3a8a]" /> {t("settings_mode")}
                    </p>
                    <div
                        className={cn(
                            "px-3.5 py-3 rounded-xl border text-sm font-bold",
                            isLocalMode
                                ? "bg-blue-50 border-blue-100 text-blue-800"
                                : "bg-green-50 border-green-100 text-green-800"
                        )}
                    >
                        {isLocalMode ? t("settings_mode_local") : t("settings_mode_firebase")}
                    </div>
                </div>

                {/* Cleanup (super admin only) */}
                {isAdmin && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <Trash2 className="w-5 h-5 text-[#1e3a8a]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-gray-900">{t("settings_cleanup")}</p>
                            <p className="text-xs text-gray-400 font-medium mt-0.5">
                                {t("settings_cleanup_desc")}
                            </p>
                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">
                                {t("settings_cleanup_admin_only")}
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                const next = !cleanup;
                                setCleanup(next);
                                setCleanupAfterSend(next);
                            }}
                            className={cn(
                                "relative w-12 h-7 rounded-full transition-colors flex-shrink-0",
                                cleanup ? "bg-[#1e3a8a]" : "bg-gray-200"
                            )}
                            aria-pressed={cleanup}
                        >
                            <span
                                className={cn(
                                    "absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform",
                                    cleanup ? "left-[22px]" : "left-0.5"
                                )}
                            />
                        </button>
                    </div>
                )}

                {/* Legacy data migration (super admin + firebase mode) */}
                {isAdmin && !isLocalMode && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                        <p className="flex items-center gap-2 text-sm font-black text-gray-900 mb-1">
                            <DatabaseBackup className="w-4 h-4 text-[#1e3a8a]" /> {t("settings_migrate")}
                        </p>
                        <p className="text-xs text-gray-400 font-medium mb-3">
                            {t("settings_migrate_desc")}
                        </p>
                        <button
                            onClick={handleMigrate}
                            disabled={migrating}
                            className="w-full flex items-center justify-center gap-2 text-xs font-black text-white bg-[#1e3a8a] hover:bg-blue-900 py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
                        >
                            {migrating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <DatabaseBackup className="w-4 h-4" />
                            )}
                            {t("settings_migrate_btn")}
                        </button>
                        {migrateError && (
                            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 font-medium mt-3">
                                {migrateError}
                            </p>
                        )}
                        {migrateResult && (
                            <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-xl px-3 py-2 font-bold mt-3">
                                {migrateResult}
                            </p>
                        )}
                    </div>
                )}

                {/* PWA install */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <p className="flex items-center gap-2 text-sm font-black text-gray-900 mb-1">
                        <Smartphone className="w-4 h-4 text-[#1e3a8a]" /> {t("settings_pwa")}
                    </p>
                    <p className="text-xs text-gray-400 font-medium mb-3">{t("settings_pwa_desc")}</p>
                    <button
                        onClick={async () => {
                            const ok = await install();
                            if (ok) {
                                setInstalled(true);
                                setTimeout(() => setInstalled(false), 3000);
                            }
                        }}
                        disabled={!canInstall}
                        className="w-full flex items-center justify-center gap-2 text-xs font-black text-white bg-gray-900 hover:bg-gray-800 py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
                    >
                        {installed ? (
                            <>
                                <CheckCircle2 className="w-4 h-4" /> {t("settings_pwa_installed")}
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" /> {t("settings_pwa_install")}
                            </>
                        )}
                    </button>
                    {!canInstall && !installed && (
                        <p className="text-[10px] text-gray-400 font-medium mt-2">
                            {t("settings_pwa_unsupported")}
                        </p>
                    )}
                </div>

                {/* Simulation */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                        <FlaskConical className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-gray-900">{t("settings_simulate")}</p>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">
                            {t("settings_simulate_desc")}
                        </p>
                    </div>
                    <button
                        onClick={() => setSettings({ ...settings, simulateSms: !settings.simulateSms })}
                        className={cn(
                            "relative w-12 h-7 rounded-full transition-colors flex-shrink-0",
                            settings.simulateSms ? "bg-amber-500" : "bg-gray-200"
                        )}
                        aria-pressed={settings.simulateSms}
                    >
                        <span
                            className={cn(
                                "absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform",
                                settings.simulateSms ? "left-[22px]" : "left-0.5"
                            )}
                        />
                    </button>
                </div>

                {/* Language */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <p className="flex items-center gap-2 text-sm font-black text-gray-900 mb-3">
                        <Languages className="w-4 h-4 text-[#1e3a8a]" /> {t("settings_language")}
                    </p>
                    <div className="flex gap-2">
                        {(["fr", "en"] as const).map((l) => (
                            <button
                                key={l}
                                onClick={() => setLang(l)}
                                className={cn(
                                    "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                    lang === l
                                        ? "bg-[#1e3a8a] text-white shadow-md"
                                        : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                                )}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Change password */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <p className="flex items-center gap-2 text-sm font-black text-gray-900 mb-1">
                        <KeyRound className="w-4 h-4 text-[#1e3a8a]" /> {t("settings_password")}
                    </p>
                    <p className="text-xs text-gray-400 font-medium mb-3">
                        {isLocalMode
                            ? t("settings_pw_local_note")
                            : t("settings_pw_firebase_note")}
                    </p>
                    <div className="space-y-2.5">
                        <input
                            type="password"
                            value={currentPw}
                            onChange={(e) => {
                                setCurrentPw(e.target.value);
                                if (pwError) setPwError("");
                            }}
                            placeholder={t("settings_pw_current")}
                            autoComplete="current-password"
                            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] transition-all placeholder:text-gray-300"
                        />
                        <input
                            type="password"
                            value={newPw}
                            onChange={(e) => {
                                setNewPw(e.target.value);
                                if (pwError) setPwError("");
                            }}
                            placeholder={t("settings_pw_new")}
                            autoComplete="new-password"
                            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] transition-all placeholder:text-gray-300"
                        />
                        <input
                            type="password"
                            value={confirmPw}
                            onChange={(e) => {
                                setConfirmPw(e.target.value);
                                if (pwError) setPwError("");
                            }}
                            placeholder={t("settings_pw_confirm")}
                            autoComplete="new-password"
                            onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
                            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] transition-all placeholder:text-gray-300"
                        />
                        {pwError && (
                            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 font-medium">
                                {pwError}
                            </p>
                        )}
                        {pwSuccess && (
                            <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-xl px-3 py-2 font-bold">
                                {t("settings_pw_saved")}
                            </p>
                        )}
                        <Button
                            onClick={handleChangePassword}
                            disabled={pwBusy || !currentPw || !newPw || !confirmPw}
                            className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3.5 rounded-xl font-black text-sm shadow-sm transition-all active:scale-[0.98] whitespace-nowrap"
                        >
                            {pwBusy ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <KeyRound className="w-4 h-4" />
                            )}
                            <span className="ml-2">{t("settings_pw_btn")}</span>
                        </Button>
                    </div>
                </div>

                {/* Save */}
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className={cn(
                        "w-full py-5 rounded-2xl font-black shadow-lg transition-all active:scale-[0.98]",
                        saved
                            ? "bg-green-600 hover:bg-green-700 shadow-green-200"
                            : "bg-[#1e3a8a] hover:bg-blue-900 shadow-blue-900/20"
                    )}
                >
                    {saving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : saved ? (
                        <CheckCircle2 className="w-5 h-5" />
                    ) : (
                        <Save className="w-5 h-5" />
                    )}
                    <span className="ml-2">{saved ? t("settings_saved") : t("settings_save")}</span>
                </Button>

                {/* Danger zone (local mode only) */}
                {isLocalMode && (
                    <div className="bg-red-50/50 rounded-2xl border border-red-100 p-4">
                        <p className="text-sm font-black text-red-700 mb-1">{t("settings_danger")}</p>
                        <p className="text-xs text-red-500/80 font-medium mb-3">
                            {t("settings_clear_desc")}
                        </p>
                        <button
                            onClick={handleClear}
                            className="flex items-center gap-2 text-xs font-black text-red-600 bg-white border border-red-200 rounded-xl px-4 py-2.5 transition-all hover:bg-red-50 active:scale-95"
                        >
                            <Trash2 className="w-4 h-4" /> {t("settings_clear")}
                        </button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
