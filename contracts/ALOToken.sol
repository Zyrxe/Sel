// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ALOToken
 * @dev BEP-20 token with automatic fees, buyback, and burn mechanism
 * 
 * Features:
 * - Total Supply: 100,000,000 ALO
 * - 2% transaction fee split:
 *   - 1% to buyback wallet
 *   - 0.5% to auto-add liquidity
 *   - 0.5% to treasury
 * - Deflationary supply through burn mechanism
 * - Excludable addresses from fees (owner, contracts)
 */
contract ALOToken is ERC20, Ownable, ReentrancyGuard {
    // Fee percentages (in basis points: 1% = 100)
    uint256 public constant BUYBACK_FEE = 100; // 1%
    uint256 public constant LIQUIDITY_FEE = 50; // 0.5%
    uint256 public constant TREASURY_FEE = 50; // 0.5%
    uint256 public constant TOTAL_FEE = BUYBACK_FEE + LIQUIDITY_FEE + TREASURY_FEE; // 2%
    uint256 public constant FEE_DENOMINATOR = 10000;

    // Wallets
    address public buybackWallet;
    address public liquidityWallet;
    address public treasuryWallet;

    // Tracking
    uint256 public totalBurned;
    uint256 public totalFees;

    // Fee exclusions
    mapping(address => bool) public isExcludedFromFee;

    // Events
    event FeesCollected(uint256 buyback, uint256 liquidity, uint256 treasury);
    event TokensBurned(uint256 amount);
    event WalletUpdated(string walletType, address newWallet);
    event ExclusionUpdated(address account, bool isExcluded);

    constructor(
        address _buybackWallet,
        address _liquidityWallet,
        address _treasuryWallet
    ) ERC20("ALONEA", "ALO") Ownable(msg.sender) {
        require(_buybackWallet != address(0), "Invalid buyback wallet");
        require(_liquidityWallet != address(0), "Invalid liquidity wallet");
        require(_treasuryWallet != address(0), "Invalid treasury wallet");

        buybackWallet = _buybackWallet;
        liquidityWallet = _liquidityWallet;
        treasuryWallet = _treasuryWallet;

        // Mint total supply to owner
        uint256 totalSupply = 100_000_000 * 10**decimals();
        _mint(msg.sender, totalSupply);

        // Exclude owner and this contract from fees
        isExcludedFromFee[msg.sender] = true;
        isExcludedFromFee[address(this)] = true;
    }

    /**
     * @dev Override transfer function to include fees
     */
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        if (from == address(0) || to == address(0)) {
            super._update(from, to, amount);
            return;
        }

        // Check if fees should be applied
        bool takeFee = !isExcludedFromFee[from] && !isExcludedFromFee[to];

        if (takeFee && amount > 0) {
            // Calculate fees
            uint256 buybackFee = (amount * BUYBACK_FEE) / FEE_DENOMINATOR;
            uint256 liquidityFee = (amount * LIQUIDITY_FEE) / FEE_DENOMINATOR;
            uint256 treasuryFee = (amount * TREASURY_FEE) / FEE_DENOMINATOR;
            uint256 totalFeeAmount = buybackFee + liquidityFee + treasuryFee;

            // Transfer fees
            if (buybackFee > 0) super._update(from, buybackWallet, buybackFee);
            if (liquidityFee > 0) super._update(from, liquidityWallet, liquidityFee);
            if (treasuryFee > 0) super._update(from, treasuryWallet, treasuryFee);

            // Track total fees
            totalFees += totalFeeAmount;
            emit FeesCollected(buybackFee, liquidityFee, treasuryFee);

            // Transfer remaining amount
            uint256 amountAfterFee = amount - totalFeeAmount;
            super._update(from, to, amountAfterFee);
        } else {
            super._update(from, to, amount);
        }
    }

    /**
     * @dev Burn tokens permanently
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        totalBurned += amount;
        emit TokensBurned(amount);
    }

    /**
     * @dev Burn tokens from specific address (requires allowance)
     */
    function burnFrom(address account, uint256 amount) external {
        _spendAllowance(account, msg.sender, amount);
        _burn(account, amount);
        totalBurned += amount;
        emit TokensBurned(amount);
    }

    /**
     * @dev Update buyback wallet
     */
    function setBuybackWallet(address _wallet) external onlyOwner {
        require(_wallet != address(0), "Invalid address");
        buybackWallet = _wallet;
        emit WalletUpdated("buyback", _wallet);
    }

    /**
     * @dev Update liquidity wallet
     */
    function setLiquidityWallet(address _wallet) external onlyOwner {
        require(_wallet != address(0), "Invalid address");
        liquidityWallet = _wallet;
        emit WalletUpdated("liquidity", _wallet);
    }

    /**
     * @dev Update treasury wallet
     */
    function setTreasuryWallet(address _wallet) external onlyOwner {
        require(_wallet != address(0), "Invalid address");
        treasuryWallet = _wallet;
        emit WalletUpdated("treasury", _wallet);
    }

    /**
     * @dev Exclude or include an address from fees
     */
    function setExcludeFromFee(address account, bool excluded) external onlyOwner {
        require(account != address(0), "Invalid address");
        isExcludedFromFee[account] = excluded;
        emit ExclusionUpdated(account, excluded);
    }

    /**
     * @dev Get current circulating supply (total supply - burned)
     */
    function circulatingSupply() external view returns (uint256) {
        return totalSupply();
    }
}
