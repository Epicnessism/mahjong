
function checkMatch(player, lastTile) {
    return player.tiles.filter( tile => tile == lastTile).length >= 2
}

function checkGang(player, lastTile) {
    return player.tiles.filter( tile => tile == lastTile).length == 3
}

function checkEat(player, lastTile, players, discarderIndex) {

    if(discarderIndex++ % 4 != players.indexOf(player)) {
        return false;
    }

    var suit = lastTile.split("_")[0];
    var value = parseInt(lastTile.split("_")[1]);
    var lowerBound = value;
    var upperBound = value;
    while(true) {
        var nextTile = suit + "_" + (lowerBound - 1).toString()
        if(player.tiles.filter(tile => tile == nextTile).length > 0) {
            lowerBound--;
        }else {
            break;
        }
    }
    while(true) {
        var nextTile = suit + "_" + (upperBound + 1).toString()
        if(player.tiles.filter(tile => tile == nextTile).length > 0) {
            upperBound++;
        }else {
            break;
        }
    }

    var straightLength = upperBound - lowerBound + 1
    return straightLength >= 3;
    
}

module.exports = {
    checkMatch,
    checkGang,
    checkEat
};