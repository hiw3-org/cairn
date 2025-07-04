// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Cairn.sol";
import {IHypercertToken} from "../src/interfaces/IHypercertToken.sol";

import "forge-std/console.sol";

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
    uint256 public hypercertTypeId2;
    uint256 public hypercertTokenId2;

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

        
        uint256[] memory fractions = new uint256[](2);
        fractions[0] = 500;
        fractions[1] = 500;

        vm.prank(scientist);
        hypercert.splitFraction(scientist2, hypercertTokenId, fractions);

        uint256[] memory splitTokenIDs = getSplitTokenIDsFromLogs();
        // Pick the one that is not hypercertTokenId
        if (splitTokenIDs[0] != hypercertTokenId) {
            hypercertTokenId2 = splitTokenIDs[0];
        } else {
            hypercertTokenId2 = splitTokenIDs[1];
        }

        // Deploy Cairn contract with minRequiredPoR and maxPoRProject
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

    /// @notice Helper to retreive tokenIDs after split fraction
    function getSplitTokenIDsFromLogs() internal returns (uint256[] memory) {
        Vm.Log[] memory entries = vm.getRecordedLogs();
        bytes32 eventSig = keccak256("BatchValueTransfer(uint256[],uint256[],uint256[],uint256[])");

        for (uint256 i = 0; i < entries.length; i++) {
            if (entries[i].topics.length > 0 && entries[i].topics[0] == eventSig) {
                // The third parameter in the event is toIDs (new tokenIDs)
                // The event is not indexed, so all arrays are in data
                // Decode: (uint256[] typeIDs, uint256[] fromIDs, uint256[] toIDs, uint256[] values)
                (, , uint256[] memory toIDs, ) = abi.decode(entries[i].data, (uint256[], uint256[], uint256[], uint256[]));
                return toIDs;
            }
        }
        revert("BatchValueTransfer event not found");
    }

    /// @notice Helper to record one proof per project for a user on multiple projects
    function recordProofsOnDistinctProjects(address user, string[] memory projectURIs) internal {        
        for (uint256 i = 0; i < projectURIs.length; i++) {
            vm.prank(user);
            cairn.recordProof(projectURIs[i], string(abi.encodePacked("ipfs://proof-", vm.toString(i))));
        }
        vm.warp(block.timestamp + 7 days + 1);
    }

    /// @notice Helper to create fractions
    function buildFractions(uint256 size) public pure returns (uint256[] memory) {
        uint256[] memory fractions = new uint256[](size);
        for (uint256 i = 0; i < size; i++) {
            fractions[i] = 100 * i + 1;
        }
        return fractions;
    }

    function testRegisterProjectRevertsIfDuplicateURI() public {
        string[] memory seedProjects = new string[](minRequiredPoR);
        seedProjects[0] = seedUri1;
        seedProjects[1] = seedUri2;
        seedProjects[2] = seedUri3;

        recordProofsOnDistinctProjects(scientist, seedProjects);

        vm.startPrank(scientist);

        hypercert.setApprovalForAll(address(cairn), true);

        cairn.registerProject(uri, hypercertTokenId, unitPrice);
        vm.expectRevert("Metadata URI already in use");
        cairn.registerProject(uri, hypercertTokenId, unitPrice);

        vm.stopPrank();
    }

    function testStoreTokenIDSuccess() public {
        string[] memory seedProjects = new string[](minRequiredPoR);
        seedProjects[0] = seedUri1;
        seedProjects[1] = seedUri2;
        seedProjects[2] = seedUri3;

        recordProofsOnDistinctProjects(scientist, seedProjects);

        vm.prank(scientist);
        hypercert.setApprovalForAll(address(cairn), true);

        vm.prank(scientist);
        cairn.registerProject(uri, hypercertTokenId, unitPrice);

        vm.prank(scientist2);
        hypercert.setApprovalForAll(address(cairn), true);
        vm.prank(scientist2);
        cairn.storeTokenID(uri, hypercertTokenId2);

        Cairn.Project memory project = cairn.getProject(uri);
        assertTrue(project.tokenIDs.length > 0);
        assertEq(project.tokenIDs[project.tokenIDs.length - 1], hypercertTokenId2);

        vm.stopPrank();
    }

    function testStoreTokenIDRevertsIfZero() public {
        string[] memory seedProjects = new string[](minRequiredPoR);
        seedProjects[0] = seedUri1;
        seedProjects[1] = seedUri2;
        seedProjects[2] = seedUri3;

        recordProofsOnDistinctProjects(scientist, seedProjects);

        vm.startPrank(scientist);

        hypercert.setApprovalForAll(address(cairn), true);

        cairn.registerProject(uri, hypercertTokenId, unitPrice);
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


    function testStoreTokenIDRevertsIfAlreadySet() public {
        string[] memory seedProjects = new string[](minRequiredPoR);
        seedProjects[0] = seedUri1;
        seedProjects[1] = seedUri2;
        seedProjects[2] = seedUri3;

        recordProofsOnDistinctProjects(scientist, seedProjects);

        vm.startPrank(scientist);

        hypercert.setApprovalForAll(address(cairn), true);

        cairn.registerProject(uri, hypercertTokenId, unitPrice);
        vm.expectRevert("Token ID already stored for this project");
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
        vm.expectRevert("You are not owner of tokenID or the tokenID does not exists");
        cairn.registerProject(uri, hypercertTokenId, unitPrice);
        vm.stopPrank();
    }
}
