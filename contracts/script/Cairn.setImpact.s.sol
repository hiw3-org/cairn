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
        cairn.setProjectImpact("bafkreiatyux6u4o5zknwsv32e6xtcu4le2rrhycy2c5njdljnhyiq3ctpq", Cairn.Impact.MEDIUM);
        vm.stopBroadcast();      
    }
}
