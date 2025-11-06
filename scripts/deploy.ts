import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Starting ALONEA deployment...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "BNB\n");

  // Deploy ALOToken
  console.log("📝 Deploying ALOToken...");
  const buybackWallet = deployer.address; // In production, use separate wallet
  const liquidityWallet = deployer.address;
  const treasuryWallet = deployer.address;

  const ALOToken = await ethers.getContractFactory("ALOToken");
  const aloToken = await ALOToken.deploy(buybackWallet, liquidityWallet, treasuryWallet);
  await aloToken.waitForDeployment();
  const aloTokenAddress = await aloToken.getAddress();
  console.log("✅ ALOToken deployed to:", aloTokenAddress);

  // Deploy ALOStaking
  console.log("\n📝 Deploying ALOStaking...");
  const rewardRate = ethers.parseEther("0.00001"); // 0.00001 ALO per second per token
  const ALOStaking = await ethers.getContractFactory("ALOStaking");
  const aloStaking = await ALOStaking.deploy(aloTokenAddress, rewardRate);
  await aloStaking.waitForDeployment();
  const aloStakingAddress = await aloStaking.getAddress();
  console.log("✅ ALOStaking deployed to:", aloStakingAddress);

  // Deploy ALOGovernance
  console.log("\n📝 Deploying ALOGovernance...");
  const votingDelay = 1; // 1 block delay
  const votingPeriod = 17280; // ~3 days (assuming 15s block time)
  const proposalThreshold = ethers.parseEther("1000"); // 1000 ALO required
  const quorumPercentage = 10; // 10% quorum
  
  const ALOGovernance = await ethers.getContractFactory("ALOGovernance");
  const aloGovernance = await ALOGovernance.deploy(
    aloTokenAddress,
    aloStakingAddress,
    votingDelay,
    votingPeriod,
    proposalThreshold,
    quorumPercentage
  );
  await aloGovernance.waitForDeployment();
  const aloGovernanceAddress = await aloGovernance.getAddress();
  console.log("✅ ALOGovernance deployed to:", aloGovernanceAddress);

  // Deploy ALOBuyback
  console.log("\n📝 Deploying ALOBuyback...");
  // PancakeSwap Router addresses
  const pancakeRouterTestnet = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1";
  const pancakeRouterMainnet = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
  
  const network = await ethers.provider.getNetwork();
  const pancakeRouter = network.chainId === 97n ? pancakeRouterTestnet : pancakeRouterMainnet;
  
  const minimumBuybackAmount = ethers.parseEther("0.1"); // 0.1 BNB minimum
  const slippageTolerance = 500; // 5%
  
  const ALOBuyback = await ethers.getContractFactory("ALOBuyback");
  const aloBuyback = await ALOBuyback.deploy(
    aloTokenAddress,
    pancakeRouter,
    minimumBuybackAmount,
    slippageTolerance
  );
  await aloBuyback.waitForDeployment();
  const aloBuybackAddress = await aloBuyback.getAddress();
  console.log("✅ ALOBuyback deployed to:", aloBuybackAddress);

  // Configure contracts
  console.log("\n⚙️  Configuring contracts...");
  
  // Exclude staking contract from fees
  await aloToken.setExcludeFromFee(aloStakingAddress, true);
  console.log("✅ Excluded staking contract from fees");

  // Exclude buyback contract from fees
  await aloToken.setExcludeFromFee(aloBuybackAddress, true);
  console.log("✅ Excluded buyback contract from fees");

  // Fund staking contract with rewards
  const rewardAmount = ethers.parseEther("1000000"); // 1M ALO for rewards
  await aloToken.transfer(aloStakingAddress, rewardAmount);
  console.log("✅ Funded staking contract with", ethers.formatEther(rewardAmount), "ALO");

  // Save deployment addresses
  const deploymentInfo = {
    network: network.name,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      ALOToken: aloTokenAddress,
      ALOStaking: aloStakingAddress,
      ALOGovernance: aloGovernanceAddress,
      ALOBuyback: aloBuybackAddress,
    },
    configuration: {
      rewardRate: rewardRate.toString(),
      votingDelay,
      votingPeriod,
      proposalThreshold: proposalThreshold.toString(),
      quorumPercentage,
      minimumBuybackAmount: minimumBuybackAmount.toString(),
      slippageTolerance,
    },
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentPath = path.join(deploymentsDir, `${network.name}-${network.chainId}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n📄 Deployment info saved to:", deploymentPath);

  // Export ABIs for frontend
  console.log("\n📦 Exporting ABIs for frontend...");
  const abisDir = path.join(__dirname, "..", "client", "src", "abis");
  if (!fs.existsSync(abisDir)) {
    fs.mkdirSync(abisDir, { recursive: true });
  }

  const artifacts = [
    { name: "ALOToken", path: path.join(__dirname, "..", "artifacts", "contracts", "ALOToken.sol", "ALOToken.json") },
    { name: "ALOStaking", path: path.join(__dirname, "..", "artifacts", "contracts", "ALOStaking.sol", "ALOStaking.json") },
    { name: "ALOGovernance", path: path.join(__dirname, "..", "artifacts", "contracts", "ALOGovernance.sol", "ALOGovernance.json") },
    { name: "ALOBuyback", path: path.join(__dirname, "..", "artifacts", "contracts", "ALOBuyback.sol", "ALOBuyback.json") },
  ];

  for (const artifact of artifacts) {
    if (fs.existsSync(artifact.path)) {
      const contractJson = JSON.parse(fs.readFileSync(artifact.path, "utf8"));
      const abiPath = path.join(abisDir, `${artifact.name}.json`);
      fs.writeFileSync(abiPath, JSON.stringify(contractJson.abi, null, 2));
      console.log(`✅ Exported ${artifact.name} ABI`);
    }
  }

  // Create .env template with deployed addresses
  const envTemplate = `
# Contract Addresses (Auto-generated from deployment)
VITE_ALO_TOKEN_ADDRESS=${aloTokenAddress}
VITE_ALO_STAKING_ADDRESS=${aloStakingAddress}
VITE_ALO_GOVERNANCE_ADDRESS=${aloGovernanceAddress}
VITE_ALO_BUYBACK_ADDRESS=${aloBuybackAddress}
`;

  const envPath = path.join(__dirname, "..", ".env.contracts");
  fs.writeFileSync(envPath, envTemplate.trim());
  console.log("\n✅ Contract addresses saved to .env.contracts");

  console.log("\n🎉 Deployment completed successfully!\n");
  console.log("=".repeat(60));
  console.log("Contract Addresses:");
  console.log("=".repeat(60));
  console.log("ALOToken:      ", aloTokenAddress);
  console.log("ALOStaking:    ", aloStakingAddress);
  console.log("ALOGovernance: ", aloGovernanceAddress);
  console.log("ALOBuyback:    ", aloBuybackAddress);
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
