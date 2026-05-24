-- ============================================================
-- SAJCO - Complete Supabase Schema (Production Ready)
-- النسخة الكاملة المُصلحة - تشغّل مرة واحدة في SQL Editor
-- ============================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 2. DROP existing tables (للبدء من جديد بدون تعارض)
-- احذف هذا القسم إذا كان عندك بيانات مهمة
-- ============================================================
DROP TABLE IF EXISTS calibration_certificates CASCADE;
DROP TABLE IF EXISTS allowed_employee_ids CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS custodies CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS branches CASCADE;

-- ============================================================
-- 3. TABLES
-- ============================================================

-- الفروع
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- المستخدمون (emp_id بـ snake_case - هذا الصحيح)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'head', 'surveyor')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('approved', 'pending')),
    emp_id TEXT UNIQUE NOT NULL,
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
    rating NUMERIC(3,1),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- الأجهزة
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    cal_date DATE,
    sent_to_agent_date DATE,
    status TEXT NOT NULL DEFAULT 'warehouse' CHECK (
        status IN ('warehouse','assigned','maintenance','needs_calibration','at_maintenance','at_calibration')
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- العهدة
CREATE TABLE custodies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_type TEXT NOT NULL,
    serial_number TEXT NOT NULL,
    receipt_date DATE NOT NULL,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    calibration_date DATE,
    device_condition TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN (
        'approved','pending_approval','pending_admin_approval',
        'pending_head_approval','rejected'
    )),
    received_from TEXT,
    received_from_name TEXT,
    notes TEXT,
    satisfied BOOLEAN,
    care_level TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    approval_history JSONB DEFAULT '[]',
    transfer_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- شهادات المعايرة (جدول جديد)
CREATE TABLE calibration_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    serial_number TEXT NOT NULL,
    custody_id UUID REFERENCES custodies(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_type TEXT DEFAULT 'application/pdf',
    file_size INTEGER,
    calibration_date DATE,
    expiry_date DATE,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- التقييمات
CREATE TABLE ratings (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rated_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rated_by_name TEXT NOT NULL,
    stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
    answers JSONB NOT NULL DEFAULT '{}',
    notes TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- الإشعارات
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'general' CHECK (
        type IN ('general','warning','info','success','error')
    ),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    related_id TEXT,
    read BOOLEAN DEFAULT FALSE,
    is_substitute_notif BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    action_type TEXT,
    requires_action BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- طلبات الصيانة والمعايرة
CREATE TABLE maintenance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    serial_number TEXT NOT NULL,
    device_type TEXT,
    request_type TEXT NOT NULL CHECK (request_type IN ('maintenance','calibration')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending','approved','rejected','sent_to_agent','returned','completed'
    )),
    requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
    requested_by_name TEXT,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    notes TEXT,
    sent_date DATE,
    return_date DATE,
    new_cal_date DATE,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    approval_history JSONB DEFAULT '[]',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- الرسائل الخاصة (مساح → مدير عام - مخفية عن رئيس المساحين)
CREATE TABLE direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    sender_emp_id TEXT,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    message_type TEXT NOT NULL DEFAULT 'general' CHECK (message_type IN (
        'general','complaint','suggestion','urgent'
    )),
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    admin_reply TEXT,
    replied_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','read','replied','archived')),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- السجلات
CREATE TABLE logs (
    id BIGSERIAL PRIMARY KEY,
    user_name TEXT NOT NULL,
    msg TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- الأرقام الوظيفية المسموحة
CREATE TABLE allowed_employee_ids (
    id BIGSERIAL PRIMARY KEY,
    emp_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- الإعدادات
CREATE TABLE settings (
    id BIGSERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. INDEXES
-- ============================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_emp_id ON users(emp_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_branch_id ON users(branch_id);
CREATE INDEX idx_devices_serial ON devices(serial);
CREATE INDEX idx_devices_owner_id ON devices(owner_id);
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_custodies_user_id ON custodies(user_id);
CREATE INDEX idx_custodies_status ON custodies(status);
CREATE INDEX idx_custodies_branch_id ON custodies(branch_id);
CREATE INDEX idx_calib_certs_serial ON calibration_certificates(serial_number);
CREATE INDEX idx_calib_certs_device_id ON calibration_certificates(device_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_logs_timestamp ON logs(timestamp DESC);

-- ============================================================
-- 5. TRIGGERS - تحديث updated_at تلقائياً
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_branches_updated BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_devices_updated BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_custodies_updated BEFORE UPDATE ON custodies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_maintenance_requests_updated BEFORE UPDATE ON maintenance_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. دوال workflow الموافقات
-- ============================================================
CREATE OR REPLACE FUNCTION _append_approval_history(
    _old JSONB, _actor_role TEXT, _actor_id TEXT,
    _actor_name TEXT, _action TEXT, _result TEXT, _note TEXT
) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE _event JSONB;
BEGIN
    IF _old IS NULL THEN _old := '[]'::jsonb; END IF;
    _event := jsonb_build_object(
        'timestamp', now(), 'actorRole', _actor_role, 'actorId', _actor_id,
        'actorName', _actor_name, 'action', _action, 'result', _result, 'note', _note
    );
    RETURN (_old || jsonb_build_array(_event));
END; $$;

-- ============================================================
-- 7. البيانات الافتراضية
-- ============================================================
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
ON CONFLICT (name) DO NOTHING;

INSERT INTO settings (key, value) VALUES
    ('company_name', '"شركة ساجكو"'),
    ('alert_days', '30'),
    ('alert_sound_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

-- إضافة الأرقام الافتراضية
INSERT INTO allowed_employee_ids (emp_id) VALUES ('1'), ('999') ON CONFLICT DO NOTHING;

-- ============================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE custodies ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE allowed_employee_ids ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- سياسة مفتوحة مؤقتة (للتطوير) - غيّرها للإنتاج
-- استخدم هذه السياسات للتطوير السريع:
CREATE POLICY "allow_all_authenticated" ON branches FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated" ON users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated" ON devices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated" ON custodies FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated" ON calibration_certificates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated" ON ratings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated" ON notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_authenticated" ON logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_read_anon" ON allowed_employee_ids FOR SELECT TO anon USING (true);
CREATE POLICY "allow_all_authenticated" ON allowed_employee_ids FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_read_all" ON settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "allow_write_authenticated" ON settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_authenticated" ON maintenance_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- رسائل خاصة: المساح يرى رسائله فقط، المدير يرى الكل، head لا يرى شيئاً
CREATE POLICY "dm_sender_or_admin" ON direct_messages FOR SELECT TO authenticated
    USING (sender_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "dm_insert_surveyor_admin" ON direct_messages FOR INSERT TO authenticated
    WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('surveyor','admin')));
CREATE POLICY "dm_update_admin" ON direct_messages FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- 9. STORAGE BUCKETS SQL
-- تشغيله في SQL Editor
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('assets', 'assets', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
    ('calibration-certificates', 'calibration-certificates', false, 20971520, 
     ARRAY['application/pdf','image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies
CREATE POLICY "Public assets read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'assets');
CREATE POLICY "Auth users upload assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'assets');
CREATE POLICY "Auth users update assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'assets');
CREATE POLICY "Auth users delete assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'assets');

CREATE POLICY "Auth users read certs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'calibration-certificates');
CREATE POLICY "Auth users upload certs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'calibration-certificates');
CREATE POLICY "Auth users delete certs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'calibration-certificates');

-- ============================================================
-- 10. GRANTS
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON maintenance_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON direct_messages TO authenticated;
GRANT SELECT ON branches, allowed_employee_ids, settings TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
