const WebSocket = require('ws');
const Player = require('./player')
const MahjongGame = require('./mahjong')

console.log('Mahjong Server Started');

const wss = new WebSocket.Server({
  port: 8888
});

console.log('Listening on port 8888');

wss.on('connection', handleNewConnection);

//nobody actually knows if lists are threadsafe in node
waitingPlayers = [];
games = [];

playerCounter = 1

function handleQueueJoin(newPlayer) {
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

function handleNewConnection(ws) {
    console.log('Got new connection!');
    ws.on('message', function(data) {
        message = JSON.parse(data);
        if(message.eventName == 'QueueJoin') {
            console.log('Player ' + message.eventData.username + ' has joined the queue');
            var newPlayer = new Player(message.eventData.username, ws);
            handleQueueJoin(newPlayer)
        }
    });
}
