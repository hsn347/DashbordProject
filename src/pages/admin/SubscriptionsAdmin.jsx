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

function UserExpiryEditor({ userId, currentDateExpire }) {
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

    if (!isEditing) {
        const isExpired = currentDateExpire && new Date(currentDateExpire) < new Date();
        return (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: isExpired ? "var(--red-soft)" : "var(--bg-card)", padding: "0.25rem 0.5rem", borderRadius: "var(--radius-sm)", border: `1px solid ${isExpired ? "var(--red)" : "var(--border)"}` }}>
                <span style={{ fontSize: "0.75rem", color: isExpired ? "var(--red)" : "var(--text-muted)", fontWeight: 600 }}>انتهاء:</span>
                <span style={{ fontWeight: 800, color: isExpired ? "var(--red)" : "var(--text-primary)", fontSize: "0.85rem" }}>{currentDateExpire ? currentDateExpire.split("T")[0] : "—"}</span>
                <button
                    onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                    className="btn btn-ghost"
                    style={{ padding: "0.2rem", height: "auto", color: "var(--text-muted)" }}
                    title={t("edit")}
                >
                    <Settings2 size={13} />
                </button>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }} onClick={(e) => e.stopPropagation()}>
            <input
                type="date"
                className="form-input"
                style={{ width: 120, padding: "0.2rem 0.4rem", fontSize: "0.8rem", height: 28 }}
                value={val}
                onChange={(e) => setVal(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") { setIsEditing(false); setVal(currentDateExpire ? currentDateExpire.split("T")[0] : ""); }
                }}
            />
            <button
                onClick={handleSave}
                disabled={updateExpiry.isPending}
                className="btn btn-success"
                style={{ padding: "0.2rem 0.4rem", height: 28 }}
            >
                <Save size={13} />
            </button>
            <button
                onClick={() => { setIsEditing(false); setVal(currentDateExpire ? currentDateExpire.split("T")[0] : ""); }}
                className="btn btn-ghost"
                style={{ padding: "0.2rem 0.4rem", height: 28 }}
            >
                <X size={13} />
            </button>
        </div>
    );
}

function UserQuotaEditor({ userId, currentQuota, ownerName }) {
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

    if (!isEditing) {
        return (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--bg-card)", padding: "0.25rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>{t("quota")}:</span>
                <span style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.85rem" }}>{currentQuota || 0}</span>
                <button
                    onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                    className="btn btn-ghost"
                    style={{ padding: "0.2rem", height: "auto", color: "var(--text-muted)" }}
                    title={t("edit")}
                >
                    <Settings2 size={13} />
                </button>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }} onClick={(e) => e.stopPropagation()}>
            <input
                type="number"
                min="0"
                className="form-input"
                style={{ width: 60, padding: "0.2rem 0.4rem", fontSize: "0.8rem", height: 28 }}
                value={val}
                onChange={(e) => setVal(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") { setIsEditing(false); setVal(String(currentQuota || 0)); }
                }}
            />
            <button
                onClick={handleSave}
                disabled={updateQuota.isPending}
                className="btn btn-success"
                style={{ padding: "0.2rem 0.4rem", height: 28 }}
            >
                <Save size={13} />
            </button>
            <button
                onClick={() => { setIsEditing(false); setVal(String(currentQuota || 0)); }}
                className="btn btn-ghost"
                style={{ padding: "0.2rem 0.4rem", height: 28 }}
            >
                <X size={13} />
            </button>
        </div>
    );
}

function UserSubscriptionCard({ user, accounts, allSubs, onDelete }) {
    const { t, fmtDate } = useLanguage();
    const navigate = useNavigate();
    const updateGlobalDate = useUpdateAllAccountsDate();
    const cancelApproval = useCancelAllAccountsApproval();

    // Find the common approval date for the user's accounts
    const userAccountsDate = useMemo(() => {
        const approved = accounts.filter(a => a.Is_OK && a.Date_OK);
        if (approved.length === 0) return null;
        // Just return the first one as representative
        return approved[0].Date_OK;
    }, [accounts]);

    const pendingAccounts = accounts.filter(a => !a.Is_OK).length;
    const isExpired = user.dateExpire && new Date(user.dateExpire) < new Date();
    const hasAlert = pendingAccounts > 0 || isExpired;

    return (
        <div
            className="card"
            style={{
                overflow: "hidden",
                borderColor: hasAlert ? "rgba(239,68,68,0.25)" : "var(--border)",
                transition: "border-color 0.2s, box-shadow 0.2s, transform 0.15s",
                cursor: "pointer",
            }}
            onClick={() => navigate(`/admin/subscriptions/${user.id}`)}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)";
                e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "";
                e.currentTarget.style.transform = "";
            }}
        >
            <div style={{
                padding: "1.1rem 1.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: "wrap",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: "50%",
                        background: hasAlert ? "var(--red-soft)" : "var(--accent-soft)",
                        border: `2px solid ${hasAlert ? "rgba(239,68,68,0.35)" : "var(--accent)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "1.2rem", fontWeight: 800, color: hasAlert ? "var(--red)" : "var(--accent)",
                        flexShrink: 0,
                    }}>
                        {user.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                            <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text-primary)" }}>
                                {user.displayName}
                            </div>
                            {userAccountsDate && (
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.3rem",
                                    fontSize: "0.7rem",
                                    color: accounts.every(a => a.Is_OK) ? "var(--green)" : "var(--text-muted)",
                                    fontWeight: 700,
                                    background: accounts.every(a => a.Is_OK) ? "var(--green-soft)" : "var(--bg-hover)",
                                    padding: "0.2rem 0.6rem",
                                    borderRadius: "999px",
                                    border: `1px solid ${accounts.every(a => a.Is_OK) ? "rgba(16,185,129,0.2)" : "var(--border)"}`
                                }}>
                                    <Calendar size={12} />
                                    {fmtDate(userAccountsDate)}
                                </div>
                            )}
                            {user.isApprovedComp && (
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.3rem",
                                    fontSize: "0.7rem",
                                    color: "white",
                                    fontWeight: 800,
                                    background: "var(--accent)",
                                    padding: "0.2rem 0.6rem",
                                    borderRadius: "999px",
                                    boxShadow: "0 2px 6px rgba(108, 99, 255, 0.25)"
                                }}>
                                    <Check size={12} strokeWidth={4} />
                                    مستخدم معتمد
                                </div>
                            )}
                            <UserQuotaEditor userId={user.id} currentQuota={user.allowedAccounts} ownerName={user.displayName} />
                            <UserExpiryEditor userId={user.id} currentDateExpire={user.dateExpire} />
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                <User size={12} /> {accounts.length} {t("accounts")}
                            </span>
                            {pendingAccounts > 0 && (
                                <span style={{ fontSize: "0.7rem", color: "var(--gold)", background: "var(--gold-soft)", padding: "0.1rem 0.4rem", borderRadius: "999px", fontWeight: 700 }}>
                                    {pendingAccounts} بإنتظار الاعتماد
                                </span>
                            )}
                            {user.dateExpire && (
                                <span style={{ fontSize: "0.75rem", color: isExpired ? "var(--red)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: isExpired ? 700 : 400 }}>
                                    <Calendar size={12} /> انتهاء: {fmtDate(user.dateExpire)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.625rem",
                    marginLeft: t("dir") === "ltr" ? "auto" : "unset",
                    marginRight: t("dir") === "rtl" ? "auto" : "unset",
                    paddingTop: "0.5rem"
                }}>
                    <div style={{ textAlign: "end", marginLeft: "0.5rem", marginRight: "0.5rem", display: "none", minWidth: "80px" }}>
                        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.1rem" }}>{t("status")}</div>
                    </div>

                    {/* Approve All Button */}
                    <button
                        className="btn"
                        style={{
                            width: 38, height: 38, borderRadius: "var(--radius-sm)", padding: 0,
                            background: "var(--green-soft)", color: "var(--green)",
                            border: "1px solid rgba(16,185,129,0.2)",
                            boxShadow: "0 2px 8px rgba(16,185,129,0.08)"
                        }}
                        title="اعتماد كافة حسابات المستخدم (تأريخ اليوم)"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`هل أنت متأكد من رغبتك في اعتماد كافة حسابات ${user.displayName} بتأريخ اليوم؟`)) {
                                updateGlobalDate.mutate({
                                    userId: user.id,
                                });
                            }
                        }}
                        disabled={updateGlobalDate.isPending || cancelApproval.isPending}
                    >
                        {updateGlobalDate.isPending ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <CheckCircle2 size={18} />}
                    </button>

                    {/* Cancel Approval All Button */}
                    <button
                        className="btn"
                        style={{
                            width: 38, height: 38, borderRadius: "var(--radius-sm)", padding: 0,
                            background: "var(--gold-soft)", color: "var(--gold)",
                            border: "1px solid rgba(245,158,11,0.2)",
                            boxShadow: "0 2px 8px rgba(245,158,11,0.08)"
                        }}
                        title="إلغاء اعتماد كافة حسابات المستخدم"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`هل أنت متأكد من رغبتك في إلغاء اعتماد كافة حسابات ${user.displayName}؟`)) {
                                cancelApproval.mutate(user.id);
                            }
                        }}
                        disabled={cancelApproval.isPending || updateGlobalDate.isPending}
                    >
                        {cancelApproval.isPending ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <XCircle size={18} />}
                    </button>

                    {/* Delete button */}
                    <button
                        className="btn"
                        style={{
                            width: 38, height: 38, borderRadius: "var(--radius-sm)", padding: 0,
                            background: "var(--red-soft)", color: "var(--red)",
                            border: "1px solid rgba(239,68,68,0.2)",
                            boxShadow: "0 2px 8px rgba(239,68,68,0.08)"
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(user, accounts.length);
                        }}
                        disabled={updateGlobalDate.isPending || cancelApproval.isPending}
                    >
                        <Trash2 size={18} />
                    </button>

                    <div style={{ width: 38, height: 38, borderRadius: "var(--radius-sm)", background: "var(--bg-hover)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", cursor: "pointer" }}>
                        <ExternalLink size={16} />
                    </div>
                </div>
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
    const [filterApproval, setFilterApproval] = useState("all");
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
        return { totalAccounts, expiredUsers };
    }, [usersWithAccounts, accounts]);

    return (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem" }}>إدارة المستخدمين والاشتراكات</h1>
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
