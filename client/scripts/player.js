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

// --- UI Update Functions ---

/**
 * Updates the total scores displayed on the player's screen by processing
 * the full players array (same as spectator).
 * @param {Array<Object>} players - An array of player objects, each with { name: string, score: number, team: 'red' | 'blue' }.
 */
function updatePlayerScores(players) {
    const redScoreDisplay = document.querySelector('#playerViewScreen .text-red-500');
    const blueScoreDisplay = document.querySelector('#playerViewScreen .text-blue-500');

    let redTeamTotalScore = 0;
    let blueTeamTotalScore = 0;

    players.forEach(player => {
        if (player.team === 'red') {
            redTeamTotalScore += player.score;
        } else if (player.team === 'blue') {
            blueTeamTotalScore += player.score;
        }
    });

    if (redScoreDisplay) {
        redScoreDisplay.textContent = `RED: ${redTeamTotalScore}`;
    }
    if (blueScoreDisplay) {
        blueScoreDisplay.textContent = `BLUE: ${blueTeamTotalScore}`;
    }
}

/**
 * Updates the game timer displayed on the player's screen.
 * @param {number} seconds - The total seconds remaining.
 */
function updatePlayerTime(seconds) {
    const playerStatusLabel = document.getElementById('playerStatusLabel');
    if (playerStatusLabel) {
        playerStatusLabel.textContent = `Time Left: ${formatTime(seconds)}`;
    }
}

/**
 * Updates the action message displayed under the shoot button.
 * @param {string} message - The message to display (e.g., "You hit RED!").
 */
function updateActionLabel(message) {
    const callActionMessage = document.getElementById('callActionMessage');
    if (callActionMessage) {
        callActionMessage.textContent = message;
    }
}

/**
 * Updates the player's team name label.
 * @param {string} teamName - The player's team name (e.g., "RED", "BLUE").
 * @param {string} color - The CSS color for the text (e.g., "red", "blue", "#FF0000").
 */
function updateTeamName(teamName, color) {
    const teamNameLabel = document.getElementById('teamNameLabel');
    if (teamNameLabel) {
        teamNameLabel.textContent = `Your Team: ${teamName}`;
        teamNameLabel.style.color = color;
        teamNameLabel.style.textShadow = `0 0 8px ${color}`;
    }
}

/**
 * Function to handle the end of the game.
 * Makes the leave button visible and deactivates the shoot button.
 */
function endGame() {
    const leaveButton = document.getElementById('leaveGamePlayerBtn');
    const shootButton = document.getElementById('shootButton');

    if (leaveButton) {
        leaveButton.classList.remove('hidden'); // Make leave button visible
    }
    if (shootButton) {
        shootButton.disabled = true; // Deactivate shoot button
        shootButton.classList.add('opacity-50', 'cursor-not-allowed'); // Visual feedback for disabled
    }
    updateActionLabel("Game Over!");
    updatePlayerTime(0);
    console.log("Game ended. Leave button visible, Shoot button deactivated.");
}

export { updatePlayerScores, updatePlayerTime, updateActionLabel, updateTeamName, showMessageBox, hideMessageBox, endGame};