const util = require('./util')

//referencing this https://en.wikipedia.org/wiki/Mahjong_tiles
//TODO add the rest
const dotTiles = Array.from(Array(9).keys()).map((x) => x + 1).map((x) => "dots_" + x);
const bambooTiles = Array.from(Array(9).keys()).map((x) => x + 1).map((x) => "bamboo_" + x);
const characterTiles = Array.from(Array(9).keys()).map((x) => x + 1).map((x) => "char_" + x);

const tileSet = dotTiles.concat(bambooTiles).concat(characterTiles);

class MahjongGame {
    constructor(players) {
        this.players = players;
        this.tiles = Array.from(tileSet);
        util.shuffleArray(this.tiles);
        this.tileFrontIdx = 0;
        this.tileBackIdx = this.tiles.length - 1
    }

    get tilesLeft() {
        return this.tileBackIdx - this.tileFrontIdx + 1;
    }

    takeTiles(count, useBack = false) {
        //there are edge cases here
        var tileSubset = [];

        if(useBack) {
            tileSubset = this.tiles.slice(this.tileBackIdx + 1 - count, this.tileBackIdx + 1).reverse();
            this.tileBackIdx -= count;
        }else {
            tileSubset = this.tiles.slice(this.tileFrontIdx, this.tileFrontIdx + count);
            this.tileFrontIdx += count;
        }
        return tileSubset;
    }

    start() {
        console.log("New game starting...");
        console.log(this.tiles);
        this.players.forEach(player => player.socketSend("Game Starting..."));
    } 
}

module.exports = MahjongGame