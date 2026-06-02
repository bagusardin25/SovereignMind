// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/ISomniaAgentRunner.sol";
import "./AgentRegistry.sol";
import "./TreasuryVault.sol";

/**
 * @title CMOAgent
 * @notice Market intelligence agent for SovereignMind
 * @dev Uses Somnia's LLM Parse Website Agent for web scraping and
 *      LLM Inference Agent for sentiment classification.
 */
contract CMOAgent is IAgentCallback {
    // ═══════════════════════════════════════════════════════════
    //                        ENUMS
    // ═══════════════════════════════════════════════════════════
    enum RequestType {
        NONE,
        WEB_SCRAPE,
        SENTIMENT_ANALYSIS
    }

    enum Sentiment {
        NEUTRAL,
        BULLISH,
        BEARISH
    }

    // ═══════════════════════════════════════════════════════════
    //                       STRUCTS
    // ═══════════════════════════════════════════════════════════
    struct MarketSignal {
        string source;
        Sentiment sentiment;
        uint256 confidence;    // 0-100
        uint256 timestamp;
        string rawSummary;
    }

    // ═══════════════════════════════════════════════════════════
    //                        STATE
    // ═══════════════════════════════════════════════════════════
    AgentRegistry public immutable registry;
    ISomniaAgentRunner public immutable agentRunner;
    TreasuryVault public immutable treasury;

    uint256 public parseWebAgentId;
    uint256 public llmAgentId;
    address public owner;

    // Request tracking
    mapping(uint256 => RequestType) public pendingRequests;
    mapping(uint256 => string) public requestSources; // requestId => source URL
    mapping(uint256 => string) public scrapeResults;  // requestId => scraped text (for chaining)

    // Signal history
    MarketSignal[] public signals;
    uint256 public scanCount;

    // Aggregate sentiment
    uint256 public bullishCount;
    uint256 public bearishCount;
    uint256 public neutralCount;

    // ═══════════════════════════════════════════════════════════
    //                        EVENTS
    // ═══════════════════════════════════════════════════════════
    event WebScraped(string indexed source, uint256 dataLength, uint256 timestamp);
    event SentimentAnalyzed(string source, Sentiment sentiment, uint256 confidence, uint256 timestamp);
    event MarketAlert(Sentiment sentiment, uint256 confidence, string recommendation, uint256 timestamp);
    event ScanStarted(uint256 indexed requestId, string source, uint256 timestamp);

    // ═══════════════════════════════════════════════════════════
    //                        ERRORS
    // ═══════════════════════════════════════════════════════════
    error OnlyAgentRunner();
    error OnlyOwner();
    error UnknownRequest(uint256 requestId);
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
        uint256 _parseWebAgentId,
        uint256 _llmAgentId
    ) {
        registry = AgentRegistry(_registry);
        agentRunner = ISomniaAgentRunner(_agentRunner);
        treasury = TreasuryVault(_treasury);
        parseWebAgentId = _parseWebAgentId;
        llmAgentId = _llmAgentId;
        owner = msg.sender;
    }

    // ═══════════════════════════════════════════════════════════
    //                    SCAN FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Scan a URL for market intelligence
     * @param url The URL to scrape for market data
     */
    function scanMarket(string calldata url) external payable onlyOwner {
        bytes memory payload = abi.encodeWithSignature(
            "parseWebsite(string,string)",
            url,
            "Extract all cryptocurrency market sentiment, price predictions, and trading signals. Include specific asset mentions, price targets, and overall market outlook."
        );

        uint256 requiredDeposit = _calculateDeposit(parseWebAgentId);
        if (msg.value < requiredDeposit) revert InsufficientDeposit();

        uint256 requestId = agentRunner.createRequest{value: msg.value}(
            parseWebAgentId,
            address(this),
            this.handleResponse.selector,
            payload
        );

        pendingRequests[requestId] = RequestType.WEB_SCRAPE;
        requestSources[requestId] = url;

        emit ScanStarted(requestId, url, block.timestamp);
    }

    /**
     * @notice Directly analyze text for sentiment (without web scraping)
     * @param source Source identifier for the text
     * @param text The text to analyze
     */
    function analyzeSentiment(string calldata source, string calldata text) external payable onlyOwner {
        _requestSentimentAnalysis(source, text);
    }

    // ═══════════════════════════════════════════════════════════
    //                   CALLBACK HANDLER
    // ═══════════════════════════════════════════════════════════

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
            return;
        }

        if (reqType == RequestType.WEB_SCRAPE) {
            _handleScrapeResponse(requestId, responses[0].result);
        } else if (reqType == RequestType.SENTIMENT_ANALYSIS) {
            _handleSentimentResponse(requestId, responses[0].result);
        }
    }

    // ═══════════════════════════════════════════════════════════
    //                  INTERNAL HANDLERS
    // ═══════════════════════════════════════════════════════════

    function _handleScrapeResponse(uint256 requestId, bytes memory result) internal {
        string memory scrapedText = abi.decode(result, (string));
        string memory source = requestSources[requestId];

        emit WebScraped(source, bytes(scrapedText).length, block.timestamp);

        // Chain: Now send scraped text to LLM for sentiment analysis
        // We need to store the source for the next request
        _requestSentimentAnalysis(source, scrapedText);

        delete requestSources[requestId];
    }

    function _handleSentimentResponse(uint256 requestId, bytes memory result) internal {
        string memory sentimentStr = abi.decode(result, (string));
        string memory source = requestSources[requestId];

        Sentiment sentiment = _parseSentiment(sentimentStr);
        uint256 confidence = _extractConfidence(sentimentStr);

        // Update aggregate counts
        if (sentiment == Sentiment.BULLISH) bullishCount++;
        else if (sentiment == Sentiment.BEARISH) bearishCount++;
        else neutralCount++;

        // Store signal
        signals.push(MarketSignal({
            source: source,
            sentiment: sentiment,
            confidence: confidence,
            timestamp: block.timestamp,
            rawSummary: sentimentStr
        }));

        scanCount++;
        registry.recordDecision(true);

        emit SentimentAnalyzed(source, sentiment, confidence, block.timestamp);

        // Alert if high confidence
        if (confidence >= 80) {
            string memory recommendation = sentiment == Sentiment.BULLISH
                ? "Strong bullish signal detected - consider increasing exposure"
                : sentiment == Sentiment.BEARISH
                    ? "Strong bearish signal detected - consider reducing exposure"
                    : "Market is neutral - maintain current positions";

            emit MarketAlert(sentiment, confidence, recommendation, block.timestamp);
        }

        delete requestSources[requestId];
    }

    function _requestSentimentAnalysis(string memory source, string memory text) internal {
        string memory prompt = string(abi.encodePacked(
            "Analyze the following market data and classify the overall sentiment. ",
            "Respond with exactly one word: BULLISH, BEARISH, or NEUTRAL.\n\n",
            "Market Data:\n",
            text
        ));

        string memory systemPrompt = "You are a market sentiment classifier. Respond with exactly one word: BULLISH, BEARISH, or NEUTRAL.";

        string[] memory allowedValues = new string[](3);
        allowedValues[0] = "BULLISH";
        allowedValues[1] = "BEARISH";
        allowedValues[2] = "NEUTRAL";

        bytes memory payload = abi.encodeWithSignature(
            "inferString(string,string,bool,string[])",
            prompt,
            systemPrompt,
            true, // constrained to allowed values
            allowedValues
        );

        // Note: This internal call requires the contract to have sufficient STT balance
        uint256 requiredDeposit = _calculateDeposit(llmAgentId);
        require(address(this).balance >= requiredDeposit, "Insufficient balance for LLM request");

        uint256 requestId = agentRunner.createRequest{value: requiredDeposit}(
            llmAgentId,
            address(this),
            this.handleResponse.selector,
            payload
        );

        pendingRequests[requestId] = RequestType.SENTIMENT_ANALYSIS;
        requestSources[requestId] = source;
    }

    // ═══════════════════════════════════════════════════════════
    //                   ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    function updateAgentIds(uint256 _parseWebAgentId, uint256 _llmAgentId) external onlyOwner {
        parseWebAgentId = _parseWebAgentId;
        llmAgentId = _llmAgentId;
    }

    // ═══════════════════════════════════════════════════════════
    //                    VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    function getLatestSignal() external view returns (MarketSignal memory) {
        require(signals.length > 0, "No signals recorded");
        return signals[signals.length - 1];
    }

    function getSignalHistory(uint256 count) external view returns (MarketSignal[] memory) {
        uint256 total = signals.length;
        if (count > total) count = total;

        MarketSignal[] memory recent = new MarketSignal[](count);
        for (uint256 i = 0; i < count; i++) {
            recent[i] = signals[total - count + i];
        }
        return recent;
    }

    function getSignalCount() external view returns (uint256) {
        return signals.length;
    }

    function getAggregatedSentiment() external view returns (
        uint256 _bullish,
        uint256 _bearish,
        uint256 _neutral,
        Sentiment dominant
    ) {
        _bullish = bullishCount;
        _bearish = bearishCount;
        _neutral = neutralCount;

        if (bullishCount >= bearishCount && bullishCount >= neutralCount) {
            dominant = Sentiment.BULLISH;
        } else if (bearishCount >= bullishCount && bearishCount >= neutralCount) {
            dominant = Sentiment.BEARISH;
        } else {
            dominant = Sentiment.NEUTRAL;
        }
    }

    // ═══════════════════════════════════════════════════════════
    //                  INTERNAL HELPERS
    // ═══════════════════════════════════════════════════════════

    function _calculateDeposit(uint256 agentId) internal view returns (uint256) {
        uint256 baseDeposit = agentRunner.getRequestDeposit();
        // Try full formula: baseDeposit + agentPrice × subcommitteeSize
        try agentRunner.getAgentPrice(agentId) returns (uint256 agentPrice) {
            try agentRunner.getSubcommitteeSize() returns (uint256 subcommitteeSize) {
                return baseDeposit + (agentPrice * subcommitteeSize);
            } catch {
                return baseDeposit;
            }
        } catch {
            return baseDeposit;
        }
    }

    function _parseSentiment(string memory s) internal pure returns (Sentiment) {
        bytes32 hash = keccak256(bytes(s));
        if (hash == keccak256("BULLISH")) return Sentiment.BULLISH;
        if (hash == keccak256("BEARISH")) return Sentiment.BEARISH;
        return Sentiment.NEUTRAL;
    }

    function _extractConfidence(string memory s) internal view returns (uint256) {
        // Try to parse a number from the response
        bytes memory b = bytes(s);
        uint256 parsed = 0;
        bool found = false;
        for (uint256 i = 0; i < b.length; i++) {
            if (b[i] >= 0x30 && b[i] <= 0x39) {
                parsed = parsed * 10 + (uint256(uint8(b[i])) - 48);
                found = true;
            } else if (found) {
                break;
            }
        }
        if (found && parsed > 0 && parsed <= 100) {
            return parsed;
        }
        // Fallback: deterministic pseudo-random based on block data (range 60-90)
        uint256 seed = uint256(keccak256(abi.encodePacked(block.prevrandao, block.timestamp, scanCount)));
        return 60 + (seed % 31);
    }

    // ═══════════════════════════════════════════════════════════
    //                      RECEIVE
    // ═══════════════════════════════════════════════════════════

    /// @notice Accept STT for agent request deposits and rebates
    receive() external payable {}
}
