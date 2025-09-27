# Cairn Smart Contracts

This directory contains the smart contracts for the **Cairn** platform - a decentralized funding mechanism for open science research. The contracts are written in Solidity ^0.8.20 and use [Foundry](https://book.getfoundry.sh/) for development, testing, and deployment.

## Overview

Cairn implements a three-phase funding workflow for transparent and accountable research funding:

1. **Submission Phase**: Researchers submit projects with IPFS-stored metadata
2. **Evaluation Phase**: Projects are evaluated and scored by the Cairn DAO
3. **Distribution Phase**: Funds are distributed proportionally based on impact scores and NFT certificates are minted to funders as proof of impact.

## Smart Contracts

### Main Contracts

#### **Cairn.sol** - Core Funding Contract
The primary contract managing the complete research project lifecycle:

**Core Functions:**
- `fundRound(uint256 amount, uint256 totalFundedProjects)` - Funders deposit ERC20 tokens for research funding
- `submitResearchProject(string projectCID, address projectCreator)` - DAO submits researcher projects with IPFS metadata
- `submitProofOfReproducibility(string projectCID, string porCID)` - Submit Proof of Research documents
- `evaluateProject(string projectCID, uint256 score)` - DAO evaluates and scores project impact
- `distributeFunds(string projectCID, uint256 amount)` - Distribute funds to individual projects
- `mintImpactAsset()` - Mint NFT certificates for funders after distribution phase

**Getter Functions:**
- `getProject(string projectCID)` - Retrieve project details
- `getAllProjectCIDs()` - Get all submitted project CIDs
- `getAllSubmittedProjects(address user)` - Get projects submitted by specific address
- `hasProofOfReproducibility(string projectCID)` - Check if project has PoR submitted
- `getRemainingFunds()` - Get remaining undistributed funds
- `getTotalProjects()` - Get total number of projects

**Access Control:**
- Owner-only functions for emergency operations and deadline updates
- CairnDAO-only functions for project management and evaluation
- Funder-specific functions for funding and NFT minting

#### **ImpactAssetToken.sol** - ERC721 NFT Contract
Issues impact certificates as non-fungible tokens:

**Features:**
- Standard ERC721 implementation using OpenZeppelin
- Controlled minting through allowed minter pattern
- Owner can manage minter permissions
- Represents verifiable impact certificates from funded research

**Key Functions:**
- `mint(address to)` - Mint new impact asset NFT
- `addAllowedMinter(address minter)` - Add address to minter allowlist
- `removeAllowedMinter(address minter)` - Remove minter permissions
- `isAllowedMinter(address minter)` - Check minter status

## Project Structure

```
contracts/
├── src/                    # Contract source code
│   ├── Cairn.sol          # Main funding contract
│   └── ImpactAssetToken.sol # ERC721 NFT contract
├── script/                 # Deployment scripts
│   ├── Cairn.deploy.s.sol # Main contract deployment
│   └── ImpactAssetToken.deploy.s.sol # NFT deployment
├── test/                   # Comprehensive test suite
│   └── Cairn.t.sol        # 36 test cases covering all functionality
├── lib/                    # External dependencies
│   ├── forge-std/          # Foundry testing framework
│   └── openzeppelin-contracts/ # Security-audited contract library
├── .env.example           # Environment configuration template
└── foundry.toml           # Foundry project configuration
```

## Development Setup

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) toolkit installed
- Git for version control
- Basic knowledge of Solidity and smart contract development

### Installation

1. **Install dependencies:**
```bash
forge install
```

2. **Compile contracts:**
```bash
forge build
```

3. **Run comprehensive test suite:**
```bash
forge test -vv
```

The test suite includes **36 comprehensive tests** covering:
- ✅ Contract initialization and configuration
- ✅ Funding round management
- ✅ Project submission and validation  
- ✅ Proof of Research workflow
- ✅ Project evaluation mechanisms
- ✅ Fund distribution algorithms
- ✅ NFT minting functionality
- ✅ Access control and security
- ✅ Edge cases and error conditions
- ✅ Emergency functions and deadline management

### Code Quality

```bash
# Format code according to Solidity style guide
forge fmt

# Generate test coverage report
forge coverage

# Run gas usage analysis
forge test --gas-report
```

## Deployment

### Configuration

1. **Set up environment variables:**
```bash
cp .env.example .env
```

2. **Configure deployment parameters in `.env`:**
```bash
# Network Configuration
PRIVATE_KEY=your_deployment_private_key
RPC_URL_SEPOLIA=https://eth-sepolia.g.alchemy.com/v2/your_api_key
RPC_URL_FILECOIN=https://api.node.glif.io/rpc/v1
ETHERSCAN_API_KEY=your_etherscan_api_key

# Contract Addresses (SET THESE BEFORE DEPLOYMENT)
PAYMENT_TOKEN_ADDRESS=0x65432109876543210987654321098765432109876
FUNDER_ADDRESS=0x1234567890123456789012345678901234567890
CAIRN_DAO_ADDRESS=0x2345678901234567890123456789012345678901

# Timing Configuration (SET THESE BEFORE DEPLOYMENT)
SUBMISSION_PERIOD_DAYS=30   # Project submission window
EVALUATION_PERIOD_DAYS=14   # DAO evaluation period
DISTRIBUTION_PERIOD_DAYS=7  # Fund distribution period
```

### Deploy to Networks

#### Deploy ImpactAssetToken (required first):
```bash
forge script script/ImpactAssetToken.deploy.s.sol:ImpactAssetTokenDeploy \
  --rpc-url $RPC_URL_SEPOLIA \
  --broadcast \
  --verify
```

#### Deploy Cairn Contract:
```bash
forge script script/Cairn.deploy.s.sol:CairnDeploy \
  --rpc-url $RPC_URL_SEPOLIA \
  --broadcast \
  --verify
```

#### Local Development:
```bash
# Start local Ethereum node
anvil

# Deploy to local network
forge script script/Cairn.deploy.s.sol:CairnDeploy \
  --rpc-url http://localhost:8545 \
  --broadcast
```

## Contract Interaction

### Using Cast (Foundry CLI)

```bash
# Check contract state
cast call <contract_address> "getTotalProjects()" --rpc-url $RPC_URL_SEPOLIA

# Submit a transaction
cast send <contract_address> "fundRound(uint256,uint256)" 1000000000000000000 5 \
  --private-key $PRIVATE_KEY \
  --rpc-url $RPC_URL_SEPOLIA

# Read project details
cast call <contract_address> "getProject(string)" "QmExampleCID123" \
  --rpc-url $RPC_URL_SEPOLIA
```

## Additional Resources

- [Foundry Book](https://book.getfoundry.sh/) - Complete Foundry documentation
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/4.x/) - Security-focused contract library
- [Solidity Documentation](https://docs.soliditylang.org/) - Official Solidity language reference
- [Ethereum Development](https://ethereum.org/en/developers/) - Ethereum developer resources
