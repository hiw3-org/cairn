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
  FundingEvent,
  FundingRound,
  RoundApplicant,
  Notification,
  ProjectStatus,
  HFModel,
  HFDataset,
} from "../lib/types";

import { useApi } from "./api-context";

import {
  CheckCircleIcon,
  AlertTriangleIcon,
  InfoIcon,
  CloseIcon,
} from "../components/ui/icons";

// Simplified HuggingFace output type for now
interface HuggingFaceOutput {
  id: string;
  name: string;
  status: string;
  cairnProjectId?: string;
}

interface AppContextType {
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  userRole: UserRole | null;
  setUserRole: React.Dispatch<React.SetStateAction<UserRole | null>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  huggingFaceOutputs: HuggingFaceOutput[];
  setHuggingFaceOutputs: React.Dispatch<
    React.SetStateAction<HuggingFaceOutput[]>
  >;
  currentUser: UserProfile | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  toasts: ToastInfo[];
  addToast: (message: string, type?: ToastInfo["type"]) => void;
  dismissToast: (id: number) => void;
  handlePorSubmit: (
    projectId: string,
    reproducibilityData: { notes: string; evidence: Output[] }
  ) => void;
  handleLoginSuccess: (user: UserProfile) => void;
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
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
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
  handleCreateProjectFromHuggingFace: (
    hfOutputs: HuggingFaceOutput[]
  ) => string;
  handleMintImpactAsset: (roundId: string) => Promise<void>;

  hfModels: HFModel[];
  setHfModels: React.Dispatch<React.SetStateAction<HFModel[]>>;
  hfDatasets: HFDataset[];
  setHfDatasets: React.Dispatch<React.SetStateAction<HFDataset[]>>;
  hfLastSync: Date | null;
  setHfLastSync: React.Dispatch<React.SetStateAction<Date | null>>;

  // Auth & Navigation
  connectedWallet: string | null;
  setConnectedWallet: React.Dispatch<React.SetStateAction<string | null>>;
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
  setForceShowLanding: React.Dispatch<React.SetStateAction<boolean>>;
  goToLandingPage: () => void;
  enterApp: () => void;
  isGuestBrowsing: boolean;
  setIsGuestBrowsing: React.Dispatch<React.SetStateAction<boolean>>;
  enterAppAsGuest: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDarkMode, setIsDarkModeState] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [huggingFaceOutputs, setHuggingFaceOutputs] = useState<
    HuggingFaceOutput[]
  >([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [fundingHistory, setFundingHistory] = useState<FundingEvent[]>([]);
  const [fundingRounds, setFundingRounds] = useState<FundingRound[]>([]);
  const [toasts, setToasts] = useState<ToastInfo[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Auth & Navigation State
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [forceShowLanding, setForceShowLanding] = useState(false);
  const [isGuestBrowsing, setIsGuestBrowsing] = useState(false);

  const [hfModels, setHfModels] = useState<HFModel[]>([]);
  const [hfDatasets, setHfDatasets] = useState<HFDataset[]>([]);
  const [hfLastSync, setHfLastSync] = useState<Date | null>(null);

  const api = useApi();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await api.checkAuthStatus();
        if (isAuth) {
          const user = await api.getCurrentUser();
          handleLoginSuccess(user, true); // Pass true for initial load
        }
      } catch (error) {
        console.log("Not authenticated");
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    };

    checkAuth();
  }, []);

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

  // Updated handleLoginSuccess function
  const handleLoginSuccess = (user: UserProfile, isInitialLoad = false) => {
    console.log("handleLoginSuccess called with user:", user);
    setCurrentUser(user);

    let frontendRole: UserRole;
    switch (user.role) {
      case "researcher":
        frontendRole = UserRole.Researcher;
        break;
      case "funder":
        frontendRole = UserRole.Funder;
        break;
      case "admin":
        frontendRole = UserRole.Admin;
        break;
      default:
        console.warn(
          "Unknown user role:",
          user.role,
          "defaulting to Researcher"
        );
        frontendRole = UserRole.Researcher;
        break;
    }

    setUserRole(frontendRole);
    setIsAuthenticated(true);
    setIsGuestBrowsing(false);
    setForceShowLanding(false);

    // Only show toast for actual logins, not initial page load
    if (!isInitialLoad) {
      addToast(
        `Welcome back, ${user.profile?.firstName || user.username}!`,
        "success"
      );
    }
  };

  const connectWallet = async () => {
    // TODO: Implement wallet connection logic
    addToast("Wallet connection functionality to be implemented", "info");
  };

  const login = async (method: "huggingface" | "metamask") => {
    setForceShowLanding(false);
    setIsGuestBrowsing(false);

    // TODO: Replace with real authentication
    const mockAccount = "0x1234567890abcdef";

    // Temporary user profile for demo
    const userProfile: UserProfile = {
      _id: "temp-user-id",
      username: "demo_user",
      email: "demo@example.com",
      role: method === "huggingface" ? "researcher" : "funder",
    };

    setCurrentUser(userProfile);
    setConnectedWallet(mockAccount);

    if (method === "huggingface") {
      setUserRole(UserRole.Researcher);
      addToast(`Logged in as Researcher via Hugging Face.`, "success");
    } else {
      setUserRole(UserRole.Funder);
      addToast(`Logged in as Funder via MetaMask.`, "success");
    }

    setIsAuthenticated(true);
    setIsDarkMode(false);
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
    setUserRole(null);
    setIsAuthenticated(false);
    setForceShowLanding(false);
    setIsGuestBrowsing(false);

    // Clear auth tokens
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
    }

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
    setProjects((prevProjects) => {
      const newProjects = [...prevProjects, project];
      return newProjects;
    });
  };

  const handleCreateProjectFromHuggingFace = (
    hfOutputs: HuggingFaceOutput[]
  ): string => {
    if (!currentUser || hfOutputs.length === 0) return "";

    const newProjectId = `proj-${Date.now()}`;
    addToast("Project creation from HuggingFace is currently disabled", "info");
    return newProjectId;
  };

  const handleSubmitForReproducibility = (projectId: string) => {
    addToast("Submitting for reproducibility evaluation...", "info");

    setProjects((prev) =>
      prev.map((p) =>
        p._id === projectId
          ? { ...p, project_status: ProjectStatus.PendingEvaluation }
          : p
      )
    );

    setHuggingFaceOutputs((prev) =>
      prev.map((o) =>
        o.cairnProjectId === projectId
          ? { ...o, status: "Pending Evaluation" }
          : o
      )
    );

    setTimeout(() => {
      setProjects((prev) =>
        prev.map((p) =>
          p._id === projectId
            ? { ...p, project_status: ProjectStatus.Evaluated }
            : p
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

  const handlePorSubmit = (
    projectId: string,
    reproducibilityData: { notes: string; evidence: Output[] }
  ) => {
    if (!currentUser) return;
    addToast(
      "PoR submission functionality needs to be updated for new schema",
      "info"
    );
  };

  const handleDispute = (projectId: string, reproducibilityId: string) => {
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
          projectTitle = p.title;
          const updatedProject = {
            ...p,
            funded_amount: (p.funded_amount || 0) + amount,
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
        funderWallet: currentUser._id || "unknown",
        txHash: `0x${Date.now().toString(16)}${Math.random()
          .toString(16)
          .substring(2, 12)}`,
      };
      setFundingHistory((prev) => [newFundingEvent, ...prev]);
    }
  };

  const handleClaimOwnership = (projectId: string) => {
    if (!currentUser) return;
    addToast("Ownership claiming needs to be updated for new schema", "info");
  };

  const handleRegisterClaim = async (
    projectCid: string,
    projectOwnerAddress: string
  ): Promise<boolean> => {
    if (!currentUser) {
      addToast("Please connect your wallet first.", "error");
      return false;
    }
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
        (app) => app.projectId === p._id
      );
      if (fundingInfo && fundingInfo.fundingAmount) {
        return {
          ...p,
          funded_amount: (p.funded_amount || 0) + fundingInfo.fundingAmount,
          project_status: ProjectStatus.Funded,
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
        projectTitle = p.title;
        applicantData = {
          projectId: p._id,
          projectTitle: p.title,
          verifiedPors: 0,
          impactLevel: "Medium",
          hfUpvotes: 0,
          communityScore: 0,
        };
        return { ...p, project_status: ProjectStatus.PendingEvaluation };
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
    setUserRole,
    projects,
    setProjects,
    huggingFaceOutputs,
    setHuggingFaceOutputs,
    currentUser,
    setCurrentUser,
    toasts,
    addToast,
    dismissToast,
    handlePorSubmit,
    handleLoginSuccess,
    handleAddProject,
    handleSubmitForReproducibility,
    handleDispute,
    handleInstantFund,
    handleClaimOwnership,
    handleRegisterClaim,
    fundingHistory,
    fundingRounds,
    setFundingRounds,
    isAuthenticated,
    setIsAuthenticated,
    handleCreateFundingRound,
    handleDistributeRoundFunds,
    handleApplyToFundingRound,
    notifications,
    connectedWallet,
    setConnectedWallet,
    connectWallet,
    login,
    signUp,
    disconnectWallet,
    forceShowLanding,
    setForceShowLanding,
    goToLandingPage,
    enterApp,
    isGuestBrowsing,
    setIsGuestBrowsing,
    enterAppAsGuest,
    handleCreateProjectFromHuggingFace,
    handleMintImpactAsset,
    hfModels,
    setHfModels,
    hfDatasets,
    setHfDatasets,
    hfLastSync,
    setHfLastSync,
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
