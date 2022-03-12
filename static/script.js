class Belay extends React.Component {
	// contains the entire app
	constructor(props) {
		super(props);
		this.state = {
			username: null,
			password: null,
			auth_key: null,
			isAuth: false,
			path: window.location.pathname,
			currentChannel: null
		}
		// console.log(this.state.path);

		window.addEventListener("popstate", (event)=>{
			console.log(event);
			// console.log(event.state);
			// console.log(window.location.pathname);

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
		console.log("setting new path");
		console.log(newPath);
		this.setState({path: newPath});
		if(pushToHistory) {
			window.history.pushState({path: newPath},"", newPath);
		}
	}

	render() {
		if (this.state.path == "/") {
			return (
				<Login
				createUser={() => this.createUsername()}
				loginUser={() => this.login()}/>
			);
		}
		else if (this.state.isAuth) {
			return (
				<Channels
				createChannel={(channel_name) => this.createChannel(channel_name)}
				getChannels={() => this.startChannelPolling()}
				view={this.state.path}
				postMessage={() => this.postMessage()}/>
			);
		}
		else {
			return (
				<Login
				createUser={() => this.createUsername()}
				loginUser={() => this.login()}/>
			);
		}
		//if (this.state.path == "/channels")
		// else if () {
		// 	return (

		// 		);
		// }
	}

	postMessage() {
		// let queryString = window.location.search;
		// let urlParams = new URLSearchParams(queryString);
		// let chat_id = urlParams.get('chat_id');
		let channel = this.state.currentChannel;
		// get auth_key from storage
		let auth_key = localStorage.getItem('auth_key_morden');
	
		let text = document.querySelector("textarea").value;

		console.log(channel);
		console.log(auth_key);
		console.log(text);
	  
		let request = fetch("http://127.0.0.1:5000/post_message",
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
				console.log("You do not have access to post messages in this chat.");
			  }
		});
	}

	getChannels() {
		let request = fetch("http://127.0.0.1:5000/get_channels",
							{method: 'GET'});
							// body: JSON.stringify({'chat_id': chat_id})});
		return request
	}
	
	startChannelPolling() {
		let path = window.location.pathname;
		// console.log(path);
		
		if (path != "/") {
			this.getChannels().then((response) => response.json())
			.then(data => {
				let channels = data["channels"];
			
				// first, remove all messages from html
				let channels_div = document.getElementById("channel_list"); // [0]
				while (channels_div.firstChild) {
					channels_div.removeChild(channels_div.firstChild);
				}
				// re-populate page with 'new' messages
				for (let channel of channels) {
					console.log(channel);
					// console.log(channel[1]);
					let channel_el = document.createElement("li");
					let channel_button = document.createElement("button");
					let channel_name = document.createTextNode(channel[1]);

					let clickHandler = () => {
						let newPath = "/channels/" + channel[1];
						this.newPathSetter(newPath, true);
						this.setState({currentChannel: channel[1]});
					};
	
					channel_button.addEventListener("click", clickHandler);
					channel_button.append(channel_name);
					channel_el.appendChild(channel_button);
				
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
			if (!data['success']) {
				console.log("You need a valid authorization key and unique channel name to create a new channel.");
			}
			else {
				console.log("made new channel");
				// push channel name to history and nav bar
				let new_path = "/channels/" + channel_name;
				this.newPathSetter(new_path, true);
				this.state.currentChannel = channel_name;
				// load new chat page
		  }
		});
	}

	createUsername() {
		console.log("Creating new user");
		let username = document.querySelector("input#username").value;
		let password = document.querySelector("input#password").value;
	
		if (username && password) {
			let request = fetch("http://127.0.0.1:5000/api/create_user",
								{method: 'POST',
								 body: JSON.stringify({'username': username,
													   'password': password})});
			request.then((response) => response.json())
			.then(data => {
				console.log(data);
				console.log(data['success']);
				if (data['success']) {
					// console.log("also setting state");
					let auth_key = data['auth_key'];
					let localStorage = window.localStorage;
					localStorage.setItem("auth_key_morden", auth_key);
					localStorage.setItem("username_morden", username);

					this.newPathSetter("/channels", true)
					// window.history.pushState({},"", "http://127.0.0.1:5000/channels");
					this.setState({username: username,
								   password: password,
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
					let localStorage = window.localStorage;
					localStorage.setItem("auth_key_morden", auth_key);
					localStorage.setItem("username_morden", username);

					this.newPathSetter("/channels", true)
					// window.history.pushState({},"", "http://127.0.0.1:5000/channels");
					this.setState({username: username,
						password: password,
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


class Channels extends React.Component {
	constructor(props) {
		super(props)
		this.interval = null
	  }
	// displays available channels
	prompt_for_channel_name() {
		let channel_name = prompt("Enter new channel name:");
		console.log(channel_name);
		if (channel_name) {
			this.props.createChannel(channel_name);
		}
	}
	
	componentDidMount() {
		// this.props.getChannels();
		this.interval = setInterval(this.props.getChannels, 1000);
	}

	componentWillUnmount() {
		clearInterval(this.interval);
	}

	render() {
		// let channels = this.props.getChannels();
		if (this.props.view == "/channels") {
			return (
				<div>
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
						<div id="chat">
						</div>
					</div>
				</div>
			);
		}
		else {
			let chat_name = this.props.view.split("/")[2]; // check state instead?
			console.log(chat_name);
			return (
				<div>
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
						<div id="chat">
							<div className="chat_interface">
								<h2>{chat_name}</h2>
								<div className="comment_box">
									<form>
										<label htmlFor="comment">What do you have to say?</label>
										<textarea name="comment"></textarea>
										{/* TO DO post message to channel */}
										<button type="button" value="Post" onClick={() => this.props.postMessage()}>Post</button>
									</form>
								</div>
								<div className="messages">
									{/* TO DO load messages */}
								</div>
							</div>
						</div>
					</div>
				</div>
			);
		}
	}
}

/* --------------------------------- */

ReactDOM.render(
	<Belay/>,
	document.getElementById('root')
  );
