const WebSocket = require('ws');
const Express = require('express');
const CookieSession = require('cookie-session');
const Player = require('./player.js');
const MahjongGame = require('./mahjong.js');
const config = require('./config.js');
var path = require('path');

console.log('Starting Server...');

const apiApp = Express();

apiApp.use('/', Express.static(path.join(__dirname, '../frontend')))

apiApp.use(CookieSession({
    name: 'session',
    keys: ['key1', 'key2']
  }))

apiApp.get('/currentUser', (req, res) => {
    console.log(req);
    res.send('Hello World!');
});

/*apiApp.listen(config.apiPort, () => {
    console.log('Express endpoints started on port ' + config.apiPort)
})*/

var server = require('http').createServer();

var wss = new WebSocket.Server({
    server: server,
    perMessageDeflate: false
});

server.on('request', apiApp);

server.listen(config.port, function() {
    console.log('Listening for WS and HTTP traffic on port ' + config.port);
});

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
