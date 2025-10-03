"use client";

import React from "react";
import {
  Project,
  ResearchDomain,
  ProjectStatus,
  Output,
  HuggingFaceOutput,
  OutputType,
} from "../../lib/types";
import { Modal } from "../ui/modal";
import { useAppContext } from "../../context/app-provider";
import {
  InfoIcon,
  SpinnerIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  HuggingFaceIcon,
  TrashIcon,
  GitHubIcon,
  FileTextIcon,
  UploadCloudIcon,
  ClipboardCheckIcon,
  ScaleIcon,
  LightbulbIcon,
} from "../ui/icons";

const WIZARD_STEPS = [
    { id: 1, name: 'Selected Outputs', icon: HuggingFaceIcon },
    { id: 2, name: 'Project Basics', icon: FileTextIcon },
    { id: 3, name: 'Add Research papers', icon: UploadCloudIcon },
    { id: 4, name: 'Review & Create', icon: CheckCircleIcon },
];

const WizardStepper = ({ currentStep }: { currentStep: number }) => (
    <nav aria-label="Progress" className="pb-4">
        <ol role="list" className="flex items-center">
            {WIZARD_STEPS.map((step, stepIdx) => (
                <li key={step.name} className={`relative ${stepIdx !== WIZARD_STEPS.length - 1 ? 'flex-1' : ''}`}>
                    {step.id < currentStep ? ( // Completed
                        <>
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="h-0.5 w-full bg-primary" />
                            </div>
                            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                                <CheckCircleIcon className="h-5 w-5 text-white" aria-hidden="true" />
                            </div>
                        </>
                    ) : step.id === currentStep ? ( // Current
                        <>
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="h-0.5 w-full bg-border dark:bg-border-dark" />
                            </div>
                            <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background-light dark:bg-background-dark-light">
                                <step.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                            </div>
                        </>
                    ) : ( // Upcoming
                        <>
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="h-0.5 w-full bg-border dark:bg-border-dark" />
                            </div>
                            <div className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-border dark:border-border-dark bg-background-light dark:bg-background-dark-light">
                                <step.icon className="h-5 w-5 text-text-secondary/50" aria-hidden="true" />
                            </div>
                        </>
                    )}
                     <span className="absolute top-10 left-0 right-0 px-1 text-center text-xs font-semibold text-text-secondary dark:text-dark-text-secondary">{step.name}</span>
                </li>
            ))}
        </ol>
    </nav>
);

const HelpRail = ({ step }: { step: number }) => {
    const tips = [
        "Review the Hugging Face assets you selected. These will form the initial outputs for your new CAIRN project.",
        "Provide a clear title and description. Good metadata helps funders and other researchers discover your work.",
        "Strengthen your project by linking to existing papers, code, or supplementary materials. This increases your impact score.",
        "Review all details before creating your project. You can save a draft to complete it later."
    ];
    return (
        <div className="w-64 flex-shrink-0 space-y-4">
            <div className="p-4 rounded-lg bg-primary-light/70 dark:bg-primary/10 border border-primary/20">
                <div className="flex items-center space-x-2">
                    <LightbulbIcon className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold text-primary">Help</h4>
                </div>
                <p className="mt-2 text-sm text-text-secondary dark:text-dark-text-secondary">{tips[step-1]}</p>
            </div>
        </div>
    );
};

// --- Wizard Step Components ---
const Step1_SelectedOutputs = ({ outputs, onRemove }: { outputs: HuggingFaceOutput[], onRemove: (id: string) => void }) => (
    <div>
        <h3 className="text-xl font-semibold mb-4">Selected Hugging Face Outputs</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {outputs.map(o => (
                <div key={o.id} className="flex items-center justify-between p-3 rounded-lg bg-hf-gray-100 dark:bg-hf-gray-800 border border-border dark:border-border-dark">
                    <div className="flex items-center space-x-3">
                        <HuggingFaceIcon className="w-6 h-6 text-yellow-500" />
                        <div>
                            <p className="font-semibold text-text-primary dark:text-dark-text-primary">{o.name}</p>
                            <p className="text-sm text-text-secondary dark:text-dark-text-secondary capitalize">{o.type}</p>
                        </div>
                    </div>
                    <button onClick={() => onRemove(o.id)} className="p-1.5 rounded-full hover:bg-hf-gray-200 dark:hover:bg-hf-gray-700">
                        <TrashIcon className="w-4 h-4 text-status-danger"/>
                    </button>
                </div>
            ))}
        </div>
        <button className="mt-4 text-sm font-semibold text-primary hover:underline">+ Add more from Hugging Face</button>
    </div>
);

const Step2_ProjectBasics = ({ data, setData }: { data: any, setData: Function }) => (
    <div className="space-y-4">
        <h3 className="text-xl font-semibold">Project Basics</h3>
        <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input type="text" value={data.title} onChange={e => setData({ ...data, title: e.target.value })} className="w-full h-11 px-3 border rounded-lg bg-transparent" />
        </div>
        <div>
            <label className="block text-sm font-medium mb-1">Short Description</label>
            <textarea value={data.description} onChange={e => setData({ ...data, description: e.target.value })} className="w-full p-3 border rounded-lg bg-transparent min-h-[100px]" />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium mb-1">Research Domain</label>
                <select value={data.domain} onChange={e => setData({ ...data, domain: e.target.value })} className="w-full h-11 px-3 border rounded-lg bg-transparent">
                    {RESEARCH_DOMAINS.map(d => <option key={d}>{d}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">License</label>
                <select value={data.license} onChange={e => setData({ ...data, license: e.target.value })} className="w-full h-11 px-3 border rounded-lg bg-transparent">
                    <option>MIT</option><option>Apache 2.0</option><option>GPL</option><option>Other</option>
                </select>
            </div>
        </div>
    </div>
);

const MOCK_ARXIV_PAPERS = [
    { id: '2305.12863', title: 'A Survey of Large Language Models', url: 'https://arxiv.org/abs/2305.12863' },
    { id: '1706.03762', title: 'Attention Is All You Need', url: 'https://arxiv.org/abs/1706.03762' },
    { id: '2203.02155', title: 'A ConvNet for the 2020s', url: 'https://arxiv.org/abs/2203.02155' },
    { id: '2005.14165', title: 'Language Models are Few-Shot Learners', url: 'https://arxiv.org/abs/2005.14165' },
    { id: '1409.1556', title: 'Very Deep Convolutional Networks for Large-Scale Image Recognition', url: 'https://arxiv.org/abs/1409.1556' },
    { id: '1512.03385', title: 'Deep Residual Learning for Image Recognition', url: 'https://arxiv.org/abs/1512.03385' },
    { id: '2106.09685', title: 'An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale', url: 'https://arxiv.org/abs/2106.09685' }
];

const Step3_AddResearchPapers = ({ data, setData }: { data: any, setData: Function }) => {
    const [arxivQuery, setArxivQuery] = React.useState('');
    const [arxivResults, setArxivResults] = React.useState<typeof MOCK_ARXIV_PAPERS>([]);
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
    const searchRef = React.useRef<HTMLDivElement>(null);

    // Debounced search effect
    React.useEffect(() => {
        if (arxivQuery.length < 3) {
            setArxivResults([]);
            setIsDropdownOpen(false);
            return;
        }

        const handler = setTimeout(() => {
            const results = MOCK_ARXIV_PAPERS
                .filter(p => p.title.toLowerCase().includes(arxivQuery.toLowerCase()))
                .slice(0, 5);
            setArxivResults(results);
            setIsDropdownOpen(results.length > 0);
        }, 300); // 300ms debounce

        return () => {
            clearTimeout(handler);
        };
    }, [arxivQuery]);

    // Close dropdown on click outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    const handleAddArtifact = (item: { id: string, type: 'paper' | 'arxiv', url: string, title: string }) => {
        // Prevent duplicates
        if (!data.artifacts.some((a: any) => a.url === item.url)) {
            setData({ ...data, artifacts: [...data.artifacts, item] });
        }
    };
    
    const handleSelectArxiv = (paper: typeof MOCK_ARXIV_PAPERS[0]) => {
        handleAddArtifact({ id: paper.id, type: 'arxiv', url: paper.url, title: paper.title });
        setArxivQuery('');
        setArxivResults([]);
        setIsDropdownOpen(false);
    }
    
    const handleAddPaperUrl = (url: string) => {
        if (!url) return;
        // Mock fetching title
        const mockTitle = `Paper from ${new URL(url).hostname}`;
        handleAddArtifact({ id: Date.now().toString(), type: 'paper', url, title: mockTitle });
    };

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-semibold">Add Research papers</h3>
            <p className="text-sm text-text-secondary">Link papers from any repository or search ArXiv directly.</p>
            
            {/* General Paper URL */}
            <div>
                 <label className="block text-sm font-medium mb-1">Paper URL</label>
                <input 
                    type="url" 
                    placeholder="https://researchgate.net/..." 
                    onBlur={(e) => {
                        if (e.target.value) {
                             handleAddPaperUrl(e.target.value);
                             e.target.value = ''; // Clear after adding
                        }
                    }}
                    className="w-full h-11 px-3 border rounded-lg bg-transparent" 
                />
            </div>
            
            {/* ArXiv Search */}
            <div className="relative" ref={searchRef}>
                 <label className="block text-sm font-medium mb-1">Search ArXiv by Title</label>
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    <input 
                        type="search" 
                        placeholder="e.g., Attention Is All You Need" 
                        value={arxivQuery}
                        onChange={e => setArxivQuery(e.target.value)}
                        className="w-full h-11 pl-10 pr-3 border rounded-lg bg-transparent" 
                    />
                </div>
                {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-background-light dark:bg-background-dark-light border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <ul>
                            {arxivResults.map(paper => (
                                <li key={paper.id} onClick={() => handleSelectArxiv(paper)} className="p-3 hover:bg-hf-gray-100 dark:hover:bg-hf-gray-800 cursor-pointer">
                                    <p className="font-semibold text-sm">{paper.title}</p>
                                    <p className="text-xs text-text-secondary">{paper.id}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            
            {/* Added Artifacts List */}
            {data.artifacts.length > 0 && (
                <div className="space-y-2 pt-4">
                     <h4 className="text-sm font-semibold">Added Papers ({data.artifacts.length})</h4>
                    {data.artifacts.map((a: any) => (
                        <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-hf-gray-100 dark:bg-hf-gray-800">
                           <FileTextIcon className="w-5 h-5 flex-shrink-0"/>
                            <p className="text-sm truncate mx-2 flex-1" title={a.title}>{a.title}</p>
                            <button onClick={() => setData({...data, artifacts: data.artifacts.filter((art:any) => art.id !== a.id)})} className="p-1 rounded-full">
                                <TrashIcon className="w-4 h-4 text-status-danger"/>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
};

const Step4_Review = ({ data }: { data: any }) => (
    <div>
        <h3 className="text-xl font-semibold mb-4">Review & Create</h3>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            <div className="p-4 rounded-lg bg-hf-gray-100 dark:bg-hf-gray-800">
                <p className="font-bold">{data.title}</p>
                <p className="text-sm">{data.description}</p>
                <p className="text-sm mt-2"><b>Domain:</b> {data.domain} | <b>License:</b> {data.license}</p>
            </div>
            <div>
                <h4 className="font-semibold">HF Outputs ({data.outputs.length})</h4>
                {data.outputs.map((o: HuggingFaceOutput) => <p key={o.id} className="text-sm">- {o.name}</p>)}
            </div>
            <div>
                <h4 className="font-semibold">Artifacts ({data.artifacts.length})</h4>
                {data.artifacts.map((a: any) => <p key={a.id} className="text-sm">- {a.title}</p>)}
            </div>
        </div>
    </div>
);

export const CreateProjectWizardModal = ({ initialOutputs, onClose }: { initialOutputs: HuggingFaceOutput[], onClose: () => void }) => {
    const { handleCreateProjectFromHuggingFace } = useAppContext();
    const [currentStep, setCurrentStep] = React.useState(1);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    
    const [wizardData, setWizardData] = React.useState({
        outputs: initialOutputs,
        title: initialOutputs[0]?.name.replace(/-/g, ' ').replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()) || '',
        description: `An open-source project based on the ${initialOutputs[0]?.name} ${initialOutputs[0]?.type}.`,
        domain: ResearchDomain.Robotics,
        license: 'MIT',
        artifacts: [],
        reproducibilityChecks: [],
    });

    const handleNext = () => setCurrentStep(s => Math.min(s + 1, 4));
    const handleBack = () => setCurrentStep(s => Math.max(s - 1, 1));

    const handleCreate = async () => {
        setIsSubmitting(true);
        // Simulate async operation
        await new Promise(res => setTimeout(res, 2000));
        handleCreateProjectFromHuggingFace(wizardData.outputs);
        setIsSubmitting(false);
        onClose();
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1: return <Step1_SelectedOutputs outputs={wizardData.outputs} onRemove={(id) => setWizardData({...wizardData, outputs: wizardData.outputs.filter(o => o.id !== id)})} />;
            case 2: return <Step2_ProjectBasics data={wizardData} setData={setWizardData} />;
            case 3: return <Step3_AddResearchPapers data={wizardData} setData={setWizardData} />;
            case 4: return <Step4_Review data={wizardData} />;
            default: return null;
        }
    };
    
    return (
        <Modal onClose={onClose} title="">
            <div className="p-4 border-b border-border dark:border-border-dark">
                <WizardStepper currentStep={currentStep} />
            </div>
            <div className="flex p-6">
                <div className="flex-1 pr-6 border-r border-border dark:border-border-dark">
                    {renderStepContent()}
                </div>
                <HelpRail step={currentStep} />
            </div>
            <div className="flex justify-between items-center p-4 border-t border-border dark:border-border-dark bg-hf-gray-50 dark:bg-hf-gray-900/50 rounded-b-2xl">
                <div>
                    {currentStep > 1 && <button onClick={handleBack} className="flex items-center space-x-2 font-semibold py-2 px-4 rounded-lg"><ChevronLeftIcon className="w-4 h-4"/><span>Back</span></button>}
                </div>
                 <div className="flex items-center space-x-2">
                    {currentStep === 4 ? (
                        <>
                         <button onClick={onClose} className="font-semibold py-2 px-4 rounded-lg">Save Draft</button>
                         <button onClick={handleCreate} disabled={isSubmitting} className="bg-primary text-white font-semibold py-2 px-4 rounded-lg flex items-center">{isSubmitting && <SpinnerIcon className="w-4 h-4 mr-2 animate-spin"/>}Create Project</button>
                        </>
                    ) : (
                        <button onClick={handleNext} disabled={!wizardData.title} className="flex items-center space-x-2 font-semibold py-2 px-4 rounded-lg bg-primary text-white disabled:bg-hf-gray-400"><span>Next</span><ChevronRightIcon className="w-4 h-4"/></button>
                    )}
                </div>
            </div>
        </Modal>
    );
};