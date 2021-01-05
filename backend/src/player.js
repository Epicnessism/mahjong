class Player {
    constructor(identifier, ws) {
        this.identifier = identifier;
        this.ws = ws;
        this.activeTurn = false;
        this.visibleTiles = [];
        this.tiles = [];
        this.currentGame = null;
        var curPlayer = this;
        ws.on('message', function(data) {
            curPlayer.handleRecv(data);
        });
        ws.on('close', function() {
            curPlayer.handleClose();
        });
    }

    handleClose() {
        console.log('player ' + this.identifier + ' disconnected!');
    }

    handleRecv(data) {
        console.log('player ' + this.identifier + ' got data ' + data);
        this.currentGame.handleClientResponse(this, JSON.parse(data));
    }

    sendEvent(eventName, eventData) {
        const data = JSON.stringify({
            'eventName': eventName,
            'eventData': eventData
        });
        this.socketSend(data);
    }

    socketSend(data) {
        this.ws.send(data)
    }

    setTiles(tiles) {
        this.tiles = tiles;
    }

    addTile(tile) {
        this.tiles.push(tile);
    }

    removeTile(tile) {
        this.tiles.splice(this.tiles.indexOf(tile), 1);
    }
}

module.exports = Player