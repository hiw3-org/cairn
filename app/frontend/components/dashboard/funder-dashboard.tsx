"use client";

import React, { useState, useMemo } from 'react';
import { Project, FundingEvent, FundingRound, Notification, PoRStatus, ProjectStatus } from '../../lib/types';
import { ScaleIcon, GavelIcon, PlusIcon, InfoIcon, EyeIcon, TrendingUpIcon, SparklesIcon, CheckBadgeIcon, UsersIcon, DownloadIcon, BookOpenIcon, CitationIcon, ShareIcon, SpinnerIcon, ClockIcon } from '../ui/icons';
import { useAppContext } from '../../context/app-provider';
import { NewFundingRoundModal } from '../modals/new-funding-round-modal';
import { AppLogo } from '../ui/logo';
import { GenerativePlaceholder } from '../ui/generative-placeholder';
import { useContract } from "@/context/contract-context";

const numberFormatter = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

const PageHeader = ({ title, subtitle }: { title: string; subtitle: string;}) => (
    <div>
        <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">{title}</h1>
        <p className="mt-1 text-text-secondary dark:text-dark-text-secondary">{subtitle}</p>
    </div>
);

const FunderKpiCard = ({ icon: Icon, title, value, growth }: { icon: React.FC<any>, title: string, value: string | number, growth?: string }) => (
    <div className="bg-background-light dark:bg-background-dark-light p-5 rounded-xl border border-border/70 dark:border-border-dark/70 shadow-sm flex-grow">
        <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-light dark:bg-primary/10 rounded-lg">
                <Icon className="w-6 h-6 text-primary dark:text-blue-400" />
            </div>
            <div>
                <p className="text-sm font-semibold text-text-secondary dark:text-dark-text-secondary">{title}</p>
                <div className="flex items-baseline space-x-2">
                    <p className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">{value}</p>
                    {growth && <p className="text-sm font-semibold text-status-success">{growth}</p>}
    </div>
  </div>
    </div>
  </div>
);

const ActionCenterWidget = ({ notifications, onViewInfo, onMint }: { notifications: Notification[], onViewInfo: (round: FundingRound) => void, onMint: (roundId: string) => void }) => {
    const { fundingRounds } = useAppContext();
    
    const actions = useMemo(() => {
        const actionableNotifications = notifications
            .filter(n => ['deadline', 'review_needed', 'system_nudge'].includes(n.type))
            .slice(0, 2)
            .map(n => ({ ...n, type: 'notification' as const }));

        const mintableRounds = fundingRounds
            .filter(r => r.status === 'Closed' && !r.impactAssetMinted)
            .slice(0, 2)
            .map(r => ({
                id: `mint-${r.id}`,
                relatedId: r.id,
                title: `${r.title} closed`,
                description: 'Mint your Impact Asset NFT to commemorate your contribution.',
                action: { text: 'Mint Impact Asset' },
                date: r.distributionDeadline,
                type: 'mint' as const
            }));
        
        return [...actionableNotifications, ...mintableRounds].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [notifications, fundingRounds]);

    const handleAction = (item: typeof actions[0]) => {
        if (item.type === 'notification') {
            const round = fundingRounds.find(r => r.id === item.relatedId);
            if (round) onViewInfo(round);
        } else if (item.type === 'mint') {
            onMint(item.relatedId);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark-light rounded-xl p-6 border border-border dark:border-border-dark shadow-sm h-full flex flex-col">
            <h3 className="font-semibold text-lg text-text-primary dark:text-dark-text-primary mb-4">Action Center</h3>
            {actions.length > 0 ? (
                <ul className="space-y-4">
                    {actions.map(item => {
                        const Icon = item.type === 'mint' ? SparklesIcon : InfoIcon;
                        return (
                        <li key={item.id} className="flex space-x-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/5">
                                <Icon className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-grow">
                                <p className="text-sm text-text-primary dark:text-dark-text-primary">
                                    <span className="font-semibold">{item.title}</span>: {item.description}
                                </p>
                                {item.action && (
                                    <button onClick={() => handleAction(item)} className="text-sm mt-1 font-semibold text-primary hover:underline">
                                        {item.action.text}
                                    </button>
                                )}
                            </div>
                        </li>
                    )})}
                </ul>
          ) : (
                <div className="text-center py-8 flex-grow flex flex-col justify-center items-center">
                    <p className="text-sm text-text-secondary dark:text-dark-text-secondary">No urgent actions required.</p>
                </div>
          )}
      </div>
    );
  };

const ImpactAtAGlanceWidget = ({ projects, fundingRounds }: { projects: Project[], fundingRounds: FundingRound[] }) => {
    const { fundedProjects, totalDownloads, totalCitations, verifiedProjectsCount } = useMemo(() => {
        const fundedProjectIds = new Set(
            fundingRounds.filter(r => r.status === 'Closed').flatMap(r => r.applicants?.map(a => a.projectId) || [])
        );

        const fundedProjects = projects.filter(p => fundedProjectIds.has(p.id));

        const totalDownloads = fundedProjects.reduce((sum, p) => sum + (p.adoptionMetrics?.huggingFaceDownloads?.value || 0), 0);
        const totalCitations = fundedProjects.reduce((sum, p) => sum + (p.scientificMetrics?.citations?.value || 0), 0);
        const verifiedProjectsCount = fundedProjects.filter(p => p.reproducibilities.some(r => r.status === PoRStatus.Success)).length;
        
        return { fundedProjects, totalDownloads, totalCitations, verifiedProjectsCount };
    }, [projects, fundingRounds]);

    const topProjects = [...fundedProjects].sort((a,b) => (b.adoptionMetrics?.huggingFaceDownloads?.value || 0) - (a.adoptionMetrics?.huggingFaceDownloads?.value || 0)).slice(0, 2);

                return (
        <div className="bg-background-light dark:bg-background-dark-light rounded-xl p-6 border border-border dark:border-border-dark shadow-sm h-full">
            <h3 className="font-semibold text-lg text-text-primary dark:text-dark-text-primary mb-4">Impact at a Glance</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                    <p className="text-2xl font-bold">{numberFormatter.format(totalDownloads)}</p>
                    <p className="text-xs text-text-secondary">Downloads</p>
                </div>
                 <div>
                    <p className="text-2xl font-bold">{numberFormatter.format(totalCitations)}</p>
                    <p className="text-xs text-text-secondary">Citations</p>
                </div>
                 <div>
                    <p className="text-2xl font-bold">{verifiedProjectsCount}</p>
                    <p className="text-xs text-text-secondary">Verified Projects</p>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border dark:border-border-dark">
                 <h4 className="font-semibold text-sm mb-2">Top Projects by Adoption</h4>
                 <div className="space-y-2">
                    {topProjects.map(p => (
                        <div key={p.id} className="text-sm p-2 rounded-md bg-hf-gray-100 dark:bg-hf-gray-800/50">
                            <p className="font-semibold truncate">{p.title}</p>
                            <p className="text-xs text-text-secondary">{numberFormatter.format(p.adoptionMetrics?.huggingFaceDownloads?.value || 0)} downloads</p>
                        </div>
                    ))}
                 </div>
      </div>
    </div>
  );
};


const DashboardView = ({ projects, onViewInfo }: { projects: Project[]; onViewInfo: (round: FundingRound) => void; }) => {
    const { fundingHistory, fundingRounds, notifications, handleMintImpactAsset } = useAppContext();
    
    const { totalDeployed, activeRounds, portfolioGrowth, aggregateImpactScore } = useMemo(() => {
        const deployed = fundingHistory.reduce((sum, e) => sum + e.amount, 0);
        const active = fundingRounds.filter(r => r.status !== 'Closed').length;
        const growth = "+12.5%"; // Mock data

        const fundedProjectIds = new Set(
            fundingRounds.filter(r => r.status === 'Closed').flatMap(r => r.applicants?.map(a => a.projectId) || [])
        );
        const fundedProjects = projects.filter(p => fundedProjectIds.has(p.id));
        const score = fundedProjects.reduce((sum, p) => sum + p.impactScore, 0);

        return { totalDeployed: deployed, activeRounds: active, portfolioGrowth: growth, aggregateImpactScore: score };
    }, [fundingHistory, fundingRounds, projects]);

    const relevantNotifications = useMemo(() => notifications.filter(n => ['deadline', 'review_needed', 'new_submission', 'system_nudge'].includes(n.type)), [notifications]);

    return (
        <div className="space-y-8">
            <PageHeader title="Funder Dashboard" subtitle="Track your portfolio, manage funding rounds, and view recent activity." />
            
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FunderKpiCard icon={ScaleIcon} title="Total Capital Deployed" value={`$${numberFormatter.format(totalDeployed)}`} />
                <FunderKpiCard icon={GavelIcon} title="Active Rounds" value={activeRounds} />
                <FunderKpiCard icon={TrendingUpIcon} title="Portfolio Growth (30d)" value={portfolioGrowth} />
                <FunderKpiCard icon={CheckBadgeIcon} title="Aggregate Impact Score" value={numberFormatter.format(aggregateImpactScore)} />
          </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    <ActionCenterWidget notifications={relevantNotifications} onViewInfo={onViewInfo} onMint={handleMintImpactAsset} />
                </div>
                <div className="lg:col-span-1 space-y-8">
                    <ImpactAtAGlanceWidget projects={projects} fundingRounds={fundingRounds} />
                </div>
            </div>
        </div>
    );
};

// --- Portfolio View Components ---

const PortfolioPerformanceWidget = ({ projects, fundingHistory }: { projects: Project[], fundingHistory: FundingEvent[] }) => {
    const { fundingByDomain, impactPerK } = useMemo(() => {
        const domainData: Record<string, number> = { Robotics: 0, Simulation: 0, Hardware: 0 };
        let totalImpactScore = 0;
        const totalDeployed = fundingHistory.reduce((sum, e) => sum + e.amount, 0);

        projects.forEach(p => { 
            if (p.domain in domainData) { domainData[p.domain] += p.fundingPool; }
            if (p.status === 'Funded' || p.status === 'Reproducible') {
                totalImpactScore += p.impactScore;
            }
        });
        
        const maxFunding = Math.max(...Object.values(domainData));
        const safeMaxFunding = maxFunding > 0 ? maxFunding : 1;
        const fbd = Object.entries(domainData).map(([domain, amount]) => ({ domain, amount, percentage: (amount / safeMaxFunding) * 100 }));
        
        const ipk = totalDeployed > 0 ? (totalImpactScore / (totalDeployed / 1000)) : 0;
        
        return { fundingByDomain: fbd, impactPerK: ipk };
    }, [projects, fundingHistory]);
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-background-light dark:bg-background-dark-light p-6 rounded-xl border border-border dark:border-border-dark">
                <h4 className="font-semibold text-text-primary dark:text-dark-text-primary mb-4">Funding by Domain</h4>
                <div className="space-y-4">
                    {fundingByDomain.map(item => (
                        <div key={item.domain}>
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="font-medium">{item.domain}</span>
                                <span className="font-semibold text-text-secondary dark:text-dark-text-secondary">${numberFormatter.format(item.amount)}</span>
                            </div>
                            <div className="w-full bg-hf-gray-200 dark:bg-hf-gray-700 rounded-full h-2.5"><div className="bg-primary h-2.5 rounded-full" style={{ width: `${item.percentage}%` }}></div></div>
                        </div>
                    ))}
                </div>
            </div>
            <FunderKpiCard icon={TrendingUpIcon} title="Impact Score per $1K" value={impactPerK.toFixed(1)} />
        </div>
    )
}

const RoundCard = ({ round, onMint }: { round: FundingRound, onMint: (roundId: string) => void }) => {
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
                     <button className="w-full flex items-center justify-center space-x-2 bg-hf-gray-200 dark:bg-hf-gray-700 font-semibold py-2 px-3 rounded-lg hover:bg-hf-gray-300 dark:hover:bg-hf-gray-600">
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
        <div className="bg-background-light dark:bg-background-dark-light rounded-2xl border-2 border-border dark:border-border-dark shadow-lg overflow-hidden flex flex-col">
            <div className="relative aspect-video">
                 <GenerativePlaceholder projectId={round.id} className="w-full h-full" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent p-4 flex flex-col justify-end">
                    <h3 className="text-white font-bold text-xl leading-tight">{round.title}</h3>
                 </div>
            </div>
            <div className="p-4 flex-grow">
                <div className="grid grid-cols-3 gap-2 text-center border-b border-border dark:border-border-dark pb-3">
                    <div><p className="font-bold">{verifiedCount}</p><p className="text-xs text-text-secondary">Verified Projects</p></div>
                    <div><p className="font-bold">{numberFormatter.format(totalCitations)}</p><p className="text-xs text-text-secondary">Citations</p></div>
                    <div><p className="font-bold">{numberFormatter.format(totalDownloads)}</p><p className="text-xs text-text-secondary">Downloads</p></div>
                </div>
                <div className="text-xs text-text-secondary dark:text-dark-text-secondary pt-3 space-y-1">
                    <p><strong>Pool Size:</strong> ${round.poolSize.toLocaleString()}</p>
                    <p><strong>Domains:</strong> {round.topics.join(', ')}</p>
                    <p><strong>Minted On:</strong> {new Date(round.distributionDeadline).toLocaleDateString()}</p>
                </div>
            </div>
            <div className="p-3 bg-hf-gray-50 dark:bg-hf-gray-900/50 border-t border-border dark:border-border-dark flex items-center justify-center space-x-2">
                <button className="flex-1 flex items-center justify-center space-x-2 bg-primary text-white font-semibold text-sm py-2 px-3 rounded-lg hover:bg-primary-hover transition-colors"><ShareIcon className="w-4 h-4" /><span>Share</span></button>
                <button className="flex-1 flex items-center justify-center space-x-2 bg-hf-gray-200 dark:bg-hf-gray-700 font-semibold text-sm py-2 px-3 rounded-lg hover:bg-hf-gray-300 dark:hover:bg-hf-gray-600 transition-colors"><DownloadIcon className="w-4 h-4" /><span>Download</span></button>
          </div>
        </div>
    );
}

const PortfolioView = ({ projects }: { projects: Project[] }) => {
    const { fundingHistory, fundingRounds, handleMintImpactAsset } = useAppContext();
    const [activeTab, setActiveTab] = useState<'Active' | 'Voting' | 'Closed'>('Active');
    
    const roundsByStatus = useMemo(() => ({
        Active: fundingRounds.filter(r => r.status === 'Open'),
        Voting: fundingRounds.filter(r => r.status === 'Voting'),
        Closed: fundingRounds.filter(r => r.status === 'Closed'),
    }), [fundingRounds]);

    const mintedAssets = fundingRounds.filter(r => r.impactAssetMinted);

    return (
        <div className="space-y-8">
            <PageHeader title="Portfolio" subtitle="Analyze performance, track round history, and manage your Impact Certificates." />
            <PortfolioPerformanceWidget projects={projects} fundingHistory={fundingHistory} />

            <div>
                <h3 className="text-2xl font-bold mb-4">Round History</h3>
                <div className="border-b border-border dark:border-border-dark mb-4">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        {(['Active', 'Voting', 'Closed'] as const).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-dark'} whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-sm`}>
                                {tab} <span className="bg-hf-gray-200 dark:bg-hf-gray-700 text-xs font-bold ml-2 px-2 py-0.5 rounded-full">{roundsByStatus[tab].length}</span>
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roundsByStatus[activeTab].map(round => <RoundCard key={round.id} round={round} onMint={handleMintImpactAsset} />)}
                </div>
                 {roundsByStatus[activeTab].length === 0 && <p className="text-center py-8 text-text-secondary">No rounds in this category.</p>}
            </div>

             <div>
                <h3 className="text-2xl font-bold mb-4">Impact Certificates</h3>
                 {mintedAssets.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {mintedAssets.map(round => <ImpactAssetCard key={round.id} round={round} />)}
                     </div>
                 ) : (
                     <div className="text-center py-12 border-2 border-dashed border-border dark:border-border-dark rounded-xl">
                        <SparklesIcon className="mx-auto h-12 w-12 text-text-secondary/50" />
                        <h4 className="mt-4 text-xl font-semibold">No Impact Assets Minted Yet</h4>
                        <p className="text-text-secondary dark:text-text-dark-secondary mt-2">When a round you participated in closes, you can mint an NFT here to certify your impact.</p>
                    </div>
                 )}
             </div>
        </div>
    );
};

export const FunderDashboard = ({ projects, activePage, onViewInfo }: { projects: Project[], onSelectProject: (p: Project) => void, activePage: string, onNavigate: (page: string) => void, onViewInfo: (round: FundingRound) => void }) => {
    let content;

    if (activePage === 'portfolio') {
        content = <PortfolioView projects={projects} />;
    } else { // 'dashboard' and default
        content = <DashboardView projects={projects} onViewInfo={onViewInfo} />;
    }

    return (
        <div className="animate-fade-in">
            {content}
        </div>
    );
};