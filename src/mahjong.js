const util = require('./util');
const southernRuleset = require('./rulesets/southern-ruleset');
const mahjongLogic = require('./mahjong-logic');


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
    constructor(gameId, tileSet='no-flowers', ruleset='southernRuleset') {
        this.discardedTiles = [];
        this.checkResponses = [];
        this.gameId = gameId
        // this.ruleset = ruleset;
        // this.mahjongLogic = mahjongLogic;

        this.players = [];

        this.activePlayer = 0;

        if(tileSet == "flowers") {
            this.tiles = Array.from(tileSetFullwFlowers);
        } else {
            this.tiles = Array.from(tileSetFullnoFlowers);
        }
        util.shuffleArray(this.tiles);
        this.tileFrontIdx = 0;
        this.tileBackIdx = this.tiles.length - 1;
    }

    addPlayer(playerObject) {
        this.players.push(playerObject)
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
            player.setTiles(this.takeTiles(13));
            var otherPlayers = this.allOtherPlayers(player).map(otherPlayer => {
                return {
                    playerIdentifier: otherPlayer.identifier
                }
            });
            var allPlayers = this.players.map(player => {
                return {
                    playerIdentifier: player.identifier
                }
            });
            // console.log(this.getPlayerOfIndex(this.activePlayer).identifier)
            player.sendEvent('GameStart', {
                tiles: player.tiles,
                players: allPlayers,
                activePlayerName: this.getPlayerOfIndex(this.activePlayer).identifier,
                otherPlayers: otherPlayers
            });
            // //send all visible tiles at beginning of game too
            // this.sendAllVisibleTiles();
        });
        this.nextTurn();
    }

    getPlayerOfIndex(playerIndex) {
        return this.players[playerIndex]
    }

    checkWin(player, tile) { //returns boolean of winning or not
        southernRuleset.checkAllWinConditions(player, tile).winning
        
        if(winning.winning) {
            this.otherPlayers(this.players[this.activePlayer]).forEach(otherPlayer => {
                otherPlayer.sendEvent("Losing", {
                    winningPlayer: this.players[this.activePlayer].identifier,
                    winningHand: winning.winningHand
                })
            })
            this.players[this.activePlayer].sendEvent("Winning", {
                winningPlayer: this.players[this.activePlayer].identifier,
                winningHand: winning.winningHand
            })
            return true
        } else {
            return false
        }
    }

    nextTurn(nextPlayer = null, giveTile = true) {
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

        
        var winning = false

        if(giveTile) {
            //before giving the tile, check if the player won
            winning = this.checkWin(this.players[this.activePlayer], newTile)
            if(!winning) {

                var newTile = this.takeTiles(1)[0];
                this.players[this.activePlayer].addTile(newTile)
                this.players[this.activePlayer].sendEvent("YourTurn", {
                    newTile: newTile,
                    activePlayerName: this.getPlayerOfIndex(this.activePlayer).identifier,
                })
            }
        } else {
            //before giving the tile, check if the player won
            winning = this.checkWin(this.players[this.activePlayer])
            if(!winning) {

                this.players[this.activePlayer].sendEvent("YourTurn", {
                    newTile: null,
                    activePlayerName: this.getPlayerOfIndex(this.activePlayer).identifier,
                })
            }
        }

        if(!winning) {
            this.allOtherPlayers(this.players[this.activePlayer]).forEach( otherPlayer => {
                otherPlayer.sendEvent('NextTurnNotYou', {
                    activePlayerID: this.players[this.activePlayer].identifier,
                    tiles: otherPlayer.tiles,
                    activePlayerName: this.getPlayerOfIndex(this.activePlayer).identifier,
                })})
        }
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
                player.addTileToDiscard(event.eventData.tile);
                this.sendAllDiscardedTiles();
                this.discardedTiles.push(event.eventData.tile);
                //do the check phase
                this.allOtherPlayers(player).forEach(otherPlayer => {
                    otherPlayer.sendEvent('CheckDiscardedTile', {
                        tile: event.eventData.tile,
                        possibleActions: this.checkEligibileDiscardResponses(otherPlayer)
                    });

                });
                break;
            
            case 'UpdateTileOrder':
                player.tiles = event.eventData.tiles
                console.log(player.identifier + " just updated their tiles to: " + player.tiles);
                break;

            case 'Win':
            case 'Gang':
            case 'Match':
            case 'Eat':
            case 'Pass':
                this.handleCheckResponses(player, event);
                break;
        }
    }

    sendAllVisibleTiles() {

        var visibleTilesMap =  this.players.map(curPlayer => {
            return  {
                player: curPlayer.identifier,
                tiles: curPlayer.visibleTiles
            }
        });

        this.players.forEach(player => {
            player.sendEvent('VisibleTilesUpdate', visibleTilesMap);
        })
    }

    sendAllDiscardedTiles() {
        var discardedTilesMap = this.players.map( curPlayer => {
            return {
                player: curPlayer.identifier,
                tiles: curPlayer.discardedTiles
            }
        })
        this.players.forEach(player => {
            player.sendEvent('DiscardedTilesUpdate', discardedTilesMap)
        })
    }

    checkEligibileDiscardResponses(player) {
        var lastTile = this.discardedTiles[this.discardedTiles.length - 1];
        return {
            win: southernRuleset.checkAllWinConditions(player, lastTile).winning,
            gang: mahjongLogic.checkGang(player.tiles, lastTile),
            match: mahjongLogic.checkMatch(player.tiles, lastTile),
            eat: mahjongLogic.checkEat(player.tiles, lastTile, this.players.indexOf(player), this.activePlayer)
        }
    }

    handleCheckResponses(player, event) {
        // console.log(this.discardedTiles);
        var lastTile = this.discardedTiles[this.discardedTiles.length - 1];
        if (event.eventName == 'Win' && !southernRuleset.checkAllWinConditions(player, lastTile).winning) {
            player.sendEvent('InvalidCheckResponse', {});
            return false;
        } else if (event.eventName == 'Gang' && !mahjongLogic.checkGang(player.tiles, lastTile)) {
            player.sendEvent('InvalidCheckResponse', {});
            return false;
        } else if (event.eventName == 'Match' && !mahjongLogic.checkMatch(player.tiles, lastTile)) {
            player.sendEvent('InvalidCheckResponse', {});
            return false;
        } else if (event.eventName == 'Eat' && !mahjongLogic.checkEat(event.eventData, lastTile, this.players.indexOf(player), this.activePlayer)) {
            player.sendEvent('InvalidCheckResponse', {});
            return false;
        }

        player.sendEvent('SuccessfulCheckResponse', {
            playerTiles: player.tiles
        })

        if(this.checkResponses.filter(response => response.player == player).length > 0) {
            player.sendEvent('AlreadySubmittedCheckResponse', {});
            return;
        }

        this.checkResponses.push({
            player: player,
            eventName: event.eventName,
            eventData: event.eventData
        });

        this.allOtherPlayers(player).forEach(otherPlayer => otherPlayer.sendEvent('OtherPlayerRespondedToCheck', {
            checkAction: event.eventName,
            otherPlayerID: player.identifier
        }))

        if (this.checkResponses.length < 3) {
            return
        }
        var win = this.checkResponses.filter( response => response.eventName == 'Win')[0]
        var gang = this.checkResponses.filter( response => response.eventName == 'Gang')[0]
        var match = this.checkResponses.filter( response => response.eventName == 'Match')[0]
        var eat = this.checkResponses.filter( response => response.eventName == 'Eat')[0]
        
        this.checkResponses = [];
        
        var nextPlayer = null;
        var giveNextPlayerTile = true;

        if(win) {
            lastTile = this.discardedTiles.pop();
            this.players[this.activePlayer].discardedTiles.pop();
            var winningHand = southernRuleset.checkAllWinConditions(win.player, lastTile)
            if(winningHand.winning) {
                this.allOtherPlayers(win.player).forEach( otherPlayer => {
                    otherPlayer.sendEvent('Losing', {
                        actingPlayerID: win.player.identifier,
                        action: "Win",
                        lastTile: lastTile,
                        winningHand: winningHand.hand
                    })
                })
                win.player.sendEvent('Winning', {
                    winningPlayer: win.player.identifier,
                    winningHand: winningHand.hand
                })
                this.sendPlayerTiles(win.player)
            }
            
        } else if(gang) {
            lastTile = this.discardedTiles.pop();
            this.players[this.activePlayer].discardedTiles.pop();
            mahjongLogic.implementGang(gang.player, lastTile);
            this.allOtherPlayers(gang.player).forEach( otherPlayer => {
                otherPlayer.sendEvent('CheckPhaseResolved', {
                    actingPlayerID: gang.player.identifier,
                    action: "Gang",
                    lastTile: lastTile,
                })
            })

            var newTile = this.takeTiles(1, true)[0];
            gang.player.tiles.push(newTile);
            gang.player.sendEvent('GiveSupplementalTile', {
                tile: newTile
            });
            nextPlayer = gang.player;
            giveNextPlayerTile = false;
            this.sendPlayerTiles(gang.player)

        } else if(match) {
            lastTile = this.discardedTiles.pop();
            this.players[this.activePlayer].discardedTiles.pop();
            mahjongLogic.implementMatch(match.player, lastTile);
            this.allOtherPlayers(match.player).forEach( otherPlayer => {
                otherPlayer.sendEvent('CheckPhaseResolved', {
                    actingPlayerID: match.player.identifier,
                    action: "Matched",
                    lastTile: lastTile,
                    //are we passing stuff here or no?
                })
            })
            nextPlayer = match.player;
            giveNextPlayerTile = false
            this.sendPlayerTiles(match.player)
            
        } else if(eat) {
            lastTile = this.discardedTiles.pop();
            this.players[this.activePlayer].discardedTiles.pop();
            mahjongLogic.implementEat(eat.player, lastTile, eat.eventData);
            this.allOtherPlayers(eat.player).forEach( otherPlayer => {
                otherPlayer.sendEvent('CheckPhaseResolved', {
                    actingPlayerID: eat.player.identifier,
                    action: "Ate",
                    lastTile: lastTile,
                })
            })
            nextPlayer = eat.player;
            giveNextPlayerTile = false
            this.sendPlayerTiles(eat.player)
        } else {
            //do nothing, go to expected next turn
            this.players.forEach( otherPlayer => {
                otherPlayer.sendEvent('CheckPhaseResolved', {
                    actingPlayerID: null,
                    action: 'Pass',
                    lastTile: lastTile,
                })
            })
        }
        
        this.sendAllVisibleTiles();
        this.sendAllDiscardedTiles();
        this.nextTurn(nextPlayer, giveNextPlayerTile);
    }

    sendPlayerTiles(player) {
        console.log(player.tiles);
        player.sendEvent('YourTiles', {
            tiles: player.tiles
        })
    }

    findByPlayerID(identifier) {
        return this.players.filter(player => player.identifier == identifier)[0];
    }

    allOtherPlayers(excludedPlayer) {
        return this.players.filter(player => player != excludedPlayer);
    }
}

module.exports = MahjongGame