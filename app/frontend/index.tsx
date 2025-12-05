import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { AppProvider } from "./context/app-provider";
import { ContractProvider } from "./context/contract-context";
import { ApiProvider } from "./context/api-context";
import { WalletProvider } from "./context/wallet-context"; 

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Get the API URL from environment variables
const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ApiProvider apiUrl={apiUrl}>
      <AppProvider>
        <ContractProvider>
          <WalletProvider>
            <App />
          </WalletProvider>
        </ContractProvider>
      </AppProvider>
    </ApiProvider>
  </React.StrictMode>
);
