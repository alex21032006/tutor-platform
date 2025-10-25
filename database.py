import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from config import CURRENT_YEAR


class JSONDatabase:
    def __init__(self, file_path: str = 'data.json'):
        self.file_path = file_path
        self._init_db()

    def _init_db(self):
        if not os.path.exists(self.file_path):
            default_data = {
                "users": {},
                "progress": {},
                "messages": [],
                "homework": [],
                "schedule": [],
                "tutor_id": None
            }
            self._save_data(default_data)

    def _load_data(self) -> Dict:
        try:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            self._init_db()
            return self._load_data()

    def _save_data(self, data: Dict):
        with open(self.file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    # User methods
    def add_user(self, chat_id: int, username: str, role: str, first_name: str = ""):
        data = self._load_data()
        data["users"][str(chat_id)] = {
            "chat_id": chat_id,
            "username": username,
            "first_name": first_name,
            "role": role,
            "photo_id": None,
            "created_at": datetime.now().isoformat()
        }

        if role == "tutor":
            data["tutor_id"] = chat_id

        self._save_data(data)

    def get_user(self, chat_id: int) -> Optional[Dict]:
        data = self._load_data()
        return data["users"].get(str(chat_id))

    def get_all_students(self) -> List[Dict]:
        data = self._load_data()
        return [user for user in data["users"].values() if user["role"] == "student"]

    def update_user_photo(self, chat_id: int, photo_id: str):
        data = self._load_data()
        if str(chat_id) in data["users"]:
            data["users"][str(chat_id)]["photo_id"] = photo_id
            self._save_data(data)

    # Progress methods
    def update_progress(self, student_id: int, progress: int, comment: str = ""):
        data = self._load_data()
        data["progress"][str(student_id)] = {
            "student_id": student_id,
            "progress": progress,
            "comment": comment,
            "updated_at": datetime.now().isoformat()
        }
        self._save_data(data)

    def get_progress(self, student_id: int) -> Optional[Dict]:
        data = self._load_data()
        return data["progress"].get(str(student_id))

    # Message methods
    def add_message(self, sender_id: int, receiver_id: int, text: str, message_type: str = "text"):
        data = self._load_data()
        message = {
            "id": len(data["messages"]) + 1,
            "sender_id": sender_id,
            "receiver_id": receiver_id,
            "text": text,
            "type": message_type,
            "created_at": datetime.now().isoformat(),
            "read": False
        }
        data["messages"].append(message)
        self._save_data(data)
        return message

    def get_unread_messages(self, user_id: int) -> List[Dict]:
        data = self._load_data()
        return [msg for msg in data["messages"] if msg["receiver_id"] == user_id and not msg["read"]]

    def mark_messages_as_read(self, user_id: int):
        data = self._load_data()
        for msg in data["messages"]:
            if msg["receiver_id"] == user_id and not msg["read"]:
                msg["read"] = True
        self._save_data(data)

    def get_chat_messages(self, user1_id: int, user2_id: int, limit: int = 50) -> List[Dict]:
        data = self._load_data()
        messages = []
        for msg in reversed(data["messages"]):
            if ((msg["sender_id"] == user1_id and msg["receiver_id"] == user2_id) or
                    (msg["sender_id"] == user2_id and msg["receiver_id"] == user1_id)):
                messages.append(msg)
            if len(messages) >= limit:
                break
        return list(reversed(messages))

    # Homework methods
    def add_homework(self, tutor_id: int, student_id: Optional[int], title: str, description: str = ""):
        data = self._load_data()
        homework = {
            "id": len(data["homework"]) + 1,
            "tutor_id": tutor_id,
            "student_id": student_id,  # None = массовая рассылка
            "title": title,
            "description": description,
            "created_at": datetime.now().isoformat(),
            "completed": False
        }
        data["homework"].append(homework)
        self._save_data(data)
        return homework

    def get_student_homework(self, student_id: int) -> List[Dict]:
        data = self._load_data()
        homework = []
        for hw in data["homework"]:
            if hw["student_id"] is None or hw["student_id"] == student_id:
                homework.append(hw)
        return homework

    def get_tutor_homework(self, tutor_id: int) -> List[Dict]:
        data = self._load_data()
        return [hw for hw in data["homework"] if hw["tutor_id"] == tutor_id]

    # Schedule methods
    def add_schedule(self, student_id: int, tutor_id: int, start_time: str, duration: int = 60, topic: str = ""):
        data = self._load_data()
        start_dt = datetime.fromisoformat(start_time)
        end_dt = start_dt + timedelta(minutes=duration)

        schedule = {
            "id": len(data["schedule"]) + 1,
            "student_id": student_id,
            "tutor_id": tutor_id,
            "start_time": start_dt.isoformat(),
            "end_time": end_dt.isoformat(),
            "topic": topic,
            "status": "scheduled"
        }
        data["schedule"].append(schedule)
        self._save_data(data)
        return schedule

    def get_user_schedule(self, user_id: int, role: str) -> List[Dict]:
        data = self._load_data()
        now = datetime.now().isoformat()

        if role == "tutor":
            schedules = [s for s in data["schedule"] if s["tutor_id"] == user_id]
        else:
            schedules = [s for s in data["schedule"] if s["student_id"] == user_id]

        # Сортируем по дате и возвращаем только будущие занятия
        future_schedules = [s for s in schedules if s["start_time"] >= now]
        return sorted(future_schedules, key=lambda x: x["start_time"])


# Глобальный экземпляр базы данных
db = JSONDatabase()


def init_sample_data():
    """Инициализация тестовых данных с актуальными датами"""
    data = db._load_data()

    # Добавляем учеников если их нет
    sample_students = [
        {"chat_id": 1001, "username": "student_anna", "first_name": "Анна"},
        {"chat_id": 1002, "username": "student_mikhail", "first_name": "Михаил"},
        {"chat_id": 1003, "username": "student_ekaterina", "first_name": "Екатерина"},
        {"chat_id": 1004, "username": "student_dmitry", "first_name": "Дмитрий"},
        {"chat_id": 1005, "username": "student_sofia", "first_name": "София"}
    ]

    for student in sample_students:
        if str(student["chat_id"]) not in data["users"]:
            db.add_user(student["chat_id"], student["username"], "student", student["first_name"])

    # Убедимся, что есть репетитор
    if not data["tutor_id"]:
        # Создаем репетитора если нет
        tutor_chat_id = 999  # ID для репетитора
        if str(tutor_chat_id) not in data["users"]:
            db.add_user(tutor_chat_id, "tutor_main", "tutor", "Репетитор")

    # Добавляем тестовое расписание если пустое (с актуальными датами)
    if not data["schedule"]:
        from datetime import datetime, timedelta

        # Занятия на ближайшие дни
        today = datetime.now()
        dates = [
            today + timedelta(days=1),
            today + timedelta(days=2),
            today + timedelta(days=3),
            today + timedelta(days=5),
            today + timedelta(days=7)
        ]

        for i, student in enumerate(sample_students[:3]):
            start_time = dates[i].replace(hour=10 + i, minute=0)
            db.add_schedule(
                student["chat_id"],
                data["tutor_id"],
                start_time.isoformat(),
                topic=f"Занятие с {student['first_name']}"
            )

    # Добавляем тестовые сообщения если пусто
    if not data["messages"]:
        db.add_message(1001, 999, "Здравствуйте! У меня вопрос по домашнему заданию...")
        db.add_message(999, 1001, "Конечно! Какой именно вопрос?")
        db.add_message(1001, 999, "Не понимаю задание №3. Можете объяснить?")

    # Добавляем тестовые ДЗ если пусто
    if not data["homework"]:
        db.add_homework(999, None, "Повторение тем 1-3", "Решите задачи из учебника страницы 45-48")
        db.add_homework(999, 1001, "Индивидуальное задание для Анны", "Особые упражнения для углубленного изучения")

    # Добавляем тестовый прогресс если пусто
    if not data["progress"]:
        db.update_progress(1001, 85, "Отличные успехи!")
        db.update_progress(1002, 70, "Хорошо, но можно лучше")
        db.update_progress(1003, 90, "Превосходно!")