const thirteenSinglesUniqueSet = [
    "char_1", 
    "char_2", 
    "char_3", 
    "char_4", 
    "char_5", 
    "char_6", 
    "char_7", 
    "char_8", 
    "tenk_1", 
    "tenk_9", 
    "dot_1", 
    "dot_9", 
    "bamboo_1", 
    "bamboo_9"]

const suits = ["tenk","dot", "bamboo"]

// returns a boolean value for now???
//actually it will probably need to return an username for future meta-play where
//winning multiple rounds and depending on which of the win-cons you meet, can change score (money)
//multiplier, like if you win 2 in a row as host a x or y, with the thirteenSingles its like x26 or something lol
function checkAllWinConditions(player, winningTile = null) {
    var standardWin = standard(player, winningTile)
    var thirteenSinglesWin = thirteenSingles(player, winningTile)
    var sevenPairsWin = sevenPairs(player, winningTile)

    if(standardWin.winning) {
        console.log(`standardWin winning: ${standardWin}`);
        return standardWin
    }
    if(thirteenSinglesWin.winning) {
        console.log(`thirteenSinglesWin winning: ${thirteenSinglesWin}`);
        return thirteenSinglesWin
    }
    if(sevenPairsWin.winning) {
        console.log(`sevenPairsWin winning: ${sevenPairsWin}`);
        return sevenPairsWin
    }
    return false
    //alternate code but looks terrible and probably wont work in the future
    // return standardWin(player) && thirteenSingles(player) && sevenPairs(player)
}

//this is actually the hardest one to calculate....
//x1
function standard(player, winningTile = null) {
    var playerTiles = Array.from(player.tiles).sort()
    if(winningTile != null) {
        playerTiles.push(winningTile)
    }
    var winningHand = []
    winningHand = recursiveStandard(playerTiles, [])
    if(winningHand != false) {
        winningHand = winningHand.concat(player.visibleTiles)
        if (winningHand.length >= 5) {
            return {
                winning: true,
                winningHand: winningHand
            }
        }
    }
    return {
        winning: false,
        winningHand: null
    }
}

function recursiveStandard(playerTiles, winningHand) {
    if(playerTiles.length == 0) {
        return winningHand//winning //list of lists
    }
    var activeSuit = playerTiles[0].split("_")[0] //gets the suit of the first tile
    var activeValue = parseInt(playerTiles[0].split("_")[1]) //get the value of the first tile

    var playerTilesMap = playerTiles.map( tile => { return { suit: tile.split("_")[0], value: tile.split("_")[1] } })
    var activeSet = playerTiles.filter( tile => tile == playerTiles[0])
    var nextTile1 = playerTilesMap.filter(tile => tile.suit == activeSuit && tile.value == activeValue+1)
    var nextTile2 = playerTilesMap.filter(tile => tile.suit == activeSuit && tile.value == activeValue+2)
    
    if(activeSet.length == 4 || activeSet.length == 3) { //that means its a gang or a match
        var remainingTiles = playerTiles.filter(tile => !activeSet.includes(tile))
        winningHand.push(activeSet)
        var res = recursiveStandard(remainingTiles, winningHand) //continue winning
        if (res == false) {
            winningHand.pop()
        } else {
            return winningHand
        }
    }
    if(activeSet.length == 2) {
        var remainingTiles = playerTiles.filter(tile => !activeSet.includes(tile))
        winningHand.push(activeSet) //it's a pair
        var res = recursiveStandard(remainingTiles, winningHand) //continue winning
        if (res == false) {
            winningHand.pop()
        } else {
            return winningHand
        }
    }

    if(activeSet.length >= 1 && activeSuit != "char" && nextTile1.length > 0 && nextTile2.length > 0 ) {
        var remainingTiles = playerTiles
        var firstTile = remainingTiles.splice(0,1)[0]
        nextTile1 = remainingTiles.splice(remainingTiles.indexOf((nextTile1[0].suit + "_" + nextTile1[0].value).toString()), 1)[0]
        nextTile2 = remainingTiles.splice(remainingTiles.indexOf((nextTile2[0].suit + "_" + nextTile2[0].value).toString()), 1)[0]
        var eatSet = [firstTile, nextTile2, nextTile2]
        winningHand.push(eatSet)
        var res = recursiveStandard(remainingTiles, winningHand)
        if (res == false) {
            winningHand.pop()
        } else {
            return winningHand
        }
    }
    return false //losing
}

// you must have one of EACH char tile, one of the 1 and 9 tiles for EACH suit, and you must have another duplicate of any of these.
//x13
function thirteenSingles(player, winningTile = null) {
    var inHandTiles = player.tiles.map(tile => tile) //shallow copy player tiles so we don't mess with the original
    if(winningTile != null) {
        inHandTiles.push(winningTile)
    }
    //there should be no visible tiles that matter for winning
    // var visibleTiles = Array.from(player.visibleTiles); //shallow copy this too
    // var playerTiles = concatPlayerTiles(player)
    // console.log("THIRTEENSINGLES: playerTiles: ", inHandTiles)
    
    //get rid of flower tiles
    var playerTilesSanitized = unIncludeFlowers(inHandTiles) //there shouldnt be any flowers to sanitize either tbh...
    
    //return false if contains unexpected characters
    var unexpectedTilesCount = playerTilesSanitized.filter(tile => !thirteenSinglesUniqueSet.includes(tile)).length
    if(unexpectedTilesCount != 0) {
        return false
    }

    //check if there is at least 1 duplicate
    playerTilesSanitized.forEach(tile => {
        var count = playerTilesSanitized.filter(countTile => countTile == tile).length
        if (count === 2) {
            //if you get here, then return true, you win
            return {
                winning: true,
                winningHand: playerTilesSanitized
            }
        }
    })
    //otherwise you did not win
    return {
        winning: false,
        winningHand: playerTilesSanitized
    }
}

//returns array of tiles that have only game tiles
function unIncludeFlowers(playerTiles) {
    const toUninclude = ["flower_1", "flower_2", "flower_3","flower_4"]
    return playerTiles.filter( tile => !toUninclude.includes(tile))

}

function concatPlayerTiles(player) {
    return playerTiles = player.tiles.concat(player.visibleTiles)
}

//
//x4 or 7? i forget
function sevenPairs(player, winningTile = null) {
    var inHandTiles = player.tiles.map(tile => tile) //shallow copy player tiles so we don't mess with the original
    if(winningTile != null) {
        inHandTiles.push(winningTile)
    }

    //should be nothing to concat since no visible tiles that matter
    // var playerTiles = concatPlayerTiles(player)
    // console.log("SEVENPAIRS: playerTiles concated: ", playerTiles)
    
    //get rid of unwanted tiles
    var playerTilesSanitized = unIncludeFlowers(inHandTiles)

    //check if each tile has a pair
    var pair = 0;
    playerTilesSanitized.forEach(tile => {
        var count = playerTilesSanitized.filter(otherTile => otherTile == tile).length
        if (count === 2) {
            pair++
        }
    });
    if (pair === 14) { //this should probably be rewritten with better logic buuuuut this works for now
        return {
            winning: true,
            winningHand: playerTilesSanitized
        }
    }
    return {
        winning: false,
        winningHand: playerTilesSanitized
    }

}

//many....many more.....that I and most people don't even know fully


module.exports = {
    checkAllWinConditions,
    standard
}


