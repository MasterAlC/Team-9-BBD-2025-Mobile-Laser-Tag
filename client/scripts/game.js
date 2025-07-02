
import { initCameraDetection, updatePlayerScores, updatePlayerTime, updateTeamName, updateActionLabel } from "./player.js";
import { updateScores, updateTime, updateLobby } from "./spectate-script.js";

document.addEventListener('DOMContentLoaded', () => {
    let isHost = false;
    const homeScreen = document.getElementById('homeScreen');
    const createGameScreen = document.getElementById('createGameScreen');
    const joinGameScreen = document.getElementById('joinGameScreen');
    const waitingRoomScreen = document.getElementById('waitingRoomScreen');
    const playerViewScreen = document.getElementById('playerViewScreen')
    const spectatorViewScreen = document.getElementById('spectatorViewScreen')

    const usernameScreen = document.getElementById('usernameScreen');
    const usernameInput = document.getElementById('usernameInput');
    const continueBtn = document.getElementById('continueBtn');
    const hostPlayerList = document.getElementById('hostPlayerList');
  
    const screens = [usernameScreen, homeScreen, createGameScreen, joinGameScreen, waitingRoomScreen, playerViewScreen, spectatorViewScreen]

    // Initialize WebSocket connection
    const url = window.location
    console.log(url.host);

    const socket = new WebSocket(`wss://${url.host}`);
    
    // Intialise username and game ID variables
    let currentGameId = null;
    let playerName = null;

    // Player team can be 'red' or 'blue'
    // This will be set when the player joins a game
    let playerTeam = null;

    const createdGameCode = document.getElementById('createdGameCode');
    const startGameBtn = document.getElementById('startGameBtn');
    const joinGameCodeInput = document.getElementById('joinGameCodeInput');
    const waitingRoomGameId = document.getElementById('waitingRoomGameId');
    const playerList = document.getElementById('playerList');
    const waitingMessage = document.getElementById('waitingMessage');
    

    document.getElementById('createGameBtn').addEventListener('click', () => {
        isHost = true;
        socket.send(JSON.stringify({
            type: 'create_game'}));

        socket.onmessage = (msg) => {
            const data = JSON.parse(msg.data);
            console.log('Server →', data);

            if (data.type === 'game_created') {
                currentGameId = data.gameId;
                createdGameCode.textContent = data.gameId;
                showScreen(createGameScreen);
            }

            if (data.type === 'join_error') {
                // Display popup on cient that join was not successful
            }

            if (data.type === 'player_list_update') {
                playerList.innerHTML = '';
                /*data.players.forEach(p => {
                    const li = document.createElement('li');
                    li.textContent = p.id;
                    playerList.appendChild(li);
                });*/

                hostPlayerList.innerHTML = '';
                data.players.forEach(p => {
                    const li = document.createElement('li');
                    li.textContent = `${p.username}` +" (" + p.team + ")";
                    hostPlayerList.appendChild(li);
                });
            }

            if (data.type === 'game_started') {
                console.log("Game started host");
                startGame(); 

                waitingMessage.textContent = 'Game Started! Good luck!';
            }
        };
    });

    document.getElementById('joinGameBtn').addEventListener('click', () => {
        showScreen(joinGameScreen);
    });

    startGameBtn.addEventListener('click', () => {
        socket.send(JSON.stringify({
            type: 'start_game',
            gameId: currentGameId
        }));
    });

    document.getElementById('joinAsPlayerBtn').addEventListener('click', () => {
        joinGame('PLAYER');
    });

    document.getElementById('joinAsSpectatorBtn').addEventListener('click', () => {
        joinGame('SPECTATOR');
    });

    function joinGame(role) {
        const code = joinGameCodeInput.value.trim();
        if (!code) {
            showMessage("Please enter a game code!");
            return;
        }

        if (role == 'SPECTATOR') {
            // Send a message to the server to join as a spectator
            socket.send(JSON.stringify({
                type: 'player_join',
                username: playerName,
                gameId: code,
                role: 'spectator'
            }));
        }
        else if (role == 'PLAYER'){
            // Send a message to the server to join as a player
            socket.send(JSON.stringify({
                type: 'player_join',
                username: playerName,
                gameId: code,
                role: 'player'
            }));
        }

        socket.onmessage = (msg) => {
            const data = JSON.parse(msg.data);
            console.log('Server →', data);

            // Handle "join_confirmed" message from server
            if (data.type === 'join_confirmed') {
                console.log(`Received confirmation to join game ${data.gameId}`)
                currentGameId = data.gameId;
                // If player is a spectator, show the spectator screen

                if (role === 'SPECTATOR') {
                    console.log("Joining as spectator")
                    showScreen(spectatorViewScreen);
                }
                else if (role === 'PLAYER') {
                    // Store team information
                    playerTeam = data.team;
                    console.log(`Joined game ${data.gameId} as player on team ${playerTeam}`);
                    waitingRoomGameId.textContent = `Joined Game: ` + currentGameId + ` on team ${playerTeam} (Waiting for host to start...)`;
                    showScreen(waitingRoomScreen);
                }
            }

            if (data.type === 'player_list_update') {

                if (role == 'SPECTATOR') {
                    // Update the player list for spectators
                    updateScores(data.players);
                }
                else {
                    // Need to handle correct player list update depending on whether player is a 'player' or 'spectator'
                    playerList.innerHTML = '';
                    data.players.forEach(p => {
                        const li = document.createElement('li');
                        li.textContent = `${p.username}` +" (" + p.team + ")";
                        playerList.appendChild(li);
                    });
                }
            }

            if (data.type === 'game_started') {
                console.log("game should start");
                // TODO: Handle game started event
                startGame(); 
                // Transition to player view screen

                waitingMessage.textContent = 'Game Started! Enjoy!';
            }
        };
    }

    function showScreen(screen) {
        screens.forEach(s => {
            s.classList.add('hidden');
        });
        screen.classList.remove('hidden');
    }

    function showMessage(message) {
        const messageBox = document.getElementById('messageBox');
        const messageText = document.getElementById('messageText');
        messageText.textContent = message;
        messageBox.classList.remove('hidden');
    }

    function startGame() {
        showScreen(playerViewScreen)
        console.log("Starting Game...")
        if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
            console.log("Browser supports camera media access")
            initCameraDetection()
        }
        else {
            console.log("Browser does not support camera media access")
            resultLabel.innerText = "Browser does not support camera media access"
        }
    }

    document.getElementById('closeMessageBox').addEventListener('click', () => {
        document.getElementById('messageBox').classList.add('hidden');
    });

    document.getElementById('backToHomeFromCreateBtn').addEventListener('click', () => {
        showScreen(homeScreen);
    });

    document.getElementById('backToHomeFromJoinBtn').addEventListener('click', () => {
        showScreen(homeScreen);
    });

    document.getElementById('playButton').addEventListener('click', () => {
        startGame()
    })

    //Continue button listener for the username screen
    continueBtn.addEventListener('click', () => {
        const name = usernameInput.value.trim();
        if (!name) {
            showMessage("Please enter your name!");
            return;
        }

        playerName = name;
        socket.send(JSON.stringify({
            type: 'login',
            username: playerName
        }));

        showScreen(homeScreen);

    });

    //Leave game button listener for the spectator view
    document.getElementById('leaveButton').addEventListener('click', () => {
        socket.send(JSON.stringify({
            type: 'leave_game',
            gameId: currentGameId,
            username: playerName,
            role: 'spectator'
        }));

        currentGameId = null;
        showScreen(homeScreen);
    });

});
