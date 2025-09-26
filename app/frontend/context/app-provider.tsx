"use client";

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import {
  UserRole,
  Project,
  ToastInfo,
  UserProfile,
  Output,
  PoRStatus,
  FundingEvent,
  FundingRound,
  RoundApplicant,
  Notification,
  ResearchDomain,
} from "../lib/types";
// Removed mock imports - will use API data instead
// import {
//   MOCK_PROJECTS,
//   MOCK_USERS,
//   RESEARCHER_WALLET_ALICE,
//   MOCK_FUNDING_HISTORY,
//   CURRENT_USER_WALLET,
//   MOCK_FUNDING_ROUNDS,
//   MOCK_NOTIFICATIONS,
//   REPRODUCIBILITY_TEMPLATES,
//   MOCK_HUGGINGFACE_OUTPUTS,
// } from "../lib/constants";
import {
  CheckCircleIcon,
  AlertTriangleIcon,
  InfoIcon,
  CloseIcon,
} from "../components/ui/icons";

interface AppContextType {
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  userRole: UserRole;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  huggingFaceOutputs: HuggingFaceOutput[];
  setHuggingFaceOutputs: React.Dispatch<
    React.SetStateAction<HuggingFaceOutput[]>
  >;
  currentUser: UserProfile | null;
  toasts: ToastInfo[];
  addToast: (message: string, type?: ToastInfo["type"]) => void;
  dismissToast: (id: number) => void;
  handlePorSubmit: (
    projectId: string,
    reproducibilityData: { notes: string; evidence: Output[] }
  ) => void;
  handleAddProject: (project: Project) => void;
  handleSubmitForReproducibility: (projectId: string) => void;
  handleDispute: (projectId: string, reproducibilityId: string) => void;
  handleInstantFund: (projectId: string, amount: number) => void;
  handleClaimOwnership: (projectId: string) => void;
  handleRegisterClaim: (
    projectId: string,
    projectOwnerAddress: string
  ) => Promise<boolean>;
  fundingHistory: FundingEvent[];
  fundingRounds: FundingRound[];
  setFundingRounds: React.Dispatch<React.SetStateAction<FundingRound[]>>;
  handleCreateFundingRound: (
    round: Omit<
      FundingRound,
      "id" | "status" | "applicationCount" | "totalImpactScore"
    >
  ) => void;
  handleDistributeRoundFunds: (
    roundId: string,
    applicantsToFund: RoundApplicant[]
  ) => void;
  handleApplyToFundingRound: (
    projectId: string,
    roundId: string,
    pitch: string,
    attachments: File[]
  ) => void;
  notifications: Notification[];
  usdcBalance: number;
  handleCreateProjectFromHuggingFace: (
    hfOutputs: HuggingFaceOutput[]
  ) => string;
  handleMintImpactAsset: (roundId: string) => Promise<void>;

  // Auth & Navigation
  connectedWallet: string | null;
  isAuthenticated: boolean;
  connectWallet: (role?: UserRole) => Promise<void>;

  login: (method: "huggingface" | "metamask") => Promise<void>;
  signUp: (data: {
    name: string;
    role: UserRole;
    affiliation: string;
    github: string;
    scholar: string;
    linkedin: string;
  }) => Promise<void>;
  disconnectWallet: () => void;
  forceShowLanding: boolean;
  goToLandingPage: () => void;
  enterApp: () => void;
  isGuestBrowsing: boolean;
  enterAppAsGuest: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDarkMode, setIsDarkModeState] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.Researcher);
  const [projects, setProjects] = useState<Project[]>([]); // Start with empty array
  const [huggingFaceOutputs, setHuggingFaceOutputs] = useState<
    HuggingFaceOutput[]
  >([]); // Start with empty array

  // Commented out mock data initialization
  // const [fundingHistory, setFundingHistory] = useState<FundingEvent[]>(MOCK_FUNDING_HISTORY);
  // const [fundingRounds, setFundingRounds] = useState<FundingRound[]>(MOCK_FUNDING_ROUNDS);
  const [fundingHistory, setFundingHistory] = useState<FundingEvent[]>([]);
  const [fundingRounds, setFundingRounds] = useState<FundingRound[]>([]);

  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  // Commented out mock notifications
  // const [notifications, setNotifications] = useState<Notification[]>(
  //   MOCK_NOTIFICATIONS.sort(
  //     (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  //   )
  // );
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [usdcBalance, setUsdcBalance] = useState(0); // Start with 0 instead of mock balance

  // Auth & Navigation State
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [forceShowLanding, setForceShowLanding] = useState(false);
  const [isGuestBrowsing, setIsGuestBrowsing] = useState(false);

  const isAuthenticated = !!connectedWallet;

  const setIsDarkMode = (dark: boolean) => {
    setIsDarkModeState(dark);
    if (typeof window !== "undefined") {
      const root = window.document.documentElement;
      if (dark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  };

  useEffect(() => {
    // Set initial theme to light mode by default.
    // The toggle in the header will still allow users to switch.
    setIsDarkMode(isDarkMode);
  }, [isDarkMode]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastInfo["type"] = "info") => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        dismissToast(id);
      }, 5000);
    },
    [dismissToast]
  );

  const login = async (method: "huggingface" | "metamask") => {
    setForceShowLanding(false);
    setIsGuestBrowsing(false);

    // TODO: Replace with real authentication
    // const mockAccount = CURRENT_USER_WALLET;
    const mockAccount = "0x1234567890abcdef"; // Temporary for demo

    // TODO: Replace with real user lookup from API
    // let userProfile = MOCK_USERS.find(
    //   (u) => u.walletAddress.toLowerCase() === mockAccount.toLowerCase()
    // );
    // if (!userProfile) {
    //   userProfile = {
    //     walletAddress: mockAccount,
    //     name: "Test User",
    //     porContributedCount: 0,
    //     isVerified: true,
    //     role: method === "huggingface" ? UserRole.Researcher : UserRole.Funder,
    //   };
    // }

    // Temporary user profile for demo
    const userProfile: UserProfile = {
      _id: "temp-user-id",
      username: "demo_user",
      email: "demo@example.com",
      role: method === "huggingface" ? UserRole.Researcher : UserRole.Funder,
    };

    setCurrentUser(userProfile);
    setConnectedWallet(mockAccount);

    if (method === "huggingface") {
      setUserRole(UserRole.Researcher);
      addToast(`Logged in as Researcher via Hugging Face.`, "success");
    } else {
      // metamask
      setUserRole(UserRole.Funder);
      addToast(`Logged in as Funder via MetaMask.`, "success");
    }

    setIsDarkMode(false); // Default to light mode for the app
  };

  const signUp = async (data: {
    name: string;
    role: UserRole;
    affiliation: string;
    github: string;
    scholar: string;
    linkedin: string;
  }) => {
    console.log("New sign-up application submitted:", data);
    addToast(
      "Application submitted! You'll be notified upon verification.",
      "success"
    );
  };

  const disconnectWallet = () => {
    setConnectedWallet(null);
    setCurrentUser(null);
    setUserRole(UserRole.Researcher); // Reset to a default role
    setForceShowLanding(false);
    setIsGuestBrowsing(false);

    // Revert to dark mode for landing page
    setIsDarkMode(true);

    addToast("You have been logged out.", "info");
  };

  const goToLandingPage = () => {
    setForceShowLanding(true);
    setIsGuestBrowsing(false);
  };

  const enterApp = () => {
    setForceShowLanding(false);
    setIsGuestBrowsing(false);
  };

  const enterAppAsGuest = () => {
    setIsGuestBrowsing(true);
    setForceShowLanding(false);
  };

  const handleAddProject = (project: Project) => {
    setProjects((prev) => [project, ...prev]);
    addToast(`Project draft "${project.title}" created!`, "success");
  };

  // TODO: This function needs significant updates to work with new schema
  // Currently commented out the mock-dependent parts
  const handleCreateProjectFromHuggingFace = (
    hfOutputs: HuggingFaceOutput[]
  ): string => {
    if (!currentUser || hfOutputs.length === 0) return "";

    const newProjectId = `proj-${Date.now()}`;

    // TODO: Update this to create projects using the new backend schema
    // This function currently uses many mock constants that need to be replaced
    /*
    const newProject: Project = {
      _id: newProjectId,
      title: `Project from ${hfOutputs[0].name}`,
      researcher_id: currentUser._id || "",
      field: "ml", // Default field
      description: `A new project created by importing ${hfOutputs.length} output(s) from Hugging Face.`,
      project_status: "Draft",
      por_status: "InReview",
      funded_amount: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Add other required fields based on new schema
    };

    setProjects((prev) => [newProject, ...prev]);
    setHuggingFaceOutputs((prev) =>
      prev.map((o) =>
        hfOutputs.find((ho) => ho.id === o.id)
          ? { ...o, status: "Imported", cairnProjectId: newProjectId }
          : o
      )
    );
    addToast(
      `Successfully created new project draft: "${newProject.title}"`,
      "success"
    );
    */

    // Temporary placeholder
    addToast("Project creation from HuggingFace is currently disabled", "info");
    return newProjectId;
  };

  const handleSubmitForReproducibility = (projectId: string) => {
    addToast("Submitting for reproducibility evaluation...", "info");

    // Update to use new schema field names
    setProjects((prev) =>
      prev.map((p) =>
        p._id === projectId ? { ...p, project_status: "Pending Evaluation" } : p
      )
    );

    setHuggingFaceOutputs((prev) =>
      prev.map((o) =>
        o.cairnProjectId === projectId
          ? { ...o, status: "Pending Evaluation" }
          : o
      )
    );

    // Simulate evaluation delay
    setTimeout(() => {
      setProjects((prev) =>
        prev.map((p) =>
          p._id === projectId ? { ...p, project_status: "Evaluated" } : p
        )
      );
      setHuggingFaceOutputs((prev) =>
        prev.map((o) =>
          o.cairnProjectId === projectId ? { ...o, status: "Reproducible" } : o
        )
      );
      addToast("Project evaluation completed!", "success");
    }, 5000);
  };

  // TODO: This function needs to be updated to work with new project schema
  // The new schema doesn't have a 'reproducibilities' array
  const handlePorSubmit = (
    projectId: string,
    reproducibilityData: { notes: string; evidence: Output[] }
  ) => {
    if (!currentUser) return;

    // TODO: Update this to work with the new backend schema
    // The new Project schema doesn't have reproducibilities array
    /*
    setProjects((prevProjects) =>
      prevProjects.map((p) => {
        if (p._id === projectId) {
          // Update POR status instead of adding to reproducibilities array
          return {
            ...p,
            por_status: "Phase1", // Or appropriate status
          };
        }
        return p;
      })
    );
    */

    addToast(
      "PoR submission functionality needs to be updated for new schema",
      "info"
    );
  };

  // TODO: Update this function for new schema
  const handleDispute = (projectId: string, reproducibilityId: string) => {
    // TODO: Implement dispute logic for new schema
    addToast(
      "Dispute functionality needs to be updated for new schema",
      "info"
    );
  };

  const handleInstantFund = (projectId: string, amount: number) => {
    let projectTitle = "";
    setProjects((prevProjects) =>
      prevProjects.map((p) => {
        if (p._id === projectId) {
          // Updated to use _id
          projectTitle = p.title;
          const updatedProject = {
            ...p,
            funded_amount: (p.funded_amount || 0) + amount, // Updated field name
          };
          addToast(
            `Successfully funded $${amount.toLocaleString()} to "${p.title}"!`,
            "success"
          );
          return updatedProject;
        }
        return p;
      })
    );

    if (projectTitle && currentUser) {
      const newFundingEvent: FundingEvent = {
        id: `fh-${Date.now()}`,
        projectId,
        projectTitle,
        amount,
        timestamp: new Date().toISOString().split("T")[0],
        funderWallet: currentUser._id || "unknown", // Updated field
        txHash: `0x${Date.now().toString(16)}${Math.random()
          .toString(16)
          .substring(2, 12)}`,
      };
      setFundingHistory((prev) => [newFundingEvent, ...prev]);
    }
  };

  // TODO: Update this function for new schema
  const handleClaimOwnership = (projectId: string) => {
    if (!currentUser) return;

    // TODO: The new schema doesn't have impactAssetOwners
    // This functionality needs to be redesigned
    addToast("Ownership claiming needs to be updated for new schema", "info");
  };

  // TODO: Update this function for new schema
  const handleRegisterClaim = async (
    projectCid: string,
    projectOwnerAddress: string
  ): Promise<boolean> => {
    if (!currentUser) {
      addToast("Please connect your wallet first.", "error");
      return false;
    }

    // TODO: Update for new schema - projects don't have cid or ownerId fields
    addToast("Claim registration needs to be updated for new schema", "info");
    return false;
  };

  const handleCreateFundingRound = (
    round: Omit<
      FundingRound,
      "id" | "status" | "applicationCount" | "totalImpactScore"
    >
  ) => {
    const newRound: FundingRound = {
      ...round,
      id: `round-${Date.now()}`,
      status: "Open",
      applicationCount: 0,
      totalImpactScore: 0,
    };
    setFundingRounds((prev) => [newRound, ...prev]);

    const newNotification: Notification = {
      id: `notif-${Date.now()}`,
      type: "round_created",
      title: `Round Launched: ${newRound.title}`,
      description: `The new funding round is open for applications until ${new Date(
        newRound.applicationDeadline
      ).toLocaleDateString()}.`,
      date: new Date().toISOString(),
      relatedId: newRound.id,
      action: { text: "View Round" },
    };
    setNotifications((prev) =>
      [newNotification, ...prev].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    );

    addToast(`Funding round "${round.title}" has been created!`, "success");
  };

  const handleDistributeRoundFunds = (
    roundId: string,
    applicantsToFund: RoundApplicant[]
  ) => {
    const round = fundingRounds.find((r) => r.id === roundId);
    if (!round) return;

    const newFundingEvents: FundingEvent[] = [];

    applicantsToFund.forEach((app) => {
      if (!app.fundingAmount || app.fundingAmount <= 0) return;

      const newEvent: FundingEvent = {
        id: `fh-${Date.now()}-${app.projectId}`,
        projectId: app.projectId,
        projectTitle: app.projectTitle,
        amount: app.fundingAmount,
        timestamp: new Date().toISOString().split("T")[0],
        funderWallet: `Round: ${round.title.substring(0, 15)}...`,
        txHash: `0x${Date.now().toString(16)}${Math.random()
          .toString(16)
          .substring(2, 12)}`,
      };
      newFundingEvents.push(newEvent);
    });

    const updatedProjects = projects.map((p) => {
      const fundingInfo = applicantsToFund.find(
        (app) => app.projectId === p._id // Updated to use _id
      );
      if (fundingInfo && fundingInfo.fundingAmount) {
        return {
          ...p,
          funded_amount: (p.funded_amount || 0) + fundingInfo.fundingAmount, // Updated field
          project_status: "Funded", // Updated field
        };
      }
      return p;
    });

    const updatedRounds = fundingRounds.map((r) =>
      r.id === roundId ? { ...r, status: "Closed" as const } : r
    );

    setProjects(updatedProjects);
    setFundingHistory((prev) => [...newFundingEvents, ...prev]);
    setFundingRounds(updatedRounds);

    addToast(`Successfully distributed funds for "${round.title}"!`, "success");
  };

  // TODO: Update this function for new schema
  const getImpactLevel = (fraction: number): "High" | "Medium" | "Low" => {
    // This function references hypercertFraction which doesn't exist in new schema
    if (fraction >= 0.75) return "High";
    if (fraction >= 0.3) return "Medium";
    return "Low";
  };

  // TODO: Update this function for new schema
  const handleApplyToFundingRound = (
    projectId: string,
    roundId: string,
    pitch: string,
    attachments: File[]
  ) => {
    let projectTitle = "";
    let applicantData: RoundApplicant | null = null;

    const updatedProjects = projects.map((p) => {
      if (p._id === projectId) {
        // Updated to use _id
        projectTitle = p.title;
        applicantData = {
          projectId: p._id, // Updated to use _id
          projectTitle: p.title,
          verifiedPors: 0, // TODO: Calculate from new schema
          impactLevel: "Medium", // TODO: Calculate from new schema
          hfUpvotes: 0, // TODO: Get from new schema
          communityScore: 0, // TODO: Calculate from new schema
        };
        return { ...p, project_status: "Pending Evaluation" }; // Updated field
      }
      return p;
    });

    if (!applicantData) {
      addToast(`Project with ID ${projectId} not found.`, "error");
      return;
    }

    const updatedRounds = fundingRounds.map((r) => {
      if (r.id === roundId) {
        return {
          ...r,
          applicants: [...(r.applicants || []), applicantData!],
          applicationCount: (r.applicationCount || 0) + 1,
        };
      }
      return r;
    });

    setProjects(updatedProjects);
    setFundingRounds(updatedRounds);
  };

  const handleMintImpactAsset = async (roundId: string) => {
    addToast("Minting your Impact Asset NFT...", "info");
    // Simulate a delay for the minting process
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setFundingRounds((prevRounds) =>
      prevRounds.map((round) =>
        round.id === roundId ? { ...round, impactAssetMinted: true } : round
      )
    );
    addToast("Impact Asset successfully minted!", "success");
  };

  const value = {
    isDarkMode,
    setIsDarkMode,
    userRole,
    projects,
    setProjects,
    huggingFaceOutputs,
    setHuggingFaceOutputs,
    currentUser,
    toasts,
    addToast,
    dismissToast,
    handlePorSubmit,
    handleAddProject,
    handleSubmitForReproducibility,
    handleDispute,
    handleInstantFund,
    handleClaimOwnership,
    handleRegisterClaim,
    fundingHistory,
    fundingRounds,
    setFundingRounds,
    handleCreateFundingRound,
    handleDistributeRoundFunds,
    handleApplyToFundingRound,
    notifications,
    usdcBalance,
    connectedWallet,
    isAuthenticated,
    login,
    signUp,
    disconnectWallet,
    forceShowLanding,
    goToLandingPage,
    enterApp,
    isGuestBrowsing,
    enterAppAsGuest,
    handleCreateProjectFromHuggingFace,
    handleMintImpactAsset,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} dismissToast={dismissToast} />
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

// Toast Components
const Toast = ({
  message,
  type,
  onDismiss,
}: {
  message: string;
  type: ToastInfo["type"];
  onDismiss: () => void;
}) => {
  const icons = {
    success: <CheckCircleIcon className="w-6 h-6 text-status-success" />,
    error: <AlertTriangleIcon className="w-6 h-6 text-status-danger" />,
    info: <InfoIcon className="w-6 h-6 text-status-info" />,
  };

  return (
    <div className="animate-toast-in bg-background-light dark:bg-background-dark-light shadow-lg rounded-xl pointer-events-auto ring-1 ring-black/5 dark:ring-white/10 overflow-hidden w-full max-w-sm">
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{icons[type]}</div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-semibold text-text dark:text-text-dark">
              {message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={onDismiss}
              className="rounded-full inline-flex text-text-secondary dark:text-text-dark-secondary hover:text-text dark:hover:text-text-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <span className="sr-only">Close</span>
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToastContainer = ({
  toasts,
  dismissToast,
}: {
  toasts: ToastInfo[];
  dismissToast: (id: number) => void;
}) => (
  <div className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50">
    <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onDismiss={() => dismissToast(toast.id)}
        />
      ))}
    </div>
  </div>
);
