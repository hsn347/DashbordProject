import { createContext, useContext, useState, useEffect } from "react";
import translations from "../i18n/translations";

const LanguageContext = createContext(null);

const SUPPORTED = ["ar", "en", "tr"];
const DIR_MAP = { ar: "rtl", en: "ltr", tr: "ltr" };
const LOCALE_MAP = { ar: "ar-SA", en: "en-US", tr: "tr-TR" };

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState(() => {
        const stored = localStorage.getItem("lang");
        return SUPPORTED.includes(stored) ? stored : "ar";
    });

    useEffect(() => {
        localStorage.setItem("lang", lang);
        document.documentElement.setAttribute("lang", lang);
        document.documentElement.setAttribute("dir", DIR_MAP[lang]);
    }, [lang]);

    const t = (key) => {
        const val = translations[lang]?.[key];
        if (val === undefined) return translations["ar"][key] ?? key;
        return val;
    };

    const dir = DIR_MAP[lang];
    const locale = LOCALE_MAP[lang];

    const fmtDate = (iso, opts = { month: "short", day: "numeric" }) => {
        if (!iso) return null;
        return new Date(iso).toLocaleDateString(locale, opts);
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang, t, dir, locale, fmtDate, SUPPORTED }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error("useLanguage must be inside LanguageProvider");
    return ctx;
}
