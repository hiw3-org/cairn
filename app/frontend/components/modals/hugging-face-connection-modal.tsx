import React, { useState } from "react";
import { Modal } from "../ui/modal";
import { useApi } from "../../context/api-context";
import { useAppContext } from "../../context/app-provider";
import {
  HuggingFaceIcon,
  CheckCircleIcon,
  SpinnerIcon,
  InfoIcon,
  ExternalLinkIcon,
  CodeIcon,
  ToolboxIcon,
} from "../ui/icons";

const CONNECTION_STEPS = [
  { id: 1, name: "Why Connect?", icon: InfoIcon },
  { id: 2, name: "Authorize", icon: ToolboxIcon },
  { id: 3, name: "Success", icon: CheckCircleIcon },
];

const StepIndicator = ({ currentStep }: { currentStep: number }) => (
  <div className="flex items-center justify-center space-x-2 mb-8">
    {CONNECTION_STEPS.map((step, idx) => (
      <React.Fragment key={step.id}>
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
            step.id === currentStep
              ? "border-primary bg-primary text-white"
              : step.id < currentStep
              ? "border-primary bg-primary text-white"
              : "border-border dark:border-border-dark text-text-secondary"
          }`}
        >
          <step.icon className="w-5 h-5" />
        </div>
        {idx < CONNECTION_STEPS.length - 1 && (
          <div
            className={`h-0.5 w-12 ${
              step.id < currentStep
                ? "bg-primary"
                : "bg-border dark:bg-border-dark"
            }`}
          />
        )}
      </React.Fragment>
    ))}
  </div>
);

const Step1_WhyConnect = () => (
  <div className="space-y-6">
    <div className="text-center">
      <HuggingFaceIcon className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
      <h2 className="text-2xl font-bold mb-2">Connect Hugging Face</h2>
      <p className="text-text-secondary dark:text-dark-text-secondary">
        Import your models, datasets, and spaces directly into Cairn
      </p>
    </div>

    <div className="space-y-4">
      <div className="flex items-start space-x-3 p-4 rounded-lg bg-primary-light/20 dark:bg-primary/10">
        <CheckCircleIcon className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold mb-1">Auto-Import Your Work</h3>
          <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
            Automatically sync your Hugging Face repositories as Cairn projects
          </p>
        </div>
      </div>

      <div className="flex items-start space-x-3 p-4 rounded-lg bg-primary-light/20 dark:bg-primary/10">
        <CheckCircleIcon className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold mb-1">Track Impact Metrics</h3>
          <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
            Monitor downloads, likes, and community engagement
          </p>
        </div>
      </div>

      <div className="flex items-start space-x-3 p-4 rounded-lg bg-primary-light/20 dark:bg-primary/10">
        <CheckCircleIcon className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold mb-1">Reproducibility Ready</h3>
          <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
            Import with full metadata for easy reproducibility verification
          </p>
        </div>
      </div>
    </div>

    <div className="flex items-start space-x-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
      <CodeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-blue-900 dark:text-blue-200">
        <strong>Secure:</strong> We only request read access to your public
        repositories. You can revoke access anytime from your Hugging Face
        settings.
      </p>
    </div>
  </div>
);

const Step2_Authorize = ({
  isAuthorizing,
  onAuthorize,
}: {
  isAuthorizing: boolean;
  onAuthorize: () => void;
}) => (
  <div className="space-y-6 text-center">
    <HuggingFaceIcon className="w-20 h-20 mx-auto text-yellow-500" />
    <div>
      <h2 className="text-2xl font-bold mb-2">Authorize Cairn</h2>
      <p className="text-text-secondary dark:text-dark-text-secondary">
        You'll be redirected to Hugging Face to approve the connection
      </p>
    </div>

    <div className="bg-hf-gray-100 dark:bg-hf-gray-800 rounded-lg p-6 space-y-3 text-left">
      <h3 className="font-semibold text-center mb-4">Cairn will be able to:</h3>
      <div className="flex items-center space-x-2">
        <CheckCircleIcon className="w-5 h-5 text-status-success" />
        <span className="text-sm">Read your public repositories</span>
      </div>
      <div className="flex items-center space-x-2">
        <CheckCircleIcon className="w-5 h-5 text-status-success" />
        <span className="text-sm">Access repository metadata</span>
      </div>
      <div className="flex items-center space-x-2">
        <CheckCircleIcon className="w-5 h-5 text-status-success" />
        <span className="text-sm">View your public profile</span>
      </div>
    </div>

    <button
      onClick={onAuthorize}
      disabled={isAuthorizing}
      className="w-full bg-primary text-white font-semibold py-3 px-6 rounded-lg hover:bg-primary-hover transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
    >
      {isAuthorizing ? (
        <>
          <SpinnerIcon className="w-5 h-5 animate-spin" />
          <span>Opening Hugging Face...</span>
        </>
      ) : (
        <>
          <HuggingFaceIcon className="w-5 h-5" />
          <span>Continue to Hugging Face</span>
          <ExternalLinkIcon className="w-4 h-4" />
        </>
      )}
    </button>

    <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
      By connecting, you agree to Hugging Face's{" "}
      <a
        href="https://huggingface.co/terms"
        target="_blank"
        className="underline"
      >
        Terms of Service
      </a>
    </p>
  </div>
);

const Step3_Success = ({
  username,
  repoCount,
}: {
  username?: string;
  repoCount?: number;
}) => (
  <div className="space-y-6 text-center">
    <div className="mx-auto w-20 h-20 rounded-full bg-status-success/10 flex items-center justify-center">
      <CheckCircleIcon className="w-12 h-12 text-status-success" />
    </div>

    <div>
      <h2 className="text-2xl font-bold mb-2">Successfully Connected!</h2>
      <p className="text-text-secondary dark:text-dark-text-secondary">
        Your Hugging Face account is now linked to Cairn
      </p>
    </div>

    {username && (
      <div className="bg-primary-light/20 dark:bg-primary/10 rounded-lg p-4">
        <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-1">
          Connected as
        </p>
        <p className="font-semibold text-lg">{username}</p>
        {repoCount !== undefined && (
          <p className="text-sm text-text-secondary dark:text-dark-text-secondary mt-2">
            Found {repoCount} repositories ready to import
          </p>
        )}
      </div>
    )}

    <div className="flex items-center space-x-2 justify-center text-sm text-status-success">
      <CheckCircleIcon className="w-5 h-5" />
      <span className="font-semibold">
        You can now import projects from Hugging Face
      </span>
    </div>
  </div>
);

export const ConnectHuggingFaceModal = ({
  onClose,
}: {
  onClose: () => void;
}) => {
  const api = useApi();
  const { addToast, setCurrentUser } = useAppContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [hfData, setHfData] = useState<{
    username?: string;
    repoCount?: number;
  }>({});

  const handleAuthorize = async () => {
    setIsAuthorizing(true);
    try {
      // Call your backend to get the OAuth URL
      const { authUrl } = await api.initiateHFAuth();

      // Open HuggingFace OAuth in a centered popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const authWindow = window.open(
        authUrl,
        "HuggingFace OAuth",
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Declare interval and timeout refs first
      let pollInterval: NodeJS.Timeout | null = null;
      let timeoutId: NodeJS.Timeout | null = null;

      // Listen for messages from the OAuth callback page
      const handleMessage = async (event: MessageEvent) => {
        console.log("📨 Message received from:", event.origin, "data:", event.data);

        // Accept messages from localhost or your backend domain
        // For development, we'll accept from localhost
        if (!event.origin.includes('localhost') && !event.origin.includes(window.location.hostname)) {
          console.log("⚠️ Message origin rejected:", event.origin);
          return;
        }

        // Verify the message type
        if (event.data?.type === "hf_oauth_success") {
          console.log("✅ HF OAuth success message received!");

          if (pollInterval) clearInterval(pollInterval);
          if (timeoutId) clearTimeout(timeoutId);
          window.removeEventListener("message", handleMessage);

          // Close the popup window
          if (authWindow && !authWindow.closed) {
            authWindow.close();
            console.log("🔒 Popup window closed");
          }
          setIsAuthorizing(false);

          // Fetch the updated connection status
          try {
            const status = await api.getHFStatus();
            console.log("📊 HF Status:", status);

            if (status.connected) {
              // Update user with HF integration info
              setCurrentUser((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  integrations: {
                    ...prev.integrations,
                    huggingface: {
                      connected: true,
                      username: status.username,
                      userId: status.userId,
                      connectedAt: status.connectedAt,
                      lastSync: status.lastSync,
                      scopes: status.scopes || [],
                    },
                  },
                };
              });

              // Get repo count
              try {
                const repos = await api.getHFRepos();
                setHfData({
                  username: status.username,
                  repoCount: repos.length,
                });
              } catch (error) {
                setHfData({ username: status.username });
              }

              setCurrentStep(3);
              addToast("Successfully connected to Hugging Face!", "success");
            }
          } catch (error) {
            console.error("Error fetching HF status:", error);
          }
        }
      };

      window.addEventListener("message", handleMessage);
      console.log("👂 Message listener attached, expecting messages from:", window.location.origin);

      // Poll for connection status as fallback (check more frequently)
      pollInterval = setInterval(async () => {
        // Debug: Log window state
        console.log("🪟 Window state:", {
          exists: !!authWindow,
          closed: authWindow?.closed,
          type: typeof authWindow
        });

        try {
          const status = await api.getHFStatus();
          console.log("🔄 Polling status:", status.connected ? "Connected" : "Not connected");

          if (status.connected) {
            console.log("✅ Polling detected HF connection!");
            if (pollInterval) clearInterval(pollInterval);
            if (timeoutId) clearTimeout(timeoutId);
            window.removeEventListener("message", handleMessage);

            // Try to close the window
            try {
              if (authWindow && !authWindow.closed) {
                authWindow.close();
                console.log("🔒 Popup window closed by polling");
              } else {
                console.log("⚠️ Window already closed or invalid");
              }
            } catch (e) {
              console.log("❌ Error closing window:", e);
            }

            setIsAuthorizing(false);

            // Update user with HF integration info
            setCurrentUser((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                integrations: {
                  ...prev.integrations,
                  huggingface: {
                    connected: true,
                    username: status.username,
                    userId: status.userId,
                    connectedAt: status.connectedAt,
                    lastSync: status.lastSync,
                    scopes: status.scopes || [],
                  },
                },
              };
            });

            // Get repo count
            try {
              const repos = await api.getHFRepos();
              setHfData({
                username: status.username,
                repoCount: repos.length,
              });
            } catch (error) {
              setHfData({ username: status.username });
            }

            setCurrentStep(3);
            addToast("Successfully connected to Hugging Face!", "success");
          }
        } catch (error) {
          console.log("⚠️ Polling error:", error);
        }

        // Only stop polling if window is actually closed AND we haven't detected connection
        // Don't rely solely on authWindow.closed as it can be unreliable
      }, 1000); // Poll every 1 second (faster polling)

      // Stop polling after 5 minutes (timeout)
      timeoutId = setTimeout(() => {
        if (pollInterval) clearInterval(pollInterval);
        window.removeEventListener("message", handleMessage);
        if (currentStep !== 3) {
          setIsAuthorizing(false);
          authWindow?.close();
          addToast("Authorization timed out. Please try again.", "error");
        }
      }, 300000);
    } catch (error: any) {
      console.error("HF auth error:", error);
      addToast(error.message || "Failed to connect to Hugging Face", "error");
      setIsAuthorizing(false);
    }
  };

  const handleComplete = () => {
    onClose();
    // Optionally trigger a page refresh or state update
  };

  return (
    <Modal onClose={onClose} title="">
      <div className="p-8 max-w-2xl">
        <StepIndicator currentStep={currentStep} />

        {currentStep === 1 && <Step1_WhyConnect />}
        {currentStep === 2 && (
          <Step2_Authorize
            isAuthorizing={isAuthorizing}
            onAuthorize={handleAuthorize}
          />
        )}
        {currentStep === 3 && <Step3_Success {...hfData} />}

        <div className="flex justify-end items-center space-x-3 mt-8 pt-6 border-t border-border dark:border-border-dark">
          {currentStep < 3 && (
            <button
              onClick={onClose}
              className="font-semibold py-2 px-4 rounded-lg hover:bg-hf-gray-100 dark:hover:bg-hf-gray-800"
            >
              Cancel
            </button>
          )}

          {currentStep === 1 && (
            <button
              onClick={() => setCurrentStep(2)}
              className="bg-primary text-white font-semibold py-2 px-6 rounded-lg hover:bg-primary-hover"
            >
              Get Started
            </button>
          )}

          {currentStep === 3 && (
            <button
              onClick={handleComplete}
              className="bg-primary text-white font-semibold py-2 px-6 rounded-lg hover:bg-primary-hover"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
