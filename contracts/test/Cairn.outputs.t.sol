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
    uint256 public UNITS = 1000;   
    IHypercertToken.TransferRestrictions public RESTRICTIONS = IHypercertToken.TransferRestrictions.AllowAll;

    uint256 public hypercertTypeId;
    uint256 public hypercertTokenId;

    string public outputsURI = "ipfs://QmOutputsURI";

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

        // Deploy your Cairn contract pointing to real Hypercert
        vm.prank(deployer);
        cairn = new Cairn(0xa16DFb32Eb140a6f3F2AC68f41dAd8c7e83C4941);
    }

    function testRecordOutputsSuccess() public {
        vm.startPrank(scientist);

        // Register project and store tokenID first
        cairn.registerProject(uri, UNITS, RESTRICTIONS);
        cairn.storeTokenID(uri, hypercertTokenId);

        // Record outputs URI
        cairn.recordOutputs(uri, outputsURI);

        // Verify outputsURI stored correctly
        Cairn.Project memory project = cairn.getProject(scientist, uri);
        assertEq(project.outputsURI, outputsURI);

        vm.stopPrank();
    }

    function testRecordOutputsRevertsIfProjectDoesNotExist() public {
        vm.startPrank(scientist);

        vm.expectRevert("Project does not exist yet");
        cairn.recordOutputs(uri, outputsURI);

        vm.stopPrank();
    }

    function testRecordOutputsRevertsIfNotCreator() public {
        vm.startPrank(scientist);

        // Register project and store tokenID
        cairn.registerProject(uri, UNITS, RESTRICTIONS);
        cairn.storeTokenID(uri, hypercertTokenId);

        vm.stopPrank();

        vm.startPrank(scientist2);

        vm.expectRevert("You are not the creator of this project");
        cairn.recordOutputs(uri, outputsURI);

        vm.stopPrank();
    }

    function testRecordOutputsRevertsIfTokenIDNotSet() public {
        vm.startPrank(scientist);

        // Register project but do NOT store tokenID
        cairn.registerProject(uri, UNITS, RESTRICTIONS);

        vm.expectRevert("Project tokenID not set");
        cairn.recordOutputs(uri, outputsURI);

        vm.stopPrank();
    }

    function testRecordOutputsRevertsIfOutputsAlreadyRecorded() public {
        vm.startPrank(scientist);

        // Register project, store tokenID, and record outputs once
        cairn.registerProject(uri, UNITS, RESTRICTIONS);
        cairn.storeTokenID(uri, hypercertTokenId);

        cairn.recordOutputs(uri, outputsURI);

        // Attempt to record outputs again should revert
        vm.expectRevert("Outputs already recorded");
        cairn.recordOutputs(uri, "ipfs://QmAnotherOutputsURI");

        vm.stopPrank();
    }


}