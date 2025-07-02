const Player = require("./Player");
const Team = require("./Team");
class Game {
  constructor(gameId) {
    this.gameId = gameId;
    this.shooters = new Map();
    this.GAME_DURATION = 60;
    this.gameTimer = null;
    this.gameInProgress = false;
    this.blueTeam = new Team("Blue", "#0000FF");
    this.redTeam = new Team("Red", "#FF0000");
    this.spectators = new Map(); // List of spectators
    this.side = "blue"; // Default side for shooters joining the game
  }


  // CHANGED: This function now accepts a JavaScript object and handles stringifying it.
  // This prevents crashes from sending an object directly over the socket.
  broadcastAll(messageObject) {
    const JSONmessage = JSON.stringify(messageObject); // Convert the object to a string HERE.
    for (const player of this.shooters.values()) {
        const socket = player.socket;
        if (socket && socket.readyState === 1) { // 1 means WebSocket.OPEN
            socket.send(JSONmessage);
        }
    }
    for(const spectator of this.spectators.values()) {
        const socket = spectator.socket;
        if (socket && socket.readyState === 1) {
            socket.send(JSONmessage);
        }
    }
  }
  
  addSpectator(id, socket) {
    this.spectators.set(id, new Player(id, socket))
    this.spectators.get(id).setSpectator(true);
  }
  addPlayer(id, socket) {
    this.shooters.set(id, new Player(id, socket));
    let player = this.shooters.get(id);
    player.team = this.side;
    this.side = (this.side === "blue") ? "red" : "blue"; // Alternate sides for next player
  }

  getPlayer(id) {
    return this.shooters.get(id);
  }

  getPlayerList() {
    return Array.from(this.shooters.values()).map((player) => ({
      id: player.id,
      score: player.score,
      host: player.host,
      username: player.socket.username,
      spectator: player.spectator,
      team: player.team
    }));
  }

  startGame() {
    if (this.gameInProgress) return;
    this.gameInProgress = true;

    for (const player of this.shooters.values()) {
      player.score = 0;
    }

    // NOTE: We now send an object to broadcastAll, which is safer.
    // I am also using the consistent message type 'GAME_START' from our previous discussion.
    this.broadcastAll({ 
        type: "game_started", 
        gameId: this.gameId
    });

    let remainingTime = this.GAME_DURATION;
    const TICK_INTERVAL = 1000;

    this.gameTimer = setInterval(() => {
      remainingTime -= 1;

      // This call is now correct because broadcastAll expects an object.
      this.broadcastAll({
        type: "timer_tick",
        timeLeftSeconds: Math.max(0, remainingTime),
        gameId: this.gameId,
      });

      if (remainingTime <= 0) {
        clearInterval(this.gameTimer);
        this.gameTimer = null;
        this.endGame();
      }
    }, TICK_INTERVAL);
  }

  playerHitEventHandler(shooterId, targetId) {
    if (!this.gameInProgress) return;

    const shooter = this.shooters.get(shooterId);
    if (!shooter) return;

    shooter.updateScore(1);

    this.broadcastAll({
      type: "score_update",
      players: this.getPlayerList() // Send the whole list so scores update everywhere
    });
  }

  endGame() {
    this.gameInProgress = false;

    const winner = this.getWinner();
    this.broadcastAll({
      type: "game_over",
      winner: winner, // Send the whole winner object
      players: this.getPlayerList(),
      gameId: this.gameId,
    });

    clearInterval(this.gameTimer);
    this.gameTimer = null;
  }

  getWinner() {
    let maxScore = -Infinity;
    let winner = null;

    // Corrected loop for iterating over a Map's values
    for (const player of this.shooters.values()) {
      if (player.score > maxScore) {
        maxScore = player.score;
        winner = player;
      }
    }
    return winner;
  }
}

module.exports = Game;