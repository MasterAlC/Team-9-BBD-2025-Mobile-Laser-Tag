class Game {
    constructor(gameId) {
        this.gameId = gameId;
        this.players = {};
        this.GAME_DURATION = 60; 
        this.gameTimer = null;
        this.gameInProgress = false;
    }

    addPlayer(id, socket) {
        this.players[id] = new Player(id, socket);
    }

    startGame() {
        if (this.gameInProgress) return;
        this.gameInProgress = true;

        for (const id in this.players) {
            this.players[id].score = 0;
        }

        this.broadcastAll({ type: 'GAME_START', gameId: this.gameId });

        let remainingTime = this.GAME_DURATION;
        const TICK_INTERVAL = 1000; 

        this.gameTimer = setInterval(() => {
            remainingTime -= 1;

            this.broadcastAll({
                type: 'TIMER_TICK',
                timeLeftSeconds: Math.max(0, remainingTime),
                gameId: this.gameId
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

        const shooter = this.players[shooterId];
        if (!shooter) return;

        shooter.updateScore(1);

        this.broadcastAll({
            type: 'SCORE_UPDATE',
            playerId: shooter.id,
            newScore: shooter.score,
            gameId: this.gameId
        });
    }

    endGame() {
        this.gameInProgress = false;

        const winner = this.getWinner();
        this.broadcastAll({
            type: 'GAME_OVER',
            winnerId: winner?.id || null,
            score: winner?.score || 0,
            gameId: this.gameId
        });

        clearInterval(this.gameTimer);
        this.gameTimer = null;
    }

    getWinner() {
        let maxScore = -Infinity;
        let winner = null;

        for (const id in this.players) {
            if (this.players[id].score > maxScore) {
                maxScore = this.players[id].score;
                winner = this.players[id];
            }
        }

        return winner;
    }

    broadcastAll(message) {
        for (const id in this.players) {
            const socket = this.players[id].socket;
            if (socket && socket.readyState === 1) {
                socket.send(JSON.stringify(message));
            }
        }
    }
}

module.exports = Game;