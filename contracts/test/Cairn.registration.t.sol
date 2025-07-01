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

    function testRegisterProject() public {
        vm.startPrank(scientist);        

        // Call registerProject, which calls real mintClaim on Hypercert Sepolia
        cairn.registerProject(uri, UNITS, RESTRICTIONS);

        // Check that metadata URI is stored
        string[] memory uris = cairn.getUserMetadataURIs(scientist);
        assertEq(uris.length, 1);
        assertEq(uris[0], uri);

        // Initially tokenID is 0 because mintClaim does not return it
        Cairn.Project memory project = cairn.getProject(scientist, uri);
        uint256 tokenID = project.tokenID;
        assertEq(tokenID, 0);

        vm.stopPrank();
    }

    function testStoreTokenIDSuccess() public {
        vm.startPrank(scientist);

        // Register project first
        cairn.registerProject(uri, UNITS, RESTRICTIONS);

        // Store tokenID (must be owned by scientist)
        cairn.storeTokenID(uri, hypercertTokenId);

        Cairn.Project memory project = cairn.getProject(scientist, uri);
        assertEq(project.tokenID, hypercertTokenId);

        vm.stopPrank();
    }

    function testStoreTokenIDRevertsIfTokenIDZero() public {
        vm.startPrank(scientist);

        cairn.registerProject(uri, UNITS, RESTRICTIONS);

        vm.expectRevert("Invalid tokenID");
        cairn.storeTokenID(uri, 0);

        vm.stopPrank();
    }

    function testStoreTokenIDRevertsIfProjectDoesNotExist() public {
        vm.startPrank(scientist);

        vm.expectRevert("Project does not exist yet");
        cairn.storeTokenID(uri, hypercertTokenId);

        vm.stopPrank();
    }

    function testStoreTokenIDRevertsIfNotCreator() public {
        vm.startPrank(scientist);

        cairn.registerProject(uri, UNITS, RESTRICTIONS);

        vm.stopPrank();

        vm.startPrank(scientist2);

        vm.expectRevert("You are not the creator of this project");
        cairn.storeTokenID(uri, hypercertTokenId);

        vm.stopPrank();
    }

    function testStoreTokenIDRevertsIfTokenIDAlreadySet() public {
        vm.startPrank(scientist);

        cairn.registerProject(uri, UNITS, RESTRICTIONS);

        cairn.storeTokenID(uri, hypercertTokenId);

        vm.expectRevert("tokenID already set");
        cairn.storeTokenID(uri, hypercertTokenId);

        vm.stopPrank();
    }

    function testStoreTokenIDRevertsIfNotOwnerOfTokenID() public {
        // Token owned by scientist, but funder tries to store tokenID
        vm.startPrank(funder);

        cairn.registerProject(uri, UNITS, RESTRICTIONS);        

        vm.expectRevert("You are not owner of tokenID or the tokenID does not exists");
        cairn.storeTokenID(uri, hypercertTokenId);

        vm.stopPrank();
    } 

}