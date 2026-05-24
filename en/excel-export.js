// ============================================================
// excel-export.js — XLSX export engine (English UI)
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
    if (!rows || rows.length === 0) { alert('No data to export.'); return; }
    _waitXLSX(() => {
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Data');
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
        if (!hasData) { alert('No data to export.'); return; }
        XLSX.writeFile(wb, filename + '.xlsx');
    });
}

// ---- Label maps ----
const _xRoles       = { admin: 'General Manager', head: 'Head Surveyor', surveyor: 'Surveyor', developer: 'Developer' };
const _xDevStatus   = { warehouse: 'Warehouse', assigned: 'Assigned', maintenance: 'Maintenance', needs_calibration: 'Needs Calibration', at_maintenance: 'At Vendor – Maintenance', at_calibration: 'At Vendor – Calibration' };
const _xCustStatus  = { pending_approval: 'Pending Approval', pending_head_approval: 'Pending Head Approval', pending_admin_approval: 'Pending Admin Approval', pending_receiver_acceptance: 'Pending Receiver', approved: 'Approved', rejected: 'Rejected', returned: 'Returned', transferred_out: 'Transferred Out', transferred_in: 'Transferred In' };
const _xLeaveType   = { annual: 'Annual', emergency: 'Emergency', sick: 'Sick', other: 'Other' };
const _xLeaveStatus = { pending: 'Pending', pending_head_approval: 'Pending Head', pending_admin_approval: 'Pending Admin', approved: 'Approved', rejected: 'Rejected', cancelled: 'Cancelled' };
const _xMaintType   = { maintenance: 'Maintenance', calibration: 'Calibration' };
const _xMaintStatus = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', at_vendor: 'At Vendor', completed: 'Completed' };
const _xWrkStatus   = { available: 'Available', on_leave: 'On Leave', terminated: 'Terminated' };

// ---- Helpers ----
function _xDate(v)   { if (!v) return '—'; return new Date(v).toLocaleDateString('en-GB'); }
function _xBranch(id){ return db.branches.find(b => b.id === id)?.nameEn || db.branches.find(b => b.id === id)?.name || '—'; }
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
            'Serial No.': d.serial || '—',
            'Type': _xDType(d.type),
            'Owner': owner?.name || 'Warehouse',
            'Branch': _xBranch(owner?.branch || owner?.responsibleBranch),
            'Calibration Date': _xDate(d.calDate),
            'Status': _xDevStatus[d.status] || d.status || '—',
        };
    });
    exportXLSX(rows, `Devices_${_xToday()}`, 'Devices');
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
        'Device Type': _xDType(c.deviceType),
        'Serial No.': c.serialNumber || '—',
        'Assigned To': _xUser(c.userId),
        'Issued By': _xUser(c.assignedBy),
        'Date Assigned': _xDate(c.assignedDate || c.timestamp),
        'Branch': _xBranch(c.branchId),
        'Status': _xCustStatus[c.status] || c.status || '—',
        'Notes': c.receiverNotes || '—',
    }));
    exportXLSX(rows, `Custodies_${_xToday()}`, 'Custodies');
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
        'Name': w.name || '—',
        'Residence ID': w.residenceId || '—',
        'Nationality': w.nationality || '—',
        'Phone': w.phone || '—',
        'Age': w.age || '—',
        'Status': _xWrkStatus[w.status] || w.status || '—',
        'Project': w.project || '—',
        'Surveyor': w.surveyorName || _xUser(w.surveyorId),
        'Branch': _xBranch(w.branchId),
        'Date Added': _xDate(w.addedAt),
    }));
    exportXLSX(rows, `Workers_${_xToday()}`, 'Workers');
};

window.exportUsersXLSX = function() {
    reloadDB();
    const rows = db.users.filter(u => u.status !== 'rejected').map(u => ({
        'Name': u.name || '—',
        'Employee ID': u.empId || '—',
        'Email': u.email || '—',
        'Role': _xRoles[u.role] || u.role || '—',
        'Branch': _xBranch(u.branch || u.responsibleBranch),
        'Responsible Branch': _xBranch(u.responsibleBranch),
        'Status': u.status === 'approved' ? 'Active' : (u.status === 'pending' ? 'Pending Approval' : 'Suspended'),
    }));
    exportXLSX(rows, `Users_${_xToday()}`, 'Users');
};

window.exportBranchesXLSX = function() {
    reloadDB();
    const rows = db.branches.map(b => {
        const head    = db.users.find(u => u.role === 'head' && u.responsibleBranch === b.id);
        const members = db.users.filter(u => (u.branch === b.id || u.responsibleBranch === b.id) && u.status === 'approved').length;
        return {
            '#': b.serialNumber || '—',
            'Branch Name': b.nameEn || b.name || b.nameAr || '—',
            'Head Surveyor': head?.name || 'Not assigned',
            'Staff Count': members,
        };
    });
    exportXLSX(rows, `Branches_${_xToday()}`, 'Branches');
};

window.exportProjectsXLSX = function() {
    reloadDB();
    const rows = (db.projects || []).map(p => ({
        'Project Name': p.name || '—',
        'Code': p.code || '—',
        'Location': p.location || '—',
        'Branch': _xBranch(p.branchId),
        'Status': p.status || '—',
        'Completion %': p.completion || 0,
        'Start Date': _xDate(p.startDate),
        'End Date': _xDate(p.endDate),
    }));
    exportXLSX(rows, `Projects_${_xToday()}`, 'Projects');
};

window.exportLogsXLSX = function() {
    reloadDB();
    const rows = (db.logs || []).map(l => ({
        'Date & Time': l.timestamp ? new Date(l.timestamp).toLocaleString('en-GB') : '—',
        'User': l.user || '—',
        'Action': l.msg || l.action || '—',
    }));
    exportXLSX(rows, `Logs_${_xToday()}`, 'Logs');
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
        'Employee': _xUser(r.userId),
        'Type': _xLeaveType[r.type] || r.type || '—',
        'Departure Date': _xDate(r.startDate),
        'Return Date': _xDate(r.endDate),
        'Requested Days': r.requestedDays || '—',
        'Approved Days': r.approvedDays || '—',
        'Status': _xLeaveStatus[r.status] || r.status || '—',
        'Actually Left': r.actuallyLeft ? 'Yes' : 'No',
        'Branch': _xBranch(r.branchId),
    }));
    exportXLSX(rows, `LeaveRequests_${_xToday()}`, 'Leave Requests');
};

window.exportMaintenanceXLSX = function() {
    reloadDB();
    const rows = (db.maintenanceRequests || []).map(r => ({
        'Device (Serial)': r.deviceSerial || '—',
        'Type': _xDType(r.deviceType),
        'Request Type': _xMaintType[r.requestType] || r.requestType || '—',
        'Requested By': _xUser(r.requestedBy),
        'Branch': _xBranch(r.branchId),
        'Date': _xDate(r.timestamp),
        'Status': _xMaintStatus[r.status] || r.status || '—',
        'Notes': r.notes || '—',
    }));
    exportXLSX(rows, `Maintenance_${_xToday()}`, 'Maintenance');
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
                'Serial No.': d.serial || '—',
                'Type': _xDType(d.type),
                'Owner': owner?.name || '—',
                'Branch': _xBranch(owner?.branch || owner?.responsibleBranch),
                'Head Surveyor': head?.name || '—',
                'Calibration Date': _xDate(d.calDate),
                'Days Remaining': diff < 0 ? `Overdue by ${Math.abs(diff)} day(s)` : `${diff} day(s)`,
                'Status': diff < 0 ? 'Expired' : 'Due Soon',
            };
        });
    exportXLSX(rows, `CalibrationAlerts_${_xToday()}`, 'Calibration Alerts');
};

window.exportDeviceHistoryXLSX = function(records) {
    if (!records || records.length === 0) { alert('No data to export. Please search first.'); return; }
    const rows = records.map(c => ({
        'Date': c.timestamp ? new Date(c.timestamp).toLocaleString('en-GB') : '—',
        'Device': _xDType(c.deviceType) + ` (${c.serialNumber || '—'})`,
        'Assigned To': _xUser(c.userId),
        'Branch': _xBranch(c.branchId),
        'Issued By': _xUser(c.assignedBy),
        'Receipt Date': _xDate(c.receiptDate || c.assignedDate),
        'Notes': c.notes || c.receiverNotes || '—',
        'Status': _xCustStatus[c.status] || c.status || '—',
    }));
    const serial = records[0]?.serialNumber || 'device';
    exportXLSX(rows, `DeviceHistory_${serial}_${_xToday()}`, 'Device History');
};

window.exportUserHistoryXLSX = function(records, userName) {
    if (!records || records.length === 0) { alert('No data to export. Please search first.'); return; }
    const rows = records.map(r => ({
        'Date': r.timestamp ? new Date(r.timestamp).toLocaleString('en-GB') : '—',
        'Device': _xDType(r.deviceType) + ` (${r.serialNumber || '—'})`,
        'Action': r.action || '—',
        'By': r.byUser || '—',
        'Branch': _xBranch(r.branchId),
        'Notes': r.notes || '—',
        'Approval Trail': (r.approvalHistory || []).map(h => `${h.approverRole}: ${h.approverName}`).join(' | ') || '—',
    }));
    exportXLSX(rows, `CustodyHistory_${userName || 'user'}_${_xToday()}`, 'Custody History');
};

window.exportRatingsXLSX = function() {
    reloadDB();
    const rows = (db.ratings || []).map(r => {
        const user  = db.users.find(u => u.id === r.userId);
        const rater = db.users.find(u => u.id === r.ratedBy);
        return {
            'Employee': user?.name || '—',
            'Employee ID': user?.empId || '—',
            'Branch': _xBranch(user?.branch || user?.responsibleBranch),
            'Rated By': rater?.name || '—',
            'Stars': r.stars || '—',
            'Total Score': r.totalScore || '—',
            'Date': _xDate(r.timestamp),
            'Notes': r.notes || '—',
        };
    });
    exportXLSX(rows, `Ratings_${_xToday()}`, 'Ratings');
};

window.exportNotificationsXLSX = function() {
    reloadDB();
    const rows = db.notifications
        .filter(n => n.userId === currentUser.id)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .map(n => ({
            'Message': n.message || '—',
            'Type': n.type || '—',
            'Date': n.timestamp ? new Date(n.timestamp).toLocaleString('en-GB') : '—',
            'Status': n.read ? 'Read' : 'Unread',
        }));
    exportXLSX(rows, `Notifications_${_xToday()}`, 'Notifications');
};

window.exportReportsXLSX = function() {
    reloadDB();
    const alertDays = db.settings?.alertDays ?? 30;
    const now = new Date();

    const devRows = db.devices.map(d => {
        const owner = db.users.find(u => u.id === d.ownerId);
        return { 'Serial No.': d.serial || '—', 'Type': _xDType(d.type), 'Owner': owner?.name || 'Warehouse', 'Branch': _xBranch(owner?.branch || owner?.responsibleBranch), 'Calibration Date': _xDate(d.calDate), 'Status': _xDevStatus[d.status] || d.status || '—' };
    });

    const userRows = db.users.filter(u => ['admin','head','surveyor'].includes(u.role) && u.status === 'approved').map(u => ({
        'Name': u.name || '—', 'Employee ID': u.empId || '—', 'Role': _xRoles[u.role] || u.role || '—', 'Branch': _xBranch(u.branch || u.responsibleBranch), 'Email': u.email || '—',
    }));

    const projRows = (db.projects || []).map(p => ({
        'Name': p.name || '—', 'Code': p.code || '—', 'Location': p.location || '—', 'Branch': _xBranch(p.branchId), 'Status': p.status || '—', 'Completion %': p.completion || 0, 'Start': _xDate(p.startDate), 'End': _xDate(p.endDate),
    }));

    const leaveRows = (db.leaveRequests || []).map(r => ({
        'Employee': _xUser(r.userId), 'Type': _xLeaveType[r.type] || r.type || '—', 'Departure': _xDate(r.startDate), 'Return': _xDate(r.endDate), 'Days': r.requestedDays || '—', 'Approved Days': r.approvedDays || '—', 'Status': _xLeaveStatus[r.status] || r.status || '—',
    }));

    const maintRows = (db.maintenanceRequests || []).map(r => ({
        'Device': r.deviceSerial || '—', 'Request Type': _xMaintType[r.requestType] || r.requestType || '—', 'Requested By': _xUser(r.requestedBy), 'Branch': _xBranch(r.branchId), 'Date': _xDate(r.timestamp), 'Status': _xMaintStatus[r.status] || r.status || '—',
    }));

    const custRows = db.custodies.map(c => ({
        'Type': _xDType(c.deviceType), 'Serial': c.serialNumber || '—', 'Assigned To': _xUser(c.userId), 'Branch': _xBranch(c.branchId), 'Date': _xDate(c.assignedDate || c.timestamp), 'Status': _xCustStatus[c.status] || c.status || '—',
    }));

    const wrkRows = (db.workers || []).map(w => ({
        'Name': w.name || '—', 'Residence ID': w.residenceId || '—', 'Nationality': w.nationality || '—', 'Status': _xWrkStatus[w.status] || w.status || '—', 'Surveyor': w.surveyorName || _xUser(w.surveyorId), 'Branch': _xBranch(w.branchId),
    }));

    const alertRows = db.devices
        .filter(d => d.calDate && Math.ceil((new Date(d.calDate) - now) / 86400000) <= alertDays)
        .map(d => {
            const diff = Math.ceil((new Date(d.calDate) - now) / 86400000);
            const owner = db.users.find(u => u.id === d.ownerId);
            return { 'Serial': d.serial || '—', 'Type': _xDType(d.type), 'Owner': owner?.name || '—', 'Branch': _xBranch(owner?.branch || owner?.responsibleBranch), 'Days Remaining': diff < 0 ? `Overdue ${Math.abs(diff)}d` : `${diff}d`, 'Status': diff < 0 ? 'Expired' : 'Due Soon' };
        });

    exportMultiSheetXLSX([
        { rows: devRows,   name: 'Devices' },
        { rows: userRows,  name: 'Staff' },
        { rows: projRows,  name: 'Projects' },
        { rows: leaveRows, name: 'Leave Requests' },
        { rows: maintRows, name: 'Maintenance' },
        { rows: custRows,  name: 'Custodies' },
        { rows: wrkRows,   name: 'Workers' },
        { rows: alertRows, name: 'Calibration Alerts' },
    ], `SAJCO_Reports_${_xToday()}`);
};
