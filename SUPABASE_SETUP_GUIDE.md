# دليل ربط البرنامج بـ Supabase

<div dir="rtl">

## 🎯 نظرة عامة

هذا الدليل يشرح خطوة بخطوة كيفية ربط نظام إدارة العهدة بقاعدة بيانات Supabase.

---

## ⚠️ تحذير أمني مهم جداً

**المفتاح الذي أرسلته:**
```
sb_publishable_4zF9nQZPscuRAiIMAzlFOw_4OM7ucoq
```

هذا يبدو أنه **مفتاح عام (Publishable Key)** وليس المفتاح الكامل.

**ما تحتاجه:**
1. **Supabase URL**: مثل `https://xxxxx.supabase.co`
2. **Anon/Public Key**: المفتاح العام (للاستخدام في المتصفح)
3. **Service Role Key**: المفتاح الخاص (اختياري - للعمليات الإدارية)

---

## 📋 الخطوات التفصيلية

### الخطوة 1: الحصول على بيانات Supabase

1. اذهب إلى [Supabase Dashboard](https://app.supabase.com)
2. افتح مشروعك
3. اذهب إلى **Settings** → **API**
4. ستجد:
   - **Project URL**: انسخه
   - **anon/public key**: انسخه
   - **service_role key**: انسخه (احتفظ به سرياً!)

---

### الخطوة 2: إنشاء الجداول في Supabase

1. في Supabase Dashboard، اذهب إلى **SQL Editor**
2. افتح ملف `supabase-schema.sql`
3. انسخ كل المحتوى
4. الصقه في SQL Editor
5. اضغط **Run** أو **Execute**
6. انتظر حتى تكتمل العملية (قد تأخذ دقيقة)

**ما سيتم إنشاؤه:**
- ✅ 9 جداول رئيسية
- ✅ فهارس لتحسين الأداء
- ✅ Triggers للتحديث التلقائي
- ✅ Row Level Security
- ✅ البيانات الافتراضية

---

### الخطوة 3: تكوين ملف supabase-config.js

1. افتح ملف `supabase-config.js`
2. استبدل القيم التالية:

```javascript
const SUPABASE_CONFIG = {
    url: 'YOUR_SUPABASE_URL', // ضع URL مشروعك هنا
    anonKey: 'YOUR_SUPABASE_ANON_KEY', // ضع المفتاح العام هنا
    serviceKey: 'YOUR_SUPABASE_SERVICE_KEY' // اختياري
};
```

**مثال:**
```javascript
const SUPABASE_CONFIG = {
    url: 'https://abcdefgh.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    serviceKey: '' // اتركه فارغاً إذا لم تحتاجه
};
```

---

### الخطوة 4: إضافة مكتبة Supabase للصفحات

أضف هذا السطر في `<head>` لكل صفحة HTML:

```html
<!-- مكتبة Supabase -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- ملف التكوين -->
<script src="supabase-config.js"></script>
```

**الصفحات التي تحتاج التعديل:**
- index.html
- dashboard.html
- users.html
- devices.html
- custody.html
- employee-rating.html
- وجميع الصفحات الأخرى

---

### الخطوة 5: تهيئة Supabase عند تحميل الصفحة

في كل صفحة، أضف هذا الكود في `window.onload`:

```javascript
window.onload = () => {
    // تهيئة Supabase
    initSupabase();
    
    // باقي الكود...
    renderSidebar();
    // ...
};
```

---

### الخطوة 6: اختبار الاتصال

1. افتح أي صفحة من البرنامج
2. افتح Console في المتصفح (F12)
3. يجب أن ترى:
   ```
   ✅ تم الاتصال بـ Supabase بنجاح
   ```

إذا رأيت خطأ:
```
❌ فشل الاتصال بـ Supabase
```
تحقق من:
- صحة URL
- صحة المفتاح
- الاتصال بالإنترنت

---

## 🔄 المزامنة بين LocalStorage و Supabase

### المزامنة التلقائية

يمكنك إضافة مزامنة تلقائية عند كل عملية:

```javascript
// في app-core.js، عدّل دالة saveDB:
const saveDB = () => {
    db._version = APP_VERSION;
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    
    // مزامنة مع Supabase
    if (supabaseClient) {
        SupabaseDB.syncLocalToSupabase().catch(err => {
            console.error('فشلت المزامنة:', err);
        });
    }
};
```

### المزامنة اليدوية

يمكن للمدير تشغيل المزامنة يدوياً:

```javascript
// زر في صفحة الإعدادات
async function syncNow() {
    const result = await SupabaseDB.syncLocalToSupabase();
    if (result.success) {
        alert('✅ تمت المزامنة بنجاح');
    } else {
        alert('❌ فشلت المزامنة: ' + result.error);
    }
}
```

---

## 📊 الجداول المُنشأة

### 1. users (المستخدمين)
- معلومات الموظفين
- الصلاحيات
- التقييمات

### 2. devices (الأجهزة)
- معلومات الأجهزة
- الحالة
- المالك

### 3. custodies (العهدة)
- سجلات العهدة
- الموافقات
- التحويلات

### 4. ratings (التقييمات)
- تقييمات الموظفين
- النجوم
- المعايير

### 5. notifications (الإشعارات)
- إشعارات النظام
- حالة القراءة

### 6. logs (السجلات)
- سجل العمليات
- التتبع

### 7. branches (الفروع)
- معلومات الفروع

### 8. allowed_employee_ids (الأرقام المسموحة)
- الأرقام الوظيفية المسموحة

### 9. settings (الإعدادات)
- إعدادات النظام

---

## 🔐 الأمان

### Row Level Security (RLS)

تم تفعيل RLS على جميع الجداول. يمكنك تخصيص السياسات:

```sql
-- مثال: السماح للمدير فقط بحذف المستخدمين
CREATE POLICY "Only admins can delete users" 
ON users FOR DELETE 
USING (auth.jwt() ->> 'role' = 'admin');
```

### حماية المفاتيح

**⚠️ مهم جداً:**
- لا تشارك `service_role key` أبداً
- لا تضع المفاتيح في GitHub
- استخدم متغيرات البيئة في الإنتاج

---

## 🚀 الميزات المتقدمة

### 1. Real-time Subscriptions

استمع للتغييرات في الوقت الفعلي:

```javascript
// الاستماع للمستخدمين الجدد
supabaseClient
    .channel('users-channel')
    .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'users' },
        (payload) => {
            console.log('مستخدم جديد:', payload.new);
            // تحديث الواجهة
        }
    )
    .subscribe();
```

### 2. Storage للملفات

رفع الصور والملفات:

```javascript
// رفع صورة
const { data, error } = await supabaseClient
    .storage
    .from('avatars')
    .upload('user-123.jpg', file);
```

### 3. Authentication

استخدام نظام المصادقة المدمج:

```javascript
// تسجيل دخول
const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: 'user@example.com',
    password: 'password123'
});
```

---

## 🧪 الاختبار

### اختبار الاتصال:

```javascript
async function testConnection() {
    const result = await SupabaseDB.getData('users');
    console.log('نتيجة الاختبار:', result);
}
```

### اختبار الحفظ:

```javascript
async function testSave() {
    const testUser = {
        id: 'test_123',
        name: 'اختبار',
        email: 'test@test.com',
        empId: '9999'
    };
    
    const result = await SupabaseDB.saveData('users', testUser);
    console.log('نتيجة الحفظ:', result);
}
```

---

## 🔧 حل المشاكل

### المشكلة: "مكتبة Supabase غير محملة"
**الحل:** تأكد من إضافة سكريبت Supabase في HTML

### المشكلة: "فشل الاتصال"
**الحل:** 
- تحقق من URL والمفتاح
- تحقق من الاتصال بالإنترنت
- تحقق من Console للأخطاء

### المشكلة: "Permission denied"
**الحل:** راجع سياسات RLS في Supabase

---

## 📞 الدعم

**المطور:** محمود الشطورى  
**المشرف:** المهندس محمد يوسف اقطيط

---

## 📚 موارد إضافية

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**الإصدار:** 2.4  
**تاريخ الإضافة:** 2024  
**الحالة:** ✅ جاهز للتطبيق

**© 2024 SAJCO - شركة شبه الجزيرة للمقاولات**

</div>
