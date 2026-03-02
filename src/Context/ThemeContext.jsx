import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

// ألوان الثيم الليلي (الحالي)
const DARK_VARS = {
    "--bg-base": "#0f1117",
    "--bg-surface": "#1a1d27",
    "--bg-card": "#1f2235",
    "--bg-hover": "#252840",
    "--border": "#2d3152",
    "--border-light": "#3d4166",
    "--text-primary": "#f1f3ff",
    "--text-secondary": "#9ba3c8",
    "--text-muted": "#5a6080",
};

// ألوان الثيم النهاري
const LIGHT_VARS = {
    "--bg-base": "#f0f2f8",
    "--bg-surface": "#ffffff",
    "--bg-card": "#ffffff",
    "--bg-hover": "#e8eaf5",
    "--border": "#d1d5e8",
    "--border-light": "#b8bee0",
    "--text-primary": "#1a1d2e",
    "--text-secondary": "#4a5070",
    "--text-muted": "#8890b0",
};

function applyTheme(resolvedTheme) {
    const vars = resolvedTheme === "light" ? LIGHT_VARS : DARK_VARS;
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    root.setAttribute("data-theme", resolvedTheme);
}

function getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(() => {
        return localStorage.getItem("theme") || "dark";
    });

    const resolvedTheme = theme === "system" ? getSystemTheme() : theme;

    useEffect(() => {
        localStorage.setItem("theme", theme);
        applyTheme(resolvedTheme);
    }, [theme, resolvedTheme]);

    // مراقبة تغيير إعداد النظام
    useEffect(() => {
        if (theme !== "system") return;
        const mq = window.matchMedia("(prefers-color-scheme: light)");
        const handler = () => applyTheme(getSystemTheme());
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, [theme]);

    const setTheme = (t) => setThemeState(t);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
    return ctx;
}
