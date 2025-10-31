
"use client";

import React, { useState, useMemo } from 'react';
import { Project, FundingEvent, FundingRound, PoRStatus, ProjectStatus } from '../../lib/types';
import { PlusIcon, EyeIcon, SparklesIcon, CheckBadgeIcon, UsersIcon, DownloadIcon, ShareIcon, SpinnerIcon, ClockIcon, ChevronRightIcon } from '../ui/icons';
import { useAppContext } from '../../context/app-provider';
import { NewFundingRoundModal } from '../modals/new-funding-round-modal';
import { GenerativePlaceholder } from '../ui/generative-placeholder';

const numberFormatter = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

const PageHeader = ({ title, subtitle, children }: { title: string; subtitle: string; children?: React.ReactNode }) => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">{title}</h1>
            <p className="mt-1 text-text-secondary dark:text-dark-text-secondary">{subtitle}</p>
        </div>
        {children}
    </div>
);


const RoundCard = ({ round, onMint, onViewInfo }: { round: FundingRound, onMint: (roundId: string) => void, onViewInfo: (round: FundingRound) => void }) => {
    const [isMinting, setIsMinting] = useState(false);

    const getStatusConfig = () => {
        if (round.status === 'Closed' && !round.impactAssetMinted) {
            return { text: 'Ready to Mint', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' };
        }
        const configs = {
            Open: { text: 'Open', color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' },
            Voting: { text: 'Voting', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
            Closed: { text: 'Closed', color: 'bg-hf-gray-200 text-hf-gray-600 dark:bg-hf-gray-700 dark:text-hf-gray-300' },
        };
        return configs[round.status];
    };
    
    const handleMint = async () => {
        setIsMinting(true);
        await onMint(round.id);
        setIsMinting(false);
    };

    const config = getStatusConfig();
    const fundedCount = round.applicants?.filter(a => a.fundingAmount).length || 0;

    return (
        <div className="bg-background-light dark:bg-background-dark-light rounded-xl border border-border dark:border-border-dark p-4 flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start">
                    <h4 className="font-bold text-text-primary dark:text-dark-text-primary pr-2">{round.title}</h4>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full whitespace-nowrap ${config.color}`}>{config.text}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                    {round.topics.slice(0, 3).map(t => <span key={t} className="text-xs bg-hf-gray-100 dark:bg-hf-gray-800 px-2 py-0.5 rounded-full">{t}</span>)}
                </div>
                <div className="grid grid-cols-3 gap-4 text-center my-4">
                    <div><p className="font-bold text-lg">${numberFormatter.format(round.poolSize)}</p><p className="text-xs text-text-secondary">Pool Size</p></div>
                    <div><p className="font-bold text-lg">{round.applicationCount}</p><p className="text-xs text-text-secondary">Applicants</p></div>
                    <div><p className="font-bold text-lg">{fundedCount}</p><p className="text-xs text-text-secondary">Projects Funded</p></div>
                </div>
            </div>
            <div className="mt-auto">
                {round.status === 'Closed' && !round.impactAssetMinted && (
                    <button onClick={handleMint} disabled={isMinting} className="w-full flex items-center justify-center space-x-2 bg-purple-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-purple-500 transition-colors disabled:bg-purple-400">
                        {isMinting ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5"/>}
                        <span>Mint Impact Asset</span>
                    </button>
                )}
                {round.impactAssetMinted && (
                     <button className="w-full flex items-center justify-center space-x-2 bg-hf-gray-200 dark:bg-hf-gray-700 font-semibold py-2 px-3 rounded-lg">
                        <CheckBadgeIcon className="w-5 h-5 text-status-success"/>
                        <span>View Certificate</span>
                    </button>
                )}
                 {(round.status === 'Open' || round.status === 'Voting') && (
                     <button onClick={() => onViewInfo(round)} className="w-full flex items-center justify-center space-x-2 bg-hf-gray-200 dark:bg-hf-gray-700 font-semibold py-2 px-3 rounded-lg hover:bg-hf-gray-300 dark:hover:bg-hf-gray-600">
                        <EyeIcon className="w-5 h-5"/>
                        <span>View Details</span>
                    </button>
                )}
            </div>
        </div>
    );
};

const ImpactAssetCard = ({ round }: { round: FundingRound }) => {
    const { projects } = useAppContext();
    const { verifiedCount, totalCitations, totalDownloads } = useMemo(() => {
        const roundProjects = projects.filter(p => round.applicants?.some(a => a.projectId === p.id));
        const verified = roundProjects.filter(p => p.reproducibilities.some(r => r.status === PoRStatus.Success)).length;
        const citations = roundProjects.reduce((sum, p) => sum + (p.scientificMetrics?.citations.value || 0), 0);
        const downloads = roundProjects.reduce((sum, p) => sum + (p.adoptionMetrics?.huggingFaceDownloads.value || 0), 0);
        return { verifiedCount: verified, totalCitations: citations, totalDownloads: downloads };
    }, [round, projects]);

    return (
        <div className="bg-background-light dark:bg-background-dark-light rounded-2xl border border-border dark:border-border-dark shadow-lg overflow-hidden flex flex-col">
            <div className="relative aspect-[4/3]">
                 <GenerativePlaceholder projectId={round.id} className="w-full h-full" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent p-3 flex flex-col justify-end">
                    <h3 className="text-white font-bold text-lg leading-tight">{round.title}</h3>
                 </div>
            </div>
            <div className="p-3 flex-grow">
                <div className="grid grid-cols-3 gap-2 text-center border-b border-border dark:border-border-dark pb-2 mb-2">
                    <div><p className="font-bold text-base">{verifiedCount}</p><p className="text-xs text-text-secondary">Verified</p></div>
                    <div><p className="font-bold text-base">{numberFormatter.format(totalCitations)}</p><p className="text-xs text-text-secondary">Citations</p></div>
                    <div><p className="font-bold text-base">{numberFormatter.format(totalDownloads)}</p><p className="text-xs text-text-secondary">Downloads</p></div>
                </div>
                <div className="text-xs text-text-secondary dark:text-dark-text-secondary space-y-1">
                    <p><strong>Pool Size:</strong> ${round.poolSize.toLocaleString()}</p>
                    <p><strong>Domains:</strong> {round.topics.join(', ')}</p>
                    <p><strong>Minted On:</strong> {new Date(round.distributionDeadline).toLocaleDateString()}</p>
                </div>
            </div>
            <div className="p-2 bg-hf-gray-50 dark:bg-hf-gray-900/50 border-t border-border dark:border-border-dark flex items-center justify-center space-x-2">
                <button className="flex-1 flex items-center justify-center space-x-2 bg-primary text-white font-semibold text-sm py-1.5 px-3 rounded-lg hover:bg-primary-hover transition-colors"><ShareIcon className="w-4 h-4" /><span>Share</span></button>
                <button className="flex-1 flex items-center justify-center space-x-2 bg-hf-gray-200 dark:bg-hf-gray-700 font-semibold text-sm py-1.5 px-3 rounded-lg hover:bg-hf-gray-300 dark:hover:bg-hf-gray-600 transition-colors"><DownloadIcon className="w-4 h-4" /><span>Download</span></button>
            </div>
        </div>
    );
}

export const FunderDashboard = ({ projects, onViewInfo }: { projects: Project[], onSelectProject: (p: Project) => void, onViewInfo: (round: FundingRound) => void }) => {
    const { fundingRounds, handleMintImpactAsset } = useAppContext();
    const [isNewRoundModalOpen, setIsNewRoundModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'Active' | 'Voting' | 'Closed'>('Active');
    
    const roundsByStatus = useMemo(() => ({
        Active: fundingRounds.filter(r => r.status === 'Open'),
        Voting: fundingRounds.filter(r => r.status === 'Voting'),
        Closed: fundingRounds.filter(r => r.status === 'Closed'),
    }), [fundingRounds]);
    
    const mintedAssets = fundingRounds.filter(r => r.impactAssetMinted);

    return (
        <div className="animate-fade-in space-y-8">
             <PageHeader title="Funder Dashboard" subtitle="Track your portfolio, manage funding rounds, and view recent activity.">
                <button onClick={() => setIsNewRoundModalOpen(true)} className="flex items-center space-x-2 bg-primary text-primary-text font-semibold py-2.5 px-5 rounded-lg hover:bg-primary-hover transition-colors shadow-md hover:shadow-lg shadow-primary/30">
                    <PlusIcon className="w-5 h-5" />
                    <span>Create New Round</span>
                </button>
            </PageHeader>
            
            <div className="space-y-8">
                {/* Round History */}
                <div>
                    <h3 className="text-2xl font-bold mb-4">My Funding Rounds</h3>
                    <div className="border-b border-border dark:border-border-dark mb-4">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            {(['Active', 'Voting', 'Closed'] as const).map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)} className={`${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-dark'} whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-sm`}>
                                    {tab} <span className="bg-hf-gray-200 dark:bg-hf-gray-700 text-xs font-bold ml-2 px-2 py-0.5 rounded-full">{roundsByStatus[tab].length}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                        {/* FIX: Property 'key' does not exist on type... */}
                        {roundsByStatus[activeTab].map(round => <RoundCard key={round.id} round={round} onMint={handleMintImpactAsset} onViewInfo={onViewInfo} />)}
                    </div>
                    {roundsByStatus[activeTab].length === 0 && <p className="text-center py-8 text-text-secondary">No rounds in this category.</p>}
                </div>

                {/* Impact Certificates */}
                <div>
                    <h3 className="text-2xl font-bold mb-4">Impact Certificates</h3>
                    {mintedAssets.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* FIX: Property 'key' does not exist on type... */}
                            {mintedAssets.map(round => <ImpactAssetCard key={round.id} round={round} />)}
                        </div>
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed border-border dark:border-border-dark rounded-xl">
                            <SparklesIcon className="mx-auto h-12 w-12 text-text-secondary/50" />
                            <h4 className="mt-4 text-xl font-semibold">No Impact Assets Minted Yet</h4>
                            <p className="text-text-secondary dark:text-text-dark-secondary mt-2">When a round you participated in closes, you can mint an NFT here.</p>
                        </div>
                    )}
                </div>
            </div>
            
            {isNewRoundModalOpen && <NewFundingRoundModal onClose={() => setIsNewRoundModalOpen(false)} />}
        </div>
    );
};
