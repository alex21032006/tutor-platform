// Глобальные переменные
let tg = null;
let userData = null;
let currentUser = null;
let currentChatWith = null;

// Предустановленные пользователи
const PREDEFINED_USERS = {
    "Анна": { id: 1001, username: "student_anna", first_name: "Анна", role: "student" },
    "Михаил": { id: 1002, username: "student_mikhail", first_name: "Михаил", role: "student" },
    "Екатерина": { id: 1003, username: "student_ekaterina", first_name: "Екатерина", role: "student" },
    "Дмитрий": { id: 1004, username: "student_dmitry", first_name: "Дмитрий", role: "student" },
    "София": { id: 1005, username: "student_sofia", first_name: "София", role: "student" },
    "Репетитор": { id: 999, username: "tutor_main", first_name: "Репетитор", role: "tutor" }
};

const CURRENT_YEAR = new Date().getFullYear();

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        // Пытаемся инициализировать Telegram Web App
        if (window.Telegram && window.Telegram.WebApp) {
            tg = window.Telegram.WebApp;
            tg.expand();
            tg.enableClosingConfirmation();

            // Устанавливаем цветовую схему
            tg.setHeaderColor('#667eea');
            tg.setBackgroundColor('#f8f9fa');

            console.log('Telegram Web App инициализирован');
        } else {
            console.log('Telegram Web App не обнаружен, работаем в демо-режиме');
        }

        // Показываем экран входа
        showLoginScreen();

    } catch (error) {
        console.error('Ошибка инициализации:', error);
        // Все равно показываем экран входа
        showLoginScreen();
    }
}

function showLoginScreen() {
    const loginScreen = document.getElementById('loginScreen');
    const appContainer = document.getElementById('appContainer');
    const usersList = document.getElementById('usersList');

    // Показываем экран входа, скрываем основное приложение
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

    // Устанавливаем текущего пользователя
    currentUser = user;
    userData = currentUser;

    // Скрываем экран входа, показываем основное приложение
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('appContainer').style.display = 'block';

    // Инициализируем интерфейс
    initializeUI();

    // Загружаем начальные данные
    await loadInitialData();

    showNotification(`Добро пожаловать, ${userName}!`);
}

function logout() {
    // Показываем подтверждение выхода
    if (confirm('Вы уверены, что хотите выйти?')) {
        currentUser = null;
        userData = null;
        currentChatWith = null;
        showLoginScreen();
        showNotification('Вы вышли из системы');
    }
}

function initializeUI() {
    // Устанавливаем имя пользователя
    document.getElementById('userName').textContent = userData.first_name;
    document.getElementById('welcomeName').textContent = userData.first_name;

    // Настраиваем обработчики навигации
    setupNavigation();

    // Настраиваем обработчики событий
    setupEventListeners();

    // Настраиваем интерфейс в зависимости от роли
    setupRoleBasedUI();
}

function setupRoleBasedUI() {
    const actionsGrid = document.getElementById('actionsGrid');

    if (userData.role === 'tutor') {
        // Кнопки для репетитора
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
        // Кнопки для ученика
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
            // Убираем активный класс у всех кнопок
            navButtons.forEach(btn => btn.classList.remove('active'));
            // Добавляем активный класс текущей кнопке
            this.classList.add('active');

            // Показываем соответствующий раздел
            const tabName = this.getAttribute('data-tab');
            openTab(tabName);
        });
    });
}

function setupEventListeners() {
    // Отправка сообщения по Enter
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
    // Скрываем все разделы
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));

    // Показываем выбранный раздел
    const activeTab = document.getElementById(tabName);
    if (activeTab) {
        activeTab.classList.add('active');

        // Загружаем данные для раздела при открытии
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
    // Загружаем данные для активного раздела
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
        await loadTabData(activeTab.id);
    }
}

// 📊 ДАШБОРД
async function loadDashboardData() {
    // Обновляем статистику
    updateDashboardStats();
}

function updateDashboardStats() {
    // Прогресс
    const progress = userData.progress ? userData.progress.value : 0;
    document.getElementById('currentProgress').textContent = `${progress}%`;

    // Количество заданий
    const homeworkCount = userData.role === 'tutor' ? 5 : 3;
    document.getElementById('homeworkCount').textContent = homeworkCount;

    // Ближайшее занятие
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
    const progress = userData.progress || { value: 0, comment: 'Прогресс не оценен' };

    // Обновляем круг прогресса
    updateProgressCircle(progress.value);

    // Обновляем информацию
    document.getElementById('progressValue').textContent = `${progress.value} из 100 баллов`;
    document.getElementById('progressComment').textContent = progress.comment;
    document.getElementById('progressPercent').textContent = progress.value;

    // Показываем историю прогресса
    await loadProgressHistory();
}

function updateProgressCircle(progress) {
    const circle = document.getElementById('progressCircle');
    const circumference = 339.292;
    const offset = circumference - (progress / 100) * circumference;
    if (circle) {
        circle.style.strokeDashoffset = offset;
    }
}

async function loadProgressHistory() {
    const historyContainer = document.getElementById('progressHistory');
    if (!historyContainer) return;

    // Mock история прогресса с актуальными датами
    const history = [
        { date: '15.01.' + CURRENT_YEAR, value: 85, comment: 'Отличные успехи!' },
        { date: '08.01.' + CURRENT_YEAR, value: 78, comment: 'Хороший прогресс' },
        { date: '25.12.' + (CURRENT_YEAR-1), value: 70, comment: 'Стабильные результаты' }
    ];

    if (history.length === 0) {
        historyContainer.innerHTML = '<p class="no-data">История прогресса отсутствует</p>';
        return;
    }

    historyContainer.innerHTML = history.map(item => `
        <div class="history-item">
            <div class="history-date">${item.date}</div>
            <div class="history-value">${item.value} баллов</div>
            <div class="history-comment">${item.comment}</div>
        </div>
    `).join('');
}

async function loadTutorProgress() {
    const progressContainer = document.querySelector('.progress-container');
    if (!progressContainer) return;

    // Список учеников для репетитора
    const students = [
        { id: 1001, name: 'Анна', progress: 85, comment: 'Отличные успехи' },
        { id: 1002, name: 'Михаил', progress: 70, comment: 'Хорошо, но можно лучше' },
        { id: 1003, name: 'Екатерина', progress: 90, comment: 'Превосходно!' },
        { id: 1004, name: 'Дмитрий', progress: 65, comment: 'Нужно больше практики' },
        { id: 1005, name: 'София', progress: 0, comment: 'Не оценен' }
    ];

    progressContainer.innerHTML = `
        <div class="students-progress">
            <h3>Прогресс учеников</h3>
            <div class="students-list">
                ${students.map(student => `
                    <div class="student-progress-item">
                        <div class="student-info">
                            <span class="student-name">${student.name}</span>
                            <span class="student-progress">${student.progress}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${student.progress}%"></div>
                        </div>
                        <div class="student-comment">${student.comment}</div>
                        <button class="btn-small" onclick="showUpdateProgressModal(${student.id}, '${student.name}')">
                            Оценить
                        </button>
                    </div>
                `).join('')}
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

    // Закрытие по клику вне модального окна
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function updateStudentProgress(studentId) {
    const progressInput = document.getElementById('progressInput');
    const commentInput = document.getElementById('progressComment');

    const progress = parseInt(progressInput.value);
    const comment = commentInput.value;

    if (progress < 0 || progress > 100) {
        showNotification('Прогресс должен быть от 0 до 100%');
        return;
    }

    // Здесь должен быть запрос к API для сохранения прогресса
    showNotification(`Прогресс ученика #${studentId} обновлен до ${progress}%`);

    // Закрываем модальное окно
    document.querySelector('.modal').remove();

    // Перезагружаем данные прогресса
    loadProgressData();
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

    // Mock задания для ученика с актуальными датами
    const homework = [
        {
            id: 1,
            title: 'Повторение тем 1-3',
            description: 'Решите задачи из учебника страницы 45-48',
            deadline: '18.01.' + CURRENT_YEAR,
            completed: false
        },
        {
            id: 2,
            title: 'Индивидуальное задание',
            description: 'Особые упражнения для углубленного изучения',
            deadline: '20.01.' + CURRENT_YEAR,
            completed: true
        },
        {
            id: 3,
            title: 'Подготовка к тесту',
            description: 'Повторите все пройденные темы',
            deadline: '22.01.' + CURRENT_YEAR,
            completed: false
        }
    ];

    if (homework.length === 0) {
        homeworkList.innerHTML = '<div class="no-data">Нет активных заданий</div>';
        return;
    }

    homeworkList.innerHTML = homework.map(item => `
        <div class="homework-item ${item.completed ? 'completed' : ''}">
            <div class="homework-title">${item.title}</div>
            <div class="homework-description">${item.description}</div>
            <div class="homework-meta">
                <span>📅 ${item.deadline}</span>
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

    homeworkList.innerHTML = `
        <div class="tutor-homework-actions">
            <button class="btn-primary" onclick="showAddHomeworkModal()">
                📝 Добавить новое задание
            </button>

            <div class="homework-stats">
                <h4>Статистика заданий</h4>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">5</div>
                        <div class="stat-label">Всего заданий</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">3</div>
                        <div class="stat-label">Выполнено</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">2</div>
                        <div class="stat-label">В процессе</div>
                    </div>
                </div>
            </div>

            <div class="recent-homework">
                <h4>Последние задания</h4>
                <div class="homework-item">
                    <div class="homework-title">Повторение тем 1-3</div>
                    <div class="homework-meta">
                        <span>📅 Срок: 18.01.${CURRENT_YEAR}</span>
                        <span>👥 Для всех</span>
                    </div>
                    <div class="completion-stats">
                        ✅ 3/5 учеников выполнили
                    </div>
                </div>

                <div class="homework-item">
                    <div class="homework-title">Индивидуальное задание</div>
                    <div class="homework-meta">
                        <span>📅 Срок: 20.01.${CURRENT_YEAR}</span>
                        <span>👤 Для Анны</span>
                    </div>
                    <div class="completion-stats">
                        ✅ Выполнено
                    </div>
                </div>
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

    // Устанавливаем минимальную дату - сегодня
    const deadlineInput = document.getElementById('homeworkDeadline');
    const today = new Date().toISOString().split('T')[0];
    deadlineInput.min = today;

    // Закрытие по клику вне модального окна
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function addNewHomework() {
    const title = document.getElementById('homeworkTitle').value;
    const description = document.getElementById('homeworkDescription').value;
    const student = document.getElementById('homeworkStudent').value;
    const deadline = document.getElementById('homeworkDeadline').value;

    if (!title || !description || !deadline) {
        showNotification('Заполните все поля');
        return;
    }

    // Здесь должен быть запрос к API для добавления задания
    showNotification('Новое задание добавлено!');

    // Закрываем модальное окно
    document.querySelector('.modal').remove();

    // Перезагружаем данные заданий
    loadHomeworkData();
}

function markHomeworkCompleted(homeworkId) {
    showNotification(`Задание #${homeworkId} отмечено выполненным!`);
    // В реальном приложении здесь был бы запрос к API
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
    const nextLessonCard = document.getElementById('nextLessonCard');
    const scheduleList = document.getElementById('scheduleList');

    // Mock расписание с актуальными датами
    const schedule = [
        {
            id: 1,
            date: CURRENT_YEAR + '-01-16T14:00:00',
            duration: 60,
            topic: 'Разбор домашнего задания',
            student: userData.first_name
        },
        {
            id: 2,
            date: CURRENT_YEAR + '-01-18T16:00:00',
            duration: 90,
            topic: 'Новая тема: Производные',
            student: userData.first_name
        },
        {
            id: 3,
            date: CURRENT_YEAR + '-01-20T15:00:00',
            duration: 60,
            topic: 'Подготовка к тесту',
            student: userData.first_name
        }
    ];

    // Ближайшее занятие
    const nextClass = schedule[0];
    if (nextClass && nextLessonCard) {
        const classDate = new Date(nextClass.date);
        nextLessonCard.innerHTML = `
            <div class="next-lesson">
                <h3>🎯 Ближайшее занятие</h3>
                <div class="lesson-time">
                    <span class="date">${formatDate(classDate)}</span>
                    <span class="time">${formatTime(classDate)}</span>
                </div>
                <div class="lesson-topic">${nextClass.topic}</div>
                <div class="lesson-duration">⏱ ${nextClass.duration} минут</div>
            </div>
        `;
    }

    // Список занятий
    if (scheduleList) {
        if (schedule.length === 0) {
            scheduleList.innerHTML = '<div class="no-data">Нет запланированных занятий</div>';
            return;
        }

        scheduleList.innerHTML = schedule.map(item => {
            const itemDate = new Date(item.date);
            return `
                <div class="schedule-item">
                    <div class="schedule-date">
                        <span class="day">${formatDate(itemDate)}</span>
                        <span class="time">${formatTime(itemDate)}</span>
                    </div>
                    <div class="schedule-topic">${item.topic}</div>
                    <div class="schedule-meta">
                        <span>⏱ ${item.duration} мин</span>
                    </div>
                </div>
            `;
        }).join('');
    }
}

async function loadTutorSchedule() {
    const scheduleContainer = document.querySelector('.schedule-container');
    if (!scheduleContainer) return;

    scheduleContainer.innerHTML = `
        <div class="tutor-schedule">
            <div class="schedule-actions">
                <button class="btn-primary" onclick="showAddScheduleModal()">
                    📅 Добавить занятие
                </button>
            </div>

            <div class="schedule-overview">
                <h4>Расписание на неделю</h4>

                <div class="schedule-item">
                    <div class="schedule-date">
                        <span class="day">Завтра</span>
                        <span class="time">14:00-15:00</span>
                    </div>
                    <div class="schedule-topic">Занятие с Анной</div>
                    <div class="schedule-meta">
                        <span>👤 Анна</span>
                        <span>📚 Разбор ДЗ</span>
                    </div>
                </div>

                <div class="schedule-item">
                    <div class="schedule-date">
                        <span class="day">Завтра</span>
                        <span class="time">16:00-17:30</span>
                    </div>
                    <div class="schedule-topic">Занятие с Михаилом</div>
                    <div class="schedule-meta">
                        <span>👤 Михаил</span>
                        <span>📚 Новая тема</span>
                    </div>
                </div>

                <div class="schedule-item">
                    <div class="schedule-date">
                        <span class="day">18.01</span>
                        <span class="time">15:00-16:00</span>
                    </div>
                    <div class="schedule-topic">Групповое занятие</div>
                    <div class="schedule-meta">
                        <span>👥 Все ученики</span>
                        <span>📚 Подготовка к тесту</span>
                    </div>
                </div>
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

    // Устанавливаем минимальную дату - сейчас
    const datetimeInput = document.getElementById('scheduleDateTime');
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    datetimeInput.min = now.toISOString().slice(0, 16);

    // Закрытие по клику вне модального окна
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function addNewSchedule() {
    const student = document.getElementById('scheduleStudent').value;
    const datetime = document.getElementById('scheduleDateTime').value;
    const duration = document.getElementById('scheduleDuration').value;
    const topic = document.getElementById('scheduleTopic').value;

    if (!student || !datetime || !duration || !topic) {
        showNotification('Заполните все поля');
        return;
    }

    // Здесь должен быть запрос к API для добавления занятия
    showNotification('Новое занятие добавлено в расписание!');

    // Закрываем модальное окно
    document.querySelector('.modal').remove();

    // Перезагружаем данные расписания
    loadScheduleData();
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

    // Автофокус на поле ввода
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

    // Для репетитора показываем список учеников
    messagesContainer.innerHTML = `
        <div class="students-chat-list">
            <h3>Выберите ученика для общения:</h3>
            <div class="chat-students">
                <div class="chat-student-item" onclick="selectStudent(1001, 'Анна')">
                    <div class="student-avatar">👩</div>
                    <div class="student-info">
                        <div class="student-name">Анна</div>
                        <div class="last-message">Последнее сообщение: сегодня</div>
                    </div>
                    <div class="unread-badge">3</div>
                </div>
                <div class="chat-student-item" onclick="selectStudent(1002, 'Михаил')">
                    <div class="student-avatar">👨</div>
                    <div class="student-info">
                        <div class="student-name">Михаил</div>
                        <div class="last-message">Нет сообщений</div>
                    </div>
                </div>
                <div class="chat-student-item" onclick="selectStudent(1003, 'Екатерина')">
                    <div class="student-avatar">👩</div>
                    <div class="student-info">
                        <div class="student-name">Екатерина</div>
                        <div class="last-message">Вопрос по заданию</div>
                    </div>
                    <div class="unread-badge">1</div>
                </div>
            </div>
        </div>
    `;

    // Скрываем поле ввода пока не выбран ученик
    if (chatInputContainer) {
        chatInputContainer.style.display = 'none';
    }
}

function selectStudent(studentId, studentName) {
    currentChatWith = studentId;

    const chatHeader = document.querySelector('.chat-header h2');
    const chatInputContainer = document.querySelector('.chat-input-container');

    if (chatHeader) {
        chatHeader.textContent = `💬 Чат с ${studentName}`;
    }

    // Показываем поле ввода
    if (chatInputContainer) {
        chatInputContainer.style.display = 'flex';
    }

    // Загружаем сообщения с выбранным учеником
    loadMessages();

    // Автофокус на поле ввода
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.focus();
    }
}

async function loadMessages() {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer || !currentChatWith) return;

    // Mock сообщения
    const messages = [
        {
            id: 1,
            sender_id: userData.role === 'student' ? 1001 : 999,
            receiver_id: userData.role === 'student' ? 999 : 1001,
            text: 'Здравствуйте! У меня вопрос по домашнему заданию...',
            created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
            id: 2,
            sender_id: userData.role === 'student' ? 999 : 1001,
            receiver_id: userData.role === 'student' ? 1001 : 999,
            text: 'Конечно! Какой именно вопрос?',
            created_at: new Date(Date.now() - 1800000).toISOString()
        },
        {
            id: 3,
            sender_id: userData.role === 'student' ? 1001 : 999,
            receiver_id: userData.role === 'student' ? 999 : 1001,
            text: 'Не понимаю задание №3. Можете объяснить?',
            created_at: new Date(Date.now() - 600000).toISOString()
        }
    ];

    if (messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="empty-chat">
                <div class="empty-icon">💬</div>
                <h3>Нет сообщений</h3>
                <p>Начните общение!</p>
            </div>
        `;
        return;
    }

    messagesContainer.innerHTML = messages.map(message => {
        const isSent = message.sender_id === userData.id;
        const time = new Date(message.created_at).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="message ${isSent ? 'sent' : 'received'}">
                <div class="message-text">${escapeHtml(message.text)}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
    }).join('');

    // Прокрутка вниз
    scrollToBottom();
}

function sendMessage() {
    if (!currentChatWith) {
        showNotification('Выберите ученика для общения');
        return;
    }

    const input = document.getElementById('messageInput');
    const text = input.value.trim();

    if (!text) return;

    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;

    // Создаем новое сообщение
    const newMessage = {
        id: Date.now(),
        sender_id: userData.id,
        receiver_id: currentChatWith,
        text: text,
        created_at: new Date().toISOString()
    };

    // Добавляем сообщение в чат
    const messageElement = document.createElement('div');
    messageElement.className = 'message sent';
    messageElement.innerHTML = `
        <div class="message-text">${escapeHtml(text)}</div>
        <div class="message-time">${new Date().toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        })}</div>
    `;

    messagesContainer.appendChild(messageElement);

    // Очищаем поле ввода
    input.value = '';

    // Прокрутка вниз
    scrollToBottom();

    // Показываем уведомление
    showNotification('Сообщение отправлено!');

    // В реальном приложении здесь был бы запрос к API для сохранения сообщения
    // saveMessageToServer(newMessage);
}

// 🛠️ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
function scrollToBottom() {
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

function showNotification(text) {
    if (tg && tg.showPopup) {
        tg.showPopup({
            title: 'Уведомление',
            message: text,
            buttons: [{ type: 'ok' }]
        });
    } else {
        alert(text);
    }
}

function showError(message) {
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
        appContainer.innerHTML = `
            <div class="error-screen">
                <div class="error-icon">⚠️</div>
                <h2>Ошибка</h2>
                <p>${message}</p>
                <button class="btn-primary" onclick="location.reload()">
                    Перезагрузить
                </button>
            </div>
        `;
    }
}

function changePhoto() {
    const modal = document.getElementById('photoModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeModal() {
    const modal = document.getElementById('photoModal');
    if (modal) {
        modal.style.display = 'none';
    }
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Закрытие модального окна при клике вне его
window.addEventListener('click', function(event) {
    const modal = document.getElementById('photoModal');
    if (event.target === modal) {
        closeModal();
    }
});