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

    // Domain whitelist for scanMarket URL inputs
    // @dev Prevents prompt injection via attacker-controlled URLs
    mapping(string => bool) public whitelistedDomains;
    string[] public domainList;
    bool public whitelistEnabled;

    // ═══════════════════════════════════════════════════════════
    //                        EVENTS
    // ═══════════════════════════════════════════════════════════
    event WebScraped(string indexed source, uint256 dataLength, uint256 timestamp);
    event SentimentAnalyzed(string source, Sentiment sentiment, uint256 confidence, uint256 timestamp);
    event MarketAlert(Sentiment sentiment, uint256 confidence, string recommendation, uint256 timestamp);
    event ScanStarted(uint256 indexed requestId, string source, uint256 timestamp);
    event DomainWhitelisted(string domain, uint256 timestamp);
    event DomainRemovedFromWhitelist(string domain, uint256 timestamp);
    event WhitelistToggled(bool enabled, uint256 timestamp);

    // ═══════════════════════════════════════════════════════════
    //                        ERRORS
    // ═══════════════════════════════════════════════════════════
    error OnlyAgentRunner();
    error OnlyOwner();
    error UnknownRequest(uint256 requestId);
    error InsufficientDeposit();
    error DomainNotWhitelisted(string domain);
    error InvalidDomain();
    error InvalidUrl();
    error NoSignals();

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
        // Domain whitelist check (defense-in-depth vs prompt injection)
        if (whitelistEnabled) {
            string memory domain = _extractDomain(url);
            if (bytes(domain).length == 0) revert InvalidUrl();
            if (!whitelistedDomains[domain]) revert DomainNotWhitelisted(domain);
        }

        string[] memory options = new string[](0);
        bytes memory payload = abi.encodeWithSignature(
            "ExtractString(string,string,string[],string,string,bool,uint8,uint8)",
            "market_sentiment",   // key
            "Extract cryptocurrency market sentiment, price predictions, and trading signals from the page", // description
            options,              // options (empty = free-form extraction)
            "Extract all cryptocurrency market sentiment, price predictions, and trading signals. Include specific asset mentions, price targets, and overall market outlook.", // prompt
            url,                  // url
            false,                // resolveUrl
            uint8(1),             // numPages
            uint8(50)             // confidenceThreshold
        );

        uint256 requiredDeposit = _calculateDeposit(parseWebAgentId);
        if (msg.value < requiredDeposit) revert InsufficientDeposit();

        uint256 requestId = agentRunner.createRequest{value: requiredDeposit}(
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
        Response[] calldata responses,
        ResponseStatus status,
        Request calldata /* details */
    ) external override onlyAgentRunner {
        RequestType reqType = pendingRequests[requestId];
        if (reqType == RequestType.NONE) revert UnknownRequest(requestId);

        delete pendingRequests[requestId];

        if (status != ResponseStatus.Success || responses.length == 0) {
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

    /**
     * @notice Add a domain to the URL whitelist
     * @param domain The domain to whitelist (e.g. "coingecko.com", "cointelegraph.com")
     */
    function addWhitelistedDomain(string calldata domain) external onlyOwner {
        if (bytes(domain).length == 0) revert InvalidDomain();
        if (!whitelistedDomains[domain]) {
            whitelistedDomains[domain] = true;
            domainList.push(domain);
        }
        emit DomainWhitelisted(domain, block.timestamp);
    }

    /**
     * @notice Remove a domain from the URL whitelist
     * @param domain The domain to remove
     */
    function removeWhitelistedDomain(string calldata domain) external onlyOwner {
        whitelistedDomains[domain] = false;
        emit DomainRemovedFromWhitelist(domain, block.timestamp);
    }

    /**
     * @notice Toggle the whitelist enforcement on/off
     * @param enabled True to enforce whitelist on scanMarket, false to allow any URL
     */
    function setWhitelistEnabled(bool enabled) external onlyOwner {
        whitelistEnabled = enabled;
        emit WhitelistToggled(enabled, block.timestamp);
    }

    /**
     * @notice Get the list of all whitelisted domains
     */
    function getWhitelistedDomains() external view returns (string[] memory) {
        return domainList;
    }

    /**
     * @notice Get the count of whitelisted domains
     */
    function getWhitelistedDomainCount() external view returns (uint256) {
        return domainList.length;
    }

    // ═══════════════════════════════════════════════════════════
    //                    VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    function getLatestSignal() external view returns (MarketSignal memory) {
        if (signals.length == 0) revert NoSignals();
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

    /**
     * @dev Extract the host portion of a URL. Naive parser — sufficient for
     *      whitelist matching where the operator controls whitelisted entries.
     *      Format: scheme://host[:port]/path → returns host (lowercased)
     *      Examples:
     *        "https://coingecko.com/en/coins/somnia" → "coingecko.com"
     *        "HTTPS://CoinGecko.COM/path" → "coingecko.com"
     *        "coingecko.com" (no scheme) → "coingecko.com"
     */
    function _extractDomain(string memory url) internal pure returns (string memory) {
        bytes memory b = bytes(url);
        if (b.length == 0) return "";

        // Find the start of the host (after "://" if present)
        uint256 hostStart = 0;
        for (uint256 i = 0; i + 2 < b.length; i++) {
            if (b[i] == 0x3A /* : */ && b[i + 1] == 0x2F /* / */ && b[i + 2] == 0x2F /* / */) {
                hostStart = i + 3;
                break;
            }
        }

        // Find the end of the host (next '/' or ':' or end of string)
        uint256 hostEnd = b.length;
        for (uint256 i = hostStart; i < b.length; i++) {
            if (b[i] == 0x2F /* / */ || b[i] == 0x3A /* : */) {
                hostEnd = i;
                break;
            }
        }

        if (hostEnd <= hostStart) return "";

        // Extract and lowercase the host
        bytes memory host = new bytes(hostEnd - hostStart);
        for (uint256 i = 0; i < host.length; i++) {
            bytes1 c = b[hostStart + i];
            // ASCII A-Z → a-z
            if (c >= 0x41 && c <= 0x5A) {
                host[i] = bytes1(uint8(c) + 32);
            } else {
                host[i] = c;
            }
        }
        return string(host);
    }

    function _calculateDeposit(uint256 agentId) internal view returns (uint256) {
        uint256 baseDeposit;
        uint256 perAgentCost;

        // Try to get base deposit from AgentRunner
        try agentRunner.getRequestDeposit() returns (uint256 deposit) {
            baseDeposit = deposit;
        } catch {
            baseDeposit = 30000000000000000; // 0.03 STT fallback for reserve
        }

        // Try to get per-agent cost from AgentRunner
        try agentRunner.getAgentPrice(agentId) returns (uint256 price) {
            perAgentCost = price;
        } catch {
            perAgentCost = 100000000000000000; // 0.10 STT fallback per agent
        }

        return baseDeposit + (perAgentCost * 3); // subcommittee size = 3
    }

    function _parseSentiment(string memory s) internal pure returns (Sentiment) {
        bytes32 hash = keccak256(bytes(s));
        if (hash == keccak256("BULLISH")) return Sentiment.BULLISH;
        if (hash == keccak256("BEARISH")) return Sentiment.BEARISH;
        return Sentiment.NEUTRAL;
    }

    function _extractConfidence(string memory s) internal pure returns (uint256) {
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
        // Fallback: fixed default confidence when LLM doesn't return a number
        return 70;
    }

    // ═══════════════════════════════════════════════════════════
    //                      RECEIVE
    // ═══════════════════════════════════════════════════════════

    /// @notice Accept STT for agent request deposits and rebates
    receive() external payable {}
}
