import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { AppProvider } from "./context/app-provider";
import { ContractProvider } from "./context/contract-context";
import { ApiProvider } from "./context/api-context";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Get the API URL from environment variables
const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
console.log("Using API URL:", apiUrl);

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppProvider>
      <ApiProvider apiUrl={apiUrl}>
        <ContractProvider>
          <App />
        </ContractProvider>
      </ApiProvider>
    </AppProvider>
  </React.StrictMode>
);
