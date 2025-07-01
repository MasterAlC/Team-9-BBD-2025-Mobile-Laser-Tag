class Player {
    constructor(id, socket) {
        this.id = id;
        this.socket = socket;
        this.score = 0;
    }

    updateScore(points) {
        this.score += points;
    }
}

module.exports = Player;