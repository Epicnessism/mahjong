
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



// returns a boolean value for now???
//actually it will probably need to return an identifier for future meta-play where
//winning multiple rounds and depending on which of the win-cons you meet, can change score (money)
//multiplier, like if you win 2 in a row as host a x or y, with the thirteenSingles its like x26 or something lol
function checkAllWinConditions(player) {
    if(standardWin(player)) {
        return true
    }
    if(thirteenSingles(player)) {
        return true
    }
    if(sevenPairs(player)) {
        return true
    }
    return false
    //alternate code but looks terrible and probably wont work in the future
    // return standardWin(player) && thirteenSingles(player) && sevenPairs(player)
}

//this is actually the hardest one to calculate....
//x1
function standardWin(player) {

}

// you must have one of EACH char tile, one of the 1 and 9 tiles for EACH suit, and you must have another duplicate of any of these.
//x13
function thirteenSingles(player) {
    var playerTiles = player.tiles.concat(player.visibleTiles)
    console.log("THIRTEENSINGLES: playerTiles concated: ", playerTiles)
    
    //get rid of unwanted tiles
    playerTilesSanitized = unIncludeFlowers(playerTiles)
    
    //return not true if contains unexpected characters
    var unexpectedTilesCount = !playerTiles.filter(tile => !thirteenSinglesUniqueSet.includes(tile)).length > 0
    
    //check if there is at least 1 duplicate
    playerTiles.forEach(tile => {
        var count = playerTiles.filter(tile).length
        if (count === 2) {
            //if you get here, then return true, you win
            return true
        }
    });

    //otherwise you did not win
    return false

}


//returns array of tiles that have only game tiles
function unIncludeFlowers(playerTiles) {
    var unInclude = ["flower_1", "flower_2", "flower_3","flower_4"]
    return playerTiles.filter( tile => !unInclude.includes(tile))

}

function concatPlayerTiles(player) {
    return playerTiles = player.tiles.concat(player.visibleTiles)
}



//
//x4 or 7? i forget
function sevenPairs(players) {
    var playerTiles = concatPlayerTiles(player)
    console.log("SEVENPAIRS: playerTiles concated: ", playerTiles)
    
    //get rid of unwanted tiles
    playerTilesSanitized = unIncludeFlowers(playerTiles)

    //check if each tile has a pair
    var pair = 0;
    playerTiles.forEach(tile => {
        var count = playerTiles.filter(tile).length
        if (count === 2) {
            pair++
        }
    });
    if (pair === 14) { //this should probably be rewritten with better logic buuuuut this works for now
        return true
    }
    return false

}

//many....many more.....that I and most people don't even know fully

module.exports = {
    checkAllWinConditions
}