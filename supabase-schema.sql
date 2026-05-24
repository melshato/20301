-- ============================================================
-- ملف SQL لقاعدة بيانات Supabase (نسخة إنتاج آمنة)
-- ============================================================

-- ============================================================
-- 1. تفعيل الامتدادات الإضافية (Extensions)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 2. إنشاء الجداول (Tables)
-- جميع المفاتيح الأساسية من نوع UUID (ما عدا logs و allowed_employee_ids)
-- ربط المستخدمين بـ auth.users
-- ============================================================

-- جدول الفروع (يُنشأ أولاً لأنه مرجع)
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول المستخدمين (مرتبط بـ auth.users)
-- ملاحظة: لا يوجد حقل password، يتم الاعتماد على Supabase Auth
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'head', 'surveyor')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('approved', 'pending')),
    empId TEXT UNIQUE NOT NULL,
    phone TEXT,
    nationality TEXT,
    project TEXT,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    responsible_branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    head_surveyor TEXT,
    total_exp INTEGER,
    company_exp INTEGER,
    join_date DATE,
    substitute_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الأجهزة
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    cal_date DATE,
    status TEXT NOT NULL CHECK (status IN ('warehouse', 'assigned', 'maintenance', 'needs_calibration', 'at_maintenance', 'at_calibration')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول العهدة
CREATE TABLE IF NOT EXISTS custodies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_type TEXT NOT NULL,
    serial_number TEXT NOT NULL REFERENCES devices(serial) ON DELETE RESTRICT,
    receipt_date DATE NOT NULL,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    calibration_date DATE,
    device_condition TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('approved', 'pending_approval', 'pending_admin_approval', 'pending_head_approval')),
    received_from TEXT,
    received_from_name TEXT,
    notes TEXT,
    satisfied BOOLEAN,
    care_level TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approval_history JSONB DEFAULT '[]',
    transfer_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول التقييمات (بدون unique(userId) ليسمح بتقييمات متعددة)
CREATE TABLE IF NOT EXISTS ratings (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rated_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rated_by_name TEXT NOT NULL,
    stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
    answers JSONB NOT NULL,
    notes TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الإشعارات
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('general', 'warning', 'info', 'success', 'error')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    related_id TEXT,
    read BOOLEAN DEFAULT FALSE,
    is_substitute_notif BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول السجلات (يبقى BIGSERIAL لأداء أفضل)
CREATE TABLE IF NOT EXISTS logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    msg TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الأرقام الوظيفية المسموحة
CREATE TABLE IF NOT EXISTS allowed_employee_ids (
    id BIGSERIAL PRIMARY KEY,
    emp_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الإعدادات
CREATE TABLE IF NOT EXISTS settings (
    id BIGSERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 3. الفهارس (Indexes) لتحسين الأداء
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_empId ON users(empId);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_branch_id ON users(branch_id);
CREATE INDEX IF NOT EXISTS idx_devices_serial ON devices(serial);
CREATE INDEX IF NOT EXISTS idx_devices_owner_id ON devices(owner_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_custodies_user_id ON custodies(user_id);
CREATE INDEX IF NOT EXISTS idx_custodies_serial_number ON custodies(serial_number);
CREATE INDEX IF NOT EXISTS idx_custodies_status ON custodies(status);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rated_by ON ratings(rated_by);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);

-- فهارس مركبة مفيدة
CREATE INDEX IF NOT EXISTS idx_custodies_user_status ON custodies(user_id, status);
CREATE INDEX IF NOT EXISTS idx_devices_owner_status ON devices(owner_id, status);

-- ============================================================
-- 4. دوال و Triggers للتحديث التلقائي لـ updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق الـ trigger على الجداول التي تحتوي updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_custodies_updated_at ON custodies;
CREATE TRIGGER update_custodies_updated_at BEFORE UPDATE ON custodies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ratings_updated_at ON ratings;
CREATE TRIGGER update_ratings_updated_at BEFORE UPDATE ON ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_branches_updated_at ON branches;
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. البيانات الافتراضية (للفروع ومستخدمين تجريبيين)
-- ملاحظة: سيتم إنشاء المستخدمين عبر Supabase Auth أولاً، ثم إدراجهم في جدول users.
-- البيانات أدناه تفترض وجود مستخدمين في auth.users بنفس المعرفات.
-- ============================================================

-- إدراج الفروع
INSERT INTO branches (id, name) VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'فرع المكتب الرئيسي'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'فرع الرياض'),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'فرع المدينة'),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'فرع الدمام'),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'فرع القصيم'),
    ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'فرع أبها'),
    ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'فرع تبوك'),
    ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'فرع جدة'),
    ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', 'فرع التحالفات')
ON CONFLICT (id) DO NOTHING;

-- لا يمكن إدراج مستخدمين هنا مباشرة لأنهم بحاجة إلى وجودهم في auth.users.
-- بدلاً من ذلك، ندرج إعدادات افتراضية فقط.
INSERT INTO settings (key, value) VALUES
    ('company_name', '"شركة ساجكو"'),
    ('enable_notifications', 'true')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 6. تفعيل Row Level Security (RLS)
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE custodies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE allowed_employee_ids ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. سياسات الوصول (Policies) الآمنة
-- تعتمد على دور المستخدم المخزن في جدول users
-- و on auth.uid() للمصادقة
-- ============================================================

-- دالة مساعدة لجلب دور المستخدم الحالي (من جدول users)
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT
LANGUAGE sql STABLE
AS $$
    SELECT role FROM users WHERE id = auth.uid();
$$;

-- ----------------------
-- جدول users
-- ----------------------
-- المستخدم يمكنه قراءة بياناته فقط، والإداري يمكنه قراءة الكل
DROP POLICY IF EXISTS "users_select_own_or_admin" ON users;
CREATE POLICY "users_select_own_or_admin" ON users
    FOR SELECT USING (
        auth.uid() = id OR current_user_role() = 'admin'
    );

-- لا يمكن إدراج مستخدم جديد إلا عن طريق الإداري أو عبر التسجيل (يمكن تعديلها لاحقاً)
DROP POLICY IF EXISTS "users_insert_admin_only" ON users;
CREATE POLICY "users_insert_admin_only" ON users
    FOR INSERT WITH CHECK (current_user_role() = 'admin');

-- المستخدم يمكنه تحديث بياناته فقط، والإداري أي مستخدم
DROP POLICY IF EXISTS "users_update_own_or_admin" ON users;
CREATE POLICY "users_update_own_or_admin" ON users
    FOR UPDATE USING (
        auth.uid() = id OR current_user_role() = 'admin'
    );

-- الحذف مسموح فقط للإداري
DROP POLICY IF EXISTS "users_delete_admin_only" ON users;
CREATE POLICY "users_delete_admin_only" ON users
    FOR DELETE USING (current_user_role() = 'admin');

-- ----------------------
-- جدول devices
-- ----------------------
-- يمكن للمستخدم قراءة الأجهزة التي يملكها، أو كل الأجهزة للإداري والـ head
DROP POLICY IF EXISTS "devices_select_owner_or_admin_head" ON devices;
CREATE POLICY "devices_select_owner_or_admin_head" ON devices
    FOR SELECT USING (
        owner_id = auth.uid() 
        OR current_user_role() IN ('admin', 'head')
    );

-- إدراج جهاز: مسموح للإداري والـ head
DROP POLICY IF EXISTS "devices_insert_admin_head" ON devices;
CREATE POLICY "devices_insert_admin_head" ON devices
    FOR INSERT WITH CHECK (current_user_role() IN ('admin', 'head'));

-- تحديث: مسموح لمالك الجهاز أو الإداري أو الـ head
DROP POLICY IF EXISTS "devices_update_owner_or_admin_head" ON devices;
CREATE POLICY "devices_update_owner_or_admin_head" ON devices
    FOR UPDATE USING (
        owner_id = auth.uid() 
        OR current_user_role() IN ('admin', 'head')
    );

-- حذف: فقط للإداري
DROP POLICY IF EXISTS "devices_delete_admin_only" ON devices;
CREATE POLICY "devices_delete_admin_only" ON devices
    FOR DELETE USING (current_user_role() = 'admin');

-- ----------------------
-- جدول custodies
-- ----------------------
-- قراءة: المستخدم يرى عهدته الخاصة، والإداري والـ head يرون الكل
DROP POLICY IF EXISTS "custodies_select_own_or_admin_head" ON custodies;
CREATE POLICY "custodies_select_own_or_admin_head" ON custodies
    FOR SELECT USING (
        user_id = auth.uid()
        OR current_user_role() IN ('admin', 'head')
    );

-- إدراج عهدة: مسموح للمستخدم نفسه (تقديم طلب) أو الإداري والـ head
DROP POLICY IF EXISTS "custodies_insert_user_or_admin_head" ON custodies;
CREATE POLICY "custodies_insert_user_or_admin_head" ON custodies
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        OR current_user_role() IN ('admin', 'head')
    );

-- تحديث: حسب الحالة، يمكن للمستخدم تحديث بعض الحقول، والإداري والـ head كل شيء
-- هنا نأذن للتحديث لكل من له حق الوصول، ويمكن تفصيل لاحقاً
DROP POLICY IF EXISTS "custodies_update_own_or_admin_head" ON custodies;
CREATE POLICY "custodies_update_own_or_admin_head" ON custodies
    FOR UPDATE USING (
        user_id = auth.uid()
        OR current_user_role() IN ('admin', 'head')
    );

-- حذف: فقط للإداري
DROP POLICY IF EXISTS "custodies_delete_admin_only" ON custodies;
CREATE POLICY "custodies_delete_admin_only" ON custodies
    FOR DELETE USING (current_user_role() = 'admin');

-- ----------------------
-- جدول ratings
-- ----------------------
-- أي شخص يمكنه قراءة التقييمات (لنظام الشفافية)، أو يمكن تقييدها
DROP POLICY IF EXISTS "ratings_select_all" ON ratings;
CREATE POLICY "ratings_select_all" ON ratings
    FOR SELECT USING (true);

-- إدراج تقييم: يمكن للمستخدم تقييم غيره (rated_by = auth.uid())
DROP POLICY IF EXISTS "ratings_insert_authenticated" ON ratings;
CREATE POLICY "ratings_insert_authenticated" ON ratings
    FOR INSERT WITH CHECK (rated_by = auth.uid());

-- تحديث: لا يمكن تحديث التقييم بعد إنشائه (يمكن تغيير لاحقاً)
DROP POLICY IF EXISTS "ratings_update_none" ON ratings;
CREATE POLICY "ratings_update_none" ON ratings
    FOR UPDATE USING (false);

-- حذف: فقط للإداري
DROP POLICY IF EXISTS "ratings_delete_admin_only" ON ratings;
CREATE POLICY "ratings_delete_admin_only" ON ratings
    FOR DELETE USING (current_user_role() = 'admin');

-- ----------------------
-- جدول notifications
-- ----------------------
-- المستخدم يرى إشعاراته فقط، الإداري يرى الكل
DROP POLICY IF EXISTS "notifications_select_own_or_admin" ON notifications;
CREATE POLICY "notifications_select_own_or_admin" ON notifications
    FOR SELECT USING (
        user_id = auth.uid()
        OR current_user_role() = 'admin'
    );

-- إدراج: النظام أو الإداري (يمكن توليدها عبر وظائف)
DROP POLICY IF EXISTS "notifications_insert_service_or_admin" ON notifications;
CREATE POLICY "notifications_insert_service_or_admin" ON notifications
    FOR INSERT WITH CHECK (current_user_role() = 'admin');

-- تحديث: يمكن للمستخدم تحديث حالة القراءة فقط
DROP POLICY IF EXISTS "notifications_update_read_own" ON notifications;
CREATE POLICY "notifications_update_read_own" ON notifications
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- حذف: الإداري فقط
DROP POLICY IF EXISTS "notifications_delete_admin_only" ON notifications;
CREATE POLICY "notifications_delete_admin_only" ON notifications
    FOR DELETE USING (current_user_role() = 'admin');

-- ----------------------
-- جدول logs
-- ----------------------
-- الإداري والـ head يمكنهم قراءة السجلات
DROP POLICY IF EXISTS "logs_select_admin_head" ON logs;
CREATE POLICY "logs_select_admin_head" ON logs
    FOR SELECT USING (current_user_role() IN ('admin', 'head'));

-- إدراج: أي مستخدم مصادق يمكنه إضافة سجلات (مثلاً لتسجيل الإجراءات)
DROP POLICY IF EXISTS "logs_insert_authenticated" ON logs;
CREATE POLICY "logs_insert_authenticated" ON logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- لا تحديث أو حذف للسجلات
DROP POLICY IF EXISTS "logs_update_none" ON logs;
CREATE POLICY "logs_update_none" ON logs
    FOR UPDATE USING (false);

DROP POLICY IF EXISTS "logs_delete_none" ON logs;
CREATE POLICY "logs_delete_none" ON logs
    FOR DELETE USING (false);

-- ----------------------
-- جدول branches
-- ----------------------
-- الكل يمكنه قراءة الفروع
DROP POLICY IF EXISTS "branches_select_all" ON branches;
CREATE POLICY "branches_select_all" ON branches
    FOR SELECT USING (true);

-- التعديل فقط للإداري
DROP POLICY IF EXISTS "branches_insert_update_delete_admin" ON branches;
CREATE POLICY "branches_insert_update_delete_admin" ON branches
    FOR ALL USING (current_user_role() = 'admin');

-- ----------------------
-- جدول allowed_employee_ids
-- ----------------------
-- الكل يمكنه القراءة (للتسجيل مثلاً)
DROP POLICY IF EXISTS "allowed_emp_ids_select_all" ON allowed_employee_ids;
CREATE POLICY "allowed_emp_ids_select_all" ON allowed_employee_ids
    FOR SELECT USING (true);

-- الإدارة فقط من يستطيع إدراج أو حذف
DROP POLICY IF EXISTS "allowed_emp_ids_insert_admin" ON allowed_employee_ids;
CREATE POLICY "allowed_emp_ids_insert_admin" ON allowed_employee_ids
    FOR INSERT WITH CHECK (current_user_role() = 'admin');

DROP POLICY IF EXISTS "allowed_emp_ids_delete_admin" ON allowed_employee_ids;
CREATE POLICY "allowed_emp_ids_delete_admin" ON allowed_employee_ids
    FOR DELETE USING (current_user_role() = 'admin');

-- ----------------------
-- جدول settings
-- ----------------------
-- الكل يقرأ الإعدادات (لأنها غير حساسة)
DROP POLICY IF EXISTS "settings_select_all" ON settings;
CREATE POLICY "settings_select_all" ON settings
    FOR SELECT USING (true);

-- التعديل فقط للإداري
-- --- settings: Admin can upsert (INSERT + UPDATE) ---
DROP POLICY IF EXISTS "settings_write_admin" ON settings;
CREATE POLICY "settings_write_admin" ON settings
    FOR INSERT
    WITH CHECK (current_user_role() = 'admin');

DROP POLICY IF EXISTS "settings_update_admin" ON settings;
CREATE POLICY "settings_update_admin" ON settings
    FOR UPDATE
    USING (current_user_role() = 'admin')
    WITH CHECK (current_user_role() = 'admin');

-- allow selecting admin (already allowed for all via settings_select_all)


-- ============================================================
-- 8. إضافة مستخدمين افتراضيين (اختياري)
-- ملاحظة: يجب إنشاء المستخدمين أولاً عبر واجهة Supabase Auth أو API،
-- ثم إدراجهم في جدول users باستخدام المعرفات الناتجة.
-- نقوم بإنشاء دالة لتسهيل إنشاء مستخدم تجريبي (للتطوير فقط)
-- ============================================================

-- هذه الدالة مخصصة للتطوير فقط، تسمح بإنشاء مستخدم في auth.users وربطه تلقائياً.
-- لا تستخدمها في الإنتاج بدون تعديل.
CREATE OR REPLACE FUNCTION create_test_user(
    user_email TEXT,
    user_password TEXT,
    user_name TEXT,
    user_role TEXT,
    user_empid TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- إدراج المستخدم في auth.users (يتطلب أن تكون الدالة تملك الصلاحيات)
    INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
    VALUES (user_email, crypt(user_password, gen_salt('bf')), NOW())
    RETURNING id INTO new_user_id;
    
    -- إدراج البيانات في جدول users
    INSERT INTO users (id, name, email, role, status, empId)
    VALUES (new_user_id, user_name, user_email, user_role, 'approved', user_empid);
    
    RETURN new_user_id;
END;
$$;

-- مثال: لإنشاء مستخدم admin تجريبي (قم بتشغيله يدوياً عند الحاجة)
-- SELECT create_test_user('admin@sajco.com', 'Admin123!', 'محمد اقطيط', 'admin', '1');

-- ============================================================
-- 9. صلاحيات التنفيذ (مهم لـ RLS)
-- تأكد من منح الصلاحيات للمستخدمين العاديين
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
-- ملاحظة: السياسات (Policies) ستحدد بدقة ما يمكن لكل دور فعله.

-- ============================================================
-- انتهى إنشاء قاعدة البيانات بشكل آمن
-- ============================================================