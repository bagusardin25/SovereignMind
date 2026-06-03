# JSON API Request Agent

## Overview

Fetches JSON data from public API endpoints and extracts specific values using selector paths, serving as a foundational component for building on-chain oracles.

| Property | Value |
|----------|-------|
| **Agent ID** | `13174292974160097713` |
| **Type** | Agent |
| **Methods** | 6 available |
| **Deposit** | 0.12 STT |
| **Platform / AgentRegistry** | `0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776` |
| **Subcommittee Size** | `3` (platform default) |
| **Per-Agent Execution Cost** | `30000000000000000` (0.03 STT) |

---

## Shared Types & Interfaces

The following enums, structs, and interfaces are used across all methods.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

enum ConsensusType { Majority, Threshold }

enum ResponseStatus {
    None,       // 0 - Default zero value (uninitialized storage)
    Pending,    // 1 - Awaiting responses
    Success,    // 2 - Consensus reached normally
    Failed,     // 3 - Validators reported failure
    TimedOut    // 4 - Request timed out
}

struct Response {
    address validator;
    bytes result;
    ResponseStatus status;
    uint256 receipt;
    uint256 timestamp;
    uint256 executionCost;
}

struct Request {
    uint256 id;
    address requester;
    address callbackAddress;
    bytes4 callbackSelector;
    address[] subcommittee;
    Response[] responses;
    uint256 responseCount;
    uint256 failureCount;
    uint256 threshold;
    uint256 createdAt;
    uint256 deadline;
    ResponseStatus status;
    ConsensusType consensusType;
    uint256 remainingBudget;
    uint256 perAgentBudget;
}

interface IAgentRequester {
    function createRequest(
        uint256 agentId,
        address callbackAddress,
        bytes4 callbackSelector,
        bytes calldata payload
    ) external payable returns (uint256 requestId);

    function getRequestDeposit() external view returns (uint256);
}
```

---

## Method 1: `fetchString()`

**Function Signature**
```solidity
function fetchString(
    string memory url,
    string memory selector
) external returns (string memory result);
```

**Description:** Fetches a string value from a JSON API endpoint using a selector path.

### Solidity Integration Example

```solidity
interface IAgent {
    function fetchString(
        string memory url,
        string memory selector
    ) external returns (string memory);
}

contract MyContract {
    IAgentRequester public platform =
        IAgentRequester(0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776);

    uint256 constant AGENT_ID = 13174292974160097713;
    uint256 constant SUBCOMMITTEE_SIZE = 3;
    uint256 constant PER_AGENT_EXECUTION_COST = 30000000000000000;

    mapping(uint256 => address) public requestSenders;

    event AgentResponseReceived(
        uint256 indexed requestId,
        ResponseStatus status,
        string result
    );

    function invokeFetchString(
        string calldata url,
        string calldata selector
    ) external payable returns (uint256 requestId) {
        bytes memory payload = abi.encodeWithSelector(
            IAgent.fetchString.selector,
            url,
            selector
        );

        uint256 reserve = platform.getRequestDeposit();
        uint256 reward = PER_AGENT_EXECUTION_COST * SUBCOMMITTEE_SIZE;
        uint256 deposit = reserve + reward;

        requestId = platform.createRequest{value: deposit}(
            AGENT_ID,
            address(this),
            this.handleResponse.selector,
            payload
        );
        requestSenders[requestId] = msg.sender;
    }

    function handleResponse(
        uint256 requestId,
        Response[] memory responses,
        ResponseStatus status,
        Request memory
    ) external {
        require(msg.sender == address(platform), "Only platform can call");

        if (status == ResponseStatus.Success && responses.length > 0) {
            string memory result = abi.decode(responses[0].result, (string));
            emit AgentResponseReceived(requestId, status, result);
        } else {
            emit AgentResponseReceived(requestId, status, "");
        }
    }

    receive() external payable {}
}
```

---

## Method 2: `fetchUint()`

**Function Signature**
```solidity
function fetchUint(
    string memory url,
    string memory selector,
    uint8 decimals
) external returns (uint256 result);
```

**Description:** Fetches an unsigned integer from a JSON API endpoint. The `decimals` parameter specifies the precision for fixed-point conversion.

### Solidity Integration Example

```solidity
interface IAgent {
    function fetchUint(
        string memory url,
        string memory selector,
        uint8 decimals
    ) external returns (uint256);
}

contract MyContract {
    IAgentRequester public platform =
        IAgentRequester(0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776);

    uint256 constant AGENT_ID = 13174292974160097713;
    uint256 constant SUBCOMMITTEE_SIZE = 3;
    uint256 constant PER_AGENT_EXECUTION_COST = 30000000000000000;

    mapping(uint256 => address) public requestSenders;

    event AgentResponseReceived(
        uint256 indexed requestId,
        ResponseStatus status,
        uint256 result
    );

    function invokeFetchUint(
        string calldata url,
        string calldata selector,
        uint8 decimals
    ) external payable returns (uint256 requestId) {
        bytes memory payload = abi.encodeWithSelector(
            IAgent.fetchUint.selector,
            url,
            selector,
            decimals
        );

        uint256 reserve = platform.getRequestDeposit();
        uint256 reward = PER_AGENT_EXECUTION_COST * SUBCOMMITTEE_SIZE;
        uint256 deposit = reserve + reward;

        requestId = platform.createRequest{value: deposit}(
            AGENT_ID,
            address(this),
            this.handleResponse.selector,
            payload
        );
        requestSenders[requestId] = msg.sender;
    }

    function handleResponse(
        uint256 requestId,
        Response[] memory responses,
        ResponseStatus status,
        Request memory
    ) external {
        require(msg.sender == address(platform), "Only platform can call");

        if (status == ResponseStatus.Success && responses.length > 0) {
            uint256 result = abi.decode(responses[0].result, (uint256));
            emit AgentResponseReceived(requestId, status, result);
        } else {
            emit AgentResponseReceived(requestId, status, 0);
        }
    }

    receive() external payable {}
}
```

---

## Method 3: `fetchInt()`

**Function Signature**
```solidity
function fetchInt(
    string memory url,
    string memory selector,
    uint8 decimals
) external returns (int256 result);
```

**Description:** Fetches a signed integer from a JSON API endpoint. The `decimals` parameter specifies the precision for fixed-point conversion.

### Solidity Integration Example

```solidity
interface IAgent {
    function fetchInt(
        string memory url,
        string memory selector,
        uint8 decimals
    ) external returns (int256);
}

contract MyContract {
    IAgentRequester public platform =
        IAgentRequester(0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776);

    uint256 constant AGENT_ID = 13174292974160097713;
    uint256 constant SUBCOMMITTEE_SIZE = 3;
    uint256 constant PER_AGENT_EXECUTION_COST = 30000000000000000;

    mapping(uint256 => address) public requestSenders;

    event AgentResponseReceived(
        uint256 indexed requestId,
        ResponseStatus status,
        int256 result
    );

    function invokeFetchInt(
        string calldata url,
        string calldata selector,
        uint8 decimals
    ) external payable returns (uint256 requestId) {
        bytes memory payload = abi.encodeWithSelector(
            IAgent.fetchInt.selector,
            url,
            selector,
            decimals
        );

        uint256 reserve = platform.getRequestDeposit();
        uint256 reward = PER_AGENT_EXECUTION_COST * SUBCOMMITTEE_SIZE;
        uint256 deposit = reserve + reward;

        requestId = platform.createRequest{value: deposit}(
            AGENT_ID,
            address(this),
            this.handleResponse.selector,
            payload
        );
        requestSenders[requestId] = msg.sender;
    }

    function handleResponse(
        uint256 requestId,
        Response[] memory responses,
        ResponseStatus status,
        Request memory
    ) external {
        require(msg.sender == address(platform), "Only platform can call");

        if (status == ResponseStatus.Success && responses.length > 0) {
            int256 result = abi.decode(responses[0].result, (int256));
            emit AgentResponseReceived(requestId, status, result);
        } else {
            emit AgentResponseReceived(requestId, status, 0);
        }
    }

    receive() external payable {}
}
```

---

## Method 4: `fetchBool()`

**Function Signature**
```solidity
function fetchBool(
    string memory url,
    string memory selector
) external returns (bool result);
```

**Description:** Fetches a boolean value from a JSON API endpoint using a selector path.

### Solidity Integration Example

```solidity
interface IAgent {
    function fetchBool(
        string memory url,
        string memory selector
    ) external returns (bool);
}

contract MyContract {
    IAgentRequester public platform =
        IAgentRequester(0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776);

    uint256 constant AGENT_ID = 13174292974160097713;
    uint256 constant SUBCOMMITTEE_SIZE = 3;
    uint256 constant PER_AGENT_EXECUTION_COST = 30000000000000000;

    mapping(uint256 => address) public requestSenders;

    event AgentResponseReceived(
        uint256 indexed requestId,
        ResponseStatus status,
        bool result
    );

    function invokeFetchBool(
        string calldata url,
        string calldata selector
    ) external payable returns (uint256 requestId) {
        bytes memory payload = abi.encodeWithSelector(
            IAgent.fetchBool.selector,
            url,
            selector
        );

        uint256 reserve = platform.getRequestDeposit();
        uint256 reward = PER_AGENT_EXECUTION_COST * SUBCOMMITTEE_SIZE;
        uint256 deposit = reserve + reward;

        requestId = platform.createRequest{value: deposit}(
            AGENT_ID,
            address(this),
            this.handleResponse.selector,
            payload
        );
        requestSenders[requestId] = msg.sender;
    }

    function handleResponse(
        uint256 requestId,
        Response[] memory responses,
        ResponseStatus status,
        Request memory
    ) external {
        require(msg.sender == address(platform), "Only platform can call");

        if (status == ResponseStatus.Success && responses.length > 0) {
            bool result = abi.decode(responses[0].result, (bool));
            emit AgentResponseReceived(requestId, status, result);
        } else {
            emit AgentResponseReceived(requestId, status, false);
        }
    }

    receive() external payable {}
}
```

---

## Method 5: `fetchStringArray()`

**Function Signature**
```solidity
function fetchStringArray(
    string memory url,
    string memory selector
) external returns (string[] memory result);
```

**Description:** Fetches an array of strings from a JSON API endpoint using a selector path.

### Solidity Integration Example

```solidity
interface IAgent {
    function fetchStringArray(
        string memory url,
        string memory selector
    ) external returns (string[] memory);
}

contract MyContract {
    IAgentRequester public platform =
        IAgentRequester(0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776);

    uint256 constant AGENT_ID = 13174292974160097713;
    uint256 constant SUBCOMMITTEE_SIZE = 3;
    uint256 constant PER_AGENT_EXECUTION_COST = 30000000000000000;

    mapping(uint256 => address) public requestSenders;

    event AgentResponseReceived(
        uint256 indexed requestId,
        ResponseStatus status,
        string[] result
    );

    function invokeFetchStringArray(
        string calldata url,
        string calldata selector
    ) external payable returns (uint256 requestId) {
        bytes memory payload = abi.encodeWithSelector(
            IAgent.fetchStringArray.selector,
            url,
            selector
        );

        uint256 reserve = platform.getRequestDeposit();
        uint256 reward = PER_AGENT_EXECUTION_COST * SUBCOMMITTEE_SIZE;
        uint256 deposit = reserve + reward;

        requestId = platform.createRequest{value: deposit}(
            AGENT_ID,
            address(this),
            this.handleResponse.selector,
            payload
        );
        requestSenders[requestId] = msg.sender;
    }

    function handleResponse(
        uint256 requestId,
        Response[] memory responses,
        ResponseStatus status,
        Request memory
    ) external {
        require(msg.sender == address(platform), "Only platform can call");

        if (status == ResponseStatus.Success && responses.length > 0) {
            string[] memory result = abi.decode(responses[0].result, (string[]));
            emit AgentResponseReceived(requestId, status, result);
        } else {
            emit AgentResponseReceived(requestId, status, new string[](0));
        }
    }

    receive() external payable {}
}
```

---

## Method 6: `fetchUintArray()`

**Function Signature**
```solidity
function fetchUintArray(
    string memory url,
    string memory selector,
    uint8 decimals
) external returns (uint256[] memory result);
```

**Description:** Fetches an array of unsigned integers from a JSON API endpoint. The `decimals` parameter specifies the precision for fixed-point conversion.

### Solidity Integration Example

```solidity
interface IAgent {
    function fetchUintArray(
        string memory url,
        string memory selector,
        uint8 decimals
    ) external returns (uint256[] memory);
}

contract MyContract {
    IAgentRequester public platform =
        IAgentRequester(0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776);

    uint256 constant AGENT_ID = 13174292974160097713;
    uint256 constant SUBCOMMITTEE_SIZE = 3;
    uint256 constant PER_AGENT_EXECUTION_COST = 30000000000000000;

    mapping(uint256 => address) public requestSenders;

    event AgentResponseReceived(
        uint256 indexed requestId,
        ResponseStatus status,
        uint256[] result
    );

    function invokeFetchUintArray(
        string calldata url,
        string calldata selector,
        uint8 decimals
    ) external payable returns (uint256 requestId) {
        bytes memory payload = abi.encodeWithSelector(
            IAgent.fetchUintArray.selector,
            url,
            selector,
            decimals
        );

        uint256 reserve = platform.getRequestDeposit();
        uint256 reward = PER_AGENT_EXECUTION_COST * SUBCOMMITTEE_SIZE;
        uint256 deposit = reserve + reward;

        requestId = platform.createRequest{value: deposit}(
            AGENT_ID,
            address(this),
            this.handleResponse.selector,
            payload
        );
        requestSenders[requestId] = msg.sender;
    }

    function handleResponse(
        uint256 requestId,
        Response[] memory responses,
        ResponseStatus status,
        Request memory
    ) external {
        require(msg.sender == address(platform), "Only platform can call");

        if (status == ResponseStatus.Success && responses.length > 0) {
            uint256[] memory result = abi.decode(responses[0].result, (uint256[]));
            emit AgentResponseReceived(requestId, status, result);
        } else {
            emit AgentResponseReceived(requestId, status, new uint256[](0));
        }
    }

    receive() external payable {}
}
```

---

## ResponseStatus Reference

| Value | Name | Description |
|-------|------|-------------|
| 0 | `None` | Default zero value (uninitialized storage) |
| 1 | `Pending` | Awaiting responses |
| 2 | `Success` | Consensus reached normally |
| 3 | `Failed` | Validators reported failure |
| 4 | `TimedOut` | Request timed out |

---

## Important Notes

- **Deposit Calculation:** Always include both the platform floor deposit (`platform.getRequestDeposit()`) and the per-agent execution reward. Floor-only deposits will satisfy the contract, but runners may skip the request if `perAgentBudget < scheduledExecutionCost`.
- **Callback Security:** Only the platform address (`AgentRegistry`) can invoke `handleResponse`. Always validate with `require(msg.sender == address(platform), "...")`.
- **Rebates:** Implement `receive() external payable {}` so your contract can accept execution rebates.
- **Consensus:** The examples decode the first successful response (`responses[0]`). You may implement custom logic to handle multiple responses or different consensus strategies.
- **Decimals Parameter:** For `fetchUint`, `fetchInt`, and `fetchUintArray`, the `decimals` parameter is used for fixed-point precision conversion of numeric JSON values.
