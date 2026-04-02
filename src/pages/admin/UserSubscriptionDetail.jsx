import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowRight, User, CheckCircle2, XCircle, CreditCard,
    Server, AlertCircle, RefreshCw, X, Check, Trash2,
    TrendingUp, Calendar, Mail, RefreshCw as SyncIcon
} from "lucide-react";
import { useGetSubscriptions, useToggleSubscription } from "../../hooks/useSubscriptions";
import {
    useGetAllAccounts,
    useDeleteAccountAdmin,
    useUpdateAllAccountsDate,
    useCancelAllAccountsApproval
} from "../../hooks/useAdminAccounts";
import { useLanguage } from "../../Context/LanguageContext";
import { supabaseAdmin } from "../../lib/supabase";

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth();

function getMonthKey(year, monthIndex) {
    return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function MonthCell({ month, monthKey, paid, onToggle, isPending, isCurrent }) {
    return (
        <button
            onClick={() => onToggle(monthKey, paid)}
            disabled={isPending}
            title={paid === true ? "مدفوع — انقر للتغيير" : paid === false ? "غير مدفوع — انقر للتغيير" : "غير مسجل — انقر لتسجيل دفع"}
            style={{
                position: "relative",
                padding: "0.7rem 0.3rem",
                borderRadius: "var(--radius-sm)",
                border: `1.5px solid ${paid === true ? "var(--green)" : paid === false ? "rgba(239,68,68,0.45)" : "var(--border)"}`,
                background: paid === true ? "var(--green-soft)" : paid === false ? "var(--red-soft)" : "var(--bg-surface)",
                cursor: isPending ? "not-allowed" : "pointer",
                transition: "all 0.18s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.25rem",
                opacity: isPending ? 0.6 : 1,
                outline: isCurrent ? "2px solid var(--accent)" : "none",
                outlineOffset: 2,
            }}
        >
            {paid === true
                ? <CheckCircle2 size={15} color="var(--green)" />
                : paid === false
                    ? <XCircle size={15} color="var(--red)" />
                    : <CreditCard size={14} color="var(--text-muted)" />
            }
            <span style={{
                fontSize: "0.65rem",
                fontWeight: 600,
                color: paid === true ? "var(--green)" : paid === false ? "var(--red)" : "var(--text-muted)",
                textAlign: "center",
                lineHeight: 1.1,
            }}>
                {month}
            </span>
        </button>
    );
}

function AccountCard({ account, allSubs }) {
    const { t, fmtDate } = useLanguage();
    const MONTHS = t("months");
    const [year, setYear] = useState(CURRENT_YEAR);
    const toggle = useToggleSubscription();
    const deleteAcc = useDeleteAccountAdmin();

    const emSubs = allSubs.filter((s) => s.account_id === account.id);

    const getPaid = (key) => {
        const sub = emSubs.find((s) => s.month === key);
        return sub ? sub.is_paid : null;
    };

    const handleToggle = (monthKey, currentPaid) => {
        const sub = emSubs.find((s) => s.month === monthKey);
        toggle.mutate({
            id: sub?.id,
            accountId: account.id,
            month: monthKey,
            currentPaid,
        });
    };

    const handleDelete = () => {
        if (window.confirm("هل أنت متأكد من حذف هذا الحساب نهائياً؟ سيتم إعادة هيكلة أرقام السيرفرات تلقائياً.")) {
            deleteAcc.mutate(account.id);
        }
    };

    const paidCount = MONTHS.filter((_, i) => getPaid(getMonthKey(year, i)) === true).length;
    const unpaidCount = MONTHS.filter((_, i) => getPaid(getMonthKey(year, i)) === false).length;
    const isApproved = account.Is_OK;

    return (
        <div style={{
            background: "var(--bg-base)",
            border: `1px solid ${isApproved ? "rgba(16,185,129,0.2)" : "var(--border)"}`,
            borderRadius: "var(--radius-md)",
            overflow: "hidden"
        }}>
            <div style={{
                padding: "0.875rem 1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "0.625rem",
                background: isApproved ? "rgba(16,185,129,0.04)" : "var(--bg-surface)",
                borderBottom: "1px solid var(--border)",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                    <div style={{
                        width: 38, height: 38,
                        borderRadius: "var(--radius-sm)",
                        background: isApproved ? "var(--green-soft)" : "var(--bg-surface)",
                        border: `1.5px solid ${isApproved ? "var(--green)" : "var(--border)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                    }}>
                        <User size={16} color={isApproved ? "var(--green)" : "var(--text-muted)"} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
                            {t("account")} #{account.id} <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.2rem" }}><Mail size={10} /> {account.Email}</span>
                            <span style={{
                                fontSize: "0.62rem", fontWeight: 700,
                                padding: "0.1rem 0.4rem", borderRadius: "999px",
                                background: isApproved ? "var(--green-soft)" : "var(--red-soft)",
                                color: isApproved ? "var(--green)" : "var(--red)",
                                border: `1px solid ${isApproved ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                            }}>
                                {isApproved ? `✓ ${t("approved")}` : `✗ ${t("pending")}`}
                            </span>
                            {account.Date_OK && (
                                <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontWeight: 500 }}>
                                    {fmtDate(account.Date_OK)}
                                </span>
                            )}
                        </div>
                        {account.index_server && (
                            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "flex", gap: "0.4rem", marginTop: "0.1rem" }}>
                                <span style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                                    <Server size={9} /> {t("indexServer")} {account.index_server}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <button className="bg-red-500 btn btn-ghost" style={{ color: "white", padding: "0.2rem 0.4rem" }} onClick={handleDelete}>
                        <Trash2 size={14} />
                    </button>

                </div>
            </div>

        </div>
    );
}

export default function UserSubscriptionDetail() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [userProfile, setUserProfile] = useState(null);

    const { data: subscriptions, isLoading: subLoading, refetch } = useGetSubscriptions();
    const { data: accounts, isLoading: accLoading } = useGetAllAccounts();

    const updateGlobalDate = useUpdateAllAccountsDate();
    const cancelApproval = useCancelAllAccountsApproval();

    useEffect(() => {
        const fetchProfile = async () => {
            const { data } = await supabaseAdmin.from("profiles").select("*").eq("id", userId).single();
            if (data) setUserProfile(data);
        };
        fetchProfile();
    }, [userId, updateGlobalDate.isSuccess, cancelApproval.isSuccess]);

    const userAccounts = useMemo(() => (accounts || []).filter(a => a.user_id === userId), [accounts, userId]);
    const ownerName = userAccounts[0]?.ownerName || userId?.slice(0, 8) || "المستخدم";
    const allowedAccounts = userProfile?.allowed_accounts || 0;
    const isApprovedComp = !!userProfile?.Is_COMP;

    const stats = useMemo(() => {
        const allSubs = subscriptions || [];
        const userAccIds = new Set(userAccounts.map(a => a.id));
        const userSubs = allSubs.filter(s => userAccIds.has(s.account_id));
        const paid = userSubs.filter(s => s.is_paid === true).length;
        const unpaid = userSubs.filter(s => s.is_paid === false).length;
        const approved = userAccounts.filter(a => a.Is_OK).length;
        return { paid, unpaid, approved, total: userAccounts.length };
    }, [subscriptions, userAccounts]);

    if (subLoading || accLoading) {
        return <div className="page-loader"><div className="spinner" /></div>;
    }

    return (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem", paddingBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button className="btn btn-ghost" style={{ gap: "0.35rem" }} onClick={() => navigate("/admin/subscriptions")}>
                    <ArrowRight size={16} /> <span>جميع المستخدمين</span>
                </button>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>/ {ownerName}</span>
            </div>

            <div style={{
                background: "var(--bg-card)",
                border: isApprovedComp ? "2px solid var(--accent)" : "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "1.5rem",
                display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1.5rem"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: "50%",
                        background: isApprovedComp ? "var(--accent-soft)" : "var(--bg-hover)",
                        border: `3px solid ${isApprovedComp ? "var(--accent)" : "var(--border)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "1.6rem", fontWeight: 800, color: isApprovedComp ? "var(--accent)" : "var(--text-muted)"
                    }}>
                        {ownerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "1.5rem", fontWeight: 800 }}>
                            {ownerName}
                            {isApprovedComp && (
                                <span style={{ background: "var(--accent)", color: "white", padding: "0.2rem 0.75rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                    <Check size={14} strokeWidth={4} /> مستخدم معتمد
                                </span>
                            )}
                        </h1>
                        <div style={{ marginTop: "0.4rem", display: "flex", gap: "0.75rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                            <span>الكوتا: <strong>{allowedAccounts}</strong></span>
                            <span>الحسابات: <strong>{stats.total}</strong> (معتمد: <strong>{stats.approved}</strong>)</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", background: "var(--bg-surface)", border: "1px solid var(--accent)", padding: "0.4rem 0.875rem", borderRadius: "var(--radius-sm)" }}>
                        <Calendar size={15} color="var(--accent)" />
                        <span style={{ fontSize: "0.75rem", fontWeight: 800 }}>الاعتماد الموحد:</span>
                        <input
                            type="date"
                            className="form-input"
                            style={{ width: "auto", height: "30px", fontSize: "0.85rem", border: "none", background: "transparent", color: "var(--accent)", fontWeight: 800 }}
                            value={userAccounts.find(a => a.Date_OK)?.Date_OK?.split("T")[0] || ""}
                            onChange={(e) => e.target.value && updateGlobalDate.mutate({ userId, date: e.target.value })}
                        />
                        {updateGlobalDate.isPending && <div className="spinner" style={{ width: 14, height: 14 }} />}
                    </div>
                    <button
                        className="btn"
                        style={{ background: "var(--gold-soft)", color: "var(--gold)", height: 42 }}
                        onClick={() => window.confirm("إلغاء اعتماد المستخدم؟") && cancelApproval.mutate(userId)}
                        disabled={cancelApproval.isPending}
                    >
                        <XCircle size={15} /> إلغاء الاعتماد
                    </button>
                    <button className="btn btn-secondary" style={{ height: 42 }} onClick={() => refetch()}><RefreshCw size={15} /></button>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                {[
                    { label: "حسابات معتمدة", value: stats.approved, color: "var(--accent)", bg: "var(--accent-soft)" },
                    { label: "إجمالي الحسابات", value: stats.total, color: "var(--text-primary)", bg: "var(--bg-card)" },
                ].map(s => (
                    <div key={s.label} className="card" style={{ padding: "1rem", textAlign: "center" }}>
                        <div style={{ fontSize: "1.75rem", fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            <section>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                    <CheckCircle2 size={16} color="var(--green)" />
                    <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>قائمة الحسابات</h2>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {userAccounts.map(a => <AccountCard key={a.id} account={a} allSubs={subscriptions || []} />)}
                </div>
            </section>
        </div>
    );
}
