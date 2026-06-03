// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title ISomniaAgentRunner
 * @notice Interface for Somnia's native Agent Runner platform
 * @dev Types match the canonical Somnia platform contracts exactly.
 *      The function selector for handleResponse depends on these struct
 *      layouts — any mismatch prevents the callback from firing.
 *
 *      Official docs shared types (all 3 agents use the same):
 *        - JSON API Request Agent  (ID: 13174292974160097713)
 *        - LLM Inference Agent     (ID: 12847293847561029384)
 *        - LLM Parse Website Agent (ID: 12875401142070969085)
 */

enum ConsensusType { Majority, Threshold }

/// @notice Status of an agent request — values MUST match the platform
enum ResponseStatus {
    None,       // 0 - Default zero value (uninitialized storage)
    Pending,    // 1 - Awaiting responses
    Success,    // 2 - Consensus reached normally
    Failed,     // 3 - Validators reported failure
    TimedOut    // 4 - Request timed out
}

/// @notice A single validator response — field order MUST match the platform
struct Response {
    address validator;
    bytes result;
    ResponseStatus status;
    uint256 receipt;
    uint256 timestamp;
    uint256 executionCost;
}

/// @notice Full request metadata — field order MUST match the platform
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
     * @notice Returns the minimum deposit required for a request (reserve floor)
     * @return Minimum deposit in wei
     */
    function getRequestDeposit() external view returns (uint256);

    /**
     * @notice Returns the price per agent for a given agent ID
     * @param agentId The agent to query
     * @return Price per agent invocation in wei
     */
    function getAgentPrice(uint256 agentId) external view returns (uint256);

    /**
     * @notice Returns the current subcommittee size
     * @return Number of validators in the subcommittee
     */
    function getSubcommitteeSize() external view returns (uint256);
}

/**
 * @title IAgentCallback
 * @notice Interface that contracts must implement to receive agent responses.
 *         The function signature must produce the same selector as the
 *         platform's IAgentRequesterHandler.handleResponse.
 */
interface IAgentCallback {
    /**
     * @notice Called by the Agent Runner when consensus is reached
     * @param requestId The ID of the original request
     * @param responses Array of validator responses
     * @param status Overall status of the request
     * @param details Original request metadata
     */
    function handleResponse(
        uint256 requestId,
        Response[] calldata responses,
        ResponseStatus status,
        Request calldata details
    ) external;
}
