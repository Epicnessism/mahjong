console.log('Starting Mahjong Client');

const socket = new WebSocket('ws://localhost:8888');

socket.addEventListener('open', function (event) {
    console.log('Socket Connection Established!')
    socket.send('test message from client');
});

socket.addEventListener('message', function (event) {
    console.log('server msg:', event.data);
});

