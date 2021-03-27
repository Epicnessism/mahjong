var assert = require('assert')
const Player = require('../src/player')
const mahjongLogic = require("../src/mahjong-logic")
const { log } = require('console')
const MahjongGame = require('../src/mahjong')

describe('Check Logics', function() {
    describe('Check Gang', function() {
        it('Properly gangs a discarded tile', function() {

        })
    })
    describe('Check Ming Gang', function() {
        var testName = "mingGangTestPlayer"
        var testPlayer = new Player(testName)
        it('eligible for mingGang because a match was found', function() {
            var testHand = [
                "char_2", "char_2",
                "bamboo_1", "bamboo_2", "bamboo_3",
                "tenk_1", "tenk_1", "tenk_1",
                "tenk_7", "tenk_7"
            ]
            var visibleTiles = [["dot_3", "dot_3", "dot_3"]]
            testPlayer.tiles = testHand
            testPlayer.visibleTiles = visibleTiles
            var newTile = "dot_3"
            var mingGangReturn = mahjongLogic.checkMingGang(testPlayer, newTile)
            assert.strictEqual(mingGangReturn, true)
        })
        it('not eligbile for mingGang because straight not a match', function() {
            var testHand = [
                "char_2", "char_3",
                "bamboo_5", "bamboo_2", "bamboo_3",
                "tenk_6", "tenk_1", "tenk_1",
                "tenk_4", "tenk_7"
            ]
            var visibleTiles = [["dot_1", "dot_2", "dot_3"]]
            testPlayer.tiles = testHand
            testPlayer.visibleTiles = visibleTiles
            var newTile = "dot_3"
            var mingGangReturn = mahjongLogic.checkMingGang(testPlayer, newTile)
            assert.strictEqual(mingGangReturn, false)
        })
        it('found match with other straights in visibleTiles', function() {
            var testHand = [
                "char_2",
                "bamboo_5", "bamboo_2", "bamboo_3",
            ]
            var visibleTiles = [["dot_1", "dot_2", "dot_3"], ["bamboo_7", "bamboo_7", "bamboo_7"], ["dot_7", "dot_8", "dot_9"]]
            testPlayer.tiles = testHand
            testPlayer.visibleTiles = visibleTiles
            var newTile = "bamboo_7"
            var mingGangReturn = mahjongLogic.checkMingGang(testPlayer, newTile)
            assert.strictEqual(mingGangReturn, true)
        })
    })
    describe('Check Match', function() {
        it('properly computes a match from a discarded tile', function() {

        })
    })
    describe('Implement Ming Gang', function() {
        var testPlayer1 = new Player("test1")
        var testPlayer2 = new Player("test2")
        var testPlayer3 = new Player("test3")
        var testPlayer4 = new Player("test4")
        var testGame = new MahjongGame("45BFF")
        testGame.addPlayer(testPlayer1)
        testGame.addPlayer(testPlayer2)
        testGame.addPlayer(testPlayer3)
        testGame.addPlayer(testPlayer4)
        testGame.activePlayer = 2
        var newTile = "dot_3"
        testPlayer3.discardedTiles.push(newTile)
        testPlayer1.currentGame = testGame

        it('set mingGang in visibleTiles and got reinforced tile', function() {
            var testHand = [
                "char_2", "char_2",
                "bamboo_1", "bamboo_2", "bamboo_3",
                "tenk_7", "tenk_7"
            ]
            var visibleTiles = [["tenk_5", "tenk_5", "tenk_5"], ["dot_3", "dot_3", "dot_3"]]
            testPlayer1.tiles = testHand
            testPlayer1.visibleTiles = visibleTiles
            var mingGangReturn = mahjongLogic.implementMingGang(testPlayer1, newTile)
            assert.strictEqual(mingGangReturn, true)
            assert.strictEqual(testPlayer1.visibleTiles[1].length, 4)
            assert.strictEqual(testPlayer1.visibleTiles[1].filter(tile => visibleTiles[1][0] == tile).length, 4)
            assert.strictEqual(testPlayer1.visibleTiles[1][0], "dot_3")
            assert.strictEqual(testPlayer1.visibleTiles[1][1], "dot_3")
            assert.strictEqual(testPlayer1.visibleTiles[1][2], "dot_3")
            assert.strictEqual(testPlayer1.visibleTiles[1][3], "dot_3")
        })
    })
})

