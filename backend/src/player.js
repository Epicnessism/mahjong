class Player {
    constructor(identifier, ws) {
        this.identifier = identifier;
        this.ws = ws;
        ws.on('message', this.handleRecv);
        ws.on('close', this.handleClose);
    }

    handleClose() {
        console.log('player ' + this.identifier + ' disconnected!');
    }

    handleRecv(data) {
        console.log('player ' + this.identifier + ' got data ' + data);
    }

    socketSend(data) {
        this.ws.send(data)
    }
}

module.exports = Player