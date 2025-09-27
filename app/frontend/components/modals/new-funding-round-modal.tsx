
"use client";

import React, { useState } from 'react';
import { FundingRound } from '../../lib/types';
import { Modal } from '../ui/modal';
import { useAppContext } from '../../context/app-provider';
import { InfoIcon } from '../ui/icons';
import { Tooltip } from '../ui/tooltip';
import { FUNDING_ROUND_FOCUS_AREAS } from '../../lib/constants';

// --- Helper Components (defined outside the main component) ---

const FormField = ({ label, tooltip, children }: { label: string, tooltip?: string, children: React.ReactNode}) => (
    <div>
        <label className="flex items-center space-x-1.5 mb-1.5">
            <span className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary">{label}</span>
            {tooltip && <Tooltip text={tooltip}><InfoIcon className="w-4 h-4 text-text-secondary/70" /></Tooltip>}
        </label>
        {children}
    </div>
);

const DetailItem = ({ label, value, tooltip, children }: { label: string, value?: string, tooltip?: string, children?: React.ReactNode }) => (
    <div>
        <div className="flex items-center space-x-1.5 mb-1">
            <span className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary">{label}</span>
            {tooltip && <Tooltip text={tooltip}><InfoIcon className="w-4 h-4 text-text-secondary/70" /></Tooltip>}
        </div>
        {value && <p className="font-semibold text-text dark:text-text-dark">{value}</p>}
        {children}
    </div>
);

const PreviewRoundModal = ({ roundData, onClose, onConfirm, onEdit }: { roundData: Partial<FundingRound>, onClose: () => void; onConfirm: () => void, onEdit: () => void }) => {
    const { addToast } = useAppContext();

    const handleSaveDraft = () => {
        addToast('Round draft saved!', 'success');
        onClose();
    };

    return (
        <Modal onClose={onClose} title="Preview Round Summary">
            <div className="max-w-2xl mx-auto bg-cairn-gray-50 dark:bg-cairn-gray-900/50 p-6 rounded-xl border border-border dark:border-border-dark">
                <div className="text-center pb-4 border-b border-border dark:border-border-dark">
                    <h3 className="text-2xl font-bold text-text dark:text-text-dark">{roundData.title}</h3>
                    <div className="mt-2 flex flex-wrap justify-center gap-2">
                        {roundData.topics?.map(topic => (
                            <span key={topic} className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full dark:bg-blue-900/50 dark:text-blue-300">{topic}</span>
                        ))}
                    </div>
                </div>
                <div className="py-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        <DetailItem label="Funding Pool" value={`$${(roundData.poolSize || 0).toLocaleString()} USDC`} />
                        <DetailItem label="Distribution Method" value={roundData.distributionMethod} tooltip="The method for splitting funds."/>
                        <DetailItem label="Pool Allocation" value={`${roundData.maxProjects || 'N/A'} projects`} tooltip="The maximum number of projects that will receive funding."/>
                    </div>
                     <div className="h-px bg-border dark:bg-border-dark"></div>
                     <DetailItem label="Evaluation Method" value={roundData.evaluationMethod} tooltip="Determines how project impact will be verified." />
                    <div className="h-px bg-border dark:bg-border-dark"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                         <DetailItem label="Application Deadline" value={roundData.applicationDeadline ? new Date(roundData.applicationDeadline + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric'}) : 'N/A'} />
                         <DetailItem label="Evaluation Deadline" value={roundData.evaluationDeadline ? new Date(roundData.evaluationDeadline + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric'}) : 'N/A'} />
                         <DetailItem label="Distribution Deadline" value={roundData.distributionDeadline ? new Date(roundData.distributionDeadline + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric'}) : 'N/A'} />
                    </div>
                    {roundData.selectionCriteria && <DetailItem label="Selection Criteria" value={roundData.selectionCriteria} />}
                </div>
            </div>
            
            <div className="mt-6 p-4 text-sm rounded-lg bg-status-warning-bg/60 text-status-warning dark:bg-status-warning-bg-dark/50 ring-1 ring-inset ring-status-warning/20 text-center">
                Rounds are binding once launched. Please confirm details carefully.
            </div>

            <div className="mt-8 flex items-center justify-center space-x-4">
                <button onClick={onEdit} className="font-semibold text-text-secondary dark:text-text-dark-secondary hover:text-text dark:hover:text-text-dark transition-colors px-6 py-2">Edit Round</button>
                <button onClick={handleSaveDraft} className="font-semibold bg-cairn-gray-200 dark:bg-cairn-gray-700 text-text dark:text-text-dark hover:bg-cairn-gray-300 dark:hover:bg-cairn-gray-600 transition-colors px-6 py-2.5 rounded-lg">Save Draft</button>
                <button onClick={onConfirm} className="font-semibold bg-primary text-primary-text hover:bg-primary-hover transition-colors px-8 py-2.5 rounded-lg shadow-md hover:shadow-lg shadow-primary/30">Launch Round</button>
            </div>
        </Modal>
    );
};

// --- Main Component ---

export const NewFundingRoundModal = ({ onClose }: { onClose: () => void }) => {
    const { handleCreateFundingRound, addToast, usdcBalance } = useAppContext();
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Form state using individual states to prevent input issues.
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [topics, setTopics] = useState<string[]>([]);
    const [poolSize, setPoolSize] = useState<number | undefined>(undefined);
    const [evaluationMethod, setEvaluationMethod] = useState<FundingRound['evaluationMethod']>('Delegated Evaluators');
    const [distributionMethod, setDistributionMethod] = useState<FundingRound['distributionMethod']>('Even');
    const [selectionCriteria, setSelectionCriteria] = useState('');
    const [applicationDeadline, setApplicationDeadline] = useState('');
    const [evaluationDeadline, setEvaluationDeadline] = useState('');
    const [distributionDeadline, setDistributionDeadline] = useState('');
    const [maxProjects, setMaxProjects] = useState<number | undefined>(undefined);
    
    const roundData: Partial<FundingRound> = {
        title, description, topics, poolSize, evaluationMethod, distributionMethod,
        selectionCriteria, applicationDeadline, evaluationDeadline, distributionDeadline, maxProjects
    };

    const handleTopicToggle = (topic: string) => {
        setTopics(currentTopics => 
            currentTopics.includes(topic)
            ? currentTopics.filter(t => t !== topic)
            : [...currentTopics, topic]
        );
    };

    const handlePreview = (e: React.FormEvent) => {
        e.preventDefault();
        setIsPreviewOpen(true);
    };

    const handleConfirmLaunch = () => {
        if (!title || !description || topics.length === 0 || poolSize === undefined || !applicationDeadline || !evaluationDeadline || !distributionDeadline) {
             addToast('Please fill out all required fields.', 'error');
             return;
        }
        handleCreateFundingRound(roundData as Omit<FundingRound, 'id' | 'status' | 'applicationCount' | 'totalImpactScore'>);
        setIsPreviewOpen(false);
        onClose();
    };

    return (
        <>
        <Modal onClose={onClose} title="Launch New Retroactive Round">
            <form onSubmit={handlePreview} className="bg-transparent border-none shadow-none p-0">
                <div className="p-1 space-y-6">
                    {/* Section 1: About */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-text dark:text-text-dark">About the Round</h4>
                        <FormField label="Round Title"><input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full h-11 px-3 border border-border dark:border-border-dark rounded-lg bg-transparent focus:ring-1 focus:ring-primary focus:border-primary text-sm" /></FormField>
                        <FormField label="Round Description"><textarea value={description} onChange={e => setDescription(e.target.value)} required className="w-full p-3 border border-border dark:border-border-dark rounded-lg bg-transparent focus:ring-1 focus:ring-primary focus:border-primary text-sm min-h-[80px]" /></FormField>
                        <FormField label="Focus Areas / Domains">
                            <div className="flex flex-wrap gap-2 p-2 bg-cairn-gray-50 dark:bg-cairn-gray-900/50 rounded-lg border border-border dark:border-border-dark">
                                {FUNDING_ROUND_FOCUS_AREAS.map(topic => (
                                    <button type="button" key={topic} onClick={() => handleTopicToggle(topic)} className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${ (topics || []).includes(topic) ? 'bg-primary text-white' : 'bg-cairn-gray-200 dark:bg-cairn-gray-700 hover:bg-cairn-gray-300 dark:hover:bg-cairn-gray-600'}`}>{topic}</button>
                                ))}
                            </div>
                        </FormField>
                    </div>
                    <div className="h-px bg-border dark:bg-border-dark"></div>
                    {/* Section 2: Funding */}
                    <div className="space-y-4">
                         <h4 className="font-semibold text-text dark:text-text-dark">Funding</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <FormField label="Funding Pool (USDC)">
                                <div className="relative">
                                    <input type="number" placeholder="e.g., 100000" value={poolSize === undefined ? '' : poolSize} onChange={e => setPoolSize(e.target.value ? parseInt(e.target.value, 10) : undefined)} required className="w-full h-11 px-3 border border-border dark:border-border-dark rounded-lg bg-transparent focus:ring-1 focus:ring-primary focus:border-primary text-sm" />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-text-secondary">USDC</div>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                    <p className="text-xs text-text-secondary dark:text-text-dark-secondary">Available: ${usdcBalance.toLocaleString()} USDC</p>
                                    {poolSize !== undefined && poolSize > usdcBalance && (
                                        <p className="text-xs font-semibold text-status-danger">Insufficient funds</p>
                                    )}
                                </div>
                            </FormField>
                            <FormField label="Pool Allocation" tooltip="The estimated number of projects that will receive funding from this pool.">
                                <input type="number" placeholder="# of projects" value={maxProjects === undefined ? '' : maxProjects} onChange={e => setMaxProjects(e.target.value ? parseInt(e.target.value, 10) : undefined)} className="w-full h-11 px-3 border border-border dark:border-border-dark rounded-lg bg-transparent focus:ring-1 focus:ring-primary focus:border-primary text-sm" />
                            </FormField>
                         </div>
                         <FormField label="Distribution Method" tooltip="Determines how the funding pool is split among selected projects.">
                            <div className="flex items-center space-x-2 h-11">
                                {(['Even', 'By Score', 'Manual'] as const).map(type => (
                                    <label key={type} className="flex-1 flex items-center justify-center h-full px-3 border border-border dark:border-border-dark rounded-lg cursor-pointer has-[:checked]:bg-primary-light has-[:checked]:border-primary dark:has-[:checked]:bg-primary/20 dark:has-[:checked]:border-primary transition-colors">
                                        <input type="radio" name="distributionMethod" value={type} checked={distributionMethod === type} onChange={() => setDistributionMethod(type)} className="sr-only"/>
                                        <span className="text-sm font-medium text-text dark:text-text-dark">{type}</span>
                                    </label>
                                ))}
                            </div>
                        </FormField>
                    </div>
                     <div className="h-px bg-border dark:bg-border-dark"></div>
                    {/* Section 3: Evaluation */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-text dark:text-text-dark">Evaluation</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <FormField label="Evaluation Method" tooltip="Determines how project impact will be verified.">
                                <select onChange={e => setEvaluationMethod(e.target.value as any)} value={evaluationMethod} className="w-full h-11 px-3 border border-border dark:border-border-dark rounded-lg bg-transparent focus:ring-1 focus:ring-primary focus:border-primary text-sm">
                                    <option>Delegated Evaluators</option>
                                    <option>Cairn Core Team</option>
                                    <option disabled>DAO Vote [coming soon]</option>
                                </select>
                            </FormField>
                            <FormField label="Selection Criteria (Optional)" tooltip="Provide guidelines for evaluators or your own review process.">
                                <input type="text" placeholder="e.g., Focus on novelty and open source..." value={selectionCriteria} onChange={e => setSelectionCriteria(e.target.value)} className="w-full h-11 px-3 border border-border dark:border-border-dark rounded-lg bg-transparent focus:ring-1 focus:ring-primary focus:border-primary text-sm" />
                            </FormField>
                        </div>
                    </div>
                    <div className="h-px bg-border dark:bg-border-dark"></div>
                    {/* Section 4: Timeline */}
                     <div className="space-y-4">
                        <h4 className="font-semibold text-text dark:text-text-dark">Timeline</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                            <FormField label="Application Deadline"><input type="date" value={applicationDeadline} onChange={e => setApplicationDeadline(e.target.value)} required className="w-full h-11 px-3 border border-border dark:border-border-dark rounded-lg bg-transparent focus:ring-1 focus:ring-primary focus:border-primary text-sm" /></FormField>
                            <FormField label="Evaluation Deadline"><input type="date" value={evaluationDeadline} onChange={e => setEvaluationDeadline(e.target.value)} required className="w-full h-11 px-3 border border-border dark:border-border-dark rounded-lg bg-transparent focus:ring-1 focus:ring-primary focus:border-primary text-sm"/></FormField>
                            <FormField label="Distribution Deadline"><input type="date" value={distributionDeadline} onChange={e => setDistributionDeadline(e.target.value)} required className="w-full h-11 px-3 border border-border dark:border-border-dark rounded-lg bg-transparent focus:ring-1 focus:ring-primary focus:border-primary text-sm"/></FormField>
                        </div>
                    </div>
                </div>
                <div className="p-5 mt-4 border-t border-border dark:border-border-dark bg-cairn-gray-50 dark:bg-cairn-gray-900/50 -mx-6 -mb-6 rounded-b-2xl">
                     <div className="flex items-center justify-end space-x-4">
                        <button type="button" onClick={() => { addToast('Draft saved!', 'success'); onClose(); }} className="font-semibold text-text-secondary dark:text-text-dark-secondary hover:text-text dark:hover:text-text-dark transition-colors px-6 py-2">Save Draft</button>
                        <button type="submit" className="font-semibold bg-primary text-primary-text hover:bg-primary-hover transition-colors px-8 py-2.5 rounded-lg shadow-md hover:shadow-lg shadow-primary/30" disabled={!title || poolSize === undefined || !(topics && topics.length > 0) || !applicationDeadline || !evaluationDeadline || !distributionDeadline}>Preview Round</button>
                     </div>
                     <p className="text-xs text-text-secondary/70 dark:text-text-dark-secondary/70 text-center mt-4">
                         Rounds are binding once launched. Ensure details are correct.
                     </p>
                </div>
            </form>
        </Modal>

        {isPreviewOpen && (
            <PreviewRoundModal
                roundData={roundData}
                onClose={() => setIsPreviewOpen(false)}
                onEdit={() => setIsPreviewOpen(false)}
                onConfirm={handleConfirmLaunch}
            />
        )}
        </>
    );
};
