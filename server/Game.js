const Player = require("./Player");
const Team = require("./Team");
class Game {
  constructor(gameId) {
    this.gameId = gameId;
    this.players = new Map();
    this.GAME_DURATION = 60;
    this.gameTimer = null;
    this.gameInProgress = false;
    this.blueTeam = new Team("Blue", "#0000FF");
    this.redTeam = new Team("Red", "#FF0000");
    this.spectators = new Map(); // List of spectators
  }
  //Receives a Json message and broadcasts it to all players
  broadcastAll(JSONmessage) {
    for (const player of this.players.values()) {
        const socket = player.socket;
        if (socket && socket.readyState === 1) {
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
    this.spectators[id] = new Player(id, socket);
    this.spectators.get(id).setSpectator(true);
  }
  addPlayer(id, socket) {
    this.players.set(id, new Player(id, socket));
  }

  getPlayer(id) {
    return this.players.get(id) || null;
  }

  getPlayerList() {
    return Array.from(this.players.values()).map((player) => ({
      id: player.id,
      score: player.score,
      host: player.host,
      spectator: player.spectator,
    }));
  }

  startGame() {
    if (this.gameInProgress) return;
    this.gameInProgress = true;

    for (const id in this.players) {
      this.players(id).score = 0;
    }

    this.broadcastAll({ type: "GAME_START", gameId: this.gameId });

    let remainingTime = this.GAME_DURATION;
    const TICK_INTERVAL = 1000;

    this.gameTimer = setInterval(() => {
      remainingTime -= 1;

      this.broadcastAll({
        type: "TIMER_TICK",
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

    const shooter = this.players.get(shooterId);
    if (!shooter) return;

    shooter.updateScore(1);

    this.broadcastAll({
      type: "SCORE_UPDATE",
      playerId: shooter.id,
      newScore: shooter.score,
      gameId: this.gameId,
    });
  }

  endGame() {
    this.gameInProgress = false;

    const winner = this.getWinner();
    this.broadcastAll({
      type: "GAME_OVER",
      winnerId: winner?.id || null,
      score: winner?.score || 0,
      gameId: this.gameId,
    });

    clearInterval(this.gameTimer);
    this.gameTimer = null;
  }

  getWinner() {
    let maxScore = -Infinity;
    let winner = null;

    for (const id in this.players) {
      if (this.players.get(id).score > maxScore) {
        maxScore = this.players.get(id).score;
        winner = this.players.get(id);
      }
    }
    return winner;
  }
}

module.exports = Game;
