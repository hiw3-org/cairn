
"use client";

import React, { useState, useMemo } from 'react';
import { Project, ProjectStatus, UserProfile, Reproducibility, PoRStatus } from '../../lib/types';
import { PlusIcon, FileTextIcon, UploadCloudIcon, BeakerIcon, CheckCircleIcon, ArrowRightIcon, CheckIcon, SearchIcon, ClockIcon, FlagIcon, ChartBarIcon, ScaleIcon, HypercertIcon } from '../ui/icons';
import { StatusBadge } from '../ui/status-badge';
import { GenerativePlaceholder } from '../ui/generative-placeholder';
import { useAppContext } from '../../context/app-provider';
import { MOCK_USERS } from '../../lib/constants';

const PoRStatusBadge = ({ status }: { status: PoRStatus }) => {
    const statusConfig = {
        [PoRStatus.Success]: { icon: CheckCircleIcon, color: 'text-green-500', text: 'Success' },
        [PoRStatus.Waiting]: { icon: ClockIcon, color: 'text-yellow-500', text: 'Waiting' },
        [PoRStatus.Disputed]: { icon: FlagIcon, color: 'text-red-500', text: 'Disputed' },
    };
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
        <div className={`flex items-center space-x-1.5 px-2 py-1 text-xs font-medium rounded-full ${config.color} bg-opacity-10 bg-cairn-gray-100 dark:bg-cairn-gray-800`}>
            <Icon className={`w-3.5 h-3.5 ${config.color}`} />
            <span className={config.color}>{config.text}</span>
        </div>
    );
};

const StatCard = ({ icon: Icon, title, value, subtext }: { icon: React.FC<any>, title: string, value: string | number, subtext?: string}) => (
    <div className="bg-white dark:bg-cairn-gray-900/50 p-5 rounded-xl shadow-sm flex items-start space-x-4 border border-cairn-gray-200 dark:border-cairn-gray-800/60 h-full">
        <div className="bg-cairn-blue-100 dark:bg-cairn-blue-900/50 p-3 rounded-lg flex items-center justify-center">
            <Icon className="w-6 h-6 text-cairn-blue-600 dark:text-cairn-blue-400" />
        </div>
        <div>
            <p className="text-sm font-medium text-cairn-gray-500 dark:text-cairn-gray-400">{title}</p>
            <p className="text-3xl font-bold text-cairn-gray-900 dark:text-white">{value}</p>
            {subtext && <p className="text-xs text-cairn-gray-400 dark:text-cairn-gray-500 mt-1">{subtext}</p>}
        </div>
    </div>
);

const DiscoverProjectCard = ({ project, onSelectProject }: { project: Project, onSelectProject: (p: Project) => void }) => (
    <div onClick={() => onSelectProject(project)} className="bg-white dark:bg-cairn-gray-900 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-cairn-gray-200 dark:border-cairn-gray-800 hover:border-cairn-blue-500 dark:hover:border-cairn-blue-400 overflow-hidden flex flex-col justify-between group">
        <GenerativePlaceholder projectId={project.id} className="w-full h-40" />
        <div className="p-5 flex-grow">
            <h3 className="text-lg font-semibold text-cairn-gray-900 dark:text-white group-hover:text-cairn-blue-600 dark:group-hover:text-cairn-blue-400 transition-colors">{project.title}</h3>
            <p className="text-sm text-cairn-gray-500 dark:text-cairn-gray-400 mt-1">{project.domain}</p>
            <p className="text-xs text-cairn-gray-500 dark:text-cairn-gray-400 mt-2 font-mono truncate" title={project.ownerId}>by: {MOCK_USERS.find(u => u.walletAddress === project.ownerId)?.name || project.ownerId}</p>
        </div>
        <div className="px-5 py-3 bg-cairn-gray-50 dark:bg-cairn-gray-800/50 border-t border-cairn-gray-100 dark:border-cairn-gray-700 flex justify-between items-center text-sm">
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 font-medium">
                <CheckCircleIcon className="w-5 h-5"/>
                <span>{project.reproducibilities.filter(r => r.status === PoRStatus.Success).length} Verified PoRs</span>
            </div>
            <span className="font-semibold text-cairn-blue-600 dark:text-cairn-blue-400 flex items-center">
                Review <ArrowRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </span>
        </div>
    </div>
);

const MyProjectCard = ({ project, onSelectProject }: { project: Project, onSelectProject: (p: Project) => void }) => (
    <div className="bg-white dark:bg-cairn-gray-900/50 rounded-xl shadow-lg border border-cairn-gray-200 dark:border-cairn-gray-800 overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-cairn-blue-400">
        <div className="p-5">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-cairn-gray-900 dark:text-white pr-2 group-hover:text-cairn-blue-600 dark:group-hover:text-cairn-blue-400 transition-colors">{project.title}</h3>
                <StatusBadge status={project.status} />
            </div>
            <p className="text-sm text-cairn-gray-500 dark:text-cairn-gray-400">{project.domain}</p>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                    <UploadCloudIcon className="w-5 h-5 text-cairn-blue-500"/>
                    <div>
                        <div className="font-semibold">{project.outputs.length}</div>
                        <div className="text-xs text-cairn-gray-500">Outputs</div>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <CheckIcon className="w-5 h-5 text-green-500"/>
                     <div>
                        <div className="font-semibold">{project.reproducibilities.length}</div>
                        <div className="text-xs text-cairn-gray-500">Submissions</div>
                    </div>
                </div>
            </div>
        </div>
        <div className="px-5 py-3 bg-cairn-gray-50 dark:bg-cairn-gray-800/50 border-t border-cairn-gray-200 dark:border-cairn-gray-700 mt-auto">
             <button onClick={() => onSelectProject(project)} className="w-full bg-cairn-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-cairn-blue-700 transition-all duration-300 text-sm shadow-md hover:shadow-lg group-hover:scale-105 transform">
                {project.status === ProjectStatus.Draft ? 'Manage' : 'View'}
            </button>
        </div>
    </div>
);

const NewProjectCard = ({ onNewProject, isEligible, porRequirement, porContributedCount }: { onNewProject: () => void, isEligible: boolean, porRequirement: number, porContributedCount: number }) => (
    <div className="relative group h-full">
        <button
            onClick={onNewProject}
            disabled={!isEligible}
            className="w-full h-full bg-cairn-gray-100 dark:bg-cairn-gray-800/50 rounded-xl border-2 border-dashed border-cairn-gray-300 dark:border-cairn-gray-700 flex flex-col items-center justify-center p-5 text-cairn-gray-500 hover:border-cairn-blue-500 hover:text-cairn-blue-600 dark:hover:border-cairn-blue-400 dark:hover:text-cairn-blue-400 transition-all duration-300 disabled:cursor-not-allowed disabled:hover:border-cairn-gray-300 dark:disabled:hover:border-cairn-gray-700 disabled:hover:text-cairn-gray-500 min-h-[220px]"
        >
            <PlusIcon className="w-10 h-10 mb-3" />
            <span className="font-semibold text-lg">New Project</span>
        </button>
        {!isEligible && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-cairn-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                Contribute {porRequirement - porContributedCount} more PoR to unlock.
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-cairn-gray-800"></div>
            </div>
        )}
    </div>
);

const ActionRequiredWidget = ({ projects, onSelectProject }: { projects: Project[], onSelectProject: (p: Project) => void }) => {
    const draftProjects = projects.filter(p => p.status === ProjectStatus.Draft);

    return (
        <div className="bg-white dark:bg-cairn-gray-900/50 rounded-xl p-5 border border-cairn-gray-200 dark:border-cairn-gray-800 shadow-sm h-full">
            <h4 className="font-semibold mb-3">Action Required</h4>
            {draftProjects.length > 0 ? (
                <ul className="space-y-2">
                    {draftProjects.map(p => (
                        <li key={p.id} className="flex justify-between items-center bg-cairn-gray-100 dark:bg-cairn-gray-800 p-3 rounded-lg transition-colors hover:bg-cairn-gray-200 dark:hover:bg-cairn-gray-700">
                            <div>
                                <p className="font-semibold text-sm">{p.title}</p>
                                <p className="text-xs text-cairn-gray-500 dark:text-cairn-gray-400">Add research outputs to activate</p>
                            </div>
                            <button onClick={() => onSelectProject(p)} className="text-xs bg-cairn-blue-100 text-cairn-blue-800 dark:bg-cairn-blue-900 dark:text-cairn-blue-300 font-semibold py-1 px-3 rounded-full hover:bg-cairn-blue-200">
                                Manage
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-4">
                    <CheckCircleIcon className="mx-auto h-10 w-10 text-green-500" />
                    <p className="mt-3 text-sm font-medium text-cairn-gray-600 dark:text-cairn-gray-300">No immediate actions required.</p>
                    <p className="mt-1 text-xs text-cairn-gray-500">All your active projects are up-to-date.</p>
                </div>
            )}
        </div>
    );
};

const RecentActivityWidget = ({ projects }: { projects: Project[] }) => {
     const recentSubmissions = useMemo(() => {
        return projects
            .flatMap(p => p.reproducibilities.map(r => ({ ...r, projectTitle: p.title, projectId: p.id })))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 4);
    }, [projects]);
    
    return (
        <div className="bg-white dark:bg-cairn-gray-900/50 rounded-xl p-5 border border-cairn-gray-200 dark:border-cairn-gray-800 shadow-sm h-full">
            <h4 className="font-semibold mb-3">Recent Activity on My Projects</h4>
            {recentSubmissions.length > 0 ? (
                <ul className="space-y-3">
                    {recentSubmissions.map(r => {
                        const author = MOCK_USERS.find(u => u.walletAddress === r.verifier);
                        return (
                            <li key={r.id} className="flex items-start space-x-3 text-sm">
                                <ClockIcon className="w-4 h-4 mt-0.5 text-cairn-gray-400 flex-shrink-0" />
                                <div>
                                    <p>
                                        <span className="font-semibold">
                                            {author ? author.name.split(' ')[0] : `${r.verifier.substring(0, 6)}...`}
                                        </span>
                                        {' '}submitted for reproducibility on{' '}
                                        <span className="font-semibold">{r.projectTitle}</span>.
                                    </p>
                                    <p className="text-xs text-cairn-gray-500">{new Date(r.timestamp).toLocaleDateString()}</p>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            ) : (
                 <div className="flex flex-col items-center justify-center h-full text-center py-4">
                    <SearchIcon className="mx-auto h-8 w-8 text-cairn-gray-400" />
                    <p className="mt-3 text-sm font-medium text-cairn-gray-600 dark:text-cairn-gray-300">No recent activity.</p>
                    <p className="mt-1 text-xs text-cairn-gray-500">Reproducibility submissions will appear here.</p>
                </div>
            )}
        </div>
    );
};

const MyContributionsWidget = ({ projects, currentUser, onViewContributionDetails }: { projects: Project[], currentUser: UserProfile, onViewContributionDetails: (reproducibility: Reproducibility, projectId: string) => void }) => {
    const myContributions = useMemo(() => {
        return projects
            .flatMap(p => 
                p.reproducibilities
                    .filter(r => r.verifier === currentUser.walletAddress)
                    .map(r => ({ ...r, projectTitle: p.title, projectId: p.id }))
            )
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 5);
    }, [projects, currentUser.walletAddress]);

    return (
        <div className="bg-white dark:bg-cairn-gray-900/50 rounded-xl p-5 border border-cairn-gray-200 dark:border-cairn-gray-800 shadow-sm h-full">
            <h4 className="font-semibold mb-3">My Recent Contributions</h4>
            {myContributions.length > 0 ? (
                <ul className="space-y-2">
                    {myContributions.map(r => (
                        <li key={r.id} className="flex justify-between items-center bg-cairn-gray-100 dark:bg-cairn-gray-800 p-3 rounded-lg">
                            <div className="flex-grow pr-4">
                                <p className="font-semibold text-sm truncate">On: {r.projectTitle}</p>
                                <p className="text-xs text-cairn-gray-500 dark:text-cairn-gray-400">{new Date(r.timestamp).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center space-x-3 flex-shrink-0">
                                <PoRStatusBadge status={r.status} />
                                <button
                                    onClick={() => onViewContributionDetails(r, r.projectId)}
                                    className="text-xs bg-cairn-blue-100 text-cairn-blue-800 dark:bg-cairn-blue-900/80 dark:text-cairn-blue-300 font-semibold py-1 px-3 rounded-full hover:bg-cairn-blue-200 dark:hover:bg-cairn-blue-800 transition-colors"
                                >
                                    View
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-4">
                    <BeakerIcon className="mx-auto h-8 w-8 text-cairn-gray-400" />
                    <p className="mt-3 text-sm font-medium text-cairn-gray-600 dark:text-cairn-gray-300">No contributions yet.</p>
                    <p className="mt-1 text-xs text-cairn-gray-500">Review projects in the Discover tab to contribute.</p>
                </div>
            )}
        </div>
    );
};

const FundingDashboard = ({ projects, onSelectProject }: { projects: Project[], onSelectProject: (p: Project) => void }) => {
    const totalRaised = useMemo(() => projects.reduce((sum, p) => sum + p.fundingPool, 0), [projects]);
    const activeProjects = useMemo(() => projects.filter(p => p.status === ProjectStatus.Active || p.status === ProjectStatus.Funded).length, [projects]);
    const totalHypercertValue = useMemo(() => projects.reduce((acc, p) => acc + p.hypercertFraction, 0) * 100, [projects]);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-semibold mb-1">My Funding Metrics</h2>
                <p className="text-cairn-gray-500 dark:text-cairn-gray-400">Track the financial health and impact of your research portfolio.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={ScaleIcon} title="Total Raised" value={`$${totalRaised.toLocaleString()}`} />
                <StatCard icon={FileTextIcon} title="Active/Funded Projects" value={activeProjects} />
                <StatCard icon={HypercertIcon} title="Total Hypercert Value" value={`${totalHypercertValue.toFixed(0)}%`} subtext="Combined fraction of impact" />
            </div>
            <div className="bg-white dark:bg-cairn-gray-900/50 rounded-xl p-5 border border-cairn-gray-200 dark:border-cairn-gray-800 shadow-sm">
                <h3 className="font-semibold mb-4">Funding Details by Project</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-cairn-gray-100 dark:bg-cairn-gray-800 text-left text-xs text-cairn-gray-500 dark:text-cairn-gray-400 uppercase">
                           <tr>
                                <th className="p-3 font-semibold">Project</th>
                                <th className="p-3 font-semibold">Status</th>
                                <th className="p-3 font-semibold text-right">Funding Pool</th>
                                <th className="p-3 font-semibold text-right">Funding Goal</th>
                                <th className="p-3 font-semibold text-center w-1/4">Progress</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-cairn-gray-200 dark:divide-cairn-gray-700">
                            {projects.map(p => {
                                const progress = p.fundingGoal && p.fundingGoal > 0 ? Math.min((p.fundingPool / p.fundingGoal) * 100, 100) : 0;
                                return (
                                <tr key={p.id} onClick={() => onSelectProject(p)} className="hover:bg-cairn-gray-50 dark:hover:bg-cairn-gray-800/80 cursor-pointer transition-colors">
                                    <td className="p-4 font-semibold text-cairn-gray-800 dark:text-cairn-gray-100">{p.title}</td>
                                    <td className="p-4"><StatusBadge status={p.status} /></td>
                                    <td className="p-4 text-right font-mono text-green-600 dark:text-green-400">${p.fundingPool.toLocaleString()}</td>
                                    <td className="p-4 text-right font-mono text-cairn-gray-600 dark:text-cairn-gray-400">${p.fundingGoal ? p.fundingGoal.toLocaleString() : 'N/A'}</td>
                                    <td className="p-4 text-center">
                                        <div className="w-full bg-cairn-gray-200 dark:bg-cairn-gray-700 rounded-full h-2.5 my-1">
                                            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                        </div>
                                        <span className="text-xs font-mono text-cairn-gray-500">{progress.toFixed(0)}%</span>
                                    </td>
                                </tr>
                                )
                            })}
                             {projects.length === 0 && (
                                <tr><td colSpan={5} className="text-center p-6 text-cairn-gray-500">You have no projects to display.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export const ScientistDashboard = ({ projects, onSelectProject, onNewProject, currentUser, onViewContributionDetails }: { projects: Project[], onSelectProject: (p: Project) => void, onNewProject: () => void, currentUser: UserProfile, onViewContributionDetails: (reproducibility: Reproducibility, projectId: string) => void }) => {
    type Tab = 'projects' | 'contributions' | 'funding' | 'discover';
    const [activeTab, setActiveTab] = useState<Tab>('projects');

    const porRequirement = 3;
    const isEligibleToCreate = currentUser.porContributedCount >= porRequirement;

    const myProjects = useMemo(() => projects.filter(p => p.ownerId === currentUser.walletAddress), [projects, currentUser.walletAddress]);
    const discoverProjects = useMemo(() => projects.filter(p => p.ownerId !== currentUser.walletAddress && p.status === ProjectStatus.Active), [projects, currentUser.walletAddress]);
    
    const TabButton = ({ tabName, icon: Icon, label }: { tabName: Tab; icon: React.FC<any>; label: string }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${activeTab === tabName ? 'bg-white dark:bg-cairn-gray-950 shadow-md' : 'text-cairn-gray-600 dark:text-cairn-gray-300 hover:bg-white/50 dark:hover:bg-cairn-gray-700/50'}`}
        >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div className="bg-cairn-gray-200/70 dark:bg-cairn-gray-800/70 p-1 rounded-full flex items-center space-x-1 flex-wrap">
                    <TabButton tabName="projects" icon={FileTextIcon} label="My Projects" />
                    <TabButton tabName="contributions" icon={BeakerIcon} label="My Contributions" />
                    <TabButton tabName="funding" icon={ChartBarIcon} label="Funding" />
                    <TabButton tabName="discover" icon={SearchIcon} label="Discover" />
                </div>
            </div>
            
            {activeTab === 'projects' && (
                <div className="space-y-12 animate-fade-in">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-semibold mb-1">My Research Portfolio</h2>
                            <p className="text-cairn-gray-500 dark:text-cairn-gray-400">Manage your projects, track activity, and create new research initiatives.</p>
                        </div>
                        <div className="relative group flex-shrink-0">
                            <button
                                onClick={onNewProject}
                                disabled={!isEligibleToCreate}
                                className="flex items-center space-x-2 bg-cairn-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-cairn-blue-700 transition-colors shadow-md hover:shadow-lg disabled:bg-cairn-gray-400 dark:disabled:bg-cairn-gray-600 disabled:cursor-not-allowed"
                            >
                                <PlusIcon className="w-5 h-5" />
                                <span>New Project</span>
                            </button>
                            {!isEligibleToCreate && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-cairn-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    Contribute {porRequirement - currentUser.porContributedCount} more PoR to unlock.
                                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-cairn-gray-800"></div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2"><ActionRequiredWidget projects={myProjects} onSelectProject={onSelectProject} /></div>
                        <div className="lg:col-span-1"><RecentActivityWidget projects={myProjects} /></div>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-cairn-gray-900 dark:text-white mb-6">My Projects List</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            <NewProjectCard 
                                onNewProject={onNewProject} 
                                isEligible={isEligibleToCreate} 
                                porRequirement={porRequirement} 
                                porContributedCount={currentUser.porContributedCount}
                            />
                            {myProjects.map(p => <MyProjectCard key={p.id} project={p} onSelectProject={onSelectProject} />)}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'contributions' && (
                <div className="space-y-8 animate-fade-in">
                     <div>
                       <h2 className="text-2xl font-semibold mb-1">My Peer Contributions</h2>
                       <p className="text-cairn-gray-500 dark:text-cairn-gray-400">Your community standing and contributions to other projects.</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1">
                            <StatCard icon={CheckCircleIcon} title="New Project Quota" value={`${currentUser.porContributedCount} / ${porRequirement}`} subtext="Contribute PoR to earn."/>
                        </div>
                        <div className="lg:col-span-2">
                            <MyContributionsWidget projects={projects} currentUser={currentUser} onViewContributionDetails={onViewContributionDetails} />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'funding' && (
                <div className="animate-fade-in">
                    <FundingDashboard projects={myProjects} onSelectProject={onSelectProject} />
                </div>
            )}

            {activeTab === 'discover' && (
                <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {discoverProjects.map(p => (
                        <DiscoverProjectCard key={p.id} project={p} onSelectProject={onSelectProject} />
                    ))}
                     {discoverProjects.length === 0 && (
                        <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 text-center py-16 px-6 border-2 border-dashed border-cairn-gray-300 dark:border-cairn-gray-700 rounded-xl bg-cairn-gray-100 dark:bg-cairn-gray-800/50">
                            <SearchIcon className="mx-auto h-12 w-12 text-cairn-gray-400" />
                            <h3 className="mt-4 text-xl font-semibold text-cairn-gray-900 dark:text-white">No Active Projects to Review</h3>
                            <p className="mt-2 text-md text-cairn-gray-500 dark:text-cairn-gray-400">
                                Check back later to find new research to review and contribute to.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
