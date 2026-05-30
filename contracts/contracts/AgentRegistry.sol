// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title AgentRegistry
 * @notice Role-based access control registry for SovereignMind's autonomous agents
 * @dev Manages agent registration, activation/deactivation, and decision tracking.
 *      Uses OpenZeppelin AccessControl for role management.
 */
contract AgentRegistry is AccessControl {
    // ═══════════════════════════════════════════════════════════
    //                        ROLES
    // ═══════════════════════════════════════════════════════════
    bytes32 public constant CEO_ROLE = keccak256("CEO_ROLE");
    bytes32 public constant CFO_ROLE = keccak256("CFO_ROLE");
    bytes32 public constant CMO_ROLE = keccak256("CMO_ROLE");
    bytes32 public constant TREASURY_MANAGER_ROLE = keccak256("TREASURY_MANAGER_ROLE");

    // ═══════════════════════════════════════════════════════════
    //                        STRUCTS
    // ═══════════════════════════════════════════════════════════
    struct AgentInfo {
        bytes32 role;
        bool isActive;
        uint256 registeredAt;
        uint256 decisionsCount;
        uint256 successCount;
        uint256 lastActionTimestamp;
    }

    // ═══════════════════════════════════════════════════════════
    //                        STATE
    // ═══════════════════════════════════════════════════════════
    mapping(address => AgentInfo) public agentInfos;
    mapping(bytes32 => address) public roleToAgent;
    address[] public registeredAgents;
    uint256 public totalDecisions;

    // ═══════════════════════════════════════════════════════════
    //                        EVENTS
    // ═══════════════════════════════════════════════════════════
    event AgentRegistered(bytes32 indexed role, address indexed agentAddress, uint256 timestamp);
    event AgentDeactivated(address indexed agentAddress, uint256 timestamp);
    event AgentReactivated(address indexed agentAddress, uint256 timestamp);
    event DecisionRecorded(address indexed agentAddress, uint256 newCount, uint256 timestamp);

    // ═══════════════════════════════════════════════════════════
    //                        ERRORS
    // ═══════════════════════════════════════════════════════════
    error AgentAlreadyRegistered(address agent);
    error AgentNotRegistered(address agent);
    error RoleAlreadyAssigned(bytes32 role, address currentAgent);
    error InvalidAddress();

    // ═══════════════════════════════════════════════════════════
    //                      CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ═══════════════════════════════════════════════════════════
    //                    ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Register a new agent with a specific role
     * @param role The role to assign (CEO_ROLE, CFO_ROLE, CMO_ROLE)
     * @param agentAddress The contract address of the agent
     */
    function registerAgent(bytes32 role, address agentAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (agentAddress == address(0)) revert InvalidAddress();
        if (agentInfos[agentAddress].registeredAt != 0) revert AgentAlreadyRegistered(agentAddress);
        if (roleToAgent[role] != address(0)) revert RoleAlreadyAssigned(role, roleToAgent[role]);

        agentInfos[agentAddress] = AgentInfo({
            role: role,
            isActive: true,
            registeredAt: block.timestamp,
            decisionsCount: 0,
            successCount: 0,
            lastActionTimestamp: 0
        });

        roleToAgent[role] = agentAddress;
        registeredAgents.push(agentAddress);

        _grantRole(role, agentAddress);

        emit AgentRegistered(role, agentAddress, block.timestamp);
    }

    /**
     * @notice Deactivate an agent (does not remove role, just marks inactive)
     * @param agentAddress The agent to deactivate
     */
    function deactivateAgent(address agentAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (agentInfos[agentAddress].registeredAt == 0) revert AgentNotRegistered(agentAddress);
        agentInfos[agentAddress].isActive = false;
        emit AgentDeactivated(agentAddress, block.timestamp);
    }

    /**
     * @notice Reactivate a previously deactivated agent
     * @param agentAddress The agent to reactivate
     */
    function reactivateAgent(address agentAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (agentInfos[agentAddress].registeredAt == 0) revert AgentNotRegistered(agentAddress);
        agentInfos[agentAddress].isActive = true;
        emit AgentReactivated(agentAddress, block.timestamp);
    }

    /**
     * @notice Grant treasury manager role to an agent
     * @param agentAddress The agent to grant treasury access
     */
    function grantTreasuryAccess(address agentAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(TREASURY_MANAGER_ROLE, agentAddress);
    }

    // ═══════════════════════════════════════════════════════════
    //                   AGENT FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Record a decision made by an agent
     * @param success Whether the decision was successful
     */
    function recordDecision(bool success) external {
        AgentInfo storage info = agentInfos[msg.sender];
        if (info.registeredAt == 0) revert AgentNotRegistered(msg.sender);

        info.decisionsCount++;
        if (success) {
            info.successCount++;
        }
        info.lastActionTimestamp = block.timestamp;
        totalDecisions++;

        emit DecisionRecorded(msg.sender, info.decisionsCount, block.timestamp);
    }

    // ═══════════════════════════════════════════════════════════
    //                    VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * @notice Check if an address is an active registered agent
     */
    function isActiveAgent(address agent) external view returns (bool) {
        return agentInfos[agent].isActive;
    }

    /**
     * @notice Get agent info for an address
     */
    function getAgentInfo(address agent) external view returns (AgentInfo memory) {
        return agentInfos[agent];
    }

    /**
     * @notice Get the agent address for a given role
     */
    function getAgentByRole(bytes32 role) external view returns (address) {
        return roleToAgent[role];
    }

    /**
     * @notice Get the total number of registered agents
     */
    function getAgentCount() external view returns (uint256) {
        return registeredAgents.length;
    }

    /**
     * @notice Get all registered agent addresses
     */
    function getAllAgents() external view returns (address[] memory) {
        return registeredAgents;
    }

    /**
     * @notice Get success rate for an agent (in basis points, 10000 = 100%)
     */
    function getSuccessRate(address agent) external view returns (uint256) {
        AgentInfo memory info = agentInfos[agent];
        if (info.decisionsCount == 0) return 0;
        return (info.successCount * 10000) / info.decisionsCount;
    }
}
