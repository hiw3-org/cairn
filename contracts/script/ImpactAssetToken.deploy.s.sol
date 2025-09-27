// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/ImpactAssetToken.sol";

contract ImpactAssetTokenDeploy is Script {
    function run() external {
        // Configuration - Replace these with actual values for deployment
        string memory tokenName = "Cairn Impact Asset";
        string memory tokenSymbol = "CIA";

        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address initialOwner = deployer;
        
        console.log("Deploying ImpactAssetToken...");
        console.log("Deployer:", deployer);
        console.log("Initial Owner:", initialOwner);
        console.log("Token Name:", tokenName);
        console.log("Token Symbol:", tokenSymbol);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy the ImpactAssetToken
        ImpactAssetToken impactAssetToken = new ImpactAssetToken(
            tokenName,
            tokenSymbol,
            initialOwner
        );
        
        vm.stopBroadcast();
        
        // Log deployment information
        console.log("=== DEPLOYMENT SUCCESSFUL ===");
        console.log("ImpactAssetToken deployed at:", address(impactAssetToken));
        console.log("Owner:", impactAssetToken.owner());
        console.log("Name:", impactAssetToken.name());
        console.log("Symbol:", impactAssetToken.symbol());
        console.log("Next Token ID:", impactAssetToken.getNextTokenId());
        console.log("Total Supply:", impactAssetToken.totalSupply());
        
        
        // Save deployment info to file
        string memory deploymentInfo = string(abi.encodePacked(
            "ImpactAssetToken deployed at: ", 
            vm.toString(address(impactAssetToken)),
            "\nOwner: ",
            vm.toString(impactAssetToken.owner()),
            "\nNetwork: ",
            vm.toString(block.chainid)
        ));
        
        vm.writeFile("deployments/ImpactAssetToken.txt", deploymentInfo);
        console.log("Deployment info saved to: deployments/ImpactAssetToken.txt");
    }
}