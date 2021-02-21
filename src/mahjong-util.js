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


module.exports = {
    killEmptyGames,
    setGames
}