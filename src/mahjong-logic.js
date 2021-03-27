
function checkMatch(playerTiles, lastTile) {
    return playerTiles.filter( tile => tile == lastTile).length >= 2
}

function checkWin(player, tile = null) {

}

function checkAnGang(player, newTile = null) {
    if(newTile != null) {
        return player.tiles.filter( tile => tile == newTile).length == 4
    }
    player.tiles.forEach( thisTile => {
        if(player.tiles.filter( tile => tile == thisTile).length == 4) {
            return true
        }
    })
    return false
}

/**
 * * Ming Gang is when the player has a visible match and draws the 4th tile for that set
 * * we assume that newTile cannot be null since it MUST be a newTile
 * @param {Player} player 
 * @param {String} newTile
 * @returns {boolean} true of mingGangable
 */
function checkMingGang(player, newTile) {
    return player.visibleTiles.some( visibleSet => visibleSet.includes(newTile) && visibleSet.filter( tile => visibleSet[0] == tile).length == 3)
}

function checkGang(playerTiles, lastTile) {
    return playerTiles.filter( tile => tile == lastTile).length == 3
}


function checkEat(playerTiles, lastTile, playerIndex, discarderIndex) {

    if(++discarderIndex % 4 != playerIndex) {
        console.log("Couldn't eat due to wrong order");
        return false;
    }

    var suit = lastTile.split("_")[0];
    var value = parseInt(lastTile.split("_")[1]);
    var lowerBound = value;
    var upperBound = value;
    
    if(suit == 'char' || suit == 'flower') {
        console.log(`Couldn't eat due to incorrect suit: ${suit}`)
        return false
    }

    while(true) {
        var nextTile = suit + "_" + (lowerBound - 1).toString()
        if(playerTiles.filter(tile => tile == nextTile).length > 0) {
            lowerBound--
        }else {
            break
        }
    }
    while(true) {
        var nextTile = suit + "_" + (upperBound + 1).toString()
        if(playerTiles.filter(tile => tile == nextTile).length > 0) {
            upperBound++
        }else {
            break
        }
    }

    var straightLength = upperBound - lowerBound + 1
    if(straightLength < 3) {
        console.log("Couldn't eat due to incorrect tiles")
        return false
    }

    return true
}

/*
    expects that all tiles are already in the player.tiles
    tileToGang is just an identifier to know what to get since its unlikely but possible that
    a player may have more than one AnGangable tiles....
*/
function implementAnGang(player, tileToGang) {
    var gangedTiles = player.tiles.filter(tile => tile == tileToGang)
    if(gangedTiles.length == 4) {
        player.visibleTiles.push(gangedTiles)
        player.tiles = player.tiles.filter( tile => !gangedTiles.includes(tile))
        return true
    }
    return false
}
/**
 * * Should add tile to visibleSet that was Ganged
 * * Should add reinforced tile to player hand
 * * should remove newTile from playerHand -- YES since newTile will be added to hand prior to userinput to press button to mingGang
 * * Does handle lastTile, DiscardedTile of player as well
 * * no handling of lastTile or discard tile needed since this is a self-draw
 * @param {Player} player 
 * @param {String} tileToGang 
 * @returns {boolean} mingGanged
 */
function implementMingGang(player, tileToGang) {
    var mingGanged = false
    if(checkMingGang(player, tileToGang)) {
        player.visibleTiles.find( visibleSet => {
            if(visibleSet.filter(tile => tile == visibleSet[0]).length == 3 && visibleSet[0] == tileToGang) {
                visibleSet.push(player.tiles.splice(player.tiles.findIndex( tile => tile == tileToGang), 1)) //remove the first instance of this tile, push it to visibleSet
                player.tiles.push(player.currentGame.takeTiles(1, true)[0]) //take reinforced tile from currentGame and add to player tiles
                // player.currentGame.discardedTiles.pop() //remove lastTile since it was used
                // player.currentGame.players[player.currentGame.activePlayer].discardedTiles.pop() //remove it from the player's discardedTiles that discarded that tile
                mingGanged = true
                return true //returning true speeds up optimization, stops .find() immediately after getting here
            }
            return false //false continues .find()
        })
    }
    return mingGanged
}

/**
 * * Does not remove or alter lastTile
 * @param {*Player} player 
 * @param {*String} lastTile 
 */
function implementGang(player, lastTile) {
    var gangedTiles = player.tiles.filter( tile => tile == lastTile);
    gangedTiles.push(lastTile);
    player.tiles = player.tiles.filter(tile => tile != lastTile);
    player.visibleTiles.push(gangedTiles);
    console.log("Gang Visible Tiles: " + player.visibleTiles);
}

function implementMatch(player, lastTile) {
    var matchedTiles = player.tiles.filter( tile => tile == lastTile);
    matchedTiles.push(lastTile);
    player.visibleTiles.push(matchedTiles);
    player.tiles = player.tiles.filter(tile => tile != lastTile);
    console.log("Match Visible Tiles: " + player.visibleTiles);
}

function implementEat(player, lastTile, listOfSelectedTiles) {
    console.log(listOfSelectedTiles);
    var eatenTiles = listOfSelectedTiles;
    eatenTiles.push(lastTile);
    player.visibleTiles.push(eatenTiles);

    var firstIndex = player.tiles.findIndex(tile => tile == listOfSelectedTiles[0])
    player.tiles.splice(firstIndex, 1)
    var secondIndex = player.tiles.findIndex(tile => tile == listOfSelectedTiles[1])
    player.tiles.splice(secondIndex, 1)
    
    // player.tiles = player.tiles.filter(tile => !listOfSelectedTiles.includes(tile)); //get tiles not included in this other list
    console.log("Eat Visible Tiles: " + player.visibleTiles);
}

module.exports = {
    checkWin,
    checkAnGang,
    checkMingGang,
    checkGang,
    checkMatch,
    checkEat,
    implementAnGang,
    implementMingGang,
    implementGang,
    implementMatch,
    implementEat
};