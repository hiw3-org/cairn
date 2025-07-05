// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Cairn.sol";


contract InitProjectsPostMint is Script {
    Cairn public cairn;
    IHypercertToken public hypercert;

    address public creator;

    struct ProjectData {
        string uri;
        uint256 tokenId;
    }

    ProjectData[] public projects;
    string[] public outputs;   


    function run() external {
        creator = vm.envAddress("ADDRESS");

        cairn = Cairn(vm.envAddress("SEPOLIA_CAIRN"));
        hypercert = IHypercertToken(vm.envAddress("SEPOLIA_HYPERCERT"));

        // Populate projects with known token IDs (obtained off-chain)
        projects.push(ProjectData("bafkreiexm3ucspjmnxdzveyrjja4dix6wkbccnyrfcg6b6xmpssdpvjzii", 324289095675654355680596000882475105517569)); // REPLACE WITH ACTUAL DATA
        projects.push(ProjectData("bafkreiglyhylhdt3ubx7gz3liq6kydqnwtwgo73dculocyr2xsq5kasmsu", 324629378042575294144059375489906873729025)); // REPLACE WITH ACTUAL DATA
        projects.push(ProjectData("bafkreiaenpoakoscko62a7djexn7rg5xhsameyemqoz765p45ckwltqd2a", 324969660409496232607522750097338641940481)); // REPLACE WITH ACTUAL DATA

        // Populate outputs with known data (obtained off-chain)
        // outputs.push("ipfs://outputs-0"); // REPLACE WITH ACTUAL DATA
        // outputs.push("ipfs://outputs-1"); // REPLACE WITH ACTUAL DATA
        // outputs.push("ipfs://outputs-2"); // REPLACE WITH ACTUAL DATA

        vm.startBroadcast();
        hypercert.setApprovalForAll(address(cairn), true);
        for (uint256 i = 0; i < projects.length; i++) {  
            cairn.initProject(projects[i].uri, creator);          
            cairn.storeTokenIDInit(projects[i].uri, projects[i].tokenId, 1e6);
            // cairn.recordOutputs(projects[i].uri, outputs[i]);
        } 
        vm.stopBroadcast();      
    }
}
