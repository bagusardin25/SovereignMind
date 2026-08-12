// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IFlareFtsoPriceAdapter {
    function oracle() external view returns (address);

    function requiredFee() external view returns (uint256);

    function syncXrpUsd()
        external
        payable
        returns (uint256 priceE8, uint64 feedTimestamp);
}

interface ISovereignPriceOracle {
    function getPriceFresh(
        string calldata symbol
    ) external view returns (uint256 price, uint256 updatedAt);
}

/**
 * @title FXRPTreasuryGuard
 * @notice Creates policy-gated FXRP exposure assessments from a live Flare
 *         FTSOv2 price and the caller's real FXRP balance.
 * @dev This contract never takes custody of or transfers FXRP. The model-facing
 *      signal remains a proposal until the assessed wallet explicitly approves
 *      or rejects it. Approval fails closed when the price, balance, or policy
 *      changed after assessment.
 */
contract FXRPTreasuryGuard is ReentrancyGuard {
    string public constant ORACLE_SYMBOL = "xrp";

    enum Signal {
        HOLD,
        REDUCE
    }

    enum AssessmentStatus {
        PENDING,
        APPROVED,
        REJECTED
    }

    struct Assessment {
        uint256 id;
        address owner;
        uint256 fxrpBalance;
        uint256 priceE8;
        uint256 exposureUsdE8;
        uint256 limitUsdE8;
        uint256 policyNonce;
        uint64 feedTimestamp;
        uint64 oracleUpdatedAt;
        Signal signal;
        AssessmentStatus status;
    }

    ISovereignPriceOracle public immutable oracle;
    IFlareFtsoPriceAdapter public immutable adapter;
    IERC20Metadata public immutable fxrp;
    uint8 public immutable fxrpDecimals;

    uint256 public nextAssessmentId = 1;
    mapping(uint256 => Assessment) private assessments;
    mapping(address => uint256) public latestAssessmentId;
    mapping(address => uint256) public exposureLimitUsdE8;
    mapping(address => uint256) public policyNonce;

    error InvalidAddress();
    error AdapterOracleMismatch(address expected, address actual);
    error UnsupportedTokenDecimals(uint8 decimals);
    error InvalidExposureLimit();
    error NoFxrpBalance();
    error IncorrectFee(uint256 expected, uint256 received);
    error OracleSyncMismatch(uint256 adapterPriceE8, uint256 oraclePriceE8);
    error AssessmentNotFound(uint256 assessmentId);
    error NotAssessmentOwner(uint256 assessmentId, address caller);
    error AssessmentNotPending(uint256 assessmentId);
    error AssessmentSuperseded(uint256 assessmentId);
    error FxrpBalanceChanged(
        uint256 assessmentId,
        uint256 expected,
        uint256 current
    );

    event ExposurePolicyConfigured(
        address indexed owner,
        uint256 limitUsdE8,
        uint256 indexed policyNonce
    );
    event AssessmentCreated(
        uint256 indexed assessmentId,
        address indexed owner,
        Signal signal,
        uint256 fxrpBalance,
        uint256 priceE8,
        uint256 exposureUsdE8,
        uint256 limitUsdE8,
        uint64 feedTimestamp,
        uint64 oracleUpdatedAt
    );
    event AssessmentApproved(
        uint256 indexed assessmentId,
        address indexed owner,
        Signal signal,
        uint256 exposureUsdE8
    );
    event AssessmentRejected(
        uint256 indexed assessmentId,
        address indexed owner
    );

    constructor(
        address oracleAddress,
        address adapterAddress,
        address fxrpAddress
    ) {
        if (
            oracleAddress == address(0) ||
            adapterAddress == address(0) ||
            fxrpAddress == address(0)
        ) {
            revert InvalidAddress();
        }

        IFlareFtsoPriceAdapter adapter_ = IFlareFtsoPriceAdapter(
            adapterAddress
        );
        address adapterOracle = adapter_.oracle();
        if (adapterOracle != oracleAddress) {
            revert AdapterOracleMismatch(oracleAddress, adapterOracle);
        }

        uint8 decimals = IERC20Metadata(fxrpAddress).decimals();
        if (decimals > 18) revert UnsupportedTokenDecimals(decimals);

        oracle = ISovereignPriceOracle(oracleAddress);
        adapter = adapter_;
        fxrp = IERC20Metadata(fxrpAddress);
        fxrpDecimals = decimals;
    }

    /**
     * @notice Refresh the XRP/USD price and create a policy assessment in one
     *         wallet transaction.
     * @param limitUsdE8 Maximum accepted FXRP exposure in USD with 8 decimals.
     */
    function refreshAndAssess(
        uint256 limitUsdE8
    ) external payable nonReentrant returns (uint256 assessmentId) {
        if (limitUsdE8 == 0) revert InvalidExposureLimit();

        uint256 balance = fxrp.balanceOf(msg.sender);
        if (balance == 0) revert NoFxrpBalance();

        uint256 fee = adapter.requiredFee();
        if (msg.value != fee) revert IncorrectFee(fee, msg.value);

        (uint256 adapterPriceE8, uint64 feedTimestamp) = adapter
            .syncXrpUsd{value: fee}();
        (uint256 priceE8, uint256 oracleUpdatedAt) = oracle.getPriceFresh(
            ORACLE_SYMBOL
        );
        if (priceE8 != adapterPriceE8) {
            revert OracleSyncMismatch(adapterPriceE8, priceE8);
        }

        uint256 exposureUsdE8 = Math.mulDiv(
            balance,
            priceE8,
            10 ** uint256(fxrpDecimals)
        );
        Signal signal = exposureUsdE8 > limitUsdE8
            ? Signal.REDUCE
            : Signal.HOLD;

        uint256 nextPolicyNonce = policyNonce[msg.sender] + 1;
        policyNonce[msg.sender] = nextPolicyNonce;
        exposureLimitUsdE8[msg.sender] = limitUsdE8;

        assessmentId = nextAssessmentId++;
        latestAssessmentId[msg.sender] = assessmentId;
        assessments[assessmentId] = Assessment({
            id: assessmentId,
            owner: msg.sender,
            fxrpBalance: balance,
            priceE8: priceE8,
            exposureUsdE8: exposureUsdE8,
            limitUsdE8: limitUsdE8,
            policyNonce: nextPolicyNonce,
            feedTimestamp: feedTimestamp,
            oracleUpdatedAt: uint64(oracleUpdatedAt),
            signal: signal,
            status: AssessmentStatus.PENDING
        });

        emit ExposurePolicyConfigured(
            msg.sender,
            limitUsdE8,
            nextPolicyNonce
        );
        emit AssessmentCreated(
            assessmentId,
            msg.sender,
            signal,
            balance,
            priceE8,
            exposureUsdE8,
            limitUsdE8,
            feedTimestamp,
            uint64(oracleUpdatedAt)
        );
    }

    /**
     * @notice Approve the latest unchanged assessment. This records human
     *         authority but deliberately performs no asset transfer.
     */
    function approveAssessment(uint256 assessmentId) external {
        Assessment storage assessment = _pendingOwnedAssessment(assessmentId);
        if (
            latestAssessmentId[msg.sender] != assessmentId ||
            policyNonce[msg.sender] != assessment.policyNonce
        ) {
            revert AssessmentSuperseded(assessmentId);
        }

        (uint256 currentPriceE8, uint256 currentUpdatedAt) = oracle
            .getPriceFresh(ORACLE_SYMBOL);
        if (
            currentPriceE8 != assessment.priceE8 ||
            currentUpdatedAt != assessment.oracleUpdatedAt
        ) {
            revert AssessmentSuperseded(assessmentId);
        }

        uint256 currentBalance = fxrp.balanceOf(msg.sender);
        if (currentBalance != assessment.fxrpBalance) {
            revert FxrpBalanceChanged(
                assessmentId,
                assessment.fxrpBalance,
                currentBalance
            );
        }

        assessment.status = AssessmentStatus.APPROVED;
        emit AssessmentApproved(
            assessmentId,
            msg.sender,
            assessment.signal,
            assessment.exposureUsdE8
        );
    }

    function rejectAssessment(uint256 assessmentId) external {
        Assessment storage assessment = _pendingOwnedAssessment(assessmentId);
        assessment.status = AssessmentStatus.REJECTED;
        emit AssessmentRejected(assessmentId, msg.sender);
    }

    function getAssessment(
        uint256 assessmentId
    ) external view returns (Assessment memory) {
        Assessment memory assessment = assessments[assessmentId];
        if (assessment.owner == address(0)) {
            revert AssessmentNotFound(assessmentId);
        }
        return assessment;
    }

    function getLatestAssessment(
        address owner
    )
        external
        view
        returns (
            uint256 id,
            uint256 fxrpBalance,
            uint256 priceE8,
            uint256 exposureUsdE8,
            uint256 limitUsdE8,
            uint64 feedTimestamp,
            uint64 oracleUpdatedAt,
            Signal signal,
            AssessmentStatus status
        )
    {
        Assessment memory assessment = assessments[latestAssessmentId[owner]];
        return (
            assessment.id,
            assessment.fxrpBalance,
            assessment.priceE8,
            assessment.exposureUsdE8,
            assessment.limitUsdE8,
            assessment.feedTimestamp,
            assessment.oracleUpdatedAt,
            assessment.signal,
            assessment.status
        );
    }

    function requiredFee() external view returns (uint256) {
        return adapter.requiredFee();
    }

    function _pendingOwnedAssessment(
        uint256 assessmentId
    ) private view returns (Assessment storage assessment) {
        assessment = assessments[assessmentId];
        if (assessment.owner == address(0)) {
            revert AssessmentNotFound(assessmentId);
        }
        if (assessment.owner != msg.sender) {
            revert NotAssessmentOwner(assessmentId, msg.sender);
        }
        if (assessment.status != AssessmentStatus.PENDING) {
            revert AssessmentNotPending(assessmentId);
        }
    }
}
