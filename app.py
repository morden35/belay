import string
import random
from datetime import datetime
from flask import Flask, render_template, request, jsonify
from functools import wraps
import json
import sqlite3

con = sqlite3.connect('db/belay.db', check_same_thread=False)

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

# You can store data on your server in whatever structure is most convenient,
# either holding it in memory on your server or in a sqlite database.
# You may use the sample structures below or create your own.

# def newChat(host_auth_key):
#     magic_passphrase = ''.join(random.choices(string.ascii_lowercase + string.digits, k=40))
#     chat = {"authorized_users": set(),
#             "magic_passphrase": magic_passphrase,
#             "magic_link": "http://127.0.0.1:5000/chat/",
#             "messages": []}
#     chat["authorized_users"].add(host_auth_key)
#     return chat


# chats = {}
# unique_usernames = set()
# usernames_to_keys = {}
# users = {}

# TODO: Include any other routes your app might send users to
@app.route('/')
@app.route('/channels')
# @app.route('/login') # these are for page refreshes (not history)
# @app.route('/chat/<int:chat_id>')
def index(chat_id=None):
    return app.send_static_file('index.html')


# -------------------------------- API ROUTES ----------------------------------

# TODO: Create the API
@app.route('/api/create_user', methods=['POST'])
def create_user():
    data = json.loads(request.data)
    username = data['username']
    password = data['password']
    auth_key = ''.join(random.choices(string.digits, k=10))
    
    cur = con.cursor()
    users = cur.execute("SELECT username from users").fetchall()
    users = [user[0] for user in users]
    print("users before:", users)

    if username in users:
        return jsonify({'success': False})

    # auth_key = ''.join(random.choices(string.digits, k=10))
    # unique_usernames.add(username)
    # usernames_to_keys[username] = auth_key
    # add user to db
    cur.execute("INSERT INTO users (username, password_, auth_key) VALUES (?, ?, ?)", (username, password, auth_key))
    # users = cur.execute("SELECT * from users").fetchall()
    # print("users after:", users)
    cur.close()

    # users[auth_key] = {'username': username, 'password': password, 'chats': []}
    return jsonify({'success': True, 'auth_key': auth_key})


@app.route('/api/auth_user', methods=['POST'])
def auth_user():
    data = json.loads(request.data)
    username = data['username']
    password = data['password']
    
    cur = con.cursor()
    user = cur.execute('''
                SELECT * from users
                WHERE username = (?)
                AND password_ = (?)
                ''',
                (username, password)).fetchall()
    print(user)

    if len(user) > 0:
        return jsonify({'success': True, 'auth_key': user[0][3]})
    return jsonify({'success': False})


@app.route('/api/create_channel', methods=['POST'])
def create_chat():
    data = json.loads(request.data)
    auth_key = data['auth_key']

    if auth_key in users.keys():
        chat_id = str(len(chats))
        new_chat = newChat(auth_key)
        chats[chat_id] = new_chat
        chats[chat_id]["magic_link"] = chats[chat_id]["magic_link"] + chat_id + "?magic_key=" + chats[chat_id]["magic_passphrase"] + "&chat_id=" + chat_id
        users[auth_key]['chats'].append(chat_id)

        return jsonify({'chat_id': chat_id,
                        'magic_link': chats[chat_id]["magic_link"],
                        'success': True})
    return jsonify({'success': False})

# @app.route('/update_user', methods=['POST'])
# def update_user():
#     data = json.loads(request.data)
#     auth_key = data['auth_key']
#     chat_id = data['chat_id']
#     chats[chat_id]["authorized_users"].add(auth_key)
#     users[auth_key]['chats'].append(chat_id)
#     return jsonify({'success': True})


# @app.route('/join', methods=['POST'])
# def join():
#     data = json.loads(request.data)
#     auth_key = data['auth_key']
#     chat_id = data['chat_id']
#     magic_key = data['magic_key']

#     if (auth_key in users.keys() and
#         chat_id in chats.keys() and
#         chats[chat_id]['magic_passphrase'] == magic_key):
#         chats[chat_id]["authorized_users"].add(auth_key)
#         users[auth_key]["chats"].append(chat_id)
#         return jsonify({'success': True})
#     return jsonify({'success': False})


# @app.route('/load_chats', methods=['POST'])
# def load_chats():
#     data = json.loads(request.data)
#     auth_key = data['auth_key']
#     chats = users[auth_key]['chats']

#     return jsonify({'chats': chats})

# @app.route('/get_magic_link', methods=['POST'])
# def get_magic_link():
#     data = json.loads(request.data)
#     chat_id = data['chat_id']
#     magic_link = chats[chat_id]["magic_link"]
#     return jsonify({'magic_link': magic_link})


# @app.route('/post_message', methods=['POST'])
# def post_message():
#     data = json.loads(request.data)
#     auth_key = data['auth_key']
#     chat_id = data['chat_id']
#     text = data['text']
#     if auth_key in chats[chat_id]["authorized_users"]:
#         chats[chat_id]["messages"].append({"user": auth_key,
#                                             "text": text,
#                                             "author": users[auth_key]['username']})
#         return jsonify({'success': True})
#     return jsonify({'success': False})


# @app.route('/get_messages', methods=['POST'])
# def get_messages():
#     data = json.loads(request.data)
#     chat_id = data['chat_id']
#     messages = chats[chat_id]['messages'][-30:]    
#     return {"messages": messages}
