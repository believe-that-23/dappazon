const { expect } = require("chai")
const { ethers } = require("hardhat")

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

let transaction;
const ID = 1;
const NAME = "Shoes";
const CATEGORY = "Clothing";
const IMAGE = "https://ipfs.io/ipfs/QmTYEboq8raiBs7GTUg2yLXB3PMz6HuBNgNfSZBx5Msztg/shoes.jpg";
const COST = tokens(1);
const RATING = 4;
const STOCK = 5;

describe("Dappazon", () => {
  let dappazon;
  let deployer, buyer;

  beforeEach(async () => {
    //setup accounts
    [deployer, buyer] = await ethers.getSigners();
    // console.log(deployer.address, buyer.address);
    //deploy constract
    const Dappazon = await ethers.getContractFactory("Dappazon");
    dappazon = await Dappazon.deploy();
  });

  describe('Deployment', () => {

    it('sets the owner', async () => {
      expect(await dappazon.owner()).to.equal(deployer.address);
    });

  });

  describe('Listing', () => {


    beforeEach(async () => {
      transaction = await dappazon.connect(deployer).list(
        ID,
        NAME,
        CATEGORY,
        IMAGE,
        COST,
        RATING,
        STOCK
      );

      await transaction.wait();
    });

    it('returns item attributes', async () => {
      const item = await dappazon.items(ID);
      expect(item.id).to.equal(ID);
      expect(item.name).to.equal(NAME);
      expect(item.category).to.equal(CATEGORY);
      expect(item.image).to.equal(IMAGE);
      expect(item.cost).to.equal(COST);
      expect(item.rating).to.equal(RATING);
      expect(item.stock).to.equal(STOCK);
    });

    it('emits list event', () => {
      expect(transaction).to.emit(dappazon, "List");
    });
  });

  describe('Buying', () => {


    beforeEach(async () => {
      //List a item
      transaction = await dappazon.connect(deployer).list(
        ID,
        NAME,
        CATEGORY,
        IMAGE,
        COST,
        RATING,
        STOCK
      );
      await transaction.wait();

      //But an item
      transaction = await dappazon.connect(buyer).buy(
        ID,
        { value: COST }
      );
      await transaction.wait();
    });

    
    it("updates the buyer's order count", async () => {
      const result = await dappazon.orderCount(buyer.address);
      // console.log(result);
      expect(result).to.equal(1);
    });
    
    it("Adds the order", async () => {
      const order = await dappazon.orders(buyer.address, 1);
      // console.log(result);
      expect(order.time).to.be.greaterThan(0);
      expect(order.item.name).to.equal(NAME);
    });
    
    it("updates the contract balance", async () => {
      const result = await ethers.provider.getBalance(dappazon.address);
      // console.log(result);
      expect(result).to.equal(COST);
    });

    it("emits buy event", () => {
      expect(transaction).to.emit(dappazon, "Buy");
    })

  });

  describe('Withdrawing', () => {
    let balanceBefore

    beforeEach(async () => {
      //List a item
      transaction = await dappazon.connect(deployer).list(
        ID,
        NAME,
        CATEGORY,
        IMAGE,
        COST,
        RATING,
        STOCK
      );
      await transaction.wait();

      //But an item
      transaction = await dappazon.connect(buyer).buy(
        ID,
        { value: COST }
      );
      await transaction.wait();

      //deployer balance before
      balanceBefore = await ethers.provider.getBalance(deployer.address);

      //withdraw
      transaction = await dappazon.connect(deployer).withdraw();
      await transaction.wait();
    });

    
    it("updates the owner's balance", async () => {
      const balanceAfter = await ethers.provider.getBalance(deployer.address);
      // console.log(result);
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });
    
    it("Updates the contract balance", async () => {
      const result = await ethers.provider.getBalance(dappazon.address);
      expect(result).to.equal(0);
    });

  });

});