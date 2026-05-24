// ============================================================
// excel-export.js — XLSX export engine (Arabic UI)
// Depends on app-core.js being loaded first
// ============================================================

(function _loadXLSX() {
    if (window.XLSX) return;
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
})();

function _waitXLSX(cb) {
    if (window.XLSX) { cb(); return; }
    setTimeout(() => _waitXLSX(cb), 80);
}

function exportXLSX(rows, filename, sheetName) {
    if (!rows || rows.length === 0) { alert('لا توجد بيانات للتصدير.'); return; }
    _waitXLSX(() => {
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName || 'بيانات');
        XLSX.writeFile(wb, filename + '.xlsx');
    });
}

function exportMultiSheetXLSX(sheets, filename) {
    _waitXLSX(() => {
        const wb = XLSX.utils.book_new();
        let hasData = false;
        sheets.forEach(({ rows, name }) => {
            if (rows && rows.length > 0) {
                const ws = XLSX.utils.json_to_sheet(rows);
                XLSX.utils.book_append_sheet(wb, ws, name);
                hasData = true;
            }
        });
        if (!hasData) { alert('لا توجد بيانات للتصدير.'); return; }
        XLSX.writeFile(wb, filename + '.xlsx');
    });
}

// ---- Label maps ----
const _xRoles       = { admin: 'مدير عام', head: 'رئيس مساحين', surveyor: 'مساح', developer: 'مطور' };
const _xDevStatus   = { warehouse: 'مستودع', assigned: 'عهدة شخصية', maintenance: 'صيانة', needs_calibration: 'يحتاج معايرة', at_maintenance: 'عند الوكيل - صيانة', at_calibration: 'عند الوكيل - معايرة' };
const _xCustStatus  = { pending_approval: 'بانتظار القبول', pending_head_approval: 'بانتظار رئيس المساحين', pending_admin_approval: 'بانتظار المدير', pending_receiver_acceptance: 'بانتظار المستلم', approved: 'معتمد', rejected: 'مرفوض', returned: 'مُعاد', transferred_out: 'منقول', transferred_in: 'منقول إليه' };
const _xLeaveType   = { annual: 'سنوية', emergency: 'طارئة', sick: 'مرضية', other: 'أخرى' };
const _xLeaveStatus = { pending: 'بانتظار', pending_head_approval: 'بانتظار رئيس المساحين', pending_admin_approval: 'بانتظار المدير', approved: 'معتمد', rejected: 'مرفوض', cancelled: 'ملغي' };
const _xMaintType   = { maintenance: 'صيانة', calibration: 'معايرة' };
const _xMaintStatus = { pending: 'بانتظار', approved: 'موافق عليه', rejected: 'مرفوض', at_vendor: 'عند الوكيل', completed: 'مكتمل' };
const _xWrkStatus   = { available: 'متاح', on_leave: 'في إجازة', terminated: 'منتهي' };

// ---- Helpers ----
function _xDate(v)   { if (!v) return '—'; return new Date(v).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }); }
function _xBranch(id){ return db.branches.find(b => b.id === id)?.name || '—'; }
function _xUser(id)  { return db.users.find(u => u.id === id)?.name || '—'; }
function _xToday()   { return new Date().toLocaleDateString('en-GB').replace(/\//g, '-'); }
function _xDType(t)  { return (typeof getDeviceTypeName === 'function') ? getDeviceTypeName(t) : (t || '—'); }

// ============================================================
// Page-specific exports
// ============================================================

window.exportDevicesXLSX = function() {
    reloadDB();
    const rows = db.devices.map(d => {
        const owner = db.users.find(u => u.id === d.ownerId);
        return {
            'الرقم التسلسلي': d.serial || '—',
            'النوع': _xDType(d.type),
            'المالك': owner?.name || 'المستودع',
            'الفرع': _xBranch(owner?.branch || owner?.responsibleBranch),
            'تاريخ المعايرة': _xDate(d.calDate),
            'الحالة': _xDevStatus[d.status] || d.status || '—',
        };
    });
    exportXLSX(rows, `الأجهزة_${_xToday()}`, 'الأجهزة');
};

window.exportCustodyXLSX = function() {
    reloadDB();
    const isAdmin = ['admin','developer'].includes(currentUser.role);
    const isHead  = currentUser.role === 'head';
    let list = db.custodies;
    if (!isAdmin) {
        list = isHead
            ? list.filter(c => c.branchId === currentUser.responsibleBranch)
            : list.filter(c => c.userId === currentUser.id);
    }
    const rows = list.map(c => ({
        'نوع الجهاز': _xDType(c.deviceType),
        'الرقم التسلسلي': c.serialNumber || '—',
        'المستلم': _xUser(c.userId),
        'صادرة من': _xUser(c.assignedBy),
        'تاريخ الاستلام': _xDate(c.assignedDate || c.timestamp),
        'الفرع': _xBranch(c.branchId),
        'الحالة': _xCustStatus[c.status] || c.status || '—',
        'ملاحظات': c.receiverNotes || '—',
    }));
    exportXLSX(rows, `العهد_${_xToday()}`, 'العهد');
};

window.exportWorkersXLSX = function() {
    reloadDB();
    const isAdmin = ['admin','developer'].includes(currentUser.role);
    const isHead  = currentUser.role === 'head';
    let list = db.workers || [];
    if (!isAdmin) {
        if (isHead) {
            const sids = db.users.filter(u => u.role === 'surveyor' && u.branch === currentUser.responsibleBranch).map(u => u.id);
            list = list.filter(w => sids.includes(w.surveyorId));
        } else {
            list = list.filter(w => w.surveyorId === currentUser.id);
        }
    }
    const rows = list.map((w, i) => ({
        '#': i + 1,
        'الاسم': w.name || '—',
        'رقم الإقامة': w.residenceId || '—',
        'الجنسية': w.nationality || '—',
        'الجوال': w.phone || '—',
        'العمر': w.age || '—',
        'الحالة': _xWrkStatus[w.status] || w.status || '—',
        'المشروع': w.project || '—',
        'المساح المسؤول': w.surveyorName || _xUser(w.surveyorId),
        'الفرع': _xBranch(w.branchId),
        'تاريخ الإضافة': _xDate(w.addedAt),
    }));
    exportXLSX(rows, `العمال_${_xToday()}`, 'العمال');
};

window.exportUsersXLSX = function() {
    reloadDB();
    const rows = db.users.filter(u => u.status !== 'rejected').map(u => ({
        'الاسم': u.name || '—',
        'الرقم الوظيفي': u.empId || '—',
        'البريد الإلكتروني': u.email || '—',
        'الدور': _xRoles[u.role] || u.role || '—',
        'الفرع': _xBranch(u.branch || u.responsibleBranch),
        'الفرع المسؤول': _xBranch(u.responsibleBranch),
        'الحالة': u.status === 'approved' ? 'نشط' : (u.status === 'pending' ? 'بانتظار الموافقة' : 'موقوف'),
    }));
    exportXLSX(rows, `المستخدمون_${_xToday()}`, 'المستخدمون');
};

window.exportBranchesXLSX = function() {
    reloadDB();
    const rows = db.branches.map(b => {
        const head    = db.users.find(u => u.role === 'head' && u.responsibleBranch === b.id);
        const members = db.users.filter(u => (u.branch === b.id || u.responsibleBranch === b.id) && u.status === 'approved').length;
        return {
            'م': b.serialNumber || '—',
            'اسم الفرع': b.name || b.nameAr || '—',
            'رئيس المساحين': head?.name || 'غير محدد',
            'عدد الموظفين': members,
        };
    });
    exportXLSX(rows, `الفروع_${_xToday()}`, 'الفروع');
};

window.exportProjectsXLSX = function() {
    reloadDB();
    const rows = (db.projects || []).map(p => ({
        'اسم المشروع': p.name || '—',
        'الكود': p.code || '—',
        'الموقع': p.location || '—',
        'الفرع': _xBranch(p.branchId),
        'الحالة': p.status || '—',
        'الإنجاز %': p.completion || 0,
        'تاريخ البداية': _xDate(p.startDate),
        'تاريخ الانتهاء': _xDate(p.endDate),
    }));
    exportXLSX(rows, `المشاريع_${_xToday()}`, 'المشاريع');
};

window.exportLogsXLSX = function() {
    reloadDB();
    const rows = (db.logs || []).map(l => ({
        'التاريخ والوقت': l.timestamp ? new Date(l.timestamp).toLocaleString('ar-SA') : '—',
        'المستخدم': l.user || '—',
        'العملية': l.msg || l.action || '—',
    }));
    exportXLSX(rows, `السجلات_${_xToday()}`, 'السجلات');
};

window.exportLeaveRequestsXLSX = function() {
    reloadDB();
    const isAdmin = ['admin','developer'].includes(currentUser.role);
    const isHead  = currentUser.role === 'head';
    let list = db.leaveRequests || [];
    if (!isAdmin) {
        list = isHead
            ? list.filter(r => r.branchId === currentUser.responsibleBranch)
            : list.filter(r => r.userId === currentUser.id);
    }
    const rows = list.map(r => ({
        'الموظف': _xUser(r.userId),
        'النوع': _xLeaveType[r.type] || r.type || '—',
        'تاريخ المغادرة': _xDate(r.startDate),
        'تاريخ العودة': _xDate(r.endDate),
        'الأيام المطلوبة': r.requestedDays || '—',
        'الأيام المعتمدة': r.approvedDays || '—',
        'الحالة': _xLeaveStatus[r.status] || r.status || '—',
        'غادر فعلياً': r.actuallyLeft ? 'نعم' : 'لا',
        'الفرع': _xBranch(r.branchId),
    }));
    exportXLSX(rows, `الإجازات_${_xToday()}`, 'الإجازات');
};

window.exportMaintenanceXLSX = function() {
    reloadDB();
    const rows = (db.maintenanceRequests || []).map(r => ({
        'الجهاز (سيريال)': r.deviceSerial || '—',
        'النوع': _xDType(r.deviceType),
        'نوع الطلب': _xMaintType[r.requestType] || r.requestType || '—',
        'الطالب': _xUser(r.requestedBy),
        'الفرع': _xBranch(r.branchId),
        'تاريخ الطلب': _xDate(r.timestamp),
        'الحالة': _xMaintStatus[r.status] || r.status || '—',
        'ملاحظات': r.notes || '—',
    }));
    exportXLSX(rows, `الصيانة_والمعايرة_${_xToday()}`, 'الصيانة والمعايرة');
};

window.exportCalibrationAlertsXLSX = function() {
    reloadDB();
    const alertDays = db.settings?.alertDays ?? 30;
    const now = new Date();
    const rows = db.devices
        .filter(d => d.calDate && Math.ceil((new Date(d.calDate) - now) / 86400000) <= alertDays)
        .map(d => {
            const diff  = Math.ceil((new Date(d.calDate) - now) / 86400000);
            const owner = db.users.find(u => u.id === d.ownerId);
            const head  = db.users.find(u => u.role === 'head' && u.responsibleBranch === (owner?.branch || owner?.responsibleBranch));
            return {
                'الرقم التسلسلي': d.serial || '—',
                'النوع': _xDType(d.type),
                'المالك': owner?.name || '—',
                'الفرع': _xBranch(owner?.branch || owner?.responsibleBranch),
                'رئيس المساحين': head?.name || '—',
                'تاريخ المعايرة': _xDate(d.calDate),
                'الأيام المتبقية': diff < 0 ? `متأخر بـ ${Math.abs(diff)} يوم` : `${diff} يوم`,
                'الحالة': diff < 0 ? 'انتهت الصلاحية' : 'مطلوب قريباً',
            };
        });
    exportXLSX(rows, `تنبيهات_المعايرة_${_xToday()}`, 'تنبيهات المعايرة');
};

window.exportDeviceHistoryXLSX = function(records) {
    if (!records || records.length === 0) { alert('لا توجد بيانات لتصديرها. قم بالبحث أولاً.'); return; }
    const rows = records.map(c => ({
        'تاريخ العملية': c.timestamp ? new Date(c.timestamp).toLocaleString('ar-SA') : '—',
        'الجهاز': _xDType(c.deviceType) + ` (${c.serialNumber || '—'})`,
        'المساح المستلم': _xUser(c.userId),
        'الفرع': _xBranch(c.branchId),
        'بواسطة': _xUser(c.assignedBy),
        'تاريخ الاستلام': _xDate(c.receiptDate || c.assignedDate),
        'ملاحظات': c.notes || c.receiverNotes || '—',
        'الحالة': _xCustStatus[c.status] || c.status || '—',
    }));
    const serial = records[0]?.serialNumber || 'جهاز';
    exportXLSX(rows, `سجل_الجهاز_${serial}_${_xToday()}`, 'سجل الجهاز');
};

window.exportUserHistoryXLSX = function(records, userName) {
    if (!records || records.length === 0) { alert('لا توجد بيانات لتصديرها. قم بالبحث أولاً.'); return; }
    const rows = records.map(r => ({
        'تاريخ العملية': r.timestamp ? new Date(r.timestamp).toLocaleString('ar-SA') : '—',
        'الجهاز': _xDType(r.deviceType) + ` (${r.serialNumber || '—'})`,
        'العملية': r.action || '—',
        'بواسطة': r.byUser || '—',
        'الفرع': _xBranch(r.branchId),
        'ملاحظات': r.notes || '—',
        'تتبع الموافقات': (r.approvalHistory || []).map(h => `${h.approverRole}: ${h.approverName}`).join(' | ') || '—',
    }));
    exportXLSX(rows, `سجل_عهدة_${userName || 'موظف'}_${_xToday()}`, 'سجل العهدة');
};

window.exportRatingsXLSX = function() {
    reloadDB();
    const rows = (db.ratings || []).map(r => {
        const user  = db.users.find(u => u.id === r.userId);
        const rater = db.users.find(u => u.id === r.ratedBy);
        return {
            'الموظف': user?.name || '—',
            'الرقم الوظيفي': user?.empId || '—',
            'الفرع': _xBranch(user?.branch || user?.responsibleBranch),
            'المقيِّم': rater?.name || '—',
            'التقييم (نجوم)': r.stars || '—',
            'إجمالي النقاط': r.totalScore || '—',
            'التاريخ': _xDate(r.timestamp),
            'ملاحظات': r.notes || '—',
        };
    });
    exportXLSX(rows, `التقييمات_${_xToday()}`, 'التقييمات');
};

window.exportNotificationsXLSX = function() {
    reloadDB();
    const rows = db.notifications
        .filter(n => n.userId === currentUser.id)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .map(n => ({
            'الرسالة': n.message || '—',
            'النوع': n.type || '—',
            'التاريخ': n.timestamp ? new Date(n.timestamp).toLocaleString('ar-SA') : '—',
            'الحالة': n.read ? 'مقروء' : 'غير مقروء',
        }));
    exportXLSX(rows, `الإشعارات_${_xToday()}`, 'الإشعارات');
};

window.exportReportsXLSX = function() {
    reloadDB();
    const alertDays = db.settings?.alertDays ?? 30;
    const now = new Date();

    const devRows = db.devices.map(d => {
        const owner = db.users.find(u => u.id === d.ownerId);
        return { 'الرقم التسلسلي': d.serial || '—', 'النوع': _xDType(d.type), 'المالك': owner?.name || 'المستودع', 'الفرع': _xBranch(owner?.branch || owner?.responsibleBranch), 'تاريخ المعايرة': _xDate(d.calDate), 'الحالة': _xDevStatus[d.status] || d.status || '—' };
    });

    const userRows = db.users.filter(u => ['admin','head','surveyor'].includes(u.role) && u.status === 'approved').map(u => ({
        'الاسم': u.name || '—', 'الرقم الوظيفي': u.empId || '—', 'الدور': _xRoles[u.role] || u.role || '—', 'الفرع': _xBranch(u.branch || u.responsibleBranch), 'البريد الإلكتروني': u.email || '—',
    }));

    const projRows = (db.projects || []).map(p => ({
        'اسم المشروع': p.name || '—', 'الكود': p.code || '—', 'الموقع': p.location || '—', 'الفرع': _xBranch(p.branchId), 'الحالة': p.status || '—', 'الإنجاز %': p.completion || 0, 'تاريخ البداية': _xDate(p.startDate), 'تاريخ الانتهاء': _xDate(p.endDate),
    }));

    const leaveRows = (db.leaveRequests || []).map(r => ({
        'الموظف': _xUser(r.userId), 'النوع': _xLeaveType[r.type] || r.type || '—', 'المغادرة': _xDate(r.startDate), 'العودة': _xDate(r.endDate), 'الأيام': r.requestedDays || '—', 'الأيام المعتمدة': r.approvedDays || '—', 'الحالة': _xLeaveStatus[r.status] || r.status || '—',
    }));

    const maintRows = (db.maintenanceRequests || []).map(r => ({
        'الجهاز': r.deviceSerial || '—', 'نوع الطلب': _xMaintType[r.requestType] || r.requestType || '—', 'الطالب': _xUser(r.requestedBy), 'الفرع': _xBranch(r.branchId), 'تاريخ الطلب': _xDate(r.timestamp), 'الحالة': _xMaintStatus[r.status] || r.status || '—',
    }));

    const custRows = db.custodies.map(c => ({
        'النوع': _xDType(c.deviceType), 'الرقم التسلسلي': c.serialNumber || '—', 'المستلم': _xUser(c.userId), 'الفرع': _xBranch(c.branchId), 'التاريخ': _xDate(c.assignedDate || c.timestamp), 'الحالة': _xCustStatus[c.status] || c.status || '—',
    }));

    const wrkRows = (db.workers || []).map(w => ({
        'الاسم': w.name || '—', 'رقم الإقامة': w.residenceId || '—', 'الجنسية': w.nationality || '—', 'الحالة': _xWrkStatus[w.status] || w.status || '—', 'المساح': w.surveyorName || _xUser(w.surveyorId), 'الفرع': _xBranch(w.branchId),
    }));

    const alertRows = db.devices
        .filter(d => d.calDate && Math.ceil((new Date(d.calDate) - now) / 86400000) <= alertDays)
        .map(d => {
            const diff = Math.ceil((new Date(d.calDate) - now) / 86400000);
            const owner = db.users.find(u => u.id === d.ownerId);
            return { 'الرقم التسلسلي': d.serial || '—', 'النوع': _xDType(d.type), 'المالك': owner?.name || '—', 'الفرع': _xBranch(owner?.branch || owner?.responsibleBranch), 'الأيام المتبقية': diff < 0 ? `متأخر بـ ${Math.abs(diff)} يوم` : `${diff} يوم`, 'الحالة': diff < 0 ? 'انتهت الصلاحية' : 'مطلوب قريباً' };
        });

    exportMultiSheetXLSX([
        { rows: devRows,   name: 'الأجهزة' },
        { rows: userRows,  name: 'الموظفون' },
        { rows: projRows,  name: 'المشاريع' },
        { rows: leaveRows, name: 'الإجازات' },
        { rows: maintRows, name: 'الصيانة والمعايرة' },
        { rows: custRows,  name: 'العهد' },
        { rows: wrkRows,   name: 'العمال' },
        { rows: alertRows, name: 'تنبيهات المعايرة' },
    ], `تقارير_ساجكو_${_xToday()}`);
};
