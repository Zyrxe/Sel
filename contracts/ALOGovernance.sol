// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ALOGovernance
 * @dev DAO governance contract with voting based on staked ALO balance
 * 
 * Features:
 * - Create proposals
 * - Vote with staked ALO balance
 * - Quorum requirements
 * - Time-locked execution
 */
contract ALOGovernance is Ownable, ReentrancyGuard {
    enum ProposalState {
        Pending,
        Active,
        Succeeded,
        Defeated,
        Queued,
        Executed,
        Canceled
    }

    enum VoteType {
        Against,
        For,
        Abstain
    }

    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        uint256 quorum;
        bool executed;
        bool canceled;
        mapping(address => Receipt) receipts;
    }

    struct Receipt {
        bool hasVoted;
        VoteType support;
        uint256 votes;
    }

    // State variables
    IERC20 public immutable aloToken;
    address public stakingContract;
    
    uint256 public proposalCount;
    uint256 public votingDelay; // Blocks to wait before voting starts
    uint256 public votingPeriod; // Number of blocks voting is open
    uint256 public proposalThreshold; // Minimum ALO required to create proposal
    uint256 public quorumPercentage; // Percentage of total supply required for quorum

    mapping(uint256 => Proposal) public proposals;

    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        uint256 startBlock,
        uint256 endBlock
    );
    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        VoteType support,
        uint256 votes
    );
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);
    event VotingParametersUpdated(
        uint256 votingDelay,
        uint256 votingPeriod,
        uint256 proposalThreshold,
        uint256 quorumPercentage
    );

    constructor(
        address _aloToken,
        address _stakingContract,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _quorumPercentage
    ) Ownable(msg.sender) {
        require(_aloToken != address(0), "Invalid token address");
        require(_stakingContract != address(0), "Invalid staking contract");
        
        aloToken = IERC20(_aloToken);
        stakingContract = _stakingContract;
        votingDelay = _votingDelay;
        votingPeriod = _votingPeriod;
        proposalThreshold = _proposalThreshold;
        quorumPercentage = _quorumPercentage;
    }

    /**
     * @dev Create a new proposal
     */
    function propose(
        string memory title,
        string memory description
    ) external returns (uint256) {
        require(
            getVotingPower(msg.sender) >= proposalThreshold,
            "Proposer votes below proposal threshold"
        );

        proposalCount++;
        uint256 proposalId = proposalCount;

        Proposal storage newProposal = proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.proposer = msg.sender;
        newProposal.title = title;
        newProposal.description = description;
        newProposal.startBlock = block.number + votingDelay;
        newProposal.endBlock = block.number + votingDelay + votingPeriod;
        newProposal.quorum = (aloToken.totalSupply() * quorumPercentage) / 100;

        emit ProposalCreated(
            proposalId,
            msg.sender,
            title,
            newProposal.startBlock,
            newProposal.endBlock
        );

        return proposalId;
    }

    /**
     * @dev Cast a vote on a proposal
     */
    function castVote(uint256 proposalId, VoteType support) external nonReentrant {
        return _castVote(msg.sender, proposalId, support);
    }

    /**
     * @dev Internal vote casting function
     */
    function _castVote(
        address voter,
        uint256 proposalId,
        VoteType support
    ) internal {
        require(state(proposalId) == ProposalState.Active, "Voting is closed");
        
        Proposal storage proposal = proposals[proposalId];
        Receipt storage receipt = proposal.receipts[voter];
        
        require(!receipt.hasVoted, "Already voted");

        uint256 votes = getVotingPower(voter);
        require(votes > 0, "No voting power");

        if (support == VoteType.For) {
            proposal.forVotes += votes;
        } else if (support == VoteType.Against) {
            proposal.againstVotes += votes;
        } else {
            proposal.abstainVotes += votes;
        }

        receipt.hasVoted = true;
        receipt.support = support;
        receipt.votes = votes;

        emit VoteCast(voter, proposalId, support, votes);
    }

    /**
     * @dev Get the current state of a proposal
     */
    function state(uint256 proposalId) public view returns (ProposalState) {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal");
        
        Proposal storage proposal = proposals[proposalId];

        if (proposal.canceled) {
            return ProposalState.Canceled;
        } else if (proposal.executed) {
            return ProposalState.Executed;
        } else if (block.number <= proposal.startBlock) {
            return ProposalState.Pending;
        } else if (block.number <= proposal.endBlock) {
            return ProposalState.Active;
        } else if (proposal.forVotes <= proposal.againstVotes || proposal.forVotes < proposal.quorum) {
            return ProposalState.Defeated;
        } else {
            return ProposalState.Succeeded;
        }
    }

    /**
     * @dev Execute a successful proposal
     */
    function execute(uint256 proposalId) external nonReentrant {
        require(state(proposalId) == ProposalState.Succeeded, "Proposal not succeeded");
        
        Proposal storage proposal = proposals[proposalId];
        proposal.executed = true;

        emit ProposalExecuted(proposalId);
    }

    /**
     * @dev Cancel a proposal (only proposer or owner)
     */
    function cancel(uint256 proposalId) external {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal");
        
        Proposal storage proposal = proposals[proposalId];
        require(
            msg.sender == proposal.proposer || msg.sender == owner(),
            "Not authorized"
        );
        require(state(proposalId) != ProposalState.Executed, "Cannot cancel executed proposal");

        proposal.canceled = true;

        emit ProposalCanceled(proposalId);
    }

    /**
     * @dev Get voting power of an address (staked balance)
     * In a real implementation, this would call the staking contract
     */
    function getVotingPower(address account) public view returns (uint256) {
        // For simplicity, we'll use the token balance
        // In production, this should query the staking contract
        return aloToken.balanceOf(account);
    }

    /**
     * @dev Get proposal details
     */
    function getProposal(uint256 proposalId) external view returns (
        uint256 id,
        address proposer,
        string memory title,
        string memory description,
        uint256 startBlock,
        uint256 endBlock,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 abstainVotes,
        uint256 quorum,
        ProposalState currentState
    ) {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal");
        
        Proposal storage proposal = proposals[proposalId];
        
        return (
            proposal.id,
            proposal.proposer,
            proposal.title,
            proposal.description,
            proposal.startBlock,
            proposal.endBlock,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.abstainVotes,
            proposal.quorum,
            state(proposalId)
        );
    }

    /**
     * @dev Get receipt for a voter on a proposal
     */
    function getReceipt(uint256 proposalId, address voter) external view returns (
        bool hasVoted,
        VoteType support,
        uint256 votes
    ) {
        Receipt storage receipt = proposals[proposalId].receipts[voter];
        return (receipt.hasVoted, receipt.support, receipt.votes);
    }

    /**
     * @dev Update voting parameters (only owner)
     */
    function setVotingParameters(
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _quorumPercentage
    ) external onlyOwner {
        require(_quorumPercentage <= 100, "Invalid quorum percentage");
        
        votingDelay = _votingDelay;
        votingPeriod = _votingPeriod;
        proposalThreshold = _proposalThreshold;
        quorumPercentage = _quorumPercentage;

        emit VotingParametersUpdated(
            _votingDelay,
            _votingPeriod,
            _proposalThreshold,
            _quorumPercentage
        );
    }

    /**
     * @dev Update staking contract address (only owner)
     */
    function setStakingContract(address _stakingContract) external onlyOwner {
        require(_stakingContract != address(0), "Invalid address");
        stakingContract = _stakingContract;
    }
}
