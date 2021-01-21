console.log('Starting Mahjong Client');
const socket = new WebSocket('ws://127.0.0.1:80');
// const socket = new WebSocket('wss://truemahjong.com:443');

const app = new Vue({
    el: '#app',
    data: {
        joined: false,
        username: 'anonymous' + Math.floor(Math.random() * 100),
        otherPlayers: [],
        players: [],
        status: 'Waiting for connection...',
        myTiles: [],
        myVisibleTiles: [],
        activeTiles: [],
        yourTurn: false,
        inCheckPhase: false,
        activeTile: null
    },
    methods: {
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
            app.otherPlayers = event.eventData.otherPlayers;
            break;
        case 'YourTurn':
            app.yourTurn = true;
            updateStatus("waiting for you to discard a tile")
            if(event.eventData.newTile) {
                app.myTiles.push(event.eventData.newTile)
            }
            app.otherPlayers.forEach(player => {
                player.isActive = false;
            })
            break;
        case 'CheckDiscardedTile':
            updateStatus('Checking if anyone wants ');
            app.activeTile = event.eventData.tile
            app.inCheckPhase = true;
            break;
        case 'VisibleTileUpdate':
            updateStatus('updating all visible tiles');
            console.log(event);
            app.myVisibleTiles = event.eventData.visibleTileMap.filter(playerVT => playerVT.player == app.username).map(playerVisibleTiles => playerVisibleTiles.tiles )
            event.eventData.visibleTileMap.forEach(playerTiles => {
                console.log(playerTiles);
                if(playerTiles.player == app.username) {
                    console.log('Got my own played tiles');
                    console.log(playerTiles.tiles);
                    app.myVisibleTiles = playerTiles.tiles
                }else {
                    console.log('Got other played tilies')
                    console.log(playerTiles.tiles);
                    app.otherPlayers.filter(player => player.playerIdentifier == playerTiles.player)[0].visibleTiles = playerTiles.tiles;
                }
            });
            break;

        case 'NextTurnNotYou':
            updateStatus('Player ' + event.eventData.activePlayerID + ' is starting their turn.');
            app.activeTile = null
            
            //update my tiles here?
            app.myTiles = event.eventData.tiles;
            console.log("other players: " + app.otherPlayers);
            console.log("all players: " + app.players);
            app.otherPlayers.forEach(player => {
                console.log(event.eventData.activePlayerID);
                console.log(player.playerIdentifier)
                if(event.eventData.activePlayerID === player.playerIdentifier) {
                    console.log("Setting active!");
                    player.isActive = true;
                } else {
                    console.log("Setting inactive!");
                    player.isActive = false;
                }
            });
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


