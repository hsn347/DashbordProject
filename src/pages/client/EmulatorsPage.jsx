import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Monitor, Plus, Trash2, ChevronRight, CheckCircle2, Clock, Server, Hash, AlertCircle } from "lucide-react";
import { useGetEmulators, useAddEmulator, useDeleteEmulator } from "../../hooks/useEmulators";
import { useAuthContext } from "../../Context/AuthContext";
import { useLanguage } from "../../Context/LanguageContext";

function StatusBadge({ status, t }) {
    if (status === "true") return (
        <span className="badge badge-approved"><CheckCircle2 size={10} /> {t("approved")}</span>
    );
    return (
        <span className="badge badge-pending"><Clock size={10} /> {t("pending")}</span>
    );
}

function ConfirmDelete({ onConfirm, onCancel, isPending, t }) {
    return (
        <div className="modal-backdrop" onClick={onCancel}>
            <div className="modal-box" style={{ maxWidth: 400, padding: "2rem" }} onClick={(e) => e.stopPropagation()}>
                <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                    <div style={{ width: 56, height: 56, background: "var(--red-soft)", border: "2px solid var(--red)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                        <AlertCircle size={24} color="var(--red)" />
                    </div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>{t("deleteEmulator")}</h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>{t("deleteConfirmMsg")}</p>
                </div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onCancel}>{t("cancel")}</button>
                    <button className="btn btn-danger" style={{ flex: 1 }} onClick={onConfirm} disabled={isPending}>
                        {isPending ? t("loading") : t("delete")}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function EmulatorsPage() {
    const { user } = useAuthContext();
    const navigate = useNavigate();
    const { t, fmtDate } = useLanguage();
    const { data: emulators, isLoading, isError } = useGetEmulators();
    const addEmulator = useAddEmulator();
    const deleteEmulator = useDeleteEmulator();
    const [deleteTarget, setDeleteTarget] = useState(null);

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

    const approved = emulators?.filter((e) => e.Is_OK === "true") || [];
    const pending = emulators?.filter((e) => e.Is_OK !== "true") || [];

    return (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Page header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem" }}>{t("myEmulators")}</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                        {emulators?.length || 0} {t("emulator")} · {approved.length} {t("approved")} · {pending.length} {t("pending")}
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => addEmulator.mutate()} disabled={addEmulator.isPending} style={{ gap: "0.5rem" }}>
                    {addEmulator.isPending ? (
                        <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: "white" }} /> {t("loading")}</>
                    ) : (
                        <><Plus size={18} /> {t("addEmulator")}</>
                    )}
                </button>
            </div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
                {[
                    { labelKey: "totalEmulators", value: emulators?.length || 0, color: "var(--accent)", icon: Monitor },
                    { labelKey: "approvedEmulators", value: approved.length, color: "var(--green)", icon: CheckCircle2 },
                    { labelKey: "waitingEmulators", value: pending.length, color: "var(--gold)", icon: Clock },
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

            {/* Empty state */}
            {(!emulators || emulators.length === 0) && (
                <div style={{ textAlign: "center", padding: "4rem 2rem", border: "2px dashed var(--border)", borderRadius: "var(--radius-lg)" }}>
                    <Monitor size={48} color="var(--text-muted)" style={{ margin: "0 auto 1rem" }} />
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>{t("noEmulatorsYet")}</h3>
                    <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", fontSize: "0.875rem" }}>{t("addFirstEmulator")}</p>
                    <button className="btn btn-primary" onClick={() => addEmulator.mutate()} disabled={addEmulator.isPending}>
                        <Plus size={18} /> {t("addEmulator")}
                    </button>
                </div>
            )}

            {/* Emulators grid */}
            {emulators && emulators.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                    {emulators.map((em) => (
                        <div
                            key={em.id}
                            className="card"
                            style={{ padding: "1.25rem", cursor: "pointer", borderColor: em.Is_OK === "true" ? "rgba(16,185,129,0.3)" : "var(--border)", transition: "all 0.2s", position: "relative" }}
                            onClick={() => navigate(`/emulators/${em.id}`)}
                        >
                            {em.Is_OK === "true" && (
                                <div style={{ position: "absolute", inset: 0, borderRadius: "var(--radius)", boxShadow: "0 0 20px rgba(16,185,129,0.1)", pointerEvents: "none" }} />
                            )}

                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <div style={{ width: 44, height: 44, borderRadius: "var(--radius-sm)", background: em.Is_OK === "true" ? "var(--green-soft)" : "var(--accent-soft)", border: `2px solid ${em.Is_OK === "true" ? "var(--green)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <Monitor size={22} color={em.Is_OK === "true" ? "var(--green)" : "var(--accent)"} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{t("emulator")} #{em.id}</div>
                                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{fmtDate(em.created_at, { year: "numeric", month: "short", day: "numeric" })}</div>
                                        {em.Date_OK && (
                                            <div style={{ fontSize: "0.7rem", fontWeight: 600, color: em.Is_OK === "true" ? "var(--green)" : "var(--gold)", marginTop: "0.1rem" }}>
                                                {em.Is_OK === "true" ? "✓ " + t("approvedOn") : "✗ " + t("rejectedOn")} {fmtDate(em.Date_OK)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <StatusBadge status={em.Is_OK} t={t} />
                            </div>

                            {em.Is_OK === "true" && em.index_server && (
                                <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", padding: "0.625rem 0.875rem", background: "var(--bg-surface)", borderRadius: "var(--radius-sm)" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
                                        <Server size={13} color="var(--accent)" />
                                        <span style={{ color: "var(--text-muted)" }}>{t("indexServer")}:</span>
                                        <span style={{ color: "var(--accent)", fontWeight: 700 }}>{em.index_server}</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
                                        <Hash size={13} color="var(--gold)" />
                                        <span style={{ color: "var(--text-muted)" }}>{t("indexEmulator")}:</span>
                                        <span style={{ color: "var(--gold)", fontWeight: 700 }}>{em.index_emulators}</span>
                                    </div>
                                </div>
                            )}

                            {em.Is_OK !== "true" && (
                                <div style={{ background: "var(--gold-soft)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "var(--radius-sm)", padding: "0.5rem 0.75rem", marginBottom: "1rem", fontSize: "0.78rem", color: "var(--gold)" }}>
                                    {t("awaitingApproval")}
                                </div>
                            )}

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <button className="btn btn-ghost" style={{ fontSize: "0.8rem", color: "var(--accent)", gap: "0.3rem", padding: "0.35rem 0.5rem" }}
                                    onClick={(e) => { e.stopPropagation(); navigate(`/emulators/${em.id}`); }}>
                                    <span>{t("viewDetails")}</span>
                                    <ChevronRight size={15} />
                                </button>
                                <button className="btn btn-ghost" style={{ color: "var(--red)", padding: "0.35rem" }}
                                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(em.id); }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {deleteTarget && (
                <ConfirmDelete
                    t={t}
                    onConfirm={() => deleteEmulator.mutate(deleteTarget, { onSettled: () => setDeleteTarget(null) })}
                    onCancel={() => setDeleteTarget(null)}
                    isPending={deleteEmulator.isPending}
                />
            )}
        </div>
    );
}
