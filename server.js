const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Раздаем статические файлы из текущей папки

// Файл для данных
const DATA_FILE = 'data.json';

// Начальные данные
const defaultData = {
  messages: [
    {
      id: 1,
      sender_id: 1001,
      receiver_id: 999,
      text: "Здравствуйте! У меня вопрос по домашнему заданию...",
      timestamp: new Date().toISOString(),
      read: false
    },
    {
      id: 2,
      sender_id: 999,
      receiver_id: 1001,
      text: "Конечно! Какой именно вопрос?",
      timestamp: new Date().toISOString(),
      read: true
    }
  ],
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
  schedule: [
    {
      id: 1,
      tutor_id: 999,
      student_id: 1001,
      start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      topic: "Алгебра: квадратные уравнения",
      created_at: new Date().toISOString()
    }
  ],
  progress: {
    "1001": { progress: 85, comment: "Отличные успехи!", updated_at: new Date().toISOString() },
    "1002": { progress: 70, comment: "Хорошо, но можно лучше", updated_at: new Date().toISOString() }
  }
};

// Загрузка данных
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {
    console.log('Файл данных не найден, создаем новый');
  }

  // Сохраняем начальные данные
  fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
  return defaultData;
}

// Сохранение данных
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  return true;
}

let appData = loadData();

// API Routes

// Получить сообщения
app.get('/api/messages/:userId/:otherUserId', (req, res) => {
  const { userId, otherUserId } = req.params;

  const messages = appData.messages.filter(msg =>
    (msg.sender_id == userId && msg.receiver_id == otherUserId) ||
    (msg.sender_id == otherUserId && msg.receiver_id == userId)
  ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  res.json(messages);
});

// Отправить сообщение
app.post('/api/messages', (req, res) => {
  const { sender_id, receiver_id, text } = req.body;

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

// Получить задания для ученика
app.get('/api/homework/student/:studentId', (req, res) => {
  const { studentId } = req.params;
  const homework = appData.homework.filter(hw =>
    hw.student_id == studentId || hw.student_id === null
  );
  res.json(homework);
});

// Добавить задание
app.post('/api/homework', (req, res) => {
  const { tutor_id, student_id, title, description, deadline } = req.body;

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

// Отметить задание выполненным
app.post('/api/homework/:id/complete', (req, res) => {
  const { id } = req.params;
  const { student_id } = req.body;

  const homework = appData.homework.find(hw => hw.id == id);
  if (homework) {
    homework.completed = true;
    homework.completed_at = new Date().toISOString();
    saveData(appData);
    res.json({ success: true, homework });
  } else {
    res.status(404).json({ error: 'Задание не найдено' });
  }
});

// Получить прогресс
app.get('/api/progress/:studentId', (req, res) => {
  const { studentId } = req.params;
  const progress = appData.progress[studentId] || { progress: 0, comment: 'Не оценен' };
  res.json(progress);
});

// Обновить прогресс
app.post('/api/progress', (req, res) => {
  const { student_id, progress, comment } = req.body;

  appData.progress[student_id] = {
    progress: parseInt(progress),
    comment: comment || '',
    updated_at: new Date().toISOString()
  };

  saveData(appData);
  res.json({ success: true, progress: appData.progress[student_id] });
});

// Получить расписание
app.get('/api/schedule/student/:studentId', (req, res) => {
  const { studentId } = req.params;
  const schedule = appData.schedule
    .filter(item => item.student_id == studentId)
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  res.json(schedule);
});

// Добавить в расписание
app.post('/api/schedule', (req, res) => {
  const { tutor_id, student_id, start_time, duration, topic } = req.body;

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

// Получить всех учеников
app.get('/api/students', (req, res) => {
  const students = [
    { chat_id: 1001, first_name: 'Анна', username: 'student_anna' },
    { chat_id: 1002, first_name: 'Михаил', username: 'student_mikhail' },
    { chat_id: 1003, first_name: 'Екатерина', username: 'student_ekaterina' },
    { chat_id: 1004, first_name: 'Дмитрий', username: 'student_dmitry' },
    { chat_id: 1005, first_name: 'София', username: 'student_sofia' }
  ];

  const studentsWithProgress = students.map(student => ({
    ...student,
    progress: appData.progress[student.chat_id] || { progress: 0, comment: 'Не оценен' }
  }));

  res.json(studentsWithProgress);
});

// Статический файл
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log(`📊 API доступен по http://localhost:${PORT}/api`);
});