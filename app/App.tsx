

import React, { useState } from 'react';
import { LandingPage } from './components/landing/landing-page';
import { HowItWorksPage } from './components/how-it-works/how-it-works-page';
import Header from './components/layout/header';
import { ScientistDashboard } from './components/dashboard/scientist-dashboard';
import { FunderDashboard } from './components/dashboard/funder-dashboard';
import { ProjectDetailView } from './components/projects/project-detail-view';
import { NewProjectModal } from './components/modals/new-project-modal';
import { AddOutputModal } from './components/modals/add-output-modal';
import { SubmitPorModal } from './components/modals/submit-por-modal';
import { ReproducibilityDetailModal } from './components/modals/reproduction-detail-modal';
import { useAppContext } from './context/app-provider';
import { UserRole, Project, Reproducibility } from './lib/types';


function App() {
    type CurrentPage = 'landing' | 'howitworks' | 'app';
    const [currentPage, setCurrentPage] = useState<CurrentPage>('landing');
    const { 
        userRole, 
        projects, 
        currentUser,
        handlePorSubmit, 
        handleAddProject,
        handleAddOutputs,
        handleDispute,
    } = useAppContext();
    
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    
    // Modal states
    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
    const [isAddOutputModalOpen, setIsAddOutputModalOpen] = useState(false);
    const [isReproducibilityDetailModalOpen, setIsReproducibilityDetailModalOpen] = useState(false);
    const [isPorModalOpen, setIsPorModalOpen] = useState(false);
    
    const [reproducibilityModalData, setReproducibilityModalData] = useState<{
        reproducibility: Reproducibility;
        isOwner: boolean;
        projectId: string;
    } | null>(null);

    const handleNavigation = (page: CurrentPage) => {
        setCurrentPage(page);
        window.scrollTo(0, 0);
    };

    const handleSelectProject = (project: Project) => {
        setSelectedProject(project);
    };

    const handleBackToDashboard = () => {
        setSelectedProject(null);
    };
    
    const handleViewReproducibility = (reproducibility: Reproducibility, project: Project) => {
        setReproducibilityModalData({
            reproducibility,
            isOwner: project.ownerId === currentUser.walletAddress,
            projectId: project.id,
        });
        setIsReproducibilityDetailModalOpen(true);
    };

    const handleViewDashboardContribution = (reproducibility: Reproducibility, projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (project) {
            handleViewReproducibility(reproducibility, project);
        }
    };
    
    const handleCloseReproducibilityModal = () => {
        setIsReproducibilityDetailModalOpen(false);
        setReproducibilityModalData(null);
    };

    const onPorSubmitAndExit = (projectId: string, data: { notes: string; evidence: import('./lib/types').Output[]; }) => {
        handlePorSubmit(projectId, data);
        setIsPorModalOpen(false);
        // Do not navigate away, stay on the project page to see the new PoR
    };

    const handleDisputeAndClose = (reproducibilityId: string) => {
        if (!reproducibilityModalData) return;
        handleDispute(reproducibilityModalData.projectId, reproducibilityId);
        handleCloseReproducibilityModal();
    };

    if (currentPage === 'landing') {
        return <LandingPage onEnter={() => handleNavigation('app')} onNavigate={(page) => handleNavigation(page)} />;
    }
    
    if (currentPage === 'howitworks') {
        return <HowItWorksPage onNavigate={(page) => handleNavigation(page)} onEnter={() => handleNavigation('app')} />;
    }

    return (
        <div className="min-h-screen bg-cairn-gray-25 dark:bg-cairn-gray-950 text-cairn-gray-800 dark:text-cairn-gray-200 font-sans">
            <Header />
            <main>
                {selectedProject ? (
                    <ProjectDetailView 
                        project={selectedProject} 
                        onBack={handleBackToDashboard} 
                        onPorSubmitClick={() => setIsPorModalOpen(true)}
                        onAddOutputClick={() => setIsAddOutputModalOpen(true)}
                        onViewReproducibility={(rep) => handleViewReproducibility(rep, selectedProject)}
                    />
                ) : userRole === UserRole.Scientist ? (
                    <ScientistDashboard 
                        projects={projects} 
                        onSelectProject={handleSelectProject} 
                        onNewProject={() => setIsNewProjectModalOpen(true)}
                        currentUser={currentUser}
                        onViewContributionDetails={handleViewDashboardContribution}
                    />
                ) : (
                    <FunderDashboard projects={projects} />
                )}
            </main>
            
            {isNewProjectModalOpen && <NewProjectModal onClose={() => setIsNewProjectModalOpen(false)} onAddProject={handleAddProject} />}
            
            {isAddOutputModalOpen && selectedProject && (
                <AddOutputModal
                    project={selectedProject}
                    onClose={() => setIsAddOutputModalOpen(false)}
                    onAddOutputs={(outputs) => {
                        const updatedProject = handleAddOutputs(selectedProject.id, outputs);
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
                    onDispute={() => handleDisputeAndClose(reproducibilityModalData.reproducibility.id)}
                    isOwner={reproducibilityModalData.isOwner}
                />
            )}
        </div>
    );
}

export default App;