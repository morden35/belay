class Belay extends React.Component {
	// contains the entire app
	constructor(props) {
		super(props);
		this.state = {
			username: null,
			password: null,
			auth_key: null,
			isAuth: false,
		}
	}

	render() {
		if (this.state.isAuth) {
			return (
				<Channels/>
			);
		}
		return (
			<Login
			 createUser={() => this.createUsername()}
			 loginUser={() => this.createUsername()}/>
		);
	}
	
	createUsername() {
		console.log("Creating new user");
		let username = document.querySelector("input#username").value;
		let password = document.querySelector("input#password").value;
	
		if (username && password) {
			let request = fetch("http://127.0.0.1:5000/create_user",
								{method: 'POST',
								 body: JSON.stringify({'username': username,
													   'password': password})});
			request.then((response) => response.json())
			.then(data => {
				if (data['success']) {
					let auth_key = data['auth_key'];
					this.setState({username: username,
								   password: password,
								   auth_key: auth_key,
								   isAuth: true});
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
			let request = fetch("http://127.0.0.1:5000/auth_user",
								{method: 'POST',
								 body: JSON.stringify({'username': username,
														'password': password})});
			request.then((response) => response.json())
			.then(data => {
				if (data['success']) {
					let auth_key = data['auth_key'];
					this.setState({username: username,
						password: password,
						auth_key: auth_key,
						isAuth: true});
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

class Channels extends React.Component {
	// displays available channels
	render() {
		return (
			<div>
				<h1>Belay</h1>
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
