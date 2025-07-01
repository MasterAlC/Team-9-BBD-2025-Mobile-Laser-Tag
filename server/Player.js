class Player {
    constructor(id, socket) {
        this.id = id;
        this.socket = socket;
        this.score = 0;
        this.host = false; // Indicates if this player is the host
        this.spectator = false; // Indicates if this player is a spectator
    }

    updateScore(points) {
        this.score += points;
    }

    setHost(isHost) {
        this.host = isHost;
    }
    setSpectator(isSpectator) {
        this.spectator = isSpectator;
    }
    checkContradiction(){
        if (this.host && this.spectator) {
            this.socket.send(JSON.stringify({
                type: 'error',
                message: 'A player cannot be both a host and a spectator at the same time.'
            }));
            throw new Error("A player cannot be both a host and a spectator at the same time.");
        }
    }
}

module.exports = Player;