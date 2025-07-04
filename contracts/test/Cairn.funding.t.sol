// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Cairn.sol";
import {IHypercertToken} from "../src/interfaces/IHypercertToken.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("MockUSD", "mUSD") {
        _mint(msg.sender, 1_000_000 ether);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract CairnFundingFractionTest is Test {
    Cairn public cairn;
    IHypercertToken public hypercert;
    MockERC20 public paymentToken;

    address public deployer = vm.addr(11223344);
    address public scientist = vm.addr(12345678);
    address public scientist2 = vm.addr(123123123);
    address public scientist3 = vm.addr(123456789);
    address public funder = vm.addr(321321321);

    string public uri = "ipfs://QmTestProjectOnSepolia";
    string public seedUri1 = "ipfs://QmSeedProject1";
    string public seedUri2 = "ipfs://QmSeedProject2";
    string public seedUri3 = "ipfs://QmSeedProject3";

    uint256 public unitPrice = 1e6; // example unit price

    uint256 public UNITS = 1000;
    IHypercertToken.TransferRestrictions public RESTRICTIONS = IHypercertToken.TransferRestrictions.AllowAll;

    uint256 public hypercertTypeId;
    uint256 public hypercertTokenId;
    uint256 public hypercertTokenId2;

    uint8 public minRequiredPoR = 3;
    uint8 public maxPoRProject = 10;

    function setUp() public {       

        // Deploy mock payment token and mint to funder
        paymentToken = new MockERC20();
        paymentToken.mint(funder, 100 ether);

        // Fork Sepolia and select (replace YOUR_ALCHEMY_KEY)
        uint256 forkId = vm.createSelectFork("https://eth-sepolia.g.alchemy.com/v2/OvsCjNyvn_J3SUk56PTqNzojA_uI0ba1");
        vm.selectFork(forkId);

        hypercert = IHypercertToken(0xa16DFb32Eb140a6f3F2AC68f41dAd8c7e83C4941);

        // Deploy Cairn contract
        vm.prank(deployer);
        cairn = new Cairn(
            address(hypercert),
            address(paymentToken),
            minRequiredPoR,
            maxPoRProject,
            7 days,
            1 ether,
            5 ether,
            10 ether
        );

        

        vm.recordLogs();
        // Mint token for scientist and get tokenID
        vm.prank(scientist);
        hypercert.mintClaim(scientist, UNITS, uri, RESTRICTIONS);
        hypercertTypeId = getTokenIdByURI(uri);
        hypercertTokenId = hypercertTypeId + 1;

        // Split token into two fractions: 500 and 500 units
        uint256[] memory fractions = new uint256[](2);
        fractions[0] = 500;
        fractions[1] = 500;
        vm.prank(scientist);
        hypercert.splitFraction(scientist2, hypercertTokenId, fractions);

        // Get split token IDs from logs
        uint256[] memory splitTokenIDs = getSplitTokenIDsFromLogs();
        if (splitTokenIDs[0] != hypercertTokenId) {
            hypercertTokenId2 = splitTokenIDs[0];
        } else {
            hypercertTokenId2 = splitTokenIDs[1];
        }

        // Approvals for Cairn contract
        vm.prank(scientist);
        hypercert.setApprovalForAll(address(cairn), true);
        vm.prank(scientist2);
        hypercert.setApprovalForAll(address(cairn), true);

        vm.prank(funder);
        paymentToken.approve(address(cairn), 100 ether);

        // Seed initial projects as deployer using initProject
        string[] memory seedProjects = new string[](minRequiredPoR);
        seedProjects[0] = seedUri1;
        seedProjects[1] = seedUri2;
        seedProjects[2] = seedUri3;

        for (uint256 i = 0; i < seedProjects.length; i++) {
            vm.prank(deployer);
            cairn.initProject(seedProjects[i], deployer);

            vm.prank(deployer);
            hypercert.mintClaim(deployer, UNITS, seedProjects[i], RESTRICTIONS);

            uint256 seedHypercertTypeIdInit = getTokenIdByURI(seedProjects[i]);
            uint256 seedHypercertTokenIdInit = seedHypercertTypeIdInit + 1;

            vm.prank(deployer);
            // Approve Cairn contract to transfer deployer's tokens
            hypercert.setApprovalForAll(address(cairn), true);

            vm.prank(deployer);
            cairn.storeTokenIDInit(seedProjects[i], seedHypercertTokenIdInit, unitPrice);

            vm.prank(deployer);
            cairn.recordOutputs(seedProjects[i], string(abi.encodePacked("ipfs://outputs-", vm.toString(i))));
        }

        recordProofsOnDistinctProjects(scientist, seedProjects);

        // Register project with first token and unit price
        vm.prank(scientist);
        cairn.registerProject(uri, hypercertTokenId, unitPrice);

        // Add second fractional token to project
        vm.prank(scientist2);
        cairn.storeTokenID(uri, hypercertTokenId2);

        // Record outputs by creator
        vm.prank(scientist);
        cairn.recordOutputs(uri, "ipfs://outputs");

        // Record proofs
        vm.prank(deployer);
        cairn.recordProof(uri, "ipfs://proof");
        vm.prank(scientist2);
        cairn.recordProof(uri, "ipfs://proof2");
        vm.prank(scientist3);
        cairn.recordProof(uri, "ipfs://proof3");

        // Warp time to allow funding
        vm.warp(block.timestamp + 8 days + 1);
    }

    /// @notice Helper to scan the logs and retrieve tokenID
    function getTokenIdByURI(string memory targetURI) internal returns (uint256) {
        Vm.Log[] memory entries = vm.getRecordedLogs();
        bytes32 eventSig = keccak256("ClaimStored(uint256,string,uint256)");

        for (uint256 i = 0; i < entries.length; i++) {
            if (entries[i].topics.length > 0 && entries[i].topics[0] == eventSig) {
                uint256 claimID = uint256(entries[i].topics[1]);

                // Decode non-indexed parameters: (string uri, uint256 units)
                (string memory _uri, ) = abi.decode(entries[i].data, (string, uint256));

                if (keccak256(bytes(_uri)) == keccak256(bytes(targetURI))) {
                    return claimID;
                }
            }
        }
        revert("Token with given URI not found");
    }

    /// @notice Helper to get split token IDs from logs
    function getSplitTokenIDsFromLogs() internal returns (uint256[] memory) {
        Vm.Log[] memory logs = vm.getRecordedLogs();
        bytes32 eventSig = keccak256("BatchValueTransfer(uint256[],uint256[],uint256[],uint256[])");
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics.length > 0 && logs[i].topics[0] == eventSig) {
                (, , uint256[] memory toIDs, ) = abi.decode(logs[i].data, (uint256[], uint256[], uint256[], uint256[]));
                return toIDs;
            }
        }
        revert("BatchValueTransfer event not found");
    }

    /// @notice Helper to record proofs for multiple projects
    function recordProofsOnDistinctProjects(address user, string[] memory projectURIs) internal {
        vm.startPrank(user);
        for (uint256 i = 0; i < projectURIs.length; i++) {
            cairn.recordProof(projectURIs[i], string(abi.encodePacked("ipfs://proof-", vm.toString(i))));
        }
        vm.warp(block.timestamp + 8 days + 1);
        vm.stopPrank();
    }

    function testFundProjectSuccess() public {
        uint256 fundingGoal = 500 * unitPrice; // 500 * unitPrice

        // Set impact level by owner
        vm.prank(deployer);
        cairn.setProjectImpact(uri, Cairn.Impact.LOW);

        vm.prank(funder);
        cairn.fundProject(fundingGoal, uri);

        // Calculate expected shares proportional to units
        uint256 totalUnits = hypercert.unitsOf(hypercertTokenId) + hypercert.unitsOf(hypercertTokenId2);
        uint256 expectedShare1 = (fundingGoal * hypercert.unitsOf(hypercertTokenId)) / totalUnits;
        uint256 expectedShare2 = fundingGoal - expectedShare1;

        assertApproxEqAbs(paymentToken.balanceOf(scientist), expectedShare1, 1e10);
        assertApproxEqAbs(paymentToken.balanceOf(scientist2), expectedShare2, 1e10);
    }

    function testFundProjectRevertsIfAmountNotEqualGoal() public {
        // Set impact level by owner
        vm.prank(deployer);
        cairn.setProjectImpact(uri, Cairn.Impact.LOW);
        vm.prank(funder);
        vm.expectRevert("Funding amount must equal funding goal");
        cairn.fundProject(1, uri);
    }

    function testFundProjectRevertsIfAlreadyFunded() public {
        // Set impact level by owner
        vm.prank(deployer);
        cairn.setProjectImpact(uri, Cairn.Impact.LOW);
        uint256 fundingGoal = 500 * unitPrice;
        vm.prank(funder);
        cairn.fundProject(fundingGoal, uri);

        vm.prank(funder);
        vm.expectRevert("Project already funded by another user");
        cairn.fundProject(fundingGoal, uri);
    }

    function testFundProjectRevertsIfImpactNotSet() public {        

        vm.prank(funder);
        paymentToken.approve(address(cairn), 10 ether);

        uint256 fundingGoal = 500 * unitPrice;

        vm.prank(funder);
        vm.expectRevert("Impact must be set");
        cairn.fundProject(fundingGoal, uri);
    }
}
