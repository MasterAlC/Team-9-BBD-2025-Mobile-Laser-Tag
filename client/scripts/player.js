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
 * @param {string} detectedColor - The color detected by the camera ('RED', 'BLUE', 'BLANK').
 */
function sendShootMessage(detectedColor) {
    console.log(`Sending shoot message to server: Detected ${detectedColor}`);
    updateActionLabel(`Shot ${detectedColor}`);
}


function initCameraDetection(shootCallback) {
    const REGION_SIZE = 100;
    const COLOUR_THRESHOLD = 150;
    const PIXEL_COUNT_THRESHOLD = 500;
    
    // Select video, canvas, and result elements
    const video = document.getElementById('video');
    const resultDiv = document.getElementById('result');
    const shootButton = document.getElementById('shootButton');

    // Create hidden canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Gain access to video stream
    navigator.mediaDevices.getUserMedia({video: {facingMode: "environment"}}).then(stream => {
        video.srcObject = stream;
        console.log(video)
    })
    .catch(err => {
        resultDiv.innerText = 'Camera access denied';
        console.error(err)
    })

    function detectColor() {

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const startX = Math.floor(centerX - REGION_SIZE / 2);
        const startY = Math.floor(centerY - REGION_SIZE / 2);

        const imageData = ctx.getImageData(startX, startY, REGION_SIZE, REGION_SIZE);
        const data = imageData.data;

        let redCount = 0;
        let blueCount = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          if (r > COLOUR_THRESHOLD && r > g + 30 && r > b + 30) redCount++;
          else if (b > COLOUR_THRESHOLD && b > g + 30 && b > r + 30) blueCount++;
        }

        if (redCount > blueCount && redCount > PIXEL_COUNT_THRESHOLD) {
          //resultDiv.innerText = '🔴 Shot red';
          return "RED"
        } else if (blueCount > redCount && blueCount > PIXEL_COUNT_THRESHOLD) {
          //resultDiv.innerText = '🔵 Shot blue';
          return "BLUE"
        } else {
          //resultDiv.innerText = 'Blank shot';
          return "BLANK"
        }

        //requestAnimationFrame(detectColor)
    }

    // video.addEventListener('play', () => {
    //    requestAnimationFrame(detectColor);
    // });
    shootButton.addEventListener('click', () => {
      console.log('Shoot button pressed!'); 
      let colour = detectColor();
      // Original shoot function call, now redirected to shootCallback
      if (shootCallback) {
          shootCallback(colour);
      }
    });
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
    updateActionLabel("Game Over!"); // Optionally update the action label
    updatePlayerTime(0); // Set time to 0
    console.log("Game ended. Leave button visible, Shoot button deactivated.");
}


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {

    initCameraDetection(sendShootMessage); // Pass the shoot callback

    // Close Message Box listener
    document.getElementById('closeMessageBox').addEventListener('click', hideMessageBox);

    document.getElementById('leaveGamePlayerBtn').addEventListener('click', () => {
        showMessageBox("Leaving game...");
    });
    const DUMMY_PLAYERS = [
    { name: "PlayerOne", score: 10, team: "red" },
    { name: "PlayerTwo", score: 5, team: "blue" },
    { name: "PlayerThree", score: 15, team: "red" },
    { name: "PlayerFour", score: 8, team: "blue" },
    { name: "PlayerFive", score: 2, team: "red" }
    ];

    // Initialize UI with default values
    updatePlayerScores(DUMMY_PLAYERS); // Initialize with an empty array to show 0 for both teams
    updatePlayerTime(90);
    updateActionLabel("Aim and Shoot!");
    updateTeamName("BLUE", "blue"); // Default team

    // Ensure leave button is hidden on start (add 'hidden' class to it in HTML initially)
    // if not already present
    const leaveButton = document.getElementById('leaveGamePlayerBtn');
    if (leaveButton && !leaveButton.classList.contains('hidden')) {
        leaveButton.classList.add('hidden');
    }

});

export { updatePlayerScores, updatePlayerTime, updateActionLabel, updateTeamName, showMessageBox, hideMessageBox, endGame };