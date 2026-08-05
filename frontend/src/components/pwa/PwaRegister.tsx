"use client";

import { useEffect } from "react";

/** Registers the PWA service worker (app shell caching + offline fallback). */
export function PwaRegister() {
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!("serviceWorker" in navigator)) return;
        navigator.serviceWorker
            .register("/sw.js")
            .catch(() => {
                /* SW registration is optional */
            });
    }, []);
    return null;
}
