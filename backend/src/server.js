const WebSocket = require('ws');
const Player = require('./player')
const MahjongGame = require('./mahjong')

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



testGame = new MahjongGame([], 'flowers')
console.log(testGame.tiles)
console.log(testGame.takeTiles(5))
console.log(testGame.takeTiles(2))
console.log(testGame.takeTiles(1, true))
console.log(testGame.takeTiles(3, true))
