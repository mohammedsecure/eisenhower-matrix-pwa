// تهيئة التطبيق - إصدار مصحح
let isInitialized = false; // لمنع التهيئة المزدوجة

function initApp() {
    // إذا تم التهيئة بالفعل، لا تفعل شيء
    if (isInitialized) {
        console.warn('⚠️ التطبيق مهيأ بالفعل!');
        return;
    }
    
    isInitialized = true;
    console.log('🚀 تهيئة التطبيق...');

    const addTaskBtn = document.getElementById('addTask');
    const taskModal = document.getElementById('taskModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const taskForm = document.getElementById('taskForm');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');

    let editingTaskId = null;

    // تحميل وعرض المهام
    renderAllTasks();

    // إزالة جميع المستمعين الحاليين أولاً (للتأكد)
    const newAddBtn = addTaskBtn.cloneNode(true);
    addTaskBtn.parentNode.replaceChild(newAddBtn, addTaskBtn);
    
    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    
    const newForm = taskForm.cloneNode(true);
    taskForm.parentNode.replaceChild(newForm, taskForm);

    // إعادة تعيين المرجع بعد الاستبدال
    const freshAddTaskBtn = document.getElementById('addTask');
    const freshCancelBtn = document.getElementById('cancelBtn');
    const freshTaskForm = document.getElementById('taskForm');

    // أحداث الأزرار - مع العلم أنها جديدة
    freshAddTaskBtn.addEventListener('click', handleAddTask, { once: false });

    freshCancelBtn.addEventListener('click', () => {
        taskModal.classList.remove('active');
    });

    // عند إرسال النموذج
    freshTaskForm.addEventListener('submit', handleSubmitTask);

    // تصدير البيانات
    exportBtn.addEventListener('click', handleExport);
    
    // استيراد البيانات
    importBtn.addEventListener('click', () => {
        importFile.click();
    });

    importFile.addEventListener('change', handleImport);

    // إغلاق النافذة عند النقر خارجها
    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) {
            taskModal.classList.remove('active');
        }
    });
}

// ===== دوال المعالجة المنفصلة =====

function handleAddTask() {
    console.log('✅ حدث إضافة مهمة (مرة واحدة)');
    editingTaskId = null;
    document.getElementById('modalTitle').textContent = 'مهمة جديدة';
    document.getElementById('taskForm').reset();
    document.getElementById('taskModal').classList.add('active');
}

function handleSubmitTask(e) {
    e.preventDefault();
    console.log('✅ إرسال النموذج (مرة واحدة)');

    const task = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        importance: document.getElementById('taskImportance').value,
        urgency: document.getElementById('taskUrgency').value,
        quadrant: getQuadrant(
            document.getElementById('taskImportance').value,
            document.getElementById('taskUrgency').value
        )
    };

    console.log('📝 المهمة المضافة:', task);

    if (editingTaskId) {
        taskDB.updateTask(editingTaskId, task);
        console.log('✏️ تم تحديث المهمة:', editingTaskId);
    } else {
        const taskId = taskDB.addTask(task);
        console.log('➕ تمت إضافة مهمة جديدة، ID:', taskId);
    }

    document.getElementById('taskModal').classList.remove('active');
    renderAllTasks();
}

function handleExport() {
    console.log('📤 تصدير البيانات...');
    const data = taskDB.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eisenhower-tasks-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('تم تصدير البيانات بنجاح!');
}

function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const success = taskDB.importData(event.target.result);
        if (success) {
            renderAllTasks();
            alert('تم استيراد البيانات بنجاح!');
        } else {
            alert('خطأ في استيراد البيانات. تأكد من صحة الملف.');
        }
        e.target.value = '';
    };
    reader.readAsText(file);
}

// ===== الدوال المساعدة =====

function getQuadrant(importance, urgency) {
    if (importance === 'important' && urgency === 'urgent') {
        return 'urgent-important';
    } else if (importance === 'important' && urgency === 'not-urgent') {
        return 'important-not-urgent';
    } else if (importance === 'not-important' && urgency === 'urgent') {
        return 'urgent-not-important';
    } else {
        return 'not-important-not-urgent';
    }
}

function renderAllTasks() {
    console.log('🔄 عرض المهام...');
    const quadrants = [
        'urgent-important',
        'important-not-urgent',
        'urgent-not-important',
        'not-important-not-urgent'
    ];

    quadrants.forEach(quadrant => {
        const container = document.querySelector(`.tasks[data-quadrant="${quadrant}"]`);
        if (!container) return;
        
        container.innerHTML = '';
        
        const tasks = taskDB.getTasksByQuadrant(quadrant);
        
        if (tasks.length === 0) {
            container.innerHTML = '<p class="empty-message">لا توجد مهام هنا</p>';
            return;
        }

        tasks.forEach(task => {
            const taskElement = createTaskElement(task);
            container.appendChild(taskElement);
        });
    });
}

function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = `task-item ${task.quadrant}`;
    div.dataset.id = task.id;

    const title = document.createElement('div');
    title.className = 'task-title';
    title.textContent = task.title;

    const description = document.createElement('div');
    description.className = 'task-description';
    description.textContent = task.description || 'لا يوجد وصف';

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.textContent = 'تعديل';
    editBtn.onclick = (e) => {
        e.stopPropagation();
        editTask(task.id);
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'حذف';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
            taskDB.deleteTask(task.id);
            renderAllTasks();
        }
    };

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    div.appendChild(title);
    div.appendChild(description);
    div.appendChild(actions);

    return div;
}

function editTask(id) {
    const task = taskDB.getTaskById(id);
    if (!task) return;

    editingTaskId = id;
    
    document.getElementById('modalTitle').textContent = 'تعديل المهمة';
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('taskImportance').value = task.importance;
    document.getElementById('taskUrgency').value = task.urgency;
    
    document.getElementById('taskModal').classList.add('active');
}

// ===== Service Worker =====

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        console.log('🔧 تسجيل Service Worker...');
        
        // أولا، قم بإلغاء التسجيل القديم
        navigator.serviceWorker.getRegistrations().then(registrations => {
            for (let registration of registrations) {
                registration.unregister();
                console.log('🗑️ إلغاء تسجيل Service Worker:', registration.scope);
            }
            
            // بعد إزالة القديم، سجل الجديد
            const swUrl = '/eisenhower-matrix-pwa/sw.js';
            
            navigator.serviceWorker.register(swUrl, { scope: '/eisenhower-matrix-pwa/' })
                .then(registration => {
                    console.log('✅ ServiceWorker مسجل بنجاح:', registration.scope);
                    
                    // إرسال رسالة لإعادة التحميل إذا لزم الأمر
                    if (registration.waiting) {
                        registration.waiting.postMessage({ action: 'skipWaiting' });
                    }
                })
                .catch(error => {
                    console.error('❌ خطأ في تسجيل Service Worker:', error);
                });
        });
    }
}

// ===== التهيئة الرئيسية =====

// استخدم كائن window للتحقق من التحميل
window.appState = {
    initialized: false,
    tasksCount: 0
};

// تهيئة واحدة فقط عند تحميل DOM
document.addEventListener('DOMContentLoaded', function mainInitialization() {
    console.log('📄 DOM جاهز، بدء التهيئة...');
    
    // إزالة هذا المستمع لمنع التهيئة المزدوجة
    document.removeEventListener('DOMContentLoaded', mainInitialization);
    
    // تهيئة التطبيق
    initApp();
    
    // تسجيل Service Worker بعد تأخير بسيط
    setTimeout(() => {
        registerServiceWorker();
    }, 1000);
    
    // تسجيل عدد المهام الحالي
    window.appState.tasksCount = taskDB.getAllTasks().length;
    console.log(`📊 عدد المهام الحالي: ${window.appState.tasksCount}`);
});

// أيضًا نستمع لحدث load لضمان التحميل الكامل
window.addEventListener('load', () => {
    console.log('🎯 الصفحة محملة بالكامل');
});
