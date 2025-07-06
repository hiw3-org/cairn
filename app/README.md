<p align="center">
    <img src="public/logo.svg" alt="Cairn Logo" width="200" />
</p>

# Cairn Front End App

## Live app: https://octopus-app-5rjoy.ondigitalocean.app/

![Cairn Front End App](public/scientistImage.png)



## Overview

## Key Technologies

- **w3up-client**: A library for working with IPFS-based storage services.
- **ethers**: A library for connecting to blockchain networks and enabling decentralized features.
- **React**: Provides a component-based architecture for building interactive UIs.
- **TypeScript**: Adds static typing to JavaScript, improving code quality and maintainability.
- **Vite**: Offers lightning-fast development server and optimized production builds.
- **Tailwind CSS**: Enables rapid UI development with utility classes.


## Features

- **Decentralized Storage**: Upload and retrieve files using IPFS.
- **Blockchain Integration**: Interact with smart contracts on Filecoin Calibration test network.
- **Responsive Design**: Mobile-friendly layouts powered by Tailwind CSS.
- **Type-Safe Codebase**: Enhanced reliability and developer experience with TypeScript.

## Usage 
- Register project:
    - Use the `useRegisterProject` hook to register a new project with a name and description.

## Getting Started

1. **Install dependencies**:
    ```bash
    npm install
    ```
2. **Create a `.env` file** in the root directory and add your environment variables:
    ```env
    VITE_AGENT_KEY=xxxxx
    VITE_PROOF=xxxxx
    ```
    Replace `xxxxx` with your actual values. To see how to get these values, refer to the [w3up-client docs](https://docs.storacha.network/)
2. **Run the development server**:
    ```bash
    npm run dev
    ```
3. **Build for production**:
    ```bash
    npm run build
    ```

## Learn More

- [W3up-client](https://docs.storacha.network/)
- [Ethers Docs](https://docs.ethers.org/v5/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)