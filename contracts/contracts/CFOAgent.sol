// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/ISomniaAgentRunner.sol";
import "./AgentRegistry.sol";
import "./TreasuryVault.sol";

/**
 * @title CFOAgent
 * @notice Financial analysis agent for SovereignMind
 * @dev Uses Somnia's JSON API Agent for price feeds and LLM Inference Agent for risk analysis.
 *      Implements IAgentCallback to receive async responses from the Agent Runner.
 */
contract CFOAgent is IAgentCallback {
    // ═══════════════════════════════════════════════════════════
    //                        ENUMS
    // ═══════════════════════════════════════════════════════════
    enum RequestType {
        NONE,
        PRICE_FETCH,
        RISK_ANALYSIS
    }

    // ═══════════════════════════════════════════════════════════
    //                       STRUCTS
    // ═══════════════════════════════════════════════════════════
    struct PriceData {
        string symbol;
        uint256 price;        // Price in USD with 8 decimals
        uint256 timestamp;
    }

    struct RiskAssessment {
        uint256 score;        // 0-100 risk score
        string recommendation; // AI-generated recommendation
        uint256 timestamp;
    }

    // ═══════════════════════════════════════════════════════════
    //                        STATE
    // ═══════════════════════════════════════════════════════════
    AgentRegistry public immutable registry;
    ISomniaAgentRunner public immutable agentRunner;
    TreasuryVault public immutable treasury;

    uint256 public jsonApiAgentId;
    uint256 public llmAgentId;
    address public owner;

    // Request tracking
    mapping(uint256 => RequestType) public pendingRequests;
    mapping(uint256 => string) public requestSymbols; // requestId => symbol for price requests

    // Price data
    mapping(string => PriceData) public latestPrices;
    string[] public trackedSymbols;
    mapping(string => bool) public isTrackedSymbol;

    // Risk analysis
    RiskAssessment public latestRisk;
    uint256 public riskThreshold = 70; // Default threshold
    uint256 public analysisCount;

    // ═══════════════════════════════════════════════════════════
    //                        EVENTS
    // ═══════════════════════════════════════════════════════════
    event PriceFetched(string indexed symbol, uint256 price, uint256 timestamp);
    event RiskAnalyzed(uint256 score, string recommendation, uint256 timestamp);
    event RebalanceRecommended(uint256 riskScore, string rationale, uint256 timestamp);
    event AnalysisStarted(uint256 indexed requestId, string symbol, uint256 timestamp);
    event RiskThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);

    // ═══════════════════════════════════════════════════════════
    //                        ERRORS
    // ═══════════════════════════════════════════════════════════
    error OnlyAgentRunner();
    error OnlyOwner();
    error UnknownRequest(uint256 requestId);
    error RequestFailed(uint256 requestId, string reason);
    error InvalidThreshold();
    error InsufficientDeposit();

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
        uint256 _jsonApiAgentId,
        uint256 _llmAgentId
    ) {
        registry = AgentRegistry(_registry);
        agentRunner = ISomniaAgentRunner(_agentRunner);
        treasury = TreasuryVault(_treasury);
        jsonApiAgentId = _jsonApiAgentId;
        llmAgentId = _llmAgentId;
        owner = msg.sender;
    }

    // ═══════════════════════════════════════════════════════════
    //                   ANALYSIS FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Fetch current price for a token symbol via JSON API Agent
     * @param symbol Token symbol (e.g., "bitcoin", "ethereum")
     * @param apiUrl Full CoinGecko API URL for the token
     * @param jsonPath JSON path selector (e.g., "bitcoin.usd")
     */
    function fetchPrice(
        string calldata symbol,
        string calldata apiUrl,
        string calldata jsonPath
    ) external payable {
        // Build payload for JSON API Agent: fetchUint(url, selector, decimals)
        bytes memory payload = abi.encodeWithSignature(
            "fetchUint(string,string,uint8)",
            apiUrl,
            jsonPath,
            uint8(8) // 8 decimal places for price
        );

        uint256 requiredDeposit = _calculateDeposit(jsonApiAgentId);
        if (msg.value < requiredDeposit) revert InsufficientDeposit();

        uint256 requestId = agentRunner.createRequest{value: msg.value}(
            jsonApiAgentId,
            address(this),
            this.handleResponse.selector,
            payload
        );

        pendingRequests[requestId] = RequestType.PRICE_FETCH;
        requestSymbols[requestId] = symbol;

        if (!isTrackedSymbol[symbol]) {
            isTrackedSymbol[symbol] = true;
            trackedSymbols.push(symbol);
        }

        emit AnalysisStarted(requestId, symbol, block.timestamp);
    }

    /**
     * @notice Trigger a comprehensive market analysis with risk scoring
     * @dev Sends all latest price data to LLM for risk assessment
     */
    function analyzeRisk() external payable {
        // Build a prompt with all latest price data
        string memory priceReport = _buildPriceReport();

        string memory prompt = string(abi.encodePacked(
            "You are the CFO of an autonomous on-chain treasury. ",
            "Analyze the following portfolio data and provide a risk score from 0 (lowest risk) to 100 (highest risk). ",
            "Current portfolio data:\n",
            priceReport,
            "\nRespond with ONLY a number between 0 and 100."
        ));

        string memory systemPrompt = "You are a risk analysis AI for a DeFi treasury. Respond only with a single integer 0-100.";

        bytes memory payload = abi.encodeWithSignature(
            "inferString(string,string,bool,string[])",
            prompt,
            systemPrompt,
            false, // no constrained output
            new string[](0)
        );

        uint256 requiredDeposit = _calculateDeposit(llmAgentId);
        if (msg.value < requiredDeposit) revert InsufficientDeposit();

        uint256 requestId = agentRunner.createRequest{value: msg.value}(
            llmAgentId,
            address(this),
            this.handleResponse.selector,
            payload
        );

        pendingRequests[requestId] = RequestType.RISK_ANALYSIS;

        emit AnalysisStarted(requestId, "risk_analysis", block.timestamp);
    }

    // ═══════════════════════════════════════════════════════════
    //                   CALLBACK HANDLER
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Callback from Somnia Agent Runner with response data
     */
    function handleResponse(
        uint256 requestId,
        AgentResponse[] calldata responses,
        ResponseStatus status,
        AgentRequest calldata /* details */
    ) external override onlyAgentRunner {
        RequestType reqType = pendingRequests[requestId];
        if (reqType == RequestType.NONE) revert UnknownRequest(requestId);

        delete pendingRequests[requestId];

        if (status != ResponseStatus.SUCCESS || responses.length == 0) {
            registry.recordDecision(false);
            string memory errMsg = responses.length > 0 ? responses[0].errorMessage : "No response";
            emit RiskAnalyzed(0, string(abi.encodePacked("FAILED: ", errMsg)), block.timestamp);
            return;
        }

        if (reqType == RequestType.PRICE_FETCH) {
            _handlePriceResponse(requestId, responses[0].result);
        } else if (reqType == RequestType.RISK_ANALYSIS) {
            _handleRiskResponse(responses[0].result);
        }

        registry.recordDecision(true);
        analysisCount++;
    }

    // ═══════════════════════════════════════════════════════════
    //                  INTERNAL HANDLERS
    // ═══════════════════════════════════════════════════════════

    function _handlePriceResponse(uint256 requestId, bytes memory result) internal {
        uint256 price = abi.decode(result, (uint256));
        string memory symbol = requestSymbols[requestId];

        latestPrices[symbol] = PriceData({
            symbol: symbol,
            price: price,
            timestamp: block.timestamp
        });

        delete requestSymbols[requestId];

        emit PriceFetched(symbol, price, block.timestamp);
    }

    function _handleRiskResponse(bytes memory result) internal {
        string memory riskStr = abi.decode(result, (string));
        uint256 riskScore = _parseUint(riskStr);

        // Clamp to 0-100
        if (riskScore > 100) riskScore = 100;

        string memory recommendation;
        if (riskScore >= riskThreshold) {
            recommendation = "HIGH RISK - Recommend portfolio rebalancing";
            emit RebalanceRecommended(riskScore, recommendation, block.timestamp);
        } else if (riskScore >= 50) {
            recommendation = "MODERATE RISK - Monitor closely";
        } else {
            recommendation = "LOW RISK - Portfolio is balanced";
        }

        latestRisk = RiskAssessment({
            score: riskScore,
            recommendation: recommendation,
            timestamp: block.timestamp
        });

        emit RiskAnalyzed(riskScore, recommendation, block.timestamp);
    }

    // ═══════════════════════════════════════════════════════════
    //                   ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Update the risk threshold
     * @param newThreshold New threshold (0-100)
     */
    function setRiskThreshold(uint256 newThreshold) external onlyOwner {
        if (newThreshold > 100) revert InvalidThreshold();
        uint256 old = riskThreshold;
        riskThreshold = newThreshold;
        emit RiskThresholdUpdated(old, newThreshold);
    }

    /**
     * @notice Update agent IDs if platform changes them
     */
    function updateAgentIds(uint256 _jsonApiAgentId, uint256 _llmAgentId) external onlyOwner {
        jsonApiAgentId = _jsonApiAgentId;
        llmAgentId = _llmAgentId;
    }

    // ═══════════════════════════════════════════════════════════
    //                    VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    function getLatestPrice(string calldata symbol) external view returns (PriceData memory) {
        return latestPrices[symbol];
    }

    function getLatestRisk() external view returns (RiskAssessment memory) {
        return latestRisk;
    }

    function getCurrentRiskScore() external view returns (uint256) {
        return latestRisk.score;
    }

    function getTrackedSymbols() external view returns (string[] memory) {
        return trackedSymbols;
    }

    function getAnalysisCount() external view returns (uint256) {
        return analysisCount;
    }

    // ═══════════════════════════════════════════════════════════
    //                  INTERNAL HELPERS
    // ═══════════════════════════════════════════════════════════

    function _calculateDeposit(uint256 /* agentId */) internal view returns (uint256) {
        // Real AgentRunner only exposes getRequestDeposit() (0.03 STT on testnet).
        // getAgentPrice() and getSubcommitteeSize() do not exist on the live contract.
        return agentRunner.getRequestDeposit();
    }

    function _buildPriceReport() internal view returns (string memory) {
        if (trackedSymbols.length == 0) return "No price data available.";

        string memory report = "";
        for (uint256 i = 0; i < trackedSymbols.length; i++) {
            PriceData memory pd = latestPrices[trackedSymbols[i]];
            if (pd.timestamp > 0) {
                report = string(abi.encodePacked(
                    report,
                    pd.symbol, ": $", _uint2str(pd.price / 1e8), "\n"
                ));
            }
        }
        return report;
    }

    function _parseUint(string memory s) internal pure returns (uint256) {
        bytes memory b = bytes(s);
        uint256 result = 0;
        bool found = false;
        for (uint256 i = 0; i < b.length; i++) {
            if (b[i] >= 0x30 && b[i] <= 0x39) {
                result = result * 10 + (uint256(uint8(b[i])) - 48);
                found = true;
            } else if (found) {
                break;
            }
        }
        return result;
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
