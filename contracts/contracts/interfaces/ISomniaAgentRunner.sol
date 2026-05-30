// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title ISomniaAgentRunner
 * @notice Interface for Somnia's native Agent Runner platform
 * @dev Smart contracts use this interface to interact with Somnia's three base agents:
 *      - JSON API Request Agent: Fetches data from HTTP endpoints
 *      - LLM Inference Agent: Runs deterministic AI inference (Qwen3-30B)
 *      - LLM Parse Website Agent: Scrapes and extracts structured data from websites
 */

/// @notice Status of an agent response
enum ResponseStatus {
    PENDING,
    SUCCESS,
    FAILED
}

/// @notice Represents a single response from the agent runner
struct AgentResponse {
    uint256 requestId;
    ResponseStatus status;
    bytes result;
    string errorMessage;
}

/// @notice Represents metadata about the original request
struct AgentRequest {
    uint256 requestId;
    address requester;
    uint256 agentId;
    bytes payload;
    uint256 deposit;
    uint256 timestamp;
}

interface ISomniaAgentRunner {
    /**
     * @notice Creates a new agent request
     * @param agentId The ID of the base agent to invoke
     * @param callbackContract Address to receive the response callback
     * @param callbackSelector Function selector for the callback
     * @param payload ABI-encoded data for the agent call
     * @return requestId Unique identifier for tracking the request
     */
    function createRequest(
        uint256 agentId,
        address callbackContract,
        bytes4 callbackSelector,
        bytes calldata payload
    ) external payable returns (uint256 requestId);

    /**
     * @notice Returns the minimum deposit required for a request
     * @return Minimum deposit in wei (covers gas refunds, callback gas, keeper payments)
     */
    function getRequestDeposit() external view returns (uint256);

    /**
     * @notice Returns the price per agent for a given agent ID
     * @param agentId The agent to query
     * @return Price per agent invocation in wei
     */
    function getAgentPrice(uint256 agentId) external view returns (uint256);

    /**
     * @notice Returns the current subcommittee size (number of validators executing the request)
     * @return Number of validators in the subcommittee
     */
    function getSubcommitteeSize() external view returns (uint256);
}

/**
 * @title IAgentCallback
 * @notice Interface that contracts must implement to receive agent responses
 */
interface IAgentCallback {
    /**
     * @notice Called by the Agent Runner when a response is ready
     * @param requestId The ID of the original request
     * @param responses Array of responses from validator subcommittee
     * @param status Overall status of the request
     * @param details Original request metadata
     */
    function handleResponse(
        uint256 requestId,
        AgentResponse[] calldata responses,
        ResponseStatus status,
        AgentRequest calldata details
    ) external;
}
