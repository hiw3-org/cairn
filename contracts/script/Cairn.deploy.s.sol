// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/Cairn.sol";
import "../src/ImpactAssetToken.sol";

contract CairnDeploy is Script {
    function run() external {
        // Get configuration from environment variables
        address paymentTokenAddress = vm.envAddress("PAYMENT_TOKEN_ADDRESS");
        address impactAssetTokenAddress = vm.envAddress("IMPACT_ASSET_TOKEN_ADDRESS");
        address funder = vm.envAddress("FUNDER_ADDRESS");
        address cairnDAO = vm.envAddress("CAIRN_DAO_ADDRESS");
        
        // Get deadline periods from env
        uint256 submissionPeriodDays = vm.envUint("SUBMISSION_PERIOD_DAYS");
        uint256 evaluationPeriodDays = vm.envUint("EVALUATION_PERIOD_DAYS");
        uint256 distributionPeriodDays = vm.envUint("DISTRIBUTION_PERIOD_DAYS");
        
        // Calculate deadlines
        uint256 submissionDeadline = block.timestamp + (submissionPeriodDays * 1 days);
        uint256 evaluationDeadline = submissionDeadline + (evaluationPeriodDays * 1 days);
        uint256 distributionDeadline = evaluationDeadline + (distributionPeriodDays * 1 days);

        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying Cairn...");
        console.log("Deployer:", deployer);
        console.log("Payment Token:", paymentTokenAddress);
        console.log("Impact Asset Token:", impactAssetTokenAddress);
        console.log("Funder:", funder);
        console.log("Cairn DAO:", cairnDAO);
        console.log("Submission Period:", submissionPeriodDays, "days");
        console.log("Evaluation Period:", evaluationPeriodDays, "days");
        console.log("Distribution Period:", distributionPeriodDays, "days");
        console.log("Submission Deadline:", submissionDeadline);
        console.log("Evaluation Deadline:", evaluationDeadline);
        console.log("Distribution Deadline:", distributionDeadline);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy Cairn contract
        Cairn cairn = new Cairn(
            paymentTokenAddress,
            impactAssetTokenAddress,
            funder,
            cairnDAO,
            submissionDeadline,
            evaluationDeadline,
            distributionDeadline
        );

        vm.stopBroadcast();

        // Log deployment information
        console.log("=== DEPLOYMENT SUCCESSFUL ===");
        console.log("Cairn deployed at:", address(cairn));
        console.log("Owner:", cairn.owner());
        console.log("Payment Token:", address(cairn.paymentToken()));
        console.log("Impact Asset Token:", cairn.impactAssetToken());
        console.log("Funder:", cairn.funder());
        console.log("Cairn DAO:", cairn.cairnDAO());
        console.log("Funding Amount:", cairn.fundingAmount());
        console.log("Total Projects:", cairn.getTotalProjects());

        // Save deployment info to file
        string memory deploymentInfo = string(abi.encodePacked(
            "Cairn deployed at: ", 
            vm.toString(address(cairn)),
            "\nOwner: ",
            vm.toString(cairn.owner()),
            "\nFunder: ",
            vm.toString(cairn.funder()),
            "\nCairn DAO: ",
            vm.toString(cairn.cairnDAO()),
            "\nPayment Token: ",
            vm.toString(address(cairn.paymentToken())),
            "\nImpact Asset Token: ",
            vm.toString(cairn.impactAssetToken()),
            "\nNetwork: ",
            vm.toString(block.chainid)
        ));
        
        vm.writeFile("deployments/Cairn.txt", deploymentInfo);
        console.log("Deployment info saved to: deployments/Cairn.txt");
    }
}

contract CairnDeployWithTokenSetup is Script {
    function run() external {
        // This script deploys Cairn AND sets up the ImpactAssetToken integration
        // Uses same environment variables as CairnDeploy
        
        address paymentTokenAddress = vm.envAddress("PAYMENT_TOKEN_ADDRESS");
        address impactAssetTokenAddress = vm.envAddress("IMPACT_ASSET_TOKEN_ADDRESS");
        address funder = vm.envAddress("FUNDER_ADDRESS");
        address cairnDAO = vm.envAddress("CAIRN_DAO_ADDRESS");
        
        uint256 submissionPeriodDays = vm.envUint("SUBMISSION_PERIOD_DAYS");
        uint256 evaluationPeriodDays = vm.envUint("EVALUATION_PERIOD_DAYS");
        uint256 distributionPeriodDays = vm.envUint("DISTRIBUTION_PERIOD_DAYS");
        
        uint256 submissionDeadline = block.timestamp + (submissionPeriodDays * 1 days);
        uint256 evaluationDeadline = submissionDeadline + (evaluationPeriodDays * 1 days);
        uint256 distributionDeadline = evaluationDeadline + (distributionPeriodDays * 1 days);

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy Cairn contract
        Cairn cairn = new Cairn(
            paymentTokenAddress,
            impactAssetTokenAddress,
            funder,
            cairnDAO,
            submissionDeadline,
            evaluationDeadline,
            distributionDeadline
        );

        // Get reference to the ImpactAssetToken
        ImpactAssetToken impactAssetToken = ImpactAssetToken(impactAssetTokenAddress);
        
        // Add Cairn contract as allowed minter (only if deployer is the owner)
        if (impactAssetToken.owner() == deployer) {
            impactAssetToken.addAllowedMinter(address(cairn));
            console.log("Added Cairn as allowed minter to ImpactAssetToken");
        } else {
            console.log("WARNING: Cannot add minter - deployer is not ImpactAssetToken owner");
            console.log("Manually add Cairn as minter:", address(cairn));
        }

        vm.stopBroadcast();

        console.log("Cairn deployed at:", address(cairn));
        console.log("Integration with ImpactAssetToken complete");
    }
}