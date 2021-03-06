class Player {
    constructor(username) {
        this.username = username;
        this.ws = null;
        this.activeTurn = false;
        this.visibleTiles = [];
        this.discardedTiles = [];
        this.tiles = [];
        this.currentGame = null;
    }

    setWsConnection(ws) {
        this.ws = ws
        var curPlayer = this;
        ws.on('message', function(data) {
            curPlayer.handleRecv(data);
        });
        ws.on('close', function() {
            curPlayer.handleClose();
        });
        console.log("setWS connection");
    }

    handleClose() {
        console.log('player ' + this.username + ' disconnected!');
        this.currentGame.playerDisconnected()
        this.ws = null
    }

    handleRecv(data) {
        if(data.eventName != "KeepAlive") {
            console.log('insideHandleRecv: player ' + this.username + ' got data ' + data);
        }
        this.currentGame.handleClientResponse(this, JSON.parse(data));
    }

    sendEvent(eventName, eventData = {}) {
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

    addTileToDiscard(tile) {
        this.discardedTiles.push(tile);
    }
    
}

module.exports = Player