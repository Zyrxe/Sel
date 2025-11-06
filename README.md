# ALONEA (ALO) - Sustainable Web3 Ecosystem on BSC

<div align="center">
  <img src="./public/icon-512x512.png" alt="ALONEA Logo" width="200"/>
  
  **A complete DeFi platform with tier-based staking, DAO governance, and automatic buyback mechanism**

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Solidity](https://img.shields.io/badge/Solidity-^0.8.27-blue)](https://soliditylang.org/)
  [![Hardhat](https://img.shields.io/badge/Hardhat-Latest-orange)](https://hardhat.org/)
  [![React](https://img.shields.io/badge/React-18+-61DAFB)](https://reactjs.org/)
</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Smart Contracts](#smart-contracts)
- [Deployment](#deployment)
- [Testing](#testing)
- [Frontend Development](#frontend-development)
- [PWA Features](#pwa-features)
- [Troubleshooting](#troubleshooting)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

---

## 🌟 Overview

ALONEA is a sustainable Web3 ecosystem built on Binance Smart Chain (BSC) that combines:

- **BEP-20 Token** with automatic fee distribution (buyback, liquidity, treasury)
- **Tier-Based Staking** with 5 levels and reward multipliers
- **DAO Governance** for community-driven decision making
- **Automatic Buyback & Burn** mechanism for deflationary tokenomics
- **Progressive Web App** with offline support

---

## ✨ Features

### Smart Contracts

#### ALOToken (BEP-20)
- ✅ Total Supply: 100,000,000 ALO
- ✅ 2% transaction fee distribution:
  - 1% to buyback wallet
  - 0.5% to auto-add liquidity
  - 0.5% to treasury
- ✅ Automatic burn mechanism
- ✅ Fee exclusions for contracts

#### ALOStaking
- ✅ 5 Staking Tiers:
  - **Free**: 0 ALO (1.0x multiplier)
  - **Bronze**: 100 ALO (1.0x multiplier)
  - **Silver**: 500 ALO (1.1x multiplier)
  - **Platinum**: 1,000 ALO (1.25x multiplier)
  - **Diamond**: 1,500 ALO (1.5x multiplier)
- ✅ Real-time reward calculation
- ✅ Emergency withdraw function
- ✅ Tier statistics tracking

#### ALOGovernance
- ✅ Create and vote on proposals
- ✅ Voting power based on staked balance
- ✅ Configurable quorum requirements
- ✅ Time-locked proposal execution
- ✅ Proposal cancellation

#### ALOBuyback
- ✅ Automatic BNB to ALO conversion via PancakeSwap
- ✅ Automatic token burning
- ✅ Configurable buyback parameters
- ✅ Statistics tracking

### Frontend Features

- 🎨 Modern glassmorphism design
- 🌓 Dark/Light theme support
- 📱 Fully responsive (mobile-first)
- 💼 WalletConnect v2 & MetaMask integration
- 📊 Real-time dashboard with stats
- 🎯 Interactive staking interface
- 🗳️ Governance voting system
- 🔥 Buyback statistics display
- 🔔 Transaction status notifications
- 📲 PWA with offline support

---

## 🛠 Technology Stack

### Smart Contracts
- Solidity ^0.8.27
- Hardhat
- OpenZeppelin Contracts
- TypeChain
- Ethers.js v6

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- Wagmi & Viem
- @web3modal/wagmi
- Shadcn/ui Components
- Wouter (routing)
- TanStack Query

### Backend
- Node.js 18+
- Express
- TypeScript

### DevOps
- Vercel (frontend hosting)
- BSC Testnet/Mainnet
- Hardhat Network (local testing)

---

## 📁 Project Structure

```
alonea/
├── contracts/               # Solidity smart contracts
│   ├── ALOToken.sol
│   ├── ALOStaking.sol
│   ├── ALOGovernance.sol
│   └── ALOBuyback.sol
├── scripts/                 # Deployment scripts
│   ├── deploy.ts
│   ├── deploy-testnet.ts
│   └── verify.ts
├── test/                    # Contract tests
│   └── contracts/
│       ├── ALOToken.test.ts
│       └── ALOStaking.test.ts
├── client/                  # Frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks
│   │   ├── config/          # Web3 configuration
│   │   ├── providers/       # Context providers
│   │   └── abis/            # Contract ABIs (auto-generated)
│   └── index.html
├── server/                  # Backend API
│   ├── index.ts
│   └── routes.ts
├── shared/                  # Shared types
│   └── schema.ts
├── deployments/             # Deployment info (auto-generated)
├── hardhat.config.ts        # Hardhat configuration
├── package.json             # Node.js dependencies
├── package.hardhat.json     # Hardhat-specific dependencies
└── .env.example             # Environment template

```

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Git**
- **MetaMask** or another Web3 wallet
- **BSC Testnet BNB** (for testing)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/alonea.git
cd alonea
```

### 2. Install Dependencies

```bash
# Install main dependencies
npm install

# Install Hardhat dependencies
npm install --save-dev @nomicfoundation/hardhat-toolbox @openzeppelin/contracts hardhat ethers typechain @typechain/hardhat @typechain/ethers-v6
```

### 3. Copy Environment Files

```bash
cp .env.example .env
```

---

## ⚙️ Configuration

### 1. Environment Variables

Edit `.env` with your configuration:

```env
# WalletConnect Project ID
# Get one at https://cloud.walletconnect.com/
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here

# BSC RPC Endpoints
VITE_BSC_MAINNET_RPC=https://bsc-dataseed.binance.org/
VITE_BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545/

# Deployer Private Key (NEVER COMMIT THIS!)
DEPLOYER_PRIVATE_KEY=your_private_key_here

# BSCScan API Key (for contract verification)
BSCSCAN_API_KEY=your_bscscan_api_key
```

### 2. Get a WalletConnect Project ID

1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy your Project ID
4. Paste it in `.env` as `VITE_WALLETCONNECT_PROJECT_ID`

### 3. Get BSC Testnet BNB

1. Visit [BSC Testnet Faucet](https://testnet.bnbchain.org/faucet-smart)
2. Enter your wallet address
3. Request testnet BNB

---

## 📝 Smart Contracts

### Compile Contracts

```bash
npx hardhat compile
```

This will:
- Compile all Solidity contracts
- Generate TypeScript types in `typechain-types/`
- Create artifacts in `artifacts/`

### Run Tests

```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/contracts/ALOToken.test.ts

# Generate coverage report
npx hardhat coverage

# Generate gas report
REPORT_GAS=true npx hardhat test
```

---

## 🚢 Deployment

### Deploy to BSC Testnet

```bash
# Make sure your .env has DEPLOYER_PRIVATE_KEY with testnet BNB
npx hardhat run scripts/deploy.ts --network bscTestnet
```

This will:
1. Deploy all 4 contracts
2. Configure contracts (exclude from fees, fund rewards)
3. Save deployment info to `deployments/bscTestnet-97.json`
4. Export ABIs to `client/src/abis/`
5. Create `.env.contracts` with contract addresses

### Deploy to BSC Mainnet

```bash
# ⚠️ WARNING: This deploys to mainnet and costs real BNB
npx hardhat run scripts/deploy.ts --network bscMainnet
```

### Verify Contracts on BSCScan

```bash
# Testnet
npx hardhat verify --network bscTestnet

# Mainnet
npx hardhat verify --network bscMainnet
```

Or use the automated verification script:

```bash
tsx scripts/verify.ts bscTestnet
```

### Update Frontend with Contract Addresses

After deployment, copy addresses from `.env.contracts` to `.env`:

```bash
cat .env.contracts >> .env
```

---

## 💻 Frontend Development

### Start Development Server

```bash
npm run dev
```

This starts:
- Frontend on `http://localhost:5000`
- Hot module replacement (HMR)
- Backend API proxy

### Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

### Preview Production Build

```bash
npm start
```

---

## 📲 PWA Features

The ALONEA dApp is a Progressive Web App with:

- ✅ **Offline Support**: Core functionality works without internet
- ✅ **Install Prompt**: Add to home screen on mobile
- ✅ **Service Worker**: Automatic caching and updates
- ✅ **Background Sync**: Queue transactions when offline
- ✅ **Push Notifications**: Transaction status updates
- ✅ **Responsive**: Optimized for all screen sizes

### Testing PWA Features

1. Build the production version:
   ```bash
   npm run build
   npm start
   ```

2. Open in Chrome and check DevTools > Application > Service Workers

3. Test offline mode:
   - DevTools > Network > Offline checkbox
   - App should still load cached content

---

## 🔍 Troubleshooting

### Common Issues

#### Contract Deployment Fails

```
Error: insufficient funds for gas
```

**Solution**: Ensure your deployer wallet has enough BNB for gas fees.

#### WalletConnect Not Working

```
Error: Invalid project ID
```

**Solution**: Verify your `VITE_WALLETCONNECT_PROJECT_ID` in `.env`

#### Transactions Failing

```
Error: execution reverted
```

**Solution**: 
- Check contract is excluded from fees if it's interacting with ALOToken
- Verify you have sufficient token balance
- Check approval for staking/transfers

#### Build Errors

```
Module not found
```

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Network Issues

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| BSC Mainnet | 56 | https://bsc-dataseed.binance.org/ |
| BSC Testnet | 97 | https://data-seed-prebsc-1-s1.binance.org:8545/ |

### Gas Optimization

Typical gas costs on BSC:
- Token Transfer: ~50,000 gas
- Stake: ~150,000 gas
- Vote: ~100,000 gas
- Create Proposal: ~200,000 gas

---

## 🔒 Security

### Best Practices

✅ **Never commit private keys**
- Use `.env` for sensitive data
- Add `.env` to `.gitignore`

✅ **Audit smart contracts**
- Run `npx hardhat test` before deployment
- Consider professional audit for mainnet

✅ **Test thoroughly**
- Test on testnet first
- Verify all contract interactions
- Check edge cases

✅ **Keep dependencies updated**
```bash
npm audit
npm update
```

### Security Checklist

- [ ] Private keys secured
- [ ] Contracts tested (>90% coverage)
- [ ] Frontend input validation
- [ ] Rate limiting on API endpoints
- [ ] HTTPS enabled (Vercel handles this)
- [ ] CSP headers configured

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Follow existing code style
- Update documentation
- Test on testnet before submitting PR

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

- **Documentation**: This README
- **Issues**: [GitHub Issues](https://github.com/yourusername/alonea/issues)
- **Discord**: [Join our community](#)
- **Twitter**: [@ALONEA](#)

---

## 🙏 Acknowledgments

- [OpenZeppelin](https://openzeppelin.com/) for secure smart contract libraries
- [Hardhat](https://hardhat.org/) for development environment
- [BSC](https://www.bnbchain.org/) for the blockchain infrastructure
- [PancakeSwap](https://pancakeswap.finance/) for DEX integration

---

<div align="center">
  <strong>Built with ❤️ by the ALONEA Team</strong>
  
  [Website](#) • [Twitter](#) • [Discord](#) • [Telegram](#)
</div>
