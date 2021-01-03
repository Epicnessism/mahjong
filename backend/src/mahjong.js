const util = require('./util')

//referencing this https://en.wikipedia.org/wiki/Mahjong_tiles
//TODO add the rest
const dotTiles = Array.from(Array(9).keys()).map((x) => x + 1).map((x) => "dot_" + x);  //x4
const bambooTiles = Array.from(Array(9).keys()).map((x) => x + 1).map((x) => "bamboo_" + x); //x4
const tenkTiles = Array.from(Array(9).keys()).map((x) => x + 1).map((x) => "tenk_" + x); //x4
const characterTiles = Array.from(Array(7).keys()).map((x) => x + 1).map((x) => "char_" + x); //x4
const flowerTiles = Array.from(Array(4).keys()).map((x) => x + 1).map((x) => "flower_" + x); //x2 //separated the flowers since flowers are only used in certain sets of mahjong not all.

const tileSuitSetUnique = dotTiles.concat(bambooTiles).concat(tenkTiles).concat(characterTiles);
const tileSetFullnoFlowers = tileSuitSetUnique.concat(tileSuitSetUnique).concat(tileSuitSetUnique).concat(tileSuitSetUnique);
const tileSetFullwFlowers = tileSetFullnoFlowers.concat(flowerTiles).concat(flowerTiles);

class MahjongGame {
    constructor(players, gameType='') {
        this.players = players;
        this.activePlayer = -1;
        if(gameType == "flowers") {
            this.tiles = Array.from(tileSetFullwFlowers);
        } else {
            this.tiles = Array.from(tileSetFullnoFlowers);
        }
        util.shuffleArray(this.tiles);
        this.tileFrontIdx = 0;
        this.tileBackIdx = this.tiles.length - 1;
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
        // console.log(this.tiles);
        this.players.forEach(player => {
            player.setTiles(this.takeTiles(13))
            console.log("doing something");
            player.socketSend(
                JSON.stringify({
                    eventName:"GameStartSendingTiles",
                    tiles: player.tiles
                })
            )
        });
        this.nextTurn();
    }

    nextTurn() {
        if(this.activePlayer == 3) {
            this.activePlayer = 0;
        } else {
            this.activePlayer++;
        }
        newTile = this.tiles.takeTiles(1);
        this.player[this.activePlayer].addTile(newTile)
        this.player[this.activePlayer].socketSend(
            JSON.stringify({
                eventName: "NextTurn",
                newTile: newTile
            })
        )
        this.players.filter(player => player != this.players[this.activePlayer]).forEach( otherPlayer => {
            otherPlayer.socketSend(
                JSON.stringify({
                    eventName: "NextTurnNotYou",
                    playerID: this.players[this.activePlayer].identifier
                })
            )
        })
    }
}


module.exports = MahjongGame