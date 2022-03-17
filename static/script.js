class Belay extends React.Component {
	// contains the entire app
	constructor(props) {
		super(props);

		let auth_key = localStorage.getItem('auth_key_morden');
		let userID = localStorage.getItem('userID');
		// these are more complex
		// either coming from previous state, /channels url, /replies url
		// let currentChannel = localStorage.getItem('currentChannel');
		// let currentChannelID = localStorage.getItem('currentChannelID');
		
		// what about these?
		// let currentMessageID = localStorage.getItem('currentMessageID');
		// let maxMessageID = localStorage.getItem('maxMessageID');

		if (auth_key){
			this.state = {
				userID: userID,
				auth_key: auth_key,
				isAuth: true,
				path: window.location.pathname,
				// currentChannel: currentChannel,
				// currentChannelID: currentChannelID,
				// currentMessageID: currentMessageID,
				// maxMessageID: maxMessageID
			}
		}
		else {
			this.state = {
				userID: null,
				auth_key: null,
				isAuth: false,
				path: window.location.pathname,
				// currentChannel: null,
				// currentChannelID: null,
				// currentMessageID: null,
				// maxMessageID: null
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
		// component did mount (method within this component)
		// react component superclass
		// called after component is loaded on page
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
				// view={this.state.path}/>
				// postMessage={() => this.postMessage()}
				// getMessages={() => this.startMessagePolling()}/>
			);
		}
		else if (this.state.isAuth && this.state.path.startsWith("/channels")) {
			return (
				<ChannelsSelect
				createChannel={(channel_name) => this.createChannel(channel_name)}
				getChannels={() => this.startChannelPolling()}
				// currentChannel={this.state.currentChannel}
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
				// currentChannel={this.state.currentChannel}
				// currentChannelID={this.state.currentChannelID}
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
							{method: 'POST',
							 headers: {'Auth-Key': auth_key},
							 body: JSON.stringify({'user_id': this.state.userID})})
		return request
	}

	updateLastRead() {
		let queryString = window.location.search;
		let urlParams = new URLSearchParams(queryString);
		let currentChannelID = urlParams.get('currentChannelID');

		let localStorage = window.localStorage;
		let maxMessageID = localStorage.getItem("maxMessageID");

		// console.log(this.state.maxMessageID);
		let auth_key = localStorage.getItem('auth_key_morden');
		let request = fetch("http://127.0.0.1:5000/api/update_last_read_message",
							{method: 'POST',
							 headers: {'Auth-Key': auth_key},
							 body: JSON.stringify({'user_id': this.state.userID,
												   'channel_id': currentChannelID, //this.state.
												   'message_id': maxMessageID})}); //this.state.
		// return request?
	}

	getReplies() {
		let queryString = window.location.search;
		let urlParams = new URLSearchParams(queryString);
		let currentMessageID = urlParams.get('currentMessageID');
		// console.log(this.currentChannelID);
		let auth_key = localStorage.getItem('auth_key_morden');
		let request = fetch("http://127.0.0.1:5000/api/get_replies",
							{method: 'POST',
							headers: {'Auth-Key': auth_key},
							body: JSON.stringify({'message_id': currentMessageID})}); //this.state.
		return request
	}

	startReplyPolling() {
		// let path = window.location.pathname;
		// console.log("polling?");
		// console.log(this.state.currentChannelID);
		
		// if (this.state.currentMessageID) {
		this.getReplies().then((response) => response.json())
		.then(data => {
			let replies = data["replies"];
		
			// first, remove all messages from html
			let reply_div = document.getElementsByClassName("messages")[0];
			// let reply_div = document.getElementById("replies"); // [0]
			while (reply_div.firstChild) {
				reply_div.removeChild(reply_div.firstChild);
			}
			// re-populate page with 'new' messages
			for (let reply of replies) {
				// console.log(channel);
				// console.log(channel[1]);
				let message_el = document.createElement("message");
				let author_el = document.createElement("author");
				let content;
				// let content = document.createElement("content");
				
				let message_txt = reply[1];
				console.log(message_txt);
				const re = /(http(s?):)([\/|.|\w|\s|-])*\.(?:jpg|gif|png)/g;
				let found = message_txt.match(re);
				if (found && found.length > 0) {
					// image found
					content = document.createElement("img");
					content.setAttribute("src", message_txt);
					// set src
				}
				else {
					let message_body = document.createTextNode(reply[1]);
					content = document.createElement("content");
					content.appendChild(message_body);
				}

				let author = document.createTextNode(reply[2]);
				// let message_body = document.createTextNode(reply[1]);

				author_el.appendChild(author);
				// content.appendChild(message_body);

				message_el.appendChild(author_el);
				message_el.appendChild(content);

				reply_div.appendChild(message_el);
			}
		});
		// }
	}

	getSingleMessage() {
		// console.log("getting single message");
		// console.log(this.state.currentMessageID)
		let queryString = window.location.search;
		let urlParams = new URLSearchParams(queryString);
		let currentMessageID = urlParams.get('currentMessageID');

		let auth_key = localStorage.getItem('auth_key_morden');
		let request = fetch("http://127.0.0.1:5000/api/get_message",
							{method: 'POST',
							headers: {'Auth-Key': auth_key},
							body: JSON.stringify({'message_id': currentMessageID})}); //this.state.
		request.then((response) => response.json())
		.then(data => {
			if (data["success"]) {
				// console.log(data['message']);
				let message = data['message'];
				let message_el = document.getElementById("message");
				// let message_el = document.createElement("message");
				let author_el = document.createElement("author");
				// let content = document.createElement("content");
				let content;
				// let content = document.createElement("content");
				
				let message_txt = message[2];
				console.log(message_txt);
				const re = /(http(s?):)([\/|.|\w|\s|-])*\.(?:jpg|gif|png)/g;
				let found = message_txt.match(re);
				if (found && found.length > 0) {
					// image found
					content = document.createElement("img");
					content.setAttribute("src", message_txt);
					// set src
				}
				else {
					let message_body = document.createTextNode(message[2]);
					content = document.createElement("content");
					content.appendChild(message_body);
				}

				// let num_replies_el = document.createElement("count");
				// num_replies_el.setAttribute("id", "reply_count");

				// let reply_button = document.createElement("button");
				// reply_button.setAttribute("id", "reply");
				// let reply = document.createTextNode("Reply");
				// reply_button.appendChild(reply);

				let author = document.createTextNode(message[3]);
				// let message_body = document.createTextNode(message[2]);

				// let clickHandler = () => {
				// 	console.log("SETTING NEW PATH TO REPLY");
				// 	let newPath = "/replies/" + message[0];
				// 	console.log(newPath);
				// 	this.newPathSetter(newPath, true);
				// };

				// reply_button.addEventListener("click", clickHandler);

				author_el.appendChild(author);
				// content.appendChild(message_body);

				message_el.appendChild(author_el);
				message_el.appendChild(content);
				// message_el.appendChild(reply_button);
				// message_el.appendChild(num_replies_el);

				// message_div.appendChild(message_el);
			}
			else {
				console.log("Need valid auth-key.");
			}
		});
	}

	postReply() {
		// let queryString = window.location.search;
		// let urlParams = new URLSearchParams(queryString);
		let queryString = window.location.search;
		let urlParams = new URLSearchParams(queryString);
		let message_id = urlParams.get('currentMessageID');

		// let message_id = this.state.currentMessageID;
		// let channel = this.state.currentChannel;
		// get auth_key from storage

		// NEED MESSAGE_ID
		let auth_key = localStorage.getItem('auth_key_morden');
	
		let text = document.querySelector("textarea").value;

		// console.log(channel);
		// console.log(auth_key);
		// console.log(text);
	  
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
		// let channel = this.state.currentChannel;
		// get auth_key from storage
		let auth_key = localStorage.getItem('auth_key_morden');
		let text = document.querySelector("textarea").value;

		// console.log(channel);
		// console.log(auth_key);
		// console.log(text);
	  
		let request = fetch("http://127.0.0.1:5000/api/post_message",
							{method: 'POST',
							headers: {'Auth-Key': auth_key},
							body: JSON.stringify({'channel': channel,
												  'text': text})});
		request.then((response) => response.json())
		.then(data => {
			if (data['success']) {
				// update_last_read?
				console.log("Your message has been posted.");
			  }
			  else {
				console.log("You do not have access to post messages in this channel.");
			  }
		});
	}

	getMessages() {
		// console.log(this.currentChannelID);
		let queryString = window.location.search;
		let urlParams = new URLSearchParams(queryString);
		let currentChannelID = urlParams.get('currentChannelID');
		let currentChannel = urlParams.get('currentChannel');

		let auth_key = localStorage.getItem('auth_key_morden');
		let request = fetch("http://127.0.0.1:5000/api/get_messages",
							{method: 'POST',
							headers: {'Auth-Key': auth_key},
							body: JSON.stringify({'channel_id': currentChannelID,
												  'currentChannel': currentChannel})}); //this.state.
		return request
	}

	startMessagePolling() {
		// console.log("HERE");
		// let path = window.location.pathname;
		// console.log("polling?");
		// console.log(this.state.currentChannelID);
		
		// if (this.state.currentChannelID) {
		this.getMessages().then((response) => response.json())
		.then(data => {
			let messages = data["messages"];
			let max_id = data["max_id"];
			let currentChannel = data["currentChannel"];
			let currentChannelID = data["currentChannelID"];

			console.log("MAX ID");
			console.log(max_id);
			if (max_id) {
				let localStorage = window.localStorage;
				localStorage.setItem("maxMessageID", max_id);
				// this.setState({maxMessageID: max_id});
				this.updateLastRead();
			}

			// first, remove all messages from html
			let message_div = document.getElementsByClassName("messages")[0];
			// if (message_div) {
			while (message_div.firstChild) {
				message_div.removeChild(message_div.firstChild);
			}

			// re-populate page with 'new' messages
			for (let message of messages) {
				// console.log(channel);
				// console.log(channel[1]);
				let message_el = document.createElement("message");
				let author_el = document.createElement("author");
				let content;

				let num_replies_el = document.createElement("count");
				num_replies_el.setAttribute("id", "reply_count");

				let reply_button = document.createElement("button");
				reply_button.setAttribute("id", "reply");
				let reply = document.createTextNode("Reply");
				reply_button.appendChild(reply);

				let author = document.createTextNode(message[3]);

				let message_txt = message[2];
				console.log(message_txt);
				const re = /(http(s?):)([\/|.|\w|\s|-])*\.(?:jpg|gif|png)/g;
				let found = message_txt.match(re);
				if (found && found.length > 0) {
					// image found
					content = document.createElement("img");
					content.setAttribute("src", message_txt);
					// set src
				}
				else {
					let message_body = document.createTextNode(message[2]);
					content = document.createElement("content");
					content.appendChild(message_body);
				}

				let clickHandler = () => {
					// let localStorage = window.localStorage;
					// localStorage.setItem("currentMessageID", message[0]);
					let currentMessageID = message[0];
					// this.setState({currentMessageID: message[0]});

					// console.log("SETTING NEW PATH TO REPLY");
					let newPath = "/replies/" + message[0] + "?currentChannelID=" + currentChannelID + "&currentChannel=" + currentChannel + "&currentMessageID=" + currentMessageID;
					// console.log(newPath);
					this.newPathSetter(newPath, true);

				};

				reply_button.addEventListener("click", clickHandler);

				author_el.appendChild(author);

				message_el.appendChild(author_el);
				message_el.appendChild(content);
				message_el.appendChild(reply_button);
				message_el.appendChild(num_replies_el);

				message_div.appendChild(message_el);
			}
			// }
		});
		// }
	}

	// getChannels() {
	// 	let request = fetch("http://127.0.0.1:5000/api/get_channels",
	// 						{method: 'GET'});
	// 						// body: JSON.stringify({'chat_id': chat_id})});
	// 	return request
	// }
	
	startChannelPolling() {
		let path = window.location.pathname;
		// console.log(path);
		
		if (path != "/") {
			// replace getChannels with count_unread?
			// 
			this.countUnread().then((response) => response.json())
			.then(data => {
				// console.log(data);
				let channels_dict = data["channels_dict"];

				// let channels = data["channels"];
			
				// first, remove all messages from html
				let channels_div = document.getElementById("channel_list"); // [0]
				while (channels_div.firstChild) {
					channels_div.removeChild(channels_div.firstChild);
				}
				// re-populate page with 'new' messages
				for (const [channel_key, channel_val] of Object.entries(channels_dict)) {
					// console.log(channel);
					// console.log(channel[1]);
					let channel_el = document.createElement("li");
					let channel_button = document.createElement("button");
					let channel_name = document.createTextNode(channel_key);
					// let channel_name = document.createTextNode(channel[1]);

					let clickHandler = () => {
						let newPath = "/channels/" + channel_key + "?currentChannelID=" + channel_val["channel_id"] + "&currentChannel=" + channel_key;
						// let localStorage = window.localStorage;

						// localStorage.setItem("currentChannel", channel_key);
						// localStorage.setItem("currentChannelID", channel_val["channel_id"]);

						this.newPathSetter(newPath, true);
						// this.setState({currentChannel: channel_key,
						// 			   currentChannelID: channel_val["channel_id"]});
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
			// .then(() => {
				// this.startChannelPolling();
				// let timout = setTimeout(this.startChannelPolling(), 1000);
			// });
		}
	}

	createChannel(channel_name) {
		// console.log("CREATING CHANNEL");
		let localStorage = window.localStorage;
		let auth_key = localStorage.getItem('auth_key_morden');
		// console.log(auth_key);
		// console.log("CHANNEL NAME");
		// console.log(channel_name);
		// need to supply channel name
	  
		let request = fetch("http://127.0.0.1:5000/api/create_channel",
							{method: 'POST',
							 headers: {'Auth-Key': auth_key},
							 body: JSON.stringify({'channel_name': channel_name})});
		request.then((response) => response.json())
		.then(data => {
			// console.log(data);
			if (!data['success']) {
				console.log("You need a valid authorization key and unique channel name to create a new channel.");
			}
			else {
				// console.log("made new channel");
				// push channel name to history and nav bar
				let new_path = "/channels/" + channel_name + "?currentChannelID=" + data['channel_id'] + "&currentChannel=" + channel_name;
				// let channel_id = data['channel_id'];
				// console.log("CHANNELID");
				// console.log(channel_id);
				// let localStorage = window.localStorage;

				// localStorage.setItem("currentChannel", channel_name);
				// localStorage.setItem("currentChannelID", channel_id);

				this.newPathSetter(new_path, true);

				// this.setState({currentChannel: channel_name,
				// 			   currentChannelID: channel_id});
		  }
		});
	}

	createUsername() {
		// console.log("Creating new user");
		let username = document.querySelector("input#username").value;
		let password = document.querySelector("input#password").value;
	
		if (username && password) {
			let request = fetch("http://127.0.0.1:5000/api/create_user",
								{method: 'POST',
								 body: JSON.stringify({'username': username,
													   'password': password})});
			request.then((response) => response.json())
			.then(data => {
				// console.log(data);
				// console.log(data['success']);
				if (data['success']) {
					// console.log("also setting state");
					let auth_key = data['auth_key'];
					let user_id = data['user_id'];
					let localStorage = window.localStorage;
					localStorage.setItem("auth_key_morden", auth_key);
					localStorage.setItem("username_morden", username);
					localStorage.setItem("userID", user_id);

					this.newPathSetter("/channels", true)
					// window.history.pushState({},"", "http://127.0.0.1:5000/channels");
					this.setState({// username: username,
								   // password: password,
								   userID: user_id,
								   isAuth: true,
								   auth_key: auth_key});
								//    path: "/channels"});
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
					// window.history.pushState({},"", "http://127.0.0.1:5000/channels");
					this.setState({// username: username,
								// password: password,
								userID: user_id,
								isAuth: true,
								auth_key: auth_key});
								// path: "/channels"});
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
		// let new_path = "/channels";
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
					{/* this.props.setNewPath(); */}
					<button id="login" onClick={() => this.props.loginUser()}>Log In</button>
					<button id="create" onClick={() => this.props.createUser()}>Create Account</button>
				</div>
			</div>
		);
	}
}

class ChannelsHome extends React.Component {
	constructor(props) {
		super(props)
		this.channelInterval = null
		// this.messageInterval = null
	  }
	// displays available channels
	prompt_for_channel_name() {
		let channel_name = prompt("Enter new channel name:");
		// console.log(channel_name);
		if (channel_name) {
			this.props.createChannel(channel_name);
		}
	}
	
	componentDidMount() {
		// this.props.getChannels();
		this.channelInterval = setInterval(this.props.getChannels, 500);
		// this.messageInterval = setInterval(this.props.getMessages, 500);
	}

	componentWillUnmount() {
		clearInterval(this.channelInterval);
		// clearInterval(this.messageInterval);
	}

	render() {
		// let channels = this.props.getChannels();
		// if (this.props.view == "/channels") {
		return (
			<div id="container">
				<h1>Belay</h1>
				<div id="new_channel">
					{/* () => this.props.createChannel() */}
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
		// this.interval = null
	  }
	// displays available channels
	prompt_for_channel_name() {
		let channel_name = prompt("Enter new channel name:");
		// console.log(channel_name);
		if (channel_name) {
			this.props.createChannel(channel_name);
		}
	}
	
	componentDidMount() {
		// this.props.getChannels();
		// function toPoll(props) {
		// 	console.log("here")
		// 	props.getMessages();
		// 	props.getChannels();
		// }
		this.messageInterval = setInterval(this.props.getMessages, 400);
		this.channelInterval = setInterval(this.props.getChannels, 600);
		// this.interval = setInterval(() => {console.log("here"); this.props.getMessages; this.props.getChannels}, 500);
	}

	componentWillUnmount() {
		clearInterval(this.channelInterval);
		clearInterval(this.messageInterval);
		// clearInterval(this.interval);
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
		// this.messageInterval = null
	  }

	prompt_for_channel_name() {
		let channel_name = prompt("Enter new channel name:");
		// console.log(channel_name);
		if (channel_name) {
			this.props.createChannel(channel_name);
		}
	}
	componentDidMount() {
		this.props.getSingleMessage();
		this.channelInterval = setInterval(this.props.getChannels, 500);
		this.replyInterval = setInterval(this.props.startReplyPolling, 500); // might not need interval here since no buttons
		// this.messageInterval = setInterval(this.props.getMessages, 500);
	}

	componentWillUnmount() {
		clearInterval(this.channelInterval);
		clearInterval(this.replyInterval);
		// clearInterval(this.messageInterval);
	}

	render() {
		// let channel_name = this.props.view.split("/")[2]; // check state instead?
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
							<message id="message">
							</message>
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
