import { useState } from "react";
import { createPortal } from "react-dom";
import { useGetAllAccounts, useGetAllAdminUsers, useUpdateUserExpiryDate } from "../../hooks/useAdminAccounts";
import { useLanguage } from "../../Context/LanguageContext";
import {
    User as UserIcon, Calendar, Server, Hash, RefreshCw, CreditCard, Clock, CheckCircle2, Mail, X, Save
} from "lucide-react";

export default function ExpiringAccounts() {
    const { t, fmtDate } = useLanguage();
    const { data: accounts, isLoading: accLoading, refetch: refetchAccs } = useGetAllAccounts();
    const { data: adminUsers, isLoading: usersLoading, refetch: refetchUsers } = useGetAllAdminUsers();

    const updateExpiry = useUpdateUserExpiryDate();
    const [renewModal, setRenewModal] = useState(null);
    const [renewDate, setRenewDate] = useState("");

    const openRenewModal = (user) => {
        setRenewModal(user);
        setRenewDate(user.dateExpire ? user.dateExpire.split("T")[0] : new Date().toISOString().split("T")[0]);
    };

    const isProcessing = accLoading || usersLoading || updateExpiry.isPending;

    const handleRefresh = () => {
        refetchAccs();
        refetchUsers();
    };

    const confirmRenew = () => {
        if (!renewModal || !renewDate) return;

        updateExpiry.mutate(
            { userId: renewModal.id, dateExpire: renewDate },
            {
                onSuccess: () => {
                    setRenewModal(null);
                    setRenewDate("");
                }
            }
        );
    };

    const now = new Date();

    const expiringList = (adminUsers || []).filter(u => {
        if (!u.dateExpire || u.isApprovedComp === false) return false;

        const expiryDate = new Date(u.dateExpire);
        const diffTime = expiryDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        u.remainingDays = diffDays;
        u.expiryDate = expiryDate;

        return diffDays <= 5;
    }).sort((a, b) => a.remainingDays - b.remainingDays);


    return (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "900px", margin: "0 auto", width: "100%" }}>
            <style>
                {`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}
            </style>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Clock className="text-gold" size={24} color="var(--gold)" />
                        حسابات منتهية قريباً
                    </h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                        المستخدمون الذين تبقى على اشتراكاتهم 5 أيام أو أقل
                    </p>
                </div>
                <button className="btn btn-secondary" style={{ gap: "0.5rem" }} onClick={handleRefresh} disabled={isProcessing}>
                    <RefreshCw size={15} className={isProcessing ? "animate-spin" : ""} /> {t("refresh")}
                </button>
            </div>

            {isProcessing && (
                <div className="page-loader">
                    <div className="spinner" style={{ width: 32, height: 32 }} />
                    <p>{t("loading")}</p>
                </div>
            )}

            {!isProcessing && expiringList.length === 0 && (
                <div style={{ textAlign: "center", padding: "3rem", border: "2px dashed var(--border)", borderRadius: "var(--radius-lg)" }}>
                    <CheckCircle2 size={40} color="var(--green)" style={{ margin: "0 auto 1rem", display: "block" }} />
                    <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>لا يوجد مستخدمون منتهية اشتراكاتهم قريباً</h3>
                    <p style={{ color: "var(--text-muted)" }}>جميع المستخدمين المعتمدين نشطين حالياً.</p>
                </div>
            )}

            {!isProcessing && expiringList.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                    {expiringList.map((a) => (
                        <div key={a.id} className="card " style={{ padding: "1.25rem", display: "flex", flexDirection: "column", borderColor: a.remainingDays <= 0 ? "rgba(239,68,68,0.3)" : "var(--border)" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: "1 1 min-content" }}>

                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                                            {a.displayName}
                                            {a.remainingDays <= 0 && (
                                                <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.5rem", borderRadius: "8px", background: "var(--red)", color: "white", fontWeight: 700 }}>منتهي</span>
                                            )}
                                        </div>
                                        <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.3rem", marginTop: "0.2rem" }}><Mail size={12} /> {a.email}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: "center", background: "var(--bg-surface)", padding: "0.5rem 1rem", borderRadius: "12px", border: "1px dashed var(--border)", display: "flex", flexDirection: "column", alignItems: "center", minWidth: "100px" }}>
                                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.15rem" }}>متبقي</div>
                                    <div style={{ fontSize: "1.2rem", fontWeight: 900, color: a.remainingDays <= 0 ? "var(--red)" : "var(--gold)", direction: "ltr" }}>
                                        {a.remainingDays} {a.remainingDays === 1 ? "يوم" : "أيام"}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
                                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                                    <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: 600 }}>
                                        <Hash size={14} color="var(--accent)" /> كوتا: <span style={{ color: "var(--text-primary)" }}>{a.allowedAccounts}</span>
                                    </span>
                                    <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                        <Calendar size={14} /> ا.ع: {fmtDate(a.dateOkProfile, { month: "short", day: "numeric" })}
                                    </span>
                                    <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--text-primary)", fontWeight: 600 }}>
                                        ينتهي: {fmtDate(a.expiryDate, { month: "short", day: "numeric" })}
                                    </span>
                                </div>

                                <button
                                    className="btn btn-success"
                                    style={{ padding: "0.5rem 1.5rem", fontSize: "0.9rem", gap: "0.5rem", fontWeight: 800, flex: "1 1 auto", maxWidth: "200px", justifyContent: "center" }}
                                    onClick={() => openRenewModal(a)}
                                    disabled={isProcessing}
                                >
                                    <CreditCard size={16} />
                                    تجديد
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {renewModal && createPortal(
                <div className="modal-backdrop" onClick={() => { setRenewModal(null); setRenewDate(""); }}>
                    <div
                        className="modal-box animate-slide-up no-scrollbar"
                        style={{
                            maxWidth: 420, width: "90%", padding: 0,
                            borderRadius: "16px", overflow: "hidden",
                            border: "1px solid var(--border)",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                            maxHeight: "90vh",
                            overflowY: "auto"
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ padding: "1.5rem", background: "var(--bg-surface)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                                <CreditCard size={20} color="var(--green)" />
                                تجديد اشتراك
                            </h3>
                            <button className="btn btn-ghost" style={{ padding: "0.4rem" }} onClick={() => { setRenewModal(null); setRenewDate(""); }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 700 }}>المستخدم</div>
                                <div style={{ fontSize: "1.1rem", fontWeight: 900 }}>{renewModal.displayName}</div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 700 }}>إضافة سريعة (تُضاف لتاريخ الانتهاء الحالي)</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                                    {[1, 3, 6, 12].map(m => (
                                        <button
                                            key={m}
                                            className="btn"
                                            style={{
                                                flex: "1 1 calc(25% - 0.5rem)", padding: "0.5rem",
                                                background: "var(--bg-hover)",
                                                border: "1px solid var(--border)", fontSize: "0.85rem"
                                            }}
                                            onClick={() => {
                                                let baseDate = new Date();
                                                if (renewModal.dateExpire) {
                                                    const expD = new Date(renewModal.dateExpire);
                                                    if (expD > baseDate) baseDate = expD;
                                                }
                                                const newD = new Date(baseDate);
                                                newD.setDate(newD.getDate() + (m * 30));
                                                setRenewDate(newD.toISOString().split("T")[0]);
                                            }}
                                        >
                                            + {m} {m === 1 ? "شهر" : "أشهر"}
                                        </button>
                                    ))}
                                    <button
                                        className="btn"
                                        style={{ flex: "1 1 calc(33% - 0.5rem)", padding: "0.5rem", background: "var(--red-soft)", color: "var(--red)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "0.85rem" }}
                                        onClick={() => {
                                            const d = new Date(renewDate);
                                            d.setDate(d.getDate() - 30);
                                            setRenewDate(d.toISOString().split("T")[0]);
                                        }}
                                    >- شهر</button>
                                </div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 700 }}>تحديد التاريخ بدقة</div>
                                <input
                                    type="date"
                                    className="form-input"
                                    style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", fontWeight: 800 }}
                                    value={renewDate}
                                    onChange={(e) => setRenewDate(e.target.value)}
                                />
                            </div>

                            {renewDate && (() => {
                                const d1 = new Date(renewDate);
                                d1.setHours(0, 0, 0, 0);
                                const d2 = new Date();
                                d2.setHours(0, 0, 0, 0);
                                const diff = Math.ceil((d1 - d2) / (1000 * 60 * 60 * 24));
                                const isExpired = diff <= 0;
                                const colorVar = isExpired ? "var(--red)" : "var(--green)";
                                const bgVar = isExpired ? "var(--red-soft)" : "var(--green-soft)";
                                return (
                                    <div style={{ padding: "1rem", background: bgVar, borderRadius: "12px", border: `1px dashed ${colorVar}` }}>
                                        <div style={{ fontSize: "0.85rem", color: colorVar, fontWeight: 700, marginBottom: "0.25rem" }}>التاريخ المعتمد للتجديد:</div>
                                        <div style={{ fontSize: "1.1rem", fontWeight: 900, color: colorVar }}>
                                            {new Date(renewDate).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                        <div style={{ fontSize: "0.8rem", color: colorVar, fontWeight: 700, marginTop: "0.25rem" }}>
                                            {diff > 0 ? `صالح لـ ${diff} يوم إضافية` : diff < 0 ? `منتهي منذ ${Math.abs(diff)} يوم` : "ينتهي اليوم"}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        <div style={{ padding: "1.25rem 1.5rem", background: "var(--bg-hover)", borderTop: "1px solid var(--border)", display: "flex", gap: "0.75rem" }}>
                            <button className="btn btn-ghost" style={{ flex: 1, padding: "0.75rem" }} onClick={() => { setRenewModal(null); setRenewDate(""); }}>الغاء</button>
                            <button
                                className="btn btn-success"
                                style={{ flex: "2 1 auto", gap: "0.5rem", padding: "0.75rem", fontSize: "1rem", minWidth: "160px" }}
                                onClick={confirmRenew}
                                disabled={updateExpiry.isPending}
                            >
                                {updateExpiry.isPending ? <div className="spinner" style={{ width: 18, height: 18, borderTopColor: "white" }} /> : <CreditCard size={20} />}
                                تأكيد التجديد
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
