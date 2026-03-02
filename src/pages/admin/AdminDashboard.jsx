import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
    Monitor, CheckCircle2, Clock, Users, Server,
    Hash, ArrowRight, Activity, TrendingUp,
    AlertTriangle, UserCheck, BarChart3
} from "lucide-react";
import { useGetAllEmulators } from "../../hooks/useAdminEmulators";
import { useGetSettings } from "../../hooks/useSettings";
import { useLanguage } from "../../Context/LanguageContext";

// ── بطاقة إحصاء ────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color, bg, isLoading }) {
    return (
        <div className="stat-card" style={{ borderLeft: `3px solid ${color}`, gap: "0" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.375rem" }}>{label}</div>
                    <div style={{ fontSize: "2.25rem", fontWeight: 800, color, lineHeight: 1 }}>
                        {isLoading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : value}
                    </div>
                    {sub && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{sub}</div>}
                </div>
                <div style={{ width: 40, height: 40, borderRadius: "var(--radius-sm)", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={20} color={color} />
                </div>
            </div>
        </div>
    );
}

// ── صف في جدول المحاكيات ─────────────────────────────────────
function EmulatorRow({ em, fmtDate, t }) {
    const isApproved = em.Is_OK === "true";
    const accCount = em.Accounts?.length || 0;

    return (
        <tr style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            {/* # */}
            <td style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
                #{em.id}
            </td>
            {/* المالك */}
            <td style={{ padding: "0.75rem 0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <UserCheck size={14} color="var(--accent)" />
                    </div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{em.ownerName}</span>
                </div>
            </td>
            {/* الحالة */}
            <td style={{ padding: "0.75rem 0.5rem" }}>
                {isApproved
                    ? <span className="badge badge-approved"><CheckCircle2 size={9} /> {t("approved")}</span>
                    : <span className="badge badge-pending"><Clock size={9} /> {t("pending")}</span>}
            </td>
            {/* السيرفر / الفهرس */}
            <td style={{ padding: "0.75rem 0.5rem" }}>
                {isApproved && em.index_server ? (
                    <div style={{ display: "flex", gap: "0.375rem", alignItems: "center" }}>
                        <span style={{ background: "var(--accent-soft)", color: "var(--accent)", fontWeight: 700, fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: 999, display: "flex", alignItems: "center", gap: 3 }}>
                            <Server size={11} /> {em.index_server}
                        </span>
                        <span style={{ background: "var(--gold-soft)", color: "var(--gold)", fontWeight: 700, fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: 999, display: "flex", alignItems: "center", gap: 3 }}>
                            <Hash size={11} /> {em.index_emulators}
                        </span>
                    </div>
                ) : (
                    <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>—</span>
                )}
            </td>
            {/* الحسابات */}
            <td style={{ padding: "0.75rem 0.5rem" }}>
                <span style={{ fontWeight: 700, color: accCount > 0 ? "var(--text-primary)" : "var(--text-muted)", fontSize: "0.875rem" }}>
                    {accCount}
                </span>
            </td>
            {/* تاريخ الإنشاء */}
            <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                {fmtDate(em.created_at, { year: "numeric", month: "short", day: "numeric" })}
            </td>
            {/* آخر اعتماد */}
            <td style={{ padding: "0.75rem 1rem", fontSize: "0.78rem", color: isApproved ? "var(--green)" : "var(--text-muted)" }}>
                {em.Date_OK ? fmtDate(em.Date_OK, { year: "numeric", month: "short", day: "numeric" }) : "—"}
            </td>
        </tr>
    );
}

// ── الصفحة الرئيسية ─────────────────────────────────────────
export default function AdminDashboard() {
    const { data: emulators, isLoading } = useGetAllEmulators();
    const { data: settings } = useGetSettings();
    const { t, fmtDate } = useLanguage();

    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all"); // all | approved | pending

    // ── إحصاءات ─────────────────────────────────────────────
    const total = emulators?.length || 0;
    const approved = emulators?.filter(e => e.Is_OK === "true").length || 0;
    const pending = emulators?.filter(e => e.Is_OK !== "true").length || 0;
    const uniqueUsers = new Set(emulators?.map(e => e.user_id)).size;
    const totalAcc = emulators?.reduce((s, e) => s + (e.Accounts?.length || 0), 0) || 0;

    // توزيع السيرفرات
    const serverMap = useMemo(() => {
        const map = {};
        (emulators || []).filter(e => e.Is_OK === "true" && e.index_server).forEach(e => {
            const s = e.index_server;
            if (!map[s]) map[s] = { count: 0, accounts: 0 };
            map[s].count++;
            map[s].accounts += (e.Accounts?.length || 0);
        });
        return map;
    }, [emulators]);

    const usedServers = Object.keys(serverMap).length;

    // آخر 3 اعتمادات
    const lastApproved = useMemo(() =>
        [...(emulators || [])]
            .filter(e => e.Is_OK === "true" && e.Date_OK)
            .sort((a, b) => new Date(b.Date_OK) - new Date(a.Date_OK))
            .slice(0, 4),
        [emulators]);

    // المحاكيات الأكثر حسابات
    const topByAccounts = useMemo(() =>
        [...(emulators || [])]
            .filter(e => e.Is_OK === "true")
            .sort((a, b) => (b.Accounts?.length || 0) - (a.Accounts?.length || 0))
            .slice(0, 5),
        [emulators]);

    // ── فلترة الجدول ──────────────────────────────────────
    const filtered = useMemo(() => {
        let list = emulators || [];
        if (filterStatus === "approved") list = list.filter(e => e.Is_OK === "true");
        if (filterStatus === "pending") list = list.filter(e => e.Is_OK !== "true");
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(e =>
                String(e.id).includes(q) ||
                e.ownerName?.toLowerCase().includes(q) ||
                String(e.index_server).includes(q)
            );
        }
        return list;
    }, [emulators, filterStatus, search]);

    const stats = [
        { label: t("totalEmulators"), value: total, sub: `${approved} معتمد · ${pending} انتظار`, icon: Monitor, color: "var(--accent)", bg: "var(--accent-soft)" },
        { label: t("approvedEmulators"), value: approved, sub: `${Math.round(approved / (total || 1) * 100)}% من الإجمالي`, icon: CheckCircle2, color: "var(--green)", bg: "var(--green-soft)" },
        { label: t("waitingEmulators"), value: pending, sub: pending > 0 ? "بانتظار المراجعة" : "لا يوجد انتظار", icon: Clock, color: "var(--gold)", bg: "var(--gold-soft)" },
        { label: t("users"), value: uniqueUsers, sub: `${totalAcc} حساب إجمالاً`, icon: Users, color: "#a78bfa", bg: "rgba(167,139,250,0.15)" },
        { label: t("activeServers"), value: usedServers, sub: `${parseInt(settings?.total_servers || 3)} متاح`, icon: Server, color: "var(--orange)", bg: "var(--orange-soft)" },
    ];

    return (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>

            {/* ── Header ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.2rem" }}>{t("overview")}</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{t("gameDashboard")}</p>
                </div>
                <Link to="/admin/emulators" className="btn btn-secondary" style={{ gap: "0.4rem", fontSize: "0.85rem" }}>
                    {t("allEmulators")} <ArrowRight size={14} />
                </Link>
            </div>

            {/* ── Stats ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                {stats.map(s => <StatCard key={s.label} {...s} isLoading={isLoading} />)}
            </div>

            {/* ── شريط السعة الكلية ── */}
            {!isLoading && (
                <div className="card" style={{ padding: "1.25rem 1.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.825rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <Activity size={14} color="var(--accent)" /> استخدام السيرفرات
                        </span>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            {approved} / {Object.keys(serverMap).length * parseInt(settings?.max_per_server || 8)} مقعد
                        </span>
                    </div>

                    {/* شريط لكل سيرفر */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {Object.entries(serverMap).sort(([a], [b]) => +a - +b).map(([srv, info]) => {
                            const cap = parseInt(settings?.max_per_server || 8);
                            const pct = Math.round((info.count / cap) * 100);
                            const bar = pct >= 90 ? "var(--red)" : pct >= 70 ? "var(--gold)" : "var(--green)";
                            return (
                                <div key={srv}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>سيرفر {srv}</span>
                                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{info.count}/{cap} · {info.accounts} حساب</span>
                                    </div>
                                    <div style={{ height: 6, background: "var(--bg-hover)", borderRadius: 999 }}>
                                        <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: bar, borderRadius: 999, transition: "width 0.5s" }} />
                                    </div>
                                </div>
                            );
                        })}
                        {Object.keys(serverMap).length === 0 && (
                            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>لا توجد محاكيات معتمدة بعد.</p>
                        )}
                    </div>
                </div>
            )}

            {/* ── الصف السفلي: آخر اعتمادات + أعلى بالحسابات ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>

                {/* آخر اعتمادات */}
                <div className="card" style={{ padding: "1.25rem 1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "1rem" }}>
                        <TrendingUp size={16} color="var(--green)" />
                        <h2 style={{ font: "700 0.9rem/1 inherit" }}>آخر الاعتمادات</h2>
                    </div>
                    {isLoading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : (
                        lastApproved.length === 0
                            ? <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>لا يوجد.</p>
                            : lastApproved.map(em => (
                                <div key={em.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.625rem 0", borderBottom: "1px solid var(--border)" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--green-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <Monitor size={14} color="var(--green)" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{em.ownerName}</div>
                                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>#{em.id} · سيرفر {em.index_server}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: "0.72rem", color: "var(--green)", fontWeight: 600 }}>
                                        {fmtDate(em.Date_OK, { month: "short", day: "numeric" })}
                                    </div>
                                </div>
                            ))
                    )}
                </div>

                {/* أعلى المحاكيات بعدد الحسابات */}
                <div className="card" style={{ padding: "1.25rem 1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "1rem" }}>
                        <BarChart3 size={16} color="var(--accent)" />
                        <h2 style={{ font: "700 0.9rem/1 inherit" }}>الأكثر حسابات</h2>
                    </div>
                    {isLoading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : (
                        topByAccounts.length === 0
                            ? <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>لا يوجد.</p>
                            : topByAccounts.map((em, idx) => {
                                const maxAcc = topByAccounts[0]?.Accounts?.length || 1;
                                const pct = Math.round(((em.Accounts?.length || 0) / maxAcc) * 100);
                                return (
                                    <div key={em.id} style={{ marginBottom: "0.625rem" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                                            <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                                                <span style={{ color: "var(--text-muted)", marginLeft: 4 }}>#{idx + 1}</span> {em.ownerName}
                                            </span>
                                            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--accent)" }}>{em.Accounts?.length || 0}</span>
                                        </div>
                                        <div style={{ height: 5, background: "var(--bg-hover)", borderRadius: 999 }}>
                                            <div style={{ height: "100%", width: `${pct}%`, background: "var(--accent)", borderRadius: 999 }} />
                                        </div>
                                    </div>
                                );
                            })
                    )}
                </div>
            </div>

            {/* ── جدول كل المحاكيات ── */}
            <div className="card" style={{ padding: "1.5rem", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <Monitor size={16} color="var(--accent)" />
                        <h2 style={{ font: "700 0.95rem/1 inherit" }}>جميع المحاكيات</h2>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 999, padding: "0.15rem 0.5rem" }}>{filtered.length}</span>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {/* فلاتر */}
                        {["all", "approved", "pending"].map(f => (
                            <button key={f} onClick={() => setFilterStatus(f)} className="btn"
                                style={{ fontSize: "0.78rem", padding: "0.3rem 0.75rem", background: filterStatus === f ? "var(--accent)" : "var(--bg-card)", color: filterStatus === f ? "white" : "var(--text-secondary)", border: `1px solid ${filterStatus === f ? "var(--accent)" : "var(--border)"}` }}>
                                {f === "all" ? t("all") : f === "approved" ? t("approved") : t("pending")}
                            </button>
                        ))}
                        {/* بحث */}
                        <input
                            className="form-input"
                            placeholder={`${t("search") || "بحث"}...`}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ padding: "0.3rem 0.75rem", maxWidth: 180, fontSize: "0.8rem" }}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}><div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} /></div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "2px solid var(--border)" }}>
                                    {["#", "المالك", "الحالة", "سيرفر / فهرس", "حسابات", "تاريخ الإنشاء", "آخر اعتماد"].map(h => (
                                        <th key={h} style={{ padding: "0.6rem 0.5rem", textAlign: "start", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>لا توجد نتائج.</td></tr>
                                ) : (
                                    filtered.map(em => <EmulatorRow key={em.id} em={em} fmtDate={fmtDate} t={t} />)
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {!isLoading && pending > 0 && (
                    <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "var(--gold-soft)", border: "1px solid rgba(234,179,8,0.25)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <AlertTriangle size={15} color="var(--gold)" />
                        <span style={{ fontSize: "0.825rem", color: "var(--gold)" }}>
                            لديك <strong>{pending}</strong> محاكي بانتظار الاعتماد.
                        </span>
                        <Link to="/admin/emulators" className="btn btn-ghost" style={{ marginRight: "auto", marginLeft: 0, fontSize: "0.78rem", padding: "0.2rem 0.6rem", color: "var(--gold)" }}>
                            مراجعة →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
