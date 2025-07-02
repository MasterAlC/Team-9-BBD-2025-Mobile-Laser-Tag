const Player = require("./Player");
const Team = require("./Team");
class Game {
  constructor(gameId) {
    this.gameId = gameId;
    this.shooters = new Map();
    this.GAME_DURATION = 5*60; //  5 minutes (TODO: make one minute for deployment)
    this.gameTimer = null;
    this.gameInProgress = false;
    this.blueTeamScore = 0;
    this.redTeamScore = 0;
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

  playerHitEventHandler(shooterId, color) {
    if (!this.gameInProgress) return;
    const shooter = this.shooters.get(shooterId);
    let score;
    if (!shooter) return;
    if (shooter.team !== color && color != 'blank') {
      // If the shooter is not on the team that was hit, ignore the event
      if (color === "blue") {
        this.redTeamScore += 1;
        score = this.redTeamScore;
      } else if(color === "red") {
        this.blueTeamScore++;
        score = this.blueTeamScore;
      }
      shooter.updateScore(1);
    }
    let playersList = this.getPlayerList();
    this.broadcastAll({
      type: "player_list_update",
      players: playersList,
      gameId: this.gameId,
      redTeamScore: this.redTeamScore,
      blueTeamScore: this.blueTeamScore
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