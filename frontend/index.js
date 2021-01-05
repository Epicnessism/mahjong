console.log('Starting Mahjong Client');
const socket = new WebSocket('ws://localhost:8888');

const app = new Vue({
    el: '#app',
    data: {
        status: 'Waiting for connection...',
        myTiles: [],
        yourTurn: false
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
            
        }
    }
});

socket.addEventListener('open', function (event) {
    console.log('Socket Connection Established!')
    app.status = 'Connection established.';
    //socket.send('test message from client');
});

socket.addEventListener('close', function(event) {
    app.status = 'Connection lost!!!';
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
            app.status = 'In Queue[' + event.eventData.playerCount + '/4]';
            break;
        case 'GameStart': 
            app.status = 'Game starting...';
            app.myTiles = event.eventData.tiles;
            break;
        case 'YourTurn':
            app.yourTurn = true;
            app.status = "waiting for player to discard a tile"
            break;
        case 'CheckDiscardedTile':
            app.status = 'Checking if anyone wants ' + event.eventData.tile;
            break;
        case 'NextTurnNotYou':
            app.status = 'Player ' + event.eventData.playerID + ' is starting their turn.'
            break;
    }
}


