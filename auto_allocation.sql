-- =========================================================================
--  نظام الاعتماد التلقائي المطور وتوزيع السيرفرات الذكي
--  هذا الملف يجب نسخه بالكامل وتنفيذه في (SQL Editor) داخل Supabase 
-- =========================================================================

-- 1. دالة الترقيم: تخزن رقم الأولوية (priority) في index_server
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
    -- جلب إعدادات السيرفرات من جدول الإعدادات
    SELECT value::jsonb INTO v_servers FROM admin_settings WHERE key = 'servers_config';
    
    IF v_servers IS NULL OR jsonb_array_length(v_servers) = 0 THEN
        v_servers := '[{"name": "Server 1", "capacity": 10, "priority": 1}]'::jsonb;
    END IF;

    -- تصفير الفهرس للحسابات المرفوضة
    UPDATE "Accounts" SET index_server = NULL WHERE "Is_OK" = false OR "Is_OK" IS NULL;

    -- إنشاء قائمة السيرفرات مرتبة حسب الأولوية
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

    -- توزيع الحسابات المعتمدة (الأقدم أولاً)
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

        -- تخزين رقم الأولوية فقط (1, 2, 3...)
        UPDATE "Accounts"
        SET index_server = v_current_s_pri::TEXT
        WHERE id = v_acc.id;

    END LOOP;

    CLOSE v_server_cursor;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. دالة القبول الآلي
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
        "Date_OK" = CASE 
                        WHEN r.rnk <= v_quota THEN COALESCE("Date_OK", CURRENT_DATE)
                        ELSE NULL 
                    END
    FROM ranked r
    WHERE a.id = r.id;

    PERFORM reindex_accounts_v2();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. دالة فحص كل المستخدمين
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


-- 4. إصلاح الـ trigger ليتعامل مع القيم بشكل صحيح
CREATE OR REPLACE FUNCTION handle_accounts_db_change()
RETURNS TRIGGER AS $$
DECLARE
    target_server_id INT;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_server_id := OLD.index_server::INT;
    ELSE
        IF NEW.index_server IS NOT NULL AND NEW.index_server ~ '^\d+$' THEN
            target_server_id := NEW.index_server::INT;
        ELSE
            RETURN NULL;
        END IF;
    END IF;

    UPDATE "Changes"
    SET "Is_Change" = TRUE
    WHERE "SERVER_NUM" = target_server_id
    AND "Is_Change" = FALSE;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
