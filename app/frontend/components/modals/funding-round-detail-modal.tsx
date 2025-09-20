

import React from 'react';
import { FundingRound, Project, RoundApplicant } from '../../lib/types';
import { Modal } from '../ui/modal';
import { ChartBarIcon, ClockIcon, EyeIcon, GavelIcon, InfoIcon, SpinnerIcon, CheckIcon, DownloadIcon, StarIcon, BookOpenIcon } from '../ui/icons';
import { useAppContext } from '../../context/app-provider';
import { Tooltip } from '../ui/tooltip';

const numberFormatter = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

const DistributionView = ({ round, onBack, onClose }: { round: FundingRound; onBack: () => void; onClose: () => void; }) => {
    const { handleDistributeRoundFunds } = useAppContext();
    const initialApplicants = React.useMemo(() => round.applicants || [], [round.applicants]);
    
    const [applicants, setApplicants] = React.useState<RoundApplicant[]>(initialApplicants);
    const [selectedApplicantIds, setSelectedApplicantIds] = React.useState<string[]>([]);
    const [distributionMode, setDistributionMode] = React.useState<'even' | 'score' | 'manual'>('even');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    React.useEffect(() => {
        const eligibleSelected = applicants.filter(a => selectedApplicantIds.includes(a.projectId) && a.verifiedPors > 0);
        if (eligibleSelected.length === 0) {
            setApplicants(apps => apps.map(a => ({ ...a, fundingAmount: 0, fundingPercentage: 0 })));
            return;
        }

        let updatedApplicants = [...applicants];

        if (distributionMode === 'even') {
            const amountPerApplicant = round.poolSize / eligibleSelected.length;
            updatedApplicants = applicants.map(app => 
                selectedApplicantIds.includes(app.projectId) && app.verifiedPors > 0
                    ? { ...app, fundingAmount: amountPerApplicant, fundingPercentage: (amountPerApplicant / round.poolSize) * 100 }
                    : { ...app, fundingAmount: 0, fundingPercentage: 0 }
            );
        } else if (distributionMode === 'score') {
            const totalScore = eligibleSelected.reduce((sum, app) => sum + app.communityScore, 0);
            if (totalScore > 0) {
                updatedApplicants = applicants.map(app => {
                    if (selectedApplicantIds.includes(app.projectId) && app.verifiedPors > 0) {
                        const amount = (app.communityScore / totalScore) * round.poolSize;
                        return { ...app, fundingAmount: amount, fundingPercentage: (amount / round.poolSize) * 100 };
                    }
                    return { ...app, fundingAmount: 0, fundingPercentage: 0 };
                });
            }
        } else { // Manual - don't auto-calculate, just ensure non-selected are zero
            updatedApplicants = applicants.map(app => 
                (!selectedApplicantIds.includes(app.projectId) || app.verifiedPors === 0) ? { ...app, fundingAmount: 0, fundingPercentage: 0 } : app
            );
        }
        
        setApplicants(updatedApplicants);

    }, [selectedApplicantIds, distributionMode, round.poolSize]);

    const handlePercentageChange = (projectId: string, percentage: number) => {
        const newPercentage = Math.max(0, Math.min(100, percentage));
        setApplicants(apps => apps.map(app => 
            app.projectId === projectId
                ? { ...app, fundingPercentage: newPercentage, fundingAmount: (newPercentage / 100) * round.poolSize }
                : app
        ));
    };

    const handleSelectApplicant = (projectId: string) => {
        const applicant = applicants.find(a => a.projectId === projectId);
        if (applicant && applicant.verifiedPors > 0) { // Check for eligibility
            setSelectedApplicantIds(prev =>
                prev.includes(projectId)
                    ? prev.filter(id => id !== projectId)
                    : [...prev, projectId]
            );
        }
    };

    const totalAllocated = applicants.reduce((sum, app) => sum + (app.fundingAmount || 0), 0);
    const totalPercentage = applicants.reduce((sum, app) => sum + (app.fundingPercentage || 0), 0);
    const isOverBudget = totalAllocated > round.poolSize + 0.01; // a small tolerance for float precision
    
    const handleSubmit = async () => {
        if (isOverBudget) return;
        setIsSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        handleDistributeRoundFunds(round.id, applicants.filter(a => selectedApplicantIds.includes(a.projectId) && a.verifiedPors > 0));
        setIsSubmitting(false);
        onClose();
    };

    const modalFooter = (
        <div className="flex justify-between items-center">
            <button onClick={onBack} className="font-semibold py-2.5 px-6 rounded-lg hover:bg-cairn-gray-100 dark:hover:bg-cairn-gray-800 transition-colors">Back</button>
            <button onClick={handleSubmit} disabled={isSubmitting || isOverBudget || selectedApplicantIds.length === 0} className="bg-primary text-primary-text font-semibold py-2.5 px-6 rounded-lg hover:bg-primary-hover transition-colors disabled:bg-cairn-gray-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[200px]">
                {isSubmitting ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : `Confirm Distribution`}
            </button>
        </div>
    );

    return (
        <Modal onClose={onClose} title={`Distribute Funds: ${round.title}`} footer={modalFooter}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {/* Left: Controls */}
                <div className="md:col-span-1 space-y-6">
                    <div>
                        <h4 className="font-semibold text-text dark:text-text-dark mb-2">Distribution Method</h4>
                        <div className="space-y-2">
                            {(['even', 'score', 'manual'] as const).map(mode => (
                                <label key={mode} className="flex items-center p-3 rounded-lg bg-cairn-gray-100 dark:bg-cairn-gray-800 cursor-pointer">
                                    <input type="radio" name="distribution-mode" value={mode} checked={distributionMode === mode} onChange={() => setDistributionMode(mode)} className="h-4 w-4 text-primary focus:ring-primary border-cairn-gray-400" />
                                    <span className="ml-3 text-sm font-medium text-text dark:text-text-dark capitalize">{mode === 'score' ? 'By Community Score' : mode}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="p-4 bg-primary-light dark:bg-primary/10 rounded-lg border border-primary/20">
                        <p className="text-sm font-semibold text-primary dark:text-primary-light">Summary</p>
                        <div className="mt-2 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-text-secondary dark:text-text-dark-secondary">Total Pool:</span>
                                <span className="font-semibold text-text dark:text-text-dark">${round.poolSize.toLocaleString()}</span>
                            </div>
                            <div className={`flex justify-between ${isOverBudget ? 'text-status-danger' : ''}`}>
                                <span className="text-text-secondary dark:text-text-dark-secondary">Allocated:</span>
                                <span className="font-semibold">${totalAllocated.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="h-2 w-full bg-cairn-gray-200 dark:bg-cairn-gray-700 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${isOverBudget ? 'bg-status-danger' : 'bg-primary'}`} style={{ width: `${Math.min(100, (totalAllocated / round.poolSize) * 100)}%` }}></div>
                            </div>
                             {isOverBudget && <p className="text-xs font-semibold text-status-danger text-right">Allocation exceeds pool size!</p>}
                             {distributionMode === 'manual' && Math.abs(totalPercentage - 100) > 0.01 && <p className="text-xs text-text-secondary dark:text-text-dark-secondary text-right">Total Percentage: {totalPercentage.toFixed(1)}%</p>}
                        </div>
                    </div>
                </div>

                {/* Right: Table */}
                <div className="md:col-span-2 overflow-x-auto border border-border dark:border-border-dark rounded-lg">
                     <table className="w-full text-sm">
                        <thead className="bg-cairn-gray-50 dark:bg-cairn-gray-800/50 text-left text-xs text-text-secondary dark:text-text-dark-secondary uppercase">
                            <tr>
                                <th className="p-3 w-10"></th>
                                <th className="p-3 font-semibold tracking-wider">Applicant</th>
                                <th className="p-3 font-semibold tracking-wider text-right">{distributionMode === 'manual' ? 'Percentage' : 'Amount'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border dark:divide-border-dark">
                            {applicants.map(applicant => {
                                const isEligible = applicant.verifiedPors > 0;
                                return (
                                    <tr key={applicant.projectId} className={`${!isEligible ? "opacity-50" : ""} ${selectedApplicantIds.includes(applicant.projectId) ? "bg-primary-light/50 dark:bg-primary/10" : "hover:bg-cairn-gray-50 dark:hover:bg-cairn-gray-800/20"}`}>
                                        <td className="p-3">
                                            <Tooltip text={!isEligible ? "Ineligible: Project has no verified PoRs" : "Select to fund"}>
                                                <input type="checkbox" checked={selectedApplicantIds.includes(applicant.projectId)} onChange={() => handleSelectApplicant(applicant.projectId)} disabled={!isEligible} className="h-4 w-4 rounded disabled:cursor-not-allowed border-cairn-gray-400 text-primary focus:ring-primary"/>
                                            </Tooltip>
                                        </td>
                                        <td className="p-3 font-semibold text-text dark:text-text-dark">{applicant.projectTitle}</td>
                                        <td className="p-3 text-right">
                                            {distributionMode === 'manual' ? (
                                                <div className="relative w-24 ml-auto">
                                                    <input 
                                                        type="number" 
                                                        value={applicant.fundingPercentage?.toFixed(1) || '0.0'}
                                                        onChange={e => handlePercentageChange(applicant.projectId, parseFloat(e.target.value))}
                                                        disabled={!selectedApplicantIds.includes(applicant.projectId)}
                                                        className="w-full p-1 border border-border dark:border-border-dark rounded bg-transparent text-right pr-6 disabled:bg-cairn-gray-200 dark:disabled:bg-cairn-gray-700"
                                                    />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary">%</span>
                                                </div>
                                            ) : (
                                                <span className="font-mono">${(applicant.fundingAmount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </Modal>
    );
};


export const FundingRoundDetailModal = ({ round, onClose, onSelectProject }: { round: FundingRound; onClose: () => void; onSelectProject: (project: Project) => void; }) => {
    const { projects } = useAppContext();
    const [viewMode, setViewMode] = React.useState<'info' | 'distribute'>('info');

    const Stat = ({ label, value, icon: Icon }: { label: string; value: string | number; icon?: React.FC<any> }) => (
        <div>
            <p className="text-xs font-semibold text-text-secondary dark:text-text-dark-secondary uppercase tracking-wider">{label}</p>
            <div className="flex items-center space-x-2 mt-1">
                {Icon && <Icon className="w-6 h-6 text-primary" />}
                <p className="text-2xl font-bold text-text dark:text-text-dark">{value}</p>
            </div>
        </div>
    );
    
    if (viewMode === 'distribute' && round.status === 'Voting') {
        return <DistributionView round={round} onBack={() => setViewMode('info')} onClose={onClose} />;
    }
    
    return (
        <Modal onClose={onClose} title={round.title}>
            <div className="space-y-6">
                <div>
                    <p className="text-text-secondary dark:text-text-dark-secondary">{round.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {round.topics.map(topic => (
                             <span key={topic} className="bg-primary-light text-primary text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-primary/20 dark:text-primary-light">{topic}</span>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 p-4 bg-cairn-gray-50 dark:bg-cairn-gray-800/50 rounded-lg border border-border dark:border-border-dark">
                    <Stat label="Funding Pool" value={`$${round.poolSize.toLocaleString()}`} icon={ChartBarIcon} />
                    <Stat label="Application Deadline" value={new Date(round.applicationDeadline).toLocaleDateString()} icon={ClockIcon} />
                    <Stat label="Applicants" value={round.applicationCount} />
                </div>
                
                 {round.status === 'Voting' && (
                    <div className="p-4 bg-blue-100/60 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-start space-x-3">
                             <InfoIcon className="w-6 h-6 text-primary flex-shrink-0 mt-0.5"/>
                             <div>
                                <h4 className="font-semibold text-text dark:text-text-dark">Ready for Distribution</h4>
                                <p className="text-sm text-text-secondary dark:text-text-dark-secondary">The application deadline has passed. You can now select projects and distribute the funding pool.</p>
                             </div>
                        </div>
                        <button onClick={() => setViewMode('distribute')} className="bg-primary text-primary-text font-semibold py-2 px-5 rounded-lg hover:bg-primary-hover transition-colors flex items-center space-x-2 w-full sm:w-auto flex-shrink-0">
                            <GavelIcon className="w-5 h-5"/>
                            <span>Distribute Funds</span>
                        </button>
                    </div>
                )}

                <div>
                    <h3 className="text-lg font-semibold text-text dark:text-text-dark mb-3">Applicants</h3>
                    <div className="overflow-x-auto border border-border dark:border-border-dark rounded-lg">
                        <table className="w-full text-sm">
                            <thead className="bg-cairn-gray-50 dark:bg-cairn-gray-800/50 text-left text-xs text-text-secondary dark:text-text-dark-secondary uppercase">
                                <tr>
                                    <th className="p-3 font-semibold tracking-wider">Research Title</th>
                                    <th className="p-3 font-semibold tracking-wider text-center">Verified PoRs</th>
                                    <th className="p-3 font-semibold tracking-wider">Output Downloads</th>
                                    <th className="p-3 font-semibold tracking-wider">HF Upvotes</th>
                                    <th className="p-3 font-semibold tracking-wider">Paper Citations</th>
                                    <th className="p-3 font-semibold tracking-wider text-right">View</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border dark:divide-border-dark">
                                {round.applicants && round.applicants.map(applicant => {
                                    const project = projects.find(p => p.id === applicant.projectId);
                                    return (
                                        <tr key={applicant.projectId} className="hover:bg-cairn-gray-50 dark:hover:bg-cairn-gray-800/20 transition-colors">
                                            <td className="p-3 font-semibold text-text dark:text-text-dark">{applicant.projectTitle}</td>
                                            <td className="p-3 text-center">
                                                {applicant.verifiedPors > 0 ? (
                                                    <CheckIcon className="w-5 h-5 text-status-success inline-block" />
                                                ) : (
                                                    <span className="text-text-secondary dark:text-text-dark-secondary">—</span>
                                                )}
                                            </td>
                                            <td className="p-3 font-mono">{project?.adoptionMetrics?.huggingFaceDownloads.value ? numberFormatter.format(project.adoptionMetrics.huggingFaceDownloads.value) : 'N/A'}</td>
                                            <td className="p-3 font-mono">{applicant.hfUpvotes.toLocaleString()}</td>
                                            <td className="p-3 font-mono">{project?.scientificMetrics?.citations.value ? numberFormatter.format(project.scientificMetrics.citations.value) : 'N/A'}</td>
                                            <td className="p-3 text-right">
                                                {project && (
                                                    <button 
                                                        onClick={() => onSelectProject(project)}
                                                        className="p-1.5 rounded-full text-text-secondary hover:bg-cairn-gray-200 dark:hover:bg-cairn-gray-700 transition-colors" title="View Project Details"
                                                    >
                                                        <EyeIcon className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                                {(!round.applicants || round.applicants.length === 0) && (
                                     <tr><td colSpan={6} className="text-center p-6 text-text-secondary dark:text-text-dark-secondary">No applicants for this round yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
