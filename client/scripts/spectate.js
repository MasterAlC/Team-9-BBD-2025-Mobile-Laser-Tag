function spectateGame() {
    const messageBox = document.getElementById('messageBox');
    const messageText = document.getElementById('messageText');
    messageText.textContent = "Joining as a spectator...";
    messageBox.classList.remove('hidden');
}
