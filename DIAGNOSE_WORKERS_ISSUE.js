/**
 * DIAGNOSE_WORKERS_ISSUE.js
 * أداة تشخيص مشكلة عدم ظهور العمال في صفحة الساعات الإضافية
 *
 * الاستخدام: افتح overtime.html، اضغط F12، ألصق هذا الملف في Console
 */

console.group('🔍 تشخيص مشكلة العمال');

// ============================================================
// 1. التحقق من بيانات المستخدم الحالي
// ============================================================
console.group('👤 بيانات المستخدم الحالي');

if (!_currentUser) {
    console.error('❌ _currentUser غير محدد');
} else {
    console.log('✅ بيانات المستخدم:');
    console.table({
        'الاسم': _currentUser.name,
        'المعرف': _currentUser.id,
        'الدور': _currentUser.role,
        'الرقم الوظيفي': _currentUser.empId,
    });
}

console.groupEnd();

// ============================================================
// 2. جلب العمال من Supabase بدون تصفية
// ============================================================
console.group('🔎 جلب العمال من Supabase');

(async () => {
    if (!supabaseClient) {
        console.error('❌ Supabase غير متصل');
        return;
    }

    try {
        // 1. جلب ALL العمال أولاً (بدون شروط)
        console.log('1️⃣ جلب جميع العمال...');
        const { data: allWorkers, error: allError } = await supabaseClient
            .from('workers')
            .select('*');

        if (allError) {
            console.error('❌ خطأ:', allError.message);
        } else {
            console.log(`✅ عدد العمال الكلي: ${allWorkers.length}`);
            if (allWorkers.length > 0) {
                console.log('📋 أول عامل:');
                console.table({
                    'المعرف': allWorkers[0].id,
                    'الاسم': allWorkers[0].name,
                    'surveyor_id': allWorkers[0].surveyor_id,
                    'الحالة': allWorkers[0].status,
                    'جميع الحقول': Object.keys(allWorkers[0]).join(', '),
                });
            }
        }

        // 2. جلب العمال التابعين للمساح الحالي
        if (_currentUser) {
            console.log('\n2️⃣ جلب عمال المساح الحالي...');
            const { data: myWorkers, error: myError } = await supabaseClient
                .from('workers')
                .select('*')
                .eq('surveyor_id', _currentUser.id);

            if (myError) {
                console.error('❌ خطأ:', myError.message);
            } else {
                console.log(`✅ عدد عمال المساح: ${myWorkers.length}`);
                if (myWorkers.length === 0) {
                    console.warn('⚠️ لا يوجد عمال! تحقق من:');
                    console.log('- هل surveyor_id في جدول workers يطابق _currentUser.id؟');
                    console.log(`- معرف المساح المستخدم: ${_currentUser.id}`);
                }
                if (myWorkers.length > 0) {
                    console.log('📋 قائمة العمال:');
                    console.table(myWorkers.map(w => ({
                        'الاسم': w.name,
                        'surveyor_id': w.surveyor_id,
                        'الحالة': w.status,
                    })));
                }
            }
        }

        // 3. جلب العمال النشطين
        console.log('\n3️⃣ جلب العمال النشطين فقط...');
        const { data: activeWorkers, error: activeError } = await supabaseClient
            .from('workers')
            .select('*')
            .eq('status', 'active');

        if (activeError) {
            console.error('❌ خطأ:', activeError.message);
        } else {
            console.log(`✅ عدد العمال النشطين: ${activeWorkers.length}`);
        }

    } catch (e) {
        console.error('❌ استثناء:', e.message);
    }

})();

console.groupEnd();

// ============================================================
// 3. التحقق من قيم الشهر والسنة
// ============================================================
console.group('📅 قيم الشهر والسنة');

const otMonth = document.getElementById('otMonth');
const otYear = document.getElementById('otYear');

console.log({
    'الشهر المختار': otMonth ? otMonth.value : 'غير موجود',
    'السنة المختارة': otYear ? otYear.value : 'غير موجود',
});

console.groupEnd();

// ============================================================
// 4. التحقق من حالة _myWorkers
// ============================================================
console.group('📦 حالة متغير _myWorkers');

if (typeof _myWorkers === 'undefined') {
    console.warn('⚠️ _myWorkers غير محدف - سيتم إنشاؤه عند استدعاء loadMonthlyWorkers()');
} else {
    console.log(`عدد العمال المحملين: ${_myWorkers.length}`);
    if (_myWorkers.length > 0) {
        console.table(_myWorkers.map(w => ({
            'الاسم': w.name,
            'المعرف': w.id,
        })));
    }
}

console.groupEnd();

// ============================================================
// 5. اختبار الدالة مباشرة
// ============================================================
console.group('🧪 اختبار استدعاء loadMonthlyWorkers()');

console.log('⏳ جارٍ استدعاء loadMonthlyWorkers()...');

(async () => {
    try {
        await loadMonthlyWorkers();
        console.log('✅ تم تنفيذ الدالة بنجاح');
        console.log(`عدد العمال المحملين الآن: ${_myWorkers.length}`);

        // التحقق من DOM
        const otWorkersTable = document.getElementById('otWorkersTable');
        const otNoWorkers = document.getElementById('otNoWorkers');

        console.log({
            'محتوى otWorkersTable': otWorkersTable ? otWorkersTable.innerHTML.slice(0, 100) + '...' : 'غير موجود',
            'عرض otNoWorkers': otNoWorkers ? otNoWorkers.style.display : 'غير موجود',
        });
    } catch (e) {
        console.error('❌ خطأ في استدعاء الدالة:', e.message);
        console.error(e);
    }
})();

console.groupEnd();

// ============================================================
// 6. اقتراحات الحل
// ============================================================
console.group('💡 اقتراحات الحل');

console.log(`
إذا لم تظهر العمال:

1️⃣ تحقق من أن جدول workers يحتوي على:
   - surveyor_id = ${_currentUser ? _currentUser.id : 'معرف المساح'}
   - status في القيم: ['active', 'approved', 'hired', null]

2️⃣ تحقق من أن المساح لديه عمال مسجلون:
   استدعِ: testSurveyorWorkers()

3️⃣ إذا كانت هناك مشكلة في الربط:
   استدعِ: fixWorkersSurveyorLink()

4️⃣ للحصول على التفاصيل الكاملة:
   استدعِ: showWorkerDebugInfo()
`);

console.groupEnd();

// ============================================================
// دوال مساعدة
// ============================================================

window.testSurveyorWorkers = async () => {
    console.log('جارٍ الفحص...');
    const { data, error } = await supabaseClient
        .from('workers')
        .select('id, name, surveyor_id, status')
        .eq('surveyor_id', _currentUser.id);

    if (error) {
        console.error('❌ خطأ:', error);
    } else {
        console.log(`✅ وجدت ${data.length} عمل(ة):`);
        console.table(data);
    }
};

window.showWorkerDebugInfo = async () => {
    const { data, error } = await supabaseClient
        .from('workers')
        .select('*')
        .eq('surveyor_id', _currentUser.id)
        .limit(1);

    if (data && data.length > 0) {
        console.log('تفاصيل العامل الأول:');
        console.log(JSON.stringify(data[0], null, 2));
    }
};

window.fixWorkersSurveyorLink = async () => {
    console.warn('⚠️ هذه العملية قد تعدل البيانات!');
    // هذه الدالة تتطلب صلاحيات admin
    console.log('اتصل بفريق الدعم إذا كنت بحاجة لإصلاح الربط');
};

console.log(`
📞 استخدم الدوال:
- testSurveyorWorkers() — اختبر العمال
- showWorkerDebugInfo() — عرض التفاصيل
`);

console.groupEnd();
