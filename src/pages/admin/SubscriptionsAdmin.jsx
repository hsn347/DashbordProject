import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
    CreditCard, CheckCircle2, XCircle, User,
    Search, X, Users, RefreshCw, ExternalLink, Settings2, Save,
    Trash2, AlertCircle, Calendar, Check
} from "lucide-react";
import {
    useGetAllAccounts,
    useGetAllAdminUsers,
    useUpdateUserAllowedAccounts,
    useDeleteUserAdmin,
    useUpdateAllAccountsDate,
    useCancelAllAccountsApproval,
    useUpdateUserExpiryDate
} from "../../hooks/useAdminAccounts";
import { useLanguage } from "../../Context/LanguageContext";

function UserExpiryEditor({ userId, currentDateExpire, userName }) {
    const { t } = useLanguage();
    const updateExpiry = useUpdateUserExpiryDate();
    const [isEditing, setIsEditing] = useState(false);
    const [val, setVal] = useState(currentDateExpire ? currentDateExpire.split("T")[0] : "");

    const handleSave = () => {
        updateExpiry.mutate(
            { userId, dateExpire: val || null },
            {
                onSuccess: () => {
                    setIsEditing(false);
                }
            }
        );
    };

    const handleEditClick = (e) => {
        e.stopPropagation();
        if (!currentDateExpire) {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            setVal(`${yyyy}-${mm}-${dd}`);
        } else {
            setVal(currentDateExpire.split("T")[0]);
        }
        setIsEditing(true);
    };

    const addMonths = (months) => {
        const currentDate = val ? new Date(val) : new Date();
        currentDate.setMonth(currentDate.getMonth() + months);
        const yyyy = currentDate.getFullYear();
        const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
        const dd = String(currentDate.getDate()).padStart(2, '0');
        setVal(`${yyyy}-${mm}-${dd}`);
    };

    const daysLeft = useMemo(() => {
        if (!val) return null;
        const d1 = new Date(val);
        d1.setHours(0, 0, 0, 0);
        const d2 = new Date();
        d2.setHours(0, 0, 0, 0);
        const diffTime = d1 - d2;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }, [val]);

    const formatReadableDate = (dateStr) => {
        if (!dateStr) return "غير محدد";
        const d = new Date(dateStr);
        return d.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const isExpired = currentDateExpire && new Date(currentDateExpire) < new Date();

    const editorCell = (
        <div
            onClick={handleEditClick}
            style={{
                background: "var(--bg-surface)", padding: "1.25rem", borderRadius: "12px",
                border: `1px solid ${isExpired ? "var(--red)" : "var(--border)"}`, display: "flex", flexDirection: "column",
                justifyContent: "space-between", cursor: "pointer", transition: "all 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = isExpired ? "var(--red)" : "var(--accent)"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = isExpired ? "var(--red)" : "var(--border)"}
            title="تعديل تاريخ الانتهاء"
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Calendar size={16} color={isExpired ? "var(--red)" : "var(--accent)"} /> صلاحية الاشتراك
                </div>
                {isExpired && <div style={{ fontSize: "0.75rem", fontWeight: 800, background: "var(--red-soft)", color: "var(--red)", padding: "0.15rem 0.5rem", borderRadius: "6px" }}>منتهي</div>}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: isExpired ? "var(--red-soft)" : "var(--bg-hover)", padding: "0.5rem 0.75rem", borderRadius: "8px", border: `1px dashed ${isExpired ? "var(--red)" : "var(--border)"}`, width: "100%" }}>
                <span style={{ fontWeight: 800, color: isExpired ? "var(--red)" : "var(--text-primary)", fontSize: "0.95rem" }}>
                    {currentDateExpire ? currentDateExpire.split("T")[0] : "غير محدد"}
                </span>
                <Settings2 size={14} color={isExpired ? "var(--red)" : "var(--text-muted)"} />
            </div>
        </div>
    );

    if (!isEditing) {
        return editorCell;
    }

    return (
        <>
            {editorCell}
            {createPortal(
                <div className="modal-backdrop" onClick={(e) => { e.stopPropagation(); setIsEditing(false); setVal(currentDateExpire ? currentDateExpire.split("T")[0] : ""); }}>
                    <div
                        className="modal-box animate-fade-in"
                        style={{
                            padding: "1.5rem",
                            width: "90%",
                            maxWidth: "420px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "1rem",
                            maxHeight: "90vh",
                            overflowY: "auto"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "1rem" }}>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <Calendar size={20} color="var(--accent)" />
                                تعديل اشتراك: <span style={{ color: "var(--accent)" }}>{userName || "المستخدم"}</span>
                            </h3>
                            <button className="btn btn-ghost" onClick={() => { setIsEditing(false); setVal(currentDateExpire ? currentDateExpire.split("T")[0] : ""); }} style={{ padding: "0.4rem" }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ background: "var(--bg-surface)", borderRadius: "var(--radius)", padding: "1rem", textAlign: "center", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 700 }}>التاريخ المحدد حالياً:</div>
                            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: val ? "var(--text-primary)" : "var(--text-muted)" }}>
                                {formatReadableDate(val)}
                            </div>
                            {val && (
                                <div style={{ alignSelf: "center", background: daysLeft > 0 ? "var(--green-soft)" : daysLeft === 0 ? "var(--gold-soft)" : "var(--red-soft)", color: daysLeft > 0 ? "var(--green)" : daysLeft === 0 ? "var(--gold)" : "var(--red)", padding: "0.25rem 1rem", borderRadius: "999px", fontSize: "0.85rem", fontWeight: 700, display: "inline-block" }}>
                                    {daysLeft > 0 ? `متبقي ${daysLeft} يوماً` : daysLeft < 0 ? `منتهي منذ ${Math.abs(daysLeft)} يوماً` : "ينتهي اليوم!"}
                                </div>
                            )}
                        </div>

                        <div>
                            <label style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem", display: "block" }}>تحديد تاريخ يدوي:</label>
                            <input
                                type="date"
                                className="form-input"
                                style={{ width: "100%", padding: "0.85rem", fontSize: "1.1rem", fontWeight: 700, textAlign: "center", background: "var(--bg-card)" }}
                                value={val}
                                onChange={(e) => setVal(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem", display: "block" }}>إضافة أو إنقاص سريع:</label>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                                <button onClick={() => addMonths(1)} className="btn btn-secondary" style={{ padding: "0.75rem", fontSize: "0.9rem" }}>+ 1 شهر</button>
                                <button onClick={() => addMonths(3)} className="btn btn-secondary" style={{ padding: "0.75rem", fontSize: "0.9rem" }}>+ 3 أشهر</button>
                                <button onClick={() => addMonths(6)} className="btn btn-secondary" style={{ padding: "0.75rem", fontSize: "0.9rem" }}>+ 6 أشهر</button>
                                <button onClick={() => addMonths(12)} className="btn btn-secondary" style={{ padding: "0.75rem", fontSize: "0.9rem" }}>+ 1 سنة</button>
                                <button onClick={() => addMonths(-1)} className="btn btn-ghost" style={{ padding: "0.75rem", gridColumn: "1 / -1", color: "var(--red)", border: "1px dashed rgba(239,68,68,0.3)" }}>- إنقاص 1 شهر</button>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                            <button
                                onClick={() => { setIsEditing(false); setVal(currentDateExpire ? currentDateExpire.split("T")[0] : ""); }}
                                className="btn btn-ghost"
                                style={{ flex: "1 1 auto", padding: "0.75rem", minWidth: "100px" }}
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={updateExpiry.isPending}
                                className="btn btn-primary"
                                style={{ flex: "2 1 auto", gap: "0.5rem", padding: "0.75rem", fontSize: "1rem", minWidth: "160px" }}
                            >
                                {updateExpiry.isPending ? <div className="spinner" style={{ width: 18, height: 18, borderTopColor: "white" }} /> : <Save size={20} />}
                                حفظ التاريخ
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

function UserQuotaEditor({ userId, currentQuota, ownerName, accountsLength }) {
    const { t } = useLanguage();
    const updateQuota = useUpdateUserAllowedAccounts();
    const [isEditing, setIsEditing] = useState(false);
    const [val, setVal] = useState(String(currentQuota || 0));

    const handleSave = () => {
        let parsed = parseInt(val, 10);
        if (isNaN(parsed) || parsed < 0) parsed = 0;
        updateQuota.mutate(
            { userId, allowedAccounts: parsed },
            {
                onSuccess: () => {
                    setIsEditing(false);
                    setVal(String(parsed));
                }
            }
        );
    };

    const cellBox = (isEditContent) => (
        <div
            onClick={(e) => { if (!isEditing) { e.stopPropagation(); setIsEditing(true); } }}
            style={{
                background: "var(--bg-surface)", padding: "1.25rem", borderRadius: "12px",
                border: `1px solid ${isEditing ? "var(--accent)" : "var(--border)"}`, display: "flex", flexDirection: "column",
                justifyContent: "space-between", cursor: isEditing ? "default" : "pointer", transition: "all 0.2s"
            }}
            onMouseEnter={(e) => { if (!isEditing) e.currentTarget.style.borderColor = "var(--accent)"; }}
            onMouseLeave={(e) => { if (!isEditing) e.currentTarget.style.borderColor = "var(--border)"; }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Users size={16} color="var(--accent)" /> الحسابات والقرى
                </div>
                <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "var(--text-primary)" }}>{accountsLength}</div>
            </div>
            {isEditContent}
        </div>
    );

    if (!isEditing) {
        return cellBox(
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-hover)", padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px dashed var(--border)" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>الحد المسموح:</span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "1rem" }}>{currentQuota || 0}</span>
                    <Settings2 size={14} color="var(--text-muted)" />
                </div>
            </div>
        );
    }

    return cellBox(
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }} onClick={(e) => e.stopPropagation()}>
            <input
                type="number"
                min="0"
                className="form-input"
                style={{ flex: 1, minWidth: 0, padding: "0.35rem 0.5rem", fontSize: "1rem", height: 34, fontWeight: "bold", textAlign: "center" }}
                value={val}
                onChange={(e) => setVal(e.target.value)}
                autoFocus
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") { setIsEditing(false); setVal(String(currentQuota || 0)); }
                }}
            />
            <button
                onClick={handleSave}
                disabled={updateQuota.isPending}
                className="btn btn-success"
                style={{ padding: "0 0.75rem", height: 34 }}
            >
                <Save size={16} />
            </button>
            <button
                onClick={() => { setIsEditing(false); setVal(String(currentQuota || 0)); }}
                className="btn btn-ghost"
                style={{ padding: "0 0.5rem", height: 34 }}
            >
                <X size={16} />
            </button>
        </div>
    );
}

function UserSubscriptionCard({ user, accounts, allSubs, onDelete }) {
    const { t, fmtDate } = useLanguage();
    const navigate = useNavigate();
    const updateGlobalDate = useUpdateAllAccountsDate();
    const cancelApproval = useCancelAllAccountsApproval();

    const userAccountsDate = useMemo(() => {
        const approved = accounts.filter(a => a.Is_OK && a.Date_OK);
        if (approved.length === 0) return null;
        return approved[0].Date_OK;
    }, [accounts]);

    const pendingAccounts = accounts.filter(a => !a.Is_OK).length;
    const isExpired = user.dateExpire && new Date(user.dateExpire) < new Date();
    const hasAlert = pendingAccounts > 0 || isExpired;

    return (
        <div
            className="card animate-fade-in"
            style={{
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
                position: "relative",
                background: "var(--bg-card)",
                borderColor: hasAlert ? "rgba(239,68,68,0.3)" : "var(--border)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderRadius: "16px",
                overflow: "hidden",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: "pointer",
                boxShadow: hasAlert ? "0 4px 20px rgba(239,68,68,0.1)" : "0 2px 10px rgba(0,0,0,0.02)",
            }}
            onClick={() => navigate(`/admin/subscriptions/${user.id}`)}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = hasAlert ? "0 8px 30px rgba(239,68,68,0.15)" : "0 8px 30px rgba(0,0,0,0.06)";
                e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = hasAlert ? "0 4px 20px rgba(239,68,68,0.1)" : "0 2px 10px rgba(0,0,0,0.02)";
                e.currentTarget.style.transform = "translateY(0)";
            }}
        >
            <div style={{ position: "absolute", top: -50, right: -50, width: 150, height: 150, background: hasAlert ? "var(--red)" : "var(--accent)", filter: "blur(60px)", opacity: 0.1, pointerEvents: "none" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", flexDirection: "column" }}>
                    <div>
                        <h3 style={{ fontSize: "1.35rem", fontWeight: 900, fontFamily: "Cairo, sans-serif", color: "var(--text-primary)", margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            {user.displayName}
                            {user.isApprovedComp && (
                                <span style={{ background: "var(--accent)", color: "white", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(var(--accent-rgb), 0.4)" }} title="مستخدم معتمد">
                                    <Check size={12} strokeWidth={4} />
                                </span>
                            )}
                        </h3>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            {userAccountsDate && (
                                <span style={{ fontSize: "0.75rem", fontWeight: 700, background: "var(--green-soft)", color: "var(--green)", padding: "0.2rem 0.6rem", borderRadius: "8px", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                    <Calendar size={12} /> أقدم قرية: {fmtDate(userAccountsDate)}
                                </span>
                            )}
                            {pendingAccounts > 0 && (
                                <span style={{ fontSize: "0.75rem", fontWeight: 800, background: "var(--gold-soft)", color: "var(--gold)", padding: "0.2rem 0.6rem", borderRadius: "8px", display: "flex", alignItems: "center", gap: "0.3rem", animation: "pulse-glow 2s infinite" }}>
                                    <AlertCircle size={12} /> {pendingAccounts} قيد الانتظار
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", zIndex: 1 }}>
                    <button
                        className="btn"
                        style={{ width: 40, height: 40, borderRadius: "10px", padding: 0, background: "var(--green-soft)", color: "var(--green)", border: "1px solid rgba(16,185,129,0.2)" }}
                        title="اعتماد كافة حسابات المستخدم"
                        onClick={(e) => { e.stopPropagation(); if (window.confirm(`اعتماد كافة الحسابات لـ ${user.displayName}؟`)) updateGlobalDate.mutate({ userId: user.id }); }}
                        disabled={updateGlobalDate.isPending}
                    >
                        {updateGlobalDate.isPending ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <CheckCircle2 size={18} />}
                    </button>
                    <button
                        className="btn"
                        style={{ width: 40, height: 40, borderRadius: "10px", padding: 0, background: "var(--gold-soft)", color: "var(--gold)", border: "1px solid rgba(245,158,11,0.2)" }}
                        title="إلغاء الاعتماد"
                        onClick={(e) => { e.stopPropagation(); if (window.confirm(`إلغاء الاعتماد لـ ${user.displayName}؟`)) cancelApproval.mutate(user.id); }}
                        disabled={cancelApproval.isPending}
                    >
                        {cancelApproval.isPending ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <XCircle size={18} />}
                    </button>
                    <button
                        className="btn"
                        style={{ width: 40, height: 40, borderRadius: "10px", padding: 0, background: "var(--red-soft)", color: "var(--red)", border: "1px solid rgba(239,68,68,0.2)" }}
                        title="حذف المستخدم نهائياً"
                        onClick={(e) => { e.stopPropagation(); onDelete(user, accounts.length); }}
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                <UserQuotaEditor userId={user.id} currentQuota={user.allowedAccounts} ownerName={user.displayName} accountsLength={accounts.length} />
                <UserExpiryEditor userId={user.id} currentDateExpire={user.dateExpire} userName={user.displayName} />
            </div>
        </div>
    );
}

export default function SubscriptionsAdmin() {
    const { t } = useLanguage();

    const { data: accounts, isLoading: accLoading, refetch: accRefetch } = useGetAllAccounts();
    const { data: adminUsers, isLoading: usersLoading, refetch: usersRefetch } = useGetAllAdminUsers();

    const isLoading = accLoading || usersLoading;

    const refetch = () => {
        accRefetch();
        usersRefetch();
    };

    const [search, setSearch] = useState("");
    const [filterApproval, setFilterApproval] = useState("approved");
    const [filterStatus, setFilterStatus] = useState("all");
    const [userToDelete, setUserToDelete] = useState(null);
    const deleteUser = useDeleteUserAdmin();

    // Map accounts to users
    const usersWithAccounts = useMemo(() => {
        if (!adminUsers) return [];
        return adminUsers.map(user => {
            const userAccs = (accounts || []).filter(a => a.user_id === user.id);
            return {
                ...user,
                accounts: userAccs
            };
        });
    }, [adminUsers, accounts]);

    const searchLower = search.trim().toLowerCase();
    const filtered = useMemo(() => {
        return usersWithAccounts.filter((u) => {
            if (searchLower) {
                const nameMatch = u.displayName.toLowerCase().includes(searchLower) || u.email.toLowerCase().includes(searchLower);
                if (!nameMatch) return false;
            }

            if (filterApproval === "approved") {
                if (!u.isApprovedComp) return false;
            }
            if (filterApproval === "pending") {
                if (u.isApprovedComp && u.accounts.every(a => a.Is_OK)) return false;
            }
            if (filterApproval === "expired") {
                if (!u.dateExpire || new Date(u.dateExpire) >= new Date()) return false;
            }

            return true;
        });
    }, [usersWithAccounts, searchLower, filterApproval]);

    const stats = useMemo(() => {
        const totalAccounts = (accounts || []).length;
        const expiredUsers = usersWithAccounts.filter(u => u.dateExpire && new Date(u.dateExpire) < new Date()).length;
        const hasPending = usersWithAccounts.some(u => !u.isApprovedComp || u.accounts.some(a => !a.Is_OK));
        return { totalAccounts, expiredUsers, hasPending };
    }, [usersWithAccounts, accounts]);

    return (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 className="text-xl font-bold md:text-4xl">إدارة المستخدمين والاشتراكات</h1>
                </div>
                <button className="btn btn-secondary" style={{ gap: "0.5rem" }} onClick={() => refetch()}>
                    <RefreshCw size={15} /> {t("refresh")}
                </button>
            </div>

            {!isLoading && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.875rem" }}>
                    {[
                        { label: t("totalUsers"), value: usersWithAccounts.length, color: "var(--accent)", bg: "var(--accent-soft)", icon: <Users size={18} color="var(--accent)" /> },
                        { label: t("accounts"), value: stats.totalAccounts, color: "var(--purple)", bg: "var(--purple-soft)", icon: <User size={18} color="var(--purple)" /> },
                    ].map((s) => (
                        <div key={s.label} className="card" style={{ padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "0.875rem" }}>
                            <div style={{ width: 40, height: 40, borderRadius: "var(--radius-sm)", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                {s.icon}
                            </div>
                            <div>
                                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 380 }}>
                        <Search size={15} color="var(--text-muted)" style={{ position: "absolute", left: t("dir") === "rtl" ? "unset" : "0.75rem", right: t("dir") === "rtl" ? "0.75rem" : "unset", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                        <input
                            className="form-input"
                            placeholder="ابحث عن مستخدم (الاسم، الإيميل)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            dir={t("dir")}
                            style={{
                                paddingRight: t("dir") === "rtl" ? "2.2rem" : "0.875rem",
                                paddingLeft: t("dir") === "rtl" ? (search ? "2.2rem" : "0.875rem") : "2.2rem"
                            }}
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                style={{ position: "absolute", left: t("dir") === "rtl" ? "0.75rem" : "unset", right: t("dir") === "rtl" ? "unset" : "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                    {[
                        { key: "all", label: t("all") },
                        { key: "approved", label: `حسابات معتمدة` },
                        { key: "pending", label: `حسابات معلقة` },
                        { key: "expired", label: `منتهية الاشتراك` },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setFilterApproval(key)}
                            className="btn"
                            style={{
                                background: filterApproval === key ? (key === "pending" || key === "expired" ? "var(--red)" : key === "approved" ? "var(--green)" : "var(--accent)") : "var(--bg-card)",
                                color: filterApproval === key ? "white" : "var(--text-secondary)",
                                border: `1px solid ${filterApproval === key ? (key === "pending" || key === "expired" ? "var(--red)" : key === "approved" ? "var(--green)" : "var(--accent)") : "var(--border)"}`,
                                fontSize: "0.8rem",
                                animation: key === "pending" && stats.hasPending && filterApproval !== "pending" ? "pulse-glow 2s infinite" : "none",
                            }}
                        >
                            {label}
                        </button>
                    ))}

                </div>
            </div>

            {isLoading && (
                <div className="page-loader">
                    <div className="spinner" style={{ width: 32, height: 32 }} />
                    <p>جاري تحميل المستخدمين والاشتراكات...</p>
                </div>
            )}

            {!isLoading && usersWithAccounts.length === 0 && (
                <div style={{ textAlign: "center", padding: "3rem 2rem", border: "2px dashed var(--border)", borderRadius: "var(--radius-lg)" }}>
                    <Users size={44} color="var(--text-muted)" style={{ margin: "0 auto 1rem", display: "block" }} />
                    <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>لا يوجد مستخدمين مسجلين</h3>
                </div>
            )}

            {!isLoading && usersWithAccounts.length > 0 && filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: "2.5rem 2rem", border: "2px dashed var(--border)", borderRadius: "var(--radius-lg)" }}>
                    <Search size={36} color="var(--text-muted)" style={{ margin: "0 auto 0.75rem", display: "block" }} />
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{t("noResultsFor")} "{search || filterStatus}"</p>
                    <button className="btn btn-ghost" style={{ marginTop: "0.75rem", fontSize: "0.825rem" }} onClick={() => { setSearch(""); setFilterStatus("all"); setFilterApproval("all"); }}>
                        {t("clearFilters")}
                    </button>
                </div>
            )}

            {!isLoading && filtered.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                    {filtered.map((u) => (
                        <UserSubscriptionCard
                            key={u.id}
                            user={u}
                            accounts={u.accounts}
                            onDelete={(user, accCount) => setUserToDelete({ ...user, accCount })}
                        />
                    ))}
                </div>
            )}

            {/* Global Confirmation Modal for Deletion - Using Portal to escape CSS transforms */}
            {userToDelete && createPortal(
                <div className="modal-backdrop" onClick={() => setUserToDelete(null)}>
                    <div
                        className="modal-box"
                        style={{ padding: "2.5rem 2rem", textAlign: "center" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <AlertCircle size={54} color="var(--red)" style={{ margin: "0 auto 1.25rem", display: "block", opacity: 0.9 }} />
                        <h3 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "0.75rem" }}>
                            تأكيد حذف المستخدم نهائياً؟
                        </h3>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "2rem" }}>
                            هل أنت متأكد من رغبتك في حذف <strong>{userToDelete.displayName}</strong>؟ <br />
                            سيتم تنزيل إجراء الحذف على <span style={{ color: "var(--red)", fontWeight: 700 }}>جميع حساباته الـ {userToDelete.accCount}</span> وكافة الاشتراكات المرتبطة به.
                        </p>
                        <div style={{ display: "flex", gap: "1rem" }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setUserToDelete(null)}>
                                {t("cancel")}
                            </button>
                            <button
                                className="btn btn-danger"
                                style={{ flex: 1, padding: "0.75rem" }}
                                disabled={deleteUser.isPending}
                                onClick={() => {
                                    deleteUser.mutate(userToDelete.id, {
                                        onSuccess: () => setUserToDelete(null)
                                    });
                                }}
                            >
                                {deleteUser.isPending ? "جاري الحذف..." : "نعم، حذف المستخدم"}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
