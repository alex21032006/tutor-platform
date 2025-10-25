import os

BOT_TOKEN = "8252486950:AAHrAWic8c4kgv6NrZC6Y4my5_wqw259wsI"

# URL для продакшена - ЗАМЕНИ НА СВОЙ!
WEBAPP_URL = "https://твой-домен.herokuapp.com/"

PREDEFINED_USERS = {
    "Анна": {"chat_id": 1001, "username": "student_anna", "role": "student", "first_name": "Анна"},
    "Михаил": {"chat_id": 1002, "username": "student_mikhail", "role": "student", "first_name": "Михаил"},
    "Екатерина": {"chat_id": 1003, "username": "student_ekaterina", "role": "student", "first_name": "Екатерина"},
    "Дмитрий": {"chat_id": 1004, "username": "student_dmitry", "role": "student", "first_name": "Дмитрий"},
    "София": {"chat_id": 1005, "username": "student_sofia", "role": "student", "first_name": "София"},
    "Репетитор": {"chat_id": 999, "username": "tutor_main", "role": "tutor", "first_name": "Репетитор"}
}

CURRENT_YEAR = 2024