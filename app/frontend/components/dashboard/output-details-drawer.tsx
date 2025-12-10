

"use client";

import React from 'react';
import { LibraryOutput, Project } from '../../lib/types';
import { CloseIcon, FileTextIcon, CheckCircleIcon, ClockIcon, FlagIcon, LinkIcon } from '../ui/icons';

const DetailRow = ({ label, value }: { label: string, value: string | undefined }) => {
    if (!value) return null;
    return (
        <div>
            <p className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary">{label}</p>
            <p className="text-text dark:text-text-dark">{value}</p>
        </div>
    );
};

const TimelineStep = ({ icon: Icon, color, title, date, isLast = false }: { icon: React.FC<any>, color: string, title: string, date: string, isLast?: boolean }) => (
    <div className="relative flex items-start">
        {!isLast && <div className="absolute top-5 left-[11px] h-full w-0.5 bg-border dark:bg-border-dark" />}
        <div className={`relative flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${color}/20`}>
            <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <div className="ml-4">
            <h4 className="font-semibold text-sm text-text dark:text-text-dark">{title}</h4>
            <p className="text-xs text-text-secondary dark:text-text-dark-secondary">{date}</p>
        </div>
    </div>
);

export const OutputDetailsDrawer = ({ output, project, onClose, onSelectProject }: { output: LibraryOutput, project: Project, onClose: () => void, onSelectProject: (p: Project) => void }) => {
    
    const getTimeline = () => {
        const steps = [{ icon: FileTextIcon, color: 'text-primary', title: 'Submitted', date: new Date(output.timestamp).toLocaleDateString() }];
        
        const reviewDate = new Date(output.timestamp);
        reviewDate.setDate(reviewDate.getDate() + 3);

        if (output.reproducibility === 'Pending' || output.reproducibility === 'Verified' || output.reproducibility === 'Failed') {
            steps.push({ icon: ClockIcon, color: 'text-status-warning', title: 'In Review', date: reviewDate.toLocaleDateString() });
        }

        const finalDate = new Date(reviewDate);
        finalDate.setDate(finalDate.getDate() + 4);

        if (output.reproducibility === 'Verified') {
            steps.push({ icon: CheckCircleIcon, color: 'text-status-success', title: 'Verified', date: finalDate.toLocaleDateString() });
        } else if (output.reproducibility === 'Failed') {
            steps.push({ icon: FlagIcon, color: 'text-status-danger', title: 'Failed', date: finalDate.toLocaleDateString() });
        }
        return steps;
    };
    
    const timelineSteps = getTimeline();

    const latestReproducibility = project.reproducibilities.length > 0 
        ? project.reproducibilities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
        : null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-background-light dark:bg-background-dark-light rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-modal-scale-in border border-border dark:border-border-dark" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border dark:border-border-dark flex-shrink-0">
                    <h2 className="text-lg font-semibold text-text dark:text-text-dark truncate pr-4">{output.description}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-cairn-gray-200 dark:hover:bg-cairn-gray-700">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                
                {/* Content */}
                <div className="p-6 overflow-y-auto flex-grow space-y-6">
                    <div>
                        <h3 className="font-semibold mb-2">Metadata</h3>
                        <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-cairn-gray-100 dark:bg-cairn-gray-800/50">
                            <DetailRow label="Type" value={output.libraryType} />
                            <DetailRow label="Project" value={output.projectName} />
                            <DetailRow label="Author" value={output.projectOwnerName} />
                            <DetailRow label="Timestamp" value={new Date(output.timestamp).toLocaleString()} />
                            <DetailRow label="Version" value="1.0.0" />
                            <DetailRow label="License" value="MIT" />
                        </div>
                    </div>
                     <div>
                        <h3 className="font-semibold mb-3">Evaluation Summary</h3>
                        <div className="space-y-4">
                            {timelineSteps.map((step, index) => (
                                <TimelineStep key={index} {...step} isLast={index === timelineSteps.length - 1} />
                            ))}
                        </div>
                        {latestReproducibility && (
                            <div className="mt-4 p-3 rounded-lg bg-status-success-bg dark:bg-status-success-bg-dark text-status-success text-sm">
                                <p className="font-semibold">Reproducibility Summary:</p>
                                <p>{latestReproducibility.notes}</p>
                            </div>
                        )}
                     </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border dark:border-border-dark flex-shrink-0">
                     <button
                        onClick={() => {
                            onSelectProject(project);
                            onClose();
                        }}
                        className="w-full flex items-center justify-center space-x-2 bg-primary text-primary-text font-semibold py-2.5 rounded-lg hover:bg-primary-hover transition-colors"
                    >
                         <LinkIcon className="w-5 h-5" />
                         <span>View Full Project</span>
                    </button>
                </div>
            </div>
        </div>
    );
};