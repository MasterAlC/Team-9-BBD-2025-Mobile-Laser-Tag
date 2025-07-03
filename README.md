# HEADSHOTS! Mobile Laser Tag

Welcome to **HEADSHOTS! Mobile Laser Tag**, a real-time, web-based multiplayer laser tag game that uses your phone's camera to turn any space into an interactive arena. Built with Node.js, Express, and WebSockets, this project brings the thrill of laser tag right to your mobile browser.

## Features

- **Real-time Multiplayer:** Engage in fast-paced gameplay powered by WebSockets for instant communication between players.
- **Game Lobbies:** Easily create a private game room and share a unique code with friends to join.
- **Two Ways to Play:** Join the action as a **Player** on the Red or Blue team, or join as a **Spectator** to watch the game unfold from a live scoreboard.
- **Camera-Based Hit Detection:** Uses your phone's camera and color detection to register "hits" on colored targets.
- **Team-Based Scoring:** Work with your team to outscore the opposition. A detailed scoring system rewards teamwork and penalizes friendly fire.
- **Retro UI:** A stylish, retro-futuristic interface with neon glows and pixel fonts.

## UI Showcase

The application flows through several intuitive screens:

| Screen                | Description                                                                 |
| ---------------------|-----------------------------------------------------------------------------|
| **Username Entry**    | Players begin by choosing a username.                                       |
| **Home**              | After logging in, players can choose to `Create Game` or `Join Game`.       |
| **Create Game Lobby** | The game host receives a unique game code to share. They can see who joins. |
| **Join Game Lobby**   | Players can enter a game code to join as a `Player` or `Spectator`.         |
| **Player View**       | The main game screen, showing a camera feed, a crosshair, and a Shoot button. |
| **Spectator View**    | A live dashboard showing team scores, player rankings, and the game timer.  |

## Tech Stack

- **Backend:** Node.js, Express.js, `ws` (WebSocket library)
- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES Modules), Tailwind CSS
- **Core Libraries:** `uuid` for generating unique IDs

## Project Structure

```
/team-9-bbd-2025-mobile-laser-tag/
├── server/              # All backend Node.js files
│   ├── index.js
│   ├── Game.js
│   ├── Player.js
│   └── Team.js
├── client/              # All frontend files
│   ├── index.html
│   ├── styles/
│   │   ├── styles.css
│   │   └── spectate-page.css
│   └── scripts/
│       ├── game.js
│       ├── player.js
│       ├── cameraDetection.js
│       └── ...
├── cert/                # SSL certificates
│   └── (Generated locally)
├── .gitignore
├── DOCS.md
├── package.json
└── README.md
```

## Getting Started

Follow these instructions to get the project running on your local network.

### Prerequisites

- **Node.js and npm:** [Download and install Node.js](https://nodejs.org/en/)
- **OpenSSL:** For generating an SSL certificate  
  - macOS/Linux: Preinstalled  
  - Windows: Install via [Git for Windows](https://git-scm.com/download/win) or [WSL](https://learn.microsoft.com/en-us/windows/wsl/install)
- **A Mobile Device with a Camera:** The game is optimized for mobile browsers

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd team-9-bbd-2025-mobile-laser-tag
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Generate SSL Certificate

Browsers require HTTPS for camera access. Generate a self-signed certificate:

```bash
mkdir cert
openssl req -x509 -newkey rsa:4096 -keyout cert/server.key -out cert/server.cert -days 365 -nodes
```

> Press `Enter` through all prompts to accept defaults.

### 4. Run the Server

```bash
node server/index.js
```

You'll see output like:

```
Server running at: https://192.168.1.10:3000
```

### 5. Play the Game!

- Connect your **mobile phone** to the **same Wi-Fi network**.
- Open a browser (Chrome/Safari) on your phone.
- Go to `https://<your-local-IP>:3000`
- Bypass the security warning:
  - Click **Advanced** or **Show Details**
  - Click **Proceed to [IP] (unsafe)**

Enjoy the game!
