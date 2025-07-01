// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "forge-std/Test.sol";
import "../src/Cairn.sol";
import {IHypercertToken} from "../src/interfaces/IHypercertToken.sol";

contract CairnTest is Test {
    Cairn public cairn;
    IHypercertToken public hypercert;
    address public deployer = vm.addr(11223344);
    address public scientist = vm.addr(12345678);
    address public scientist2 = vm.addr(123123123);
    address public funder = vm.addr(321321321);

    string public uri = "ipfs://QmTestProjectOnSepolia";
    string public seedUri1 = "ipfs://QmSeedProject1";
    string public seedUri2 = "ipfs://QmSeedProject2";
    string public seedUri3 = "ipfs://QmSeedProject3";

    uint256 public UNITS = 1000;   
    IHypercertToken.TransferRestrictions public RESTRICTIONS = IHypercertToken.TransferRestrictions.AllowAll;

    uint256 public hypercertTypeId;
    uint256 public hypercertTokenId;

    string public outputsURI = "ipfs://QmOutputsURI";

    uint8 public minRequiredPoR = 3;

    function setUp() public {
        vm.recordLogs();
        // Create Sepolia fork
        uint256 forkId = vm.createSelectFork("https://eth-sepolia.g.alchemy.com/v2/OvsCjNyvn_J3SUk56PTqNzojA_uI0ba1");
        vm.selectFork(forkId);

        hypercert = IHypercertToken(0xa16DFb32Eb140a6f3F2AC68f41dAd8c7e83C4941);

        vm.prank(scientist);
        hypercert.mintClaim(scientist, UNITS, uri, RESTRICTIONS);
        Vm.Log[] memory entries = vm.getRecordedLogs();

        hypercertTypeId = uint256(entries[0].topics[1]);
        hypercertTokenId = hypercertTypeId + 1;

        // Deploy Cairn contract with minRequiredPoR=3 and maxPoRProject=10 (example)
        vm.prank(deployer);
        cairn = new Cairn(address(hypercert), minRequiredPoR, 10);

        // Seed initial projects as deployer
        vm.prank(deployer);
        cairn.initProject(seedUri1, deployer);

        vm.prank(deployer);
        cairn.initProject(seedUri2, deployer);

        vm.prank(deployer);
        cairn.initProject(seedUri3, deployer);
    }

    /// @notice Helper to record one proof per project for a user on multiple projects
    function recordProofsOnDistinctProjects(address user, string[] memory projectURIs) internal {
        vm.startPrank(user);
        for (uint256 i = 0; i < projectURIs.length; i++) {
            cairn.recordProof(projectURIs[i], string(abi.encodePacked("ipfs://proof-", vm.toString(i))));
        }
        vm.stopPrank();
    }

    function testRegisterProjectSuccess() public {
        // User records one PoR per distinct seeded project to accumulate minRequiredPoR
        string[] memory seedProjects = new string[](minRequiredPoR);
        seedProjects[0] = seedUri1;
        seedProjects[1] = seedUri2;
        seedProjects[2] = seedUri3;

        recordProofsOnDistinctProjects(scientist, seedProjects);

        vm.startPrank(scientist);
        cairn.registerProject(uri);

        string[] memory uris = cairn.getUserMetadataURIs(scientist);
        assertEq(uris.length, 1);
        assertEq(uris[0], uri);

        Cairn.Project memory project = cairn.getProject(uri);
        assertEq(project.creator, scientist);
        assertEq(project.tokenID, 0);
        assertEq(bytes(project.outputsURI).length, 0);

        vm.stopPrank();
    }

    function testRecordProofRevertsIfDuplicate() public {
        vm.startPrank(scientist);
        cairn.recordProof(seedUri1, "ipfs://proof1");

        vm.expectRevert("You have already recorded a proof for this project");
        cairn.recordProof(seedUri1, "ipfs://proof2");

        vm.stopPrank();
    }

    function testRegisterProjectRevertsIfDuplicateURI() public {
        string[] memory seedProjects = new string[](minRequiredPoR);
        seedProjects[0] = seedUri1;
        seedProjects[1] = seedUri2;
        seedProjects[2] = seedUri3;

        recordProofsOnDistinctProjects(scientist, seedProjects);

        vm.startPrank(scientist);
        cairn.registerProject(uri);
        vm.expectRevert("Metadata URI already used globally");
        cairn.registerProject(uri);
        vm.stopPrank();
    }

    function testStoreTokenIDSuccess() public {
        string[] memory seedProjects = new string[](minRequiredPoR);
        seedProjects[0] = seedUri1;
        seedProjects[1] = seedUri2;
        seedProjects[2] = seedUri3;

        recordProofsOnDistinctProjects(scientist, seedProjects);

        vm.startPrank(scientist);
        cairn.registerProject(uri);
        cairn.storeTokenID(uri, hypercertTokenId);

        Cairn.Project memory project = cairn.getProject(uri);
        assertEq(project.tokenID, hypercertTokenId);

        vm.stopPrank();
    }

    function testStoreTokenIDRevertsIfZero() public {
        string[] memory seedProjects = new string[](minRequiredPoR);
        seedProjects[0] = seedUri1;
        seedProjects[1] = seedUri2;
        seedProjects[2] = seedUri3;

        recordProofsOnDistinctProjects(scientist, seedProjects);

        vm.startPrank(scientist);
        cairn.registerProject(uri);
        vm.expectRevert("Invalid tokenID");
        cairn.storeTokenID(uri, 0);
        vm.stopPrank();
    }

    function testStoreTokenIDRevertsIfProjectNotExist() public {
        vm.startPrank(scientist);
        vm.expectRevert("Project does not exist yet");
        cairn.storeTokenID(uri, hypercertTokenId);
        vm.stopPrank();
    }

    function testStoreTokenIDRevertsIfNotCreator() public {
        string[] memory seedProjects = new string[](minRequiredPoR);
        seedProjects[0] = seedUri1;
        seedProjects[1] = seedUri2;
        seedProjects[2] = seedUri3;

        recordProofsOnDistinctProjects(scientist, seedProjects);

        vm.startPrank(scientist);
        cairn.registerProject(uri);
        vm.stopPrank();

        vm.startPrank(scientist2);
        vm.expectRevert("You are not the creator of this project");
        cairn.storeTokenID(uri, hypercertTokenId);
        vm.stopPrank();
    }

    function testStoreTokenIDRevertsIfAlreadySet() public {
        string[] memory seedProjects = new string[](minRequiredPoR);
        seedProjects[0] = seedUri1;
        seedProjects[1] = seedUri2;
        seedProjects[2] = seedUri3;

        recordProofsOnDistinctProjects(scientist, seedProjects);

        vm.startPrank(scientist);
        cairn.registerProject(uri);
        cairn.storeTokenID(uri, hypercertTokenId);
        vm.expectRevert("tokenID already set");
        cairn.storeTokenID(uri, hypercertTokenId);
        vm.stopPrank();
    }

    function testStoreTokenIDRevertsIfNotOwner() public {
        string[] memory seedProjects = new string[](minRequiredPoR);
        seedProjects[0] = seedUri1;
        seedProjects[1] = seedUri2;
        seedProjects[2] = seedUri3;

        recordProofsOnDistinctProjects(funder, seedProjects);

        vm.startPrank(funder);
        cairn.registerProject(uri);
        vm.expectRevert("You are not owner of tokenID or the tokenID does not exists");
        cairn.storeTokenID(uri, hypercertTokenId);
        vm.stopPrank();
    }
}
