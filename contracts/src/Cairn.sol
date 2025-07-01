// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./interfaces/IHypercertToken.sol";
import "forge-std/console.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Cairn is Ownable {
    IHypercertToken public hypercertToken;
    uint8 public minRequiredPoR;
    uint8 public maxPoRProject;

    struct Project {
        address creator; 
        uint256 tokenID;
        string metadataURI;
        string outputsURI;
        ProofOfReproducibility[] proofs;

        // TODO FUNDERS: addr => amount
    }

    enum ProofState {
        PENDING,
        VERIFIED,
        DISPUTE,
        UNVERIFIED
    }

    struct ProofOfReproducibility {
        string proofURI;       // IPFS URI of the proof metadata
        address recorder;      // Who recorded the proof
        ProofState state;      // State of the proof
    }

    string[] public allMetadataURIs; 
    mapping(string => Project) private projects; 
    mapping(address => string[]) public userMetadataURIs;
    // Global tracking of used metadata URIs to enforce uniqueness across all creators
    mapping(string => bool) private _metadataURIsUsed;

    mapping(address => uint256) public userTotalPoRCount;      // total proofs recorded
    mapping(address => uint256) public userAvailablePoRCount;  // proofs available to create project
    // Tracks if a user has already recorded a PoR for a given project metadataURI
    mapping(string => mapping(address => bool)) public hasRecordedProof;


    event ProjectRegistered(address indexed creator, uint256 indexed tokenID, string metadataURI);
    event OutputsRecorded(address indexed creator, uint256 indexed tokenID, string metadataURI, string outputsURI);
    event ProofRecorded(address indexed creator, uint256 indexed tokenID, string metadataURI, string proofURI);

    constructor(address _hypercertToken, uint8 _minRequiredPoR, uint8 _maxPoRProject) {
        hypercertToken = IHypercertToken(_hypercertToken);
        minRequiredPoR = _minRequiredPoR;
        maxPoRProject = _maxPoRProject;
    }


    /// ---------------- SETTER FUNCTIONS ----------------------

    /// @notice Register a new project with unique metadataURI globally
    function registerProject(string memory metadataURI) external {
        require(!_metadataURIsUsed[metadataURI], "Metadata URI already used globally");

        require(userAvailablePoRCount[msg.sender] >= minRequiredPoR, "Not enough available PoRs to register project");

        // Project struct init
        Project storage project = projects[metadataURI];
        project.creator = msg.sender;
        project.tokenID = 0;
        project.metadataURI = metadataURI;
        project.outputsURI = "";

        userMetadataURIs[msg.sender].push(metadataURI);
        allMetadataURIs.push(metadataURI);
        _metadataURIsUsed[metadataURI] = true;
        userAvailablePoRCount[msg.sender] -= minRequiredPoR;

        emit ProjectRegistered(msg.sender, 0, metadataURI);
    }

    function initProject(string memory metadataURI, address _creator) external onlyOwner {
        require(_creator != address(0), "Invalid creator address");
        require(!_metadataURIsUsed[metadataURI], "Metadata URI already used");
        Project storage project = projects[metadataURI];
        project.creator = _creator;
        project.tokenID = 0;
        project.metadataURI = metadataURI;
        project.outputsURI = "";

        userMetadataURIs[_creator].push(metadataURI);
        allMetadataURIs.push(metadataURI);
        _metadataURIsUsed[metadataURI] = true;

        emit ProjectRegistered(_creator, 0, metadataURI);
    }

    /// @notice Store the tokenID for a project identified by creator and metadataURI
    function storeTokenID(string memory metadataURI, uint256 tokenID) external {
        require(tokenID != 0, "Invalid tokenID");
        require(_metadataURIsUsed[metadataURI], "Project does not exist yet");
        // Check that the project exists for msg.sender
        Project storage project = projects[metadataURI];
        require(project.creator == msg.sender, "You are not the creator of this project");
        require(project.tokenID == 0, "tokenID already set");
        console.log("Owner of token", hypercertToken.ownerOf(tokenID));
        require(hypercertToken.ownerOf(tokenID) == msg.sender, "You are not owner of tokenID or the tokenID does not exists");

        projects[metadataURI].tokenID = tokenID;

        emit ProjectRegistered(msg.sender, tokenID, metadataURI);
    }

    /// @notice Store the outputs of a project identified by metadataURI
    function recordOutputs(string memory metadataURI, string memory outputsURI) external {
        require(_metadataURIsUsed[metadataURI], "Project does not exist yet");

        // Access the project of msg.sender by metadataURI
        Project storage project = projects[metadataURI];
        require(project.creator == msg.sender, "You are not the creator of this project");
        // Check that tokenID has been stored (must be non-zero)
        require(project.tokenID != 0, "Project tokenID not set");

        // Check if outputs already stored to prevent overwriting
        require(bytes(project.outputsURI).length == 0, "Outputs already recorded");

        // Record the outputs URI
        project.outputsURI = outputsURI;

        emit OutputsRecorded(msg.sender, project.tokenID, metadataURI, outputsURI);
    }

    /// @notice Store the PoR of a project identified by metadataURI
    function recordProof(string memory metadataURI, string memory proofURI) external {
        require(_metadataURIsUsed[metadataURI], "Project does not exist");
        Project storage project = projects[metadataURI];
        require(project.creator != msg.sender, "You are creator of this project");
        require(project.proofs.length < maxPoRProject, "Max PoRs reached");
        require(!hasRecordedProof[metadataURI][msg.sender], "You have already recorded a proof for this project");

        project.proofs.push(ProofOfReproducibility({
            proofURI: proofURI,
            recorder: msg.sender,
            state: ProofState.PENDING
        }));

        userTotalPoRCount[msg.sender] += 1;
        userAvailablePoRCount[msg.sender] += 1;

        emit ProofRecorded(msg.sender, project.tokenID, metadataURI, proofURI);
    }

    // TODO Validate PoR
    // TODO Dispute PoR
    // TODO Vote PoR

    // TODO Funding 

    /// ---------------- GETTER FUNCTIONS ----------------------

    /// @notice Get array of user's projects metadataURIs
    function getUserMetadataURIs(address user) external view returns (string[] memory) {
        return userMetadataURIs[user];
    }

    /// @notice Get multiple projects
    function getAllProjects(uint256 start, uint256 count) external view returns (Project[] memory) {
        uint256 end = start + count;
        if (end > allMetadataURIs.length) {
            end = allMetadataURIs.length;
        }
        Project[] memory result = new Project[](end - start);
        for (uint256 i = start; i < end; i++) {
            result[i - start] = projects[allMetadataURIs[i]];
        }
        return result;
    }

    /// @notice Get project by metadataURI
    function getProject(string memory metadataURI) external view returns (Project memory) {
        require(_metadataURIsUsed[metadataURI], "Project does not exist");
        return projects[metadataURI];
    }
}
