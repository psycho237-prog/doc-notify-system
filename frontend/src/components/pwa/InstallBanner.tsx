"use client";

import { usePwaInstall } from "@/lib/pwa";
import { useTranslation } from "@/lib/lang-context";
import { Smartphone, X, Download, CheckCircle2 } from "lucide-react";
import { useState } from "react";

/** Remember the dismissal across navigations (DashboardLayout remounts per page). */
const DISMISS_KEY = "nnlomne-pwa-banner-dismissed";

function wasDismissed(): boolean {
    if (typeof window === "undefined") return false;
    try {
        return window.localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
        return false;
    }
}

/**
 * Proactive "install the app" banner. Chrome only fires `beforeinstallprompt`
 * once the PWA is installable (HTTPS + manifest with PNG icons + SW), and it
 * does NOT show a browser prompt on its own on desktop — so we surface our own
 * banner that calls prompt() when the user taps "Installer".
 */
export function InstallBanner() {
    const { t } = useTranslation();
    const { canInstall, install } = usePwaInstall();
    const [dismissed, setDismissed] = useState(wasDismissed);
    const [installed, setInstalled] = useState(false);

    if (!canInstall || dismissed || installed) return null;

    return (
        <div className="bg-gradient-to-r from-[#1e3a8a] to-blue-700 rounded-2xl shadow-lg shadow-blue-900/20 text-white p-4 mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-black leading-tight">{t("pwa_banner_title")}</p>
                    <p className="text-[11px] text-blue-100 font-medium mt-0.5 leading-snug">
                        {t("pwa_banner_desc")}
                    </p>
                </div>
                <button
                    onClick={() => {
                        try {
                            window.localStorage.setItem(DISMISS_KEY, "1");
                        } catch {
                            /* storage unavailable */
                        }
                        setDismissed(true);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0 -mt-1 -mr-1 sm:mt-0 sm:mr-0 sm:self-center"
                    aria-label={t("common_close")}
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
            <button
                onClick={async () => {
                    const ok = await install();
                    if (ok) {
                        setInstalled(true);
                        setTimeout(() => setInstalled(false), 3000);
                    }
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-white text-[#1e3a8a] text-xs font-black px-4 py-2.5 rounded-xl shadow-sm transition-all hover:bg-blue-50 active:scale-95 flex-shrink-0"
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
        </div>
    );
}
