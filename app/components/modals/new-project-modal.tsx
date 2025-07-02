
"use client";

import React, { useState } from 'react';
import { Project, ResearchDomain, ProjectStatus } from '../../lib/types';
import { Modal } from '../ui/modal';
import { RESEARCH_DOMAINS, REPRODUCIBILITY_TEMPLATES } from '../../lib/constants';
import { useAppContext } from '../../context/app-provider';
import { InfoIcon, SpinnerIcon, CheckCircleIcon, AlertTriangleIcon } from '../ui/icons';

// Types for creation process
type CreationStatus = 'form' | 'creating' | 'success' | 'error';
type StepStatus = 'pending' | 'active' | 'success' | 'error';
interface Step {
  name: string;
  description: string;
  status: StepStatus;
}

// Visual component for each step's icon
const StepIcon = ({ status }: { status: StepStatus }) => {
    switch (status) {
        case 'success':
            return <CheckCircleIcon className="w-full h-full text-green-500" />;
        case 'active':
            return <SpinnerIcon className="w-full h-full text-cairn-blue-500 animate-spin" />;
        case 'error':
            return <AlertTriangleIcon className="w-full h-full text-red-500" />;
        case 'pending':
        default:
            return <div className="w-4 h-4 rounded-full bg-cairn-gray-300 dark:bg-cairn-gray-600" />;
    }
};

// Component to display the creation steps
const StepTracker = ({ steps }: { steps: Step[] }) => (
    <div className="py-8 px-4">
        <h3 className="text-lg font-semibold text-center mb-2">Your project is being created on-chain.</h3>
        <p className="text-sm text-cairn-gray-500 dark:text-cairn-gray-400 text-center mb-8">Please approve the transactions in your wallet when prompted.</p>
        <ol className="relative border-l-2 border-cairn-gray-200 dark:border-cairn-gray-700 ml-4">
            {steps.map((step, index) => (
                <li key={index} className="mb-10 ml-8 last:mb-0">
                    <span className={`absolute flex items-center justify-center w-8 h-8 rounded-full -left-4 ring-4 ring-cairn-gray-50 dark:ring-cairn-gray-900 ${step.status === 'pending' ? 'bg-cairn-gray-200 dark:bg-cairn-gray-700' : 'bg-cairn-gray-100 dark:bg-cairn-gray-800'}`}>
                        <StepIcon status={step.status} />
                    </span>
                    <h4 className={`font-semibold ${step.status === 'pending' ? 'text-cairn-gray-500' : 'text-cairn-gray-900 dark:text-white'}`}>{step.name}</h4>
                    <p className="text-sm text-cairn-gray-500 dark:text-cairn-gray-400">{step.description}</p>
                    {step.status === 'error' && <p className="text-sm font-semibold text-red-500 mt-1">Transaction failed. Please try again.</p>}
                </li>
            ))}
        </ol>
    </div>
);


export const NewProjectModal = ({ onClose, onAddProject }: { onClose: () => void, onAddProject: (p: Project) => void }) => {
    const { currentUser } = useAppContext();
    const [title, setTitle] = useState('');
    const [domain, setDomain] = useState<ResearchDomain>(ResearchDomain.Robotics);
    const [description, setDescription] = useState('');
    const [organization, setOrganization] = useState('');
    const [additionalInfoUrl, setAdditionalInfoUrl] = useState('');
    const [tags, setTags] = useState('');
    
    const [creationStatus, setCreationStatus] = useState<CreationStatus>('form');
    const [steps, setSteps] = useState<Step[]>([]);
    
    const handleCreateProject = async () => {
        if (!title || !description) return;

        setCreationStatus('creating');

        const initialSteps: Step[] = [
            { name: '1. Create Project Metadata', description: 'Storing project details on the smart contract.', status: 'active' },
            { name: '2. Mint Hypercert', description: 'Generating the fractionalized impact certificate.', status: 'pending' },
            { name: '3. Link Impact Assets', description: 'Connecting the project and Hypercert token ID.', status: 'pending' },
        ];
        setSteps(initialSteps);

        try {
            // Simulate Step 1: Create Metadata
            await new Promise(resolve => setTimeout(resolve, 2000));
            setSteps(currentSteps => currentSteps.map((step, index) => index === 0 ? { ...step, status: 'success' } : (index === 1 ? { ...step, status: 'active' } : step)));
            
            // Simulate Step 2: Mint Hypercert
            await new Promise(resolve => setTimeout(resolve, 2500));
            // if (Math.random() < 0.2) throw new Error("Wallet transaction rejected."); // Uncomment to test error case
            setSteps(currentSteps => currentSteps.map((step, index) => index === 1 ? { ...step, status: 'success' } : (index === 2 ? { ...step, status: 'active' } : step)));
            
            // Simulate Step 3: Link Assets
            await new Promise(resolve => setTimeout(resolve, 2000));
            setSteps(currentSteps => currentSteps.map(step => ({ ...step, status: 'success' })));

            setCreationStatus('success');

            const newProject: Project = {
                id: `proj-${Date.now()}`,
                ownerId: currentUser.walletAddress,
                title,
                description,
                organization: organization || undefined,
                additionalInfoUrl: additionalInfoUrl || undefined,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                domain,
                status: ProjectStatus.Draft,
                cid: `Qm...${Date.now().toString().slice(-4)}`,
                hypercertFraction: 0,
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                lastOutputDate: '',
                reproducibilities: [],
                fundingGoal: 15000,
                fundingPool: 0,
                impactScore: 0,
                outputs: [],
                reproducibilityRequirements: REPRODUCIBILITY_TEMPLATES[domain],
            };
            onAddProject(newProject);

        } catch (error) {
            setCreationStatus('error');
            setSteps(currentSteps => currentSteps.map(step => step.status === 'active' ? { ...step, status: 'error' } : step));
        }
    };
    
    const renderContent = () => {
        if (creationStatus === 'form') {
            return (
                 <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-cairn-gray-700 dark:text-cairn-gray-300 mb-1">Project Title</label>
                        <input type="text" placeholder="e.g., Autonomous Drone Navigation" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 border border-cairn-gray-300 dark:border-cairn-gray-600 rounded-md bg-transparent" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-cairn-gray-700 dark:text-cairn-gray-300 mb-1">Description</label>
                        <textarea placeholder="A brief summary of your research goals and methods." value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border border-cairn-gray-300 dark:border-cairn-gray-600 rounded-md bg-transparent h-24" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-cairn-gray-700 dark:text-cairn-gray-300 mb-1">Organization (Optional)</label>
                            <input type="text" placeholder="e.g., Atlas Robotics" value={organization} onChange={(e) => setOrganization(e.target.value)} className="w-full p-2 border border-cairn-gray-300 dark:border-cairn-gray-600 rounded-md bg-transparent" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-cairn-gray-700 dark:text-cairn-gray-300 mb-1">Contributor Info URL (Optional)</label>
                            <input type="url" placeholder="e.g., Google Scholar, lab site" value={additionalInfoUrl} onChange={(e) => setAdditionalInfoUrl(e.target.value)} className="w-full p-2 border border-cairn-gray-300 dark:border-cairn-gray-600 rounded-md bg-transparent" />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-cairn-gray-700 dark:text-cairn-gray-300 mb-1">Research Domain</label>
                            <select value={domain} onChange={(e) => setDomain(e.target.value as ResearchDomain)} className="w-full p-2 border border-cairn-gray-300 dark:border-cairn-gray-600 rounded-md bg-transparent dark:text-white">
                                {RESEARCH_DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-cairn-gray-700 dark:text-cairn-gray-300 mb-1">Tags</label>
                            <input type="text" placeholder="AI, Robotics, SLAM (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full p-2 border border-cairn-gray-300 dark:border-cairn-gray-600 rounded-md bg-transparent" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-start p-3 mb-3 text-sm rounded-md bg-cairn-blue-50 text-cairn-blue-800 dark:bg-cairn-blue-900/50 dark:text-cairn-blue-200">
                            <InfoIcon className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                            <span>New projects have a status of a <strong>Draft</strong> and are not publicly visible until you provide Research Outputs. Go to your project list and Manage your new project.</span>
                        </div>
                        <h4 className="text-md font-medium text-cairn-gray-800 dark:text-cairn-gray-200 mb-2">Research Output Guidelines</h4>
                        <p className="text-sm text-cairn-gray-500 dark:text-cairn-gray-400 mb-3">These are some examples of outputs for a project in the <strong>{domain}</strong> domain. Provide as much detail as possible.</p>
                        <ul className="space-y-2 text-sm text-cairn-gray-600 dark:text-cairn-gray-400 list-disc list-inside bg-cairn-gray-100 dark:bg-cairn-gray-800 p-3 rounded-md">
                            {REPRODUCIBILITY_TEMPLATES[domain].map((req, i) => <li key={i}>{req}</li>)}
                        </ul>
                    </div>
                </div>
            );
        }
        return <StepTracker steps={steps} />;
    };

    const renderFooter = () => {
        const handleRetry = () => {
            setCreationStatus('form');
            setSteps([]);
        };

        if (creationStatus === 'form') {
            return (
                 <div className="flex justify-end">
                    <button onClick={handleCreateProject} disabled={!title || !description} className="bg-cairn-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-cairn-blue-700 transition-colors disabled:bg-cairn-gray-400 disabled:cursor-not-allowed">Create Project</button>
                </div>
            );
        }
         if (creationStatus === 'creating') {
            return (
                <div className="flex justify-end">
                    <button disabled className="bg-cairn-blue-500 text-white font-semibold py-2 px-6 rounded-lg flex items-center cursor-wait">
                        <SpinnerIcon className="animate-spin w-5 h-5 mr-2" />
                        Processing...
                    </button>
                </div>
            )
        }
        if (creationStatus === 'success') {
             return (
                <div className="flex justify-end">
                    <button onClick={onClose} className="bg-green-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center">
                        <CheckCircleIcon className="w-5 h-5 mr-2" />
                        Done
                    </button>
                </div>
            )
        }
         if (creationStatus === 'error') {
            return (
                <div className="flex justify-end space-x-4">
                     <button onClick={onClose} className="text-cairn-gray-700 dark:text-cairn-gray-300 font-semibold py-2 px-4 rounded-lg hover:bg-cairn-gray-200 dark:hover:bg-cairn-gray-700">
                        Close
                     </button>
                     <button onClick={handleRetry} className="bg-yellow-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-yellow-600 transition-colors">
                        Try Again
                    </button>
                </div>
            )
        }
        return null;
    };

    return (
        <Modal 
            onClose={creationStatus === 'creating' ? () => {} : onClose} 
            title={creationStatus === 'form' ? "Create New Project" : "Project Creation Status"}
            footer={renderFooter()}
        >
            {renderContent()}
        </Modal>
    );
};
