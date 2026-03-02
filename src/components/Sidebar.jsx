import { NavLink } from "react-router-dom";
import { Monitor, X } from "lucide-react";
import { useLanguage } from "../Context/LanguageContext";

export default function Sidebar({ open, onClose }) {
    const { t } = useLanguage();

    const clientLinks = [
        { to: "/emulators", icon: Monitor, labelKey: "emulators" },
    ];

    return (
        <>
            {open && (
                <div
                    onClick={onClose}
                    style={{
                        position: "fixed", inset: 0,
                        background: "rgba(0,0,0,0.6)",
                        zIndex: 40,
                    }}
                />
            )}

            <aside
                style={{
                    width: 240,
                    background: "var(--bg-surface)",
                    [t("dir") === "ltr" ? "borderRight" : "borderLeft"]: "1px solid var(--border)",
                    height: "100vh",
                    position: "fixed",
                    top: 0,
                    [t("dir") === "ltr" ? "left" : "right"]: open ? 0 : "-240px",
                    [t("dir") === "ltr" ? "right" : "left"]: "auto",
                    zIndex: 45,
                    display: "flex",
                    flexDirection: "column",
                    transition: "all 0.3s ease",
                    padding: "1.25rem 0.875rem",
                    gap: "0.25rem",
                    overflowY: "auto",
                }}
            >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", padding: "0 0.25rem" }}>
                    <div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.1rem" }}>
                            {t("dashboard")}
                        </div>
                        <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)" }}>
                            {t("appName")}
                        </div>
                    </div>
                    <button onClick={onClose} className="btn btn-ghost" style={{ padding: "0.3rem" }}>
                        <X size={18} />
                    </button>
                </div>

                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 0.5rem", marginBottom: "0.375rem" }}>
                    {t("menu")}
                </div>

                {clientLinks.map(({ to, icon: Icon, labelKey }) => (
                    <NavLink
                        key={to}
                        to={to}
                        onClick={onClose}
                        className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                    >
                        <Icon size={18} />
                        <span>{t(labelKey)}</span>
                    </NavLink>
                ))}
            </aside>
        </>
    );
}
