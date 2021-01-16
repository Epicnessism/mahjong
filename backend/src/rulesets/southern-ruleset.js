
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
    // var playerTiles = concatPlayerTiles(player)
    var inHandTiles = player.tiles;
    var visibleTiles = player.visibleTiles;

    var winningHand = []; //2D array of winning hand + sets

    // console.log("STANDARD: playerTiles concated: ", playerTiles)

    //get rid of flowers
    var sanitizedVisibleTiles = unIncludeFlowers(visibleTiles)

    sanitizedVisibleTiles.forEach(set => winningHand.push(set)) //add visible sets to your winning hand
    //calculate visible tiles?
    //do we need to even calculate visible tiles? no right

    //calculate in hand tiles
    //split into suits first?
    var tenkTileValues = inHandTiles.filter( tile => tile.split("_")[0] == "tenk").map( tile => parseInt(tile.split("_")[1])).sort(function(a, b){return a-b})
    var dotTileValues = inHandTiles.filter( tile => tile.split("_")[0] == "dot").map( tile => parseInt(tile.split("_")[1])).sort(function(a, b){return a-b})
    var bambooTileValues = inHandTiles.filter( tile => tile.split("_")[0] == "bamboo").map( tile => parseInt(tile.split("_")[1])).sort(function(a, b){return a-b})
    var tileValues = [tenkTileValues, dotTileValues, bambooTileValues]
    

    //calculate sum values of each suit
    var listOfRemainders = []
    listOfRemainders.push(tenkTileValues.length > 0 ? tenkTileValues.reduce((accumulator, currentValue) => accumulator + currentValue) % 3 : null)
    listOfRemainders.push(dotTileValues.length > 0 ? dotTileValues.reduce((accumulator, currentValue) => accumulator + currentValue) % 3 : null)
    listOfRemainders.push(bambooTileValues.length > 0 ? bambooTileValues.reduce((accumulator, currentValue) => accumulator + currentValue) % 3 : null)
    console.log("listOfRemainders: ", listOfRemainders);
    //find applicable pairs to check
    var pairsToCheck = []
    for(i=0; i < listOfRemainders.length; i++) {
        if(listOfRemainders[i] != null) {
            if(listOfRemainders[i] == 0) {
                pairsToCheck = [3,6,9]
            } else if(listOfRemainders[i] == 1) {
                pairsToCheck = [2,5,8]
            } else if(listOfRemainders[i] == 2) {
                pairsToCheck = [1,4,7]
            }
        }
        
        findAndRemovePair(i, pairsToCheck, tileValues, winningHand)
            
        if (removeSets(i, tileValues, winningHand)) { //returns true if tileValues is empty
            continue;
        }
    }
    console.log(tileValues);
    if( tileValues.filter( suit => suit.length == 0).length == 3) {
        console.log("winning hand!");
        return winningHand
    } else {
        console.log("you lying piece of shit!");
        return winningHand
    }
}

function removeSets(i, tileValues, winningHand) {
    console.log("TileValues[i]: ", tileValues[i]);
    while(tileValues[i].length % 3 == 0 && tileValues[i].length != 0) { //if the length is ever less than 2 and NOT 0, fail, not a winning hand
        
        //check if there is a match
        if(tileValues[i][0] == tileValues[i][1] && tileValues[i][0] == tileValues[i][2] ) {
            //there is a match
            winningHand.push(tileValues[i].splice(0,3)) //remove the first 3 elements and add to winning hand
        } else if (tileValues[i].find(tileValue => tileValue == tileValues[i][0]+1) && tileValues[i].find(tileValue => tileValue == tileValues[i][0]+2) ) {
            //there is a straight
            var straight = []
            straight.push(tileValues[i].splice(tileValues.indexOf(tileValues[i][0]+2),1)[0])
            straight.push(tileValues[i].splice(tileValues.indexOf(tileValues[i][0]+1),1)[0])
            straight.push(tileValues[i].splice(0,1)[0])
            winningHand.push(straight)
        } else {
            break;
        }

    }
    if (tileValues[i].length == 0) {
        console.log("returned true in removeSets");
        return true
    }
    return false
}

function findAndRemovePair(i, pairsToCheck, tileValues, winningHand) {
    var foundPair = []
    for(p=0; p < pairsToCheck.length; p++) {
        var pairCount = tileValues[i].filter(tileValue => tileValue == pairsToCheck[p])
        if(pairCount.length >= 2) {
            //pair is removed from the suit
            foundPair = [tileValues[i].splice(tileValues[i].indexOf(pairCount[0]), 1)[0], tileValues[i].splice(tileValues[i].indexOf(pairCount[1]), 1)[0]]
            winningHand.push(foundPair) //add to winning hand
            return true
        }
    }
    return false
}

// you must have one of EACH char tile, one of the 1 and 9 tiles for EACH suit, and you must have another duplicate of any of these.
//x13
function thirteenSingles(player) {
    var playerTiles = concatPlayerTiles(player)
    console.log("THIRTEENSINGLES: playerTiles concated: ", playerTiles)
    
    //get rid of flower tiles
    var playerTilesSanitized = unIncludeFlowers(playerTiles)
    
    //return false if contains unexpected characters
    var unexpectedTilesCount = playerTiles.filter(tile => !thirteenSinglesUniqueSet.includes(tile)).length
    if(unexpectedTilesCount != 0) {
        return false
    }

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
    var playerTilesSanitized = unIncludeFlowers(playerTiles)

    //check if each tile has a pair
    var pair = 0;
    playerTilesSanitized.forEach(tile => {
        var count = playerTilesSanitized.filter(tile).length
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

//Test standard win
var testPlayer = {
    tiles: ["dot_7", "dot_7",
        "dot_6", "dot_6",
        "dot_5", "dot_5",
        "dot_4", "dot_4",
        "dot_3", "dot_3",
        "dot_2", "dot_2", 
        "dot_1", "dot_1"],
    visibleTiles: []
}

console.log(standardWin(testPlayer));



module.exports = {
    checkAllWinConditions
}


