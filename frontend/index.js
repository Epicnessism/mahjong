console.log('Starting Mahjong Client');
const socket = new WebSocket('ws://localhost:8888');

const app = new Vue({
    el: '#app',
    data: {
        status: 'Waiting for connection...',
        myTiles: [],
        yourTurn: false,
        inCheckPhase: false,
    },
    methods: {
        playTile: function(tile) {
            if(this.yourTurn) {
                console.log("you chose: " + tile);
                //send discard tile
                socket.send(
                    JSON.stringify({
                        eventName: 'DiscardTile',
                        eventData: {
                            tile: tile
                        }
                    })
                )
                this.status = 'Discard submitted';
                this.yourTurn = false;
            } else {
                console.log("not your turn, please wait.");
            }   
        },
        sendEmptyEvent: function(event) {
            socket.send(
                JSON.stringify({
                    eventName: event,
                    eventData: {}
                })
            )
        }
    }
});

function updateStatus(status) {
    app.status = status;
}

socket.addEventListener('open', function (event) {
    console.log('Socket Connection Established!')
    updateStatus('Connection established.');
    //socket.send('test message from client');
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
            break;
        case 'YourTurn':
            app.yourTurn = true;
            updateStatus("waiting for player to discard a tile")
            app.myTiles.push(event.eventData.newTile)
            break;
        case 'CheckDiscardedTile':
            updateStatus('Checking if anyone wants ' + event.eventData.tile);
            app.inCheckPhase = true;
            break;
        case 'NextTurnNotYou':
            updateStatus('Player ' + event.eventData.activePlayerID + ' is starting their turn.');
            app.myTiles = event.eventData.tiles;
            break;
        case 'OtherPlayerRespondedToCheck':
            updateStatus('Player ' + event.eventData.otherPlayerID + ' has declared ' + event.eventData.checkAction);
            break;
        case 'InvalidCheckResponse':
            updateStatus('Illegal Response!');
            break;
        case 'SuccessfulCheckResponse': 
            updateStatus('Successful Check Response');
            app.inCheckPhase = false;
            break;
        case 'AlreadySubmittedCheckResponse':
            updateStatus('Response already submitted');
    }
}


