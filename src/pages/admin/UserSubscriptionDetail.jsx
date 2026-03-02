import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowRight, Monitor, CheckCircle2, XCircle, CreditCard,
    Server, Hash, AlertCircle, User, RefreshCw, ChevronLeft, ChevronRight,
    TrendingUp, Calendar,
} from "lucide-react";
import { useGetSubscriptions, useToggleSubscription } from "../../hooks/useSubscriptions";
import { useGetAllEmulators } from "../../hooks/useAdminEmulators";
import { useLanguage } from "../../Context/LanguageContext";

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth(); // 0-indexed

function getMonthKey(year, monthIndex) {
    return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

// ── خلية شهر واحد ────────────────────────────────────────────────────────────
function MonthCell({ month, monthKey, paid, onToggle, isPending, isCurrent }) {
    const isNull = paid === null || paid === undefined;
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

// ── بطاقة محاكي واحد ─────────────────────────────────────────────────────────
function EmulatorCard({ emulator, allSubs }) {
    const { t, fmtDate } = useLanguage();
    const MONTHS = t("months");
    const [year, setYear] = useState(CURRENT_YEAR);
    const toggle = useToggleSubscription();

    const emSubs = allSubs.filter((s) => s.emulator_id === emulator.id);

    const getPaid = (key) => {
        const sub = emSubs.find((s) => s.month === key);
        return sub ? sub.is_paid : null;
    };

    const handleToggle = (monthKey, currentPaid) => {
        const sub = emSubs.find((s) => s.month === monthKey);
        toggle.mutate({
            id: sub?.id,
            emulatorId: emulator.id,
            month: monthKey,
            currentPaid,
        });
    };

    const paidCount = MONTHS.filter((_, i) => getPaid(getMonthKey(year, i)) === true).length;
    const unpaidCount = MONTHS.filter((_, i) => getPaid(getMonthKey(year, i)) === false).length;
    const isApproved = emulator.Is_OK === "true";

    return (
        <div style={{
            background: "var(--bg-base)",
            border: `1px solid ${isApproved ? "rgba(16,185,129,0.2)" : "var(--border)"}`,
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
        }}>
            {/* ── Header المحاكي ── */}
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
                {/* معلومات المحاكي */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                    <div style={{
                        width: 38, height: 38,
                        borderRadius: "var(--radius-sm)",
                        background: isApproved ? "var(--green-soft)" : "var(--bg-surface)",
                        border: `1.5px solid ${isApproved ? "var(--green)" : "var(--border)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                    }}>
                        <Monitor size={16} color={isApproved ? "var(--green)" : "var(--text-muted)"} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
                            {t("emulator")} #{emulator.id}
                            <span style={{
                                fontSize: "0.62rem", fontWeight: 700,
                                padding: "0.1rem 0.4rem", borderRadius: "999px",
                                background: isApproved ? "var(--green-soft)" : "var(--red-soft)",
                                color: isApproved ? "var(--green)" : "var(--red)",
                                border: `1px solid ${isApproved ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                            }}>
                                {isApproved ? `✓ ${t("approved")}` : `✗ ${t("pending")}`}
                            </span>
                            {emulator.Date_OK && (
                                <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontWeight: 500 }}>
                                    {fmtDate(emulator.Date_OK)}
                                </span>
                            )}
                        </div>
                        {emulator.index_server && (
                            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "flex", gap: "0.4rem", marginTop: "0.1rem" }}>
                                <span style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                                    <Server size={9} /> {t("indexServer")} {emulator.index_server}
                                </span>
                                <span style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                                    <Hash size={9} /> {t("indexEmulator")} {emulator.index_emulators}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Badges + Year Nav */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    {paidCount > 0 && (
                        <span style={{
                            fontSize: "0.7rem", fontWeight: 700,
                            padding: "0.2rem 0.55rem", borderRadius: "999px",
                            background: "var(--green-soft)", color: "var(--green)",
                            border: "1px solid rgba(16,185,129,0.3)"
                        }}>✓ {paidCount}</span>
                    )}
                    {unpaidCount > 0 && (
                        <span style={{
                            fontSize: "0.7rem", fontWeight: 700,
                            padding: "0.2rem 0.55rem", borderRadius: "999px",
                            background: "var(--red-soft)", color: "var(--red)",
                            border: "1px solid rgba(239,68,68,0.3)"
                        }}>✗ {unpaidCount}</span>
                    )}
                    {/* Year Nav */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.2rem", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "0.1rem 0.2rem" }}>
                        <button
                            className="btn btn-ghost"
                            style={{ padding: "0.2rem 0.4rem", fontSize: "0.85rem", minWidth: 28 }}
                            onClick={() => setYear(y => y - 1)}
                        >‹</button>
                        <span style={{ fontWeight: 700, minWidth: 38, textAlign: "center", fontSize: "0.8rem" }}>{year}</span>
                        <button
                            className="btn btn-ghost"
                            style={{ padding: "0.2rem 0.4rem", fontSize: "0.85rem", minWidth: 28 }}
                            onClick={() => setYear(y => y + 1)}
                        >›</button>
                    </div>
                </div>
            </div>

            {/* ── شبكة الأشهر ── */}
            <div className="months-grid">
                {MONTHS.map((month, i) => {
                    const key = getMonthKey(year, i);
                    const paid = getPaid(key);
                    const isCurrent = year === CURRENT_YEAR && i === CURRENT_MONTH;
                    return (
                        <MonthCell
                            key={key}
                            month={month}
                            monthKey={key}
                            paid={paid}
                            onToggle={handleToggle}
                            isPending={toggle.isPending}
                            isCurrent={isCurrent}
                        />
                    );
                })}
            </div>
        </div>
    );
}

// ── الصفحة الرئيسية ───────────────────────────────────────────────────────────
export default function UserSubscriptionDetail() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { t, fmtDate } = useLanguage();

    const { data: subscriptions, isLoading: subLoading, refetch } = useGetSubscriptions();
    const { data: emulators, isLoading: emLoading } = useGetAllEmulators();

    const isLoading = subLoading || emLoading;

    // ── بيانات المستخدم ──
    const userEmulators = useMemo(
        () => (emulators || []).filter((e) => e.user_id === userId),
        [emulators, userId]
    );

    const ownerName = userEmulators[0]?.ownerName || userId?.slice(0, 8) || t("user");

    const allSubs = subscriptions || [];
    const userEmIds = new Set(userEmulators.map((e) => e.id));
    const userSubs = allSubs.filter((s) => userEmIds.has(s.emulator_id));

    // ── إحصائيات ──
    const stats = useMemo(() => {
        const paid = userSubs.filter((s) => s.is_paid === true).length;
        const unpaid = userSubs.filter((s) => s.is_paid === false).length;
        const approved = userEmulators.filter((e) => e.Is_OK === "true").length;
        return { paid, unpaid, approved, total: userEmulators.length };
    }, [userSubs, userEmulators]);

    const approvedEms = useMemo(
        () => userEmulators.filter((e) => e.Is_OK === "true"),
        [userEmulators]
    );
    const pendingEms = useMemo(
        () => userEmulators.filter((e) => e.Is_OK !== "true"),
        [userEmulators]
    );

    // ── حالة loading ──
    if (isLoading) {
        return (
            <div className="page-loader">
                <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
                <p>{t("loading")}</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem", paddingBottom: "2rem" }}>

            {/* ── شريط العودة ── */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                    className="btn btn-ghost"
                    style={{ gap: "0.35rem", padding: "0.375rem 0.5rem" }}
                    onClick={() => navigate("/admin/subscriptions")}
                >
                    <ArrowRight size={16} />
                    <span>{t("subscriptions")}</span>
                </button>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>/ {ownerName}</span>
            </div>

            {/* ── Header المستخدم ── */}
            <div style={{
                background: "var(--bg-card)",
                border: stats.unpaid > 0 ? "1px solid rgba(239,68,68,0.25)" : "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "1.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1rem",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    {/* Avatar */}
                    <div style={{
                        width: 56, height: 56,
                        borderRadius: "50%",
                        background: stats.unpaid > 0 ? "var(--red-soft)" : "var(--accent-soft)",
                        border: `2.5px solid ${stats.unpaid > 0 ? "rgba(239,68,68,0.4)" : "var(--accent)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "1.4rem", fontWeight: 800,
                        color: stats.unpaid > 0 ? "var(--red)" : "var(--accent)",
                        flexShrink: 0,
                    }}>
                        {ownerName?.charAt(0)?.toUpperCase() || "？"}
                    </div>
                    <div>
                        <h1 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.2rem" }}>{ownerName}</h1>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                <Monitor size={11} /> {stats.total} {t("emulator")}
                            </span>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                <CheckCircle2 size={11} color="var(--green)" /> {stats.approved} {t("approved")}
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    className="btn btn-secondary"
                    style={{ gap: "0.4rem" }}
                    onClick={() => refetch()}
                >
                    <RefreshCw size={14} /> {t("refresh")}
                </button>
            </div>

            {/* ── بطاقات الإحصاء ── */}
            <div className="stats-grid">
                {[
                    { label: t("paidMonths"), value: stats.paid, color: "var(--green)", bg: "var(--green-soft)", icon: <CheckCircle2 size={17} color="var(--green)" /> },
                    { label: t("unpaidMonths"), value: stats.unpaid, color: "var(--red)", bg: "var(--red-soft)", icon: <XCircle size={17} color="var(--red)" /> },
                    { label: t("emulators"), value: stats.total, color: "var(--accent)", bg: "var(--accent-soft)", icon: <Monitor size={17} color="var(--accent)" /> },
                    { label: t("approved"), value: stats.approved, color: "var(--green)", bg: "var(--green-soft)", icon: <TrendingUp size={17} color="var(--green)" /> },
                ].map((s) => (
                    <div key={s.label} className="card" style={{ padding: "0.875rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ width: 36, height: 36, borderRadius: "var(--radius-sm)", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {s.icon}
                        </div>
                        <div>
                            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── المحاكيات المعتمدة ── */}
            {approvedEms.length > 0 && (
                <section>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                        <CheckCircle2 size={15} color="var(--green)" />
                        <h2 style={{ fontSize: "0.95rem", fontWeight: 700 }}>{t("approvedEmulatorsSection")}</h2>
                        <span style={{
                            fontSize: "0.7rem", fontWeight: 700,
                            padding: "0.1rem 0.5rem", borderRadius: "999px",
                            background: "var(--green-soft)", color: "var(--green)",
                        }}>{approvedEms.length}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {approvedEms.map((em) => (
                            <EmulatorCard key={em.id} emulator={em} allSubs={allSubs} />
                        ))}
                    </div>
                </section>
            )}

            {/* ── المحاكيات المعلقة ── */}
            {pendingEms.length > 0 && (
                <section>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                        <AlertCircle size={15} color="var(--gold)" />
                        <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--gold)" }}>{t("pendingEmulatorsSection")}</h2>
                        <span style={{
                            fontSize: "0.7rem", fontWeight: 700,
                            padding: "0.1rem 0.5rem", borderRadius: "999px",
                            background: "var(--gold-soft)", color: "var(--gold)",
                        }}>{pendingEms.length}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                        {pendingEms.map((em) => (
                            <div key={em.id} style={{
                                background: "var(--bg-base)",
                                border: "1px solid rgba(245,158,11,0.2)",
                                borderRadius: "var(--radius-md)",
                                padding: "0.875rem 1rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.75rem",
                            }}>
                                <div style={{
                                    width: 36, height: 36,
                                    borderRadius: "var(--radius-sm)",
                                    background: "var(--gold-soft)",
                                    border: "1.5px solid rgba(245,158,11,0.35)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0,
                                }}>
                                    <Monitor size={16} color="var(--gold)" />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: "0.875rem" }}>{t("emulator")} #{em.id}</div>
                                    <div style={{ fontSize: "0.7rem", color: "var(--gold)" }}>{t("awaitingApproval")}</div>
                                    {em.Date_OK && (
                                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                                            {t("lastEdit")} {fmtDate(em.Date_OK)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── حالة فارغة ── */}
            {userEmulators.length === 0 && (
                <div style={{ textAlign: "center", padding: "3rem 1rem", border: "2px dashed var(--border)", borderRadius: "var(--radius-lg)" }}>
                    <Monitor size={42} color="var(--text-muted)" style={{ margin: "0 auto 0.75rem", display: "block" }} />
                    <h3 style={{ fontWeight: 700, marginBottom: "0.4rem" }}>{t("noEmulators")}</h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{t("noEmulatorsUser")}</p>
                </div>
            )}
        </div>
    );
}
