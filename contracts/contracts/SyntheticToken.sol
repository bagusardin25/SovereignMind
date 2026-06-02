// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title SyntheticToken
 * @notice Mintable/burnable ERC-20 representing a synthetic asset in the SovereignMind portfolio
 * @dev Deploy one instance per tracked asset (e.g. sBTC, sETH, sSOL). The MINTER_ROLE is
 *      granted to the SyntheticSwapRouter so it can mint on buys and burn on sells.
 *      `underlyingSymbol` stores the CoinGecko-style identifier used by the PriceOracle.
 */
contract SyntheticToken is ERC20, AccessControl {
    // ═══════════════════════════════════════════════════════════
    //                        CONSTANTS
    // ═══════════════════════════════════════════════════════════

    /// @notice Role required to mint and burn tokens
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // ═══════════════════════════════════════════════════════════
    //                        STATE
    // ═══════════════════════════════════════════════════════════

    /// @notice CoinGecko-style symbol of the underlying asset (e.g. "bitcoin")
    string public underlyingSymbol;

    // ═══════════════════════════════════════════════════════════
    //                      CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Deploy a new synthetic token
     * @param name_             ERC-20 name  (e.g. "Synthetic Bitcoin")
     * @param symbol_           ERC-20 ticker (e.g. "sBTC")
     * @param _underlyingSymbol CoinGecko identifier (e.g. "bitcoin")
     */
    constructor(
        string memory name_,
        string memory symbol_,
        string memory _underlyingSymbol
    ) ERC20(name_, symbol_) {
        underlyingSymbol = _underlyingSymbol;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ═══════════════════════════════════════════════════════════
    //                   MINTER FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Mint synthetic tokens to a recipient
     * @param to     Address receiving the minted tokens
     * @param amount Amount to mint (18 decimals)
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    /**
     * @notice Burn synthetic tokens from a holder
     * @param from   Address whose tokens are burned
     * @param amount Amount to burn (18 decimals)
     */
    function burn(address from, uint256 amount) external onlyRole(MINTER_ROLE) {
        _burn(from, amount);
    }
}
