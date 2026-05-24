/**
 * supabase-data-layer.js
 * طبقة البيانات المتكاملة between الكandد المandجandد (camelCase + localStorage)
 * andقاعدة بيانات Supabase (snake_case + UUID)
 * 
 * المميزات:
 * - ترجمة تلقائية between camelCase and snake_case
 * - مصادقة عبر Supabase Auth
 * - مزاfromة Offline مع localStorage
 * - التWorker مع UUID
 */

// ============================================================
// 1. خريطة تحandيل أسماء الحقandل (camelCase <-> snake_case)
// ============================================================
const FIELD_MAPPINGS = {
    // جدandل المستخدمين (users)
    users: {
        id: 'id',
        name: 'name',
        email: 'email',
        role: 'role',
        status: 'status',
        empId: 'emp_id',
        phone: 'phone',
        nationality: 'nationality',
        project: 'project',
        branch: 'branch_id',
        responsibleBranch: 'responsible_branch_id',
        headSurveyor: 'head_surveyor',
        totalExp: 'total_exp',
        companyExp: 'company_exp',
        joinDate: 'join_date',
        substituteId: 'substitute_id',
        password: 'password', // خاص بـ localStorage فقط
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    // جدandل الأجهزة (devices)
    devices: {
        id: 'id',
        serial: 'serial',
        type: 'type',
        ownerId: 'owner_id',
        branch: 'branch_id',
        calDate: 'cal_date',
        status: 'status',
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    // جدandل العهدة (custodies)
    custodies: {
        id: 'id',
        userId: 'user_id',
        assignedBy: 'assigned_by',
        deviceType: 'device_type',
        serialNumber: 'serial_number',
        receiptDate: 'receipt_date',
        branchId: 'branch_id',
        calibrationDate: 'calibration_date',
        deviceCondition: 'device_condition',
        status: 'status',
        receivedFrom: 'received_from',
        receivedFromName: 'received_from_name',
        notes: 'notes',
        satisfied: 'satisfied',
        careLevel: 'care_level',
        timestamp: 'timestamp',
        approvalHistory: 'approval_history',
        transferData: 'transfer_data',
        receiverNotes: 'receiver_notes',
        receiverDeviceCondition: 'receiver_device_condition',
        receiverComment: 'receiver_comment',
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    // جدandل التقييمات (ratings)
    ratings: {
        id: 'id',
        userId: 'user_id',
        ratedBy: 'rated_by',
        ratedByName: 'rated_by_name',
        stars: 'stars',
        answers: 'answers',
        notes: 'notes',
        timestamp: 'timestamp',
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    // جدandل Notifications (notifications)
    notifications: {
        id: 'id',
        userId: 'user_id',
        message: 'message',
        type: 'type',
        timestamp: 'timestamp',
        relatedId: 'related_id',
        read: 'read',
        isSubstituteNotif: 'is_substitute_notif',
        createdAt: 'created_at'
    },
    // جدandل السجNoت (logs)
    logs: {
        id: 'id',
        userId: 'user_id',
        msg: 'msg',
        timestamp: 'timestamp'
    },
    // جدandل الفرandع (branches)
    branches: {
        id: 'id',
        name: 'name',
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    // جدandل الأرقام الandظيفية المسمandحة (allowed_employee_ids)
    allowedEmployeeIds: {
        id: 'id',
        empId: 'emp_id',
        name: 'name',
        createdAt: 'created_at'
    },
    // جدandل Settings (settings)
    settings: {
        id: 'id',
        key: 'key',
        value: 'value',
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    // جدandل المشاريع (projects)
    projects: {
        id: 'id',
        name: 'name',
        description: 'description',
        branchId: 'branch_id',
        startDate: 'start_date',
        endDate: 'end_date',
        status: 'status',
        completion: 'completion',
        surveyors: 'surveyors',
        createdBy: 'created_by',
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    // جدandل Leave Requests (leave_requests)
    leaveRequests: {
        id: 'id',
        userId: 'user_id',
        userName: 'user_name',
        branchId: 'branch_id',
        startDate: 'start_date',
        endDate: 'end_date',
        requestedDays: 'requested_days',
        reason: 'reason',
        status: 'status',
        approvedDaysByHead: 'approved_days_by_head',
        approvedDaysFinal: 'approved_days_final',
        rejectedBy: 'rejected_by',
        rejectionReason: 'rejection_reason',
        isDeparted: 'is_departed',
        isReturned: 'is_returned',
        actualDepartureDate: 'actual_departure_date',
        actualReturnDate: 'actual_return_date',
        history: 'history',
        timestamp: 'timestamp',
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    // طلبات Maintenance & Calibration (maintenance_requests)
    maintenanceRequests: {
        id: 'id',
        deviceId: 'device_id',
        serialNumber: 'serial_number',
        deviceType: 'device_type',
        requestType: 'request_type',
        status: 'status',
        requestedBy: 'requested_by',
        requestedByName: 'requested_by_name',
        branchId: 'branch_id',
        notes: 'notes',
        sentDate: 'sent_date',
        returnDate: 'return_date',
        newCalDate: 'new_cal_date',
        approvedBy: 'approved_by',
        approvedAt: 'approved_at',
        approvalHistory: 'approval_history',
        timestamp: 'timestamp',
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
};

// ============================================================
// خريطة تحandيل اسم الجدandل (snake_case DB) → مفتاح FIELD_MAPPINGS
// ============================================================
const TABLE_NAME_TO_MAPPING = {
    'leave_requests':       'leaveRequests',
    'maintenance_requests': 'maintenanceRequests',
    'direct_messages':      'directMessages',
    'calibration_certificates': 'calibrationCerts',
    'allowed_employee_ids': 'allowedEmployeeIds'
};

function _resolveMappingKey(tableName) {
    return TABLE_NAME_TO_MAPPING[tableName] || tableName;
}

// ============================================================
// 2. دandال تحandيل الحقandل
// ============================================================

/**
 * تحandيل كائن from camelCase to snake_case
 * @param {string} tableName - اسم الجدandل
 * @param {Object} data - البيانات بصيغة camelCase
 * @returns {Object} البيانات بصيغة snake_case
 */
function toSnakeCase(tableName, data) {
    const mapping = FIELD_MAPPINGS[_resolveMappingKey(tableName)];
    if (!mapping) return data;

    const result = {};
    for (const [camelKey, snakeKey] of Object.entries(mapping)) {
        if (data[camelKey] !== undefined) {
            result[snakeKey] = data[camelKey];
        }
    }
    // Add أي حقandل إضافية غير مandجandدة في الخريطة
    for (const key of Object.keys(data)) {
        if (!mapping[key] && key !== 'password') {
            result[key] = data[key];
        }
    }
    return result;
}

/**
 * تحandيل كائن from snake_case to camelCase
 * @param {string} tableName - اسم الجدandل
 * @param {Object} data - البيانات بصيغة snake_case
 * @returns {Object} البيانات بصيغة camelCase
 */
function toCamelCase(tableName, data) {
    if (!data) return data;

    const mapping = FIELD_MAPPINGS[_resolveMappingKey(tableName)];
    if (!mapping) return data;

    // عكس الخريطة: snake_case -> camelCase
    const reverseMapping = {};
    for (const [camelKey, snakeKey] of Object.entries(mapping)) {
        reverseMapping[snakeKey] = camelKey;
    }

    const result = {};
    for (const [snakeKey, value] of Object.entries(data)) {
        const camelKey = reverseMapping[snakeKey] || snakeKey;
        result[camelKey] = value;
    }
    return result;
}

/**
 * تحandيل مصفandفة كاملة from snake_case to camelCase
 */
function toCamelCaseArray(tableName, dataArray) {
    if (!dataArray) return [];
    return dataArray.map(item => toCamelCase(tableName, item));
}

// ============================================================
// 3. دandال المصادقة (Authentication)
// ============================================================

const SupabaseAuth = {
    /**
     * Login باستخدام Supabase Auth
     */
    async signIn(email, password) {
        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            // جلب بيانات المستخدم from جدandل users
            const userData = await SupabaseDataLayer.getUserById(data.user.id);
            
            if (!userData.success) {
                throw new Error('لم يDone العثandر على بيانات المستخدم');
            }

            const user = userData.data;
            
            if (user.status === 'pending') {
                throw new Error('حسابك Under Review');
            }

            // Save الجلسة في localStorage (للتandافق مع الكandد الحالي)
            localStorage.setItem('sajco_session', JSON.stringify(user));
            
            return { success: true, user: user };
        } catch (error) {
            // في حال فشل اNoتصال بـ Supabase، نستخدم localStorage كبديل
            console.warn('Supabase Auth failed, falling back to localStorage:', error.message);
            return SupabaseAuth.fallbackSignIn(email, password);
        }
    },

    /**
     * بديل Login عبر localStorage (حالة عدم اNoتصال)
     */
    fallbackSignIn(email, password) {
        const user = db.users.find(u => u.email === email && u.password === password);
        if (!user) {
            return { success: false, error: 'بيانات الLogin خاطئة' };
        }
        if (user.status === 'pending') {
            return { success: false, error: 'حسابك Under Review' };
        }
        localStorage.setItem('sajco_session', JSON.stringify(user));
        return { success: true, user: user };
    },

    /**
     * Register New User في Supabase Auth
     */
    async signUp(email, password, userData) {
        try {
            // 1. Create Account في Supabase Auth
            const { data: authData, error: authError } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        name: userData.name,
                        role: userData.role || 'surveyor'
                    }
                }
            });

            if (authError) throw authError;

            // 2. Add المستخدم to جدandل users
            const newUser = {
                id: authData.user.id,
                name: userData.name,
                email: email,
                role: userData.role || 'surveyor',
                status: userData.role === 'head' ? 'pending' : 'approved',
                empId: userData.empId,
                phone: userData.phone || null,
                nationality: userData.nationality || null,
                project: userData.project || null,
                branch: userData.branch || null,
                responsibleBranch: userData.responsibleBranch || null,
                headSurveyor: userData.headSurveyor || null,
                totalExp: userData.totalExp ? parseInt(userData.totalExp) : null,
                companyExp: userData.companyExp ? parseInt(userData.companyExp) : null,
                joinDate: userData.joinDate || null,
                substituteId: null
            };

            const dbResult = await SupabaseDataLayer.createUser(newUser);
            
            if (!dbResult.success) {
                // Rollback: Delete حساب Auth إذا فشل إدراج المستخدم
                await supabaseClient.admin.deleteUser(authData.user.id);
                throw new Error(dbResult.error);
            }

            // 3. Add to localStorage للتandافق
            const localUser = { ...newUser, password: password };
            db.users.push(localUser);
            saveDB();
            addLog(`تسجيل حساب جديد (Supabase): ${newUser.name} (${newUser.role})`);

            return { success: true, user: { ...newUser, password: password } };
        } catch (error) {
            console.error('Supabase signup failed:', error.message);
            // الرجandع to التسجيل المحلي
            return { success: false, error: error.message };
        }
    },

    /**
     * Logout
     */
    async signOut() {
        try {
            await supabaseClient.auth.signOut();
        } catch (e) {
            console.warn('Supabase signout warning:', e.message);
        }
        localStorage.removeItem('sajco_session');
        window.location.href = 'index.html';
    },

    /**
     * الحصandل على المستخدم الحالي from Supabase
     */
    async getCurrentUser() {
        try {
            const { data: { user }, error } = await supabaseClient.auth.getUser();
            if (error) throw error;
            return user;
        } catch (e) {
            return null;
        }
    }
};

// ============================================================
// 4. طبقة البيانات الرئيسية (Data Layer)
// ============================================================

const SupabaseDataLayer = {
    /**
     * جلب جميع السجNoت from جدandل معين
     */
    async getAll(tableName) {
        try {
            const { data, error } = await supabaseClient
                .from(tableName)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data: toCamelCaseArray(tableName, data) };
        } catch (error) {
            console.error(`خطأ في جلب ${tableName}:`, error.message);
            // Fallback: جلب from localStorage
            return SupabaseDataLayer.fallbackGetAll(tableName);
        }
    },

    /**
     * جلب سجل بandاسطة ID
     */
    async getById(tableName, id) {
        try {
            const { data, error } = await supabaseClient
                .from(tableName)
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return { success: true, data: toCamelCase(tableName, data) };
        } catch (error) {
            console.error(`خطأ في جلب ${tableName} بالـ ID:`, error.message);
            return SupabaseDataLayer.fallbackGetById(tableName, id);
        }
    },

    /**
     * إنشاء سجل جديد
     */
    async create(tableName, data) {
        try {
            const snakeData = toSnakeCase(tableName, {
                ...data,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            const { data: result, error } = await supabaseClient
                .from(tableName)
                .insert(snakeData)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data: toCamelCase(tableName, result) };
        } catch (error) {
            console.error(`خطأ في إنشاء ${tableName}:`, error.message);
            return SupabaseDataLayer.fallbackCreate(tableName, data);
        }
    },

    /**
     * Refresh سجل
     */
    async update(tableName, id, updates) {
        try {
            const snakeUpdates = toSnakeCase(tableName, {
                ...updates,
                updatedAt: new Date().toISOString()
            });

            const { data, error } = await supabaseClient
                .from(tableName)
                .update(snakeUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data: toCamelCase(tableName, data) };
        } catch (error) {
            console.error(`خطأ في Refresh ${tableName}:`, error.message);
            return SupabaseDataLayer.fallbackUpdate(tableName, id, updates);
        }
    },

    /**
     * Delete سجل
     */
    async delete(tableName, id) {
        try {
            const { error } = await supabaseClient
                .from(tableName)
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error(`خطأ في Delete ${tableName}:`, error.message);
            return SupabaseDataLayer.fallbackDelete(tableName, id);
        }
    },

    /**
     * استعNoم مع فNoتر
     */
    async query(tableName, filters = {}, options = {}) {
        try {
            let query = supabaseClient.from(tableName).select('*');

            // تطبيق الفNoتر
            for (const [key, value] of Object.entries(filters)) {
                const snakeKey = FIELD_MAPPINGS[tableName]?.[key] || key;
                query = query.eq(snakeKey, value);
            }

            // Sort
            if (options.orderBy) {
                const snakeOrder = FIELD_MAPPINGS[tableName]?.[options.orderBy] || options.orderBy;
                query = query.order(snakeOrder, { ascending: options.ascending !== false });
            }

            // تحديد عدد النتائج
            if (options.limit) {
                query = query.limit(options.limit);
            }

            const { data, error } = await query;

            if (error) throw error;
            return { success: true, data: toCamelCaseArray(tableName, data) };
        } catch (error) {
            console.error(`خطأ في استعNoم ${tableName}:`, error.message);
            return { success: false, error: error.message, data: [] };
        }
    },

    // ============================================================
    // 5. دandال خاصة بكل جدandل (تبسيط اNoستخدام)
    // ============================================================

    // --- المستخدمين ---
    async getUserById(id) {
        // محاandلة Supabase orNoً
        const result = await this.getById('users', id);
        if (result.success) return result;
        
        // Fallback: الSearch في localStorage
        const user = db.users.find(u => u.id === id);
        return user ? { success: true, data: user } : { success: false, error: 'المستخدم غير مandجandد' };
    },

    async getUserByEmail(email) {
        const result = await this.query('users', { email: email });
        if (result.success && result.data.length > 0) return { success: true, data: result.data[0] };
        
        // Fallback
        const user = db.users.find(u => u.email === email);
        return user ? { success: true, data: user } : { success: false, error: 'المستخدم غير مandجandد' };
    },

    async getAllUsers() {
        const result = await this.getAll('users');
        if (result.success) return result;
        
        // Fallback
        return { success: true, data: [...(db.users || [])] };
    },

    async createUser(userData) {
        return this.create('users', userData);
    },

    async updateUser(id, updates) {
        // Refresh في Supabase
        const result = await this.update('users', id, updates);
        
        // Refresh في localStorage أيضاً
        const userIndex = db.users.findIndex(u => u.id === id);
        if (userIndex !== -1) {
            db.users[userIndex] = { ...db.users[userIndex], ...updates };
            saveDB();
        }
        
        return result;
    },

    async deleteUser(id) {
        const result = await this.delete('users', id);
        
        // Delete from localStorage أيضاً
        db.users = db.users.filter(u => u.id !== id);
        saveDB();
        
        return result;
    },

    // --- الأجهزة ---
    async getAllDevices() {
        const result = await this.getAll('devices');
        if (result.success) return result;
        return { success: true, data: [...(db.devices || [])] };
    },

    async createDevice(deviceData) {
        return this.create('devices', deviceData);
    },

    async updateDevice(id, updates) {
        const result = await this.update('devices', id, updates);
        
        // Refresh في localStorage
        const deviceIndex = db.devices.findIndex(d => d.id === id);
        if (deviceIndex !== -1) {
            db.devices[deviceIndex] = { ...db.devices[deviceIndex], ...updates };
            saveDB();
        }
        
        return result;
    },

    async deleteDevice(id) {
        const result = await this.delete('devices', id);
        db.devices = db.devices.filter(d => d.id !== id);
        saveDB();
        return result;
    },

    async getDevicesByOwner(ownerId) {
        const result = await this.query('devices', { ownerId: ownerId });
        if (result.success) return result;
        
        // Fallback
        const devices = db.devices.filter(d => d.ownerId === ownerId);
        return { success: true, data: devices };
    },

    // --- العهدة ---
    async getAllCustodies() {
        const result = await this.getAll('custodies');
        if (result.success) return result;
        return { success: true, data: [...(db.custodies || [])] };
    },

    async createCustody(custodyData) {
        const result = await this.create('custodies', custodyData);
        
        // Save محلياً
        db.custodies.push(custodyData);
        saveDB();
        
        return result;
    },

    async updateCustody(id, updates) {
        const result = await this.update('custodies', id, updates);
        
        const custodyIndex = db.custodies.findIndex(c => c.id === id);
        if (custodyIndex !== -1) {
            db.custodies[custodyIndex] = { ...db.custodies[custodyIndex], ...updates };
            saveDB();
        }
        
        return result;
    },

    async deleteCustody(id) {
        const result = await this.delete('custodies', id);
        db.custodies = db.custodies.filter(c => c.id !== id);
        saveDB();
        return result;
    },

    async getCustodiesByUser(userId) {
        const result = await this.query('custodies', { userId: userId });
        if (result.success) return result;
        
        const custodies = db.custodies.filter(c => c.userId === userId);
        return { success: true, data: custodies };
    },

    async getPendingCustodies() {
        const result = await this.query('custodies', {}, { 
            orderBy: 'createdAt', 
            ascending: false 
        });
        if (result.success) {
            const pending = result.data.filter(c => 
                c.status !== 'approved' && c.status !== 'rejected'
            );
            return { success: true, data: pending };
        }
        
        // Fallback
        const pending = db.custodies.filter(c => 
            c.status !== 'approved' && c.status !== ''
        );
        return { success: true, data: pending.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) };
    },

    // --- التقييمات ---
    async getAllRatings() {
        const result = await this.getAll('ratings');
        if (result.success) return result;
        return { success: true, data: [...(db.ratings || [])] };
    },

    async createRating(ratingData) {
        const result = await this.create('ratings', ratingData);
        
        db.ratings.push(ratingData);
        saveDB();
        
        return result;
    },

    async getRatingsByUser(userId) {
        const result = await this.query('ratings', { userId: userId });
        if (result.success) return result;
        
        const ratings = db.ratings.filter(r => r.userId === userId);
        return { success: true, data: ratings };
    },

    // --- Notifications ---
    async getAllNotifications() {
        const result = await this.getAll('notifications');
        if (result.success) return result;
        return { success: true, data: [...(db.notifications || [])] };
    },

    async createNotification(notifData) {
        const result = await this.create('notifications', notifData);
        
        db.notifications.push(notifData);
        saveDB();
        
        return result;
    },

    async getNotificationsByUser(userId) {
        const result = await this.query('notifications', { userId: userId }, { orderBy: 'timestamp', ascending: false });
        if (result.success) return result;
        
        const notifications = (db.notifications || [])
            .filter(n => n.userId === userId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return { success: true, data: notifications };
    },

    async markNotificationAsRead(id) {
        return this.update('notifications', id, { read: true });
    },

    // --- السجNoت ---
    async getAllLogs() {
        const result = await this.getAll('logs');
        if (result.success) return result;
        return { success: true, data: [...(db.logs || [])] };
    },

    async createLog(logData) {
        const result = await this.create('logs', logData);
        
        db.logs.unshift(logData);
        saveDB();
        
        return result;
    },

    // --- الفرandع ---
    async getAllBranches() {
        const result = await this.getAll('branches');
        if (result.success) return result;
        return { success: true, data: [...(db.branches || [])] };
    },

    async createBranch(branchData) {
        return this.create('branches', branchData);
    },

    async updateBranch(id, updates) {
        const result = await this.update('branches', id, updates);
        
        const branchIndex = db.branches.findIndex(b => b.id === id);
        if (branchIndex !== -1) {
            db.branches[branchIndex] = { ...db.branches[branchIndex], ...updates };
            saveDB();
        }
        
        return result;
    },

    async deleteBranch(id) {
        const result = await this.delete('branches', id);
        db.branches = db.branches.filter(b => b.id !== id);
        saveDB();
        return result;
    },

    // --- Settings ---
    async getSetting(key) {
        try {
            const { data, error } = await supabaseClient
                .from('settings')
                .select('*')
                .eq('key', key)
                .single();

            if (error) throw error;
            return { success: true, data: toCamelCase('settings', data) };
        } catch (error) {
            // Fallback: Settings المحلية
            return { success: true, data: db.settings?.[key] || null };
        }
    },

    async setSetting(key, value) {
        try {
            const snakeData = toSnakeCase('settings', {
                key: key,
                value: typeof value === 'object' ? value : value,
                updatedAt: new Date().toISOString()
            });

            const { data, error } = await supabaseClient
                .from('settings')
                .upsert(snakeData, { onConflict: 'key' })
                .select()
                .single();

            if (error) throw error;
            
            // Refresh محلي
            if (db.settings) {
                db.settings[key] = value;
                saveDB();
            }
            
            return { success: true, data: toCamelCase('settings', data) };
        } catch (error) {
            console.warn('Failed to save setting to Supabase:', error.message);
            // Save محلياً
            if (db.settings) {
                db.settings[key] = value;
                saveDB();
            }
            return { success: true };
        }
    },

    // --- الأرقام الandظيفية المسمandحة ---
    async getAllowedEmployeeIds() {
        try {
            const { data, error } = await supabaseClient
                .from('allowed_employee_ids')
                .select('emp_id, name');
            if (error) throw error;
            // Return مصفandفة كائنات {empId, name} للتandافق مع النظام الجديد
            return { success: true, data: data.map(row => ({ empId: row.emp_id, name: row.name || '' })) };
        } catch (error) {
            return { success: true, data: [...(db.allowedEmployeeIds || [])] };
        }
    },

    async addAllowedEmployeeId(empId, name = '') {
        try {
            const { error } = await supabaseClient
                .from('allowed_employee_ids')
                .upsert({ emp_id: empId, name: name }, { onConflict: 'emp_id' });
            if (error) throw error;
            const exists = db.allowedEmployeeIds.find(e => (typeof e === 'object' ? e.empId : e) === empId);
            if (!exists) { db.allowedEmployeeIds.push({ empId, name }); saveDB(); }
            return { success: true };
        } catch (error) {
            const exists = db.allowedEmployeeIds.find(e => (typeof e === 'object' ? e.empId : e) === empId);
            if (!exists) { db.allowedEmployeeIds.push({ empId, name }); saveDB(); }
            return { success: true };
        }
    },

    async updateAllowedEmployeeName(empId, name) {
        try {
            const { error } = await supabaseClient
                .from('allowed_employee_ids')
                .update({ name })
                .eq('emp_id', empId);
            if (error) throw error;
            const entry = db.allowedEmployeeIds.find(e => (typeof e === 'object' ? e.empId : e) === empId);
            if (entry && typeof entry === 'object') { entry.name = name; saveDB(); }
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async removeAllowedEmployeeId(empId) {
        try {
            const { error } = await supabaseClient
                .from('allowed_employee_ids')
                .delete()
                .eq('emp_id', empId);
            if (error) throw error;
            db.allowedEmployeeIds = db.allowedEmployeeIds.filter(e => (typeof e === 'object' ? e.empId : e) !== empId);
            saveDB();
            return { success: true };
        } catch (error) {
            db.allowedEmployeeIds = db.allowedEmployeeIds.filter(e => (typeof e === 'object' ? e.empId : e) !== empId);
            saveDB();
            return { success: true };
        }
    },

    // --- المشاريع ---
    async getAllProjects() {
        const result = await this.getAll('projects');
        if (result.success) return result;
        return { success: true, data: [...(db.projects || [])] };
    },

    async createProject(projectData) {
        const result = await this.create('projects', projectData);
        if (result.success) { db.projects.push(result.data || projectData); saveDB(); }
        return result;
    },

    async updateProject(id, updates) {
        const result = await this.update('projects', id, updates);
        const idx = db.projects.findIndex(p => p.id === id);
        if (idx !== -1) { db.projects[idx] = { ...db.projects[idx], ...updates }; saveDB(); }
        return result;
    },

    async deleteProject(id) {
        const result = await this.delete('projects', id);
        db.projects = db.projects.filter(p => p.id !== id);
        saveDB();
        return result;
    },

    // --- Leave Requests ---
    async getAllLeaveRequests() {
        const result = await this.getAll('leave_requests');
        if (result.success) return result;
        return { success: true, data: [...(db.leaveRequests || [])] };
    },

    async createLeaveRequest(leaveData) {
        const result = await this.create('leave_requests', leaveData);
        if (result.success) { db.leaveRequests.push(result.data || leaveData); saveDB(); }
        return result;
    },

    async updateLeaveRequest(id, updates) {
        const result = await this.update('leave_requests', id, updates);
        const idx = db.leaveRequests.findIndex(l => l.id === id);
        if (idx !== -1) { db.leaveRequests[idx] = { ...db.leaveRequests[idx], ...updates }; saveDB(); }
        return result;
    },

    async getLeaveRequestsByUser(userId) {
        const result = await this.query('leaveRequests', { userId }, { orderBy: 'timestamp', ascending: false });
        if (result.success) return result;
        const reqs = (db.leaveRequests || []).filter(l => l.userId === userId);
        return { success: true, data: reqs };
    },

    // --- طلبات الصيانة ---
    async getAllMaintenanceRequests() {
        const result = await this.getAll('maintenance_requests');
        if (result.success) return result;
        return { success: true, data: [...(db.maintenanceRequests || [])] };
    },

    async createMaintenanceRequest(reqData) {
        const result = await this.create('maintenance_requests', reqData);
        if (result.success) { db.maintenanceRequests.push(result.data || reqData); saveDB(); }
        return result;
    },

    async updateMaintenanceRequest(id, updates) {
        const result = await this.update('maintenance_requests', id, updates);
        const idx = db.maintenanceRequests.findIndex(r => r.id === id);
        if (idx !== -1) { db.maintenanceRequests[idx] = { ...db.maintenanceRequests[idx], ...updates }; saveDB(); }
        return result;
    },

    // ============================================================
    // 6. دandال الترحيل (Migration)
    // ============================================================

    /**
     * دالة مساعدة لإنشاء UUID
     */
    _generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    },

    /**
     * تحandيل ID قديم to UUID مع الحفاظ على التعيين
     */
    _convertId(oldId) {
        if (!oldId) return this._generateUUID();
        // إذا كان UUID بالفعل، ارجعه كما هand
        if (oldId.includes('-') && oldId.length === 36) return oldId;
        // إنشاء UUID محدد بناءً على الـ ID القديم (للحفاظ على اNoتساق)
        const hash = oldId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const hex = hash.toString(16).padStart(12, '0').slice(0, 12);
        return `local-${hex}-${Date.now()}`;
    },

    /**
     * نقل جميع البيانات from localStorage to Supabase
     */
    async migrateAllToSupabase() {
        const results = {
            users: { total: 0, success: 0, failed: 0 },
            devices: { total: 0, success: 0, failed: 0 },
            custodies: { total: 0, success: 0, failed: 0 },
            ratings: { total: 0, success: 0, failed: 0 },
            notifications: { total: 0, success: 0, failed: 0 },
            logs: { total: 0, success: 0, failed: 0 },
            branches: { total: 0, success: 0, failed: 0 },
            allowedEmployeeIds: { total: 0, success: 0, failed: 0 },
            settings: { total: 0, success: 0, failed: 0 }
        };

        // 1. الفرandع
        for (const branch of db.branches) {
            results.branches.total++;
            try {
                const snakeData = toSnakeCase('branches', {
                    ...branch,
                    id: this._convertId(branch.id),
                    createdAt: branch.createdAt || new Date().toISOString(),
                    updatedAt: branch.updatedAt || new Date().toISOString()
                });
                const { error } = await supabaseClient.from('branches').upsert(snakeData, { onConflict: 'id' });
                if (error) throw error;
                results.branches.success++;
            } catch (e) {
                console.error(`Failed to migrate branch ${branch.id}:`, e.message);
                results.branches.failed++;
            }
        }

        // 2. المستخدمandن (بدandن Password - ستُدار عبر Auth)
        for (const user of db.users) {
            results.users.total++;
            try {
                const snakeData = toSnakeCase('users', {
                    ...user,
                    id: this._convertId(user.id),
                    password: undefined, // No ننقل Password
                    createdAt: user.createdAt || new Date().toISOString(),
                    updatedAt: user.updatedAt || new Date().toISOString()
                });
                const { error } = await supabaseClient.from('users').upsert(snakeData, { onConflict: 'id' });
                if (error) throw error;
                results.users.success++;
            } catch (e) {
                console.error(`Failed to migrate user ${user.id}:`, e.message);
                results.users.failed++;
            }
        }

        // 3. الأجهزة
        for (const device of db.devices) {
            results.devices.total++;
            try {
                const snakeData = toSnakeCase('devices', {
                    ...device,
                    id: this._convertId(device.id),
                    createdAt: device.createdAt || new Date().toISOString(),
                    updatedAt: device.updatedAt || new Date().toISOString()
                });
                const { error } = await supabaseClient.from('devices').upsert(snakeData, { onConflict: 'id' });
                if (error) throw error;
                results.devices.success++;
            } catch (e) {
                console.error(`Failed to migrate device ${device.id}:`, e.message);
                results.devices.failed++;
            }
        }

        // 4. العهدة
        for (const custody of db.custodies) {
            results.custodies.total++;
            try {
                const snakeData = toSnakeCase('custodies', {
                    ...custody,
                    id: this._convertId(custody.id),
                    createdAt: custody.createdAt || new Date().toISOString(),
                    updatedAt: custody.updatedAt || new Date().toISOString()
                });
                const { error } = await supabaseClient.from('custodies').upsert(snakeData, { onConflict: 'id' });
                if (error) throw error;
                results.custodies.success++;
            } catch (e) {
                console.error(`Failed to migrate custody ${custody.id}:`, e.message);
                results.custodies.failed++;
            }
        }

        // 5. التقييمات
        for (const rating of db.ratings) {
            results.ratings.total++;
            try {
                const snakeData = toSnakeCase('ratings', {
                    ...rating,
                    createdAt: rating.createdAt || new Date().toISOString(),
                    updatedAt: rating.updatedAt || new Date().toISOString()
                });
                const { error } = await supabaseClient.from('ratings').insert(snakeData);
                if (error) throw error;
                results.ratings.success++;
            } catch (e) {
                console.error(`Failed to migrate rating:`, e.message);
                results.ratings.failed++;
            }
        }

        // 6. Notifications
        for (const notif of db.notifications) {
            results.notifications.total++;
            try {
                const snakeData = toSnakeCase('notifications', {
                    ...notif,
                    id: this._convertId(notif.id),
                    createdAt: notif.createdAt || new Date().toISOString()
                });
                const { error } = await supabaseClient.from('notifications').upsert(snakeData, { onConflict: 'id' });
                if (error) throw error;
                results.notifications.success++;
            } catch (e) {
                console.error(`Failed to migrate notification:`, e.message);
                results.notifications.failed++;
            }
        }

        // 7. السجNoت
        for (const log of db.logs) {
            results.logs.total++;
            try {
                const snakeData = toSnakeCase('logs', {
                    ...log,
                    userId: log.userId || 'system',
                    timestamp: log.timestamp || new Date().toISOString()
                });
                const { error } = await supabaseClient.from('logs').insert(snakeData);
                if (error) throw error;
                results.logs.success++;
            } catch (e) {
                console.error(`Failed to migrate log:`, e.message);
                results.logs.failed++;
            }
        }

        // 8. الأرقام الandظيفية المسمandحة
        for (const empId of db.allowedEmployeeIds) {
            results.allowedEmployeeIds.total++;
            try {
                const { error } = await supabaseClient.from('allowed_employee_ids').upsert(
                    { emp_id: empId },
                    { onConflict: 'emp_id' }
                );
                if (error) throw error;
                results.allowedEmployeeIds.success++;
            } catch (e) {
                console.error(`Failed to migrate empId ${empId}:`, e.message);
                results.allowedEmployeeIds.failed++;
            }
        }

        // 9. Settings
        if (db.settings) {
            for (const [key, value] of Object.entries(db.settings)) {
                if (key === 'deletedDefaultBranches' || key === 'logo' || key === 'appImage') {
                    results.settings.total++;
                    try {
                        const { error } = await supabaseClient.from('settings').upsert(
                            { key: key, value: value },
                            { onConflict: 'key' }
                        );
                        if (error) throw error;
                        results.settings.success++;
                    } catch (e) {
                        console.error(`Failed to migrate setting ${key}:`, e.message);
                        results.settings.failed++;
                    }
                }
            }
        }

        console.log('📊 نتائج الترحيل:', results);
        
        // Save عNoمة الترحيل
        localStorage.setItem('sajco_migration_complete', 'true');
        
        return { success: true, results: results };
    },

    /**
     * الVerify from حالة الترحيل
     */
    isMigrationComplete() {
        return localStorage.getItem('sajco_migration_complete') === 'true';
    },

    // ============================================================
    // 7. دandال Fallback للعمل Offline
    // ============================================================

    fallbackGetAll(tableName) {
        const tableMap = {
            users: 'users',
            devices: 'devices',
            custodies: 'custodies',
            ratings: 'ratings',
            notifications: 'notifications',
            logs: 'logs',
            branches: 'branches',
            settings: 'settings',
            projects: 'projects',
            leave_requests: 'leaveRequests',
            leaveRequests: 'leaveRequests',
            maintenance_requests: 'maintenanceRequests',
            maintenanceRequests: 'maintenanceRequests',
            direct_messages: 'directMessages',
            directMessages: 'directMessages'
        };
        const localKey = tableMap[tableName];
        return { success: true, data: localKey ? [...(db[localKey] || [])] : [] };
    },

    fallbackGetById(tableName, id) {
        const tableMap = {
            users: 'users',
            devices: 'devices',
            custodies: 'custodies',
            notifications: 'notifications',
            branches: 'branches'
        };
        const localKey = tableMap[tableName];
        if (!localKey) return { success: false, error: 'جدandل غير معرandف' };
        const item = db[localKey]?.find(item => item.id === id);
        return item ? { success: true, data: item } : { success: false, error: 'العنصر غير مandجandد' };
    },

    fallbackCreate(tableName, data) {
        const tableMap = {
            users: 'users',
            devices: 'devices',
            custodies: 'custodies',
            ratings: 'ratings',
            notifications: 'notifications',
            logs: 'logs',
            branches: 'branches'
        };
        const localKey = tableMap[tableName];
        if (!localKey) return { success: false, error: 'جدandل غير معرandف' };
        
        const newItem = {
            ...data,
            id: data.id || this._generateUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        db[localKey].push(newItem);
        saveDB();
        return { success: true, data: newItem };
    },

    fallbackUpdate(tableName, id, updates) {
        const tableMap = {
            users: 'users',
            devices: 'devices',
            custodies: 'custodies',
            notifications: 'notifications',
            branches: 'branches'
        };
        const localKey = tableMap[tableName];
        if (!localKey) return { success: false, error: 'جدandل غير معرandف' };
        
        const index = db[localKey]?.findIndex(item => item.id === id);
        if (index === -1 || index === undefined) return { success: false, error: 'العنصر غير مandجandد' };
        
        db[localKey][index] = { ...db[localKey][index], ...updates, updatedAt: new Date().toISOString() };
        saveDB();
        return { success: true, data: db[localKey][index] };
    },

    fallbackDelete(tableName, id) {
        const tableMap = {
            users: 'users',
            devices: 'devices',
            custodies: 'custodies',
            notifications: 'notifications',
            branches: 'branches'
        };
        const localKey = tableMap[tableName];
        if (!localKey) return { success: false, error: 'جدandل غير معرandف' };
        
        db[localKey] = db[localKey].filter(item => item.id !== id);
        saveDB();
        return { success: true };
    }
};

// ============================================================
// 8. دالة المصادقة المتكاملة (تحل محل الدالة الأصلية)
// ============================================================

/**
 * Login المتكامل (يحاandل Supabase orNoً، ثم localStorage)
 */
async function supabaseLogin(email, password) {
    return await SupabaseAuth.signIn(email, password);
}

/**
 * Register New User متكامل
 */
async function supabaseRegister(userData) {
    const { email, password, ...profile } = userData;
    
    // محاandلة التسجيل عبر Supabase Auth
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        const result = await SupabaseAuth.signUp(email, password, profile);
        if (result.success) return result;
    }
    
    // Fallback: التسجيل المحلي
    return registerNewUser(userData);
}

// ============================================================
// 9. مزاfromة البيانات عند اNoتصال
// ============================================================

/**
 * مزاfromة جميع البيانات المحلية مع Supabase عند تandفر اNoتصال
 */
async function syncLocalToSupabase() {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
        console.warn('⚠️ Supabase غير متصل، تخطي المزاfromة');
        return { success: false, message: 'Supabase غير متصل' };
    }

    const results = { success: 0, failed: 0 };
    
    // مزاfromة المستخدمين
    for (const user of db.users) {
        try {
            // إزالة الـ id andBranch andPassword لتجنب تعارض أنandاع البيانات (UUID)
            const { id, password, branch, responsibleBranch, ...userData } = user;
            const snakeData = toSnakeCase('users', userData);
            
            // المزاfromة بناءً على emp_id (Employee ID) كحقل فريد
            const { error } = await supabaseClient.from('users').upsert(snakeData, { onConflict: 'emp_id' });
            if (error) throw error;
            results.success++;
        } catch (e) {
            console.error('فشل مزاfromة مستخدم:', e);
            results.failed++;
        }
    }


    // مزاfromة العهدة
    for (const custody of db.custodies) {
        try {
            // تجاهل العهدة القديمة التي No تحتandي على UUID متandافق
            const { id, userId, assignedBy, branchId, ...custodyData } = custody;
            const snakeData = toSnakeCase('custodies', custodyData);
            
            // Note: سيDone تجاهل سجNoت العهدة إذا لم تكن مرتبطة بـ UUID مستخدم صحيح
            // يفضل المزاfromة بعد Login عبر Supabase Auth
            await supabaseClient.from('custodies').insert(snakeData);
            results.success++;
        } catch (e) {
            results.failed++;
        }
    }

    console.log(`✅ Doneت مزاfromة ${results.success} سجل بنجاح، فشل ${results.failed}`);
    return results;
}

// ============================================================
// 10. Export لNoستخدام (CommonJS + ES Module)
// ============================================================

// Export بصيغة CommonJS (لNoستخدام في Node.js)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SupabaseDataLayer,
        SupabaseAuth,
        supabaseLogin,
        supabaseRegister,
        syncLocalToSupabase,
        FIELD_MAPPINGS,
        toSnakeCase,
        toCamelCase,
        toCamelCaseArray
    };
}

// Export بصيغة ES Module (لNoستخدام مع Vite, Webpack, TypeScript)
// استخدم: import { SupabaseDataLayer, SupabaseAuth } from './supabase-data-layer.js'
if (typeof exports !== 'undefined') {
    // Named exports لNoستخدام مع ES Modules
    // يمكنك استخدام:
    //   import { SupabaseDataLayer } from './supabase-data-layer.js'
    //   import { SupabaseAuth } from './supabase-data-layer.js'
    //   import { supabaseLogin, supabaseRegister } from './supabase-data-layer.js'
    //   import { FIELD_MAPPINGS, toSnakeCase, toCamelCase } from './supabase-data-layer.js'
}

console.log('📦 Supabase Data Layer loaded successfully');
