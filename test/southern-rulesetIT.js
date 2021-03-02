var assert = require('assert')
const Player = require('../src/player')
const southernRuleset = require('../src/rulesets/southern-ruleset')

describe('Check Win', function() {
    describe('standardWinning', function() {
        it('properly computes winning hands', function() {
            var testHand = [
                "dot_1", "dot_2", "dot_3",
                "char_2", "char_2",
                "bamboo_1", "bamboo_2", "bamboo_3",
                "tenk_1", "tenk_1", "tenk_1",
                "tenk_7", "tenk_7", "tenk_7"
            ]
            var visibleTiles = []
            var testName = "testName1"
            var testPlayer = new Player(testName)
            testPlayer.tiles = testHand
            testPlayer.visibleTiles = visibleTiles
            var standardWinReturn = southernRuleset.standard(testPlayer)
            assert.strictEqual(standardWinReturn.winning, true)
        })

        it('properly computes winning hands with 4 of the same tiles (No Gang)', function() {
            var testHand = [
                "dot_1", "dot_2", "dot_3",
                "char_2", "char_2",
                "bamboo_5", "bamboo_5", "bamboo_5",
                "tenk_1", "tenk_1", "tenk_1",
                "dot_2", "dot_2", "dot_2"
            ]
            var visibleTiles = []
            var testName = "testName1"
            var testPlayer = new Player(testName)
            testPlayer.tiles = testHand
            testPlayer.visibleTiles = visibleTiles
            var standardWinReturn = southernRuleset.standard(testPlayer)
            assert.strictEqual(standardWinReturn.winning, true)
        })

        it('properly computes winning hands with 4 of the same tiles (No Gang)', function() {
            var testHand = [
                "dot_1", "dot_2", "dot_3",
                "char_2", "char_2",
                "bamboo_5", "bamboo_5", "bamboo_5",
                "tenk_1", "tenk_1", "tenk_1",
                "dot_1", "dot_1", "dot_1"
            ]
            var visibleTiles = []
            var testName = "testName1"
            var testPlayer = new Player(testName)
            testPlayer.tiles = testHand
            testPlayer.visibleTiles = visibleTiles
            var standardWinReturn = southernRuleset.standard(testPlayer)
            assert.strictEqual(standardWinReturn.winning, true)
        })

        it('properly computes winning hands with 4 of the same tiles (Gang)', function() {
            var testHand = [
                "dot_4", "dot_2", "dot_3",
                "char_2", "char_2",
                "bamboo_5", "bamboo_5", "bamboo_5",
                "tenk_1", "tenk_1", "tenk_1",
                "dot_1", "dot_1", "dot_1", "dot_1"
            ]
            var testName = "testName1"
            var testPlayer = new Player(testName)
            testPlayer.tiles = testHand
            var standardWinReturn = southernRuleset.standard(testPlayer)
            assert.strictEqual(standardWinReturn.winning, true)
        })

        it('properly computes winning hands with partially visible tiles', function() {
            var testHand = [
                            "dot_1", "dot_2", "dot_3",
                            "char_2", "char_2",
                            "bamboo_5", "bamboo_5", "bamboo_5",
                            "tenk_1", "tenk_1", "tenk_1"
                        ]
            var visibleTiles = [["tenk_7", "tenk_7", "tenk_7"]]
            var testName = "testName1"
            var testPlayer = new Player(testName)
            testPlayer.tiles = testHand
            testPlayer.visibleTiles = visibleTiles
            var standardWinReturn = southernRuleset.standard(testPlayer)
            assert.strictEqual(standardWinReturn.winning, true)
        })

        it('properly computes winning hands with all visible tiles except pair', function() {
            var testHand = [
                "char_2", "char_2",
            ]
            var visibleTiles = [
                ["tenk_7", "tenk_7", "tenk_7"], 
                ["tenk_1", "tenk_1", "tenk_1"], 
                ["bamboo_5", "bamboo_5", "bamboo_5"],
                ["dot_1", "dot_2", "dot_3",]
            ]
            var testName = "testName1"
            var testPlayer = new Player(testName)
            testPlayer.tiles = testHand
            testPlayer.visibleTiles = visibleTiles
            var standardWinReturn = southernRuleset.standard(testPlayer)
            assert.strictEqual(standardWinReturn.winning, true)
        })
        
        it('winning hand with winning tile', function() {
            var testHand = [
                "dot_4", "dot_6", "dot_5",
                "char_1", "char_1",
                "bamboo_5", "bamboo_5", "bamboo_5",
                "tenk_1", "tenk_1", "tenk_1",
                "dot_1", "dot_1"
            ]
            var testName = "testName1"
            var testPlayer = new Player(testName)
            var winningTile = "dot_1"
            testPlayer.tiles = testHand
            var standardWinReturn = southernRuleset.standard(testPlayer, winningTile)
            assert.strictEqual(standardWinReturn.winning, true)
        })
    })
    describe('standardLosing', function() {
        it('properly computes losing hands with no visible tiles', function() {
            var visibleTiles = []
            var testHand = [
                "dot_1", "dot_2", "dot_1",
                "char_2", "char_2",
                "bamboo_5", "bamboo_5", "bamboo_5",
                "tenk_1", "tenk_1", "tenk_1",
                "tenk_7", "tenk_7", "tenk_7"
            ]
            var testName = "testName1"
            var testPlayer = new Player(testName)
            testPlayer.tiles = testHand
            testPlayer.visibleTiles = visibleTiles
            var standardWinReturn = southernRuleset.standard(testPlayer)
            assert.strictEqual(standardWinReturn.winning, false)
        })

        it('properly computes losing hands with too few tiles', function() {
            var visibleTiles = []
            var testHand = [
                "dot_1", "dot_2", "dot_3",
                "char_2", "char_2"
            ]
            var testName = "testName1"
            var testPlayer = new Player(testName)
            testPlayer.tiles = testHand
            testPlayer.visibleTiles = visibleTiles
            var standardWinReturn = southernRuleset.standard(testPlayer)
            assert.strictEqual(standardWinReturn.winning, false)
        })

        it('properly computes losing hands with too many tiles', function() {
            var visibleTiles = []
            var testHand = [
                "dot_1", "dot_2", "dot_3",
                "char_2", "char_2",
                "bamboo_5", "bamboo_5", "bamboo_5",
                "tenk_1", "tenk_1", "tenk_1",
                "tenk_7", "tenk_7", "tenk_7", "tenk_6"
            ]
            var testName = "testName1"
            var testPlayer = new Player(testName)
            testPlayer.tiles = testHand
            testPlayer.visibleTiles = visibleTiles
            var standardWinReturn = southernRuleset.standard(testPlayer)
            assert.strictEqual(standardWinReturn.winning, false)
        })

        it('properly computes losing hands (Gang)', function() {
            var visibleTiles = []
            var testHand = [
                "dot_1", "dot_2", "dot_3",
                "char_2", "char_2",
                "bamboo_5", "bamboo_5", "bamboo_5",
                "tenk_1", "tenk_1", "tenk_2",
                "tenk_7", "tenk_7", "tenk_7", "tenk_7"
            ]
            var testName = "testName1"
            var testPlayer = new Player(testName)
            testPlayer.tiles = testHand
            testPlayer.visibleTiles = visibleTiles
            var standardWinReturn = southernRuleset.standard(testPlayer)
            assert.strictEqual(standardWinReturn.winning, false)
        })
    })
    describe('thirteenSinglesWinning', function() {

    })
    describe('thirteenSinglesLosing', function() {

    })
    describe('sevenPairsWinning', function() {

    })
    describe('sevenPairsLosing', function() {
        
    })
    describe('checkAllWinning', function() {
        
    })
    describe('checkAllWinning', function() {
        
    })
})