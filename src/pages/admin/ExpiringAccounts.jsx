import { useState } from "react";
import { useGetAllAccounts } from "../../hooks/useAdminAccounts";
import { useGetSubscriptions, useToggleSubscription } from "../../hooks/useSubscriptions";
import { useLanguage } from "../../Context/LanguageContext";
import {
    User as UserIcon, Calendar, Server, Hash, RefreshCw, CreditCard, Clock, CheckCircle2, Mail
} from "lucide-react";

export default function ExpiringAccounts() {
    const { t, fmtDate } = useLanguage();
    const { data: accounts, isLoading: accLoading, refetch: refetchAccs } = useGetAllAccounts();
    const { data: subscriptions, isLoading: subLoading, refetch: refetchSubs } = useGetSubscriptions();
    const toggle = useToggleSubscription();

    const [isProcessing, setIsProcessing] = useState(false);

    const isLoading = accLoading || subLoading || isProcessing;

    const handleRefresh = () => {
        refetchAccs();
        refetchSubs();
    };

    const handleMarkAsPaid = async (accountId, monthKey, currentSubId) => {
        setIsProcessing(true);
        try {
            await toggle.mutateAsync({
                id: currentSubId,
                accountId: accountId,
                month: monthKey,
                currentPaid: false,
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth() + 1;
    const currentMonthKey = `${currentYear}-${String(currentMonthIndex).padStart(2, '0')}`;

    const expiringList = (accounts || []).filter(a => {
        if (!a.Is_OK || !a.Date_OK) return false;

        const accSubs = (subscriptions || []).filter(s => s.account_id === a.id);
        const currentMonthSub = accSubs.find(s => s.month === currentMonthKey);

        if (currentMonthSub?.is_paid === true) {
            return false;
        }

        const activePaidCount = accSubs.filter(s => s.is_paid === true).length;
        const coveredMonths = Math.max(1, activePaidCount);

        const dateOk = new Date(a.Date_OK);
        const expiryDate = new Date(dateOk);
        expiryDate.setDate(expiryDate.getDate() + (coveredMonths * 30));

        const diffTime = expiryDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        a.remainingDays = diffDays;
        a.expiryDate = expiryDate;
        a.currentSubId = currentMonthSub?.id;

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
                        الحسابات التي تبقى على اشتراكها 5 أيام أو أقل ولم تسدد اشتراك الشهر الحالي ({currentMonthKey})
                    </p>
                </div>
                <button className="btn btn-secondary" style={{ gap: "0.5rem" }} onClick={handleRefresh} disabled={isLoading}>
                    <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} /> {t("refresh")}
                </button>
            </div>

            {isLoading && (
                <div className="page-loader">
                    <div className="spinner" style={{ width: 32, height: 32 }} />
                    <p>{t("loading")}</p>
                </div>
            )}

            {!isLoading && expiringList.length === 0 && (
                <div style={{ textAlign: "center", padding: "3rem", border: "2px dashed var(--border)", borderRadius: "var(--radius-lg)" }}>
                    <CheckCircle2 size={40} color="var(--green)" style={{ margin: "0 auto 1rem", display: "block" }} />
                    <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>لا توجد حسابات منتهية قريباً</h3>
                    <p style={{ color: "var(--text-muted)" }}>جميع الحسابات نشطة أو تم تسديد اشتراكها للشهر الحالي.</p>
                </div>
            )}

            {!isLoading && expiringList.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                    {expiringList.map((a) => (
                        <div key={a.id} className="card" style={{ padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", borderColor: a.remainingDays <= 0 ? "rgba(239,68,68,0.3)" : "var(--border)" }}>

                            <div style={{ width: 42, height: 42, borderRadius: "var(--radius-sm)", background: a.remainingDays <= 0 ? "var(--red-soft)" : "var(--gold-soft)", border: `2px solid ${a.remainingDays <= 0 ? "var(--red)" : "var(--gold)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <UserIcon size={20} color={a.remainingDays <= 0 ? "var(--red)" : "var(--gold)"} />
                            </div>

                            <div style={{ flex: "1 1 200px" }}>
                                <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    {t("account")} #{a.id} <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.2rem" }}><Mail size={10}/> {a.Email}</span>
                                    {a.remainingDays <= 0 && (
                                        <span className="badge badge-rejected" style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem" }}>منتهي</span>
                                    )}
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap", marginTop: "0.25rem" }}>
                                    <span style={{ color: "var(--accent)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.2rem" }}>
                                        <UserIcon size={12} /> {a.ownerName}
                                    </span>
                                    <span style={{ display: "flex", alignItems: "center", gap: "0.2rem" }} title="تاريخ الاعتماد">
                                        <Calendar size={12} /> ا.ع: {fmtDate(a.Date_OK, { month: "short", day: "numeric" })}
                                    </span>
                                    <span style={{ display: "flex", alignItems: "center", gap: "0.2rem", color: "var(--text-primary)" }} title="تاريخ الانتهاء">
                                        • ينتهي: {fmtDate(a.expiryDate, { month: "short", day: "numeric" })}
                                    </span>
                                </div>
                            </div>

                            {a.index_server && (
                                <div style={{ display: "flex", gap: "1rem", padding: "0 1rem", borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}>
                                    <div style={{ textAlign: "center" }}>
                                        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.15rem" }}>{t("server")}</div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.2rem", color: "var(--accent)", fontWeight: 800, fontSize: "1rem" }}>
                                            <Server size={12} /> {a.index_server}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "center" }}>
                                        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.15rem" }}>{t("indexEmulator")}</div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.2rem", color: "var(--gold)", fontWeight: 800, fontSize: "1rem" }}>
                                            <Hash size={12} /> {a.index_emulators}
                                        </div>
                                    </div>
                                </div>
                            )}

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
                                    onClick={() => handleMarkAsPaid(a.id, currentMonthKey, a.currentSubId)}
                                    disabled={isProcessing}
                                >
                                    <CreditCard size={15} />
                                    تسديد ({currentMonthKey})
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
