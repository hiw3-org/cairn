
import React from 'react';
import { Project } from '../../lib/types';
import { ChartBarIcon } from '../ui/icons';
import { useAppContext } from '../../context/app-provider';

export const FundingDetailsWidget = ({ project }: { project: Project }) => {
    const { fundingHistory } = useAppContext();
    const numberFormatter = new Intl.NumberFormat('de-DE');

    const firstFundedDate = React.useMemo(() => {
        const projectFundingEvents = fundingHistory.filter(f => f.projectId === project.id);
        if (projectFundingEvents.length === 0) return 'N/A';
        const firstEvent = projectFundingEvents.reduce((oldest, current) => new Date(current.timestamp) < new Date(oldest.timestamp) ? current : oldest);
        // Format date as DD. M. YYYY
        const d = new Date(firstEvent.timestamp);
        return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;
    }, [fundingHistory, project.id]);
    
    return (
        <div className="bg-background-light dark:bg-background-dark-light rounded-xl shadow-lg p-6 border border-border dark:border-border-dark">
            <div className="flex items-center mb-4">
                <ChartBarIcon className="w-6 h-6 mr-3 text-primary"/>
                <h3 className="text-xl font-semibold text-text dark:text-text-dark">Funding Details</h3>
            </div>
            <div className="space-y-5">
                <div>
                    <p className="text-sm font-semibold text-text-secondary dark:text-text-dark-secondary">Total Raised</p>
                    <p className="text-4xl font-bold text-status-success mt-1">${numberFormatter.format(project.fundingPool)}</p>
                </div>
                <div>
                    <p className="text-sm font-semibold text-text-secondary dark:text-text-dark-secondary">First Funded</p>
                    <p className="text-lg font-mono text-text dark:text-text-dark mt-1">{firstFundedDate}</p>
                </div>
            </div>
        </div>
    );
};
