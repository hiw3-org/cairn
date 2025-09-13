// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "openzeppelin-contracts/contracts/access/Ownable.sol";
import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";


contract Cairn is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public paymentToken;
    address public impactAssetToken;

    address public funder;
    address public cairnDAO;
    uint256 public fundingAmount;
  
	uint256 public submissionDeadline;    
	uint256 public evaluationDeadline;    
	uint256 public distributionDeadline;

    uint256 public totalFundedProjects;


    struct Project {
        address creator;                // Who created the project
        string projectCID;              // Filecoin CID of the project metadata
        string porCID;                  // CID of the PoR metadata
        uint256 score;                  // Impact score of the project
        uint256 fundsReceived;          // Amount of funds received
    }

    
    string[] public allProjectCIDs; 
    mapping(string => Project) public projects;  


    event ProjectSubmitted(address indexed creator, string projectCID);
    event PoRSubmitted(address indexed creator, string projectCID, string porCID);
    event ProjectEvaluated(string projectCID, uint256 score);
    event FundsDistributed(string projectCID, uint256 amount);
    event ImpactAssetMinted(address indexed to);


    constructor(address _paymentToken, address _impactAssetToken, address _funder, address _cairnDAO, uint256 _submissionDeadline, uint256 _evaluationDeadline, uint256 _distributionDeadline) Ownable(msg.sender) {
        paymentToken = IERC20(_paymentToken);
        impactAssetToken = _impactAssetToken;
        funder = _funder;
        cairnDAO = _cairnDAO;
        submissionDeadline = _submissionDeadline;
        evaluationDeadline = _evaluationDeadline;
        distributionDeadline = _distributionDeadline;
    }

    /// ---------------- MODIFIERS ----------------------

    /// @notice Modifier to check if the current time is before the submission deadline
    modifier onlyBeforeSubmissionDeadline() {
        require(block.timestamp < submissionDeadline, "Action not allowed after submission deadline");
        _;
    }

    /// @notice Modifier to check if the current time is after the submission deadline
    modifier onlyAfterSubmissionDeadline() {
        require(block.timestamp >= submissionDeadline, "Action allowed only after submission deadline");
        _;
    }

    /// @notice Modifier to check if the current time is before the evaluation deadline
    modifier onlyBeforeEvaluationDeadline() {
        require(block.timestamp < evaluationDeadline, "Action not allowed after evaluation deadline");
        _;
    }

    /// @notice Modifier to check if the current time is after the evaluation deadline
    modifier onlyAfterEvaluationDeadline() {
        require(block.timestamp >= evaluationDeadline, "Action allowed only after evaluation deadline");
        _;
    }   

    /// @notice Modifier to check if the current time is before the distribution deadline
    modifier onlyBeforeDistributionDeadline() {
        require(block.timestamp < distributionDeadline, "Action not allowed after distribution deadline");
        _;
    }

    /// @notice Modifier to check if the current time is after the distribution deadline
    modifier onlyAfterDistributionDeadline() {
        require(block.timestamp >= distributionDeadline, "Action allowed only after distribution deadline");
        _;
    }

    /// @notice Modifier to check if msg.sender is cairnDAO
    modifier onlyCairnDAO() {
        require(msg.sender == cairnDAO, "Only Cairn DAO can perform this action");
        _;
    }


    /// ---------------- SETTER FUNCTIONS ----------------------

    /// @notice Fund round
    function fundRound(uint256 _amount, uint256 _totalFundedProjects) external {
        require(msg.sender == funder, "Only funder can fund the round");
        require(_amount > 0, "Funding amount must be greater than 0");
        require(fundingAmount == 0, "Round already funded");
        require(_totalFundedProjects > 0, "Total funded projects must be greater than 0");
        
        uint256 allowance = paymentToken.allowance(msg.sender, address(this));
        require(allowance >= _amount, "Insufficient token allowance");
        
        paymentToken.safeTransferFrom(msg.sender, address(this), _amount);
        
        totalFundedProjects = _totalFundedProjects;
        fundingAmount = _amount;
    }

    /// @notice Register a new research project for funding
    function submitResearchProject(string memory projectCID, address projectCreator) external onlyCairnDAO onlyBeforeSubmissionDeadline {
        require(bytes(projectCID).length > 0, "Project CID cannot be empty");
        require(projects[projectCID].creator == address(0), "Project CID already used");
        require(projectCreator != address(0), "Invalid project creator address");

        // Create new project
        projects[projectCID] = Project({
            creator: projectCreator,
            projectCID: projectCID,
            porCID: "",
            score: 0,
            fundsReceived: 0
        });

        allProjectCIDs.push(projectCID);

        emit ProjectSubmitted(projectCreator, projectCID);
    }

    /// @notice Submit proof of reproducibility for a project
    function submitProofOfReproducibility(string memory projectCID, string memory porCID) external onlyCairnDAO onlyBeforeSubmissionDeadline {
        require(bytes(projectCID).length > 0, "Project CID cannot be empty");
        require(projects[projectCID].creator != address(0), "Project does not exist");
        require(bytes(porCID).length > 0, "PoR CID cannot be empty");
        require(bytes(projects[projectCID].porCID).length == 0, "PoR already submitted");

        projects[projectCID].porCID = porCID;

        emit PoRSubmitted(msg.sender, projectCID, porCID);
    }

    /// @notice Evaluate a project and assign an impact score
    function evaluateProject(string memory projectCID, uint256 score) external onlyCairnDAO onlyBeforeEvaluationDeadline onlyAfterSubmissionDeadline {
        require(bytes(projectCID).length > 0, "Project CID cannot be empty");
        require(projects[projectCID].creator != address(0), "Project does not exist");
        require(score > 0, "Score must be greater than 0");

        projects[projectCID].score = score;

        emit ProjectEvaluated(projectCID, score);
    }

    /// @notice Distribute funds to a project based on its CID
    function distributeFunds(string memory projectCID, uint256 _amount) external onlyCairnDAO onlyBeforeDistributionDeadline onlyAfterEvaluationDeadline {
        require(fundingAmount > 0, "No funds to distribute");
        require(bytes(projectCID).length > 0, "Project CID cannot be empty");
        require(projects[projectCID].creator != address(0), "Project does not exist");
        require(_amount > 0, "Amount must be greater than 0");
        require(_amount <= fundingAmount, "Amount exceeds available funding");

        paymentToken.safeTransfer(projects[projectCID].creator, _amount);

        projects[projectCID].fundsReceived += _amount;
        fundingAmount -= _amount;

        emit FundsDistributed(projectCID, _amount);
    }

    /// @notice Mint NFT token (impact asset) for the funder
    /// @dev This contract should be able to mint the NFT token
    function mintImpactAsset() external onlyAfterDistributionDeadline {
        require(msg.sender == funder, "Only funder can mint impact assets");

        // mint NFT to funder
        (bool success, ) = impactAssetToken.call(
            abi.encodeWithSignature("mint(address)", funder)
        );
        require(success, "NFT minting failed");

        emit ImpactAssetMinted(funder);
    }

    /// ---------------- GETTER FUNCTIONS ----------------------

    /// @notice Get array of submitted projects by user
    function getAllSubmittedProjects(address user) external view returns (string[] memory) {
        // Count projects first
        uint256 userProjectCount = 0;
        for (uint256 i = 0; i < allProjectCIDs.length; i++) {
            if (projects[allProjectCIDs[i]].creator == user) {
                userProjectCount++;
            }
        }
        
        // Create properly sized array
        string[] memory result = new string[](userProjectCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allProjectCIDs.length; i++) {
            if (projects[allProjectCIDs[i]].creator == user) {
                result[index] = allProjectCIDs[i];
                index++;
            }
        }
        
        return result;
    }

    /// @notice Get project details by CID
    function getProject(string memory projectCID) external view returns (Project memory) {
        require(projects[projectCID].creator != address(0), "Project does not exist");
        return projects[projectCID];
    }

    /// @notice Get all project CIDs
    function getAllProjectCIDs() external view returns (string[] memory) {
        return allProjectCIDs;
    }

    /// @notice Get total number of submitted projects
    function getTotalProjects() external view returns (uint256) {
        return allProjectCIDs.length;
    }

    /// @notice Check if project has PoR submitted
    function hasProofOfReproducibility(string memory projectCID) external view returns (bool) {
        return bytes(projects[projectCID].porCID).length > 0;
    }

    /// @notice Get remaining funding amount
    function getRemainingFunds() external view returns (uint256) {
        return fundingAmount;
    }

    /// ---------------- ADMIN FUNCTIONS ----------------------

    /// @notice Emergency withdraw function for owner
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = paymentToken.balanceOf(address(this));
        if (balance > 0) {
            paymentToken.safeTransfer(owner(), balance);
        }
    }

    /// @notice Update deadlines (only owner, only before they pass)
    function updateDeadlines(uint256 _submissionDeadline, uint256 _evaluationDeadline, uint256 _distributionDeadline) external onlyOwner {
        require(_submissionDeadline > block.timestamp, "Submission deadline must be in future");
        require(_evaluationDeadline > _submissionDeadline, "Evaluation must be after submission");
        require(_distributionDeadline > _evaluationDeadline, "Distribution must be after evaluation");
        
        submissionDeadline = _submissionDeadline;
        evaluationDeadline = _evaluationDeadline;
        distributionDeadline = _distributionDeadline;
    }
}
