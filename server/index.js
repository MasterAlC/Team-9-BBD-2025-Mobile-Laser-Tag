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

const Player = require('./Player');

const players = {};
const GAME_DURATION = 60;
let gameTimer = null;
let gameInProgress = false;

const addPlayer = (id, socket) => {
    players[id] = new Player(id, socket);
};

const startGame = () => {
    if (gameInProgress) return;
    gameInProgress = true;

    for (const id in players) {
        players[id].score = 0;
    }

    broadcastAll({ type: 'GAME_START' });

    let remainingTime = GAME_DURATION;
    const TICK_INTERVAL = 1000;

    gameTimer = setInterval(() => {
        remainingTime -= 1;

        broadcastAll({
            type: 'TIMER_TICK',
            timeLeftSeconds: Math.max(0, remainingTime)
        });

        if (remainingTime <= 0) {
            clearInterval(gameTimer);
            gameTimer = null;
            endGame();
        }
    }, TICK_INTERVAL);
};

const playerHitEventHandler = (shooterId, targetId) => {
    if (!gameInProgress) return;

    const shooter = players[shooterId];
    if (!shooter) return;

    shooter.updateScore(1);

    broadcastAll({
        type: 'SCORE_UPDATE',
        playerId: shooter.id,
        newScore: shooter.score
    });
};

const endGame = () => {
    gameInProgress = false;

    const winner = getWinner();
    broadcastAll({
        type: 'GAME_OVER',
        winnerId: winner?.id || null,
        score: winner?.score || 0
    });

    gameTimer = null;
};

const getWinner = () => {
    let maxScore = -Infinity;
    let winner = null;

    for (const id in players) {
        if (players[id].score > maxScore) {
            maxScore = players[id].score;
            winner = players[id];
        }
    }

    return winner;
};

const broadcastAll = (message) => {
    for (const id in players) {
        const socket = players[id].socket;
        if (socket && socket.readyState === 1) {
            socket.send(JSON.stringify(message));
        }
    }
};

module.exports = {
    addPlayer,
    startGame,
    playerHitEventHandler
};


// Web socket stuff to send and receive
