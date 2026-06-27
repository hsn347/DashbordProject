import { NavLink } from "react-router-dom";
import { LayoutDashboard, CreditCard, Settings, X, ShieldCheck, Clock, Globe2 } from "lucide-react";
import { useLanguage } from "../Context/LanguageContext";
import { useDomain } from "../Context/DomainContext";

export default function AdminSidebar({ open, onClose }) {
    const { t } = useLanguage();
    const { config } = useDomain();

    const allAdminLinks = [
        { to: "/admin", icon: LayoutDashboard, labelKey: "overview", exact: true, show: true },
        { to: "/admin/subscriptions", icon: CreditCard, labelKey: "subscriptions", show: true },
        { to: "/admin/expiring-accounts", icon: Clock, labelKey: "expiringAccounts", show: true },
        { to: "/admin/domains-stats", icon: Globe2, labelKey: "domainsStats", show: config.showDomainsStats },
        { to: "/admin/settings", icon: Settings, labelKey: "settings", show: config.showSettings },
    ].filter(link => link.show);

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
                    overflowY: "auto",
                }}
            >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", padding: "0 0.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {config.logoType === "image" ? (
                            <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", border: "1.5px solid var(--accent)" }}>
                                <img src={config.logo} alt={config.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                        ) : (
                            <ShieldCheck size={14} color="var(--gold)" />
                        )}
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.05rem" }}>
                                <span style={{ fontSize: "0.7rem", color: "var(--gold)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                    {t("adminSection")}
                                </span>
                            </div>
                            <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)" }}>
                                {config.name}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn btn-ghost" style={{ padding: "0.3rem" }}>
                        <X size={18} />
                    </button>
                </div>

                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 0.5rem", marginBottom: "0.375rem" }}>
                    {t("menu")}
                </div>

                {allAdminLinks.map(({ to, icon: Icon, labelKey, exact }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={exact}
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

