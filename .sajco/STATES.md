# حالات الكيانات (State Machines) — نظام SAJCO

> مرجع سريع لجميع الحالات المتاحة لكل كيان، والتحولات بينها، والدوال المسؤولة، والإشعارات المرسلة.

---

## 1. الأجهزة `devices.status`

```
                    ┌─────────────┐
                    │  warehouse  │ ◄──────────────────────────────┐
                    └──────┬──────┘                                │
                           │ assignDeviceFromWarehouse()           │
                           │ + إشعار للمالك                        │
                           ▼                                       │
                    ┌─────────────┐                                │
              ┌─────│  assigned   │─────┐                         │
              │     └─────────────┘     │                         │
              │ sendMaintenanceRequest()│ sendMaintenanceRequest() │
              │ (type=maintenance)      │ (type=calibration)       │
              ▼                         ▼                          │
     ┌──────────────┐      ┌───────────────────┐                  │
     │ maintenance  │      │ needs_calibration  │                  │
     └──────┬───────┘      └────────┬──────────┘                  │
            │ approveMaintenanceRequest()                          │
            │ sendToAgent()                                        │
            ▼                                                      │
   ┌─────────────────┐    ┌──────────────────┐                    │
   │ at_maintenance  │    │  at_calibration  │                    │
   └──────┬──────────┘    └────────┬─────────┘                    │
          │ returnFromAgent(destination)                           │
          │  ├── 'same_user' → assigned                           │
          └──┴── 'warehouse' ──────────────────────────────────────┘
```

### جدول التحولات

| من | إلى | الدالة | الإشعارات |
|----|-----|--------|-----------|
| `warehouse` | `assigned` | `assignDeviceFromWarehouse()` | المالك الجديد |
| `assigned` | `maintenance` | `sendMaintenanceRequest()` | Admin + Head + مقدم الطلب |
| `assigned` | `needs_calibration` | `sendMaintenanceRequest()` | Admin + Head + مقدم الطلب |
| `maintenance` | `at_maintenance` | `approveMaintenanceRequest()` / `sendToAgent()` | المالك + Head + مقدم الطلب |
| `needs_calibration` | `at_calibration` | `approveMaintenanceRequest()` / `sendToAgent()` | المالك + Head + مقدم الطلب |
| `maintenance` | `assigned` | `rejectMaintenanceRequest()` | المالك + Head (مع السبب) |
| `needs_calibration` | `assigned` | `rejectMaintenanceRequest()` | المالك + Head (مع السبب) |
| `at_maintenance` | `assigned` | `returnFromAgent('same_user')` | المالك + Head |
| `at_maintenance` | `warehouse` | `returnFromAgent('warehouse')` | المالك + Head |
| `at_calibration` | `assigned` | `returnFromAgent('same_user')` | المالك + Head (+ تاريخ معايرة جديد) |
| `at_calibration` | `warehouse` | `returnFromAgent('warehouse')` | المالك + Head (+ تاريخ معايرة جديد) |
| `assigned` | `warehouse` | `transferCustodyToWarehouse()` / `clearEmployeeCustody()` | المالك |

---

## 2. العهدات `custodies.status`

```
 [طلب عهدة جديدة من مساح]
         │
         ▼
 pending_head_approval ──► pending_admin_approval ──► pending_surveyor_acceptance
         │                          │                           │
  [رئيس مساحين يوافق]      [مدير يوافق]               [مساح يقبل]
                                                               │
                                                               ▼
                                                           approved
                                                               │
                                                    ┌──────────┴──────────┐
                                                    │                     │
                                              transferred_out         returned
                                          (عند نقل لمساح آخر)    (مسح العهدة)
```

### جدول الحالات

| الحالة | المعنى | من يراها |
|--------|--------|---------|
| `pending_approval` | انتظار موافقة (قديم) | Admin |
| `pending_head_approval` | انتظار رئيس المساحين | Head + Admin |
| `pending_admin_approval` | انتظار المدير | Admin |
| `pending_receiver_acceptance` | نقل عهدة — انتظار قبول المستلم | المساح المستلم |
| `pending_surveyor_acceptance` | عهدة جديدة — انتظار قبول المساح | المساح المعيَّن |
| `approved` | عهدة نشطة معتمدة | الجميع |
| `rejected` | مرفوضة | Admin + الطالب |
| `transferred_out` | نُقلت لمساح آخر (أرشيف) | Admin |
| `returned` | أُعيدت للمستودع | Admin |

### جدول التحولات

| من | إلى | الدالة | الإشعارات |
|----|-----|--------|-----------|
| — | `pending_head_approval` | `addCustody()` (surveyor) | Head + Admin + الطالب |
| — | `pending_admin_approval` | `addCustody()` (head) | Admin + المستلم |
| — | `pending_surveyor_acceptance` | `addCustody()` (admin, للآخر) | المساح المعيَّن |
| `pending_head_approval` | `pending_admin_approval` | `approveCustody('head')` | Admin |
| `pending_admin_approval` | `pending_surveyor_acceptance` | `approveCustody('admin')` غير ذاتي | المساح |
| `pending_admin_approval` | `approved` | `approveCustody('admin')` ذاتي | المستلم |
| `pending_receiver_acceptance` | `pending_admin_approval` | `acceptTransferByReceiver()` | Admin + المُرسِل |
| `pending_surveyor_acceptance` | `approved` | `acceptCustodyBySurveyor()` | Admin + المُعيِّن |
| أي حالة | `rejected` | `rejectCustody()` / `rejectCustodyBySurveyor()` | الطالب |
| `approved` | `transferred_out` | `approveCustody()` عند نقل | — |
| `approved` | `transferred_out` | `clearEmployeeCustody()` | المالك |

---

## 3. طلبات الصيانة `maintenanceRequests.status`

```
            [مساح / رئيس / مدير يطلب]
                        │
                        ▼
                    pending ──────────────► rejected
                        │                    ▲
              [مدير يوافق]            [مدير/رئيس يرفض]
                        │
                        ▼
                  sent_to_agent
                        │
                [مدير يستلم من الوكيل]
                        │
                        ▼
                    completed
```

| الحالة | المعنى | من يراها |
|--------|--------|---------|
| `pending` | انتظار موافقة | Admin + Head (فرعه) |
| `sent_to_agent` | أُرسل للوكيل | Admin |
| `completed` | استُلم من الوكيل | Admin |
| `rejected` | مرفوض | Admin + الطالب |

---

## 4. طلبات الإجازة `leaveRequests.status`

```
 [مساح يطلب]
       │
       ▼
 pending_head_approval ──► pending_admin_approval ──► approved
       │                           │                     │
[رئيس يوافق]               [مدير يوافق]           [مساح غادر فعلياً]
       │                           │                     │
  [رئيس يرفض]               [مدير يرفض]          actuallyLeft = true
       ▼                           ▼
   rejected                   rejected
```

| الحالة | المعنى |
|--------|--------|
| `pending` | تقديم أولي |
| `pending_head_approval` | انتظار رئيس المساحين |
| `pending_admin_approval` | انتظار المدير |
| `approved` | معتمدة |
| `rejected` | مرفوضة |
| `cancelled` | ملغاة من الطالب |

---

## 5. المستخدمون `users.status` + `users.role`

### الحالات

| الحالة | المعنى |
|--------|--------|
| `pending` | حساب جديد، انتظار موافقة المدير |
| `approved` | نشط وفعّال |
| `suspended` | موقوف |

### الأدوار

| الدور | الصلاحيات الرئيسية |
|-------|-------------------|
| `admin` | كل شيء |
| `head` | إدارة فرعه، موافقة إجازات، رفض صيانة |
| `surveyor` | عهدته، أجهزته، طلبات الإجازة والصيانة |
| `developer` | مثل admin (للتطوير) |

---

## 6. العمال `workers.status`

| الحالة | المعنى |
|--------|--------|
| `available` | نشط في العمل |
| `on_leave` | في إجازة |
| `departed` | غادر المشروع |
| `terminated` | منتهي التعاقد |

---

## ملاحظات مهمة

1. **الحالات الطرفية (Terminal):** `rejected`, `transferred_out`, `returned` — لا تتحول لحالة أخرى
2. **Dedup في `_loadRemoteDB`:** يحتفظ بسجل واحد لكل serialNumber، مع استثناء `pending_receiver_acceptance` و`pending_surveyor_acceptance`
3. **عند رفض طلب صيانة:** حالة الجهاز تُعاد لـ `assigned` (إذا كان له مالك) أو `warehouse`
4. **الدالة الرئيسية للتحقق:** `getVisibleDevices()` تُصفِّي حسب الدور — surveyor يرى أجهزته فقط، head يرى فرعه، admin يرى الكل
