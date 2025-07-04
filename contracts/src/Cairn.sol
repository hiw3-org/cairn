// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "./interfaces/IHypercertToken.sol";
import "forge-std/console.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Cairn is Ownable {
    using SafeERC20 for IERC20;

    IHypercertToken public hypercertToken;
    IERC20 public paymentToken;
    
    uint8 public minRequiredPoR;
    uint8 public maxPoRProject;
    uint256 public disputeWindowPoR;

    enum Impact {
        NONE,      // No impact
        LOW,       // Low impact
        MEDIUM,    // Medium impact
        HIGH       // High impact
    }


    struct Project {
        address creator;                // Who created the project
        uint256 typeID;                 // Hypercert type ID for this project
        uint256[] tokenIDs;             // Array of token IDs (fractions) for this project
        string projectURI;              // IPFS URI of the project metadata
        string outputsURI;              // IPFS URI of the outputs metadata
        string[] proofs;                // Array of PoR URIs
        Impact impact;                  // Impact level of the project
        address funder;                 // Address of the funder for this project
        uint256 fundingGoal;            // Funding goal for the project (if applicable)
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

    // Funding related
    mapping(Impact => uint256) public maxFundingForImpact;

    event ProjectRegistered(address indexed creator, uint256 indexed typeID, string projectURI);
    event OutputsRecorded(address indexed creator, uint256 indexed typeID, string projectURI, string outputsURI);
    event ProofRecorded(address indexed creator, uint256 indexed typeID, string projectURI, string proofURI);
    event ProofDisputed(address indexed disputer, string indexed proofURI, string disputeURI);


    constructor(address _hypercertToken, address _paymentToken, uint8 _minRequiredPoR, uint8 _maxPoRProject, uint256 _disputeWindowPoR, uint256 _maxFundingLow, uint256 _maxFundingMedium, uint256 _maxFundingHigh) Ownable(msg.sender) {
        hypercertToken = IHypercertToken(_hypercertToken);
        paymentToken = IERC20(_paymentToken);
        minRequiredPoR = _minRequiredPoR;
        maxPoRProject = _maxPoRProject;
        disputeWindowPoR = _disputeWindowPoR;
        maxFundingForImpact[Impact.LOW] = _maxFundingLow;
        maxFundingForImpact[Impact.MEDIUM] = _maxFundingMedium;
        maxFundingForImpact[Impact.HIGH] = _maxFundingHigh;
    }


    /// ---------------- SETTER FUNCTIONS ----------------------

    /// @notice Register a new project with unique projectURI globally
    function registerProject(string memory projectURI, uint256 tokenID, uint256 unitPrice) external {
        require(!_projectURIsUsed[projectURI], "Metadata URI already in use");
        uint256 availablePoRs = getUserAvailablePoRCount(msg.sender);
        require(availablePoRs >= minRequiredPoR, "Not enough available PoRs to register project");
        require(hypercertToken.ownerOf(tokenID) == msg.sender, "You are not owner of tokenID or the tokenID does not exists");
        require(hypercertToken.isApprovedForAll(msg.sender, address(this)), "You must set allowance for transfer of impact assets");

        // Project struct init
        Project storage project = projects[projectURI];
        project.creator = msg.sender;
        project.typeID = tokenID >> 128 << 128;    
        project.tokenIDs.push(tokenID);
        project.projectURI = projectURI;
        project.outputsURI = "";
        project.impact = Impact.NONE;
        project.fundingGoal = hypercertToken.unitsOf(tokenID) * unitPrice;
        project.funder = address(0);

        userProjectURIs[msg.sender].push(projectURI);
        allProjectURIs.push(projectURI);
        _projectURIsUsed[projectURI] = true;

        emit ProjectRegistered(msg.sender, 0, projectURI);
    }

    /// @notice Initialize a project with a given projectURI and creator (admin only). Does not set tokenIDs or outputs.
    function initProject(string memory projectURI, address _creator) external onlyOwner {
        require(_creator != address(0), "Invalid creator address");
        require(!_projectURIsUsed[projectURI], "Metadata URI already used");
        
        Project storage project = projects[projectURI];
        project.creator = _creator;
        project.typeID = 0;
        delete project.tokenIDs;
        project.projectURI = projectURI;
        project.outputsURI = "";
        project.impact = Impact.NONE;
        project.fundingGoal = 0;
        project.funder = address(0);

        userProjectURIs[_creator].push(projectURI);
        allProjectURIs.push(projectURI);
        _projectURIsUsed[projectURI] = true;

        emit ProjectRegistered(_creator, 0, projectURI);
    }

    /// @notice Store tokenIDs for initial project
    function storeTokenIDInit(string memory projectURI, uint256 tokenID, uint256 unitPrice) external {
        require(_projectURIsUsed[projectURI], "Project does not exist yet");
        Project storage project = projects[projectURI];
        require(project.typeID == 0, "Project typeID already set");
        // Check if the user is actually the owner of the tokenID
        require(hypercertToken.ownerOf(tokenID) == msg.sender, "You are not the owner of this tokenID");
        
        // Check if the user has set allowance for transfer of the impact assets
        require(hypercertToken.isApprovedForAll(msg.sender, address(this)), "You must set allowance for transfer of impact assets");

        project.fundingGoal = hypercertToken.unitsOf(tokenID) * unitPrice;
        project.typeID = tokenID >> 128 << 128;   
        project.tokenIDs.push(tokenID);
    }

    /// @notice Store additional tokenIDs for a project identified by projectURI
    function storeTokenID(string memory projectURI, uint256 tokenID) external {
        require(tokenID != 0, "Invalid tokenID");
        require(_projectURIsUsed[projectURI], "Project does not exist yet");
        // Access the project of msg.sender by projectURI
        Project storage project = projects[projectURI];
        // Check that typeID has been stored (must be non-zero)
        require(project.typeID != 0, "Project typeID not set"); 
        // Check if tokenID already stored to prevent overwriting
        for (uint256 i = 0; i < project.tokenIDs.length; i++) {
            require(project.tokenIDs[i] != tokenID, "Token ID already stored for this project");
        }
        // Check if the user is actually the owner of the tokenID
        require(hypercertToken.ownerOf(tokenID) == msg.sender, "You are not the owner of this tokenID");
        // Check if tokenID have the same typeID as the project
        require(tokenID >> 128 << 128 == project.typeID, "Token ID type does not match project typeID");
        
        // Check if the user has set allowance for transfer of the impact assets
        require(hypercertToken.isApprovedForAll(msg.sender, address(this)), "You must set allowance for transfer of impact assets");

        // Store the tokenID
        project.tokenIDs.push(tokenID);
    }


    /// @notice Store the outputs of a project identified by projectURI
    function recordOutputs(string memory projectURI, string memory outputsURI) external {
        require(_projectURIsUsed[projectURI], "Project does not exist yet");

        // Access the project of msg.sender by projectURI
        Project storage project = projects[projectURI];
        require(project.creator == msg.sender, "You are not the creator of this project");
        // Check that typeID has been stored (must be non-zero)
        require(project.typeID != 0, "Project typeID not set");

        // Check if outputs already stored to prevent overwriting
        require(bytes(project.outputsURI).length == 0, "Outputs already recorded");

        // Record the outputs URI
        project.outputsURI = outputsURI;

        emit OutputsRecorded(msg.sender, project.typeID, projectURI, outputsURI);
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

        emit ProofRecorded(msg.sender, project.typeID, projectURI, proofURI);
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

    /// @notice Set impact level for a project; only if minimum PoRs reached
    function setProjectImpact(string memory projectURI, Impact impactLevel) external onlyOwner {
        require(_projectURIsUsed[projectURI], "Project does not exist");
        require(impactLevel != Impact.NONE, "Impact cannot be NONE");
        Project storage project = projects[projectURI];
        require(project.impact == Impact.NONE, "Impact already set");

        // Count valid PoRs for this project
        uint256 validPoRs = 0;
        for (uint256 i = 0; i < project.proofs.length; i++) {
            string memory proofURI = project.proofs[i];
            if (isProofValid(proofURI)) {
                validPoRs++;
            }
        }

        require(validPoRs >= minRequiredPoR, "Not enough valid PoRs to set impact");

        project.impact = impactLevel;
        if (project.fundingGoal > maxFundingForImpact[impactLevel]) {
            project.fundingGoal = maxFundingForImpact[impactLevel];
        }
    }

    /// @notice Fund a project with a specific funding ID
    function fundProject(uint256 amount, string memory projectURI) external {
        require(_projectURIsUsed[projectURI], "Project does not exist");
        require(amount > 0, "Funding amount must be greater than zero");
        require(paymentToken.allowance(msg.sender, address(this)) >= amount, "Insufficient allowance");

        Project storage project = projects[projectURI];
        require(project.proofs.length >= minRequiredPoR, "Not enough PoRs for funding");
        require(project.impact != Impact.NONE, "Impact must be set");
        require(project.funder == address(0), "Project already funded by another user");
        require(maxFundingForImpact[project.impact] >= amount, "Funding amount exceeds the allowed");
        require(project.fundingGoal > 0, "Funding goal must be set for the project");
        require(amount == project.fundingGoal, "Funding amount must equal funding goal");

        // Calculate total units
        uint256 totalUnits = 0;
        for (uint256 i = 0; i < project.tokenIDs.length; i++) {
            uint256 tokenID = project.tokenIDs[i];
            totalUnits += hypercertToken.unitsOf(tokenID);
        }
        require(totalUnits > 0, "No units in project");       

        // Transfer the full amount to the contract first
        paymentToken.safeTransferFrom(msg.sender, address(this), amount);

        // Distribute funds to each impact asset owner proportionally
        uint256 distributed = 0;
        uint256 actuallyDistributed = 0;
        for (uint256 i = 0; i < project.tokenIDs.length; i++) {
            uint256 tokenID = project.tokenIDs[i];
            address owner = hypercertToken.ownerOf(tokenID);
            uint256 units = hypercertToken.unitsOf(tokenID);

            uint256 share = (amount * units) / totalUnits;

            // For the last owner, send the remainder to avoid rounding issues
            if (i == project.tokenIDs.length - 1) {
                share = amount - distributed;
            }

            if (share > 0) {
                if (hypercertToken.isApprovedForAll(owner, address(this))) {
                    hypercertToken.safeTransferFrom(owner, msg.sender, tokenID, 1, ""); 
                    paymentToken.safeTransfer(owner, share);                    
                    actuallyDistributed += share;
                }   
                distributed += share;             
            }
        }
        if (amount - actuallyDistributed > 0) {
            paymentToken.safeTransfer(msg.sender, amount - actuallyDistributed);
        }
        project.funder = msg.sender;
    }

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
        return count;
    }
}
