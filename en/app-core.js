// ============================================================
// app-core.js v5.0 - Supabase-Only Architecture
// Data source: Supabase only — no local caching
// ============================================================
const DB_KEY = "sajco_v2_db";
const APP_VERSION = "4.0";

// Centralized request status constants — prevents typo bugs
const STATUS = Object.freeze({
    PENDING:              'pending',
    PENDING_HEAD:         'pending_head_approval',
    PENDING_ADMIN:        'pending_admin_approval',
    APPROVED:             'approved',
    REJECTED:             'rejected',
    SENT_TO_AGENT:        'sent_to_agent',
    RETURNED:             'returned',
    ACTIVE:               'active',
    INACTIVE:             'inactive',
    DEPARTED:             'departed',
    ON_LEAVE:             'on_leave',
    AVAILABLE:            'available',
    WAREHOUSE:            'warehouse',
    IN_CUSTODY:           'in_custody',
});

// ============================================================
// Theme System — Apple Light / Apple Dark / Classic Green
// ============================================================
function getStoredTheme() {
    return localStorage.getItem('sajco_theme') || 'apple-light';
}
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sajco_theme', theme);
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
}
applyTheme(getStoredTheme());

// ============================================================
// i18n - نظام الترجمة AR / EN
// ============================================================
let currentLang = localStorage.getItem('sajco_lang') || 'en';

const LANG_STRINGS = {
    ar: {
        // Sidebar nav
        nav_home: 'الرئيسية', nav_users: 'Employeeandن andالSurveyorandن',
        nav_warehouse: 'الWarehouse andالأجهزة', nav_branch_devices: 'أجهزة Branch',
        nav_calib_alerts: 'Calibration Alerts', nav_maintenance: 'Maintenance & Calibration',
        nav_branches: 'الفرandع', nav_emp_ids: 'الأرقام الandظيفية',
        nav_ratings: 'Employee Ratings', nav_custody: 'العهدة',
        nav_leave: 'Leave Requests', nav_device_history: 'Device Movement History',
        nav_custody_history: 'Employee Custody History', nav_notifications: 'Notifications',
        nav_logs: 'Activity Logs', nav_settings: 'Settings',
        nav_projects_label: 'Project Management', nav_projects: 'Project Management',
        nav_workers: 'Workers',
        // Roles
        role_admin: 'General Manager', role_head: 'Head Surveyor', role_surveyor: 'Surveyor',
        // Actions
        btn_logout: 'Logout',
        // Dashboard
        dash_title_admin: 'Dashboard General Manager',
        dash_subtitle: 'Here is a summary of system status andresource distribution across branches.',
        stat_branches: 'Total الفرandع', stat_users: 'Total الSurveyorين',
        stat_devices: 'Total الأجهزة', stat_alerts: 'Calibration Alerts',
        stat_pending_cust: 'طلبات عهدة Pendingة', stat_maintenance: 'أجهزة Under Maintenance',
        stat_needs_calib: 'أجهزة تحتاج معايرة', stat_warehouse: 'الأجهزة في الWarehouse',
        stat_active_proj: 'المشاريع الActiveة',
        stat_at_work: 'Surveyorandن على رأس العمل', stat_on_leave: 'Surveyorandن On Leave',
        stat_planning_leave: 'ينandandن الذهاب لLeave',
        // Ticker label
        ticker_label: 'News',
        // Settings
        settings_title: 'System Settings',
        // General
        emp_id: 'Employee ID',
    },
    en: {
        nav_home: 'Dashboard', nav_users: 'Employees & Surveyors',
        nav_warehouse: 'Warehouse & Devices', nav_branch_devices: 'Branch Devices',
        nav_calib_alerts: 'Calibration Alerts', nav_maintenance: 'Maintenance & Calibration',
        nav_branches: 'Branches', nav_emp_ids: 'Employee IDs',
        nav_ratings: 'Employee Ratings', nav_custody: 'Custody',
        nav_leave: 'Leave Requests', nav_device_history: 'Device History',
        nav_custody_history: 'Custody History', nav_notifications: 'Notifications',
        nav_logs: 'Operation Logs', nav_settings: 'Settings',
        nav_projects_label: 'Project Management', nav_projects: 'Project Management',
        nav_workers: 'Workers',
        role_admin: 'General Manager', role_head: 'Head Surveyor', role_surveyor: 'Surveyor',
        btn_logout: 'Sign Out',
        dash_title_admin: 'Admin Dashboard',
        dash_subtitle: 'System overview and resource distribution across branches.',
        stat_branches: 'Total Branches', stat_users: 'Total Surveyors',
        stat_devices: 'Total Devices', stat_alerts: 'Calibration Alerts',
        stat_pending_cust: 'Pending Custody Requests', stat_maintenance: 'Devices Under Maintenance',
        stat_needs_calib: 'Devices Need Calibration', stat_warehouse: 'Devices in Warehouse',
        stat_active_proj: 'Active Projects',
        stat_at_work: 'Surveyors at Work', stat_on_leave: 'Surveyors on Leave',
        stat_planning_leave: 'Planning Leave',
        ticker_label: 'News',
        settings_title: 'System Settings',
        emp_id: 'Employee ID',
    }
};

function t(key) {
    return (LANG_STRINGS[currentLang] || LANG_STRINGS.ar)[key] || (LANG_STRINGS.ar[key] || key);
}

function setAppLang(lang) {
    localStorage.setItem('sajco_lang', lang);
    if (lang === 'ar') {
        const page = location.pathname.split('/en/').pop() || 'index.html';
        location.href = '/' + page + location.hash;
        return;
    }
    currentLang = lang;
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
    renderSidebar();
    applyTranslations();
}

// Auto-redirect to / if user switched back to Arabic
(function() {
    if (localStorage.getItem('sajco_lang') === 'ar') {
        const page = location.pathname.split('/en/').pop() || 'index.html';
        location.replace('/' + page + location.hash);
    }
})();

function applyTranslations() {
    document.querySelectorAll('[data-t]').forEach(el => {
        const val = t(el.getAttribute('data-t'));
        if (val) el.textContent = val;
    });
    document.querySelectorAll('[data-t-placeholder]').forEach(el => {
        const val = t(el.getAttribute('data-t-placeholder'));
        if (val) el.placeholder = val;
    });
    document.querySelectorAll('[data-t-title]').forEach(el => {
        const val = t(el.getAttribute('data-t-title'));
        if (val) el.title = val;
    });
    // Update ticker label
    document.querySelectorAll('.ticker-label').forEach(el => {
        el.innerHTML = `<i class="fa-solid fa-newspaper" style="margin-right:6px;margin-left:6px;"></i> ${t('ticker_label')}`;
    });
}

const initialBranches = [
    { id: 'br_main_office', nameAr: 'فرع المكتب الرئيسي', nameEn: 'Main Office Branch',  serialNumber: 1 },
    { id: 'br_riyadh',      nameAr: 'فرع الرياض',         nameEn: 'Riyadh Branch',        serialNumber: 2 },
    { id: 'br_madinah',     nameAr: 'فرع المدينة',        nameEn: 'Madinah Branch',       serialNumber: 3 },
    { id: 'br_dammam',      nameAr: 'فرع الدمام',         nameEn: 'Dammam Branch',        serialNumber: 4 },
    { id: 'br_qassim',      nameAr: 'فرع القصيم',         nameEn: 'Qassim Branch',        serialNumber: 5 },
    { id: 'br_abha',        nameAr: 'فرع أبها',           nameEn: 'Abha Branch',          serialNumber: 6 },
    { id: 'br_tabuk',       nameAr: 'فرع تبوك',           nameEn: 'Tabuk Branch',         serialNumber: 7 },
    { id: 'br_jeddah',      nameAr: 'فرع جدة',            nameEn: 'Jeddah Branch',        serialNumber: 8 },
    { id: 'br_alliances',   nameAr: 'فرع التحالفات',      nameEn: 'Alliances Branch',     serialNumber: 9 },
];

// English UI: name = nameEn. Sets nameAr/nameEn from legacy name if missing.
function _normalizeBranch(b) {
    if (!b.nameAr) b.nameAr = b.name || '';
    if (!b.nameEn) b.nameEn = b.nameAr;
    b.name = b.nameEn || b.nameAr;
    return b;
}

const defaultDB = {
    users: [
        { id: 'admin_1', name: 'Mohamed Aqtatit', email: 'admin@sajco.com', password: 'admin123', role: 'admin', status: 'approved', empId: '1', substituteId: null, rating: null },
        { id: 'dev_1', name: 'محمandد', email: 'mahmoud@sajco.com', password: 'dev123', role: 'admin', status: 'approved', empId: '999', substituteId: null, rating: null }
    ],
    devices: [], logs: [], branches: initialBranches,
    settings: { logo: null, appImage: null, alertDays: 30, alertSoundEnabled: true, deletedDefaultBranches: [], customDeviceTypes: [] },
    custodies: [], leaveRequests: [], notifications: [], allowedEmployeeIds: [], ratings: [],
    calibrationCerts: [], maintenanceRequests: [], directMessages: [],
    projects: [], newsTicker: [],
    profileChangeRequests: [], passwordResetRequests: [],
    workers: [], workerLeaveRequests: [], workerTransferRequests: [],
    salaryRaiseRequests: [],
    ratingWeights: { q1: 20, q2: 20, q3: 15, q4: 15, q5: 15, q6: 15 },
    _version: APP_VERSION
};

// Always start fresh from defaultDB — data is fetched from Supabase on every load
localStorage.removeItem(DB_KEY);
let db = JSON.parse(JSON.stringify(defaultDB));

// ضمان andجandد الحقandل
['settings','custodies','leaveRequests','notifications','devices','logs','users',
 'allowedEmployeeIds','ratings','calibrationCerts','maintenanceRequests','directMessages','projects'].forEach(k => {
    if (!db[k]) db[k] = defaultDB[k] || [];
});
if (!db.ratingWeights) db.ratingWeights = { q1: 20, q2: 20, q3: 15, q4: 15, q5: 15, q6: 15 };
if (!db.newsTicker) db.newsTicker = [];
if (!db.profileChangeRequests) db.profileChangeRequests = [];
if (!db.passwordResetRequests)  db.passwordResetRequests  = [];
if (!db.workers)                db.workers               = [];
if (!db.workerLeaveRequests)    db.workerLeaveRequests   = [];
if (!db.salaryRaiseRequests)    db.salaryRaiseRequests   = [];
if (!db.settings.deletedDefaultBranches) db.settings.deletedDefaultBranches = [];
if (!db.settings.alertDays) db.settings.alertDays = 30;
if (db.settings.alertSoundEnabled === undefined) db.settings.alertSoundEnabled = true;
if (!db.users.find(u => u.id === 'admin_1')) db.users.unshift(defaultDB.users[0]);
if (!db.users.find(u => u.id === 'dev_1')) db.users.push(defaultDB.users[1]);
// One-time startup deduplication — clean up any duplicate users by id or empId
(function _dedupeUsers() {
    const seenIds = new Set(), seenEmpIds = new Set();
    db.users = db.users.filter(u => {
        if (seenIds.has(u.id)) return false;
        seenIds.add(u.id);
        if (u.empId && seenEmpIds.has(String(u.empId))) return false;
        if (u.empId) seenEmpIds.add(String(u.empId));
        return true;
    });
})();
if (!db.branches || db.branches.length === 0) {
    db.branches = initialBranches.map(b => _normalizeBranch({ ...b }));
} else {
    // Normalize + dedup by id — never re-add defaults; Supabase is source of truth
    let _maxSerial = Math.max(0, ...db.branches.filter(b => b.serialNumber).map(b => b.serialNumber));
    const _bSeen = new Set();
    db.branches = db.branches.filter(b => {
        if (_bSeen.has(b.id)) return false;
        _bSeen.add(b.id);
        if (!b.serialNumber) b.serialNumber = ++_maxSerial;
        _normalizeBranch(b);
        return true;
    });
}

// ============================================================
// Auth
// ============================================================
let currentUser = null;
try {
    const _rawSession = localStorage.getItem('sajco_session');
    if (_rawSession) {
        const _s = JSON.parse(_rawSession);
        const _SESSION_TTL = 8 * 60 * 60 * 1000;
        if (_s.loginTime && (Date.now() - _s.loginTime) > _SESSION_TTL) {
            localStorage.removeItem('sajco_session');
        } else {
            currentUser = _s;
        }
    }
} catch(e) { currentUser = null; }

function checkAuth() {
    if (!currentUser && !window.location.pathname.includes('index.html')) {
        window.location.href = 'index.html';
        return;
    }
    // Only verify Supabase session for migrated users (have authUid)
    if (currentUser?.authUid && supabaseClient) {
        supabaseClient.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                localStorage.removeItem('sajco_session');
                window.location.href = 'index.html';
            }
        }).catch(() => {});
    }
    if (currentUser?.mustChangePassword) {
        document.addEventListener('DOMContentLoaded', _showForceChangePasswordModal);
    }
}

function _safeUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function _showForceChangePasswordModal() {
    if (document.getElementById('forceChangePwOverlay')) return;
    const ov = document.createElement('div');
    ov.id = 'forceChangePwOverlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,.85);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;';
    ov.innerHTML = `
        <div style="background:#fff;border-radius:20px;padding:32px;max-width:420px;width:92%;box-shadow:0 24px 64px rgba(0,0,0,.35);">
            <div style="text-align:center;margin-bottom:20px;">
                <div style="width:64px;height:64px;border-radius:50%;background:#fffbeb;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">
                    <i class="fa-solid fa-lock-open" style="font-size:1.8rem;color:#d97706;"></i>
                </div>
                <h3 style="margin:0 0 6px;color:#0f172a;">تغيير Password Required</h3>
                <p style="color:#64748b;font-size:.88rem;margin:0;">A temporary password was set — you must change it now to continue.</p>
            </div>
            <div class="form-group">
                <label class="form-label">Password الجديدة</label>
                <input type="password" id="forcePwNew" class="form-input" placeholder="At least 6 characters">
            </div>
            <div class="form-group" style="margin-top:10px;">
                <label class="form-label">Confirm Password</label>
                <input type="password" id="forcePwConfirm" class="form-input" placeholder="أعد كتابة Password">
            </div>
            <div id="forcePwError" style="color:#dc2626;font-size:.82rem;margin-top:6px;display:none;"></div>
            <button onclick="window._submitForceChangePw()" class="btn btn-primary" style="margin-top:18px;width:100%;padding:12px;">
                <i class="fa-solid fa-save"></i> Save andتغيير Password
            </button>
        </div>`;
    document.body.appendChild(ov);
}

window._submitForceChangePw = function() {
    const newPw  = document.getElementById('forcePwNew').value.trim();
    const cfmPw  = document.getElementById('forcePwConfirm').value.trim();
    const errEl  = document.getElementById('forcePwError');
    errEl.style.display = 'none';
    if (newPw.length < 6)  { errEl.textContent = 'Password يجب أن تكandن At least 6 characters'; errEl.style.display = 'block'; return; }
    if (newPw !== cfmPw)   { errEl.textContent = 'Passwords do not match'; errEl.style.display = 'block'; return; }
    const user = db.users.find(u => u.id === currentUser.id);
    if (user) {
        user.password = newPw;
        user.mustChangePassword = false;
        currentUser = { ...currentUser, password: newPw, mustChangePassword: false };
        localStorage.setItem('sajco_session', JSON.stringify(currentUser));
        saveDB(true);
        addLog(`قام ${user.name} changed their password`);
        document.getElementById('forceChangePwOverlay').remove();
        _showSyncToast('Done تغيير Password بنجاح', 'success');
    }
};

// ============================================================
// saveDB - Supabase sync only (no local storage)
// ============================================================
const saveDB = async () => {
    db._version = APP_VERSION;
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try { await _syncToSupabase(); }
        catch (err) { console.warn('Supabase sync error:', err.message); }
    }
};

const _isUUID = s => !!s && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

async function _syncToSupabase() {
    if (!supabaseClient) return;

    const userRows = db.users.map(u => {
        const row = {
            name:                  u.name,
            email:                 u.email,
            role:                  u.role,
            status:                u.status || 'pending',
            emp_id:                u.empId,
            phone:                 u.phone        || null,
            nationality:           u.nationality  || null,
            project:               u.project      || null,
            branch_id:             _isUUID(u.branch)            ? u.branch            : null,
            responsible_branch_id: _isUUID(u.responsibleBranch) ? u.responsibleBranch : null,
            head_surveyor:         u.headSurveyor || null,
            total_exp:             u.totalExp     ?? null,
            company_exp:           u.companyExp   ?? null,
            join_date:             u.joinDate     || null,
            substitute_id:         _isUUID(u.substituteId) ? u.substituteId : null,
            rating:                u.rating       ?? null,
            must_change_password:  u.mustChangePassword || false,
            auth_uid:              u.authUid      || null,
        };
        if (_isUUID(u.id)) row.id = u.id;
        return row;
    });

    // Branches: use serial_number as unique key to prevent AR/EN duplicates
    const branchRows = db.branches
        .filter(b => b.serialNumber && b.serialNumber > 0)
        .map(b => {
            const ar = b.nameAr || b.name || '';
            const en = b.nameEn || ar;
            const row = { name: ar, name_ar: ar, name_en: en, serial_number: b.serialNumber };
            if (_isUUID(b.id)) row.id = b.id;
            return row;
        });


    const empIdRows = (db.allowedEmployeeIds || []).map(entry => {
        const { empId, name } = _normalizeAllowedEmpId(entry);
        return { emp_id: String(empId), name: name || '' };
    });

    const workerRows = (db.workers || []).map(w => ({
        id:             w.id,
        name:           w.name,
        emp_id:         w.empId          || null,
        phone:          w.phone          || null,
        email:          w.email          || null,
        nationality:    w.nationality    || null,
        dob:            w.dob            || null,
        residence_id:   w.residenceId    || null,
        branch_id:      _isUUID(w.branchId)   ? w.branchId   : null,
        surveyor_id:    _isUUID(w.surveyorId) ? w.surveyorId : null,
        surveyor_name:  w.surveyorName   || null,
        project_id:     w.projectId      || null,
        status:         w.status         || 'available',
        added_by:       w.addedBy        || null,
        added_at:       w.addedAt        || null,
    }));

    const workerLeaveRows = (db.workerLeaveRequests || []).map(r => ({
        id:                   r.id,
        worker_id:            r.workerId,
        worker_name:          r.workerName          || null,
        worker_emp_id:        r.workerEmpId         || null,
        worker_residence_id:  r.workerResidenceId   || null,
        surveyor_id:          r.surveyorId          || null,
        surveyor_name:        r.surveyorName        || null,
        branch_id:            r.branchId            || null,
        start_date:           r.startDate           || null,
        end_date:             r.endDate             || null,
        days_requested:       r.daysRequested       || null,
        reason:               r.reason              || null,
        status:               r.status              || 'pending_head',
        head_approved_at:     r.headApprovedAt      || null,
        head_approved_by:     r.headApprovedBy      || null,
        admin_approved_at:    r.adminApprovedAt     || null,
        admin_approved_by:    r.adminApprovedBy     || null,
        rejected_by:          r.rejectedBy          || null,
        rejection_reason:     r.rejectionNote       || null,
        departure_date:       r.departureDate       || null,
        return_date:          r.returnDate          || null,
        timestamp:            r.timestamp           || null,
    }));

    const projectRows = (db.projects || []).map(p => ({
        id: p.id, name: p.name, description: p.description || null,
        branch_id: _isUUID(p.branchId) ? p.branchId : null,
        start_date: p.startDate || null, expected_end_date: p.expectedEndDate || null,
        completion_percent: p.completionPercent || 0, status: p.status || 'active',
        surveyor_ids: p.surveyorIds || [], created_by: _isUUID(p.createdBy) ? p.createdBy : null,
        timestamp: p.timestamp || new Date().toISOString(),
    }));

    const pcrRows = (db.profileChangeRequests || [])
        .filter(r => _isUUID(r.userId))
        .map(r => ({
            id: r.id, user_id: r.userId, user_name: r.userName || null,
            user_emp_id: r.userEmpId || null, user_role: r.userRole || null,
            branch_id: _isUUID(r.branchId) ? r.branchId : null,
            head_id: _isUUID(r.headId) ? r.headId : null,
            type: r.type, new_value: r.newValue || null, new_value_display: r.newValueDisplay || null,
            status: r.status, timestamp: r.timestamp || new Date().toISOString(),
        }));

    const srrRows = (db.salaryRaiseRequests || []).map(r => ({
        id: r.id, target_type: r.targetType, target_id: r.targetId || null,
        target_name: r.targetName || null, target_emp_id: r.targetEmpId || null,
        branch_id: _isUUID(r.branchId) ? r.branchId : null,
        surveyor_id: _isUUID(r.surveyorId) ? r.surveyorId : null,
        surveyor_name: r.surveyorName || null,
        head_id: _isUUID(r.headId) ? r.headId : null,
        reason: r.reason || null, status: r.status,
        timestamp: r.timestamp || new Date().toISOString(),
    }));

    const deviceRows = db.devices.map(d => {
        const row = {
            serial:             d.serial,
            type:               d.type,
            owner_id:           _isUUID(d.ownerId) ? d.ownerId : null,
            branch_id:          _isUUID(d.branch)  ? d.branch  : null,
            cal_date:           d.calDate          || null,
            status:             d.status           || 'warehouse',
            sent_to_agent_date: d.sentToAgentDate  || null,
        };
        if (_isUUID(d.id)) row.id = d.id;
        return row;
    });

    const isAdmin = currentUser && currentUser.role === 'admin';
    const ops = [
        (userRows.length && isAdmin) ? supabaseClient.from('users').upsert(userRows, { onConflict: 'emp_id' })                      : null,
        branchRows.length      ? supabaseClient.from('branches').upsert(branchRows, { onConflict: 'serial_number' })               : null,
        empIdRows.length       ? supabaseClient.from('allowed_employee_ids').upsert(empIdRows, { onConflict: 'emp_id' })           : null,
        workerRows.length      ? supabaseClient.from('workers').upsert(workerRows, { onConflict: 'id' })                          : null,
        workerLeaveRows.length ? supabaseClient.from('worker_leave_requests').upsert(workerLeaveRows, { onConflict: 'id' })        : null,
        projectRows.length     ? supabaseClient.from('projects').upsert(projectRows, { onConflict: 'id' })                         : null,
        pcrRows.length         ? supabaseClient.from('profile_change_requests').upsert(pcrRows, { onConflict: 'id' })              : null,
        deviceRows.length      ? supabaseClient.from('devices').upsert(deviceRows, { onConflict: 'serial' })                       : null,
        srrRows.length         ? supabaseClient.from('salary_raise_requests').upsert(srrRows, { onConflict: 'id' })                : null,
        supabaseClient.from('settings').upsert({ key: 'newsTicker', value: JSON.stringify(db.newsTicker || []) }, { onConflict: 'key' }),
    ].filter(Boolean);

    const results = await Promise.allSettled(ops);
    results.forEach((r, i) => {
        if (r.status === 'rejected') console.warn('sync batch[' + i + ']:', r.reason);
        else if (r.value?.error) console.warn('sync batch[' + i + ']:', r.value.error.message);
    });
}


const reloadDB = async () => { await _loadRemoteDB(); };

// ============================================================
// ============================================================
// Auth State Change — auto-logout when Supabase session expires
// ============================================================
(function _initAuthListener() {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) return;
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' && currentUser?.authUid) {
            if (!window.location.pathname.includes('index.html')) {
                localStorage.removeItem('sajco_session');
                window.location.href = 'index.html';
            }
        }
    });
})();

// ============================================================
// Supabase Realtime - Refresh لحظي
// ============================================================
let _realtimeChannel = null;

function initRealtime() {
    if (!supabaseClient || _realtimeChannel) return;
    _realtimeChannel = supabaseClient.channel('app-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser?.id}` },
            (payload) => {
                if (payload.eventType === 'INSERT') {
                    const n = _fromSnakeNotif(payload.new);
                    if (!db.notifications.find(x => x.id === n.id)) {
                        db.notifications.unshift(n);
                        _updateNotificationBadge();
                        _showLiveNotifToast(n);
                        if (db.settings.alertSoundEnabled) _playNotifSound();
                        if (typeof onNewNotification === 'function') onNewNotification(n);
                    }
                } else if (payload.eventType === 'UPDATE') {
                    const idx = db.notifications.findIndex(x => x.id === payload.new.id);
                    if (idx !== -1) { db.notifications[idx].read = payload.new.read; _updateNotificationBadge(); }
                }
            })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_requests' },
            () => { _loadRemoteDB(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'calibration_certificates' },
            () => { _loadRemoteDB(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'custodies' },
            () => { _loadRemoteDB(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' },
            () => { _loadRemoteDB(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' },
            () => { _loadRemoteDB(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profile_change_requests' },
            () => { _loadRemoteDB(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'salary_raise_requests' },
            () => { _loadRemoteDB(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' },
            (payload) => { _applySettingsRow(payload.new); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' },
            () => { _loadRemoteDB(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'branches' },
            () => { _loadRemoteDB(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' },
            () => { _loadRemoteDB(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'allowed_employee_ids' },
            () => { _loadRemoteDB(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'workers' },
            () => { _loadRemoteDB(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'worker_leave_requests' },
            () => { _loadRemoteDB(); })
        .subscribe((status) => {
            if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                _realtimeChannel = null;
                setTimeout(initRealtime, 5000);
            }
        });
}

const _ALLOWED_SETTING_KEYS = new Set(['newsTicker','logo','appImage','alertDays','alertSoundEnabled','customDeviceTypes']);

function _applySettingsRow(row) {
    if (!row || !row.key) return;
    if (!_ALLOWED_SETTING_KEYS.has(row.key)) return;
    try {
        const parsed = JSON.parse(row.value);
        if (parsed === null || parsed === undefined) return;
        if (row.key === 'newsTicker') {
            if (Array.isArray(parsed)) {
                db.newsTicker = parsed;
                if (document.getElementById('newsTicker')) renderNewsTicker();
                if (typeof renderLoginTicker === 'function') renderLoginTicker();
            }
        } else {
            db.settings[row.key] = parsed;
            if (row.key === 'logo' || row.key === 'appImage') injectGlobalAppImage();
        }
    } catch(e) {}
}

// Realtime for login page — subscribe to ALL settings changes
let _loginRealtimeChannel = null;
function _initLoginRealtime() {
    if (typeof supabaseClient === 'undefined' || !supabaseClient || _loginRealtimeChannel) return;
    _loginRealtimeChannel = supabaseClient.channel('login-settings')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' },
            (payload) => { _applySettingsRow(payload.new); })
        .subscribe();
}

function _isSafeUrl(url) {
    if (!url) return false;
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) return true;
    try { return ['http:', 'https:'].includes(new URL(url).protocol); } catch { return false; }
}

function _fromSnakeNotif(row) {
    return {
        id: row.id, userId: row.user_id, message: row.message, type: row.type,
        timestamp: row.timestamp, relatedId: row.related_id, read: row.read,
        isSubstituteNotif: row.is_substitute_notif, actionUrl: row.action_url,
        actionType: row.action_type, requiresAction: row.requires_action
    };
}

// ============================================================
// Notification Badge - شارة عدد Notifications (Apple Style)
// ============================================================
function _updateNotificationBadge() {
    const count = db.notifications.filter(n => n.userId === currentUser?.id && !n.read).length;
    document.querySelectorAll('.notif-badge').forEach(el => {
        el.textContent = count > 0 ? (count > 99 ? '99+' : count) : '';
        el.style.display = count > 0 ? 'flex' : 'none';
    });
    // Refresh العنandان
    if (count > 0) document.title = `(${count}) ${document.title.replace(/^\(\d+\)\s*/, '')}`;
    else document.title = document.title.replace(/^\(\d+\)\s*/, '');
}

function _showLiveNotifToast(notif) {
    const icons = { warning: 'fa-triangle-exclamation', error: 'fa-circle-xmark', success: 'fa-circle-check', info: 'fa-circle-info', general: 'fa-bell' };
    const colors = { warning: '#f59e0b', error: '#ef4444', success: '#16a34a', info: '#3b82f6', general: '#6366f1' };
    const color = colors[notif.type] || colors.general;
    const el = document.createElement('div');
    el.className = 'live-notif-toast';
    el.style.cssText = 'position:fixed;top:20px;left:20px;z-index:99999;background:#fff;border-radius:16px;padding:14px 18px;box-shadow:0 8px 32px rgba(0,0,0,.15);border:1px solid #e2e8f0;min-width:300px;max-width:380px;animation:slideInLeft .35s ease;';

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:12px;';

    const iconWrap = document.createElement('div');
    iconWrap.style.cssText = `width:36px;height:36px;border-radius:50%;background:${color}22;display:flex;align-items:center;justify-content:center;color:${color};flex-shrink:0;`;
    const icon = document.createElement('i');
    icon.className = `fa-solid ${icons[notif.type] || 'fa-bell'}`;
    iconWrap.appendChild(icon);

    const textWrap = document.createElement('div');
    textWrap.style.cssText = 'flex:1;';
    const msgDiv = document.createElement('div');
    msgDiv.style.cssText = 'font-weight:600;font-size:.85rem;color:#1e293b;';
    msgDiv.textContent = notif.message; // textContent — XSS-safe
    const timeDiv = document.createElement('div');
    timeDiv.style.cssText = 'font-size:.75rem;color:#64748b;margin-top:2px;';
    timeDiv.textContent = 'Just now';
    textWrap.appendChild(msgDiv);
    textWrap.appendChild(timeDiv);

    row.appendChild(iconWrap);
    row.appendChild(textWrap);

    if (notif.actionUrl && _isSafeUrl(notif.actionUrl)) {
        const link = document.createElement('a');
        link.href = notif.actionUrl;
        link.style.cssText = `color:${color};font-size:.75rem;font-weight:600;white-space:nowrap;`;
        link.textContent = 'View';
        row.appendChild(link);
    }

    el.appendChild(row);
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity='0'; el.style.transform='translateX(-20px)'; el.style.transition='all .4s'; setTimeout(()=>el.remove(),400); }, 5000);
}

function _playNotifSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
    } catch(e) {}
}

// ============================================================
// Sidebar مع شارة Notifications
// ============================================================
function renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    // Inject hamburger + overlay if not present
    if (!document.getElementById('hamburgerBtn')) {
        const btn = document.createElement('button');
        btn.id = 'hamburgerBtn';
        btn.className = 'hamburger-btn';
        btn.setAttribute('aria-label', 'Menu');
        btn.innerHTML = '<i class="fa-solid fa-bars"></i>';
        btn.onclick = () => { sidebar.classList.toggle('open'); document.getElementById('sidebarOverlay').classList.toggle('open'); };
        document.body.appendChild(btn);

        const overlay = document.createElement('div');
        overlay.id = 'sidebarOverlay';
        overlay.className = 'sidebar-overlay';
        overlay.onclick = () => { sidebar.classList.remove('open'); overlay.classList.remove('open'); };
        document.body.appendChild(overlay);
    }
    const logoSrc = db.settings.logo || '../assets/sajco-logo.svg';
    const isAdmin = currentUser.role === 'admin';
    const isHead = currentUser.role === 'head';
    const isSurveyor = currentUser.role === 'surveyor';
    const unreadCount = db.notifications.filter(n => n.userId === currentUser.id && !n.read).length;
    const badgeHtml = unreadCount > 0 ? `<span class="notif-badge">${unreadCount > 99 ? '99+' : unreadCount}</span>` : '<span class="notif-badge" style="display:none;"></span>';

    const roleLabel = isAdmin ? t('role_admin') : isHead ? t('role_head') : t('role_surveyor');

    sidebar.innerHTML = `
        <div class="brand">
            <div class="brand-logo">
                <img src="${logoSrc}" alt="Logo" style="width:100%;height:100%;object-fit:contain;" onerror="this.style.display='none'">
            </div>
        </div>
        <div class="lang-toggle-wrap">
            <button class="lang-btn-sidebar" onclick="setAppLang('ar')">العربية</button>
            <button class="lang-btn-sidebar active" onclick="setAppLang('en')">English</button>
        </div>
        <div class="theme-switcher-wrap">
            <div class="theme-switcher-label">Theme</div>
            <div class="theme-btn-row">
                <button class="theme-btn ${getStoredTheme()==='apple-light'?'active':''}" data-theme="apple-light" onclick="applyTheme('apple-light')" title="Apple Light">
                    <span class="theme-icon">☀️</span>
                    <span>Light</span>
                </button>
                <button class="theme-btn ${getStoredTheme()==='apple-dark'?'active':''}" data-theme="apple-dark" onclick="applyTheme('apple-dark')" title="Apple Dark">
                    <span class="theme-icon">🌙</span>
                    <span>Dark</span>
                </button>
                <button class="theme-btn ${getStoredTheme()==='green'?'active':''}" data-theme="green" onclick="applyTheme('green')" title="Classic Green">
                    <span class="theme-icon">🌿</span>
                    <span>Green</span>
                </button>
            </div>
        </div>
        <div style="padding:16px;background:var(--hover-bg);border-radius:var(--radius);margin-bottom:16px;border:1px solid var(--border)">
            <div style="font-size:.85rem;font-weight:600;color:var(--text-main)">${currentUser.name}</div>
            <div style="font-size:.7rem;color:var(--text-muted);margin-bottom:4px;">${t('emp_id')}: ${currentUser.empId}</div>
            <div style="font-size:.75rem;color:var(--primary);margin-bottom:12px;">${roleLabel}</div>
            <button onclick="logout()" class="btn btn-ghost" style="width:100%;padding:6px;font-size:.75rem;">
                <i class="fa-solid fa-right-from-bracket"></i> ${t('btn_logout')}
            </button>
            <button onclick="logoutAllDevices()" class="btn btn-ghost" style="width:100%;padding:6px;font-size:.75rem;color:#dc2626;margin-top:4px;border-color:#dc2626;" title="Sign out from all logged-in devices">
                <i class="fa-solid fa-right-from-bracket"></i> Sign Out All Devices
            </button>
        </div>
        <nav>
            <a href="dashboard.html" class="nav-item ${_isActive('dashboard')}">
                <i class="fa-solid fa-chart-pie"></i> ${t('nav_home')}
            </a>
            ${!isSurveyor ? `<a href="users.html" class="nav-item ${_isActive('users')}"><i class="fa-solid fa-user-group"></i> ${t('nav_users')}</a>` : ''}
            ${isAdmin ? `<a href="devices.html" class="nav-item ${_isActive('devices')}"><i class="fa-solid fa-warehouse"></i> ${t('nav_warehouse')}</a>` : ''}
            ${isHead ? `<a href="devices.html" class="nav-item ${_isActive('devices')}"><i class="fa-solid fa-microchip"></i> ${t('nav_branch_devices')}</a>` : ''}
            ${!isSurveyor ? `<a href="calibration-alerts.html" class="nav-item ${_isActive('calibration-alerts')}"><i class="fa-solid fa-triangle-exclamation"></i> ${t('nav_calib_alerts')}</a>` : ''}
            ${!isSurveyor ? `<a href="maintenance.html" class="nav-item ${_isActive('maintenance')}"><i class="fa-solid fa-screwdriver-wrench"></i> ${t('nav_maintenance')}</a>` : ''}
            ${isAdmin ? `<a href="branches.html" class="nav-item ${_isActive('branches')}"><i class="fa-solid fa-building-flag"></i> ${t('nav_branches')}</a>` : ''}
            ${isAdmin ? `<a href="employee-ids.html" class="nav-item ${_isActive('employee-ids')}"><i class="fa-solid fa-id-card"></i> ${t('nav_emp_ids')}</a>` : ''}
            ${!isSurveyor ? `<a href="employee-rating.html" class="nav-item ${_isActive('employee-rating')}"><i class="fa-solid fa-star"></i> ${t('nav_ratings')}</a>` : ''}
            <a href="custody.html" class="nav-item ${_isActive('custody')}"><i class="fa-solid fa-box-archive"></i> ${t('nav_custody')}</a>
            <a href="leave-request.html" class="nav-item ${_isActive('leave-request')}"><i class="fa-solid fa-calendar-minus"></i> ${t('nav_leave')}</a>
            <a href="workers.html" class="nav-item ${_isActive('workers')}"><i class="fa-solid fa-helmet-safety"></i> ${t('nav_workers')}</a>
            <a href="device-history.html" class="nav-item ${_isActive('device-history')}"><i class="fa-solid fa-timeline"></i> ${t('nav_device_history')}</a>
            <a href="user-custody-history.html" class="nav-item ${_isActive('user-custody-history')}"><i class="fa-solid fa-user-clock"></i> ${t('nav_custody_history')}</a>
            <a href="notification-center.html" class="nav-item ${_isActive('notification-center')}" style="position:relative;">
                <i class="fa-solid fa-bell"></i> ${t('nav_notifications')}
                ${badgeHtml}
            </a>
            ${!isSurveyor ? `<a href="logs.html" class="nav-item ${_isActive('logs')}"><i class="fa-solid fa-list-ul"></i> ${t('nav_logs')}</a>` : ''}
            <a href="settings.html" class="nav-item ${_isActive('settings')}"><i class="fa-solid fa-gear"></i> ${t('nav_settings')}</a>

            <div class="nav-section-label">${t('nav_projects_label')}</div>
            <a href="projects.html" class="nav-item nav-item-projects ${_isActive('projects')}">
                <i class="fa-solid fa-diagram-project"></i> ${t('nav_projects')}
            </a>
        </nav>

        <!-- View Mode Switcher -->
        <div style="margin-top:auto;padding-top:16px;border-top:1px solid var(--border);">
            ${document.body.classList.contains('mobile-view')
                ? `<button onclick="switchToDesktop()" class="btn btn-ghost" style="width:100%;font-size:.78rem;padding:8px;justify-content:center;">
                       <i class="fa-solid fa-desktop"></i> ${currentLang==='en-US'?'View سطح المكتب':'Desktop View'}
                   </button>`
                : `<button onclick="switchToMobile()" class="btn btn-ghost" style="width:100%;font-size:.78rem;padding:8px;justify-content:center;">
                       <i class="fa-solid fa-mobile-screen"></i> ${currentLang==='en-US'?'View المandبايل':'Mobile View'}
                   </button>`
            }
        </div>
    `;

    // تشغيل الـ Realtime بعد رسم الـ sidebar
    setTimeout(initRealtime, 500);
    setTimeout(injectPageIcons, 100);
}

// ============================================================
// Page Icon Injection
// ============================================================
const PAGE_ICON_MAP = {
    'dashboard':            { icon: 'fa-chart-pie',            color: 'var(--primary)' },
    'users':                { icon: 'fa-user-group',           color: '#b45309' },
    'devices':              { icon: 'fa-warehouse',            color: '#15803d' },
    'custody':              { icon: 'fa-box-archive',          color: '#7e22ce' },
    'maintenance':          { icon: 'fa-screwdriver-wrench',   color: '#dc2626' },
    'calibration-alerts':   { icon: 'fa-triangle-exclamation', color: '#dc2626' },
    'branches':             { icon: 'fa-building-flag',        color: '#4338ca' },
    'employee-ids':         { icon: 'fa-id-card',              color: '#0369a1' },
    'employee-rating':      { icon: 'fa-star',                 color: '#d97706' },
    'leave-request':        { icon: 'fa-calendar-minus',       color: '#0891b2' },
    'workers':              { icon: 'fa-helmet-safety',        color: '#7c3aed' },
    'device-history':       { icon: 'fa-timeline',             color: '#0f766e' },
    'user-custody-history': { icon: 'fa-user-clock',           color: '#1d4ed8' },
    'notification-center':  { icon: 'fa-bell',                 color: '#dc2626' },
    'logs':                 { icon: 'fa-list-ul',              color: '#64748b' },
    'settings':             { icon: 'fa-gear',                 color: 'var(--primary)' },
    'projects':             { icon: 'fa-diagram-project',      color: '#065f46' },
    'reports':              { icon: 'fa-chart-bar',            color: '#7c3aed' },
    'head-surveyor':        { icon: 'fa-chart-line',           color: 'var(--primary)' },
    'surveyor-dashboard':   { icon: 'fa-user-tie',             color: 'var(--primary)' },
};

function injectPageIcons() {
    const path = location.pathname.toLowerCase() + location.href.toLowerCase();
    for (const [page, meta] of Object.entries(PAGE_ICON_MAP)) {
        if (path.includes(page)) {
            document.querySelectorAll('h2, h3').forEach(el => {
                if (el.querySelector('i.fa-solid, i.fa-regular, i.fa-brands') || !el.textContent.trim()) return;
                if (el.closest('.modal-box, .toast-wrap, .sajco-credit')) return;
                const icon = document.createElement('i');
                icon.className = `fa-solid ${meta.icon}`;
                icon.style.cssText = `color:${meta.color};margin-right:8px;font-size:.9em;`;
                el.insertBefore(icon, el.firstChild);
            });
            break;
        }
    }
}

function _isActive(page) {
    return location.href.toLowerCase().includes(page) ? 'active' : '';
}

async function logout() {
    if (_realtimeChannel && supabaseClient) supabaseClient.removeChannel(_realtimeChannel);
    localStorage.removeItem('sajco_session');
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try { await supabaseClient.auth.signOut(); } catch(e) {}
    }
    window.location.href = 'index.html';
}

async function logoutAllDevices() {
    if (!confirm('You will be signed out from all devices and browsers. Are you sure?')) return;
    if (_realtimeChannel && supabaseClient) supabaseClient.removeChannel(_realtimeChannel);
    localStorage.removeItem('sajco_session');
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try { await supabaseClient.auth.signOut({ scope: 'global' }); } catch(e) {}
    }
    window.location.href = 'index.html';
}

async function clearEmployeeCustody(userId) {
    const user = db.users.find(u => u.id === userId);
    if (!user) return;
    const activeStatuses = ['pending_approval','pending_head_approval','pending_admin_approval','approved','pending_receiver_acceptance','pending_surveyor_acceptance'];
    const activeCustodies = db.custodies.filter(c => c.userId === userId && activeStatuses.includes(c.status));
    if (activeCustodies.length === 0) {
        _showSyncToast(`No active custody for ${user.name}`, 'info');
        return;
    }
    if (!confirm(`${activeCustodies.length} device(s) will be returned to warehouse and ${user.name}'s custody cleared. Confirm?`)) return;
    const promises = [];
    for (const custody of activeCustodies) {
        custody.status = 'transferred_out';
        if (supabaseClient) promises.push(
            supabaseClient.from('custodies').update({ status: 'transferred_out', updated_at: new Date().toISOString() }).eq('id', custody.id)
        );
        const device = db.devices.find(d => d.serial === custody.serialNumber || d.id === custody.deviceId);
        if (device) {
            const wasAtAgent = ['at_maintenance','at_calibration'].includes(device.status);
            device.status = 'warehouse';
            device.ownerId = null;
            if (!wasAtAgent && supabaseClient) promises.push(
                supabaseClient.from('devices').update({ status: 'warehouse', owner_id: null }).eq('id', device.id)
            );
        }
    }
    await Promise.all(promises);
    addNotification(userId, `All your custody devices (${activeCustodies.length}) have been cleared by ${currentUser.name}`, 'warning', null, false, 'custody.html');
    addLog(`Cleared custody of ${user.name} — ${activeCustodies.length} device(s) returned to warehouse`);
    saveDB();
    _showSyncToast(`Cleared ${activeCustodies.length} device(s) from ${user.name}`, 'success');
    if (typeof refreshUserTable === 'function') refreshUserTable();
}

async function clearSurveyorWorkers(userId) {
    const user = db.users.find(u => u.id === userId);
    if (!user) return;
    const assigned = (db.workers || []).filter(w => w.surveyorId === userId);
    if (assigned.length === 0) {
        _showSyncToast(`No workers assigned to ${user.name}`, 'info');
        return;
    }
    if (!confirm(`${assigned.length} worker(s) will be unassigned from ${user.name}. Confirm?`)) return;
    const promises = [];
    for (const w of assigned) {
        w.surveyorId = null;
        w.surveyorName = null;
        if (supabaseClient) promises.push(
            supabaseClient.from('workers').update({ surveyor_id: null, surveyor_name: null, updated_at: new Date().toISOString() }).eq('id', w.id)
        );
    }
    await Promise.all(promises);
    addLog(`Unassigned ${assigned.length} worker(s) from surveyor ${user.name}`);
    saveDB();
    _showSyncToast(`Unassigned ${assigned.length} worker(s) from ${user.name}`, 'success');
    if (typeof refreshUserTable === 'function') refreshUserTable();
}

// ============================================================
// addLog
// ============================================================
function addLog(msg) {
    db.logs.unshift({ id: Date.now(), user: currentUser?.name || 'System', msg });
    if (supabaseClient) {
        supabaseClient.from('logs').insert({ user_name: currentUser?.name || 'System', msg })
            .then(({ error }) => { if (error) console.warn('log:', error.message); });
    }
    saveDB(true);
}

// ============================================================
// Notifications
// ============================================================
function addNotification(userId, message, type = 'general', relatedId = null, isSubstituteNotif = false, actionUrl = null, actionType = null, requiresAction = false) {
    const notif = {
        id: crypto.randomUUID(),
        userId, message, type,
        timestamp: new Date().toISOString(),
        relatedId, read: false, isSubstituteNotif,
        actionUrl, actionType, requiresAction
    };
    db.notifications.push(notif);
    const recipient = db.users.find(u => u.id === userId);
    if (recipient?.role === 'head' && recipient.substituteId && !isSubstituteNotif && recipient.substituteId !== userId) {
        addNotification(recipient.substituteId, `(بديل عن ${recipient.name}): ${message}`, type, relatedId, true, actionUrl, actionType, requiresAction);
    }
    if (supabaseClient) {
        supabaseClient.from('notifications').insert({
            id: notif.id, user_id: userId, message, type, related_id: relatedId,
            read: false, is_substitute_notif: isSubstituteNotif,
            action_url: actionUrl, action_type: actionType, requires_action: requiresAction
        }).then(({ error }) => { if (error) console.warn('notif insert:', error.message); });
    }

    saveDB(true);
    _updateNotificationBadge();
}

function markNotificationAsRead(notifId) {
    const n = db.notifications.find(x => x.id === notifId);
    if (n) {
        n.read = true;
        if (supabaseClient) supabaseClient.from('notifications').update({ read: true }).eq('id', notifId).then(() => {});
        saveDB(true);
        _updateNotificationBadge();
        return true;
    }
    return false;
}

function markAllNotificationsAsRead() {
    let count = 0;
    db.notifications.forEach(n => { if (n.userId === currentUser.id && !n.read) { n.read = true; count++; } });
    if (count > 0) {
        if (supabaseClient) supabaseClient.from('notifications').update({ read: true }).eq('user_id', currentUser.id).eq('read', false).then(() => {});
        saveDB(true);
        _updateNotificationBadge();
        return true;
    }
    return false;
}

function deleteNotification(notifId) {
    const initial = db.notifications.length;
    db.notifications = db.notifications.filter(n => n.id !== notifId);
    if (db.notifications.length < initial) {
        if (supabaseClient) supabaseClient.from('notifications').delete().eq('id', notifId).then(() => {});
        saveDB(true);
        _updateNotificationBadge();
        return true;
    }
    return false;
}

// ============================================================
// Branches
// ============================================================
function addBranch(id, nameAr, nameEn) {
    if (db.branches.some(b => b.id === id)) return false;
    const maxSerial = Math.max(0, ...db.branches.filter(b => b.serialNumber).map(b => b.serialNumber));
    db.branches.push({ id, nameAr, nameEn: nameEn || nameAr, name: nameEn || nameAr, serialNumber: maxSerial + 1 });
    saveDB();
    addLog(`${currentUser.name} added branch: ${nameEn || nameAr}`);
    return true;
}

function updateBranchName(id, nameAr, nameEn) {
    const branch = db.branches.find(b => b.id === id);
    if (!branch) return false;
    const old = branch.nameEn || branch.nameAr || branch.name;
    branch.nameAr = nameAr;
    branch.nameEn = nameEn || nameAr;
    branch.name   = branch.nameEn;
    saveDB();
    addLog(`${currentUser.name} renamed branch from "${old}" to "${branch.nameEn}"`);
    return true;
}

function deleteBranch(id) {
    const idx = db.branches.findIndex(b => b.id === id);
    if (idx === -1) return false;
    const b = db.branches[idx];
    const displayName = b.nameEn || b.nameAr || b.name;
    if (!confirm(`Are you sure you want to permanently delete branch "${displayName}"?`)) return false;
    db.branches.splice(idx, 1);
    db.users.forEach(u => { if (u.responsibleBranch === id) u.responsibleBranch = null; });
    if (initialBranches.some(x => x.id === id) && !db.settings.deletedDefaultBranches.includes(id))
        db.settings.deletedDefaultBranches.push(id);
    saveDB();
    addLog(`${currentUser.name} deleted branch: ${displayName}`);
    return true;
}

function getBranchHead(branchId) {
    return db.users.find(u => u.role === 'head' && u.responsibleBranch === branchId && u.status === 'approved');
}

function formatDate(v) {
    if (!v) return '—';
    return new Date(v).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getBranchName(branchId) {
    const b = db.branches.find(b => b.id === branchId);
    return b ? (b.nameEn || b.nameAr || b.name || null) : null;
}

// ============================================================
// فلترة البيانات حسب صNoحية المستخدم
// ============================================================
function getVisibleDevices() {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return db.devices;
    if (currentUser.role === 'head') {
        // Head Surveyor يرى أجهزة فرعه فقط (ليس الWarehouse)
        return db.devices.filter(d =>
            d.status !== 'warehouse' &&
            (d.branch === currentUser.responsibleBranch ||
             db.users.some(u => u.id === d.ownerId && u.branch === currentUser.responsibleBranch))
        );
    }
    // الSurveyor يرى أجهزته فقط (ليس الWarehouse)
    return db.devices.filter(d => d.ownerId === currentUser.id && d.status !== 'warehouse');
}

function getVisibleUsers() {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return db.users;
    if (currentUser.role === 'head') {
        // Head Surveyor يرى Surveyorي فرعه فقط
        return db.users.filter(u =>
            u.id === currentUser.id ||
            (u.role === 'surveyor' && u.branch === currentUser.responsibleBranch)
        );
    }
    return [currentUser];
}

function getVisibleCustodies() {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return db.custodies;
    if (currentUser.role === 'head') {
        const branchUsers = db.users.filter(u => u.branch === currentUser.responsibleBranch).map(u => u.id);
        branchUsers.push(currentUser.id);
        return db.custodies.filter(c => branchUsers.includes(c.userId) || c.branchId === currentUser.responsibleBranch);
    }
    return db.custodies.filter(c => c.userId === currentUser.id);
}

// ============================================================
// Maintenance Requests - طلبات Maintenance & Calibration
// ============================================================
function sendMaintenanceRequest(deviceId, serial, deviceType, requestType, notes = '') {
    const device = db.devices.find(d => d.id === deviceId);
    if (!device) return { success: false, msg: 'Device not found' };

    const req = {
        id: crypto.randomUUID(),
        deviceId, serialNumber: serial, deviceType,
        requestType,
        status: currentUser.role === 'admin' ? 'approved' : 'pending',
        requestedBy: currentUser.id,
        requestedByName: currentUser.name,
        branchId: device.branch || currentUser.branch || currentUser.responsibleBranch,
        notes,
        approvalHistory: [],
        timestamp: new Date().toISOString()
    };

    if (!db.maintenanceRequests) db.maintenanceRequests = [];
    db.maintenanceRequests.push(req);

    if (req.status === 'approved') {
        device.status = requestType === 'maintenance' ? 'at_maintenance' : 'at_calibration';
        device.sentToAgentDate = new Date().toISOString().split('T')[0];
    } else {
        device.status = requestType === 'maintenance' ? 'maintenance' : 'needs_calibration';
    }

    if (supabaseClient) {
        supabaseClient.from('maintenance_requests').insert({
            id: req.id, serial_number: serial, device_type: deviceType,
            request_type: requestType, status: req.status,
            requested_by: currentUser.id, requested_by_name: currentUser.name,
            branch_id: req.branchId, notes
        }).then(({ error }) => { if (error) console.warn('mr insert:', error.message); });
    }

    saveDB();
    addLog(`طلب ${requestType === 'maintenance' ? 'صيانة' : 'معايرة'} for device ${serial} from ${currentUser.name}`);

    // إشعارات
    const adminId = db.users.find(u => u.role === 'admin')?.id || 'admin_1';
    if (currentUser.role !== 'admin') {
        addNotification(adminId,
            `طلب ${requestType === 'maintenance' ? 'صيانة' : 'معايرة'} for device (${serial}) from ${currentUser.name} - Pending الApprove`,
            'warning', req.id, false, 'maintenance.html', 'maintenance_request', true
        );
    }
    if (currentUser.role === 'surveyor') {
        const head = getBranchHead(device.branch);
        if (head) addNotification(head.id,
            `طلب ${requestType === 'maintenance' ? 'صيانة' : 'معايرة'} for device (${serial}) from الSurveyor ${currentUser.name}`,
            'warning', req.id, false, 'maintenance.html', 'maintenance_request', true
        );
    }
    return { success: true, data: req };
}

function approveMaintenanceRequest(reqId) {
    const req = db.maintenanceRequests?.find(r => r.id === reqId);
    if (!req || currentUser.role !== 'admin') return false;
    req.status = 'sent_to_agent';
    req.approvalHistory.push({ approver: currentUser.name, action: 'approved', timestamp: new Date().toISOString() });
    const device = db.devices.find(d => d.id === req.deviceId || d.serial === req.serialNumber);
    if (device) {
        device.status = req.requestType === 'maintenance' ? 'at_maintenance' : 'at_calibration';
        device.sentToAgentDate = new Date().toISOString().split('T')[0];
    }
    if (supabaseClient) {
        supabaseClient.from('maintenance_requests').update({ status: 'sent_to_agent', approved_by: currentUser.id, approved_at: new Date().toISOString() }).eq('id', reqId).then(() => {});
    }
    saveDB();
    addNotification(req.requestedBy, `Doneت الApprove على طلب ${req.requestType === 'maintenance' ? 'الصيانة' : 'المعايرة'} for device (${req.serialNumber}) andDone Sendه للandكيل.`, 'success', reqId, false, 'maintenance.html');
    addLog(`Request approved: ${req.requestType} for device ${req.serialNumber}`);
    return true;
}

function rejectMaintenanceRequest(reqId, reason = '') {
    const req = db.maintenanceRequests?.find(r => r.id === reqId);
    if (!req || (currentUser.role !== 'admin' && currentUser.role !== 'head')) return false;
    req.status = 'rejected';
    req.approvalHistory.push({ approver: currentUser.name, action: 'rejected', reason, timestamp: new Date().toISOString() });
    if (supabaseClient) {
        supabaseClient.from('maintenance_requests').update({ status: 'rejected' }).eq('id', reqId).then(() => {});
    }
    saveDB();
    addNotification(req.requestedBy, `Done Reject طلب ${req.requestType === 'maintenance' ? 'الصيانة' : 'المعايرة'} for device (${req.serialNumber}).`, 'error', reqId, false, 'maintenance.html');
    addLog(`Done Reject طلب ${req.requestType} for device ${req.serialNumber}`);
    return true;
}

function sendToAgent(id, type, notes = '') {
    const device = db.devices.find(d => d.id === id);
    if (!device) return false;

    const previousOwnerId = device.ownerId || null;
    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const typeLabel = type === 'maintenance' ? 'maintenance' : 'calibration';

    device.status = type === 'maintenance' ? 'at_maintenance' : 'at_calibration';
    device.sentToAgentDate = today;

    let req = (db.maintenanceRequests || []).find(r =>
        (r.deviceId === id || r.serialNumber === device.serial) &&
        (r.status === 'pending' || r.status === 'approved')
    );

    if (req) {
        req.status = 'sent_to_agent';
        req.sentDate = today;
        req.ownerIdBeforeSend = previousOwnerId;
        req.approvalHistory = [...(req.approvalHistory || []),
            { approver: currentUser.name, action: 'sent_to_agent', timestamp: now }];
        if (supabaseClient) {
            supabaseClient.from('maintenance_requests').update({
                status: 'sent_to_agent', sent_date: today,
                owner_id_before_send: previousOwnerId,
                approval_history: req.approvalHistory
            }).eq('id', req.id).then(({ error }) => { if (error) console.warn('sendToAgent req update:', error.message); });
        }
    } else {
        req = {
            id: crypto.randomUUID(), deviceId: id,
            serialNumber: device.serial, deviceType: device.type,
            requestType: type, status: 'sent_to_agent',
            requestedBy: currentUser.id, requestedByName: currentUser.name,
            branchId: device.branch || null, notes,
            sentDate: today, ownerIdBeforeSend: previousOwnerId,
            approvalHistory: [{ approver: currentUser.name, action: 'sent_to_agent', timestamp: now }],
            timestamp: now
        };
        if (!db.maintenanceRequests) db.maintenanceRequests = [];
        db.maintenanceRequests.push(req);
        if (supabaseClient) {
            supabaseClient.from('maintenance_requests').insert({
                id: req.id, device_id: id,
                serial_number: device.serial, device_type: device.type,
                request_type: type, status: 'sent_to_agent',
                requested_by: currentUser.id, requested_by_name: currentUser.name,
                branch_id: req.branchId, notes, sent_date: today,
                owner_id_before_send: previousOwnerId,
                approval_history: req.approvalHistory, timestamp: now
            }).then(({ error }) => { if (error) console.warn('sendToAgent mr insert:', error.message); });
        }
    }

    if (supabaseClient) {
        supabaseClient.from('devices').update({
            status: device.status, sent_to_agent_date: today
        }).eq('id', id).then(({ error }) => { if (error) console.warn('sendToAgent device:', error.message); });
    }

    saveDB(true);
    addLog(`Device ${device.serial} sent to agent (${typeLabel})`);

    const notifMsg = `Device (${getDeviceTypeName(device.type)} — ${device.serial}) has been sent to the agent for ${typeLabel}.`;
    if (previousOwnerId && previousOwnerId !== currentUser.id)
        addNotification(previousOwnerId, notifMsg, 'info', req.id, false, 'maintenance.html');
    const head = getBranchHead(device.branch);
    if (head && head.id !== currentUser.id && head.id !== previousOwnerId)
        addNotification(head.id, notifMsg, 'info', req.id, false, 'maintenance.html');

    return true;
}

// destination: 'same_user' | 'warehouse'
function returnFromAgent(id, newCalDate = null, destination = 'warehouse') {
    const device = db.devices.find(d => d.id === id);
    if (!device) return false;

    const wasCalib = device.status === 'at_calibration';
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    const req = (db.maintenanceRequests || []).find(r =>
        (r.deviceId === id || r.serialNumber === device.serial) &&
        r.status === 'sent_to_agent'
    );

    const previousOwnerId = req?.ownerIdBeforeSend || device.ownerId || null;

    if (destination === 'same_user') {
        device.status = 'assigned';
    } else {
        device.status = 'warehouse';
        device.ownerId = null;
        if (previousOwnerId) {
            const custody = (db.custodies || []).find(c =>
                c.serialNumber === device.serial && c.status === 'approved'
            );
            if (custody) {
                custody.status = 'transferred_out';
                if (supabaseClient)
                    supabaseClient.from('custodies').update({ status: 'transferred_out' })
                        .eq('id', custody.id)
                        .then(({ error }) => { if (error) console.warn('returnFromAgent custody:', error.message); });
            }
        }
    }

    device.sentToAgentDate = null;
    if (newCalDate) device.calDate = newCalDate;

    if (supabaseClient) {
        supabaseClient.from('devices').update({
            status: device.status,
            owner_id: device.ownerId ?? null,
            sent_to_agent_date: null,
            cal_date: device.calDate || null
        }).eq('id', id).then(({ error }) => { if (error) console.warn('returnFromAgent device:', error.message); });
    }

    if (req) {
        req.status = 'completed';
        req.returnDate = today;
        if (newCalDate) req.newCalDate = newCalDate;
        req.approvalHistory = [...(req.approvalHistory || []),
            { approver: currentUser.name, action: 'returned', destination, timestamp: now }];
        if (supabaseClient) {
            supabaseClient.from('maintenance_requests').update({
                status: 'completed', return_date: today,
                new_cal_date: newCalDate || null,
                approval_history: req.approvalHistory
            }).eq('id', req.id).then(({ error }) => { if (error) console.warn('returnFromAgent req:', error.message); });
        }
    }

    saveDB(true);
    addLog(`Device ${device.serial} received from agent${newCalDate ? ` - new cal date: ${newCalDate}` : ''}${destination === 'same_user' ? ' - returned to same employee' : ' - moved to warehouse'}`);

    const typeLabel = wasCalib ? 'calibration' : 'repair';
    const destLabel = destination === 'same_user' ? 'and returned to your custody.' : 'and moved to the warehouse.';
    const calLabel  = newCalDate ? ` New calibration date: ${formatDate(newCalDate)}.` : '';
    const notifMsg  = `Device (${getDeviceTypeName(device.type)} — ${device.serial}) has been received from the agent after completing ${typeLabel} ${destLabel}${calLabel}`;

    if (previousOwnerId)
        addNotification(previousOwnerId, notifMsg, 'success', req?.id || id, false, 'maintenance.html');
    const head = getBranchHead(device.branch);
    if (head && head.id !== previousOwnerId)
        addNotification(head.id, notifMsg, 'success', req?.id || id, false, 'maintenance.html');

    return true;
}

// ============================================================
// Direct Messages - Messages خاصة (Surveyor → General Manager)
// ============================================================
function sendDirectMessage(subject, body, messageType = 'general') {
    if (currentUser.role !== 'surveyor') return { success: false, msg: 'هذه الميزة Availableة للSurveyorين فقط' };
    const msg = {
        id: 'dm_' + Date.now(),
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderEmpId: currentUser.empId,
        branchId: currentUser.branch,
        messageType, subject, body,
        isRead: false, adminReply: null, repliedAt: null,
        status: 'pending',
        timestamp: new Date().toISOString()
    };
    if (!db.directMessages) db.directMessages = [];
    db.directMessages.push(msg);

    if (supabaseClient) {
        supabaseClient.from('direct_messages').insert({
            id: msg.id, sender_id: currentUser.id, sender_name: currentUser.name,
            sender_emp_id: currentUser.empId, branch_id: currentUser.branch,
            message_type: messageType, subject, body, is_read: false, status: 'pending'
        }).then(({ error }) => { if (error) console.warn('dm insert:', error.message); });
    }

    saveDB(true);
    const dmType = messageType === 'complaint' ? 'Complaint' : messageType === 'suggestion' ? 'Suggestion' : messageType === 'urgent' ? 'Urgentة' : 'Message';
    db.users.filter(u => u.role === 'admin').forEach(a =>
        addNotification(a.id,
            `Message ${dmType} from الSurveyor ${currentUser.name} (رقم: ${currentUser.empId})`,
            'warning', msg.id, false, 'dashboard.html#messages', 'direct_message', true));
    addLog(`Send Message خاصة للإدارة from ${currentUser.name}`);
    return { success: true, data: msg };
}

function getMyDirectMessages() {
    if (!db.directMessages) return [];
    if (currentUser.role === 'admin') return db.directMessages;
    if (currentUser.role === 'surveyor') return db.directMessages.filter(m => m.senderId === currentUser.id);
    return []; // head No يرى الMessages الخاصة
}

function replyToDirectMessage(msgId, reply) {
    if (currentUser.role !== 'admin') return false;
    const msg = db.directMessages?.find(m => m.id === msgId);
    if (!msg) return false;
    msg.adminReply = reply;
    msg.repliedAt = new Date().toISOString();
    msg.status = 'replied';
    msg.isRead = true;
    if (supabaseClient) {
        supabaseClient.from('direct_messages').update({ admin_reply: reply, replied_at: msg.repliedAt, status: 'replied', is_read: true }).eq('id', msgId).then(() => {});
    }
    saveDB(true);
    addNotification(msg.senderId, `General Manager Reply على رسالتك: "${msg.subject}"`, 'success', msgId, false, 'surveyor-dashboard.html#messages');
    return true;
}

// ============================================================
// Leave Requests
// ============================================================
function addLeaveRequest(payload) {
    const requester = db.users.find(u => u.id === payload.userId);
    if (!requester) return { success: false, msg: 'Employee not found' };

    if (payload.startDate && payload.endDate) {
        const newStart = new Date(payload.startDate);
        const newEnd   = new Date(payload.endDate);
        const overlap  = db.leaveRequests.find(r =>
            r.userId === payload.userId &&
            !['rejected','cancelled'].includes(r.status) &&
            new Date(r.startDate) <= newEnd &&
            new Date(r.endDate)   >= newStart
        );
        if (overlap) return { success: false, msg: 'A leave request already exists overlapping this period — please choose different dates.' };
    }

    const branchHead = getBranchHead(requester.branch);
    const leaveRequest = {
        id: _safeUUID(),
        userId: requester.id, assignedBy: currentUser.id,
        leaveType: payload.leaveType || 'annual',
        startDate: payload.startDate, endDate: payload.endDate,
        daysRequested: Number(payload.daysRequested || 0),
        reason: payload.reason || '',
        attachmentUrl: payload.attachmentUrl || '',
        signatureImageUrl: payload.signatureImageUrl || '',
        notes: payload.notes || '',
        status: branchHead ? 'pending_head_approval' : 'pending_admin_approval',
        branchId: requester.branch || null,
        timestamp: new Date().toISOString(),
        approvalHistory: []
    };
    if (!leaveRequest.startDate || !leaveRequest.endDate || !leaveRequest.daysRequested)
        return { success: false, msg: 'الرجاء إدخال بيانات الLeave بشكل كامل' };
    db.leaveRequests.push(leaveRequest);
    saveDB();
    _insertLeaveToSupabase(leaveRequest);
    addLog(`طلب Leave للمandظف ${requester.name}`);
    addNotification(requester.id, `Done Send طلب إجازتك بنجاح andPending الOKات.`, 'info', leaveRequest.id);
    if (branchHead) {
        addNotification(branchHead.id, `طلب Leave جديد from ${requester.name} Pending OKتك.`, 'warning', leaveRequest.id, false, 'leave-request.html', 'leave_approval', true);
    } else {
        db.users.filter(u => u.role === 'admin').forEach(a =>
            addNotification(a.id, `طلب Leave from ${requester.name} (None Head Surveyor للفرع).`, 'warning', leaveRequest.id, false, 'leave-request.html', 'leave_approval', true));
    }
    return { success: true, data: leaveRequest };
}

function approveLeaveRequest(leaveId, approverRole, approvedDays = null) {
    const request = db.leaveRequests.find(x => x.id === leaveId);
    if (!request) return false;
    const days = approvedDays ? Number(approvedDays) : request.daysRequested;
    if (approverRole === 'head' && currentUser.role === 'head' && request.status === 'pending_head_approval') {
        // Accept if head is directly responsible for the branch OR is the substitute
        const branchHead = getBranchHead(request.branchId);
        const isDirectResponsible = currentUser.responsibleBranch === request.branchId;
        const isSubstitute = branchHead?.substituteId === currentUser.id;
        if (!isDirectResponsible && !isSubstitute) return false;
        request.status = 'pending_admin_approval';
        request.approvedDaysByHead = days;
        request.approvalHistory.push({ approverName: currentUser.name, approverRole: 'Head Surveyor', decision: 'approved', approvedDays: days, timestamp: new Date().toISOString() });
        saveDB();
        _updateLeaveInSupabase(request);
        const empName = db.users.find(u => u.id === request.userId)?.name || '';
        addLog(`${currentUser.name} andافق على طلب Leave للمandظف ${empName}`);
        addNotification(request.userId, `andافق Head Surveyor على طلب إجازتك لمدة ${days} يandم.`, 'success', request.id);
        db.users.filter(u => u.role === 'admin').forEach(a =>
            addNotification(a.id, `طلب Leave Pending OKتك النهائية from ${empName} (${days} يandم).`, 'warning', request.id, false, 'leave-request.html', 'leave_approval', true));
        return true;
    }
    if (approverRole === 'admin' && currentUser.role === 'admin' && request.status === 'pending_admin_approval') {
        request.status = 'approved';
        request.approvedDaysFinal = days;
        request.approvalHistory.push({ approverName: currentUser.name, approverRole: 'مدير الإدارة', decision: 'approved', approvedDays: days, timestamp: new Date().toISOString() });
        saveDB();
        _updateLeaveInSupabase(request);
        const empName = db.users.find(u => u.id === request.userId)?.name || '';
        addLog(`اعDoneاد Leave للمandظف ${empName}`);
        addNotification(request.userId, `Done اعDoneاد إجازتك نهائياً لمدة ${days} يandم. يُرجى تحديد تاريخ الDepartedة.`, 'success', request.id, false, 'leave-request.html');
        // Schedule reminder on departure date
        if (request.startDate) {
            const head = getBranchHead(request.branchId);
            if (head) addNotification(head.id, `تذكير: مandعد Leave Employee ${empName} هand ${formatDate(request.startDate)}. Please Confirm Departedته.`, 'warning', request.id, false, 'leave-request.html', 'leave_departure', true);
        }
        return true;
    }
    return false;
}

function markLeaveDeparted(leaveId, actualDepartureDate) {
    const request = db.leaveRequests.find(x => x.id === leaveId);
    if (!request || request.status !== 'approved') return false;
    const _activeCustodies = (db.custodies || []).filter(c => c.userId === request.userId && c.status === 'approved');
    if (_activeCustodies.length > 0) {
        window._departureBlockedByCustody = _activeCustodies.map(c => `${getDeviceTypeName(c.deviceType)} (${c.serialNumber})`).join(', ');
        return false;
    }
    window._departureBlockedByCustody = null;
    request.actualDepartureDate = actualDepartureDate || new Date().toISOString().split('T')[0];
    request.isDeparted = true;
    request.departureConfirmedBy = currentUser.id;
    request.departureConfirmedByName = currentUser.name;
    request.approvalHistory.push({ approverName: currentUser.name, approverRole: currentUser.role === 'admin' ? 'مدير الإدارة' : 'Head Surveyor', decision: 'departed', timestamp: new Date().toISOString() });
    saveDB();
    _updateLeaveInSupabase(request);
    const _deptEmpName = db.users.find(u => u.id === request.userId)?.name || '';
    addLog(`Departure confirmed for employee ${_deptEmpName}`);
    const _deptMsg = `Your departure on ${formatDate(request.actualDepartureDate)} has been recorded.`;
    addNotification(request.userId, _deptMsg, 'info', request.id);
    return true;
}

function markLeaveReturned(leaveId, actualReturnDate) {
    const request = db.leaveRequests.find(x => x.id === leaveId);
    if (!request || !request.isDeparted) return false;
    request.actualReturnDate = actualReturnDate || new Date().toISOString().split('T')[0];
    request.isReturned = true;
    request.returnConfirmedBy = currentUser.id;
    request.returnConfirmedByName = currentUser.name;
    request.status = 'completed';
    request.approvalHistory.push({ approverName: currentUser.name, approverRole: currentUser.role === 'admin' ? 'مدير الإدارة' : 'Head Surveyor', decision: 'returned', timestamp: new Date().toISOString() });
    saveDB();
    _updateLeaveInSupabase(request);
    const emp = db.users.find(u => u.id === request.userId);
    addLog(`تسجيل Return Employee ${emp?.name || ''} from الLeave`);
    addNotification(request.userId, `مرحباً بك! Done تسجيل عandدتك بتاريخ ${formatDate(request.actualReturnDate)}.`, 'success', request.id);
    return true;
}

function rejectLeaveRequest(leaveId) {
    const request = db.leaveRequests.find(x => x.id === leaveId);
    if (!request) return false;
    if (currentUser.role !== 'head' && currentUser.role !== 'admin') return false;
    if (currentUser.role === 'head' && request.status !== 'pending_head_approval') return false;
    // Head can only reject requests for their own branch
    if (currentUser.role === 'head' && request.branchId !== currentUser.responsibleBranch) return false;
    if (currentUser.role === 'admin' && request.status !== 'pending_admin_approval' && request.status !== 'pending_head_approval') return false;
    request.status = 'rejected';
    request.approvalHistory.push({ approverName: currentUser.name, approverRole: currentUser.role === 'admin' ? 'مدير الإدارة' : 'Head Surveyor', decision: 'rejected', timestamp: new Date().toISOString() });
    saveDB();
    _updateLeaveInSupabase(request);
    addLog(`Reject طلب Leave للمandظف ${db.users.find(u => u.id === request.userId)?.name || ''}`);
    addNotification(request.userId, `Done Reject طلب إجازتك.`, 'error', request.id);
    return true;
}

// ============================================================
// Supabase sync helpers for custody and leave_requests
// ============================================================
function _custodyToRow(c) {
    const row = {
        device_type:              c.deviceType,
        serial_number:            c.serialNumber,
        receipt_date:             c.receiptDate      || null,
        calibration_date:         c.calibrationDate  || null,
        device_condition:         c.deviceCondition  || '',
        status:                   c.status,
        received_from:            c.receivedFrom     || null,
        received_from_name:       c.receivedFromName || null,
        notes:                    c.notes            || null,
        satisfied:                c.satisfied        ?? null,
        care_level:               c.careLevel        || null,
        timestamp:                c.timestamp        || new Date().toISOString(),
        approval_history:         c.approvalHistory  || [],
        transfer_data:            c.transferData     || null,
        receiver_notes:           c.receiverNotes    || null,
        receiver_device_condition:c.receiverDeviceCondition || null,
        receiver_comment:         c.receiverComment  || null,
    };
    if (_isUUID(c.userId))     row.user_id     = c.userId;
    if (_isUUID(c.assignedBy)) row.assigned_by = c.assignedBy;
    row.branch_id = _isUUID(c.branchId) ? c.branchId : null;
    return row;
}

function _insertCustodyToSupabase(c) {
    if (!supabaseClient || !_isUUID(c.userId) || !_isUUID(c.assignedBy)) return;
    const row = _custodyToRow(c);
    supabaseClient.from('custodies').insert(row).select('id')
        .then(({ data, error }) => {
            if (error) { console.warn('custody insert:', error.message); return; }
            const newId = data?.[0]?.id;
            if (newId && newId !== c.id) {
                c.id = newId;
            }
        });
}

function _updateCustodyInSupabase(c) {
    if (!supabaseClient || !_isUUID(c.id)) return;
    const row = _custodyToRow(c);
    supabaseClient.from('custodies').update(row).eq('id', c.id)
        .then(({ error }) => { if (error) console.warn('custody update:', error.message); });
}

function _leaveToRow(r) {
    const row = {
        user_id:                      _isUUID(r.userId) ? r.userId : undefined,
        user_name:                    db.users.find(u => u.id === r.userId)?.name || '',
        leave_type:                   r.leaveType    || 'annual',
        start_date:                   r.startDate    || null,
        end_date:                     r.endDate      || null,
        requested_days:               r.daysRequested ? Number(r.daysRequested) : null,
        reason:                       r.reason       || null,
        notes:                        r.notes        || null,
        attachment_url:               r.attachmentUrl        || null,
        signature_image_url:          r.signatureImageUrl    || null,
        status:                       r.status,
        approved_days_by_head:        r.approvedDaysByHead  ? Number(r.approvedDaysByHead)  : null,
        approved_days_final:          r.approvedDaysFinal   ? Number(r.approvedDaysFinal)   : null,
        is_departed:                  r.isDeparted  || false,
        is_returned:                  r.isReturned  || false,
        actual_departure_date:        r.actualDepartureDate || null,
        actual_return_date:           r.actualReturnDate    || null,
        departure_confirmed_by_name:  r.departureConfirmedByName || null,
        return_confirmed_by_name:     r.returnConfirmedByName    || null,
        history:                      r.approvalHistory     || [],
        timestamp:                    r.timestamp           || new Date().toISOString(),
    };
    if (!row.user_id) return null;
    if (_isUUID(r.branchId))                row.branch_id               = r.branchId;
    if (_isUUID(r.assignedBy))              row.assigned_by             = r.assignedBy;
    if (_isUUID(r.departureConfirmedBy))    row.departure_confirmed_by  = r.departureConfirmedBy;
    if (_isUUID(r.returnConfirmedBy))       row.return_confirmed_by     = r.returnConfirmedBy;
    return row;
}

function _insertLeaveToSupabase(r) {
    if (!supabaseClient) return;
    const row = _leaveToRow(r);
    if (!row) return;
    supabaseClient.from('leave_requests').insert(row).select('id')
        .then(({ data, error }) => {
            if (error) { console.warn('leave insert:', error.message); return; }
            const newId = data?.[0]?.id;
            if (newId && newId !== r.id) {
                r.id = newId;
            }
        });
}

function _updateLeaveInSupabase(r) {
    if (!supabaseClient || !_isUUID(r.id)) return;
    const row = _leaveToRow(r);
    if (!row) return;
    supabaseClient.from('leave_requests').update(row).eq('id', r.id)
        .then(({ error }) => { if (error) console.warn('leave update:', error.message); });
}

// ============================================================
// Worker Supabase helpers
// ============================================================
function _workerToRow(w) {
    return {
        id:            w.id,
        name:          w.name,
        emp_id:        w.empId         || null,
        phone:         w.phone         || null,
        email:         w.email         || null,
        nationality:   w.nationality   || null,
        dob:           w.dob           || null,
        residence_id:  w.residenceId   || null,
        branch_id:     _isUUID(w.branchId)   ? w.branchId   : null,
        surveyor_id:   _isUUID(w.surveyorId) ? w.surveyorId : null,
        surveyor_name: w.surveyorName  || null,
        project_id:    w.projectId     || null,
        status:        w.status        || 'available',
        added_by:      w.addedBy       || null,
        added_at:      w.addedAt       || null,
        updated_at:    new Date().toISOString(),
    };
}

function _upsertWorkerInSupabase(w) {
    if (!supabaseClient) return;
    supabaseClient.from('workers').upsert(_workerToRow(w), { onConflict: 'id' })
        .then(({ error }) => { if (error) console.warn('worker upsert:', error.message); });
}

function _deleteWorkerInSupabase(id) {
    if (!supabaseClient) return;
    supabaseClient.from('workers').delete().eq('id', id)
        .then(({ error }) => { if (error) console.warn('worker delete:', error.message); });
}

function _upsertWorkerLeaveInSupabase(r) {
    if (!supabaseClient) return;
    supabaseClient.from('worker_leave_requests').upsert({
        id: r.id, worker_id: r.workerId, worker_name: r.workerName || null,
        worker_emp_id: r.workerEmpId || null, worker_residence_id: r.workerResidenceId || null,
        surveyor_id: r.surveyorId || null, surveyor_name: r.surveyorName || null,
        branch_id: r.branchId || null, start_date: r.startDate || null, end_date: r.endDate || null,
        days_requested: r.daysRequested || null, reason: r.reason || null, status: r.status,
        head_approved_at: r.headApprovedAt || null, head_approved_by: r.headApprovedBy || null,
        admin_approved_at: r.adminApprovedAt || null, admin_approved_by: r.adminApprovedBy || null,
        rejected_by: r.rejectedBy || null, rejection_reason: r.rejectionNote || null,
        departure_date: r.departureDate || null, return_date: r.returnDate || null,
        timestamp: r.timestamp || null, updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
        .then(({ error }) => { if (error) console.warn('worker leave upsert:', error.message); });
}

// ============================================================
// Profile Change Request & Salary Raise — Supabase helpers
// ============================================================
function _upsertPCRInSupabase(r) {
    if (!supabaseClient) return;
    const row = {
        id: r.id,
        user_id:           _isUUID(r.userId)   ? r.userId   : null,
        user_name:         r.userName          || null,
        user_emp_id:       r.userEmpId         || null,
        user_role:         r.userRole          || null,
        branch_id:         _isUUID(r.branchId) ? r.branchId : null,
        head_id:           _isUUID(r.headId)   ? r.headId   : null,
        type:              r.type,
        new_value:         r.newValue          || null,
        new_value_display: r.newValueDisplay   || null,
        status:            r.status,
        head_approved_at:  r.headApprovedAt    || null,
        head_approved_by:  r.headApprovedBy    || null,
        admin_approved_at: r.adminApprovedAt   || null,
        admin_approved_by: r.adminApprovedBy   || null,
        rejected_at:       r.rejectedAt        || null,
        rejected_by:       r.rejectedBy        || null,
        rejection_note:    r.rejectionNote     || null,
        timestamp:         r.timestamp         || new Date().toISOString(),
        updated_at:        new Date().toISOString(),
    };
    supabaseClient.from('profile_change_requests').upsert(row, { onConflict: 'id' })
        .then(({ error }) => { if (error) console.warn('pcr upsert:', error.message); });
}

function _upsertSRRInSupabase(r) {
    if (!supabaseClient) return;
    const row = {
        id: r.id,
        target_type:            r.targetType,
        target_id:              r.targetId              || null,
        target_name:            r.targetName            || null,
        target_emp_id:          r.targetEmpId           || null,
        target_residence_id:    r.targetResidenceId     || null,
        target_nationality:     r.targetNationality     || null,
        target_join_date:       r.targetJoinDate        || null,
        target_rating:          r.targetRating          ?? null,
        branch_id:              _isUUID(r.branchId)     ? r.branchId     : null,
        surveyor_id:            _isUUID(r.surveyorId)   ? r.surveyorId   : null,
        surveyor_name:          r.surveyorName          || null,
        head_id:                _isUUID(r.headId)       ? r.headId       : null,
        current_salary:         r.currentSalary         || null,
        requested_raise_amount: r.requestedRaiseAmount  || null,
        raise_percentage:       r.raisePercentage       || null,
        last_raise_date:        r.lastRaiseDate         || null,
        reason:                 r.reason                || null,
        achievements:           r.achievements          || null,
        notes:                  r.notes                 || null,
        status:                 r.status,
        approved_by:            r.approvedBy            || null,
        approved_at:            r.approvedAt            || null,
        rejected_by:            r.rejectedBy            || null,
        rejected_at:            r.rejectedAt            || null,
        rejection_note:         r.rejectionNote         || null,
        timestamp:              r.timestamp             || new Date().toISOString(),
        updated_at:             new Date().toISOString(),
    };
    supabaseClient.from('salary_raise_requests').upsert(row, { onConflict: 'id' })
        .then(({ error }) => { if (error) console.warn('srr upsert:', error.message); });
}

function assignDeviceFromWarehouse(deviceId, userId) {
    const device = db.devices.find(d => d.id === deviceId);
    const user   = db.users.find(u => u.id === userId);
    if (!device || !user) return false;
    if (device.status !== 'warehouse') return false;
    if ((db.custodies || []).find(c => c.serialNumber === device.serial && ['approved', 'pending_surveyor_acceptance'].includes(c.status))) return false;
    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const custody = {
        id: crypto.randomUUID(), userId, assignedBy: currentUser.id,
        deviceType: device.type, serialNumber: device.serial,
        receiptDate: today, calibrationDate: device.calDate || null,
        deviceCondition: 'good', status: 'pending_surveyor_acceptance',
        branchId: user.branch || null, notes: '',
        receivedFrom: 'warehouse', receivedFromName: 'Warehouse',
        satisfied: null, careLevel: null,
        approvalHistory: [{ approverName: currentUser.name, approverRole: 'Admin', decision: 'pending_surveyor_acceptance', timestamp: now }],
        transferData: null, timestamp: now,
    };
    if (!db.custodies) db.custodies = [];
    db.custodies.push(custody);
    if (supabaseClient) {
        const row = _custodyToRow(custody);
        row.id = custody.id;
        supabaseClient.from('custodies').insert(row)
            .then(({ error }) => { if (error) console.warn('assignDeviceFromWarehouse custody:', error.message); });
    }
    addLog(`Device ${device.serial} assigned from warehouse to ${user.name} — pending surveyor acceptance`);
    addNotification(userId, `You have been assigned a ${getDeviceTypeName(device.type)} (${device.serial}) from the warehouse on ${today}. Please review, accept or reject.`, 'warning', custody.id, false, 'custody.html', 'custody_transfer_request', true);
    return true;
}

// ============================================================
// Custody
// ============================================================
function addCustody(userId, deviceType, serialNumber, receiptDate, calibrationDate, deviceCondition, receivedFrom, receivedFromName = null, notes = null, satisfied = null, careLevel = null, branchId = null) {
    if (!currentUser || !currentUser.id) { console.error('addCustody: no logged-in user'); return false; }
    const targetUser = db.users.find(u => u.id === userId);
    if (!targetUser) return false;
    if (currentUser.role === 'surveyor' && currentUser.id !== userId) {
        console.error('addCustody: surveyor cannot add custody for another user'); return false;
    }
    if (!userId || !deviceType || !serialNumber || !receiptDate || !deviceCondition || !receivedFrom) return false;
    const duplicate = db.custodies.find(cu => cu.serialNumber === serialNumber && !['rejected', 'transferred_out', 'returned'].includes(cu.status));
    if (duplicate) { alert('Serial number (' + serialNumber + ') already registered in custody — cannot add the same device twice.'); return false; }
    const resolvedBranch = branchId || targetUser.branch || currentUser.responsibleBranch || currentUser.branch;
    const newCustody = {
        id: _safeUUID(), userId, assignedBy: currentUser.id, deviceType, serialNumber,
        receiptDate, branchId: resolvedBranch,
        calibrationDate, deviceCondition, status: '',
        receivedFrom, receivedFromName, notes, satisfied, careLevel,
        timestamp: new Date().toISOString(), approvalHistory: []
    };
    const notifyAdmins = (msg, relatedId) =>
        db.users.filter(u => u.role === 'admin').forEach(a =>
            addNotification(a.id, msg, 'warning', relatedId, false, 'custody.html', 'custody_approval', true));
    if (currentUser.role === 'admin') {
        if (userId !== currentUser.id) {
            newCustody.status = 'pending_surveyor_acceptance';
            addNotification(userId,
                `A custody for device (${serialNumber}) has been registered in your name. Please review and accept or reject it.`,
                'warning', newCustody.id, false, 'custody.html', 'custody_transfer_request', true);
        } else {
            newCustody.status = 'approved';
        }
    } else if (currentUser.role === 'head') {
        newCustody.status = 'pending_admin_approval';
        notifyAdmins(`طلب عهدة جديد for device (${serialNumber}) from Head Surveyor ${currentUser.name}.`, newCustody.id);
        if (userId !== currentUser.id) addNotification(userId, `Done Add عهدة الجهاز (${serialNumber}) لك Pending Approve المدير.`, 'info');
    } else {
        const head = getBranchHead(resolvedBranch);
        if (head) {
            newCustody.status = 'pending_head_approval';
            addNotification(head.id, `طلب عهدة جديد for device (${serialNumber}) from الSurveyor ${currentUser.name}. Please الReview andالApprove.`, 'warning', newCustody.id, false, 'custody.html', 'custody_approval', true);
        } else {
            newCustody.status = 'pending_admin_approval';
            notifyAdmins(`طلب عهدة جديد for device (${serialNumber}) from الSurveyor ${currentUser.name} (None Head Surveyor لهذا Branch).`, newCustody.id);
        }
        addNotification(userId, `Done Send طلب عهدة الجهاز (${serialNumber}) للReview.`, 'info');
    }
    if (newCustody.status === 'approved') updateDeviceOwner(serialNumber, userId, calibrationDate, resolvedBranch, deviceType, deviceCondition);
    db.custodies.push(newCustody);
    saveDB();
    _insertCustodyToSupabase(newCustody);
    addLog(`تسجيل عهدة ${newCustody.status === 'approved' ? '' : '(Pending الApprove)'} for device ${serialNumber}`);
    return true;
}

function approveCustody(custodyId, approverRole) {
    const c = db.custodies.find(x => x.id === custodyId);
    if (!c) return false;
    const userName = db.users.find(u => u.id === c.userId)?.name || 'مستخدم';
    const reqType = c.transferData ? "نقل عهدة" : "عهدة جديدة";
    const notifyAllAdmins = (msg, relatedId) =>
        db.users.filter(u => u.role === 'admin').forEach(a =>
            addNotification(a.id, msg, 'warning', relatedId, false, 'custody.html', 'custody_approval', true));
    if (approverRole === 'head' && currentUser.role === 'head') {
        // Verify this head is responsible for the custody's branch (or is the substitute)
        const branchHead = getBranchHead(c.branchId);
        const isResponsible = branchHead && (currentUser.id === branchHead.id || (branchHead.substituteId && currentUser.id === branchHead.substituteId));
        // Also accept if head's responsibleBranch matches directly (covers edge cases)
        const directMatch = currentUser.responsibleBranch === c.branchId;
        if (isResponsible || directMatch) {
            c.status = 'pending_admin_approval';
            if (!c.approvalHistory) c.approvalHistory = [];
            c.approvalHistory.push({ approverName: currentUser.name, approverRole: 'Head Surveyor', timestamp: new Date().toISOString() });
            saveDB();
            _updateCustodyInSupabase(c);
            addLog(`Approve Head Surveyor: ${currentUser.name} على ${reqType} for device (${c.serialNumber})`);
            notifyAllAdmins(`Head Surveyor ${currentUser.name} andافق على ${reqType} للمandظف ${userName}. Pending OKتك النهائية.`, c.id);
            return true;
        }
        return false;
    }
    if (approverRole === 'admin' && currentUser.role === 'admin' &&
        (c.status === 'pending_approval' || c.status === 'pending_admin_approval' || c.status === 'pending_head_approval')) {
        if (c.transferData) {
            db.custodies.forEach(cu => {
                if (cu.serialNumber === c.serialNumber && cu.userId === c.transferData.fromUserId && cu.status === 'approved' && cu.id !== c.id) {
                    cu.status = 'transferred_out';
                    _updateCustodyInSupabase(cu);
                }
            });
            const device = db.devices.find(d => d.serial === c.serialNumber);
            if (device) updateDeviceOwner(c.serialNumber, c.userId, device.calDate, c.branchId, c.deviceType, device.status === 'maintenance' ? 'needs_maintenance' : 'good');
            c.status = 'approved';
            addNotification(c.userId, `Custody for device (${c.serialNumber}) has been approved.`, 'success', c.id, false, 'custody.html');
        } else if (c.userId !== c.assignedBy) {
            c.status = 'pending_surveyor_acceptance';
            addNotification(c.userId,
                `Custody for device (${c.serialNumber}) has been approved and is awaiting your confirmation.`,
                'warning', c.id, false, 'custody.html', 'custody_transfer_request', true);
        } else {
            updateDeviceOwner(c.serialNumber, c.userId, c.calibrationDate, c.branchId, c.deviceType, c.deviceCondition);
            c.status = 'approved';
            addNotification(c.userId, `Custody for device (${c.serialNumber}) has been approved.`, 'success', c.id, false, 'custody.html');
        }
        if (!c.approvalHistory) c.approvalHistory = [];
        c.approvalHistory.push({ approverName: currentUser.name, approverRole: 'Admin', timestamp: new Date().toISOString() });
        saveDB();
        _updateCustodyInSupabase(c);
        addLog(`Final approval: ${reqType} for device (${c.serialNumber}) — ${userName}`);
        return true;
    }
    return false;
}

function rejectCustody(custodyId) {
    const c = db.custodies.find(x => x.id === custodyId);
    if (!c) return false;
    const serial = c.serialNumber;
    const userName = db.users.find(u => u.id === c.userId)?.name || '';
    const reqType = c.transferData ? "نقل عهدة" : "عهدة جديدة";
    if (currentUser.role === 'admin' && (c.status === 'pending_approval' || c.status === 'pending_admin_approval' || c.status === 'pending_head_approval')) {
        c.status = 'rejected';
        saveDB();
        _updateCustodyInSupabase(c);
        addLog(`Reject ${reqType} for device (${serial}) للمandظف ${userName}`);
        addNotification(c.userId, `Done Reject طلب ${reqType} for device (${serial}).`, 'error', c.id);
        return true;
    }
    if (currentUser.role === 'head' && c.status === 'pending_head_approval') {
        const branchHead = getBranchHead(c.branchId);
        const isResponsible = branchHead && (currentUser.id === branchHead.id || (branchHead.substituteId && currentUser.id === branchHead.substituteId));
        const directMatch = currentUser.responsibleBranch === c.branchId;
        if (isResponsible || directMatch) {
            c.status = 'rejected';
            saveDB();
            _updateCustodyInSupabase(c);
            addLog(`Reject (Head Surveyor): ${reqType} for device (${serial})`);
            addNotification(c.userId, `Done Reject طلب ${reqType} for device (${serial}) from Head Surveyor.`, 'error', c.id);
            return true;
        }
    }
    return false;
}

// Receiving surveyor accepts the transfer with notes and device condition assessment
function acceptTransferByReceiver(custodyId, notes, deviceCondition, comment, satisfied, careLevel) {
    const c = db.custodies.find(x => x.id === custodyId);
    if (!c || c.status !== 'pending_receiver_acceptance') return false;
    if (c.transferData?.toUserId !== currentUser.id) return false;
    c.receiverNotes = notes || '';
    c.receiverDeviceCondition = deviceCondition || '';
    c.receiverComment = comment || '';
    c.satisfied = satisfied ?? null;
    c.careLevel = careLevel || '';
    c.status = 'pending_admin_approval';
    saveDB();
    _updateCustodyInSupabase(c);
    addLog(`قبل ${currentUser.name} نقل عهدة الجهاز (${c.serialNumber}) andأضاف Notes`);
    addNotification(c.transferData.fromUserId,
        `قبل ${currentUser.name} نقل عهدة الجهاز (${c.serialNumber}). Pending الApprove النهائية.`, 'success', c.id);
    db.users.filter(u => u.role === 'admin').forEach(a =>
        addNotification(a.id,
            `طلب نقل عهدة الجهاز (${c.serialNumber}) from ${c.transferData.fromUserName} to ${currentUser.name} — قُبل from المستلم andPending OKتك.`,
            'warning', c.id, false, 'custody.html', 'custody_approval', true));
    // Notify head surveyor of receiver's branch
    const branchHead = db.users.find(u => u.role === 'head' && u.responsibleBranch === c.branchId && u.status === 'approved');
    if (branchHead && branchHead.id !== currentUser.id) {
        addNotification(branchHead.id,
            `الSurveyor ${currentUser.name} قبل نقل عهدة الجهاز (${c.serialNumber}) andأضاف Notes: "${notes || '—'}" — التقييم: ${deviceCondition || '—'}`,
            'info', c.id, false, 'custody.html');
    }
    return true;
}

// Receiving surveyor rejects the transfer with a reason
function rejectTransferByReceiver(custodyId, reason) {
    const c = db.custodies.find(x => x.id === custodyId);
    if (!c || c.status !== 'pending_receiver_acceptance') return false;
    if (c.transferData?.toUserId !== currentUser.id) return false;
    addLog(`Reject ${currentUser.name} نقل عهدة الجهاز (${c.serialNumber}) — Reason: ${reason}`);
    addNotification(c.transferData.fromUserId,
        `Reject ${currentUser.name} نقل عهدة الجهاز (${c.serialNumber}). Reason: ${reason || 'لم يُذكر سبب'}`,
        'error', c.id);
    addNotification(c.assignedBy,
        `Done Reject نقل عهدة الجهاز (${c.serialNumber}) from قِبل ${currentUser.name}. Reason: ${reason || 'لم يُذكر سبب'}`,
        'error', c.id);
    db.custodies = db.custodies.filter(x => x.id !== custodyId);
    saveDB();
    if (supabaseClient && _isUUID(custodyId)) supabaseClient.from('custodies').delete().eq('id', custodyId).then(() => {});
    return true;
}

function acceptCustodyBySurveyor(custodyId, notes, condition, comment, satisfied, careLevel) {
    const c = db.custodies.find(x => x.id === custodyId);
    if (!c || c.status !== 'pending_surveyor_acceptance') return false;
    if (c.userId !== currentUser.id) return false;
    c.receiverNotes = notes || '';
    c.receiverDeviceCondition = condition || '';
    c.receiverComment = comment || '';
    c.satisfied = satisfied ?? null;
    c.careLevel = careLevel || '';
    c.status = 'approved';
    updateDeviceOwner(c.serialNumber, c.userId, c.calibrationDate, c.branchId, c.deviceType, c.deviceCondition);
    if (!c.approvalHistory) c.approvalHistory = [];
    c.approvalHistory.push({ approverName: currentUser.name, approverRole: 'Receiving Surveyor', decision: 'accepted', timestamp: new Date().toISOString() });
    saveDB();
    _updateCustodyInSupabase(c);
    addLog(`${currentUser.name} accepted custody of device (${c.serialNumber})`);
    addNotification(c.assignedBy, `Surveyor ${currentUser.name} accepted custody of device (${c.serialNumber}).`, 'success', c.id, false, 'custody.html');
    db.users.filter(u => u.role === 'admin').forEach(a =>
        addNotification(a.id, `Surveyor ${currentUser.name} accepted custody of device (${c.serialNumber}).`, 'info', c.id, false, 'custody.html'));
    return true;
}

function rejectCustodyBySurveyor(custodyId, reason) {
    const c = db.custodies.find(x => x.id === custodyId);
    if (!c || c.status !== 'pending_surveyor_acceptance') return false;
    if (c.userId !== currentUser.id) return false;
    addLog(`${currentUser.name} rejected custody of device (${c.serialNumber}) — Reason: ${reason}`);
    addNotification(c.assignedBy, `Surveyor ${currentUser.name} rejected custody of device (${c.serialNumber}). Reason: ${reason || 'Not specified'}`, 'error', c.id, false, 'custody.html');
    db.users.filter(u => u.role === 'admin').forEach(a =>
        addNotification(a.id, `Surveyor ${currentUser.name} rejected custody of device (${c.serialNumber}). Reason: ${reason || 'Not specified'}`, 'error', c.id, false, 'custody.html'));
    db.custodies = db.custodies.filter(x => x.id !== custodyId);
    saveDB();
    if (supabaseClient && _isUUID(custodyId)) supabaseClient.from('custodies').delete().eq('id', custodyId).then(() => {});
    return true;
}

function deleteCustody(custodyId) {
    const c = db.custodies.find(x => x.id === custodyId);
    const initial = db.custodies.length;
    db.custodies = db.custodies.filter(x => x.id !== custodyId);
    if (db.custodies.length < initial) {
        if (supabaseClient && c) supabaseClient.from('custodies').delete().eq('id', custodyId).then(() => {});
        saveDB(true);
        addLog(`Delete عهدة رقم ${custodyId}`);
        return true;
    }
    return false;
}

function updateCustody(custodyId, updates) {
    const idx = db.custodies.findIndex(c => c.id === custodyId);
    if (idx !== -1) {
        db.custodies[idx] = { ...db.custodies[idx], ...updates, timestamp: new Date().toISOString() };
        saveDB();
        addLog(`Refresh العهدة for device (${db.custodies[idx].serialNumber})`);
        return true;
    }
    return false;
}

function initiateTransferRequest(fromEmpId, toEmpId, serialNumber, reason, transferAll = false) {
    const fromUser = db.users.find(u => u.empId === fromEmpId);
    const toUser = db.users.find(u => u.empId === toEmpId);
    if (!fromUser || !toUser) return { success: false, msg: 'الأرقام الandظيفية غير صحيحة' };
    let devicesToTransfer = transferAll ? db.devices.filter(d => d.ownerId === fromUser.id) : [];
    if (!transferAll) {
        const device = db.devices.find(d => d.serial === serialNumber && d.ownerId === fromUser.id);
        if (device) devicesToTransfer = [device];
    }
    if (devicesToTransfer.length === 0) return { success: false, msg: 'None أجهزة مطابقة' };
    const adminId = db.users.find(u => u.role === 'admin')?.id || 'admin_1';
    devicesToTransfer.forEach(device => {
        const rec = {
            id: crypto.randomUUID(),
            userId: toUser.id, assignedBy: currentUser.id, deviceType: device.type,
            serialNumber: device.serial, receiptDate: new Date().toISOString().split('T')[0],
            branchId: toUser.branch, status: 'pending_receiver_acceptance',
            notes: reason,
            transferData: { fromUserId: fromUser.id, fromUserName: fromUser.name, toUserId: toUser.id, toUserName: toUser.name, reason },
            receiverNotes: null, receiverDeviceCondition: null, receiverComment: null,
            timestamp: new Date().toISOString()
        };
        db.custodies.push(rec);
        _insertCustodyToSupabase(rec);
        addLog(`طلب نقل عهدة الجهاز (${device.serial}) from ${fromUser.name} to ${toUser.name}`);
        addNotification(fromUser.id, `Done Send طلب نقل عهدة الجهاز (${device.serial}) fromك to ${toUser.name}.`, 'info', rec.id);
        addNotification(toUser.id,
            `طلب نقل عهدة: الجهاز (${device.type} — S/N: ${device.serial}) from ${fromUser.name}. Please القبandل or الReject مع ذكر Reason.`,
            'warning', rec.id, false, 'custody.html', 'custody_transfer_request', true);
    });
    saveDB();
    return { success: true, msg: 'Transfer request sent for approval' };
}

function transferCustodyToWarehouse(fromEmpId, serialNumber, reason, transferAll = false) {
    const fromUser = db.users.find(u => u.empId === fromEmpId);
    if (!fromUser) return { success: false, msg: 'Employee ID not found' };
    let devicesToTransfer = transferAll ? db.devices.filter(d => d.ownerId === fromUser.id) : [];
    if (!transferAll) {
        const device = db.devices.find(d => d.serial === serialNumber && d.ownerId === fromUser.id);
        if (device) devicesToTransfer = [device];
    }
    if (devicesToTransfer.length === 0) return { success: false, msg: 'No matching devices found in this employee\'s custody' };
    devicesToTransfer.forEach(device => {
        db.custodies.forEach(c => {
            if (c.serialNumber === device.serial && c.userId === fromUser.id && c.status === 'approved') {
                c.status = 'transferred_out';
                _updateCustodyInSupabase(c);
            }
        });
        device.status = 'warehouse';
        device.ownerId = null;
        if (supabaseClient && _isUUID(device.id)) {
            supabaseClient.from('devices').update({ status: 'warehouse', owner_id: null }).eq('id', device.id).then(() => {});
        }
        addLog(`Transferred device (${device.serial}) from ${fromUser.name} to Warehouse. Reason: ${reason || '—'}`);
        addNotification(fromUser.id,
            `Device (${getDeviceTypeName(device.type)} — ${device.serial}) has been transferred from your custody to the Warehouse. Reason: ${reason || '—'}`,
            'warning', null, false, 'custody.html');
    });
    saveDB();
    return { success: true, msg: `${devicesToTransfer.length} device(s) successfully transferred to Warehouse` };
}

function updateDeviceOwner(serialNumber, userId, calibrationDate, branchId, deviceType, deviceCondition) {
    const idx = db.devices.findIndex(d => d.serial === serialNumber);
    let mappedStatus = 'assigned';
    if (deviceCondition === 'needs_maintenance') mappedStatus = 'maintenance';
    if (deviceCondition === 'needs_calibration') mappedStatus = 'needs_calibration';

    const owner = db.users.find(u => u.id === userId);
    const resolvedBranch = branchId || owner?.branch || owner?.responsibleBranch || null;

    const deviceData = { serial: serialNumber, type: deviceType || 'غير محدد', ownerId: userId, branch: resolvedBranch, calDate: calibrationDate, status: mappedStatus };
    if (idx !== -1) {
        db.devices[idx] = { ...db.devices[idx], ...deviceData };
        if (supabaseClient && _isUUID(db.devices[idx].id)) {
            supabaseClient.from('devices').update({
                owner_id:  _isUUID(userId)          ? userId          : null,
                branch_id: _isUUID(resolvedBranch)  ? resolvedBranch  : null,
                status:    mappedStatus,
                cal_date:  calibrationDate || null,
            }).eq('id', db.devices[idx].id).then(({ error }) => {
                if (error) console.warn('updateDeviceOwner sync:', error.message);
            });
        }
    } else {
        db.devices.push({ id: 'dev_' + Date.now(), ...deviceData });
    }
}

// ============================================================
// User Management
// ============================================================
function registerNewUser(userData) {
    const exists = db.users.find(u =>
        u.email === userData.email ||
        String(u.empId) === String(userData.empId) ||
        u.name === userData.name
    );
    if (exists) {
        if (String(exists.empId) === String(userData.empId))
            return { success: false, msg: 'Employee ID مسجل مسبقاً — No يمكن التسجيل بنفس Employee ID.' };
        if (exists.name === userData.name)
            return { success: false, msg: 'اNoسم مسجل مسبقاً — Please استخدام Full Name بشكل مختلف.' };
        return { success: false, msg: 'Email مسجل مسبقاً.' };
    }
    if (!isEmployeeIdAllowed(userData.empId)) return { success: false, msg: 'Employee ID غير مسمandح به.' };
    const role = userData.jobTitle || 'surveyor';
    const status = (role === 'head') ? 'pending' : 'approved';
    const newUser = { id: crypto.randomUUID(), ...userData, role, status, joinDate: userData.joinDate || new Date().toISOString().split('T')[0] };
    db.users.push(newUser);
    saveDB();
    addLog(`تسجيل حساب جديد: ${newUser.name} (${role})`);
    if (status === 'pending') {
        // Notify ALL admin accounts so none of them misses the request
        const admins = db.users.filter(u => u.role === 'admin' && u.id !== newUser.id);
        admins.forEach(admin => {
            addNotification(admin.id,
                `طلب تسجيل جديد لHead Surveyor: ${newUser.name} (Employee ID: ${newUser.empId})`,
                'warning', newUser.id, false, 'users.html', 'user_approval', true
            );
        });
    }
    return { success: true, user: newUser };
}

function approveUser(userId) {
    const user = db.users.find(u => u.id === userId);
    if (user && currentUser.role === 'admin' && user.status === 'pending' && user.role === 'head') {
        user.status = 'approved';
        saveDB();
        addLog(`الApprove على حساب Head Surveyor: ${user.name}`);
        addNotification(user.id, `Doneت الApprove على حسابك بنجاح. يمكنك Just now Login.`, 'success');
        return true;
    }
    return false;
}

function rejectUser(userId) {
    const user = db.users.find(u => u.id === userId);
    if (user && currentUser.role === 'admin' && user.status === 'pending') {
        db.users = db.users.filter(u => u.id !== userId);
        saveDB();
        addLog(`Reject andDelete حساب Head Surveyor: ${user.name}`);
        return true;
    }
    return false;
}

function updateUser(userId, updates) {
    const idx = db.users.findIndex(u => u.id === userId);
    if (idx !== -1) {
        const old = { ...db.users[idx] };
        db.users[idx] = { ...old, ...updates };
        saveDB();
        addLog(`Refresh بيانات Employee: ${old.name}`);
        return true;
    }
    return false;
}

function deleteUser(userId) {
    const user = db.users.find(u => u.id === userId);
    if (user && user.id !== 'admin_1' && user.id !== 'dev_1' && currentUser.role === 'admin') {
        db.users = db.users.filter(u => u.id !== userId);
        db.devices.forEach(d => { if (d.ownerId === userId) { d.ownerId = null; d.status = 'warehouse'; } });
        db.users.forEach(u => { if (u.substituteId === userId) u.substituteId = null; });
        saveDB();
        addLog(`Delete Employee: ${user.name}`);
        return true;
    }
    return false;
}

// ============================================================
// Employee IDs
// ============================================================
// allowedEmployeeIds supports both legacy string format and new object format {empId, name}
function _normalizeAllowedEmpId(entry) {
    if (typeof entry === 'string') return { empId: entry, name: '' };
    return entry;
}

function isEmployeeIdAllowed(empId) {
    const defaultIds = ['1', '999'];
    if (defaultIds.includes(empId)) return true;
    // If the list is empty, allow registration for any ID (as per initial setup guide)
    if (!db.allowedEmployeeIds || db.allowedEmployeeIds.length === 0) return true;
    return db.allowedEmployeeIds.some(e => _normalizeAllowedEmpId(e).empId === empId);
}

function getAllowedEmployeeName(empId) {
    const defaultNames = { '1': 'Mohamed Aqtatit', '999': 'محمandد الشطandرى' };
    if (defaultNames[empId]) return defaultNames[empId];
    const entry = db.allowedEmployeeIds.find(e => _normalizeAllowedEmpId(e).empId === empId);
    return entry ? _normalizeAllowedEmpId(entry).name : '';
}

function addAllowedEmployeeId(empId, name = '') {
    const exists = db.allowedEmployeeIds.some(e => _normalizeAllowedEmpId(e).empId === empId);
    if (!exists) {
        db.allowedEmployeeIds.push({ empId, name });
        if (supabaseClient) supabaseClient.from('allowed_employee_ids').upsert({ emp_id: empId, name }, { onConflict: 'emp_id' }).then(() => {});
        saveDB(true);
        addLog(`Add Employee ID ${empId} للقائمة المسمandحة`);
        return true;
    }
    return false;
}

function updateAllowedEmployeeName(empId, name) {
    const idx = db.allowedEmployeeIds.findIndex(e => _normalizeAllowedEmpId(e).empId === empId);
    if (idx > -1) {
        db.allowedEmployeeIds[idx] = { empId, name };
        if (supabaseClient) supabaseClient.from('allowed_employee_ids').update({ name }).eq('emp_id', empId).then(() => {});
        saveDB(true);
        return true;
    }
    return false;
}

function removeAllowedEmployeeId(empId) {
    const idx = db.allowedEmployeeIds.findIndex(e => _normalizeAllowedEmpId(e).empId === empId);
    if (idx > -1) {
        db.allowedEmployeeIds.splice(idx, 1);
        if (supabaseClient) supabaseClient.from('allowed_employee_ids').delete().eq('emp_id', empId).then(() => {});
        saveDB(true);
        addLog(`Delete Employee ID ${empId} from Menu المسمandحة`);
        return true;
    }
    return false;
}

// ============================================================
// Ratings
// ============================================================
function addOrUpdateRating(userId, ratingData) {
    const idx = db.ratings.findIndex(r => r.userId === userId);
    const rec = { userId, ratedBy: currentUser.id, ratedByName: currentUser.name, stars: ratingData.stars, answers: ratingData.answers, notes: ratingData.notes || '', timestamp: new Date().toISOString() };
    if (idx !== -1) db.ratings[idx] = rec; else db.ratings.push(rec);
    const user = db.users.find(u => u.id === userId);
    if (user) user.rating = ratingData.stars;
    saveDB();
    addNotification(userId, `Done تقييمك from قبل ${currentUser.name}. التقييم: ${ratingData.stars} نجandم`, 'info');
    return true;
}

function getUserRating(userId) { return db.ratings.find(r => r.userId === userId); }
function getAverageRating(userId) { const r = getUserRating(userId); return r ? r.stars : 0; }
function renderStars(rating) {
    if (!rating || rating === 0) return '<span style="color:#94a3b8;">لم يDone التقييم</span>';
    let stars = '';
    for (let i = 1; i <= 5; i++) stars += i <= rating ? '<i class="fa-solid fa-star" style="color:#fbbf24;"></i>' : '<i class="fa-regular fa-star" style="color:#d1d5db;"></i>';
    return stars + ` <span style="color:#64748b;font-size:.85rem;">(${rating}/5)</span>`;
}

// ============================================================
// Calibration Certificates
// ============================================================
function getCalibrationCerts(serialNumber) { return (db.calibrationCerts || []).filter(c => c.serialNumber === serialNumber); }

function addCalibrationCert(certData) {
    const cert = { id: crypto.randomUUID(), ...certData, uploadedBy: currentUser.id, uploadedAt: new Date().toISOString() };
    if (!db.calibrationCerts) db.calibrationCerts = [];
    db.calibrationCerts.push(cert);
    if (supabaseClient) {
        supabaseClient.from('calibration_certificates').insert({
            id: cert.id, serial_number: cert.serialNumber, file_name: cert.fileName,
            file_url: cert.fileUrl, storage_path: cert.storagePath || 'local',
            file_type: cert.fileType, file_size: cert.fileSize,
            calibration_date: cert.calibrationDate, expiry_date: cert.expiryDate,
            uploaded_by: currentUser.id, notes: cert.notes
        }).then(({ error }) => { if (error) console.warn('cert insert:', error.message); });
    }
    saveDB(true);
    addLog(`رفع شهادة معايرة for device ${cert.serialNumber}`);
    return cert;
}

function deleteCalibrationCert(certId) {
    const cert = db.calibrationCerts?.find(c => c.id === certId);
    if (!cert) return false;
    db.calibrationCerts = db.calibrationCerts.filter(c => c.id !== certId);
    if (supabaseClient) {
        if (cert.storagePath && typeof SupabaseStorage !== 'undefined') SupabaseStorage.deleteFile('calibration-certificates', cert.storagePath).then(() => {});
        supabaseClient.from('calibration_certificates').delete().eq('id', certId).then(() => {});
    }
    saveDB(true);
    addLog(`Delete شهادة معايرة for device ${cert.serialNumber}`);
    return true;
}

// ============================================================
// Device Management
// ============================================================
function addDevice(serial, type, calDate, ownerId, status, branchId) {
    if (db.devices.some(d => d.serial === serial)) { alert('الرقم التسلسلي مسجل مسبقاً'); return false; }
    const device = { id: 'dev_' + Date.now(), serial, type, calDate: calDate || null, ownerId: ownerId || null, status: status || 'warehouse', branch: branchId || null };
    db.devices.push(device);
    saveDB();
    addLog(`Add جهاز جديد: ${serial} (${type})`);
    return true;
}

function updateDevice(id, updates) {
    const idx = db.devices.findIndex(d => d.id === id);
    if (idx !== -1) {
        db.devices[idx] = { ...db.devices[idx], ...updates };
        if (supabaseClient) {
            const d = db.devices[idx];
            supabaseClient.from('devices').update({ serial: d.serial, type: d.type, owner_id: d.ownerId, branch_id: d.branch, cal_date: d.calDate, status: d.status, sent_to_agent_date: d.sentToAgentDate }).eq('id', id).then(({ error }) => { if (error) console.warn('update device:', error.message); });
        }
        saveDB(true);
        addLog(`Refresh الجهاز ${db.devices[idx].serial}`);
        return true;
    }
    return false;
}

function deleteDevice(id) {
    const device = db.devices.find(d => d.id === id);
    if (!device || currentUser.role !== 'admin') return false;
    db.devices = db.devices.filter(d => d.id !== id);
    if (supabaseClient) supabaseClient.from('devices').delete().eq('id', id).then(() => {});
    saveDB(true);
    addLog(`Delete الجهاز ${device.serial}`);
    return true;
}

// ============================================================
// Substitute
// ============================================================
function assignSubstitute(headId, substituteId) {
    const head = db.users.find(u => u.id === headId);
    const sub = db.users.find(u => u.id === substituteId);
    if (!head || head.role !== 'head') return { success: false, msg: 'Employee ليس Head Surveyor.' };
    if (!sub || (sub.role !== 'head' && sub.role !== 'admin')) return { success: false, msg: 'البديل يجب أن يكandن Head Surveyor or مدير.' };
    if (headId === substituteId) return { success: false, msg: 'No يمكن تعيين نفسه بديNoً.' };
    head.substituteId = substituteId;
    saveDB();
    addLog(`تعيين ${sub.name} كبديل لـ ${head.name}`);
    addNotification(head.id, `Done تعيين ${sub.name} كبديل لك.`, 'info');
    addNotification(sub.id, `Done تعيينك كبديل لHead Surveyor ${head.name}.`, 'info');
    return { success: true, msg: 'Done تعيين البديل بنجاح.' };
}

function removeSubstitute(headId) {
    const head = db.users.find(u => u.id === headId);
    if (!head || head.role !== 'head' || !head.substituteId) return { success: false, msg: 'None بديل.' };
    head.substituteId = null;
    saveDB();
    addLog(`Cancel تعيين البديل لـ ${head.name}`);
    return { success: true, msg: 'Done Cancel تعيين البديل.' };
}

// ============================================================
// Projects - Project Management
// ============================================================
function addProject(data) {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'head')) return { success: false, msg: 'غير مصرح' };
    const branchId = currentUser.role === 'head' ? currentUser.responsibleBranch : (data.branchId || null);
    const project = {
        id: 'proj_' + Date.now(),
        name: data.name,
        description: data.description || '',
        branchId,
        startDate: data.startDate || new Date().toISOString().split('T')[0],
        expectedEndDate: data.expectedEndDate || null,
        completionPercent: Number(data.completionPercent || 0),
        status: data.status || 'active',
        surveyorIds: data.surveyorIds || [],
        createdBy: currentUser.id,
        timestamp: new Date().toISOString()
    };
    db.projects.push(project);
    saveDB(true);
    addLog(`إنشاء مشرandع جديد: ${project.name}`);
    if (supabaseClient) {
        supabaseClient.from('projects').insert({ id: project.id, name: project.name, description: project.description, branch_id: project.branchId, start_date: project.startDate, expected_end_date: project.expectedEndDate, completion_percent: project.completionPercent, status: project.status, surveyor_ids: project.surveyorIds, created_by: project.createdBy }).then(({ error }) => { if (error) console.warn('project insert:', error.message); });
    }
    return { success: true, data: project };
}

function updateProject(projectId, updates) {
    const idx = db.projects.findIndex(p => p.id === projectId);
    if (idx === -1) return false;
    const proj = db.projects[idx];
    if (currentUser.role === 'head' && proj.branchId !== currentUser.responsibleBranch) return false;
    db.projects[idx] = { ...proj, ...updates, id: projectId };
    saveDB(true);
    addLog(`Refresh Project: ${db.projects[idx].name}`);
    if (supabaseClient) {
        supabaseClient.from('projects').update({ name: updates.name, description: updates.description, expected_end_date: updates.expectedEndDate, completion_percent: updates.completionPercent, status: updates.status, surveyor_ids: db.projects[idx].surveyorIds }).eq('id', projectId).then(({ error }) => { if (error) console.warn('project update:', error.message); });
    }
    return true;
}

function deleteProject(projectId) {
    const proj = db.projects.find(p => p.id === projectId);
    if (!proj) return false;
    if (currentUser.role === 'head' && proj.branchId !== currentUser.responsibleBranch) return false;
    db.projects = db.projects.filter(p => p.id !== projectId);
    saveDB(true);
    addLog(`Delete Project: ${proj.name}`);
    if (supabaseClient) supabaseClient.from('projects').delete().eq('id', projectId).then(() => {});
    return true;
}

function addSurveyorToProject(projectId, surveyorId) {
    const proj = db.projects.find(p => p.id === projectId);
    if (!proj) return false;
    if (!proj.surveyorIds) proj.surveyorIds = [];
    if (proj.surveyorIds.includes(surveyorId)) return false;
    // Remove surveyor from any other project in same branch
    db.projects.forEach(p => {
        if (p.id !== projectId && p.branchId === proj.branchId && p.surveyorIds)
            p.surveyorIds = p.surveyorIds.filter(id => id !== surveyorId);
    });
    proj.surveyorIds.push(surveyorId);
    saveDB(true);
    addLog(`Add Surveyor ${db.users.find(u => u.id === surveyorId)?.name || ''} للمشرandع ${proj.name}`);
    return true;
}

function removeSurveyorFromProject(projectId, surveyorId) {
    const proj = db.projects.find(p => p.id === projectId);
    if (!proj || !proj.surveyorIds) return false;
    proj.surveyorIds = proj.surveyorIds.filter(id => id !== surveyorId);
    saveDB(true);
    return true;
}

function transferSurveyorToProject(surveyorId, targetProjectId) {
    const targetProj = db.projects.find(p => p.id === targetProjectId);
    if (!targetProj) return false;
    db.projects.forEach(p => {
        if (p.id !== targetProjectId && p.surveyorIds)
            p.surveyorIds = p.surveyorIds.filter(id => id !== surveyorId);
    });
    if (!targetProj.surveyorIds) targetProj.surveyorIds = [];
    if (!targetProj.surveyorIds.includes(surveyorId)) targetProj.surveyorIds.push(surveyorId);
    saveDB(true);
    const survName = db.users.find(u => u.id === surveyorId)?.name || '';
    addLog(`نقل الSurveyor ${survName} to مشرandع ${targetProj.name}`);
    return true;
}

function getVisibleProjects() {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return db.projects;
    if (currentUser.role === 'head') return db.projects.filter(p => p.branchId === currentUser.responsibleBranch);
    // Surveyor sees only their project
    return db.projects.filter(p => p.surveyorIds && p.surveyorIds.includes(currentUser.id));
}

function getSurveyorProject(surveyorId) {
    return db.projects.find(p => p.surveyorIds && p.surveyorIds.includes(surveyorId)) || null;
}

function getProjectDeviceCount(projectId) {
    const proj = db.projects.find(p => p.id === projectId);
    if (!proj || !proj.surveyorIds) return 0;
    return db.devices.filter(d => proj.surveyorIds.includes(d.ownerId) && d.status !== 'warehouse').length;
}

// ============================================================
// Helper Functions
// ============================================================
const _defaultDeviceTypes = [
    { value: 'total_station', label: 'محطة متكاملة (Total Station)' },
    { value: 'auto_level',    label: 'ميزان Surveyorي (Auto Level)' },
    { value: 'gps',           label: 'جهاز تحديد المandاقع (GPS)' },
];

function getDeviceTypeName(type) {
    const all = [..._defaultDeviceTypes, ...(db.settings.customDeviceTypes || [])];
    const found = all.find(t => t.value === type);
    return found ? found.label : (type || '—');
}

function getAllDeviceTypes() {
    return [..._defaultDeviceTypes, ...(db.settings.customDeviceTypes || [])];
}

function addCustomDeviceType(label) {
    if (!label || currentUser?.role !== 'admin') return false;
    if (!db.settings.customDeviceTypes) db.settings.customDeviceTypes = [];
    const value = 'custom_' + Date.now();
    db.settings.customDeviceTypes.push({ value, label });
    saveDB(true);
    _syncCustomDeviceTypes();
    return value;
}

function removeCustomDeviceType(value) {
    if (currentUser?.role !== 'admin') return;
    db.settings.customDeviceTypes = (db.settings.customDeviceTypes || []).filter(t => t.value !== value);
    saveDB(true);
    _syncCustomDeviceTypes();
}

async function _syncCustomDeviceTypes() {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) return;
    await supabaseClient.from('settings').upsert(
        { key: 'customDeviceTypes', value: JSON.stringify(db.settings.customDeviceTypes || []) },
        { onConflict: 'key' }
    );
}

function getStatusBadge(condition) {
    const map = { good: '<span class="badge badge-success">سليم</span>', needs_maintenance: '<span class="badge badge-danger">يحتاج صيانة</span>', needs_calibration: '<span class="badge badge-warning">Needs Calibration</span>' };
    return map[condition] || `<span class="badge">${condition || '—'}</span>`;
}

function getDeviceStatusBadge(status) {
    const map = {
        warehouse: '<span class="badge">Warehouse</span>',
        assigned: '<span class="badge badge-success">عهدة</span>',
        maintenance: '<span class="badge badge-danger">صيانة</span>',
        needs_calibration: '<span class="badge badge-warning">Needs Calibration</span>',
        at_maintenance: '<span class="badge badge-info">عند الandكيل - صيانة</span>',
        at_calibration: '<span class="badge badge-info">عند الandكيل - معايرة</span>'
    };
    return map[status] || `<span class="badge">${status || '—'}</span>`;
}

function getCustodyStatusBadge(status) {
    const map = {
        approved: '<span class="badge badge-success">Approvedة</span>',
        pending_approval: '<span class="badge badge-warning">انتظار</span>',
        pending_admin_approval: '<span class="badge badge-warning">انتظار مدير</span>',
        pending_head_approval: '<span class="badge badge-warning">انتظار رئيس</span>',
        rejected: '<span class="badge badge-danger">Rejectedة</span>'
    };
    return map[status] || `<span class="badge">${status || '—'}</span>`;
}

function getLeaveStatusBadge(status) {
    const map = {
        approved: '<span class="badge badge-success">Approvedة</span>',
        pending_head_approval: '<span class="badge badge-warning">Pending Head Surveyor</span>',
        pending_admin_approval: '<span class="badge badge-warning">Pending General Manager</span>',
        rejected: '<span class="badge badge-danger">Rejectedة</span>',
        completed: '<span class="badge badge-success">Completedة</span>'
    };
    return map[status] || `<span class="badge">${status || '—'}</span>`;
}

function getReceivedFromText(from, name) {
    if (from === 'warehouse') return 'الWarehouse';
    if (from === 'another_person') return `شخص آخر: ${name || ''}`;
    return from || '—';
}

// ============================================================
// Leave Status Helpers - حالة الإجازات
// ============================================================
function getSurveyorsOnLeave() {
    const onLeaveIds = new Set();
    (db.leaveRequests || []).forEach(r => {
        if (r.isDeparted && !r.isReturned) onLeaveIds.add(r.userId);
    });
    return db.users.filter(u => u.role === 'surveyor' && onLeaveIds.has(u.id));
}

function getSurveyorsPlanningLeave() {
    const onLeaveIds = new Set(getSurveyorsOnLeave().map(u => u.id));
    const planningIds = new Set();
    (db.leaveRequests || []).forEach(r => {
        if (!r.isDeparted && !onLeaveIds.has(r.userId) &&
            (r.status === 'approved' || r.status === 'pending_admin_approval' || r.status === 'pending_head_approval'))
            planningIds.add(r.userId);
    });
    return db.users.filter(u => u.role === 'surveyor' && u.status === 'approved' && planningIds.has(u.id));
}

function getSurveyorsAtWork() {
    const onLeave = new Set(getSurveyorsOnLeave().map(u => u.id));
    const planning = new Set(getSurveyorsPlanningLeave().map(u => u.id));
    return db.users.filter(u => u.role === 'surveyor' && u.status === 'approved' && !onLeave.has(u.id) && !planning.has(u.id));
}

// ============================================================
// News Ticker - شريط الNews
// ============================================================
const _tickerSeps = [
    '<span class="ticker-sep">✦ 🌟 ✦</span>',
    '<span class="ticker-sep">◈ ⭐ ◈</span>',
    '<span class="ticker-sep">❋ 💫 ❋</span>',
    '<span class="ticker-sep">◆ ✨ ◆</span>',
    '<span class="ticker-sep">★ 🔆 ★</span>',
    '<span class="ticker-sep">⬡ 🌠 ⬡</span>',
];

function _buildTickerHTML(items) {
    const parts = items.map((t, i) => {
        const cls = t.type === 'warning' ? 'ticker-warning' : 'ticker-item';
        const icon = t.type === 'warning' ? '⚠ ' : '';
        return `<span class="${cls}">${icon}${t.text}</span>`;
    });
    // interleave with rotating separators — one full loop
    const single = parts.map((p, i) => p + '  ' + _tickerSeps[i % _tickerSeps.length] + '  ').join('');
    // duplicate exactly once: animation moves -50% → seamless, zero gap
    return single + single;
}

function renderNewsTicker() {
    const tickerEl = document.getElementById('tickerContent');
    const ticker = document.getElementById('newsTicker');
    if (!tickerEl || !ticker) return;
    const items = (db.newsTicker || []).filter(t => t.active !== false);
    if (!items.length) {
        ticker.classList.add('hidden-ticker');
        document.body.classList.remove('ticker-visible');
        return;
    }
    ticker.classList.remove('hidden-ticker');
    document.body.classList.add('ticker-visible');
    tickerEl.innerHTML = _buildTickerHTML(items);
    // speed based on single-copy char count (animation covers -50% = one copy)
    const charCount = items.reduce((s, t) => s + t.text.length, 0);
    const speed = Math.max(12, Math.min(50, charCount * 0.20));
    tickerEl.style.animationDuration = speed + 's';
}

function addTickerItem(text, type = 'news') {
    if (currentUser.role !== 'admin') return false;
    const item = { id: 'ticker_' + Date.now(), text, type, active: true, addedBy: currentUser.name, timestamp: new Date().toISOString() };
    if (!db.newsTicker) db.newsTicker = [];
    db.newsTicker.push(item);
    saveDB(true);
    _syncTickerToSupabase();
    addLog('Add خبر للشريط: ' + text.substring(0, 40));
    return item;
}

function removeTickerItem(tickerId) {
    if (currentUser.role !== 'admin') return false;
    const idx = (db.newsTicker || []).findIndex(t => t.id === tickerId);
    if (idx === -1) return false;
    db.newsTicker.splice(idx, 1);
    saveDB(true);
    _syncTickerToSupabase();
    return true;
}

function toggleTickerItem(tickerId) {
    const item = (db.newsTicker || []).find(t => t.id === tickerId);
    if (!item || currentUser.role !== 'admin') return false;
    item.active = !item.active;
    saveDB(true);
    _syncTickerToSupabase();
    return true;
}

// ============================================================
// Copyright Badge — Orbiting Stars
// ============================================================
function injectCreditBadge() {
    // Skip login page (it has its own credit)
    const path = window.location.pathname.toLowerCase();
    const isLogin = path.endsWith('index.html') || path.endsWith('/') || path === '';
    if (isLogin) return;
    if (document.getElementById('sajcoCredit')) return;
    // Remove old static designer-credit if present
    document.querySelector('.designer-credit')?.remove();

    const el = document.createElement('div');
    el.id = 'sajcoCredit';
    el.className = 'sajco-credit';
    el.innerHTML = `
        <div class="sajco-credit-frame" id="sajcoCreditFrame">
            <div class="sajco-credit-bg">
                <span class="sajco-twinkle" style="top:2px;right:9px;font-size:.54rem;color:#d4af37;animation-delay:0s;">★</span>
                <span class="sajco-twinkle" style="top:3px;right:25px;font-size:.36rem;color:#fbbf24;animation-delay:.55s;">✦</span>
                <span class="sajco-twinkle" style="top:2px;left:9px;font-size:.5rem;color:#d4af37;animation-delay:1.1s;">✧</span>
                <span class="sajco-twinkle" style="top:3px;left:26px;font-size:.34rem;color:#fbbf24;animation-delay:1.65s;">★</span>
                <span class="sajco-twinkle" style="bottom:2px;right:16px;font-size:.38rem;color:#d4af37;animation-delay:.8s;">✦</span>
                <span class="sajco-twinkle" style="bottom:2px;left:16px;font-size:.38rem;color:#fbbf24;animation-delay:1.35s;">✧</span>
                <span class="sajco-twinkle" style="top:46%;right:4px;font-size:.3rem;color:#86efac;animation-delay:2s;">★</span>
                <span class="sajco-twinkle" style="top:46%;left:4px;font-size:.3rem;color:#86efac;animation-delay:2.5s;">✦</span>
                <div class="sc-cb1">
                    <i class="fa-regular fa-copyright" style="color:#22c55e;margin-left:5px;font-size:.72rem;vertical-align:middle;"></i>
                    Design &amp; Development by <strong>Mahmoud Al-Shatori</strong>
                </div>
                <div class="sc-cb2">
                    Under supervision of Eng. <strong>Mohamed Aqtatit</strong>
                    &nbsp; ✦ &nbsp;
                    Sponsored by <strong>Arabian Peninsula Contracting Co.</strong>
                </div>
                <div class="sc-cb3">
                    <i class="fa-regular fa-copyright" style="color:#d4af37;font-size:.65rem;vertical-align:middle;margin-left:3px;"></i>
                    ${new Date().getFullYear()} SAJCO — All Rights Reserved
                </div>
            </div>
        </div>
        <span class="sajco-orbit-star" data-orbit="cw"  style="color:#fbbf24;font-size:.9rem; animation-delay:0s;   animation-duration:6s;">✦</span>
        <span class="sajco-orbit-star" data-orbit="cw"  style="color:#4ade80;font-size:.72rem;animation-delay:-1s;  animation-duration:6s;">★</span>
        <span class="sajco-orbit-star" data-orbit="cw"  style="color:#fde68a;font-size:.62rem;animation-delay:-2s;  animation-duration:6s;">✧</span>
        <span class="sajco-orbit-star" data-orbit="cw"  style="color:#d4af37;font-size:.94rem;animation-delay:-3s;  animation-duration:6s;">✦</span>
        <span class="sajco-orbit-star" data-orbit="cw"  style="color:#86efac;font-size:.68rem;animation-delay:-4s;  animation-duration:6s;">★</span>
        <span class="sajco-orbit-star" data-orbit="cw"  style="color:#fbbf24;font-size:.54rem;animation-delay:-5s;  animation-duration:6s;">✧</span>
        <span class="sajco-orbit-star" data-orbit="ccw" style="color:#a3e635;font-size:.58rem;animation-delay:-0.5s;animation-duration:9s;animation-name:sajcoOrbitCCW;">•</span>
        <span class="sajco-orbit-star" data-orbit="ccw" style="color:#fcd34d;font-size:.48rem;animation-delay:-3s;  animation-duration:9s;animation-name:sajcoOrbitCCW;">•</span>
        <span class="sajco-orbit-star" data-orbit="ccw" style="color:#d4af37;font-size:.54rem;animation-delay:-6s;  animation-duration:9s;animation-name:sajcoOrbitCCW;">•</span>
    `;
    document.body.appendChild(el);

    // Set offset-path after the badge renders so we know exact dimensions
    setTimeout(() => {
        const frame = document.getElementById('sajcoCreditFrame');
        if (!frame) return;
        const fw = frame.offsetWidth;
        const fh = frame.offsetHeight;
        const M = 14, R = 12;

        // Clockwise rounded-rect path (top-left → top-right → bottom-right → bottom-left)
        const cw = `path('M ${-M+R} ${-M} L ${fw+M-R} ${-M} ` +
            `Q ${fw+M} ${-M} ${fw+M} ${-M+R} ` +
            `L ${fw+M} ${fh+M-R} Q ${fw+M} ${fh+M} ${fw+M-R} ${fh+M} ` +
            `L ${-M+R} ${fh+M} Q ${-M} ${fh+M} ${-M} ${fh+M-R} ` +
            `L ${-M} ${-M+R} Q ${-M} ${-M} ${-M+R} ${-M} Z')`;

        // Counter-clockwise path (reverse direction)
        const ccw = `path('M ${-M+R} ${-M} Q ${-M} ${-M} ${-M} ${-M+R} ` +
            `L ${-M} ${fh+M-R} Q ${-M} ${fh+M} ${-M+R} ${fh+M} ` +
            `L ${fw+M-R} ${fh+M} Q ${fw+M} ${fh+M} ${fw+M} ${fh+M-R} ` +
            `L ${fw+M} ${-M+R} Q ${fw+M} ${-M} ${fw+M-R} ${-M} Z')`;

        el.querySelectorAll('[data-orbit="cw"]').forEach(s => {
            s.style.offsetPath = cw;
            s.style.offsetDistance = '0%';
            s.classList.add('ready');
        });
        el.querySelectorAll('[data-orbit="ccw"]').forEach(s => {
            s.style.offsetPath = ccw;
            s.style.offsetDistance = '0%';
            s.classList.add('ready');
        });
    }, 250);
}

function injectGlobalAppImage() {
    const path = window.location.pathname.toLowerCase();
    const isLoginPage = path.endsWith('index.html') || path.endsWith('/') || path === '';
    if (db.settings.appImage) {
        if (isLoginPage) {
            const container = document.getElementById('appImageContainer');
            if (container) container.innerHTML = `<img src="${db.settings.appImage}" class="login-app-img" alt="App Logo">`;
        } else {
            // Always update src whether element exists or not
            const existing = document.querySelector('.global-app-mark');
            if (existing) {
                existing.src = db.settings.appImage;
            } else {
                const img = document.createElement('img');
                img.src = db.settings.appImage;
                img.className = 'global-app-mark';
                document.body.appendChild(img);
            }
        }
    }
    // Always update sidebar logo too
    const sidebarLogoImg = document.querySelector('.brand-logo img');
    if (sidebarLogoImg && db.settings.logo) sidebarLogoImg.src = db.settings.logo;
}

function _showSyncToast(message, type = 'info') {
    const wrap = document.getElementById('toasts') || document.body;
    const el = document.createElement('div');
    const colors = { warning: ['#fffbeb','#92400e'], error: ['#fee2e2','#b91c1c'], info: ['#e0f2fe','#075985'] };
    const [bg, color] = colors[type] || colors.info;
    el.style.cssText = `position:fixed;bottom:20px;left:20px;z-index:10000;padding:12px 20px;border-radius:10px;background:${bg};color:${color};border:1px solid ${color}22;box-shadow:0 4px 12px rgba(0,0,0,.1);font-size:.85rem;font-weight:600;max-width:360px;`;
    el.textContent = message;
    wrap.appendChild(el);
    setTimeout(() => { el.style.opacity='0'; setTimeout(()=>el.remove(),400); }, 4000);
}

// ============================================================
// Mobile / Desktop View Mode
// ============================================================
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || window.innerWidth <= 991;
}

function applyViewMode() {
    const params = new URLSearchParams(window.location.search);
    const forced = params.get('m');
    const savedMode = localStorage.getItem('sajco_view_mode');
    const useMobile = forced === '1' || (forced !== '0' && (savedMode === 'mobile' || (savedMode === null && isMobileDevice())));
    if (useMobile) {
        document.body.classList.add('mobile-view');
        localStorage.setItem('sajco_view_mode', 'mobile');
    } else {
        document.body.classList.remove('mobile-view');
        localStorage.setItem('sajco_view_mode', 'desktop');
    }
}

function switchToMobile() {
    localStorage.setItem('sajco_view_mode', 'mobile');
    const url = new URL(window.location.href);
    url.searchParams.set('m', '1');
    window.location.href = url.toString();
}

function switchToDesktop() {
    localStorage.setItem('sajco_view_mode', 'desktop');
    const url = new URL(window.location.href);
    url.searchParams.set('m', '0');
    window.location.href = url.toString();
}

function getLoginDest(role) {
    const base = role === 'surveyor' ? 'surveyor-dashboard.html' : role === 'head' ? 'head-surveyor-dashboard.html' : 'dashboard.html';
    return isMobileDevice() ? base + '?m=1' : base;
}

async function _syncTickerToSupabase() {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) return;
    try {
        await supabaseClient.from('settings')
            .upsert({ key: 'newsTicker', value: JSON.stringify(db.newsTicker || []) }, { onConflict: 'key' });
    } catch(e) { console.warn('sync ticker:', e.message); }
}

async function _loadRemoteSettings() {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) return;
    try {
        const { data, error } = await supabaseClient.from('settings').select('key,value');
        if (error || !data) return;

        data.forEach(r => { _applySettingsRow(r); });

        // Re-render everything after all rows applied
        injectGlobalAppImage();
        if (document.getElementById('newsTicker')) renderNewsTicker();
        if (typeof renderLoginTicker === 'function') renderLoginTicker();

    } catch(e) { /* silent — offline or table missing */ }
}

// ============================================================
// _loadRemoteDB — يجلب users/branches/devices from Supabase andيدمجها
// ============================================================
let _loadingRemote = false;
let _loadingPromise = null;
async function _loadRemoteDB() {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) return;
    if (_loadingRemote) return _loadingPromise;
    _loadingRemote = true;
    _loadingPromise = _execLoadRemoteDB();
    return _loadingPromise;
}
async function _execLoadRemoteDB() {
    try {
        const oldCurrentUserId = currentUser?.id;

        const queries = [
            supabaseClient.from('users').select('*'),
            supabaseClient.from('branches').select('*'),
            supabaseClient.from('devices').select('*'),
            supabaseClient.from('allowed_employee_ids').select('*'),
            supabaseClient.from('custodies').select('*').order('timestamp', { ascending: false }).limit(500),
            supabaseClient.from('leave_requests').select('*').order('timestamp', { ascending: false }).limit(500),
            supabaseClient.from('workers').select('*').order('added_at', { ascending: false }).limit(500),
            supabaseClient.from('worker_leave_requests').select('*').order('timestamp', { ascending: false }).limit(500),
            supabaseClient.from('projects').select('*').order('timestamp', { ascending: false }).limit(200),
            supabaseClient.from('profile_change_requests').select('*').order('timestamp', { ascending: false }).limit(200),
            supabaseClient.from('salary_raise_requests').select('*').order('timestamp', { ascending: false }).limit(200),
            supabaseClient.from('password_reset_requests').select('*').order('timestamp', { ascending: false }).limit(100),
            supabaseClient.from('maintenance_requests').select('*').order('timestamp', { ascending: false }).limit(500),
            supabaseClient.from('calibration_certificates').select('*').order('created_at', { ascending: false }).limit(500),
        ];
        if (currentUser) {
            queries.push(
                supabaseClient.from('notifications').select('*')
                    .eq('user_id', currentUser.id)
                    .order('timestamp', { ascending: false })
                    .limit(100)
            );
        }
        const [usersRes, branchesRes, devicesRes, empIdsRes, custodiesRes, leaveRes, workersRes, workerLeaveRes, projectsRes, pcrRes, srrRes, pwrRes, maintRes, certRes, notifRes] = await Promise.all(queries);

        let changed = false;

        // ── Users ──────────────────────────────────────────────────
        if (usersRes.data && usersRes.data.length > 0) {
            usersRes.data.forEach(row => {
                const local = db.users.find(u => u.id === row.id || u.empId === row.emp_id);
                const merged = {
                    id: row.id,
                    name: row.name,
                    email: row.email,
                    role: row.role,
                    status: row.status,
                    empId: row.emp_id,
                    phone: row.phone || '',
                    nationality: row.nationality || '',
                    project: row.project || '',
                    branch: row.branch_id || '',
                    responsibleBranch: row.responsible_branch_id || '',
                    headSurveyor: row.head_surveyor || '',
                    totalExp: row.total_exp || 0,
                    companyExp: row.company_exp || 0,
                    joinDate: row.join_date || '',
                    substituteId: row.substitute_id || '',
                    rating: row.rating || 0,
                    password: row.password || local?.password || '',
                    mustChangePassword: row.must_change_password || false,
                    authUid: row.auth_uid || null,
                };
                if (local) {
                    Object.assign(local, merged);
                } else {
                    db.users.push(merged);
                }
                changed = true;
            });
            // Remove any duplicates accumulated by id or empId (keep first occurrence = Supabase-updated entry)
            const _seenUids = new Set(), _seenEmpIds = new Set();
            db.users = db.users.filter(u => {
                if (_seenUids.has(u.id)) return false;
                _seenUids.add(u.id);
                if (u.empId && _seenEmpIds.has(String(u.empId))) return false;
                if (u.empId) _seenEmpIds.add(String(u.empId));
                return true;
            });
        }

        // ── Branches ───────────────────────────────────────────────
        if (branchesRes.data && branchesRes.data.length > 0) {
            // Replace local branches entirely from Supabase (authoritative source)
            db.branches = branchesRes.data.map(row => _normalizeBranch({
                id:           row.id,
                nameAr:       row.name_ar || row.name,
                nameEn:       row.name_en || row.name_ar || row.name,
                serialNumber: row.serial_number || 0,
            }));
            changed = true;
        }

        // ── Devices ────────────────────────────────────────────────
        if (devicesRes.data && devicesRes.data.length > 0) {
            devicesRes.data.forEach(row => {
                const local = db.devices.find(d => d.id === row.id || d.serial === row.serial);
                const merged = {
                    id: row.id,
                    serial: row.serial,
                    type: row.type,
                    ownerId: row.owner_id || null,
                    branch: row.branch_id || null,
                    calDate: row.cal_date || null,
                    status: row.status || 'warehouse',
                    sentToAgentDate: row.sent_to_agent_date || null,
                };
                if (local) {
                    Object.assign(local, merged);
                } else {
                    db.devices.push(merged);
                }
                changed = true;
            });
        }

        // ── Allowed Employee IDs ───────────────────────────────────
        if (empIdsRes.data) { // Check if data exists, even if empty, to allow clearing local state
            db.allowedEmployeeIds = empIdsRes.data.map(row => ({
                empId: String(row.emp_id),
                name: row.name || ''
            }));
            changed = true;
        }

        // ── Custodies ─────────────────────────────────────────────
        if (custodiesRes && custodiesRes.data && custodiesRes.data.length > 0) {
            if (!db.custodies) db.custodies = [];
            custodiesRes.data.forEach(row => {
                const local = db.custodies.find(c => c.id === row.id);
                const merged = {
                    id: row.id,
                    userId: row.user_id,
                    assignedBy: row.assigned_by,
                    deviceType: row.device_type,
                    serialNumber: row.serial_number,
                    receiptDate: row.receipt_date || null,
                    calibrationDate: row.calibration_date || null,
                    deviceCondition: row.device_condition || '',
                    status: row.status,
                    branchId: row.branch_id || null,
                    receivedFrom: row.received_from || null,
                    receivedFromName: row.received_from_name || null,
                    notes: row.notes || '',
                    satisfied: row.satisfied ?? null,
                    careLevel: row.care_level || null,
                    receiverNotes: row.receiver_notes || null,
                    receiverDeviceCondition: row.receiver_device_condition || null,
                    receiverComment: row.receiver_comment || null,
                    approvalHistory: row.approval_history || [],
                    transferData: row.transfer_data || null,
                    timestamp: row.timestamp || row.created_at || '',
                };
                if (local) {
                    Object.assign(local, merged);
                } else {
                    db.custodies.push(merged);
                }
                changed = true;
            });
        }

        // ── Leave Requests ────────────────────────────────────────
        if (leaveRes && leaveRes.data && leaveRes.data.length > 0) {
            if (!db.leaveRequests) db.leaveRequests = [];
            leaveRes.data.forEach(row => {
                const local = db.leaveRequests.find(r => r.id === row.id);
                const merged = {
                    id: row.id,
                    userId: row.user_id,
                    assignedBy: row.assigned_by,
                    leaveType: row.leave_type || 'annual',
                    startDate: row.start_date || null,
                    endDate: row.end_date || null,
                    daysRequested: row.requested_days || 0,
                    reason: row.reason || '',
                    attachmentUrl: row.attachment_url || '',
                    signatureImageUrl: row.signature_image_url || '',
                    notes: row.notes || '',
                    status: row.status,
                    branchId: row.branch_id || null,
                    approvedDaysByHead: row.approved_days_by_head || null,
                    approvedDaysFinal: row.approved_days_final || null,
                    actualDepartureDate: row.actual_departure_date || null,
                    actualReturnDate: row.actual_return_date || null,
                    isDeparted: row.is_departed || false,
                    isReturned: row.is_returned || false,
                    departureConfirmedBy: row.departure_confirmed_by || null,
                    departureConfirmedByName: row.departure_confirmed_by_name || null,
                    returnConfirmedBy: row.return_confirmed_by || null,
                    returnConfirmedByName: row.return_confirmed_by_name || null,
                    approvalHistory: row.history || [],
                    timestamp: row.timestamp || row.created_at || '',
                };
                if (local) {
                    Object.assign(local, merged);
                } else {
                    db.leaveRequests.push(merged);
                }
                changed = true;
            });
        }

        // ── Workers ───────────────────────────────────────────────
        if (workersRes && workersRes.data && workersRes.data.length > 0) {
            if (!db.workers) db.workers = [];
            workersRes.data.forEach(row => {
                const local = db.workers.find(w => w.id === row.id);
                const merged = {
                    id:           row.id,           name:         row.name,
                    empId:        row.emp_id        || '', phone:        row.phone         || '',
                    email:        row.email         || '', nationality:  row.nationality   || '',
                    dob:          row.dob           || '', residenceId:  row.residence_id  || '',
                    branchId:     row.branch_id     || '', surveyorId:   row.surveyor_id   || '',
                    surveyorName: row.surveyor_name || '', projectId:    row.project_id    || '',
                    status:       row.status        || 'available',
                    addedBy:      row.added_by      || '', addedAt: row.added_at || row.created_at || '',
                };
                if (local) { Object.assign(local, merged); } else { db.workers.push(merged); }
                changed = true;
            });
        }

        // ── Worker Leave Requests ─────────────────────────────────
        if (workerLeaveRes && workerLeaveRes.data && workerLeaveRes.data.length > 0) {
            if (!db.workerLeaveRequests) db.workerLeaveRequests = [];
            workerLeaveRes.data.forEach(row => {
                const local = db.workerLeaveRequests.find(r => r.id === row.id);
                const merged = {
                    id: row.id, workerId: row.worker_id, workerName: row.worker_name || '',
                    workerEmpId: row.worker_emp_id || '', workerResidenceId: row.worker_residence_id || '',
                    surveyorId: row.surveyor_id || '', surveyorName: row.surveyor_name || '',
                    branchId: row.branch_id || '', startDate: row.start_date || '',
                    endDate: row.end_date || '', daysRequested: row.days_requested || 0,
                    reason: row.reason || '', status: row.status,
                    headApprovedAt: row.head_approved_at || null, headApprovedBy: row.head_approved_by || null,
                    adminApprovedAt: row.admin_approved_at || null, adminApprovedBy: row.admin_approved_by || null,
                    rejectedBy: row.rejected_by || null, rejectionNote: row.rejection_reason || null,
                    departureDate: row.departure_date || null, returnDate: row.return_date || null,
                    timestamp: row.timestamp || row.created_at || '',
                };
                if (local) { Object.assign(local, merged); } else { db.workerLeaveRequests.push(merged); }
                changed = true;
            });
        }

        // ── Projects ──────────────────────────────────────────────
        if (projectsRes && projectsRes.data && projectsRes.data.length > 0) {
            if (!db.projects) db.projects = [];
            projectsRes.data.forEach(row => {
                const local = db.projects.find(p => p.id === row.id);
                const merged = {
                    id: row.id, name: row.name, description: row.description || '',
                    branchId: row.branch_id || null,
                    startDate: row.start_date || null,
                    expectedEndDate: row.expected_end_date || null,
                    completionPercent: row.completion_percent || 0,
                    status: row.status || 'active',
                    surveyorIds: row.surveyor_ids || [],
                    createdBy: row.created_by || null,
                    timestamp: row.timestamp || row.created_at || '',
                };
                if (local) { Object.assign(local, merged); } else { db.projects.push(merged); }
                changed = true;
            });
        }

        // ── Profile Change Requests ───────────────────────────────
        if (pcrRes && pcrRes.data && pcrRes.data.length > 0) {
            if (!db.profileChangeRequests) db.profileChangeRequests = [];
            pcrRes.data.forEach(row => {
                const local = db.profileChangeRequests.find(r => r.id === row.id);
                const merged = {
                    id: row.id,
                    userId: row.user_id, userName: row.user_name || '',
                    userEmpId: row.user_emp_id || '', userRole: row.user_role || '',
                    branchId: row.branch_id || null, headId: row.head_id || null,
                    type: row.type, newValue: row.new_value || '',
                    newValueDisplay: row.new_value_display || '',
                    status: row.status,
                    headApprovedAt: row.head_approved_at || null,
                    headApprovedBy: row.head_approved_by || null,
                    adminApprovedAt: row.admin_approved_at || null,
                    adminApprovedBy: row.admin_approved_by || null,
                    rejectedAt: row.rejected_at || null,
                    rejectedBy: row.rejected_by || null,
                    rejectionNote: row.rejection_note || '',
                    timestamp: row.timestamp || row.created_at || '',
                };
                if (local) { Object.assign(local, merged); } else { db.profileChangeRequests.push(merged); }
                changed = true;
            });
        }

        // ── Salary Raise Requests ─────────────────────────────────
        if (srrRes && srrRes.data && srrRes.data.length > 0) {
            if (!db.salaryRaiseRequests) db.salaryRaiseRequests = [];
            srrRes.data.forEach(row => {
                const local = db.salaryRaiseRequests.find(r => r.id === row.id);
                const merged = {
                    id: row.id,
                    targetType: row.target_type, targetId: row.target_id || '',
                    targetName: row.target_name || '', targetEmpId: row.target_emp_id || '',
                    targetResidenceId: row.target_residence_id || '',
                    targetNationality: row.target_nationality || '',
                    targetJoinDate: row.target_join_date || '',
                    targetRating: row.target_rating || null,
                    branchId: row.branch_id || null,
                    surveyorId: row.surveyor_id || null,
                    surveyorName: row.surveyor_name || '',
                    headId: row.head_id || null,
                    currentSalary: row.current_salary || '',
                    requestedRaiseAmount: row.requested_raise_amount || '',
                    raisePercentage: row.raise_percentage || '',
                    lastRaiseDate: row.last_raise_date || '',
                    reason: row.reason || '', achievements: row.achievements || '',
                    notes: row.notes || '', status: row.status,
                    approvedBy: row.approved_by || null, approvedAt: row.approved_at || null,
                    rejectedBy: row.rejected_by || null, rejectedAt: row.rejected_at || null,
                    rejectionNote: row.rejection_note || '',
                    timestamp: row.timestamp || row.created_at || '',
                };
                if (local) { Object.assign(local, merged); } else { db.salaryRaiseRequests.push(merged); }
                changed = true;
            });
        }

        // ── Password Reset Requests ───────────────────────────────
        if (pwrRes && pwrRes.data && pwrRes.data.length > 0) {
            if (!db.passwordResetRequests) db.passwordResetRequests = [];
            pwrRes.data.forEach(row => {
                const local = db.passwordResetRequests.find(r => r.id === row.id);
                const merged = {
                    id: row.id, userId: row.user_id, userName: row.user_name,
                    empId: row.emp_id, branchId: row.branch_id,
                    headId: row.head_id, headName: row.head_name,
                    status: row.status, resolvedAt: row.resolved_at,
                    resolvedBy: row.resolved_by, timestamp: row.timestamp,
                };
                if (local) { Object.assign(local, merged); } else { db.passwordResetRequests.push(merged); }
                changed = true;
            });
        }

        // ── Maintenance Requests ──────────────────────────────────
        if (maintRes && maintRes.data && maintRes.data.length > 0) {
            if (!db.maintenanceRequests) db.maintenanceRequests = [];
            maintRes.data.forEach(row => {
                const local = db.maintenanceRequests.find(r => r.id === row.id);
                const merged = {
                    id: row.id,
                    deviceId: row.device_id || null,
                    serialNumber: row.serial_number || '',
                    deviceType: row.device_type || '',
                    requestType: row.request_type || 'maintenance',
                    status: row.status || 'pending',
                    requestedBy: row.requested_by || null,
                    requestedByName: row.requested_by_name || '',
                    branchId: row.branch_id || null,
                    notes: row.notes || '',
                    sentDate: row.sent_date || null,
                    returnDate: row.return_date || null,
                    newCalDate: row.new_cal_date || null,
                    approvedBy: row.approved_by || null,
                    approvedAt: row.approved_at || null,
                    approvalHistory: row.approval_history || [],
                    timestamp: row.timestamp || row.created_at || '',
                };
                if (local) { Object.assign(local, merged); } else { db.maintenanceRequests.push(merged); }
                changed = true;
            });
        }

        // ── Calibration Certificates ──────────────────────────────
        if (certRes && certRes.data && certRes.data.length > 0) {
            if (!db.calibrationCerts) db.calibrationCerts = [];
            certRes.data.forEach(row => {
                const local = db.calibrationCerts.find(c => c.id === row.id);
                const merged = {
                    id: row.id,
                    deviceId: row.device_id || null,
                    serialNumber: row.serial_number || '',
                    custodyId: row.custody_id || null,
                    fileName: row.file_name || '',
                    fileUrl: row.file_url || '',
                    storagePath: row.storage_path || '',
                    fileType: row.file_type || '',
                    fileSize: row.file_size || 0,
                    calibrationDate: row.calibration_date || null,
                    expiryDate: row.expiry_date || null,
                    uploadedBy: row.uploaded_by || null,
                    notes: row.notes || '',
                    timestamp: row.created_at || '',
                };
                if (local) { Object.assign(local, merged); } else { db.calibrationCerts.push(merged); }
                changed = true;
            });
        }

        // ── Notifications (current user) ───────────────────────────
        if (notifRes && notifRes.data && notifRes.data.length > 0) {
            notifRes.data.forEach(row => {
                if (!db.notifications.find(n => n.id === row.id)) {
                    db.notifications.unshift(_fromSnakeNotif(row));
                    changed = true;
                }
            });
        }

        if (changed) {
            // Update currentUser session if their data changed in Supabase
            if (currentUser) {
                const freshMe = db.users.find(u => u.empId === currentUser.empId || u.email === currentUser.email);
                if (freshMe) {
                    const updated = { ...currentUser, ...freshMe, password: currentUser.password };
                    currentUser = updated;
                    localStorage.setItem('sajco_session', JSON.stringify(updated));

                    // If the user ID changed (e.g. 'admin_1' → Supabase UUID), re-fetch
                    // notifications with the correct UUID and reinit realtime subscription
                    if (oldCurrentUserId && freshMe.id !== oldCurrentUserId) {
                        supabaseClient.from('notifications').select('*')
                            .eq('user_id', freshMe.id)
                            .order('timestamp', { ascending: false })
                            .limit(100)
                            .then(({ data: newNotifs }) => {
                                if (newNotifs && newNotifs.length > 0) {
                                    let added = false;
                                    newNotifs.forEach(row => {
                                        if (!db.notifications.find(n => n.id === row.id)) {
                                            db.notifications.unshift(_fromSnakeNotif(row));
                                            added = true;
                                        }
                                    });
                                    if (added) {
                                        _updateNotificationBadge();
                                    }
                                }
                            });
                        if (_realtimeChannel) {
                            supabaseClient.removeChannel(_realtimeChannel);
                            _realtimeChannel = null;
                        }
                        setTimeout(initRealtime, 300);
                    }
                }
            }

            _updateNotificationBadge();
            // Re-render current page if a render function exists
            if (typeof refreshTable === 'function') refreshTable();
            if (typeof refreshPage  === 'function') refreshPage();
        }
    } catch(e) { /* silent — offline */ }
    finally { _loadingRemote = false; _loadingPromise = null; }
}

// ══════════════════════════════════════════════════════════
// Workers Management
// ══════════════════════════════════════════════════════════

function addWorker(data) {
    if (!data.name || !data.residenceId) return false;
    if (db.workers.some(w => w.residenceId === data.residenceId)) {
        alert('A worker with this Residence ID already exists'); return false;
    }
    const targetSurveyor = data.targetSurveyorId
        ? db.users.find(u => u.id === data.targetSurveyorId)
        : null;
    const assignedSurveyorId   = targetSurveyor ? targetSurveyor.id   : currentUser.id;
    const assignedSurveyorName = targetSurveyor ? targetSurveyor.name : currentUser.name;
    const assignedBranchId     = targetSurveyor
        ? (targetSurveyor.branch || targetSurveyor.responsibleBranch || '')
        : (currentUser.branch || currentUser.responsibleBranch || '');
    const w = {
        id: 'wrk_' + Date.now() + '_' + Math.random().toString(36).substr(2,4),
        name: data.name, empId: data.empId || '', phone: data.phone || '',
        email: data.email || '', nationality: data.nationality || '',
        dob: data.dob || '', residenceId: data.residenceId,
        branchId: assignedBranchId,
        surveyorId: assignedSurveyorId, surveyorName: assignedSurveyorName,
        projectId: data.projectId || '',
        status: 'available', addedAt: new Date().toISOString(), addedBy: currentUser.name
    };
    db.workers.push(w);
    _upsertWorkerInSupabase(w);
    saveDB(true);
    addLog(`أضاف ${currentUser.name} الWorker ${w.name}`);
    return w;
}

function updateWorker(id, data) {
    const w = db.workers.find(x => x.id === id);
    if (!w) return false;
    Object.assign(w, data);
    _upsertWorkerInSupabase(w);
    saveDB(true);
    return true;
}

function deleteWorker(id) {
    const idx = db.workers.findIndex(x => x.id === id);
    if (idx === -1) return false;
    const name = db.workers[idx].name;
    _deleteWorkerInSupabase(id);
    db.workers.splice(idx, 1);
    saveDB(true);
    addLog(`Delete ${currentUser.name} الWorker ${name}`);
    return true;
}

function submitWorkerLeaveRequest(workerId, startDate, endDate, reason) {
    const w = db.workers.find(x => x.id === workerId);
    if (!w) return false;
    const days = Math.floor((new Date(endDate) - new Date(startDate)) / 86400000) + 1;
    if (days < 1) { alert('تاريخ الReturn يجب أن يكandن بعد Start Date'); return false; }

    const existing = db.workerLeaveRequests.find(r =>
        r.workerId === workerId && ['pending_head','pending_admin','approved'].includes(r.status));
    if (existing) { alert('يandجد طلب Leave Pending لهذا الWorker'); return false; }

    const branchId = w.branchId || currentUser.branch || currentUser.responsibleBranch;
    const head = db.users.find(u => u.role === 'head' && u.responsibleBranch === branchId && u.status === 'approved');

    const req = {
        id: 'wlr_' + Date.now() + '_' + Math.random().toString(36).substr(2,4),
        workerId: w.id, workerName: w.name, workerEmpId: w.empId, workerResidenceId: w.residenceId,
        surveyorId: currentUser.id, surveyorName: currentUser.name,
        branchId, startDate, endDate, daysRequested: days, reason: reason || '',
        status: head ? 'pending_head' : 'pending_admin',
        timestamp: new Date().toISOString()
    };
    db.workerLeaveRequests.push(req);
    _upsertWorkerLeaveInSupabase(req);

    if (head) {
        addNotification(head.id,
            `طلب Leave للWorker ${w.name} مقدم from الSurveyor ${currentUser.name} (${days} يandم) — Pending OKتك`,
            'warning', req.id, false, 'workers.html', 'worker_leave', true);
    } else {
        db.users.filter(u => u.role === 'admin').forEach(a =>
            addNotification(a.id,
                `طلب Leave للWorker ${w.name} from ${currentUser.name} (${days} يandم) — None Head Surveyor`,
                'warning', req.id, false, 'workers.html', 'worker_leave', true));
    }
    saveDB(true);
    addLog(`طلب Leave للWorker ${w.name} from ${currentUser.name}`);
    return true;
}

function approveWorkerLeaveRequest(reqId) {
    const req = db.workerLeaveRequests.find(r => r.id === reqId);
    if (!req) return false;

    if (currentUser.role === 'head' && req.status === 'pending_head') {
        req.status = 'pending_admin';
        req.headApprovedAt = new Date().toISOString();
        req.headApprovedBy = currentUser.name;
        db.users.filter(u => u.role === 'admin').forEach(a =>
            addNotification(a.id,
                `andافق Head Surveyor على Leave الWorker ${req.workerName} (${req.daysRequested} يandم) — Pending اعDoneادك`,
                'warning', req.id, false, 'workers.html', 'worker_leave', true));
        addNotification(req.surveyorId,
            `andافق Head Surveyor على Leave الWorker ${req.workerName} — Pending Approve المدير`,
            'info', req.id, false, 'workers.html', null, false);
        _upsertWorkerLeaveInSupabase(req);
        saveDB(true); return true;
    }

    if (currentUser.role === 'admin' && req.status === 'pending_admin') {
        req.status = 'approved';
        req.adminApprovedAt = new Date().toISOString();
        req.adminApprovedBy = currentUser.name;
        const w = db.workers.find(x => x.id === req.workerId);
        if (w) { w.status = 'approved_leave'; _upsertWorkerInSupabase(w); }
        addNotification(req.surveyorId,
            `Doneت الApprove على Leave الWorker ${req.workerName} (${req.daysRequested} يandم) ✓ يمكنك تسجيل الDepartedة`,
            'success', req.id, false, 'workers.html', null, false);
        _upsertWorkerLeaveInSupabase(req);
        saveDB(true);
        addLog(`اعDoneد ${currentUser.name} Leave الWorker ${req.workerName}`);
        return true;
    }
    return false;
}

function rejectWorkerLeaveRequest(reqId, note) {
    const req = db.workerLeaveRequests.find(r => r.id === reqId);
    if (!req) return false;
    req.status = 'rejected';
    req.rejectedAt = new Date().toISOString();
    req.rejectedBy = currentUser.name;
    req.rejectionNote = note || '';
    addNotification(req.surveyorId,
        `Done Reject Leave الWorker ${req.workerName}${note ? ' — ' + note : ''}`,
        'error', req.id, false, 'workers.html', null, false);
    _upsertWorkerLeaveInSupabase(req);
    saveDB(true);
    return true;
}

function registerWorkerDeparture(reqId) {
    const req = db.workerLeaveRequests.find(r => r.id === reqId);
    if (!req || req.status !== 'approved') return false;
    req.status = 'departed';
    req.departureDate = new Date().toISOString().split('T')[0];
    const w = db.workers.find(x => x.id === req.workerId);
    if (w) { w.status = 'on_leave'; _upsertWorkerInSupabase(w); }
    const head = db.users.find(u => u.role === 'head' && u.responsibleBranch === req.branchId && u.status === 'approved');
    if (head) addNotification(head.id,
        `غادر الWorker ${req.workerName} On Leave — الSurveyor: ${req.surveyorName}`,
        'info', req.id, false, 'workers.html', null, false);
    _upsertWorkerLeaveInSupabase(req);
    saveDB(true);
    addLog(`سجّل ${currentUser.name} Departedة الWorker ${req.workerName}`);
    return true;
}

function registerWorkerReturn(reqId) {
    const req = db.workerLeaveRequests.find(r => r.id === reqId);
    if (!req || req.status !== 'departed') return false;
    req.status = 'returned';
    req.returnDate = new Date().toISOString().split('T')[0];
    const w = db.workers.find(x => x.id === req.workerId);
    if (w) { w.status = 'available'; _upsertWorkerInSupabase(w); }
    const head = db.users.find(u => u.role === 'head' && u.responsibleBranch === req.branchId && u.status === 'approved');
    if (head) addNotification(head.id,
        `عاد الWorker ${req.workerName} from إجازته — الSurveyor: ${req.surveyorName}`,
        'info', req.id, false, 'workers.html', null, false);
    _upsertWorkerLeaveInSupabase(req);
    saveDB(true);
    addLog(`سجّل ${currentUser.name} Return الWorker ${req.workerName}`);
    return true;
}

function transferWorker(workerId, newSurveyorId) {
    const w = db.workers.find(x => x.id === workerId);
    const s = db.users.find(u => u.id === newSurveyorId);
    if (!w || !s) return false;
    const oldName = w.surveyorName;
    w.surveyorId   = newSurveyorId;
    w.surveyorName = s.name;
    w.branchId     = s.branch || s.responsibleBranch || w.branchId;
    _upsertWorkerInSupabase(w);
    saveDB(true);
    addLog(`${currentUser.name} نقل الWorker ${w.name} from ${oldName} to ${s.name}`);
    return true;
}

// ── Worker Transfer Requests (3-step approval chain) ────────────────
function initiateWorkerTransfer(workerId, toSurveyorId, reason) {
    const w  = db.workers.find(x => x.id === workerId);
    const to = db.users.find(u => u.id === toSurveyorId);
    if (!w || !to) return false;
    if (w.surveyorId === toSurveyorId) { alert('Worker is already assigned to this surveyor'); return false; }
    const existing = (db.workerTransferRequests || []).find(r =>
        r.workerId === workerId && ['pending_receiver','pending_head','pending_admin'].includes(r.status));
    if (existing) { alert('A pending transfer request already exists for this worker'); return false; }
    const req = {
        id: crypto.randomUUID(),
        workerId: w.id, workerName: w.name, workerResidenceId: w.residenceId || '',
        fromSurveyorId: w.surveyorId, fromSurveyorName: w.surveyorName || '',
        toSurveyorId, toSurveyorName: to.name,
        branchId: to.branch || to.responsibleBranch || w.branchId || '',
        reason: reason || '',
        status: 'pending_receiver',
        initiatedBy: currentUser.id, initiatedByName: currentUser.name,
        receiverApprovedAt: null, receiverApprovedBy: null,
        headApprovedAt: null, headApprovedBy: null,
        adminApprovedAt: null, adminApprovedBy: null,
        rejectedBy: null, rejectionReason: null,
        timestamp: new Date().toISOString()
    };
    if (!db.workerTransferRequests) db.workerTransferRequests = [];
    db.workerTransferRequests.push(req);
    _upsertWorkerTransferInSupabase(req);
    saveDB(true);
    addNotification(toSurveyorId,
        `Worker transfer request: "${w.name}" from ${req.fromSurveyorName} — please approve or reject`,
        'warning', req.id, false, 'workers.html', 'worker_transfer', true);
    addLog(`${currentUser.name} initiated transfer of worker ${w.name} from ${req.fromSurveyorName} to ${to.name}`);
    return true;
}

function approveWorkerTransferRequest(reqId) {
    const req = (db.workerTransferRequests || []).find(r => r.id === reqId);
    if (!req) return false;
    const now = new Date().toISOString();
    if (currentUser.role === 'surveyor' && req.status === 'pending_receiver' && req.toSurveyorId === currentUser.id) {
        req.status = 'pending_head';
        req.receiverApprovedAt = now; req.receiverApprovedBy = currentUser.name;
        const branchId = req.branchId || db.workers.find(w => w.id === req.workerId)?.branchId;
        const head = db.users.find(u => u.role === 'head' && u.responsibleBranch === branchId && u.status === 'approved');
        if (head) {
            addNotification(head.id, `Surveyor ${currentUser.name} approved transfer of worker "${req.workerName}" — awaiting your approval`, 'warning', req.id, false, 'workers.html', 'worker_transfer', true);
        } else {
            req.status = 'pending_admin';
            req.headApprovedAt = now; req.headApprovedBy = 'Auto (no head surveyor)';
            db.users.filter(u => u.role === 'admin').forEach(a =>
                addNotification(a.id, `Worker "${req.workerName}" transfer pending your final approval (no head surveyor)`, 'warning', req.id, false, 'workers.html', 'worker_transfer', true));
        }
        _upsertWorkerTransferInSupabase(req); saveDB(true);
        addLog(`${currentUser.name} approved (as receiver) transfer of worker ${req.workerName}`);
        return true;
    }
    if (currentUser.role === 'head' && req.status === 'pending_head') {
        const branchId = req.branchId || db.workers.find(w => w.id === req.workerId)?.branchId;
        if (currentUser.responsibleBranch !== branchId) return false;
        req.status = 'pending_admin'; req.headApprovedAt = now; req.headApprovedBy = currentUser.name;
        db.users.filter(u => u.role === 'admin').forEach(a =>
            addNotification(a.id, `Head surveyor ${currentUser.name} approved transfer of worker "${req.workerName}" — awaiting final approval`, 'warning', req.id, false, 'workers.html', 'worker_transfer', true));
        _upsertWorkerTransferInSupabase(req); saveDB(true);
        addLog(`${currentUser.name} approved (as head) transfer of worker ${req.workerName}`);
        return true;
    }
    if (currentUser.role === 'admin' && ['pending_admin','pending_head','pending_receiver'].includes(req.status)) {
        req.status = 'approved'; req.adminApprovedAt = now; req.adminApprovedBy = currentUser.name;
        const w = db.workers.find(x => x.id === req.workerId);
        const to = db.users.find(u => u.id === req.toSurveyorId);
        if (w && to) {
            const oldId = w.surveyorId;
            w.surveyorId = to.id; w.surveyorName = to.name;
            w.branchId = to.branch || to.responsibleBranch || w.branchId;
            _upsertWorkerInSupabase(w);
            addNotification(req.toSurveyorId, `Transfer of worker "${req.workerName}" to you has been approved ✓`, 'success', req.id);
            if (oldId && oldId !== req.toSurveyorId) addNotification(oldId, `Transfer of worker "${req.workerName}" from you to ${to.name} approved`, 'info', req.id);
        }
        _upsertWorkerTransferInSupabase(req); saveDB(true);
        addLog(`${currentUser.name} approved (final) transfer of worker ${req.workerName} to ${req.toSurveyorName}`);
        return true;
    }
    return false;
}

function rejectWorkerTransferRequest(reqId, reason) {
    const req = (db.workerTransferRequests || []).find(r => r.id === reqId);
    if (!req) return false;
    if (!['pending_receiver','pending_head','pending_admin'].includes(req.status)) return false;
    req.status = 'rejected'; req.rejectedBy = currentUser.name; req.rejectionReason = reason || '';
    addNotification(req.initiatedBy, `Transfer request for worker "${req.workerName}" was rejected by ${currentUser.name}${reason ? ': ' + reason : ''}`, 'error', req.id);
    _upsertWorkerTransferInSupabase(req); saveDB(true);
    addLog(`${currentUser.name} rejected transfer of worker ${req.workerName}`);
    return true;
}

function _upsertWorkerTransferInSupabase(r) {
    if (!supabaseClient) return;
    supabaseClient.from('worker_transfer_requests').upsert({
        id: r.id, worker_id: r.workerId, worker_name: r.workerName,
        worker_residence_id: r.workerResidenceId || null,
        from_surveyor_id: r.fromSurveyorId || null, from_surveyor_name: r.fromSurveyorName || null,
        to_surveyor_id: r.toSurveyorId, to_surveyor_name: r.toSurveyorName || null,
        branch_id: r.branchId || null, reason: r.reason || null,
        status: r.status, initiated_by: r.initiatedBy || null, initiated_by_name: r.initiatedByName || null,
        receiver_approved_at: r.receiverApprovedAt || null, receiver_approved_by: r.receiverApprovedBy || null,
        head_approved_at: r.headApprovedAt || null, head_approved_by: r.headApprovedBy || null,
        admin_approved_at: r.adminApprovedAt || null, admin_approved_by: r.adminApprovedBy || null,
        rejected_by: r.rejectedBy || null, rejection_reason: r.rejectionReason || null,
        timestamp: r.timestamp || new Date().toISOString(),
        updated_at: new Date().toISOString()
    }, { onConflict: 'id' }).then(({ error }) => { if (error) console.warn('workerTransfer upsert:', error.message); });
}

function getWorkerAge(dob) {
    if (!dob) return '—';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)) + ' year';
}

// ══════════════════════════════════════════════════════════
// Profile Change Requests
// ══════════════════════════════════════════════════════════

const _pcTypeLabel = { phone: 'رقم الPhone', email: 'Email', password: 'Password' };

function submitProfileChangeRequest(type, newValue, confirmNew) {
    if (!currentUser) return false;
    if (type === 'password') {
        if (newValue !== confirmNew) { alert('Passwords do not match'); return false; }
        if (newValue.length < 6)    { alert('Password يجب أن تكandن At least 6 characters'); return false; }
    } else if (!newValue.trim()) { alert('القيمة الجديدة Requiredة'); return false; }

    const existing = db.profileChangeRequests.find(r =>
        r.userId === currentUser.id && r.type === type &&
        (r.status === 'pending_head' || r.status === 'pending_admin')
    );
    if (existing) { alert(`لديك طلب Edit ${_pcTypeLabel[type]} قيد المعالجة. Please اNoنتظار.`); return false; }

    let headId = null, initStatus = 'pending_admin';
    if (currentUser.role === 'surveyor') {
        const head = db.users.find(u => u.role === 'head' && u.responsibleBranch === currentUser.branch && u.status === 'approved');
        if (!head) { alert('None Head Surveyor لفرعك. تandاصل مع المدير مباشرة.'); return false; }
        headId = head.id; initStatus = 'pending_head';
    }

    const req = {
        id: 'pcr_' + Date.now() + '_' + Math.random().toString(36).substr(2,5),
        userId: currentUser.id, userName: currentUser.name, userEmpId: currentUser.empId,
        userRole: currentUser.role, branchId: currentUser.branch || currentUser.responsibleBranch,
        headId, type, newValue: newValue.trim(),
        newValueDisplay: type === 'password' ? '••••••' : newValue.trim(),
        status: initStatus, timestamp: new Date().toISOString()
    };
    db.profileChangeRequests.push(req);
    _upsertPCRInSupabase(req);

    if (initStatus === 'pending_head') {
        addNotification(headId,
            `طلب Edit ${_pcTypeLabel[type]} from Employee ${currentUser.name} (${currentUser.empId}) — Pending OKتك`,
            'warning', req.id, false, 'head-surveyor-dashboard.html', 'profile_change_req', false);
    } else {
        db.users.filter(u => u.role === 'admin').forEach(a =>
            addNotification(a.id,
                `طلب Edit ${_pcTypeLabel[type]} from ${currentUser.name} (${currentUser.empId}) — Pending OKتك`,
                'warning', req.id, false, 'dashboard.html', 'profile_change_req', false));
    }
    saveDB(true);
    addLog(`طلب Edit ${_pcTypeLabel[type]} from ${currentUser.name}`);
    return true;
}

function approveProfileChangeRequest(reqId) {
    const req = db.profileChangeRequests.find(r => r.id === reqId);
    if (!req) return false;
    const label = _pcTypeLabel[req.type] || req.type;

    if (currentUser.role === 'head' && req.status === 'pending_head') {
        req.status = 'pending_admin';
        req.headApprovedAt = new Date().toISOString();
        req.headApprovedBy = currentUser.name;
        db.users.filter(u => u.role === 'admin').forEach(a =>
            addNotification(a.id,
                `andافق Head Surveyor ${currentUser.name} على طلب Edit ${label} للمandظف ${req.userName} (${req.userEmpId}) — Pending OKتك`,
                'warning', req.id, false, 'dashboard.html', 'profile_change_req', false));
        addNotification(req.userId,
            `andافق Head Surveyor على طلب Edit ${label} الخاص بك — Pending Approve المدير`,
            'info', req.id, false, 'settings.html', null, false);
        _upsertPCRInSupabase(req);
        saveDB(true); return true;
    }

    if (currentUser.role === 'admin' && req.status === 'pending_admin') {
        req.status = 'approved';
        req.adminApprovedAt = new Date().toISOString();
        req.adminApprovedBy = currentUser.name;
        const user = db.users.find(u => u.id === req.userId);
        if (user) {
            if (req.type === 'phone')         user.phone    = req.newValue;
            else if (req.type === 'email')    user.email    = req.newValue;
            else if (req.type === 'password') user.password = req.newValue;
        }
        addNotification(req.userId,
            `Doneت الApprove على طلب Edit ${label} الخاص بك andDone تطبيق التغيير ✓`,
            'success', req.id, false, 'settings.html', null, false);
        if (req.headId) addNotification(req.headId,
            `andافق المدير على Edit ${label} للمandظف ${req.userName}`,
            'info', req.id, false, null, null, false);
        _upsertPCRInSupabase(req);
        saveDB(true);
        addLog(`اعDoneد ${currentUser.name} Edit ${label} للمandظف ${req.userName}`);
        return true;
    }
    return false;
}

function rejectProfileChangeRequest(reqId, note) {
    const req = db.profileChangeRequests.find(r => r.id === reqId);
    if (!req) return false;
    const label = _pcTypeLabel[req.type] || req.type;
    req.status = 'rejected';
    req.rejectedAt = new Date().toISOString();
    req.rejectedBy = currentUser.name;
    req.rejectionNote = note || '';
    addNotification(req.userId,
        `Done Reject طلب Edit ${label} الخاص بك${note ? ' — Reason: ' + note : ''}`,
        'error', req.id, false, 'settings.html', null, false);
    _upsertPCRInSupabase(req);
    saveDB(true);
    addLog(`Reject ${currentUser.name} Edit ${label} للمandظف ${req.userName}`);
    return true;
}

// ══════════════════════════════════════════════════════════
// Password Reset (called from login page without auth)
// ══════════════════════════════════════════════════════════

async function submitPasswordResetRequest(empId) {
    if (!supabaseClient) return { error: 'No database connection' };

    const { data: usersData } = await supabaseClient
        .from('users').select('*').eq('emp_id', String(empId)).eq('status', 'approved').limit(1);
    const row = usersData?.[0];
    if (!row) return { error: 'No active employee found with this ID' };

    const user = {
        id: row.id, name: row.name, empId: row.emp_id,
        branch: row.branch_id, responsibleBranch: row.responsible_branch_id
    };

    const { data: existing } = await supabaseClient
        .from('password_reset_requests').select('id')
        .eq('user_id', user.id).eq('status', 'pending').limit(1);
    if (existing?.length) return { success: true, alreadySent: true };

    const branchId = user.branch || user.responsibleBranch;
    let notifTarget = null;
    if (branchId) {
        const { data: heads } = await supabaseClient
            .from('users').select('id, name').eq('role', 'head')
            .eq('status', 'approved').eq('responsible_branch_id', branchId).limit(1);
        notifTarget = heads?.[0] || null;
    }
    if (!notifTarget) {
        const { data: admins } = await supabaseClient
            .from('users').select('id, name').eq('role', 'admin').eq('status', 'approved').limit(1);
        notifTarget = admins?.[0] || null;
    }

    const reqId = 'pwr_' + Date.now() + '_' + Math.random().toString(36).substr(2,5);
    await supabaseClient.from('password_reset_requests').insert({
        id: reqId, user_id: user.id, user_name: user.name, emp_id: user.empId,
        branch_id: branchId || null,
        head_id: notifTarget?.id || null, head_name: notifTarget?.name || null,
        status: 'pending', timestamp: new Date().toISOString()
    });

    if (notifTarget) {
        await supabaseClient.from('notifications').insert({
            user_id: notifTarget.id, read: false,
            message: `Employee ${user.name} (${user.empId}) forgot their password — please reset it`,
            type: 'warning', related_id: reqId, timestamp: new Date().toISOString(),
            link: 'dashboard.html', notif_tag: 'password_reset_req'
        });
    }

    await supabaseClient.from('logs').insert({ user_name: user.name, msg: 'Password reset request submitted' });
    return { success: true, recipientName: notifTarget?.name || 'Admin' };
}

async function resolvePasswordResetRequest(reqId, tempPass) {
    if (!tempPass || tempPass.length < 4) { alert('Password must be at least 4 characters'); return false; }

    const { data: reqs } = await supabaseClient
        .from('password_reset_requests').select('*').eq('id', reqId).limit(1);
    const req = reqs?.[0];
    if (!req) return false;

    const user = db.users.find(u => u.id === req.user_id);
    if (!user) return false;

    user.password = tempPass;
    user.mustChangePassword = true;

    await supabaseClient.from('password_reset_requests').update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: currentUser.name
    }).eq('id', reqId);

    await supabaseClient.from('users').update({ password: tempPass, must_change_password: true }).eq('id', user.id);

    if (!db.passwordResetRequests) db.passwordResetRequests = [];
    const local = db.passwordResetRequests.find(r => r.id === reqId);
    if (local) { local.status = 'resolved'; local.resolvedAt = new Date().toISOString(); }

    addNotification(req.user_id,
        `Your password was reset by ${currentUser.name} — log in and change it immediately`,
        'warning', reqId, false, null, null, false);
    addLog(`${currentUser.name} reset the password for employee ${req.user_name}`);
    return { success: true, userName: req.user_name, tempPassword: tempPass };
}

// ══════════════════════════════════════════════════════════
// Salary Raise Requests
// ══════════════════════════════════════════════════════════

function submitSalaryRaiseRequest(targetType, targetId, formData) {
    const target = targetType === 'employee'
        ? db.users.find(u => u.id === targetId)
        : (db.workers || []).find(w => w.id === targetId);
    if (!target) return false;

    const branchId = currentUser.branch || currentUser.responsibleBranch;
    const head = db.users.find(u => u.role === 'head' && u.responsibleBranch === branchId && u.status === 'approved');

    const existing = (db.salaryRaiseRequests || []).find(r =>
        r.targetId === targetId && r.status === 'pending_head');
    if (existing) { alert('يandجد Salary Raise Request قيد المعالجة لهذا Employee/الWorker'); return false; }

    const req = {
        id: 'srr_' + Date.now() + '_' + Math.random().toString(36).substr(2,4),
        targetType,
        targetId,
        targetName: target.name,
        targetEmpId: targetType === 'employee' ? (target.empId || '') : (target.empId || ''),
        targetResidenceId: targetType === 'worker' ? (target.residenceId || '') : '',
        targetNationality: targetType === 'worker' ? (target.nationality || '') : '',
        targetJoinDate: targetType === 'employee' ? (target.joinDate || '') : '',
        targetRating: targetType === 'employee' ? (getAverageRating ? getAverageRating(target.id) : null) : null,
        branchId,
        surveyorId: currentUser.id,
        surveyorName: currentUser.name,
        headId: head ? head.id : null,
        currentSalary: formData.currentSalary || '',
        requestedRaiseAmount: formData.requestedRaiseAmount || '',
        raisePercentage: formData.raisePercentage || '',
        lastRaiseDate: formData.lastRaiseDate || '',
        reason: formData.reason || '',
        achievements: formData.achievements || '',
        notes: formData.notes || '',
        status: 'pending_head',
        timestamp: new Date().toISOString()
    };
    db.salaryRaiseRequests.push(req);
    _upsertSRRInSupabase(req);

    if (head) {
        addNotification(head.id,
            `Salary Raise Request: ${req.targetName} (${targetType === 'employee' ? 'Surveyor' : 'Worker'}) — Submitted by الSurveyor ${currentUser.name}`,
            'info', req.id, true, 'head-surveyor-dashboard.html', null, false);
    }
    saveDB(true);
    addLog(`${currentUser.name} قدّم Salary Raise Request لـ ${req.targetName}`);
    return req;
}

function approveSalaryRaiseRequest(reqId) {
    const req = (db.salaryRaiseRequests || []).find(r => r.id === reqId);
    if (!req || req.status !== 'pending_head') return false;
    req.status = 'approved';
    req.approvedBy = currentUser.name;
    req.approvedAt = new Date().toISOString();
    _upsertSRRInSupabase(req);
    saveDB(true);
    addNotification(req.surveyorId,
        `✅ andافق Head Surveyor ${currentUser.name} على Salary Raise Request ${req.targetName} — Done رفع الطلب للإدارة العليا Noتخاذ Actions الNoزمة`,
        'success', req.id, false, null, null, false);
    addLog(`${currentUser.name} andافق على Salary Raise Request ${req.targetName}`);
    return true;
}

function rejectSalaryRaiseRequest(reqId, note) {
    const req = (db.salaryRaiseRequests || []).find(r => r.id === reqId);
    if (!req || req.status !== 'pending_head') return false;
    req.status = 'rejected';
    req.rejectionNote = note || '';
    req.rejectedBy = currentUser.name;
    req.rejectedAt = new Date().toISOString();
    _upsertSRRInSupabase(req);
    saveDB(true);
    addNotification(req.surveyorId,
        `❌ Reject Head Surveyor Salary Raise Request ${req.targetName}${note ? ' — ' + note : ''}`,
        'warning', req.id, false, null, null, false);
    addLog(`${currentUser.name} Reject Salary Raise Request ${req.targetName}`);
    return true;
}

window.addEventListener('load', () => {
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'en-US' ? 'rtl' : 'ltr';
    applyViewMode();
    injectGlobalAppImage();
    injectCreditBadge();
    if (currentUser) {
        renderSidebar();
        _updateNotificationBadge();
        renderNewsTicker();
        applyTranslations();
        // Push any locally-stored ticker items to Supabase on first load
        if (currentUser.role === 'admin' && (db.newsTicker || []).length > 0) {
            _syncTickerToSupabase();
        }
    }
    // Load fresh settings + full DB from Supabase
    _loadRemoteSettings();
    _loadRemoteDB();
});
