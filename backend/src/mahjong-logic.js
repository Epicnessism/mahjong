
function checkMatch(playerTiles, lastTile) {
    return playerTiles.filter( tile => tile == lastTile).length >= 2
}

function checkGang(playerTiles, lastTile) {
    return playerTiles.filter( tile => tile == lastTile).length == 3
}

function checkEat(activeTiles, lastTile, playerIndex, discarderIndex) {

    if(++discarderIndex % 4 != playerIndex) {
        console.log("Couldn't eat due to wrong order");
        return false;
    }

    var suit = lastTile.split("_")[0];
    var value = parseInt(lastTile.split("_")[1]);
    var lowerBound = value;
    var upperBound = value;
    while(true) {
        var nextTile = suit + "_" + (lowerBound - 1).toString()
        if(activeTiles.filter(tile => tile == nextTile).length > 0) {
            lowerBound--;
        }else {
            break;
        }
    }
    while(true) {
        var nextTile = suit + "_" + (upperBound + 1).toString()
        if(activeTiles.filter(tile => tile == nextTile).length > 0) {
            upperBound++;
        }else {
            break;
        }
    }

    var straightLength = upperBound - lowerBound + 1
    if(straightLength < 3) {
        console.log("Couldn't eat due to incorrect tiles");
        return false;
    }

    return true;
    
}

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
//player, lastTile, players, discarderIndex, listOfSelectedTiles
function implementEat(player, lastTile, listOfSelectedTiles) {
    console.log(listOfSelectedTiles);
    var eatenTiles = listOfSelectedTiles;
    eatenTiles.push(lastTile);
    player.visibleTiles.push(eatenTiles);
    player.tiles = player.tiles.filter(tile => !listOfSelectedTiles.includes(tile));
    console.log("Eat Visible Tiles: " + player.visibleTiles);
    
}

module.exports = {
    checkMatch,
    checkGang,
    checkEat,
    implementMatch,
    implementGang,
    implementEat
};