class Belay extends React.Component {
	// contains the entire app
	constructor(props) {
		super(props);
		this.state = {
			username: null,
			password: null,
			// auth_key: null,
			isAuth: false,
			path: window.location.pathname
		}
		console.log(this.state.path);

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
		if (this.state.path == "/channels") {
			return (
				<Channels
				createChannel={() => this.createChannel()}/>
			);
		}
		return (
			<Login
			 createUser={() => this.createUsername()}
			 loginUser={() => this.login()}
			 setNewPath={() => this.newPathSetter("/channels", true)}/>
		);
	}
	
	// createChannel() {
	// 	// TO DO
	// }

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
				if (data['success']) {
					console.log("also setting state");
					// let auth_key = data['auth_key'];
					// newPathSetter("/channels", true)
					// window.history.pushState({},"", "http://127.0.0.1:5000/channels");
					this.setState({username: username,
								   password: password,
								   isAuth: true});
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
					// let auth_key = data['auth_key'];
					// window.history.pushState({},"", "http://127.0.0.1:5000/channels");
					this.setState({username: username,
						password: password,
						isAuth: true});
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
					<button id="login" onClick={() => {this.props.loginUser(); this.props.setNewPath();}}>Log In</button>
					<button id="create" onClick={() => {this.props.createUser(); this.props.setNewPath();}}>Create Account</button>
				</div>
			</div>
		);
	}
}

class Channels extends React.Component {
	// displays available channels
	render() {
		return (
			<div>
				<h1>Belay</h1>
				<div id="new_channel">
					{/* () => this.props.createChannel() */}
					{/* onClick={} */}
					<button id="new_channel_button">New Channel</button>
				</div>
				<div id="channels">
					<div id="join">
						<h2>Join a Channel</h2>
						<ul>
							<li>Channel 1</li>
							<li>Channel 2</li>
						</ul>
					</div>
					<div id="chat">
						<h2>Chat chat chat</h2>
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
