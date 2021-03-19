var games = []

//handleEmpty Games
function killEmptyGames() {
    console.log(`games before pruning: ${games.length}`);

    var gamesToDelete = [];
    games.forEach( game => {
        console.log(`gamePlayers: ${game.players.length}`)
        console.log(`joinedPlayers: ${game.joinedPlayers}`)
        if(game.joinedPlayers == 0) {
            gamesToDelete.push(game)
        }
        // if (game.players != undefined && game.players.filter( player => { player.ws != null}).length > 1) {
        //     gamesToDelete.push(game)
        // }
    })

    gamesToDelete.forEach( gameToDelete => {
        console.log(`gameToDelete: ${gameToDelete}`);
        games.splice(games.findIndex( game => game.gameId == gameToDelete.gameId), 1)
    })
    console.log(`games after pruning: ${games.length}`);
}

function setGames(updatedGames) {
    games = updatedGames
}
/*
* @param {boolean} flower
* @returns {Array} gameTiles
*/
function getGameTiles(flower = false) {
    var gameTiles = []
    gameTiles = gameTiles.concat(Array.from(Array(9).keys()).map((x) => x + 1).map((x) => "dot_" + x))
    gameTiles = gameTiles.concat(Array.from(Array(9).keys()).map((x) => x + 1).map((x) => "bamboo_" + x))
    gameTiles = gameTiles.concat(Array.from(Array(9).keys()).map((x) => x + 1).map((x) => "tenk_" + x))
    gameTiles = gameTiles.concat(Array.from(Array(7).keys()).map((x) => x + 1).map((x) => "char_" + x))
    gameTiles = gameTiles.concat(gameTiles).concat(gameTiles).concat(gameTiles) //x4
    //separated the flowers since flowers are only used in certain sets of mahjong not all.
    if(flower) {
        const flowertiles = Array.from(Array(4).keys()).map((x) => x + 1).map((x) => "flower_" + x)
        gameTiles = gameTiles.concat(flowertiles).concat(flowertiles)
    }
    return gameTiles
}

module.exports = {
    killEmptyGames,
    setGames,
    getGameTiles
}