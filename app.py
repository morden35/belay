import string
import random
from datetime import datetime
from flask import Flask, render_template, request, jsonify
from functools import wraps
import json
import sqlite3
import bcrypt

con = sqlite3.connect('db/belay.db', check_same_thread=False, isolation_level=None)

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

# TODO: Include any other routes your app might send users to
@app.route('/')
@app.route('/channels')
@app.route('/channels/<string:channel_name>') # ?currentChannelID=<int:channel_id>&currentChannel=<string:cur_channel_name>
@app.route('/replies/<int:message_id>')
def index(channel_name=None, message_id=None): # , channel_id=None, cur_channel_name=None
    if channel_name:
        currentChannelID = request.args.get('currentChannelID')
        currentChannel = request.args.get('currentChannel')
        if currentChannelID and currentChannel:
            return app.send_static_file('index.html')
    elif message_id:
        currentChannelID = request.args.get('currentChannelID')
        currentChannel = request.args.get('currentChannel')
        currentMessageID = request.args.get('currentMessageID')
        if currentChannelID and currentChannel and currentMessageID:
            return app.send_static_file('index.html')
    else:
        return app.send_static_file('index.html')


# -------------------------------- API ROUTES ----------------------------------

# TODO: Create the API
@app.route('/api/create_user', methods=['POST'])
def create_user():
    data = json.loads(request.data)
    username = data['username']
    password = data['password'].encode('utf-8')
    
    hashed = bcrypt.hashpw(password, bcrypt.gensalt())
    
    auth_key = ''.join(random.choices(string.digits, k=10))
    
    cur = con.cursor()
    users = cur.execute("SELECT username from users").fetchall()
    users = [user[0] for user in users]

    if username in users:
        return jsonify({'success': False})

    # add user to db
    cur.execute("INSERT INTO users (username, password_, auth_key) VALUES (?, ?, ?)",
                (username, hashed, auth_key))
    user_id = cur.execute('''SELECT id from users
                             WHERE username = (?)''',
                             (username,)).fetchone()[0]
    cur.close()

    return jsonify({'success': True, 'auth_key': auth_key, 'user_id': user_id})


@app.route('/api/auth_user', methods=['POST'])
def auth_user():
    data = json.loads(request.data)
    username = data['username']
    password = data['password'].encode('utf-8')
    
    cur = con.cursor()
    user = cur.execute('''
                        SELECT * FROM users
                        WHERE username = (?)
                        ''',
                        (username, )).fetchone()
    if user:
        hashed = user[2]
        user_id = user[0]

        if bcrypt.checkpw(password, hashed):
            return jsonify({'success': True, 'auth_key': user[3], 'user_id': user_id})
    return jsonify({'success': False})


@app.route('/api/create_channel', methods=['POST'])
def create_channel():
    header = request.headers
    data = json.loads(request.data)
    auth_key = header['Auth-Key']
    channel_name = data['channel_name']

    # first, authenticate user
    cur = con.cursor()
    stored_auth_key = cur.execute('''
                        SELECT auth_key FROM users
                        WHERE auth_key = (?)
                        ''',
                        (auth_key,)).fetchone()[0]
    if stored_auth_key == auth_key:
        # check if channel_name already exists
        channels = cur.execute("SELECT channel_name FROM channels").fetchall()
        channel_names = [channel[0] for channel in channels]
        if channel_name not in channel_names:
            # now create channel
            cur.execute('''INSERT INTO channels
                            (channel_name)
                            VALUES (?)''', (channel_name,))

            channel_id = cur.execute('''SELECT id FROM channels
                                        WHERE channel_name = (?)''',
                                        (channel_name,)).fetchone()[0]
            cur.close()
            return jsonify({'success': True, 'channel_id': channel_id})
    cur.close()
    return jsonify({'success': False})


@app.route('/api/post_message', methods=['POST'])
def post_message():
    header = request.headers
    data = json.loads(request.data)
    
    auth_key = header['Auth-Key']
    channel = data['channel']
    text = data['text']

    # first, authenticate user
    cur = con.cursor()
    user = cur.execute('''
                        SELECT username, auth_key, id FROM users
                        WHERE auth_key = (?)
                        ''',
                        (auth_key,)).fetchone()
    if user[1] == auth_key:
        # get channel id
        channel_id = cur.execute('''
                        SELECT * FROM channels
                        WHERE channel_name = (?)
                        ''',
                        (channel,)).fetchone()[0]
        # post message
        cur.execute('''INSERT INTO messages
                        (channel_id, body, author_name, author_auth_key)
                        VALUES (?, ?, ?, ?)''', (channel_id, text, user[0], auth_key,))

        # also update last read message        
        user_id = user[2]
        message_id = cur.execute('''SELECT MAX(message_id)
                                    FROM messages''').fetchone()[0]
        in_table = cur.execute('''SELECT user_id
                                FROM last_read
                                WHERE user_id = (?)
                                AND channel_id = (?)''',
                                (user_id, channel_id,)).fetchone()
        if in_table:
            cur.execute('''UPDATE last_read
                        SET message_id = (?)
                        WHERE user_id = (?)
                        AND channel_id = (?)''',
                        (message_id, user_id, channel_id,))
        else:
            cur.execute('''INSERT INTO last_read
                        (user_id, channel_id, message_id)
                        VALUES (?, ?, ?)''',
                        (user_id, channel_id, message_id))
        cur.close()
        return jsonify({'success': True})
    cur.close()
    return jsonify({'success': False})


@app.route('/api/get_messages', methods=['POST'])
def get_messages():
    header = request.headers
    auth_key = header['Auth-Key']

    # first, authenticate user
    cur = con.cursor()
    stored_auth_key = cur.execute('''
                        SELECT auth_key FROM users
                        WHERE auth_key = (?)
                        ''',
                        (auth_key,)).fetchone()[0]
    if stored_auth_key == auth_key:
        data = json.loads(request.data)
        channel_id = data['channel_id']
        currentChannel = data['currentChannel']
        
        cur = con.cursor()
        messages = cur.execute('''
                            SELECT * FROM messages
                            WHERE channel_id = (?)
                            ''',
                            (channel_id,)).fetchall()

        max_id = None
        if len(messages) > 0:
            m_ids = [message[0] for message in messages]
            max_id = max(m_ids)

        return {"success": True,
                "messages": messages,
                "max_id": max_id,
                "currentChannel": currentChannel,
                "currentChannelID": channel_id}
    return {"success": False}


@app.route('/api/post_reply', methods=['POST'])
def post_reply():
    header = request.headers
    data = json.loads(request.data)
    
    auth_key = header['Auth-Key']
    message_id = data['message_id']
    text = data['text']

    # first, authenticate user
    cur = con.cursor()
    user = cur.execute('''
                        SELECT username, auth_key FROM users
                        WHERE auth_key = (?)
                        ''',
                        (auth_key,)).fetchone()
    if user[1] == auth_key:
        # post reply
        cur.execute('''INSERT INTO replies
                        (body, author_name, author_auth_key, message_id)
                        VALUES (?, ?, ?, ?)''', (text, user[0], auth_key, message_id,))
        cur.close()
        return jsonify({'success': True})
    cur.close()
    return jsonify({'success': False})


@app.route('/api/get_message', methods=['POST'])
def get_message():
    header = request.headers
    auth_key = header['Auth-Key']

    # first, authenticate user
    cur = con.cursor()
    stored_auth_key = cur.execute('''
                        SELECT auth_key FROM users
                        WHERE auth_key = (?)
                        ''',
                        (auth_key,)).fetchone()[0]
    if stored_auth_key == auth_key:
        data = json.loads(request.data)
        message_id = data['message_id']
        
        cur = con.cursor()
        message = cur.execute('''
                            SELECT * FROM messages
                            WHERE message_id = (?)
                            ''',
                            (message_id,)).fetchone()  
        return {"success": True, "message": message}
    return {"success": False}


@app.route('/api/get_replies', methods=['POST'])
def get_replies():
    header = request.headers
    auth_key = header['Auth-Key']

    # first, authenticate user
    cur = con.cursor()
    stored_auth_key = cur.execute('''
                        SELECT auth_key FROM users
                        WHERE auth_key = (?)
                        ''',
                        (auth_key,)).fetchone()[0]
    if stored_auth_key == auth_key:
        data = json.loads(request.data)
        message_id = data['message_id']

        cur = con.cursor()
        replies = cur.execute('''SELECT * FROM replies
                            WHERE message_id = (?)
                            ''',
                            (message_id,)).fetchall()
        cur.close()

        return {"success": True, "replies": replies}
    return {"success": False}


@app.route('/api/update_last_read_message', methods=['POST'])
def update_last_read():
    header = request.headers
    auth_key = header['Auth-Key']

    # first, authenticate user
    cur = con.cursor()
    stored_auth_key = cur.execute('''
                        SELECT auth_key FROM users
                        WHERE auth_key = (?)
                        ''',
                        (auth_key,)).fetchone()[0]
    if stored_auth_key == auth_key:
        data = json.loads(request.data)
        
        user_id = data['user_id']
        channel_id = data['channel_id']
        message_id = data['message_id']

        cur = con.cursor()
        # instead of insert, coalese here?
        in_table = cur.execute('''SELECT user_id
                                FROM last_read
                                WHERE user_id = (?)
                                AND channel_id = (?)''',
                                (user_id, channel_id,)).fetchone()
        if in_table:
            cur.execute('''UPDATE last_read
                        SET message_id = (?)
                        WHERE user_id = (?)
                        AND channel_id = (?)''',
                        (message_id, user_id, channel_id,))
        else:
            cur.execute('''INSERT INTO last_read
                        (user_id, channel_id, message_id)
                        VALUES (?, ?, ?)''',
                        (user_id, channel_id, message_id))
        cur.close()

        return {'success': True}
    return {"success": False}


@app.route('/api/count_unread', methods=['POST'])
def count_unread():
    header = request.headers
    auth_key = header['Auth-Key']

    # first, authenticate user
    cur = con.cursor()
    stored_auth_key = cur.execute('''
                        SELECT auth_key FROM users
                        WHERE auth_key = (?)
                        ''',
                        (auth_key,)).fetchone()[0]
    if stored_auth_key == auth_key:
        data = json.loads(request.data)
        
        user_id = data['user_id']

        channels_dict = {}

        cur = con.cursor()

        all_channels = cur.execute('''SELECT * FROM channels''').fetchall()
        for channel in all_channels:
            channel_id = channel[0]
            channel_name = channel[1]

            # week 9 example of get_last_unread
            # instead of for loop
            # subquery CTE using with
            last_read = cur.execute('''SELECT message_id
                                    FROM last_read
                                    WHERE user_id = (?)
                                    AND channel_id = (?)''',
                                    (user_id, channel_id, )).fetchone()
            if last_read:
                last_read = last_read[0]
            else:
                last_read = 0
            unread = cur.execute('''SELECT COUNT(*)
                                    FROM messages
                                    WHERE channel_id = (?)
                                    AND message_id > (?)''',
                                    (channel_id, last_read,)).fetchone()
            if unread:
                unread = unread[0]
            else:
                unread = 0
            channels_dict[channel_name] = {"channel_id": channel_id,
                                            "unread": unread}
        cur.close()
        return {"success": True, "channels_dict": channels_dict}
    return {"success": False}


# if __name__ == '__main__':
#   app.run(debug = True, host = '0.0.0.0')
# http://127.0.0.1:5000/
