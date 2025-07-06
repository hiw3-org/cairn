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
        vm.startBroadcast();
        cairn.storeTokenID("bafkreibo7enuw6dd62xp5elizajsldh5bhcxektewtntaqovdrc2uhwht4", 324289095675654355680596000882475105517571);
        vm.stopBroadcast();      
    }
}
