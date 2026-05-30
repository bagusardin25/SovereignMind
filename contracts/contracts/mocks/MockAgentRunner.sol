// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/ISomniaAgentRunner.sol";

/**
 * @title MockAgentRunner
 * @notice Mock implementation of Somnia Agent Runner for testing
 * @dev Simulates the Agent Runner to enable end-to-end testing of agent contracts
 */
contract MockAgentRunner is ISomniaAgentRunner {
    uint256 public nextRequestId = 1;
    uint256 public requestDeposit = 0.01 ether;
    uint256 public agentPrice = 0.001 ether;
    uint256 public subcommitteeSize = 3;

    struct MockRequest {
        uint256 agentId;
        address callbackContract;
        bytes4 callbackSelector;
        bytes payload;
        uint256 deposit;
    }

    mapping(uint256 => MockRequest) public requests;

    event RequestCreated(uint256 requestId, uint256 agentId, address callbackContract);

    function createRequest(
        uint256 agentId,
        address callbackContract,
        bytes4 callbackSelector,
        bytes calldata payload
    ) external payable override returns (uint256 requestId) {
        requestId = nextRequestId++;
        requests[requestId] = MockRequest({
            agentId: agentId,
            callbackContract: callbackContract,
            callbackSelector: callbackSelector,
            payload: payload,
            deposit: msg.value
        });
        emit RequestCreated(requestId, agentId, callbackContract);
        return requestId;
    }

    function getRequestDeposit() external view override returns (uint256) {
        return requestDeposit;
    }

    function getAgentPrice(uint256 /* agentId */) external view override returns (uint256) {
        return agentPrice;
    }

    function getSubcommitteeSize() external view override returns (uint256) {
        return subcommitteeSize;
    }

    /**
     * @notice Test helper: simulate a successful response callback
     * @param requestId The request ID to simulate a response for
     * @param result The ABI-encoded result data
     */
    function simulateResponse(
        uint256 requestId,
        bytes calldata result
    ) external {
        MockRequest memory req = requests[requestId];

        AgentResponse[] memory responses = new AgentResponse[](1);
        responses[0] = AgentResponse({
            requestId: requestId,
            status: ResponseStatus.SUCCESS,
            result: result,
            errorMessage: ""
        });

        AgentRequest memory details = AgentRequest({
            requestId: requestId,
            requester: req.callbackContract,
            agentId: req.agentId,
            payload: req.payload,
            deposit: req.deposit,
            timestamp: block.timestamp
        });

        (bool success, ) = req.callbackContract.call(
            abi.encodeWithSelector(
                req.callbackSelector,
                requestId,
                responses,
                ResponseStatus.SUCCESS,
                details
            )
        );
        require(success, "Callback failed");
    }

    /**
     * @notice Test helper: simulate a failed response callback
     * @param requestId The request ID to simulate a failure for
     * @param errorMsg The error message to include
     */
    function simulateFailedResponse(
        uint256 requestId,
        string calldata errorMsg
    ) external {
        MockRequest memory req = requests[requestId];

        AgentResponse[] memory responses = new AgentResponse[](1);
        responses[0] = AgentResponse({
            requestId: requestId,
            status: ResponseStatus.FAILED,
            result: "",
            errorMessage: errorMsg
        });

        AgentRequest memory details = AgentRequest({
            requestId: requestId,
            requester: req.callbackContract,
            agentId: req.agentId,
            payload: req.payload,
            deposit: req.deposit,
            timestamp: block.timestamp
        });

        (bool success, ) = req.callbackContract.call(
            abi.encodeWithSelector(
                req.callbackSelector,
                requestId,
                responses,
                ResponseStatus.FAILED,
                details
            )
        );
        require(success, "Callback failed");
    }

    /// @notice Allow receiving STT
    receive() external payable {}
}
