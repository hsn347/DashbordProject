import { useQuery } from "@tanstack/react-query";
import { supabaseAdmin } from "../../lib/supabase";
import { Globe2, Users, CheckCircle2, Clock, RefreshCw, TrendingUp, BarChart3 } from "lucide-react";
import { useLanguage } from "../../Context/LanguageContext";
import { DOMAIN_CONFIGS } from "../../Context/DomainContext";

// Fetch domain stats from supabase using the domain column
async function fetchDomainStats() {
    // Fetch all accounts with domain column
    const { data: accounts, error: accErr } = await supabaseAdmin
        .from("Accounts")
        .select("id, Is_OK, domain, user_id, created_at");
    if (accErr) throw accErr;

    // Fetch profiles with domain column
    const { data: profiles, error: profErr } = await supabaseAdmin
        .from("profiles")
        .select("id, domain, Is_COMP, allowed_accounts, Date_expier");
    if (profErr) throw profErr;

    // Group by domain
    const domainList = Object.keys(DOMAIN_CONFIGS);
    const stats = {};

    for (const domain of domainList) {
        const domainAccounts = (accounts || []).filter(a => (a.domain || "ibraabot.online") === domain);
        const domainProfiles = (profiles || []).filter(p => (p.domain || "ibraabot.online") === domain);

        const totalAccounts = domainAccounts.length;
        const activeAccounts = domainAccounts.filter(a => a.Is_OK).length;
        const pendingAccounts = domainAccounts.filter(a => !a.Is_OK).length;
        const totalUsers = domainProfiles.length;
        const activeUsers = domainProfiles.filter(p => p.Is_COMP).length;

        // Active rate
        const activeRate = totalAccounts > 0 ? Math.round((activeAccounts / totalAccounts) * 100) : 0;

        stats[domain] = {
            domain,
            config: DOMAIN_CONFIGS[domain],
            totalAccounts,
            activeAccounts,
            pendingAccounts,
            totalUsers,
            activeUsers,
            activeRate,
        };
    }

    return Object.values(stats);
}

function StatCard({ icon: Icon, label, value, color, soft }) {
    return (
        <div style={{
            background: "var(--bg-card)",
            border: `1px solid ${soft}`,
            borderRadius: "var(--radius)",
            padding: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            transition: "all 0.25s ease",
        }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 30px ${soft}`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
        >
            <div style={{ width: 44, height: 44, borderRadius: "var(--radius-sm)", background: soft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={22} color={color} />
            </div>
            <div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.2rem" }}>{label}</div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
            </div>
        </div>
    );
}

function DomainCard({ stat }) {
    const { t } = useLanguage();
    const cfg = stat.config;

    // Sky-blue for sharkgo, purple for ibraabot
    const isShark = cfg.key === "sharkgo";
    const cardAccent = cfg.accentColor;
    const cardSoft = cfg.accentSoft;

    return (
        <div style={{
            background: "var(--bg-card)",
            border: `1.5px solid ${cardAccent}40`,
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            transition: "all 0.3s ease",
        }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 12px 40px ${cardAccent}25`; e.currentTarget.style.borderColor = `${cardAccent}80`; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = `${cardAccent}40`; }}
        >
            {/* Domain Header */}
            <div style={{
                padding: "1.5rem",
                background: `linear-gradient(135deg, ${cardAccent}20, ${cardAccent}08)`,
                borderBottom: `1px solid ${cardAccent}30`,
                display: "flex",
                alignItems: "center",
                gap: "1rem",
            }}>
                {cfg.logoType === "image" ? (
                    <div style={{ width: 52, height: 52, borderRadius: "50%", overflow: "hidden", border: `2px solid ${cardAccent}`, boxShadow: `0 0 15px ${cardAccent}50` }}>
                        <img src={cfg.logo} alt={cfg.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                ) : (
                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: cardSoft, border: `2px solid ${cardAccent}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 15px ${cardAccent}30` }}>
                        <Globe2 size={26} color={cardAccent} />
                    </div>
                )}
                <div>
                    <div style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--text-primary)" }}>{cfg.name}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontFamily: "monospace" }}>{stat.domain}</div>
                </div>
                {/* Active rate badge */}
                <div style={{ marginLeft: "auto", textAlign: "center" }}>
                    <div style={{
                        background: `${cardAccent}20`,
                        border: `1px solid ${cardAccent}50`,
                        borderRadius: "999px",
                        padding: "0.3rem 0.9rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                    }}>
                        <TrendingUp size={13} color={cardAccent} />
                        <span style={{ color: cardAccent, fontWeight: 800, fontSize: "0.9rem" }}>{stat.activeRate}%</span>
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>معدل النشاط</div>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ padding: "1.25rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
                <StatCard
                    icon={BarChart3}
                    label="إجمالي الحسابات"
                    value={stat.totalAccounts}
                    color={cardAccent}
                    soft={cardSoft}
                />
                <StatCard
                    icon={CheckCircle2}
                    label="حسابات نشطة"
                    value={stat.activeAccounts}
                    color="#10b981"
                    soft="rgba(16,185,129,0.12)"
                />
                <StatCard
                    icon={Clock}
                    label="قيد الانتظار"
                    value={stat.pendingAccounts}
                    color="#f59e0b"
                    soft="rgba(245,158,11,0.12)"
                />
                <StatCard
                    icon={Users}
                    label="إجمالي المستخدمين"
                    value={stat.totalUsers}
                    color="var(--text-primary)"
                    soft="rgba(150,150,200,0.1)"
                />
            </div>

            {/* Progress bar */}
            <div style={{ padding: "0 1.25rem 1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>نسبة الحسابات النشطة</span>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: cardAccent }}>{stat.activeAccounts} / {stat.totalAccounts}</span>
                </div>
                <div style={{ height: 6, background: "var(--bg-hover)", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{
                        height: "100%",
                        width: `${stat.activeRate}%`,
                        background: `linear-gradient(90deg, ${cardAccent}, ${cfg.accentHover})`,
                        borderRadius: "999px",
                        transition: "width 1s cubic-bezier(0.34, 1.56, 0.64, 1)",
                        boxShadow: `0 0 8px ${cardAccent}60`,
                    }} />
                </div>
            </div>
        </div>
    );
}

export default function DomainsStats() {
    const { t } = useLanguage();

    const { data: stats, isLoading, refetch, isError } = useQuery({
        queryKey: ["domains-stats"],
        queryFn: fetchDomainStats,
        staleTime: 1000 * 60 * 2,
    });

    // Totals
    const totals = stats ? stats.reduce((acc, s) => ({
        totalAccounts: acc.totalAccounts + s.totalAccounts,
        activeAccounts: acc.activeAccounts + s.activeAccounts,
        totalUsers: acc.totalUsers + s.totalUsers,
    }), { totalAccounts: 0, activeAccounts: 0, totalUsers: 0 }) : null;

    return (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
                        <div style={{ width: 36, height: 36, borderRadius: "var(--radius-sm)", background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Globe2 size={20} color="var(--accent)" />
                        </div>
                        <h1 className="page-title-gradient" style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                            إحصاءات الدومينات
                        </h1>
                    </div>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                        عدد حسابات القرى النشطة لكل دومين
                    </p>
                </div>
                <button className="btn btn-secondary" style={{ gap: "0.5rem" }} onClick={() => refetch()}>
                    <RefreshCw size={15} />
                    تحديث
                </button>
            </div>

            {/* Global Summary */}
            {totals && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ width: 44, height: 44, borderRadius: "var(--radius-sm)", background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <BarChart3 size={22} color="var(--accent)" />
                        </div>
                        <div>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>إجمالي كل الدومينات</div>
                            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent)", lineHeight: 1.1 }}>{totals.totalAccounts}</div>
                        </div>
                    </div>
                    <div style={{ background: "var(--bg-card)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "var(--radius)", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ width: 44, height: 44, borderRadius: "var(--radius-sm)", background: "rgba(16,185,129,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <CheckCircle2 size={22} color="#10b981" />
                        </div>
                        <div>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>نشطة في كل الدومينات</div>
                            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#10b981", lineHeight: 1.1 }}>{totals.activeAccounts}</div>
                        </div>
                    </div>
                    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ width: 44, height: 44, borderRadius: "var(--radius-sm)", background: "rgba(150,150,200,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Users size={22} color="var(--text-secondary)" />
                        </div>
                        <div>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>إجمالي المستخدمين</div>
                            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.1 }}>{totals.totalUsers}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
                    <div className="spinner" style={{ width: 36, height: 36, margin: "0 auto 1rem" }} />
                    <p>جاري تحميل الإحصاءات...</p>
                </div>
            )}

            {/* Error */}
            {isError && (
                <div style={{ textAlign: "center", padding: "3rem", border: "2px dashed var(--red-soft)", borderRadius: "var(--radius-lg)" }}>
                    <p style={{ color: "var(--red)" }}>فشل تحميل البيانات. تأكد من وجود عمود domain في جداول قاعدة البيانات.</p>
                </div>
            )}

            {/* Domain Cards */}
            {!isLoading && stats && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
                    {stats.map(stat => (
                        <DomainCard key={stat.domain} stat={stat} />
                    ))}
                </div>
            )}
        </div>
    );
}
