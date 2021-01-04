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
        this.discardedTiles = [];

        this.players = players;
        
        this.players.forEach(player => player.currentGame = this);

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
        console.log("New game starting");
        this.players.forEach(player => {
            player.setTiles(this.takeTiles(13))
            player.sendEvent('GameStart', {
                tiles: player.tiles
            });
        });
        this.nextTurn();
    }

    nextTurn() {
        console.log('Starting Next Player Turn')
        if(this.activePlayer != -1) {
            this.players[this.activePlayer].activeTurn = false;
        }

        if(this.activePlayer == 3) {
            this.activePlayer = 0;
        } else {
            this.activePlayer++;
        }

        this.players[this.activePlayer].activeTurn = true;

        var newTile = this.takeTiles(1);
        this.players[this.activePlayer].addTile(newTile)
        this.players[this.activePlayer].sendEvent("YourTurn", {
            newTile: newTile
        });
        this.allOtherPlayers(this.players[this.activePlayer]).forEach( otherPlayer => {
            otherPlayer.sendEvent('NextTurnNotYou', {
                playerID: this.players[this.activePlayer].identifier
            })});
    }

    handleClientResponse(player, eventData) {
        switch(eventData.eventName) {
            case 'DiscardTile':
                
                if(!player.activeTurn) {
                    return
                }

                player.removeTile(eventData.tile);
                this.discardedTiles.push(eventData.tile);
                //do the check phase
                this.allOtherPlayers(player).sendEvent('CheckDiscardedTile', {
                    tile: tile
                })

        }
    }

    findByPlayerID(identifier) {
        return this.players.filter(player => player.identifier == identifier)[0];
    }

    allOtherPlayers(excludedPlayer) {
        return this.players.filter(player => player != excludedPlayer);
    }
}

module.exports = MahjongGame