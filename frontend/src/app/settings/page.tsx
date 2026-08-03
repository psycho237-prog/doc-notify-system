"use client";

import { useEffect, useState } from "react";
import {
    Building2,
    Database,
    FlaskConical,
    Languages,
    Trash2,
    Save,
    Loader2,
    CheckCircle2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/lang-context";
import {
    clearLocalData,
    getMode,
    getSettings,
    saveSettings,
} from "@/lib/data";
import type { Settings as AppSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const { t, lang, setLang } = useTranslation();
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setSettings(getSettings());
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
