const Player = require("./Player");
const Team = require("./Team");
class Game {
  constructor(gameId) {
    this.gameId = gameId;
    this.shooters = new Map();
    this.GAME_DURATION = 5 * 60;
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
      if (socket && socket.readyState === 1) {
        // 1 means WebSocket.OPEN
        socket.send(JSONmessage);
      }
    }
    for (const spectator of this.spectators.values()) {
      const socket = spectator.socket;
      if (socket && socket.readyState === 1) {
        socket.send(JSONmessage);
      }
    }
  }

  addSpectator(id, socket) {
    this.spectators.set(id, new Player(id, socket));
    this.spectators.get(id).setSpectator(true);
  }
  addPlayer(id, socket) {
    this.shooters.set(id, new Player(id, socket));
    let player = this.shooters.get(id);
    player.team = this.side;
    this.side = this.side === "blue" ? "red" : "blue"; // Alternate sides for next player
  }
  
  removePlayer(playerId) {
    this.shooters.delete(playerId);
  }

  removeSpectator(spectatorId) {
    this.spectators.delete(spectatorId);
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
      team: player.team,
    }));
  }

  async startGame() {
    if (this.gameInProgress) return;
    this.gameInProgress = true;

        for (const player of this.shooters.values()) {
      player.score = 0;
    }
    this.redTeamScore = 0;
    this.blueTeamScore = 0;

    // NOTE: We now send an object to broadcastAll, which is safer.
    // I am also using the consistent message type 'GAME_START' from our previous discussion.
    this.broadcastAll({
      type: "game_started",
      gameId: this.gameId,
    });

    let remainingTime = this.GAME_DURATION;
    const TICK_INTERVAL = 1000;
    await new Promise((resolve) => {
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
          resolve("Game ended");
        }
      }, TICK_INTERVAL);
    });
    return "game_ended";
  }

  /*
| Event                     | Shooter Points| All Palyers | Description                                 |
|---------------------------|---------------|-------------|---------------------------------------------|
| Hit opposing team         | +5            | +2          | Reward for hitting an enemy player          |
| Hit own team (friendly)   | -5            | -1          | Penalty for friendly fire                   |
| Got shot by enemy         | --            | -3          | Penalty for getting hit                     |
| Missed shot               | -2            |  0          | Small penalty to encourage accuracy         |
*/

  playerHitEventHandler(shooterId, color) {
    if (!this.gameInProgress) return;
    const shooter = this.shooters.get(shooterId);
    if (!shooter) return;

    if (color === "blank") {
        // Event: Missed shot (-2 points for the shooter)
        shooter.updateScore(-2);

    } else if (shooter.team === color) {
        // Event: Hit own team / Friendly Fire
        // -5 points for the shooter.
        shooter.updateScore(-5);
        // -1 point for EACH player on the shooter's team (including the shooter again).
        for (const player of this.shooters.values()) {
            if (player.team === shooter.team) {
                player.updateScore(-1);
            }
        }

    } else { // shooter.team !== color
        // Event: Hit opposing team
        // +5 points for the shooter.
        shooter.updateScore(5);
        // +2 points for EACH player on the shooter's team.
        for (const player of this.shooters.values()) {
            if (player.team === shooter.team) {
                player.updateScore(2);
            }
        }

        // Event: Opponent got shot
        // -3 points for EACH player on the team that was hit.
        for (const player of this.shooters.values()) {
            if (player.team === color) { // 'color' is the team that was hit
                player.updateScore(-3);
            }
        }
    }
    
    this.recalculateTeamTotals();
    this.broadcastScoreUpdate();
  }

  recalculateTeamTotals() {
    this.redTeamScore = 0;
    this.blueTeamScore = 0;
    for (const player of this.shooters.values()) {
        if (player.team === 'red') {
            this.redTeamScore += player.score;
        } else if (player.team === 'blue') {
            this.blueTeamScore += player.score;
        }
    }
  }

  broadcastScoreUpdate() {
    let playersList = this.getPlayerList();
    this.broadcastAll({
      type: "player_list_update",
      players: playersList,
      gameId: this.gameId,
      redTeamScore: this.redTeamScore,
      blueTeamScore: this.blueTeamScore,
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
    if (this.blueTeamScore === this.redTeamScore) {
      return "draw";
    } else if (this.blueTeamScore > this.redTeamScore) {
      return "blue";
    } else {
      return "red";
    }
  }
}

module.exports = Game;
