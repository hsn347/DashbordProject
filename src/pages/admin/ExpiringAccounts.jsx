import { useState } from "react";
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
    const [renewMonths, setRenewMonths] = useState(1);

    const isProcessing = accLoading || usersLoading || updateExpiry.isPending;

    const handleRefresh = () => {
        refetchAccs();
        refetchUsers();
    };

    const confirmRenew = () => {
        if (!renewModal) return;
        const u = renewModal;

        let baseDate = new Date();
        if (u.dateExpire) {
            const expD = new Date(u.dateExpire);
            if (expD > baseDate) baseDate = expD;
        }

        // Add N months (approx 30 days each)
        const newD = new Date(baseDate);
        newD.setDate(newD.getDate() + (renewMonths * 30));

        updateExpiry.mutate(
            { userId: u.id, dateExpire: newD.toISOString().split("T")[0] },
            {
                onSuccess: () => {
                    setRenewModal(null);
                    setRenewMonths(1);
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
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
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
                        <div key={a.id} className="card" style={{ padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", borderColor: a.remainingDays <= 0 ? "rgba(239,68,68,0.3)" : "var(--border)" }}>

                            <div style={{ width: 42, height: 42, borderRadius: "var(--radius-sm)", background: a.remainingDays <= 0 ? "var(--red-soft)" : "var(--gold-soft)", border: `2px solid ${a.remainingDays <= 0 ? "var(--red)" : "var(--gold)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <UserIcon size={20} color={a.remainingDays <= 0 ? "var(--red)" : "var(--gold)"} />
                            </div>

                            <div style={{ flex: "1 1 200px" }}>
                                <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    مستخدم #{a.displayName} <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.2rem" }}><Mail size={10} /> {a.email}</span>
                                    {a.remainingDays <= 0 && (
                                        <span className="badge badge-rejected" style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem" }}>منتهي</span>
                                    )}
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap", marginTop: "0.25rem" }}>
                                    <span style={{ color: "var(--accent)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.2rem" }}>
                                        <Hash size={12} /> كوتا: {a.allowedAccounts}
                                    </span>
                                    <span style={{ display: "flex", alignItems: "center", gap: "0.2rem" }} title="تاريخ الاعتماد">
                                        <Calendar size={12} /> ا.ع: {fmtDate(a.dateOkProfile, { month: "short", day: "numeric" })}
                                    </span>
                                    <span style={{ display: "flex", alignItems: "center", gap: "0.2rem", color: "var(--text-primary)" }} title="تاريخ الانتهاء">
                                        • ينتهي: {fmtDate(a.expiryDate, { month: "short", day: "numeric" })}
                                    </span>
                                </div>
                            </div>

                            <div style={{ textAlign: "center", minWidth: 80 }}>
                                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.15rem" }}>متبقي</div>
                                <div style={{
                                    fontSize: "1.1rem",
                                    fontWeight: 800,
                                    color: a.remainingDays <= 0 ? "var(--red)" : "var(--gold)",
                                    direction: "ltr"
                                }}>
                                    {a.remainingDays} {a.remainingDays === 1 ? "يوم" : "أيام"}
                                </div>
                            </div>

                            <div style={{ display: "flex", marginLeft: t("dir") === "ltr" ? "auto" : "0", marginRight: t("dir") === "rtl" ? "auto" : "0" }}>
                                <button
                                    className="btn btn-success"
                                    style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", gap: "0.4rem" }}
                                    onClick={() => setRenewModal(a)}
                                    disabled={isProcessing}
                                >
                                    <CreditCard size={15} />
                                    تجديد
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {renewModal && (
                <div className="modal-backdrop" onClick={() => setRenewModal(null)}>
                    <div className="animate-slide-up modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-header">
                            <h2 style={{ fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <CreditCard color="var(--green)" /> تجديد اشتراك
                            </h2>
                            <button className="btn btn-ghost" style={{ padding: "0.5rem" }} onClick={() => setRenewModal(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ padding: "1.5rem" }}>
                            <p style={{ marginBottom: "1rem", color: "var(--text-secondary)" }}>
                                تحديد عدد الشهور لتمديد صلاحية المستخدم: <strong>{renewModal.displayName}</strong>
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                <label style={{ fontWeight: 700 }}>عدد الشهور:</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    min="1"
                                    max="120"
                                    value={renewMonths}
                                    onChange={(e) => setRenewMonths(parseInt(e.target.value) || 1)}
                                    style={{ width: "100px" }}
                                />
                            </div>
                            <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                ملاحظة: الشهر يتم حسابه بمقدار 30 يوم من تاريخ الانتهاء الحالي.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn" onClick={() => setRenewModal(null)}>الغاء</button>
                            <button className="btn btn-success" onClick={confirmRenew} disabled={updateExpiry.isPending} style={{ gap: "0.4rem" }}>
                                {updateExpiry.isPending ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <Save size={16} />}
                                تأكيد التمديد
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
