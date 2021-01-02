const WebSocket = require('ws');

const wss = new WebSocket.Server({
  port: 8888
});

wss.on('connection', handleNewConnection);

//nobody actually knows if lists are threadsafe in node
waitingPlayers = [];
games = [];

function handleNewConnection(ws) {
    console.log('Got new connection!');
    randomId = Math.floor(Math.random() * 100);
    newPlayer = new Player(randomId, ws);
    newPlayer.socketSend('Welcome to the Mahjong server!');
    waitingPlayers.push(newPlayer);

    if(waitingPlayers.length >= 4) {
        newGame = new MahjongGame(waitingPlayers);
        games.push(newGame);
        newGame.start();

        //todo this lobby system is super hacky lmao
        waitingPlayers = [];
    } else {
        newPlayer.socketSend("Added to game queue, waiting for more players...");
    }
}

class Player {
    constructor(identifier, ws) {
        this.identifier = identifier;
        this.ws = ws;
        ws.on('message', this.handleRecv);
        ws.on('close', this.handleClose);
    }

    handleClose() {
        console.log('player ' + this.identifier + ' disconnected!');
    }

    handleRecv(data) {
        console.log('player ' + this.identifier + ' got data ' + data);
    }

    socketSend(data) {
        this.ws.send(data)
    }
}

class MahjongGame {
    constructor(players) {
        this.players = players;
    }

    start() {
        console.log("New game starting...")
        this.players.forEach(player => player.socketSend("Game Starting..."));
    } 
}