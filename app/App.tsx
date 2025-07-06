import React, { useState } from "react";
import { LandingPage } from "./components/landing/landing-page";
import { HowItWorksPage } from "./components/how-it-works/how-it-works-page";
import Header from "./components/layout/header";
import { ScientistDashboard } from "./components/dashboard/scientist-dashboard";
import { FunderDashboard } from "./components/dashboard/funder-dashboard";
import { ProjectDetailView } from "./components/projects/project-detail-view";
import { NewProjectModal } from "./components/modals/new-project-modal";
import { AddOutputModal } from "./components/modals/add-output-modal";
import { SubmitPorModal } from "./components/modals/submit-por-modal";
import { ReproducibilityDetailModal } from "./components/modals/reproduction-detail-modal";
import { OnboardingModal } from "./components/modals/onboarding-modal";
import { useAppContext } from "./context/app-provider";
import {
  UserRole,
  Project,
  Reproducibility,
  Output,
  ProjectOutput,
  ProjectRegistration,
  Project as ParsedProject,
  ProofOfReproducibility,
} from "./lib/types";
import { AppLogo } from "./components/ui/logo";
import { FileTextIcon, ChartBarIcon, SearchIcon } from "./components/ui/icons";
import { AppFooter } from "./components/landing/landing-page";
import { BottomNavBar } from "./components/layout/bottom-nav-bar";
import { useContract } from "./context/contract-context";

const Sidebar = ({
  activePage,
  onNavigate,
}: {
  activePage: string;
  onNavigate: (page: string) => void;
}) => {
  const { userRole } = useAppContext();

  const scientistNavItems = [
    { id: "projects", label: "My Projects", icon: FileTextIcon },
    { id: "discover", label: "Discover & PoR", icon: SearchIcon },
    { id: "funding", label: "Funding", icon: ChartBarIcon },
  ];

  const funderNavItems = [
    { id: "portfolio", label: "Portfolio", icon: ChartBarIcon },
    { id: "discover", label: "Discover", icon: SearchIcon },
  ];

  const navItems =
    userRole === UserRole.Scientist ? scientistNavItems : funderNavItems;

  return (
    <aside className="w-64 bg-background-light dark:bg-background-dark-light border-r border-border dark:border-border-dark flex-shrink-0 flex flex-col hidden lg:flex">
      <div className="h-20 flex items-center px-6 border-b border-border dark:border-border-dark">
        <AppLogo />
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200 ${
              activePage === item.id
                ? "bg-primary-light text-primary dark:bg-primary dark:text-white"
                : "text-text-secondary dark:text-text-dark-secondary hover:bg-cairn-gray-100 dark:hover:bg-cairn-gray-800"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
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
}: {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
}) => {
  return (
    <div className="min-h-screen bg-background dark:bg-background-dark font-sans flex">
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <div className="flex-1 flex flex-col min-w-0 max-h-screen">
        <Header onNavigate={onNavigate} />
        <main className="flex-grow overflow-y-auto">
          <div className="pb-16 lg:pb-0">{children}</div>
        </main>
        <AppFooter />
        <BottomNavBar activePage={activePage} onNavigate={onNavigate} />
      </div>
    </div>
  );
};

export function App() {
  type StaticPage = "landing" | "howitworks";
  const [staticPage, setStaticPage] = useState<StaticPage>("landing");
  const {
    getAllProjects,
    getProof,
    isProofValid,
    getTokenOwner,
    getTokenUnits,
  } = useContract();

  const {
    userRole,
    projects,
    currentUser,
    handlePorSubmit,
    handleAddProject,
    handleAddOutputs,
    handleDispute,
    isAuthenticated,
    isOnboardingModalOpen,
    setProjects,
  } = useAppContext();

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeDashboardPage, setActiveDashboardPage] = useState(
    userRole === UserRole.Scientist ? "projects" : "portfolio"
  );

  // Modal states
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isAddOutputModalOpen, setIsAddOutputModalOpen] = useState(false);
  const [
    isReproducibilityDetailModalOpen,
    setIsReproducibilityDetailModalOpen,
  ] = useState(false);
  const [isPorModalOpen, setIsPorModalOpen] = useState(false);

  const [reproducibilityModalData, setReproducibilityModalData] = useState<{
    reproducibility: Reproducibility;
    isOwner: boolean;
    projectId: string;
  } | null>(null);

  const handleStaticNavigate = (page: StaticPage) => {
    setStaticPage(page);
    window.scrollTo(0, 0);
  };

  const handleSelectProject = (project: Project) => {
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

  const handleDashboardNavigation = (page: string) => {
    setSelectedProject(null);
    setActiveDashboardPage(page);
  };

  React.useEffect(() => {
    console.log("User role changed:", userRole);
    setActiveDashboardPage(
      userRole === UserRole.Scientist ? "projects" : "portfolio"
    );
  }, [userRole]);

  React.useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log("Fetching projects from contract...");
        const rawProjects = await getAllProjects(0, 100);
        console.log("Fetched projects from contract:", rawProjects);

        const parsedProjects = await Promise.all(
          rawProjects.map(async (p: any) => {
            const cid = p.projectURI;
            const metadataUrl = `https://${cid}.ipfs.w3s.link/`;

            try {
              const res = await fetch(metadataUrl);
              const data = await res.json();

              // Fetch Outputs
              let outputs: ProjectOutput[] = [];
              if (p.outputsURI) {
                const outputUrl = `https://${p.outputsURI}.ipfs.w3s.link/`;
                try {
                  const outputRes = await fetch(outputUrl);
                  const outputData = await outputRes.json();
                  outputs = Array.isArray(outputData)
                    ? outputData
                    : [outputData];
                } catch (err) {
                  console.warn(
                    "Failed to fetch outputs for",
                    p.outputsURI,
                    err
                  );
                }
              }

              // Fetch Proofs (Reproducibilities)
              const reproducibilities: Reproducibility[] = [];

              if (Array.isArray(p.proofs)) {
                for (const proofCID of p.proofs) {
                  try {
                    const [res, onchainProof] = await Promise.all([
                      fetch(`https://${proofCID}.ipfs.w3s.link/`),
                      getProof(proofCID),
                    ]);

                    const validity = await isProofValid(proofCID);

                    const data = await res.json();

                    reproducibilities.push({
                      proof_id: proofCID,
                      project_id: cid,
                      recorder: onchainProof.recorder,
                      timestamp: String(onchainProof.recordedAt),
                      description: data.description,
                      code_url: data.code_url,
                      output_url: data.output_url,
                      video_url: data.video_url ?? undefined,
                      dispute: onchainProof.dispute,
                      dispute_uri: onchainProof.disputeURI,
                      valid: validity,
                    });
                  } catch (err) {
                    console.warn(
                      "Failed to fetch or combine proof",
                      proofCID,
                      err
                    );
                  }
                }
              }

              const tokenIds: bigint[] = p.tokenIDs.map((id: string) =>
                BigInt(id)
              );
              const tokenOwners: string[] = [];
              const tokenUnits: number[] = [];
              console.log("Token IDs for project:", tokenIds);
              for (const tokenId of tokenIds) {
                try {
                  const [owner, units] = await Promise.all([
                    getTokenOwner(tokenId),
                    getTokenUnits(tokenId),
                  ]);
                  tokenOwners.push(owner ?? "0x0");
                  tokenUnits.push(units ?? 0);
                } catch (err) {
                  console.warn(
                    `Failed to fetch token data for ${tokenId}`,
                    err
                  );
                  tokenOwners.push("0x0");
                  tokenUnits.push(0);
                }
              }

              console.log("Token owners:", tokenOwners);
              console.log("Token units:", tokenUnits);

              return {
                id: p.projectURI,
                ownerId: p.creator,
                title: data.title,
                createdAt: String(data.created_at ?? ""),
                description: data.description,
                organization: data.organization ?? undefined,
                additionalInfoUrl: data.url ?? undefined,
                cid,
                funder: p.funder,
                fundingGoal: Number(p.fundingGoal ?? 0),
                output: outputs,
                reproducibilities,
                image_url: data.image_url ?? undefined,
                tags: data.tags ?? [],
                domain: data.domain ?? undefined,
                tokenIds: tokenIds,
                tokenUnits: tokenUnits,
                tokenOwners: tokenOwners,
                impact: Number(p.impact),
              } as Project;
            } catch (e) {
              console.error("Failed to fetch metadata for project", cid, e);
              return null;
            }
          })
        );

        const validProjects = parsedProjects.filter(
          (p): p is Project => p !== null
        );
        console.log("Valid projects:", validProjects);
        setProjects(validProjects);
      } catch (err) {
        console.error("Error fetching projects from contract:", err);
      }
    };

    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
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
    return (
      <div className="flex items-center justify-center h-screen bg-background dark:bg-background-dark text-text dark:text-text-dark">
        Loading user profile...
      </div>
    );
  }

  return (
    <>
      <AppLayout
        activePage={activeDashboardPage}
        onNavigate={handleDashboardNavigation}
      >
        <div className="p-6 lg:p-8 w-full max-w-screen-2xl mx-auto">
          {selectedProject ? (
            <ProjectDetailView
              project={selectedProject}
              onBack={handleBackToDashboard}
              onPorSubmitClick={() => setIsPorModalOpen(true)}
              onAddOutputClick={() => setIsAddOutputModalOpen(true)}
              onViewReproducibility={(rep) =>
                handleViewReproducibility(rep, selectedProject)
              }
            />
          ) : userRole === UserRole.Scientist ? (
            <ScientistDashboard
              key={`scientist-${activeDashboardPage}`}
              projects={projects}
              onSelectProject={handleSelectProject}
              onNewProject={() => setIsNewProjectModalOpen(true)}
              currentUser={currentUser}
              onViewContributionDetails={handleViewDashboardContribution}
              activePage={activeDashboardPage}
            />
          ) : (
            <FunderDashboard
              key={`funder-${activeDashboardPage}`}
              projects={projects}
              onSelectProject={handleSelectProject}
              activePage={activeDashboardPage}
              onNavigate={handleDashboardNavigation}
            />
          )}
        </div>
      </AppLayout>

      {isOnboardingModalOpen && <OnboardingModal />}

      {isNewProjectModalOpen && (
        <NewProjectModal
          onClose={() => setIsNewProjectModalOpen(false)}
          onAddProject={handleAddProject}
        />
      )}

      {isAddOutputModalOpen && selectedProject && (
        <AddOutputModal
          project={selectedProject}
          onClose={() => setIsAddOutputModalOpen(false)}
          onAddOutputs={(outputs) => {
            const updatedProject = handleAddOutputs(
              selectedProject.id,
              outputs
            );
            setSelectedProject(updatedProject);
            setIsAddOutputModalOpen(false);
          }}
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
            handleDisputeAndClose(
              reproducibilityModalData.reproducibility.proof_id
            )
          }
          isOwner={reproducibilityModalData.isOwner}
        />
      )}
    </>
  );
}
