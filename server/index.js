// Packages
const express = require('express');
const path = require('path');
const os = require('os');
const networkInterfaces = os.networkInterfaces();
const https = require('https');
const http = require('http');

// - Setup express application -
const app = express();
app.use(express.static(path.join(__dirname, '../client')));

const getLocalExternalIP = () => {
	for (const iface of Object.values(networkInterfaces)) {
		for (const ifaceInfo of iface) {
			if (ifaceInfo.family === 'IPv4' && !ifaceInfo.internal) {
				return ifaceInfo.address;
			}
		}
	}
	return 'localhost';
};

// Create HTTPS server
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Start server
const LOCAL_IP = getLocalExternalIP();
server.listen(PORT, '0.0.0.0', () => {
	console.log(`Server running at: http://${LOCAL_IP}:${PORT}`);
});
