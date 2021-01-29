const WebSocket = require('ws');
const Express = require('express');
const CookieSession = require('cookie-session');
const Player = require('./player.js');
const MahjongGame = require('./mahjong.js');
const config = require('./config.js');
var path = require('path');

console.log('Starting Server...');

const api = Express();

api.use('/', Express.static(path.join(__dirname, '../frontend')))

api.use(CookieSession({
    name: 'session',
    keys: ['key1', 'key2']
  }))

api.get('/currentUser', (req, res) => {
    console.log(req.session);
    res.send('Hello World!');
});

/*api.listen(config.apiPort, () => {
    console.log('Express endpoints started on port ' + config.apiPort)
})*/

api.post('/signIn', (req, res, next) => {
    console.log(req);
    //TODO authentication logic with username/pwd in db
    //use bcrypt for passwords
    res.session.username = req.body.username
})

api.get('/signout', (req,res,next) => {
    console.log(req);
    //something like req.session = null? nah that doesn't work
    //TODO do the logout lmao
})

//loop through games and return the first game found with this username found in the cookie
api.get('/getCurrentGame', (req,res,next)=> {
    console.log(req.session);
    var currentGame = null;

    //stackoverflow reference found here: NOT TESTED
    //https://stackoverflow.com/questions/2641347/short-circuit-array-foreach-like-calling-break
    games.some( game => {
        if (game.players.filter( player => player.identifier == req.session.username) ) { //if game has this username
            currentGame = game;
            return true; //return true causes some to stop iterating, optimizing response time
        }
    })

    //unoptimized method as a backup, delete later if don't need
    // games.forEach( game => {
    //     if (game.players.filter( player => player.identifier == req.session.username) ) { //if game has this username
    //         currentGame = game;
    //         break;
    //     }
    // })

    if (currentGame) {
        res.status(200).json({currentGame})
    } else if (currentGame == null) {
        res.status(404).json({ //TODO implement centralized error handling with next later...
            message: "404 Not Found"
        })
    }
    
})

api.get('/getUsername', (req,res,next)=> {
    //TODO might need to check more than just if the session exists
    if(req.session) {
        res.status(200).json({username: req.session.username})   
    } else {
        res.status(403).json( {
            message: 'unauthorized???'
        })
    }
})



var server = require('http').createServer();

var wss = new WebSocket.Server({
    server: server,
    perMessageDeflate: false
});

server.on('request', api);

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
