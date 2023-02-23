const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("Field", function () {
	async function deployFixture() {
		const Field = await hre.ethers.getContractFactory("Field");

		const field = await Field.deploy();
		await field.deployed();

		console.log(`Field is deployed:\n${field.address}`);

		const [owner, account, hacker] = await ethers.getSigners();

		return { field, owner, account, hacker };
	}

	describe("Deployment", function () {
		it("Should set the right owner", async function () {
			const { field, owner } = await loadFixture(deployFixture);
			expect(await field.owner()).to.equal(owner.address);
		});
	});

	describe("SetInAir", function () {
		it("ToTrue", async function () {
			const { field } = await loadFixture(deployFixture);
			await field.SetInAir(true)
			expect(await field.inAir()).to.equal(true);
		});

		it("ToFalse", async function () {
			const { field } = await loadFixture(deployFixture);
			await field.SetInAir(false)
			expect(await field.inAir()).to.equal(false);
		});
	});


	describe("AddCell", function () {
		it("Requires", async function () {
			const { field, hacker } = await loadFixture(deployFixture);
			const cost = 1;
			const rent = 1;
			const deposit = 1;
			await expect(field.connect(hacker).AddCell(cost, rent, deposit)).to.be.revertedWith("Field: you is not owner field")
		});

		it("Create", async function () {
			const { field } = await loadFixture(deployFixture);

			const countCell = (await field.GetField()).length

			const cost = 1;
			const rent = 1;
			const deposit = 1;
			const tx = await field.AddCell(cost, rent, deposit)
			await tx.wait()

			expect((await field.GetField()).length).to.equal(countCell + 1);
		});
	});

	describe("AddCells", function () {
		it("Requires", async function () {
			const { field, hacker } = await loadFixture(deployFixture);
			const cost = 1;
			const rent = 1;
			const deposit = 1;
			await expect(field.connect(hacker).AddCells([[cost, rent, deposit], [cost, rent, deposit], [cost, rent, deposit]])).to.be.revertedWith("Field: you is not owner field")
		});

		it("Create", async function () {
			const { field } = await loadFixture(deployFixture);

			const countCell = (await field.GetField()).length

			const cost = 1;
			const rent = 1;
			const deposit = 1;
			const tx = await field.AddCells([[cost, rent, deposit], [cost, rent, deposit], [cost, rent, deposit]])
			await tx.wait()

			expect((await field.GetField()).length).to.equal(countCell + 3);
		});
	});

	describe("AddSpecCell", function () {
		describe("Requires", function () {
			it("IsOwner", async function () {
				const { field, hacker } = await loadFixture(deployFixture);
				const salary = 1;
				const prison = true;
				const parking = true;
				await expect(field.connect(hacker).AddSpecCell(salary, prison, parking)).to.be.revertedWith("Field: you is not owner field")
			});
	
			it("ManyParameters", async function () {
				const { field, hacker } = await loadFixture(deployFixture);
				const salary = 1;
				const prison = true;
				const parking = true;
				await expect(field.AddSpecCell(salary, prison, parking)).to.be.revertedWith("Field: you must specify one of the parameters")
			});
		})

		describe("Create", function () {
			it("Salary", async function () {
				const { field } = await loadFixture(deployFixture);
	
				const countCell = (await field.GetField()).length
	
				const salary = 200;
				const prison = false;
				const parking = false;
				const tx = await field.AddSpecCell(salary, prison, parking);
				await tx.wait();
	
				const updateField = await field.GetField();
				expect(updateField.length).to.equal(countCell + 1);
				const newCell =  await field.GetCell(countCell);
				expect(newCell[4]).to.equal("200");
				expect(newCell[5]).to.equal("false");
				expect(newCell[6]).to.equal("false");
			});
	
			it("Prison", async function () {
				const { field } = await loadFixture(deployFixture);
	
				const countCell = (await field.GetField()).length
	
				const salary = 0;
				const prison = true;
				const parking = false;
				const tx = await field.AddSpecCell(salary, prison, parking);
				await tx.wait();
	
				const updateField = await field.GetField();
				expect(updateField.length).to.equal(countCell + 1);
				const newCell =  await field.GetCell(countCell);
				expect(newCell[4]).to.equal("0");
				expect(newCell[5]).to.equal("true");
				expect(newCell[6]).to.equal("false");
			});
	
			it("Parking", async function () {
				const { field } = await loadFixture(deployFixture);
	
				const countCell = (await field.GetField()).length
	
				const salary = 0;
				const prison = false;
				const parking = true;
				const tx = await field.AddSpecCell(salary, prison, parking);
				await tx.wait();
	
				const updateField = await field.GetField();
				expect(updateField.length).to.equal(countCell + 1);
				const newCell = await field.GetCell(countCell);
				expect(newCell[4]).to.equal("0");
				expect(newCell[5]).to.equal("false");
				expect(newCell[6]).to.equal("true");
			});
		})
	});

	describe("DelCell", function () {
		describe("Requires", function () {
			it("IsOwner", async function () {
				const { field, hacker } = await loadFixture(deployFixture);
				const tx = await field.AddCell(1, 1, 1)
				await tx.wait()
	
				const countCell = (await field.GetField()).length
				await expect(field.connect(hacker).DelCell(countCell - 1)).to.be.revertedWith("Field: you is not owner field")
			});
	
			it("Index", async function () {
				const { field, hacker } = await loadFixture(deployFixture);
				const countCell = (await field.GetField()).length
				await expect(field.DelCell(countCell)).to.be.revertedWith("Field: index does not exists")
			});
		})

		it("Delete", async function () {
			const { field } = await loadFixture(deployFixture);

			var tx = await field.AddCell(1, 1, 1)
			await tx.wait()

			const countCell = (await field.GetField()).length

			tx = await field.DelCell(countCell - 1)
			await tx.wait()

			expect((await field.GetField()).length).to.equal(countCell - 1);
		});
	});

	describe("DelCells", function () {
		describe("Requires", function () {
			it("IsOwner", async function () {
				const { field, hacker } = await loadFixture(deployFixture);
				var tx = await field.AddCell(1, 1, 1)
				await tx.wait()
	
				tx = await field.AddCell(1, 1, 1)
				await tx.wait()
	
				const countCell = (await field.GetField()).length
				await expect(field.connect(hacker).DelCells([countCell - 1, countCell - 2])).to.be.revertedWith("Field: you is not owner field")
			});
	
			it("Index", async function () {
				const { field, hacker } = await loadFixture(deployFixture);
				const countCell = (await field.GetField()).length
				await expect(field.DelCell([countCell, countCell + 1])).to.be.revertedWith("Field: index does not exists")
			});
		})

		it("Delete", async function () {
			const { field } = await loadFixture(deployFixture);

			var tx = await field.AddCell(1, 1, 1)
			await tx.wait()

			tx = await field.AddCell(1, 1, 1)
			await tx.wait()

			const countCell = (await field.GetField()).length

			tx = await field.DelCells([countCell - 1, countCell - 2])
			await tx.wait()

			expect((await field.GetField()).length).to.equal(countCell - 2);
		});
	});

	describe("GetCell", function () {
		it("Requires", async function () {
			const { field, hacker } = await loadFixture(deployFixture);
			const countCell = (await field.GetField()).length
			await expect(field.GetCell(countCell)).to.be.revertedWith("Field: index does not exists")
		});

		it("Get", async function () {
			const { field } = await loadFixture(deployFixture);

			var tx = await field.AddCell(1, 1, 1)
			await tx.wait()
			const cellLst = ['1', '1', '1', 'false', '0', 'false', 'false']

			const countCell = (await field.GetField()).length

			const newCell = await field.GetCell(countCell - 1)

			var eqs = (a, b) => {
				if (a.length != b.length) return false
				for (var i = 0; i < a.length; i++)
					if (a[i] != b[i]) return false
				return true
			}

			expect(eqs(newCell, cellLst)).to.equal(true);
		});
	});
})
