import {initCameraDetection} from './cameraDetection.js'

console.log("Starting client application")

const playButton = document.getElementById('playButton')
const resultLabel = document.getElementById('result')

function protoShowScreen(screenId) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'))
    document.getElementById(screenId).classList.add('active')
}

function startGame() {
    protoShowScreen('player-view')
    console.log("Starting Game...")
    if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
        console.log("Browser supports camera media access")
        initCameraDetection()
    }
    else {
        console.log("Browser does not support camera media access")
        resultLabel.innerText = "Browser does not support camera media access"
    }
}

function spectateGame() {
    const messageBox = document.getElementById('messageBox');
    const messageText = document.getElementById('messageText');
    messageText.textContent = "Joining as a spectator...";
    messageBox.classList.remove('hidden');
}

function hideMessageBox() {
    document.getElementById('messageBox').classList.add('hidden');
}

// Set up buttons and event listeneners
playButton.addEventListener('click', startGame)
