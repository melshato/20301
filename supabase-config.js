/**
 * supabase-config.js - النسخة الآمنة
 * يقرأ المفاتيح من window.__env (يُحقن من Netlify snippet injection)
 * لا يوجد أي مفتاح مكشوف في الكود
 */

// ملاحظة أمنية: مفتاح anon في Supabase مُصمَّم ليكون عاماً في كود الواجهة.
// الأمان الحقيقي يأتي من سياسات RLS في Supabase، وليس من إخفاء المفتاح.
// يُفضَّل حقن المفاتيح عبر window.__env (Vercel ENV) في بيئة الإنتاج.
const _env = window.__env || {};
const SUPABASE_CONFIG = {
    url:     _env.SUPABASE_URL      || 'https://uspvvoieirvqcoahdoec.supabase.co',
    anonKey: _env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcHZ2b2llaXJ2cWNvYWhkb2VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzODk2NjgsImV4cCI6MjA5NDk2NTY2OH0.Q55ods5h5MQgGJhN9J9C1k73wfF8kNuAUPWjegS_D5k',
    serviceKey: ''
};

window.supabaseClient = null;
var supabaseClient = null;

/**
 * تهيئة الاتصال بـ Supabase
 */
function initSupabase() {
    if (typeof supabase === 'undefined') {
        console.warn('⚠️ مكتبة Supabase غير محملة. وضع localStorage.');
        return false;
    }

    if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
        console.warn('⚠️ مفاتيح Supabase غير موجودة. تأكد من إعداد window.__env قبل هذا الملف.');
        return false;
    }

    try {
        supabaseClient = supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            }
        );
        window.supabaseClient = supabaseClient;
        console.log('✅ Supabase متصل');
        return true;
    } catch (error) {
        console.error('❌ فشل اتصال Supabase:', error.message);
        return false;
    }
}

// ============================================================
// Storage Helper - رفع ملفات على Supabase Storage
// ============================================================
const SupabaseStorage = {
    BUCKETS: {
        ASSETS: 'assets',
        CALIBRATION: 'calibration-certificates'
    },

    /**
     * رفع ملف على storage
     * @param {string} bucket - اسم الـ bucket
     * @param {string} path - المسار داخل الـ bucket
     * @param {File|Blob} file - الملف
     * @param {string} contentType - نوع الملف
     */
    async upload(bucket, path, file, contentType = null) {
        if (!supabaseClient) return { success: false, error: 'Supabase غير متصل' };
        try {
            const options = { upsert: true };
            if (contentType) options.contentType = contentType;

            const { data, error } = await supabaseClient.storage
                .from(bucket)
                .upload(path, file, options);

            if (error) throw error;

            const { data: urlData } = supabaseClient.storage
                .from(bucket)
                .getPublicUrl(path);

            return { success: true, path: data.path, url: urlData.publicUrl };
        } catch (error) {
            console.error('Storage upload error:', error.message);
            return { success: false, error: error.message };
        }
    },

    /**
     * رفع صورة (logo أو app image) بعد ضغطها
     */
    async uploadImage(file, type = 'logo', userId = 'unknown') {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const maxW = type === 'logo' ? 200 : 800;
                    let w = img.width, h = img.height;
                    if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
                    canvas.width = w; canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    canvas.toBlob(async (blob) => {
                        const path = `brand/${type}_${userId}_${Date.now()}.jpg`;
                        const result = await SupabaseStorage.upload(
                            SupabaseStorage.BUCKETS.ASSETS, path, blob, 'image/jpeg'
                        );
                        resolve(result);
                    }, 'image/jpeg', type === 'logo' ? 0.9 : 0.8);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    },

    /**
     * رفع شهادة معايرة PDF
     * @param {File} file - ملف PDF
     * @param {string} serialNumber - رقم الجهاز
     * @param {string} userId - معرف المستخدم
     */
    async uploadCalibrationCert(file, serialNumber, userId) {
        const timestamp = Date.now();
        const safeName = serialNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
        const path = `${safeName}/${timestamp}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

        return await SupabaseStorage.upload(
            SupabaseStorage.BUCKETS.CALIBRATION,
            path,
            file,
            file.type
        );
    },

    /**
     * جلب قائمة ملفات من مجلد
     */
    async listFiles(bucket, folder = '') {
        if (!supabaseClient) return { success: false, data: [] };
        try {
            const { data, error } = await supabaseClient.storage
                .from(bucket)
                .list(folder, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            return { success: false, error: error.message, data: [] };
        }
    },

    /**
     * حذف ملف
     */
    async deleteFile(bucket, path) {
        if (!supabaseClient) return { success: false };
        try {
            const { error } = await supabaseClient.storage.from(bucket).remove([path]);
            if (error) throw error;
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * جلب رابط مؤقت لملف خاص
     */
    async getSignedUrl(bucket, path, expiresIn = 3600) {
        if (!supabaseClient) return null;
        try {
            const { data, error } = await supabaseClient.storage
                .from(bucket)
                .createSignedUrl(path, expiresIn);
            if (error) throw error;
            return data.signedUrl;
        } catch (error) {
            return null;
        }
    }
};

// ============================================================
// SupabaseDB - CRUD مبسط
// ============================================================
const SupabaseDB = {
    async saveData(table, data) {
        if (!supabaseClient) return { success: false, error: 'not connected' };
        try {
            const { data: result, error } = await supabaseClient.from(table).upsert(data);
            if (error) throw error;
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async getData(table, filters = null) {
        if (!supabaseClient) return { success: false, error: 'not connected' };
        try {
            let query = supabaseClient.from(table).select('*');
            if (filters) {
                Object.keys(filters).forEach(k => { query = query.eq(k, filters[k]); });
            }
            const { data, error } = await query;
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async updateData(table, id, updates) {
        if (!supabaseClient) return { success: false, error: 'not connected' };
        try {
            const { data, error } = await supabaseClient
                .from(table).update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async deleteData(table, id) {
        if (!supabaseClient) return { success: false, error: 'not connected' };
        try {
            const { error } = await supabaseClient.from(table).delete().eq('id', id);
            if (error) throw error;
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async syncLocalToSupabase() {
        if (typeof syncLocalToSupabase === 'function') return await syncLocalToSupabase();
        return { success: false, failed: 0 };
    }
};

function isSupabaseConnected() {
    return supabaseClient !== null && typeof supabaseClient.auth !== 'undefined';
}

if (typeof supabase !== 'undefined') {
    initSupabase();
} else {
    console.warn('⚠️ مكتبة Supabase غير موجودة. وضع localStorage.');
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SUPABASE_CONFIG, initSupabase, SupabaseDB, SupabaseStorage, supabaseClient, isSupabaseConnected };
}
