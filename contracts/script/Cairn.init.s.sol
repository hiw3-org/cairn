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
        projects.push(ProjectData("ipfs://QmSeedProject1", 325650225143338109534449499312202178363393)); // REPLACE WITH ACTUAL DATA
        projects.push(ProjectData("ipfs://QmSeedProject2", 325990507510259047997912873919633946574849)); // REPLACE WITH ACTUAL DATA
        projects.push(ProjectData("ipfs://QmSeedProject3", 326330789877179986461376248527065714786305)); // REPLACE WITH ACTUAL DATA

        // Populate outputs with known data (obtained off-chain)
        outputs.push("ipfs://outputs-0"); // REPLACE WITH ACTUAL DATA
        outputs.push("ipfs://outputs-1"); // REPLACE WITH ACTUAL DATA
        outputs.push("ipfs://outputs-2"); // REPLACE WITH ACTUAL DATA

        vm.startBroadcast();
        hypercert.setApprovalForAll(address(cairn), true);
        for (uint256 i = 0; i < projects.length; i++) {  
            cairn.initProject(projects[i].uri, creator);          
            cairn.storeTokenIDInit(projects[i].uri, projects[i].tokenId, 1e6);
            cairn.recordOutputs(projects[i].uri, outputs[i]);
        } 
        vm.stopBroadcast();      
    }
}
