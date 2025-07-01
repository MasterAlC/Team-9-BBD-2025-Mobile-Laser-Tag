## Player Class
### File: Player.js
*Represents a single player in the game.*

### Methods:

**constructor(id, socket)**  
**Description:** Creates a new player with a unique ID and Socket  
**Parameters:**  
 - id (string) -> Unique ID for the player  
 - socket (WebSocket) -> The player's WebSocket connection  
**Returns:** A new Player instance  

**updateScore(points)**  
**Description:** Adds point to the player's current score  
**Parameters:**  
    - points(number) - Number of points to add  
**Returns:** void  


## Game Class  
### File: Game.js  
*Handles all logic for a single session*  

### Methods:

**constructor(gameId)**  
**Description:** Creates a new game instance with a unique ID  
**Parameters:**  
    -gameId(string) -> Unique ID for the game session  
**Returns:** A new Game instance  

**addPlayer(id, socket)**  
**Description:** Adds a new player to this game  
**Parameters:**  
    - id (string) -> Unique player ID  
    - socket (WebSocket) -> They player's WebSocket connection  
**Retursn:** void  

**startGame()**  
**Description:** Starts the game timer, sets all player scores to zero, and broadcasts a start message and timer updates.  
**Parameters:** None  
**Returns:** void  

**playerHitEventHandler(shooterId, targetId)**  
**Description:** Handles a player hitting another player. Increases the shooter's score by 1 and broadcasts the updated score to all players  
**Parameters:**  
    - shooterId (string) -> ID of the shooting player  
    - targetId (string) -> ID of the player who was hit  
**Returns:** void  

**endGamae()**  
**Description:** Ends the game, stops the timer, determines the winner, and broadcasts a game-over message  
**Parameters:** None  
**Returns:** void  

**getWinner()**  
**Description:** Finds and returns the player with the highest score in this game  
**Parameters:** None  
**Returns:**  
    - Player object of the winning player  
    - null if no players exist  

**broadcastAll(message)**  
**Description:** Sends a JSON message to all the players in the game via their sockets  
**Parameters:**  
    - message (object) -> JSON object to send to all players  
**Returns:** void  


## Index Class  
### File: index.js  
*Manages multiple games and routes commands to the correct game instance*  

### Methods:

**createGame(gameId)**  
**Description:** Creates a new game if one does not exist for the given ID  
**Parameters:**  
    - gameId (string) -> Unique ID for the game  
**Returns:** Game instance  

**addPlayer(gameId, playerId, socket)**  
**Description:** Adds a player to the specified game  
**Parameters:**  
    - gameId (string) -> ID of the game  
    - playerId (string) -> Unique ID of the player  
    - socket (WebCocket) -> Player's WebSocket connection  
**Returns:** void  

**startGame(gameId)**  
**Description:** Starts the specified game  
**Parameters:**  
    - gameId (string) -> ID of the game  
**Returns:** void  

**playerHitEventHandler(gameId, shooterId, targetId)**  
**Description:** Handles a hit event in the specified game  
**Parameters:**  
    - gameId (string) -> ID of the game  
    - shooterId (string) -> ID of the player who shot  
    - targetId (string) -> ID of the player who was hit  
**Returns:** void  