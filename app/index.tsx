import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppProvider } from "./context/app-provider";
import { IpfsProvider } from "./context/ipfsContext";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const agentKey = import.meta.env.VITE_AGENT_KEY;
const proof = import.meta.env.VITE_PROOF;

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppProvider>
      <IpfsProvider agentKey={agentKey} proof={proof}>
        <App />
      </IpfsProvider>
    </AppProvider>
  </React.StrictMode>
);
