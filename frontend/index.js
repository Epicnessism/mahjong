const base_title = document.title
console.log('Starting Mahjong Client');

const socket_protocol = window.location.protocol == 'https:' ? 'wss:' : 'ws:'
const socket_host = window.location.host

const app = new Vue({
    el: '#app',
    vuetify: new Vuetify({icons: {
                            iconfont: 'md',
                        },
    }),
    data: {
        signedIn: false,
        
        username: null,
        promptUsername: "",
        password: "",
        showPassword: false,
        
        joined: false,
        socket: null,
        waitingForPlayers: false,
        players: [],
        status: 'Waiting for connection...',
        myTiles: [],
        myVisibleTiles: [],
        myDiscardedTiles: [],
        activeTiles: [],

        yourTurn: false,
        waitingForYourCheck: false,
        inCheckPhase: false,
        activeTile: null,

        //v-models for navbar and navdrawer
        navDrawer: false,
        group: null, //no clue what this does
        autopass: false,

        //check phase buttons
        winnable: false,
        gangable: false,
        matchable: false,
        eatable: false,

        //the new tile gotten
        newTile: null,
        
        activePlayerName: null,
        currentGameId: null,
        joinGameInputField: null,

        loadingData: true,
        errored: false,
        
        //winning stuff
        stateOfGame: 'somethingHereLol',
        winningHand: null,
        gameOver: false,

        nextGameId: null

    },
    methods: {
        exitGame: function() {
            app.socket.close()
            app.socket = null
            app.joined = false
            app.status = 'Waiting for connection...'

            this.cleanGameState()
        },
        cleanGameState: function() {
            //Clean Game
            app.waitingForPlayers = false
            app.players = []
            app.myTiles = []
            app.myVisibleTiles = []
            app.myDiscardedTiles = []
            app.activeTiles = []
            app.yourTurn = false
            app.waitingForYourCheck = false
            app.inCheckPhase = false
            app.activeTile = null

            //check phase buttons
            app.winnable = false
            app.gangable = false
            app.matchable = false
            app.eatable = false

            //the new tile gotten
            app.newTile = null
            
            app.activePlayerName = null
            app.currentGameId = null
            
            //winning stuff
            app.stateOfGame = null
            app.winningHand = null
            app.gameOver = false
        },
        nextGame: function() {
            if(app.nextGameId != null) {
                //gameInvite for next game already exists, just join the next game
                app.joinGame()
                this.cleanGameState()
            } else {
                var players = app.players
                this.cleanGameState()
                //generate and send new gameIds to other players
                this.createGame(players)
            }
        },
        updatePlayerStatus: function(username, statusType) {
            console.log(username + " : " + statusType)

            player = app.players.filter(p => p.username == username)[0];

            if(statusType == "clear") {
                player.statusColor = "gray"
            }else if(statusType == "waitingTurn") {
                player.statusColor = "green"
            }else if(statusType == "waitingCheck") {
                player.statusColor = "blue"
            }

        },
        clearAllPlayerStatuses() {
            app.players.forEach(player => {
                app.updatePlayerStatus(player.username, "clear")
            })
        },
        joinGame: function() {
            if(app.nextGameId != null) {
                axios
                .post('/joinGame/' + app.nextGameId, {})
                .then( response => {
                    console.log(response);
                    // app.currentGameId = app.joinGameInputField
                    app.socket.close()
                    app.socket = null
                    app.establishWsConnection()
                    app.waitingForPlayers = true
                    this.nextGameId = null
                })
            } else {
                axios
                .post('/joinGame/' + this.joinGameInputField, {})
                .then( response => {
                    console.log(response);
                    // app.currentGameId = app.joinGameInputField
                    app.establishWsConnection()
                    app.waitingForPlayers = true
                })
            }
            
        },
        createGame: function(players = null) {
            if(players == null) {
                players = [
                    {username: app.username}
                ]
            }
            console.log("players before create game: ", players);
            axios.post('/createGame', {players})
            .then( response => {
                console.log(response);
                app.currentGameId = response.data.gameId
                app.establishWsConnection(players.length, response.data.gameId)
                app.waitingForPlayers = true
            })
        },
        establishWsConnection: function(lengthOfPlayers = 1, newGameId = null) {
            //before establishing a new connection, send to the old game
            if(lengthOfPlayers > 1) {
                app.sendEvent("NextGameCreated", {
                    newGameId: newGameId
                })
            }

            console.log("Starting WS connection...")
            app.socket = new WebSocket(socket_protocol + '//' + socket_host + '/ws')
            
            app.socket.addEventListener('open', function (event) {
                console.log('Socket Connection Established!')
                app.updateStatus('Connection established.');    
            });
            
            app.socket.addEventListener('close', function(event) {
                app.updateStatus('Connection lost!!!');
            })
            
            app.socket.addEventListener('message', function (eventRaw) {
                console.log('server msg:', eventRaw.data);
                const event = JSON.parse(eventRaw.data);
                if(event.eventName) {
                    console.log('Got ' + event.eventName + ' event!');
                    app.handleEvent(event)
                }else {
                    console.warn('Got unknown server message: ' + eventRaw.data);
                }
            });
            setInterval(function(){ 
                app.sendEvent('KeepAlive', {})
            }, 15000);

            console.log("Connection Established")
            app.joined = true;
            app.nextGameId = null
        },
        checkCurrentUser: function() {
            console.log("Checking logged in status...")
            axios
                .get("/currentUser")
                .then( res => {
                    console.log(res);
                    if(res.data.currentUser) {
                        console.log("You are already signed in as " + res.data.currentUser)
                        app.username = res.data.currentUser
                        app.signedIn = true
                        app.getPreferences()
                    }else {
                        console.log("You are not logged in")
                    }
                })
                .catch( error => {
                    console.log(error);
                    app.errored = true
                })
                .finally( () => {
                    app.loadingData = false
                })
        },
        signOut: function() {
            app.socket = null;
            app.joined = false;
            app.joinSpecificGame = false;
            axios
                .get("/signOut")
                .then( res => {
                    console.log(res);
                    app.signedIn = false;
                })
                .catch( error => {
                    console.log(error);
                    app.errored = true
                })
                .finally( () => {
                    app.loadingData = false
                })
        },
        signIn: function() {
            axios
            .post('/signIn', {
                username: this.promptUsername,
                password: this.password
            }
            )
            .then( function(response) {
                console.log(response.data);
                if(response.data.username) {
                    console.log("You have been signed in as " + response.data.username);
                    app.username = response.data.username
                    app.signedIn = true
                }
                
            })
            .catch( function(error) {
                console.log(error);
            })
            this.password = '' //do this immediately after the http request is sent out
        },
        signUp: function() {
            axios
            .post('/signUp', {
                username: this.promptUsername,
                password: this.password
            })
            .then( function(response) {
                console.log(response);
                if(response.data.username) {
                    console.log("You have been signed up as " + response.data.username);
                    app.signedIn = true;
                    app.username = response.data.username;
                }
            })
            .catch( function(error) {
                console.log(error);
            })
            this.password = '' //do this immediately after the http request is sent out
        },
        savePreference: function(prefName, prefValue) {
            axios
            .post('/savePreference', {
                preferenceName: prefName,
                preferenceValue: prefValue,
            })
        },
        getPreferences: function() {
            axios
            .get('/getPreferences')
            .then( function(response) {
                console.log(response);
                app.autopass = response.data.autopass
            })
        },
        activePlayer: function(player) {            
            console.log("activePlayerName: " + this.activePlayerName);
            return { 
                activePlayerStyle : player.username == this.activePlayerName,
                notActivePlayerStyle : player.username != this.activePlayerName,
             }            
        },        
        clickTile: function(tile) {
            if(this.yourTurn) {
                console.log("you chose to discard: " + tile);
                this.activeTile = tile
                this.sendEvent('DiscardTile', {
                    tile: tile
                })
                this.myTiles = this.myTiles.filter( otherTile => otherTile != tile)
                this.status = 'Discard submitted';
                this.yourTurn = false;
                document.title = base_title;
                app.players.forEach(player => {
                    if(player.username != app.username) {
                        app.updatePlayerStatus(player.username, "waitingCheck")
                    }
                })
            } else if(this.inCheckPhase) {
                console.log("You chose: " + tile);
                this.myTiles.splice(this.myTiles.indexOf(tile), 1);
                this.activeTiles.push(tile);
            } else {
                console.log("not your turn, no active actions, please wait.");
            }   
        },
        deselectTile: function(tile) {
            console.log("You deselected: " + tile);
            this.activeTiles.splice(this.activeTiles.indexOf(tile), 1);
            this.myTiles.push(tile);
        },
        updateTileOrder: function() {
            console.log(this.myTiles)
            this.sendEvent("UpdateTileOrder", {
                tiles: this.myTiles
            });
        },
        sendEvent: function(event, eventData = {}) {
            if(event == "Win" || event == "Gang" || event == "Match" || event == "Pass") {
                app.toggleOffDiscardButtons()
            }
            app.socket.send(
                JSON.stringify({
                    eventName: event,
                    eventData: eventData
                })
            )
        },
        updateStatus(status) {
            app.status = status;
        },
        toggleOffDiscardButtons() {
            app.winnable = false;
            app.gangable = false;
            app.matchable = false;
            app.eatable = false;
        },
        checkAutoPass() {
            if(app.autopass && !app.winnable && !app.gangable && !app.matchable && !app.eatable) {
                app.sendEvent('Pass')
            }
        },
        handleEvent(event) {
            switch(event.eventName) {
                case 'GameState': 
                    app.updateStatus('Game State updated...');
                    app.myTiles = event.eventData.tiles;
                    app.players = event.eventData.players;
                    app.activePlayerName = event.eventData.activePlayerName;
                    if(app.players.length == 4 && app.waitingForPlayers) {
                        app.waitingForPlayers = false
                    }
                    break;
                case 'YourTurn':
                    app.activeTile = null;
                    app.yourTurn = true;
                    document.title = '(*)' + base_title;
                    app.updateStatus("It is your turn")
                    app.activePlayerName = event.eventData.activePlayerName

                    app.clearAllPlayerStatuses()
                    app.updatePlayerStatus(app.activePlayerName, "waitingTurn")

                    if(event.eventData.newTile) {
                        app.newTile = event.eventData.newTile
                        app.myTiles.push(event.eventData.newTile)
                    }
                    break;
                case 'CheckDiscardedTile':
                    app.updateStatus('Checking if anyone wants ');
                    app.activeTile = event.eventData.tile
                    app.inCheckPhase = true;
                    app.waitingForYourCheck = true;
                    document.title = '(*)' + base_title;

                    app.players.forEach(player => {
                        if(player.username != app.activePlayerName) {
                            app.updatePlayerStatus(player.username, "waitingCheck")
                        }
                    })

                    app.winnable = event.eventData.possibleActions.win
                    app.gangable = event.eventData.possibleActions.gang
                    app.matchable = event.eventData.possibleActions.match
                    app.eatable = event.eventData.possibleActions.eat
                    app.checkAutoPass()
                    break;
                case 'VisibleTilesUpdate':
                    app.updateStatus('updating all visible tiles');
                    console.log(event.eventData);
                    event.eventData.forEach(playerTiles => {
                        console.log(playerTiles);
                        if(playerTiles.player == app.username) {
                            console.log('Got my own played tiles');
                            app.myVisibleTiles = playerTiles.tiles
                        }else {
                            console.log('Got other played tilies')
                        }
                        console.log(playerTiles.tiles);
                        app.players.filter(player => player.username == playerTiles.player)[0].visibleTiles = playerTiles.tiles;
                    });
                    break;
                case 'DiscardedTilesUpdate':
                    app.updateStatus('updating all discarded tiles')
                    console.log(event.eventData)
                    event.eventData.forEach(playerTiles => {
                        console.log(playerTiles);
                        if(playerTiles.player == app.username) {
                            console.log('Got my own played tiles');
                            app.myDiscardedTiles = playerTiles.tiles
                        }
                        app.players.filter(player => player.username == playerTiles.player)[0].discardedTiles = playerTiles.tiles
                    })
                    break;
                case 'NextTurnNotYou':
                    app.updateStatus('Player ' + event.eventData.activePlayerID + ' is starting their turn.');
                    app.activeTile = null
                    app.activePlayerName = event.eventData.activePlayerName

                    app.clearAllPlayerStatuses()
                    app.updatePlayerStatus(app.activePlayerName, "waitingTurn")

                    //update my tiles here?
                    app.myTiles = event.eventData.tiles;
                    console.log("all players: " + app.players);
                    break;
                case 'OtherPlayerRespondedToCheck':
                    app.updateStatus('Player ' + event.eventData.otherPlayerID + ' has declared ' + event.eventData.checkAction);
                    app.updatePlayerStatus(event.eventData.otherPlayerID, "clear")

                    break;
                case 'InvalidCheckResponse':
                    app.updateStatus('Illegal Response!');
                    break;
                case 'SuccessfulCheckResponse': 
                    app.updateStatus('Successful Check Response');
                    app.activeTiles = [];
                    app.inCheckPhase = false;
                    app.waitingForYourCheck = false;
                    document.title = base_title;
                    app.updatePlayerStatus(app.username, "clear")
                    app.myTiles = event.eventData.playerTiles;
                    break;
                case 'AlreadySubmittedCheckResponse':
                    app.updateStatus('Response already submitted');
                    break;
                case 'CheckPhaseResolved':
                    app.updateStatus('Player ' + event.eventData.actingPlayerID + ' has ' + event.eventData.action + " " + event.eventData.lastTile + "!")
                    app.activeTile = null
                    app.activeTiles = []
                    break;
                case 'YourTiles':
                    app.updateStatus('got YourTiles')
                    app.myTiles = event.eventData.tiles
                    break;
                case 'Winning':
                    app.updateStatus(`Congrats! [YOU]${event.eventData.winningPlayer} have won the game! ${event.eventData.winningHand}`)
                    console.log(`Congrats! [YOU]${event.eventData.winningPlayer} have won the game! ${event.eventData.winningHand}`);
                    app.stateOfGame = 'winning'
                    app.winningHand = event.eventData.winningHand
                    app.gameOver = true
                    break;
                case 'Losing':
                    app.updateStatus(`RIP! [NOT YOU]${event.eventData.winningPlayer} has won the game! ${event.eventData.winningHand}`)
                    console.log(`RIP! [NOT YOU]${event.eventData.winningPlayer} has won the game! ${event.eventData.winningHand}`);
                    app.stateOfGame = 'losing'
                    app.gameOver = true
                    app.winningHand = event.eventData.winningHand
                    break;
                case 'NextGameInvite':
                    app.updateStatus(`Youy have been invited to the next game by ${event.eventData.creatingPlayer}, GameId: ${event.eventData.newGameId}`)
                    app.nextGameId = event.eventData.newGameId
                    break
            }
        }
    }
});



app.checkCurrentUser();


