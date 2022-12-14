DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS channels;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS replies;
DROP TABLE IF EXISTS last_read;

create table users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password_ TEXT NOT NULL,
    auth_key TEXT NOT NULL
);

create table channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_name TEXT
);

create table messages (
    message_id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id INTEGER,
    body TEXT,
    author_name TEXT,
    author_auth_key INTEGER,
    FOREIGN KEY(channel_id) REFERENCES channels(id)
);

create table replies (
    reply_id INTEGER PRIMARY KEY AUTOINCREMENT,
    body TEXT,
    author_name TEXT,
    author_auth_key INTEGER,
    message_id INTEGER,
    FOREIGN KEY(message_id) REFERENCES messages(message_id)
);

create table last_read (
    user_id INTEGER,
    channel_id INTEGER,
    message_id INTEGER,
    PRIMARY KEY(user_id, channel_id)
    FOREIGN KEY(user_id) REFERENCES users(id)
)
