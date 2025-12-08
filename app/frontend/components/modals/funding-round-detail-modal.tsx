

import React from 'react';
import { FundingRound, Project, RoundApplicant, UserRole } from '../../lib/types';
import { ChevronLeftIcon, UsersIcon, PlusIcon } from '../ui/icons';
import { useAppContext } from '../../context/app-provider';
import { ImpactLevelBadge } from '../ui/impact-level-badge';

const numberFormatter = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });


const TimelineBar = ({ round }: { round: FundingRound }) => {
    const steps = React.useMemo(() => [
        { name: 'Application', date: round.applicationDeadline },
        { name: 'Voting', date: round.evaluationDeadline },
        { name: 'Distribution', date: round.distributionDeadline },
    ].filter(step => step.date), [round]);

    const now = new Date();
    let activeStepIndex = steps.length - 1;
    for (let i = 0; i < steps.length; i++) {
        if (now < new Date(steps[i].date!)) {
            activeStepIndex = i - 1;
            break;
        }
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'TBD';
        // Use a more compact date format
        const date = new Date(dateString);
        return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    };

    return (
        <div className="mt-8 pt-6 px-6 pb-8 bg-yellow-50 dark:bg-yellow-500/10 rounded-xl border border-yellow-200 dark:border-yellow-500/20">
            <div className="flex justify-between items-start">
                {steps.map((step, index) => {
                    const isCurrent = index === activeStepIndex;
                    
                    return (
                        <React.Fragment key={step.name}>
                            <div className={`text-center relative flex-1 transition-all duration-300 ${isCurrent ? 'text-text-primary dark:text-dark-text-primary' : 'text-text-secondary dark:text-dark-text-secondary opacity-60'}`}>
                                <p className={`text-sm ${isCurrent ? 'font-bold' : 'font-semibold'}`}>{step.name}</p>
                                <p className="text-xs mt-1">{formatDate(step.date)}</p>
                                {isCurrent && (
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-2 h-2 bg-yellow-500 rounded-full ring-4 ring-yellow-100 dark:ring-yellow-500/20 animate-pulse"></div>
                                )}
                            </div>
                            {index < steps.length - 1 && (
                                <div className="flex-shrink-0 h-12 border-l border-yellow-300 dark:border-yellow-500/30 mx-2 sm:mx-4 md:mx-6" />
                            )}
                        </React.Fragment>
                    )
                })}
            </div>
        </div>
    );
};

const ApplicantTable = ({ applicants, onSelectProject }: { applicants: RoundApplicant[], onSelectProject: (project: Project) => void }) => {
    const { projects } = useAppContext();
    return (
        <div className="bg-background-light dark:bg-background-dark-light rounded-xl border border-border dark:border-border-dark overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-hf-gray-50 dark:bg-hf-gray-800/50 text-left text-xs text-text-secondary dark:text-dark-text-secondary uppercase">
                        <tr>
                            <th className="p-4 font-semibold tracking-wider">Project</th>
                            <th className="p-4 font-semibold tracking-wider text-center">Verified PoRs</th>
                            <th className="p-4 font-semibold tracking-wider text-center">Impact Level</th>
                            <th className="p-4 font-semibold tracking-wider text-center">HF Upvotes</th>
                            <th className="p-4 font-semibold tracking-wider text-center">Community Score</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border dark:divide-border-dark">
                        {applicants.map(applicant => (
                            <tr
                                key={applicant.projectId}
                                onClick={() => {
                                    const project = projects.find(p => p.id === applicant.projectId);
                                    if (project) onSelectProject(project);
                                }}
                                className="hover:bg-hf-gray-50 dark:hover:bg-hf-gray-800/20 cursor-pointer transition-colors"
                            >
                                <td className="p-4">
                                    <p className="font-semibold text-text-primary dark:text-dark-text-primary">{applicant.projectTitle}</p>
                                </td>
                                <td className="p-4 text-center font-mono">{applicant.verifiedPors}</td>
                                <td className="p-4 text-center"><ImpactLevelBadge level={applicant.impactLevel} /></td>
                                <td className="p-4 text-center font-mono">{numberFormatter.format(applicant.hfUpvotes)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// --- MAIN VIEW ---

export const FundingRoundDetailView = ({ round, onBack, onSelectProject }: { round: FundingRound; onBack: () => void; onSelectProject: (project: Project) => void; }) => {
    const { userRole, projects } = useAppContext();

    // NOTE: DistributionView logic is preserved for future use but not currently active.
    // The main view is now the informational page as per user request.

    return (
        <div className="animate-fade-in max-w-5xl mx-auto">
            <button onClick={onBack} className="flex items-center space-x-2 text-sm text-primary font-semibold mb-6 hover:underline">
                <ChevronLeftIcon className="w-5 h-5" />
                <span>Back to Dashboard</span>
            </button>
            
            <div className="mt-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <h1 className="text-4xl font-bold text-text-primary dark:text-dark-text-primary">{round.title}</h1>
                    {userRole === UserRole.Researcher && (
                        <button className="bg-hf-gray-100 dark:bg-hf-gray-800 text-text-primary dark:text-dark-text-primary font-semibold text-sm py-2 px-4 rounded-lg hover:bg-hf-gray-200 dark:hover:bg-hf-gray-700 transition-colors flex items-center space-x-2">
                            <PlusIcon className="w-4 h-4" />
                            <span>Apply with your project</span>
                        </button>
                    )}
                </div>

                {/* Sub-header stats */}
                <div className="flex items-center space-x-8 mt-4 text-sm">
                    <div>
                        <p className="text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider text-xs font-bold">Token</p>
                        <p className="font-semibold mt-0.5">USDFC</p>
                    </div>
                     <div>
                        <p className="text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider text-xs font-bold">Calculation</p>
                        <p className="font-semibold mt-0.5">{round.distributionMethod}</p>
                    </div>
                </div>

                {/* Cover Image */}
                <div className="mt-6 w-full aspect-[16/7] bg-hf-gray-200 dark:bg-hf-gray-800 rounded-2xl overflow-hidden shadow-lg">
                    <img src={round.coverImageUrl || 'https://placehold.co/1200x525/E5E7EB/6B7280?text=Funding+Round'} alt={round.title} className="w-full h-full object-cover" />
                </div>
                
                {/* Timeline */}
                <TimelineBar round={round} />

                {/* Content Sections */}
                <div className="mt-12 space-y-10 prose prose-lg dark:prose-invert max-w-none prose-h2:font-bold prose-h2:text-2xl prose-h2:mb-3 prose-p:text-base prose-p:leading-relaxed prose-ul:text-base prose-ul:leading-relaxed prose-li:my-1">
                    <section>
                        <h2>Overview</h2>
                        <p className="text-text-secondary dark:text-dark-text-secondary">{round.description}</p>
                    </section>

                    {/* {round.eligibilityCriteria && <section>
                        <h2>Eligibility Criteria</h2>
                        <div className="text-text-secondary dark:text-dark-text-secondary" dangerouslySetInnerHTML={{ __html: round.eligibilityCriteria }} />
                    </section>}
                    
                     {round.evaluationCriteria && <section>
                        <h2>Evaluation Criteria</h2>
                        <div className="text-text-secondary dark:text-dark-text-secondary" dangerouslySetInnerHTML={{ __html: round.evaluationCriteria }} />
                    </section>} */}
                    
                </div>
                
                {/* Applicants Section */}
                <section className="mt-16">
                    <div className="flex items-center space-x-3 mb-6">
                         <UsersIcon className="w-8 h-8 text-text-secondary" />
                         <h2 className="text-3xl font-bold">Applicants ({round.applicants?.length || 0})</h2>
                    </div>
                    {(round.applicants && round.applicants.length > 0) ? (
                        <ApplicantTable applicants={round.applicants} onSelectProject={onSelectProject} />
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed border-border dark:border-border-dark rounded-xl">
                            <p className="text-text-secondary dark:text-text-dark-secondary">No projects have applied to this round yet.</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};