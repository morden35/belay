class Belay extends React.Component {
	render() {
		return (
			<div>
				<h1>Belay</h1>
				<Login/>
				<Channels/>
			</div>
		);
	}
}

class Login extends React.Component {
	render() {
		return (
			<div className="auth container">
				<h2>Welcome to Belay!</h2>
				<h3>Create a new account:</h3>
				<p>Enter a username</p>
				<input id="new_username"></input>
				<p>Enter a password</p>
				<input id="new_password"></input>
				<button>Update</button>
				<h3>Login with existing account:</h3>
				<p>Enter a username</p>
				<input id="old_username"></input>
				<p>Enter a password</p>
				<input id="old_password"></input>
				<button>Update</button>
			</div>
		);
	}
}

class Channels extends React.Component {
	render() {
		return (
			<h1>Join a Channel</h1>
		);
	}
}

/* --------------------------------- */

ReactDOM.render(
	<Belay/>,
	document.getElementById('root')
  );
