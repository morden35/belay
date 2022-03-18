class Belay extends React.Component {
	// contains the entire app
	constructor(props) {
		super(props);

		let auth_key = localStorage.getItem('auth_key_morden');
		let userID = localStorage.getItem('userID');

		if (auth_key){
			this.state = {
				userID: userID,
				auth_key: auth_key,
				isAuth: true,
				path: window.location.pathname,
			}
		}
		else {
			this.state = {
				userID: null,
				auth_key: null,
				isAuth: false,
				path: window.location.pathname,
			}
		}

		window.addEventListener("popstate", (event)=>{
			console.log(event);

			let newPath
			if (event.state) {
				newPath = event.state.path;
			}
			else {
				newPath = window.location.pathname;
			}
			this.newPathSetter(newPath, false);
		});
	}

	newPathSetter(newPath, pushToHistory=false) {
		if(pushToHistory) {
			window.history.pushState({path: newPath},"", newPath);
		}
		this.setState({path: newPath});
	}

	render() {
		if (this.state.path == "/") {
			return (
				<Login
				createUser={() => this.createUsername()}
				loginUser={() => this.login()}/>
			);
		}		
		else if (this.state.isAuth && (this.state.path == "/channels")) {
			return (
				<ChannelsHome
				createChannel={(channel_name) => this.createChannel(channel_name)}
				getChannels={() => this.startChannelPolling()}/>
			);
		}
		else if (this.state.isAuth && this.state.path.startsWith("/channels")) {
			return (
				<ChannelsSelect
				createChannel={(channel_name) => this.createChannel(channel_name)}
				getChannels={() => this.startChannelPolling()}
				postMessage={() => this.postMessage()}
				getMessages={() => this.startMessagePolling()}
				view={this.state.path}/>
			);
		}
		else if (this.state.isAuth && this.state.path.startsWith("/replies")) {
			return (
				<Replies
				getChannels={() => this.startChannelPolling()}
				postReply={() => this.postReply()}
				getSingleMessage={() => this.getSingleMessage()}
				startReplyPolling ={() => this.startReplyPolling()}
				view={this.state.path}/>
			);
		}
		else {
			return (
				<Login
				createUser={() => this.createUsername()}
				loginUser={() => this.login()}/>
			);
		}
	}

	countUnread() {
		let auth_key = localStorage.getItem('auth_key_morden');
		let request = fetch("http://127.0.0.1:5000/api/count_unread",
							{method: 'GET',
							 headers: {'Auth-Key': auth_key,
										'user_id': this.state.userID}});
							//  body: JSON.stringify({'user_id': this.state.userID})})
		return request
	}

	updateLastRead() {
		let queryString = window.location.search;
		let urlParams = new URLSearchParams(queryString);
		let currentChannelID = urlParams.get('currentChannelID');

		let localStorage = window.localStorage;
		let maxMessageID = localStorage.getItem("maxMessageID");

		let auth_key = localStorage.getItem('auth_key_morden');
		let request = fetch("http://127.0.0.1:5000/api/update_last_read_message",
							{method: 'POST',
							 headers: {'Auth-Key': auth_key},
							 body: JSON.stringify({'user_id': this.state.userID,
												   'channel_id': currentChannelID,
												   'message_id': maxMessageID})});
		// return request?
	}

	getReplies() {
		let queryString = window.location.search;
		let urlParams = new URLSearchParams(queryString);
		let currentMessageID = urlParams.get('currentMessageID');
		let auth_key = localStorage.getItem('auth_key_morden');
		let request = fetch("http://127.0.0.1:5000/api/get_replies",
							{method: 'GET',
							headers: {'Auth-Key': auth_key,
										'message_id': currentMessageID}});
							// body: JSON.stringify({'message_id': currentMessageID})});
		return request
	}

	startReplyPolling() {
		this.getReplies().then((response) => response.json())
		.then(data => {
			let replies = data["replies"];
		
			// first, remove all messages from html
			let reply_div = document.getElementsByClassName("messages")[0];
			while (reply_div.firstChild) {
				reply_div.removeChild(reply_div.firstChild);
			}
			// re-populate page with 'new' messages
			for (let reply of replies) {
				let message_el = document.createElement("message");
				let author_el = document.createElement("author");
				let content;
				
				let message_txt = reply[1];
				// console.log(message_txt);
				const re = /(http(s?):)([\/|.|\w|\s|-])*\.(?:jpg|gif|png)/g;
				let found = message_txt.match(re);
				if (found && found.length > 0) {
					// image found
					content = document.createElement("img");
					content.setAttribute("src", message_txt);
				}
				else {
					let message_body = document.createTextNode(reply[1]);
					content = document.createElement("content");
					content.appendChild(message_body);
				}

				let author = document.createTextNode(reply[2]);

				author_el.appendChild(author);
				message_el.appendChild(author_el);
				message_el.appendChild(content);

				reply_div.appendChild(message_el);
			}
		});
	}

	getSingleMessage() {
		let queryString = window.location.search;
		let urlParams = new URLSearchParams(queryString);
		let currentMessageID = urlParams.get('currentMessageID');

		let auth_key = localStorage.getItem('auth_key_morden');
		let request = fetch("http://127.0.0.1:5000/api/get_message",
							{method: 'GET',
							headers: {'Auth-Key': auth_key,
										'message_id': currentMessageID}});
							// body: JSON.stringify({'message_id': currentMessageID})});
		request.then((response) => response.json())
		.then(data => {
			if (data["success"]) {
				let message = data['message'];
				let message_el = document.getElementById("message");
				let author_el = document.createElement("author");
				let content;
				
				let message_txt = message[2];
				// console.log(message_txt);
				const re = /(http(s?):)([\/|.|\w|\s|-])*\.(?:jpg|gif|png)/g;
				let found = message_txt.match(re);
				if (found && found.length > 0) {
					// image found
					content = document.createElement("img");
					content.setAttribute("src", message_txt);
				}
				else {
					let message_body = document.createTextNode(message[2]);
					content = document.createElement("content");
					content.appendChild(message_body);
				}

				let author = document.createTextNode(message[3]);
				author_el.appendChild(author);

				message_el.appendChild(author_el);
				message_el.appendChild(content);
			}
			else {
				console.log("Need valid auth-key.");
			}
		});
	}

	postReply() {
		let queryString = window.location.search;
		let urlParams = new URLSearchParams(queryString);
		let message_id = urlParams.get('currentMessageID');

		let auth_key = localStorage.getItem('auth_key_morden');
		let text = document.querySelector("textarea").value;
	  
		let request = fetch("http://127.0.0.1:5000/api/post_reply",
							{method: 'POST',
							headers: {'Auth-Key': auth_key},
							body: JSON.stringify({'message_id': message_id,
												  'text': text})});
		request.then((response) => response.json())
		.then(data => {
			if (data['success']) {
				console.log("Your reply has been posted.");
			  }
			else {
				console.log("You do not have access to post replies in this channel.");
			}
		});
	}

	postMessage() {
		let queryString = window.location.search;
		let urlParams = new URLSearchParams(queryString);
		let channel = urlParams.get('currentChannel');

		// get auth_key from storage
		let auth_key = localStorage.getItem('auth_key_morden');
		let text = document.querySelector("textarea").value;
	  
		let request = fetch("http://127.0.0.1:5000/api/post_message",
							{method: 'POST',
							headers: {'Auth-Key': auth_key},
							body: JSON.stringify({'channel': channel,
												  'text': text})});
		request.then((response) => response.json())
		.then(data => {
			if (data['success']) {
				console.log("Your message has been posted.");
			  }
			  else {
				console.log("You do not have access to post messages in this channel.");
			  }
		});
	}

	getMessages() {
		let queryString = window.location.search;
		let urlParams = new URLSearchParams(queryString);
		let currentChannelID = urlParams.get('currentChannelID');
		let currentChannel = urlParams.get('currentChannel');

		let auth_key = localStorage.getItem('auth_key_morden');
		let request = fetch("http://127.0.0.1:5000/api/get_messages",
							{method: 'GET',
							headers: {'Auth-Key': auth_key,
										'channel_id': currentChannelID,
										'currentChannel': currentChannel}});
							// body: JSON.stringify({'channel_id': currentChannelID,
												//   'currentChannel': currentChannel})});
		return request
	}

	startMessagePolling() {
		this.getMessages().then((response) => response.json())
		.then(data => {
			let messages = data["messages"];
			let max_id = data["max_id"];
			let currentChannel = data["currentChannel"];
			let currentChannelID = data["currentChannelID"];

			// console.log("MAX ID");
			// console.log(max_id);
			if (max_id) {
				let localStorage = window.localStorage;
				localStorage.setItem("maxMessageID", max_id);
				this.updateLastRead();
			}

			// first, remove all messages from html
			let message_div = document.getElementsByClassName("messages")[0];
			while (message_div.firstChild) {
				message_div.removeChild(message_div.firstChild);
			}

			// re-populate page with 'new' messages
			for (let message of messages) {
				let num_replies = message[3]
				// console.log(num_replies);
				let num_replies_txt;
				let num_replies_el = document.createElement("p");
				num_replies_el.setAttribute("id", "reply_count");

				if (num_replies == 1) {
					num_replies_txt = document.createTextNode(num_replies + " reply");
					num_replies_el.appendChild(num_replies_txt);
				}
				else if (num_replies > 0) {
					num_replies_txt = document.createTextNode(num_replies + " replies");
					num_replies_el.appendChild(num_replies_txt);
				}

				let message_el = document.createElement("message");
				let author_el = document.createElement("author");
				let content;

				let reply_button = document.createElement("button");
				reply_button.setAttribute("id", "reply");
				let reply = document.createTextNode("Reply");
				reply_button.appendChild(reply);

				let author = document.createTextNode(message[2]);

				let message_txt = message[1];
				// console.log(message_txt);
				const re = /(http(s?):)([\/|.|\w|\s|-])*\.(?:jpg|gif|png)/g;
				let found = message_txt.match(re);
				if (found && found.length > 0) {
					// image found
					content = document.createElement("img");
					content.setAttribute("src", message_txt);
				}
				else {
					let message_body = document.createTextNode(message_txt);
					content = document.createElement("content");
					content.appendChild(message_body);
				}

				let clickHandler = () => {
					let currentMessageID = message[0];
					let newPath = "/replies/" + currentMessageID + "?currentChannelID=" + currentChannelID + "&currentChannel=" + currentChannel + "&currentMessageID=" + currentMessageID;
					this.newPathSetter(newPath, true);
				};

				reply_button.addEventListener("click", clickHandler);
				author_el.appendChild(author);

				message_el.appendChild(author_el);
				message_el.appendChild(content);
				message_el.appendChild(reply_button);
				message_el.appendChild(num_replies_el);

				message_div.appendChild(message_el);
				// });
			}
		});
	}

	startChannelPolling() {
		let path = window.location.pathname;
		
		if (path != "/") {
			this.countUnread().then((response) => response.json())
			.then(data => {
				let channels_dict = data["channels_dict"];
			
				// first, remove all messages from html
				let channels_div = document.getElementById("channel_list"); // [0]
				while (channels_div.firstChild) {
					channels_div.removeChild(channels_div.firstChild);
				}
				// re-populate page with 'new' messages
				for (const [channel_key, channel_val] of Object.entries(channels_dict)) {
					let channel_el = document.createElement("li");
					let channel_button = document.createElement("button");
					let channel_name = document.createTextNode(channel_key);

					let clickHandler = () => {
						let newPath = "/channels/" + channel_key + "?currentChannelID=" + channel_val["channel_id"] + "&currentChannel=" + channel_key;
						this.newPathSetter(newPath, true);
					};
	
					channel_button.addEventListener("click", clickHandler);
					channel_button.append(channel_name);
					channel_el.appendChild(channel_button);
					if (channel_val["unread"] > 0) {
						let unread = document.createTextNode(channel_val["unread"] + " Unread");
						channel_el.append(unread);
					}
					channels_div.appendChild(channel_el);
				}
			});
		}
	}

	createChannel(channel_name) {
		let localStorage = window.localStorage;
		let auth_key = localStorage.getItem('auth_key_morden');
	  
		let request = fetch("http://127.0.0.1:5000/api/create_channel",
							{method: 'POST',
							 headers: {'Auth-Key': auth_key},
							 body: JSON.stringify({'channel_name': channel_name})});
		request.then((response) => response.json())
		.then(data => {
			if (!data['success']) {
				console.log("You need a valid authorization key and unique channel name to create a new channel.");
			}
			else {
				let new_path = "/channels/" + channel_name + "?currentChannelID=" + data['channel_id'] + "&currentChannel=" + channel_name;
				this.newPathSetter(new_path, true);
		  }
		});
	}

	createUsername() {
		let username = document.querySelector("input#username").value;
		let password = document.querySelector("input#password").value;
	
		if (username && password) {
			let request = fetch("http://127.0.0.1:5000/api/create_user",
								{method: 'POST',
								 body: JSON.stringify({'username': username,
													   'password': password})});
			request.then((response) => response.json())
			.then(data => {
				if (data['success']) {
					let auth_key = data['auth_key'];
					let user_id = data['user_id'];
					let localStorage = window.localStorage;
					localStorage.setItem("auth_key_morden", auth_key);
					localStorage.setItem("username_morden", username);
					localStorage.setItem("userID", user_id);

					this.newPathSetter("/channels", true)
					this.setState({userID: user_id,
								   isAuth: true,
								   auth_key: auth_key});
				}
				else {
					console.log("Username is unavailable. Please enter a valid username and password.");
				}
			});
		}
	}

	login() {
		let username = document.querySelector("input#username").value;
		let password = document.querySelector("input#password").value;
	
		if (username && password) {
			let request = fetch("http://127.0.0.1:5000/api/auth_user",
								{method: 'GET',
								headers: {'username': username,
											'password': password}});
								//  body: JSON.stringify({'username': username,
								// 						'password': password})});
			request.then((response) => response.json())
			.then(data => {
				if (data['success']) {
					let auth_key = data['auth_key'];
					let user_id = data['user_id'];
					let localStorage = window.localStorage;
					localStorage.setItem("auth_key_morden", auth_key);
					localStorage.setItem("username_morden", username);
					localStorage.setItem("userID", user_id);

					this.newPathSetter("/channels", true)
					this.setState({userID: user_id,
								   isAuth: true,
								   auth_key: auth_key});
				}
				else {
					console.log("Please enter a valid username and password.");
				}
			});
		}
	}
}

class Login extends React.Component {
	// displays login page
	render() {
		return (
			<div className="auth container">
				<h1>Welcome to Belay!</h1>
				<h2>Login</h2>
				<div>
					<p>Enter a username</p>
					<input id="username"></input>
					<p>Enter a password</p>
					<input id="password"></input>
				</div>
				<div id="buttons">
					<button id="login" onClick={() => this.props.loginUser()}>Log In</button>
					<button id="create" onClick={() => this.props.createUser()}>Create Account</button>
				</div>
			</div>
		);
	}
}

class ChannelsHome extends React.Component {
	// displays available channels
	constructor(props) {
		super(props)
		this.channelInterval = null
	  }
	prompt_for_channel_name() {
		let channel_name = prompt("Enter new channel name:");
		if (channel_name) {
			this.props.createChannel(channel_name);
		}
	}
	
	componentDidMount() {
		this.channelInterval = setInterval(this.props.getChannels, 500);
	}

	componentWillUnmount() {
		clearInterval(this.channelInterval);
	}

	render() {
		return (
			<div id="container">
				<h1>Belay</h1>
				<div id="new_channel">
					<button id="new_channel_button" onClick={() => this.prompt_for_channel_name()}>New Channel</button>
				</div>
				<div id="channels">
					<div id="join">
						<h2>Join a Channel</h2>
						<ul id="channel_list">
						</ul>
					</div>
					<div id="channel">
					</div>
				</div>
			</div>
		);
	}
}

class ChannelsSelect extends React.Component {
	constructor(props) {
		super(props)
		this.channelInterval = null
		this.messageInterval = null
	  }
	prompt_for_channel_name() {
		let channel_name = prompt("Enter new channel name:");
		if (channel_name) {
			this.props.createChannel(channel_name);
		}
	}
	
	componentDidMount() {
		this.messageInterval = setInterval(this.props.getMessages, 400);
		this.channelInterval = setInterval(this.props.getChannels, 600);
	}

	componentWillUnmount() {
		clearInterval(this.channelInterval);
		clearInterval(this.messageInterval);
	}

	render() {
		let queryString = window.location.search;
		let urlParams = new URLSearchParams(queryString);
		let channel_name = urlParams.get('currentChannel');
		return (
			<div id="container">
				<h1>Belay</h1>
				<div id="new_channel">
					<button id="new_channel_button" onClick={() => this.prompt_for_channel_name()}>New Channel</button>
				</div>
				<div id="channels">
					<div id="join">
						<h2>Join a Channel</h2>
						<ul id="channel_list">
						</ul>
					</div>
					<div id="channel">
						<div className="channel_interface">
							<h2>{channel_name}</h2>
							<div className="comment_box">
								<form>
									<label htmlFor="comment">What do you have to say?</label>
									<textarea name="comment"></textarea>
									<button type="button" value="Post" onClick={() => this.props.postMessage()}>Post</button>
								</form>
							</div>
							<div className="messages">
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

class Replies extends React.Component {
	// displays replies page
	constructor(props) {
		super(props)
		this.channelInterval = null
		this.replyInterval = null
	  }

	prompt_for_channel_name() {
		let channel_name = prompt("Enter new channel name:");
		if (channel_name) {
			this.props.createChannel(channel_name);
		}
	}
	componentDidMount() {
		this.props.getSingleMessage();
		this.channelInterval = setInterval(this.props.getChannels, 500);
		this.replyInterval = setInterval(this.props.startReplyPolling, 500); // might not need interval here since no buttons
	}

	componentWillUnmount() {
		clearInterval(this.channelInterval);
		clearInterval(this.replyInterval);
	}

	render() {
		let queryString = window.location.search;
		let urlParams = new URLSearchParams(queryString);
		let channel_name = urlParams.get('currentChannel');
		return (
			<div id="container">
				<h1>Belay</h1>
				<div id="new_channel">
					<button id="new_channel_button" onClick={() => this.prompt_for_channel_name()}>New Channel</button>
				</div>
				<div id="channels">
					<div id="join">
						<h2>Join a Channel</h2>
						<ul id="channel_list">
						</ul>
					</div>
					<div id="channel">
						<div className="reply_interface">
							<h2>{channel_name}</h2>
							<div id="message">
							</div>
							<div className="comment_box">
								<form>
									<label htmlFor="comment">What do you have to say?</label>
									<textarea name="comment"></textarea>
									<button type="button" value="Post" onClick={() => this.props.postReply()}>Post</button>
								</form>
							</div>
							<div className="messages">
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

/* --------------------------------- */

ReactDOM.render(
	<Belay/>,
	document.getElementById('root')
  );
