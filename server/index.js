// Packages
const express = require('express');
const path = require('path');

// Setup express application
const app = express();
app.use(express.static(path.join(__dirname, '../client')));

// Setup HTTP server and WebSocket Server
PORT = 3000;
const server = app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});

// Web socket stuff to send and receive
const { WebSocketServer } = require('ws');
const ws = new WebSocketServer({server });
const { v4: uuidv4 } = require('uuid'); // For generating unique IDs for clients

const players = new Map(); 

function timerBroadcast(ws){
    const initalTime = 60; // Initial time in seconds
    while(initalTime > 0){
        ws.clients.forEach((client) => {
        
            if (client.readyState === client.OPEN) {
                const timerData = {
                    type: 'timer_update',
                    timeRemaining: initalTime
                };
                client.send(JSON.stringify(timerData));
            }
        });
        initalTime--;
    }
}
ws.on('connection', (socket) => {
    socket.id = uuidv4(); // Assign a unique ID to the socket
    
    players.set(socket.id, socket);
    let data = {
    type: 'login',
    message: 'Welcome to the game server!',
    };
    socket.send(JSON.stringify(data));

    // Send join_game event
    data = {
        type: 'join_game',
        message: 'You have joined the game!',
    };
    socket.send(JSON.stringify(data));

    // Send player_left event
    data = {
        type: 'player_left',
        message: 'You have left the game.',
    };
    socket.send(JSON.stringify(data));

    // Send player_hit event
    data = {
        type: 'player_hit',
        message: 'You have been hit!',
    };
    socket.send(JSON.stringify(data));

    // Send start_game event
    data = {
        type: 'start_game',
        message: 'The game has started!',
    };
    socket.send(JSON.stringify(data));



    socket.on('message', function incoming(message) {
        let data;
        try {
            data = JSON.parse(message);
        } catch (e) {
            console.log('Invalid JSON:', message);
            return;
        }
        // Handle different event types
        switch(data.type){
            case 'login':
                // Handle player login event
                console.log(`Player logged in: ${data.username}`);
                socket.username = data.username;
                break;
            case 'join_game':
                // Handle player joined event
                console.log(`Player joined: ${data.username}`);
                break;
            case 'player_left':
                // Handle player left event
                console.log(`Player left: ${data.username}`);
                players.delete(socket.id);
                break;
            case 'player_hit':
                // Handle player hit event
                console.log(`Player hit: ${data.username}`);
                break;
            case 'start_game':
                // Handle start game event
                console.log('Game started');
                break;
            default:
                (data.type === null || data.type === undefined) ?
                socket.send("Either event is Null or Undefined") :
                socket.send('Unknown event type:');
                console.log(`Unknown event type: ${data.type}`);
                break;
        }
        socket.username = data.username || 'Anonymous';
    });

    // Player hit socket handler

    // Start game socket handler
    //Spectator socket handler
    //Create game
    //join games
    //
    socket.on('close', () => {
        console.log('WebSocket client disconnected: ' + socket._socket.remoteAddress);
    });
});

//Start game
//Upddate game state
//End game state
//Send game state to clients
//Handle client connections and disconnections