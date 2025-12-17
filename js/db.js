// إدارة التخزين المحلي
class TaskDB {
    constructor() {
        this.dbName = 'eisenhower-tasks';
        this.tasks = this.loadTasks();
    }

    // تحميل المهام من localStorage
    loadTasks() {
        const tasks = localStorage.getItem(this.dbName);
        return tasks ? JSON.parse(tasks) : [];
    }

    // حفظ المهام إلى localStorage
    saveTasks() {
        localStorage.setItem(this.dbName, JSON.stringify(this.tasks));
    }

    // إضافة مهمة جديدة
    addTask(task) {
        task.id = Date.now().toString();
        task.createdAt = new Date().toISOString();
        this.tasks.push(task);
        this.saveTasks();
        return task.id;
    }

    // تحديث مهمة
    updateTask(id, updates) {
        const index = this.tasks.findIndex(task => task.id === id);
        if (index !== -1) {
            this.tasks[index] = { ...this.tasks[index], ...updates };
            this.saveTasks();
            return true;
        }
        return false;
    }

    // حذف مهمة
    deleteTask(id) {
        const index = this.tasks.findIndex(task => task.id === id);
        if (index !== -1) {
            this.tasks.splice(index, 1);
            this.saveTasks();
            return true;
        }
        return false;
    }

    // جلب جميع المهام
    getAllTasks() {
        return [...this.tasks];
    }

    // جلب المهام حسب الربع
    getTasksByQuadrant(quadrant) {
        return this.tasks.filter(task => task.quadrant === quadrant);
    }

    // جلب مهمة بواسطة ID
    getTaskById(id) {
        return this.tasks.find(task => task.id === id);
    }

    // تصدير البيانات
    exportData() {
        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            tasks: this.tasks
        };
        return JSON.stringify(data, null, 2);
    }

    // استيراد البيانات
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.tasks && Array.isArray(data.tasks)) {
                // يمكنك إضافة تحقق من الصحة هنا
                this.tasks = data.tasks;
                this.saveTasks();
                return true;
            }
            return false;
        } catch (error) {
            console.error('خطأ في استيراد البيانات:', error);
            return false;
        }
    }

    // مسح جميع البيانات
    clearAll() {
        this.tasks = [];
        this.saveTasks();
    }
}

// إنشاء نسخة عامة من قاعدة البيانات

const taskDB = new TaskDB();

// في نهاية db.js، أضف هذا الكود للتحقق
console.log('📁 TaskDB مهيأ');
console.log('عدد المهام الحالية:', taskDB.getAllTasks().length);

// إضافة دالة للتحقق من التكرار
taskDB.checkForDuplicates = function() {
    const tasks = this.getAllTasks();
    const seen = new Set();
    const duplicates = [];
    
    tasks.forEach(task => {
        const key = task.title + task.description + task.quadrant;
        if (seen.has(key)) {
            duplicates.push(task);
        } else {
            seen.add(key);
        }
    });
    
    if (duplicates.length > 0) {
        console.warn(`⚠️ يوجد ${duplicates.length} مهمة مكررة`);
        // حذف المكررات
        const uniqueTasks = tasks.filter((task, index, self) => 
            index === self.findIndex(t => 
                t.title === task.title && 
                t.description === task.description && 
                t.quadrant === task.quadrant
            )
        );
        this.tasks = uniqueTasks;
        this.saveTasks();
        console.log(`✅ تم إزالة المكررات، بقي ${uniqueTasks.length} مهمة`);
    }
};

// تشغيل التحقق تلقائياً
setTimeout(() => {
    taskDB.checkForDuplicates();
}, 2000);
