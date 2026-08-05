"use client";

import { useEffect } from "react";

/** Registers the PWA service worker (app shell caching + offline fallback). */
export function PwaRegister() {
    useEffect(() => {
        if (typeof window === "undefined") return;

        // Guard: warn in the browser console if the PWA icons are missing — the
        // app is not installable and the SW shell cannot be fully precached.
        Promise.all([fetch("/icons/icon-192.png"), fetch("/icons/icon-512.png")])
            .then(([p192, p512]) => {
                if (!p192.ok || !p512.ok) {
                    console.warn(
                        `[PWA] Icons missing: /icons/icon-192.png and /icons/icon-512.png ` +
                            `returned HTTP ${p192.status} and ${p512.status}. Run ` +
                            "`node scripts/generate-icons.mjs` from the repo root, then hard-reload."
                    );
                }
            })
            .catch(() => {
                /* offline or blocked — nothing to warn about */
            });

        if (!("serviceWorker" in navigator)) return;
        navigator.serviceWorker
            .register("/sw.js")
            .catch(() => {
                /* SW registration is optional */
            });
    }, []);
    return null;
}
