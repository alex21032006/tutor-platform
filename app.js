// Глобальные переменные
let tg = null;
let userData = null;
let currentUser = null;
let currentChatWith = null;

// API endpoints - ВАЖНО: для продакшена нужен HTTPS URL!
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://твой-домен.herokuapp.com'; // Замени на твой продакшен URL

// Предустановленные пользователи
const PREDEFINED_USERS = {
    "Анна": { id: 1001, username: "student_anna", first_name: "Анна", role: "student" },
    "Михаил": { id: 1002, username: "student_mikhail", first_name: "Михаил", role: "student" },
    "Екатерина": { id: 1003, username: "student_ekaterina", first_name: "Екатерина", role: "student" },
    "Дмитрий": { id: 1004, username: "student_dmitry", first_name: "Дмитрий", role: "student" },
    "София": { id: 1005, username: "student_sofia", first_name: "София", role: "student" },
    "Репетитор": { id: 999, username: "tutor_main", first_name: "Репетитор", role: "tutor" }
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        // Проверяем, запущено ли в Telegram
        if (window.Telegram && window.Telegram.WebApp) {
            tg = window.Telegram.WebApp;

            // Инициализируем Telegram Web App
            tg.ready();
            tg.expand();

            // Устанавливаем цветовую схему
            tg.setHeaderColor('#667eea');
            tg.setBackgroundColor('#f8f9fa');

            // Получаем данные пользователя из Telegram
            const telegramUser = tg.initDataUnsafe?.user;

            if (telegramUser) {
                // Пользователь из Telegram
                await handleTelegramUser(telegramUser);
            } else {
                // Демо-режим - показываем выбор пользователя
                showLoginScreen();
            }

            console.log('✅ Telegram Web App инициализирован', telegramUser);

        } else {
            // Не в Telegram - демо-режим
            console.log('📱 Не в Telegram, демо-режим');
            showLoginScreen();
        }

    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showLoginScreen();
    }
}

// Обработка пользователя из Telegram
async function handleTelegramUser(telegramUser) {
    try {
        // Ищем пользователя в наших данных по username или создаем нового
        let user = Object.values(PREDEFINED_USERS).find(u =>
            u.username === telegramUser.username
        );

        if (!user) {
            // Создаем нового пользователя на основе данных Telegram
            user = {
                id: telegramUser.id,
                username: telegramUser.username,
                first_name: telegramUser.first_name,
                last_name: telegramUser.last_name,
                role: 'student' // По умолчанию студент
            };

            // Можно сохранить нового пользователя на сервере
            await saveTelegramUser(user);
        }

        // Автоматический вход
        currentUser = user;
        userData = currentUser;

        // Скрываем экран входа
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('appContainer').style.display = 'block';

        // Инициализируем интерфейс
        initializeUI();
        await loadInitialData();

        showNotification(`Добро пожаловать, ${user.first_name}!`);

    } catch (error) {
        console.error('Ошибка обработки пользователя Telegram:', error);
        showLoginScreen();
    }
}

async function saveTelegramUser(user) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/telegram-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(user)
        });
        return response.ok;
    } catch (error) {
        console.error('Ошибка сохранения пользователя:', error);
        return false;
    }
}

// Остальной код app.js остается без изменений...
// (showLoginScreen, loginAs, logout, и все остальные функции)

        // Показываем экран входа
        showLoginScreen();

    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showLoginScreen();
    }
}

function showLoginScreen() {
    const loginScreen = document.getElementById('loginScreen');
    const appContainer = document.getElementById('appContainer');
    const usersList = document.getElementById('usersList');

    loginScreen.classList.add('active');
    appContainer.style.display = 'none';

    // Заполняем список пользователей
    usersList.innerHTML = Object.keys(PREDEFINED_USERS).map(userName => {
        const user = PREDEFINED_USERS[userName];
        const roleText = user.role === 'tutor' ? '👨‍🏫 Репетитор' : '👨‍🎓 Ученик';

        return `
            <div class="user-card" onclick="loginAs('${userName}')">
                <div class="user-avatar">${user.role === 'tutor' ? '👨‍🏫' : '👨‍🎓'}</div>
                <div class="user-details">
                    <div class="user-name">${userName}</div>
                    <div class="user-role">${roleText}</div>
                </div>
                <div class="login-arrow">→</div>
            </div>
        `;
    }).join('');
}

async function loginAs(userName) {
    const user = PREDEFINED_USERS[userName];
    if (!user) {
        showNotification('Пользователь не найден');
        return;
    }

    currentUser = user;
    userData = currentUser;

    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('appContainer').style.display = 'block';

    initializeUI();
    await loadInitialData();

    showNotification(`Добро пожаловать, ${userName}!`);
}

function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        currentUser = null;
        userData = null;
        currentChatWith = null;
        showLoginScreen();
        showNotification('Вы вышли из системы');
    }
}

function initializeUI() {
    document.getElementById('userName').textContent = userData.first_name;
    document.getElementById('welcomeName').textContent = userData.first_name;

    setupNavigation();
    setupEventListeners();
    setupRoleBasedUI();
}

function setupRoleBasedUI() {
    const actionsGrid = document.getElementById('actionsGrid');

    if (userData.role === 'tutor') {
        actionsGrid.innerHTML = `
            <button class="action-btn" onclick="openTab('progress')">
                <span class="action-icon">📊</span>
                <span>Оценить прогресс</span>
            </button>
            <button class="action-btn" onclick="showAddHomeworkModal()">
                <span class="action-icon">📝</span>
                <span>Добавить ДЗ</span>
            </button>
            <button class="action-btn" onclick="showAddScheduleModal()">
                <span class="action-icon">🕐</span>
                <span>Добавить занятие</span>
            </button>
            <button class="action-btn" onclick="openTab('chat')">
                <span class="action-icon">💬</span>
                <span>Чат с учениками</span>
            </button>
        `;
    } else {
        actionsGrid.innerHTML = `
            <button class="action-btn" onclick="openTab('chat')">
                <span class="action-icon">💬</span>
                <span>Чат с репетитором</span>
            </button>
            <button class="action-btn" onclick="openTab('homework')">
                <span class="action-icon">📝</span>
                <span>Мои задания</span>
            </button>
            <button class="action-btn" onclick="openTab('schedule')">
                <span class="action-icon">🕐</span>
                <span>Расписание</span>
            </button>
            <button class="action-btn" onclick="changePhoto()">
                <span class="action-icon">🖼️</span>
                <span>Сменить фото</span>
            </button>
        `;
    }
}

function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');

    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            navButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const tabName = this.getAttribute('data-tab');
            openTab(tabName);
        });
    });
}

function setupEventListeners() {
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
}

function openTab(tabName) {
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));

    const activeTab = document.getElementById(tabName);
    if (activeTab) {
        activeTab.classList.add('active');
        loadTabData(tabName);
    }
}

async function loadTabData(tabName) {
    switch (tabName) {
        case 'dashboard':
            await loadDashboardData();
            break;
        case 'progress':
            await loadProgressData();
            break;
        case 'homework':
            await loadHomeworkData();
            break;
        case 'schedule':
            await loadScheduleData();
            break;
        case 'chat':
            await loadChatData();
            break;
    }
}

async function loadInitialData() {
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
        await loadTabData(activeTab.id);
    }
}

// 📊 ДАШБОРД
async function loadDashboardData() {
    updateDashboardStats();
}

function updateDashboardStats() {
    const progress = userData.progress ? userData.progress.value : 0;
    document.getElementById('currentProgress').textContent = `${progress}%`;

    const homeworkCount = userData.role === 'tutor' ? 5 : 3;
    document.getElementById('homeworkCount').textContent = homeworkCount;

    const nextLesson = userData.role === 'tutor' ? 'Сегодня 15:00' : 'Завтра 14:00';
    document.getElementById('nextLesson').textContent = nextLesson;
}

// 📈 ПРОГРЕСС
async function loadProgressData() {
    if (userData.role === 'tutor') {
        await loadTutorProgress();
    } else {
        await loadStudentProgress();
    }
}

async function loadStudentProgress() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/progress/${userData.id}`);
        if (response.ok) {
            const progress = await response.json();
            updateProgressUI(progress);
        } else {
            updateProgressUI({ progress: 0, comment: 'Прогресс не оценен' });
        }
    } catch (error) {
        console.error('Ошибка загрузки прогресса:', error);
        updateProgressUI({ progress: 0, comment: 'Ошибка загрузки прогресса' });
    }
}

function updateProgressUI(progress) {
    updateProgressCircle(progress.progress);

    document.getElementById('progressValue').textContent = `${progress.progress} из 100 баллов`;
    document.getElementById('progressComment').textContent = progress.comment;
    document.getElementById('progressPercent').textContent = progress.progress;
}

function updateProgressCircle(progress) {
    const circle = document.getElementById('progressCircle');
    const circumference = 339.292;
    const offset = circumference - (progress / 100) * circumference;
    if (circle) {
        circle.style.strokeDashoffset = offset;
    }
}

async function loadTutorProgress() {
    const progressContainer = document.querySelector('.progress-container');
    if (!progressContainer) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/students`);
        if (response.ok) {
            const students = await response.json();
            displayStudentsProgress(students);
        } else {
            progressContainer.innerHTML = '<p class="no-data">Ошибка загрузки данных учеников</p>';
        }
    } catch (error) {
        console.error('Ошибка загрузки учеников:', error);
        progressContainer.innerHTML = '<p class="no-data">Ошибка загрузки данных</p>';
    }
}

function displayStudentsProgress(students) {
    const progressContainer = document.querySelector('.progress-container');

    progressContainer.innerHTML = `
        <div class="students-progress">
            <h3>Прогресс учеников</h3>
            <div class="students-list">
                ${students.map(student => {
                    const progress = student.progress || { progress: 0, comment: 'Не оценен' };
                    return `
                        <div class="student-progress-item">
                            <div class="student-info">
                                <span class="student-name">${student.first_name}</span>
                                <span class="student-progress">${progress.progress}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progress.progress}%"></div>
                            </div>
                            <div class="student-comment">${progress.comment}</div>
                            <button class="btn-small" onclick="showUpdateProgressModal(${student.chat_id}, '${student.first_name}')">
                                Оценить
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function showUpdateProgressModal(studentId, studentName) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>📊 Оценка прогресса</h3>
            <p>Ученик: <strong>${studentName}</strong></p>

            <div class="form-group">
                <label>Прогресс (0-100%):</label>
                <input type="number" id="progressInput" min="0" max="100" value="0" class="form-input">
            </div>

            <div class="form-group">
                <label>Комментарий:</label>
                <textarea id="progressComment" class="form-textarea" placeholder="Введите комментарий..."></textarea>
            </div>

            <div class="modal-actions">
                <button class="btn-secondary" onclick="this.closest('.modal').remove()">Отмена</button>
                <button class="btn-primary" onclick="updateStudentProgress(${studentId})">Сохранить</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

async function updateStudentProgress(studentId) {
    const progressInput = document.getElementById('progressInput');
    const commentInput = document.getElementById('progressComment');

    const progress = parseInt(progressInput.value);
    const comment = commentInput.value;

    if (progress < 0 || progress > 100) {
        showNotification('Прогресс должен быть от 0 до 100%');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/progress`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                student_id: studentId,
                progress: progress,
                comment: comment
            })
        });

        if (response.ok) {
            showNotification(`Прогресс ученика обновлен до ${progress}%`);
            document.querySelector('.modal').remove();
            loadProgressData();
        } else {
            showNotification('Ошибка сохранения прогресса');
        }
    } catch (error) {
        console.error('Ошибка обновления прогресса:', error);
        showNotification('Ошибка сохранения прогресса');
    }
}

// 📚 ДОМАШНИЕ ЗАДАНИЯ
async function loadHomeworkData() {
    if (userData.role === 'tutor') {
        await loadTutorHomework();
    } else {
        await loadStudentHomework();
    }
}

async function loadStudentHomework() {
    const homeworkList = document.getElementById('homeworkList');
    if (!homeworkList) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/homework/student/${userData.id}`);
        if (response.ok) {
            const homework = await response.json();
            displayStudentHomework(homework);
        } else {
            homeworkList.innerHTML = '<div class="no-data">Ошибка загрузки заданий</div>';
        }
    } catch (error) {
        console.error('Ошибка загрузки заданий:', error);
        homeworkList.innerHTML = '<div class="no-data">Ошибка загрузки заданий</div>';
    }
}

function displayStudentHomework(homework) {
    const homeworkList = document.getElementById('homeworkList');

    if (homework.length === 0) {
        homeworkList.innerHTML = '<div class="no-data">Нет активных заданий</div>';
        return;
    }

    homeworkList.innerHTML = homework.map(item => `
        <div class="homework-item ${item.completed ? 'completed' : ''}">
            <div class="homework-title">${item.title}</div>
            <div class="homework-description">${item.description}</div>
            <div class="homework-meta">
                <span>📅 ${formatDate(new Date(item.deadline))}</span>
                <span>${item.completed ? '✅ Выполнено' : '⏳ В процессе'}</span>
            </div>
            ${!item.completed ? `
                <button class="btn-small" onclick="markHomeworkCompleted(${item.id})">
                    Отметить выполненным
                </button>
            ` : ''}
        </div>
    `).join('');
}

async function loadTutorHomework() {
    const homeworkList = document.getElementById('homeworkList');
    if (!homeworkList) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/homework/tutor/${userData.id}`);
        if (response.ok) {
            const homeworkData = await response.json();
            displayTutorHomework(homeworkData);
        } else {
            homeworkList.innerHTML = '<div class="no-data">Ошибка загрузки заданий</div>';
        }
    } catch (error) {
        console.error('Ошибка загрузки заданий:', error);
        homeworkList.innerHTML = '<div class="no-data">Ошибка загрузки заданий</div>';
    }
}

function displayTutorHomework(homeworkData) {
    const homeworkList = document.getElementById('homeworkList');

    homeworkList.innerHTML = `
        <div class="tutor-homework-actions">
            <button class="btn-primary" onclick="showAddHomeworkModal()">
                📝 Добавить новое задание
            </button>

            <div class="homework-stats">
                <h4>Статистика заданий</h4>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${homeworkData.total || 0}</div>
                        <div class="stat-label">Всего заданий</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${homeworkData.completed || 0}</div>
                        <div class="stat-label">Выполнено</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${homeworkData.pending || 0}</div>
                        <div class="stat-label">В процессе</div>
                    </div>
                </div>
            </div>

            <div class="recent-homework">
                <h4>Последние задания</h4>
                ${homeworkData.recent && homeworkData.recent.length > 0 ?
                    homeworkData.recent.map(item => `
                        <div class="homework-item">
                            <div class="homework-title">${item.title}</div>
                            <div class="homework-meta">
                                <span>📅 Срок: ${formatDate(new Date(item.deadline))}</span>
                                <span>👥 ${item.student_id ? 'Индивидуальное' : 'Для всех'}</span>
                            </div>
                        </div>
                    `).join('') :
                    '<div class="no-data">Нет заданий</div>'
                }
            </div>
        </div>
    `;
}

function showAddHomeworkModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>📝 Добавить задание</h3>

            <div class="form-group">
                <label>Название задания:</label>
                <input type="text" id="homeworkTitle" class="form-input" placeholder="Введите название задания">
            </div>

            <div class="form-group">
                <label>Описание:</label>
                <textarea id="homeworkDescription" class="form-textarea" placeholder="Введите описание задания..."></textarea>
            </div>

            <div class="form-group">
                <label>Для кого:</label>
                <select id="homeworkStudent" class="form-select">
                    <option value="all">Все ученики</option>
                    <option value="1001">Анна</option>
                    <option value="1002">Михаил</option>
                    <option value="1003">Екатерина</option>
                    <option value="1004">Дмитрий</option>
                    <option value="1005">София</option>
                </select>
            </div>

            <div class="form-group">
                <label>Срок выполнения:</label>
                <input type="date" id="homeworkDeadline" class="form-input">
            </div>

            <div class="modal-actions">
                <button class="btn-secondary" onclick="this.closest('.modal').remove()">Отмена</button>
                <button class="btn-primary" onclick="addNewHomework()">Добавить</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const deadlineInput = document.getElementById('homeworkDeadline');
    const today = new Date().toISOString().split('T')[0];
    deadlineInput.min = today;
    deadlineInput.value = today;

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

async function addNewHomework() {
    const title = document.getElementById('homeworkTitle').value;
    const description = document.getElementById('homeworkDescription').value;
    const student = document.getElementById('homeworkStudent').value;
    const deadline = document.getElementById('homeworkDeadline').value;

    if (!title) {
        showNotification('Введите название задания');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/homework`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tutor_id: userData.id,
                student_id: student === 'all' ? null : parseInt(student),
                title: title,
                description: description,
                deadline: deadline
            })
        });

        if (response.ok) {
            showNotification('Новое задание добавлено!');
            document.querySelector('.modal').remove();
            loadHomeworkData();
        } else {
            showNotification('Ошибка добавления задания');
        }
    } catch (error) {
        console.error('Ошибка добавления задания:', error);
        showNotification('Ошибка добавления задания');
    }
}

async function markHomeworkCompleted(homeworkId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/homework/${homeworkId}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                student_id: userData.id
            })
        });

        if (response.ok) {
            showNotification('Задание отмечено выполненным!');
            loadHomeworkData();
        } else {
            showNotification('Ошибка отметки задания');
        }
    } catch (error) {
        console.error('Ошибка отметки задания:', error);
        showNotification('Ошибка отметки задания');
    }
}

// 💬 ЧАТ
async function loadChatData() {
    if (userData.role === 'tutor') {
        await loadTutorChat();
    } else {
        await loadStudentChat();
    }
}

async function loadStudentChat() {
    // Ученик всегда общается с репетитором
    currentChatWith = 999;

    const chatHeader = document.querySelector('.chat-header h2');
    if (chatHeader) {
        chatHeader.textContent = '💬 Чат с репетитором';
    }

    await loadMessages();

    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.focus();
    }
}

async function loadTutorChat() {
    const chatHeader = document.querySelector('.chat-header h2');
    const messagesContainer = document.getElementById('messagesContainer');
    const chatInputContainer = document.querySelector('.chat-input-container');

    if (chatHeader) {
        chatHeader.textContent = '💬 Чат с учениками';
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/students`);
        if (response.ok) {
            const students = await response.json();
            displayStudentsChatList(students);
        } else {
            messagesContainer.innerHTML = '<div class="no-data">Ошибка загрузки списка учеников</div>';
        }
    } catch (error) {
        console.error('Ошибка загрузки учеников:', error);
        messagesContainer.innerHTML = '<div class="no-data">Ошибка загрузки списка учеников</div>';
    }

    if (chatInputContainer) {
        chatInputContainer.style.display = 'none';
    }
}

function displayStudentsChatList(students) {
    const messagesContainer = document.getElementById('messagesContainer');

    messagesContainer.innerHTML = `
        <div class="students-chat-list">
            <h3>Выберите ученика для общения</h3>
            <div class="students-grid">
                ${students.map(student => {
                    return `
                        <div class="student-chat-item" onclick="selectStudentForChat(${student.chat_id}, '${student.first_name}')">
                            <div class="student-avatar">👤</div>
                            <div class="student-info">
                                <div class="student-name">${student.first_name}</div>
                                <div class="last-message">${student.last_message || 'Нет сообщений'}</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function selectStudentForChat(studentId, studentName) {
    currentChatWith = studentId;

    const chatHeader = document.querySelector('.chat-header h2');
    const chatInputContainer = document.querySelector('.chat-input-container');

    if (chatHeader) {
        chatHeader.textContent = `💬 Чат с ${studentName}`;
    }

    if (chatInputContainer) {
        chatInputContainer.style.display = 'flex';
    }

    loadMessages();

    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.focus();
    }
}

async function loadMessages() {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer || !currentChatWith) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/messages/${userData.id}/${currentChatWith}`);
        if (response.ok) {
            const messages = await response.json();
            displayMessages(messages);
        } else {
            messagesContainer.innerHTML = '<div class="no-data">Ошибка загрузки сообщений</div>';
        }
    } catch (error) {
        console.error('Ошибка загрузки сообщений:', error);
        messagesContainer.innerHTML = '<div class="no-data">Ошибка загрузки сообщений</div>';
    }
}

function displayMessages(messages) {
    const messagesContainer = document.getElementById('messagesContainer');

    if (messages.length === 0) {
        messagesContainer.innerHTML = '<div class="no-data">Нет сообщений. Начните общение!</div>';
        return;
    }

    messagesContainer.innerHTML = messages.map(message => {
        const messageDate = new Date(message.timestamp);
        const isOwn = message.sender_id === userData.id;

        return `
            <div class="message ${isOwn ? 'sent' : 'received'}">
                <div class="message-text">${message.text}</div>
                <div class="message-time">${formatTime(messageDate)}</div>
            </div>
        `;
    }).join('');

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const messageText = messageInput.value.trim();

    if (!messageText || !currentChatWith) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sender_id: userData.id,
                receiver_id: currentChatWith,
                text: messageText
            })
        });

        if (response.ok) {
            messageInput.value = '';
            await loadMessages();
        } else {
            showNotification('Ошибка отправки сообщения');
        }
    } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        showNotification('Ошибка отправки сообщения');
    }
}

// 📅 РАСПИСАНИЕ
async function loadScheduleData() {
    if (userData.role === 'tutor') {
        await loadTutorSchedule();
    } else {
        await loadStudentSchedule();
    }
}

async function loadStudentSchedule() {
    const scheduleList = document.getElementById('scheduleList');

    try {
        const response = await fetch(`${API_BASE_URL}/api/schedule/student/${userData.id}`);
        if (response.ok) {
            const schedule = await response.json();
            displayStudentSchedule(schedule);
        } else {
            scheduleList.innerHTML = '<div class="no-data">Нет запланированных занятий</div>';
        }
    } catch (error) {
        console.error('Ошибка загрузки расписания:', error);
        scheduleList.innerHTML = '<div class="no-data">Ошибка загрузки расписания</div>';
    }
}

function displayStudentSchedule(schedule) {
    const scheduleList = document.getElementById('scheduleList');

    if (schedule.length === 0) {
        scheduleList.innerHTML = '<div class="no-data">Нет запланированных занятий</div>';
        return;
    }

    scheduleList.innerHTML = schedule.map(item => {
        const itemDate = new Date(item.start_time);
        const duration = Math.round((new Date(item.end_time) - itemDate) / 60000);

        return `
            <div class="schedule-item">
                <div class="schedule-date">
                    <span class="day">${formatDate(itemDate)}</span>
                    <span class="time">${formatTime(itemDate)}</span>
                </div>
                <div class="schedule-topic">${item.topic}</div>
                <div class="schedule-meta">
                    <span>⏱ ${duration} мин</span>
                </div>
            </div>
        `;
    }).join('');
}

async function loadTutorSchedule() {
    const scheduleContainer = document.querySelector('.schedule-container');
    if (!scheduleContainer) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/schedule/tutor/${userData.id}`);
        if (response.ok) {
            const schedule = await response.json();
            displayTutorSchedule(schedule);
        } else {
            scheduleContainer.innerHTML = '<div class="no-data">Ошибка загрузки расписания</div>';
        }
    } catch (error) {
        console.error('Ошибка загрузки расписания:', error);
        scheduleContainer.innerHTML = '<div class="no-data">Ошибка загрузки расписания</div>';
    }
}

function displayTutorSchedule(schedule) {
    const scheduleContainer = document.querySelector('.schedule-container');

    scheduleContainer.innerHTML = `
        <div class="tutor-schedule">
            <div class="schedule-actions">
                <button class="btn-primary" onclick="showAddScheduleModal()">
                    📅 Добавить занятие
                </button>
            </div>

            <div class="schedule-overview">
                <h4>Ближайшие занятия</h4>
                ${schedule.length > 0 ?
                    schedule.map(item => {
                        const itemDate = new Date(item.start_time);
                        const duration = Math.round((new Date(item.end_time) - itemDate) / 60000);

                        return `
                            <div class="schedule-item">
                                <div class="schedule-date">
                                    <span class="day">${formatDate(itemDate)}</span>
                                    <span class="time">${formatTime(itemDate)}</span>
                                </div>
                                <div class="schedule-topic">${item.topic}</div>
                                <div class="schedule-meta">
                                    <span>⏱ ${duration} мин</span>
                                </div>
                            </div>
                        `;
                    }).join('') :
                    '<div class="no-data">Нет запланированных занятий</div>'
                }
            </div>
        </div>
    `;
}

function showAddScheduleModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>📅 Добавить занятие</h3>

            <div class="form-group">
                <label>Ученик:</label>
                <select id="scheduleStudent" class="form-select">
                    <option value="1001">Анна</option>
                    <option value="1002">Михаил</option>
                    <option value="1003">Екатерина</option>
                    <option value="1004">Дмитрий</option>
                    <option value="1005">София</option>
                </select>
            </div>

            <div class="form-group">
                <label>Дата и время:</label>
                <input type="datetime-local" id="scheduleDateTime" class="form-input">
            </div>

            <div class="form-group">
                <label>Продолжительность (минуты):</label>
                <input type="number" id="scheduleDuration" class="form-input" value="60" min="30" max="180">
            </div>

            <div class="form-group">
                <label>Тема занятия:</label>
                <input type="text" id="scheduleTopic" class="form-input" placeholder="Введите тему занятия">
            </div>

            <div class="modal-actions">
                <button class="btn-secondary" onclick="this.closest('.modal').remove()">Отмена</button>
                <button class="btn-primary" onclick="addNewSchedule()">Добавить</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const datetimeInput = document.getElementById('scheduleDateTime');
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    datetimeInput.min = now.toISOString().slice(0, 16);

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

async function addNewSchedule() {
    const student = document.getElementById('scheduleStudent').value;
    const datetime = document.getElementById('scheduleDateTime').value;
    const duration = document.getElementById('scheduleDuration').value;
    const topic = document.getElementById('scheduleTopic').value;

    if (!student || !datetime || !duration || !topic) {
        showNotification('Заполните все поля');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/schedule`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tutor_id: userData.id,
                student_id: parseInt(student),
                start_time: datetime,
                duration: parseInt(duration),
                topic: topic
            })
        });

        if (response.ok) {
            showNotification('Новое занятие добавлено в расписание!');
            document.querySelector('.modal').remove();
            loadScheduleData();
        } else {
            showNotification('Ошибка добавления занятия');
        }
    } catch (error) {
        console.error('Ошибка добавления занятия:', error);
        showNotification('Ошибка добавления занятия');
    }
}

// 📋 ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
function showNotification(message) {
    // Простое уведомление
    alert(message);
}

function formatDate(date) {
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatTime(date) {
    return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function changePhoto() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>🖼️ Смена фото профиля</h3>
            <p>Для смены фото отправьте его боту в Telegram</p>
            <button onclick="this.closest('.modal').remove()" class="btn-primary">Понятно</button>
        </div>
    `;
    document.body.appendChild(modal);
}