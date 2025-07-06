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
        vm.startBroadcast();
        cairn.setProjectImpact("bafkreib35d7b5xbsf36kmocxs2ju5ftgcstujqgj4aawiz56gvhxlyjklm", Cairn.Impact.MEDIUM);
        vm.stopBroadcast();      
    }
}
