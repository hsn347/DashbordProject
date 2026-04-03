import { useState } from "react";
import { User as UserIcon, CheckCircle2, Clock, ChevronDown, ChevronUp, Server, Hash, Mail, Trash2, Shield, ShieldOff, AlertCircle, RefreshCw, Edit } from "lucide-react";
import { useGetAllAccounts, useApproveAccount, useRevokeAccount, useDeleteAccountAdmin, useUpdateUserAllowedAccounts } from "../../hooks/useAdminAccounts";
import { useGetSettings } from "../../hooks/useSettings";
import { useLanguage } from "../../Context/LanguageContext";

const RESOURCE_KEYS = ["wheat", "iron", "wood", "diamond"];

function StatusBadge({ status, t }) {
    if (status) return <span className="badge badge-approved"><CheckCircle2 size={9} /> {t("approved")}</span>;
    return <span className="badge badge-pending"><Clock size={9} /> {t("pending")}</span>;
}

function AccountRow({ acc }) {
    const { t, fmtDate } = useLanguage();
    const [confirmDelete, setConfirmDelete] = useState(false);
    const approve = useApproveAccount();
    const revoke = useRevokeAccount();
    const deleteAcc = useDeleteAccountAdmin();

    const isApproved = acc.Is_OK;

    return (
        <div className="card" style={{ overflow: "hidden", borderColor: isApproved ? "rgba(16,185,129,0.25)" : "var(--border)" }}>
            <div style={{ padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: "1 1 200px" }}>
                    <div style={{ width: 42, height: 42, borderRadius: "var(--radius-sm)", background: isApproved ? "var(--green-soft)" : "var(--accent-soft)", border: `2px solid ${isApproved ? "var(--green)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <UserIcon size={20} color={isApproved ? "var(--green)" : "var(--accent)"} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700 }}>{acc.Email}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                            <span style={{ color: "var(--accent)", fontWeight: 600 }}><UserIcon size={10} style={{ display: "inline" }} /> {acc.ownerName}</span>
                            <span>· {fmtDate(acc.created_at)}</span>
                            {acc.Date_OK && (
                                <span style={{ color: isApproved ? "var(--green)" : "var(--gold)", fontWeight: 600 }}>
                                    · {isApproved ? "✓" : "✗"} {fmtDate(acc.Date_OK, { month: "short", day: "numeric" })}
                                </span>
                            )}
                        </div>
                        {/* Features display */}
                        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", marginTop: "0.3rem" }}>
                            {RESOURCE_KEYS.map((key, i) => acc.Collect_resources?.[i] && (
                                <span key={key} className="badge badge-approved" style={{ fontSize: "0.6rem", padding: "0.1rem 0.3rem" }}>✓ {t(key)}</span>
                            ))}
                            {acc["Attack resources"]?.map((r) => (
                                <span key={r} className="badge badge-pending" style={{ background: "var(--orange-soft)", color: "var(--orange)", borderColor: "rgba(249,115,22,0.3)", fontSize: "0.6rem", padding: "0.1rem 0.3rem" }}>⚔️ {r}</span>
                            ))}
                            {acc.Protection && <span className="badge badge-approved" style={{ fontSize: "0.6rem", padding: "0.1rem 0.3rem" }}>🛡️ {t("protection")}</span>}
                            {acc.Troops && <span className="badge badge-approved" style={{ fontSize: "0.6rem", padding: "0.1rem 0.3rem" }}>⚔️ {t("troops")}</span>}
                            {acc.Not_store && <span className="badge badge-rejected" style={{ fontSize: "0.6rem", padding: "0.1rem 0.3rem" }}>🚫 {t("dontBuy")}</span>}
                        </div>
                    </div>
                </div>

                {isApproved && acc.index_server && (
                    <div style={{ display: "flex", gap: "0.875rem" }}>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.15rem" }}>{t("server")}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.2rem", color: "var(--accent)", fontWeight: 800, fontSize: "1rem" }}>
                                <Server size={12} /> {acc.index_server}
                            </div>
                        </div>
                    </div>
                )}

                <StatusBadge status={acc.Is_OK} t={t} />

                <div style={{ display: "flex", gap: "0.5rem", margin: t("dir") === "ltr" ? "0 0 0 auto" : "0 auto 0 0" }}>
                    {!isApproved ? (
                        <button className="btn btn-success" style={{ fontSize: "0.8rem", padding: "0.4rem 0.875rem" }} onClick={() => approve.mutate(acc.id)} disabled={approve.isPending}>
                            {approve.isPending ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> {t("processing")}</> : <><Shield size={14} /> {t("approve")}</>}
                        </button>
                    ) : (
                        <button className="btn btn-ghost" style={{ fontSize: "0.8rem", color: "var(--gold)", padding: "0.4rem 0.875rem" }} onClick={() => revoke.mutate(acc.id)} disabled={revoke.isPending}>
                            {revoke.isPending ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> {t("processing")}</> : <><ShieldOff size={14} /> {t("revoke")}</>}
                        </button>
                    )}
                    <button className="btn btn-ghost" style={{ color: "var(--red)", padding: "0.4rem" }} onClick={() => setConfirmDelete(true)}>
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>

            {confirmDelete && (
                <div className="modal-backdrop" onClick={() => setConfirmDelete(false)}>
                    <div className="modal-box" style={{ maxWidth: 380, padding: "2rem" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                            <AlertCircle size={40} color="var(--red)" style={{ margin: "0 auto 0.75rem", display: "block" }} />
                            <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>{t("confirmDeleteAccount")} {acc.Email}</h3>
                            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{t("deleteAccountConfirmMsg")}</p>
                        </div>
                        <div style={{ display: "flex", gap: "0.75rem" }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDelete(false)}>{t("cancel")}</button>
                            <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => deleteAcc.mutate(acc.id, { onSettled: () => setConfirmDelete(false) })} disabled={deleteAcc.isPending}>
                                {deleteAcc.isPending ? "..." : t("delete")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function UserQuotaEditor({ userId, ownerName, currentQuota, onUpdate }) {
    const { t } = useLanguage();
    const [quota, setQuota] = useState(currentQuota);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await onUpdate(userId, quota);
        setSaving(false);
        setIsEditing(false);
    };

    if (!isEditing) {
        return (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
                <span>{ownerName}:</span>
                <span className="badge badge-approved" style={{ fontSize: "0.75rem", cursor: "pointer" }} onClick={() => setIsEditing(true)}>
                    {t("maxAccounts")}: <b>{currentQuota}</b> <Edit size={10} style={{ marginLeft: "0.2rem" }} />
                </span>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
            <span>{ownerName}:</span>
            <input
                type="number"
                value={quota}
                onChange={(e) => setQuota(e.target.value)}
                className="form-input"
                style={{ width: "60px", padding: "0.2rem 0.5rem", fontSize: "0.8rem", minHeight: "24px" }}
            />
            <button className="btn btn-success" style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }} onClick={handleSave} disabled={saving}>
                {saving ? "..." : t("save")}
            </button>
            <button className="btn btn-ghost" style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }} onClick={() => setIsEditing(false)}>
                {t("cancel")}
            </button>
        </div>
    );
}

export default function AccountsAdmin() {
    const { t } = useLanguage();
    const { data: accounts, isLoading, refetch } = useGetAllAccounts();
    const updateQuota = useUpdateUserAllowedAccounts();
    const [filter, setFilter] = useState("all"); // 'all' | 'pending' | 'approved'
    const [selectedUser, setSelectedUser] = useState("all");

    // Gather unique users from the accounts query. (Assuming all users have created at least one account mapping).
    const uniqueUsers = [...new Map(
        (accounts || [])
            .filter(a => a.user_id)
            .map(a => [a.user_id, { name: a.ownerName, quota: a.allowedAccounts }])
    ).entries()].map(([id, data]) => ({ id, ...data }));

    const filtered = (accounts || []).filter((acc) => {
        const matchUser = selectedUser === "all" || acc.user_id === selectedUser;
        if (filter === "pending") return !acc.Is_OK && matchUser;
        if (filter === "approved") return acc.Is_OK && matchUser;
        return matchUser;
    });

    const handleUpdateQuota = (userId, newQuota) => {
        return new Promise((resolve) => {
            updateQuota.mutate({ userId, allowedAccounts: newQuota }, { onSettled: () => resolve() });
        });
    };

    return (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem" }}>{t("allAccounts")}</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                        {accounts?.length || 0} {t("accountsCount")}
                    </p>
                </div>
                <button className="btn btn-secondary" style={{ gap: "0.5rem" }} onClick={() => refetch()}>
                    <RefreshCw size={15} /> {t("refresh")}
                </button>
            </div>

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                {[
                    { key: "all", label: `${t("all")} (${accounts?.length || 0})` },
                    { key: "pending", label: `${t("pending")} (${accounts?.filter(a => !a.Is_OK).length || 0})` },
                    { key: "approved", label: `${t("approved")} (${accounts?.filter(a => a.Is_OK).length || 0})` },
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

            {/* Quota Management Banner selected user */}
            {selectedUser !== "all" && (
                <div style={{ background: "var(--bg-surface)", padding: "1rem", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                    {uniqueUsers.filter(u => u.id === selectedUser).map(u => (
                        <UserQuotaEditor key={u.id} userId={u.id} ownerName={u.name} currentQuota={u.quota} onUpdate={handleUpdateQuota} />
                    ))}
                </div>
            )}

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
                    <UserIcon size={40} color="var(--text-muted)" style={{ margin: "0 auto 1rem", display: "block" }} />
                    <p style={{ color: "var(--text-muted)" }}>{t("noAccounts")}</p>
                </div>
            )}

            {/* List */}
            {!isLoading && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                    {filtered.map((acc) => <AccountRow key={acc.id} acc={acc} />)}
                </div>
            )}
        </div>
    );
}
