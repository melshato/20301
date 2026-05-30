# سجل المشاكل والحلول — نظام SAJCO

> توثيق شامل لجميع المشاكل التي واجهت النظام وكيفية حلها، مرتبة من الأحدث للأقدم.

---

## 1. أزرار القبول والرفض لا تظهر عند المساح عند نقل العهدة

**الصفحة المتأثرة:** `custody.html`

**وصف المشكلة:**
عند نقل عهدة من مساح لآخر، ينشئ النظام سجلَّين في جدول العهدات لنفس الجهاز:
- سجل المُرسِل (المالك القديم): `status: 'approved'`
- سجل المستلم (المالك الجديد): `status: 'pending_receiver_acceptance'`

كان يوجد في `_loadRemoteDB()` كود لإزالة التكرار يحتفظ بسجل واحد فقط لكل رقم تسلسلي. إذا جاء سجل `approved` أولاً في المصفوفة، يُحذف سجل `pending_receiver_acceptance`، فتجد `renderIncomingTransfers()` صفراً من السجلات فلا تظهر الأزرار أبداً.

**الكود المسبب للمشكلة:**
```javascript
const seen = new Map();
db.custodies = db.custodies.filter(c => {
    const key = c.serialNumber;
    if (seen.has(key)) return false; // ← يحذف السجل الثاني لنفس الجهاز
    seen.set(key, true);
    return true;
});
```

**الحل:**
استثناء سجلات الانتظار عند المستلم من منطق الحذف:
```javascript
if (c.status === 'pending_receiver_acceptance' ||
    c.status === 'pending_surveyor_acceptance') return true;
```

**الملف:** `app-core.js` — دالة `_loadRemoteDB()`

---

## 2. عمود الفرع فارغ في صفحة الأجهزة وفلترة الفرع لا تعمل

**الصفحة المتأثرة:** `devices.html`

**وصف المشكلة:**
مشكلتان مترابطتان:
1. عمود "الفرع" يظهر فارغاً حتى لو المساح مسجل على فرع محدد
2. عند فلترة الأجهزة بحسب الفرع لا تظهر أي نتائج

**السبب الأول — العرض:**
كانت الصفحة تقرأ الفرع من `d.branch` (حقل على الجهاز مباشرة) فقط. لكن كثيراً من الأجهزة لا يحتوي هذا الحقل على قيمة لأنه لم يُكتب في Supabase عند تسليم الجهاز للمساح.

**السبب الثاني — عدم المزامنة مع Supabase:**
دالة `updateDeviceOwner()` كانت تُحدِّث بيانات الجهاز في الذاكرة المحلية فقط دون أن تُزامن مع Supabase. عند إعادة تحميل الصفحة وجلب البيانات من السيرفر، تُستبدَل القيم المحلية بالقيم القديمة (null) من Supabase.

**الحل الأول — العرض والفلترة:**
استخدام فرع المالك كبديل إذا كان `d.branch` فارغاً:
```javascript
const owner = db.users.find(u => u.id === d.ownerId);
const effectiveBranch = d.branch || owner?.branch || owner?.responsibleBranch;
```

**الحل الثاني — مزامنة Supabase:**
إضافة تحديث مباشر لـ Supabase داخل `updateDeviceOwner()`:
```javascript
supabaseClient.from('devices').update({
    owner_id:  userId,
    branch_id: resolvedBranch,
    status:    mappedStatus,
    cal_date:  calibrationDate,
}).eq('id', db.devices[idx].id);
```

**الملفات:** `devices.html`، `en/devices.html`، `app-core.js`، `en/app-core.js`

---

## 3. نقل العهدة إلى المستودع غير متاح

**الصفحة المتأثرة:** `custody.html`

**وصف المشكلة:**
كان النظام يتيح نقل العهدة من مساح لمساح آخر فقط، ولا يوجد خيار لإعادة الجهاز إلى المستودع مباشرة.

**الحل:**
- إضافة checkbox "نقل إلى المستودع" في قسم نقل العهدة
- عند تفعيله: يُخفى حقل المستلم ويظهر مؤشر مستودع
- إضافة دالة `transferCustodyToWarehouse()` في `app-core.js` التي:
  - تُغلق سجلات العهدة النشطة (`transferred_out`)
  - تعيد الجهاز للمستودع (`status: 'warehouse'`, `ownerId: null`)
  - تُزامن مع Supabase
  - ترسل إشعاراً للمساح المالك

**الملفات:** `custody.html`، `en/custody.html`، `app-core.js`، `en/app-core.js`

---

## 4. المساح لا يستطيع قبول أو رفض العهدة الجديدة المسجلة عليه

**الصفحة المتأثرة:** `custody.html`

**وصف المشكلة:**
عندما يُسجِّل المدير عهدة لمساح، كانت العهدة تُعتمَد مباشرة (`approved`) دون أن يعطي المساح موافقته أو يُبدي ملاحظاته. المساح لا يملك أي دور في قبول أو رفض العهدة المسجلة عليه.

**الحل:**
- إضافة status جديد `pending_surveyor_acceptance`
- عند تسجيل عهدة من المدير لمساح آخر → تذهب لهذا الـ status بدلاً من `approved`
- إضافة قسم "عهدات واردة" يجمع:
  - النقل من مساح آخر (`pending_receiver_acceptance`)
  - العهدة الجديدة المسجلة عليه (`pending_surveyor_acceptance`)
- توسيع مودال القبول ليشمل:
  - تقييم حالة الجهاز
  - هل أنت راضٍ؟ (نعم/لا)
  - مدى الاهتمام بالجهاز
- إضافة دالتَي `acceptCustodyBySurveyor()` و `rejectCustodyBySurveyor()`

**الملفات:** `custody.html`، `en/custody.html`، `app-core.js`، `en/app-core.js`

---

## 5. تصدير Excel لا يعمل في صفحة سجل عهدة الموظف

**الصفحة المتأثرة:** `user-custody-history.html`

**وصف المشكلة:**
زر "تصدير Excel" موجود في الصفحة لكن لا يعمل عند الضغط عليه.

**السبب:**
المتغيران `lastSearchResults` و `_lastSearchUserName` مُعلَّنان بـ `let` داخل وسم `<script>`:
```javascript
let lastSearchResults = [];
let _lastSearchUserName = '';
```
متغيرات `let` على مستوى الـ script لا تُضاف إلى `window`، لذا عندما يستدعيها الـ `onclick` في الزر لا يجدها.

**الحل:**
تغيير الإعلان ليكون على `window` صراحةً:
```javascript
window.lastSearchResults = [];
window._lastSearchUserName = '';
```
وحذف دالة CSV القديمة غير المستخدمة `exportUserHistoryToExcel()`.

**الملفات:** `user-custody-history.html`، `en/user-custody-history.html`

---

## 6. مزامنة Supabase تفشل وتُرجع الحالة القديمة بعد الحذف أو التعديل

**الملفات المتأثرة:** `app-core.js`

**وصف المشكلة:**
عدة عمليات كانت تُحدِّث البيانات في الذاكرة المحلية فقط دون مزامنتها مع Supabase:
- `updateDeviceOwner()` — لا تُزامن
- `deleteUser()` — لا تحذف من Supabase
- `transferCustodyToWarehouse()` — لا تُزامن الجهاز

**الأثر:** عند إعادة تحميل الصفحة، تعود البيانات القديمة من Supabase وتُلغي التعديلات المحلية.

**الحل:**
إضافة استدعاء مباشر لـ Supabase بعد كل تعديل محلي:
```javascript
supabaseClient.from('devices').update({...}).eq('id', device.id);
supabaseClient.from('custodies').delete().eq('id', custodyId);
```

---

## 7. تعارض مرجعية UUID بين الذاكرة المحلية وSupabase

**الملفات المتأثرة:** `app-core.js`، جميع صفحات العهدة

**وصف المشكلة:**
كانت بعض عمليات الفلترة والبحث تعتمد على `userId` مباشرة (UUID). عند تحميل البيانات من Supabase، قد يختلف الـ UUID المحلي عن UUID السيرفر، فتفشل المطابقات.

**مثال:**
```javascript
// طريقة قديمة - تفشل عند تعارض الـ ID
db.custodies.filter(c => c.userId === currentUser.id)

// طريقة جديدة - آمنة دائماً
db.custodies.filter(c => {
    const u = db.users.find(x => x.id === c.userId);
    return u && String(u.empId) === String(currentUser.empId);
})
```

**الحل:**
استبدال المطابقة بالـ UUID بالمطابقة بالرقم الوظيفي `empId` الذي لا يتغير.

---

## 8. الـ Service Worker يُظهر تحذيرات في Console

**الملفات المتأثرة:** `sw.js`

**وصف المشكلة:**
```
Uncaught (in promise) Error: A listener indicated an asynchronous response
by returning true, but the message channel closed before a response was received
```

**السبب والحل:**
هذا الخطأ من **browser extensions** (مثل Ad Blockers أو Password Managers) وليس من كود المشروع. لا يؤثر على عمل التطبيق.

---

## 9. فقدان البيانات عند حجب Supabase بسبب RLS

**الملفات المتأثرة:** `app-core.js`

**وصف المشكلة:**
في بعض الحالات تمنع سياسات RLS في Supabase الكتابة، فتُفقد البيانات المُدخَلة.

**الحل:**
إضافة نسخة احتياطية في `localStorage` تُحفَظ عند كل `saveDB()`:
```javascript
try {
    localStorage.setItem('sajco_db_backup', JSON.stringify(db));
} catch (_) {}
```
وتُحمَّل عند بدء التطبيق إذا كانت بيانات Supabase غير متاحة.

---

## 10. انهيار الصفحة بسبب `deviceRows is not defined`

**الملفات المتأثرة:** `app-core.js`، صفحة الداشبورد

**وصف المشكلة:**
خطأ JavaScript يُوقف تشغيل الصفحة بالكامل بسبب متغير غير مُعرَّف `deviceRows`.

**الحل:**
التأكد من تعريف المتغير قبل استخدامه، وإضافة فحص `undefined` للمتغيرات التي تعتمد على بيانات Supabase قبل اكتمال التحميل.

---

## 11. Debounce في saveDB يُسبب فقدان البيانات عند التنقل بين الصفحات

**الملفات المتأثرة:** `app-core.js`

**وصف المشكلة:**
كان `saveDB()` يستخدم debounce (تأخير) بحيث لا يُنفَّذ الحفظ الفعلي إلا بعد ثوانٍ. عند التنقل السريع بين الصفحات، يُلغَى الـ debounce قبل اكتمال الحفظ فتُفقد البيانات.

**الحل:**
إلغاء الـ debounce والحفظ المباشر الفوري عند كل استدعاء لـ `saveDB()`.

---

## 12. واجهة المعايرة تعرض أجهزة خارج فرع رئيس المساحين

**الملفات المتأثرة:** `app-core.js` — دالة `getVisibleDevices()`

**وصف المشكلة:**
رئيس المساحين كان يرى أجهزة من فروع أخرى في صفحة تنبيهات المعايرة.

**الحل:**
تقييد `getVisibleDevices()` للـ `head` بأجهزة فرعه فقط:
```javascript
if (currentUser.role === 'head') {
    return db.devices.filter(d =>
        d.status !== 'warehouse' &&
        (d.branch === currentUser.responsibleBranch ||
         db.users.some(u => u.id === d.ownerId &&
             u.branch === currentUser.responsibleBranch))
    );
}
```

---

## 13. بحث المستودع في صفحة العهدة لا يعمل

**الصفحة المتأثرة:** `custody.html`

**وصف المشكلة:**
قائمة أجهزة المستودع في قسم "تسليم من المستودع" كانت فارغة دائماً.

**السبب:**
دالة `init()` كانت تستدعي `populateWarehouseDevices()` قبل `await _loadRemoteDB()`، فتجد قائمة الأجهزة فارغة لأن البيانات لم تُحمَّل بعد.

**الحل:**
نقل استدعاء `populateWarehouseDevices()` إلى ما بعد `await _loadRemoteDB()`.

---

## 14. عدم ظهور اسم الفرع في لوحة تحكم المساح

**الملفات المتأثرة:** لوحة تحكم المساح

**وصف المشكلة:**
عمود "الفرع" يظهر `[object Object]` بدلاً من اسم الفرع.

**السبب:**
دالة `getBranchName()` كانت تُعيد كائن الفرع بالكامل بدلاً من اسمه النصي.

**الحل:**
```javascript
// قبل
return db.branches.find(b => b.id === id);
// بعد
return db.branches.find(b => b.id === id)?.name || '—';
```

---

## 15. عدم ظهور المساحين في قائمة الاختيار عند إضافة عهدة

**الصفحة المتأثرة:** `custody.html`

**وصف المشكلة:**
قائمة "اختر المساح" كانت فارغة عند فتح نموذج إضافة عهدة.

**السبب:**
دالة `populateTargetUsers()` كانت تُستدعى بقائمة `db.users` من localStorage قبل تحميل البيانات من Supabase.

**الحل:**
استدعاء `populateTargetUsers()` بعد `await _loadRemoteDB()` ليأخذ البيانات المحدَّثة.

---

## 16. CSP تمنع تحميل Font Awesome والـ CDN

**الملفات المتأثرة:** إعدادات Content Security Policy

**وصف المشكلة:**
الأيقونات لا تظهر وتظهر أخطاء في الـ Console:
```
Refused to load font from 'https://cdnjs.cloudflare.com/...'
```

**الحل:**
إضافة `cdnjs.cloudflare.com` إلى قائمة المصادر المسموح بها في CSP:
```
font-src 'self' cdnjs.cloudflare.com;
connect-src 'self' *.supabase.co cdnjs.cloudflare.com;
```

---

## 17. Race Condition في تحميل البيانات من Supabase

**الملفات المتأثرة:** `app-core.js`

**وصف المشكلة:**
عند استدعاء `_loadRemoteDB()` من عدة دوال في نفس الوقت، كانت كل دالة تبدأ طلب Supabase مستقل، مما يُسبب:
- استهلاك زائد للبيانات
- تعارض في نتائج التحديث

**الحل:**
إضافة آلية "in-flight request" تجعل جميع الاستدعاءات المتزامنة تنتظر نفس الطلب:
```javascript
if (_loadRemoteDB._inFlight) return _loadRemoteDB._inFlight;
_loadRemoteDB._inFlight = actualLoad().finally(() => {
    _loadRemoteDB._inFlight = null;
});
return _loadRemoteDB._inFlight;
```

---

## ملاحظات عامة للتطوير المستقبلي

| المشكلة الشائعة | الحل الموصى به |
|----------------|----------------|
| فقدان البيانات بعد reload | تأكد دائماً من وجود استدعاء Supabase sync بعد كل تعديل |
| أزرار لا تظهر | تحقق من أن دالة العرض تُستدعى بعد `await _loadRemoteDB()` |
| فلترة بالـ UUID تفشل | استخدم `empId` بدلاً من `id` في المطابقات |
| بيانات فارغة في القوائم | تأكد من ترتيب الاستدعاءات في `init()` |
| سجلات مفقودة بعد النقل | تجنب منطق dedup الذي يحذف سجلات انتظار المستلم |
