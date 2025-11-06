import { expect } from "chai";
import { ethers } from "hardhat";
import { ALOToken } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ALOToken", function () {
  let aloToken: ALOToken;
  let owner: SignerWithAddress;
  let buybackWallet: SignerWithAddress;
  let liquidityWallet: SignerWithAddress;
  let treasuryWallet: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const TOTAL_SUPPLY = ethers.parseEther("100000000"); // 100M tokens

  beforeEach(async function () {
    [owner, buybackWallet, liquidityWallet, treasuryWallet, user1, user2] = 
      await ethers.getSigners();

    const ALOToken = await ethers.getContractFactory("ALOToken");
    aloToken = await ALOToken.deploy(
      buybackWallet.address,
      liquidityWallet.address,
      treasuryWallet.address
    );
    await aloToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct token name and symbol", async function () {
      expect(await aloToken.name()).to.equal("ALONEA");
      expect(await aloToken.symbol()).to.equal("ALO");
    });

    it("Should mint total supply to owner", async function () {
      expect(await aloToken.balanceOf(owner.address)).to.equal(TOTAL_SUPPLY);
    });

    it("Should exclude owner from fees", async function () {
      expect(await aloToken.isExcludedFromFee(owner.address)).to.be.true;
    });

    it("Should set correct wallet addresses", async function () {
      expect(await aloToken.buybackWallet()).to.equal(buybackWallet.address);
      expect(await aloToken.liquidityWallet()).to.equal(liquidityWallet.address);
      expect(await aloToken.treasuryWallet()).to.equal(treasuryWallet.address);
    });
  });

  describe("Transfers with Fees", function () {
    beforeEach(async function () {
      // Transfer some tokens to user1
      await aloToken.transfer(user1.address, ethers.parseEther("10000"));
    });

    it("Should apply fees on regular transfers", async function () {
      const transferAmount = ethers.parseEther("1000");
      const expectedFee = (transferAmount * 200n) / 10000n; // 2%
      const expectedReceived = transferAmount - expectedFee;

      await aloToken.connect(user1).transfer(user2.address, transferAmount);

      expect(await aloToken.balanceOf(user2.address)).to.equal(expectedReceived);
    });

    it("Should distribute fees correctly", async function () {
      const transferAmount = ethers.parseEther("1000");
      const buybackFee = (transferAmount * 100n) / 10000n; // 1%
      const liquidityFee = (transferAmount * 50n) / 10000n; // 0.5%
      const treasuryFee = (transferAmount * 50n) / 10000n; // 0.5%

      const buybackBefore = await aloToken.balanceOf(buybackWallet.address);
      const liquidityBefore = await aloToken.balanceOf(liquidityWallet.address);
      const treasuryBefore = await aloToken.balanceOf(treasuryWallet.address);

      await aloToken.connect(user1).transfer(user2.address, transferAmount);

      expect(await aloToken.balanceOf(buybackWallet.address))
        .to.equal(buybackBefore + buybackFee);
      expect(await aloToken.balanceOf(liquidityWallet.address))
        .to.equal(liquidityBefore + liquidityFee);
      expect(await aloToken.balanceOf(treasuryWallet.address))
        .to.equal(treasuryBefore + treasuryFee);
    });

    it("Should not apply fees for excluded addresses", async function () {
      const transferAmount = ethers.parseEther("1000");

      await aloToken.transfer(user2.address, transferAmount);

      expect(await aloToken.balanceOf(user2.address)).to.equal(transferAmount);
    });
  });

  describe("Burn Mechanism", function () {
    beforeEach(async function () {
      await aloToken.transfer(user1.address, ethers.parseEther("10000"));
    });

    it("Should burn tokens correctly", async function () {
      const burnAmount = ethers.parseEther("100");
      const balanceBefore = await aloToken.balanceOf(user1.address);
      const totalSupplyBefore = await aloToken.totalSupply();

      await aloToken.connect(user1).burn(burnAmount);

      expect(await aloToken.balanceOf(user1.address))
        .to.equal(balanceBefore - burnAmount);
      expect(await aloToken.totalSupply())
        .to.equal(totalSupplyBefore - burnAmount);
      expect(await aloToken.totalBurned()).to.equal(burnAmount);
    });

    it("Should burnFrom with allowance", async function () {
      const burnAmount = ethers.parseEther("100");
      
      await aloToken.connect(user1).approve(user2.address, burnAmount);
      await aloToken.connect(user2).burnFrom(user1.address, burnAmount);

      expect(await aloToken.totalBurned()).to.equal(burnAmount);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update buyback wallet", async function () {
      const newWallet = user1.address;
      await aloToken.setBuybackWallet(newWallet);
      expect(await aloToken.buybackWallet()).to.equal(newWallet);
    });

    it("Should allow owner to exclude/include addresses from fees", async function () {
      await aloToken.setExcludeFromFee(user1.address, true);
      expect(await aloToken.isExcludedFromFee(user1.address)).to.be.true;

      await aloToken.setExcludeFromFee(user1.address, false);
      expect(await aloToken.isExcludedFromFee(user1.address)).to.be.false;
    });

    it("Should revert when non-owner tries to update wallets", async function () {
      await expect(
        aloToken.connect(user1).setBuybackWallet(user2.address)
      ).to.be.reverted;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero transfers", async function () {
      await expect(aloToken.transfer(user1.address, 0)).to.not.be.reverted;
    });

    it("Should handle transfers to self", async function () {
      const amount = ethers.parseEther("1000");
      await aloToken.transfer(user1.address, amount);
      
      const balanceBefore = await aloToken.balanceOf(user1.address);
      await aloToken.connect(user1).transfer(user1.address, amount);
      
      // Self-transfers still incur fees
      expect(await aloToken.balanceOf(user1.address)).to.be.lt(balanceBefore);
    });

    it("Should track total fees correctly", async function () {
      const transferAmount = ethers.parseEther("1000");
      await aloToken.transfer(user1.address, transferAmount);

      const totalFeesBefore = await aloToken.totalFees();
      
      await aloToken.connect(user1).transfer(user2.address, transferAmount);

      const expectedFee = (transferAmount * 200n) / 10000n;
      expect(await aloToken.totalFees()).to.equal(totalFeesBefore + expectedFee);
    });
  });
});
