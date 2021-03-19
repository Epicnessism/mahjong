const util = require('./util');
const mahjongUtil = require('./mahjong-util')
const southernRuleset = require('./rulesets/southern-ruleset');
const mahjongLogic = require('./mahjong-logic');


const gameStates = {
     waitingForPlayers: "initialized",
     inProgress: "inProgress",
     finished: "finished",
}

class MahjongGame {
    constructor(gameId, tileSet='no-flowers', ruleset='southernRuleset') {
        this.discardedTiles = []
        this.checkResponses = []
        this.turnOrder = []
        this.gameId = gameId
        // this.ruleset = ruleset;
        this.createdDate = Date.now()
        console.log(`game created at: ${this.createdDate}`);
        this.players = [];
        this.joinedPlayers = 0;
        this.stateOfGame = gameStates.waitingForPlayers
        this.activePlayer = 3;

        if(tileSet == "flowers") {
            this.tiles = mahjongUtil.getGameTiles(true)
        } else {
            this.tiles = mahjongUtil.getGameTiles()
        }
        util.shuffleArray(this.tiles);

        this.tileFrontIdx = 0;
        this.tileBackIdx = this.tiles.length - 1;
        
        
    }

    setTurnOrderBasedOnFirstPlayer(playerName) {
        var firstPlayerIndex = this.players.map(player => {
            return player.username
        }).findIndex(playerName)
        
        // this.turnOrder = [this.player]



        if(!this.turnOrder.includes(playerName)) {
            this.turnOrder.push(playerName)
        }
        if(this.turnOrder.length > 4) {
            console.log("WARNING TURNORDER SIZE > 4")
        }
    }

    clearTurnOrder() {
        this.turnOrder = []
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
        console.log("New game starting")
        this.stateOfGame = gameStates.inProgress
        this.players.forEach(player => {
            player.setTiles(this.takeTiles(13))
            this.sendGameStateForPlayer(player)
        })
        this.nextTurn()
    }

    sendGameStateForPlayer(player, discardedTile = null, actionMessage = null, actionPlayerName = null) {
        const playerNames = this.players.map(player => {
            return { username: player.username }
        })
        var visibleTilesMap =  this.players.map(curPlayer => {
            return  {
                player: curPlayer.username,
                tiles: curPlayer.visibleTiles
            }
        })
        var discardedTilesMap = this.players.map( curPlayer => {
            return {
                player: curPlayer.username,
                tiles: curPlayer.discardedTiles
            }
        })
        // var possibleActions = discardedTile != null ? this.checkEligibileDiscardResponses(player) : null
        
        player.sendEvent('GameState', {
            actionMessage: actionMessage != null ? actionMessage : "No Action Message",
            actionPlayerName: actionPlayerName != null ? actionPlayerName : "No Action Player",
            tiles: player.tiles,
            playerNames: playerNames,
            activePlayerName: this.getPlayerOfIndex(this.activePlayer).username,
            stateOfGame: this.stateOfGame,
            visibleTilesMap: visibleTilesMap,
            discardedTilesMap: discardedTilesMap,
            discardedTile: player != this.players[this.activePlayer] ? discardedTile : null,
            possibleActions: discardedTile != null && player != this.players[this.activePlayer] ? this.checkEligibileResponses(player, this.players[this.activePlayer].tiles[this.players[this.activePlayer].tiles.length - 1]) : null
        })
    }

    sendInvalidStateForPlayer(player, invalidStateMessage) {
        player.sendEvent(invalidStateMessage)
    }

    getPlayerOfIndex(playerIndex) {
        return this.players[playerIndex]
    }

    getPlayerByName(playerName) {
        return this.players.filter( player => player.username == playerName)[0]
    }

    /*
    * @param {Player} player object to check win on
    * @param {String} default null
    * @returns {boolean}
    */
    checkWin(player, tile = null) { 
        var winning = southernRuleset.checkAllWinConditions(player, tile)
        console.log("winning: ", winning);
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
        console.log("next turned");
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
            anGangable: mahjongLogic.checkAnGang(newActivePlayer),
            activePlayerName: this.getPlayerOfIndex(this.activePlayer).username,
        })
        this.allOtherPlayers(newActivePlayer).forEach( otherPlayer => {
            otherPlayer.sendEvent('NextTurnNotYou', {
                activePlayerID: newActivePlayer.username,
                tiles: otherPlayer.tiles,
                activePlayerName: this.getPlayerOfIndex(this.activePlayer).username,
            })})

        this.checkWin(newActivePlayer)
    }
    
    discardTile(player, tile) {
        if(!player.activeTurn) {
            return
        }
        player.removeTile(tile)
        player.addTileToDiscard(tile)
        this.discardedTiles.push(tile)
    }

    handleClientResponse(player, event) {
        if(event.eventName != "KeepAlive") {
            console.log('player ' + player.username + ' got event ' + event);
        }
        switch(event.eventName) {
            case 'DiscardTile':
                this.discardTile(player, event.eventData.tile)
                this.players.forEach(eachPlayer => {
                    this.sendGameStateForPlayer(eachPlayer, event.eventData.tile)
                })
                break
            case 'Win':
            case 'Gang':
            case 'Match':
            case 'Eat':
            case 'Pass':
                this.handleCheckResponses(player, event);
                break
            case 'MingGang':
                const mingGangRes = mahjongLogic.implementMingGang(player, event.eventData.tileToGang)
                if(mingGangRes) {
                    this.players.forEach( eachPlayer => {
                        this.sendGameStateForPlayer(eachPlayer, null, "mingGang", player.username)
                    })
                } else {
                    console.log("Error, mingGang failed to implement.");
                    this.players.forEach(eachPlayer => this.sendInvalidStateForPlayer(eachPlayer, "Error, mingGang failed to implement."))
                }
                break
            case 'AnGang':
                const anGangRes = mahjongLogic.implementAnGang(player, event.eventData.tileToGang)
                if(anGangRes) {
                    this.players.forEach( eachPlayer => {
                        this.sendGameStateForPlayer(eachPlayer, null, "AnGang", player.username)
                    })
                }
                else {
                    console.log("Error, AnGang failed to implement.");
                    this.players.forEach(eachPlayer => this.sendInvalidStateForPlayer(eachPlayer, "Error, AnGang failed to implement."))
                }
                break

            case 'NextGameCreated':
                console.log('Got NextGameCreated: ', event.eventData.newGameId);
                this.allOtherPlayers(player).forEach( otherPlayer => {
                    console.log(otherPlayer);
                    otherPlayer.sendEvent('NextGameInvite', {
                        creatingPlayer: player.username,
                        newGameId: event.eventData.newGameId
                    })
                })
                break
        }
    }

    checkEligibileResponses(player, newTile = null) {
        var lastTile = this.discardedTiles[this.discardedTiles.length - 1];
        return {
            win: southernRuleset.checkAllWinConditions(player, lastTile).winning,
            gang: mahjongLogic.checkGang(player.tiles, lastTile),
            match: mahjongLogic.checkMatch(player.tiles, lastTile),
            eat: mahjongLogic.checkEat(player.tiles, lastTile, this.players.indexOf(player), this.activePlayer),
            anGang: mahjongLogic.checkAnGang(player, newTile),
            mingGang: mahjongLogic.checkMingGang(player, newTile),
        }
    }

    handleCheckResponses(player, event) {
        console.log("inside handleResposes");
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
        console.log("checking length: {}", this.checkResponses.length < 3);
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
                        winningHand: winningHand.winningHand
                    })
                })
                console.log(`winningHand: `, winningHand);
                win.player.sendEvent('Winning', {
                    winningPlayer: win.player.username,
                    winningHand: winningHand.winningHand
                })
                // this.sendPlayerTiles(win.player)
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
            // this.sendPlayerTiles(gang.player)
            // this.sendGameStateForPlayer(match.player)

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
            // this.sendPlayerTiles(match.player)
            // this.sendGameStateForPlayer(match.player)
            
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
            // this.sendPlayerTiles(eat.player)
            // this.sendGameStateForPlayer(match.player)
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
            console.log("send game state for player: ", player);
            this.sendGameStateForPlayer(player)
        })
        
        this.nextTurn(nextPlayer, giveNextPlayerTile);
    }

    findByPlayerID(username) {
        return this.players.filter(player => player.username == username)[0];
    }

    allOtherPlayers(excludedPlayer) {
        return this.players.filter(player => player != excludedPlayer);
    }
}

module.exports = MahjongGame