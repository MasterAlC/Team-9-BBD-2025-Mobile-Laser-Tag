// Packages
const express = require("express");
const path = require("path");
const os = require("os");
const fs = require("fs");
const https = require("https");
const networkInterfaces = os.networkInterfaces();

// SSL Certificate
const options = {
  key: fs.readFileSync(path.join(__dirname, "../cert", "server.key")),
  cert: fs.readFileSync(path.join(__dirname, "../cert", "server.cert")),
};

// Setup express application
const app = express();
app.use(express.static(path.join(__dirname, "../client")));

const getLocalExternalIP = () => {
  for (const iface of Object.values(networkInterfaces)) {
    for (const ifaceInfo of iface) {
      if (ifaceInfo.family === "IPv4" && !ifaceInfo.internal) {
        return ifaceInfo.address;
      }
    }
  }
  return "localhost";
};

const Game = require("./Game");
const activeGames = new Map();

function createGame(gameId) {
  if (!activeGames.get(gameId)) {
    activeGames.set(gameId, new Game(gameId));
  }
  return activeGames.get(gameId);
}

const addPlayer = (gameId, playerId, socket, isSpectator) => {
  const game = activeGames.get(gameId);
  if (!game) {
    console.error(`Game with ID ${gameId} does not exist.`);
    return;
  }
  isSpectator
    ? game.addSpectator(playerId, socket)
    : game.addPlayer(playerId, socket);
  console.log(`Player ${playerId} added to game ${gameId}.`);
};

const startGame = (gameId) => {
  const game = activeGames.get(gameId);
  if (game) {
    game.startGame();
    return True;
  } else return False;
};

const playerHitEventHandler = (gameId, shooterId, targetId) => {
  const game = activeGames.get(gameId);
  if (game) game.playerHitEventHandler(shooterId, targetId);
};

module.exports = {
  addPlayer,
  startGame,
  playerHitEventHandler,
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
const { WebSocketServer } = require("ws");
const ws = new WebSocketServer({ server });
const { v4: uuidv4 } = require("uuid"); // For generating unique IDs for clients
const { error } = require("console");

sendError = (socket, message, protocol) => {
  socket.send(
    JSON.stringify({
      type: "error",
      message: message,
      protocol: protocol || null, // Optional protocol field to indicate where the error originated
    })
  );
  console.error(`${message} \nProtocol: ${protocol || "Unknown"}`);
};
ws.on("connection", (socket) => {
  socket.on("message", function incoming(message) {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.log("Invalid JSON:", message);
      return;
    }
    // Handle different event types
    switch (data.type) {
      case "login":
        let id = uuidv4(); // Assign a unique ID to the socket
        socket.id = id;
        // Handle player login event
        console.log(`Player logged in: ${data.username}`);
        socket.username = data.username || "anonymous";
        socket.send(
          JSON.stringify({
            type: "login_success",
          })
        );
        break;
      case "create_game":
        // Handle create game event
        const gameId = uuidv4().slice(0, 6).toUpperCase(); // Generate a random game ID
        console.log(`Game created with ID: ${gameId}`);
        const game = createGame(gameId);

        game.addPlayer(socket.id, socket);
        let player = game.getPlayer(socket.id);
        player.setHost(true);
        // Send game created event to the client
        socket.send(
          JSON.stringify({
            type: "game_created",
            gameId: gameId,
            message: "Game created successfully!",
          })
        );
        //DOES THE HOST NEED TO SEE HOW MANY PEOPLE JOINED?
        break;
      case "join":
        console.log(
          `Received request from: ${data.username} to join ${data.gameId}`
        );
        if (!data.gameId || !activeGames.get(data.gameId)) {
          sendError(
            socket,
            `Either game ID ${data.gameId} does not exist or is not provided.`,
            "join"
          );
          break;
        }
        if (data.role == "spectator") {
          addPlayer(data.gameId, socket.id, socket, (isSpectator = true));
        } else if (data.role == "player") {
          addPlayer(data.gameId, socket.id, socket, (isSpectator = false));
        } else {
          sendError(
            socket,
            `Cannot create a game without a defined player role: ${data.role} is not a valid role`,
            "join"
          );
          break;
        }
        // Broadcast all the player list to the clients
        let playerlist = activeGames.get(data.gameId).getPlayerList();
        activeGames.get(data.gameId).broadcastAll(JSON.stringify(playerlist));
        break;
      case "player_left":
        // Handle player left event
        console.log(`Player left: ${data.username}`);
        //players.delete(socket.id);
        break;
      case "player_hit":
        // Handle player hit event
        console.log(`Player hit: ${data.username}`);
        break;
      case "start_game":
        // Handle start game event
        console.log("Game started");
        break;
      default:
        data.type === null || data.type === undefined
          ? socket.send("Either event is Null or Undefined")
          : socket.send("Unknown event type:");
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
  socket.on("close", () => {
    console.log(
      "WebSocket client disconnected: " + socket._socket.remoteAddress
    );
  });
});

//Start game
//Upddate game state
//End game state
//Send game state to clients
//Handle client connections and disconnections
