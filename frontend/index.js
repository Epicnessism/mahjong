console.log('Starting Mahjong Client');

const app = new Vue({
    el: '#app',
    data: {
        status: 'Waiting for connection...',
        myTiles: []
    }
});

const socket = new WebSocket('ws://localhost:8888');

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
            app.myTiles = event.eventData.tiles
    }
}


