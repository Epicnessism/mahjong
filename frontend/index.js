const base_title = document.title
console.log('Starting Mahjong Client');

const socket_protocol = window.location.protocol == 'https:' ? 'wss:' : 'ws:'
const socket_host = window.location.host

const app = new Vue({
    el: '#app',
    data: {
        signedIn: false,
        joined: false,
        username: null,
        promptUsername: "",
        promptPassword: "",
        

        socket: null,
        players: [],
        status: 'Waiting for connection...',
        myTiles: [],
        myVisibleTiles: [],
        activeTiles: [],
        yourTurn: false,
        waitingForYourCheck: false,
        inCheckPhase: false,
        activeTile: null,
        activePlayerName: null,
        currentGameId: null,
        joinGameInputField: null,

        testAXIOSdata: null,
        loadingData: true,
        errored: false,
        
    },
    computed: {
    },
    mounted() { 
    },
    methods: {
        joinGame: function() {
            axios
            .post('/joinGame/:gameId', {})
            .then( response => {
                console.log(response);
                app.currentGameId = app.
                app.establishWsConnection()
            })
        },
        establishWsConnection: function() {
            app.socket = new WebSocket(socket_protocol + '//' + socket_host + '/ws')
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
                password: this.promptPassword
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
                password: this.promptPassword
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
            this.promptPassword = '' //do this immediately after the http request is sent out
        },
        createGame: function() {
            axios.post('/createGame')
            .then( response => {
                console.log(response);
                app.currentGameId = response.data.gameId
                app.establishWsConnection() //creat the connection
            })
        },
        activePlayer: function(player) {            
            console.log("activePlayerName: " + this.activePlayerName);
            return { 
                activePlayerStyle : player.playerIdentifier == this.activePlayerName,
                notActivePlayerStyle : player.playerIdentifier != this.activePlayerName,
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
            socket.send(
                JSON.stringify({
                    eventName: event,
                    eventData: eventData
                })
            )
        },
        joinQueue: function() {
            console.log('Joining Queue');
            this.sendEvent('QueueJoin', {
                username: app.username
            });
            this.joined = true;
        }
        
    }
});

app.checkCurrentUser();

function updateStatus(status) {
    app.status = status;
}

socket.addEventListener('open', function (event) {
    console.log('Socket Connection Established!')
    updateStatus('Connection established.');    
});

socket.addEventListener('close', function(event) {
    updateStatus('Connection lost!!!');
})

socket.addEventListener('message', function (eventRaw) {
    console.log('server msg:', eventRaw.data);
    const event = JSON.parse(eventRaw.data);
    if(event.eventName) {
        console.log('Got ' + event.eventName + ' event!');
        handleEvent(event)
    }else {
        console.warn('Got unknown server message: ' + eventRaw.data);
    }
});

function handleEvent(event) {
    switch(event.eventName) {
        case 'QueueStatus':
            updateStatus('In Queue[' + event.eventData.playerCount + '/4]');
            break;
        case 'GameStart': 
            updateStatus('Game starting...');
            app.myTiles = event.eventData.tiles;
            app.players = event.eventData.players;
            app.activePlayerName = event.eventData.activePlayerName;
            break;
        case 'YourTurn':
            app.activeTile = null;
            app.yourTurn = true;
            document.title = '(*)' + base_title;
            updateStatus("It is your turn")
            app.activePlayerName = event.eventData.activePlayerName
            if(event.eventData.newTile) {
                app.myTiles.push(event.eventData.newTile)
            }
            break;
        case 'CheckDiscardedTile':
            updateStatus('Checking if anyone wants ');
            app.activeTile = event.eventData.tile
            app.inCheckPhase = true;
            app.waitingForYourCheck = true;
            document.title = '(*)' + base_title;
            break;
        case 'VisibleTileUpdate':
            updateStatus('updating all visible tiles');
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
                app.players.filter(player => player.playerIdentifier == playerTiles.player)[0].visibleTiles = playerTiles.tiles;
            });
            break;

        case 'NextTurnNotYou':
            updateStatus('Player ' + event.eventData.activePlayerID + ' is starting their turn.');
            app.activeTile = null
            app.activePlayerName = event.eventData.activePlayerName
            
            //update my tiles here?
            app.myTiles = event.eventData.tiles;
            console.log("all players: " + app.players);
            break;
        case 'OtherPlayerRespondedToCheck':
            updateStatus('Player ' + event.eventData.otherPlayerID + ' has declared ' + event.eventData.checkAction);
            break;
        case 'InvalidCheckResponse':
            updateStatus('Illegal Response!');
            break;
        case 'SuccessfulCheckResponse': 
            updateStatus('Successful Check Response');
            app.activeTiles = [];
            app.inCheckPhase = false;
            app.waitingForYourCheck = false;
            document.title = base_title;
            break;
        case 'AlreadySubmittedCheckResponse':
            updateStatus('Response already submitted');
            break;
        case 'CheckPhaseResolved':
            updateStatus('Player ' + event.eventData.actingPlayerID + ' has ' + event.eventData.action + " " + event.eventData.lastTile + "!")
            app.activeTile = null
            app.activeTiles = [];
            break;
        case 'Win':
            updateStatus('Player ' + event.eventData.actingPlayerID + ' has won the game! Winning hand is: ' + event.eventData.winningHand)
            
    }
}


