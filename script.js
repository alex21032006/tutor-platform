// Telegram Web App
let tg = null;
let currentUser = null;

// Данные приложения
const APP_DATA = {
    homework: [
        {
            id: 1,
            tutor_id: 999,
            student_id: null,
            title: "Математика: дроби",
            description: "Решить задачи на сложение и вычитание дробей из учебника стр. 45-48",
            max_score: 10,
            created_at: new Date().toISOString()
        },
        {
            id: 2,
            tutor_id: 999,
            student_id: 1001
            title: "Индивидуальное задание",
            description: "Особые упражнения по алгебре для углубленного изучения",
            max_score: 15,
            created_at: new Date().toISOString()
        }
    ],
    ratings: {
        "1001": {
            "1": { score: 8, comment: "Хорошо, но есть ошибки", graded_at: new Date().toISOString() },
            "2": { score: 12, comment: "Отлично!", graded_at: new Date().toISOString() }
        },
        "1002": {
            "1": { score: 9, comment: "Почти идеально", graded_at: new Date().toISOString() }
        }
    },
    submissions: {}
};

// Предопределенные пользователи
const PREDEFINED_USERS = {
    "student_anna": { id: 1001, username: "student_anna", first_name: "Анна", role: "student" },
    "student_mikhail": { id: 1002, username: "student_mikhail", first_name: "Михаил", role: "student" },
    "student_ekaterina": { id: 1003, username: "student_ekaterina", first_name: "Екатерина", role: "student" },
    "tutor_main": { id: 999, username: "tutor_main", first_name: "Иван Петрович", role: "tutor" }
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initializeTelegramApp();
});

function initializeTelegramApp() {
    // Проверяем, запущено ли в Telegram
    if (window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;

        // Инициализируем Telegram Web App
        tg.ready();
        tg.expand();

        // Настраиваем интерфейс
        tg.setHeaderColor('#40a7e3');
        tg.setBackgroundColor('#ffffff');

        // Получаем данные пользователя из Telegram
        const tgUser = tg.initDataUnsafe?.user;

        if (tgUser) {
            handleTelegramUser(tgUser);
        } else {
            // Демо-режим для тестирования
            setupDemoMode();
        }

        console.log('Telegram Web App инициализирован');
    } else {
        // Не в Telegram - демо-режим
        console.log('Не в Telegram, демо-режим');
        setupDemoMode();
    }
}

function handleTelegramUser(tgUser) {
    // Ищем пользователя в наших данных
    let user = PREDEFINED_USERS[tgUser.username];

    if (!user) {
        // Создаем нового пользователя на основе данных Telegram
        user = {
            id: tgUser.id,
            username: tgUser.username,
            first_name: tgUser.first_name,
            role: 'student' // По умолчанию студент
        };
    }

    currentUser = user;
    initializeAppInterface();
}

function setupDemoMode() {
    // Демо-режим - показываем выбор пользователя
    const demoUsers = [
        { id: 1001, username: "student_anna", first_name: "Анна", role: "student" },
        { id: 999, username: "tutor_main", first_name: "Иван Петрович", role: "tutor" }
    ];

    // Для демо используем первого пользователя
    currentUser = demoUsers[0];
    initializeAppInterface();
}

function initializeAppInterface() {
    // Обновляем интерфейс
    document.getElementById('userName').textContent = currentUser.first_name;
    document.getElementById('welcomeName').textContent = currentUser.first_name;

    // Настраиваем навигацию
    setupNavigation();

    // Настраиваем интерфейс в зависимости от роли
    setupRoleBasedUI();

    // Загружаем начальные данные
    loadMainData();
}

function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');

    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Убираем активный класс у всех кнопок
            navButtons.forEach(btn => btn.classList.remove('active'));

            // Добавляем активный класс текущей кнопке
            this.classList.add('active');

            // Показываем соответствующую вкладку
            const tabName = this.getAttribute('data-tab');
            showTab(tabName);
        });
    });
}

function setupRoleBasedUI() {
    const addHomeworkBtn = document.getElementById('addHomeworkBtn');
    const actionsGrid = document.getElementById('actionsGrid');

    if (currentUser.role === 'tutor') {
        addHomeworkBtn.style.display = 'block';
        actionsGrid.innerHTML = `
            <button class="action-btn" onclick="showHomeworkModal()">
                <span class="action-icon">➕</span>
                <span>Новое задание</span>
            </button>
            <button class="action-btn" onclick="showTab('rating')">
                <span class="action-icon">⭐</span>
                <span>Рейтинг</span>
            </button>
            <button class="action-btn" onclick="checkHomework()">
                <span class="action-icon">📝</span>
                <span>Проверить ДЗ</span>
            </button>
            <button class="action-btn" onclick="generateReport()">
                <span class="action-icon">📊</span>
                <span>Отчет</span>
            </button>
        `;
    } else {
        addHomeworkBtn.style.display = 'none';
        actionsGrid.innerHTML = `
            <button class="action-btn" onclick="showTab('homework')">
                <span class="action-icon">📚</span>
                <span>Мои задания</span>
            </button>
            <button class="action-btn" onclick="showTab('rating')">
                <span class="action-icon">⭐</span>
                <span>Мой рейтинг</span>
            </button>
            <button class="action-btn" onclick="submitHomeworkDemo()">
                <span class="action-icon">📤</span>
                <span>Сдать работу</span>
            </button>
            <button class="action-btn" onclick="showAchievements()">
                <span class="action-icon">🏆</span>
                <span>Достижения</span>
            </button>
        `;
    }
}

function showTab(tabName) {
    // Скрываем все вкладки
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Показываем выбранную вкладку
    const activeTab = document.getElementById(tabName);
    if (activeTab) {
        activeTab.classList.add('active');
        loadTabData(tabName);
    }
}

function loadTabData(tabName) {
    switch (tabName) {
        case 'main':
            loadMainData();
            break;
        case 'homework':
            loadHomeworkData();
            break;
        case 'rating':
            loadRatingData();
            break;
    }
}

function loadMainData() {
    if (currentUser.role === 'tutor') {
        loadTutorMain();
    } else {
        loadStudentMain();
    }
}

function loadTutorMain() {
    const homework = APP_DATA.homework.filter(hw => hw.tutor_id === currentUser.id);
    const ratings = APP_DATA.ratings;

    // Рассчитываем статистику
    let totalScore = 0;
    let ratingCount = 0;

    Object.values(ratings).forEach(studentRatings => {
        Object.values(studentRatings).forEach(rating => {
            totalScore += rating.score;
            ratingCount++;
        });
    });

    const avgScore = ratingCount > 0 ? (totalScore / ratingCount).toFixed(1) : '0';
    const activeHW = homework.length;
    const completedHW = ratingCount;

    // Обновляем интерфейс
    document.getElementById('avgScore').textContent = avgScore;
    document.getElementById('activeHW').textContent = activeHW;
    document.getElementById('completedHW').textContent = completedHW;
}

function loadStudentMain() {
    const homework = APP_DATA.homework.filter(hw =>
        hw.student_id === currentUser.id || hw.student_id === null
    );
    const ratings = APP_DATA.ratings[currentUser.id] || {};

    // Рассчитываем статистику
    const ratedHomework = Object.values(ratings);
    const avgScore = ratedHomework.length > 0
        ? (ratedHomework.reduce((acc, r) => acc + r.score, 0) / ratedHomework.length).toFixed(1)
        : '0';

    const activeHW = homework.length;
    const completedHW = Object.keys(ratings).length;

    // Обновляем интерфейс
    document.getElementById('avgScore').textContent = avgScore;
    document.getElementById('activeHW').textContent = activeHW;
    document.getElementById('completedHW').textContent = completedHW;
}

function loadHomeworkData() {
    const homeworkList = document.getElementById('homeworkList');

    if (currentUser.role === 'tutor') {
        loadTutorHomework();
    } else {
        loadStudentHomework();
    }
}

function loadTutorHomework() {
    const homeworkList = document.getElementById('homeworkList');
    const homework = APP_DATA.homework.filter(hw => hw.tutor_id === currentUser.id);

    if (homework.length === 0) {
        homeworkList.innerHTML = '<div class="no-data">Нет созданных заданий</div>';
        return;
    }

    homeworkList.innerHTML = homework.map(hw => {
        const studentCount = Object.keys(APP_DATA.ratings).filter(studentId =>
            APP_DATA.ratings[studentId][hw.id]
        ).length;

        return `
            <div class="homework-item">
                <div class="homework-header">
                    <div class="homework-title">${hw.title}</div>
                    <div class="homework-score">${hw.max_score} баллов</div>
                </div>
                <div class="homework-meta">
                    <span>👥 ${hw.student_id ? 'Индивидуальное' : 'Для всех'}</span>
                    <span>📊 ${studentCount} оценок</span>
                </div>
                <div class="homework-description">${hw.description}</div>
                <div class="homework-actions">
                    <button class="btn-primary btn-small" onclick="gradeHomework(${hw.id})">
                        📝 Оценить
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function loadStudentHomework() {
    const homeworkList = document.getElementById('homeworkList');
    const homework = APP_DATA.homework.filter(hw =>
        hw.student_id === currentUser.id || hw.student_id === null
    );
    const ratings = APP_DATA.ratings[currentUser.id] || {};

    if (homework.length === 0) {
        homeworkList.innerHTML = '<div class="no-data">Нет активных заданий</div>';
        return;
    }

    homeworkList.innerHTML = homework.map(hw => {
        const rating = ratings[hw.id];
        const isGraded = !!rating;

        return `
            <div class="homework-item">
                <div class="homework-header">
                    <div class="homework-title">${hw.title}</div>
                    <div class="homework-score">
                        ${isGraded ? `✅ ${rating.score}/${hw.max_score}` : `📝 ${hw.max_score} баллов`}
                    </div>
                </div>
                <div class="homework-meta">
                    <span>📅 ${new Date(hw.created_at).toLocaleDateString('ru-RU')}</span>
                    <span>${isGraded ? '⭐ Оценено' : '⏳ Ожидает проверки'}</span>
                </div>
                <div class="homework-description">${hw.description}</div>
                ${isGraded && rating.comment ? `
                    <div class="homework-comment">
                        <strong>Комментарий:</strong> ${rating.comment}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function loadRatingData() {
    const ratingContainer = document.getElementById('ratingContainer');

    if (currentUser.role === 'tutor') {
        loadTutorRating();
    } else {
        loadStudentRating();
    }
}

function loadTutorRating() {
    const ratingContainer = document.getElementById('ratingContainer');
    const students = Object.values(PREDEFINED_USERS).filter(u => u.role === 'student');

    const studentStats = students.map(student => {
        const ratings = APP_DATA.ratings[student.id] || {};
        const ratedHomework = Object.values(ratings);
        const avgScore = ratedHomework.length > 0
            ? (ratedHomework.reduce((acc, r) => acc + r.score, 0) / ratedHomework.length).toFixed(1)
            : '0';

        return {
            ...student,
            avgScore,
            completedCount: ratedHomework.length
        };
    }).sort((a, b) => b.avgScore - a.avgScore);

    ratingContainer.innerHTML = `
        <div class="rating-table">
            <div class="rating-header">
                <div>#</div>
                <div>Ученик</div>
                <div>Средний</div>
                <div>ДЗ</div>
            </div>
            ${studentStats.map((student, index) => `
                <div class="rating-row">
                    <div class="rank">${index + 1}</div>
                    <div class="student-name">
                        <div class="student-avatar">${student.first_name[0]}</div>
                        ${student.first_name}
                    </div>
                    <div class="avg-score">${student.avgScore}</div>
                    <div class="completed-count">${student.completedCount}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function loadStudentRating() {
    const ratingContainer = document.getElementById('ratingContainer');
    const ratings = APP_DATA.ratings[currentUser.id] || {};
    const homework = APP_DATA.homework;

    const ratedHomework = Object.entries(ratings).map(([hwId, rating]) => {
        const hw = homework.find(h => h.id == hwId);
        return {
            homework: hw,
            rating: rating
        };
    }).sort((a, b) => b.rating.score - a.rating.score);

    if (ratedHomework.length === 0) {
        ratingContainer.innerHTML = '<div class="no-data">Пока нет оценок</div>';
        return;
    }

    ratingContainer.innerHTML = `
        <div class="rating-table">
            <div class="rating-header">
                <div>#</div>
                <div>Задание</div>
                <div>Оценка</div>
                <div>Макс.</div>
            </div>
            ${ratedHomework.map((item, index) => `
                <div class="rating-row">
                    <div class="rank">${index + 1}</div>
                    <div>${item.homework.title}</div>
                    <div class="avg-score">${item.rating.score}</div>
                    <div class="completed-count">${item.homework.max_score}</div>
                </div>
            `).join('')}
        </div>
    `;
}

// Модальные окна
function showHomeworkModal() {
    document.getElementById('homeworkModal').style.display = 'flex';
}

function showGradeModal(studentId, homeworkId) {
    const student = PREDEFINED_USERS[Object.keys(PREDEFINED_USERS).find(name =>
        PREDEFINED_USERS[name].id == studentId
    )];
    const homework = APP_DATA.homework.find(h => h.id == homeworkId);

    document.getElementById('studentName').textContent = student.first_name;
    document.getElementById('hwName').textContent = homework.title;

    document.getElementById('gradeModal').style.display = 'flex';
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

function addHomework() {
    const title = document.getElementById('hwTitle').value;
    const description = document.getElementById('hwDesc').value;
    const maxScore = document.getElementById('hwMaxScore').value;

    if (!title) {
        showAlert('Введите название задания');
        return;
    }

    const newHomework = {
        id: Date.now(),
        tutor_id: currentUser.id,
        student_id: null,
        title: title,
        description: description,
        max_score: parseInt(maxScore),
        created_at: new Date().toISOString()
    };

    APP_DATA.homework.push(newHomework);
    closeModal();
    loadHomeworkData();
    showAlert('Задание создано!');
}

function gradeHomework(homeworkId) {
    // Для демо берем первого ученика
    const students = Object.values(PREDEFINED_USERS).filter(u => u.role === 'student');
    if (students.length > 0) {
        showGradeModal(students[0].id, homeworkId);
    }
}

function submitGrade() {
    const score = document.getElementById('hwScore').value;
    const comment = document.getElementById('hwComment').value;

    if (!score) {
        showAlert('Введите оценку');
        return;
    }

    // Для демо используем первого ученика
    const students = Object.values(PREDEFINED_USERS).filter(u => u.role === 'student');
    if (students.length > 0) {
        const studentId = students[0].id;

        if (!APP_DATA.ratings[studentId]) {
            APP_DATA.ratings[studentId] = {};
        }

        APP_DATA.ratings[studentId][selectedHomeworkId] = {
            score: parseInt(score),
            comment: comment,
            graded_at: new Date().toISOString()
        };
    }

    closeModal();
    loadHomeworkData();
    showAlert('Оценка выставлена!');
}

// Вспомогательные функции
function showAlert(message) {
    if (tg && tg.showAlert) {
        tg.showAlert(message);
    } else {
        alert(message);
    }
}

function checkHomework() {
    showAlert('Функция проверки домашних заданий');
}

function generateReport() {
    showAlert('Отчет сгенерирован и отправлен');
}

function submitHomeworkDemo() {
    showAlert('Работа отправлена на проверку!');
}

function showAchievements() {
    const ratings = APP_DATA.ratings[currentUser.id] || {};
    const completed = Object.keys(ratings).length;

    let achievements = "Ваши достижения:\n\n";

    if (completed >= 1) achievements += "🏅 Первое задание!\n";
    if (completed >= 3) achievements += "🏅 Активный ученик!\n";
    if (Object.values(ratings).some(r => r.score >= 9)) achievements += "🏅 Отличник!\n";

    showAlert(achievements || "Пока нет достижений. Продолжайте в том же духе!");
}

// Закрытие модальных окон при клике вне их
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        closeModal();
    }
});

let selectedHomeworkId = null;

// Инициализация при загрузке
function loadMainData() {
    if (currentUser.role === 'tutor') {
        loadTutorMain();
    } else {
        loadStudentMain();
    }
}