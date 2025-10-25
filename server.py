from flask import Flask, request, jsonify
from datetime import datetime
import json
import os

app = Flask(__name__)

# Файл для хранения данных
DATA_FILE = 'chat_data.json'


def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"messages": [], "homework": [], "schedule": [], "progress": {}}


def save_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


@app.route('/api/messages', methods=['GET'])
def get_messages():
    user_id = request.args.get('user_id', type=int)
    other_user_id = request.args.get('other_user_id', type=int)

    data = load_data()
    messages = []

    for msg in data.get("messages", []):
        if ((msg["sender_id"] == user_id and msg["receiver_id"] == other_user_id) or
                (msg["sender_id"] == other_user_id and msg["receiver_id"] == user_id)):
            messages.append(msg)

    return jsonify(messages)


@app.route('/api/messages', methods=['POST'])
def send_message():
    data = request.json
    message_data = {
        "id": datetime.now().timestamp(),
        "sender_id": data["sender_id"],
        "receiver_id": data["receiver_id"],
        "text": data["text"],
        "created_at": datetime.now().isoformat(),
        "read": False
    }

    db_data = load_data()
    db_data["messages"].append(message_data)
    save_data(db_data)

    return jsonify({"status": "success", "message": message_data})


@app.route('/api/homework', methods=['POST'])
def add_homework():
    data = request.json
    homework_data = {
        "id": datetime.now().timestamp(),
        "tutor_id": data["tutor_id"],
        "student_id": data.get("student_id"),
        "title": data["title"],
        "description": data["description"],
        "deadline": data["deadline"],
        "created_at": datetime.now().isoformat(),
        "completed": False
    }

    db_data = load_data()
    db_data["homework"].append(homework_data)
    save_data(db_data)

    return jsonify({"status": "success", "homework": homework_data})


@app.route('/api/schedule', methods=['POST'])
def add_schedule():
    data = request.json
    schedule_data = {
        "id": datetime.now().timestamp(),
        "tutor_id": data["tutor_id"],
        "student_id": data["student_id"],
        "start_time": data["start_time"],
        "duration": data["duration"],
        "topic": data["topic"],
        "created_at": datetime.now().isoformat(),
        "status": "scheduled"
    }

    db_data = load_data()
    db_data["schedule"].append(schedule_data)
    save_data(db_data)

    return jsonify({"status": "success", "schedule": schedule_data})


@app.route('/api/progress', methods=['POST'])
def update_progress():
    data = request.json
    progress_data = {
        "student_id": data["student_id"],
        "progress": data["progress"],
        "comment": data["comment"],
        "updated_at": datetime.now().isoformat()
    }

    db_data = load_data()
    db_data["progress"][str(data["student_id"])] = progress_data
    save_data(db_data)

    return jsonify({"status": "success", "progress": progress_data})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)