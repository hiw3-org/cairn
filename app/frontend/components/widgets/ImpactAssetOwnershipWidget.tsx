
import React from 'react';
import { Project } from '../../lib/types';
import { UsersGroupIcon, CopyIcon, CheckIcon } from '../ui/icons';
import { ImpactLevelBadge } from '../ui/impact-level-badge';
import { useClipboard } from '../../hooks/use-clipboard';

const getImpactLevel = (fraction: number): 'High' | 'Medium' | 'Low' => {
    if (fraction >= 0.75) return 'High';
    if (fraction >= 0.3) return 'Medium';
    return 'Low';
};

const AddressWithCopy = ({ address }: { address: string }) => {
    const { copy, copied } = useClipboard();
    const formatAddress = (addr: string) => {
        if (!addr || addr.length < 10) return addr;
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    };

    return (
        <div className="flex items-center space-x-2 group">
            <span className="font-mono text-sm text-text-secondary dark:text-text-dark-secondary">{formatAddress(address)}</span>
            <button onClick={(e) => { e.stopPropagation(); copy(address); }} className="p-1 rounded-full text-text-secondary hover:bg-cairn-gray-200 dark:hover:bg-cairn-gray-700 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Copy address">
                {copied ? <CheckIcon className="h-4 w-4 text-status-success" /> : <CopyIcon className="h-4 w-4" />}
            </button>
        </div>
    );
};

export const ImpactAssetOwnershipWidget = ({ project }: { project: Project }) => {
    const impactLevel = getImpactLevel(project.hypercertFraction);

    return (
        <div className="bg-background-light dark:bg-background-dark-light rounded-xl shadow-lg p-6 border border-border dark:border-border-dark">
            <div className="flex items-center mb-4">
                <UsersGroupIcon className="w-6 h-6 mr-3 text-primary"/>
                <h3 className="text-xl font-semibold text-text dark:text-text-dark">Impact Asset Ownership</h3>
            </div>
            <div className="mb-4">
                <ImpactLevelBadge level={impactLevel} />
            </div>
            <ul className="divide-y divide-border dark:divide-border-dark">
                {project.impactAssetOwners.map((owner, index) => (
                    <li key={index} className="py-4 flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-text dark:text-text-dark">{owner.contribution}</p>
                            <AddressWithCopy address={owner.walletAddress} />
                        </div>
                        <span className="text-lg font-bold text-primary dark:text-primary-light flex-shrink-0 ml-4">{owner.ownershipPercentage.toFixed(1)}%</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};
