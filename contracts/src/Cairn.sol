// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./IHypercertToken.sol";

contract Cairn {

    struct Project {
        address owner;
        string metadataHash;
        uint256 impactAssetId;
        string outputHash;
    }

    // TODO Hypercert integration
    // TODO User registration => PoR count

    constructor(address _hypercert) {
        hypercert = IHypercert(_hypercert);
    }

    function registerProject(string calldata metadataHash)
        external
        returns (uint256 projectId)
    {
        // Implementation for registering a project
        // This is a placeholder; actual implementation would involve storing the project data
        projectId = 1; // Example project ID
    }
}
