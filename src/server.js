const WebSocket = require('ws');
const Express = require('express');
const bodyParser = require('body-parser');
const CookieSession = require('cookie-session');
const Player = require('./player.js');
const MahjongGame = require('./mahjong.js');
const config = require('./config.js');
var AWS = require("aws-sdk");
const bcrypt = require('bcrypt');
const createError = require('http-errors')


//todo AWS CONFIG STUFF...........organize this
AWS.config.update({
  region: "us-east-2",
  endpoint: "https://dynamodb.us-east-2.amazonaws.com"
});
var docClient = new AWS.DynamoDB.DocumentClient();
var UserTable = "users";
//end aws config stuff

//TODO organize Bcrypt config stuff
const saltRounds = 7;
//end bcrypt config stuff
 
var path = require('path');

console.log('Starting Server...');

const api = Express();

api.use('/', Express.static(path.join(__dirname, '../frontend')))
api.use(bodyParser.urlencoded({ extended: true }));
api.use(bodyParser.json());

api.use(CookieSession({
    name: 'session',
    keys: ['key1', 'key2']
}));



//ENDPOINTS BEGIN HERE
api.get('/currentUser', (req, res) => {
    console.log("current user check: " + req.session.username)
    res.status(200).json({
        currentUser: req.session.username
    });
});


api.post('/signIn', (req, res, next) => {
    req.session.username = req.body.username
    console.log("User signin: " + req.body.username)
    //TODO authentication logic with username/pwd in db
    //use bcrypt for passwords
    // res.session.username = req.body.username
    res.status(200).json({
        message: "Signed in successfully",
        username: req.session.username
    })
})

api.post('/signOut', (req, res, next) => {
    console.log("User signout: " + req.session.username)
    req.session.username = null
    //TODO authentication logic with username/pwd in db
    //use bcrypt for passwords
    // res.session.username = req.body.username
    res.status(200).json({
        message: "Signed in successfully"
    })
})

api.post('/signUp', async (req,res,next) => {
    //check if username already exists
    const lookUpUsername = {
        TableName : UserTable,
        Key: {
          username: req.body.username
        }
      };
    try {
        const usernameExists = await docClient.get(lookUpUsername).promise()
        if(usernameExists.Item != undefined) {
            return next(createError(409, 'Username already exists...'))
        }
    } catch(err) {
        console.log(err);
    }

    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
    var insertUser = {
        TableName: UserTable,
        Item:{
            "username": req.body.username,
            "password": hashedPassword,
        }
    };
    docClient.put(insertUser, function(err, data) {
        if (err) {
            console.error("User failed to signup. Error JSON:", JSON.stringify(err, null, 2));
            next(createError(500, err))
        } else {
            console.log("User signup: " + req.body.username)
            req.session.username = req.body.username
            console.log(data)
            console.log("Added item:", JSON.stringify(data, null, 2));
            res.status(203).json( {
                message: "Signed up successfully",
                username: req.session.username
            })
        }
    });


    
})

api.get('/signout', (req,res,next) => {
    req.session = null
    res.status(200).json( {
        message: "Signed out successfully"
    })
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


//catch all error handling level 1
api.use(function(err, req, res, next) {
    console.log(err);
    return res.status(err.status || 500).json({
        status: err.status,
        message: err.message
    })
});





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
