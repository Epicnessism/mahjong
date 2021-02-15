const Express = require('express');
const bodyParser = require('body-parser');
const CookieSession = require('cookie-session');
const Player = require('./player.js');
const MahjongGame = require('./mahjong.js');
const config = require('./config.js');
var AWS = require("aws-sdk");
const bcrypt = require('bcrypt');
const createError = require('http-errors')


const { customAlphabet  } = require("nanoid")
const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 5)


//nobody actually knows if lists are threadsafe in node
waitingPlayers = [];
games = {} //{gameId: gameObject}

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
require('express-ws')(api);

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

api.post('/createGame', (req,res,next) => {
    const newGameId = nanoid()
    newGame = new MahjongGame(newGameId)
    games[newGameId] = newGame

    var newPlayer = new Player(req.session.username)
    newPlayer.currentGame = newGame
    newGame.addPlayer(newPlayer)

    req.session.currentGameId = newGameId
    console.log("Player " + req.session.username + " created game " + newGameId)
    res.status(200).json( {
        gameId: newGameId
    })
})

api.post('/joinGame/:gameId', (req,res,next)=> {
    console.log("Player " + req.session.username + " joined game " + req.params.gameId)
    var newPlayer = new Player(req.session.username)
    newPlayer.currentGame = games[req.params.gameId]
    games[req.params.gameId].addPlayer(newPlayer)

    req.session.currentGameId = req.params.gameId
    return res.status(200).json({
        message: "Successfully joined the game",
        gameId: req.params.gameId
    })
})

const validPreferences = new Set(["autoPass"])
api.get('/getPreferences', (req,res,next)=> {
    var getPreferences = {
        TableName : UserTable,
        Key: {
          username: req.body.username
        }
    }
    try {
        const user = await docClient.get(getPreferences).promise()
        if(user.Item == undefined) {
            return next(createError(404, "User Not found"));
        }
        console.log(user);
        res.status(200).json({
            message: "Preferences Found",
            userItem: user.Item
        });
    } catch(err) {
        console.log(err);
        next(err) //TODO not actually sure if this works lmao
    }
})


api.post('/savePreference', (req,res,next)=> {
    console.log(req.body.preference); // a list?
    var prefName = req.body.preferenceName
    if(validPreferences.has(prefName)) {
        var insertPreference = {
            TableName:UserTable,
            Key:{
                "username": req.session.username,
            },
            UpdateExpression: "set autopass = :autoPass",
            ExpressionAttributeValues:{
                ":autoPass": req.body.preferenceValue,
            },
            ReturnValues:"UPDATED_NEW"
        };

        //todo this probably needs to be in a trycatch block lmao
        docClient.update(insertPreference, function(err, data) {
            if (err) {
                console.error(`User failed to update preference ${prefName}. Error JSON:`, JSON.stringify(err, null, 2));
                next(createError(500, err))
            } else {
                console.log(`User ${prefName} preference updated.`)
                console.log("Added item:", JSON.stringify(data, null, 2));
                res.status(203).json( {
                    message: `${prefName} updated successfully`,
                })
            }
        });
    } else {
        next(createError(400, `${prefName} does not exists!`))
    }
})

api.post('/startGame/:gameId', (req,res,next)=> {
    const gameId = req.params.gameId
    if(req.session.currentGameId == gameId) {
        //TODO wrap this in a try block later
        games[req.params.gameId].start()
        return res.status(201).json({
            message: "Game successfully started"
        })
    }
    return next(createError(400, "couldn't start game for one reason or another..."))
})


api.post('/signIn', async (req, res, next) => {
    console.log("User signin attempt: " + req.body.username)
    const lookUpUser = {
        TableName : UserTable,
        Key: {
          username: req.body.username
        }
    };
    try {
        const usernameExists = await docClient.get(lookUpUser).promise()
        if(usernameExists.Item == undefined) {
            return next(createError(401, "Credentials Invalid"));
        }
        const validPassword = await bcrypt.compare(req.body.password, usernameExists.Item.password); //returns a boolean?
        console.log(validPassword);
        if(validPassword) {
            req.session.username = req.body.username
            res.status(200).json({
                message: "Signed in successfully",
                username: req.session.username
            });
        } else {
            next(createError(401, "Credentials Invalid"));
        }
    } catch(err) {
        console.log(err);
        next(err) //TODO not actually sure if this works lmao
    }
})

api.post('/signUp', async (req,res,next) => {
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
            console.log("Added item:", JSON.stringify(data, null, 2));
            res.status(203).json( {
                message: "Signed up successfully",
                username: req.session.username
            })
        }
    });
})

api.get('/signOut', (req, res, next) => {
    console.log("User signout: " + req.session.username)
    req.session = null
    res.status(200).json({
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
        return next(createError(404, "Current Game not found"))
    }
})

api.get('/getUsername', (req,res,next)=> {
    //TODO might need to check more than just if the session exists
    if(req.session) {
        res.status(200).json({username: req.session.username})   
    } else {
        next(createError(403, "adl_kfjadkl_gjakflbv"))
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

api.ws('/ws', function(ws, req) { //only happens on websocket establishment
    console.log("Get ws connection from " + req.session.username)
    games[req.session.currentGameId].players.filter(player => player.identifier == req.session.username)[0].setWsConnection(ws)
    
    if(games[req.session.currentGameId].players.length >= 4) {
        games[req.session.currentGameId].start()
    }
});


api.listen(config.port)
console.log('Listening for WS and HTTP traffic on port ' + config.port);
