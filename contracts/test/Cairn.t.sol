// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/Cairn.sol";
import "../src/ImpactAssetToken.sol";
import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

// Mock ERC20 token for testing
contract MockERC20 is ERC20 {
    constructor() ERC20("Mock Token", "MOCK") {
        _mint(msg.sender, 1000000 * 10**18); // Mint 1M tokens
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract CairnTest is Test {
    Cairn public cairn;
    MockERC20 public paymentToken;
    ImpactAssetToken public impactAssetToken;

    address public owner;
    address public funder;
    address public cairnDAO;
    address public scientist1;
    address public scientist2;

    uint256 public submissionDeadline;
    uint256 public evaluationDeadline;
    uint256 public distributionDeadline;

    uint256 constant FUNDING_AMOUNT = 100000 * 10**18; // 100k tokens
    uint256 constant TOTAL_FUNDED_PROJECTS = 5;

    event ProjectSubmitted(address indexed creator, string projectCID);
    event PoRSubmitted(address indexed creator, string projectCID, string porCID);
    event ProjectEvaluated(string projectCID, uint256 score);
    event FundsDistributed(string projectCID, uint256 amount);
    event ImpactAssetMinted(address indexed to);

    function setUp() public {
        // Set up test addresses
        owner = address(this);
        funder = makeAddr("funder");
        cairnDAO = makeAddr("cairnDAO");
        scientist1 = makeAddr("scientist1");
        scientist2 = makeAddr("scientist2");

        // Set up deadlines (1 hour intervals for testing)
        submissionDeadline = block.timestamp + 1 hours;
        evaluationDeadline = submissionDeadline + 1 hours;
        distributionDeadline = evaluationDeadline + 1 hours;

        // Deploy mock contracts
        paymentToken = new MockERC20();
        impactAssetToken = new ImpactAssetToken(
            "Cairn Impact Asset", 
            "CIA", 
            address(this) // Test contract as initial owner
        );

        // Deploy Cairn contract
        cairn = new Cairn(
            address(paymentToken),
            address(impactAssetToken),
            funder,
            cairnDAO,
            submissionDeadline,
            evaluationDeadline,
            distributionDeadline
        );

        // Add Cairn contract as allowed minter for the NFT
        impactAssetToken.addAllowedMinter(address(cairn));

        // Mint tokens to funder for testing
        paymentToken.mint(funder, FUNDING_AMOUNT);

        // Approve Cairn contract to spend funder's tokens
        vm.prank(funder);
        paymentToken.approve(address(cairn), FUNDING_AMOUNT);
    }

    function testInitialState() view public {
        assertEq(address(cairn.paymentToken()), address(paymentToken));
        assertEq(address(cairn.impactAssetToken()), address(impactAssetToken));
        assertEq(cairn.funder(), funder);
        assertEq(cairn.cairnDAO(), cairnDAO);
        assertEq(cairn.fundingAmount(), 0);
        assertEq(cairn.totalFundedProjects(), 0);
        assertEq(cairn.submissionDeadline(), submissionDeadline);
        assertEq(cairn.evaluationDeadline(), evaluationDeadline);
        assertEq(cairn.distributionDeadline(), distributionDeadline);
    }

    // ============ FUNDING ROUND TESTS ============

    function testFundRoundSuccess() public {
        vm.prank(funder);
        cairn.fundRound(FUNDING_AMOUNT, TOTAL_FUNDED_PROJECTS);

        assertEq(cairn.fundingAmount(), FUNDING_AMOUNT);
        assertEq(cairn.totalFundedProjects(), TOTAL_FUNDED_PROJECTS);
        assertEq(paymentToken.balanceOf(address(cairn)), FUNDING_AMOUNT);
    }

    function testFundRoundOnlyFunder() public {
        vm.prank(scientist1);
        vm.expectRevert("Only funder can fund the round");
        cairn.fundRound(FUNDING_AMOUNT, TOTAL_FUNDED_PROJECTS);
    }

    function testFundRoundZeroAmount() public {
        vm.prank(funder);
        vm.expectRevert("Funding amount must be greater than 0");
        cairn.fundRound(0, TOTAL_FUNDED_PROJECTS);
    }

    function testFundRoundAlreadyFunded() public {
        vm.prank(funder);
        cairn.fundRound(FUNDING_AMOUNT, TOTAL_FUNDED_PROJECTS);

        vm.prank(funder);
        vm.expectRevert("Round already funded");
        cairn.fundRound(FUNDING_AMOUNT, TOTAL_FUNDED_PROJECTS);
    }

    function testFundRoundZeroProjects() public {
        vm.prank(funder);
        vm.expectRevert("Total funded projects must be greater than 0");
        cairn.fundRound(FUNDING_AMOUNT, 0);
    }

    function testFundRoundInsufficientAllowance() public {
        vm.prank(funder);
        paymentToken.approve(address(cairn), FUNDING_AMOUNT - 1);

        vm.prank(funder);
        vm.expectRevert("Insufficient token allowance");
        cairn.fundRound(FUNDING_AMOUNT, TOTAL_FUNDED_PROJECTS);
    }

    // ============ PROJECT SUBMISSION TESTS ============

    function testSubmitResearchProjectSuccess() public {
        vm.prank(cairnDAO);
        vm.expectEmit(true, false, false, true);
        emit ProjectSubmitted(scientist1, "QmTestCID1");
        cairn.submitResearchProject("QmTestCID1", scientist1);

        (address creator, string memory projectCID, string memory porCID, uint256 score, uint256 fundsReceived) = cairn.projects("QmTestCID1");
        assertEq(creator, scientist1);
        assertEq(projectCID, "QmTestCID1");
        assertEq(porCID, "");
        assertEq(score, 0);
        assertEq(fundsReceived, 0);

        string[] memory allCIDs = cairn.getAllProjectCIDs();
        assertEq(allCIDs.length, 1);
        assertEq(allCIDs[0], "QmTestCID1");
    }

    function testSubmitResearchProjectOnlyCairnDAO() public {
        vm.prank(scientist1);
        vm.expectRevert("Only Cairn DAO can perform this action");
        cairn.submitResearchProject("QmTestCID1", scientist1);
    }

    function testSubmitResearchProjectEmptyCID() public {
        vm.prank(cairnDAO);
        vm.expectRevert("Project CID cannot be empty");
        cairn.submitResearchProject("", scientist1);
    }

    function testSubmitResearchProjectDuplicateCID() public {
        vm.prank(cairnDAO);
        cairn.submitResearchProject("QmTestCID1", scientist1);

        vm.prank(cairnDAO);
        vm.expectRevert("Project CID already used");
        cairn.submitResearchProject("QmTestCID1", scientist2);
    }

    function testSubmitResearchProjectInvalidCreator() public {
        vm.prank(cairnDAO);
        vm.expectRevert("Invalid project creator address");
        cairn.submitResearchProject("QmTestCID1", address(0));
    }

    function testSubmitResearchProjectAfterDeadline() public {
        vm.warp(submissionDeadline + 1);

        vm.prank(cairnDAO);
        vm.expectRevert("Action not allowed after submission deadline");
        cairn.submitResearchProject("QmTestCID1", scientist1);
    }

    // ============ PROOF OF REPRODUCIBILITY TESTS ============

    function testSubmitProofOfReproducibilitySuccess() public {
        // First submit a project
        vm.prank(cairnDAO);
        cairn.submitResearchProject("QmTestCID1", scientist1);

        vm.prank(cairnDAO);
        vm.expectEmit(true, false, false, true);
        emit PoRSubmitted(cairnDAO, "QmTestCID1", "QmPoRCID1");
        cairn.submitProofOfReproducibility("QmTestCID1", "QmPoRCID1");

        (, , string memory porCID, ,) = cairn.projects("QmTestCID1");
        assertEq(porCID, "QmPoRCID1");
        assertTrue(cairn.hasProofOfReproducibility("QmTestCID1"));
    }

    function testSubmitProofOfReproducibilityProjectNotExists() public {
        vm.prank(cairnDAO);
        vm.expectRevert("Project does not exist");
        cairn.submitProofOfReproducibility("QmNonExistent", "QmPoRCID1");
    }

    function testSubmitProofOfReproducibilityEmptyPorCID() public {
        vm.prank(cairnDAO);
        cairn.submitResearchProject("QmTestCID1", scientist1);

        vm.prank(cairnDAO);
        vm.expectRevert("PoR CID cannot be empty");
        cairn.submitProofOfReproducibility("QmTestCID1", "");
    }

    function testSubmitProofOfReproducibilityAlreadySubmitted() public {
        vm.prank(cairnDAO);
        cairn.submitResearchProject("QmTestCID1", scientist1);

        vm.prank(cairnDAO);
        cairn.submitProofOfReproducibility("QmTestCID1", "QmPoRCID1");

        vm.prank(cairnDAO);
        vm.expectRevert("PoR already submitted");
        cairn.submitProofOfReproducibility("QmTestCID1", "QmPoRCID2");
    }

    // ============ PROJECT EVALUATION TESTS ============

    function testEvaluateProjectSuccess() public {
        // Submit project first
        vm.prank(cairnDAO);
        cairn.submitResearchProject("QmTestCID1", scientist1);

        // Move to evaluation period
        vm.warp(submissionDeadline + 1);

        vm.prank(cairnDAO);
        vm.expectEmit(false, false, false, true);
        emit ProjectEvaluated("QmTestCID1", 85);
        cairn.evaluateProject("QmTestCID1", 85);

        (, , , uint256 score,) = cairn.projects("QmTestCID1");
        assertEq(score, 85);
    }

    function testEvaluateProjectBeforeSubmissionDeadline() public {
        vm.prank(cairnDAO);
        cairn.submitResearchProject("QmTestCID1", scientist1);

        vm.prank(cairnDAO);
        vm.expectRevert("Action allowed only after submission deadline");
        cairn.evaluateProject("QmTestCID1", 85);
    }

    function testEvaluateProjectAfterEvaluationDeadline() public {
        vm.prank(cairnDAO);
        cairn.submitResearchProject("QmTestCID1", scientist1);

        vm.warp(evaluationDeadline + 1);

        vm.prank(cairnDAO);
        vm.expectRevert("Action not allowed after evaluation deadline");
        cairn.evaluateProject("QmTestCID1", 85);
    }

    function testEvaluateProjectZeroScore() public {
        vm.prank(cairnDAO);
        cairn.submitResearchProject("QmTestCID1", scientist1);

        vm.warp(submissionDeadline + 1);

        vm.prank(cairnDAO);
        vm.expectRevert("Score must be greater than 0");
        cairn.evaluateProject("QmTestCID1", 0);
    }

    // ============ FUND DISTRIBUTION TESTS ============

    function testDistributeFundsSuccess() public {
        // Setup: fund round and submit project
        vm.prank(funder);
        cairn.fundRound(FUNDING_AMOUNT, TOTAL_FUNDED_PROJECTS);

        vm.prank(cairnDAO);
        cairn.submitResearchProject("QmTestCID1", scientist1);

        // Move to evaluation period and evaluate
        vm.warp(submissionDeadline + 1);
        vm.prank(cairnDAO);
        cairn.evaluateProject("QmTestCID1", 85);

        // Move to distribution period and distribute
        vm.warp(evaluationDeadline + 1);
        uint256 distributionAmount = 20000 * 10**18;

        uint256 initialBalance = paymentToken.balanceOf(scientist1);

        vm.prank(cairnDAO);
        vm.expectEmit(false, false, false, true);
        emit FundsDistributed("QmTestCID1", distributionAmount);
        cairn.distributeFunds("QmTestCID1", distributionAmount);

        assertEq(paymentToken.balanceOf(scientist1), initialBalance + distributionAmount);
        assertEq(cairn.getRemainingFunds(), FUNDING_AMOUNT - distributionAmount);

        (, , , , uint256 fundsReceived) = cairn.projects("QmTestCID1");
        assertEq(fundsReceived, distributionAmount);
    }

    function testDistributeFundsNoFunding() public {
        vm.prank(cairnDAO);
        cairn.submitResearchProject("QmTestCID1", scientist1);

        vm.warp(evaluationDeadline + 1);

        vm.prank(cairnDAO);
        vm.expectRevert("No funds to distribute");
        cairn.distributeFunds("QmTestCID1", 1000);
    }

    function testDistributeFundsExceedsAvailable() public {
        vm.prank(funder);
        cairn.fundRound(FUNDING_AMOUNT, TOTAL_FUNDED_PROJECTS);

        vm.prank(cairnDAO);
        cairn.submitResearchProject("QmTestCID1", scientist1);

        vm.warp(evaluationDeadline + 1);

        vm.prank(cairnDAO);
        vm.expectRevert("Amount exceeds available funding");
        cairn.distributeFunds("QmTestCID1", FUNDING_AMOUNT + 1);
    }

    // ============ NFT MINTING TESTS ============

    function testMintImpactAssetSuccess() public {
        // Move past distribution deadline
        vm.warp(distributionDeadline + 1);

        uint256 initialBalance = impactAssetToken.balanceOf(funder);

        vm.prank(funder);
        vm.expectEmit(true, false, false, false);
        emit ImpactAssetMinted(funder);
        cairn.mintImpactAsset();

        assertEq(impactAssetToken.balanceOf(funder), initialBalance + 1);
    }

    function testMintImpactAssetOnlyFunder() public {
        vm.warp(distributionDeadline + 1);

        vm.prank(scientist1);
        vm.expectRevert("Only funder can mint impact assets");
        cairn.mintImpactAsset();
    }

    function testMintImpactAssetBeforeDeadline() public {
        vm.prank(funder);
        vm.expectRevert("Action allowed only after distribution deadline");
        cairn.mintImpactAsset();
    }

    // ============ GETTER FUNCTION TESTS ============

    function testGetAllSubmittedProjects() public {
        vm.prank(cairnDAO);
        cairn.submitResearchProject("QmTestCID1", scientist1);

        vm.prank(cairnDAO);
        cairn.submitResearchProject("QmTestCID2", scientist1);

        vm.prank(cairnDAO);
        cairn.submitResearchProject("QmTestCID3", scientist2);

        string[] memory scientist1Projects = cairn.getAllSubmittedProjects(scientist1);
        assertEq(scientist1Projects.length, 2);
        assertEq(scientist1Projects[0], "QmTestCID1");
        assertEq(scientist1Projects[1], "QmTestCID2");

        string[] memory scientist2Projects = cairn.getAllSubmittedProjects(scientist2);
        assertEq(scientist2Projects.length, 1);
        assertEq(scientist2Projects[0], "QmTestCID3");
    }

    function testGetProject() public {
        vm.prank(cairnDAO);
        cairn.submitResearchProject("QmTestCID1", scientist1);

        Cairn.Project memory project = cairn.getProject("QmTestCID1");
        assertEq(project.creator, scientist1);
        assertEq(project.projectCID, "QmTestCID1");
        assertEq(project.porCID, "");
        assertEq(project.score, 0);
        assertEq(project.fundsReceived, 0);
    }

    function testGetProjectNonExistent() public {
        vm.expectRevert("Project does not exist");
        cairn.getProject("QmNonExistent");
    }

    function testGetTotalProjects() public {
        assertEq(cairn.getTotalProjects(), 0);

        vm.prank(cairnDAO);
        cairn.submitResearchProject("QmTestCID1", scientist1);

        assertEq(cairn.getTotalProjects(), 1);

        vm.prank(cairnDAO);
        cairn.submitResearchProject("QmTestCID2", scientist2);

        assertEq(cairn.getTotalProjects(), 2);
    }

    // ============ ADMIN FUNCTION TESTS ============

    function testEmergencyWithdraw() public {
        vm.prank(funder);
        cairn.fundRound(FUNDING_AMOUNT, TOTAL_FUNDED_PROJECTS);

        uint256 ownerInitialBalance = paymentToken.balanceOf(owner);

        cairn.emergencyWithdraw();

        assertEq(paymentToken.balanceOf(address(cairn)), 0);
        assertEq(paymentToken.balanceOf(owner), ownerInitialBalance + FUNDING_AMOUNT);
    }

    function testEmergencyWithdrawOnlyOwner() public {
        vm.prank(scientist1);
        vm.expectRevert();
        cairn.emergencyWithdraw();
    }

    function testUpdateDeadlines() public {
        uint256 newSubmissionDeadline = block.timestamp + 2 hours;
        uint256 newEvaluationDeadline = newSubmissionDeadline + 2 hours;
        uint256 newDistributionDeadline = newEvaluationDeadline + 2 hours;

        cairn.updateDeadlines(newSubmissionDeadline, newEvaluationDeadline, newDistributionDeadline);

        assertEq(cairn.submissionDeadline(), newSubmissionDeadline);
        assertEq(cairn.evaluationDeadline(), newEvaluationDeadline);
        assertEq(cairn.distributionDeadline(), newDistributionDeadline);
    }

    function testUpdateDeadlinesInvalidOrder() public {
        uint256 newSubmissionDeadline = block.timestamp + 2 hours;
        uint256 newEvaluationDeadline = newSubmissionDeadline - 1 hours; // Invalid: before submission

        vm.expectRevert("Evaluation must be after submission");
        cairn.updateDeadlines(newSubmissionDeadline, newEvaluationDeadline, newSubmissionDeadline + 3 hours);
    }

    function testUpdateDeadlinesPastTime() public {
        vm.expectRevert("Submission deadline must be in future");
        cairn.updateDeadlines(block.timestamp - 1, block.timestamp + 1 hours, block.timestamp + 2 hours);
    }
}
