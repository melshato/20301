-- ============================================================
-- إضافة الأعمدة المفقودة إلى جدول notifications
-- ============================================================
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS action_url TEXT,
ADD COLUMN IF NOT EXISTS action_type TEXT,
ADD COLUMN IF NOT EXISTS requires_action BOOLEAN DEFAULT FALSE;
