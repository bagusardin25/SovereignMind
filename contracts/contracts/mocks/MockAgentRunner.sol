// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/ISomniaAgentRunner.sol";

/**
 * @title MockAgentRunner
 * @notice Mock implementation of Somnia Agent Runner for testing
 * @dev Simulates the Agent Runner to enable end-to-end testing of agent contracts.
 *      Uses the exact same types (Response, Request, ResponseStatus) as the real
 *      Somnia platform so callback selectors match.
 */
contract MockAgentRunner is ISomniaAgentRunner {
    uint256 public nextRequestId = 1;
    uint256 public requestDeposit = 0.01 ether;
    uint256 public agentPrice = 0.10 ether;
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

        Response[] memory responses = new Response[](1);
        responses[0] = Response({
            validator: address(this),
            result: result,
            status: ResponseStatus.Success,
            receipt: 0,
            timestamp: block.timestamp,
            executionCost: 0
        });

        // Build a minimal Request struct for the callback
        address[] memory subcommittee = new address[](1);
        subcommittee[0] = address(this);
        Response[] memory emptyResponses = new Response[](0);

        Request memory details = Request({
            id: requestId,
            requester: req.callbackContract,
            callbackAddress: req.callbackContract,
            callbackSelector: req.callbackSelector,
            subcommittee: subcommittee,
            responses: emptyResponses,
            responseCount: 1,
            failureCount: 0,
            threshold: 1,
            createdAt: block.timestamp,
            deadline: block.timestamp + 300,
            status: ResponseStatus.Success,
            consensusType: ConsensusType.Majority,
            remainingBudget: req.deposit,
            perAgentBudget: req.deposit / 3
        });

        (bool success, ) = req.callbackContract.call(
            abi.encodeWithSelector(
                req.callbackSelector,
                requestId,
                responses,
                ResponseStatus.Success,
                details
            )
        );
        require(success, "Callback failed");
    }

    /**
     * @notice Test helper: simulate a failed response callback
     * @param requestId The request ID to simulate a failure for
     */
    function simulateFailedResponse(
        uint256 requestId,
        string calldata /* errorMsg */
    ) external {
        MockRequest memory req = requests[requestId];

        Response[] memory responses = new Response[](1);
        responses[0] = Response({
            validator: address(this),
            result: "",
            status: ResponseStatus.Failed,
            receipt: 0,
            timestamp: block.timestamp,
            executionCost: 0
        });

        address[] memory subcommittee = new address[](1);
        subcommittee[0] = address(this);
        Response[] memory emptyResponses = new Response[](0);

        Request memory details = Request({
            id: requestId,
            requester: req.callbackContract,
            callbackAddress: req.callbackContract,
            callbackSelector: req.callbackSelector,
            subcommittee: subcommittee,
            responses: emptyResponses,
            responseCount: 0,
            failureCount: 1,
            threshold: 1,
            createdAt: block.timestamp,
            deadline: block.timestamp + 300,
            status: ResponseStatus.Failed,
            consensusType: ConsensusType.Majority,
            remainingBudget: req.deposit,
            perAgentBudget: req.deposit / 3
        });

        (bool success, ) = req.callbackContract.call(
            abi.encodeWithSelector(
                req.callbackSelector,
                requestId,
                responses,
                ResponseStatus.Failed,
                details
            )
        );
        require(success, "Callback failed");
    }

    /// @notice Allow receiving STT
    receive() external payable {}
}
