
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
    var inHandTiles = player.tiles.map(tile => tile) //shallow copy player tiles so we don't mess with the original
    console.log(`inHandTiles: ${inHandTiles}`);
    if(winningTile != null) {
        inHandTiles.push(winningTile)
    }
    console.log(`inHandTiles after winningTile: ${inHandTiles}`);
    
    var visibleTiles = Array.from(player.visibleTiles); //shallow copy this too

    var winningHand = []; //2D array of winning hand + sets

    // console.log("STANDARD: playerTiles concated: ", playerTiles)

    //get rid of flowers
    var sanitizedVisibleTiles = unIncludeFlowers(visibleTiles)

    sanitizedVisibleTiles.forEach(set => winningHand.push(set)) //add visible sets to your winning hand

    //check characters tiles
    var characterTiles = inHandTiles.filter( tile => tile.split("_")[0] == "char")
    var charResponse = recursiveCharacterTiles(characterTiles, winningHand)
    console.log(`charResponse: ${charResponse}`);
    if (charResponse) {
        winningHand.concat(charResponse)
    } else {
        return {
            winning: false,
            hand: winningHand
        }
    }
    // recursiveCharacterTiles(characterTiles, winningHand) ? winningHand.concat(charResponse) : false??

    //calculate in hand tiles
    //split into suits first?
    var tenkTileValues = inHandTiles.filter( tile => tile.split("_")[0] == "tenk").map( tile => parseInt(tile.split("_")[1])).sort(function(a, b){return a-b})
    var dotTileValues = inHandTiles.filter( tile => tile.split("_")[0] == "dot").map( tile => parseInt(tile.split("_")[1])).sort(function(a, b){return a-b})
    var bambooTileValues = inHandTiles.filter( tile => tile.split("_")[0] == "bamboo").map( tile => parseInt(tile.split("_")[1])).sort(function(a, b){return a-b})
    var tileValues = [tenkTileValues, dotTileValues, bambooTileValues]
    console.log(`tileValues: `, tileValues);
    

    //calculate sum values of each suit
    var listOfRemainders = []
    listOfRemainders.push(tenkTileValues.length > 0 ? tenkTileValues.reduce((accumulator, currentValue) => accumulator + currentValue) % 3 : null)
    listOfRemainders.push(dotTileValues.length > 0 ? dotTileValues.reduce((accumulator, currentValue) => accumulator + currentValue) % 3 : null)
    listOfRemainders.push(bambooTileValues.length > 0 ? bambooTileValues.reduce((accumulator, currentValue) => accumulator + currentValue) % 3 : null)
    console.log(`listOfRemainders: `, listOfRemainders);
    //find applicable pairs to check
    var pairsToCheck = []
    var removedPairAlready = false
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
        console.log(`pairsToCheck: `, pairsToCheck);
        var removedPair = null
        if(!removedPairAlready) {
            removedPair = findAndRemovePair(i, pairsToCheck, tileValues, winningHand)
        }
        console.log(`removePair: `, removedPair);
        // if(removedPair == false) {
        //     return {
        //         winning: false,
        //         hand: winningHand
        //     }
        // }
        removeSets(i, tileValues, winningHand)
    }
    if( tileValues.filter( suit => suit.length == 0).length == 3) {
        console.log("winning hand!");
        return {
            winning: true,
            hand: winningHand
        }
    } else {
        console.log("you lying piece of shit!");
        return {
            winning: false,
            hand: winningHand
        }
    }
}

function recursiveCharacterTiles(characterTiles, winningHand) {
    if(characterTiles.length == 0) {
        // console.log("winning return in recursive characters: ",winningHand);
        return winningHand //winning
    }
    var activeSet = characterTiles.filter(charTile => charTile == characterTiles[0]) //filter by the first element
    characterTiles = characterTiles.filter(charTile => !activeSet.includes(charTile))
    if(activeSet.length == 4 || activeSet.length == 3) { //that means its a gang or a match
        winningHand.push(activeSet) 
        return recursiveCharacterTiles(characterTiles, winningHand) //continue winning
    } else if(activeSet.length == 2) {
        winningHand.push(activeSet) //it's a pair
        return recursiveCharacterTiles(characterTiles, winningHand) //continue winning
    } else {
        return false //losing
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
            // var oneUp = tileValues[i][0] + 1
            // var twoUp = tileValues[i][0] + 2
            
            straight.push(suits[i] + "_" + tileValues[i].splice(tileValues[i].indexOf(tileValues[i][0]+2),1)[0])
            straight.push(suits[i] + "_" + tileValues[i].splice(tileValues[i].indexOf(tileValues[i][0]+1),1)[0])
            straight.push(suits[i] + "_" + tileValues[i].splice(0,1)[0])
            winningHand.push(straight)
        } else {
            return false;
        }

    }
    if (tileValues[i].length == 0) {
        // console.log("returned true in removeSets");
        return true
    }
    return false
}

function findAndRemovePair(i, pairsToCheck, tileValues, winningHand) {
    var foundPair = []
    for(p=0; p < pairsToCheck.length; p++) {
        var pairCount = tileValues[i].filter(tileValue => tileValue == pairsToCheck[p])
        if(pairCount.length >= 2) {
            //check its not part of a double straight
            if(tileValues[i].filter(tileValue => tileValue == tileValues[i][0]+2).length < 2
                && tileValues[i].filter(tileValue => tileValue == tileValues[i][0]+1).length < 2
            ) {
                //pair is removed from the suit
                foundPair = [suits[i] + "_" + tileValues[i].splice(tileValues[i].indexOf(pairCount[0]), 1)[0], suits[i] + "_" + tileValues[i].splice(tileValues[i].indexOf(pairCount[1]), 1)[0]]
                winningHand.push(foundPair) //add to winning hand
                return true
            }
        }
    }
    return false
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
        var count = playerTilesSanitized.filter(tile).length
        if (count === 2) {
            //if you get here, then return true, you win
            return {
                winning: true,
                hand: playerTilesSanitized
            }
        }
    })
    //otherwise you did not win
    return {
        winning: false,
        hand: playerTilesSanitized
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
            hand: playerTilesSanitized
        }
    }
    return {
        winning: false,
        hand: playerTilesSanitized
    }

}

//many....many more.....that I and most people don't even know fully


module.exports = {
    checkAllWinConditions
}


