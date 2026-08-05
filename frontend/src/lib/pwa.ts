"use client";

import { useEffect, useRef, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/**
 * Tracks whether the browser offers an "install app" prompt (PWA) and exposes
 * the install() action to trigger it.
 */
export function usePwaInstall() {
    const [canInstall, setCanInstall] = useState(false);
    const promptRef = useRef<BeforeInstallPromptEvent | null>(null);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            promptRef.current = e as BeforeInstallPromptEvent;
            setCanInstall(true);
        };
        const onInstalled = () => {
            promptRef.current = null;
            setCanInstall(false);
        };
        window.addEventListener("beforeinstallprompt", handler);
        window.addEventListener("appinstalled", onInstalled);
        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
            window.removeEventListener("appinstalled", onInstalled);
        };
    }, []);

    const install = async (): Promise<boolean> => {
        const prompt = promptRef.current;
        if (!prompt) return false;
        prompt.prompt();
        try {
            await prompt.userChoice;
        } catch {
            /* dismissed */
        }
        promptRef.current = null;
        setCanInstall(false);
        return true;
    };

    return { canInstall, install };
}
