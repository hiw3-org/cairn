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
  Reproducibility,
  Output,
  ProjectStatus,
  PoRStatus,
  FundingEvent,
} from "../lib/types";
import { MOCK_PROJECTS, MOCK_FUNDING_HISTORY } from "../lib/constants";
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
  setUserRole: (role: UserRole) => void;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  currentUser: UserProfile;
  toasts: ToastInfo[];
  addToast: (message: string, type?: ToastInfo["type"]) => void;
  dismissToast: (id: number) => void;
  handlePorSubmit: (
    projectId: string,
    reproducibilityData: { notes: string; evidence: Output[] }
  ) => void;
  handleAddProject: (project: Project) => void;
  handleAddOutputs: (projectId: string, outputs: Output[]) => Project;
  handleDispute: (projectId: string, reproducibilityId: string) => void;
  handleInstantFund: (projectId: string, amount: number) => void;
  fundingHistory: FundingEvent[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDarkMode, setIsDarkModeState] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.Scientist);
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [fundingHistory, setFundingHistory] =
    useState<FundingEvent[]>(MOCK_FUNDING_HISTORY);
  const [toasts, setToasts] = useState<ToastInfo[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

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
    setIsDarkMode(false);
  }, []);

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

  const handleAddProject = (project: Project) => {
    setProjects((prev) => [project, ...prev]);
    addToast("Project created successfully!", "success");
  };

  const handleAddOutputs = (projectId: string, outputs: Output[]): Project => {
    let updatedProject: Project | undefined;
    let wasDraftAndOwned = false;

    const updatedProjects = projects.map((p) => {
      if (p.id === projectId) {
        const wasDraft = p.status === ProjectStatus.Draft;
        if (wasDraft && p.ownerId === currentUser.walletAddress) {
          wasDraftAndOwned = true;
        }
        const newStatus = wasDraft ? ProjectStatus.Active : p.status;
        const latestTimestamp = outputs.reduce((latest, current) => {
          return new Date(current.timestamp) > new Date(latest)
            ? current.timestamp
            : latest;
        }, "1970-01-01");

        updatedProject = {
          ...p,
          outputs: outputs, // Set outputs as a one-time action, not additive
          status: newStatus,
          lastOutputDate: latestTimestamp,
        };
        return updatedProject;
      }
      return p;
    });
    setProjects(updatedProjects);

    if (wasDraftAndOwned) {
      setCurrentUser((prevUser) => ({
        ...prevUser,
        porContributedCount: 0,
      }));
      addToast(
        `Project activated! Your PoR contribution quota has been reset.`,
        "success"
      );
    } else {
      addToast(`${outputs.length} output(s) recorded successfully!`, "success");
    }

    return updatedProject!;
  };

  const handlePorSubmit = (
    projectId: string,
    reproducibilityData: { notes: string; evidence: Output[] }
  ) => {
    setProjects((prevProjects) =>
      prevProjects.map((p) => {
        if (p.id === projectId) {
          const newReproducibility: Reproducibility = {
            id: `rep-${Date.now()}`,
            timestamp: new Date().toISOString().split("T")[0],
            verifier: currentUser.walletAddress,
            notes: reproducibilityData.notes,
            evidence: reproducibilityData.evidence.map((e) => ({
              ...e,
              id: e.id.replace("staged", "final"),
            })),
            status: PoRStatus.Waiting,
          };
          return {
            ...p,
            reproducibilities: [...p.reproducibilities, newReproducibility],
          };
        }
        return p;
      })
    );
    setCurrentUser((prevUser) => ({
      ...prevUser,
      porContributedCount: prevUser.porContributedCount + 1,
    }));
    addToast("PoR submitted! Your contribution is recorded.", "success");
  };

  const handleDispute = (projectId: string, reproducibilityId: string) => {
    let reproducibilityAuthor = "";
    setProjects((prevProjects) =>
      prevProjects.map((p) => {
        if (p.id === projectId) {
          const updatedReproducibilities = p.reproducibilities.map((r) => {
            if (r.id === reproducibilityId) {
              reproducibilityAuthor = r.verifier;
              return { ...r, status: PoRStatus.Disputed };
            }
            return r;
          });
          return { ...p, reproducibilities: updatedReproducibilities };
        }
        return p;
      })
    );
    if (reproducibilityAuthor) {
      addToast(
        `Submission from ${reproducibilityAuthor.substring(
          0,
          8
        )}... has been flagged for review.`,
        "info"
      );
    }
  };

  const handleInstantFund = (projectId: string, amount: number) => {
    let projectTitle = "";
    setProjects((prevProjects) =>
      prevProjects.map((p) => {
        if (p.id === projectId) {
          projectTitle = p.title;
          const updatedProject = {
            ...p,
            fundingPool: p.fundingPool + amount,
          };
          if (updatedProject.fundingPool >= (p.fundingGoal || Infinity)) {
            updatedProject.status = ProjectStatus.Funded;
            addToast(`Project "${p.title}" has been fully funded!`, "success");
          } else {
            addToast(
              `Successfully funded $${amount.toLocaleString()} to "${
                p.title
              }"!`,
              "success"
            );
          }
          return updatedProject;
        }
        return p;
      })
    );

    if (projectTitle) {
      const newFundingEvent: FundingEvent = {
        id: `fh-${Date.now()}`,
        projectId,
        projectTitle,
        amount,
        timestamp: new Date().toISOString().split("T")[0],
      };
      setFundingHistory((prev) => [newFundingEvent, ...prev]);
    }
  };

  const value = {
    isDarkMode,
    setIsDarkMode,
    userRole,
    setUserRole,
    projects,
    setProjects,
    currentUser,
    setCurrentUser,
    toasts,
    addToast,
    dismissToast,
    handlePorSubmit,
    handleAddProject,
    handleAddOutputs,
    handleDispute,
    handleInstantFund,
    fundingHistory,
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
    success: <CheckCircleIcon className="w-6 h-6 text-green-500" />,
    error: <AlertTriangleIcon className="w-6 h-6 text-red-500" />,
    info: <InfoIcon className="w-6 h-6 text-cairn-blue-500" />,
  };

  return (
    <div className="animate-toast-in bg-white dark:bg-cairn-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden w-full max-w-sm">
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{icons[type]}</div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={onDismiss}
              className="rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
