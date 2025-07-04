// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

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

    uint256 public unitPrice = 1e6;

    uint256 public UNITS = 1000;   
    IHypercertToken.TransferRestrictions public RESTRICTIONS = IHypercertToken.TransferRestrictions.AllowAll;

    uint256 public hypercertTypeId;
    uint256 public hypercertTokenId;

    string public outputsURI = "ipfs://QmOutputsURI";

    uint8 public minRequiredPoR = 3;
    uint8 public maxPoRProject = 10;

    function setUp() public {
        vm.recordLogs();
        // Create Sepolia fork
        uint256 forkId = vm.createSelectFork("https://eth-sepolia.g.alchemy.com/v2/OvsCjNyvn_J3SUk56PTqNzojA_uI0ba1");
        vm.selectFork(forkId);

        hypercert = IHypercertToken(0xa16DFb32Eb140a6f3F2AC68f41dAd8c7e83C4941);

        // Mint token for scientist and get tokenID from logs
        vm.prank(scientist);
        hypercert.mintClaim(scientist, UNITS, uri, RESTRICTIONS);
        Vm.Log[] memory entries = vm.getRecordedLogs();

        hypercertTypeId = uint256(entries[0].topics[1]);
        hypercertTokenId = hypercertTypeId + 1;
        // Deploy Cairn contract with paymentToken address set to zero for now
        vm.prank(deployer);
        cairn = new Cairn(address(hypercert), address(0), minRequiredPoR, maxPoRProject, 7 days, 1 ether, 5 ether, 10 ether);

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
        for (uint256 i = 0; i < projectURIs.length; i++) {
            vm.prank(user);
            cairn.recordProof(projectURIs[i], string(abi.encodePacked("ipfs://proof-", vm.toString(i))));
        }
        vm.warp(block.timestamp + 7 days + 1);
    }

    function testRecordOutputsSuccess() public {
        string[] memory seedProjects = new string[](minRequiredPoR);
        seedProjects[0] = seedUri1;
        seedProjects[1] = seedUri2;
        seedProjects[2] = seedUri3;

        recordProofsOnDistinctProjects(scientist, seedProjects);

        vm.startPrank(scientist);

        // Approve Cairn contract to transfer scientist's tokens
        hypercert.setApprovalForAll(address(cairn), true);

        cairn.registerProject(uri, hypercertTokenId, unitPrice);

        cairn.recordOutputs(uri, outputsURI);

        Cairn.Project memory project = cairn.getProject(uri);
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
        string[] memory seedProjects = new string[](minRequiredPoR);
        seedProjects[0] = seedUri1;
        seedProjects[1] = seedUri2;
        seedProjects[2] = seedUri3;

        recordProofsOnDistinctProjects(scientist, seedProjects);

        vm.startPrank(scientist);

        // Approve Cairn contract
        hypercert.setApprovalForAll(address(cairn), true);

        cairn.registerProject(uri, hypercertTokenId, unitPrice);

        vm.stopPrank();

        vm.startPrank(scientist2);

        vm.expectRevert("You are not the creator of this project");
        cairn.recordOutputs(uri, outputsURI);

        vm.stopPrank();
    }


    function testRecordOutputsRevertsIfOutputsAlreadyRecorded() public {
        string[] memory seedProjects = new string[](minRequiredPoR);
        seedProjects[0] = seedUri1;
        seedProjects[1] = seedUri2;
        seedProjects[2] = seedUri3;

        recordProofsOnDistinctProjects(scientist, seedProjects);

        vm.startPrank(scientist);

        // Approve Cairn contract
        hypercert.setApprovalForAll(address(cairn), true);

        cairn.registerProject(uri, hypercertTokenId, unitPrice);

        cairn.recordOutputs(uri, outputsURI);

        vm.expectRevert("Outputs already recorded");
        cairn.recordOutputs(uri, "ipfs://QmAnotherOutputsURI");

        vm.stopPrank();
    }
}
