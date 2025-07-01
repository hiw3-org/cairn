// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./interfaces/IHypercertToken.sol";
import "forge-std/console.sol";

contract Cairn {
    IHypercertToken public hypercertToken;

    struct Project {
        uint256 tokenID;
        string metadataURI;
        uint256 units;
        IHypercertToken.TransferRestrictions restrictions;
        string outputsURI;

 
        // PoRs - URI, state (pending, verified, dispute, unverfied)

        // FUNDERS: addr => amount

    }

    // TODO PoR requirements before project creation and reduce PoR count after
    // TODO Funding 

    // Nested mapping: creator address => metadataURI => Project
    mapping(address => mapping(string => Project)) private projects;
    mapping(address => string[]) public userMetadataURIs;

    // Global tracking of used metadata URIs to enforce uniqueness across all creators
    mapping(string => bool) private _metadataURIsUsed;

    event ProjectRegistered(address indexed creator, uint256 indexed tokenID, string metadataURI);
    event OutputsRecorded(address indexed creator, uint256 indexed tokenID, string metadataURI, string outputsURI);

    constructor(address _hypercertToken) {
        hypercertToken = IHypercertToken(_hypercertToken);
    }

    /// @notice Register a new project with unique metadataURI globally
    function registerProject(string memory metadataURI, uint256 units, IHypercertToken.TransferRestrictions restrictions) external {
        require(!_metadataURIsUsed[metadataURI], "Metadata URI already used globally");

        projects[msg.sender][metadataURI] = Project({
            tokenID: 0,
            metadataURI: metadataURI,
            units: units,
            restrictions: restrictions,
            outputsURI: ""
        });
        userMetadataURIs[msg.sender].push(metadataURI);

        _metadataURIsUsed[metadataURI] = true;

        emit ProjectRegistered(msg.sender, 0, metadataURI);
    }

    /// @notice Store the tokenID for a project identified by creator and metadataURI
    function storeTokenID(string memory metadataURI, uint256 tokenID) external {
        require(tokenID != 0, "Invalid tokenID");
        require(_metadataURIsUsed[metadataURI], "Project does not exist yet");
        // Check that the project exists for msg.sender
        Project storage project = projects[msg.sender][metadataURI];
        require(bytes(project.metadataURI).length != 0, "You are not the creator of this project");
        require(projects[msg.sender][metadataURI].tokenID == 0, "tokenID already set");
        console.log("Owner of token", hypercertToken.ownerOf(tokenID));
        require(hypercertToken.ownerOf(tokenID) == msg.sender, "You are not owner of tokenID or the tokenID does not exists");

        projects[msg.sender][metadataURI].tokenID = tokenID;

        emit ProjectRegistered(msg.sender, tokenID, metadataURI);
    }

    /// @notice Store the outputs of a project identified by creator and metadataURI
    function recordOutputs(string memory metadataURI, string memory outputsURI) external {
        require(_metadataURIsUsed[metadataURI], "Project does not exist yet");

        // Access the project of msg.sender by metadataURI
        Project storage project = projects[msg.sender][metadataURI];
        require(bytes(project.metadataURI).length != 0, "You are not the creator of this project");

        // Check that tokenID has been stored (must be non-zero)
        require(project.tokenID != 0, "Project tokenID not set");

        // Check if outputs already stored to prevent overwriting
        require(bytes(project.outputsURI).length == 0, "Outputs already recorded");

        // Record the outputs URI
        project.outputsURI = outputsURI;

        emit OutputsRecorded(msg.sender, project.tokenID, metadataURI, outputsURI);
    }


    /// @notice Get array of user's projects metadataURIs
    function getUserMetadataURIs(address user) external view returns (string[] memory) {
        return userMetadataURIs[user];
    }

    /// @notice Get project by creator and metadataURI
    function getProject(address creator, string memory metadataURI) external view returns (Project memory) {
        require(_metadataURIsUsed[metadataURI], "Project does not exist");
        return projects[creator][metadataURI];
    }
}
