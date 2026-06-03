# LLM Inference Agent

## Overview

A simple string-in-string-out LLM inference agent using **Qwen3-30B**.

| Property | Value |
|----------|-------|
| **Agent ID** | `12847293847561029384` |
| **Type** | Agent |
| **Methods** | 4 available |
| **Deposit** | 0.24 STT |
| **Platform / AgentRegistry** | `0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776` |
| **Subcommittee Size** | `3` (platform default) |
| **Per-Agent Execution Cost** | `70000000000000000` (0.07 STT) |

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

## Method 1: `inferString()`

**Function Signature**
```solidity
function inferString(
    string memory prompt,
    string memory system,
    bool chainOfThought,
    string[] memory allowedValues
) external returns (string memory response);
```

**Description:** Performs a string-in-string-out LLM inference and returns a string response.

### Solidity Integration Example

```solidity
interface IAgent {
    function inferString(
        string memory prompt,
        string memory system,
        bool chainOfThought,
        string[] memory allowedValues
    ) external returns (string memory);
}

contract MyContract {
    IAgentRequester public platform =
        IAgentRequester(0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776);

    uint256 constant AGENT_ID = 12847293847561029384;
    uint256 constant SUBCOMMITTEE_SIZE = 3;
    uint256 constant PER_AGENT_EXECUTION_COST = 70000000000000000;

    mapping(uint256 => address) public requestSenders;

    event AgentResponseReceived(
        uint256 indexed requestId,
        ResponseStatus status,
        string response
    );

    function invokeInferString(
        string calldata prompt,
        string calldata system,
        bool chainOfThought,
        string[] calldata allowedValues
    ) external payable returns (uint256 requestId) {
        bytes memory payload = abi.encodeWithSelector(
            IAgent.inferString.selector,
            prompt,
            system,
            chainOfThought,
            allowedValues
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
            string memory response = abi.decode(responses[0].result, (string));
            emit AgentResponseReceived(requestId, status, response);
        } else {
            emit AgentResponseReceived(requestId, status, "");
        }
    }

    receive() external payable {}
}
```

---

## Method 2: `inferNumber()`

**Function Signature**
```solidity
function inferNumber(
    string memory prompt,
    string memory system,
    int256 minValue,
    int256 maxValue,
    bool chainOfThought
) external returns (int256 response);
```

**Description:** Performs LLM inference constrained to a numeric range and returns an `int256`.

### Solidity Integration Example

```solidity
interface IAgent {
    function inferNumber(
        string memory prompt,
        string memory system,
        int256 minValue,
        int256 maxValue,
        bool chainOfThought
    ) external returns (int256);
}

contract MyContract {
    IAgentRequester public platform =
        IAgentRequester(0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776);

    uint256 constant AGENT_ID = 12847293847561029384;
    uint256 constant SUBCOMMITTEE_SIZE = 3;
    uint256 constant PER_AGENT_EXECUTION_COST = 70000000000000000;

    mapping(uint256 => address) public requestSenders;

    event AgentResponseReceived(
        uint256 indexed requestId,
        ResponseStatus status,
        int256 response
    );

    function invokeInferNumber(
        string calldata prompt,
        string calldata system,
        int256 minValue,
        int256 maxValue,
        bool chainOfThought
    ) external payable returns (uint256 requestId) {
        bytes memory payload = abi.encodeWithSelector(
            IAgent.inferNumber.selector,
            prompt,
            system,
            minValue,
            maxValue,
            chainOfThought
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
            int256 response = abi.decode(responses[0].result, (int256));
            emit AgentResponseReceived(requestId, status, response);
        } else {
            emit AgentResponseReceived(requestId, status, 0);
        }
    }

    receive() external payable {}
}
```

---

## Method 3: `inferChat()`

**Function Signature**
```solidity
function inferChat(
    string[] memory roles,
    string[] memory messages,
    bool chainOfThought
) external returns (string memory response);
```

**Description:** Performs a multi-turn chat inference using parallel `roles` and `messages` arrays and returns a string response.

### Solidity Integration Example

```solidity
interface IAgent {
    function inferChat(
        string[] memory roles,
        string[] memory messages,
        bool chainOfThought
    ) external returns (string memory);
}

contract MyContract {
    IAgentRequester public platform =
        IAgentRequester(0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776);

    uint256 constant AGENT_ID = 12847293847561029384;
    uint256 constant SUBCOMMITTEE_SIZE = 3;
    uint256 constant PER_AGENT_EXECUTION_COST = 70000000000000000;

    mapping(uint256 => address) public requestSenders;

    event AgentResponseReceived(
        uint256 indexed requestId,
        ResponseStatus status,
        string response
    );

    function invokeInferChat(
        string[] calldata roles,
        string[] calldata messages,
        bool chainOfThought
    ) external payable returns (uint256 requestId) {
        bytes memory payload = abi.encodeWithSelector(
            IAgent.inferChat.selector,
            roles,
            messages,
            chainOfThought
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
            string memory response = abi.decode(responses[0].result, (string));
            emit AgentResponseReceived(requestId, status, response);
        } else {
            emit AgentResponseReceived(requestId, status, "");
        }
    }

    receive() external payable {}
}
```

---

## Method 4: `inferToolsChat()`

**Function Signature**
```solidity
function inferToolsChat(
    string[] memory roles,
    string[] memory messages,
    string[] memory mcpServerUrls,
    tuple[] memory onchainTools,
    uint256 maxIterations,
    bool chainOfThought
) external returns (
    string memory finishReason,
    string memory response,
    string[] memory updatedRoles,
    string[] memory updatedMessages,
    string[] memory pendingToolCallIds,
    bytes[] memory pendingToolCalls
);
```

**Description:** Advanced chat inference with tool-calling support via MCP servers and on-chain tools. Returns the final response along with updated conversation state and any pending tool calls.

### Solidity Integration Example

```solidity
interface IAgent {
    function inferToolsChat(
        string[] memory roles,
        string[] memory messages,
        string[] memory mcpServerUrls,
        tuple[] memory onchainTools,
        uint256 maxIterations,
        bool chainOfThought
    ) external returns (
        string memory,
        string memory,
        string[] memory,
        string[] memory,
        string[] memory,
        bytes[] memory
    );
}

contract MyContract {
    IAgentRequester public platform =
        IAgentRequester(0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776);

    uint256 constant AGENT_ID = 12847293847561029384;
    uint256 constant SUBCOMMITTEE_SIZE = 3;
    uint256 constant PER_AGENT_EXECUTION_COST = 70000000000000000;

    mapping(uint256 => address) public requestSenders;

    event AgentResponseReceived(
        uint256 indexed requestId,
        ResponseStatus status,
        string finishReason,
        string response,
        string[] updatedRoles,
        string[] updatedMessages,
        string[] pendingToolCallIds,
        bytes[] pendingToolCalls
    );

    function invokeInferToolsChat(
        string[] calldata roles,
        string[] calldata messages,
        string[] calldata mcpServerUrls,
        tuple[] calldata onchainTools,
        uint256 maxIterations,
        bool chainOfThought
    ) external payable returns (uint256 requestId) {
        bytes memory payload = abi.encodeWithSelector(
            IAgent.inferToolsChat.selector,
            roles,
            messages,
            mcpServerUrls,
            onchainTools,
            maxIterations,
            chainOfThought
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
            (
                string memory finishReason,
                string memory response,
                string[] memory updatedRoles,
                string[] memory updatedMessages,
                string[] memory pendingToolCallIds,
                bytes[] memory pendingToolCalls
            ) = abi.decode(
                responses[0].result,
                (string, string, string[], string[], string[], bytes[])
            );
            emit AgentResponseReceived(
                requestId,
                status,
                finishReason,
                response,
                updatedRoles,
                updatedMessages,
                pendingToolCallIds,
                pendingToolCalls
            );
        } else {
            emit AgentResponseReceived(
                requestId,
                status,
                "",
                "",
                new string[](0),
                new string[](0),
                new string[](0),
                new bytes[](0)
            );
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
