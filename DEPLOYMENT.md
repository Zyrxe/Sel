# ALONEA Deployment Guide

This guide covers deploying ALONEA to production (BSC Mainnet) and hosting the frontend on Vercel.

---

## 📋 Pre-Deployment Checklist

Before deploying to mainnet, ensure:

- [ ] All contracts thoroughly tested on testnet
- [ ] Test coverage >90%
- [ ] Gas optimization completed
- [ ] Security audit conducted (recommended)
- [ ] Frontend tested with testnet contracts
- [ ] Sufficient BNB in deployer wallet (~0.5 BNB recommended)
- [ ] BSCScan API key obtained
- [ ] WalletConnect Project ID configured
- [ ] Vercel account created

---

## 🚀 Part 1: Smart Contract Deployment

### Step 1: Prepare Environment

```bash
# Create production .env
cp .env.example .env.production

# Edit with production values
nano .env.production
```

Add:
```env
DEPLOYER_PRIVATE_KEY=your_mainnet_private_key
VITE_BSC_MAINNET_RPC=https://bsc-dataseed.binance.org/
BSCSCAN_API_KEY=your_bscscan_api_key
```

### Step 2: Final Testing

```bash
# Run all tests
npx hardhat test

# Check gas costs
REPORT_GAS=true npx hardhat test

# Verify compilation
npx hardhat compile
```

### Step 3: Deploy to BSC Mainnet

```bash
# Deploy all contracts
npx hardhat run scripts/deploy.ts --network bscMainnet
```

Expected output:
```
🚀 Starting ALONEA deployment...
Deploying contracts with account: 0x...
Account balance: 0.5 BNB

📝 Deploying ALOToken...
✅ ALOToken deployed to: 0x...

📝 Deploying ALOStaking...
✅ ALOStaking deployed to: 0x...

📝 Deploying ALOGovernance...
✅ ALOGovernance deployed to: 0x...

📝 Deploying ALOBuyback...
✅ ALOBuyback deployed to: 0x...

🎉 Deployment completed successfully!
```

### Step 4: Verify Contracts on BSCScan

```bash
tsx scripts/verify.ts bscMainnet
```

### Step 5: Save Contract Addresses

Deployment creates:
- `deployments/bscMainnet-56.json` - Full deployment info
- `.env.contracts` - Contract addresses for frontend

Copy addresses to your production environment:
```bash
cat .env.contracts
```

---

## 🌐 Part 2: Frontend Deployment (Vercel)

### Step 1: Connect Repository to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository
4. Vercel auto-detects Vite configuration

### Step 2: Configure Environment Variables

In Vercel dashboard, add these environment variables:

```
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_id
VITE_BSC_MAINNET_RPC=https://bsc-dataseed.binance.org/
VITE_BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545/
VITE_ALO_TOKEN_ADDRESS=0x...     (from deployment)
VITE_ALO_STAKING_ADDRESS=0x...   (from deployment)
VITE_ALO_GOVERNANCE_ADDRESS=0x... (from deployment)
VITE_ALO_BUYBACK_ADDRESS=0x...   (from deployment)
```

### Step 3: Deploy

Vercel will automatically:
- Install dependencies
- Build the project
- Deploy to production
- Assign a URL (e.g., `alonea.vercel.app`)

### Step 4: Custom Domain (Optional)

1. Go to Project Settings > Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic)

---

## 🔧 Post-Deployment Tasks

### 1. Add Liquidity to PancakeSwap

```bash
# Visit PancakeSwap
https://pancakeswap.finance/add/BNB/YOUR_TOKEN_ADDRESS

# Add initial liquidity (e.g., 10 BNB + equivalent ALO)
```

### 2. Configure Token on BSCScan

1. Visit `https://bscscan.com/token/YOUR_TOKEN_ADDRESS`
2. Click "Update Token Info"
3. Upload logo and description

### 3. Fund Staking Rewards

Transfer ALO tokens to staking contract:
```typescript
// Using ethers.js
await aloToken.transfer(stakingContractAddress, ethers.parseEther("1000000"));
```

### 4. Initialize Buyback

Send initial BNB to buyback contract:
```bash
# Via MetaMask or web3 wallet
# Send to buyback contract address
```

### 5. Create Initial Governance Proposal

Test governance system with a sample proposal:
```typescript
await governance.propose(
  "Enable fee exclusion for exchange contracts",
  "Proposal to exclude major exchanges from transaction fees to improve liquidity"
);
```

---

## 📊 Monitoring & Maintenance

### Monitor Contract Activity

- **BSCScan**: Track all transactions
  - Token: `https://bscscan.com/token/YOUR_TOKEN_ADDRESS`
  - Staking: `https://bscscan.com/address/STAKING_ADDRESS`

- **DexTools/DexScreener**: Monitor price and volume
  - Add your token pair

### Frontend Monitoring

Vercel provides:
- Analytics dashboard
- Error tracking
- Performance metrics

### Update Frontend

```bash
# Make changes
git add .
git commit -m "Update: feature description"
git push origin main

# Vercel auto-deploys on push
```

### Update Contracts (If Needed)

⚠️ **Important**: Smart contracts are immutable

To update:
1. Deploy new contract version
2. Migrate data if necessary
3. Update frontend to use new address
4. Notify users of migration

---

## 🔐 Security Recommendations

### Production Checklist

- [ ] Use hardware wallet for deployer account
- [ ] Enable 2FA on all accounts (Vercel, GitHub, BSCScan)
- [ ] Rotate API keys regularly
- [ ] Monitor contract for suspicious activity
- [ ] Set up alerts for large transactions
- [ ] Keep private keys in secure vault (NOT in code)
- [ ] Regular security audits
- [ ] Bug bounty program (optional)

### Incident Response

If you discover a vulnerability:

1. **Do not** publicly disclose
2. Pause affected contracts (if pause functionality exists)
3. Contact security audit firm
4. Prepare communication for users
5. Deploy fix
6. Post-mortem analysis

---

## 📈 Growth & Marketing

### Launch Checklist

- [ ] CoinGecko listing application
- [ ] CoinMarketCap listing application
- [ ] Social media announcements
- [ ] Press release
- [ ] Community AMAs
- [ ] Influencer outreach
- [ ] Audit report publication

### Community Building

- Create official channels:
  - Discord server
  - Telegram group
  - Twitter account
  - Medium blog

---

## 🆘 Troubleshooting

### Deployment Failed

**Error**: `insufficient funds`
- **Solution**: Add more BNB to deployer wallet

**Error**: `nonce too low`
- **Solution**: Reset MetaMask account or wait for mempool to clear

### Frontend Not Loading

**Error**: Contract addresses missing
- **Solution**: Verify environment variables in Vercel

**Error**: WalletConnect not working
- **Solution**: Check WalletConnect Project ID is correct

### Vercel Build Failed

**Error**: `Build exceeded maximum duration`
- **Solution**: Optimize build process or upgrade Vercel plan

---

## 📞 Support

For deployment issues:
- Check [Troubleshooting](#troubleshooting) section
- Review Vercel deployment logs
- Check BSCScan for transaction status
- Contact support on Discord

---

## 🎉 Success!

Your ALONEA dApp is now live on BSC Mainnet!

Next steps:
1. Monitor initial transactions
2. Engage with community
3. Iterate based on feedback
4. Plan future upgrades

**Remember**: This is just the beginning of your Web3 journey! 🚀
