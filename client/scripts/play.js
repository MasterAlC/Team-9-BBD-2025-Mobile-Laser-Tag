function playGame() {
    const messageBox = document.getElementById('messageBox');
    const messageText = document.getElementById('messageText');
    messageText.textContent = "Starting game... Get ready!";
    messageBox.classList.remove('hidden');
}
