// run project:
//   npx hardhat node
//   npx hardhat run --network localhost scripts/play.js

//   owner: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
// account: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8

//  gameAddress: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
// fieldAddress: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

const hre = require("hardhat");
const { ethers } = require("hardhat");
const readline = require('readline-sync');
const { expect } = require("chai");

function ether(eth) {
    return ethers.utils.parseEther(eth)
}

function input(text, nil=false) {
    if (!text) text = ""
    var resp = ""
    while (resp == "") {
        resp = readline.question(text);
        if (nil) break
    }
    return resp
}

function print(...text) {
    console.log(...text)
}

async function deploy(fieldAddress) {
    const Game = await hre.ethers.getContractFactory("Game");
    
    const game = await Game.deploy(fieldAddress, 300);
    await game.deployed();

    print(`Game is deployed:\n  ${game.address}`);
    return Game.attach(game.address);
}

async function preStartGame() {
    var needDeploy = input("You want create new game? [yes, no]: ")
    if (needDeploy == "yes") {
        var fieldAddress = input("Address field: ")
        return deploy(fieldAddress)
    } else if (needDeploy != "no") {
        return preStartGame()
    }
    var gameAddress = input("Address game: ")
    const Game = await hre.ethers.getContractFactory("Game");
    return Game.attach(gameAddress);
}

const [ NONE, VALUE, TEXT, LIST ] = [0, 1, 2, 3, 4, 5]

async function ParseTx(tx, type, text="") {
    print(tx); return;
    if (ok)
        switch (type) {
            case NONE: break;
            case VALUE: print(response.join(' ')); break;
            case TEXT: print(text); break;
            case LIST: print(response.join('\n')); break;
        }
    else
        print(error)
    print('--------------------')
}

class IGame {
    constructor(game, signer) {
        this.signer = signer
        this.game = game.connect(this.signer)
    }

    // property-function
    async owner() {
        ParseTx(await this.game.owner(), VALUE)
    }
    async inAir() {
        ParseTx(await this.game.inAir(), VALUE)
    }
    async moveTime() {
        ParseTx(await this.game.moveTime(), VALUE)
    }
    async GetField() {
        ParseTx(await this.game.GetField(), LIST)
    }
    // parameter-function
    async players(addr) {
        ParseTx(await this.game.players(addr), VALUE)
    }
    async playerAddresses(index) {
        ParseTx(await this.game.playerAddresses(index), VALUE)
    }
    async ownersCell(index) {
        ParseTx(await this.game.ownersCell(index), VALUE)
    }
    async GetCell(index) {
        ParseTx(await this.game.GetCell(index), VALUE)
    }
    async GetPlayerInfo(addr) {
        ParseTx(await this.game.GetPlayerInfo(ddr), LIST)
    }
    // dinamic-values-function
    async indexCurPlayer() {
        ParseTx(await this.game.indexCurPlayer(), VALUE)
    }
    async CountWantLeftGame() {
        ParseTx(await this.game.CountWantLeftGame(), VALUE)
    }
    async CountPlayers() {
        ParseTx(await this.game.CountPlayers(), VALUE)
    }

    // owner-function
    async ChangeField(fieldAddress) {
        ParseTx(await this.game.ChangeField(fieldAddress), TEXT, "")
    }
    async Start() {
        ParseTx(await this.game.Start(), TEXT, "")
    }
    async TheEnd() {
        ParseTx(await this.game.TheEnd(), TEXT, "")
    }
    async ClearWantLeftGame() {
        ParseTx(await this.game.ClearWantLeftGame(), TEXT, "")
    }
    
    // player-function
    async JoinToGame() {
        ParseTx(await this.game.JoinToGame({value: ether("0.2")}), TEXT, "")
    }
    async LeftGame() {
        ParseTx(await this.game.LeftGame(), TEXT, "")
    }
    async WantLeftGame() {
        ParseTx(await this.game.WantLeftGame(), TEXT, "")
    }
    async NotWantLeftGame() {
        ParseTx(await this.game.NotWantLeftGame(), TEXT, "")
    }
    async RollDice() {
        ParseTx(await this.game.RollDice(), LIST)
    }
    async PassMove() {
        ParseTx(await this.game.PassMove(), LIST)
    }
    async BuyCell() {
        ParseTx(await this.game.BuyCell(), LIST)
    }
    async DepositCell() {
        ParseTx(await this.game.DepositCell(), LIST)
    }

    async GetFuncOfName(name) {
        switch (name) {
            case "owner": return this.owner;
            case "inAir": return this.inAir;
            case "moveTime": return this.moveTime;
            case "GetField": return this.GetField;
            case "players": return this.players;
            case "playerAddresses": return this.playerAddresses;
            case "GetCell": return this.GetCell;
            case "GetPlayerInfo": return this.GetPlayerInfo;
            case "indexCurPlayer": return this.indexCurPlayer;
            case "CountWantLeftGame": return this.CountWantLeftGame;
            case "CountPlayers": return this.CountPlayers;
            case "ChangeField": return this.ChangeField;
            case "Start": return this.Start;
            case "TheEnd": return this.TheEnd;
            case "ClearWantLeftGame": return this.ClearWantLeftGame;
            case "JoinToGame": return this.JoinToGame;
            case "LeftGame": return this.LeftGame;
            case "WantLeftGame": return this.WantLeftGame;
            case "NotWantLeftGame": return this.NotWantLeftGame;
            case "RollDice": return this.RollDice;
            case "PassMove": return this.PassMove;
            case "BuyCell": return this.BuyCell;
            case "DepositCell": return this.DepositCell;
            default: return print;
        }
    }
}

async function main() {
    const signer = await ethers.provider.getSigner(input("Your address: "))
    const game = await preStartGame()
    var igame = new IGame(game, signer)
    for (;true;) {
        print(await (await igame.GetFuncOfName(input("Input name method: ")))(input("Input arguments (split space): ", true).split(' ')))
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
