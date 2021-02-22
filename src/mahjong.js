const util = require('./util');
const mahjongUtil = require('./mahjong-util')
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

// const gameStates = new Set(["waitingForPlayers", "In-Progress", "Finished"])
const gameStates = {
     waitingForPlayers: "initialized",
     inProgress: "inProgress",
     finished: "finished",
}


class MahjongGame {
    constructor(gameId, tileSet='no-flowers', ruleset='southernRuleset') {
        this.discardedTiles = [];
        this.checkResponses = [];
        this.gameId = gameId
        // this.ruleset = ruleset;
        // this.mahjongLogic = mahjongLogic;

        this.createdDate = Date.now()
        console.log(`game created at: ${this.createdDate}`);
        this.players = [];
        this.joinedPlayers = 0;
        this.stateOfGame = gameStates.waitingForPlayers

        this.activePlayer = 3;

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
        this.joinedPlayers++
    }

    allPlayersJoined() {
        return this.joinedPlayers - this.players.length == 0
    }

    noActivePlayersConnected() {
        return this.joinedPlayers == 0
    }

    removePlayer(playerName) {
        //TODO actaully remove the player from the game
    }

    playerDisconnected() {
        this.joinedPlayers--
        mahjongUtil.killEmptyGames()
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
        this.stateOfGame = gameStates.inProgress
        this.players.forEach(player => {
            player.setTiles(this.takeTiles(13))
            this.sendGameStateForPlayer(player)
        })
        this.nextTurn()
    }

    sendGameStateForPlayer(player) {
        var otherPlayers = this.allOtherPlayers(player).map(otherPlayer => {
            return {
                username: otherPlayer.username
            }
        });
        var allPlayers = this.players.map(player => {
            return {
                username: player.username
            }
        });
        // console.log(this.getPlayerOfIndex(this.activePlayer).username)
        player.sendEvent('GameState', {
            tiles: player.tiles,
            players: allPlayers,
            activePlayerName: this.getPlayerOfIndex(this.activePlayer).username,
            otherPlayers: otherPlayers
        });
        this.sendAllVisibleTilesToPlayer(player)
        this.sendAllDiscardedTilesToPlayer(player)
    }

    getPlayerOfIndex(playerIndex) {
        return this.players[playerIndex]
    }

    getPlayerByName(playerName) {
        return this.players.filter( player => player.username == playerName)[0]
    }
    /*
        returns boolean of winning or not
        tile can be null
    */
    checkWin(player, tile = null) { 
        var winning = southernRuleset.checkAllWinConditions(player, tile)
        
        if(winning.winning) {
            this.allOtherPlayers(this.players[this.activePlayer]).forEach(otherPlayer => {
                otherPlayer.sendEvent("Losing", {
                    winningPlayer: this.players[this.activePlayer].username,
                    winningHand: winning.winningHand
                })
            })
            this.players[this.activePlayer].sendEvent("Winning", {
                winningPlayer: this.players[this.activePlayer].username,
                winningHand: winning.winningHand
            })
            this.stateOfGame = gameStates.finished
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
        var newActivePlayer = this.players[this.activePlayer]
        newActivePlayer.activeTurn = true;

        var newTile = null

        if(giveTile) {
            newTile = this.takeTiles(1)[0];
            newActivePlayer.addTile(newTile)
        }

        newActivePlayer.sendEvent("YourTurn", {
            newTile: newTile,
            activePlayerName: this.getPlayerOfIndex(this.activePlayer).username,
        })
        this.allOtherPlayers(newActivePlayer).forEach( otherPlayer => {
            otherPlayer.sendEvent('NextTurnNotYou', {
                activePlayerID: newActivePlayer.username,
                tiles: otherPlayer.tiles,
                activePlayerName: this.getPlayerOfIndex(this.activePlayer).username,
            })})

        winning = this.checkWin(newActivePlayer , newTile)
    }

    handleClientResponse(player, event) {
        if(event.eventName != "KeepAlive") {
            console.log('player ' + this.username + ' got event ' + event);
        }
        // console.log('Handling input event ' + event);
        switch(event.eventName) {
            case 'DiscardTile':
                if(!player.activeTurn) {
                    return
                }
                player.removeTile(event.eventData.tile)
                player.addTileToDiscard(event.eventData.tile)
                this.discardedTiles.push(event.eventData.tile)

                //do the check phase
                this.sendGameStateForPlayer(player)
                this.allOtherPlayers(player).forEach(otherPlayer => {
                    otherPlayer.sendEvent('CheckDiscardedTile', {
                        tile: event.eventData.tile,
                        possibleActions: this.checkEligibileDiscardResponses(otherPlayer)
                    })
                })
                break
            
            case 'UpdateTileOrder':
                player.tiles = event.eventData.tiles
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

    sendAllVisibleTilesToPlayer(player) {
        var visibleTilesMap =  this.players.map(curPlayer => {
            return  {
                player: curPlayer.username,
                tiles: curPlayer.visibleTiles
            }
        });
        player.sendEvent('VisibleTilesUpdate', visibleTilesMap);
    }

    sendAllDiscardedTilesToPlayer(player) {
        var discardedTilesMap = this.players.map( curPlayer => {
            return {
                player: curPlayer.username,
                tiles: curPlayer.discardedTiles
            }
        })
        player.sendEvent('DiscardedTilesUpdate', discardedTilesMap)
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
            otherPlayerID: player.username
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
                        actingPlayerID: win.player.username,
                        action: "Win",
                        lastTile: lastTile,
                        winningHand: winningHand.hand
                    })
                })
                win.player.sendEvent('Winning', {
                    winningPlayer: win.player.username,
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
                    actingPlayerID: gang.player.username,
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
                    actingPlayerID: match.player.username,
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
                    actingPlayerID: eat.player.username,
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
        
        //just send the entire gamestate, this wraps visible and discarded tiles
        this.players.forEach(player => {
            this.sendGameStateForPlayer(player)
        })
        
        this.nextTurn(nextPlayer, giveNextPlayerTile);
    }

    sendPlayerTiles(player) {
        console.log(player.tiles);
        player.sendEvent('YourTiles', {
            tiles: player.tiles
        })
    }

    findByPlayerID(username) {
        return this.players.filter(player => player.username == username)[0];
    }

    allOtherPlayers(excludedPlayer) {
        return this.players.filter(player => player != excludedPlayer);
    }
}

module.exports = MahjongGame