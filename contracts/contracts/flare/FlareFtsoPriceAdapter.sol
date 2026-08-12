// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {FtsoV2Interface} from "@flarenetwork/flare-periphery-contracts/coston2/FtsoV2Interface.sol";
import {PriceOracle} from "../PriceOracle.sol";

/**
 * @title FlareFtsoPriceAdapter
 * @notice Synchronizes Flare FTSOv2 XRP/USD data into SovereignMind's PriceOracle.
 * @dev The FTSOv2 address must be resolved from FlareContractRegistry by the
 *      deployment script. Grant this adapter PriceOracle.UPDATER_ROLE after deploy.
 */
contract FlareFtsoPriceAdapter {
    bytes21 public constant XRP_USD_FEED_ID =
        0x015852502f55534400000000000000000000000000;

    string public constant ORACLE_SYMBOL = "xrp";
    uint256 public constant MAX_FEED_AGE = 5 minutes;

    PriceOracle public immutable oracle;
    FtsoV2Interface public immutable ftsoV2;

    error InvalidAddress();
    error IncorrectFee(uint256 expected, uint256 received);
    error InvalidFeedValue(uint256 value, uint64 timestamp);
    error InvalidFeedTimestamp(uint64 timestamp, uint256 currentTime);
    error UnsupportedDecimals(int8 decimals);

    event FlarePriceSynchronized(
        bytes21 indexed feedId,
        string symbol,
        uint256 rawValue,
        int8 rawDecimals,
        uint256 priceE8,
        uint64 feedTimestamp,
        address indexed caller
    );

    constructor(address oracleAddress, address ftsoV2Address) {
        if (oracleAddress == address(0) || ftsoV2Address == address(0)) {
            revert InvalidAddress();
        }

        oracle = PriceOracle(oracleAddress);
        ftsoV2 = FtsoV2Interface(ftsoV2Address);
    }

    /**
     * @notice Returns the exact C2FLR fee required for the XRP/USD feed.
     */
    function requiredFee() public view returns (uint256) {
        return ftsoV2.calculateFeeById(XRP_USD_FEED_ID);
    }

    /**
     * @notice Reads XRP/USD from FTSOv2 and writes an 8-decimal value to PriceOracle.
     * @dev Exact payment is required so the adapter never holds caller funds.
     */
    function syncXrpUsd()
        external
        payable
        returns (uint256 priceE8, uint64 feedTimestamp)
    {
        uint256 fee = requiredFee();
        if (msg.value != fee) revert IncorrectFee(fee, msg.value);

        (uint256 rawValue, int8 rawDecimals, uint64 timestamp) = ftsoV2
            .getFeedById{value: fee}(XRP_USD_FEED_ID);

        if (rawValue == 0 || timestamp == 0) {
            revert InvalidFeedValue(rawValue, timestamp);
        }
        if (
            timestamp > block.timestamp ||
            block.timestamp - timestamp > MAX_FEED_AGE
        ) {
            revert InvalidFeedTimestamp(timestamp, block.timestamp);
        }

        priceE8 = _normalizeToE8(rawValue, rawDecimals);
        if (priceE8 == 0) revert InvalidFeedValue(rawValue, timestamp);
        feedTimestamp = timestamp;

        oracle.updatePrice(ORACLE_SYMBOL, priceE8);

        emit FlarePriceSynchronized(
            XRP_USD_FEED_ID,
            ORACLE_SYMBOL,
            rawValue,
            rawDecimals,
            priceE8,
            timestamp,
            msg.sender
        );
    }

    function _normalizeToE8(
        uint256 value,
        int8 decimals
    ) internal pure returns (uint256) {
        if (decimals < 0 || decimals > 18) {
            revert UnsupportedDecimals(decimals);
        }

        uint8 unsignedDecimals = uint8(decimals);
        if (unsignedDecimals == 8) return value;

        if (unsignedDecimals < 8) {
            return value * (10 ** (8 - unsignedDecimals));
        }

        return value / (10 ** (unsignedDecimals - 8));
    }
}
