// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Cairn.sol";
import {IHypercertToken} from "../src/interfaces/IHypercertToken.sol";

contract CairnPoRTest is Test {
    Cairn public cairn;
    IHypercertToken public hypercert;
    address public deployer = vm.addr(11223344);
    address public scientist = vm.addr(12345678);
    address public scientist2 = vm.addr(123123123);

    string public seedUri1 = "ipfs://QmSeedProject1";
    string public seedUri2 = "ipfs://QmSeedProject2";

    uint256 public unitPrice = 1e6;

    uint256 public UNITS = 1000;   
    IHypercertToken.TransferRestrictions public RESTRICTIONS = IHypercertToken.TransferRestrictions.AllowAll;

    uint8 public minRequiredPoR = 3;
    uint8 public maxPoRProject = 3;

    function setUp() public {
        vm.recordLogs();
        // Create Sepolia fork
        string memory alchemyKey = vm.envString("ALCHEMY_KEY");
        string memory rpcUrl = string.concat("https://eth-sepolia.g.alchemy.com/v2/", alchemyKey);
        uint256 forkId = vm.createSelectFork(rpcUrl);
        vm.selectFork(forkId);

        hypercert = IHypercertToken(0xa16DFb32Eb140a6f3F2AC68f41dAd8c7e83C4941);

        // Deploy Cairn contract with paymentToken address set to zero for PoR tests
        vm.prank(deployer);
        cairn = new Cairn(address(hypercert), address(0), minRequiredPoR, maxPoRProject, 7 days, 1 ether, 5 ether, 10 ether);

        // Initialize projects as deployer
        string[] memory seedProjects = new string[](2);
        seedProjects[0] = seedUri1;
        seedProjects[1] = seedUri2;

        for (uint256 i = 0; i < seedProjects.length; i++) {
            vm.prank(deployer);
            cairn.initProject(seedProjects[i], deployer);

            vm.prank(deployer);
            hypercert.mintClaim(deployer, UNITS, seedProjects[i], RESTRICTIONS);

            uint256 seedHypercertTypeId = getTokenIdByURI(seedProjects[i]);
            uint256 seedHypercertTokenId = seedHypercertTypeId + 1;

            vm.prank(deployer);
            hypercert.setApprovalForAll(address(cairn), true);

            vm.prank(deployer);
            cairn.storeTokenIDInit(seedProjects[i], seedHypercertTokenId, unitPrice);

            vm.prank(deployer);
            cairn.recordOutputs(seedProjects[i], string(abi.encodePacked("ipfs://outputs-", vm.toString(i))));
        }
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

    /// @notice Helper to record one proof per project for a user on multiple projects
    function recordProofsOnDistinctProjects(address user, string[] memory projectURIs) internal {
        vm.startPrank(user);
        for (uint256 i = 0; i < projectURIs.length; i++) {
            cairn.recordProof(projectURIs[i], string(abi.encodePacked("ipfs://proof-", vm.toString(i))));
        }
        vm.stopPrank();
    }

    // Your existing tests below remain unchanged, e.g.,

    function testRecordProofSuccess() public {
        vm.prank(scientist);
        cairn.recordProof(seedUri1, "ipfs://proof1");

        vm.warp(block.timestamp + 7 days + 1);
        uint256 availablePoRs = cairn.getUserAvailablePoRCount(scientist);        
        assertEq(availablePoRs, 1);

        Cairn.Project memory project = cairn.getProject(seedUri1);
        assertEq(project.proofs.length, 1);

        string memory proofURI = project.proofs[0];
        Cairn.ProofOfReproducibility memory proof = cairn.getProof(proofURI);
        assertEq(proof.proofURI, "ipfs://proof1");
        assertEq(proof.recorder, scientist);
        assertFalse(proof.dispute);
    }

    function testRecordProofRevertsIfProjectDoesNotExist() public {
        vm.prank(scientist);
        vm.expectRevert("Project does not exist");
        cairn.recordProof("ipfs://nonexistent", "ipfs://proof1");
    }

    function testRecordProofRevertsIfCreatorTriesToRecord() public {
        vm.prank(deployer);
        vm.expectRevert("You are creator of this project");
        cairn.recordProof(seedUri1, "ipfs://proof1");
    }

    function testRecordProofRevertsIfDuplicateProof() public {
        vm.prank(scientist);
        cairn.recordProof(seedUri1, "ipfs://proof1");

        vm.prank(scientist);
        vm.expectRevert("You have already recorded a proof for this project");
        cairn.recordProof(seedUri1, "ipfs://proof2");
    }

    function testRecordProofRevertsIfMaxPoRsReached() public {
        vm.prank(scientist);
        cairn.recordProof(seedUri1, "ipfs://proof1");

        vm.prank(scientist2);
        cairn.recordProof(seedUri1, "ipfs://proof2");

        address user3 = vm.addr(555555);
        vm.prank(user3);
        cairn.recordProof(seedUri1, "ipfs://proof3");

        address user4 = vm.addr(666666);
        vm.prank(user4);
        vm.expectRevert("Max PoRs reached");
        cairn.recordProof(seedUri1, "ipfs://proof4");
    }

    function testMultipleUsersRecordProofsOnSameProject() public {
        vm.prank(scientist);
        cairn.recordProof(seedUri1, "ipfs://proof1");

        vm.prank(scientist2);
        cairn.recordProof(seedUri1, "ipfs://proof2");

        Cairn.Project memory project = cairn.getProject(seedUri1);
        assertEq(project.proofs.length, 2);

        vm.warp(block.timestamp + 7 days + 1);

        uint256 availablePoRs1 = cairn.getUserAvailablePoRCount(scientist);
        uint256 availablePoRs2 = cairn.getUserAvailablePoRCount(scientist2);
        assertEq(availablePoRs1, 1);
        assertEq(availablePoRs2, 1);
    }

    function testDisputeProofSuccess() public {
        vm.prank(scientist);
        cairn.recordProof(seedUri1, "ipfs://proof1");

        vm.prank(scientist2);
        cairn.disputeProof("ipfs://proof1", "ipfs://dispute-metadata");

        Cairn.ProofOfReproducibility memory proof = cairn.getProof("ipfs://proof1");
        assertTrue(proof.dispute);
        assertEq(proof.disputeURI, "ipfs://dispute-metadata");
    }

    function testDisputeProofRevertsIfAlreadyDisputed() public {
        vm.prank(scientist);
        cairn.recordProof(seedUri1, "ipfs://proof1");

        vm.prank(scientist2);
        cairn.disputeProof("ipfs://proof1", "ipfs://dispute-metadata");

        vm.prank(scientist);
        vm.expectRevert("Proof already disputed");
        cairn.disputeProof("ipfs://proof1", "ipfs://dispute-metadata2");
    }

    function testDisputeProofRevertsIfProofDoesNotExist() public {
        vm.prank(scientist);
        vm.expectRevert("Proof does not exist");
        cairn.disputeProof("ipfs://nonexistent-proof", "ipfs://dispute-metadata");
    }

    function testResolveDisputeSuccess() public {
        vm.prank(scientist);
        cairn.recordProof(seedUri1, "ipfs://proof1");

        vm.prank(scientist2);
        cairn.disputeProof("ipfs://proof1", "ipfs://dispute-metadata");

        vm.prank(deployer);
        cairn.resolveDispute("ipfs://proof1");

        Cairn.ProofOfReproducibility memory proof = cairn.getProof("ipfs://proof1");
        assertFalse(proof.dispute);
        assertEq(proof.disputeURI, "");
    }

    function testResolveDisputeRevertsIfNotDisputed() public {
        vm.prank(scientist);
        cairn.recordProof(seedUri1, "ipfs://proof1");

        vm.prank(deployer);
        vm.expectRevert("Proof is not disputed");
        cairn.resolveDispute("ipfs://proof1");
    }

    function testResolveDisputeRevertsIfProofDoesNotExist() public {
        vm.prank(deployer);
        vm.expectRevert("Proof does not exist");
        cairn.resolveDispute("ipfs://nonexistent-proof");
    }
}
