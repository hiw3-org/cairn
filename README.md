# Cairn

![image](https://github.com/user-attachments/assets/03c61a16-7669-44ec-8280-617f433ad560)

## 🎈Live app: https://octopus-app-5rjoy.ondigitalocean.app/ 
* See [Quick Start](#quick-start) below to help you get started.

##  What is Cairn?

**Cairn** is a protocol and platform for **tracking the reuse and reproduction of scientific outputs in embodied AI, and for retroactively rewarding impactful, reproducible research**.
 
 > By leveraging decentralized storage, smart contracts, and tokenized impact assets, Cairn creates a transparent, incentive-aligned ecosystem for scientists, funders, and the broader research community.

![image](https://github.com/user-attachments/assets/434b93dd-dc2e-4e3f-8c3e-6675f94f93d6)

## **Core Features:**  
  - 🔄 Tracks reuse and reproduction of scientific outputs  
  - 🏆 Retroactively rewards impactful work  
  - 🔍 Ensures transparency and data integrity  
---


## Project Motivation 

Scientific research, especially in embodied AI, faces systemic challenges:  

- **Reproducibility crisis**: A large portion of published research cannot be reliably reproduced, leading to wasted effort, erosion of trust, and slower scientific progress.  
- **Poor incentives** for long-term, impactful work: Academic recognition and funding systems tend to reward novelty and publication volume over real-world usability, long-term impact, and reproducibility.
- **Centralized funding**: Funding decisions are concentrated in a few institutions, which can limit diversity in research agendas and hinder innovation from underrepresented contributors.

![image](https://github.com/user-attachments/assets/4ea511fe-d537-448a-839d-b90f58030858)

---
## How Cairn solves these problems

We combined established concepts with a new system (Proof of Reproducibility) designed to provide verifiable evidence for scientific experiments:

- **Proof of Reproducibility (PoR):** Verifiable, cryptographically-secured evidence that experiments have been independently reproduced. 
- **Decentralized Storage:** All research data, models, and proofs are stored on IPFS for permanence and verifiability. 
- **Smart Contracts:** Manage project registration and proof of reproducibility, impact evaluation, and funding distribution on-chain.  
- **Hypercerts:** Tokenized certificates of impact, representing the value of scientific contributions.  
- **Retroactive Funding:** Rewards are distributed based on actual impact and reproducibility, not just proposals.  
- **DAO Governance:** Community-driven evaluation and funding decisions.


![image](https://github.com/user-attachments/assets/f5b31236-e306-4ef6-a37f-c5e832c3da3b)


## Filecoin integration
Cairn integrates Filecoin technology as a foundational layer to ensure decentralized, secure, and verifiable storage of scientific research data and metadata:

- **Smart Contracts on the Filecoin Network:**  
  Cairn’s smart contract is currently deployed on the Filecoin calibration testnet.

- **Data Storage and Retrieval:**  
  All scientific research outputs—including datasets, machine learning models, benchmarks, and Proofs of Reproducibility (PoRs)—are stored on **IPFS**. This ensures **data provenance, immutability, and long-term availability**.

- **Crypto-based Payments with USDFC Stablecoin:**  
  Cairn uses the **USDFC stablecoin**, native to Filecoin’s ecosystem, to enable **stable, trustless, and efficient capital flows** between funders and researchers, supporting usage-based billing and retroactive funding models.

  
## All Architecture & Integrations

| Component         | Technology / Protocol         | Purpose                                              |
|-------------------|------------------------------|------------------------------------------------------|
| Storage           | **Filecoin**, **IPFS**       | Decentralized, verifiable storage of all research data and metadata |
| Payments          | **USDFC Stablecoin**         | Stable, on-chain funding and rewards                 |
| Smart Contracts   | **Filecoin Virtual Machine (FVM)** | Transparent, immutable project and funding logic     |
| Impact Assets     | **Hypercerts**                   | Tokenized, tradable proof of  impact       |

---

## Platform Features:

- **Create Projects**  
  Register new research efforts on-chain, minting Hypercert impact assets to represent contributions
- **Record Outputs**  
  Publish models, datasets, benchmarks, and Proofs of Reproducibility (PoRs) on IPFS, linked via smart contracts.
- **Verify Reproducibility**  
  Submit PoRs—cryptographically hashed experiment logs, video proofs, and receipts—stored on IPFS and immortalized on-chain.
- **Dispute PoRs**  
  Allow community members to challenge PoRs, with a dispute resolution mechanism to ensure integrity.
- **Evaluate Impact**  
  Designated scientists, funders, and evaluators vote on each project’s impact tier. In the future implementations there will be an option of DAO voting.
- **Retroactive Funding**  
  Distribute USDFC funds proportionally to impact-asset holders based on verified impact.
  
---

## How Cairn Works

1. **Project Creation:**  
   Scientists register new research projects. Project metadata and outputs are stored on IPFS and it's CID is registered on-chain.

2. **Recording Outputs:**  
   Models, datasets, and results are published and linked to the project. Again the CID is stored on-chain on the Cairn smart contract.

3. **Proof of Reproducibility (PoR):**  
   Third parties submit cryptographically-secured evidence of successful experiment replication. All PoR data (outputs, logs, receipts, video) is stored on IPFS and linked via our smart contract.

4. **Impact Evaluation:**  
  Currently, designated scientists evaluate and vote on the impact of each project, determining eligibility and tier for retroactive funding. In future implementations, this process will transition to DAO-based voting.

5. **Retroactive Funding:**  
   Once a project meets criteria (outputs, PoRs, impact evaluation), funds are distributed to contributors based on verified impact.

See the [whitepaper folder](../whitepaper/) in the project root for a more detalied overview of the protocol. 

![Concept](assets/Cairn.png)


---

### Quick Start
This is meant to be a quick start guide for users who want to quickly try out the Cairn protocol and platform.

> **Note:** For detailed setup instructions for smart contracts, frontend, and other modules, see the respective subdirectory README files.

#### Wallet Setup
1. **Install MetaMask**:  
   Download and install the [MetaMask browser extension](https://metamask.io/).
2. **Create a Wallet**:
    Follow the instructions to create a new wallet. Make sure to securely store your seed phrase.
3. **Connect to Filecoin Calibration Testnet**:
    - **Cairn app should prompt the user with correct chain data**
    - If not, you can manually add the network:
      - Open MetaMask and click on the network dropdown.
      - Select "Add Network" and enter the following details:
        - **Network Name**: Filecoin Calibration Testnet
        - **New RPC URL**: https://rpc.ankr.com/filecoin_testnet
        - Other data should be filled automatically.
#### Getting Testnet tFIL and USDFC
1. **Get tFIL**:  
   Use the [Filecoin Calibration Faucet](https://faucet.calibnet.chainsafe-fil.io/) to request testnet FIL (tFIL) for gas fees.
2. **Get USDFC**:
    Use the [USDFC Faucet](https://forest-explorer.chainsafe.dev/faucet/calibnet_usdfc) to request USDFC tokens for funding projects.