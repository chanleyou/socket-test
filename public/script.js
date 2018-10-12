const socket = io();

const parseCookie = (cookieString) => {

	let output = {};

	let cookies = cookieString.split('; ');
	
	for (let i in cookies) {
		let array = cookies[i].split("=");
		output[array[0]] = array[1];
	}
	return output;
}

const choosePlayerForm = (lobby, players) => {

	let chooseForm = document.querySelector('#chooseForm');
	chooseForm.classList.remove('d-none');

	let missionId = document.createElement('input');
	missionId.name = 'mission_number';
	missionId.value = lobby.mission;
	missionId.type = 'hidden';
	chooseForm.appendChild(missionId);

	let leader = document.createElement('input');
	leader.name = 'leader';
	leader.value = lobby.current_player;
	leader.type = 'hidden';
	chooseForm.appendChild(leader);

	const populate = (element, name) => {

		element.classList.add('form-control', 'my-1');
		element.name = name;
		element.required = 'required';
		chooseForm.appendChild(element);
		let defaultChoice = document.createElement('option');
		defaultChoice.value = "";
		defaultChoice.textContent = "Choose player...";
		defaultChoice.selected = 'true';
		element.appendChild(defaultChoice);

		for (let i in players) {
			let option = document.createElement('option');
			option.textContent = `${players[i].player_number} ${players[i].name}`;
			option.value = players[i].player_number;
			element.appendChild(option);
		}
	}

	let selectOne = document.createElement('select');
	populate(selectOne, 'choiceOne');
	let selectTwo = document.createElement('select');
	populate(selectTwo, 'choiceTwo');

	if (lobby.mission === 2 || lobby.mission === 5) {
		let selectThree = document.createElement('select');
		populate(selectThree, 'choiceThree');
	}

	submitButton = document.createElement('button');
	submitButton.type = 'submit';
	submitButton.classList.add ('btn', 'btn-primary', 'my-1');
	submitButton.textContent = 'Submit';
	chooseForm.appendChild(submitButton);
}

// central function that decides what to show 
// called upon by updateGame
const gameLogic = (lobby, players, mission, cookies) => {

	let thisPlayer = {};
	
	for (let i in players) {
		if (cookies.userid == players[i].user_id) {
			thisPlayer = players[i];
			break;
		}
	}
	
	let fellowSpy = {};

	if (thisPlayer.role === 'Spies') {
		for (let i in players) {
			if (players[i].role === 'Spies' && players[i].user_id !== thisPlayer.user_id) {
				fellowSpy = players[i];
				break;
			}
		}
	}

	let currentPlayer = {};

	for (let i in players) {
		if (lobby.current_player === players[i].player_number) {
			currentPlayer = players[i];
			break;
		}
	}

	// reset stuff list
	while (listPlayers.firstChild) {
		listPlayers.removeChild(listPlayers.firstChild);
	}

	// update player list
	for (let i in players) {
		let playerTag = document.createElement('p');
		playerTag.classList.add('m-0');

		if (players[i].player_number === lobby.current_player) {
			playerTag.classList.add('font-weight-bold');
		}

		if ((thisPlayer.role === 'Spies' && players[i].role === 'Spies') || lobby.mission === 6) {
			playerTag.classList.add('font-italic');
		}

		playerTag.textContent = `${players[i].player_number} ${players[i].name}`
		listPlayers.appendChild(playerTag);
	}

	// playerLine controller
	if (lobby.mission === 0) {
		playerLine.textContent = "Waiting for game to start...";

	} else {

		if (thisPlayer.role === 'Resistance') {
			playerLine.textContent = `You are part of the ${thisPlayer.role}.`;
		} else {
			playerLine.textContent = `You are part of the ${thisPlayer.role}, along with ${fellowSpy.player_number} ${fellowSpy.name}.`;
		}
	}

	// title controller
	if (lobby.mission === 0 && players.length < 5) {
		
		gameStatus.textContent = "Waiting for players...";
		
	} else if (lobby.mission === 0 && players.length === 5) {
		
		gameStatus.textContent = "Waiting for host to start the game.";
		
		if (lobby.host_id == cookies.userid) {
			startButton.classList.remove('d-none');
			startButton.addEventListener('click', () => {
				startButton.classList.add('d-none');
			})
		}

	} else if (lobby.mission === 6) {

		gameStatus.textContent = "GAME OVER TEXT."; 
	
	} else {

		gameStatus.textContent = `Mission ${lobby.mission}`;

		if (lobby.phase === 1) {

			if (thisPlayer.player_number === currentPlayer.player_number) {

				if (lobby.mission === 1 || lobby.mission === 3 || lobby.mission === 4) {

					phaseLine.textContent = "It's your turn! Choose 2 players to go on the mission:";

					choosePlayerForm(lobby, players);

				} else {

					phaseLine.textContent = "It's your turn! Choose 3 players to go on the mission:";

					choosePlayerForm(lobby, players);

				}

			} else {

				phaseLine.textContent = `It's ${currentPlayer.player_number} ${currentPlayer.name}'s turn to choose who goes on the mission. Waiting for ${currentPlayer.player_number} ${currentPlayer.name} to choose...`;
			}

		} else if (lobby.phase === 2) {

			if (thisPlayer.player_number === currentPlayer.player_number) {
				phaseLine.textContent = 'You have chosen the following players for this mission:'
			} else {
				phaseLine.textContent = `${currentPlayer.name} has chosen the following players for this mission:`
			}

			
			let choices = [];

			for (let i in players) {
				if (players[i].player_number === mission.choice_one) {
					 choices.push(players[i]);
				} else if (players[i].player_number === mission.choice_two) {
					choices.push(players[i]);
				} else if (players[i].player_number === mission.choice_three) {
					choices.push(players[i]);
				}
			}


			console.log(choices);

			for (let i in choices) {
				list = document.createElement('li');
				list.textContent = `${choices[i].player_number} ${choices[i].name}`;
				choiceUl.appendChild(list);
			}

			voteForm.classList.remove('d-none');
			
		}
	}

}

// 
const updateGame = (lobby, cookies) => {

	let request = new XMLHttpRequest();

	request.addEventListener("load", function () {

		let players = JSON.parse(this.responseText);
		
		let request = new XMLHttpRequest();

		request.addEventListener("load", function () {
	
			let lobby = JSON.parse(this.responseText);

			let request = new XMLHttpRequest();

			request.addEventListener('load', function () {

			let mission = JSON.parse(this.responseText);

				gameLogic(lobby, players, mission, cookies);
			})

			request.open("GET", `/lobbies/${lobby.id}/${lobby.mission}/voting`);
			request.send();
		})
	
		request.open("GET", `/lobbies/${lobby.id}/status`);
		request.send();
	})

	request.open("POST", `/lobbies/${lobby.id}/getPlayers`);
	request.send();
}

// stuff happens after the page loads
window.onload = () => {

	let cookies = parseCookie(document.cookie);
	const lobby = {
		id: document.title.replace(/\D/g,'')
	};

	updateGame(lobby, cookies);

	// socket EMITS chat	
	chatForm.addEventListener('submit', (event) => {
	
		event.preventDefault();
	
		if (chatField.value) {
			socket.emit('chat', lobby, chatField.value);
			chatField.value = "";
		}	
	})

	// socket receives chat
	socket.on('chat', (lobbyFrom, username, message) => {

		console.log(lobbyFrom.id);

		if (lobbyFrom.id === lobby.id) {

			let newLine = document.createElement('p');
			newLine.classList.add('my-0');
			newLine.textContent = `${username}: ${message}`;
			chatArea.appendChild(newLine);
	
			if (chatArea.childNodes.length > 10) {
				chatArea.removeChild(chatArea.firstChild);
			}
		}
	})

	// socket updates game
	socket.on('updateGame', (lobbyFrom) => {
		if (lobbyFrom.id === lobby.id) {

			updateGame(lobby, cookies);
		} 
	})
}
