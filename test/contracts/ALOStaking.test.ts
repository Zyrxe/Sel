import { expect } from "chai";
import { ethers } from "hardhat";
import { ALOToken, ALOStaking } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("ALOStaking", function () {
  let aloToken: ALOToken;
  let aloStaking: ALOStaking;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let buybackWallet: SignerWithAddress;
  let liquidityWallet: SignerWithAddress;
  let treasuryWallet: SignerWithAddress;

  const REWARD_RATE = ethers.parseEther("0.00001"); // Per second per token

  beforeEach(async function () {
    [owner, user1, user2, buybackWallet, liquidityWallet, treasuryWallet] = 
      await ethers.getSigners();

    // Deploy ALOToken
    const ALOToken = await ethers.getContractFactory("ALOToken");
    aloToken = await ALOToken.deploy(
      buybackWallet.address,
      liquidityWallet.address,
      treasuryWallet.address
    );
    await aloToken.waitForDeployment();

    // Deploy ALOStaking
    const ALOStaking = await ethers.getContractFactory("ALOStaking");
    aloStaking = await ALOStaking.deploy(await aloToken.getAddress(), REWARD_RATE);
    await aloStaking.waitForDeployment();

    // Exclude staking contract from fees
    await aloToken.setExcludeFromFee(await aloStaking.getAddress(), true);

    // Fund staking contract with rewards
    await aloToken.transfer(await aloStaking.getAddress(), ethers.parseEther("1000000"));

    // Transfer tokens to users
    await aloToken.transfer(user1.address, ethers.parseEther("10000"));
    await aloToken.transfer(user2.address, ethers.parseEther("10000"));
  });

  describe("Deployment", function () {
    it("Should set correct token and reward rate", async function () {
      expect(await aloStaking.aloToken()).to.equal(await aloToken.getAddress());
      expect(await aloStaking.rewardRate()).to.equal(REWARD_RATE);
    });

    it("Should initialize tier configurations correctly", async function () {
      const freeTier = await aloStaking.tierConfigs(0); // FREE
      expect(freeTier.requiredAmount).to.equal(0);
      expect(freeTier.multiplier).to.equal(10000); // 1.0x

      const diamondTier = await aloStaking.tierConfigs(4); // DIAMOND
      expect(diamondTier.requiredAmount).to.equal(ethers.parseEther("1500"));
      expect(diamondTier.multiplier).to.equal(15000); // 1.5x
    });
  });

  describe("Staking", function () {
    it("Should allow users to stake tokens", async function () {
      const stakeAmount = ethers.parseEther("100");
      
      await aloToken.connect(user1).approve(await aloStaking.getAddress(), stakeAmount);
      await aloStaking.connect(user1).stake(stakeAmount);

      const stakeInfo = await aloStaking.stakes(user1.address);
      expect(stakeInfo.amount).to.equal(stakeAmount);
      expect(stakeInfo.tier).to.equal(1); // BRONZE
    });

    it("Should assign correct tier based on stake amount", async function () {
      // Bronze tier (100 ALO)
      await aloToken.connect(user1).approve(await aloStaking.getAddress(), ethers.parseEther("100"));
      await aloStaking.connect(user1).stake(ethers.parseEther("100"));
      expect((await aloStaking.stakes(user1.address)).tier).to.equal(1); // BRONZE

      // Silver tier (500 ALO total)
      await aloToken.connect(user1).approve(await aloStaking.getAddress(), ethers.parseEther("400"));
      await aloStaking.connect(user1).stake(ethers.parseEther("400"));
      expect((await aloStaking.stakes(user1.address)).tier).to.equal(2); // SILVER

      // Platinum tier (1000 ALO total)
      await aloToken.connect(user1).approve(await aloStaking.getAddress(), ethers.parseEther("500"));
      await aloStaking.connect(user1).stake(ethers.parseEther("500"));
      expect((await aloStaking.stakes(user1.address)).tier).to.equal(3); // PLATINUM
    });

    it("Should update total staked correctly", async function () {
      const stakeAmount = ethers.parseEther("500");
      
      await aloToken.connect(user1).approve(await aloStaking.getAddress(), stakeAmount);
      await aloStaking.connect(user1).stake(stakeAmount);

      expect(await aloStaking.totalStaked()).to.equal(stakeAmount);
    });

    it("Should track tier statistics", async function () {
      const stakeAmount = ethers.parseEther("500");
      
      await aloToken.connect(user1).approve(await aloStaking.getAddress(), stakeAmount);
      await aloStaking.connect(user1).stake(stakeAmount);

      expect(await aloStaking.tierStakers(2)).to.equal(1); // SILVER tier
      expect(await aloStaking.tierTotalStaked(2)).to.equal(stakeAmount);
    });
  });

  describe("Unstaking", function () {
    beforeEach(async function () {
      const stakeAmount = ethers.parseEther("1000");
      await aloToken.connect(user1).approve(await aloStaking.getAddress(), stakeAmount);
      await aloStaking.connect(user1).stake(stakeAmount);
    });

    it("Should allow users to unstake tokens", async function () {
      const unstakeAmount = ethers.parseEther("500");
      const balanceBefore = await aloToken.balanceOf(user1.address);

      await aloStaking.connect(user1).unstake(unstakeAmount);

      expect(await aloToken.balanceOf(user1.address))
        .to.be.gt(balanceBefore); // Greater due to rewards
      expect((await aloStaking.stakes(user1.address)).amount)
        .to.equal(ethers.parseEther("500"));
    });

    it("Should update tier when unstaking", async function () {
      // Initially PLATINUM
      expect((await aloStaking.stakes(user1.address)).tier).to.equal(3);

      // Unstake to BRONZE level
      await aloStaking.connect(user1).unstake(ethers.parseEther("900"));
      expect((await aloStaking.stakes(user1.address)).tier).to.equal(1); // BRONZE
    });

    it("Should revert when unstaking more than staked", async function () {
      await expect(
        aloStaking.connect(user1).unstake(ethers.parseEther("2000"))
      ).to.be.revertedWith("Insufficient staked amount");
    });
  });

  describe("Rewards", function () {
    it("Should calculate rewards correctly", async function () {
      const stakeAmount = ethers.parseEther("1000");
      await aloToken.connect(user1).approve(await aloStaking.getAddress(), stakeAmount);
      await aloStaking.connect(user1).stake(stakeAmount);

      // Advance time by 1 day
      await time.increase(86400);

      const rewards = await aloStaking.calculateRewards(user1.address);
      expect(rewards).to.be.gt(0);
    });

    it("Should apply tier multipliers to rewards", async function () {
      // Stake for Bronze tier (1.0x multiplier)
      await aloToken.connect(user1).approve(await aloStaking.getAddress(), ethers.parseEther("100"));
      await aloStaking.connect(user1).stake(ethers.parseEther("100"));

      // Stake for Diamond tier (1.5x multiplier)
      await aloToken.connect(user2).approve(await aloStaking.getAddress(), ethers.parseEther("1500"));
      await aloStaking.connect(user2).stake(ethers.parseEther("1500"));

      await time.increase(86400);

      const user1Rewards = await aloStaking.calculateRewards(user1.address);
      const user2Rewards = await aloStaking.calculateRewards(user2.address);

      // user2 should have more rewards per token due to higher multiplier
      const user1RewardsPerToken = user1Rewards / ethers.parseEther("100");
      const user2RewardsPerToken = user2Rewards / ethers.parseEther("1500");
      
      expect(user2RewardsPerToken).to.be.gt(user1RewardsPerToken);
    });

    it("Should allow claiming rewards", async function () {
      const stakeAmount = ethers.parseEther("1000");
      await aloToken.connect(user1).approve(await aloStaking.getAddress(), stakeAmount);
      await aloStaking.connect(user1).stake(stakeAmount);

      await time.increase(86400);

      const balanceBefore = await aloToken.balanceOf(user1.address);
      await aloStaking.connect(user1).claimRewards();
      const balanceAfter = await aloToken.balanceOf(user1.address);

      expect(balanceAfter).to.be.gt(balanceBefore);
    });
  });

  describe("Emergency Withdraw", function () {
    it("Should allow emergency withdraw without rewards", async function () {
      const stakeAmount = ethers.parseEther("1000");
      await aloToken.connect(user1).approve(await aloStaking.getAddress(), stakeAmount);
      await aloStaking.connect(user1).stake(stakeAmount);

      await time.increase(86400);

      const balanceBefore = await aloToken.balanceOf(user1.address);
      await aloStaking.connect(user1).emergencyWithdraw();
      const balanceAfter = await aloToken.balanceOf(user1.address);

      // Should receive staked amount back (without rewards)
      expect(balanceAfter - balanceBefore).to.equal(stakeAmount);
      
      // Stake should be cleared
      expect((await aloStaking.stakes(user1.address)).amount).to.equal(0);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update reward rate", async function () {
      const newRate = ethers.parseEther("0.00002");
      await aloStaking.setRewardRate(newRate);
      expect(await aloStaking.rewardRate()).to.equal(newRate);
    });

    it("Should allow owner to update tier config", async function () {
      await aloStaking.setTierConfig(1, ethers.parseEther("200"), 11000);
      const bronzeTier = await aloStaking.tierConfigs(1);
      expect(bronzeTier.requiredAmount).to.equal(ethers.parseEther("200"));
      expect(bronzeTier.multiplier).to.equal(11000);
    });

    it("Should revert when non-owner tries admin functions", async function () {
      await expect(
        aloStaking.connect(user1).setRewardRate(ethers.parseEther("0.00002"))
      ).to.be.reverted;
    });
  });
});
