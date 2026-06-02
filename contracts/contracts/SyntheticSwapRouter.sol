// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./PriceOracle.sol";
import "./SyntheticToken.sol";

/**
 * @title SyntheticSwapRouter
 * @notice Swap engine for SovereignMind's synthetic portfolio system
 * @dev Converts native STT ↔ synthetic tokens at oracle prices.
 *
 *      Buy  math: syntheticAmount = (sttAmount × sttPriceUSD) / assetPriceUSD
 *      Sell math: sttAmount       = (syntheticAmount × assetPriceUSD) / sttPriceUSD
 *
 *      All amounts are 18-decimal; all prices are 8-decimal. The 8-decimal factors
 *      cancel out in the numerator / denominator so the result stays 18-decimal.
 *
 *      The EXECUTOR_ROLE is granted to VaultShares (and optionally TreasuryVault)
 *      so only authorised contracts can trigger swaps.
 */
contract SyntheticSwapRouter is ReentrancyGuard, AccessControl {
    // ═══════════════════════════════════════════════════════════
    //                        CONSTANTS
    // ═══════════════════════════════════════════════════════════

    /// @notice Role required to execute swaps
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    // ═══════════════════════════════════════════════════════════
    //                        STATE
    // ═══════════════════════════════════════════════════════════

    /// @notice Immutable reference to the price oracle
    PriceOracle public immutable oracle;

    /// @notice symbol → SyntheticToken contract address
    mapping(string => SyntheticToken) public syntheticTokens;

    /// @notice Ordered list of registered synthetic symbols
    string[] public supportedSymbols;

    /// @notice Running count of all swaps performed
    uint256 public totalSwaps;

    // ═══════════════════════════════════════════════════════════
    //                        EVENTS
    // ═══════════════════════════════════════════════════════════

    /// @notice Emitted when STT is swapped for a synthetic token
    event SwapSTTToSynthetic(
        address indexed executor,
        string symbol,
        uint256 sttAmount,
        uint256 syntheticAmount,
        uint256 timestamp
    );

    /// @notice Emitted when a synthetic token is swapped back for STT
    event SwapSyntheticToSTT(
        address indexed executor,
        string symbol,
        uint256 syntheticAmount,
        uint256 sttAmount,
        uint256 timestamp
    );

    /// @notice Emitted when a new synthetic token is registered
    event SyntheticTokenRegistered(string symbol, address tokenAddress);

    // ═══════════════════════════════════════════════════════════
    //                        ERRORS
    // ═══════════════════════════════════════════════════════════

    /// @notice The requested symbol has no registered synthetic token
    error SymbolNotSupported(string symbol);

    /// @notice The router does not hold enough STT to pay out
    error InsufficientSTTReserve(uint256 requested, uint256 available);

    /// @notice Zero or mismatched amounts
    error InvalidAmount();

    /// @notice Oracle returned a zero price
    error ZeroPrice();

    // ═══════════════════════════════════════════════════════════
    //                      CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════

    /**
     * @param _oracle Address of the deployed PriceOracle
     */
    constructor(address _oracle) {
        oracle = PriceOracle(_oracle);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ═══════════════════════════════════════════════════════════
    //                    ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Register a synthetic token for a given symbol
     * @param symbol CoinGecko-style identifier (must match PriceOracle keys)
     * @param token  Address of the deployed SyntheticToken
     */
    function registerSyntheticToken(string calldata symbol, address token) external onlyRole(DEFAULT_ADMIN_ROLE) {
        syntheticTokens[symbol] = SyntheticToken(token);
        supportedSymbols.push(symbol);
        emit SyntheticTokenRegistered(symbol, token);
    }

    // ═══════════════════════════════════════════════════════════
    //                    SWAP FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Swap native STT for a synthetic token
     * @dev Caller sends STT as msg.value. Excess is refunded.
     * @param symbol    CoinGecko-style identifier
     * @param sttAmount Exact amount of STT to spend (18 decimals)
     * @return syntheticAmount Amount of synthetic tokens minted
     */
    function swapSTTForSynthetic(string calldata symbol, uint256 sttAmount)
        external
        payable
        onlyRole(EXECUTOR_ROLE)
        nonReentrant
        returns (uint256 syntheticAmount)
    {
        SyntheticToken token = syntheticTokens[symbol];
        if (address(token) == address(0)) revert SymbolNotSupported(symbol);
        if (sttAmount == 0 || msg.value < sttAmount) revert InvalidAmount();

        syntheticAmount = _quoteSyntheticForSTT(symbol, sttAmount);
        token.mint(msg.sender, syntheticAmount);

        // Refund excess STT
        if (msg.value > sttAmount) {
            (bool refunded, ) = msg.sender.call{value: msg.value - sttAmount}("");
            require(refunded, "Refund failed");
        }

        totalSwaps++;
        emit SwapSTTToSynthetic(msg.sender, symbol, sttAmount, syntheticAmount, block.timestamp);
    }

    /**
     * @notice Swap a synthetic token back for native STT
     * @dev Burns the synthetic tokens from msg.sender and sends STT back.
     *      The caller must hold the synthetic tokens in its own balance.
     * @param symbol          CoinGecko-style identifier
     * @param syntheticAmount Amount of synthetic tokens to sell (18 decimals)
     * @return sttAmount      Amount of STT returned
     */
    function swapSyntheticForSTT(string calldata symbol, uint256 syntheticAmount)
        external
        onlyRole(EXECUTOR_ROLE)
        nonReentrant
        returns (uint256 sttAmount)
    {
        SyntheticToken token = syntheticTokens[symbol];
        if (address(token) == address(0)) revert SymbolNotSupported(symbol);
        if (syntheticAmount == 0) revert InvalidAmount();

        sttAmount = _quoteSTTForSynthetic(symbol, syntheticAmount);
        if (address(this).balance < sttAmount) {
            revert InsufficientSTTReserve(sttAmount, address(this).balance);
        }

        token.burn(msg.sender, syntheticAmount);
        (bool success, ) = msg.sender.call{value: sttAmount}("");
        require(success, "STT transfer failed");

        totalSwaps++;
        emit SwapSyntheticToSTT(msg.sender, symbol, syntheticAmount, sttAmount, block.timestamp);
    }

    // ═══════════════════════════════════════════════════════════
    //                   QUOTE FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Quote how many synthetic tokens you get for a given STT amount
     * @param symbol    CoinGecko-style identifier
     * @param sttAmount STT amount (18 decimals)
     * @return syntheticAmount Synthetic token amount (18 decimals)
     */
    function quoteSyntheticForSTT(string calldata symbol, uint256 sttAmount) external view returns (uint256) {
        return _quoteSyntheticForSTT(symbol, sttAmount);
    }

    /**
     * @notice Quote how much STT you get for a given synthetic token amount
     * @param symbol          CoinGecko-style identifier
     * @param syntheticAmount Synthetic token amount (18 decimals)
     * @return sttAmount      STT amount (18 decimals)
     */
    function quoteSTTForSynthetic(string calldata symbol, uint256 syntheticAmount) external view returns (uint256) {
        return _quoteSTTForSynthetic(symbol, syntheticAmount);
    }

    // ═══════════════════════════════════════════════════════════
    //                    VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Get the full list of supported symbols
     * @return Array of symbol strings
     */
    function getSupportedSymbols() external view returns (string[] memory) {
        return supportedSymbols;
    }

    /**
     * @notice Look up the synthetic token address for a symbol
     * @param symbol CoinGecko-style identifier
     * @return Address of the SyntheticToken contract (or address(0))
     */
    function getSyntheticTokenAddress(string calldata symbol) external view returns (address) {
        return address(syntheticTokens[symbol]);
    }

    // ═══════════════════════════════════════════════════════════
    //                  INTERNAL HELPERS
    // ═══════════════════════════════════════════════════════════

    /**
     * @dev syntheticAmount = (sttAmount × sttPriceUSD) / assetPriceUSD
     *      Both prices are 8-decimal so the result inherits 18-decimal from sttAmount.
     */
    function _quoteSyntheticForSTT(string calldata symbol, uint256 sttAmount) internal view returns (uint256) {
        (uint256 assetPrice, ) = oracle.getPrice(symbol);
        uint256 sttPrice = oracle.sttPriceUSD();
        if (assetPrice == 0) revert ZeroPrice();
        return (sttAmount * sttPrice) / assetPrice;
    }

    /**
     * @dev sttAmount = (syntheticAmount × assetPriceUSD) / sttPriceUSD
     *      Both prices are 8-decimal so the result inherits 18-decimal from syntheticAmount.
     */
    function _quoteSTTForSynthetic(string calldata symbol, uint256 syntheticAmount) internal view returns (uint256) {
        (uint256 assetPrice, ) = oracle.getPrice(symbol);
        uint256 sttPrice = oracle.sttPriceUSD();
        if (sttPrice == 0) revert ZeroPrice();
        return (syntheticAmount * assetPrice) / sttPrice;
    }

    // ═══════════════════════════════════════════════════════════
    //                      RECEIVE
    // ═══════════════════════════════════════════════════════════

    /// @notice Accept STT so the router can pay out on synthetic→STT swaps
    receive() external payable {}
}
