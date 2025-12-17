// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    registerServiceWorker();
});

function initApp() {
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

    // أحداث الأزرار
    addTaskBtn.addEventListener('click', () => {
        editingTaskId = null;
        document.getElementById('modalTitle').textContent = 'مهمة جديدة';
        taskForm.reset();
        taskModal.classList.add('active');
    });

    cancelBtn.addEventListener('click', () => {
        taskModal.classList.remove('active');
    });

    // عند إرسال النموذج
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();

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

        if (editingTaskId) {
            taskDB.updateTask(editingTaskId, task);
        } else {
            taskDB.addTask(task);
        }

        taskModal.classList.remove('active');
        renderAllTasks();
    });

    // تصدير البيانات
    exportBtn.addEventListener('click', () => {
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
    });

    // استيراد البيانات
    importBtn.addEventListener('click', () => {
        importFile.click();
    });

    importFile.addEventListener('change', (e) => {
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
            importFile.value = ''; // إعادة تعيين حقل الملف
        };
        reader.readAsText(file);
    });

    // إغلاق النافذة عند النقر خارجها
    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) {
            taskModal.classList.remove('active');
        }
    });
}

// تحديد الربع بناءً على الأهمية والإلحاح
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

// عرض جميع المهام
function renderAllTasks() {
    const quadrants = [
        'urgent-important',
        'important-not-urgent',
        'urgent-not-important',
        'not-important-not-urgent'
    ];

    quadrants.forEach(quadrant => {
        const container = document.querySelector(`.tasks[data-quadrant="${quadrant}"]`);
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

// إنشاء عنصر مهمة
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

// تعديل مهمة
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

// تسجيل Service Worker
// ... باقي الكود

// ... باقي الكود

// تسجيل Service Worker لـ GitHub Pages
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        const swUrl = '/eisenhower-matrix-pwa/sw.js';
        
        window.addEventListener('load', function() {
            navigator.serviceWorker.register(swUrl)
                .then(registration => {
                    console.log('ServiceWorker مسجل بنجاح مع النطاق:', registration.scope);
                    
                    // التحقق من التحديثات
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        console.log('ServiceWorker update found!');
                        
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed') {
                                if (navigator.serviceWorker.controller) {
                                    // هناك تحديث متاح
                                    console.log('New content is available; please refresh.');
                                    showUpdateNotification();
                                } else {
                                    // المحتوى مخزن للاستخدام دون اتصال
                                    console.log('Content is cached for offline use.');
                                }
                            }
                        });
                    });
                })
                .catch(error => {
                    console.error('Error during service worker registration:', error);
                });
        });
        
        // تحديث Service Worker كل ساعة
        setInterval(() => {
            navigator.serviceWorker.ready.then(registration => {
                registration.update();
            });
        }, 60 * 60 * 1000); // كل ساعة
    }
}

// عرض إشعار التحديث
function showUpdateNotification() {
    if (confirm('توجد نسخة جديدة من التطبيق. هل تريد تحديث الصفحة الآن؟')) {
        window.location.reload();
    }
}

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    registerServiceWorker();
    
    // التحقق من التثبيت
    checkInstallation();
});

// التحقق مما إذا تم تثبيت التطبيق
function checkInstallation() {
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('التطبيق مثبت كـ PWA');
        // يمكنك إضافة ميزات خاصة بالتطبيق المثبت هنا
    }
}

// باقي الكود كما هو...

// استدعاء التسجيل عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    registerServiceWorker();
});

