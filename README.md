# Belay (a Slack clone)

### Introduction

This project combines various front-end and back-end techniques to produce a
modern, database-backed single-page application. Specifically, I have built
my own (significantly smaller in scope) version of the popular workplace
messaging app Slack. I call this version [Belay](https://en.wikipedia.org/wiki/Belaying).

### Features

- Belay lets users send and read real-time chat messages that are organized
  into rooms called Channels. Users see a list of all the channels on the server
  and can click one to enter that channel. Inside, they see all the messages
  posted to that channel by any user, and can post their own messages.
  All messages belong to a channel and all channels are visible to all users (no private rooms or direct messages).
- Any user can create a new channel by supplying a display name. Channel names
  must be unique.
- Like Slack, messages may be threaded as Replies in response to a message in a
  channel. Messages in the channel will display how many replies they have if
  that number is greater than zero. Nested threads are not supported;
  messages either belong directly to a channel or are replies in a thread to a
  message that does, but replies can't have nested replies of their own.
- I have emulated Slack's two-column layout using grids and flexboxes.
- Like Slack, if a message contains any URLs that point to
  [valid image formats](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#Supported_image_formats),
  I display the images in the chat at the bottom of the message.
- The channel display indicates how many new messages have been posted to that
  channel that the user hasn't read yet. In the database, we track the highest
  message id a user has seen in each channel. Belay counts all messages in a
  channel as seen if the user is in the channel when they are posted or visits
  it after.
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

To run Belay, Python 3.9+ with Flask must be installed, as well as a local install of
SQLite 3.

- First, graders will run your migrations in lexical order from the command line.
- Then, graders will start your app with a `flask run` command from the command
  line. Graders will have their FLASK_APP environment variable set to "app," so
  name your Flask file `app.py`.
- Graders will have the packages in `requirements.txt` installed with `pip3 install
  -r requirements.txt`. If you feel strongly that you need a package not listed
  there, ask on the course Slack.
- Graders will try to access your app in their browser at the URL that Flask
  prints to the command line, e.g. `* Running on http://127.0.0.1:5000/ (Press CTRL+C to quit)`
- Make sure that your app starts successfully under these circumstances. We'll
  do our best to make your app run even if it doesn't, but with a points penalty.



Database
- Create database and tables with migrations in version control.
- A table for channels that stores a unique id and the channel name. That unique
  id may be an integer, or a slug like from Exercise 3
- A table for messages that stores, at a minimum, what channel the message is in,
  the user that wrote the message, and its text contents.
- A way of storing Replies. This could be a separate replies table, or in the
  messages table with a way of distinguishing messages in a channel from replies
  to a message, e.g. with a `replies_to` column.
- A join table holding the latest timestamp or message id seen for each user in
  each channel
- Store passwords securely by hashing them with bcrypt
- Sanitize all database inputs using prepared statements

API
- Give API endpoints a unique path namespace to distinguish them from your HTML
  path(s) e.g. `/api/endpoint1`, `/api/encpoint2` etc.
- Authentication endpoint that accepts a username and password.
- Authenticate to other endpoints via session token in the request header (not
  as a URL param or in a request body)
- Use GET requests for API calls that don't change data on the server
- Use POST requests for API calls that change data on the server
- Endpoints to create and get channels and messages
- Endpoint to return unread message counts for the user for each channel
- Endpoint to update a user's last read message

UI and Responsive Layout
- Prompt unauthenticaed users to sign in with their username and password, or to
  create an account. You do not need to support changing
- On wide screens, two-column layout to show the channel list in one column and
  the messages in one active channel or thread in the other column.
- When viewing replies, users can see the parent message they are replying to.
  They can click a button or link to navigate to the channel containing the
  parent message.
- On narrow screens, one-column layout with menu bar. Users see the channel list,
  the messages in one channel, or the replies to one message at a time, and not
  the other two.
- When viewing messages in a channel on a narrow screen, users have a button or
  link they can click to navigate back to the channel list.
- Parse image URLs that appear in messages and display the images at the end of
  the message. Hint: you may use the web to help you find an appropriate regular
  expression.
- Display the number of unread messages per channel
- For each message with replies, display the number of replies to that message.

Single-Page State
- Only serve one HTML request
- Push the channel name (for messages) or parent message id (for replies) to the
  history and navigation bar when the user navigates to a channel or thread.
- Loading the unique URL of a channel or thread should open the app to that
  channel or thread.
- Users can use the Back button to navigate to a previous channel or thread
- Save the user's username and auth key in localStorage or in a cookie. Include
  your CNETID as part of your storage keys so your storage won't conflict with
  those of other students on the graders' machines.

Asynchronous Request Handling
- Continuously poll for new messages, only in the channel the user is in. You
  may use setInterval.
- Continuously poll for which channels have new unread messages and how many.
  Use only one HTTP request to get counts for all channels. You may use
  setInterval.
