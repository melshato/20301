# دليل النشر الكامل - SAJCO على Netlify + Supabase

## الملفات المُعدَّلة في هذه النسخة

| الملف | التغييرات |
|---|---|
| `supabase-config.js` | إزالة المفاتيح المكشوفة، إضافة SupabaseStorage |
| `app-core.js` | مزامنة Supabase في كل saveDB، دعم شهادات المعايرة |
| `maintenance.html` | Modal رفع شهادة المعايرة + Google Drive |
| `settings.html` | رفع Logo/AppImage على Supabase Storage |
| `netlify.toml` | إعدادات النشر والـ redirects |
| `supabase-schema-v2.sql` | Schema كامل مُصلح |

---

## الخطوة 1: إعداد Supabase

### 1.1 تشغيل SQL Schema
1. افتح [Supabase Dashboard](https://app.supabase.com)
2. اختر مشروعك
3. اذهب إلى **SQL Editor**
4. انسخ محتوى `supabase-schema-v2.sql` كاملاً
5. اضغط **Run**

### 1.2 إنشاء Storage Buckets
الـ buckets موجودة في آخر SQL Schema، لكن للتأكد:
1. اذهب إلى **Storage** في Dashboard
2. تأكد من وجود:
   - `assets` (public) - للشعار وصور الواجهة
   - `calibration-certificates` (private) - لشهادات المعايرة

### 1.3 الحصول على المفاتيح
1. اذهب إلى **Settings → API**
2. انسخ:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGci...`

---

## الخطوة 2: إعداد Netlify

### 2.1 رفع المشروع
**الطريقة الأسهل (Drag & Drop):**
1. افتح [app.netlify.com](https://app.netlify.com)
2. اضغط **Add new site → Deploy manually**
3. اسحب مجلد المشروع كاملاً

**أو عبر GitHub:**
1. ارفع المشروع على GitHub (بدون `supabase-config.js` القديم)
2. في Netlify: **Add new site → Import from Git**

### 2.2 إضافة متغيرات البيئة (Environment Variables)
في **Site settings → Environment variables → Add variable**:
```
لا تحتاج متغيرات بيئة للمشروع هذا - استخدم Snippet Injection بدلاً منها
```

### 2.3 Snippet Injection (الأهم!)
1. اذهب إلى **Site settings → Build & deploy → Post processing**
2. اضغط **Snippet injection → Add snippet**
3. اختر **Before </head>**
4. الاسم: `Supabase Config`
5. أضف هذا الكود (استبدل المفاتيح بمفاتيحك):

```html
<script>
  window.__env = {
    SUPABASE_URL: "https://llecufqoqscbcrobuxlq.supabase.co",
    SUPABASE_ANON_KEY: "YOUR_ANON_KEY_HERE"
  };
</script>
```

> **مهم:** الـ `anonKey` في Supabase مصمم ليكون عاماً ومرئياً في المتصفح.
> الحماية الحقيقية تأتي من سياسات RLS في Supabase.
> **لا تضع service_role key هنا أبداً.**

### 2.4 تأكيد النشر
بعد النشر، افتح موقعك واختبر:
- [ ] تسجيل الدخول بـ admin@sajco.com / admin123
- [ ] فتح Settings وتحقق من اتصال Supabase
- [ ] رفع شعار جديد
- [ ] إرسال جهاز للوكيل واختبار رفع شهادة

---

## الخطوة 3: حل مشكلة GitHub Push

إذا أردت رفع على GitHub، أضف ملف `.gitignore`:

```
# لا ترفع ملفات تحتوي على مفاتيح قديمة
supabase-config-OLD.js
*.env
.env*
```

والملف الجديد `supabase-config.js` آمن للرفع لأنه لا يحتوي مفاتيح.

---

## بنية قاعدة البيانات

```
branches          - الفروع
users             - المستخدمون
devices           - الأجهزة
custodies         - العهدة (مع حالة rejected الجديدة)
calibration_certs - شهادات المعايرة (جديد!)
ratings           - التقييمات
notifications     - الإشعارات
logs              - السجلات
allowed_emp_ids   - الأرقام الوظيفية المسموحة
settings          - الإعدادات
```

---

## ميزات جديدة في هذه النسخة

### شهادات المعايرة
- رفع PDF أو صورة مباشرة على Supabase Storage
- أو إدخال رابط Google Drive (تحويل تلقائي للرابط المباشر)
- عرض جميع الشهادات لكل جهاز
- ربط الشهادة بتاريخ المعايرة وتاريخ الانتهاء
- حذف الشهادة مع حذفها من Storage

### صفحة الإعدادات
- رفع Logo مباشرة على Supabase Storage (ضغط تلقائي)
- رفع صورة الواجهة مباشرة على Supabase Storage
- مؤشر حالة الاتصال بـ Supabase
- زر مزامنة يدوية
- زر تحميل البيانات من Supabase

### المزامنة التلقائية
- كل saveDB() يزامن تلقائياً مع Supabase
- logs تُرسل مباشرة لـ Supabase
- notifications تُرسل مباشرة لـ Supabase

---

## استكشاف الأخطاء

### المشكلة: "Supabase غير متصل"
**الحل:** تأكد من إضافة Snippet Injection في Netlify

### المشكلة: "فشل رفع الملف على Storage"
**الحل:** تأكد من إنشاء الـ buckets في Supabase وتشغيل SQL الخاص بـ Storage policies

### المشكلة: "RLS policy violation"
**الحل:** تأكد من تشغيل قسم سياسات RLS في SQL Schema

### المشكلة: "رابط Google Drive لا يعمل"
**الحل:** تأكد أن الملف مشارك بـ "أي شخص لديه الرابط" في Google Drive
