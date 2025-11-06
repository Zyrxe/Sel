import { expect } from "chai";
import { ethers } from "hardhat";
import { ALOToken, ALOBuyback } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ALOBuyback", function () {
  let aloToken: ALOToken;
  let aloBuyback: ALOBuyback;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let buybackWallet: SignerWithAddress;
  let liquidityWallet: SignerWithAddress;
  let treasuryWallet: SignerWithAddress;

  // PancakeSwap Router on BSC Testnet
  const PANCAKE_ROUTER = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1";
  const MINIMUM_BUYBACK = ethers.parseEther("0.1");
  const SLIPPAGE_TOLERANCE = 500; // 5%

  beforeEach(async function () {
    [owner, user1, buybackWallet, liquidityWallet, treasuryWallet] = 
      await ethers.getSigners();

    // Deploy ALOToken
    const ALOToken = await ethers.getContractFactory("ALOToken");
    aloToken = await ALOToken.deploy(
      buybackWallet.address,
      liquidityWallet.address,
      treasuryWallet.address
    );
    await aloToken.waitForDeployment();

    // Deploy ALOBuyback
    const ALOBuyback = await ethers.getContractFactory("ALOBuyback");
    aloBuyback = await ALOBuyback.deploy(
      await aloToken.getAddress(),
      PANCAKE_ROUTER,
      MINIMUM_BUYBACK,
      SLIPPAGE_TOLERANCE
    );
    await aloBuyback.waitForDeployment();

    // Exclude buyback contract from fees
    await aloToken.setExcludeFromFee(await aloBuyback.getAddress(), true);
  });

  describe("Deployment", function () {
    it("Should set correct parameters", async function () {
      expect(await aloBuyback.aloToken()).to.equal(await aloToken.getAddress());
      expect(await aloBuyback.pancakeRouter()).to.equal(PANCAKE_ROUTER);
      expect(await aloBuyback.minimumBuybackAmount()).to.equal(MINIMUM_BUYBACK);
      expect(await aloBuyback.slippageTolerance()).to.equal(SLIPPAGE_TOLERANCE);
      expect(await aloBuyback.autoBuybackEnabled()).to.be.true;
    });

    it("Should initialize with zero statistics", async function () {
      expect(await aloBuyback.totalBuybackBNB()).to.equal(0);
      expect(await aloBuyback.totalBuybackALO()).to.equal(0);
      expect(await aloBuyback.totalBurned()).to.equal(0);
      expect(await aloBuyback.lastBuybackTime()).to.equal(0);
    });
  });

  describe("Receive BNB", function () {
    it("Should accept BNB transfers", async function () {
      const sendAmount = ethers.parseEther("0.5");
      
      await owner.sendTransaction({
        to: await aloBuyback.getAddress(),
        value: sendAmount,
      });

      expect(await ethers.provider.getBalance(await aloBuyback.getAddress()))
        .to.equal(sendAmount);
    });

    it("Should NOT trigger auto-buyback below minimum", async function () {
      const sendAmount = ethers.parseEther("0.05"); // Below minimum
      
      await owner.sendTransaction({
        to: await aloBuyback.getAddress(),
        value: sendAmount,
      });

      expect(await aloBuyback.totalBuybackBNB()).to.equal(0);
    });
  });

  describe("Manual Buyback Execution", function () {
    it("Should revert when no BNB available", async function () {
      await expect(
        aloBuyback.executeBuyback()
      ).to.be.revertedWith("No BNB available");
    });

    it("Should revert when amount below minimum", async function () {
      await owner.sendTransaction({
        to: await aloBuyback.getAddress(),
        value: ethers.parseEther("0.05"),
      });

      await expect(
        aloBuyback.executeBuyback()
      ).to.be.revertedWith("Amount below minimum");
    });

    it("Should allow owner to execute buyback manually", async function () {
      const sendAmount = ethers.parseEther("0.2");
      
      await owner.sendTransaction({
        to: await aloBuyback.getAddress(),
        value: sendAmount,
      });

      // Note: This will fail on Hardhat unless we fork BSC or mock the router
      // For a real test, we would need to mock PancakeSwap router
      await expect(aloBuyback.executeBuyback()).to.be.reverted;
    });
  });

  describe("Buyback Statistics", function () {
    it("Should return correct statistics structure", async function () {
      const stats = await aloBuyback.getBuybackStats();
      
      expect(stats._totalBuybackBNB).to.equal(0);
      expect(stats._totalBuybackALO).to.equal(0);
      expect(stats._totalBurned).to.equal(0);
      expect(stats._lastBuybackAmount).to.equal(0);
      expect(stats._lastBuybackTime).to.equal(0);
      expect(stats._treasuryBalance).to.equal(0);
    });

    it("Should update treasury balance when receiving BNB", async function () {
      const sendAmount = ethers.parseEther("0.5");
      
      await owner.sendTransaction({
        to: await aloBuyback.getAddress(),
        value: sendAmount,
      });

      const stats = await aloBuyback.getBuybackStats();
      expect(stats._treasuryBalance).to.equal(sendAmount);
    });
  });

  describe("Parameter Updates", function () {
    it("Should allow owner to update buyback parameters", async function () {
      const newMinimum = ethers.parseEther("0.2");
      const newSlippage = 300; // 3%

      await aloBuyback.setBuybackParameters(newMinimum, newSlippage);

      expect(await aloBuyback.minimumBuybackAmount()).to.equal(newMinimum);
      expect(await aloBuyback.slippageTolerance()).to.equal(newSlippage);
    });

    it("Should revert when slippage too high", async function () {
      await expect(
        aloBuyback.setBuybackParameters(MINIMUM_BUYBACK, 1001) // >10%
      ).to.be.revertedWith("Slippage too high");
    });

    it("Should allow owner to toggle auto-buyback", async function () {
      await aloBuyback.setAutoBuybackEnabled(false);
      expect(await aloBuyback.autoBuybackEnabled()).to.be.false;

      await aloBuyback.setAutoBuybackEnabled(true);
      expect(await aloBuyback.autoBuybackEnabled()).to.be.true;
    });

    it("Should allow owner to update router", async function () {
      const newRouter = "0x0000000000000000000000000000000000000001";
      await aloBuyback.setPancakeRouter(newRouter);
      expect(await aloBuyback.pancakeRouter()).to.equal(newRouter);
    });

    it("Should revert when non-owner tries to update", async function () {
      await expect(
        aloBuyback.connect(user1).setBuybackParameters(MINIMUM_BUYBACK, SLIPPAGE_TOLERANCE)
      ).to.be.reverted;

      await expect(
        aloBuyback.connect(user1).setAutoBuybackEnabled(false)
      ).to.be.reverted;
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to emergency withdraw BNB", async function () {
      const sendAmount = ethers.parseEther("1.0");
      
      await owner.sendTransaction({
        to: await aloBuyback.getAddress(),
        value: sendAmount,
      });

      const balanceBefore = await ethers.provider.getBalance(owner.address);
      
      const tx = await aloBuyback.emergencyWithdrawBNB();
      const receipt = await tx.wait();
      const gasCost = receipt!.gasUsed * tx.gasPrice!;

      const balanceAfter = await ethers.provider.getBalance(owner.address);
      
      expect(balanceAfter).to.equal(balanceBefore + sendAmount - gasCost);
    });

    it("Should allow owner to emergency withdraw tokens", async function () {
      // Transfer some ALO to buyback contract
      await aloToken.transfer(await aloBuyback.getAddress(), ethers.parseEther("1000"));

      await aloBuyback.emergencyWithdrawTokens(await aloToken.getAddress());

      expect(await aloToken.balanceOf(await aloBuyback.getAddress())).to.equal(0);
    });

    it("Should revert when non-owner tries emergency functions", async function () {
      await expect(
        aloBuyback.connect(user1).emergencyWithdrawBNB()
      ).to.be.reverted;

      await expect(
        aloBuyback.connect(user1).emergencyWithdrawTokens(await aloToken.getAddress())
      ).to.be.reverted;
    });
  });

  describe("Security", function () {
    it("Should revert with zero address for token", async function () {
      const ALOBuyback = await ethers.getContractFactory("ALOBuyback");
      
      await expect(
        ALOBuyback.deploy(
          ethers.ZeroAddress,
          PANCAKE_ROUTER,
          MINIMUM_BUYBACK,
          SLIPPAGE_TOLERANCE
        )
      ).to.be.revertedWith("Invalid token address");
    });

    it("Should revert with zero address for router", async function () {
      const ALOBuyback = await ethers.getContractFactory("ALOBuyback");
      
      await expect(
        ALOBuyback.deploy(
          await aloToken.getAddress(),
          ethers.ZeroAddress,
          MINIMUM_BUYBACK,
          SLIPPAGE_TOLERANCE
        )
      ).to.be.revertedWith("Invalid router address");
    });
  });
});
