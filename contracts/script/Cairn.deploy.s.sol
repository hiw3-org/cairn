// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Cairn.sol";

contract DeployCairn is Script {
    function run() external {
        // Replace these addresses with actual deployed contract addresses on your network
        address hypercertTokenAddress = vm.envAddress("SEPOLIA_HYPERCERT");
        address paymentTokenAddress = vm.envAddress("SEPOLIA_USDC");

        uint8 minRequiredPoR = 0; // Minimum required proof of relevance (PoR) for a project
        uint8 maxPoRProject = 10;
        uint256 disputeWindowPoR = 7 days;
        uint256 maxFundingLow = 1e9;    // 1000 USDC (6 decimals)
        uint256 maxFundingMedium = 5e9;  // 5000 USDC (6 decimals)
        uint256 maxFundingHigh = 10e9;   // 10000 USDC (6 decimals)

        vm.startBroadcast();

        Cairn cairn = new Cairn(
            hypercertTokenAddress,
            paymentTokenAddress,
            minRequiredPoR,
            maxPoRProject,
            disputeWindowPoR,
            maxFundingLow,
            maxFundingMedium,
            maxFundingHigh
        );

        vm.stopBroadcast();

        console.log("Cairn deployed at:", address(cairn));
    }
}
