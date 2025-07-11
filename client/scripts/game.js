import { updatePlayerScores, updatePlayerTime, updateTeamName, updateActionLabel, endGame } from "./player.js";
import { updateScores, updateTime, updateLobby } from "./spectate-script.js";
import { initCameraDetection, detectColor } from "./cameraDetection.js";

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

    const shootButton = document.getElementById('shootButton');

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

            if (data.type === 'join_confirmed') {
                playerTeam = data.team;
            }

            if (data.type === 'join_error') {
                // Display popup on cient that join was not successful
                showMessage(data.message);
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

                updatePlayerScores(data.players)
            }

            if (data.type === 'timer_tick'){
                updatePlayerTime(data.timeLeftSeconds);
            }

            if (data.type === 'game_started') {
                console.log("Game started host");
                startGame(); 
                console.log(playerTeam);
                updateTeamName(String(playerTeam), "white");
                updatePlayerScores([]);
            }

            if (data.type === 'game_over') {
                console.log("game over");
                if (data.winner==="draw") {
                    updateActionLabel("Game Over! Draw!");
                }
                else{
                    updateActionLabel("Game Over! Winner is: "+ data.winner+"!");
                }
                
                endGame();
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
        const code = joinGameCodeInput.value.trim().toUpperCase();
        joinGameCodeInput.value = ''; // Clear input field after reading
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

            // Handle "join_error" message from server
            if (data.type === 'join_error') {
                showMessage(data.message);
                return; // Stop further processing
            }

            // Handle "join_confirmed" message from server
            if (data.type === 'join_confirmed') {
                console.log(`Received confirmation to join game ${data.gameId}`)
                currentGameId = data.gameId;
                // If player is a spectator, show the spectator screen

                if (role === 'SPECTATOR') {
                    console.log("Joining as spectator")
                    showScreen(spectatorViewScreen);
                    updateLobby(currentGameId)
                }
                else if (role === 'PLAYER') {
                    // Store team information
                    playerTeam = data.team;
                    console.log(`Joined game ${data.gameId} as player on team ${playerTeam}`);
                    waitingRoomGameId.textContent = `Joined Game: ` + currentGameId + ` on team ${playerTeam} (Waiting for host to start...)`;
                    showScreen(waitingRoomScreen);
                }
            }

            if (data.type === 'timer_tick'){
                updatePlayerTime(data.timeLeftSeconds);
                updateTime(data.timeLeftSeconds);
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

                    updatePlayerScores(data.players)
                }
            }

            if (data.type === 'game_started' && role === 'PLAYER') {
                console.log("game should start");
                startGame(); 
                console.log(playerTeam);
                updateTeamName(String(playerTeam), "white");
                updatePlayerScores([]);
            }

            if (data.type === 'game_over' && role === 'PLAYER') {
                console.log("game over");
                if (data.winner==="draw") {
                    updateActionLabel("Game Over! Draw!");
                }
                else{
                    updateActionLabel("Game Over! Winner is: "+ data.winner+"!");
                }
                
                endGame();
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
        updateActionLabel('')
        if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
            console.log("Browser supports camera media access")
            // Get camera access and initialise video
            initCameraDetection()
            
            // Enable button to send shoot messages
            shootButton.addEventListener('click', () => {
                let detectedColour = detectColor();
                
                if (detectedColour == "red") {
                    updateActionLabel('HEADSHOT! You shot RED 🔴!')
                }
                else if (detectedColour == "blue") {
                    updateActionLabel('HEADSHOT! You shot BLUE 🔵!')
                }
                else if (detectedColour == "blank") {
                    updateActionLabel('Blank shot')
                }

                console.log("Sending shoot signal to server. Detected color:", detectedColour);               
                socket.send(JSON.stringify({
                    type: 'player_hit',
                    gameId: currentGameId,
                    color: detectedColour,
                    username: playerName
                }))
            });
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
    
    //Leave game button listener for the player view (after game over)
    document.getElementById('leaveGamePlayerBtn').addEventListener('click', () => {
        if (currentGameId) {
            socket.send(JSON.stringify({
                type: 'leave_game',
                gameId: currentGameId,
                username: playerName,
                role: 'player'
            }));
        }

        currentGameId = null;
        // Reset buttons and UI for a new game
        const shootButton = document.getElementById('shootButton');
        if (shootButton) {
            shootButton.disabled = false;
            shootButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
        document.getElementById('leaveGamePlayerBtn').classList.add('hidden');
        showScreen(homeScreen);
    });
});