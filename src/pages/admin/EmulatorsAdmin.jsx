import { useState } from "react";
import {
    Monitor, CheckCircle2, Clock, ChevronDown, ChevronUp,
    Server, Hash, User, Mail, Trash2, Shield, ShieldOff, AlertCircle, RefreshCw
} from "lucide-react";
import { useGetAllEmulators, useApproveEmulator, useRevokeEmulator, useDeleteEmulatorAdmin } from "../../hooks/useAdminEmulators";
import { useGetSettings } from "../../hooks/useSettings";
import { useLanguage } from "../../Context/LanguageContext";

const RESOURCE_KEYS = ["wheat", "iron", "wood", "diamond"];

function StatusBadge({ status, t }) {
    if (status === "true") return <span className="badge badge-approved"><CheckCircle2 size={9} /> {t("approved")}</span>;
    return <span className="badge badge-pending"><Clock size={9} /> {t("pending")}</span>;
}

function AccountRow({ acc }) {
    const { t } = useLanguage();
    const resources = acc.Collect_resources || [];
    const attacks = acc["Attack resources"] || [];
    return (
        <div style={{ background: "var(--bg-base)", borderRadius: "var(--radius-sm)", padding: "0.875rem 1rem", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <Mail size={13} color="var(--accent)" />
                <span style={{ fontWeight: 600, fontSize: "0.825rem" }}>{acc.Email}</span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>•</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>{t("user")}: {acc.user_id?.slice(0, 8)}...</span>
            </div>
            <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                {RESOURCE_KEYS.map((key, i) => resources[i] && (
                    <span key={key} className="badge badge-approved" style={{ fontSize: "0.68rem" }}>✓ {t(key)}</span>
                ))}
                {attacks.map((r) => (
                    <span key={r} className="badge badge-pending" style={{ background: "var(--orange-soft)", color: "var(--orange)", borderColor: "rgba(249,115,22,0.3)", fontSize: "0.68rem" }}>⚔️ {r}</span>
                ))}
                {acc.Protection && <span className="badge badge-approved" style={{ fontSize: "0.68rem" }}>🛡️ {t("protection")}</span>}
                {acc.Troops && <span className="badge badge-approved" style={{ fontSize: "0.68rem" }}>⚔️ {t("troops")}</span>}
                {acc.Not_store && <span className="badge badge-rejected" style={{ fontSize: "0.68rem" }}>🚫 {t("dontBuy")}</span>}
            </div>
        </div>
    );
}

function EmulatorRow({ em }) {
    const { t, fmtDate } = useLanguage();
    const [expanded, setExpanded] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const approve = useApproveEmulator();
    const revoke = useRevokeEmulator();
    const deleteEm = useDeleteEmulatorAdmin();

    const accounts = em.Accounts || [];
    const isApproved = em.Is_OK === "true";

    return (
        <div className="card" style={{ overflow: "hidden", borderColor: isApproved ? "rgba(16,185,129,0.25)" : "var(--border)" }}>
            {/* Main row */}
            <div style={{ padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                {/* Emulator info */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: "1 1 200px" }}>
                    <div style={{ width: 42, height: 42, borderRadius: "var(--radius-sm)", background: isApproved ? "var(--green-soft)" : "var(--accent-soft)", border: `2px solid ${isApproved ? "var(--green)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Monitor size={20} color={isApproved ? "var(--green)" : "var(--accent)"} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700 }}>{t("emulator")} #{em.id}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                            <span style={{ color: "var(--accent)", fontWeight: 600 }}><User size={10} style={{ display: "inline" }} /> {em.ownerName}</span>
                            <span>· {fmtDate(em.created_at)}</span>
                            {em.Date_OK && (
                                <span style={{ color: em.Is_OK === "true" ? "var(--green)" : "var(--gold)", fontWeight: 600 }}>
                                    · {em.Is_OK === "true" ? "✓" : "✗"} {fmtDate(em.Date_OK, { month: "short", day: "numeric" })}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Index info */}
                {isApproved && em.index_server && (
                    <div style={{ display: "flex", gap: "0.875rem" }}>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.15rem" }}>{t("server")}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.2rem", color: "var(--accent)", fontWeight: 800, fontSize: "1rem" }}>
                                <Server size={12} /> {em.index_server}
                            </div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.15rem" }}>{t("indexEmulator")}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.2rem", color: "var(--gold)", fontWeight: 800, fontSize: "1rem" }}>
                                <Hash size={12} /> {em.index_emulators}
                            </div>
                        </div>
                    </div>
                )}

                {/* Status */}
                <StatusBadge status={em.Is_OK} t={t} />

                {/* Accounts count */}
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{accounts.length} {t("account")}</div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "0.5rem", margin: t("dir") === "ltr" ? "0 0 0 auto" : "0 auto 0 0" }}>
                    {!isApproved ? (
                        <button className="btn btn-success" style={{ fontSize: "0.8rem", padding: "0.4rem 0.875rem" }} onClick={() => approve.mutate(em.id)} disabled={approve.isPending}>
                            {approve.isPending ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> {t("processing")}</> : <><Shield size={14} /> {t("approve")}</>}
                        </button>
                    ) : (
                        <button className="btn btn-ghost" style={{ fontSize: "0.8rem", color: "var(--gold)", padding: "0.4rem 0.875rem" }} onClick={() => revoke.mutate(em.id)} disabled={revoke.isPending}>
                            {revoke.isPending ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> {t("processing")}</> : <><ShieldOff size={14} /> {t("revoke")}</>}
                        </button>
                    )}
                    <button className="btn btn-ghost" style={{ color: "var(--red)", padding: "0.4rem" }} onClick={() => setConfirmDelete(true)}>
                        <Trash2 size={15} />
                    </button>
                    <button className="btn btn-ghost" style={{ padding: "0.4rem" }} onClick={() => setExpanded((p) => !p)}>
                        {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                </div>
            </div>

            {/* Expanded accounts */}
            {expanded && (
                <div style={{ padding: "0.5rem 1.25rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem", borderTop: "1px solid var(--border)" }}>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", paddingTop: "0.5rem", marginBottom: "0.25rem" }}>
                        {t("accounts")} ({accounts.length})
                    </div>
                    {accounts.length === 0 && (
                        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", fontStyle: "italic" }}>{t("noAccounts")}</p>
                    )}
                    {accounts.map((acc) => <AccountRow key={acc.id} acc={acc} />)}
                </div>
            )}

            {/* Delete confirm modal */}
            {confirmDelete && (
                <div className="modal-backdrop" onClick={() => setConfirmDelete(false)}>
                    <div className="modal-box" style={{ maxWidth: 380, padding: "2rem" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                            <AlertCircle size={40} color="var(--red)" style={{ margin: "0 auto 0.75rem", display: "block" }} />
                            <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>{t("confirmDelete")} #{em.id}</h3>
                            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{t("deleteConfirmMsg")}</p>
                        </div>
                        <div style={{ display: "flex", gap: "0.75rem" }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDelete(false)}>{t("cancel")}</button>
                            <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => deleteEm.mutate(em.id, { onSettled: () => setConfirmDelete(false) })} disabled={deleteEm.isPending}>
                                {deleteEm.isPending ? "..." : t("deleteEmulatorAdmin")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function EmulatorsAdmin() {
    const { t } = useLanguage();
    const { data: emulators, isLoading, refetch } = useGetAllEmulators();
    const { data: settings } = useGetSettings();
    const [filter, setFilter] = useState("all"); // 'all' | 'pending' | 'approved'
    const [selectedUser, setSelectedUser] = useState("all");

    const maxPerServer = settings?.max_per_server || "8";

    // قائمة المستخدمين الفريدين من البيانات المحملة
    const uniqueUsers = [...new Map(
        (emulators || [])
            .filter(e => e.user_id)
            .map(e => [e.user_id, e.ownerName])
    ).entries()].map(([id, name]) => ({ id, name }));

    const filtered = (emulators || []).filter((em) => {
        const matchUser = selectedUser === "all" || em.user_id === selectedUser;
        if (filter === "pending") return em.Is_OK !== "true" && matchUser;
        if (filter === "approved") return em.Is_OK === "true" && matchUser;
        return matchUser;
    });

    return (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem" }}>{t("allEmulators")}</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                        {t("serverLimit")}: <strong style={{ color: "var(--accent)" }}>{maxPerServer}</strong> {t("emulator")}
                    </p>
                </div>
                <button className="btn btn-secondary" style={{ gap: "0.5rem" }} onClick={() => refetch()}>
                    <RefreshCw size={15} /> {t("refresh")}
                </button>
            </div>

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                {[
                    { key: "all", label: `${t("all")} (${emulators?.length || 0})` },
                    { key: "pending", label: `${t("pending")} (${emulators?.filter(e => e.Is_OK !== "true").length || 0})` },
                    { key: "approved", label: `${t("approved")} (${emulators?.filter(e => e.Is_OK === "true").length || 0})` },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className="btn"
                        style={{
                            background: filter === key ? "var(--accent)" : "var(--bg-card)",
                            color: filter === key ? "white" : "var(--text-secondary)",
                            border: `1px solid ${filter === key ? "var(--accent)" : "var(--border)"}`,
                            fontSize: "0.825rem",
                        }}
                    >
                        {label}
                    </button>
                ))}

                {/* Dropdown فلترة حسب المستخدم */}
                {uniqueUsers.length > 0 && (
                    <select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        dir={t("dir")}
                        style={{
                            background: "var(--bg-card)",
                            color: selectedUser !== "all" ? "var(--accent)" : "var(--text-secondary)",
                            border: `1px solid ${selectedUser !== "all" ? "var(--accent)" : "var(--border)"}`,
                            borderRadius: "var(--radius-sm)",
                            padding: "0.4rem 0.875rem",
                            fontSize: "0.825rem",
                            cursor: "pointer",
                            outline: "none",
                            fontFamily: "inherit",
                        }}
                    >
                        <option value="all">👤 {t("allUsers")}</option>
                        {uniqueUsers.map(({ id, name }) => (
                            <option key={id} value={id}>{name}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="page-loader">
                    <div className="spinner" style={{ width: 32, height: 32 }} />
                    <p>{t("loading")}</p>
                </div>
            )}

            {/* Empty */}
            {!isLoading && filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: "3rem", border: "2px dashed var(--border)", borderRadius: "var(--radius-lg)" }}>
                    <Monitor size={40} color="var(--text-muted)" style={{ margin: "0 auto 1rem", display: "block" }} />
                    <p style={{ color: "var(--text-muted)" }}>{t("noEmulatorsInCategory")}</p>
                </div>
            )}

            {/* List */}
            {!isLoading && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                    {filtered.map((em) => <EmulatorRow key={em.id} em={em} />)}
                </div>
            )}
        </div>
    );
}
