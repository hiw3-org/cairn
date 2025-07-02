

"use client";

import React, { useState, useMemo } from 'react';
import { Project, ProjectStatus, FundingEvent } from '../../lib/types';
import { CheckIcon, ScaleIcon, UsersGroupIcon, GavelIcon, BeakerIcon } from '../ui/icons';
import { GenerativePlaceholder } from '../ui/generative-placeholder';
import { useAppContext } from '../../context/app-provider';

const StatCard = ({ icon: Icon, title, value }: { icon: React.FC<any>, title: string, value: string | number}) => (
    <div className="bg-white dark:bg-cairn-gray-900/50 p-5 rounded-xl shadow-sm flex items-start space-x-4 border border-cairn-gray-200 dark:border-cairn-gray-800/60 h-full">
        <div className="bg-cairn-blue-100 dark:bg-cairn-blue-900/50 p-3 rounded-lg flex items-center justify-center">
            <Icon className="w-6 h-6 text-cairn-blue-600 dark:text-cairn-blue-400" />
        </div>
        <div>
            <p className="text-sm font-medium text-cairn-gray-500 dark:text-cairn-gray-400">{title}</p>
            <p className="text-3xl font-bold text-cairn-gray-900 dark:text-white">{value}</p>
        </div>
    </div>
);

const FundingHistoryWidget = ({ history }: { history: FundingEvent[] }) => (
    <div className="bg-white dark:bg-cairn-gray-900/50 rounded-xl p-5 border border-cairn-gray-200 dark:border-cairn-gray-800/60 shadow-sm h-full">
        <h4 className="font-semibold mb-4 text-cairn-gray-800 dark:text-cairn-gray-100">Funding History</h4>
        <ul className="space-y-3 max-h-48 overflow-y-auto pr-2">
            {history.map(event => (
                <li key={event.id} className="flex justify-between items-center text-sm">
                    <div>
                        <p className="font-semibold text-cairn-gray-900 dark:text-cairn-gray-200 truncate pr-2">{event.projectTitle}</p>
                        <p className="text-xs text-cairn-gray-500">{new Date(event.timestamp).toLocaleDateString()}</p>
                    </div>
                    <span className="font-semibold text-green-600 dark:text-green-400">${event.amount.toLocaleString()}</span>
                </li>
            ))}
             {history.length === 0 && (
                <p className="text-sm text-cairn-gray-500 text-center py-4">No funding contributions yet.</p>
            )}
        </ul>
    </div>
);


const FunderProjectCard = ({ project }: { project: Project }) => {
    const { handleInstantFund } = useAppContext();
    const [fundAmount, setFundAmount] = useState('');
    
    const onFund = () => {
        const amount = parseInt(fundAmount, 10);
        if(!isNaN(amount) && amount > 0) {
            handleInstantFund(project.id, amount);
            setFundAmount('');
        }
    };

     return (
        <div className="bg-white dark:bg-cairn-gray-900/50 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-cairn-gray-200 dark:border-cairn-gray-800 hover:border-cairn-blue-500 dark:hover:border-cairn-blue-400 overflow-hidden flex flex-col group">
            <GenerativePlaceholder projectId={project.id} className="w-full h-40" />
            <div className="p-5 flex-grow">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-cairn-gray-900 dark:text-white pr-4 group-hover:text-cairn-blue-600 dark:group-hover:text-cairn-blue-400 transition-colors">{project.title}</h3>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-cairn-gray-600 dark:text-cairn-gray-300">Impact</span>
                        <span className="text-lg font-bold text-cairn-blue-600 dark:text-cairn-blue-400">{project.impactScore}</span>
                    </div>
                </div>
                <p className="text-sm text-cairn-gray-500 dark:text-cairn-gray-400 mt-1">{project.domain}</p>
                 <p className="text-sm text-cairn-gray-600 dark:text-cairn-gray-300 mt-2 line-clamp-2">{project.description}</p>
            </div>
            <div className="px-5 py-4 bg-cairn-gray-50 dark:bg-cairn-gray-800/50 border-t border-cairn-gray-200 dark:border-cairn-gray-700 grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                    <div className="text-xs text-cairn-gray-500 dark:text-cairn-gray-400">Funding Pool</div>
                    <div className="text-lg font-semibold text-cairn-gray-800 dark:text-cairn-gray-100">${project.fundingPool.toLocaleString()}</div>
                </div>
                 <div className="space-y-1">
                    <div className="text-xs text-cairn-gray-500 dark:text-cairn-gray-400">Reproducibilities</div>
                    <div className="text-lg font-semibold text-cairn-gray-800 dark:text-cairn-gray-100 flex items-center">
                        <CheckIcon className="w-5 h-5 text-green-500 mr-1.5" /> {project.reproducibilities.length}
                    </div>
                </div>
            </div>
             <div className="p-4 bg-cairn-gray-100 dark:bg-cairn-gray-900/70 border-t border-cairn-gray-200 dark:border-cairn-gray-700 space-y-2">
                 <label className="text-xs font-semibold text-cairn-gray-500 dark:text-cairn-gray-400">Amount (USD)</label>
                 <div className="flex space-x-2">
                    <input 
                        type="number"
                        value={fundAmount}
                        onChange={(e) => setFundAmount(e.target.value)}
                        placeholder="e.g., 500"
                        className="flex-grow w-full p-2 border border-cairn-gray-300 dark:border-cairn-gray-600 rounded-md bg-cairn-gray-50 dark:bg-cairn-gray-800 font-mono text-sm focus:ring-cairn-blue-500 focus:border-cairn-blue-500"
                    />
                    <button
                        onClick={onFund}
                        disabled={!fundAmount || parseInt(fundAmount, 10) <= 0 || project.status === ProjectStatus.Archived}
                        className="bg-cairn-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-cairn-blue-700 transition-colors disabled:bg-cairn-gray-400 dark:disabled:bg-cairn-gray-600 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                    >
                        Fund
                    </button>
                 </div>
            </div>
        </div>
    );
};

export const FunderDashboard = ({ projects }: { projects: Project[] }) => {
    const [activeFundMode, setActiveFundMode] = useState<'instant' | 'dao'>('instant');
    const { fundingHistory } = useAppContext();

    const totalFundingDeployed = useMemo(() => projects.reduce((sum, p) => sum + p.fundingPool, 0), [projects]);
    const totalProjectsFunded = useMemo(() => projects.filter(p => p.status === ProjectStatus.Funded).length, [projects]);
    const totalReproducibilities = useMemo(() => projects.reduce((sum, p) => sum + p.reproducibilities.length, 0), [projects]);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="space-y-8">
                <div className="bg-white/50 dark:bg-cairn-gray-900/50 p-6 rounded-2xl border border-cairn-gray-200/80 dark:border-cairn-gray-800/80">
                    <h2 className="text-2xl font-semibold mb-6">Funder Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-1"><StatCard icon={ScaleIcon} title="Total Funding Deployed" value={`$${totalFundingDeployed.toLocaleString()}`} /></div>
                        <div className="lg:col-span-1"><StatCard icon={UsersGroupIcon} title="Total Projects Funded" value={totalProjectsFunded} /></div>
                        <div className="lg:col-span-1"><StatCard icon={BeakerIcon} title="Ecosystem Reproducibility" value={totalReproducibilities} /></div>
                        <div className="lg:col-span-1"><FundingHistoryWidget history={fundingHistory} /></div>
                    </div>
                </div>

                <div>
                    <div className="border-b border-cairn-gray-200 dark:border-cairn-gray-800 mb-6">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                             <button
                                onClick={() => setActiveFundMode('instant')}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${activeFundMode === 'instant' ? 'border-cairn-blue-500 text-cairn-blue-600 dark:text-cairn-blue-400' : 'border-transparent text-cairn-gray-500 hover:text-cairn-gray-700 hover:border-cairn-gray-300 dark:hover:text-cairn-gray-200 dark:hover:border-cairn-gray-600'}`}
                            >
                                Instant Retro Funding
                            </button>
                            <div className="relative group">
                                <button
                                    onClick={() => setActiveFundMode('dao')}
                                    disabled
                                    className="whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm border-transparent text-cairn-gray-400 dark:text-cairn-gray-600 cursor-not-allowed"
                                >
                                    DAO Voted Funding
                                </button>
                                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-cairn-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    Coming Soon
                                </div>
                            </div>
                        </nav>
                    </div>

                    {activeFundMode === 'instant' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {projects.filter(p => p.status === ProjectStatus.Active || p.status === ProjectStatus.Funded).map(p => <FunderProjectCard key={p.id} project={p} />)}
                        </div>
                    )}
                     {activeFundMode === 'dao' && (
                        <div className="text-center py-16 px-6 border-2 border-dashed border-cairn-gray-300 dark:border-cairn-gray-700 rounded-xl bg-cairn-gray-100 dark:bg-cairn-gray-800/50">
                            <GavelIcon className="mx-auto h-12 w-12 text-cairn-gray-400" />
                            <h3 className="mt-4 text-xl font-semibold text-cairn-gray-900 dark:text-white">DAO Voting is Coming Soon</h3>
                            <p className="mt-2 text-md text-cairn-gray-500 dark:text-cairn-gray-400">
                                This feature will allow CAIRN token holders to collectively decide on funding allocations.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};