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


//custom imports?
const mahjongUtil = require('./mahjong-util')


//nobody actually knows if lists are threadsafe in node
waitingPlayers = [];
// var games = mahjongUtil.games //{gameId: gameObject}
var games = []

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
const { networkInterfaces } = require('os');

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

setInterval(function() {
    console.log(`running kill empty games...`);
    mahjongUtil.setGames(games)
    mahjongUtil.killEmptyGames()
}, 6000000) //100 minutes

//ENDPOINTS BEGIN HERE
api.get('/currentUser', (req, res) => {
    console.log("current user check: " + req.session.username)
    res.status(200).json({
        currentUser: req.session.username
    });
});

api.post('/createGame', (req,res,next) => {
    var newGameId = nanoid()
    newGame = new MahjongGame(newGameId)
    games.push(newGame)
    mahjongUtil.setGames(games)

    var newPlayer = new Player(req.session.username)
    newPlayer.currentGame = newGame
    newGame.addPlayer(newPlayer)

    // if(req.body.players != null) {
    //     req.body.players.forEach(player => {
    //         var newPlayer = new Player(player.username)
    //         newPlayer.currentGame = newGame
    //         newGame.addPlayer(newPlayer)
    //     })
    // }

    req.session.currentGameId = newGameId
    console.log("Player " + req.session.username + " created game " + newGameId)
    res.status(200).json( {
        gameId: newGameId
    })
})

api.post('/joinGame/:gameId', (req,res,next)=> {
    console.log("Player " + req.session.username + " joined game " + req.params.gameId)
    
    var foundGame = games.filter( game => game.gameId == req.params.gameId)[0]
    
    if (foundGame == undefined) {
        return next(createError(404, "Game doesn't exist"))
    }

    if (foundGame.players.filter(player => player.username == req.session.username).length == 1) {
        //they were already apart of this game, rejoin them
        //set the ws connection again here somehow? or just create a new playerobject?
    } else {
        //they are a new player joining, add them to the game queue
        var newPlayer = new Player(req.session.username)
        foundGame.addPlayer(newPlayer)
        newPlayer.currentGame = foundGame
    }
    console.log(`before setting session gameId: ${req.session.currentGameId}`);
    req.session.currentGameId = req.params.gameId
    console.log(`after setting session gameId: ${req.session.currentGameId}`);

    return res.status(200).json({
        message: "Successfully joined the game",
        gameId: req.params.gameId
    })
})

api.get('/getPreferences', async (req,res,next)=> {
    var getPreferencesParams = {
        TableName : UserTable,
        Key: {
          "username": req.session.username
        }
    }
    try {
        const dbRes = await docClient.get(getPreferencesParams).promise()
        
        prefResponse = {}

        if(dbRes != undefined && dbRes.Item != undefined) {
            validPreferences.forEach(prefName => {
                prefResponse[prefName] = dbRes.Item[prefName]
            })
        }
        res.status(200).json(prefResponse);
    } catch(err) {
        console.log(err);
        next(err)
    }
})

const validPreferences = new Set(["autopass", "autosort"])
api.post('/savePreference', (req,res,next)=> {
    console.log(req.body.preference);
    var prefName = req.body.preferenceName
    if(validPreferences.has(prefName)) {
        var insertPreference = {
            TableName:UserTable,
            Key:{
                "username": req.session.username,
            },
            UpdateExpression: "set " + prefName + " = :prefValue",
            ExpressionAttributeValues:{
                ":prefValue": req.body.preferenceValue,
            },
            ReturnValues:"UPDATED_NEW"
        }

        try {
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
            })
        } catch(err) {
            console.log(err)
            next(err)
        }
    } else {
        next(createError(400, `${prefName} does not exists!`))
    }
})

api.post('/startGame/:gameId', (req,res,next)=> {
    const gameId = req.params.gameId
    if(req.session.currentGameId == gameId) {
        //TODO wrap this in a try block later
        games.filter(game => game.gameId == req.params.gameId )[0].start()
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
    games.forEach( game => {
        if (game.players.filter( player => player.username == req.session.username) ) { //if game has this username
            currentGame = game
        }
    })

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
    var game = games.filter( game => game.gameId == req.session.currentGameId)[0]
    console.log("game: ", game);
    game.players.filter(player => player.username == req.session.username)[0].setWsConnection(ws)
    console.log("found player and setWSConnection");
    console.log(game.players.length == 4 && game.stateOfGame == "initialized");
    console.log("state of game: ",game.stateOfGame);
    console.log("players in game: ",game.players.length);
    if(game.players.length == 4 && game.stateOfGame == "initialized") {
        game.start()
    } else {
        game.players.forEach( player => {
            game.sendGameStateForPlayer(player)
        })
    }
});

api.listen(config.port)
console.log('Listening for WS and HTTP traffic on port ' + config.port);

