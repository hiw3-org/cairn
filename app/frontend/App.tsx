import React from "react";
import { LandingPage } from "./components/landing/landing-page";
import { HowItWorksPage } from "./components/how-it-works/how-it-works-page";
import Header from "./components/layout/header";
import { ResearcherDashboard } from "./components/dashboard/scientist-dashboard";
import { FunderDashboard } from "./components/dashboard/funder-dashboard";
import { ImpactOwnerDashboard } from "./components/dashboard/impact-owner-dashboard";
import { ProjectDetailView } from "./components/projects/project-detail-view";
import { NewProjectModal } from "./components/modals/new-project-modal";
import { SubmitPorModal } from "./components/modals/submit-por-modal";
import { ReproducibilityDetailModal } from "./components/modals/reproduction-detail-modal";
import { useAppContext } from "./context/app-provider";
import { useContract } from "./context/contract-context";
import { useFileCoinDownload } from "./context/filecoin-context";
import { useApi } from "./context/api-context";
import {
  UserRole,
  Project,
  Reproducibility,
  Output,
  FundingRound,
  HuggingFaceOutput,
  ProjectStatus,
  ApiProject,
  ApiUserProfile,
  PoRStatus,
  ResearchDomain,
} from "./lib/types";
import { AppLogo } from "./components/ui/logo";
import {
  FileTextIcon,
  ChartBarIcon,
  GavelIcon,
  BookOpenIcon,
  HuggingFaceIcon,
  HomeIcon,
} from "./components/ui/icons";
import { AppFooter } from "./components/landing/landing-page";
import { BottomNavBar } from "./components/layout/bottom-nav-bar";
import { MOCK_OPPORTUNITIES } from "./lib/constants";
import { FundingRoundDetailModal } from "./components/modals/funding-round-detail-modal";
import { OutputsLibrary } from "./components/dashboard/outputs-library";
import { CreateProjectWizardModal } from "./components/modals/create-project-wizard-modal";
import { ApplyToFundingModal } from "./components/modals/apply-to-funding-modal";
import { ProofOfReproducibilityModal } from "./components/modals/proof-of-reproducibility-modal";

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

  const researcherNavItems = [
    { id: "outputs", label: "Reproduced Projects", icon: BookOpenIcon },
    {
      id: "projects",
      label: "My Projects",
      icon: FileTextIcon,
      notificationCount: draftProjectsCount,
    },
    {
      id: "funding",
      label: "Funding",
      icon: ChartBarIcon,
      notificationCount: newOpportunitiesCount,
    },
    { id: "dao", label: "DAO", icon: GavelIcon, disabled: true },
  ];

  const funderNavItems = [
    { id: "dashboard", label: "Dashboard", icon: ChartBarIcon },
    { id: "portfolio", label: "Portfolio", icon: FileTextIcon },
    { id: "dao", label: "DAO", icon: GavelIcon, disabled: true },
  ];

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
      <div className="h-20 flex items-center px-6 border-b border-border dark:border-border-dark">
        <AppLogo />
      </div>
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
            {"notificationCount" in item && item.notificationCount > 0 && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-status-danger text-white text-xs font-bold">
                {item.notificationCount}
              </span>
            )}
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
      {userRole !== UserRole.ImpactOwner && (
        <Sidebar
          activePage={activePage}
          onNavigate={onNavigate}
          draftProjectsCount={draftProjectsCount}
          newOpportunitiesCount={newOpportunitiesCount}
        />
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onNavigate={onNavigate} />
        <main className="flex-grow overflow-y-auto">
          <div className="pb-16 lg:pb-0">{children}</div>
        </main>
        <AppFooter />
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

// Helper function to convert API project to frontend project format
const convertApiProjectToFrontendProject = (
  apiProject: ApiProject
): Project => {
  // Create outputs array with HuggingFace repo if it exists
  const outputs: Output[] = [];
  if (apiProject.huggingface?.repo_url) {
    outputs.push({
      id: `${apiProject._id}`,
      type: "Code",
      timestamp: apiProject.updated_at,
      description: `${apiProject.title} - HuggingFace Repository`,
      data: {
        url: apiProject.huggingface.repo_url,
        fileName: apiProject.huggingface.files || "model.py",
      },
      metrics: {
        downloads: Math.floor(Math.random() * 5000),
        stars: Math.floor(Math.random() * 200),
        citations: Math.floor(Math.random() * 30),
      },
    });
  }

  // Create reproducibilities array with proper structure
  const reproducibilities: Reproducibility[] = [];
  if (apiProject.por?.por_cid) {
    reproducibilities.push({
      id: `${apiProject._id}-por`,
      timestamp: apiProject.updated_at,
      evidence: outputs, // Reference the outputs we created
      notes: `Proof of Reproducibility stored at CID: ${apiProject.por.por_cid}`,
      verifier: apiProject.researcher_id, // Use researcher as verifier for now
      status: PoRStatus.Success,
    });
  }

  return {
    id: apiProject._id,
    ownerId: apiProject.researcher_id,
    title: apiProject.title,
    description: apiProject.paper?.abstract || apiProject.title,
    tags: [apiProject.field],
    status: ProjectStatus.Reproducible,
    domain: ResearchDomain.Robotics,
    coverImageUrl: undefined,
    cid: apiProject.por?.por_cid || "",
    hypercertFraction: 0,
    startDate: apiProject.created_at,
    endDate: apiProject.updated_at,
    lastOutputDate: apiProject.updated_at,
    reproducibilities: reproducibilities, // Fixed: properly structured array
    fundingPool: 0,
    fundingPrice: undefined,
    impactScore: 0,
    outputs: outputs, // Fixed: added the missing outputs array
    reproducibilityRequirements: [],
    organization:
      apiProject.researcher?.profile?.firstName &&
      apiProject.researcher?.profile?.lastName
        ? `${apiProject.researcher.profile.firstName} ${apiProject.researcher.profile.lastName}`
        : apiProject.researcher?.username || "Unknown",
    additionalInfoUrl: apiProject.paper?.doi
      ? `https://doi.org/${apiProject.paper.doi}`
      : apiProject.huggingface?.repo_url,
    impactAssetOwners: [],
    scientificMetrics: apiProject.paper?.doi
      ? {
          citations: { value: 0, trend: 0 },
          arxivDownloads: { value: 0, trend: 0 },
        }
      : undefined,
    adoptionMetrics: apiProject.huggingface?.repo_url
      ? {
          githubStars: { value: 0, trend: 0 },
          githubForks: { value: 0, trend: 0 },
          dependencies: { value: 0, trend: 0 },
          huggingFaceDownloads: { value: 0, trend: 0 },
        }
      : undefined,
    stars: undefined,
    license: undefined,
  };
};

export function App() {
  type StaticPage = "landing" | "howitworks";
  const [staticPage, setStaticPage] = React.useState<StaticPage>("landing");
  const [isLoadingProjects, setIsLoadingProjects] = React.useState(false);
  const [guestSelectedProject, setGuestSelectedProject] =
    React.useState<Project | null>(null);

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
  } = useAppContext();

  const api = useApi();

  const [selectedProject, setSelectedProject] = React.useState<Project | null>(
    null
  );
  const [activeDashboardPage, setActiveDashboardPage] = React.useState(
    userRole === UserRole.Researcher ? "outputs" : "dashboard"
  );

  const handleGuestSelectProject = (project: Project) => {
    setGuestSelectedProject(project);
  };

  const handleGuestBackToLibrary = () => {
    setGuestSelectedProject(null);
  };

  // Modal states
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] =
    React.useState(false);
  const [
    isReproducibilityDetailModalOpen,
    setIsReproducibilityDetailModalOpen,
  ] = React.useState(false);
  const [isPorModalOpen, setIsPorModalOpen] = React.useState(false);
  const [isFundingRoundDetailModalOpen, setIsFundingRoundDetailModalOpen] =
    React.useState(false);
  const [isApplyFundingModalOpen, setIsApplyFundingModalOpen] =
    React.useState(false);
  const [projectToApply, setProjectToApply] = React.useState<Project | null>(
    null
  );
  const [selectedFundingRound, setSelectedFundingRound] =
    React.useState<FundingRound | null>(null);
  const [isProofOfReproModalOpen, setIsProofOfReproModalOpen] =
    React.useState(false);
  const [selectedProjectForProof, setSelectedProjectForProof] =
    React.useState<Project | null>(null);

  // New wizard modal state
  const [isCreateProjectWizardOpen, setIsCreateProjectWizardOpen] =
    React.useState(false);
  const [wizardInitialOutputs, setWizardInitialOutputs] = React.useState<
    HuggingFaceOutput[]
  >([]);

  const [reproducibilityModalData, setReproducibilityModalData] =
    React.useState<{
      reproducibility: Reproducibility;
      isOwner: boolean;
      projectId: string;
    } | null>(null);

  // Load projects from API
  const loadProjectsFromApi = React.useCallback(async () => {
    if (isLoadingProjects) return;

    setIsLoadingProjects(true);
    try {
      const result = await api.fetchProjects({ limit: 50 });
      console.log("Fetched projects from API:", result);
      if (!result || !result.projects) {
        throw new Error("Invalid response from server");
      }
      const convertedProjects = result.projects.map(
        convertApiProjectToFrontendProject
      );
      console.log("Converted projects:", convertedProjects);
      setProjects(convertedProjects);
      // addToast(
      //   `Loaded ${convertedProjects.length} projects from server`,
      //   "success"
      // );
    } catch (error) {
      console.error("Failed to load projects:", error);
      addToast("Failed to load projects from server", "error");
    } finally {
      setIsLoadingProjects(false);
    }
  }, [api, setProjects, addToast, isLoadingProjects]);

  // Load projects when component mounts or when authentication status changes
  React.useEffect(() => {
    if (isAuthenticated || isGuestBrowsing) {
      loadProjectsFromApi();
    }
  }, [isAuthenticated, isGuestBrowsing]);

  // --- NOTIFICATION COUNT LOGIC ---
  const newOpportunitiesCount = React.useMemo(
    () => MOCK_OPPORTUNITIES.filter((op) => op.isNew).length,
    []
  );

  const draftProjectsCount = React.useMemo(() => {
    if (!currentUser || userRole !== UserRole.Researcher) return 0;
    return projects.filter(
      (p) =>
        p.ownerId === currentUser.walletAddress &&
        p.status === ProjectStatus.Draft
    ).length;
  }, [projects, currentUser, userRole]);

  const handleStaticNavigate = (page: StaticPage) => {
    setStaticPage(page);
    window.scrollTo(0, 0);
  };

  const handleSelectProject = (project: Project) => {
    console.log("handleSelectProject called with:", project.title, project.id);
    setSelectedProject(project);
  };

  const handleBackToDashboard = () => {
    setSelectedProject(null);
  };

  const handleViewReproducibility = (
    reproducibility: Reproducibility,
    project: Project
  ) => {
    if (!currentUser) return;
    setReproducibilityModalData({
      reproducibility,
      isOwner: project.ownerId === currentUser.walletAddress,
      projectId: project.id,
    });
    setIsReproducibilityDetailModalOpen(true);
  };

  const handleViewDashboardContribution = (
    reproducibility: Reproducibility,
    projectId: string
  ) => {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      handleViewReproducibility(reproducibility, project);
    }
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

  const handleDashboardNavigation = (page: string) => {
    if (page === "landing") {
      goToLandingPage();
      return;
    }
    setSelectedProject(null);
    setActiveDashboardPage(page);
  };

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

  const handleOpenCreateProjectWizard = (
    initialOutputs: HuggingFaceOutput[]
  ) => {
    setWizardInitialOutputs(initialOutputs);
    setIsCreateProjectWizardOpen(true);
  };

  const handleOpenApplyFundingModal = (project: Project) => {
    setProjectToApply(project);
    setIsApplyFundingModalOpen(true);
  };

  const handleOpenProofModal = (project: Project) => {
    setSelectedProjectForProof(project);
    setIsProofOfReproModalOpen(true);
  };

  React.useEffect(() => {
    if (userRole === UserRole.Researcher) {
      setActiveDashboardPage("outputs");
    } else if (userRole === UserRole.Funder) {
      setActiveDashboardPage("dashboard");
    } else {
      setActiveDashboardPage("claim"); // For Impact Owner
    }
  }, [userRole]);

  if (forceShowLanding) {
    console.log("Rendering landing page");
    return (
      <LandingPage onNavigate={() => handleStaticNavigate("howitworks")} />
    );
  }

  if (!isAuthenticated) {
    if (isGuestBrowsing) {
      return (
        <PublicLayout>
          <div className="p-6 lg:p-8 w-full max-w-screen-2xl mx-auto">
            {isLoadingProjects ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-text-primary dark:text-dark-text-primary">
                  Loading projects from server...
                </div>
              </div>
            ) : guestSelectedProject ? (
              <ProjectDetailView
                project={guestSelectedProject}
                onBack={handleGuestBackToLibrary}
                onPorSubmitClick={() => {
                  // For guests, maybe show a "Please login" message
                  addToast(
                    "Please login to submit proof of reproducibility",
                    "info"
                  );
                }}
                onViewReproducibility={() => {
                  // For guests, maybe show a "Please login" message
                  addToast(
                    "Please login to view reproducibility details",
                    "info"
                  );
                }}
                onGetProofClick={() => {
                  // For guests, maybe show a "Please login" message
                  addToast("Please login to access proof features", "info");
                }}
              />
            ) : (
              <OutputsLibrary
                allProjects={projects}
                onSelectProject={handleGuestSelectProject}
              />
            )}
          </div>
        </PublicLayout>
      );
    }
    if (staticPage === "howitworks") {
      return (
        <HowItWorksPage onNavigate={() => handleStaticNavigate("landing")} />
      );
    }
    return (
      <LandingPage onNavigate={() => handleStaticNavigate("howitworks")} />
    );
  }

  if (!currentUser) {
    // This state should be very brief after connection
    console.log("No current user, showing loading");
    return (
      <div className="flex items-center justify-center h-screen bg-background dark:bg-background-dark text-text-primary dark:text-dark-text-primary">
        Loading user profile...
      </div>
    );
  }
  console.log("About to render main AppLayout");
  return (
    <>
      <AppLayout
        activePage={activeDashboardPage}
        onNavigate={handleDashboardNavigation}
        draftProjectsCount={draftProjectsCount}
        newOpportunitiesCount={newOpportunitiesCount}
      >
        <div className="p-6 lg:p-8 w-full max-w-screen-2xl mx-auto">
          {isLoadingProjects && (
            <div className="mb-4 text-center text-text-secondary dark:text-dark-text-secondary">
              Loading projects from server...
            </div>
          )}
          {(() => {
            console.log("Dashboard render check:", {
              selectedProject,
              userRole,
              activeDashboardPage,
            });
            return selectedProject ? (
              <>
                {console.log(
                  "About to render ProjectDetailView for:",
                  selectedProject.title
                )}
                <ProjectDetailView
                  project={selectedProject}
                  onBack={handleBackToDashboard}
                  onPorSubmitClick={() => setIsPorModalOpen(true)}
                  onViewReproducibility={(rep) =>
                    handleViewReproducibility(rep, selectedProject)
                  }
                  onGetProofClick={() => handleOpenProofModal(selectedProject)}
                />
              </>
            ) : userRole === UserRole.Researcher ? (
              <ResearcherDashboard
                key={`researcher-${activeDashboardPage}`}
                projects={projects}
                onSelectProject={handleSelectProject}
                onNewProject={() => setIsNewProjectModalOpen(true)}
                currentUser={currentUser}
                activePage={activeDashboardPage}
                onOpenCreateProjectWizard={handleOpenCreateProjectWizard}
                onNavigate={handleDashboardNavigation}
                onApplyToFunding={handleOpenApplyFundingModal}
              />
            ) : userRole === UserRole.ImpactOwner ? (
              <ImpactOwnerDashboard onSelectProject={handleSelectProject} />
            ) : (
              <FunderDashboard
                key={`funder-${activeDashboardPage}`}
                projects={projects}
                onSelectProject={handleSelectProject}
                activePage={activeDashboardPage}
                onNavigate={handleDashboardNavigation}
                onViewInfo={handleOpenFundingRoundDetail}
              />
            );
          })()}
        </div>
      </AppLayout>

      {isNewProjectModalOpen && (
        <NewProjectModal
          onClose={() => setIsNewProjectModalOpen(false)}
          onAddProject={handleAddProject}
        />
      )}

      {isCreateProjectWizardOpen && (
        <CreateProjectWizardModal
          initialOutputs={wizardInitialOutputs}
          onClose={() => setIsCreateProjectWizardOpen(false)}
        />
      )}

      {isApplyFundingModalOpen && projectToApply && (
        <ApplyToFundingModal
          project={projectToApply}
          onClose={() => setIsApplyFundingModalOpen(false)}
        />
      )}

      {isFundingRoundDetailModalOpen && selectedFundingRound && (
        <FundingRoundDetailModal
          round={selectedFundingRound}
          onClose={handleCloseFundingRoundDetail}
          onSelectProject={handleSelectProjectFromRoundModal}
        />
      )}

      {isPorModalOpen && selectedProject && (
        <SubmitPorModal
          project={selectedProject}
          onClose={() => setIsPorModalOpen(false)}
          onSubmit={(data) => onPorSubmitAndExit(selectedProject.id, data)}
        />
      )}

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

      {isProofOfReproModalOpen && selectedProjectForProof && (
        <ProofOfReproducibilityModal
          project={selectedProjectForProof}
          onClose={() => setIsProofOfReproModalOpen(false)}
        />
      )}
    </>
  );
}
