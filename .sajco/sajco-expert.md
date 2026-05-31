# SAJCO Expert Skill

أنت خبير في قاعدة كود مشروع SAJCO. عندما يسألك المستخدم عن أي دالة أو نمط أو ملف في المشروع، ابحث عنه فوراً وأجب بشكل منظم بالعربية.

## ملفات المشروع الرئيسية

- `app-core.js` — جميع الدوال المشتركة (auth, db, notifications, custody, maintenance, users...)
- `en/app-core.js` — النسخة الإنجليزية من نفس الدوال
- `supabase-data-layer.js` — `_loadRemoteDB()`, `_syncToSupabase()`, `saveDB()`
- `[page].html` + `en/[page].html` — منطق الصفحة + UI

## خريطة الدوال الرئيسية

### المصادقة والمستخدمون
- `checkAuth()` — التحقق من الجلسة
- `doLogin()` — تسجيل الدخول
- `registerNewUser()` — تسجيل مستخدم جديد
- `deleteUser()` — حذف مستخدم
- `promoteToHead()` — ترقية مساح لرئيس مساحين
- `approveUser()` / `rejectUser()` — موافقة/رفض طلبات التسجيل

### العهدات
- `addCustody()` — إضافة عهدة جديدة
- `approveCustody()` — موافقة على طلب عهدة
- `rejectCustody()` — رفض طلب عهدة
- `initiateTransferRequest()` — بدء نقل عهدة لمساح آخر
- `transferCustodyToWarehouse()` — إعادة الجهاز للمستودع
- `acceptTransferByReceiver()` — قبول نقل عهدة
- `acceptCustodyBySurveyor()` — قبول عهدة جديدة
- `rejectTransferByReceiver()` / `rejectCustodyBySurveyor()` — رفض

### الأجهزة
- `addDevice()` — إضافة جهاز
- `updateDevice()` — تعديل جهاز
- `deleteDevice()` — حذف جهاز
- `updateDeviceOwner()` — تغيير مالك الجهاز + مزامنة Supabase
- `assignDeviceFromWarehouse()` — تسليم جهاز من المستودع
- `getVisibleDevices()` — الأجهزة المرئية حسب الدور

### الصيانة والمعايرة
- `sendMaintenanceRequest()` — طلب صيانة/معايرة
- `approveMaintenanceRequest()` — موافقة على الطلب
- `rejectMaintenanceRequest()` — رفض الطلب (+ إعادة حالة الجهاز)
- `sendToAgent()` — إرسال للوكيل
- `returnFromAgent(id, newCalDate, destination)` — استلام من الوكيل
- `hasPendingMaintenanceRequest()` — التحقق من طلب قائم

### الإشعارات
- `addNotification(userId, msg, type, relatedId, push, url, actionType, requiresAction)` — إضافة إشعار
- `markAllNotificationsAsRead()` — تحديد كل إشعارات كمقروءة
- `_updateNotificationBadge()` — تحديث رقم الشارة

### الإجازات
- `addLeaveRequest()` — تقديم إجازة
- `approveLeaveRequest()` — موافقة
- `rejectLeaveRequest()` — رفض
- `cancelLeaveRequest()` — إلغاء

### المزامنة
- `saveDB(skipSync?)` — حفظ + مزامنة Supabase
- `_syncToSupabase()` — مزامنة كاملة (مرحلتان)
- `_loadRemoteDB()` — تحميل من Supabase
- `reloadDB()` — إعادة تحميل

## طريقة استخدام هذا الـ Skill

اكتب `/sajco` متبوعاً بسؤالك، مثل:
- `/sajco أين دالة addCustody؟`
- `/sajco ما هي حالات status للعهدات؟`
- `/sajco ما الإشعارات التي ترسلها approveMaintenanceRequest؟`
- `/sajco أي ملفات تحتوي على renderIncomingTransfers؟`

## مراجع سريعة

- `STATES.md` — جميع حالات الكيانات والتحولات
- `BUGS_AND_FIXES.md` — سجل المشاكل والحلول
- `DEBUGGING_METHODOLOGY.md` — منهجية تتبع الأخطاء
- `AGENTS.md` — معلومات المعمارية ونقاط التشخيص
