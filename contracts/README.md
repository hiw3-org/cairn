# Cairn Contracts

This folder contains the smart contracts and scripts for the **Cairn** protocol, a reproducibility and funding platform built on Ethereum. The contracts are written in Solidity and use [Foundry](https://book.getfoundry.sh/) for development, testing, and deployment.

---

## Overview

### Main Contract: `Cairn.sol`

The `Cairn` contract enables:

- **Project Registration:** Scientists can register projects by linking Hypercert token IDs and metadata URIs.
- **Proof of Reproducibility (PoR):** Community members can submit proofs for projects, which can be disputed and resolved.
- **Impact Setting:** Admins can set the impact level of a project once enough valid PoRs are collected.
- **Funding:** Funders can fund projects using an ERC20 token (e.g., USDC). Funds are distributed to token holders proportionally.
- **Project and Proof Management:** Functions to retrieve project and proof details, user submissions, and more.

### Supporting Contracts

- **Interfaces:**  
  - `IHypercertToken.sol` — Interface for interacting with Hypercert ERC1155 tokens.
---

## Structure

- `src/` — Main contract sources.
- `test/` — Foundry test contracts.
- `script/` — Deployment scripts.
- `interfaces/` — Contract interfaces.

---

## Usage

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) installed (`forge`, `anvil`, etc.)
- Node.js and npm (for frontend or scripting, optional)
- `.env` file with your Alchemy or RPC key (for forking or deployment)

### Build Contracts

```sh
forge build
```

### Run Tests

```sh
forge test
```

### Format Code

```sh
forge fmt
```

### Deploy Contracts

Update your `.env` file with the required addresses and keys, then run:

```sh
forge script script/Cairn.deploy.s.sol:DeployCairn --rpc-url <YOUR_RPC_URL> --private-key <YOUR_PRIVATE_KEY> --broadcast
```

### Run a Local Node

```sh
anvil
```

### Interact with Contracts

You can use `cast` to interact with deployed contracts:

```sh
cast call <contract_address> "functionName(args)" --rpc-url <YOUR_RPC_URL>
```

---

## Key Contract Functions

- `registerProject(projectURI, tokenID, unitPrice)` — Register a new project.
- `storeTokenIDInit(projectURI, tokenID, unitPrice)` — Add initial token to a project (admin).
- `storeTokenID(projectURI, tokenID)` — Add additional tokens to a project.
- `recordOutputs(projectURI, outputsURI)` — Record project outputs.
- `recordProof(projectURI, proofURI)` — Submit a proof of reproducibility.
- `disputeProof(proofURI, disputeURI)` — Dispute a proof.
- `setProjectImpact(projectURI, impactLevel)` — Set project impact (admin).
- `fundProject(amount, projectURI)` — Fund a project.

---

## Additional Resources

- [Foundry Book](https://book.getfoundry.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/4.x/)
- [Hypercerts Protocol](https://docs.hypercerts.org/)
