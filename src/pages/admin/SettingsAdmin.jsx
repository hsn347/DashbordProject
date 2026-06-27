import { useState, useEffect } from "react";
import { Save, Settings2, AlertCircle, Info, Server, Copy, Check, RefreshCw, Plus, Minus, Trash2 } from "lucide-react";
import { useGetSettings, useUpdateSetting } from "../../hooks/useSettings";
import { useGetAllAccountsCrossDomain, useForceGlobalApply } from "../../hooks/useAdminAccounts";
import { toast } from "sonner";
import { useLanguage } from "../../Context/LanguageContext";

const FULL_SETUP_SQL = `
-- =========================================================================
--  نظام الاعتماد التلقائي المطور وتوزيع السيرفرات الذكي
--  يرجى نسخ هذا الكود وتنفيذه في SQL Editor
-- =========================================================================

-- دالة الترقيم: تخزن رقم الأولوية (priority) في index_server
CREATE OR REPLACE FUNCTION reindex_accounts_v2()
RETURNS void AS $$
DECLARE
    v_acc RECORD;
    v_servers JSONB;
    v_server_rec RECORD;
    
    v_current_s_pri INT;
    v_current_s_cap INT;
    v_current_used INT := 0;
    
    v_server_cursor REFCURSOR;
BEGIN
    SELECT value::jsonb INTO v_servers FROM admin_settings WHERE key = 'servers_config';
    
    IF v_servers IS NULL OR jsonb_array_length(v_servers) = 0 THEN
        v_servers := '[{"name": "Server 1", "capacity": 10, "priority": 1}]'::jsonb;
    END IF;

    UPDATE "Accounts" SET index_server = NULL WHERE "Is_OK" = false OR "Is_OK" IS NULL;

    CREATE TEMP TABLE IF NOT EXISTS tmp_srvs (
        s_name TEXT, s_cap INT, s_pri INT
    ) ON COMMIT DROP;
    
    TRUNCATE tmp_srvs;
    
    INSERT INTO tmp_srvs (s_name, s_cap, s_pri)
    SELECT 
        s->>'name', 
        (s->>'capacity')::INT, 
        (s->>'priority')::INT
    FROM jsonb_array_elements(v_servers) AS s
    ORDER BY (s->>'priority')::INT ASC;

    OPEN v_server_cursor FOR SELECT * FROM tmp_srvs ORDER BY s_pri ASC;
    FETCH v_server_cursor INTO v_server_rec;
    
    IF FOUND THEN
        v_current_s_pri := v_server_rec.s_pri;
        v_current_s_cap := v_server_rec.s_cap;
    END IF;

    FOR v_acc IN 
        SELECT id FROM "Accounts" WHERE "Is_OK" = true ORDER BY created_at ASC, id ASC 
    LOOP
        IF v_current_used >= v_current_s_cap THEN
            FETCH v_server_cursor INTO v_server_rec;
            IF FOUND THEN
                v_current_s_pri := v_server_rec.s_pri;
                v_current_s_cap := v_server_rec.s_cap;
                v_current_used := 0;
            END IF;
        END IF;

        v_current_used := v_current_used + 1;

        UPDATE "Accounts"
        SET index_server = v_current_s_pri::TEXT
        WHERE id = v_acc.id;

    END LOOP;

    CLOSE v_server_cursor;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION auto_approve_user_accounts(p_user_id UUID)
RETURNS void AS $$
DECLARE
    v_quota INT;
BEGIN
    SELECT allowed_accounts INTO v_quota FROM profiles WHERE id = p_user_id;
    IF v_quota IS NULL THEN v_quota := 0; END IF;

    WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER(ORDER BY created_at ASC, id ASC) as rnk
        FROM "Accounts"
        WHERE user_id = p_user_id::TEXT
    )
    UPDATE "Accounts" a
    SET 
        "Is_OK" = CASE WHEN r.rnk <= v_quota THEN true ELSE false END,
        "Date_OK" = CASE WHEN r.rnk <= v_quota THEN COALESCE("Date_OK", CURRENT_DATE) ELSE NULL END
    FROM ranked r
    WHERE a.id = r.id;

    PERFORM reindex_accounts_v2();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION auto_approve_all_users()
RETURNS void AS $$
DECLARE
    u_rec RECORD;
BEGIN
    FOR u_rec IN SELECT DISTINCT user_id FROM "Accounts" LOOP
        IF u_rec.user_id IS NOT NULL AND u_rec.user_id ~ '^[0-9a-fA-F-]{36}$' THEN
            PERFORM auto_approve_user_accounts(u_rec.user_id::UUID);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

function SettingCard({ icon: Icon, iconColor, title, hint, children }) {
    return (
        <div className="card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                <Icon size={20} color={iconColor || "var(--accent)"} />
                <h2 style={{ font: "700 1rem/1 inherit" }}>{title}</h2>
            </div>
            {children}
            {hint && (
                <div style={{ marginTop: "0.875rem", padding: "0.625rem 0.875rem", background: "var(--accent-soft)", border: "1px solid rgba(108,99,255,0.15)", borderRadius: "var(--radius-sm)" }}>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        <Info size={12} style={{ display: "inline", marginRight: 4, color: iconColor || "var(--accent)" }} />
                        {hint}
                    </p>
                </div>
            )}
        </div>
    );
}

export default function SettingsAdmin() {
    const { t } = useLanguage();
    const { data: settings, isLoading } = useGetSettings();
    const updateSetting = useUpdateSetting();
    const { data: accounts } = useGetAllAccountsCrossDomain();
    const globalSync = useForceGlobalApply();

    const [serversConfig, setServersConfig] = useState([]);
    const [copied, setCopied] = useState(false);
    const [isEdited, setIsEdited] = useState(false);

    useEffect(() => {
        if (!settings) return;
        try {
            const rawConfig = settings.servers_config;
            if (rawConfig) {
                setServersConfig(JSON.parse(rawConfig));
            } else {
                setServersConfig([{ name: "Server 1", capacity: 8, priority: 1 }]);
            }
        } catch (e) {
            setServersConfig([{ name: "Server 1", capacity: 8, priority: 1 }]);
        }
        setIsEdited(false);
    }, [settings]);

    const handleConfigChange = (index, field, value) => {
        const newConfig = [...serversConfig];
        newConfig[index] = { ...newConfig[index], [field]: value };
        setServersConfig(newConfig);
        setIsEdited(true);
    };

    const handleAddServer = () => {
        setServersConfig([...serversConfig, { name: `Server ${serversConfig.length + 1}`, capacity: 8, priority: serversConfig.length + 1 }]);
        setIsEdited(true);
    };

    const handleDeleteServer = (index) => {
        if (serversConfig.length === 1) return toast.error("لا يمكنك حذف جميع السيرفرات");
        const newConfig = serversConfig.filter((_, i) => i !== index);
        setServersConfig(newConfig);
        setIsEdited(true);
    };

    const handleSaveConfig = () => {
        // Validate
        for (const srv of serversConfig) {
            if (!srv.name.trim()) return toast.error("اسم السيرفر مطلوب");
            if (srv.capacity < 1) return toast.error("سعة السيرفر يجب أن تكون أكبر من 0");
            if (srv.priority < 1) return toast.error("أولوية السيرفر يجب أن تكون أكبر من 0");
        }

        updateSetting.mutate({ key: "servers_config", value: JSON.stringify(serversConfig) }, {
            onSuccess: () => {
                setIsEdited(false);
                toast.success("تم حفظ إعدادات السيرفرات بنجاح. سنقوم بإعادة الجدولة التلقائية الآن.");
                globalSync.mutate();
            }
        });
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(FULL_SETUP_SQL.trim()).then(() => {
            setCopied(true);
            toast.success("✅ تم النسخ بنجاح!");
            setTimeout(() => setCopied(false), 3000);
        });
    };

    const approvedAccounts = accounts?.filter(a => a.Is_OK) || [];
    const totalSlots = serversConfig.reduce((sum, s) => sum + parseInt(s.capacity || 0), 0);
    const usedSlots = approvedAccounts.length;
    const activeServers = new Set(approvedAccounts.map(a => a.index_server).filter(Boolean)).size;

    return (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.75rem", paddingBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem" }}>إعدادات السيرفرات والنظام الآلي</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>أضف خوادمك، رتّب أولوياتها، والنظام سيقوم بالفرز تلقائياً.</p>
                </div>
                <button 
                    className="btn" 
                    style={{ gap: "0.4rem", background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-primary)" }} 
                    onClick={() => globalSync.mutate()}
                    disabled={globalSync.isPending}
                >
                    {globalSync.isPending ? <div className="spinner" style={{ width:14, height:14 }} /> : <RefreshCw size={14} />}
                    إجبار الجدولة وتوزيع الحسابات يدوياً (Force Apply)
                </button>
            </div>

            <div className="card" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Server size={20} color="var(--accent)" />
                        <h2 style={{ font: "700 1rem/1 inherit" }}>جدولة السيرفرات (القائمة الديناميكية)</h2>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button className="btn btn-ghost" onClick={handleAddServer} style={{ gap: "0.35rem", fontSize: "0.85rem", color: "var(--accent)" }}>
                            <Plus size={15} /> إضافة سيرفر جديد
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSaveConfig}
                            disabled={updateSetting.isPending || !isEdited}
                            style={{ gap: "0.4rem", fontSize: "0.85rem" }}
                        >
                            {updateSetting.isPending ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: "white" }} /> : <Save size={14} />}
                            حفظ الإعدادات وتطبيق
                        </button>
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {serversConfig.map((server, index) => {
                        const inServer = approvedAccounts.filter(a => a.index_server === String(server.priority)).length;
                        const capacity = parseInt(server.capacity || 0);
                        const pct = capacity > 0 ? Math.round((inServer / capacity) * 100) : 0;
                        const barColor = pct >= 100 ? "var(--red)" : pct >= 80 ? "var(--gold)" : "var(--green)";

                        return (
                            <div key={index} style={{
                                padding: "1.25rem",
                                background: "var(--bg-surface)",
                                borderRadius: "var(--radius-md)",
                                border: `1px solid ${pct >= 100 ? "rgba(239,68,68,0.4)" : "var(--border)"}`,
                                display: "flex", alignItems: "center", flexWrap: "wrap", gap: "1rem"
                            }}>
                                <div style={{ display: "flex", gap: "1rem", flex: "1 1 auto", flexWrap: "wrap" }}>
                                    
                                    <div style={{ flex: "1 1 200px" }}>
                                        <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem", display: "block" }}>اسم السيرفر (كود التعريف)</label>
                                        <input
                                            className="form-input"
                                            value={server.name}
                                            onChange={(e) => handleConfigChange(index, "name", e.target.value)}
                                            style={{ padding: "0.4rem 0.6rem", fontSize: "0.9rem" }}
                                            placeholder="مثال: Server-XYZ"
                                        />
                                    </div>
                                    
                                    <div style={{ flex: "0 1 120px" }}>
                                        <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem", display: "block" }}>أولوية الملء (كم رقمه؟)</label>
                                        <input
                                            className="form-input"
                                            type="number" min={1}
                                            value={server.priority}
                                            onChange={(e) => handleConfigChange(index, "priority", parseInt(e.target.value) || 1)}
                                            style={{ padding: "0.4rem 0.6rem", fontSize: "0.9rem", textAlign: "center" }}
                                        />
                                    </div>

                                    <div style={{ flex: "0 1 120px" }}>
                                        <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem", display: "block" }}>سعة التحمل</label>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                                            <button className="btn btn-ghost" style={{ padding: "0.3rem" }} onClick={() => handleConfigChange(index, "capacity", Math.max(1, capacity - 1))}><Minus size={12} /></button>
                                            <input
                                                className="form-input" type="number" min={1}
                                                value={server.capacity}
                                                onChange={(e) => handleConfigChange(index, "capacity", parseInt(e.target.value) || 1)}
                                                style={{ textAlign: "center", padding: "0.4rem", flex: 1 }}
                                            />
                                            <button className="btn btn-ghost" style={{ padding: "0.3rem" }} onClick={() => handleConfigChange(index, "capacity", capacity + 1)}><Plus size={12} /></button>
                                        </div>
                                    </div>

                                </div>

                                <div style={{ flex: "1 1 200px", minWidth: 200, paddingLeft: "1rem", borderLeft: "1px dashed var(--border)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                                        <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>حالة الاستيعاب</span>
                                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>{inServer} / {capacity}</span>
                                    </div>
                                    <div style={{ height: 6, background: "var(--bg-hover)", borderRadius: 999, overflow: "hidden" }}>
                                        <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: barColor, borderRadius: 999, transition: "width 0.4s" }} />
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                                         <button className="btn btn-ghost" style={{ color: "var(--red)", padding: "0.2rem 0.5rem", fontSize: "0.75rem" }} onClick={() => handleDeleteServer(index)}>
                                            <Trash2 size={13} style={{ marginLeft: 4 }}/> إزالة
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="card" style={{ padding: "1.5rem" }}>
                <h2 style={{ font: "700 1rem/1 inherit", marginBottom: "1rem", color: "var(--text-secondary)" }}>{t("systemStatus")}</h2>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.75rem" }}>
                    {[
                        { label: "إجمالي الحسابات المُدخلة", value: accounts?.length || 0, color: "var(--accent)" },
                        { label: "الحسابات التي تم قبولها", value: usedSlots, color: "var(--green)" },
                        { label: "مقاعد متاحة للاستقبال", value: Math.max(totalSlots - usedSlots, 0), color: "var(--purple)" },
                        { label: "سيرفرات قيد الاستخدام", value: `${activeServers} من أصل ${serversConfig.length}`, color: activeServers >= serversConfig.length ? "var(--red)" : "var(--green)" },
                    ].map(({ label, value, color }) => (
                        <div key={label} style={{ padding: "0.875rem", background: "var(--bg-surface)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", borderTop: `3px solid ${color}` }}>
                            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.35rem" }}>{label}</div>
                            <div style={{ fontSize: "1.375rem", fontWeight: 800, color }}>{value}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <AlertCircle size={18} color="var(--gold)" />
                        <h2 style={{ font: "700 1rem/1 inherit", color: "var(--gold)" }}>أكواد SQL للنظام المطور</h2>
                    </div>
                    <button className="btn btn-secondary" onClick={handleCopy} style={{ gap: "0.4rem", fontSize: "0.8rem" }}>
                        {copied ? <><Check size={14} color="var(--green)" /> تم!</> : <><Copy size={14} /> نسخ الكود بالكامل</>}
                    </button>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.825rem", marginBottom: "1rem" }}>
                    يجب عليك تشغيل هذا الاستعلام في صندوق <strong>SQL Editor</strong> داخل حسابك في Supabase لكي تعمل مزايا القبول الآلي وتوزيع الخوادم الذكي بشكل سليم.
                </p>
                <pre style={{
                    background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                    padding: "1.25rem", overflowX: "auto", fontSize: "0.75rem", color: "var(--text-secondary)",
                    lineHeight: 1.7, direction: "ltr", textAlign: "left", maxHeight: 350, overflowY: "auto",
                }}>
                    {FULL_SETUP_SQL.trim()}
                </pre>
            </div>
        </div >
    );
}
