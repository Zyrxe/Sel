import { expect } from "chai";
import { ethers } from "hardhat";
import { ALOToken, ALOGovernance, ALOStaking } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time, mine } from "@nomicfoundation/hardhat-network-helpers";

describe("ALOGovernance", function () {
  let aloToken: ALOToken;
  let aloStaking: ALOStaking;
  let aloGovernance: ALOGovernance;
  let owner: SignerWithAddress;
  let proposer: SignerWithAddress;
  let voter1: SignerWithAddress;
  let voter2: SignerWithAddress;
  let buybackWallet: SignerWithAddress;
  let liquidityWallet: SignerWithAddress;
  let treasuryWallet: SignerWithAddress;

  const VOTING_DELAY = 1;
  const VOTING_PERIOD = 10;
  const PROPOSAL_THRESHOLD = ethers.parseEther("1000");
  const QUORUM_PERCENTAGE = 10;

  beforeEach(async function () {
    [owner, proposer, voter1, voter2, buybackWallet, liquidityWallet, treasuryWallet] = 
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
    aloStaking = await ALOStaking.deploy(
      await aloToken.getAddress(),
      ethers.parseEther("0.00001")
    );
    await aloStaking.waitForDeployment();

    // Deploy ALOGovernance
    const ALOGovernance = await ethers.getContractFactory("ALOGovernance");
    aloGovernance = await ALOGovernance.deploy(
      await aloToken.getAddress(),
      await aloStaking.getAddress(),
      VOTING_DELAY,
      VOTING_PERIOD,
      PROPOSAL_THRESHOLD,
      QUORUM_PERCENTAGE
    );
    await aloGovernance.waitForDeployment();

    // Transfer tokens to proposer and voters
    await aloToken.transfer(proposer.address, ethers.parseEther("2000"));
    await aloToken.transfer(voter1.address, ethers.parseEther("5000"));
    await aloToken.transfer(voter2.address, ethers.parseEther("3000"));
  });

  describe("Deployment", function () {
    it("Should set correct parameters", async function () {
      expect(await aloGovernance.aloToken()).to.equal(await aloToken.getAddress());
      expect(await aloGovernance.votingDelay()).to.equal(VOTING_DELAY);
      expect(await aloGovernance.votingPeriod()).to.equal(VOTING_PERIOD);
      expect(await aloGovernance.proposalThreshold()).to.equal(PROPOSAL_THRESHOLD);
      expect(await aloGovernance.quorumPercentage()).to.equal(QUORUM_PERCENTAGE);
    });
  });

  describe("Proposal Creation", function () {
    it("Should allow users with enough tokens to create proposals", async function () {
      await aloGovernance.connect(proposer).propose(
        "Test Proposal",
        "This is a test proposal"
      );

      expect(await aloGovernance.proposalCount()).to.equal(1);
    });

    it("Should revert when user has insufficient voting power", async function () {
      await expect(
        aloGovernance.connect(voter2).propose("Test", "Description")
      ).to.be.revertedWith("Proposer votes below proposal threshold");
    });

    it("Should set correct proposal parameters", async function () {
      const tx = await aloGovernance.connect(proposer).propose(
        "Test Proposal",
        "Test Description"
      );
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      const proposal = await aloGovernance.getProposal(1);
      
      expect(proposal.title).to.equal("Test Proposal");
      expect(proposal.description).to.equal("Test Description");
      expect(proposal.proposer).to.equal(proposer.address);
      expect(proposal.startBlock).to.equal(BigInt(block!.number) + BigInt(VOTING_DELAY));
      expect(proposal.endBlock).to.equal(
        BigInt(block!.number) + BigInt(VOTING_DELAY) + BigInt(VOTING_PERIOD)
      );
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      await aloGovernance.connect(proposer).propose(
        "Test Proposal",
        "Test Description"
      );
      
      // Mine blocks to start voting
      await mine(VOTING_DELAY + 1);
    });

    it("Should allow voting for a proposal", async function () {
      await aloGovernance.connect(voter1).castVote(1, 1); // Vote For
      
      const proposal = await aloGovernance.getProposal(1);
      expect(proposal.forVotes).to.be.gt(0);
    });

    it("Should prevent double voting", async function () {
      await aloGovernance.connect(voter1).castVote(1, 1);
      
      await expect(
        aloGovernance.connect(voter1).castVote(1, 1)
      ).to.be.revertedWith("Already voted");
    });

    it("Should count votes correctly", async function () {
      const voter1Power = await aloToken.balanceOf(voter1.address);
      const voter2Power = await aloToken.balanceOf(voter2.address);

      await aloGovernance.connect(voter1).castVote(1, 1); // For
      await aloGovernance.connect(voter2).castVote(1, 0); // Against

      const proposal = await aloGovernance.getProposal(1);
      expect(proposal.forVotes).to.equal(voter1Power);
      expect(proposal.againstVotes).to.equal(voter2Power);
    });

    it("Should handle abstain votes", async function () {
      const voter1Power = await aloToken.balanceOf(voter1.address);
      
      await aloGovernance.connect(voter1).castVote(1, 2); // Abstain

      const proposal = await aloGovernance.getProposal(1);
      expect(proposal.abstainVotes).to.equal(voter1Power);
    });
  });

  describe("Proposal States", function () {
    it("Should start in Pending state", async function () {
      await aloGovernance.connect(proposer).propose("Test", "Description");
      
      const state = await aloGovernance.state(1);
      expect(state).to.equal(0); // Pending
    });

    it("Should transition to Active after delay", async function () {
      await aloGovernance.connect(proposer).propose("Test", "Description");
      await mine(VOTING_DELAY + 1);
      
      const state = await aloGovernance.state(1);
      expect(state).to.equal(1); // Active
    });

    it("Should transition to Succeeded when passing quorum", async function () {
      await aloGovernance.connect(proposer).propose("Test", "Description");
      await mine(VOTING_DELAY + 1);

      // Vote with enough tokens to pass quorum
      await aloGovernance.connect(voter1).castVote(1, 1); // For
      await mine(VOTING_PERIOD + 1);

      const state = await aloGovernance.state(1);
      expect(state).to.equal(2); // Succeeded
    });

    it("Should be Defeated when not passing quorum", async function () {
      await aloGovernance.connect(proposer).propose("Test", "Description");
      await mine(VOTING_DELAY + 1);

      // Vote against or don't vote enough
      await aloGovernance.connect(voter2).castVote(1, 0); // Against
      await mine(VOTING_PERIOD + 1);

      const state = await aloGovernance.state(1);
      expect(state).to.equal(3); // Defeated
    });
  });

  describe("Proposal Execution", function () {
    it("Should allow executing succeeded proposals", async function () {
      await aloGovernance.connect(proposer).propose("Test", "Description");
      await mine(VOTING_DELAY + 1);

      await aloGovernance.connect(voter1).castVote(1, 1);
      await mine(VOTING_PERIOD + 1);

      await aloGovernance.execute(1);

      const state = await aloGovernance.state(1);
      expect(state).to.equal(5); // Executed
    });

    it("Should revert when executing non-succeeded proposals", async function () {
      await aloGovernance.connect(proposer).propose("Test", "Description");
      
      await expect(
        aloGovernance.execute(1)
      ).to.be.revertedWith("Proposal not succeeded");
    });
  });

  describe("Proposal Cancellation", function () {
    it("Should allow proposer to cancel their proposal", async function () {
      await aloGovernance.connect(proposer).propose("Test", "Description");
      await aloGovernance.connect(proposer).cancel(1);

      const state = await aloGovernance.state(1);
      expect(state).to.equal(6); // Canceled
    });

    it("Should allow owner to cancel any proposal", async function () {
      await aloGovernance.connect(proposer).propose("Test", "Description");
      await aloGovernance.connect(owner).cancel(1);

      const state = await aloGovernance.state(1);
      expect(state).to.equal(6); // Canceled
    });

    it("Should revert when non-authorized user tries to cancel", async function () {
      await aloGovernance.connect(proposer).propose("Test", "Description");
      
      await expect(
        aloGovernance.connect(voter1).cancel(1)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update voting parameters", async function () {
      await aloGovernance.setVotingParameters(2, 20, ethers.parseEther("2000"), 15);

      expect(await aloGovernance.votingDelay()).to.equal(2);
      expect(await aloGovernance.votingPeriod()).to.equal(20);
      expect(await aloGovernance.proposalThreshold()).to.equal(ethers.parseEther("2000"));
      expect(await aloGovernance.quorumPercentage()).to.equal(15);
    });

    it("Should revert when non-owner tries to update parameters", async function () {
      await expect(
        aloGovernance.connect(voter1).setVotingParameters(2, 20, ethers.parseEther("2000"), 15)
      ).to.be.reverted;
    });

    it("Should revert when quorum exceeds 100%", async function () {
      await expect(
        aloGovernance.setVotingParameters(2, 20, ethers.parseEther("2000"), 101)
      ).to.be.revertedWith("Invalid quorum percentage");
    });
  });
});
