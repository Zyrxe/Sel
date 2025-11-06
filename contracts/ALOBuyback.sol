// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IALOToken is IERC20 {
    function burn(uint256 amount) external;
}

interface IPancakeRouter {
    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts);

    function WETH() external pure returns (address);
}

/**
 * @title ALOBuyback
 * @dev Automatic BNB to ALO buyback and burn mechanism
 * 
 * Features:
 * - Automatic BNB to ALO conversion via PancakeSwap
 * - Automatic token burning
 * - Treasury-controlled parameters
 * - Buyback statistics tracking
 */
contract ALOBuyback is Ownable, ReentrancyGuard {
    IALOToken public immutable aloToken;
    IPancakeRouter public pancakeRouter;
    
    uint256 public totalBuybackBNB;
    uint256 public totalBuybackALO;
    uint256 public totalBurned;
    uint256 public lastBuybackAmount;
    uint256 public lastBuybackTime;
    
    uint256 public minimumBuybackAmount; // Minimum BNB required for buyback
    uint256 public slippageTolerance; // In basis points (100 = 1%)
    
    bool public autoBuybackEnabled;

    // Events
    event BuybackExecuted(
        uint256 bnbAmount,
        uint256 aloReceived,
        uint256 aloBurned,
        uint256 timestamp
    );
    event BuybackParametersUpdated(
        uint256 minimumAmount,
        uint256 slippageTolerance
    );
    event AutoBuybackToggled(bool enabled);
    event RouterUpdated(address newRouter);

    constructor(
        address _aloToken,
        address _pancakeRouter,
        uint256 _minimumBuybackAmount,
        uint256 _slippageTolerance
    ) Ownable(msg.sender) {
        require(_aloToken != address(0), "Invalid token address");
        require(_pancakeRouter != address(0), "Invalid router address");
        
        aloToken = IALOToken(_aloToken);
        pancakeRouter = IPancakeRouter(_pancakeRouter);
        minimumBuybackAmount = _minimumBuybackAmount;
        slippageTolerance = _slippageTolerance;
        autoBuybackEnabled = true;
    }

    /**
     * @dev Receive BNB
     */
    receive() external payable {
        if (autoBuybackEnabled && address(this).balance >= minimumBuybackAmount) {
            _executeBuyback();
        }
    }

    /**
     * @dev Execute buyback manually
     */
    function executeBuyback() external nonReentrant onlyOwner {
        require(address(this).balance > 0, "No BNB available");
        _executeBuyback();
    }

    /**
     * @dev Internal buyback execution
     */
    function _executeBuyback() internal {
        uint256 bnbAmount = address(this).balance;
        require(bnbAmount >= minimumBuybackAmount, "Amount below minimum");

        // Prepare swap path
        address[] memory path = new address[](2);
        path[0] = pancakeRouter.WETH(); // WBNB
        path[1] = address(aloToken);

        // Calculate minimum output with slippage tolerance
        // In production, you'd get this from an oracle or price feed
        uint256 minOutput = 0; // Accept any amount for now

        // Execute swap
        uint256[] memory amounts = pancakeRouter.swapExactETHForTokens{value: bnbAmount}(
            minOutput,
            path,
            address(this),
            block.timestamp + 300 // 5 minute deadline
        );

        uint256 aloReceived = amounts[amounts.length - 1];

        // Burn all received ALO tokens
        aloToken.burn(aloReceived);

        // Update statistics
        totalBuybackBNB += bnbAmount;
        totalBuybackALO += aloReceived;
        totalBurned += aloReceived;
        lastBuybackAmount = aloReceived;
        lastBuybackTime = block.timestamp;

        emit BuybackExecuted(bnbAmount, aloReceived, aloReceived, block.timestamp);
    }

    /**
     * @dev Get buyback statistics
     */
    function getBuybackStats() external view returns (
        uint256 _totalBuybackBNB,
        uint256 _totalBuybackALO,
        uint256 _totalBurned,
        uint256 _lastBuybackAmount,
        uint256 _lastBuybackTime,
        uint256 _treasuryBalance
    ) {
        return (
            totalBuybackBNB,
            totalBuybackALO,
            totalBurned,
            lastBuybackAmount,
            lastBuybackTime,
            address(this).balance
        );
    }

    /**
     * @dev Update buyback parameters
     */
    function setBuybackParameters(
        uint256 _minimumAmount,
        uint256 _slippageTolerance
    ) external onlyOwner {
        require(_slippageTolerance <= 1000, "Slippage too high"); // Max 10%
        
        minimumBuybackAmount = _minimumAmount;
        slippageTolerance = _slippageTolerance;

        emit BuybackParametersUpdated(_minimumAmount, _slippageTolerance);
    }

    /**
     * @dev Toggle auto-buyback
     */
    function setAutoBuybackEnabled(bool enabled) external onlyOwner {
        autoBuybackEnabled = enabled;
        emit AutoBuybackToggled(enabled);
    }

    /**
     * @dev Update PancakeSwap router
     */
    function setPancakeRouter(address _router) external onlyOwner {
        require(_router != address(0), "Invalid router address");
        pancakeRouter = IPancakeRouter(_router);
        emit RouterUpdated(_router);
    }

    /**
     * @dev Emergency withdraw BNB (only owner)
     */
    function emergencyWithdrawBNB() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No BNB to withdraw");
        payable(owner()).transfer(balance);
    }

    /**
     * @dev Emergency withdraw tokens (only owner)
     */
    function emergencyWithdrawTokens(address token) external onlyOwner {
        require(token != address(0), "Invalid token address");
        IERC20 tokenContract = IERC20(token);
        uint256 balance = tokenContract.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        tokenContract.transfer(owner(), balance);
    }
}
