var assert = require('assert')
const Player = require('../src/player')
const southernRuleset = require('../src/rulesets/southern-ruleset')

describe('Check Win', function() {
    describe('standard', function() {
        it('properly computes winning hands', function() {
            var testHand = [
                            "dot_1", "dot_2", "dot_3",
                            "char_2", "char_2",
                            "bamboo_5", "bamboo_5", "bamboo_5",
                            "tenk_1", "tenk_1", "tenk_1",
                            "tenk_7", "tenk_7", "tenk_7"
                        ]
            var testName = "testName1"
            var testPlayer = new Player(testName)
            testPlayer.tiles = testHand
            var standardWinReturn = southernRuleset.standard(testPlayer)
            // console.log(standardWinReturn.hand);
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
            var testName = "testName1"
            var testPlayer = new Player(testName)
            testPlayer.tiles = testHand
            var standardWinReturn = southernRuleset.standard(testPlayer)
            // console.log(standardWinReturn.hand);
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
            var testName = "testName1"
            var testPlayer = new Player(testName)
            testPlayer.tiles = testHand
            var standardWinReturn = southernRuleset.standard(testPlayer)
            // console.log(standardWinReturn.hand);
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
            // console.log(standardWinReturn.hand);
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
            // console.log(standardWinReturn.hand);
            assert.strictEqual(standardWinReturn.winning, true)
        })
    })
})