// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/ISomniaAgentRunner.sol";
import "./AgentRegistry.sol";
import "./TreasuryVault.sol";
import "./CFOAgent.sol";
import "./CMOAgent.sol";

/**
 * @title CEOAgent
 * @notice Strategic orchestrator for SovereignMind's autonomous executive suite
 * @dev Uses Somnia's LLM Inference Agent to synthesize CFO + CMO reports into
 *      executive decisions. Manages the full autonomous decision cycle.
 */
contract CEOAgent is IAgentCallback {
    // ═══════════════════════════════════════════════════════════
    //                        ENUMS
    // ═══════════════════════════════════════════════════════════
    enum DecisionAction {
        HOLD,
        REBALANCE,
        ALLOCATE
    }

    enum CyclePhase {
        IDLE,
        GATHERING_DATA,
        ANALYZING,
        EXECUTING
    }

    // ═══════════════════════════════════════════════════════════
    //                       STRUCTS
    // ═══════════════════════════════════════════════════════════
    struct ExecutiveDecision {
        uint256 id;
        DecisionAction action;
        string rationale;
        uint256 confidenceScore; // 0-100
        uint256 timestamp;
        bool executed;
        bytes32 cfoDataHash;
        bytes32 cmoDataHash;
    }

    struct CycleInfo {
        uint256 cycleId;
        CyclePhase phase;
        uint256 startedAt;
        uint256 completedAt;
    }

    // ═══════════════════════════════════════════════════════════
    //                        STATE
    // ═══════════════════════════════════════════════════════════
    AgentRegistry public immutable registry;
    ISomniaAgentRunner public immutable agentRunner;
    TreasuryVault public immutable treasury;
    CFOAgent public immutable cfoAgent;
    CMOAgent public immutable cmoAgent;

    uint256 public llmAgentId;
    address public owner;

    // Decision tracking
    ExecutiveDecision[] public decisions;
    mapping(uint256 => bool) public pendingRequests;
    mapping(uint256 => uint256) public requestTimestamps;
    uint256 public constant REQUEST_TIMEOUT = 30 minutes;
    uint256 public decisionCount;

    // Cycle management
    uint256 public decisionCycleInterval = 10 minutes; // Configurable interval
    uint256 public constant MIN_CYCLE_INTERVAL = 2 minutes; // Prevents spam exploitation
    uint256 public lastCycleTimestamp;
    uint256 public cycleCount;
    CycleInfo public currentCycle;

    // Performance metrics
    uint256 public totalCycleTime;    // Sum of all cycle durations
    uint256 public completedCycles;

    // Current strategic objective (readable on-chain, updated via setObjective)
    string public currentObjective;

    // Execution targets for REBALANCE/ALLOCATE (defaults to owner)
    address public rebalanceTarget;
    address public allocationTarget;

    // Execution size in basis points (100 = 1%) of treasury balance
    uint256 public rebalanceBps = 100;    // 1% of balance
    uint256 public allocationBps = 50;    // 0.5% of balance
    uint256 public constant BPS_DENOMINATOR = 10_000;

    // ═══════════════════════════════════════════════════════════
    //                        EVENTS
    // ═══════════════════════════════════════════════════════════
    event DecisionCycleStarted(uint256 indexed cycleId, uint256 timestamp);
    event DecisionMade(
        uint256 indexed id,
        DecisionAction action,
        string rationale,
        uint256 confidenceScore,
        uint256 timestamp
    );
    event DecisionExecuted(uint256 indexed id, bool success, uint256 timestamp);
    event CycleCompleted(uint256 indexed cycleId, uint256 duration, uint256 timestamp);
    event CycleIntervalUpdated(uint256 oldInterval, uint256 newInterval);
    event ObjectiveSet(string objective, uint256 timestamp);

    // ═══════════════════════════════════════════════════════════
    //                        ERRORS
    // ═══════════════════════════════════════════════════════════
    error OnlyAgentRunner();
    error OnlyOwner();
    error CycleCooldown(uint256 nextAllowed);
    error CycleInProgress();
    error UnknownRequest(uint256 requestId);
    error InsufficientDeposit();
    error InvalidDecisionId();
    error RequestNotTimedOut();
    error InvalidAmount();
    error InvalidBps();
    error IntervalTooShort(uint256 minimum);

    // ═══════════════════════════════════════════════════════════
    //                      MODIFIERS
    // ═══════════════════════════════════════════════════════════
    modifier onlyAgentRunner() {
        if (msg.sender != address(agentRunner)) revert OnlyAgentRunner();
        _;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    // ═══════════════════════════════════════════════════════════
    //                      CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════
    constructor(
        address _registry,
        address _agentRunner,
        address payable _treasury,
        address _cfoAgent,
        address _cmoAgent,
        uint256 _llmAgentId
    ) {
        registry = AgentRegistry(_registry);
        agentRunner = ISomniaAgentRunner(_agentRunner);
        treasury = TreasuryVault(_treasury);
        cfoAgent = CFOAgent(payable(_cfoAgent));
        cmoAgent = CMOAgent(payable(_cmoAgent));
        llmAgentId = _llmAgentId;
        owner = msg.sender;
        // Default to address(0) — REBALANCE/ALLOCATE will only record decisions
        // until explicit targets are set via setRebalanceTarget/setAllocationTarget
        rebalanceTarget = address(0);
        allocationTarget = address(0);
    }

    // ═══════════════════════════════════════════════════════════
    //                  DECISION CYCLE
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Initiate a full autonomous decision cycle
     * @dev Gathers data from CFO and CMO, then synthesizes into an executive decision
     */
    function initiateDecisionCycle() external payable {
        // Enforce cooldown between cycles
        if (block.timestamp < lastCycleTimestamp + decisionCycleInterval) {
            revert CycleCooldown(lastCycleTimestamp + decisionCycleInterval);
        }
        if (currentCycle.phase != CyclePhase.IDLE) {
            revert CycleInProgress();
        }

        cycleCount++;
        lastCycleTimestamp = block.timestamp;

        currentCycle = CycleInfo({
            cycleId: cycleCount,
            phase: CyclePhase.GATHERING_DATA,
            startedAt: block.timestamp,
            completedAt: 0
        });

        emit DecisionCycleStarted(cycleCount, block.timestamp);

        // Gather current data from CFO and CMO
        _makeDecision();
    }

    // ═══════════════════════════════════════════════════════════
    //                 ORCHESTRATION
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Synthesize CFO + CMO data into an executive decision
     */
    function _makeDecision() internal {
        // Read latest data from sub-agents
        uint256 riskScore = cfoAgent.getCurrentRiskScore();
        string memory riskRecommendation = cfoAgent.getLatestRisk().recommendation;

        // Build CMO data summary
        string memory sentimentSummary = _buildSentimentSummary();

        // Build comprehensive prompt
        string memory prompt = string(abi.encodePacked(
            "You are the CEO of SovereignMind, an autonomous on-chain treasury. ",
            "Based on the following reports from your executive team, make a strategic decision.\n\n",
            "CFO RISK REPORT:\n",
            "- Risk Score: ", _uint2str(riskScore), "/100\n",
            "- Recommendation: ", riskRecommendation, "\n",
            "- Treasury Balance: ", _uint2str(treasury.getBalance() / 1 ether), " STT\n\n",
            "CMO MARKET REPORT:\n",
            sentimentSummary, "\n\n",
            "Respond with exactly one word: HOLD, REBALANCE, or ALLOCATE"
        ));

        string memory systemPrompt = "You are an autonomous CEO making treasury decisions. Respond with exactly: HOLD, REBALANCE, or ALLOCATE.";

        string[] memory allowedValues = new string[](3);
        allowedValues[0] = "HOLD";
        allowedValues[1] = "REBALANCE";
        allowedValues[2] = "ALLOCATE";

        bytes memory payload = abi.encodeWithSignature(
            "inferString(string,string,bool,string[])",
            prompt,
            systemPrompt,
            true,
            allowedValues
        );

        // Transition to analyzing phase before LLM inference
        currentCycle.phase = CyclePhase.ANALYZING;

        uint256 requiredDeposit = _calculateDeposit(llmAgentId);
        if (address(this).balance < requiredDeposit) revert InsufficientDeposit();

        uint256 requestId = agentRunner.createRequest{value: requiredDeposit}(
            llmAgentId,
            address(this),
            this.handleResponse.selector,
            payload
        );

        pendingRequests[requestId] = true;
        requestTimestamps[requestId] = block.timestamp;
    }

    // ═══════════════════════════════════════════════════════════
    //                   CALLBACK HANDLER
    // ═══════════════════════════════════════════════════════════

    function handleResponse(
        uint256 requestId,
        Response[] calldata responses,
        ResponseStatus status,
        Request calldata /* details */
    ) external override onlyAgentRunner {
        if (!pendingRequests[requestId]) revert UnknownRequest(requestId);
        delete pendingRequests[requestId];
        delete requestTimestamps[requestId];

        if (status != ResponseStatus.Success || responses.length == 0) {
            // Decision failed — record and reset
            currentCycle.phase = CyclePhase.IDLE;
            currentCycle.completedAt = block.timestamp;
            registry.recordDecision(false);
            return;
        }

        string memory decisionStr = abi.decode(responses[0].result, (string));
        DecisionAction action = _parseAction(decisionStr);

        // Calculate confidence based on data freshness and agreement
        uint256 confidence = _calculateConfidence();

        // Build rationale
        string memory rationale = _buildRationale(action, decisionStr);

        // Store the decision
        uint256 decisionId = decisions.length;
        decisions.push(ExecutiveDecision({
            id: decisionId,
            action: action,
            rationale: rationale,
            confidenceScore: confidence,
            timestamp: block.timestamp,
            executed: false,
            cfoDataHash: keccak256(abi.encodePacked(cfoAgent.getCurrentRiskScore())),
            cmoDataHash: keccak256(abi.encodePacked(cmoAgent.getSignalCount()))
        }));

        decisionCount++;

        emit DecisionMade(decisionId, action, rationale, confidence, block.timestamp);

        // Execute the decision
        _executeDecision(decisionId, action, rationale);

        // Complete the cycle
        currentCycle.phase = CyclePhase.IDLE;
        currentCycle.completedAt = block.timestamp;
        uint256 duration = block.timestamp - currentCycle.startedAt;
        totalCycleTime += duration;
        completedCycles++;

        registry.recordDecision(true);

        emit CycleCompleted(currentCycle.cycleId, duration, block.timestamp);
    }

    // ═══════════════════════════════════════════════════════════
    //                  DECISION EXECUTION
    // ═══════════════════════════════════════════════════════════

    function _executeDecision(
        uint256 decisionId,
        DecisionAction action,
        string memory rationale
    ) internal {
        currentCycle.phase = CyclePhase.EXECUTING;
        bool success = false;

        if (action == DecisionAction.HOLD) {
            treasury.recordDecision("hold", rationale);
            success = true;
        } else if (action == DecisionAction.REBALANCE) {
            // Execute a real rebalance: move `rebalanceBps` of treasury balance
            // to `rebalanceTarget` (defaults to owner). Uses try/catch so a
            // revert still records the intent on-chain.
            uint256 balance = treasury.getBalance();
            uint256 amount = (balance * rebalanceBps) / BPS_DENOMINATOR;
            if (rebalanceTarget == address(0) || amount == 0 || balance < amount) {
                treasury.recordDecision("rebalance", rationale);
                success = true;
            } else {
                try treasury.executeRebalance(address(0), rebalanceTarget, amount, rationale) {
                    success = true;
                } catch {
                    treasury.recordDecision("rebalance", rationale);
                    success = true;
                }
            }
        } else if (action == DecisionAction.ALLOCATE) {
            // Execute a real allocation: send `allocationBps` of treasury balance
            // to `allocationTarget` (defaults to owner).
            uint256 balance = treasury.getBalance();
            uint256 amount = (balance * allocationBps) / BPS_DENOMINATOR;
            if (allocationTarget == address(0) || amount == 0 || balance < amount) {
                treasury.recordDecision("allocate", rationale);
                success = true;
            } else {
                try treasury.executeAllocation(address(0), allocationTarget, amount, rationale) {
                    success = true;
                } catch {
                    treasury.recordDecision("allocate", rationale);
                    success = true;
                }
            }
        }

        decisions[decisionId].executed = success;

        emit DecisionExecuted(decisionId, success, block.timestamp);
    }

    // ═══════════════════════════════════════════════════════════
    //                   ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Update the decision cycle interval
     * @param newInterval New interval in seconds
     */
    function setCycleInterval(uint256 newInterval) external onlyOwner {
        if (newInterval < MIN_CYCLE_INTERVAL) revert IntervalTooShort(MIN_CYCLE_INTERVAL);
        uint256 old = decisionCycleInterval;
        decisionCycleInterval = newInterval;
        emit CycleIntervalUpdated(old, newInterval);
    }

    /**
     * @notice Update LLM agent ID
     */
    function updateAgentId(uint256 _llmAgentId) external onlyOwner {
        llmAgentId = _llmAgentId;
    }

    /**
     * @notice Set a strategic objective (emitted as event and stored for on-chain read)
     * @param objective The strategic objective string
     */
    function setObjective(string calldata objective) external onlyOwner {
        currentObjective = objective;
        emit ObjectiveSet(objective, block.timestamp);
    }

    /**
     * @notice Set the destination address for REBALANCE operations
     * @param target Address to receive rebalanced funds (address(0) disables rebalancing)
     */
    function setRebalanceTarget(address target) external onlyOwner {
        rebalanceTarget = target;
    }

    /**
     * @notice Set the destination address for ALLOCATE operations
     * @param target Address to receive allocated funds (address(0) disables allocating)
     */
    function setAllocationTarget(address target) external onlyOwner {
        allocationTarget = target;
    }

    /**
     * @notice Set the rebalance size in basis points (100 = 1%, max 1000 = 10%)
     * @param bps Basis points (clamped to 1..1000)
     */
    function setRebalanceBps(uint256 bps) external onlyOwner {
        if (bps == 0 || bps > 1000) revert InvalidBps();
        rebalanceBps = bps;
    }

    /**
     * @notice Set the allocation size in basis points (100 = 1%, max 1000 = 10%)
     * @param bps Basis points (clamped to 1..1000)
     */
    function setAllocationBps(uint256 bps) external onlyOwner {
        if (bps == 0 || bps > 1000) revert InvalidBps();
        allocationBps = bps;
    }

    /**
     * @notice Emergency reset of cycle state if stuck
     */
    function resetCycle() external onlyOwner {
        currentCycle.phase = CyclePhase.IDLE;
        currentCycle.completedAt = block.timestamp;
    }

    /**
     * @notice Cancel a stuck request that has timed out
     */
    function cancelStuckRequest(uint256 requestId) external onlyOwner {
        if (!pendingRequests[requestId]) revert UnknownRequest(requestId);
        if (block.timestamp < requestTimestamps[requestId] + REQUEST_TIMEOUT) {
            revert RequestNotTimedOut();
        }
        delete pendingRequests[requestId];
        delete requestTimestamps[requestId];
        currentCycle.phase = CyclePhase.IDLE;
        currentCycle.completedAt = block.timestamp;
        registry.recordDecision(false);
    }

    // ═══════════════════════════════════════════════════════════
    //                    VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    function getDecision(uint256 decisionId) external view returns (ExecutiveDecision memory) {
        if (decisionId >= decisions.length) revert InvalidDecisionId();
        return decisions[decisionId];
    }

    function getRecentDecisions(uint256 count) external view returns (ExecutiveDecision[] memory) {
        uint256 total = decisions.length;
        if (count > total) count = total;

        ExecutiveDecision[] memory recent = new ExecutiveDecision[](count);
        for (uint256 i = 0; i < count; i++) {
            recent[i] = decisions[total - count + i];
        }
        return recent;
    }

    function getDecisionCount() external view returns (uint256) {
        return decisions.length;
    }

    function getCurrentPhase() external view returns (CyclePhase) {
        return currentCycle.phase;
    }

    function getPerformanceMetrics() external view returns (
        uint256 _completedCycles,
        uint256 _totalDecisions,
        uint256 _averageCycleTime,
        uint256 _lastCycleTimestamp
    ) {
        _completedCycles = completedCycles;
        _totalDecisions = decisionCount;
        _averageCycleTime = completedCycles > 0 ? totalCycleTime / completedCycles : 0;
        _lastCycleTimestamp = lastCycleTimestamp;
    }

    function getNextCycleAllowed() external view returns (uint256) {
        return lastCycleTimestamp + decisionCycleInterval;
    }

    // ═══════════════════════════════════════════════════════════
    //                  INTERNAL HELPERS
    // ═══════════════════════════════════════════════════════════

    function _calculateDeposit(uint256 agentId) internal view returns (uint256) {
        uint256 baseDeposit = agentRunner.getRequestDeposit();
        uint256 perAgentCost;
        try agentRunner.getAgentPrice(agentId) returns (uint256 price) {
            perAgentCost = price;
        } catch {
            perAgentCost = 100000000000000000; // 0.10 STT fallback
        }
        return baseDeposit + (perAgentCost * 3); // subcommittee size = 3
    }

    function _buildSentimentSummary() internal view returns (string memory) {
        uint256 signalCount = cmoAgent.getSignalCount();
        if (signalCount == 0) return "No market signals available.";

        (uint256 bullish, uint256 bearish, uint256 neutral, CMOAgent.Sentiment dominant) =
            cmoAgent.getAggregatedSentiment();

        string memory dominantStr;
        if (dominant == CMOAgent.Sentiment.BULLISH) dominantStr = "BULLISH";
        else if (dominant == CMOAgent.Sentiment.BEARISH) dominantStr = "BEARISH";
        else dominantStr = "NEUTRAL";

        return string(abi.encodePacked(
            "- Total Signals: ", _uint2str(signalCount), "\n",
            "- Bullish: ", _uint2str(bullish), "\n",
            "- Bearish: ", _uint2str(bearish), "\n",
            "- Neutral: ", _uint2str(neutral), "\n",
            "- Dominant Sentiment: ", dominantStr
        ));
    }

    function _calculateConfidence() internal view returns (uint256) {
        uint256 confidence = 50; // Base confidence

        // Boost confidence if risk data is fresh (within last hour)
        CFOAgent.RiskAssessment memory risk = cfoAgent.getLatestRisk();
        if (risk.timestamp > 0 && block.timestamp - risk.timestamp < 1 hours) {
            confidence += 15;
        }

        // Boost confidence if sentiment data is fresh
        uint256 signalCount = cmoAgent.getSignalCount();
        if (signalCount > 0) {
            confidence += 10;

            // Extra boost if there's clear sentiment consensus
            (uint256 bullish, uint256 bearish, uint256 neutral, ) = cmoAgent.getAggregatedSentiment();
            uint256 total = bullish + bearish + neutral;
            if (total > 0) {
                uint256 maxSignal = bullish > bearish ? bullish : bearish;
                uint256 consensus = (maxSignal * 100) / total;
                if (consensus > 60) confidence += 15;
            }
        }

        // Cap at 95
        if (confidence > 95) confidence = 95;

        return confidence;
    }

    function _buildRationale(DecisionAction action, string memory rawDecision) internal view returns (string memory) {
        uint256 riskScore = cfoAgent.getCurrentRiskScore();
        if (action == DecisionAction.HOLD) {
            return string(abi.encodePacked(
                "HOLD: ", rawDecision, " | Risk ", _uint2str(riskScore), "/100"
            ));
        } else if (action == DecisionAction.REBALANCE) {
            return string(abi.encodePacked(
                "REBALANCE: ", rawDecision, " | Risk ", _uint2str(riskScore), "/100"
            ));
        } else {
            return string(abi.encodePacked(
                "ALLOCATE: ", rawDecision, " | Risk ", _uint2str(riskScore), "/100"
            ));
        }
    }

    function _parseAction(string memory s) internal pure returns (DecisionAction) {
        bytes32 hash = keccak256(bytes(s));
        if (hash == keccak256("REBALANCE")) return DecisionAction.REBALANCE;
        if (hash == keccak256("ALLOCATE")) return DecisionAction.ALLOCATE;
        return DecisionAction.HOLD;
    }

    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - (_i / 10) * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    // ═══════════════════════════════════════════════════════════
    //                      RECEIVE
    // ═══════════════════════════════════════════════════════════

    /// @notice Accept STT for agent request deposits and rebates
    receive() external payable {}
}
