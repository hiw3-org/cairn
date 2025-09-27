
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Project, FundingRound, ProjectStatus } from '../../lib/types';
import { Modal } from '../ui/modal';
import { useAppContext } from '../../context/app-provider';
import { 
    CheckCircleIcon, AlertTriangleIcon, UploadCloudIcon, TrashIcon, 
    SearchIcon, CurrencyDollarIcon, FileTextIcon, SpinnerIcon, GavelIcon
} from '../ui/icons';

type Step = 'form' | 'preview' | 'success';

const EligibilityBanner = ({ isEligible, reason }: { isEligible: boolean, reason: string }) => {
    if (isEligible) {
        return (
            <div className="flex items-start p-3 text-sm rounded-lg bg-status-success-bg text-status-success dark:bg-status-success-bg-dark ring-1 ring-inset ring-status-success/20">
                <CheckCircleIcon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <div><span className="font-semibold">Project is eligible.</span> {reason}</div>
            </div>
        );
    }
    return (
        <div className="flex items-start p-3 text-sm rounded-lg bg-status-warning-bg text-status-warning dark:bg-status-warning-bg-dark ring-1 ring-inset ring-status-warning/20">
            <AlertTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <div><span className="font-semibold">Project is not eligible.</span> {reason}</div>
        </div>
    );
};

export const ApplyToFundingModal = ({ project, onClose }: { project: Project; onClose: () => void; }) => {
    const { fundingRounds, handleApplyToFundingRound, addToast } = useAppContext();
    
    const [step, setStep] = useState<Step>('form');
    const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
    const [pitch, setPitch] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [roundSearchTerm, setRoundSearchTerm] = useState('');

    const eligibility = useMemo(() => {
        if (project.status !== ProjectStatus.Reproducible) {
            return { isEligible: false, reason: "Project must have a 'Reproducible' status to apply for funding." };
        }
        return { isEligible: true, reason: 'This project can be submitted to any open funding round.' };
    }, [project]);
    
    const availableRounds = useMemo(() => {
        return fundingRounds
            .filter(r => r.status === 'Open' && r.title.toLowerCase().includes(roundSearchTerm.toLowerCase()));
    }, [fundingRounds, roundSearchTerm]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments(prev => [...prev, ...Array.from(e.target.files)].slice(0, 2));
        }
    };

    const removeAttachment = (fileName: string) => {
        setAttachments(prev => prev.filter(f => f.name !== fileName));
    };
    
    const handleSubmit = async () => {
        if (!selectedRoundId) {
            addToast("Please select a funding round.", "error");
            return;
        }
        setIsSubmitting(true);
        await new Promise(res => setTimeout(res, 1500));
        handleApplyToFundingRound(project.id, selectedRoundId, pitch, attachments);
        setIsSubmitting(false);
        setStep('success');
    };
    
    const selectedRound = fundingRounds.find(r => r.id === selectedRoundId);
    
    const renderForm = () => (
        <div className="space-y-6">
            <EligibilityBanner isEligible={eligibility.isEligible} reason={eligibility.reason} />
            
            <div>
                <label className="block text-sm font-semibold text-text-secondary dark:text-text-dark-secondary mb-2">1. Select Funding Round</label>
                <div className="relative mb-2">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    <input type="text" placeholder="Search rounds..." value={roundSearchTerm} onChange={e => setRoundSearchTerm(e.target.value)} className="w-full h-10 pl-10 pr-4 border border-border dark:border-border-dark rounded-lg bg-background dark:bg-background-dark focus:ring-1 focus:ring-primary focus:border-primary text-sm"/>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 border rounded-lg p-2 border-border dark:border-border-dark">
                    {availableRounds.map(round => (
                        <label key={round.id} className="flex items-center p-3 rounded-lg bg-background dark:bg-background-dark/50 cursor-pointer border border-transparent has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-primary/20">
                            <input type="radio" name="funding-round" value={round.id} checked={selectedRoundId === round.id} onChange={() => setSelectedRoundId(round.id)} className="h-4 w-4 text-primary focus:ring-primary" />
                            <div className="ml-3 flex-grow">
                                <p className="font-semibold text-text dark:text-text-dark">{round.title}</p>
                                <div className="flex items-center space-x-4 text-xs text-text-secondary dark:text-text-dark-secondary">
                                    <span>Pool: ${round.poolSize.toLocaleString()}</span>
                                    <span>Topics: {round.topics.slice(0,2).join(', ')}</span>
                                    <span>Ends: {new Date(round.applicationDeadline).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            <div>
                 <label htmlFor="pitch" className="block text-sm font-semibold text-text-secondary dark:text-text-dark-secondary mb-2">2. Short Pitch</label>
                 <textarea id="pitch" value={pitch} onChange={e => setPitch(e.target.value)} placeholder="Briefly describe the project's impact, potential for reuse, and your timeline." rows={5} className="w-full p-3 border border-border dark:border-border-dark rounded-lg bg-transparent focus:ring-1 focus:ring-primary focus:border-primary text-sm" />
            </div>

            <div>
                <label className="block text-sm font-semibold text-text-secondary dark:text-text-dark-secondary mb-2">3. Attachments (Optional, max 2)</label>
                <div className="flex items-center justify-center w-full">
                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-border dark:border-border-dark border-dashed rounded-lg cursor-pointer bg-background dark:bg-background-dark/50 hover:bg-hf-gray-100 dark:hover:bg-hf-gray-800/50">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloudIcon className="w-8 h-8 mb-2 text-text-secondary/60" />
                            <p className="mb-2 text-sm text-text-secondary"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-text-secondary/70">PDF or images (max. 5MB each)</p>
                        </div>
                        <input id="dropzone-file" type="file" multiple accept="application/pdf,image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                </div> 
                <div className="mt-2 space-y-1">
                    {attachments.map(file => (
                        <div key={file.name} className="flex items-center justify-between text-sm p-2 bg-hf-gray-100 dark:bg-hf-gray-800 rounded">
                            <span className="truncate">{file.name}</span>
                            <button onClick={() => removeAttachment(file.name)}><TrashIcon className="w-4 h-4 text-status-danger"/></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
    
    const renderPreview = () => (
        <div className="space-y-4">
            <h3 className="text-xl font-semibold text-center">Application Summary</h3>
            <div className="p-4 rounded-lg bg-hf-gray-100 dark:bg-hf-gray-800 space-y-3">
                <div className="flex justify-between"><span className="font-semibold">Project:</span><span>{project.title}</span></div>
                <div className="flex justify-between"><span className="font-semibold">Funding Round:</span><span>{selectedRound?.title}</span></div>
            </div>
            <div>
                <h4 className="font-semibold">Pitch:</h4>
                <p className="text-sm p-3 bg-hf-gray-100 dark:bg-hf-gray-800 rounded-lg mt-1 whitespace-pre-wrap">{pitch || 'No pitch provided.'}</p>
            </div>
             <div>
                <h4 className="font-semibold">Attachments:</h4>
                <ul className="list-disc list-inside text-sm p-3 bg-hf-gray-100 dark:bg-hf-gray-800 rounded-lg mt-1">
                    {attachments.length > 0 ? attachments.map(f => <li key={f.name}>{f.name}</li>) : <li>No attachments.</li>}
                </ul>
            </div>
        </div>
    );

    const renderSuccess = () => (
        <div className="text-center py-12">
            <CheckCircleIcon className="w-16 h-16 text-status-success mx-auto" />
            <h3 className="text-2xl font-bold mt-4">Application Submitted!</h3>
            <p className="mt-2 text-text-secondary dark:text-dark-text-secondary">Your application for "{project.title}" has been sent to the "{selectedRound?.title}" round.</p>
            <p className="text-xs mt-1 text-text-secondary dark:text-text-dark-secondary">The review period ends on {selectedRound?.evaluationDeadline ? new Date(selectedRound.evaluationDeadline).toLocaleDateString() : 'N/A'}.</p>
        </div>
    );

    const renderFooter = () => {
        if (step === 'form') {
            return (
                <div className="flex justify-end">
                    <button onClick={() => setStep('preview')} disabled={!eligibility.isEligible || !selectedRoundId} className="bg-primary text-primary-text font-semibold py-2.5 px-6 rounded-lg hover:bg-primary-hover transition-colors disabled:bg-cairn-gray-400 disabled:cursor-not-allowed">
                        Preview Application
                    </button>
                </div>
            );
        }
        if (step === 'preview') {
            return (
                <div className="flex justify-between items-center">
                    <button onClick={() => setStep('form')} className="font-semibold py-2.5 px-6 rounded-lg hover:bg-hf-gray-100 dark:hover:bg-hf-gray-800 transition-colors">Back</button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="bg-primary text-primary-text font-semibold py-2.5 px-6 rounded-lg hover:bg-primary-hover transition-colors disabled:bg-cairn-gray-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[180px]">
                        {isSubmitting ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : 'Submit Application'}
                    </button>
                </div>
            );
        }
        if (step === 'success') {
             return (
                <div className="flex justify-end space-x-4">
                    <button onClick={onClose} className="font-semibold py-2.5 px-6 rounded-lg hover:bg-hf-gray-100 dark:hover:bg-hf-gray-800 transition-colors">Close</button>
                    <button onClick={onClose} className="bg-primary text-primary-text font-semibold py-2.5 px-6 rounded-lg hover:bg-primary-hover transition-colors">View Round Details</button>
                </div>
            );
        }
    };

    return (
        <Modal 
            onClose={onClose} 
            title={`Apply to Funding Round`}
            footer={renderFooter()}
        >
            <div className="p-1">
                {step === 'form' && renderForm()}
                {step === 'preview' && renderPreview()}
                {step === 'success' && renderSuccess()}
            </div>
        </Modal>
    );
};
