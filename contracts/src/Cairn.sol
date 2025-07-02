// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "./interfaces/IHypercertToken.sol";
import "forge-std/console.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";

contract Cairn is Ownable {
    IHypercertToken public hypercertToken;
    
    uint8 public minRequiredPoR;
    uint8 public maxPoRProject;
    uint256 public disputeWindowPoR;

    struct Project {
        address creator; 
        uint256 tokenID;
        string projectURI;
        string outputsURI;
        string[] proofs;

        // TODO FUNDERS: addr => amount
    }

    struct ProofOfReproducibility {
        string proofURI;       // IPFS URI of the proof metadata
        string projectURI;     // IPFS URI to the project metadata (plus ID)
        address recorder;      // Who recorded the proof
        uint256 recordedAt;    // Timestamp when recorded
        bool dispute;          // If PoR is disputed for validity
        string disputeURI;     // IPFS URI of the dispute metadata        
    }

    string[] public allProjectURIs; 
    mapping(string => Project) public projects; 
    mapping(address => string[]) public userProjectURIs;
    mapping(string => bool) private _projectURIsUsed;

    string[] public allProofURIs; 
    mapping(string => ProofOfReproducibility) public proofs; 
    mapping(address => string[]) public userProofURIs;
    mapping(string => bool) private _proofURIsUsed;
    mapping(string => mapping(address => bool)) private hasRecordedProof;


    event ProjectRegistered(address indexed creator, uint256 indexed tokenID, string projectURI);
    event OutputsRecorded(address indexed creator, uint256 indexed tokenID, string projectURI, string outputsURI);
    event ProofRecorded(address indexed creator, uint256 indexed tokenID, string projectURI, string proofURI);
    event ProofDisputed(address indexed disputer, string indexed proofURI, string disputeURI);


    constructor(address _hypercertToken, uint8 _minRequiredPoR, uint8 _maxPoRProject, uint256 _disputeWindowPoR) Ownable(msg.sender) {
        hypercertToken = IHypercertToken(_hypercertToken);
        minRequiredPoR = _minRequiredPoR;
        maxPoRProject = _maxPoRProject;
        disputeWindowPoR = _disputeWindowPoR;
    }


    /// ---------------- SETTER FUNCTIONS ----------------------

    /// @notice Register a new project with unique projectURI globally
    function registerProject(string memory projectURI) external {
        require(!_projectURIsUsed[projectURI], "Metadata URI already used globally");

        uint256 availablePoRs = getUserAvailablePoRCount(msg.sender);
        require(availablePoRs >= minRequiredPoR, "Not enough available PoRs to register project");

        // Project struct init
        Project storage project = projects[projectURI];
        project.creator = msg.sender;
        project.tokenID = 0;
        project.projectURI = projectURI;
        project.outputsURI = "";

        userProjectURIs[msg.sender].push(projectURI);
        allProjectURIs.push(projectURI);
        _projectURIsUsed[projectURI] = true;

        emit ProjectRegistered(msg.sender, 0, projectURI);
    }

    function initProject(string memory projectURI, address _creator) external onlyOwner {
        require(_creator != address(0), "Invalid creator address");
        require(!_projectURIsUsed[projectURI], "Metadata URI already used");
        
        Project storage project = projects[projectURI];
        project.creator = _creator;
        project.tokenID = 0;
        project.projectURI = projectURI;
        project.outputsURI = "";

        userProjectURIs[_creator].push(projectURI);
        allProjectURIs.push(projectURI);
        _projectURIsUsed[projectURI] = true;

        emit ProjectRegistered(_creator, 0, projectURI);
    }

    /// @notice Store the tokenID for a project identified by creator and projectURI
    function storeTokenID(string memory projectURI, uint256 tokenID) external {
        require(tokenID != 0, "Invalid tokenID");
        require(_projectURIsUsed[projectURI], "Project does not exist yet");
        // Check that the project exists for msg.sender
        Project storage project = projects[projectURI];
        require(project.creator == msg.sender, "You are not the creator of this project");
        require(project.tokenID == 0, "tokenID already set");
        console.log("Owner of token", hypercertToken.ownerOf(tokenID));
        require(hypercertToken.ownerOf(tokenID) == msg.sender, "You are not owner of tokenID or the tokenID does not exists");

        project.tokenID = tokenID;

        emit ProjectRegistered(msg.sender, tokenID, projectURI);
    }

    /// @notice Store the outputs of a project identified by projectURI
    function recordOutputs(string memory projectURI, string memory outputsURI) external {
        require(_projectURIsUsed[projectURI], "Project does not exist yet");

        // Access the project of msg.sender by projectURI
        Project storage project = projects[projectURI];
        require(project.creator == msg.sender, "You are not the creator of this project");
        // Check that tokenID has been stored (must be non-zero)
        require(project.tokenID != 0, "Project tokenID not set");

        // Check if outputs already stored to prevent overwriting
        require(bytes(project.outputsURI).length == 0, "Outputs already recorded");

        // Record the outputs URI
        project.outputsURI = outputsURI;

        emit OutputsRecorded(msg.sender, project.tokenID, projectURI, outputsURI);
    }

    /// @notice Store the PoR of a project identified by projectURI
    function recordProof(string memory projectURI, string memory proofURI) external {
        require(_projectURIsUsed[projectURI], "Project does not exist");
        require(!_proofURIsUsed[proofURI], "Proof URI already used");

        Project storage project = projects[projectURI];
        require(bytes(project.outputsURI).length != 0, "Outputs are not yet recorded");
        require(project.creator != msg.sender, "You are creator of this project");
        require(project.proofs.length < maxPoRProject, "Max PoRs reached");
        require(!hasRecordedProof[projectURI][msg.sender], "You have already recorded a proof for this project");
        require(bytes(proofURI).length > 0, "Invalid proof URI");

        // Create and store proof
        proofs[proofURI] = ProofOfReproducibility({
            proofURI: proofURI,
            projectURI: projectURI,
            recorder: msg.sender,
            dispute: false,
            recordedAt: block.timestamp,
            disputeURI: ""
        });

        project.proofs.push(proofURI);
        userProofURIs[msg.sender].push(proofURI);
        _proofURIsUsed[proofURI] = true;
        hasRecordedProof[projectURI][msg.sender] = true;

        emit ProofRecorded(msg.sender, project.tokenID, projectURI, proofURI);
    }

    /// @notice Dispute the PoR
    function disputeProof(string memory proofURI, string memory disputeURI) external {
        require(_proofURIsUsed[proofURI], "Proof does not exist");
        require(bytes(disputeURI).length > 0, "Dispute URI cannot be empty");

        ProofOfReproducibility storage proof = proofs[proofURI];

        require(!proof.dispute, "Proof already disputed");

        proof.dispute = true;
        proof.disputeURI = disputeURI;

        emit ProofDisputed(msg.sender, proofURI, disputeURI);
    }

    /// @notice Resolve dispute - currently admin can call this
    /// TODO - DAO voting + better coordination mechanism
    function resolveDispute(string memory proofURI) external onlyOwner {
        require(_proofURIsUsed[proofURI], "Proof does not exist");

        ProofOfReproducibility storage proof = proofs[proofURI];
        require(proof.dispute, "Proof is not disputed");

        proof.dispute = false;
        proof.disputeURI = "";

        emit ProofDisputed(address(0), proofURI, "");
    }

    // TODO Funding 

    /// ---------------- GETTER FUNCTIONS ----------------------

    /// @notice Get array of user's projects projectURIs
    function getUserProjectURIs(address user) external view returns (string[] memory) {
        return userProjectURIs[user];
    }

    /// @notice Get multiple projects
    function getAllProjects(uint256 start, uint256 count) external view returns (Project[] memory) {
        uint256 end = start + count;
        if (end > allProjectURIs.length) {
            end = allProjectURIs.length;
        }
        Project[] memory result = new Project[](end - start);
        for (uint256 i = start; i < end; i++) {
            result[i - start] = projects[allProjectURIs[i]];
        }
        return result;
    }

    /// @notice Get project by projectURI
    function getProject(string memory projectURI) external view returns (Project memory) {
        require(_projectURIsUsed[projectURI], "Project does not exist");
        return projects[projectURI];
    }

    /// @notice Get proof details by proofURI
    function getProof(string memory proofURI) external view returns (ProofOfReproducibility memory) {
        require(_proofURIsUsed[proofURI], "Proof does not exist");
        return proofs[proofURI];
    }

    /// @notice Get all proof URIs for a project
    function getProofURIsByProject(string memory projectURI) external view returns (string[] memory) {
        require(_projectURIsUsed[projectURI], "Project does not exist");
        return projects[projectURI].proofs;
    }

    /// @notice Get all proof URIs recorded by a user
    function getUserProofURIs(address user) external view returns (string[] memory) {
        return userProofURIs[user];
    }

    /// @notice Check if a proof is valid (not disputed and dispute window passed)
    function isProofValid(string memory proofURI) public view returns (bool) {
        require(_proofURIsUsed[proofURI], "Proof does not exist");
        ProofOfReproducibility storage proof = proofs[proofURI];
        if (proof.dispute) return false;
        if (block.timestamp < proof.recordedAt + disputeWindowPoR) return false;
        return true;
    }

    /// @notice Get count of available valid PoRs for a user
    function getUserAvailablePoRCount(address user) public view returns (uint256 count) {
        string[] storage userProofs = userProofURIs[user];
        count = 0;
        for (uint256 i = 0; i < userProofs.length; i++) {
            if (isProofValid(userProofs[i])) {
                count++;
            }
        }
    }
}
