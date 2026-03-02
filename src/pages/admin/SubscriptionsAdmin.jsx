import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    CreditCard, CheckCircle2, XCircle, ChevronDown, ChevronUp,
    Monitor, User, Search, X, Users, Server, Hash,
    TrendingUp, AlertCircle, RefreshCw, ExternalLink
} from "lucide-react";
import { useGetSubscriptions, useToggleSubscription } from "../../hooks/useSubscriptions";
import { useGetAllEmulators } from "../../hooks/useAdminEmulators";
import { useLanguage } from "../../Context/LanguageContext";

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth(); // 0-indexed

function getMonthKey(year, monthIndex) {
    return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

// ─── بطاقة شهر واحد ────────────────────────────────────────────────────────
function MonthCell({ month, monthKey, paid, onToggle, isPending }) {
    return (
        <button
            onClick={() => onToggle(monthKey, paid)}
            disabled={isPending}
            title={paid === true ? "مدفوع — انقر للتغيير" : paid === false ? "غير مدفوع — انقر للتغيير" : "غير مسجل — انقر لتسجيل دفع"}
            style={{
                padding: "0.6rem 0.4rem",
                borderRadius: "var(--radius-sm)",
                border: `1.5px solid ${paid === true ? "var(--green)" : paid === false ? "rgba(239,68,68,0.45)" : "var(--border)"}`,
                background: paid === true ? "var(--green-soft)" : paid === false ? "var(--red-soft)" : "var(--bg-surface)",
                cursor: isPending ? "not-allowed" : "pointer",
                transition: "all 0.18s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.3rem",
                opacity: isPending ? 0.6 : 1,
            }}
        >
            {paid === true
                ? <CheckCircle2 size={16} color="var(--green)" />
                : paid === false
                    ? <XCircle size={16} color="var(--red)" />
                    : <CreditCard size={16} color="var(--text-muted)" />
            }
            <span style={{
                fontSize: "0.72rem",
                fontWeight: 600,
                color: paid === true ? "var(--green)" : paid === false ? "var(--red)" : "var(--text-muted)",
            }}>
                {month}
            </span>
        </button>
    );
}

// ─── بطاقة محاكي واحد ──────────────────────────────────────────────────────
function EmulatorSubCard({ emulator, allSubs }) {
    const { t } = useLanguage();
    const MONTHS = t("months");
    const [year, setYear] = useState(CURRENT_YEAR);
    const toggle = useToggleSubscription();

    const emSubs = allSubs.filter((s) => s.emulator_id === emulator.id);

    const getPaid = (key) => {
        const sub = emSubs.find((s) => s.month === key);
        return sub ? sub.is_paid : null;
    };

    const handleToggle = (monthKey, currentPaid) => {
        toggle.mutate({
            emulatorId: emulator.id,
            month: monthKey,
            currentPaid,
            userId: emulator.user_id,
        });
    };

    const paidCount = MONTHS.filter((_, i) => getPaid(getMonthKey(year, i)) === true).length;
    const unpaidCount = MONTHS.filter((_, i) => getPaid(getMonthKey(year, i)) === false).length;

    return (
        <div style={{
            background: "var(--bg-base)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
        }}>
            {/* Header */}
            <div style={{
                padding: "0.875rem 1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "0.75rem",
                borderBottom: "1px solid var(--border)",
                background: "var(--bg-surface)",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                    <div style={{
                        width: 36, height: 36,
                        borderRadius: "var(--radius-sm)",
                        background: emulator.Is_OK === "true" ? "var(--green-soft)" : "var(--bg-surface)",
                        border: `1.5px solid ${emulator.Is_OK === "true" ? "var(--green)" : "var(--border)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <Monitor size={16} color={emulator.Is_OK === "true" ? "var(--green)" : "var(--text-muted)"} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            {t("emulator")} #{emulator.id}
                            <span style={{
                                fontSize: "0.65rem", fontWeight: 700,
                                padding: "0.1rem 0.45rem", borderRadius: "999px",
                                background: emulator.Is_OK === "true" ? "var(--green-soft)" : "var(--red-soft)",
                                color: emulator.Is_OK === "true" ? "var(--green)" : "var(--red)",
                                border: `1px solid ${emulator.Is_OK === "true" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                            }}>
                                {emulator.Is_OK === "true" ? `✓ ${t("approved")}` : `✗ ${t("pending")}`}
                            </span>
                            {emulator.Date_OK && (
                                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 500 }}>
                                    {new Date(emulator.Date_OK).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                </span>
                            )}
                        </div>
                        {emulator.index_server && (
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", gap: "0.4rem" }}>
                                <span style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                                    <Server size={10} /> {t("indexServer")} {emulator.index_server}
                                </span>
                                <span style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                                    <Hash size={10} /> {t("indexEmulator")} {emulator.index_emulators}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                    {/* Paid / Unpaid badges */}
                    {paidCount > 0 && (
                        <span style={{
                            fontSize: "0.72rem", fontWeight: 700,
                            padding: "0.2rem 0.6rem", borderRadius: "999px",
                            background: "var(--green-soft)", color: "var(--green)",
                            border: "1px solid rgba(16,185,129,0.3)"
                        }}>
                            ✓ {paidCount} {t("paid")}
                        </span>
                    )}
                    {unpaidCount > 0 && (
                        <span style={{
                            fontSize: "0.72rem", fontWeight: 700,
                            padding: "0.2rem 0.6rem", borderRadius: "999px",
                            background: "var(--red-soft)", color: "var(--red)",
                            border: "1px solid rgba(239,68,68,0.3)"
                        }}>
                            ✗ {unpaidCount} {t("unpaid")}
                        </span>
                    )}

                    {/* Year nav */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <button className="btn btn-ghost" style={{ padding: "0.2rem 0.45rem", fontSize: "0.8rem" }} onClick={() => setYear(y => y - 1)}>‹</button>
                        <span style={{ fontWeight: 700, minWidth: 40, textAlign: "center", fontSize: "0.8rem" }}>{year}</span>
                        <button className="btn btn-ghost" style={{ padding: "0.2rem 0.45rem", fontSize: "0.8rem" }} onClick={() => setYear(y => y + 1)}>›</button>
                    </div>
                </div>
            </div>

            {/* Months grid */}
            <div className="months-grid">
                {MONTHS.map((month, i) => {
                    const key = getMonthKey(year, i);
                    const paid = getPaid(key);
                    // Highlight current month
                    const isCurrent = year === CURRENT_YEAR && i === CURRENT_MONTH;
                    return (
                        <div key={key} style={{ position: "relative" }}>
                            {isCurrent && (
                                <div style={{
                                    position: "absolute", top: -4, left: "50%", transform: "translateX(-50%)",
                                    width: 6, height: 6, borderRadius: "50%",
                                    background: "var(--accent)", zIndex: 1,
                                }} />
                            )}
                            <MonthCell
                                month={month}
                                monthKey={key}
                                paid={paid}
                                onToggle={handleToggle}
                                isPending={toggle.isPending}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── بطاقة مستخدم كاملة ────────────────────────────────────────────────────
function UserSubscriptionCard({ userId, ownerName, emulators, allSubs }) {
    const { t } = useLanguage();
    const navigate = useNavigate();

    const totalPaid = useMemo(() => {
        return emulators.reduce((acc, em) => {
            return acc + allSubs.filter((s) => s.emulator_id === em.id && s.is_paid === true).length;
        }, 0);
    }, [emulators, allSubs]);

    const totalUnpaid = useMemo(() => {
        return emulators.reduce((acc, em) => {
            return acc + allSubs.filter((s) => s.emulator_id === em.id && s.is_paid === false).length;
        }, 0);
    }, [emulators, allSubs]);

    const hasAlert = totalUnpaid > 0;

    return (
        <div
            className="card"
            style={{
                overflow: "hidden",
                borderColor: hasAlert ? "rgba(239,68,68,0.25)" : "var(--border)",
                transition: "border-color 0.2s, box-shadow 0.2s, transform 0.15s",
                cursor: "pointer",
            }}
            onClick={() => navigate(`/admin/subscriptions/${userId}`)}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)";
                e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "";
                e.currentTarget.style.transform = "";
            }}
        >
            {/* ── User Header Row ── */}
            <div style={{
                padding: "1.1rem 1.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: "wrap",
            }}>
                {/* Left: avatar + name */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: "50%",
                        background: hasAlert ? "var(--red-soft)" : "var(--accent-soft)",
                        border: `2px solid ${hasAlert ? "rgba(239,68,68,0.35)" : "var(--accent)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "1.2rem", fontWeight: 800, color: hasAlert ? "var(--red)" : "var(--accent)",
                        flexShrink: 0,
                    }}>
                        {ownerName?.charAt(0).toUpperCase() || "？"}
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text-primary)", marginBottom: "0.15rem" }}>
                            {ownerName}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                <Monitor size={12} /> {emulators.length} {t("emulators")}
                            </span>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                <CreditCard size={12} /> {totalPaid + totalUnpaid} {t("records")}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right: Summary badges */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ textAlign: "end", marginLeft: "0.75rem" }}>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.1rem" }}>{t("status")}</div>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                            {totalPaid > 0 && (
                                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--green)" }}>{totalPaid} {t("paidAbbr")}</span>
                            )}
                            {totalUnpaid > 0 ? (
                                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--red)" }}>{totalUnpaid} {t("unpaidAbbr")}</span>
                            ) : (
                                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--green)" }}>{t("allPaid")}</span>
                            )}
                        </div>
                    </div>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                        <ExternalLink size={15} />
                    </div>
                </div>
            </div>

            {/* ── Visual Progress Bar ── */}
            <div style={{ height: 3, width: "100%", background: "var(--border)", display: "flex" }}>
                <div style={{ height: "100%", background: "var(--green)", width: `${(totalPaid / (totalPaid + totalUnpaid || 1)) * 100}%`, transition: "width 0.3s" }} />
                <div style={{ height: "100%", background: "var(--red)", width: `${(totalUnpaid / (totalPaid + totalUnpaid || 1)) * 100}%`, transition: "width 0.3s" }} />
            </div>
        </div>
    );
}


// ─── الصفحة الرئيسية ────────────────────────────────────────────────────────
export default function SubscriptionsAdmin() {
    const navigate = useNavigate();
    const { t, refetch: langRefetch } = useLanguage();

    const { data: subscriptions, isLoading: subLoading, refetch: subRefetch } = useGetSubscriptions();
    const { data: emulators, isLoading: emLoading, refetch: emRefetch } = useGetAllEmulators();

    const refetch = () => {
        subRefetch();
        emRefetch();
    };

    const isLoading = subLoading || emLoading;

    // ── فلاتر ──
    const [search, setSearch] = useState("");
    const [filterApproval, setFilterApproval] = useState("all"); // all, approved, pending
    const [filterStatus, setFilterStatus] = useState("all"); // all, has_unpaid, all_paid, no_subs

    // ── تجميع المحاكيات حسب المستخدم ──
    const usersMap = useMemo(() => {
        const map = new Map();
        (emulators || []).forEach((em) => {
            if (!em.user_id) return;
            if (!map.has(em.user_id)) {
                map.set(em.user_id, {
                    userId: em.user_id,
                    ownerName: em.ownerName || em.user_id.slice(0, 8),
                    emulators: [],
                });
            }
            map.get(em.user_id).emulators.push(em);
        });
        return [...map.values()];
    }, [emulators]);

    // ── البحث ──
    const searchLower = search.trim().toLowerCase();
    const allSubs = subscriptions || [];

    const filtered = useMemo(() => {
        return usersMap.filter((u) => {
            // فلترة البحث: بالاسم أو بالحسابات
            if (searchLower) {
                const nameMatch = u.ownerName.toLowerCase().includes(searchLower);
                const accountMatch = allSubs.some((s) =>
                    u.emulators.some((em) => em.id === s.emulator_id) &&
                    JSON.stringify(s).toLowerCase().includes(searchLower)
                );
                if (!nameMatch && !accountMatch) return false;
            }

            // فلترة الاعتماد
            if (filterApproval === "approved") {
                if (!u.emulators.some((em) => em.Is_OK === "true")) return false;
            }
            if (filterApproval === "pending") {
                if (!u.emulators.some((em) => em.Is_OK !== "true")) return false;
            }

            // فلترة الحالة
            if (filterStatus === "has_unpaid") {
                const unpaid = allSubs.filter((s) =>
                    u.emulators.some((em) => em.id === s.emulator_id) && s.is_paid === false
                );
                if (unpaid.length === 0) return false;
            }
            if (filterStatus === "all_paid") {
                const unpaid = allSubs.filter((s) =>
                    u.emulators.some((em) => em.id === s.emulator_id) && s.is_paid === false
                );
                const hasSubs = allSubs.some((s) =>
                    u.emulators.some((em) => em.id === s.emulator_id)
                );
                if (unpaid.length > 0 || !hasSubs) return false;
            }
            if (filterStatus === "no_subs") {
                const hasSubs = allSubs.some((s) =>
                    u.emulators.some((em) => em.id === s.emulator_id)
                );
                if (hasSubs) return false;
            }

            return true;
        });
    }, [usersMap, allSubs, searchLower, filterApproval, filterStatus]);

    // ── إحصائيات عامة ──
    const stats = useMemo(() => {
        const totalPaid = allSubs.filter((s) => s.is_paid === true).length;
        const totalUnpaid = allSubs.filter((s) => s.is_paid === false).length;
        const usersWithUnpaid = usersMap.filter((u) =>
            allSubs.some((s) => u.emulators.some((em) => em.id === s.emulator_id) && !s.is_paid)
        ).length;
        return { totalPaid, totalUnpaid, usersWithUnpaid };
    }, [allSubs, usersMap]);

    return (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {/* ── Header ── */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem" }}>{t("الاشتراك الشهري")}</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                        {t("followUpPayments")} · {usersMap.length} {t("usersAbbr")} · {(emulators || []).filter(e => e.Is_OK === "true").length} {t("approvedEmulatorsAbbr")}
                    </p>
                </div>
                <button className="btn btn-secondary" style={{ gap: "0.5rem" }} onClick={() => refetch()}>
                    <RefreshCw size={15} /> {t("refresh")}
                </button>
            </div>

            {/* ── Stats cards ── */}
            {!isLoading && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.875rem" }}>
                    {[
                        { label: t("paidMonths"), value: stats.totalPaid, color: "var(--green)", bg: "var(--green-soft)", icon: <CheckCircle2 size={18} color="var(--green)" /> },
                        { label: t("unpaidMonths"), value: stats.totalUnpaid, color: "var(--red)", bg: "var(--red-soft)", icon: <XCircle size={18} color="var(--red)" /> },
                        { label: t("usersWithLatePayments"), value: stats.usersWithUnpaid, color: "var(--gold)", bg: "var(--gold-soft)", icon: <AlertCircle size={18} color="var(--gold)" /> },
                        { label: t("totalUsers"), value: usersMap.length, color: "var(--accent)", bg: "var(--accent-soft)", icon: <Users size={18} color="var(--accent)" /> },
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

            {/* ── Search + Filters ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {/* Row 1: Search */}
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 380 }}>
                        <Search size={15} color="var(--text-muted)" style={{ position: "absolute", left: t("dir") === "rtl" ? "unset" : "0.75rem", right: t("dir") === "rtl" ? "0.75rem" : "unset", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                        <input
                            className="form-input"
                            placeholder={t("searchPlaceholderAdmin")}
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

                {/* Row 2: Approval filter + Status filter */}
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                    {/* Divider label */}
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>{t("approval")}:</span>
                    {[
                        { key: "approved", label: `✓ ${t("approvedOnly")}` },
                        { key: "pending", label: `✗ ${t("pendingOnly")}` },
                        { key: "all", label: t("all") },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setFilterApproval(key)}
                            className="btn"
                            style={{
                                background: filterApproval === key ? (key === "pending" ? "var(--red)" : key === "approved" ? "var(--green)" : "var(--accent)") : "var(--bg-card)",
                                color: filterApproval === key ? "white" : "var(--text-secondary)",
                                border: `1px solid ${filterApproval === key ? (key === "pending" ? "var(--red)" : key === "approved" ? "var(--green)" : "var(--accent)") : "var(--border)"}`,
                                fontSize: "0.8rem",
                            }}
                        >
                            {label}
                        </button>
                    ))}

                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, margin: "0 0.25rem" }}>|</span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>{t("payment")}:</span>

                    {/* Status filter */}
                    {[
                        { key: "all", label: `${t("all")} (${usersMap.length})` },
                        { key: "has_unpaid", label: `${t("unpaidAbbr")} (${stats.usersWithUnpaid})` },
                        { key: "all_paid", label: t("allPaid") },
                        { key: "no_subs", label: t("noRecords") },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setFilterStatus(key)}
                            className="btn"
                            style={{
                                background: filterStatus === key ? "var(--accent)" : "var(--bg-card)",
                                color: filterStatus === key ? "white" : "var(--text-secondary)",
                                border: `1px solid ${filterStatus === key ? "var(--accent)" : "var(--border)"}`,
                                fontSize: "0.8rem",
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>


            {/* ── Loading ── */}
            {isLoading && (
                <div className="page-loader">
                    <div className="spinner" style={{ width: 32, height: 32 }} />
                    <p>{t("loadingSubs")}</p>
                </div>
            )}

            {/* ── Empty state ── */}
            {!isLoading && usersMap.length === 0 && (
                <div style={{ textAlign: "center", padding: "3rem 2rem", border: "2px dashed var(--border)", borderRadius: "var(--radius-lg)" }}>
                    <CreditCard size={44} color="var(--text-muted)" style={{ margin: "0 auto 1rem", display: "block" }} />
                    <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>{t("noApprovedEmulators")}</h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{t("approveFirstToShow")}</p>
                </div>
            )}

            {/* ── No search results ── */}
            {!isLoading && usersMap.length > 0 && filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: "2.5rem 2rem", border: "2px dashed var(--border)", borderRadius: "var(--radius-lg)" }}>
                    <Search size={36} color="var(--text-muted)" style={{ margin: "0 auto 0.75rem", display: "block" }} />
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{t("noResultsFor")} "{search || filterStatus}"</p>
                    <button className="btn btn-ghost" style={{ marginTop: "0.75rem", fontSize: "0.825rem" }} onClick={() => { setSearch(""); setFilterStatus("all"); }}>
                        {t("clearFilters")}
                    </button>
                </div>
            )}

            {/* ── Users list ── */}
            {!isLoading && filtered.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                    {filtered.map((u) => (
                        <UserSubscriptionCard
                            key={u.userId}
                            userId={u.userId}
                            ownerName={u.ownerName}
                            emulators={u.emulators}
                            allSubs={allSubs}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
