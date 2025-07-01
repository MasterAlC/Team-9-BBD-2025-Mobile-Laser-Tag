import { initCameraDetection } from "./cameraDetection.js";

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

            if (data.type === 'JOIN_CONFIRMED') {
                console.log(`Received confirmation to join game ${data.gameId}`)
                currentGameId = data.gameId;
                waitingRoomGameId.textContent = "Joined Game: " + currentGameId + " (Waiting for host to start...)";
                showScreen(waitingRoomScreen);
            }

            if (data.type === 'PLAYER_LIST_UPDATE') {
                playerList.innerHTML = '';
                /*data.players.forEach(p => {
                    const li = document.createElement('li');
                    li.textContent = p.id;
                    playerList.appendChild(li);
                });*/

                data.players.forEach(p => {
                    const li1 = document.createElement('li');
                    li1.textContent = p.name || p.id;
                    playerList.appendChild(li1);

                    const li2 = document.createElement('li');
                    li2.textContent = p.name || p.id;
                    hostPlayerList.appendChild(li2);
                });
            }

            if (data.type === 'GAME_START') {
                waitingMessage.textContent = 'Game Started! Good luck!';
            }
        };
    });

    document.getElementById('joinGameBtn').addEventListener('click', () => {
        showScreen(joinGameScreen);
    });

    startGameBtn.addEventListener('click', () => {
        socket.send(JSON.stringify({
            type: 'START_GAME',
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

            if (data.type === 'PLAYER_LIST_UPDATE') {
                playerList.innerHTML = '';
                data.players.forEach(p => {
                    const li = document.createElement('li');
                    li.textContent = p.id;
                    playerList.appendChild(li);
                });
            }

            if (data.type === 'GAME_START') {
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

});
