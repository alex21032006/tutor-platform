const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILE = 'data.json';

app.use(cors());
app.use(express.json());

// Инициализация данных
function initializeData() {
    const defaultData = {
        progress: {
            "1001": { progress: 85, comment: "Отличные успехи!", updated_at: new Date().toISOString() },
            "1002": { progress: 70, comment: "Хорошо, но можно лучше", updated_at: new Date().toISOString() },
            "1003": { progress: 90, comment: "Превосходно!", updated_at: new Date().toISOString() }
        },
        homework: [
            {
                id: 1,
                tutor_id: 999,
                student_id: null,
                title: "Повторение тем 1-3",
                description: "Решите задачи из учебника страницы 45-48",
                deadline: "2024-01-20",
                completed: false,
                created_at: new Date().toISOString()
            }
        ],
        schedule: [],
        messages: []
    };

    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
        console.log('✅ Created data file');
    }
    return defaultData;
}

function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
    return initializeData();
}

function saveData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        return false;
    }
}

let appData = loadData();

// API Routes
app.get('/api/students', (req, res) => {
    console.log('📋 GET /api/students');
    const students = [
        { chat_id: 1001, first_name: 'Анна', username: 'student_anna' },
        { chat_id: 1002, first_name: 'Михаил', username: 'student_mikhail' },
        { chat_id: 1003, first_name: 'Екатерина', username: 'student_ekaterina' },
        { chat_id: 1004, first_name: 'Дмитрий', username: 'student_dmitry' },
        { chat_id: 1005, first_name: 'София', username: 'student_sofia' }
    ];

    const studentsWithProgress = students.map(student => ({
        ...student,
        progress: appData.progress[student.chat_id] || { progress: 0, comment: 'Не оценен' },
        last_message: getLastMessageForStudent(student.chat_id),
        unread_messages: getUnreadMessageCount(student.chat_id)
    }));

    res.json(studentsWithProgress);
});

app.get('/api/progress/:studentId', (req, res) => {
    const { studentId } = req.params;
    console.log('📊 GET /api/progress/', studentId);
    const progress = appData.progress[studentId] || { progress: 0, comment: 'Прогресс не оценен' };
    res.json(progress);
});

app.post('/api/progress', (req, res) => {
    const { student_id, progress, comment } = req.body;
    console.log('🔄 POST /api/progress', { student_id, progress, comment });

    appData.progress[student_id] = {
        progress: parseInt(progress),
        comment: comment || '',
        updated_at: new Date().toISOString()
    };
    saveData(appData);
    res.json({ success: true, progress: appData.progress[student_id] });
});

app.get('/api/homework/student/:studentId', (req, res) => {
    const { studentId } = req.params;
    console.log('📚 GET /api/homework/student/', studentId);
    const studentHomework = appData.homework.filter(hw =>
        hw.student_id === parseInt(studentId) || hw.student_id === null
    );
    res.json(studentHomework);
});

app.get('/api/homework/tutor/:tutorId', (req, res) => {
    const { tutorId } = req.params;
    console.log('📚 GET /api/homework/tutor/', tutorId);
    const tutorHomework = appData.homework.filter(hw => hw.tutor_id === parseInt(tutorId));
    const stats = {
        total: tutorHomework.length,
        completed: tutorHomework.filter(hw => hw.completed).length,
        pending: tutorHomework.filter(hw => !hw.completed).length,
        recent: tutorHomework.slice(-5).reverse()
    };
    res.json(stats);
});

app.post('/api/homework', (req, res) => {
    const { tutor_id, student_id, title, description, deadline } = req.body;
    console.log('➕ POST /api/homework', { tutor_id, student_id, title });

    const newHomework = {
        id: Date.now(),
        tutor_id: parseInt(tutor_id),
        student_id: student_id ? parseInt(student_id) : null,
        title,
        description: description || '',
        deadline: deadline || new Date().toISOString().split('T')[0],
        completed: false,
        created_at: new Date().toISOString()
    };
    appData.homework.push(newHomework);
    saveData(appData);
    res.json({ success: true, homework: newHomework });
});

app.post('/api/homework/:homeworkId/complete', (req, res) => {
    const { homeworkId } = req.params;
    const { student_id } = req.body;
    console.log('✅ POST /api/homework/complete/', homeworkId);

    const homework = appData.homework.find(hw => hw.id === parseInt(homeworkId));
    if (homework) {
        homework.completed = true;
        homework.completed_at = new Date().toISOString();
        saveData(appData);
        res.json({ success: true, homework });
    } else {
        res.status(404).json({ error: 'Задание не найдено' });
    }
});

app.get('/api/schedule/student/:studentId', (req, res) => {
    const { studentId } = req.params;
    console.log('📅 GET /api/schedule/student/', studentId);
    const studentSchedule = appData.schedule
        .filter(item => item.student_id === parseInt(studentId))
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    res.json(studentSchedule);
});

app.get('/api/schedule/tutor/:tutorId', (req, res) => {
    const { tutorId } = req.params;
    console.log('📅 GET /api/schedule/tutor/', tutorId);
    const tutorSchedule = appData.schedule
        .filter(item => item.tutor_id === parseInt(tutorId))
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    res.json(tutorSchedule);
});

app.post('/api/schedule', (req, res) => {
    const { tutor_id, student_id, start_time, duration, topic } = req.body;
    console.log('➕ POST /api/schedule', { tutor_id, student_id, topic });

    const startTime = new Date(start_time);
    const endTime = new Date(startTime.getTime() + (duration || 60) * 60000);
    const newSchedule = {
        id: Date.now(),
        tutor_id: parseInt(tutor_id),
        student_id: parseInt(student_id),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        topic: topic || 'Занятие',
        created_at: new Date().toISOString()
    };
    appData.schedule.push(newSchedule);
    saveData(appData);
    res.json({ success: true, schedule: newSchedule });
});

app.get('/api/messages/:userId/:otherUserId', (req, res) => {
    const { userId, otherUserId } = req.params;
    console.log('💬 GET /api/messages/', userId, otherUserId);

    const messages = appData.messages.filter(msg =>
        (msg.sender_id === parseInt(userId) && msg.receiver_id === parseInt(otherUserId)) ||
        (msg.sender_id === parseInt(otherUserId) && msg.receiver_id === parseInt(userId))
    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    res.json(messages);
});

app.post('/api/messages', (req, res) => {
    const { sender_id, receiver_id, text } = req.body;
    console.log('📨 POST /api/messages', { sender_id, receiver_id, text });

    const newMessage = {
        id: Date.now(),
        sender_id: parseInt(sender_id),
        receiver_id: parseInt(receiver_id),
        text: text.trim(),
        timestamp: new Date().toISOString(),
        read: false
    };
    appData.messages.push(newMessage);
    saveData(appData);
    res.json({ success: true, message: newMessage });
});

app.post('/api/messages/read', (req, res) => {
    const { user_id, other_user_id } = req.body;
    console.log('👀 POST /api/messages/read', { user_id, other_user_id });

    appData.messages.forEach(msg => {
        if (msg.receiver_id === parseInt(user_id) && msg.sender_id === parseInt(other_user_id)) {
            msg.read = true;
        }
    });
    saveData(appData);
    res.json({ success: true });
});

function getLastMessageForStudent(studentId) {
    const messages = appData.messages
        .filter(msg => msg.sender_id === studentId || msg.receiver_id === studentId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return messages.length > 0 ? messages[0].text : 'Нет сообщений';
}

function getUnreadMessageCount(studentId) {
    return appData.messages.filter(msg =>
        msg.receiver_id === studentId && !msg.read
    ).length;
}

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 API Server running on port ${PORT}`);
    console.log(`📁 Data file: ${DATA_FILE}`);
});