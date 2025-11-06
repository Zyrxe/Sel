// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ALOStaking
 * @dev Tier-based staking contract with reward multipliers
 * 
 * Tiers:
 * - Free: 0 ALO (1.0x multiplier)
 * - Bronze: 100 ALO (1.0x multiplier)
 * - Silver: 500 ALO (1.1x multiplier)
 * - Platinum: 1000 ALO (1.25x multiplier)
 * - Diamond: 1500 ALO (1.5x multiplier)
 */
contract ALOStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Staking tiers
    enum Tier { FREE, BRONZE, SILVER, PLATINUM, DIAMOND }

    struct TierConfig {
        uint256 requiredAmount;
        uint256 multiplier; // Multiplier in basis points (1.0x = 10000)
    }

    struct StakeInfo {
        uint256 amount;
        uint256 startTime;
        uint256 lastClaimTime;
        Tier tier;
        uint256 rewardDebt;
    }

    // State variables
    IERC20 public immutable aloToken;
    uint256 public rewardRate; // Rewards per second per token (in wei)
    uint256 public totalStaked;

    // Tier configurations
    mapping(Tier => TierConfig) public tierConfigs;
    
    // User staking info
    mapping(address => StakeInfo) public stakes;

    // Tier statistics
    mapping(Tier => uint256) public tierStakers;
    mapping(Tier => uint256) public tierTotalStaked;

    // Events
    event Staked(address indexed user, uint256 amount, Tier tier);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 newRate);
    event TierConfigUpdated(Tier tier, uint256 requiredAmount, uint256 multiplier);

    constructor(address _aloToken, uint256 _rewardRate) Ownable(msg.sender) {
        require(_aloToken != address(0), "Invalid token address");
        aloToken = IERC20(_aloToken);
        rewardRate = _rewardRate;

        // Initialize tier configurations
        tierConfigs[Tier.FREE] = TierConfig(0, 10000); // 1.0x
        tierConfigs[Tier.BRONZE] = TierConfig(100 * 10**18, 10000); // 1.0x
        tierConfigs[Tier.SILVER] = TierConfig(500 * 10**18, 11000); // 1.1x
        tierConfigs[Tier.PLATINUM] = TierConfig(1000 * 10**18, 12500); // 1.25x
        tierConfigs[Tier.DIAMOND] = TierConfig(1500 * 10**18, 15000); // 1.5x
    }

    /**
     * @dev Stake tokens
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        StakeInfo storage userStake = stakes[msg.sender];

        // If user has existing stake, claim rewards first
        if (userStake.amount > 0) {
            _claimRewards(msg.sender);
        } else {
            userStake.startTime = block.timestamp;
            userStake.lastClaimTime = block.timestamp;
        }

        // Transfer tokens
        aloToken.safeTransferFrom(msg.sender, address(this), amount);

        // Update stake info
        uint256 oldAmount = userStake.amount;
        Tier oldTier = userStake.tier;
        userStake.amount += amount;

        // Determine new tier
        Tier newTier = _getTierForAmount(userStake.amount);
        userStake.tier = newTier;

        // Update statistics
        if (oldAmount == 0) {
            tierStakers[newTier]++;
        } else if (oldTier != newTier) {
            tierStakers[oldTier]--;
            tierStakers[newTier]++;
            tierTotalStaked[oldTier] -= oldAmount;
        }

        tierTotalStaked[newTier] += amount;
        totalStaked += amount;

        emit Staked(msg.sender, amount, newTier);
    }

    /**
     * @dev Unstake tokens
     */
    function unstake(uint256 amount) external nonReentrant {
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.amount >= amount, "Insufficient staked amount");
        require(amount > 0, "Amount must be greater than 0");

        // Claim rewards first
        _claimRewards(msg.sender);

        // Update stake info
        Tier oldTier = userStake.tier;
        userStake.amount -= amount;

        // Determine new tier
        Tier newTier = _getTierForAmount(userStake.amount);
        
        // Update statistics
        if (userStake.amount == 0) {
            tierStakers[oldTier]--;
            delete stakes[msg.sender];
        } else if (oldTier != newTier) {
            tierStakers[oldTier]--;
            tierStakers[newTier]++;
            tierTotalStaked[newTier] += userStake.amount;
            userStake.tier = newTier;
        }

        tierTotalStaked[oldTier] -= amount;
        totalStaked -= amount;

        // Transfer tokens back
        aloToken.safeTransfer(msg.sender, amount);

        emit Unstaked(msg.sender, amount);
    }

    /**
     * @dev Claim rewards
     */
    function claimRewards() external nonReentrant {
        _claimRewards(msg.sender);
    }

    /**
     * @dev Internal function to claim rewards
     */
    function _claimRewards(address user) internal {
        StakeInfo storage userStake = stakes[user];
        require(userStake.amount > 0, "No active stake");

        uint256 rewards = calculateRewards(user);
        
        if (rewards > 0) {
            userStake.lastClaimTime = block.timestamp;
            userStake.rewardDebt += rewards;
            
            // Transfer rewards (in a real implementation, these would come from a rewards pool)
            // For now, we'll assume the contract has been funded with rewards
            require(aloToken.balanceOf(address(this)) >= totalStaked + rewards, "Insufficient rewards");
            aloToken.safeTransfer(user, rewards);

            emit RewardsClaimed(user, rewards);
        }
    }

    /**
     * @dev Calculate pending rewards for a user
     */
    function calculateRewards(address user) public view returns (uint256) {
        StakeInfo memory userStake = stakes[user];
        
        if (userStake.amount == 0) {
            return 0;
        }

        uint256 timeElapsed = block.timestamp - userStake.lastClaimTime;
        TierConfig memory tier = tierConfigs[userStake.tier];
        
        // Base rewards
        uint256 baseRewards = (userStake.amount * rewardRate * timeElapsed) / 1e18;
        
        // Apply tier multiplier
        uint256 rewards = (baseRewards * tier.multiplier) / 10000;
        
        return rewards;
    }

    /**
     * @dev Emergency withdraw without caring about rewards
     */
    function emergencyWithdraw() external nonReentrant {
        StakeInfo storage userStake = stakes[msg.sender];
        uint256 amount = userStake.amount;
        require(amount > 0, "No active stake");

        Tier tier = userStake.tier;
        
        // Update statistics
        tierStakers[tier]--;
        tierTotalStaked[tier] -= amount;
        totalStaked -= amount;

        // Clear stake
        delete stakes[msg.sender];

        // Transfer tokens back
        aloToken.safeTransfer(msg.sender, amount);

        emit EmergencyWithdraw(msg.sender, amount);
    }

    /**
     * @dev Get tier for a given staked amount
     */
    function _getTierForAmount(uint256 amount) internal view returns (Tier) {
        if (amount >= tierConfigs[Tier.DIAMOND].requiredAmount) {
            return Tier.DIAMOND;
        } else if (amount >= tierConfigs[Tier.PLATINUM].requiredAmount) {
            return Tier.PLATINUM;
        } else if (amount >= tierConfigs[Tier.SILVER].requiredAmount) {
            return Tier.SILVER;
        } else if (amount >= tierConfigs[Tier.BRONZE].requiredAmount) {
            return Tier.BRONZE;
        } else {
            return Tier.FREE;
        }
    }

    /**
     * @dev Get user's current tier
     */
    function getUserTier(address user) external view returns (Tier) {
        return stakes[user].tier;
    }

    /**
     * @dev Get user's staking info
     */
    function getUserStakeInfo(address user) external view returns (
        uint256 amount,
        uint256 startTime,
        uint256 lastClaimTime,
        Tier tier,
        uint256 pendingRewards
    ) {
        StakeInfo memory userStake = stakes[user];
        return (
            userStake.amount,
            userStake.startTime,
            userStake.lastClaimTime,
            userStake.tier,
            calculateRewards(user)
        );
    }

    /**
     * @dev Update reward rate (only owner)
     */
    function setRewardRate(uint256 _rewardRate) external onlyOwner {
        rewardRate = _rewardRate;
        emit RewardRateUpdated(_rewardRate);
    }

    /**
     * @dev Update tier configuration (only owner)
     */
    function setTierConfig(Tier tier, uint256 requiredAmount, uint256 multiplier) external onlyOwner {
        tierConfigs[tier] = TierConfig(requiredAmount, multiplier);
        emit TierConfigUpdated(tier, requiredAmount, multiplier);
    }

    /**
     * @dev Fund rewards pool (only owner)
     */
    function fundRewards(uint256 amount) external onlyOwner {
        aloToken.safeTransferFrom(msg.sender, address(this), amount);
    }
}
