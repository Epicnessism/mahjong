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