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
