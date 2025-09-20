"use client";

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { UserRole, Project, ToastInfo, UserProfile, Reproducibility, Output, ProjectStatus, PoRStatus, FundingEvent, ImpactAssetOwner, FundingRound, RoundApplicant, Notification, HuggingFaceOutput, ResearchDomain } from '../lib/types';
import { MOCK_PROJECTS, MOCK_USERS, RESEARCHER_WALLET_ALICE, MOCK_FUNDING_HISTORY, CURRENT_USER_WALLET, MOCK_FUNDING_ROUNDS, MOCK_NOTIFICATIONS, REPRODUCIBILITY_TEMPLATES, MOCK_HUGGINGFACE_OUTPUTS } from '../lib/constants';
import { CheckCircleIcon, AlertTriangleIcon, InfoIcon, CloseIcon } from '../components/ui/icons';

interface AppContextType {
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  userRole: UserRole;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  huggingFaceOutputs: HuggingFaceOutput[];
  setHuggingFaceOutputs: React.Dispatch<React.SetStateAction<HuggingFaceOutput[]>>;
  currentUser: UserProfile | null;
  toasts: ToastInfo[];
  addToast: (message: string, type?: ToastInfo['type']) => void;
  dismissToast: (id: number) => void;
  handlePorSubmit: (projectId: string, reproducibilityData: { notes: string, evidence: Output[] }) => void;
  handleAddProject: (project: Project) => void;
  handleSubmitForReproducibility: (projectId: string) => void;
  handleDispute: (projectId: string, reproducibilityId: string) => void;
  handleInstantFund: (projectId: string, amount: number) => void;
  handleClaimOwnership: (projectId: string) => void;
  handleRegisterClaim: (projectId: string, projectOwnerAddress: string) => Promise<boolean>;
  fundingHistory: FundingEvent[];
  fundingRounds: FundingRound[];
  setFundingRounds: React.Dispatch<React.SetStateAction<FundingRound[]>>;
  handleCreateFundingRound: (round: Omit<FundingRound, 'id' | 'status' | 'applicationCount' | 'totalImpactScore'>) => void;
  handleDistributeRoundFunds: (roundId: string, applicantsToFund: RoundApplicant[]) => void;
  handleApplyToFundingRound: (projectId: string, roundId: string, pitch: string, attachments: File[]) => void;
  notifications: Notification[];
  usdcBalance: number;
  handleCreateProjectFromHuggingFace: (hfOutputs: HuggingFaceOutput[]) => string;
  handleMintImpactAsset: (roundId: string) => Promise<void>;

    // Auth & Navigation
  connectedWallet: string | null;
  isAuthenticated: boolean;
  connectWallet: (role?: UserRole) => Promise<void>;

  login: (method: 'huggingface' | 'metamask') => Promise<void>;
  signUp: (data: { name: string; role: UserRole; affiliation: string; github: string; scholar: string; linkedin: string; }) => Promise<void>;
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
    const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
    const [huggingFaceOutputs, setHuggingFaceOutputs] = useState<HuggingFaceOutput[]>(MOCK_HUGGINGFACE_OUTPUTS);
    const [fundingHistory, setFundingHistory] = useState<FundingEvent[]>(MOCK_FUNDING_HISTORY);
    const [fundingRounds, setFundingRounds] = useState<FundingRound[]>(MOCK_FUNDING_ROUNDS);
  const [toasts, setToasts] = useState<ToastInfo[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>(
        MOCK_NOTIFICATIONS.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
    const [usdcBalance, setUsdcBalance] = useState(250000); // Mock wallet balance
    
    // Auth & Navigation State
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [forceShowLanding, setForceShowLanding] = useState(false);
    const [isGuestBrowsing, setIsGuestBrowsing] = useState(false);

    const isAuthenticated = !!connectedWallet;

  const setIsDarkMode = (dark: boolean) => {
    setIsDarkModeState(dark);
        if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      if (dark) {
                root.classList.add('dark');
      } else {
                root.classList.remove('dark');
      }
    }
  };


  useEffect(() => {
    // Set initial theme to light mode by default.
    // The toggle in the header will still allow users to switch.
        setIsDarkMode(isDarkMode);
    }, [isDarkMode]);

  const dismissToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

    const addToast = useCallback((message: string, type: ToastInfo['type'] = 'info') => {
      const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
        dismissToast(id);
      }, 5000);
    }, [dismissToast]);

    const login = async (method: 'huggingface' | 'metamask') => {
        setForceShowLanding(false);
        setIsGuestBrowsing(false);
        const mockAccount = CURRENT_USER_WALLET;

        let userProfile = MOCK_USERS.find(u => u.walletAddress.toLowerCase() === mockAccount.toLowerCase());
        if (!userProfile) {
            userProfile = {
                walletAddress: mockAccount,
                name: "Test User",
                porContributedCount: 0,
                isVerified: true,
            };
        }
        
        setCurrentUser(userProfile);
        setConnectedWallet(mockAccount);

        if (method === 'huggingface') {
            setUserRole(UserRole.Researcher);
            addToast(`Logged in as Researcher via Hugging Face.`, 'success');
        } else { // metamask
            setUserRole(UserRole.Funder);
            addToast(`Logged in as Funder via MetaMask.`, 'success');
        }

        setIsDarkMode(false); // Default to light mode for the app
    };

    const signUp = async (data: { name: string; role: UserRole; affiliation: string; github: string; scholar: string; linkedin: string; }) => {
        console.log("New sign-up application submitted:", data);
        addToast("Application submitted! You'll be notified upon verification.", 'success');
    };

    const disconnectWallet = () => {
        setConnectedWallet(null);
        setCurrentUser(null);
        setUserRole(UserRole.Researcher); // Reset to a default role
        setForceShowLanding(false);
        setIsGuestBrowsing(false);

        // Revert to dark mode for landing page
        setIsDarkMode(true);
        
        addToast("You have been logged out.", 'info');
    };

    const goToLandingPage = () => {
        setForceShowLanding(true);
        setIsGuestBrowsing(false);
    };

    const enterApp = () => {
        setForceShowLanding(false);
        setIsGuestBrowsing(false);
        }

    const enterAppAsGuest = () => {
        setIsGuestBrowsing(true);
        setForceShowLanding(false);
    };
    
    const handleAddProject = (project: Project) => {
        setProjects(prev => [project, ...prev]);
        addToast(`Project draft "${project.title}" created!`, 'success');
    };

    const handleCreateProjectFromHuggingFace = (hfOutputs: HuggingFaceOutput[]): string => {
        if (!currentUser || hfOutputs.length === 0) return '';
        
        const newProjectId = `proj-${Date.now()}`;
        
        const newProject: Project = {
            id: newProjectId,
            ownerId: currentUser.walletAddress,
            title: `Project from ${hfOutputs[0].name}`,
            description: `A new project created by importing ${hfOutputs.length} output(s) from Hugging Face.`,
            domain: ResearchDomain.Simulation, // Default domain
            tags: hfOutputs.flatMap(o => [o.type, ...o.name.split('-').slice(0, 2)]).slice(0, 4),
            status: ProjectStatus.Draft,
            cid: `Qm...${Date.now().toString().slice(-4)}`,
            hypercertFraction: 0,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            lastOutputDate: new Date().toISOString().split('T')[0],
            reproducibilities: [],
            fundingPool: 0,
            impactScore: 0,
            outputs: hfOutputs.map(hfOutput => ({
                id: `out-${hfOutput.id}`,
                type: hfOutput.type === 'model' ? 'Code' : hfOutput.type === 'dataset' ? 'Dataset' : 'Others',
                timestamp: new Date().toISOString().split('T')[0],
                description: `Hugging Face ${hfOutput.type}: ${hfOutput.name}`,
                data: {
                    url: `https://huggingface.co/${hfOutput.name}`,
                },
            })),
            reproducibilityRequirements: REPRODUCIBILITY_TEMPLATES[ResearchDomain.Simulation],
            impactAssetOwners: [],
        };

        setProjects(prev => [newProject, ...prev]);
        setHuggingFaceOutputs(prev => prev.map(o => hfOutputs.find(ho => ho.id === o.id) ? { ...o, status: 'Imported', cairnProjectId: newProjectId } : o));
        addToast(`Successfully created new project draft: "${newProject.title}"`, 'success');

        return newProjectId;
  };

    const handleSubmitForReproducibility = (projectId: string) => {
        addToast('Submitting for reproducibility evaluation...', 'info');

        // 1. Set status to Pending
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: ProjectStatus.PendingEvaluation } : p));
        setHuggingFaceOutputs(prev => prev.map(o => o.cairnProjectId === projectId ? { ...o, status: 'Pending Evaluation' } : o));

        // 2. Simulate evaluation delay
        setTimeout(() => {
            // 3. Set status to Reproducible
            setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: ProjectStatus.Reproducible } : p));
            setHuggingFaceOutputs(prev => prev.map(o => o.cairnProjectId === projectId ? { ...o, status: 'Reproducible' } : o));
            addToast('Project is now Reproducible!', 'success');
        }, 5000); // 5-second mock delay
    };

    const handlePorSubmit = (projectId: string, reproducibilityData: { notes: string, evidence: Output[] }) => {
        if (!currentUser) return;
        setProjects(prevProjects => prevProjects.map(p => {
        if (p.id === projectId) {
                const newReproducibility: Reproducibility = {
                    id: `rep-${Date.now()}`,
                    timestamp: new Date().toISOString().split('T')[0],
                    verifier: currentUser.walletAddress,
                    notes: reproducibilityData.notes,
                    evidence: reproducibilityData.evidence.map(e => ({...e, id: e.id.replace('staged', 'final')})),
                    status: PoRStatus.Waiting,
                };
                return { ...p, reproducibilities: [...p.reproducibilities, newReproducibility] };
        }
        return p;
        }));
        setCurrentUser(prevUser => ({
      ...prevUser!,
      porContributedCount: prevUser!.porContributedCount + 1,
    }));
        addToast("PoR submitted! Your contribution is recorded.", 'success');
  };

  const handleDispute = (projectId: string, reproducibilityId: string) => {
        let reproducibilityAuthor = '';
        setProjects(prevProjects => prevProjects.map(p => {
        if (p.id === projectId) {
                const updatedReproducibilities = p.reproducibilities.map(r => {
            if (r.id === reproducibilityId) {
              reproducibilityAuthor = r.verifier;
              return { ...r, status: PoRStatus.Disputed };
            }
            return r;
          });
          return { ...p, reproducibilities: updatedReproducibilities };
        }
        return p;
        }));
    if (reproducibilityAuthor) {
            addToast(`Submission from ${reproducibilityAuthor.substring(0, 8)}... has been flagged for review.`, 'info');
    }
  };

  const handleInstantFund = (projectId: string, amount: number) => {
        let projectTitle = '';
        setProjects(prevProjects => prevProjects.map(p => {
        if (p.id === projectId) {
          projectTitle = p.title;
          const updatedProject = {
            ...p,
            fundingPool: p.fundingPool + amount,
          };
                addToast(`Successfully funded $${amount.toLocaleString()} to "${p.title}"!`, 'success');
          return updatedProject;
        }
        return p;
        }));

        if (projectTitle && currentUser) {
      const newFundingEvent: FundingEvent = {
        id: `fh-${Date.now()}`,
        projectId,
        projectTitle,
        amount,
                timestamp: new Date().toISOString().split('T')[0],
                funderWallet: currentUser.walletAddress,
                txHash: `0x${Date.now().toString(16)}${Math.random().toString(16).substring(2, 12)}`,
            };
            setFundingHistory(prev => [newFundingEvent, ...prev]);
        }
    };

    const handleClaimOwnership = (projectId: string) => {
        if (!currentUser) return;
        
        let projectTitle = '';
        const updatedProjects = projects.map(p => {
            if (p.id === projectId) {
                projectTitle = p.title;
                const updatedOwners = p.impactAssetOwners.map(owner => {
                    if (owner.walletAddress === currentUser.walletAddress) {
                        return { ...owner, claimed: true };
                    }
                    return owner;
                });
                return { ...p, impactAssetOwners: updatedOwners };
            }
            return p;
        });

        setProjects(updatedProjects);
        addToast(`Successfully claimed ownership for project: ${projectTitle}`, 'success');
    };

    const handleRegisterClaim = async (projectCid: string, projectOwnerAddress: string): Promise<boolean> => {
        if (!currentUser) {
            addToast("Please connect your wallet first.", "error");
            return false;
        }

        let projectToClaim: Project | undefined;

        if (projectCid && projectOwnerAddress) {
            projectToClaim = projects.find(p => p.cid === projectCid && p.ownerId.toLowerCase() === projectOwnerAddress.toLowerCase());
        } else if (projectCid) {
            projectToClaim = projects.find(p => p.cid === projectCid);
        } else if (projectOwnerAddress) {
            const foundProjects = projects.filter(p => p.ownerId.toLowerCase() === projectOwnerAddress.toLowerCase());
            if (foundProjects.length > 1) {
                addToast("Multiple projects found for this owner. Please also provide a Project UID.", "info");
                return false;
            }
            projectToClaim = foundProjects[0];
        }

        if (!projectToClaim) {
            addToast("Project not found. Please check the provided details.", "error");
            return false;
        }
        
        const project = projectToClaim;

        const existingClaim = project.impactAssetOwners.find(o => o.walletAddress === currentUser.walletAddress);

        if (existingClaim) {
            addToast("You already have an ownership claim for this project. It is listed below.", "info");
            return true;
        }
        
        const newClaim: ImpactAssetOwner = {
            walletAddress: currentUser.walletAddress,
            contribution: 'Registered Claimant',
            ownershipPercentage: 2.5, // Mock percentage
            claimed: false
        };

        setProjects(prevProjects => prevProjects.map(p => {
            if (p.id === project.id) {
                return {
                    ...p,
                    impactAssetOwners: [...p.impactAssetOwners, newClaim]
                };
            }
            return p;
        }));

        addToast(`Successfully registered claim for "${project.title}"! You can now claim it below.`, 'success');
        return true;
    };
    
    const handleCreateFundingRound = (round: Omit<FundingRound, 'id' | 'status' | 'applicationCount' | 'totalImpactScore'>) => {
        const newRound: FundingRound = {
            ...round,
            id: `round-${Date.now()}`,
            status: 'Open',
            applicationCount: 0,
            totalImpactScore: 0,
        };
        setFundingRounds(prev => [newRound, ...prev]);

        const newNotification: Notification = {
            id: `notif-${Date.now()}`,
            type: 'round_created',
            title: `Round Launched: ${newRound.title}`,
            description: `The new funding round is open for applications until ${new Date(newRound.applicationDeadline).toLocaleDateString()}.`,
            date: new Date().toISOString(),
            relatedId: newRound.id,
            action: { text: 'View Round' }
        };
        setNotifications(prev => [newNotification, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        
        addToast(`Funding round "${round.title}" has been created!`, 'success');
    };
    
    const handleDistributeRoundFunds = (roundId: string, applicantsToFund: RoundApplicant[]) => {
        const round = fundingRounds.find(r => r.id === roundId);
        if (!round) return;

        const newFundingEvents: FundingEvent[] = [];
        
        applicantsToFund.forEach(app => {
            if (!app.fundingAmount || app.fundingAmount <= 0) return;
            
            const newEvent: FundingEvent = {
                id: `fh-${Date.now()}-${app.projectId}`,
                projectId: app.projectId,
                projectTitle: app.projectTitle,
                amount: app.fundingAmount,
                timestamp: new Date().toISOString().split('T')[0],
                funderWallet: `Round: ${round.title.substring(0,15)}...`,
                txHash: `0x${Date.now().toString(16)}${Math.random().toString(16).substring(2, 12)}`,
            };
            newFundingEvents.push(newEvent);
        });

        const updatedProjects = projects.map(p => {
            const fundingInfo = applicantsToFund.find(app => app.projectId === p.id);
            if (fundingInfo && fundingInfo.fundingAmount) {
                return {
                    ...p,
                    fundingPool: p.fundingPool + fundingInfo.fundingAmount,
                    status: ProjectStatus.Funded,
                };
            }
            return p;
        });

        const updatedRounds = fundingRounds.map(r => 
            r.id === roundId ? { ...r, status: 'Closed' as const } : r
        );
        
        setProjects(updatedProjects);
        setFundingHistory(prev => [...newFundingEvents, ...prev]);
        setFundingRounds(updatedRounds);
        
        addToast(`Successfully distributed funds for "${round.title}"!`, 'success');
    };

    const getImpactLevel = (fraction: number): 'High' | 'Medium' | 'Low' => {
        if (fraction >= 0.75) return 'High';
        if (fraction >= 0.3) return 'Medium';
        return 'Low';
    };

    const handleApplyToFundingRound = (projectId: string, roundId: string, pitch: string, attachments: File[]) => {
        let projectTitle = '';
        let applicantData: RoundApplicant | null = null;
    
        const updatedProjects = projects.map(p => {
            if (p.id === projectId) {
                projectTitle = p.title;
                applicantData = {
                    projectId: p.id,
                    projectTitle: p.title,
                    verifiedPors: p.reproducibilities.filter(r => r.status === PoRStatus.Success).length,
                    impactLevel: getImpactLevel(p.hypercertFraction),
                    hfUpvotes: p.stars || 0,
                    communityScore: p.impactScore,
                };
                return { ...p, status: ProjectStatus.InReview };
            }
            return p;
        });
    
        if (!applicantData) {
            addToast(`Project with ID ${projectId} not found.`, 'error');
            return;
        }
        
        const updatedRounds = fundingRounds.map(r => {
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
        await new Promise(resolve => setTimeout(resolve, 3000));
        setFundingRounds(prevRounds =>
            prevRounds.map(round =>
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
     throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Toast Components
const Toast = ({ message, type, onDismiss }: { message: string, type: ToastInfo['type'], onDismiss: () => void }) => {
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
             <p className="text-sm font-semibold text-text dark:text-text-dark">{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button onClick={onDismiss} className="rounded-full inline-flex text-text-secondary dark:text-text-dark-secondary hover:text-text dark:hover:text-text-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              <span className="sr-only">Close</span>
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToastContainer = ({ toasts, dismissToast }: { toasts: ToastInfo[], dismissToast: (id: number) => void }) => (
  <div className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50">
    <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
      {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onDismiss={() => dismissToast(toast.id)} />
      ))}
    </div>
  </div>
);
