// Packages
const express = require("express");
const path = require("path");
const os = require("os");
const fs = require("fs");
const https = require("https");
const http = require("http");
const networkInterfaces = os.networkInterfaces();


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

// Create HTTPS server
const PORT = process.env.PORT || 3000;

let server;
if (PORT == 3000) {
  // Use HTTPS with self-signed certificate for local development
  const options = {
    key: fs.readFileSync(path.join(__dirname, "../cert", "server.key")),
    cert: fs.readFileSync(path.join(__dirname, "../cert", "server.cert")),
  };
  server = https.createServer(options, app);
}
else {
  // Use HTTP for production or non-local environments
  console.log("Running in production mode, using HTTP");
  server = http.createServer(app);
}

// Start server
const LOCAL_IP = getLocalExternalIP();
server.listen(PORT, () => {
  console.log(`Server running at: https://${LOCAL_IP}:${PORT}`);
});

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
    let gameId, game;
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
        gameId = uuidv4().slice(0, 6).toUpperCase(); // Generate a random game ID
        console.log(`Game created with ID: ${gameId}`);
        game = createGame(gameId);

        game.addPlayer(socket.id, socket);
        let player = game.getPlayer(socket.id);
        player.setHost(true);

        // Send game created event to the client (to display the game code)
        socket.send(
          JSON.stringify({
            type: "game_created",
            gameId: gameId,
            message: "Game created successfully!",
          })
        );
        
        // --- FIX: Send a join confirmation to the host with their team color. ---
        // This makes the host's experience consistent with a joining player.
        // It uses the correct `gameId` and adds the `team` property.
        socket.send(
            JSON.stringify({
              type: "join_confirmed",
              gameId: gameId, 
              message: `Joined game ${gameId} successfully as the host!`,
              team: player.team // Send the assigned team color
            })
          );

        // Broadcast the initial player list (containing just the host) to the new game room.
        const playerlist1 = activeGames.get(gameId).getPlayerList();
        activeGames
          .get(gameId)
          .broadcastAll(
            { type: "player_list_update", players: playerlist1 }
          );
        break;
      case "player_join":
        console.log(
          `Received request from: ${data.username} to join ${data.gameId}`
        );

        // Check if game ID is valid
        if (!data.gameId || !activeGames.get(data.gameId)) {
          // Game ID is NOT valid
          // Rename error message sent to client as "join_error"

          // Send "join_error" message to client
          socket.send(
            JSON.stringify({
              type: "join_error",
              message: "Game ID is invalid or does not exist.",
            })
          );

          // sendError(
          //   socket,
          //   `Either game ID ${data.gameId} does not exist or is not provided.`,
          //   "join_error"
          // );
          break;
        }

        // Game ID IS valid
        if (data.role == "spectator") {
          addPlayer(data.gameId, socket.id, socket, (isSpectator = true));
          socket.send(
            JSON.stringify({
              type: "join_confirmed",
              gameId: data.gameId,
              message: `Joined game ${data.gameId} successfully!, as spec`
            })
          );
          console.log("Spectator created")
        } else if (data.role == "player") {
          // Assign player to a team in the game
          addPlayer(data.gameId, socket.id, socket, (isSpectator = false));
          console.log("color:",activeGames.get(data.gameId).getPlayer(socket.id).team);
          socket.send(
            
            JSON.stringify({
              type: "join_confirmed",
              gameId: data.gameId,
              message: `Joined game ${data.gameId} successfully,as player!`,
              team: activeGames.get(data.gameId).getPlayer(socket.id).team,
            })
          );
          console.log(`Player ${socket.username} created`);
        } else {
          sendError(
            socket,
            `Cannot create a game without a defined player role: ${data.role} is not a valid role`,
            "join"
          );
          break;
        }

        // Send join confirmation to the client
        // TODO: Send player team with the join confirmed message
        // Broadcast all the player list to the clients
        let playerlist = activeGames.get(data.gameId).getPlayerList();

        // TODO: Fix player list update (sends message type 'PLAYER_LIST_UPDATE' and the playerList in the message data)
        // TODO: Send all player team information (low priority)
        activeGames
          .get(data.gameId)
          .broadcastAll(
            { type: "player_list_update", players: playerlist }
          );
        break;
      case "player_left":
        // Handle player left event
        console.log(`Player left: ${data.username}`);
        //players.delete(socket.id);
        break;
      case "player_hit":
        // Handle player hit event
        gameId = data.gameId;
        game = activeGames.get(gameId);
        color = data.color;
        game.playerHitEventHandler(socket.id, color)
        // Handle player hit event
        console.log(`${data.username} shot ${data.color}!`);
        break;
      case "start_game":
        // Handle start game event
        console.log("Game started");
            
        // Check if game ID is valid

        // Get correct game according to game ID
        const gameToStart = activeGames.get(data.gameId);
        // Start game
        console.log("Test3")
        if (gameToStart) {
          console.log("Test")
          gameToStart.startGame();
          console.log("Game started eco")
        } else {
          sendError(socket, `Cannot start game. Game with ID ${data.gameId} does not exist.`, 'start_game_error');
        }

        // Broadcast game start event to all players in the game
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
