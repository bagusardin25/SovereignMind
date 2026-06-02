// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./PriceOracle.sol";
import "./SyntheticSwapRouter.sol";
import "./SyntheticToken.sol";

/**
 * @title VaultShares
 * @notice User-facing investment vault for SovereignMind's AI-managed portfolio
 * @dev Users deposit native STT and receive smVAULT shares proportional to the
 *      current portfolio value. An AI orchestrator (PORTFOLIO_MANAGER_ROLE) buys
 *      and sells synthetic assets on behalf of the vault.
 *
 *      Share price = totalPortfolioValue × 1e18 / totalSupply
 *      First deposit: 1 STT = 1 share (1e18)
 *
 *      On withdrawal the vault auto-liquidates synthetic holdings when liquid STT
 *      is insufficient to cover the redemption.
 */
contract VaultShares is ERC20, ReentrancyGuard, Pausable, AccessControl {
    // ═══════════════════════════════════════════════════════════
    //                        CONSTANTS
    // ═══════════════════════════════════════════════════════════

    /// @notice Role granted to the orchestrator wallet that manages the portfolio
    bytes32 public constant PORTFOLIO_MANAGER_ROLE = keccak256("PORTFOLIO_MANAGER_ROLE");

    // ═══════════════════════════════════════════════════════════
    //                        STATE
    // ═══════════════════════════════════════════════════════════

    /// @notice Immutable reference to the price oracle
    PriceOracle public immutable oracle;

    /// @notice Immutable reference to the synthetic swap router
    SyntheticSwapRouter public immutable swapRouter;

    /// @notice Cumulative STT deposited into the vault (lifetime)
    uint256 public totalDeposited;

    /// @notice Cumulative STT withdrawn from the vault (lifetime)
    uint256 public totalWithdrawn;

    /// @notice Total number of deposits
    uint256 public depositCount;

    /// @notice Total number of withdrawals
    uint256 public withdrawCount;

    /// @notice Ordered list of symbols the vault currently holds synthetics for
    string[] public heldSymbols;

    /// @notice Quick look-up to avoid duplicate entries in `heldSymbols`
    mapping(string => bool) public isHeldSymbol;

    // ═══════════════════════════════════════════════════════════
    //                        EVENTS
    // ═══════════════════════════════════════════════════════════

    /// @notice Emitted on a successful user deposit
    event Deposited(
        address indexed user,
        uint256 sttAmount,
        uint256 sharesIssued,
        uint256 sharePrice,
        uint256 timestamp
    );

    /// @notice Emitted on a successful user withdrawal
    event Withdrawn(
        address indexed user,
        uint256 sharesBurned,
        uint256 sttAmount,
        uint256 sharePrice,
        uint256 timestamp
    );

    /// @notice Emitted when the portfolio manager buys a synthetic asset
    event AssetBought(
        string indexed symbol,
        uint256 sttSpent,
        uint256 syntheticReceived,
        uint256 timestamp
    );

    /// @notice Emitted when the portfolio manager sells a synthetic asset
    event AssetSold(
        string indexed symbol,
        uint256 syntheticSold,
        uint256 sttReceived,
        uint256 timestamp
    );

    // ═══════════════════════════════════════════════════════════
    //                        ERRORS
    // ═══════════════════════════════════════════════════════════

    /// @notice User tried to burn more shares than they hold
    error InsufficientShares(uint256 requested, uint256 available);

    /// @notice Vault cannot cover the STT payout even after liquidation
    error InsufficientVaultBalance(uint256 requested, uint256 available);

    /// @notice Zero amount supplied
    error InvalidAmount();

    /// @notice Share calculation yielded zero (dust deposit)
    error ZeroShares();

    // ═══════════════════════════════════════════════════════════
    //                      CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════

    /**
     * @param _oracle     Address of the deployed PriceOracle
     * @param _swapRouter Address of the deployed SyntheticSwapRouter (payable)
     */
    constructor(
        address _oracle,
        address payable _swapRouter
    ) ERC20("SovereignMind Vault Share", "smVAULT") {
        oracle = PriceOracle(_oracle);
        swapRouter = SyntheticSwapRouter(_swapRouter);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ═══════════════════════════════════════════════════════════
    //                    USER FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Deposit native STT into the vault and receive shares
     * @dev First depositor receives 1:1 shares. Subsequent depositors receive
     *      shares proportional to the current portfolio value.
     * @return shares Number of smVAULT shares minted
     */
    function deposit() external payable nonReentrant whenNotPaused returns (uint256 shares) {
        if (msg.value == 0) revert InvalidAmount();

        // NOTE: msg.value is already in address(this).balance at this point,
        // so we subtract it to get the pre-deposit portfolio value.
        uint256 portfolioValue = getTotalPortfolioValue() - msg.value;
        uint256 supply = totalSupply();

        if (supply == 0 || portfolioValue == 0) {
            shares = msg.value; // 1 STT = 1 share
        } else {
            shares = (msg.value * supply) / portfolioValue;
        }
        if (shares == 0) revert ZeroShares();

        totalDeposited += msg.value;
        depositCount++;
        _mint(msg.sender, shares);

        emit Deposited(msg.sender, msg.value, shares, getSharePrice(), block.timestamp);
    }

    /**
     * @notice Burn shares and withdraw the proportional STT value
     * @dev Automatically liquidates synthetic holdings if the vault does not hold
     *      enough liquid STT to cover the redemption.
     * @param shares Number of smVAULT shares to redeem
     * @return sttAmount Amount of STT returned to the caller
     */
    function withdraw(uint256 shares) external nonReentrant whenNotPaused returns (uint256 sttAmount) {
        if (shares == 0) revert InvalidAmount();
        if (balanceOf(msg.sender) < shares) {
            revert InsufficientShares(shares, balanceOf(msg.sender));
        }

        uint256 portfolioValue = getTotalPortfolioValue();
        sttAmount = (shares * portfolioValue) / totalSupply();

        // Auto-liquidate synthetics if not enough liquid STT
        if (address(this).balance < sttAmount) {
            _liquidateForSTT(sttAmount - address(this).balance);
        }
        if (address(this).balance < sttAmount) {
            revert InsufficientVaultBalance(sttAmount, address(this).balance);
        }

        totalWithdrawn += sttAmount;
        withdrawCount++;
        _burn(msg.sender, shares);

        (bool success, ) = msg.sender.call{value: sttAmount}("");
        require(success, "STT transfer failed");

        emit Withdrawn(msg.sender, shares, sttAmount, getSharePrice(), block.timestamp);
    }

    // ═══════════════════════════════════════════════════════════
    //                 PORTFOLIO MANAGEMENT
    // ═══════════════════════════════════════════════════════════
    // Called by the AI orchestrator wallet (PORTFOLIO_MANAGER_ROLE)

    /**
     * @notice Buy a synthetic asset using the vault's STT reserves
     * @param symbol    CoinGecko-style identifier (e.g. "bitcoin")
     * @param sttAmount Amount of STT to spend (18 decimals)
     * @return syntheticAmount Amount of synthetic tokens received
     */
    function buyAsset(string calldata symbol, uint256 sttAmount)
        external
        onlyRole(PORTFOLIO_MANAGER_ROLE)
        nonReentrant
        returns (uint256 syntheticAmount)
    {
        if (address(this).balance < sttAmount) {
            revert InsufficientVaultBalance(sttAmount, address(this).balance);
        }

        syntheticAmount = swapRouter.swapSTTForSynthetic{value: sttAmount}(symbol, sttAmount);

        if (!isHeldSymbol[symbol]) {
            isHeldSymbol[symbol] = true;
            heldSymbols.push(symbol);
        }

        emit AssetBought(symbol, sttAmount, syntheticAmount, block.timestamp);
    }

    /**
     * @notice Sell a synthetic asset back for STT
     * @param symbol          CoinGecko-style identifier
     * @param syntheticAmount Amount of synthetic tokens to sell (18 decimals)
     * @return sttAmount      Amount of STT received
     */
    function sellAsset(string calldata symbol, uint256 syntheticAmount)
        external
        onlyRole(PORTFOLIO_MANAGER_ROLE)
        nonReentrant
        returns (uint256 sttAmount)
    {
        address tokenAddr = swapRouter.getSyntheticTokenAddress(symbol);
        require(tokenAddr != address(0), "Symbol not supported");

        // No approval needed — swapRouter burns directly from msg.sender (this contract)
        sttAmount = swapRouter.swapSyntheticForSTT(symbol, syntheticAmount);

        emit AssetSold(symbol, syntheticAmount, sttAmount, block.timestamp);
    }

    // ═══════════════════════════════════════════════════════════
    //                    VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Current price of one smVAULT share in STT (18 decimals)
     * @dev Returns 1e18 when no shares exist (initial price).
     * @return Share price with 18 decimals
     */
    function getSharePrice() public view returns (uint256) {
        uint256 supply = totalSupply();
        if (supply == 0) return 1e18;
        return (getTotalPortfolioValue() * 1e18) / supply;
    }

    /**
     * @notice Total portfolio value in STT (18 decimals)
     * @dev Liquid STT balance + mark-to-market value of all synthetic holdings.
     * @return Total value in STT
     */
    function getTotalPortfolioValue() public view returns (uint256) {
        return address(this).balance + _getSyntheticHoldingsValue();
    }

    /**
     * @notice Full portfolio allocation breakdown
     * @return symbols_     Array of asset symbols (index 0 = "STT")
     * @return values_      STT value of each position (18 decimals)
     * @return percentages_ Basis-point allocation (10000 = 100%)
     */
    function getPortfolioAllocation()
        external
        view
        returns (
            string[] memory symbols_,
            uint256[] memory values_,
            uint256[] memory percentages_
        )
    {
        uint256 total = getTotalPortfolioValue();
        uint256 len = heldSymbols.length + 1; // +1 for liquid STT

        symbols_ = new string[](len);
        values_ = new uint256[](len);
        percentages_ = new uint256[](len);

        // Index 0 → liquid STT
        symbols_[0] = "STT";
        values_[0] = address(this).balance;

        // Indices 1..N → synthetic holdings
        for (uint256 i = 0; i < heldSymbols.length; i++) {
            symbols_[i + 1] = heldSymbols[i];
            address tokenAddr = swapRouter.getSyntheticTokenAddress(heldSymbols[i]);
            if (tokenAddr != address(0)) {
                uint256 bal = SyntheticToken(tokenAddr).balanceOf(address(this));
                if (bal > 0) {
                    values_[i + 1] = swapRouter.quoteSTTForSynthetic(heldSymbols[i], bal);
                }
            }
        }

        // Compute basis-point percentages
        if (total > 0) {
            for (uint256 i = 0; i < len; i++) {
                percentages_[i] = (values_[i] * 10000) / total;
            }
        }
    }

    /**
     * @notice Get the list of symbols the vault holds synthetic positions for
     * @return Array of symbol strings
     */
    function getHeldSymbols() external view returns (string[] memory) {
        return heldSymbols;
    }

    // ═══════════════════════════════════════════════════════════
    //                  INTERNAL HELPERS
    // ═══════════════════════════════════════════════════════════

    /**
     * @dev Aggregate mark-to-market STT value of all synthetic holdings
     */
    function _getSyntheticHoldingsValue() internal view returns (uint256 totalValue) {
        for (uint256 i = 0; i < heldSymbols.length; i++) {
            address tokenAddr = swapRouter.getSyntheticTokenAddress(heldSymbols[i]);
            if (tokenAddr != address(0)) {
                uint256 bal = SyntheticToken(tokenAddr).balanceOf(address(this));
                if (bal > 0) {
                    totalValue += swapRouter.quoteSTTForSynthetic(heldSymbols[i], bal);
                }
            }
        }
    }

    /**
     * @dev Liquidate synthetic holdings until enough STT is recovered.
     *      Iterates through held symbols and sells proportionally to cover the deficit.
     * @param sttNeeded Amount of additional STT required (18 decimals)
     */
    function _liquidateForSTT(uint256 sttNeeded) internal {
        for (uint256 i = 0; i < heldSymbols.length && sttNeeded > 0; i++) {
            address tokenAddr = swapRouter.getSyntheticTokenAddress(heldSymbols[i]);
            if (tokenAddr == address(0)) continue;

            uint256 bal = SyntheticToken(tokenAddr).balanceOf(address(this));
            if (bal == 0) continue;

            // Determine how much STT the full position is worth
            uint256 sttFromThis = swapRouter.quoteSTTForSynthetic(heldSymbols[i], bal);
            uint256 sellAmount = bal;

            // If the full position exceeds what we need, sell only enough
            if (sttFromThis > sttNeeded) {
                sellAmount = (bal * sttNeeded) / sttFromThis;
                // Add tiny buffer to cover any division/rounding losses
                sellAmount += 2;
                if (sellAmount > bal) sellAmount = bal;
            }

            uint256 received = swapRouter.swapSyntheticForSTT(heldSymbols[i], sellAmount);
            if (received >= sttNeeded) break;
            sttNeeded -= received;
        }
    }

    // ═══════════════════════════════════════════════════════════
    //                    ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    /// @notice Pause all deposits and withdrawals (emergency)
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /// @notice Resume deposits and withdrawals
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // ═══════════════════════════════════════════════════════════
    //                      RECEIVE
    // ═══════════════════════════════════════════════════════════

    /// @notice Accept native STT (from swap router payouts, direct transfers, etc.)
    receive() external payable {}
}
