"use client";

import { useCallback, useEffect, useState } from "react";
import { WifiOff, Wifi, Send, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/lang-context";
import { flushPendingSends, getPendingSends } from "@/lib/data";
import type { PendingSend } from "@/lib/types";
import { cn } from "@/lib/utils";

export function OfflineBanner() {
    const { t } = useTranslation();
    const [online, setOnline] = useState(true);
    const [pending, setPending] = useState<PendingSend[]>([]);
    const [flushing, setFlushing] = useState(false);
    const [flashOnline, setFlashOnline] = useState(false);

    const refresh = useCallback(() => {
        setOnline(typeof navigator === "undefined" ? true : navigator.onLine);
        setPending(getPendingSends());
    }, []);

    useEffect(() => {
        const onOnline = async () => {
            setOnline(true);
            setFlashOnline(true);
            setTimeout(() => setFlashOnline(false), 3000);
            setFlushing(true);
            try {
                await flushPendingSends();
            } finally {
                setFlushing(false);
                refresh();
            }
        };
        const onOffline = () => refresh();
        window.addEventListener("online", onOnline);
        window.addEventListener("offline", onOffline);
        refresh();
        return () => {
            window.removeEventListener("online", onOnline);
            window.removeEventListener("offline", onOffline);
        };
    }, [refresh]);

    const handleFlush = async () => {
        setFlushing(true);
        try {
            await flushPendingSends();
        } finally {
            setFlushing(false);
            refresh();
        }
    };

    const showBanner = !online || pending.length > 0 || flashOnline || flushing;

    if (!showBanner) return null;

    return (
        <div className="mb-4 space-y-2">
            {!online && (
                <div className="flex items-center gap-2.5 bg-gray-900 text-white text-xs font-bold rounded-2xl px-4 py-3 shadow-lg">
                    <WifiOff className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>{t("offline_banner")}</span>
                </div>
            )}
            {(pending.length > 0 || flushing) && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold rounded-2xl px-4 py-3">
                    <Send className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span className="flex-1 min-w-0">
                        {flushing
                            ? t("offline_flushing")
                            : t("offline_pending").replace("{n}", String(pending.length))}
                    </span>
                    <button
                        onClick={handleFlush}
                        disabled={flushing || !online}
                        className={cn(
                            "flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1.5 rounded-xl font-black transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex-shrink-0",
                            online ? "hover:bg-amber-600" : "opacity-40"
                        )}
                    >
                        {flushing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Send className="w-3.5 h-3.5" />
                        )}
                        {t("offline_flush")}
                    </button>
                </div>
            )}
            {flashOnline && !pending.length && !flushing && (
                <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 text-green-800 text-xs font-bold rounded-2xl px-4 py-3">
                    <Wifi className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>{t("offline_back_online")}</span>
                </div>
            )}
        </div>
    );
}
