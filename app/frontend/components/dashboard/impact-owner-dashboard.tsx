
"use client";

import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/app-provider';
import { Project, ImpactAssetOwner } from '../../lib/types';
import { SpinnerIcon, CheckCircleIcon, LightbulbIcon } from '../ui/icons';

const ClaimRegistrationForm = () => {
    const { handleRegisterClaim, addToast } = useAppContext();
    const [projectUid, setProjectUid] = useState('');
    const [ownerWallet, setOwnerWallet] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!projectUid && !ownerWallet) {
            addToast("Please provide a Project UID or an Owner Wallet Address.", "error");
            return;
        }
        setIsSubmitting(true);
        // Simulate async call for demonstration
        await new Promise(resolve => setTimeout(resolve, 1500));
        const success = await handleRegisterClaim(projectUid, ownerWallet);
        setIsSubmitting(false);
        if (success) {
            setProjectUid('');
            setOwnerWallet('');
        }
    };
    
    return (
        <div className="bg-background-light dark:bg-background-dark-light rounded-xl shadow-lg border border-border dark:border-border-dark p-6">
            <h2 className="text-xl font-semibold text-text dark:text-text-dark mb-1">Register an Ownership Claim</h2>
            <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-4">If you've been granted an ownership stake, register it here using the project's unique ID and the original owner's wallet address.</p>
            <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="project-uid" className="block text-sm font-medium text-text-secondary dark:text-text-dark-secondary mb-1">Project UID (CID)</label>
                        <input id="project-uid" type="text" value={projectUid} onChange={e => setProjectUid(e.target.value)} placeholder="e.g., QmWarehouseAI...10" className="w-full p-2.5 border border-border dark:border-border-dark rounded-lg bg-transparent focus:ring-1 focus:ring-primary focus:border-primary font-mono"/>
                    </div>
                    <div>
                        <label htmlFor="owner-wallet" className="block text-sm font-medium text-text-secondary dark:text-text-dark-secondary mb-1">Project Owner's Wallet Address</label>
                        <input id="owner-wallet" type="text" value={ownerWallet} onChange={e => setOwnerWallet(e.target.value)} placeholder="e.g., 0x1A2B...C3D4" className="w-full p-2.5 border border-border dark:border-border-dark rounded-lg bg-transparent focus:ring-1 focus:ring-primary focus:border-primary font-mono"/>
                    </div>
                </div>
                <div className="flex justify-end items-center pt-2">
                     <p className="text-sm text-text-secondary mr-auto">
                        Can't find these? <a href="#" className="text-primary hover:underline font-semibold" onClick={(e) => { e.preventDefault(); alert("This would navigate to a project discovery page."); }}>Browse projects</a>
                    </p>
                    <button type="submit" disabled={isSubmitting || (!projectUid && !ownerWallet)} className="bg-primary text-primary-text font-semibold py-2.5 px-6 rounded-lg hover:bg-primary-hover transition-colors disabled:bg-cairn-gray-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[150px]">
                        {isSubmitting ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'Register Claim'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const ClaimNowButton = ({ project, ownerInfo }: { project: Project; ownerInfo: ImpactAssetOwner }) => {
    const { handleClaimOwnership } = useAppContext();
    const [isClaiming, setIsClaiming] = useState(false);

    const onClaim = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsClaiming(true);
        // Simulate async call for MetaMask transaction
        await new Promise(resolve => setTimeout(resolve, 2000));
        handleClaimOwnership(project.id);
        // No need to set isClaiming to false, the component will re-render with new props
    };

    return (
        <button
            onClick={onClaim}
            disabled={isClaiming}
            className="bg-primary-light text-primary font-semibold py-1.5 px-4 rounded-lg hover:bg-blue-200/50 dark:bg-primary/20 dark:text-primary-light dark:hover:bg-primary/30 transition-colors text-sm disabled:opacity-70 disabled:cursor-wait"
        >
            {isClaiming ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : 'Claim Now'}
        </button>
    );
};

const StatusDisplay = ({ claimed }: { claimed: boolean }) => {
    if (claimed) {
        return (
            <div className="flex items-center space-x-2 text-status-success">
                <CheckCircleIcon className="w-5 h-5" />
                <span className="font-semibold">Claimed</span>
            </div>
        );
    }
    return (
        <div className="flex items-center space-x-2 text-text-secondary dark:text-text-dark-secondary">
            <div className="w-5 h-5 flex items-center justify-center">
                <div className="w-3.5 h-3.5 border-2 border-current rounded-full"></div>
            </div>
            <span className="font-semibold">Not Claimed</span>
        </div>
    );
};

export function ImpactOwnerDashboard({ onSelectProject }: { onSelectProject: (project: Project) => void; }) {
    const { projects, currentUser } = useAppContext();

    const myOwnerships = useMemo(() => {
        if (!currentUser) return [];
        return projects
            .map(p => {
                const ownerInfo = p.impactAssetOwners.find(o => o.walletAddress === currentUser.walletAddress);
                return ownerInfo ? { project: p, ownerInfo } : null;
            })
            .filter((item): item is { project: Project; ownerInfo: ImpactAssetOwner } => item !== null)
            .sort((a,b) => (a.ownerInfo.claimed ? 1 : -1) - (b.ownerInfo.claimed ? 1 : -1) || a.project.title.localeCompare(b.project.title));
    }, [projects, currentUser]);

    const numberFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });

    return (
        <div className="animate-fade-in space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-text dark:text-text-dark">My Ownerships</h1>
                <p className="mt-1 text-text-secondary dark:text-text-dark-secondary">Manage your impact asset ownership claims.</p>
            </div>

            <ClaimRegistrationForm />

            <div className="bg-primary-light/70 dark:bg-primary/10 p-4 rounded-lg flex justify-between items-center border border-primary/20">
                <div className="flex items-center space-x-3">
                    <LightbulbIcon className="w-6 h-6 text-primary"/>
                    <p className="font-semibold text-text dark:text-text-dark">This claim is backed by a proof of agreement</p>
                </div>
                <a href="#" className="font-semibold text-primary dark:text-primary-light text-sm hover:underline">View PDF</a>
            </div>

            <div className="bg-background-light dark:bg-background-dark-light rounded-xl shadow-lg border border-border dark:border-border-dark overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-cairn-gray-50 dark:bg-cairn-gray-800/50 text-left text-xs text-text-secondary dark:text-text-dark-secondary uppercase">
                            <tr>
                                <th className="p-4 font-semibold tracking-wider">Project</th>
                                <th className="p-4 font-semibold tracking-wider">Token ID</th>
                                <th className="p-4 font-semibold tracking-wider">Status</th>
                                <th className="p-4 font-semibold tracking-wider">Earnings</th>
                                <th className="p-4 font-semibold tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border dark:divide-border-dark">
                            {myOwnerships.map(({ project, ownerInfo }) => {
                                const earnings = ownerInfo.claimed && project.fundingPool > 0
                                    ? (project.fundingPool * ownerInfo.ownershipPercentage) / 100
                                    : 0;
                                const tokenId = `#${parseInt(project.cid.replace(/[^0-9]/g, '').slice(-4) || "0")}`;
                                
                                return (
                                    <tr key={project.id} className="hover:bg-cairn-gray-50 dark:hover:bg-cairn-gray-800/20 transition-colors">
                                        <td className="p-4 font-semibold text-text dark:text-text-dark">{project.title}</td>
                                        <td className="p-4 font-mono text-text-secondary dark:text-text-dark-secondary">{tokenId}</td>
                                        <td className="p-4"><StatusDisplay claimed={!!ownerInfo.claimed} /></td>
                                        <td className="p-4 font-mono font-semibold text-text dark:text-text-dark">
                                            {earnings > 0 ? numberFormatter.format(earnings) : '—'}
                                        </td>
                                        <td className="p-4 text-right">
                                            {ownerInfo.claimed ? (
                                                <button 
                                                    onClick={() => onSelectProject(project)}
                                                    className="bg-cairn-gray-200 dark:bg-cairn-gray-700 text-text-secondary dark:text-text-dark-secondary font-semibold py-1.5 px-4 rounded-lg hover:bg-cairn-gray-300 dark:hover:bg-cairn-gray-600 transition-colors text-sm"
                                                >
                                                    View
                                                </button>
                                            ) : (
                                                <ClaimNowButton project={project} ownerInfo={ownerInfo} />
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {myOwnerships.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center p-8 text-text-secondary dark:text-text-dark-secondary">
                                        You do not have any registered ownership claims. Use the form above to register a claim.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
