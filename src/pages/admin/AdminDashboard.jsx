import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
    User as UserIcon, CheckCircle2, Clock, Users, Server,
    Hash, ArrowRight, Activity, TrendingUp,
    AlertTriangle, UserCheck, BarChart3, Mail
} from "lucide-react";
import { useGetAllAccounts } from "../../hooks/useAdminAccounts";
import { useGetSettings } from "../../hooks/useSettings";
import { useLanguage } from "../../Context/LanguageContext";

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

function AccountRow({ acc, fmtDate, t }) {
    const isApproved = acc.Is_OK;

    return (
        <tr style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <td style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
                #{acc.id}
            </td>
            <td style={{ padding: "0.75rem 0.5rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Mail size={12}/> {acc.Email}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <UserCheck size={10} color="var(--accent)" /> {acc.ownerName}
                    </span>
                </div>
            </td>
            <td style={{ padding: "0.75rem 0.5rem" }}>
                {isApproved
                    ? <span className="badge badge-approved"><CheckCircle2 size={9} /> {t("approved")}</span>
                    : <span className="badge badge-pending"><Clock size={9} /> {t("pending")}</span>}
            </td>
            <td style={{ padding: "0.75rem 0.5rem" }}>
                {isApproved && acc.index_server ? (
                    <div style={{ display: "flex", gap: "0.375rem", alignItems: "center" }}>
                        <span style={{ background: "var(--accent-soft)", color: "var(--accent)", fontWeight: 700, fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: 999, display: "flex", alignItems: "center", gap: 3 }}>
                            <Server size={11} /> {acc.index_server}
                        </span>
                        <span style={{ background: "var(--gold-soft)", color: "var(--gold)", fontWeight: 700, fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: 999, display: "flex", alignItems: "center", gap: 3 }}>
                            <Hash size={11} /> {acc.index_emulators}
                        </span>
                    </div>
                ) : (
                    <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>—</span>
                )}
            </td>
            <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                {fmtDate(acc.created_at, { year: "numeric", month: "short", day: "numeric" })}
            </td>
            <td style={{ padding: "0.75rem 1rem", fontSize: "0.78rem", color: isApproved ? "var(--green)" : "var(--text-muted)" }}>
                {acc.Date_OK ? fmtDate(acc.Date_OK, { year: "numeric", month: "short", day: "numeric" }) : "—"}
            </td>
        </tr>
    );
}

export default function AdminDashboard() {
    const { data: accounts, isLoading } = useGetAllAccounts();
    const { data: settings } = useGetSettings();
    const { t, fmtDate } = useLanguage();

    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    const total = accounts?.length || 0;
    const approved = accounts?.filter(a => a.Is_OK).length || 0;
    const pending = accounts?.filter(a => !a.Is_OK).length || 0;
    const uniqueUsers = new Set(accounts?.map(a => a.user_id)).size;

    const serverMap = useMemo(() => {
        const map = {};
        (accounts || []).filter(a => a.Is_OK && a.index_server).forEach(a => {
            const s = a.index_server;
            if (!map[s]) map[s] = { count: 0 };
            map[s].count++;
        });
        return map;
    }, [accounts]);

    const usedServers = Object.keys(serverMap).length;

    const lastApproved = useMemo(() =>
        [...(accounts || [])]
            .filter(a => a.Is_OK && a.Date_OK)
            .sort((a, b) => new Date(b.Date_OK) - new Date(a.Date_OK))
            .slice(0, 4),
        [accounts]);

    const topUsers = useMemo(() => {
        const counts = {};
        (accounts || []).filter(a => a.Is_OK).forEach(a => {
            if (!counts[a.user_id]) counts[a.user_id] = { name: a.ownerName, count: 0 };
            counts[a.user_id].count++;
        });
        return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
    }, [accounts]);

    const filtered = useMemo(() => {
        let list = accounts || [];
        if (filterStatus === "approved") list = list.filter(a => a.Is_OK);
        if (filterStatus === "pending") list = list.filter(a => !a.Is_OK);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(a =>
                String(a.id).includes(q) ||
                a.ownerName?.toLowerCase().includes(q) ||
                a.Email?.toLowerCase().includes(q) ||
                String(a.index_server).includes(q)
            );
        }
        return list;
    }, [accounts, filterStatus, search]);

    const parsedServersConfig = useMemo(() => {
        if (!settings || !settings.servers_config) return [];
        try {
            return JSON.parse(settings.servers_config);
        } catch {
            return [];
        }
    }, [settings]);

    const totalSlots = parsedServersConfig.reduce((acc, s) => acc + parseInt(s.capacity || 0), 0);
    const totalServersConfigured = parsedServersConfig.length;

    const stats = [
        { label: t("totalAccounts") || "الحسابات إجمالاً", value: total, sub: `${approved} معتمد · ${pending} انتظار`, icon: UserIcon, color: "var(--accent)", bg: "var(--accent-soft)" },
        { label: t("approvedAccounts") || "حسابات معتمدة", value: approved, sub: `${Math.round(approved / (total || 1) * 100)}% من الإجمالي`, icon: CheckCircle2, color: "var(--green)", bg: "var(--green-soft)" },
        { label: t("waitingAccounts") || "حسابات بالانتظار", value: pending, sub: pending > 0 ? "بانتظار المراجعة" : "لا يوجد انتظار", icon: Clock, color: "var(--gold)", bg: "var(--gold-soft)" },
        { label: t("users"), value: uniqueUsers, sub: `مستخدم نشط`, icon: Users, color: "#a78bfa", bg: "rgba(167,139,250,0.15)" },
        { label: t("activeServers"), value: usedServers, sub: `${totalServersConfigured} تمت إضافتهم`, icon: Server, color: "var(--orange)", bg: "var(--orange-soft)" },
    ];

    return (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.2rem" }}>{t("overview")}</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{t("gameDashboard")}</p>
                </div>
                <Link to="/admin/accounts" className="btn btn-secondary" style={{ gap: "0.4rem", fontSize: "0.85rem" }}>
                    {t("allAccounts") || "كل الحسابات"} <ArrowRight size={14} />
                </Link>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                {stats.map(s => <StatCard key={s.label} {...s} isLoading={isLoading} />)}
            </div>

            {!isLoading && (
                <div className="card" style={{ padding: "1.25rem 1.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.825rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <Activity size={14} color="var(--accent)" /> استخدام السيرفرات
                        </span>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            {approved} / {totalSlots > 0 ? totalSlots : "..."} مقعد
                        </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {parsedServersConfig.map((srvInfo) => {
                            const srvName = srvInfo.name;
                            const count = serverMap[srvName] ? serverMap[srvName].count : 0;
                            const cap = parseInt(srvInfo.capacity || 8);
                            const pct = Math.round((count / cap) * 100) || 0;
                            const bar = pct >= 90 ? "var(--red)" : pct >= 70 ? "var(--gold)" : "var(--green)";
                            return (
                                <div key={srvName}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>سيرفر {srvName}</span>
                                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{count}/{cap} مكان مشغول</span>
                                    </div>
                                    <div style={{ height: 6, background: "var(--bg-hover)", borderRadius: 999 }}>
                                        <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: bar, borderRadius: 999, transition: "width 0.5s" }} />
                                    </div>
                                </div>
                            );
                        })}
                        {parsedServersConfig.length === 0 && (
                            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>لا توجد حسابات معتمدة بعد.</p>
                        )}
                    </div>
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
                <div className="card" style={{ padding: "1.25rem 1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "1rem" }}>
                        <TrendingUp size={16} color="var(--green)" />
                        <h2 style={{ font: "700 0.9rem/1 inherit" }}>آخر الاعتمادات</h2>
                    </div>
                    {isLoading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : (
                        lastApproved.length === 0
                            ? <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>لا يوجد.</p>
                            : lastApproved.map(acc => (
                                <div key={acc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.625rem 0", borderBottom: "1px solid var(--border)" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--green-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <UserIcon size={14} color="var(--green)" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{acc.Email}</div>
                                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{acc.ownerName} · سيرفر {acc.index_server}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: "0.72rem", color: "var(--green)", fontWeight: 600 }}>
                                        {fmtDate(acc.Date_OK, { month: "short", day: "numeric" })}
                                    </div>
                                </div>
                            ))
                    )}
                </div>

                <div className="card" style={{ padding: "1.25rem 1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "1rem" }}>
                        <BarChart3 size={16} color="var(--accent)" />
                        <h2 style={{ font: "700 0.9rem/1 inherit" }}>العملاء الأكثر حسابات</h2>
                    </div>
                    {isLoading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : (
                        topUsers.length === 0
                            ? <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>لا يوجد.</p>
                            : topUsers.map((u, idx) => {
                                const maxAcc = topUsers[0]?.count || 1;
                                const pct = Math.round((u.count / maxAcc) * 100);
                                return (
                                    <div key={idx} style={{ marginBottom: "0.625rem" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                                            <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                                                <span style={{ color: "var(--text-muted)", marginLeft: 4 }}>#{idx + 1}</span> {u.name}
                                            </span>
                                            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--accent)" }}>{u.count}</span>
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

            <div className="card" style={{ padding: "1.5rem", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <UserIcon size={16} color="var(--accent)" />
                        <h2 style={{ font: "700 0.95rem/1 inherit" }}>جميع الحسابات</h2>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 999, padding: "0.15rem 0.5rem" }}>{filtered.length}</span>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {["all", "approved", "pending"].map(f => (
                            <button key={f} onClick={() => setFilterStatus(f)} className="btn"
                                style={{ fontSize: "0.78rem", padding: "0.3rem 0.75rem", background: filterStatus === f ? "var(--accent)" : "var(--bg-card)", color: filterStatus === f ? "white" : "var(--text-secondary)", border: `1px solid ${filterStatus === f ? "var(--accent)" : "var(--border)"}` }}>
                                {f === "all" ? t("all") : f === "approved" ? t("approved") : t("pending")}
                            </button>
                        ))}
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
                                    {["#", "الحساب و المالك", "الحالة", "سيرفر / فهرس", "تاريخ الإنشاء", "آخر اعتماد"].map(h => (
                                        <th key={h} style={{ padding: "0.6rem 0.5rem", textAlign: "start", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>لا توجد نتائج.</td></tr>
                                ) : (
                                    filtered.map(acc => <AccountRow key={acc.id} acc={acc} fmtDate={fmtDate} t={t} />)
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {!isLoading && pending > 0 && (
                    <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "var(--gold-soft)", border: "1px solid rgba(234,179,8,0.25)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <AlertTriangle size={15} color="var(--gold)" />
                        <span style={{ fontSize: "0.825rem", color: "var(--gold)" }}>
                            لديك <strong>{pending}</strong> حساب بانتظار الاعتماد.
                        </span>
                        <Link to="/admin/accounts" className="btn btn-ghost" style={{ marginRight: "auto", marginLeft: 0, fontSize: "0.78rem", padding: "0.2rem 0.6rem", color: "var(--gold)" }}>
                            مراجعة →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
