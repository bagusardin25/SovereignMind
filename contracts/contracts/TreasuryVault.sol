// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./AgentRegistry.sol";

/**
 * @title TreasuryVault
 * @notice Secure asset management vault for SovereignMind's autonomous treasury
 * @dev Supports native STT and ERC20 token management with role-based access
 *      through AgentRegistry. Protected by ReentrancyGuard and Pausable.
 */
contract TreasuryVault is ReentrancyGuard, Pausable, AccessControl {
    using SafeERC20 for IERC20;

    // ═══════════════════════════════════════════════════════════
    //                        ENUMS
    // ═══════════════════════════════════════════════════════════
    enum DecisionOutcome {
        PENDING,
        EXECUTED,
        REJECTED,
        FAILED
    }

    // ═══════════════════════════════════════════════════════════
    //                       STRUCTS
    // ═══════════════════════════════════════════════════════════
    struct Decision {
        uint256 id;
        address initiator;
        string action;       // "rebalance", "allocate", "hold"
        string rationale;
        uint256 timestamp;
        uint256 value;
        DecisionOutcome outcome;
    }

    struct TokenInfo {
        bool isTracked;
        uint256 totalDeposited;
        uint256 totalWithdrawn;
    }

    // ═══════════════════════════════════════════════════════════
    //                        STATE
    // ═══════════════════════════════════════════════════════════
    AgentRegistry public immutable registry;

    Decision[] public decisions;
    uint256 public totalOperations;
    uint256 public totalNativeDeposited;

    // ERC20 tracking
    mapping(address => TokenInfo) public tokenInfos;
    address[] public trackedTokens;

    // Emergency withdraw timelock
    struct EmergencyRequest {
        address to;
        uint256 requestedAt;
        bool active;
    }
    EmergencyRequest public pendingEmergency;
    uint256 public constant EMERGENCY_DELAY = 1 hours;

    // ═══════════════════════════════════════════════════════════
    //                        EVENTS
    // ═══════════════════════════════════════════════════════════
    event NativeDeposited(address indexed sender, uint256 amount, uint256 timestamp);
    event TokenDeposited(address indexed sender, address indexed token, uint256 amount, uint256 timestamp);
    event Rebalanced(
        address indexed fromToken,
        address indexed toToken,
        uint256 amount,
        address indexed initiator,
        string rationale
    );
    event Allocated(
        address indexed token,
        address indexed recipient,
        uint256 amount,
        address indexed initiator,
        string rationale
    );
    event DecisionRecorded(
        uint256 indexed id,
        address indexed initiator,
        string action,
        DecisionOutcome outcome,
        uint256 timestamp
    );
    event EmergencyWithdraw(address indexed to, uint256 amount, uint256 timestamp);
    event EmergencyRequested(address indexed to, uint256 timestamp);
    event EmergencyCancelled(uint256 timestamp);

    // ═══════════════════════════════════════════════════════════
    //                        ERRORS
    // ═══════════════════════════════════════════════════════════
    error InsufficientBalance(uint256 requested, uint256 available);
    error InvalidAmount();
    error InvalidAddress();
    error NotTreasuryManager();
    error TransferFailed();
    error NoActiveEmergency();
    error TimelockNotElapsed();

    // ═══════════════════════════════════════════════════════════
    //                      MODIFIERS
    // ═══════════════════════════════════════════════════════════
    modifier onlyTreasuryManager() {
        if (!registry.hasRole(registry.TREASURY_MANAGER_ROLE(), msg.sender) &&
            !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert NotTreasuryManager();
        }
        _;
    }

    // ═══════════════════════════════════════════════════════════
    //                      CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════
    constructor(address _registry) {
        if (_registry == address(0)) revert InvalidAddress();
        registry = AgentRegistry(_registry);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ═══════════════════════════════════════════════════════════
    //                   DEPOSIT FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Deposit native STT tokens into the treasury
     */
    function deposit() external payable whenNotPaused {
        if (msg.value == 0) revert InvalidAmount();
        totalNativeDeposited += msg.value;
        emit NativeDeposited(msg.sender, msg.value, block.timestamp);
    }

    /**
     * @notice Deposit ERC20 tokens into the treasury
     * @param token The ERC20 token address
     * @param amount The amount to deposit
     */
    function depositToken(address token, uint256 amount) external whenNotPaused {
        if (token == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        if (!tokenInfos[token].isTracked) {
            tokenInfos[token].isTracked = true;
            trackedTokens.push(token);
        }
        tokenInfos[token].totalDeposited += amount;

        emit TokenDeposited(msg.sender, token, amount, block.timestamp);
    }

    // ═══════════════════════════════════════════════════════════
    //                 TREASURY OPERATIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Execute a rebalance operation (swap tokens)
     * @dev In a real implementation, this would integrate with a DEX.
     *      For now, it records the decision and emits events.
     * @param fromToken Source token (address(0) for native STT)
     * @param toToken Destination token (address(0) for native STT)
     * @param amount Amount to rebalance
     * @param rationale AI-generated rationale for the rebalance
     */
    function executeRebalance(
        address fromToken,
        address toToken,
        uint256 amount,
        string calldata rationale
    ) external onlyTreasuryManager nonReentrant whenNotPaused {
        if (amount == 0) revert InvalidAmount();

        // Verify sufficient balance
        if (fromToken == address(0)) {
            if (address(this).balance < amount) {
                revert InsufficientBalance(amount, address(this).balance);
            }
        } else {
            uint256 tokenBalance = IERC20(fromToken).balanceOf(address(this));
            if (tokenBalance < amount) {
                revert InsufficientBalance(amount, tokenBalance);
            }
        }

        // Execute actual token movement
        if (fromToken == address(0) && toToken != address(0)) {
            // Native STT → send to toToken address
            (bool sent, ) = toToken.call{value: amount}("");
            if (!sent) revert TransferFailed();
        } else if (fromToken != address(0) && toToken == address(0)) {
            // ERC20 → transfer out
            IERC20(fromToken).safeTransfer(msg.sender, amount);
            tokenInfos[fromToken].totalWithdrawn += amount;
        } else if (fromToken != address(0) && toToken != address(0)) {
            // ERC20 → ERC20: transfer fromToken out
            IERC20(fromToken).safeTransfer(msg.sender, amount);
            tokenInfos[fromToken].totalWithdrawn += amount;
        }
        // If both are address(0), it's a recorded hold

        // Record the decision
        uint256 decisionId = decisions.length;
        decisions.push(Decision({
            id: decisionId,
            initiator: msg.sender,
            action: "rebalance",
            rationale: rationale,
            timestamp: block.timestamp,
            value: amount,
            outcome: DecisionOutcome.EXECUTED
        }));

        totalOperations++;

        emit Rebalanced(fromToken, toToken, amount, msg.sender, rationale);
        emit DecisionRecorded(decisionId, msg.sender, "rebalance", DecisionOutcome.EXECUTED, block.timestamp);
    }

    /**
     * @notice Execute an allocation (send tokens to a recipient)
     * @param token Token to allocate (address(0) for native STT)
     * @param recipient Recipient address
     * @param amount Amount to allocate
     * @param rationale AI-generated rationale
     */
    function executeAllocation(
        address token,
        address recipient,
        uint256 amount,
        string calldata rationale
    ) external onlyTreasuryManager nonReentrant whenNotPaused {
        if (recipient == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        if (token == address(0)) {
            // Native STT transfer
            if (address(this).balance < amount) {
                revert InsufficientBalance(amount, address(this).balance);
            }
            (bool success, ) = recipient.call{value: amount}("");
            if (!success) revert TransferFailed();
        } else {
            // ERC20 transfer
            uint256 tokenBalance = IERC20(token).balanceOf(address(this));
            if (tokenBalance < amount) {
                revert InsufficientBalance(amount, tokenBalance);
            }
            IERC20(token).safeTransfer(recipient, amount);
            tokenInfos[token].totalWithdrawn += amount;
        }

        // Record the decision
        uint256 decisionId = decisions.length;
        decisions.push(Decision({
            id: decisionId,
            initiator: msg.sender,
            action: "allocate",
            rationale: rationale,
            timestamp: block.timestamp,
            value: amount,
            outcome: DecisionOutcome.EXECUTED
        }));

        totalOperations++;

        emit Allocated(token, recipient, amount, msg.sender, rationale);
        emit DecisionRecorded(decisionId, msg.sender, "allocate", DecisionOutcome.EXECUTED, block.timestamp);
    }

    /**
     * @notice Record a hold/no-action decision
     * @param rationale Why the agent decided to hold
     */
    function recordHoldDecision(string calldata rationale) external {
        _recordDecision("hold", rationale, 0);
    }

    /**
     * @notice Record any agent decision with the correct action type
     * @param action Action type ("hold", "rebalance", "allocate")
     * @param rationale AI-generated rationale
     */
    function recordDecision(string calldata action, string calldata rationale) external {
        _recordDecision(action, rationale, 0);
    }

    function _recordDecision(string memory action, string memory rationale, uint256 value) internal {
        require(registry.isActiveAgent(msg.sender), "Not an active agent");

        uint256 decisionId = decisions.length;
        decisions.push(Decision({
            id: decisionId,
            initiator: msg.sender,
            action: action,
            rationale: rationale,
            timestamp: block.timestamp,
            value: value,
            outcome: DecisionOutcome.EXECUTED
        }));

        totalOperations++;

        emit DecisionRecorded(decisionId, msg.sender, action, DecisionOutcome.EXECUTED, block.timestamp);
    }

    // ═══════════════════════════════════════════════════════════
    //                   ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Request emergency withdrawal (starts timelock)
     * @param to Recipient address
     */
    function requestEmergencyWithdraw(address to) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (to == address(0)) revert InvalidAddress();
        pendingEmergency = EmergencyRequest({
            to: to,
            requestedAt: block.timestamp,
            active: true
        });
        emit EmergencyRequested(to, block.timestamp);
    }

    /**
     * @notice Cancel a pending emergency withdrawal
     */
    function cancelEmergencyWithdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        pendingEmergency.active = false;
        emit EmergencyCancelled(block.timestamp);
    }

    /**
     * @notice Execute emergency withdrawal after timelock delay
     */
    function emergencyWithdraw() external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        if (!pendingEmergency.active) revert NoActiveEmergency();
        if (block.timestamp < pendingEmergency.requestedAt + EMERGENCY_DELAY) {
            revert TimelockNotElapsed();
        }
        address to = pendingEmergency.to;
        pendingEmergency.active = false;

        uint256 balance = address(this).balance;
        (bool success, ) = to.call{value: balance}("");
        if (!success) revert TransferFailed();
        emit EmergencyWithdraw(to, balance, block.timestamp);
    }

    // ═══════════════════════════════════════════════════════════
    //                    VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Get the native STT balance of the treasury
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Get the ERC20 token balance
     */
    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /**
     * @notice Get total number of decisions
     */
    function getDecisionCount() external view returns (uint256) {
        return decisions.length;
    }

    /**
     * @notice Get a specific decision by ID
     */
    function getDecision(uint256 id) external view returns (Decision memory) {
        require(id < decisions.length, "Invalid decision ID");
        return decisions[id];
    }

    /**
     * @notice Get the most recent decisions
     * @param count Number of recent decisions to return
     */
    function getRecentDecisions(uint256 count) external view returns (Decision[] memory) {
        uint256 total = decisions.length;
        if (count > total) count = total;

        Decision[] memory recent = new Decision[](count);
        for (uint256 i = 0; i < count; i++) {
            recent[i] = decisions[total - count + i];
        }
        return recent;
    }

    /**
     * @notice Get all tracked token addresses
     */
    function getTrackedTokens() external view returns (address[] memory) {
        return trackedTokens;
    }

    /**
     * @notice Get the number of tracked tokens
     */
    function getTrackedTokenCount() external view returns (uint256) {
        return trackedTokens.length;
    }

    // ═══════════════════════════════════════════════════════════
    //                      RECEIVE
    // ═══════════════════════════════════════════════════════════

    /// @notice Accept native STT deposits directly
    receive() external payable {
        totalNativeDeposited += msg.value;
        emit NativeDeposited(msg.sender, msg.value, block.timestamp);
    }
}
