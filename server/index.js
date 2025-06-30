// Packages
const express = require('express');
const path = require('path');

// Setup express application
const app = express();
app.use(express.static(path.join(__dirname, '../client')));

// Setup HTTP server and WebSocket Server
PORT = 3000;
const server = app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});

// Web socket stuff to send and receive
