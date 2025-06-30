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

// Web socket stuff to send and receive
