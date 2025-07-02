class Team {
    constructor(name, color) {
        this.name = name;
        this.color = color;
        this.players = {};
        this.score = 0; 
    }

    addTeamPlayer(player) {
        this.players.push(player);
    }

    removeTeamPlayer(playerId) {
        this.players = this.players.filter(player => player.id !== playerId);
    }

    getPlayers() {
        return this.players;
    }

    getTeamInfo() {
        return {
            name: this.name,
            color: this.color,
            players: this.getPlayers()
        };
    }
}

module.exports = Team;