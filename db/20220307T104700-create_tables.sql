DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS channels;
DROP TABLE IF EXISTS messages;

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
