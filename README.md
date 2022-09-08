# Belay (a Slack clone)

### Introduction

This project combines various front-end and back-end techniques to produce a
modern, database-backed single-page application. Specifically, I have built
my own (significantly smaller in scope) version of the popular workplace
messaging app Slack. I call this version [Belay](https://en.wikipedia.org/wiki/Belaying).

### Features

- Belay lets users send and read real-time chat messages that are organized
  into rooms called Channels. Users see a list of all the channels and can click one to enter that channel. Inside, they see all the messages
  posted to that channel by any user, and can post their own messages.
  All messages belong to a channel and all channels are visible to all users (no private rooms or direct messages implemented).
- Any user can create a new channel by supplying a display name. Channel names
  must be unique.
- Like Slack, messages may be threaded as Replies in response to a message in a
  channel. Messages in the channel will display how many replies they have if
  that number is greater than zero. Nested threads are not supported;
  messages either belong directly to a channel or are replies in a thread to a
  message that does, but replies can't have nested replies of their own.
- Belay emulates Slack's two-column layout using grids and flexboxes.
- Like Slack, if a message contains any URLs that point to
  [valid image formats](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#Supported_image_formats), the image is displayed in the chat at the bottom of the message.
- The channel display indicates how many new messages have been posted to that
  channel that the user hasn't read yet. In the database, we track the highest
  message id a user has seen in each channel.
- Users have a display name that they use to login with their password.
- Belay is a single-page web application. We serve a single HTML request on load
  and do not refresh the page. As users navigate to a channel, the application
  updates the navigation bar to reflect what channel they are in, and navigating
  to the URL for a specific channel opens the single-page application with that
  channel open.
- Belay automatically sends non-blocking requests to the server to check for new
  channels and new messages in a channel. New messages in the channel the user
  is looking at are automatically considered to be read.
- Other than loading the initial page and serving static content like scripts,
  stylesheets, and images, all interaction with the Belay server is handled via
  JSON API requests. This includes authenticating users, retrieving channels and messages, and creating new channels and messages. These requests are served by
  a Flask API.
- All data about users, channels, and messages is stored in a SQLite database.
- Other Slack features not listed here such as likes, @-mentioning
  users, etc are not implemented in this version of Belay.

### Directions to Run

To run Belay locally, [Python 3.9+](https://www.python.org/downloads/) with [Flask](https://flask.palletsprojects.com/en/2.2.x/installation/), as well as [SQLite 3](https://www.sqlitetutorial.net/download-install-sqlite/) must be installed.

Once Python 3.9+, Flask, and Sqlite3 are installed, do the following:
1. Install additional packages:
$ pip3 install -r requirements.txt

2. Run sqlite3 migrations from the command line:
$ cat db/20220307T104700-create_tables.sql | sqlite3 db/belay.db

3. Start the Belay app:
$ flask run

4. Access Belay in the browser at the URL that Flask prints to the command line, e.g. `* Running on http://127.0.0.1:5000/ (Press CTRL+C to quit)`

### Additional Technical Details

Database
- Belay contains a database (belay.db) that contains tables with migrations in version control.
- The database contains a table for channels that stores a unique id and the channel name.
- The database contains a table for messages that stores what channel the message is in,
  the user that wrote the message, and its text contents.
- The database contains a table for storing replies.
- The database contains a join table (last_read) holding the latest message id seen for each user in
  each channel.
- The database stores passwords securely by hashing them with bcrypt.
- Belay sanitize all database inputs using prepared statements.

The API
- Contains an authentication endpoint that accepts a username and password.
- Authenticates to other endpoints via session token in the request header (not
  as a URL param or in a request body).
- Uses GET requests for API calls that don't change data on the server.
- Uses POST requests for API calls that change data on the server.
- Contains endpoints to create and get channels and messages.
- Contains endpoint to return unread message counts for the user for each channel.
- Contains endpoint to update a user's last read message.

UI and Responsive Layout
- Prompts unauthenticaed users to sign in with their username and password, or to
  create an account.
- On wide screens, two-column layout to show the channel list in one column and
  the messages in one active channel or thread in the other column.
- When viewing replies, users can see the parent message they are replying to.
  They can click a button to navigate to the channel containing the
  parent message.
- Parses image URLs that appear in messages and display the images at the end of
  the message.
- Display the number of unread messages per channel.
- For each message with replies, display the number of replies to that message.

Single-Page State
- Only serve one HTML request.
- Push the channel name (for messages) or parent message id (for replies) to the
  history and navigation bar when the user navigates to a channel or thread.
- Loading the unique URL of a channel or thread should open the app to that
  channel or thread.
- Users can use the Back button to navigate to a previous channel or thread.

Asynchronous Request Handling
- Continuously polls for new messages, only in the channel the user is in.
- Continuously polls for which channels have new unread messages and how many.
  Use only one HTTP request to get counts for all channels.
