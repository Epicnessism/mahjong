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
        this.checkResponses = [];

        this.players = players;
        
        this.players.forEach(player => player.currentGame = this);

        this.activePlayer = 0;

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

    takeTiles(count, useBack = false) { //returns a fucking list
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

    nextTurn(nextPlayer = null) {
        this.players[this.activePlayer].activeTurn = false;
        if(nextPlayer) {
            this.activePlayer = this.players.indexOf(nextPlayer);
        } else {
            if(this.activePlayer == 3) {
                this.activePlayer = 0;
            } else {
                this.activePlayer++;
            }
        }
        this.players[this.activePlayer].activeTurn = true;

        var newTile = this.takeTiles(1)[0];
        this.players[this.activePlayer].addTile(newTile)
        this.players[this.activePlayer].sendEvent("YourTurn", {
            newTile: newTile
        });
        this.allOtherPlayers(this.players[this.activePlayer]).forEach( otherPlayer => {
            otherPlayer.sendEvent('NextTurnNotYou', {
                activePlayerID: this.players[this.activePlayer].identifier,
                tiles: otherPlayer.tiles
            })});
    }

    handleClientResponse(player, event) {
        console.log('Handling input event ' + event);
        switch(event.eventName) {
            case 'DiscardTile':
                if(!player.activeTurn) {
                    console.log('Nonactive player tried to discard tile!');
                    return
                }
                console.log('Player ' + player.identifier + ' has discarded ' + event.eventData.tile);

                player.removeTile(event.eventData.tile);
                this.discardedTiles.push(event.eventData.tile);
                //do the check phase
                this.allOtherPlayers(player).forEach(otherPlayer => {
                    otherPlayer.sendEvent('CheckDiscardedTile', {
                        tile: event.eventData.tile
                    });
                });
                break;

            case 'Win':
            case 'Gang':
            case 'Match':
            case 'Eat':
            case 'Pass':
                this.handleCheckResponses(player, event.eventName);
                break;
        }
    }

    handleCheckResponses(player, eventName) {
        this.checkResponses.push({
            player: player,
            eventName: eventName
        });

        this.allOtherPlayers(player).forEach(otherPlayer => otherPlayer.sendEvent('OtherPlayerRespondedToCheck', {
            checkAction: eventName,
            otherPlayerID: player.identifier
        }))

        if (this.checkResponses.length < 3) {
            return
        }
        var win = this.checkResponses.filter( response => response.eventName == 'Win')[0]
        var gang = this.checkResponses.filter( response => response.eventName == 'Gang')[0]
        var match = this.checkResponses.filter( response => response.eventName == 'Match')[0]
        var eat = this.checkResponses.filter( response => response.eventName == 'Eat')[0]
        if(win) {
            //    do later
        } else if(gang) {
            //do gang logic here
            this.nextTurn(gang.player);
        } else if(match) {
            this.nextTurn(match.player);
        } else if(eat) {
            this.nextTurn(eat.player);
        }
        //do nothing, go to expected next turn
        this.nextTurn();
    }

    findByPlayerID(identifier) {
        return this.players.filter(player => player.identifier == identifier)[0];
    }

    allOtherPlayers(excludedPlayer) {
        return this.players.filter(player => player != excludedPlayer);
    }
}

module.exports = MahjongGame