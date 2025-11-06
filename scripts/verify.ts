import { run } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const args = process.argv.slice(2);
  const networkName = args[0] || "bscTestnet";

  console.log(`🔍 Verifying contracts on ${networkName}...\n`);

  // Load deployment info
  const deploymentPath = path.join(__dirname, "..", "deployments", `${networkName}.json`);
  
  if (!fs.existsSync(deploymentPath)) {
    console.error(`❌ Deployment file not found: ${deploymentPath}`);
    console.log("Please deploy contracts first using: npm run deploy:testnet");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const { contracts, configuration } = deployment;

  // Verify ALOToken
  console.log("Verifying ALOToken...");
  try {
    await run("verify:verify", {
      address: contracts.ALOToken,
      constructorArguments: [
        deployment.deployer,
        deployment.deployer,
        deployment.deployer,
      ],
    });
    console.log("✅ ALOToken verified\n");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ ALOToken already verified\n");
    } else {
      console.error("❌ ALOToken verification failed:", error.message, "\n");
    }
  }

  // Verify ALOStaking
  console.log("Verifying ALOStaking...");
  try {
    await run("verify:verify", {
      address: contracts.ALOStaking,
      constructorArguments: [
        contracts.ALOToken,
        configuration.rewardRate,
      ],
    });
    console.log("✅ ALOStaking verified\n");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ ALOStaking already verified\n");
    } else {
      console.error("❌ ALOStaking verification failed:", error.message, "\n");
    }
  }

  // Verify ALOGovernance
  console.log("Verifying ALOGovernance...");
  try {
    await run("verify:verify", {
      address: contracts.ALOGovernance,
      constructorArguments: [
        contracts.ALOToken,
        contracts.ALOStaking,
        configuration.votingDelay,
        configuration.votingPeriod,
        configuration.proposalThreshold,
        configuration.quorumPercentage,
      ],
    });
    console.log("✅ ALOGovernance verified\n");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ ALOGovernance already verified\n");
    } else {
      console.error("❌ ALOGovernance verification failed:", error.message, "\n");
    }
  }

  // Verify ALOBuyback
  console.log("Verifying ALOBuyback...");
  const pancakeRouter = networkName === "bscTestnet" 
    ? "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"
    : "0x10ED43C718714eb63d5aA57B78B54704E256024E";

  try {
    await run("verify:verify", {
      address: contracts.ALOBuyback,
      constructorArguments: [
        contracts.ALOToken,
        pancakeRouter,
        configuration.minimumBuybackAmount,
        configuration.slippageTolerance,
      ],
    });
    console.log("✅ ALOBuyback verified\n");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ ALOBuyback already verified\n");
    } else {
      console.error("❌ ALOBuyback verification failed:", error.message, "\n");
    }
  }

  console.log("🎉 Verification process completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
