/**
 * Formats seconds into a MM:SS string (e.g., 120 seconds becomes "02:00").
 * @param {number} seconds - The total seconds.
 * @returns {string} Formatted time string.
 */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

/**
 * Displays a custom message box overlay on the screen.
 * @param {string} message - The message text to display.
 */
function showMessageBox(message) {
    const messageBox = document.getElementById('messageBox');
    const messageText = document.getElementById('messageText');
    messageText.textContent = message;
    messageBox.classList.remove('hidden');
}

/**
 * Hides the custom message box overlay.
 */
function hideMessageBox() {
    const messageBox = document.getElementById('messageBox');
    messageBox.classList.add('hidden');
}

// --- Background Animation ---
document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    // Removed the setInterval block that changes the hue,
    // so the background gradient will remain static as defined in CSS.
});

// --- Server Integration Functions ---

/**
 * Updates player scores and team scores based on the provided players array.
 * Players are sorted into their respective team tables (Red/Blue) and overall team scores are tallied.
 * @param {Array<Object>} players - An array of player objects, each with { username: string, score: number, team: 'red' | 'blue' }.
 */
function updateScores(players) {
    const redTeamPlayersBody = document.getElementById('redTeamPlayersBody');
    const blueTeamPlayersBody = document.getElementById('blueTeamPlayersBody');
    const redTeamScoreDisplay = document.getElementById('redTeamScore');
    const blueTeamScoreDisplay = document.getElementById('blueTeamScore');

    redTeamPlayersBody.innerHTML = '';
    blueTeamPlayersBody.innerHTML = '';

    let redTeamTotalScore = 0;
    let blueTeamTotalScore = 0;

    const redTeamPlayers = players.filter(player => player.team === 'red').sort((a, b) => b.score - a.score);
    const blueTeamPlayers = players.filter(player => player.team === 'blue').sort((a, b) => b.score - a.score);

    redTeamPlayers.forEach((player, index) => {
        const row = document.createElement('tr');
        // No rank suffix for simplicity as per sketch, just rank number
        const rank = index + 1;

        row.innerHTML = `
            <td>${rank}</td>
            <td>${player.username}</td>
            <td>${player.score}</td>
        `;
        redTeamPlayersBody.appendChild(row);
        redTeamTotalScore += player.score;
    });

    blueTeamPlayers.forEach((player, index) => {
        const row = document.createElement('tr');
        // No rank suffix for simplicity as per sketch, just rank number
        const rank = index + 1;

        row.innerHTML = `
            <td>${rank}</td>
            <td>${player.username}</td>
            <td>${player.score}</td>
        `;
        blueTeamPlayersBody.appendChild(row);
        blueTeamTotalScore += player.score;
    });

    redTeamScoreDisplay.textContent = `Score: ${redTeamTotalScore}`;
    blueTeamScoreDisplay.textContent = `Score: ${blueTeamTotalScore}`;

    console.log("Player and team scores updated.");
}

function updateTime(seconds) {
    document.getElementById('gameTimer').textContent = formatTime(seconds);
    console.log(`Game time updated to ${formatTime(seconds)}`);
}

function updateLobby(lobbyNumber) {
    document.getElementById('lobbyNumber').textContent = `Lobby: ${lobbyNumber}`;
    console.log(`Lobby number updated to: ${lobbyNumber}`);
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    updateScores([]); // Initialize with empty scores
    updateTime(0);
    updateLobby('Connecting...');
});

export {updateTime, updateScores, updateLobby};