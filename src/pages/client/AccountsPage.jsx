import { useState } from "react";
import { createPortal } from "react-dom";
import { User, Mail, Lock, Plus, Edit2, Swords, Trash2, CheckCircle2, Clock, Server, Hash, AlertCircle, Wheat, Gem, Shield, X, Save, Search, Anchor, PackageOpen, Leaf, Hammer, Users, Truck, Sword, MapPin, Gift, Activity, ChevronDown, Zap } from "lucide-react";
import { useGetAccounts, useAddAccount, useUpdateAccount, useDeleteAccount } from "../../hooks/useAccounts";
import { useLanguage } from "../../Context/LanguageContext";
import { useProfile } from "../../hooks/useProfiles";
import { useAuthContext } from "../../Context/AuthContext";

const RESOURCE_KEYS = ["wood", "wheat", "iron", "diamond"];
const ARABIC_RESOURCES = { wood: "خشب", wheat: "قمح", iron: "حديد", diamond: "ألماس" };
const EMPTY_FORM = {
    email: "",
    password: "",
    collect_resources: [false, false, false, false],
    attack_resources: [],
    protection: false,
    troops: false,
    not_store: false,
    animal: "",
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
            if (curr.length >= 2) return;
            setField("attack_resources", [...curr, res]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.email || !form.password) return;
        onSave(form);
    };

    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <User size={18} color="var(--accent)" />
                        <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>{title}</h3>
                    </div>
                    <button className="btn btn-ghost" style={{ padding: "0.35rem" }} onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", maxHeight: "80vh", overflowY: "auto" }}>
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

                    <div>
                        <label className="form-label" style={{ marginBottom: "0.375rem" }}>{t("animalToTrain")}</label>
                        <select className="form-input" value={form.animal || ""} onChange={(e) => setField("animal", e.target.value)}>
                            <option value="">{t("noAnimal")}</option>
                            {["deer", "wolf", "lion", "falcon", "cheetah", "bear", "elephant", "bull", "dog"].map(animal => (
                                <option key={animal} value={animal}>{t(animal)}</option>
                            ))}
                        </select>
                    </div>

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

                    <div>
                        <label className="form-label" style={{ marginBottom: "0.375rem" }}>{t("attackResources")} <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "none" }}>({t("maxTwo")})</span></label>
                        <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
                            {RESOURCE_KEYS.map((key) => {
                                const arabicVal = ARABIC_RESOURCES[key];
                                const translated = t(key);
                                // Support backward compat if old incorrect translation is stored
                                const selected = form.attack_resources?.includes(arabicVal) || form.attack_resources?.includes(translated);
                                const disabled = !selected && (form.attack_resources?.length || 0) >= 2;

                                const handleToggle = () => {
                                    // Make sure we remove old incorrect translations if they exist while toggling
                                    const curr = form.attack_resources || [];
                                    if (curr.includes(arabicVal) || curr.includes(translated)) {
                                        setField("attack_resources", curr.filter((r) => r !== arabicVal && r !== translated));
                                    } else {
                                        if (curr.length >= 2) return;
                                        setField("attack_resources", [...curr, arabicVal]);
                                    }
                                };

                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={handleToggle}
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

                    <div style={{ background: "var(--bg-surface)", borderRadius: "var(--radius-sm)", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem", border: "1px solid var(--border)" }}>
                        <label className="form-label" style={{ marginBottom: 0 }}>{t("settings")}</label>
                        <Toggle checked={form.protection} onChange={(v) => setField("protection", v)} label={`🛡️ ${t("protection")}`} />
                        <hr className="divider" />
                        <Toggle checked={form.not_store} onChange={(v) => setField("not_store", v)} label={`🚫 ${t("dontBuy")}`} />
                        <hr className="divider" />
                        <Toggle checked={form.troops} onChange={(v) => setField("troops", v)} label={`⚔️ ${t("troops")}`} />
                    </div>

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
        </div>,
        document.body
    );
}

function AccountCard({ account, onEdit }) {
    const { t, fmtDate } = useLanguage();
    const [confirmDelete, setConfirmDelete] = useState(false);
    const deleteAccount = useDeleteAccount();

    const resources = account.Collect_resources;
    const attacks = account["Attack resources"];
    const isApproved = account.Is_OK;
    const isActive = account.Is_Active;

    return (
        <div className={`card${isActive ? ' card--bot-active' : ''}`} style={{ padding: "1.25rem", borderColor: isActive ? "rgba(16,185,129,0.4)" : isApproved ? "rgba(16,185,129,0.3)" : "var(--border)", position: "relative", overflow: "hidden" }}>
            {isActive && (
                <div className="card-active-glow" />
            )}
            {isApproved && !isActive && (
                <div style={{ position: "absolute", inset: 0, borderRadius: "var(--radius)", boxShadow: "0 0 20px rgba(16,185,129,0.1)", pointerEvents: "none" }} />
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: isApproved ? "var(--green-soft)" : "var(--accent-soft)", border: `2px solid ${isApproved ? "var(--green)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <User size={22} color={isApproved ? "var(--green)" : "var(--accent)"} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: "0.95rem", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={account.Email}>
                            {account.Email}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                            {fmtDate(account.created_at)}
                        </div>
                        {account.Date_OK && (
                            <div style={{ fontSize: "0.7rem", fontWeight: 600, color: isApproved ? "var(--green)" : "var(--gold)", marginTop: "0.1rem" }}>
                                {isApproved ? "✓ " + t("approvedOn") : "✗ " + t("rejectedOn")} {fmtDate(account.Date_OK)}
                            </div>
                        )}
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

            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                {isApproved ? (
                    <span className="badge badge-approved"><CheckCircle2 size={10} /> {t("approved")}</span>
                ) : (
                    <span className="badge badge-pending"><Clock size={10} /> {t("pending")}</span>
                )}
                <span className={`bot-active-badge ${isActive ? 'bot-active-badge--running' : 'bot-active-badge--stopped'}`}>
                    <span className={`bot-active-dot ${isActive ? 'bot-active-dot--running' : 'bot-active-dot--stopped'}`} />
                    {isActive ? t("botRunning") : t("botStopped")}
                </span>
            </div>
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

            {attacks && attacks.length > 0 && (
                <div style={{ marginBottom: "0.75rem" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.375rem" }}>⚔️ {t("attackResources")}</div>
                    <div style={{ display: "flex", gap: "0.375rem" }}>
                        {attacks.map((res) => {
                            const matchedKey = Object.keys(ARABIC_RESOURCES).find(k => ARABIC_RESOURCES[k] === res);
                            const displayVal = matchedKey ? t(matchedKey) : res;
                            return (
                                <span key={res} className="badge badge-pending" style={{ background: "var(--orange-soft)", color: "var(--orange)", borderColor: "rgba(249,115,22,0.3)" }}>{displayVal}</span>
                            );
                        })}
                    </div>
                </div>
            )}

            {account.animal && (
                <div style={{ marginBottom: "0.75rem" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.375rem" }}>🐾 {t("animal")}</div>
                    <div style={{ display: "flex", gap: "0.375rem" }}>
                        <span className="badge badge-approved" style={{ background: "var(--purple-soft)", color: "var(--purple)", borderColor: "rgba(168,85,247,0.3)" }}>{t(account.animal)}</span>
                    </div>
                </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {account.Protection && <span className="badge badge-approved">🛡️ {t("protection")}</span>}
                {account.Troops && <span className="badge badge-approved">⚔️ {t("troops")}</span>}
                {account.Not_store && <span className="badge badge-rejected">🚫 {t("dontBuy")}</span>}
            </div>

            {confirmDelete && createPortal(
                <div className="modal-backdrop" onClick={() => setConfirmDelete(false)}>
                    <div className="modal-box" style={{ maxWidth: 380, padding: "2rem" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                            <AlertCircle size={40} color="var(--red)" style={{ margin: "0 auto 0.75rem", display: "block" }} />
                            <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>{t("confirmDeleteAccount")}</h3>
                            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{t("deleteAccountConfirmMsg")}</p>
                        </div>
                        <div style={{ display: "flex", gap: "0.75rem" }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDelete(false)}>{t("cancel")}</button>
                            <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => deleteAccount.mutate({ id: account.id }, { onSettled: () => setConfirmDelete(false) })} disabled={deleteAccount.isPending}>
                                {t("delete")}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

function BotFeaturesWidget({ isApproved }) {
    const { t } = useLanguage();
    const [isExpanded, setIsExpanded] = useState(false);

    const features = [
        { key: "feature_port", icon: Anchor },
        { key: "feature_mail", icon: Mail },
        { key: "feature_prod_inside", icon: PackageOpen },
        { key: "feature_hammer", icon: Hammer },
        { key: "feature_alliance", icon: Users },
        { key: "feature_caravan", icon: Truck },
        { key: "feature_train_troops", icon: Sword },
        { key: "feature_col_outside", icon: Swords },
        { key: "feature_shield_3d", icon: Shield },
        { key: "feature_bonuses", icon: Gift },
    ];

    return (
        <div className="animate-fade-in card-glass" style={{ padding: "1.5rem", borderRadius: "var(--radius-lg)", border: `1px solid ${isApproved ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"}`, background: "var(--bg-surface)", position: "relative", overflow: "hidden", marginBottom: "0.5rem", marginTop: "0.5rem", transition: "all 0.3s ease" }}>
            <div style={{ position: "absolute", width: "200px", height: "200px", background: `radial-gradient(circle, ${isApproved ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)"} 0%, transparent 70%)`, top: "-50px", right: "-50px", pointerEvents: "none" }} />
            <div style={{ position: "absolute", width: "150px", height: "150px", background: `radial-gradient(circle, ${isApproved ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)"} 0%, transparent 70%)`, bottom: "-50px", left: "-50px", pointerEvents: "none" }} />

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: isExpanded ? "1.25rem" : "0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <div style={{ position: "absolute", width: 32, height: 32, background: isApproved ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)", borderRadius: "50%", animation: isApproved ? "pulse-glow 2s infinite" : "none" }} />
                        {isApproved ? <Activity size={24} color="var(--green)" style={{ position: "relative", zIndex: 1 }} /> : <Clock size={24} color="var(--orange)" style={{ position: "relative", zIndex: 1 }} />}
                    </div>
                    <div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: "flex-start" }}>
                            <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)", margin: 0, lineHeight: 1.2 }}>{t("botFeaturesTitle")}</h3>
                            {!isApproved && <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", background: "var(--orange-soft)", color: "var(--orange)", borderRadius: "999px", fontWeight: 700 }}>{t("awaitingActivation")}</span>}
                        </div>
                    </div>
                </div>

                <button onClick={() => setIsExpanded(!isExpanded)} className="btn btn-ghost" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", borderRadius: "999px", background: "var(--bg-card)", border: "1px solid var(--border)", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                    {isExpanded ? t("showLessFeatures") : t("viewAllFeatures")}
                    <ChevronDown size={16} style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s ease" }} />
                </button>
            </div>

            <div style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem",
                maxHeight: isExpanded ? "1500px" : "0px",
                opacity: isExpanded ? 1 : 0,
                visibility: isExpanded ? "visible" : "hidden",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                marginTop: isExpanded ? "1.25rem" : "0",
                transform: `translateY(${isExpanded ? "0" : "-10px"})`
            }}>
                {features.map((f, i) => {
                    const Icon = f.icon;
                    return (
                        <div key={i} style={{
                            display: "flex", alignItems: "center", gap: "0.75rem",
                            padding: "0.75rem 1rem",
                            background: "var(--bg-card)",
                            borderRadius: "var(--radius)",
                            border: "1px solid var(--border)",
                            position: "relative",
                            transition: "all 0.3s ease",
                            cursor: "default"
                        }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: "50%",
                                background: isApproved ? "var(--green-soft)" : "var(--bg-hover)",
                                border: `1px solid ${isApproved ? "rgba(16, 185, 129, 0.4)" : "var(--border)"}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: isApproved ? "var(--green)" : "var(--text-muted)"
                            }}>
                                <Icon size={16} />
                            </div>
                            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>{t(f.key)}</span>

                            <div style={{ position: "absolute", top: "50%", right: t("dir") === "ltr" ? "1rem" : "auto", left: t("dir") === "rtl" ? "1rem" : "auto", transform: "translateY(-50%)", width: 8, height: 8, background: isApproved ? "var(--green)" : "var(--orange)", borderRadius: "50%", boxShadow: isApproved ? "0 0 8px var(--green)" : "none", animation: isApproved ? "pulse-glow 2s infinite" : "none" }} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function AccountsPage() {
    const { t } = useLanguage();
    const { user } = useAuthContext();
    const { data: profile } = useProfile(user?.id);
    const { data: accounts, isLoading, isError } = useGetAccounts();
    const addAccount = useAddAccount();
    const updateAccount = useUpdateAccount();

    const [showAdd, setShowAdd] = useState(false);
    const [editAccount, setEditAccount] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredAccounts = accounts?.filter(acc =>
        acc.Email?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    if (isLoading) {
        return (
            <div className="page-loader">
                <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
                <p>{t("loading")}</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="page-loader">
                <AlertCircle size={36} color="var(--red)" />
                <p style={{ color: "var(--red)" }}>{t("loading")}</p>
            </div>
        );
    }

    const approved = accounts?.filter((a) => a.Is_OK) || [];
    const pending = accounts?.filter((a) => !a.Is_OK) || [];
    const activeAccounts = accounts?.filter((a) => a.Is_Active) || [];

    const handleAdd = (formData) => {
        addAccount.mutate(formData, { onSuccess: () => setShowAdd(false) });
    };

    const handleUpdate = (formData) => {
        updateAccount.mutate({ id: editAccount.id, ...formData }, { onSuccess: () => setEditAccount(null) });
    };

    const toEditForm = (acc) => ({
        email: acc.Email,
        password: acc.password,
        collect_resources: acc.Collect_resources || [false, false, false, false],
        attack_resources: acc["Attack resources"] || [],
        protection: acc.Protection || false,
        troops: acc.Troops || false,
        not_store: acc.Not_store || false,
        animal: acc.animal || "",
    });

    return (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
                    <div>
                        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem" }}>{t("accounts")}</h1>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                            {accounts?.length || 0} {t("accountsCount")} · {approved.length} {t("approved")} · {pending.length} {t("pending")}
                        </p>
                    </div>

                    {/* Smart Search Field */}
                    <div style={{ position: "relative", minWidth: "300px" }}>
                        <div style={{ position: "absolute", [t("dir") === "ltr" ? "left" : "right"]: "1rem", top: "50%", transform: "translateY(-50%)", color: searchTerm ? "var(--accent)" : "var(--text-muted)", transition: "color 0.3s ease", pointerEvents: "none" }}>
                            <Search size={16} />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t("searchByEmailPlaceholder")}
                            style={{
                                width: "100%",
                                padding: t("dir") === "ltr" ? "0.6rem 2.5rem 0.6rem 2.80rem" : "0.6rem 2.80rem 0.6rem 2.5rem",
                                background: "var(--bg-card)",
                                color: "var(--text-main)",
                                border: `1px solid ${searchTerm ? "var(--accent)" : "var(--border)"}`,
                                borderRadius: "var(--radius-lg)",
                                fontSize: "0.875rem",
                                outline: "none",
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                boxShadow: searchTerm ? "0 0 0 4px var(--accent-light)" : "none",
                            }}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                style={{
                                    position: "absolute",
                                    [t("dir") === "ltr" ? "right" : "left"]: "0.75rem",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    color: "var(--text-muted)",
                                    cursor: "pointer",
                                    padding: "4px"
                                }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAdd(true)} style={{ gap: "0.5rem" }}>
                    <Plus size={18} /> {t("addAccount")}
                </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
                {[
                    { labelKey: "accountsCount", value: accounts?.length || 0, color: "var(--accent)", icon: User },
                    { labelKey: "approved", value: approved.length, color: "var(--green)", icon: CheckCircle2 },
                    { labelKey: "pending", value: pending.length, color: "var(--gold)", icon: Clock },
                    { labelKey: "activeAccounts", value: activeAccounts.length, color: "#10b981", icon: Zap },
                ].map(({ labelKey, value, color, icon: Icon }) => (
                    <div key={labelKey} className="stat-card">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t(labelKey)}</span>
                            <Icon size={18} color={color} />
                        </div>
                        <div style={{ fontSize: "2rem", fontWeight: 800, color }}>{value}</div>
                    </div>
                ))}
            </div>

            {/* Features Display */}
            <BotFeaturesWidget isApproved={profile?.Is_COMP} />

            {/* Empty state */}
            {(!accounts || accounts.length === 0) && (
                <div style={{ textAlign: "center", padding: "4rem 2rem", border: "2px dashed var(--border)", borderRadius: "var(--radius-lg)" }}>
                    <User size={48} color="var(--text-muted)" style={{ margin: "0 auto 1rem" }} />
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>{t("noAccounts")}</h3>
                    <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", fontSize: "0.875rem" }}>{t("addFirstAccount")}</p>
                    <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
                        <Plus size={18} /> {t("addAccount")}
                    </button>
                </div>
            )}

            {/* Accounts grid */}
            {accounts && accounts.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
                    {filteredAccounts.length > 0 ? (
                        filteredAccounts.map((acc) => (
                            <AccountCard
                                key={acc.id}
                                account={acc}
                                onEdit={(acc) => setEditAccount(acc)}
                            />
                        ))
                    ) : (
                        <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem", background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
                            <Search size={32} color="var(--text-muted)" style={{ marginBottom: "1rem", opacity: 0.5 }} />
                            <p style={{ color: "var(--text-muted)" }}>{t("noResultsFor")} "{searchTerm}"</p>
                        </div>
                    )}
                </div>
            )}

            {showAdd && (
                <AccountModal
                    title={t("addAccountNew")}
                    onClose={() => setShowAdd(false)}
                    onSave={handleAdd}
                    isSaving={addAccount.isPending}
                />
            )}

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
