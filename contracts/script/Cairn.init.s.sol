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

        cairn = Cairn(vm.envAddress("CALIBRATION_CAIRN"));
        hypercert = IHypercertToken(vm.envAddress("CALIBRATION_HYPERCERT"));

        // Populate projects with known token IDs (obtained off-chain)
        // projects.push(ProjectData("bafkreiatyux6u4o5zknwsv32e6xtcu4le2rrhycy2c5njdljnhyiq3ctpq", 7826494439181584659657615970930668863489)); // REPLACE WITH ACTUAL DATA
        // projects.push(ProjectData("bafkreibo7enuw6dd62xp5elizajsldh5bhcxektewtntaqovdrc2uhwht4", 8166776806102523123120990578362437074945)); // REPLACE WITH ACTUAL DATA
        projects.push(ProjectData("bafkreiefc5d7wnyxbxlcmql454brn4gppfw6hn4cdakqslocrcbp5bkbvy", 8507059173023461586584365185794205286401)); // REPLACE WITH ACTUAL DATA

        // Populate outputs with known data (obtained off-chain)
        // outputs.push("ipfs://outputs-0"); // REPLACE WITH ACTUAL DATA
        // outputs.push("ipfs://outputs-1"); // REPLACE WITH ACTUAL DATA
        // outputs.push("ipfs://outputs-2"); // REPLACE WITH ACTUAL DATA

        vm.startBroadcast();
        hypercert.setApprovalForAll(address(cairn), true);
        for (uint256 i = 0; i < projects.length; i++) {  
            cairn.initProject(projects[i].uri, creator);          
            cairn.storeTokenIDInit(projects[i].uri, projects[i].tokenId, 5e6 * (i+1));
            // cairn.recordOutputs(projects[i].uri, outputs[i]);
        } 
        vm.stopBroadcast();      
    }
}
