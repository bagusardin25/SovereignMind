// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title PriceOracle
 * @notice On-chain price oracle for SovereignMind's synthetic portfolio system
 * @dev Stores USD prices with 8 decimals. The CFO agent pushes prices here after
 *      fetching them from CoinGecko via the Somnia Agent Runner. Supports a
 *      configurable STT price (defaults to $1.00).
 */
contract PriceOracle is AccessControl {
    // ═══════════════════════════════════════════════════════════
    //                        CONSTANTS
    // ═══════════════════════════════════════════════════════════

    /// @notice Role required to push price updates
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");

    // ═══════════════════════════════════════════════════════════
    //                       STRUCTS
    // ═══════════════════════════════════════════════════════════

    /// @notice On-chain representation of a token's USD price
    struct Price {
        uint256 price;      // USD price with 8 decimals (e.g. 1e8 = $1.00)
        uint256 updatedAt;  // Block timestamp of last update
    }

    // ═══════════════════════════════════════════════════════════
    //                        STATE
    // ═══════════════════════════════════════════════════════════

    /// @notice symbol → latest price data
    mapping(string => Price) public prices;

    /// @notice Ordered list of all tracked symbols
    string[] public symbols;

    /// @notice Quick look-up to avoid duplicate pushes into `symbols`
    mapping(string => bool) public isTracked;

    /// @notice STT/USD price with 8 decimals (default: 1 STT = $1.00)
    uint256 public sttPriceUSD = 1e8;

    // ═══════════════════════════════════════════════════════════
    //                        EVENTS
    // ═══════════════════════════════════════════════════════════

    /// @notice Emitted every time a token price is updated
    event PriceUpdated(string indexed symbol, uint256 price, uint256 timestamp);

    /// @notice Emitted when the admin adjusts the STT peg price
    event STTPriceUpdated(uint256 oldPrice, uint256 newPrice);

    // ═══════════════════════════════════════════════════════════
    //                        ERRORS
    // ═══════════════════════════════════════════════════════════

    /// @notice Thrown when querying a symbol that has never been updated
    error PriceNotAvailable(string symbol);

    // ═══════════════════════════════════════════════════════════
    //                      CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ═══════════════════════════════════════════════════════════
    //                   UPDATER FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Push a new price for the given symbol
     * @param symbol CoinGecko-style identifier (e.g. "bitcoin", "ethereum")
     * @param price  USD price with 8 decimals
     */
    function updatePrice(string calldata symbol, uint256 price) external onlyRole(UPDATER_ROLE) {
        if (!isTracked[symbol]) {
            isTracked[symbol] = true;
            symbols.push(symbol);
        }
        prices[symbol] = Price({ price: price, updatedAt: block.timestamp });
        emit PriceUpdated(symbol, price, block.timestamp);
    }

    // ═══════════════════════════════════════════════════════════
    //                    ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Adjust the STT/USD peg price
     * @param newPrice New STT price in USD with 8 decimals
     */
    function setSTTPrice(uint256 newPrice) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 old = sttPriceUSD;
        sttPriceUSD = newPrice;
        emit STTPriceUpdated(old, newPrice);
    }

    // ═══════════════════════════════════════════════════════════
    //                    VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Get the latest price for a symbol
     * @param symbol Token identifier
     * @return price     USD price with 8 decimals
     * @return updatedAt Timestamp of last update
     */
    function getPrice(string calldata symbol) external view returns (uint256 price, uint256 updatedAt) {
        Price memory p = prices[symbol];
        if (p.updatedAt == 0) revert PriceNotAvailable(symbol);
        return (p.price, p.updatedAt);
    }

    /**
     * @notice Get the current STT/USD price
     * @return STT price in USD with 8 decimals
     */
    function getSTTPrice() external view returns (uint256) {
        return sttPriceUSD;
    }

    /**
     * @notice Get the full list of tracked symbols
     * @return Array of symbol strings
     */
    function getSymbols() external view returns (string[] memory) {
        return symbols;
    }

    /**
     * @notice Get the number of tracked symbols
     * @return Count of tracked symbols
     */
    function getSymbolCount() external view returns (uint256) {
        return symbols.length;
    }
}
