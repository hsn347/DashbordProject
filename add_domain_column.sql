-- =============================================
-- إضافة عمود domain لكل الجداول المطلوبة
-- شغّل هذا في Supabase SQL Editor
-- =============================================

-- 1. جدول Accounts
ALTER TABLE "Accounts"
ADD COLUMN IF NOT EXISTS domain TEXT DEFAULT 'ibraabot.online';

-- 2. جدول profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS domain TEXT DEFAULT 'ibraabot.online';

-- 3. جدول Changes (إن وجد)
ALTER TABLE "Changes"
ADD COLUMN IF NOT EXISTS domain TEXT DEFAULT 'ibraabot.online';

-- 4. جدول admin_settings (إن وجد)
ALTER TABLE admin_settings
ADD COLUMN IF NOT EXISTS domain TEXT DEFAULT 'ibraabot.online';

-- =============================================
-- إنشاء indexes لتسريع الاستعلامات
-- =============================================
CREATE INDEX IF NOT EXISTS idx_accounts_domain ON "Accounts"(domain);
CREATE INDEX IF NOT EXISTS idx_profiles_domain ON profiles(domain);

-- =============================================
-- اختياري: تحديث السجلات القديمة لتحديد الدومين الافتراضي
-- =============================================
UPDATE "Accounts" SET domain = 'ibraabot.online' WHERE domain IS NULL;
UPDATE profiles SET domain = 'ibraabot.online' WHERE domain IS NULL;
