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

playerCounter = 1

function handleNewConnection(ws) {
    console.log('Got new connection!');
    newPlayer = new Player(playerCounter++, ws);
    waitingPlayers.push(newPlayer);

    if(waitingPlayers.length >= 4) {
        newGame = new MahjongGame(waitingPlayers);
        games.push(newGame);
        newGame.start();

        //todo this lobby system is super hacky lmao
        waitingPlayers = [];
    } else {
        waitingPlayers.forEach(player => {
            player.sendEvent('QueueStatus', {
                playerCount: waitingPlayers.length
            });
        });
        
    }
}
