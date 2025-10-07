import React from "react";
import { LandingPage } from "./components/landing/landing-page";
import { HowItWorksPage } from "./components/how-it-works/how-it-works-page";
import Header from "./components/layout/header";
import { ResearcherDashboard } from "./components/dashboard/scientist-dashboard";
import { FunderDashboard } from "./components/dashboard/funder-dashboard";
import { ImpactOwnerDashboard } from "./components/dashboard/impact-owner-dashboard";
import { ProjectDetailView } from "./components/projects/project-detail-view";
import { SubmitPorModal } from "./components/modals/submit-por-modal";
import { ReproducibilityDetailModal } from "./components/modals/reproduction-detail-modal";
import { useAppContext } from "./context/app-provider";
import { CreateProjectWizardModal } from "./components/modals/create-project-wizard-modal";
import { useApi } from "./context/api-context";
import { useWalletConnection, useWalletActions, usePrivyAuth } from "./context/wallet-context";
import {
  UserRole,
  Project,
  Reproducibility,
  Output,
  FundingRound,
  ProjectStatus,
} from "./lib/types";
import { AppLogo } from "./components/ui/logo";
import {
  FileTextIcon,
  ChartBarIcon,
  GavelIcon,
  BookOpenIcon,
} from "./components/ui/icons";
import { AppFooter } from "./components/landing/landing-page";
import { BottomNavBar } from "./components/layout/bottom-nav-bar";
import { FundingRoundDetailModal } from "./components/modals/funding-round-detail-modal";
import { OutputsLibrary } from "./components/dashboard/outputs-library";
import { ApplyToFundingModal } from "./components/modals/apply-to-funding-modal";
import { ProofOfReproducibilityModal } from "./components/modals/proof-of-reproducibility-modal";

/**
 * Sidebar component that displays navigation items based on user role
 * Shows different menu items for researchers vs funders
 */
const Sidebar = ({
  activePage,
  onNavigate,
  draftProjectsCount,
  newOpportunitiesCount,
}: {
  activePage: string;
  onNavigate: (page: string) => void;
  draftProjectsCount: number;
  newOpportunitiesCount: number;
}) => {
  const { userRole } = useAppContext();

  // Navigation items for researchers - includes project management and funding opportunities
  const researcherNavItems = [
    { id: "outputs", label: "Reproduced Projects", icon: BookOpenIcon },
    {
      id: "projects",
      label: "My Projects",
      icon: FileTextIcon,
      notificationCount: draftProjectsCount, // Shows count of draft projects
    },
    {
      id: "funding",
      label: "Funding",
      icon: ChartBarIcon,
      notificationCount: newOpportunitiesCount,
      disabled: true, // Shows count of new funding opportunities
    },
    { id: "dao", label: "DAO", icon: GavelIcon, disabled: true }, // Coming soon feature
  ];

  // Navigation items for funders - focuses on portfolio management
  const funderNavItems = [
    { id: "dashboard", label: "Dashboard", icon: ChartBarIcon },
    { id: "portfolio", label: "Portfolio", icon: FileTextIcon },
    { id: "dao", label: "DAO", icon: GavelIcon, disabled: true }, // Coming soon feature
  ];

  // Select appropriate nav items based on user role
  let navItems: (
    | (typeof researcherNavItems)[0]
    | (typeof funderNavItems)[0]
  )[] = [];
  if (userRole === UserRole.Researcher) {
    navItems = researcherNavItems;
  } else if (userRole === UserRole.Funder) {
    navItems = funderNavItems;
  }

  return (
    <aside className="w-64 bg-background-light dark:bg-background-dark-light border-r border-border dark:border-border-dark flex-shrink-0 flex flex-col hidden lg:flex">
      {/* Logo section */}
      <div className="h-20 flex items-center px-6 border-b border-border dark:border-border-dark">
        <AppLogo />
      </div>

      {/* Navigation menu */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => !(item as any).disabled && onNavigate(item.id)}
            disabled={(item as any).disabled}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200 ${
              activePage === item.id
                ? "bg-hf-gray-100 text-text-primary dark:bg-hf-gray-800 dark:text-dark-text-primary"
                : (item as any).disabled
                ? "text-hf-gray-400 dark:text-hf-gray-600 cursor-not-allowed"
                : "text-text-secondary dark:text-dark-text-secondary hover:bg-hf-gray-100 hover:text-text-primary dark:hover:bg-hf-gray-800 dark:hover:text-dark-text-primary"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>

            {/* Notification badge for items with counts */}
            {/* {"notificationCount" in item && item.notificationCount > 0 && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-status-danger text-white text-xs font-bold">
                {item.notificationCount}
              </span>
            )} */}

            {/* "Soon" badge for disabled items */}
            {(item as any).disabled && (
              <span className="ml-auto text-xs font-bold bg-hf-gray-200 text-hf-gray-500 dark:bg-hf-gray-700 dark:text-hf-gray-400 px-2 py-0.5 rounded-full">
                Soon
              </span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
};

/**
 * Main application layout wrapper that includes sidebar, header, and footer
 * Provides consistent layout structure across all authenticated pages
 */
const AppLayout = ({
  children,
  activePage,
  onNavigate,
  draftProjectsCount,
  newOpportunitiesCount,
}: {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  draftProjectsCount: number;
  newOpportunitiesCount: number;
}) => {
  const { userRole } = useAppContext();

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark font-sans flex">
      {/* Show sidebar for all roles except Impact Owners */}
      {userRole !== UserRole.ImpactOwner && (
        <Sidebar
          activePage={activePage}
          onNavigate={onNavigate}
          draftProjectsCount={draftProjectsCount}
          newOpportunitiesCount={newOpportunitiesCount}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onNavigate={onNavigate} />
        <main className="flex-grow overflow-y-auto">
          <div className="pb-16 lg:pb-0">{children}</div>
        </main>
        <AppFooter />

        {/* Mobile navigation bar */}
        <BottomNavBar
          activePage={activePage}
          onNavigate={onNavigate}
          draftProjectsCount={draftProjectsCount}
          newOpportunitiesCount={newOpportunitiesCount}
        />
      </div>
    </div>
  );
};

/**
 * Public layout for unauthenticated users
 * Simpler layout without sidebar, used for guest browsing and landing pages
 */
const PublicLayout = ({
  children,
  selectedProject,
  onSelectProject,
  onBackToLibrary,
}: {
  children: React.ReactNode;
  selectedProject?: Project | null;
  onSelectProject?: (project: Project) => void;
  onBackToLibrary?: () => void;
}) => {
  const { goToLandingPage } = useAppContext();

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark font-sans flex flex-col">
      {/* Simple header with login/signup buttons */}
      <header className="relative z-30 h-20 flex-shrink-0 bg-background-light/80 dark:bg-background-dark-light/80 backdrop-blur-lg border-b border-border dark:border-border-dark flex items-center justify-between px-6 lg:px-8">
        <AppLogo />
        <div className="flex items-center space-x-2">
          <button
            onClick={goToLandingPage}
            className="font-semibold text-sm py-2 px-4 rounded-full hover:bg-hf-gray-100 dark:hover:bg-hf-gray-800 transition-colors"
          >
            Log In
          </button>
          <button
            onClick={goToLandingPage}
            className="bg-primary text-primary-text font-semibold text-sm py-2 px-4 rounded-full hover:bg-primary-hover transition-colors"
          >
            Sign Up
          </button>
        </div>
      </header>
      <main className="flex-grow">{children}</main>
      <AppFooter />
    </div>
  );
};

/**
 * Main App component - handles routing and state management
 * Orchestrates the entire application flow based on authentication status and user role
 */
export function App() {
  // Static page routing for public pages
  type StaticPage = "landing" | "howitworks";
  const [staticPage, setStaticPage] = React.useState<StaticPage>("landing");

  // Loading and selection states
  const [isLoadingProjects, setIsLoadingProjects] = React.useState(false);
  const [guestSelectedProject, setGuestSelectedProject] =
    React.useState<Project | null>(null);
  const hasLoadedHFData = React.useRef(false);

  // Wallet connection and authentication hooks
  const walletConnection = useWalletConnection();
  const privyAuth = usePrivyAuth();

  // Get app context and API functions
  const {
    userRole,
    projects,
    currentUser,
    handlePorSubmit,
    handleAddProject,
    handleDispute,
    isAuthenticated,
    forceShowLanding,
    goToLandingPage,
    isGuestBrowsing,
    setProjects,
    addToast,
    setHfModels,
    setHfDatasets,
    setHfLastSync,
  } = useAppContext();

  const api = useApi();

  // Project selection and navigation state
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(
    null
  );
  const [activeDashboardPage, setActiveDashboardPage] = React.useState(
    userRole === UserRole.Researcher ? "outputs" : "dashboard"
  );

  const [isNewProjectWizardOpen, setIsNewProjectWizardOpen] =
    React.useState(false);
  const [newProjectOutputs, setNewProjectOutputs] = React.useState<
    HuggingFaceOutput[]
  >([]);

  // Guest browsing handlers
  const handleGuestSelectProject = (project: Project) => {
    setGuestSelectedProject(project);
  };

  const handleGuestBackToLibrary = () => {
    setGuestSelectedProject(null);
  };

  // ===== MODAL STATE MANAGEMENT =====
  // Handles all the different modals that can be opened throughout the app

  const [
    isReproducibilityDetailModalOpen,
    setIsReproducibilityDetailModalOpen,
  ] = React.useState(false);
  const [isPorModalOpen, setIsPorModalOpen] = React.useState(false);
  const [isFundingRoundDetailModalOpen, setIsFundingRoundDetailModalOpen] =
    React.useState(false);
  const [isApplyFundingModalOpen, setIsApplyFundingModalOpen] =
    React.useState(false);
  const [isProofOfReproModalOpen, setIsProofOfReproModalOpen] =
    React.useState(false);

  // Modal data state - tracks which project/data is being operated on
  const [projectToApply, setProjectToApply] = React.useState<Project | null>(
    null
  );
  const [selectedFundingRound, setSelectedFundingRound] =
    React.useState<FundingRound | null>(null);
  const [selectedProjectForProof, setSelectedProjectForProof] =
    React.useState<Project | null>(null);

  const [reproducibilityModalData, setReproducibilityModalData] =
    React.useState<{
      reproducibility: Reproducibility;
      isOwner: boolean;
      projectId: string;
    } | null>(null);

  // ===== PROJECT LOADING FROM API =====
  /**
   * Loads projects from the backend API
   * Uses the new unified Project schema that matches MongoDB structure
   */
  const loadProjectsFromApi = React.useCallback(async () => {
    if (isLoadingProjects) return; // Prevent duplicate requests

    setIsLoadingProjects(true);
    try {
      const result = await api.fetchProjects({ limit: 50 });
      console.log("Fetched projects from API:", result);

      if (!result || !result.projects) {
        throw new Error("Invalid response from server");
      }

      // Projects from API already match our unified Project interface
      setProjects(result.projects);
      console.log("Set projects:", result.projects);
    } catch (error) {
      console.error("Failed to load projects:", error);
      addToast("Failed to load projects from server", "error");
    } finally {
      setIsLoadingProjects(false);
    }
  }, [api, setProjects, addToast, isLoadingProjects]);

  // Load projects when component mounts or authentication status changes
  React.useEffect(() => {
    if (isAuthenticated || isGuestBrowsing) {
      loadProjectsFromApi();
    }
  }, [isAuthenticated, isGuestBrowsing]);

  // ===== HUGGINGFACE DATA LOADING =====
  /**
   * Loads HuggingFace repos and datasets if user has connected their account
   * This enriches the UI with real data from their HF profile
   */
  React.useEffect(() => {
    const fetchHFData = async () => {
      // Don't fetch if already loaded or if user/auth not ready
      if (hasLoadedHFData.current) return;
      if (!isAuthenticated || !currentUser) return;
      if (!currentUser?.integrations?.huggingface?.connected) return;

      hasLoadedHFData.current = true; // Set before fetching to prevent race conditions

      try {
        console.log("Fetching HuggingFace data...");
        const [repos, datasets] = await Promise.all([
          api.getHFRepos(50),
          api.getHFDatasets(50),
        ]);

        setHfModels(repos);
        setHfDatasets(datasets);
        setHfLastSync(new Date());

        addToast("HuggingFace data synced successfully", "success");
      } catch (error) {
        console.error("Failed to load HuggingFace data:", error);
        hasLoadedHFData.current = false; // Reset on error so they can retry
        addToast("Failed to sync HuggingFace data", "error");
      }
    };

    // Trigger fetch when BOTH auth and currentUser are ready AND HF is connected
    if (isAuthenticated && currentUser?.integrations?.huggingface?.connected) {
      fetchHFData();
    }

    // Reset the flag when user logs out
    if (!isAuthenticated) {
      hasLoadedHFData.current = false;
    }
  }, [
    isAuthenticated,
    currentUser, // Changed from just checking the nested property
    api,
    setHfModels,
    setHfDatasets,
    setHfLastSync,
    addToast,
  ]);
  // Count draft projects for the current researcher
  const draftProjectsCount = React.useMemo(() => {
    if (!currentUser || userRole !== UserRole.Researcher) return 0;
    return projects.filter(
      (p) =>
        p.researcher_id === currentUser._id && // Updated to use new schema field
        p.project_status === ProjectStatus.Draft // Updated to use new schema field
    ).length;
  }, [projects, currentUser, userRole]);

  const newOpportunitiesCount = React.useMemo(() => {
    // For now, return 0 as a placeholder
    // TODO: Calculate based on funding rounds or opportunities from your app context
    return 0;
  }, []);

  // ===== NAVIGATION HANDLERS =====

  const handleStaticNavigate = (page: StaticPage) => {
    setStaticPage(page);
    window.scrollTo(0, 0);
  };

  const handleSelectProject = (project: Project) => {
    console.log("handleSelectProject called with:", project.title, project._id);
    setSelectedProject(project);
  };

  const handleOpenNewProjectModal = () => {
    setNewProjectOutputs([]); // Start with no outputs
    setIsNewProjectWizardOpen(true);
  };

  const handleBackToDashboard = () => {
    setSelectedProject(null);
  };

  // ===== REPRODUCIBILITY HANDLERS =====

  const handleViewReproducibility = (
    reproducibility: Reproducibility,
    project: Project
  ) => {
    if (!currentUser) return;
    setReproducibilityModalData({
      reproducibility,
      isOwner: project.researcher_id === currentUser._id, // Updated to use new schema
      projectId: project._id, // Updated to use new schema
    });
    setIsReproducibilityDetailModalOpen(true);
  };

  const handleCloseReproducibilityModal = () => {
    setIsReproducibilityDetailModalOpen(false);
    setReproducibilityModalData(null);
  };

  const onPorSubmitAndExit = (
    projectId: string,
    data: { notes: string; evidence: Output[] }
  ) => {
    handlePorSubmit(projectId, data);
    setIsPorModalOpen(false);
  };

  const handleDisputeAndClose = (reproducibilityId: string) => {
    if (!reproducibilityModalData) return;
    handleDispute(reproducibilityModalData.projectId, reproducibilityId);
    handleCloseReproducibilityModal();
  };

  // ===== DASHBOARD NAVIGATION =====

  const handleDashboardNavigation = (page: string) => {
    if (page === "landing") {
      goToLandingPage();
      return;
    }
    setSelectedProject(null); // Clear selected project when navigating
    setActiveDashboardPage(page);
  };

  // ===== FUNDING ROUND HANDLERS =====

  const handleOpenFundingRoundDetail = (round: FundingRound) => {
    setSelectedFundingRound(round);
  };

  const handleCloseFundingRoundDetail = () => {
    setSelectedFundingRound(null);
    setIsFundingRoundDetailModalOpen(false);
  };

  const handleSelectProjectFromRoundModal = (project: Project) => {
    handleCloseFundingRoundDetail();
    handleSelectProject(project);
  };

  // ===== MODAL HANDLERS =====

  const handleOpenApplyFundingModal = (project: Project) => {
    setProjectToApply(project);
    setIsApplyFundingModalOpen(true);
  };

  const handleOpenProofModal = (project: Project) => {
    setSelectedProjectForProof(project);
    setIsProofOfReproModalOpen(true);
  };

  const handleProjectCreated = React.useCallback(
    (createdProject: Project) => {
      // Call the context handler
      handleAddProject(createdProject);
    },
    [handleAddProject, projects]
  );

  // Set default dashboard page based on user role
  React.useEffect(() => {
    if (userRole === UserRole.Researcher) {
      setActiveDashboardPage("outputs");
    } else if (userRole === UserRole.Funder) {
      setActiveDashboardPage("dashboard");
    } else {
      setActiveDashboardPage("claim"); // For Impact Owner
    }
  }, [userRole]);

  // ===== RENDER LOGIC =====
  
  // Global Privy Test Display (shows auth + wallet status on all pages)
  const WalletTestDisplay = () => {
    const { connectExternal } = useWalletActions();
    
    return (
      <div style={{ 
        position: 'fixed', 
        top: '10px', 
        right: '10px', 
        background: 'rgba(0,0,0,0.9)', 
        color: 'white', 
        padding: '12px', 
        borderRadius: '8px', 
        fontSize: '11px', 
        zIndex: 9999,
        fontFamily: 'monospace',
        border: '1px solid #333',
        minWidth: '220px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>🔗 Privy Integration Test</div>
        
        {/* Privy Authentication Status */}
        <div style={{ marginBottom: '4px' }}>
          Privy Auth: {privyAuth.isAuthenticated ? '✅ Logged in' : '❌ Not logged in'}
        </div>
        
        {/* Cairn Authentication Status */}
        <div style={{ marginBottom: '4px' }}>
          Cairn Auth: {isAuthenticated ? '✅ Logged in' : '❌ Not logged in'}
        </div>
        
        {/* Wallet Status */}
        <div style={{ marginBottom: '4px' }}>
          Wallet: {walletConnection.isConnected ? '✅ Connected' : '❌ Not Connected'}
        </div>
        
        {/* Privy User Info */}
        {privyAuth.isAuthenticated && privyAuth.user && (
          <div style={{ fontSize: '10px', color: '#90EE90', marginBottom: '4px' }}>
            Privy User: {privyAuth.user.id?.slice(0, 8)}...
          </div>
        )}
        
        {/* Cairn User Info */}
        {isAuthenticated && currentUser && (
          <div style={{ fontSize: '10px', color: '#87CEEB', marginBottom: '4px' }}>
            Cairn User: {currentUser.username}
          </div>
        )}
        
        {/* Wallet Details */}
        {walletConnection.isConnected && (
          <>
            <div style={{ fontSize: '10px', color: '#87CEEB' }}>
              Address: {walletConnection.address?.slice(0,6)}...{walletConnection.address?.slice(-4)}
            </div>
            <div style={{ fontSize: '10px', color: '#87CEEB' }}>
              Network: {walletConnection.network || 'Unknown'}
            </div>
            <div style={{ fontSize: '10px', color: '#87CEEB' }}>
              Type: {walletConnection.isEmbedded ? 'Embedded' : 'External'}
            </div>
          </>
        )}
        
        {/* Action Buttons */}
        <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexDirection: 'column' }}>
          {!privyAuth.isAuthenticated && (
            <button
              onClick={() => privyAuth.login()}
              style={{
                padding: '4px 8px',
                background: '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              Privy Social Login
            </button>
          )}
          
          {privyAuth.isAuthenticated && (
            <button
              onClick={() => privyAuth.logout()}
              style={{
                padding: '4px 8px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          )}
          
          {!walletConnection.isConnected && (
            <button
              onClick={() => connectExternal()}
              style={{
                padding: '4px 8px',
                background: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    );
  };

  // Force landing page display (admin override)
  if (forceShowLanding) {
    console.log("Rendering landing page");
    return (
      <>
        <WalletTestDisplay />
        <LandingPage onNavigate={() => handleStaticNavigate("howitworks")} />
      </>
    );
  }

  // ===== UNAUTHENTICATED USER FLOW =====
  if (!isAuthenticated) {
    // Guest browsing - can view projects but not interact
    if (isGuestBrowsing) {
      return (
        <>
          <WalletTestDisplay />
          <PublicLayout>
            <div className="p-6 lg:p-8 w-full max-w-screen-2xl mx-auto">
            {isLoadingProjects ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-text-primary dark:text-dark-text-primary">
                  Loading projects...
                </div>
              </div>
            ) : guestSelectedProject ? (
              // Show project detail for guests with limited functionality
              <ProjectDetailView
                project={guestSelectedProject}
                onBack={handleGuestBackToLibrary}
                onPorSubmitClick={() => {
                  addToast(
                    "Please login to submit proof of reproducibility",
                    "info"
                  );
                }}
                onViewReproducibility={() => {
                  addToast(
                    "Please login to view reproducibility details",
                    "info"
                  );
                }}
                onGetProofClick={() => {
                  addToast("Please login to access proof features", "info");
                }}
              />
            ) : (
              // Show project library for guest browsing
              <OutputsLibrary
                allProjects={projects}
                onSelectProject={handleGuestSelectProject}
              />
            )}
          </div>
        </PublicLayout>
        </>
      );
    }

    // Static public pages
    if (staticPage === "howitworks") {
      return (
        <>
          <WalletTestDisplay />
          <HowItWorksPage onNavigate={() => handleStaticNavigate("landing")} />
        </>
      );
    }

    // Default landing page
    return (
      <>
        <WalletTestDisplay />
        <LandingPage onNavigate={() => handleStaticNavigate("howitworks")} />
      </>
    );
  }

  // Loading state while user data is being fetched
  if (!currentUser) {
    console.log("No current user, showing loading");
    return (
      <>
        <WalletTestDisplay />
        <div className="flex items-center justify-center h-screen bg-background dark:bg-background-dark text-text-primary dark:text-dark-text-primary">
          Loading user profile...
        </div>
      </>
    );
  }

  // ===== AUTHENTICATED USER FLOW =====
  return (
    <>
      <WalletTestDisplay />
      
      {/* Main application layout */}
      <AppLayout
        activePage={activeDashboardPage}
        onNavigate={handleDashboardNavigation}
        draftProjectsCount={draftProjectsCount}
        newOpportunitiesCount={newOpportunitiesCount}
      >
        <div className="p-6 lg:p-8 w-full max-w-screen-2xl mx-auto">
          {/* Loading indicator */}
          {isLoadingProjects && (
            <div className="mb-4 text-center text-text-secondary dark:text-dark-text-secondary">
              Loading projects from server...
            </div>
          )}

          {/* Main content routing */}
          {(() => {
            // Show project detail view if a project is selected
            if (selectedProject) {
              return (
                <ProjectDetailView
                  project={selectedProject}
                  onBack={handleBackToDashboard}
                  onPorSubmitClick={() => setIsPorModalOpen(true)}
                  onViewReproducibility={(rep) =>
                    handleViewReproducibility(rep, selectedProject)
                  }
                  onGetProofClick={() => handleOpenProofModal(selectedProject)}
                />
              );
            }

            // Show appropriate dashboard based on user role
            if (userRole === UserRole.Researcher) {
              return (
                <ResearcherDashboard
                  key={`researcher-${activeDashboardPage}`}
                  projects={projects}
                  onSelectProject={handleSelectProject}
                  currentUser={currentUser}
                  activePage={activeDashboardPage}
                  onNewProject={handleOpenNewProjectModal}
                  onNavigate={handleDashboardNavigation}
                  onApplyToFunding={handleOpenApplyFundingModal}
                  onProjectCreated={handleProjectCreated}
                />
              );
            } else if (userRole === UserRole.ImpactOwner) {
              return (
                <ImpactOwnerDashboard onSelectProject={handleSelectProject} />
              );
            } else {
              // Funder dashboard
              return (
                <FunderDashboard
                  key={`funder-${activeDashboardPage}`}
                  projects={projects}
                  onSelectProject={handleSelectProject}
                  activePage={activeDashboardPage}
                  onNavigate={handleDashboardNavigation}
                  onViewInfo={handleOpenFundingRoundDetail}
                />
              );
            }
          })()}
        </div>
      </AppLayout>

      {/* ===== MODAL COMPONENTS ===== */}
      {/* All modals are conditionally rendered based on their state */}

      {/* Apply for funding modal */}
      {isApplyFundingModalOpen && projectToApply && (
        <ApplyToFundingModal
          project={projectToApply}
          onClose={() => setIsApplyFundingModalOpen(false)}
        />
      )}

      {/* Create new project wizard modal */}
      {isNewProjectWizardOpen && (
        <CreateProjectWizardModal
          initialOutputs={newProjectOutputs}
          onClose={() => setIsNewProjectWizardOpen(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}

      {/* Funding round detail modal */}
      {isFundingRoundDetailModalOpen && selectedFundingRound && (
        <FundingRoundDetailModal
          round={selectedFundingRound}
          onClose={handleCloseFundingRoundDetail}
          onSelectProject={handleSelectProjectFromRoundModal}
        />
      )}

      {/* Submit proof of reproducibility modal */}
      {isPorModalOpen && selectedProject && (
        <SubmitPorModal
          project={selectedProject}
          onClose={() => setIsPorModalOpen(false)}
          onSubmit={(data) => onPorSubmitAndExit(selectedProject._id, data)}
        />
      )}

      {/* View reproducibility details modal */}
      {isReproducibilityDetailModalOpen && reproducibilityModalData && (
        <ReproducibilityDetailModal
          reproducibility={reproducibilityModalData.reproducibility}
          onClose={handleCloseReproducibilityModal}
          onDispute={() =>
            handleDisputeAndClose(reproducibilityModalData.reproducibility.id)
          }
          isOwner={reproducibilityModalData.isOwner}
        />
      )}

      {/* Get proof of reproducibility modal */}
      {isProofOfReproModalOpen && selectedProjectForProof && (
        <ProofOfReproducibilityModal
          project={selectedProjectForProof}
          onClose={() => setIsProofOfReproModalOpen(false)}
        />
      )}
    </>
  );
}
