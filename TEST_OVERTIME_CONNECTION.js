/**
 * TEST_OVERTIME_CONNECTION.js
 * اختبار سريع للتحقق من اتصالات صفحة ساعات العمل الإضافية
 *
 * الاستخدام: افتح console في متصفح overtime.html واختبر كل دالة
 */

// ============================================================
// 1. اختبار الملفات المحملة
// ============================================================
console.group('🧪 اختبار الملفات المحملة');

const checks = {
    'Supabase JS SDK': typeof window.supabase !== 'undefined',
    'app-core.js (currentUser)': typeof currentUser !== 'undefined',
    'app-core.js (checkAuth)': typeof checkAuth === 'function',
    'app-core.js (renderSidebar)': typeof renderSidebar === 'function',
    'app-core.js (addNotification)': typeof addNotification === 'function',
    'app-core.js (_loadRemoteDB)': typeof _loadRemoteDB === 'function',
    'supabase-config.js (supabaseClient)': typeof window.supabaseClient !== 'undefined',
    'supabase-data-layer.js': typeof FIELD_MAPPINGS !== 'undefined',
    'excel-export.js (_waitXLSX)': typeof _waitXLSX === 'function',
};

Object.entries(checks).forEach(([name, result]) => {
    console.log(`${result ? '✅' : '❌'} ${name}`, result);
});
console.groupEnd();

// ============================================================
// 2. اختبار الاتصال بـ Supabase
// ============================================================
console.group('🔌 اختبار الاتصال بـ Supabase');

(async () => {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
        console.error('❌ Supabase غير متصل');
        return;
    }

    console.log('✅ Supabase متصل');

    // اختبار الجداول
    const tables = [
        'overtime_records',
        'overtime_entries',
        'friday_requests',
        'friday_workers',
        'workers',
        'users',
        'notifications'
    ];

    for (const table of tables) {
        try {
            const { data, error } = await supabaseClient
                .from(table)
                .select('id')
                .limit(1);

            if (error && error.message.includes('does not exist')) {
                console.error(`❌ جدول ${table} غير موجود في Supabase`);
            } else if (error) {
                console.warn(`⚠️ ${table}: ${error.message}`);
            } else {
                console.log(`✅ جدول ${table} موجود وقابل للوصول`);
            }
        } catch (e) {
            console.error(`❌ خطأ في اختبار جدول ${table}:`, e.message);
        }
    }
})();

console.groupEnd();

// ============================================================
// 3. اختبار المستخدم الحالي
// ============================================================
console.group('👤 بيانات المستخدم الحالي');

if (currentUser) {
    console.log('✅ المستخدم متصل');
    console.log({
        'الاسم': currentUser.name,
        'البريد': currentUser.email,
        'الدور': currentUser.role,
        'الرقم الوظيفي': currentUser.empId,
        'الحالة': currentUser.status,
    });
} else {
    console.warn('⚠️ لا يوجد مستخدم متصل حالياً');
}

console.groupEnd();

// ============================================================
// 4. اختبار الدوال الأساسية في overtime.html
// ============================================================
console.group('⚙️ اختبار الدوال في overtime.html');

const otFunctions = [
    'loadMonthlyWorkers',
    'loadOvertimeRecords',
    'saveOvertimeRecord',
    'submitOtRecord',
    'loadHeadOtRequests',
    'approveOtRecord',
    'loadFridayPayments',
    'loadFridayRequests',
    'openFridayModal',
    'submitFridayRequest',
    'loadHeadFridayRequests',
    'approveFriday',
    'exportOtExcel',
    'exportPaymentSheet',
    'toast',
    'switchTab',
];

otFunctions.forEach(fnName => {
    const exists = typeof window[fnName] === 'function';
    console.log(`${exists ? '✅' : '❌'} ${fnName}${exists ? '' : ' — غير موجودة'}`);
});

console.groupEnd();

// ============================================================
// 5. اختبار القوائم المنسدلة والفلاتر
// ============================================================
console.group('📋 اختبار عناصر الصفحة');

const elements = [
    { id: 'otMonth', name: 'قائمة الشهر (الساعات الإضافية)' },
    { id: 'otYear', name: 'قائمة السنة (الساعات الإضافية)' },
    { id: 'fridayDate', name: 'حقل التاريخ (أيام الجمعة)' },
    { id: 'fpTabs', name: 'تبويبات العمال (حسابات الجمعة)' },
    { id: 'fpPanes', name: 'محتوى التبويبات' },
    { id: 'headOtList', name: 'قائمة الطلبات (رئيس)' },
    { id: 'paymentTrackingList', name: 'متابعة الدفع' },
];

elements.forEach(({ id, name }) => {
    const el = document.getElementById(id);
    console.log(`${el ? '✅' : '❌'} ${name} (id: ${id})`);
});

console.groupEnd();

// ============================================================
// 6. اختبار الاتصال مع الإشعارات
// ============================================================
console.group('📢 نظام الإشعارات');

if (typeof addNotification === 'function') {
    console.log('✅ دالة addNotification موجودة');
    console.log('يمكن إرسال إشعار عند رفع طلب جديد');
} else {
    console.error('❌ دالة addNotification غير موجودة');
}

console.groupEnd();

// ============================================================
// 7. معلومات البرنامج
// ============================================================
console.group('ℹ️ معلومات البرنامج');

console.log({
    'إصدار التطبيق': typeof APP_VERSION !== 'undefined' ? APP_VERSION : 'غير معروف',
    'الثيم الحالي': localStorage.getItem('sajco_theme') || 'apple-light',
    'اللغة الحالية': localStorage.getItem('sajco_lang') || 'ar',
    'URL قاعدة البيانات': typeof SUPABASE_CONFIG !== 'undefined' ? SUPABASE_CONFIG.url : 'غير موجود',
});

console.groupEnd();

// ============================================================
// 8. دالة سريعة لاختبار جدول معين
// ============================================================
window.testOvertimeTable = async (tableName) => {
    if (!supabaseClient) {
        console.error('Supabase غير متصل');
        return;
    }

    try {
        const { data, error, count } = await supabaseClient
            .from(tableName)
            .select('*', { count: 'exact' })
            .limit(5);

        if (error) {
            console.error(`❌ خطأ في جدول ${tableName}:`, error);
        } else {
            console.log(`✅ جدول ${tableName}:`, {
                'العدد': count,
                'البيانات': data,
            });
        }
    } catch (e) {
        console.error(`❌ استثناء:`, e.message);
    }
};

// ============================================================
// 9. دالة سريعة للتحقق من صحة الاتصال
// ============================================================
window.checkOvertimeConnection = async () => {
    console.clear();
    console.log('🔍 بدء الفحص الشامل للاتصالات...\n');

    const results = {
        'Supabase': supabaseClient !== null ? '✅' : '❌',
        'المستخدم': currentUser ? '✅' : '❌',
        'الدوال': Object.keys(window).filter(k => k.startsWith('load') || k.startsWith('submit')).length + ' دالة',
        'الساعة': new Date().toLocaleString('ar-SA'),
    };

    console.table(results);
    console.log('\n💡 استخدم: testOvertimeTable("overtime_records") لاختبار جدول معين');
};

// ============================================================
// 10. رسالة الترحيب
// ============================================================
console.log(`
╔════════════════════════════════════════╗
║  🧪 اختبار صفحة الساعات الإضافية  ║
║  Testing Overtime & Friday Page         ║
╚════════════════════════════════════════╝

الأوامر المتاحة:
- checkOvertimeConnection() — فحص شامل سريع
- testOvertimeTable('جدول') — اختبار جدول معين

مثال:
testOvertimeTable('overtime_records')
testOvertimeTable('friday_requests')

═══════════════════════════════════════════
`);

