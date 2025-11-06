import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint to get contract ABIs
  app.get("/api/contracts/abis/:contractName", (req, res) => {
    try {
      const { contractName } = req.params;
      const abiPath = path.join(process.cwd(), "client", "src", "abis", `${contractName}.json`);
      
      if (!fs.existsSync(abiPath)) {
        return res.status(404).json({ error: "Contract ABI not found" });
      }

      const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));
      res.json(abi);
    } catch (error) {
      res.status(500).json({ error: "Failed to load contract ABI" });
    }
  });

  // API endpoint to get deployment configuration
  app.get("/api/contracts/deployments/:network", (req, res) => {
    try {
      const { network } = req.params;
      const deploymentPath = path.join(process.cwd(), "deployments", `${network}.json`);
      
      if (!fs.existsSync(deploymentPath)) {
        return res.status(404).json({ error: "Deployment configuration not found" });
      }

      const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
      res.json(deployment);
    } catch (error) {
      res.status(500).json({ error: "Failed to load deployment configuration" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    });
  });

  // API endpoint to get supported networks
  app.get("/api/networks", (req, res) => {
    res.json({
      networks: [
        {
          chainId: 56,
          name: "BSC Mainnet",
          rpc: process.env.VITE_BSC_MAINNET_RPC || "https://bsc-dataseed.binance.org/",
          explorer: "https://bscscan.com"
        },
        {
          chainId: 97,
          name: "BSC Testnet",
          rpc: process.env.VITE_BSC_TESTNET_RPC || "https://data-seed-prebsc-1-s1.binance.org:8545/",
          explorer: "https://testnet.bscscan.com"
        }
      ]
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
