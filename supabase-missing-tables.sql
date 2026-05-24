-- ============================================================
-- الجداول الناقصة لإضافتها إلى Supabase
-- ============================================================

-- جدول الرسائل الخاصة
CREATE TABLE IF NOT EXISTS direct_messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    sender_name TEXT,
    sender_emp_id TEXT,
    branch_id TEXT,
    message_type TEXT DEFAULT 'general',
    subject TEXT,
    body TEXT,
    is_read BOOLEAN DEFAULT false,
    admin_reply TEXT,
    replied_at TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT,
    updated_at TEXT
);

-- جدول شهادات المعايرة
CREATE TABLE IF NOT EXISTS calibration_certificates (
    id TEXT PRIMARY KEY,
    device_id TEXT,
    serial_number TEXT NOT NULL,
    cal_date TEXT,
    cert_url TEXT,
    file_path TEXT,
    uploaded_by TEXT,
    created_at TEXT,
    updated_at TEXT
);

-- جدول طلبات إجازة العمال
CREATE TABLE IF NOT EXISTS worker_leave_requests (
    id TEXT PRIMARY KEY,
    worker_id TEXT NOT NULL,
    worker_name TEXT,
    branch_id TEXT,
    leave_type TEXT,
    start_date TEXT,
    end_date TEXT,
    days_requested INTEGER,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    approved_days INTEGER,
    rejection_reason TEXT,
    created_at TEXT,
    updated_at TEXT
);

-- جدول طلبات زيادة الراتب
CREATE TABLE IF NOT EXISTS salary_raise_requests (
    id TEXT PRIMARY KEY,
    worker_id TEXT NOT NULL,
    worker_name TEXT,
    current_salary NUMERIC,
    requested_salary NUMERIC,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    approved_by TEXT,
    approved_at TEXT,
    rejection_reason TEXT,
    created_at TEXT,
    updated_at TEXT
);

-- جدول طلبات تغيير الملف الشخصي
CREATE TABLE IF NOT EXISTS profile_change_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT,
    field_name TEXT,
    old_value TEXT,
    new_value TEXT,
    status TEXT DEFAULT 'pending',
    reviewed_by TEXT,
    reviewed_at TEXT,
    rejection_reason TEXT,
    created_at TEXT
);

-- جدول طلبات إعادة تعيين كلمة المرور
CREATE TABLE IF NOT EXISTS password_reset_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT,
    user_email TEXT,
    status TEXT DEFAULT 'pending',
    reviewed_by TEXT,
    reviewed_at TEXT,
    created_at TEXT
);

-- جدول العمال
CREATE TABLE IF NOT EXISTS workers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    nationality TEXT,
    branch_id TEXT,
    position TEXT,
    salary NUMERIC,
    hire_date TEXT,
    status TEXT DEFAULT 'active',
    created_at TEXT,
    updated_at TEXT
);

-- فهارس مقترحة للأداء
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_status ON direct_messages(status);
CREATE INDEX IF NOT EXISTS idx_worker_leaves_worker ON worker_leave_requests(worker_id);
CREATE INDEX IF NOT EXISTS idx_salary_raises_worker ON salary_raise_requests(worker_id);