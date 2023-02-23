const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

function ether(eth) {
    return ethers.utils.parseEther(eth)
}

describe("Game", function () {
	async function deployFixture() {
		const Game = await hre.ethers.getContractFactory("Game");
        const Field = await hre.ethers.getContractFactory("Field");

        const field = await Field.deploy();
		await field.deployed();

        const moveTime = 30*60;

		const game = await Game.deploy(field.address, moveTime);
		await game.deployed();

		console.log(`Game is deployed:\n${game.address}`);
        console.log(`Field is deployed:\n${field.address}`);

		const [owner, account, hacker] = await ethers.getSigners();

		return { game, field, owner, account, hacker };
	}

	describe("Deployment", function () {
		it("Should set the right owner", async function () {
			const { game, owner } = await loadFixture(deployFixture);
			expect(await game.owner()).to.equal(owner.address);
		});
	});

	describe("InAir", function () {
        describe("Requires", function () {
            it("Start", async function () {
                const { game, hacker } = await loadFixture(deployFixture);
                await expect(game.connect(hacker).Start()).to.be.revertedWith("Game: you is not owner game")
            })

            it("TheEnd", async function () {
                const { game, hacker } = await loadFixture(deployFixture);
                await expect(game.connect(hacker).TheEnd()).to.be.revertedWith("Game: you is not owner game")
            })
        })
		
		it("Start", async function () {
			const { game, field } = await loadFixture(deployFixture);
			await game.Start()
			expect(await field.inAir()).to.equal(true);
            expect(await game.inAir()).to.equal(true);
		});

		it("TheEnd", async function () {
			const { game, field } = await loadFixture(deployFixture);
			await game.TheEnd()
			expect(await field.inAir()).to.equal(false);
            expect(await game.inAir()).to.equal(false);
		});
	});

    describe("CountWantLeftGame", function () {
        it("Requires", async function () {
            const { game, field, account,  hacker} = await loadFixture(deployFixture);
            await expect(game.connect(hacker).WantLeftGame()).to.revertedWith("Game: you is not player");
        })

		it("Count 0 / ClearWantLeftGame", async function () {
			const { game, field, account } = await loadFixture(deployFixture);
            var tx = await game.connect(account).JoinToGame({value: ether("0.2")})
            await tx.wait()
            tx = await game.ClearWantLeftGame()
            await tx
            expect(await game.CountWantLeftGame()).to.equal(0);
		});

        it("Count 2", async function () {
			const { game, field, account,  hacker} = await loadFixture(deployFixture);
            var tx = await game.connect(account).JoinToGame({value: ether("0.2")})
            await tx.wait()
            tx = await game.connect(hacker).JoinToGame({value: ether("0.2")})
            await tx.wait()
            tx = await game.Start()
            await tx.wait()
            tx = await game.connect(account).WantLeftGame()
            await tx.wait()
            tx = await game.connect(hacker).WantLeftGame()
            await tx.wait()
            expect(await game.CountWantLeftGame()).to.equal(2);
		});
	});

    describe("JoinToGame", function () {
        describe("Requires", async function () {
            it("Receipt ether", async function() {
                const { game, hacker} = await loadFixture(deployFixture);
                await expect(game.connect(hacker).JoinToGame()).to.revertedWith("Game: for join to game need 0.2 ether");
            })

            it("Already in the game", async function() {
                const { game, hacker} = await loadFixture(deployFixture);
                var tx = await game.connect(hacker).JoinToGame({value: ether("0.2")})
                await tx.wait()
                await expect(game.connect(hacker).JoinToGame({value: ether("0.2")})).to.revertedWith("Game: you already in the game");
            })
        })

		it("Adding to list players", async function () {
			const { game, account } = await loadFixture(deployFixture);
            var old = await game.CountPlayers()
            var tx = await game.connect(account).JoinToGame({value: ether("0.2")})
            await tx.wait()
            expect(await game.CountPlayers()).to.equal(old + 1);
		});

        it("Adding to mapping players", async function () {
			const { game, account } = await loadFixture(deployFixture);
            var tx = await game.connect(account).JoinToGame({value: ether("0.2")})
            await tx.wait()
            expect((await game.GetPlayerInfo(account.address)).user).to.equal(account.address);
		});
	});

    describe("LeftGame", function () {
        describe("Requires", async function () {
            it("Is player", async function() {
                const { game, hacker} = await loadFixture(deployFixture);
                await expect(game.connect(hacker).LeftGame()).to.revertedWith("Game: you is not player");
            })

            it("EndGame", async function() {
                const { game, hacker} = await loadFixture(deployFixture);
                var tx = await game.connect(hacker).JoinToGame({value: ether("0.2")})
                await tx.wait()
                tx = await game.Start()
                await tx.wait()
                await expect(game.connect(hacker).LeftGame()).to.revertedWith("Game: game is not end");
            })
        })

		it("Delete from list players", async function () {
			const { game, account } = await loadFixture(deployFixture);
            var tx = await game.connect(account).JoinToGame({value: ether("0.2")})
            await tx.wait()
            var old = await game.CountPlayers()

            tx = await game.TheEnd()
            await tx.wait()
            tx = await game.connect(account).LeftGame()
            await tx.wait()
            expect(await game.CountPlayers()).to.equal(old - 1);
		});

        it("Delete from mapping players", async function () {
			const { game, account } = await loadFixture(deployFixture);
            var tx = await game.connect(account).JoinToGame({value: ether("0.2")})
            await tx.wait()
            tx = await game.TheEnd()
            await tx.wait()
            tx = await game.connect(account).LeftGame()
            await tx.wait()
            await expect(game.GetPlayerInfo(account.address)).to.revertedWith("Game: got address is not player");
		});
	});

    describe("GetPlayerInfo", function () {
        describe("Requires", async function () {
            it("Address is a player", async function() {
                const { game, hacker} = await loadFixture(deployFixture);
                await expect(game.GetPlayerInfo(hacker.address)).to.revertedWith("Game: got address is not player");
            })
        })

		it("Address is the player", async function () {
			const { game, account } = await loadFixture(deployFixture);
            var tx = await game.connect(account).JoinToGame({value: ether("0.2")})
            await tx.wait()
            expect((await game.GetPlayerInfo(account.address)).user).to.equal(account.address);
		});
	});
})
