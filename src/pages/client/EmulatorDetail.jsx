import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft, Plus, Edit2, Trash2, User, Mail, Lock, Shield,
    ShoppingBag, Users, Wheat, Gem, AlertCircle, CheckCircle2, X, Save
} from "lucide-react";
import { useGetAccounts, useAddAccount, useUpdateAccount, useDeleteAccount } from "../../hooks/useAccounts";
import { useGetEmulators } from "../../hooks/useEmulators";
import { useAuthContext } from "../../Context/AuthContext";

import { useLanguage } from "../../Context/LanguageContext";

const RESOURCE_KEYS = ["wood", "wheat", "iron", "diamond"];
const RESOURCE_ICONS = [Wheat, Gem, Gem, Gem];

const EMPTY_FORM = {
    email: "",
    password: "",
    collect_resources: [false, false, false, false],
    attack_resources: [],
    protection: false,
    troops: false,
    not_store: false,
};

function Toggle({ checked, onChange, label }) {
    return (
        <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", cursor: "pointer" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--text-primary)", fontWeight: 500 }}>{label}</span>
            <label className="toggle-wrapper">
                <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
                <span className="toggle-slider" />
            </label>
        </label>
    );
}

function AccountModal({ onClose, onSave, initialData, isSaving, title }) {
    const { t } = useLanguage();
    const [form, setForm] = useState(initialData || EMPTY_FORM);

    const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

    const toggleCollect = (idx) => {
        const next = [...form.collect_resources];
        next[idx] = !next[idx];
        setField("collect_resources", next);
    };

    const toggleAttack = (res) => {
        const curr = form.attack_resources || [];
        if (curr.includes(res)) {
            setField("attack_resources", curr.filter((r) => r !== res));
        } else {
            if (curr.length >= 2) return; // max 2
            setField("attack_resources", [...curr, res]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.email || !form.password) return;
        onSave(form);
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                {/* Modal header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <User size={18} color="var(--accent)" />
                        <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>{title}</h3>
                    </div>
                    <button className="btn btn-ghost" style={{ padding: "0.35rem" }} onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    {/* Email & Password */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div>
                            <label className="form-label"><Mail size={11} style={{ display: "inline", [t("dir") === "rtl" ? "marginLeft" : "marginRight"]: 4 }} />{t("email")}</label>
                            <input className="form-input" type="email" placeholder="email@game.com" value={form.email} onChange={(e) => setField("email", e.target.value)} required dir="ltr" />
                        </div>
                        <div>
                            <label className="form-label"><Lock size={11} style={{ display: "inline", [t("dir") === "rtl" ? "marginLeft" : "marginRight"]: 4 }} />{t("password")}</label>
                            <input className="form-input" type="text" placeholder="••••••••" value={form.password} onChange={(e) => setField("password", e.target.value)} required dir="ltr" />
                        </div>
                    </div>

                    {/* Collect Resources */}
                    <div>
                        <label className="form-label" style={{ marginBottom: "0.75rem" }}>{t("collectResources")}</label>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.625rem" }}>
                            {RESOURCE_KEYS.map((key, i) => (
                                <label key={key} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.625rem 0.875rem", background: form.collect_resources[i] ? "var(--accent-soft)" : "var(--bg-surface)", border: `1px solid ${form.collect_resources[i] ? "var(--accent)" : "var(--border)"}`, borderRadius: "var(--radius-sm)", cursor: "pointer", transition: "all 0.2s" }}>
                                    <input type="checkbox" checked={form.collect_resources[i]} onChange={() => toggleCollect(i)} style={{ accentColor: "var(--accent)", width: 16, height: 16 }} />
                                    <span style={{ fontSize: "0.875rem", fontWeight: form.collect_resources[i] ? 600 : 400, color: form.collect_resources[i] ? "var(--accent)" : "var(--text-primary)" }}>{t(key)}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Attack Resources */}
                    <div>
                        <label className="form-label" style={{ marginBottom: "0.375rem" }}>{t("attackResources")} <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "none" }}>({t("maxTwo")})</span></label>
                        <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
                            {RESOURCE_KEYS.map((key) => {
                                const translated = t(key);
                                const selected = form.attack_resources?.includes(translated);
                                const disabled = !selected && (form.attack_resources?.length || 0) >= 2;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => toggleAttack(translated)}
                                        disabled={disabled}
                                        style={{
                                            padding: "0.45rem 1rem",
                                            borderRadius: "999px",
                                            border: `1.5px solid ${selected ? "var(--gold)" : "var(--border)"}`,
                                            background: selected ? "var(--gold-soft)" : "var(--bg-surface)",
                                            color: selected ? "var(--gold)" : disabled ? "var(--text-muted)" : "var(--text-secondary)",
                                            fontWeight: selected ? 700 : 400,
                                            fontSize: "0.825rem",
                                            cursor: disabled ? "not-allowed" : "pointer",
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        {selected && "✓ "}{translated}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Toggles */}
                    <div style={{ background: "var(--bg-surface)", borderRadius: "var(--radius-sm)", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem", border: "1px solid var(--border)" }}>
                        <label className="form-label" style={{ marginBottom: 0 }}>{t("settings")}</label>
                        <Toggle checked={form.protection} onChange={(v) => setField("protection", v)} label={`🛡️ ${t("protection")}`} />
                        <hr className="divider" />
                        <Toggle checked={form.not_store} onChange={(v) => setField("not_store", v)} label={`🚫 ${t("dontBuy")}`} />
                        <hr className="divider" />
                        <Toggle checked={form.troops} onChange={(v) => setField("troops", v)} label={`⚔️ ${t("troops")}`} />
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.5rem" }}>
                        <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
                            {t("cancel")}
                        </button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSaving}>
                            {isSaving ? (
                                <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: 'white' }} /> {t("processing")}</>
                            ) : (
                                <><Save size={16} /> {t("save")}</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function AccountCard({ account, emulatorId, onEdit, onDelete }) {
    const { t, fmtDate } = useLanguage();
    const [confirmDelete, setConfirmDelete] = useState(false);
    const deleteAccount = useDeleteAccount();

    const resources = account.Collect_resources;
    const attacks = account["Attack resources"];

    return (
        <div className="card" style={{ padding: "1.25rem" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--accent-soft)", border: "2px solid var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <User size={18} color="var(--accent)" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={account.Email}>
                            {account.Email}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                            {fmtDate(account.created_at)}
                        </div>
                    </div>
                </div>
                <div style={{ display: "flex", gap: "0.375rem" }}>
                    <button className="btn btn-ghost" style={{ padding: "0.3rem", color: "var(--accent)" }} onClick={() => onEdit(account)}>
                        <Edit2 size={15} />
                    </button>
                    <button className="btn btn-ghost" style={{ padding: "0.3rem", color: "var(--red)" }} onClick={() => setConfirmDelete(true)}>
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>

            {/* Collect resources */}
            {resources && (
                <div style={{ marginBottom: "0.75rem" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.375rem" }}>{t("collectResources")}</div>
                    <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                        {RESOURCE_KEYS.map((key, i) => (
                            <span key={key} style={{
                                padding: "0.2rem 0.55rem",
                                borderRadius: "999px",
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                background: resources[i] ? "var(--green-soft)" : "var(--bg-hover)",
                                color: resources[i] ? "var(--green)" : "var(--text-muted)",
                                border: `1px solid ${resources[i] ? "rgba(16,185,129,0.3)" : "var(--border)"}`,
                            }}>
                                {resources[i] ? "✓" : "✗"} {t(key)}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Attack resources */}
            {attacks && attacks.length > 0 && (
                <div style={{ marginBottom: "0.75rem" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.375rem" }}>⚔️ {t("attackResources")}</div>
                    <div style={{ display: "flex", gap: "0.375rem" }}>
                        {attacks.map((res) => (
                            <span key={res} className="badge badge-pending" style={{ background: "var(--orange-soft)", color: "var(--orange)", borderColor: "rgba(249,115,22,0.3)" }}>{res}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* Toggles */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {account.Protection && <span className="badge badge-approved">🛡️ {t("protection")}</span>}
                {account.Troops && <span className="badge badge-approved">⚔️ {t("troops")}</span>}
                {account.Not_store && <span className="badge badge-rejected">🚫 {t("dontBuy")}</span>}
            </div>

            {/* Confirm delete */}
            {confirmDelete && (
                <div className="modal-backdrop" onClick={() => setConfirmDelete(false)}>
                    <div className="modal-box" style={{ maxWidth: 380, padding: "2rem" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                            <AlertCircle size={40} color="var(--red)" style={{ margin: "0 auto 0.75rem", display: "block" }} />
                            <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>{t("confirmDeleteAccount")}</h3>
                            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{t("deleteAccountConfirmMsg")}</p>
                        </div>
                        <div style={{ display: "flex", gap: "0.75rem" }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDelete(false)}>{t("cancel")}</button>
                            <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => deleteAccount.mutate({ id: account.id, emulatorId }, { onSettled: () => setConfirmDelete(false) })} disabled={deleteAccount.isPending}>
                                {t("delete")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function EmulatorDetail() {
    const { t } = useLanguage();
    const { id } = useParams();
    const navigate = useNavigate();
    const emulatorId = parseInt(id);

    const { data: emulators } = useGetEmulators();
    const emulator = emulators?.find((e) => e.id === emulatorId);

    const { data: accounts, isLoading } = useGetAccounts(emulatorId);
    const addAccount = useAddAccount();
    const updateAccount = useUpdateAccount();

    const [showAdd, setShowAdd] = useState(false);
    const [editAccount, setEditAccount] = useState(null);

    const count = accounts?.length || 0;
    const remaining = 10 - count;

    const handleAdd = (formData) => {
        addAccount.mutate({ emulatorId, ...formData }, { onSuccess: () => setShowAdd(false) });
    };

    const handleUpdate = (formData) => {
        updateAccount.mutate({ id: editAccount.id, emulatorId, ...formData }, { onSuccess: () => setEditAccount(null) });
    };

    const toEditForm = (acc) => ({
        email: acc.Email,
        password: acc.password,
        collect_resources: acc.Collect_resources || [false, false, false, false],
        attack_resources: acc["Attack resources"] || [],
        protection: acc.Protection || false,
        troops: acc.Troops || false,
        not_store: acc.Not_store || false,
    });

    return (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Back + header */}
            <div>
                <button className="btn btn-ghost" style={{ marginBottom: "0.75rem", gap: "0.375rem", padding: "0.375rem 0.5rem" }} onClick={() => navigate("/emulators")}>
                    <ArrowLeft size={17} /> {t("backToEmulators")}
                </button>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "0.25rem" }}>{t("emulator")} #{emulatorId}</h1>
                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                            <span style={{ color: "var(--text-muted)", fontSize: "0.825rem" }}>
                                {count}/10 {t("accounts")}
                            </span>
                            <div style={{ height: 16, width: 1, background: "var(--border)" }} />
                            {emulator?.Is_OK === "true" ? (
                                <span className="badge badge-approved"><CheckCircle2 size={10} /> {t("approved")}</span>
                            ) : (
                                <span className="badge badge-pending"><AlertCircle size={10} /> {t("pending")}</span>
                            )}
                        </div>
                    </div>
                    {remaining > 0 && (
                        <button className="btn btn-primary" onClick={() => setShowAdd(true)} style={{ gap: "0.5rem" }}>
                            <Plus size={18} /> {t("addAccount")}
                        </button>
                    )}
                </div>
            </div>

            {/* Progress bar */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "1rem 1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{t("accountsAdded")}</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: count >= 10 ? "var(--red)" : "var(--accent)" }}>{count}/10</span>
                </div>
                <div style={{ height: 6, background: "var(--bg-hover)", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(count / 10) * 100}%`, background: count >= 10 ? "var(--red)" : count >= 7 ? "var(--gold)" : "var(--accent)", borderRadius: "999px", transition: "width 0.4s" }} />
                </div>
                {count >= 10 && (
                    <p style={{ color: "var(--red)", fontSize: "0.78rem", marginTop: "0.5rem" }}>{t("maxReached")}</p>
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
            {!isLoading && count === 0 && (
                <div style={{ textAlign: "center", padding: "3rem 2rem", border: "2px dashed var(--border)", borderRadius: "var(--radius-lg)" }}>
                    <Users size={44} color="var(--text-muted)" style={{ margin: "0 auto 1rem", display: "block" }} />
                    <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>{t("noAccounts")}</h3>
                    <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", fontSize: "0.875rem" }}>{t("addFirstAccount")}</p>
                    <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={18} /> {t("addAccount")}</button>
                </div>
            )}

            {/* Accounts grid */}
            {!isLoading && accounts && accounts.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "1rem" }}>
                    {accounts.map((acc) => (
                        <AccountCard
                            key={acc.id}
                            account={acc}
                            emulatorId={emulatorId}
                            onEdit={(acc) => setEditAccount(acc)}
                            onDelete={() => { }}
                        />
                    ))}
                </div>
            )}

            {/* Add modal */}
            {showAdd && (
                <AccountModal
                    title={t("addAccountNew")}
                    onClose={() => setShowAdd(false)}
                    onSave={handleAdd}
                    isSaving={addAccount.isPending}
                />
            )}

            {/* Edit modal */}
            {editAccount && (
                <AccountModal
                    title={t("editAccount")}
                    initialData={toEditForm(editAccount)}
                    onClose={() => setEditAccount(null)}
                    onSave={handleUpdate}
                    isSaving={updateAccount.isPending}
                />
            )}
        </div>
    );
}
