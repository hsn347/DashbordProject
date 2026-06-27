import { useState, useRef, useEffect } from "react";
import { LogOut, Menu, User, ShieldCheck, Sun, Moon, Monitor, Globe } from "lucide-react";
import { useAuthContext } from "../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTheme } from "../Context/ThemeContext";
import { useLanguage } from "../Context/LanguageContext";
import { useDomain } from "../Context/DomainContext";

const THEME_OPTIONS = [
    { key: "dark", icon: Moon, labelKey: "themeDark" },
    { key: "light", icon: Sun, labelKey: "themeLight" },
    { key: "system", icon: Monitor, labelKey: "themeSystem" },
];

const LANG_OPTIONS = [
    { key: "ar", flag: "🇸🇦", label: "العربية" },
    { key: "en", flag: "🇬🇧", label: "English" },
    { key: "tr", flag: "🇹🇷", label: "Türkçe" },
];

function Dropdown({ open, onClose, children }) {
    const ref = useRef(null);
    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open, onClose]);

    if (!open) return null;
    return (
        <div ref={ref} style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "var(--shadow-lg)",
            zIndex: 100,
            minWidth: 150,
            padding: "0.35rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.15rem",
        }}>
            {children}
        </div>
    );
}

function DropdownItem({ icon: Icon, label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.45rem 0.75rem",
                borderRadius: "var(--radius-sm)",
                background: active ? "var(--accent-soft)" : "transparent",
                color: active ? "var(--accent)" : "var(--text-secondary)",
                border: "none", cursor: "pointer", fontSize: "0.82rem",
                fontWeight: active ? 700 : 400, width: "100%", textAlign: "start",
                transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
        >
            {Icon && <Icon size={14} />}
            {label}
        </button>
    );
}

export default function Header({ onMenuClick, isAdmin }) {
    const { user, logout } = useAuthContext();
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();
    const { lang, setLang, t } = useLanguage();
    const { config } = useDomain();

    const [themeOpen, setThemeOpen] = useState(false);
    const [langOpen, setLangOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate("/login");
        toast.success(t("logoutSuccess"));
    };

    const themeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
    const ThemeIcon = themeIcon;
    const currentLang = LANG_OPTIONS.find((l) => l.key === lang);

    return (
        <header style={{
            height: 60,
            background: "var(--bg-surface)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 1.25rem",
            position: "fixed",
            top: 0, left: 0, right: 0,
            zIndex: 30,
            gap: "1rem",
        }}>
            {/* Left: menu + title */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                {isAdmin && (
                    <button onClick={onMenuClick} className="btn btn-ghost" style={{ padding: "0.4rem" }}>
                        <Menu size={20} />
                    </button>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {isAdmin && <ShieldCheck size={16} color="var(--gold)" />}
                    {/* Domain logo */}
                    {config.logoType === "image" && (
                        <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", border: "1.5px solid var(--accent)", flexShrink: 0 }}>
                            <img src={config.logo} alt={config.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                    )}
                    <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                        {isAdmin ? t("adminPanel") : config.name}
                    </span>
                </div>
            </div>

            {/* Right: controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>

                {/* ── Theme switcher ── */}
                <div style={{ position: "relative" }}>
                    <button
                        className="btn btn-ghost"
                        style={{ padding: "0.4rem 0.6rem", gap: "0.3rem" }}
                        onClick={() => { setThemeOpen((p) => !p); setLangOpen(false); }}
                        title={t("theme")}
                    >
                        <ThemeIcon size={16} />
                    </button>
                    <Dropdown open={themeOpen} onClose={() => setThemeOpen(false)}>
                        {THEME_OPTIONS.map(({ key, icon: Icon, labelKey }) => (
                            <DropdownItem
                                key={key}
                                icon={Icon}
                                label={t(labelKey)}
                                active={theme === key}
                                onClick={() => { setTheme(key); setThemeOpen(false); }}
                            />
                        ))}
                    </Dropdown>
                </div>

                {/* ── Language switcher ── */}
                <div style={{ position: "relative" }}>
                    <button
                        className="btn btn-ghost"
                        style={{ padding: "0.4rem 0.6rem", gap: "0.35rem", fontSize: "0.8rem" }}
                        onClick={() => { setLangOpen((p) => !p); setThemeOpen(false); }}
                        title={t("language")}
                    >
                        <Globe size={15} />
                        <span style={{ fontWeight: 700 }}>{currentLang?.flag}</span>
                    </button>
                    <Dropdown open={langOpen} onClose={() => setLangOpen(false)}>
                        {LANG_OPTIONS.map(({ key, flag, label }) => (
                            <DropdownItem
                                key={key}
                                label={`${flag} ${label}`}
                                active={lang === key}
                                onClick={() => { setLang(key); setLangOpen(false); }}
                            />
                        ))}
                    </Dropdown>
                </div>

                {/* ── User badge ── */}
                <div style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    background: "var(--bg-card)", border: "1px solid var(--border)",
                    borderRadius: "999px", padding: "0.3rem 0.75rem 0.3rem 0.4rem",
                }}>
                    <div style={{
                        width: 26, height: 26, borderRadius: "50%",
                        background: isAdmin ? "var(--gold-soft)" : "var(--accent-soft)",
                        border: `2px solid ${isAdmin ? "var(--gold)" : "var(--accent)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        {isAdmin ? <ShieldCheck size={13} color="var(--gold)" /> : <User size={13} color="var(--accent)" />}
                    </div>
                    <span className="header-user-email" style={{
                        fontSize: "0.8rem", color: "var(--text-secondary)",
                        maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                        {user?.email || (isAdmin ? t("adminOnly") : t("user"))}
                    </span>
                </div>

                <button
                    onClick={handleLogout}
                    className="btn btn-ghost"
                    style={{ padding: "0.4rem" }}
                    title={t("logout")}
                >
                    <LogOut size={17} />
                </button>
            </div>
        </header>
    );
}
