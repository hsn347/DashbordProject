-- =========================================================================
--  نظام الاعتماد التلقائي المطور وتوزيع السيرفرات الذكي
--  هذا الملف يجب نسخه بالكامل وتنفيذه في (SQL Editor) داخل Supabase 
-- =========================================================================

-- 1. الدالة الأساسية: إعادة الفهرسة وتوزيع السيرفرات بناءً على إعداداتك (servers_config)
CREATE OR REPLACE FUNCTION reindex_accounts_v2()
RETURNS void AS $$
DECLARE
    v_acc RECORD;
    v_servers JSONB;
    v_server_rec RECORD;
    
    v_current_s_name TEXT;
    v_current_s_cap INT;
    v_current_used INT := 0;
    
    v_server_cursor REFCURSOR;
BEGIN
    -- جلب إعدادات السيرفرات من جدول الإعدادات
    SELECT value::jsonb INTO v_servers FROM admin_settings WHERE key = 'servers_config';
    
    -- إذا لم يتم ضبط الإعدادات بعد، قم بإنشاء إعدادات افتراضية
    IF v_servers IS NULL OR jsonb_array_length(v_servers) = 0 THEN
        v_servers := '[{"name": "Server 1", "capacity": 10, "priority": 1}]'::jsonb;
    END IF;

    -- تصفير الفهارس للحسابات المرفوضة (للنظافة)
    UPDATE "Accounts" SET index_server = NULL, index_emulators = NULL WHERE "Is_OK" = false OR "Is_OK" IS NULL;

    -- إنشاء قائمة السيرفرات مرتبة حسب الأولوية وتخزينها في متغير مؤقت
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

    -- فتح مؤشر لقراءة السيرفرات المتاحة
    OPEN v_server_cursor FOR SELECT * FROM tmp_srvs ORDER BY s_pri ASC;
    FETCH v_server_cursor INTO v_server_rec;
    
    IF FOUND THEN
        v_current_s_name := v_server_rec.s_name;
        v_current_s_cap := v_server_rec.s_cap;
    END IF;

    -- المرور على الحسابات المعتمدة من الأقدم (الأولوية للأقدمية) وإعطاؤها سيرفرات
    FOR v_acc IN 
        SELECT id FROM "Accounts" WHERE "Is_OK" = true ORDER BY created_at ASC, id ASC 
    LOOP
        -- إذا السيرفر ممتلئ، انتقل للذي يليه
        IF v_current_used >= v_current_s_cap THEN
            FETCH v_server_cursor INTO v_server_rec;
            IF FOUND THEN
                v_current_s_name := v_server_rec.s_name;
                v_current_s_cap := v_server_rec.s_cap;
                v_current_used := 0;
            ELSE
                -- في حال الإمتلاء الكلي للسيرفرات (لا يوجد سيرفرات كافية)، سيتم إعطاء NULL للأسف أو تركه فارغ.
                -- لنتوقف أو نتركه ممتلئ ونضيف للسيرفر الأخير بشكل استثنائي!
                -- سنستمر بالإضافة على السيرفر الأخير إذا نفدت السيرفرات.
            END IF;
        END IF;

        -- زيادة عداد السيرفر
        v_current_used := v_current_used + 1;

        -- تحديث الحساب بالسيرفر ورقمه الداخلي
        UPDATE "Accounts"
        SET index_server = v_current_s_name,
            index_emulators = v_current_used::TEXT
        WHERE id = v_acc.id;

    END LOOP;

    CLOSE v_server_cursor;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. دالة القبول الآلي للحسابات: بناءً على حصة المستخدم (الكوتا)
CREATE OR REPLACE FUNCTION auto_approve_user_accounts(p_user_id UUID)
RETURNS void AS $$
DECLARE
    v_quota INT;
BEGIN
    -- 1. سحب الكوتا (الحد المسموح) للمستخدم من جدول profiles
    SELECT allowed_accounts INTO v_quota FROM profiles WHERE id = p_user_id;
    IF v_quota IS NULL THEN
        v_quota := 0;
    END IF;

    -- 2. تحديث الحسابات: القديمة تحصل على الدعم أولاً (حسب الكوتا)، ثم تُرفض الأحدث إن تجاوزت الكوتا
    WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER(ORDER BY created_at ASC, id ASC) as rnk
        FROM "Accounts"
        WHERE user_id = p_user_id
    )
    UPDATE "Accounts" a
    SET 
        "Is_OK" = CASE WHEN r.rnk <= v_quota THEN true ELSE false END,
        "Date_OK" = CASE 
                        WHEN r.rnk <= v_quota THEN COALESCE("Date_OK", CURRENT_TIMESTAMP::TEXT)
                        ELSE NULL 
                    END
    FROM ranked r
    WHERE a.id = r.id;

    -- 3. إعادة فهرسة وجدولة السيرفرات بشكل عالمي لكل الحسابات المقبولة لضمان عدم وجود فراغات
    PERFORM reindex_accounts_v2();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. دالة فحص كل المستخدمين (لمعالجة عامة عند تعديل إعدادات السيرفر)
CREATE OR REPLACE FUNCTION auto_approve_all_users()
RETURNS void AS $$
DECLARE
    u_rec RECORD;
BEGIN
    FOR u_rec IN SELECT DISTINCT user_id FROM "Accounts" LOOP
        -- تنفيذ الفرز الآلي لكل مستخدم لديه حسابات
        PERFORM auto_approve_user_accounts(u_rec.user_id);
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
