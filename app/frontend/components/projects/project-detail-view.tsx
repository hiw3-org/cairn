"use client";

import { Project, Reproducibility, Output, ProjectStatus, ReproducibilityStatus } from '../../lib/types';
import { ChevronLeftIcon, PlusIcon, CodeIcon, DownloadIcon, StarIcon, BookOpenIcon, CopyIcon, CheckIcon, ShareIcon, CitationIcon, IpfsIcon, BeakerIcon, StarFilledIcon } from '../ui/icons';
import { StatusBadge } from '../ui/status-badge';
import PoRModule from './por-module';
import { useAppContext } from '../../context/app-provider';
import React from 'react';
import { useClipboard } from '../../hooks/use-clipboard';
import { ReproducibilityBadge } from '../ui/reproducibility-badge';
import { MOCK_USERS } from '../../lib/constants';

const numberFormatter = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

const AddressWithCopy = ({ address }: { address: string }) => {
    const { copy, copied } = useClipboard();
    const userName = MOCK_USERS.find(u => u.walletAddress === address)?.name || 'Unknown User';
    const formatAddress = (addr: string) => {
        if (!addr || addr.length < 10) return addr;
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    };

    return (
        <div className="flex items-center space-x-2 group">
            <span className="font-mono text-sm text-text-secondary dark:text-text-dark-secondary" title={`${userName} - ${address}`}>{formatAddress(address)}</span>
            <button onClick={(e) => { e.stopPropagation(); copy(address); }} className="p-1 rounded-full text-text-secondary hover:bg-hf-gray-200 dark:hover:bg-hf-gray-800 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Copy address">
                {copied ? <CheckIcon className="h-4 w-4 text-status-success" /> : <CopyIcon className="h-4 w-4" />}
            </button>
        </div>
    );
};

const FundingAndOwnershipWidget = ({ project }: { project: Project }) => {
    return (
        <div className="bg-background-light dark:bg-background-dark-light rounded-xl shadow-sm p-6 border border-border dark:border-border-dark">
            <div className="space-y-6">
                {/* Funding Section */}
                <div>
                    <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary mb-3">Funding</h3>
                    <div className="p-4 rounded-lg bg-hf-gray-50 dark:bg-hf-gray-900/50">
                        <p className="text-sm font-semibold text-text-secondary dark:text-dark-text-secondary">Total Raised</p>
                        <p className="text-3xl font-bold text-status-success mt-1">${project.fundingPool > 0 ? project.fundingPool.toLocaleString() : '0'}</p>
                    </div>
                </div>

                {/* Ownership Section */}
                {project.impactAssetOwners && project.impactAssetOwners.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary mb-2">Ownership</h3>
                        <ul className="space-y-2">
                            {project.impactAssetOwners.map((owner, index) => (
                                <li key={index} className="py-2 flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-text-primary dark:text-dark-text-primary text-sm">{owner.contribution}</p>
                                        <AddressWithCopy address={owner.walletAddress} />
                                    </div>
                                    <span className="text-lg font-bold text-primary dark:text-primary-light flex-shrink-0 ml-4">{owner.ownershipPercentage.toFixed(1)}%</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};


const ImpactMetric = ({ icon: Icon, label, value }: { icon: React.FC<any>, label: string, value: string | number }) => (
    <div className="bg-background-light dark:bg-background-dark-light p-4 rounded-lg border border-border dark:border-border-dark">
        <div className="flex items-center space-x-2">
            <Icon className="w-5 h-5 text-text-secondary dark:text-dark-text-secondary" />
            <p className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{label}</p>
        </div>
        <p className="mt-1 text-2xl font-bold text-text-primary dark:text-dark-text-primary">{value}</p>
    </div>
);

const OutputCard = ({ output, projectStatus }: { output: Output, projectStatus: ProjectStatus }) => {
    const reproducibilityStatus: ReproducibilityStatus = (projectStatus === ProjectStatus.Reproducible || projectStatus === ProjectStatus.Funded) ? 'Verified' : 'Pending';
    
    return (
        <div className="bg-background dark:bg-background-dark-light/50 p-4 rounded-xl border border-border dark:border-border-dark space-y-3">
            <div>
                <span className="text-xs font-semibold bg-hf-gray-200 dark:bg-hf-gray-700 px-2 py-0.5 rounded-full">{output.type}</span>
                <p className="font-semibold text-text-primary dark:text-dark-text-primary mt-2">{output.description}</p>
                <p className="text-xs text-text-secondary dark:text-dark-text-secondary">Added on {output.timestamp}</p>
            </div>

            <div className="flex items-center space-x-4">
                <ReproducibilityBadge status={reproducibilityStatus} />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-border dark:border-border-dark">
                <div className="flex items-center space-x-4 text-sm text-text-secondary dark:text-dark-text-secondary">
                    <span className="flex items-center space-x-1" title="Downloads"><DownloadIcon className="w-4 h-4" /> <span>{numberFormatter.format(output.metrics?.downloads || 0)}</span></span>
                    <span className="flex items-center space-x-1" title="Stars"><StarIcon className="w-4 h-4" /> <span>{numberFormatter.format(output.metrics?.stars || 0)}</span></span>
                    <span className="flex items-center space-x-1" title="Citations"><BookOpenIcon className="w-4 h-4" /> <span>{numberFormatter.format(output.metrics?.citations || 0)}</span></span>
                </div>
                 <div className="flex items-center space-x-2">
                    <button className="flex items-center space-x-2 bg-primary text-white text-sm font-semibold py-1.5 px-3 rounded-md hover:bg-primary-hover transition-colors">
                        <IpfsIcon className="w-4 h-4"/>
                        <span>Download</span>
                    </button>
                 </div>
            </div>
        </div>
    );
};

export const ProjectDetailView = ({
    project,
    onBack,
    onPorSubmitClick,
    onViewReproducibility,
    onGetProofClick,
}: {
    project: Project,
    onBack: () => void,
    onPorSubmitClick: () => void,
    onViewReproducibility: (rep: Reproducibility) => void,
    onGetProofClick: (project: Project) => void;
}) => {
    const { currentUser } = useAppContext();
    if (!currentUser) return null; // Should not happen if authenticated
    const isOwner = project.ownerId === currentUser.walletAddress;
    const [isStarred, setIsStarred] = React.useState(false);


    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="flex items-center space-x-2 text-sm text-primary font-semibold mb-6 hover:underline">
                <ChevronLeftIcon className="w-5 h-5" />
                <span>Back to Dashboard</span>
            </button>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Project Header */}
                    <div className="bg-background-light dark:bg-background-dark-light rounded-xl shadow-sm p-6 border border-border dark:border-border-dark">
                        <div className="flex justify-between items-start">
                             <div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-2">
                                    <StatusBadge status={project.status} />
                                    <span className="text-sm text-text-secondary dark:text-dark-text-secondary">Last updated: {project.lastOutputDate}</span>
                                </div>
                                <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">{project.title}</h1>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {project.tags.map(tag => (
                                        <span key={tag} className="text-xs bg-hf-gray-200 dark:bg-hf-gray-700 px-2 py-0.5 rounded-full">{tag}</span>
                                    ))}
                                </div>
                             </div>
                             <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                                 <button onClick={() => setIsStarred(s => !s)} className={`p-2 rounded-full transition-colors ${isStarred ? 'text-yellow-500 bg-yellow-100 dark:bg-yellow-500/20' : 'hover:bg-hf-gray-200 dark:hover:bg-hf-gray-800'}`}>
                                     {isStarred ? <StarFilledIcon className="w-5 h-5" /> : <StarIcon className="w-5 h-5" />}
                                 </button>
                                 <button className="p-2 rounded-full hover:bg-hf-gray-200 dark:hover:bg-hf-gray-800"><ShareIcon className="w-5 h-5" /></button>
                             </div>
                        </div>

                        <p className="mt-4 text-text-secondary dark:text-dark-text-secondary">{project.description}</p>
                    </div>

                    {/* Impact Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <ImpactMetric icon={DownloadIcon} label="Total Downloads" value={numberFormatter.format(project.outputs.reduce((sum, o) => sum + (o.metrics?.downloads || 0), 0))} />
                        <ImpactMetric icon={StarIcon} label="Total Stars" value={numberFormatter.format(project.outputs.reduce((sum, o) => sum + (o.metrics?.stars || 0), 0))} />
                        <ImpactMetric icon={CitationIcon} label="Total Citations" value={numberFormatter.format(project.outputs.reduce((sum, o) => sum + (o.metrics?.citations || 0), 0))} />
                        <ImpactMetric icon={BeakerIcon} label="PoRs" value={project.reproducibilities.length} />
                    </div>

                    {/* Outputs Section */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold">Outputs ({project.outputs.length})</h2>
                        </div>
                        <div className="space-y-4">
                            {project.outputs.map(output => (
                                <OutputCard key={output.id} output={output} projectStatus={project.status} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-1 space-y-8 lg:sticky lg:top-28">
                    <FundingAndOwnershipWidget project={project} />
                    <PoRModule 
                        project={project} 
                        isOwner={isOwner} 
                        onPorSubmitClick={onPorSubmitClick} 
                        onViewReproducibility={onViewReproducibility} 
                        onGetProofClick={() => onGetProofClick(project)}
                    />
                </div>
            </div>
        </div>
    );
};