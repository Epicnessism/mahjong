
function checkMatch(player, lastTile) {
    return player.tiles.filter( tile => tile == lastTile).length >= 2
}

function checkGang(player, lastTile) {
    return player.tiles.filter( tile => tile == lastTile).length == 3
}

function checkEat(player, lastTile, players) {
    var suit = lastTile.split("_")[0];
    var value = lastTile.split("_")[1];
    
}

module.exports = {
    checkMatch,
    checkGang,
    checkEat
};