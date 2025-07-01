// Packages
const express = require('express');
const path = require('path');
const os = require('os');
const fs = require('fs');
const https = require('https');
const networkInterfaces = os.networkInterfaces();

// SSL Certificate
const options = {
  key: fs.readFileSync(path.join(__dirname, '../cert', 'server.key')),
  cert: fs.readFileSync(path.join(__dirname, '../cert', 'server.cert'))
};

// Setup express application
const app = express();
app.use(express.static(path.join(__dirname, '../client')));

const getLocalExternalIP = () => {
  for (const iface of Object.values(networkInterfaces)) {
    for (const ifaceInfo of iface) {
      if (ifaceInfo.family === 'IPv4' && !ifaceInfo.internal) {
        return ifaceInfo.address;
      }
    }
  }
  return 'localhost';
};

const Game = require('./Game');
const activeGames = {};

function createGame(gameId) {
  if (!activeGames[gameId]) {
    activeGames[gameId] = new Game(gameId);
  }
  return activeGames[gameId];
}

const addPlayer = (gameId, playerId, socket) => {
  const game = createGame(gameId);
  game.addPlayer(playerId, socket);
};

const startGame = (gameId) => {
  const game = activeGames[gameId];
  if (game) game.startGame();
};

const playerHitEventHandler = (gameId, shooterId, targetId) => {
  const game = activeGames[gameId];
  if (game) game.playerHitEventHandler(shooterId, targetId);
};

module.exports = {
  addPlayer,
  startGame,
  playerHitEventHandler
};

// Create HTTPS server
const PORT = process.env.PORT || 3000;
const server = https.createServer(options, app);

// Start server
const LOCAL_IP = getLocalExternalIP();
server.listen(PORT, () => {
  console.log(`Server running at: https://${LOCAL_IP}:${PORT}`);
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

    // Send player_join event
    data = {
        type: 'player_join',
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
                socket.username = data.username || 'anonymous';
                break;
            case 'player_join':
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