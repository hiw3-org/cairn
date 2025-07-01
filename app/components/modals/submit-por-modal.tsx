
"use client";

import { useState } from "react";
import { Project, Output, OutputType } from "../../lib/types";
import { Modal } from "../ui/modal";
import { UploadCloudIcon, TrashIcon, LinkIcon, CheckCircleIcon, FileTextIcon, VideoIcon } from "../ui/icons";

type PorEvidenceType = 'Document' | 'Video' | 'Output Log' | 'Others';

export const SubmitPorModal = ({ project, onClose, onSubmit }: { project: Project; onClose: () => void; onSubmit: (data: { notes: string; evidence: Output[] }) => void; }) => {
    const [stagedEvidence, setStagedEvidence] = useState<Output[]>([]);
    const [notes, setNotes] = useState('');
    
    // Form state
    const [type, setType] = useState<PorEvidenceType>('Document');
    const [description, setDescription] = useState('');
    const [url, setUrl] = useState('');
    const [fileName, setFileName] = useState('');

    const resetForm = () => {
        setType('Document');
        setDescription('');
        setUrl('');
        setFileName('');
    };

    const handleAddRecord = (e: React.FormEvent) => {
        e.preventDefault();
        if (!description) return;

        const newEvidence: Output = {
            id: `evidence-staged-${Date.now()}`,
            type,
            timestamp: new Date().toISOString().split('T')[0],
            description,
            data: {},
        };

        switch (type) {
            case 'Document':
            case 'Output Log':
                newEvidence.data = { url, fileName };
                break;
            case 'Video':
                 newEvidence.data = { url };
                break;
            case 'Others':
                newEvidence.data = { url, fileName, otherText: description };
                break;
        }
        setStagedEvidence(prev => [...prev, newEvidence]);
        resetForm();
    };

    const handleDeleteRecord = (evidenceId: string) => {
        setStagedEvidence(prev => prev.filter(o => o.id !== evidenceId));
    };
    
    const handleFinalSubmit = () => {
        if (stagedEvidence.length > 0 && notes) {
            onSubmit({ notes, evidence: stagedEvidence });
        }
    };

    const renderDataFields = () => {
        switch (type) {
            case 'Document': return (<>
                <input type="url" placeholder="URL to document (e.g., Google Doc, arXiv)" value={url} onChange={e => setUrl(e.target.value)} className="w-full p-2 border border-cairn-gray-300 dark:border-cairn-gray-600 rounded-md bg-transparent font-mono text-sm" />
                <input type="file" onChange={(e) => setFileName(e.target.files?.[0]?.name || '')} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cairn-blue-50 file:text-cairn-blue-700 hover:file:bg-cairn-blue-100 dark:file:bg-cairn-blue-900/50 dark:file:text-cairn-blue-300 dark:hover:file:bg-cairn-blue-900" />
            </>);
             case 'Video': return (<>
                <input type="url" placeholder="YouTube, Vimeo, etc. URL" value={url} onChange={e => setUrl(e.target.value)} className="w-full p-2 border border-cairn-gray-300 dark:border-cairn-gray-600 rounded-md bg-transparent font-mono text-sm" />
            </>);
            case 'Output Log': return (<>
                <input type="url" placeholder="URL to log file (e.g., Pastebin, Gist)" value={url} onChange={e => setUrl(e.target.value)} className="w-full p-2 border border-cairn-gray-300 dark:border-cairn-gray-600 rounded-md bg-transparent font-mono text-sm" />
                <input type="file" onChange={(e) => setFileName(e.target.files?.[0]?.name || '')} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cairn-blue-50 file:text-cairn-blue-700 hover:file:bg-cairn-blue-100 dark:file:bg-cairn-blue-900/50 dark:file:text-cairn-blue-300 dark:hover:file:bg-cairn-blue-900" />
            </>);
            case 'Others':
                return (
                     <>
                        <input type="url" placeholder="URL (optional)" value={url} onChange={e => setUrl(e.target.value)} className="w-full p-2 border border-cairn-gray-300 dark:border-cairn-gray-600 rounded-md bg-transparent font-mono text-sm" />
                        <input type="file" onChange={(e) => setFileName(e.target.files?.[0]?.name || '')} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cairn-blue-50 file:text-cairn-blue-700 hover:file:bg-cairn-blue-100 dark:file:bg-cairn-blue-900/50 dark:file:text-cairn-blue-300 dark:hover:file:bg-cairn-blue-900" />
                    </>
                );
            default: return null;
        }
    };
    
    const evidenceIcons: Record<PorEvidenceType, React.FC<any>> = {
        "Document": FileTextIcon, 
        "Video": VideoIcon,
        "Output Log": FileTextIcon, 
        "Others": LinkIcon 
    };
    
    const modalFooter = (
         <div className="flex justify-end">
            <button onClick={handleFinalSubmit} disabled={stagedEvidence.length === 0 || !notes} className="flex items-center space-x-2 bg-green-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:bg-cairn-gray-400 disabled:cursor-not-allowed">
                <CheckCircleIcon className="w-5 h-5" />
                <span>Submit {stagedEvidence.length} Piece(s) of Evidence</span>
            </button>
        </div>
    );

    return (
        <Modal onClose={onClose} title={`Submit for Reproducibility`} footer={modalFooter}>
            <div className="space-y-6">
                 <div>
                    <label className="block text-sm font-medium text-cairn-gray-700 dark:text-cairn-gray-300 mb-1">Notes & Methodology</label>
                    <textarea placeholder="Describe your reproduction process, any deviations, and the outcome." value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2 border border-cairn-gray-300 dark:border-cairn-gray-600 rounded-md bg-transparent h-28" required></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <form onSubmit={handleAddRecord} className="space-y-4">
                        <h4 className="font-semibold">Add Evidence</h4>
                        <div>
                            <label className="block text-sm font-medium text-cairn-gray-700 dark:text-cairn-gray-300 mb-1">Evidence Type</label>
                            <select value={type} onChange={(e) => setType(e.target.value as PorEvidenceType)} className="w-full p-2 border border-cairn-gray-300 dark:border-cairn-gray-600 rounded-md bg-transparent dark:text-white">
                                <option value="Document">Document</option>
                                <option value="Video">Video</option>
                                <option value="Output Log">Output Log</option>
                                <option value="Others">Others</option>
                            </select>
                        </div>
                         
                        <div>
                            <label className="block text-sm font-medium text-cairn-gray-700 dark:text-cairn-gray-300 mb-1">Description</label>
                            <textarea placeholder="e.g., 'Log files from my simulation run'" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border border-cairn-gray-300 dark:border-cairn-gray-600 rounded-md bg-transparent h-24" required={type !== 'Others'}></textarea>
                        </div>
                        
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-cairn-gray-700 dark:text-cairn-gray-300">Data Details</label>
                            {renderDataFields()}
                        </div>
                        <button type="submit" className="w-full bg-cairn-blue-100 dark:bg-cairn-blue-900/50 text-cairn-blue-700 dark:text-cairn-blue-300 font-semibold py-2 px-4 rounded-lg hover:bg-cairn-blue-200 dark:hover:bg-cairn-blue-900 transition-colors">
                            Add Evidence to Submission
                        </button>
                    </form>

                    <div className="space-y-3">
                        <h4 className="font-semibold">Staged Evidence ({stagedEvidence.length})</h4>
                        <div className="bg-cairn-gray-100 dark:bg-cairn-gray-800 p-3 rounded-lg space-y-2 min-h-[200px] max-h-96 overflow-y-auto">
                            {stagedEvidence.length === 0 ? (
                                 <p className="text-sm text-cairn-gray-500 text-center py-4">No evidence staged yet.</p>
                            ): (
                                stagedEvidence.map(output => {
                                    const Icon = evidenceIcons[output.type as PorEvidenceType];
                                    return (
                                    <div key={output.id} className="flex items-start justify-between bg-white dark:bg-cairn-gray-700 p-2 rounded-md">
                                        <div className="flex items-start space-x-2">
                                            <Icon className="w-5 h-5 mt-0.5 text-cairn-blue-500 flex-shrink-0" />
                                            <p className="text-sm flex-grow">{output.description}</p>
                                        </div>
                                        <button onClick={() => handleDeleteRecord(output.id)} className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                                            <TrashIcon className="w-4 h-4 text-red-500"/>
                                        </button>
                                    </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};