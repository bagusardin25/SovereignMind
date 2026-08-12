// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MockFtsoV2 {
    uint256 public fee;
    uint256 public value;
    int8 public decimals;
    uint64 public timestamp;
    uint256 public lastPayment;

    constructor(uint256 initialFee, uint256 initialValue, int8 initialDecimals) {
        fee = initialFee;
        value = initialValue;
        decimals = initialDecimals;
        timestamp = uint64(block.timestamp);
    }

    function setFeed(
        uint256 nextValue,
        int8 nextDecimals,
        uint64 nextTimestamp
    ) external {
        value = nextValue;
        decimals = nextDecimals;
        timestamp = nextTimestamp;
    }

    function setFee(uint256 nextFee) external {
        fee = nextFee;
    }

    function calculateFeeById(bytes21) external view returns (uint256) {
        return fee;
    }

    function getFeedById(
        bytes21
    ) external payable returns (uint256, int8, uint64) {
        lastPayment = msg.value;
        return (value, decimals, timestamp);
    }
}
