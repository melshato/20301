# AGENTS.md — Knowledge Base for AI Agents

## Architecture Overview

- **Stack**: Static HTML/CSS/JS, Supabase (PostgreSQL), Vercel (hosting)
- **DB strategy**: Local `db` object → `localStorage` backup (`sajco_db_backup`) → `_loadRemoteDB()` syncs from Supabase
- **Auth**: Supabase Auth + fallback local password check
- **Current user**: set from `localStorage` session (`sajco_session`) — a snapshot of the user object at login

## Debugging Methodology (Critical Lesson)

When debugging "buttons/UI not appearing" issues:

1. **Check the data first** — Does the record exist in `db.custodies` after `_loadRemoteDB()` completes? Open console and run `db.custodies.filter(c => c.serialNumber === '...')`
2. **Compare localStorage vs. Supabase** — The backup in localStorage is the ground truth. If data exists in localStorage but disappears after `_loadRemoteDB()`, the issue is in the merge/dedup logic inside `_execLoadRemoteDB()`.
3. **Do NOT assume ID mismatch** — UUID mismatch between local and Supabase is a common red herring. Always verify by checking actual data before chasing root causes.
4. **Check execution order** — Does the render function run before or after `await _loadRemoteDB()`? `populate*` functions called before data loads will show empty lists.

## Known Issue: Custody Dedup Deletes Pending Transfers

### Root Cause
`_execLoadRemoteDB()` in `app-core.js` has a dedup that removes duplicate serial numbers:

```javascript
const seen = new Map();
db.custodies = db.custodies.filter(c => {
    if (_terminalStatuses.includes(c.status)) return true;
    const key = c.serialNumber;
    if (seen.has(key)) return false;  // deletes the second record
    seen.set(key, true);
    return true;
});
```

When a custody is transferred, TWO records exist for the same serial:
- `approved` — the original owner
- `pending_receiver_acceptance` — the new owner

The dedup keeps whichever comes first (usually `approved`), DELETING the `pending_receiver_acceptance` record. This causes accept/reject buttons to vanish.

### Fix
Exempt all pending statuses from dedup (any status starting with `pending_` can coexist with an `approved` record during transfer):

```javascript
if (_terminalStatuses.includes(c.status)) return true;
if (c.status.startsWith('pending_')) return true;
```

### Files affected
- `app-core.js` → `_execLoadRemoteDB()`, custody dedup section (~line 3295–3304)
- `en/app-core.js` → same

## ID Synchronization Pattern

- User IDs can differ between `localStorage` backup (UUID from `crypto.randomUUID()`) and Supabase-assigned UUID
- Fix: **match by `empId`** (الرقم الوظيفي) not by `id` in all custody filters
- The `_loadRemoteDB()` user merge preserves local `id` when matched by `empId`
- All UI filters (`surveyor-dashboard.html`, `custody.html`, `notification-center.html`) now use empId-based matching:
  ```javascript
  const u = db.users.find(x => x.id === c.userId);
  return u && String(u.empId) === String(currentUser.empId);
  ```

## RLS / Sync Issues

- Supabase RLS may block user/custody inserts → data lives ONLY in localStorage backup
- `saveDB()` always saves to `sajco_db_backup` in localStorage
- `_loadRemoteDB()` merges Supabase data INTO the local db (does not replace)
- If RLS blocks, the local backup is the source of truth — data persists on the same device
- **Always call Supabase sync after every modify operation** — `updateDeviceOwner()`, `deleteUser()`, `transferCustodyToWarehouse()`, etc. were all missing sync calls at some point, causing data to revert on page reload.

## Service Worker

- `sw.js` — simple PWA SW with cache-first for static assets, network-first for HTML pages
- Known cosmetic error: `"A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received"` — harmless, suppressed by no-op `message` handler

## Common Render / Timing Issues

| Issue | Root Cause | Fix |
|---|---|---|
| Empty dropdown (user/device lists) | `populate*()` called before `await _loadRemoteDB()` | Move `populate*()` call after `await _loadRemoteDB()` |
| `deviceRows is not defined` error | Variable used before definition | Ensure variable is defined and add null checks |
| Branch column empty in devices | `d.branch` null for many devices | Fallback to `owner?.branch` or `owner?.responsibleBranch` |
| `[object Object]` in branch name | `getBranchName()` returned object instead of string | Return `b?.name \|\| '—'` instead of the branch object |
| Excel export not working | `let` variables not accessible from `onclick` | Use `window.varName = ...` instead of `let varName` |

## Data Flow Pitfalls

1. **Debounce in saveDB caused data loss** — Previously `saveDB()` used debounce. Navigating away before the debounce fired lost data. **Fix**: removed debounce, save is now immediate.
2. **Race condition in `_loadRemoteDB()`** — Multiple concurrent calls started independent Supabase requests. **Fix**: singleton pattern with in-flight request caching (`_loadingRemote` flag + `_loadingPromise`).
3. **CSP blocking CDN fonts/icons** — `font-src` and `connect-src` must include `cdnjs.cloudflare.com` in CSP headers.
4. **Calibration alerts show wrong devices for head surveyor** — `getVisibleDevices()` must filter by `responsibleBranch` for `head` role.

## User Creation Flow

- New users created in `users.html` use `crypto.randomUUID()` for local ID
- `saveDB()` writes to both localStorage (`sajco_db_backup`) and Supabase (via upsert)
- If Supabase RLS blocks → data is in localStorage only
- `_loadRemoteDB()` fetches from Supabase and merges → preserves local ID when matched by empId

## Known Issue: Maintenance/Calibration Buttons Reappear After Submitting Request

### Root Cause
When a surveyor submits a maintenance or calibration request via `sendMaintenanceRequest()`:
- Device status changes from `assigned` → `maintenance`/`needs_calibration`
- A request record is created with `status: 'pending'`

In `buildActionButtons()` (`devices.html`) and `refreshMaintenancePage()` (`maintenance.html`), the conditions only checked `!atAgent` (i.e., not `at_maintenance`/`at_calibration`) but NOT `maintenance`/`needs_calibration`. So the request buttons kept appearing even after submission.

Additionally, `sendMaintenanceRequest()` had no duplicate check — clicking the button again created another pending request.

### Fix
1. Added `hasPendingMaintenanceRequest(deviceId, serial)` helper in `app-core.js` (returns true if a `pending` request exists for that device)
2. Added duplicate prevention in `sendMaintenanceRequest()` — returns error if a pending request already exists
3. In `buildActionButtons()` → check `hasPendingMaintenanceRequest()` before showing request buttons; show `الطلب قيد المراجعة` badge instead
4. In `maintenance.html` waiting table → same check, same badge for non-admin
5. In `surveyor-dashboard.html` `renderMyDevices()` → same check, disabled buttons + badge
6. Mirrored all fixes in `en/` files

### Files affected
- `app-core.js` → new `hasPendingMaintenanceRequest()` + guard in `sendMaintenanceRequest()` (~line 1222–1233)
- `devices.html` → `buildActionButtons()` (~line 392–406)
- `en/devices.html` → same
- `surveyor-dashboard.html` → `renderMyDevices()` (~line 657–668)
- `en/surveyor-dashboard.html` → same
- `maintenance.html` → `refreshMaintenancePage()` (~line 327–338) + `reqSend()` error handling
- `en/maintenance.html` → same

## Key Variables & Storage Keys

| Key | Purpose |
|---|---|
| `sajco_session` | Current user session snapshot (set at login) |
| `sajco_db_backup` | Full DB backup (set on every `saveDB()`) |
| `currentUser` | Global user object (restored from session) |
| `db` | In-memory database (merged from backup + Supabase) |

---

## Debug Entry Points

> لكل مشكلة شائعة: أول 3 خطوات للتشخيص السريع بالترتيب.

| المشكلة | الخطوة 1 | الخطوة 2 | الخطوة 3 |
|---------|---------|---------|---------|
| **زر القبول/الرفض لا يظهر للمساح** | تحقق أن السجل موجود: `db.custodies.filter(c => c.status.startsWith('pending_'))` | تحقق من empId: `currentUser.empId` يساوي empId في السجل؟ | تحقق من dedup في `_loadRemoteDB` — هل `pending_receiver_acceptance` يُحذف بسبب وجود `approved` لنفس الجهاز؟ |
| **بيانات تختفي بعد reload** | تحقق من localStorage: `JSON.parse(localStorage.getItem('sajco_db_backup'))` | تحقق من Network tab — هل Supabase يُعيد 401/403/409؟ | راجع `_syncToSupabase()` في console — هل هناك RLS error في phase1؟ |
| **عمود الفرع فارغ** | تحقق من `d.branch` للجهاز: `db.devices.find(d => d.serial === '...')` | تحقق من `owner?.branch`: `db.users.find(u => u.id === device.ownerId)?.branch` | تحقق من Supabase — هل `branch_id` محفوظ في جدول devices؟ |
| **فلترة لا تُعطي نتائج** | طبّع القيم: `console.log(currentUser.empId, typeof currentUser.empId)` | قارن مع السجلات: `db.custodies.map(c => c.userId)` | تحقق من مطابقة النوع: هل يقارن UUID مع empId بدلاً من empId مع empId؟ |
| **إشعار لم يصل** | تحقق: `db.notifications.filter(n => n.userId === targetUserId)` | تحقق أن `addNotification()` تُستدعى فعلاً — أضف `console.log` قبلها | تحقق أن `_isUUID(userId)` = true — قد يكون ID غير UUID فيُتخطَّى |
| **صيانة لا تُعتمَد** | تحقق حالة الطلب: `db.maintenanceRequests.find(r => r.serialNumber === '...')?.status` | تحقق دور المستخدم: `currentUser.role === 'admin'` مطلوب للاعتماد | تحقق أن الجهاز ليس `at_maintenance` بالفعل — `approveMaintenanceRequest` يرفض المكرر |
| **عهدة لا تُوافَق عليها** | تحقق حالتها: `db.custodies.find(c => c.id === '...')?.status` | تحقق أن المستخدم هو المدير أو رئيس المساحين المسؤول عن الفرع | تحقق `approveCustody('admin')` — هل `c.userId !== c.assignedBy`؟ إذا نعم تذهب لـ `pending_surveyor_acceptance` |
| **دالة تتصرف بشكل غريب** | ابحث عن تعريفات مكررة: grep لاسم الدالة في جميع الملفات | تحقق من آخر تعريف — JavaScript يستخدم الأخير | تحقق من `window.funcName` vs `function funcName` — أيهما يُستدعى؟ |
| **صفحة EN مختلفة عن AR** | شغّل `sync-check.ps1` للحصول على الفروق | قارن الدوال المفقودة: `onlyInAr` vs `onlyInEn` | طبّق الإصلاح على كلا الملفين في نفس الـ commit |
| **401 من Supabase** | تحقق الجلسة: `supabaseClient.auth.getSession()` في console | تحقق أن `auth_uid` للمستخدم موجود في `db.users` | تحقق RLS policies في Supabase Dashboard — هل `is_admin()` تعمل؟ |
