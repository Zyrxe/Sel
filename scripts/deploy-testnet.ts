import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function main() {
  console.log("🚀 Deploying to BSC Testnet...\n");

  try {
    const { stdout, stderr } = await execAsync(
      "npx hardhat run scripts/deploy.ts --network bscTestnet"
    );

    console.log(stdout);
    if (stderr) console.error(stderr);

    console.log("\n✅ Testnet deployment completed!");
    console.log("\n📝 Next steps:");
    console.log("1. Copy contract addresses from .env.contracts to your .env file");
    console.log("2. Verify contracts on BSCScan:");
    console.log("   npx hardhat verify --network bscTestnet <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>");
    console.log("3. Add liquidity to PancakeSwap");
    console.log("4. Test the frontend with testnet contracts");
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main();
