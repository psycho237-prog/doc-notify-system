"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { type Lang, type TranslationKey, t as translate } from "./i18n";

interface LangContextType {
    lang: Lang;
    setLang: (l: Lang) => void;
    t: (key: TranslationKey) => string;
}

const LangContext = createContext<LangContextType>({
    lang: "fr",
    setLang: () => {},
    t: (key) => key,
});

export function LangProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<Lang>("fr");

    useEffect(() => {
        const stored = localStorage.getItem("lang") as Lang | null;
        if (stored === "en" || stored === "fr") {
            setLangState(stored);
        }
    }, []);

    const setLang = (l: Lang) => {
        setLangState(l);
        localStorage.setItem("lang", l);
    };

    const t = (key: TranslationKey) => translate(key, lang);

    return (
        <LangContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LangContext.Provider>
    );
}

export function useTranslation() {
    return useContext(LangContext);
}
