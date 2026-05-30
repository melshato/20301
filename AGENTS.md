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

## Key Variables & Storage Keys

| Key | Purpose |
|---|---|
| `sajco_session` | Current user session snapshot (set at login) |
| `sajco_db_backup` | Full DB backup (set on every `saveDB()`) |
| `currentUser` | Global user object (restored from session) |
| `db` | In-memory database (merged from backup + Supabase) |
